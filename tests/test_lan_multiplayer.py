import concurrent.futures
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
                    {"action": "speed", "value": index + 1}, 10
                )
                for index, player_id in enumerate(player_ids)
            ]
            for action in actions:
                action.result(timeout=10)
            snapshots = [future.result(timeout=12) for future in watchers]
            self.assertLess(time.monotonic() - started_at, 5.0)

        for snapshot in snapshots:
            self.assertEqual(snapshot["stateRevision"], target)
            self.assertIn(snapshot["speed"], (1, 2, 3, 4))
            self.assertEqual(snapshot["online"], 4)


if __name__ == "__main__":
    unittest.main()
