"""Contrato de publicación: versión del juego y pantalla Cambios sincronizadas."""
import json
import os
import re
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ReleaseVersionTests(unittest.TestCase):
    def test_current_version_is_visible_and_downloadable(self):
        notes = json.loads((ROOT / "release_notes.json").read_text(encoding="utf-8"))
        version = notes["currentVersion"]
        releases = notes["versions"]
        self.assertRegex(version, r"^0\.\d+$")
        self.assertGreaterEqual(len(releases), 2)
        self.assertEqual(releases[0]["version"], version)
        versions = [tuple(map(int, r["version"].split("."))) for r in releases]
        self.assertEqual(versions, sorted(set(versions), reverse=True), "Versiones duplicadas o desordenadas")
        for item in releases[:2]:
            self.assertTrue(item.get("changes"), "Cada entrega debe describirse en Cambios")
            self.assertTrue(item.get("date"))
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        game = (ROOT / "game.js").read_text(encoding="utf-8")
        workflow = (ROOT / ".github/workflows-paused-2026-12-01/validation.yml").read_text(encoding="utf-8")
        self.assertIn(f"ALFA {version}", html)
        self.assertIn(f'name="ciudad-viva-version" content="{version}"', html)
        self.assertIn(f"const version='{version}'", html, "Versión de recuperación de caché")
        self.assertIn(f"game.js?v={version}", html)
        self.assertIn(f"world3d.js?v={version}", game)
        self.assertIn(f"ciudad-viva-alfa-{version}", workflow)
        self.assertTrue((ROOT / "scripts/build_windows_host.ps1").is_file(),
                        "El empaquetado Windows debe seguir disponible durante la pausa de Actions")
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
        self.assertEqual(package["version"], f"{version}.0")
        self.assertEqual(lock["version"], f"{version}.0")
        self.assertEqual(lock["packages"][""]["version"], f"{version}.0")
        self.assertIn(f"main-menu.css?v={version}", html)
        self.assertIn(f"cursor_motion.js?v={version}", game)
        self.assertIn(f"cursor_presence.js?v={version}", game)
        self.assertIn('release_notes.json', game, "Cambios debe consultar el historial vigente")
        self.assertIn('releaseData?.currentVersion', game, "El banner debe usar la versión vigente")
        self.assertIn('id="releaseNotes"', html, "Historial visible en Cambios")
        recovery = (ROOT / 'tests/test_offline_boot_recovery.mjs').read_text(encoding='utf-8')
        self.assertIn('releaseNotes.currentVersion', recovery,
                      'La prueba de recuperacion debe usar la version publicada')
        self.assertIn("url.searchParams.get('cv-refresh')===currentVersion", recovery,
                      'La recuperacion debe volver a la version publicada')

    def test_code_changes_require_a_new_release_in_pr(self):
        """CI: cada cambio jugable en PR o push a main incrementa la versión."""
        base = os.environ.get("GITHUB_BASE_REF")
        ref = f"origin/{base}" if base else ""
        if not ref and os.environ.get("GITHUB_EVENT_NAME") == "push":
            previous_sha = os.environ.get("GITHUB_EVENT_BEFORE", "")
            if len(previous_sha) == 40 and previous_sha != "0" * 40:
                ref = previous_sha
        if not ref:
            return
        try:
            previous = subprocess.check_output(
                ["git", "show", f"{ref}:release_notes.json"], cwd=ROOT, text=True)
            changed = subprocess.check_output(
                ["git", "diff", "--name-only", ref, "HEAD"], cwd=ROOT, text=True).splitlines()
        except (OSError, subprocess.CalledProcessError):
            self.fail("No se pudo comparar el historial con la base del PR; configurar checkout fetch-depth: 0.")
        if not any(path in {"server.py", "offline.js", "game.js", "world3d.js", "index.html"}
                   or (path.endswith((".js", ".py", ".css"))
                       and not path.startswith(("tests/", "scripts/")))
                   for path in changed):
            return
        current = json.loads((ROOT / "release_notes.json").read_text(encoding="utf-8"))
        older = json.loads(previous)
        self.assertNotEqual(current["currentVersion"], older["currentVersion"],
                            "Toda entrega con cambios jugables debe incrementar la versión en Cambios")
        self.assertIn("release_notes.json", changed)
        self.assertEqual(current["versions"][0]["version"], current["currentVersion"])


if __name__ == "__main__":
    unittest.main()
