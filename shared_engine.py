"""Bridge between Ciudad Viva LAN networking and the single Offline JS simulation.

One Node.js process owns a room. Every gameplay action, day transition, report
and save goes through offline.js. Python retains only transport and presence.
"""
from __future__ import annotations

from collections import deque
import json
import os
from pathlib import Path
from queue import Queue, Empty
import shutil
import subprocess
import sys
import threading


class SharedEngineError(RuntimeError):
    pass


class SharedOfflineEngine:
    def __init__(self, root: Path, node_command: str | None = None):
        root=Path(root)
        packaged=Path(getattr(sys, "_MEIPASS",root))
        runtime=packaged/("node.exe" if os.name=="nt" else "node")
        node=(node_command or os.environ.get("CIUDAD_VIVA_NODE")
              or (str(runtime) if runtime.is_file() else None)
              or shutil.which("node"))
        if not node:
            raise SharedEngineError(
                "No se encontró el motor de JavaScript de Ciudad Viva. "
                "Instalá Node.js 22 o usá el ejecutable Windows actualizado.")
        self.lock=threading.RLock()
        self.responses=Queue()
        self.errors=deque(maxlen=20)
        self.sequence=0
        self.closed=False
        try:
            self.process=subprocess.Popen(
                [node,str(root/"online_engine.mjs")],cwd=root,stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,stderr=subprocess.PIPE,encoding="utf-8",
                errors="replace",bufsize=1)
        except OSError as error:
            raise SharedEngineError(f"No se pudo iniciar el motor Offline: {error}") from error
        threading.Thread(target=self._read_stdout,name="CiudadVivaSharedEngineOut",daemon=True).start()
        threading.Thread(target=self._read_stderr,name="CiudadVivaSharedEngineErr",daemon=True).start()

    def _read_stdout(self):
        try:
            for line in self.process.stdout:
                try:self.responses.put(json.loads(line))
                except ValueError:self.errors.append("Respuesta inválida del motor JavaScript.")
        finally:
            self.responses.put(None)

    def _read_stderr(self):
        for line in self.process.stderr:
            self.errors.append(line.strip())

    def call(self,op,**data):
        with self.lock:
            if self.closed or self.process.poll() is not None:
                raise SharedEngineError("El motor compartido se cerró: "+"; ".join(self.errors))
            self.sequence+=1
            try:
                self.process.stdin.write(json.dumps({"id":self.sequence,"op":op,**data},ensure_ascii=False)+"\n")
                self.process.stdin.flush()
                answer=self.responses.get(timeout=30)
            except (OSError,ValueError,Empty) as error:
                self.close()
                raise SharedEngineError("El motor compartido no respondió a tiempo.") from error
            if not answer or answer.get("id")!=self.sequence:
                self.close()
                raise SharedEngineError("Se perdió la conexión con el motor de simulación.")
            if not answer.get("ok"):
                raise SharedEngineError(str(answer.get("error") or "Acción inválida."))
            return answer

    def initialize(self,snapshot=None):
        return self.call("init",snapshot=snapshot)["view"]

    def load(self,snapshot):
        return self.call("load",snapshot=snapshot)["view"]

    def advance(self):
        return self.call("state")["view"]

    def action(self,command):
        return self.call("action",action=command)["view"]

    def snapshot(self):
        return self.call("snapshot")["snapshot"]

    def close(self):
        if self.closed:return
        self.closed=True
        if self.process.poll() is None:
            self.process.terminate()
            try:self.process.wait(timeout=2)
            except subprocess.TimeoutExpired:self.process.kill()
        for stream in (self.process.stdin,self.process.stdout,self.process.stderr):
            try:stream.close()
            except (OSError,ValueError):pass
