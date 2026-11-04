import concurrent.futures
import gzip
import json
import tempfile
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen

import server


class LANMultiplayerTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.old = {
            "state": server.state,
            "room_open": server.ROOM_OPEN,
            "revision": server.STATE_REVISION,
            "room_code": server.ROOM_CODE,
            "save": server.SAVE,
            "save_root": server.SAVE_ROOT,
            "rooms": server.DISCOVERED_ROOMS,
            "cursors": server.PLAYER_CURSORS,
            "cursor_revision": server.CURSOR_REVISION,
            "cache_revision": server._PUBLIC_STATE_CACHE_REVISION,
            "cache_view": server._PUBLIC_STATE_CACHE_VIEW,
        }
        server.SAVE_ROOT = Path(self.tempdir.name)
        server.SAVE = Path(self.tempdir.name) / "ciudad_guardada.json"
        server.state = server.initial_state()
        server.ROOM_OPEN = False
        server.STATE_REVISION = 0
        server.ROOM_CODE = "TEST42"
        server.DISCOVERED_ROOMS = {}
        server.PLAYER_CURSORS = {}
        server.CURSOR_REVISION = 0
        server._PUBLIC_STATE_CACHE_REVISION = -1
        server._PUBLIC_STATE_CACHE_VIEW = None
        self.http = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        self.http.daemon_threads = True
        self.base = f"http://127.0.0.1:{self.http.server_port}"
        self.thread = threading.Thread(target=self.http.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.http.shutdown()
        self.http.server_close()
        self.thread.join(timeout=2)
        server.state = self.old["state"]
        server.ROOM_OPEN = self.old["room_open"]
        server.STATE_REVISION = self.old["revision"]
        server.ROOM_CODE = self.old["room_code"]
        server.SAVE = self.old["save"]
        server.SAVE_ROOT = self.old["save_root"]
        server.DISCOVERED_ROOMS = self.old["rooms"]
        server.PLAYER_CURSORS = self.old["cursors"]
        server.CURSOR_REVISION = self.old["cursor_revision"]
        server._PUBLIC_STATE_CACHE_REVISION = self.old["cache_revision"]
        server._PUBLIC_STATE_CACHE_VIEW = self.old["cache_view"]
        self.tempdir.cleanup()

    def request(self, path, player_id, body=None, timeout=8):
        headers = {"X-Player-Id": player_id}
        data = None
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = Request(self.base + path, data=data, headers=headers)
        with urlopen(req, timeout=timeout) as response:
            raw = response.read()
            if response.headers.get_content_type() == "application/json":
                return json.loads(raw)
            return raw

    def test_four_players_receive_concurrent_actions_and_static_assets_load(self):
        created = self.request("/api/room/create", "host", {})
        self.assertEqual(created["roomCode"], "TEST42")
        player_ids = ["host", "player-2", "player-3", "player-4"]
        for player_id in player_ids[1:]:
            self.request("/api/room/join", player_id, {"code": "TEST42"})

        for path in ("/", "/game.js", "/world3d.js", "/essential_services.js",
                     "/vendor/three.module.js", "/assets/dock-icons/01_avisos.png"):
            with self.subTest(path=path):
                content = self.request(path, "host")
                self.assertTrue(content, f"{path} did not load")

        baseline = self.request("/api/state", "host")["stateRevision"]
        target = baseline + len(player_ids)
        plots = [(6, 9), (11, 5), (13, 13), (19, 15)]
        kinds = ["home", "shop", "factory", "home"]
        ready = threading.Barrier(len(player_ids) + 1)

        def watch(player_id):
            ready.wait(timeout=3)
            revision = baseline
            latest = None
            deadline = time.monotonic() + 10
            while revision < target and time.monotonic() < deadline:
                latest = self.request(
                    f"/api/sync?revision={revision}", player_id, timeout=4
                )
                revision = latest["stateRevision"]
            self.assertIsNotNone(latest, f"{player_id} received no update")
            self.assertGreaterEqual(revision, target, f"{player_id} missed updates")
            return latest

        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            watchers = [pool.submit(watch, player_id) for player_id in player_ids]
            ready.wait(timeout=3)
            started_at = time.monotonic()
            actions = [
                pool.submit(
                    self.request, "/api/action", player_id,
                    {"action": "zone", "kind": kinds[index], "cells": [list(plots[index])]}, 10
                )
                for index, player_id in enumerate(player_ids)
            ]
            for action in actions:
                action.result(timeout=10)
            snapshots = [future.result(timeout=12) for future in watchers]
            self.assertLess(time.monotonic() - started_at, 5.0)

        for snapshot in snapshots:
            self.assertEqual(snapshot["stateRevision"], target)
            self.assertEqual(snapshot["online"], 4)
            for (x, y), kind in zip(plots, kinds):
                self.assertTrue(
                    any(z["x"] == x and z["y"] == y and z["kind"] == kind
                        for z in snapshot["zones"]),
                    f"{kind} at {(x, y)} was not shared with every player",
                )

    def test_cursor_remains_visible_and_reports_player_view_when_leaving_map(self):
        self.request("/api/room/create", "host", {"name": "Ana"})
        self.request("/api/room/join", "guest", {"code": "TEST42", "name": "Bruno"})

        self.request("/api/cursors", "host", {"x": 12.5, "y": 8.25})
        initial = self.request("/api/cursors", "guest")["cursors"]
        self.assertEqual(len(initial), 1)
        self.assertEqual((initial[0]["x"], initial[0]["y"]), (12.5, 8.25))
        self.assertEqual(initial[0]["view"], "")

        # UI navigation does not send a new map coordinate.
        self.request("/api/cursors", "host", {"view": "Movilidad"})
        viewing = self.request("/api/cursors", "guest")["cursors"][0]
        self.assertEqual(viewing["name"], "Ana")
        self.assertEqual((viewing["x"], viewing["y"]), (12.5, 8.25))
        self.assertEqual(viewing["view"], "Movilidad")

        self.request("/api/cursors", "host", {"view": "Tráfico"})
        self.assertEqual(self.request("/api/cursors", "guest")["cursors"][0]["view"], "Tráfico")

        # Reentering the 3D map clears the activity message.
        self.request("/api/cursors", "host", {"x": 13.0, "y": 9.0, "view": ""})
        returned = self.request("/api/cursors", "guest")["cursors"][0]
        self.assertEqual((returned["x"], returned["y"]), (13.0, 9.0))
        self.assertEqual(returned["view"], "")

    def test_cursor_updates_bypass_simulation_lock(self):
        """Simulated slow city operations must not delay cursor presence."""
        self.request("/api/room/create", "host", {"name": "Ana"})
        self.request("/api/room/join", "guest", {"code": "TEST42", "name": "Bruno"})
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            with server.LOCK:
                sender = pool.submit(self.request, "/api/cursors", "host",
                                     {"x": 5.75, "y": 7.25, "view": ""}, 3)
                self.assertTrue(sender.result(timeout=1)["ok"])
                reader = pool.submit(self.request, "/api/cursors", "guest", None, 3)
                cursors = reader.result(timeout=1)["cursors"]
                self.assertEqual((cursors[0]["x"], cursors[0]["y"]), (5.75, 7.25))

    def test_server_sent_cursor_updates_arrive_without_polling(self):
        self.request("/api/room/create", "host", {"name": "Ana"})
        self.request("/api/room/join", "guest", {"code": "TEST42", "name": "Bruno"})
        request = Request(self.base + "/api/cursors/stream?player=guest")
        with urlopen(request, timeout=4) as response:
            self.assertEqual(response.headers.get_content_type(), "text/event-stream")
            self.assertEqual(response.readline().strip(), b"retry: 500")
            self.assertEqual(response.readline().strip(), b"")
            first = response.readline()
            self.assertTrue(first.startswith(b"data: "))
            self.assertEqual(json.loads(first[6:])["cursors"], [])
            self.assertEqual(response.readline().strip(), b"")
            start = time.monotonic()
            self.request("/api/cursors", "host", {"x": 16.8, "y": 8.4,
                                                   "view": "Movilidad"})
            event = response.readline()
            self.assertLess(time.monotonic() - start, 2.0)
            self.assertTrue(event.startswith(b"data: "))
            cursors = json.loads(event[6:])["cursors"]
            self.assertEqual(len(cursors), 1)
            self.assertEqual(cursors[0]["view"], "Movilidad")
            self.assertEqual((cursors[0]["x"], cursors[0]["y"]), (16.8, 8.4))

    def test_ui_activity_without_initial_map_position_is_reported(self):
        self.request("/api/room/create", "host", {"name": "Ana"})
        self.request("/api/room/join", "guest", {"code": "TEST42", "name": "Bruno"})
        self.request("/api/cursors", "host", {"view": "Tráfico"})
        cursor = self.request("/api/cursors", "guest")["cursors"][0]
        self.assertIsNone(cursor["x"])
        self.assertIsNone(cursor["y"])
        self.assertEqual(cursor["view"], "Tráfico")

    def test_large_state_is_compressed_for_browser_clients(self):
        self.request("/api/room/create", "host", {})
        plain = Request(self.base + "/api/state", headers={"X-Player-Id": "host"})
        zipped = Request(self.base + "/api/state", headers={
            "X-Player-Id": "host", "Accept-Encoding": "gzip",
        })
        with urlopen(plain, timeout=8) as response:
            plain_data = response.read()
        with urlopen(zipped, timeout=8) as response:
            self.assertEqual(response.headers["Content-Encoding"], "gzip")
            zipped_data = response.read()
        self.assertEqual(json.loads(gzip.decompress(zipped_data)), json.loads(plain_data))
        self.assertLess(len(zipped_data), len(plain_data) / 3)


if __name__ == "__main__":
    unittest.main()
