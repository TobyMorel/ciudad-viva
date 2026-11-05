"""La puerta pública no expone APIs administrativas ni identidades ajenas."""
import http.client
import io
import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from tempfile import TemporaryDirectory
from unittest.mock import patch
from urllib.error import URLError

from public_servers import PublicDirectory, PublicProxy, PublicRooms


class PublicHostingSecurity(unittest.TestCase):
    def test_directory_unconfigured(self):
        with TemporaryDirectory() as folder:
            directory = PublicDirectory(folder)
            self.assertFalse(directory.enabled)
            with patch("public_servers.urlopen", side_effect=URLError("sin Internet")):
                self.assertEqual(directory.browse()["rooms"], [])

    def test_directory_fetches_public_config_without_installing_new_exe(self):
        with TemporaryDirectory() as folder:
            directory = PublicDirectory(folder)
            config = {"supabaseUrl": "https://ciudadviva-demo.supabase.co",
                      "supabaseAnonKey": "sb_publishable_test_example"}
            with patch("public_servers.urlopen", return_value=io.BytesIO(json.dumps(config).encode())) as get:
                self.assertTrue(directory.ensure_config())
                self.assertEqual(directory.url, config["supabaseUrl"])
                self.assertEqual(directory.key, config["supabaseAnonKey"])
                self.assertTrue(directory.enabled)
                self.assertEqual(get.call_count, 1)
                self.assertTrue(directory.ensure_config())
                self.assertEqual(get.call_count, 1)

    def test_directory_rejects_untrusted_remote_configuration(self):
        for config in ([], {"supabaseUrl": "http://evil.example", "supabaseAnonKey": "abc"},
                       {"supabaseUrl": "https://evil.example", "supabaseAnonKey": "abc"},
                       {"supabaseUrl": "https://ciudadviva.supabase.co", "supabaseAnonKey": ""}):
            with self.subTest(config=config), TemporaryDirectory() as folder:
                directory = PublicDirectory(folder)
                with patch("public_servers.urlopen", return_value=io.BytesIO(json.dumps(config).encode())):
                    self.assertFalse(directory.ensure_config())
                    self.assertFalse(directory.enabled)

    def test_edge_publish_requires_random_secret_without_user_accounts(self):
        with TemporaryDirectory() as folder:
            directory = PublicDirectory(folder)
            directory.enabled = True
            room = {
                "id": "4a8cf9a4-22d6-4f1f-a0b6-c8acb23a8d99",
                "token": "ab" * 32, "city": "Ciudad del Puerto",
                "host_name": "Anfitrión", "players": 2,
                "url": "https://ciudad-viva-demo.trycloudflare.com",
            }
            with patch.object(directory, "_request", return_value={"ok": True}) as request:
                directory.publish(room)
                args = request.call_args.args
                self.assertEqual(args[:2], ("/functions/v1/public-rooms", "POST"))
                self.assertEqual(args[2]["action"], "publish")
                self.assertEqual(args[2]["token"], room["token"])
                self.assertNotIn("owner_id", args[2])
                directory.unpublish(room["id"], room["token"])
                self.assertEqual(request.call_args.args[2]["action"], "unpublish")

    def test_public_browse_filters_untrusted_hosts(self):
        with TemporaryDirectory() as folder:
            directory = PublicDirectory(folder)
            directory.enabled = True
            safe = {"id": "a", "city": "Puerto",
                    "host_name": "Pepe", "join_url": "https://good.trycloudflare.com",
                    "players": 1, "max_players": 13}
            evil = {**safe, "id": "b", "join_url": "https://phishing.example"}
            with patch.object(directory, "_request", return_value=[safe, evil]):
                rooms = directory.browse()["rooms"]
            self.assertEqual([x["id"] for x in rooms], ["a"])

    def test_player_limit_is_thirteen(self):
        class Controller:
            game_port = 1
            url = "https://example.trycloudflare.com"
            session_lock = threading.RLock()
            sessions = {}

            @staticmethod
            def room_info():
                return {"roomOpen": True, "players": 13}

        handler = type("FullRoomPublicProxy", (PublicProxy,), {"controller": Controller()})
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        server.daemon_threads = True
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            conn = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=3)
            conn.request("POST", "/api/room/join", body='{"name":"Visitante"}')
            response = conn.getresponse()
            self.assertEqual(response.status, 429)
            self.assertIn("13 jugadores", json.loads(response.read())["error"])
            conn.close()
        finally:
            server.shutdown()
            server.server_close()
            worker.join(timeout=3)

    def test_sparse_directory_heartbeat_interval(self):
        # La aplicación anuncia cada 5 min; consultar las salas es a demanda.
        from inspect import getsource
        from public_servers import PublicRooms
        self.assertIn("self.finished.wait(300)", getsource(PublicRooms._heartbeat))


    def test_webrtc_host_can_start_when_cloudflare_is_unavailable(self):
        with TemporaryDirectory() as folder:
            with patch("public_servers.shutil.which", return_value=None):
                bridge = PublicRooms(folder, 1, lambda: {
                    "roomOpen": True, "roomName": "Prueba WebRTC", "players": 1})
                status = bridge.start("Anfitrión")
                try:
                    self.assertTrue(status["roomId"])
                    self.assertIsNone(status["url"])
                    self.assertFalse(status["cloudflareReady"])
                    key = json.dumps({"kty": "EC", "crv": "P-256",
                                      "x": "A" * 43, "y": "B" * 43})
                    with patch.object(bridge.directory, "publish", return_value={"ok": True}) as publish:
                        enabled = bridge.activate_rtc(key)
                        self.assertTrue(enabled["rtcReady"])
                        self.assertTrue(enabled["active"])
                        self.assertEqual(publish.call_args.args[0]["rtc_public_key"], key)
                finally:
                    bridge.stop()

    def test_public_browse_includes_webrtc_only_rooms(self):
        with TemporaryDirectory() as folder:
            directory = PublicDirectory(folder)
            directory.enabled = True
            row = {"id": "rtc", "city": "Puerto",
                   "host_name": "Anfitrión", "join_url": "", "players": 1,
                   "max_players": 13, "rtc_enabled": True,
                   "rtc_public_key": json.dumps({"kty":"EC","crv":"P-256",
                                                    "x":"A"*43,"y":"B"*43})}
            with patch.object(directory, "_request", return_value=[row]):
                result = directory.browse()
            self.assertEqual(len(result["rooms"]), 1)
            self.assertTrue(result["rooms"][0]["rtcEnabled"])
            self.assertFalse(result["rooms"][0]["url"])

    def test_public_proxy_rejects_admin_and_unauthenticated_calls(self):
        class Controller:
            game_port = 1  # Jamás debe conectar: estos accesos se rechazan antes.
            url = "https://example.trycloudflare.com"
            session_lock = threading.RLock()
            sessions = {}

            @staticmethod
            def room_info():
                return {"roomOpen": True, "players": 1}

        handler = type("TestPublicProxy", (PublicProxy,), {"controller": Controller()})
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        server.daemon_threads = True
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            cases = [
                ("GET", "/api/saves", None, 403),
                ("GET", "/%61pi/saves", None, 403),
                ("GET", "/api/%73aves", None, 403),
                ("GET", "/%2561pi/saves", None, 403),
                ("GET", "/api%2Fsaves", None, 403),
                ("GET", "/server.py", None, 403),
                ("GET", "/public_directory.json", None, 403),
                ("GET", "/%252e%252e/api/saves", None, 403),
                ("GET", "/api/public/status", None, 403),
                ("POST", "/api/room/create", "{}", 403),
                ("POST", "/api/save", "{}", 403),
                ("POST", "/api/load", "{}", 403),
                ("POST", "/api/public/publish", "{}", 403),
                ("GET", "/api/state", None, 401),
                ("GET", "/api/cursors/stream?player=host", None, 401),
                ("POST", "/api/action", '{"action":"new"}', 401),
            ]
            for method, path, payload, expected in cases:
                with self.subTest(path=path):
                    conn = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=3)
                    conn.request(method, path, body=payload)
                    response = conn.getresponse()
                    self.assertEqual(response.status, expected)
                    self.assertIn("error", json.loads(response.read()))
                    conn.close()
            conn = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=3)
            conn.request("GET", "/api/info")
            response = conn.getresponse()
            self.assertEqual(response.status, 200)
            self.assertEqual(json.loads(response.read())["ips"], [])
            conn.close()
        finally:
            server.shutdown()
            server.server_close()
            worker.join(timeout=3)


if __name__ == "__main__":
    unittest.main()
