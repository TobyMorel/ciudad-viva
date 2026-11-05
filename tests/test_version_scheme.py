"""Las Alfas 0.N son identificadores de texto con N sin límite de cifras."""
import json
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
VALID=re.compile(r"0\.[1-9][0-9]*\Z")

class VersionSequence(unittest.TestCase):
    def test_release_uses_unbounded_zero_prefix_sequence(self):
        data=json.loads((ROOT/"release_notes.json").read_text(encoding="utf-8"))
        versions=[row["version"] for row in data["versions"]]
        self.assertTrue(versions)
        self.assertEqual(data["currentVersion"],versions[0])
        self.assertTrue(all(isinstance(v,str) and VALID.fullmatch(v) for v in versions),
                        "Las etiquetas deben ser textos 0.N, nunca 1.x ni flotantes")
        suffix=[int(v.split(".")[1]) for v in versions]
        self.assertEqual(suffix,sorted(set(suffix),reverse=True),
                         "No repetir versiones ni ordenar como números decimales")
        index=(ROOT/"index.html").read_text(encoding="utf-8")
        self.assertIn(f"ALFA {versions[0]}",index)
        self.assertIn(f"HISTORIAL · ALFA 0.1–{versions[0]}",index)
        workflow=(ROOT/".github/workflows-paused-2026-12-01/validation.yml").read_text(encoding="utf-8")
        self.assertIn(f"name: ciudad-viva-alfa-{versions[0]}\n",workflow)
        self.assertIn(f"name: ciudad-viva-alfa-{versions[0]}-responsive\n",workflow)

    def test_actions_workflows_are_paused_outside_runner_directory(self):
        active=list((ROOT/".github/workflows").glob("*.yml"))+list((ROOT/".github/workflows").glob("*.yaml"))
        self.assertEqual(active,[])
        note=(ROOT/".github/workflows-paused-2026-12-01/README.md").read_text(encoding="utf-8")
        self.assertIn("1 de diciembre de 2026",note)

    def test_next_version_increments_integer_suffix_not_decimal(self):
        def next_version(v):
            self.assertRegex(v,VALID)
            return "0."+str(int(v[2:])+1)
        self.assertEqual(next_version("0.99"),"0.100")
        self.assertEqual(next_version("0.100"),"0.101")
        self.assertEqual(next_version("0.999"),"0.1000")

if __name__=="__main__":
    unittest.main()
