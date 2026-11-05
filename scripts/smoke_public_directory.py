"""Prueba de extremo a extremo del directorio público (sin instalar paquetes).

Crea un anuncio EFÍMERO de CI, comprueba políticas de lectura, prueba
rechazo de un token falso y retira el anuncio en un bloque finally.
El anfitrión real, la simulación y el túnel se prueban por separado.
"""
import json
import secrets
import sys
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
cfg = json.loads((ROOT / "public_directory.json").read_text(encoding="utf-8"))
base = str(cfg["supabaseUrl"]).rstrip("/")
key = str(cfg["supabaseAnonKey"])
endpoint = base + "/functions/v1/public-rooms"
room_id = str(uuid.uuid4())
secret = secrets.token_hex(32)
public_headers = {"apikey": key, "Content-Type": "application/json"}
if not key.startswith("sb_publishable_"):
    public_headers["Authorization"] = "Bearer " + key


def call(url, method="GET", payload=None):
    body = json.dumps(payload).encode() if payload is not None else None
    request = Request(url, headers=public_headers, data=body, method=method)
    try:
        with urlopen(request, timeout=25) as response:
            raw = response.read(100_000)
            return response.status, json.loads(raw) if raw else None
    except HTTPError as error:
        raw = error.read(1000)
        try:
            message = json.loads(raw)
        except (ValueError, UnicodeDecodeError):
            message = {"error": raw.decode(errors="replace")}
        return error.code, message


def list_room():
    q = "?select=id,city,host_name,join_url,players,max_players&id=eq." + quote(room_id)
    return call(base + "/rest/v1/public_rooms" + q)


def publish(token):
    return call(endpoint, "POST", {
        "action": "publish", "id": room_id, "token": token,
        "city": "CI Ciudad Viva", "host_name": "Prueba automatizada",
        "join_url": "https://ciudad-viva-ci.trycloudflare.com", "players": 1,
    })


def unpublish(token):
    return call(endpoint, "POST", {
        "action": "unpublish", "id": room_id, "token": token,
    })


def main():
    created = False
    try:
        status, answer = publish(secret)
        assert status == 200 and answer.get("ok"), f"Publicación rechazada: {status} {answer}"
        created = True
        status, rooms = list_room()
        assert status == 200 and isinstance(rooms, list) and len(rooms) == 1, (
            f"Anuncio no visible vía cliente público: {status} {rooms}")
        assert rooms[0]["id"] == room_id
        assert "owner_secret_hash" not in rooms[0], "El token de autenticación no debe ser público"
        status, answer = publish(secrets.token_hex(32))
        assert status == 403, f"Se pudo suplantar al anfitrión: {status} {answer}"
        status, answer = unpublish(secrets.token_hex(32))
        assert status == 403, f"Se pudo borrar un anuncio ajeno: {status} {answer}"
        status, answer = unpublish(secret)
        assert status == 200 and answer.get("ok"), f"No se retiró la sala: {status} {answer}"
        created = False
        status, rooms = list_room()
        assert status == 200 and rooms == [], f"La sala sigue publicada: {status} {rooms}"
        print("Directorio público Supabase: creación, RLS, propiedad y baja correctas.")
    finally:
        if created:
            unpublish(secret)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("ERROR directorio público:", exc, file=sys.stderr)
        raise
