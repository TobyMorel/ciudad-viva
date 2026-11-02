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
        workflow = (ROOT / ".github/workflows/validation.yml").read_text(encoding="utf-8")
        self.assertIn(f"ALFA {version}", html)
        self.assertIn(f'name="ciudad-viva-version" content="{version}"', html)
        self.assertIn(f"const version='{version}'", html, "Versión de recuperación de caché")
        self.assertIn(f"game.js?v={version}", html)
        self.assertIn(f"world3d.js?v={version}", game)
        self.assertIn(f"ciudad-viva-alfa-{version}", workflow)
        self.assertIn('release_notes.json', game, "Cambios debe consultar el historial vigente")
        self.assertIn('releaseData?.currentVersion', game, "El banner debe usar la versión vigente")
        self.assertIn('id="releaseNotes"', html, "Historial visible en Cambios")
        recovery = (ROOT / 'tests/test_offline_boot_recovery.mjs').read_text(encoding='utf-8')
        self.assertIn('cv-refresh=' + version.replace('.', r'\.'), recovery,
                      'La prueba de recuperación debe usar la Alfa publicada')

    def test_code_changes_require_a_new_release_in_pr(self):
        """CI: un PR que altera el juego debe incrementar su versión y sus notas."""
        base = os.environ.get("GITHUB_BASE_REF")
        if not base:
            return
        try:
            previous = subprocess.check_output(
                ["git", "show", f"origin/{base}:release_notes.json"], cwd=ROOT, text=True)
            changed = subprocess.check_output(
                ["git", "diff", "--name-only", f"origin/{base}", "HEAD"], cwd=ROOT, text=True).splitlines()
        except (OSError, subprocess.CalledProcessError):
            self.fail("No se pudo comparar el historial con la base del PR; configurar checkout fetch-depth: 0.")
        if not any(path in {"server.py", "offline.js", "game.js", "world3d.js", "index.html"}
                   or (path.endswith((".js", ".py", ".css")) and not path.startswith("tests/"))
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
