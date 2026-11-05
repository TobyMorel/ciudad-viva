"""La puerta pública no expone APIs administrativas ni identidades ajenas."""
import http.client
import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from tempfile import TemporaryDirectory

from public_servers import PublicDirectory, PublicProxy


class PublicHostingSecurity(unittest.TestCase):
    def test_directory_unconfigured(self):
        with TemporaryDirectory() as folder:
            directory = PublicDirectory(folder)
            self.assertFalse(directory.enabled)
            self.assertEqual(directory.browse()["rooms"], [])

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
