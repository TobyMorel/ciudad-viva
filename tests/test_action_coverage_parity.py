"""Online and Offline use the same authoritative simulation entry point."""
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]


class OnlineOfflineActionCoverage(unittest.TestCase):
    def test_online_engine_imports_the_offline_simulator(self):
        bridge=(ROOT/"online_engine.mjs").read_text(encoding="utf-8")
        server=(ROOT/"server.py").read_text(encoding="utf-8")
        self.assertIn("import {createOfflineAdapter} from './offline.js'",bridge)
        self.assertIn("await adapter.request('/api/action',message.action||{})",bridge)
        self.assertIn("await adapter.request('/api/state')",bridge)
        self.assertIn("if path==\"/api/action\" and SHARED_ENGINE is not None:",server)
        self.assertIn("view=SHARED_ENGINE.action(data)",server)
        self.assertIn("SHARED_ENGINE.advance()",server)
        self.assertIn('view["simulationEngine"]="offline.js"',server)

    def test_windows_package_includes_javascript_runtime(self):
        spec=(ROOT/"desktop_app.spec").read_text(encoding="utf-8")
        workflow=(ROOT/".github/workflows/desktop.yml").read_text(encoding="utf-8")
        self.assertIn('"online_engine.mjs","package.json"',spec)
        self.assertIn('binaries=binaries',spec)
        self.assertIn("node-version: '22'",workflow)
        self.assertIn("runtime/node.exe",workflow)


if __name__=="__main__":
    unittest.main()
