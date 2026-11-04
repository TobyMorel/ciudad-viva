"""Check that Online routes every Offline action to a handler.

Dispatch coverage is only a structural guard; behavior is tested separately.
"""
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class OnlineOfflineActionCoverage(unittest.TestCase):
    def test_every_offline_action_has_online_dispatch(self):
        offline=(ROOT/"offline.js").read_text(encoding="utf-8")
        server=(ROOT/"server.py").read_text(encoding="utf-8")
        offline_actions=set(re.findall(r"""\ba\s*===?\s*['"]([^'"]+)['"]""",offline))
        for row in re.finditer(r"""\[\s*['"][^'"]+['"](?:\s*,\s*['"][^'"]+['"])*\s*\]\.includes\(a\)""",offline):
            offline_actions.update(re.findall(r"""['"]([^'"]+)['"]""",row.group(0)))
        online_actions=set(re.findall(r"""\baction\s*==\s*['"]([^'"]+)['"]""",server))
        for row in re.finditer(r"""\baction\s+in\s*\(([^)]+)\)""",server):
            online_actions.update(re.findall(r"""['"]([^'"]+)['"]""",row.group(1)))
        self.assertGreaterEqual(len(offline_actions),55,"Auditor Offline no reconoce acciones.")
        self.assertGreaterEqual(len(online_actions),55,"Auditor Online no reconoce acciones.")
        self.assertEqual(offline_actions-online_actions,set(),
            f"Acciones de Offline sin despachador Online: {sorted(offline_actions-online_actions)}")

if __name__=="__main__":
    unittest.main()
