"""Ciudad Viva: hosting público experimental con el motor en la PC del jugador.

Un túnel saliente apunta a un proxy HTTP local de privilegios mínimos.
Supabase guarda SOLO el anuncio; ninguna partida ni acción sale hacia la base.
"""
from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json
import os
import queue
import re
import secrets
import shutil
import subprocess
import sys
import threading
import time
import uuid


def _utc():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class PublicDirectory:
    """Directorio Supabase con configuración pública actualizable y RLS.

    La URL y la publishable/anon key son deliberadamente públicas.
    En un .exe congelado se consultan desde GitHub Pages cuando falta
    la configuración embebida. No requiere actualizar el ejecutable.
    """
    CONFIG_URL = "https://tobymorel.github.io/ciudad-viva/public_directory.json"
    def __init__(self, root):
        config_file = Path(root) / "public_directory.json"
        try:
            cfg = json.loads(config_file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            cfg = {}
        self.url = (os.environ.get("CIUDAD_VIVA_SUPABASE_URL") or cfg.get("supabaseUrl") or "").strip().rstrip("/")
        self.key = (os.environ.get("CIUDAD_VIVA_SUPABASE_ANON_KEY") or cfg.get("supabaseAnonKey") or "").strip()
        parsed = urlsplit(self.url)
        self.enabled = bool(self.url and self.key and parsed.scheme == "https"
                            and (parsed.hostname or "").endswith(".supabase.co"))
        self._checked_remote = float('-inf')  # La primera consulta remota debe ser inmediata.
        self._config_lock = threading.Lock()

    def ensure_config(self):
        """Descarga sólo una configuración pública HTTPS; nunca claves privadas."""
        if self.enabled:
            return True
        with self._config_lock:
            if self.enabled:
                return True
            now = time.monotonic()
            if now - self._checked_remote < 90:
                return False
            self._checked_remote = now
            try:
                req = Request(self.CONFIG_URL, headers={"Accept": "application/json", "User-Agent": "CiudadViva/0.288"})
                with urlopen(req, timeout=4) as response:
                    config = json.loads(response.read(8192))
            except (OSError, TimeoutError, ValueError, TypeError):
                return False
            if not isinstance(config, dict):
                return False
            remote_url = str(config.get("supabaseUrl") or "").strip().rstrip("/")
            remote_key = str(config.get("supabaseAnonKey") or "").strip()
            parsed = urlsplit(remote_url)
            if not re.fullmatch(r"https://[a-z0-9-]+\.supabase\.co", remote_url, flags=re.I) or not remote_key:
                return False
            self.url = remote_url
            self.key = remote_key
            self.enabled = True
        return True

    def _request(self, path, method="GET", payload=None):
        if not self.ensure_config():
            raise RuntimeError("El directorio público todavía no tiene un proyecto Supabase configurado.")
        headers = {"apikey": self.key, "Accept": "application/json"}
        if not self.key.startswith("sb_publishable_"):
            headers["Authorization"] = "Bearer " + self.key
        if payload is not None:
            headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        request = Request(self.url + path, data=data, headers=headers, method=method)
        try:
            with urlopen(request, timeout=9) as reply:
                body = reply.read(250000)
                return json.loads(body) if body else None
        except HTTPError as error:
            detail = error.read(500).decode("utf-8", errors="replace")
            raise RuntimeError("Supabase rechazó la operación (HTTP " + str(error.code) + "): " + detail[:180]) from error
        except (URLError, TimeoutError) as error:
            raise RuntimeError("No se pudo acceder al directorio Supabase.") from error

    def publish(self, room):
        # La Edge Function verifica el token aleatorio de esta sala. Nunca
        # guardamos credenciales privadas de Supabase en una PC anfitriona.
        response = self._request("/functions/v1/public-rooms", "POST", {
            "action": "publish", "id": room["id"], "token": room["token"],
            "city": str(room["city"])[:64], "host_name": str(room["host_name"])[:32],
            "join_url": room.get("url") or "",
            "rtc_enabled": bool(room.get("rtc_public_key")),
            "rtc_public_key": room.get("rtc_public_key") or None,
            "players": max(1, min(13, room["players"])),
        })
        if not isinstance(response, dict) or not response.get("ok"):
            raise RuntimeError("Supabase no confirmó la publicación de esta sala.")
        return response

    def unpublish(self, room_id, token):
        if self.enabled:
            self._request("/functions/v1/public-rooms", "POST", {
                "action": "unpublish", "id": room_id, "token": token,
            })

    def browse(self):
        if not self.ensure_config():
            return {"configured": False, "rooms": [],
                    "message": "Falta configurar Supabase para mostrar las salas de todos los jugadores."}
        cutoff = quote((datetime.now(timezone.utc) - timedelta(minutes=12)).isoformat(timespec="seconds"), safe="")
        rows = self._request("/rest/v1/public_rooms?select=id,city,host_name,join_url,players,max_players,last_seen,rtc_enabled,rtc_public_key"
                             "&last_seen=gte." + cutoff + "&order=last_seen.desc&limit=60") or []
        rooms = []
        for row in rows:
            address = str(row.get("join_url") or "")
            parsed = urlsplit(address)
            tunnel_ok = bool(re.fullmatch(r"https://[a-z0-9-]+\.trycloudflare\.com/?", address, flags=re.I))
            rtc_key = row.get("rtc_public_key") if row.get("rtc_enabled") else None
            if not tunnel_ok and not rtc_key:
                continue
            rooms.append({
                "id": row.get("id"), "name": str(row.get("city") or "Ciudad Viva")[:64],
                "host": str(row.get("host_name") or "Anfitrión")[:32],
                "players": row.get("players", 1), "capacity": row.get("max_players", 13),
                "url": address if tunnel_ok else "",
                "rtcEnabled": bool(rtc_key), "rtcPublicKey": rtc_key,
            })
        return {"configured": True, "rooms": rooms}


class PublicProxy(BaseHTTPRequestHandler):
    """Sólo deja pasar recursos públicos y acciones de participantes con cookie."""
    protocol_version = "HTTP/1.1"

    def log_message(self, *_args):
        pass

    def _json(self, status, obj):
        payload = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def _identity(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except Exception:
            return None
        morsel = cookie.get("cv_public_session")
        if not morsel:
            return None
        with self.controller.session_lock:
            entry = self.controller.sessions.get(morsel.value)
            if not entry or entry[1] < time.monotonic():
                return None
            self.controller.sessions[morsel.value] = (entry[0], time.monotonic() + 86400)
            return entry[0]

    def do_GET(self):
        raw_path = urlsplit(self.path).path
        # No aceptar rutas codificadas: el upstream también decodifica las URLs.
        # Sin esta restricción /%2561pi/saves saltaría el filtro del proxy.
        if "%" in raw_path or "\\" in raw_path:
            self._json(403, {"error": "Ruta pública inválida."})
            return
        path = raw_path
        static_root = {"index.html", "offline_seed.json", "release_notes.json"}
        static_ext = {".css", ".js", ".mjs", ".svg"}
        static_assets = {".css",".js",".mjs",".svg",".png",".jpg",".jpeg",".webp",
                         ".gif",".ico",".woff",".woff2",".ttf",".otf",".mp3",
                         ".ogg",".wav",".json",".bin",".glb",".gltf",".wasm",".webmanifest"}
        if path == "/api/info":
            self._json(200, {"roomOpen": self.controller.room_info().get("roomOpen", False),
                             "publicUrl": self.controller.url, "ips": [],
                             "rtcRoomId": getattr(self.controller, "room_id", None),
                             "rtcPublicKey": getattr(self.controller, "rtc_public_key", None)})
            return
        if path == "/api/public/config":
            directory = self.controller.directory
            if not directory.ensure_config():
                self._json(503, {"error": "No se pudo leer la configuración pública de Supabase."})
            else:
                # Sólo clave publicable, nunca token de sala ni credencial de servicio.
                self._json(200, {"supabaseUrl": directory.url,
                                 "supabaseAnonKey": directory.key})
            return
        if path not in ("/api/public/rooms","/api/state","/api/sync",
                        "/api/cursors","/api/cursors/stream"):
            relative = path.lstrip("/")
            pieces = relative.split("/")
            safe = (not relative or relative in static_root or
                    (len(pieces) == 1 and "." in relative and
                     "." + relative.rsplit(".", 1)[-1].lower() in static_ext) or
                    (len(pieces) > 1 and pieces[0] in ("assets","vendor") and
                     pieces[-1].rpartition(".")[-1].lower() in {x.lstrip(".") for x in static_assets}))
            safe = path == "/" or (safe and all(piece not in ("", ".", "..") for piece in pieces))
            if not safe:
                self._json(403, {"error": "Recurso reservado al anfitrión."})
                return
        identity = self._identity()
        if path in ("/api/state", "/api/sync", "/api/cursors", "/api/cursors/stream") and not identity:
            self._json(401, {"error": "Primero tenés que entrar a la sala pública."})
            return
        if path == "/api/cursors/stream":
            self._json(501, {"error": "El túnel público no admite SSE. La interfaz usa sondeo HTTP de cursores."})
            return
        self._forward("GET", identity=identity)

    def do_POST(self):
        raw_path = urlsplit(self.path).path
        if "%" in raw_path or "\\" in raw_path:
            self._json(403, {"error": "Ruta pública inválida."})
            return
        path = raw_path
        if path not in ("/api/room/join", "/api/action", "/api/chat", "/api/cursors"):
            self._json(403, {"error": "Operación reservada al anfitrión."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = -1
        if not 0 <= length <= 131072:
            self._json(413, {"error": "Solicitud demasiado grande."})
            return
        identity = self._identity()
        if path == "/api/room/join":
            if self.controller.room_info().get("players", 0) >= 13:
                self._json(429, {"error": "La sala pública alcanzó los 13 jugadores."})
                return
            # El jugador no puede elegir una identidad existente ni hacerse pasar por el anfitrión.
            identity = "public-" + secrets.token_hex(12)
        elif not identity:
            self._json(401, {"error": "Primero tenés que entrar a la sala pública."})
            return
        data = self.rfile.read(length)
        if path == "/api/action":
            try:
                action = json.loads(data).get("action")
            except (ValueError, AttributeError):
                action = None
            if action in ("new",):
                self._json(403, {"error": "Sólo el anfitrión puede reiniciar la ciudad."})
                return
        self._forward("POST", data=data, identity=identity, new_session=path == "/api/room/join")

    def _forward(self, method, data=None, identity=None, streamed=False, new_session=False):
        upstream = HTTPConnection("127.0.0.1", self.controller.game_port, timeout=30)
        headers = {"X-Player-Id": identity or "visitante-publico", "Accept-Encoding": "identity",
                   "Content-Type": "application/json"}
        route = self.path
        if streamed:
            # El ID de la URL SSE jamás proviene de los parámetros enviados por el usuario.
            route = "/api/cursors/stream?player=" + quote(identity, safe="")
        try:
            upstream.request(method, route, body=data, headers=headers)
            response = upstream.getresponse()
            if streamed and response.status == 200:
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream; charset=utf-8")
                self.send_header("Cache-Control", "no-cache")
                self.send_header("Connection", "close")
                self.end_headers()
                self.close_connection = True
                while True:
                    chunk = response.readline()
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    self.wfile.flush()
                return
            payload = response.read(32000000)
            if len(payload) >= 32000000:
                self._json(502, {"error": "Respuesta demasiado grande."})
                return
            if new_session and response.status == 200:
                # Sincronizar la identidad de la UI con la identidad segura del proxy.
                try:
                    joined = json.loads(payload)
                    if isinstance(joined, dict):
                        joined["publicPlayerId"] = identity
                        payload = json.dumps(joined, ensure_ascii=False).encode("utf-8")
                except (ValueError, UnicodeDecodeError):
                    pass
            self.send_response(response.status)
            self.send_header("Content-Type", response.getheader("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            if new_session and response.status == 200:
                token = secrets.token_urlsafe(32)
                with self.controller.session_lock:
                    now = time.monotonic()
                    if len(self.controller.sessions) >= 256:
                        self.controller.sessions = {k: v for k, v in self.controller.sessions.items() if v[1] > now}
                    self.controller.sessions[token] = (identity, now + 86400)
                self.send_header("Set-Cookie", "cv_public_session=" + token
                                 + "; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax")
            self.end_headers()
            self.wfile.write(payload)
        except (OSError, TimeoutError, BrokenPipeError, ConnectionError) as error:
            try:
                self._json(502, {"error": "La PC anfitriona dejó de responder."})
            except (OSError, BrokenPipeError):
                pass
        finally:
            upstream.close()


class PublicRooms:
    def __init__(self, root, game_port, room_info):
        self.root = Path(root)
        self.game_port = game_port
        self.room_info = room_info
        self.directory = PublicDirectory(root)
        self.lock = threading.RLock()
        self.session_lock = threading.RLock()
        self.sessions = {}
        self.proxy = None
        self.process = None
        self.url = None
        self.room_id = None
        self.room_secret = None
        self.rtc_public_key = None
        self.host_name = "Anfitrión"
        self.last_error = None
        self.finished = threading.Event()

    def status(self):
        tunnel = bool(self.url and self.process and self.process.poll() is None)
        rtc = bool(self.room_id and self.rtc_public_key and self.room_info().get("roomOpen"))
        return {"active": bool(tunnel or rtc), "url": self.url if tunnel else None,
                "roomId": self.room_id, "rtcReady": rtc, "cloudflareReady": tunnel,
                "listed": bool(self.room_id and self.directory.enabled and
                               not self.last_error and (tunnel or rtc)),
                "configured": self.directory.enabled, "error": self.last_error}

    def _room_payload(self):
        info = self.room_info()
        return {"id": self.room_id, "token": self.room_secret, "city": info.get("roomName") or "Ciudad Viva",
                "host_name": self.host_name, "players": info.get("players", 1),
                "url": self.url or "", "rtc_public_key": self.rtc_public_key}

    def activate_rtc(self, public_key):
        """Sólo el anfitrión local puede registrar su clave pública ECDSA."""
        with self.lock:
            if not self.room_id or not self.room_info().get("roomOpen"):
                raise RuntimeError("Primero creá una sala pública en este equipo.")
            if not isinstance(public_key, str) or not 130 <= len(public_key) <= 600:
                raise RuntimeError("Clave pública WebRTC inválida.")
            try:
                data = json.loads(public_key)
            except ValueError as error:
                raise RuntimeError("Clave pública WebRTC inválida.") from error
            if (not isinstance(data, dict) or data.get("kty") != "EC" or
                    data.get("crv") != "P-256" or
                    not all(isinstance(data.get(k), str) and
                            re.fullmatch(r"[-_a-zA-Z0-9]{43}", data[k]) for k in ("x", "y"))):
                raise RuntimeError("Clave pública WebRTC inválida.")
            self.rtc_public_key = public_key
            self.directory.publish(self._room_payload())
            self.last_error = None
            return self.status()

    def start(self, host_name="Anfitrión"):
        with self.lock:
            if self.room_id and self.room_info().get("roomOpen"):
                return self.status()
            if not self.room_info().get("roomOpen"):
                raise RuntimeError("Primero creá una sala en esta computadora.")
            resource = self.root / "runtime" / "cloudflared.exe"
            bundled = self.root / "cloudflared.exe"
            binary = resource if resource.is_file() else bundled if bundled.is_file() else shutil.which("cloudflared")
            self.finished.clear()
            self.sessions.clear()
            self.room_id = str(uuid.uuid4())
            self.room_secret = secrets.token_hex(32)
            self.rtc_public_key = None
            self.host_name = " ".join(str(host_name or "Anfitrión").split())[:32]
            self.last_error = None
            self.url = None
            # El túnel es opcional: una falla de Cloudflare NO impide WebRTC.
            if binary:
                handler = type("CiudadVivaPublicProxy", (PublicProxy,), {"controller": self})
                self.proxy = ThreadingHTTPServer(("127.0.0.1", 0), handler)
                self.proxy.daemon_threads = True
                threading.Thread(target=self.proxy.serve_forever, daemon=True, name="CiudadVivaPublicProxy").start()
                address = "http://127.0.0.1:" + str(self.proxy.server_port)
                flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
                try:
                    process = subprocess.Popen(
                        [str(binary), "tunnel", "--no-autoupdate", "--url", address],
                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                        text=True, encoding="utf-8", errors="replace", creationflags=flags)
                    self.process = process
                    incoming = queue.Queue()
                    def scan():
                        for line in process.stdout:
                            match = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", line, flags=re.I)
                            if match: incoming.put(match.group(0))
                    threading.Thread(target=scan, daemon=True, name="CiudadVivaTunnelLog").start()
                    deadline = time.monotonic() + 14
                    while time.monotonic() < deadline:
                        try:
                            self.url = incoming.get(timeout=0.5)
                            break
                        except queue.Empty:
                            if process.poll() is not None: break
                except (OSError, RuntimeError) as error:
                    self.last_error = "Cloudflare no está disponible; intentando WebRTC."
                    self.process = None
            else:
                self.last_error = "Este ejecutable no trae Cloudflare; se intentará conectar por WebRTC."
            if not self.url:
                if self.process:
                    try:
                        self.process.terminate()
                        self.process.wait(timeout=2)
                    except (OSError, subprocess.TimeoutExpired):
                        try: self.process.kill()
                        except OSError: pass
                    self.process = None
                self.last_error = "No se pudo abrir Cloudflare; el anfitrión probará WebRTC."
            if self.url and self.directory.ensure_config():
                try:
                    self.directory.publish(self._room_payload())
                    self.last_error = None
                except RuntimeError as error:
                    self.last_error = str(error)
            threading.Thread(target=self._heartbeat, daemon=True, name="CiudadVivaPublicDirectory").start()
            return self.status()

    def _heartbeat(self):
        while not self.finished.wait(300):
            if not self.room_info().get("roomOpen"):
                self.stop()
                break
            with self.lock:
                if self.process and self.process.poll() is not None:
                    self.process = None
                    self.url = None
                if not self.room_id or not (self.url or self.rtc_public_key):
                    continue
                if self.directory.ensure_config():
                    try:
                        self.directory.publish(self._room_payload())
                        self.last_error = None
                    except RuntimeError as error:
                        self.last_error = str(error)

    def stop(self):
        with self.lock:
            self.finished.set()
            if self.directory.enabled and self.room_id and self.room_secret:
                try:
                    self.directory.unpublish(self.room_id, self.room_secret)
                except RuntimeError:
                    pass  # La caducidad de 12 minutos oculta anuncios huérfanos.
            if self.process:
                try:
                    self.process.terminate()
                    self.process.wait(timeout=2)
                except (OSError, subprocess.TimeoutExpired):
                    self.process.kill()
                self.process = None
            if self.proxy:
                self.proxy.shutdown()
                self.proxy.server_close()
                self.proxy = None
            self.url = None
            self.room_id = None
            self.room_secret = None
            self.rtc_public_key = None
            self.sessions.clear()
