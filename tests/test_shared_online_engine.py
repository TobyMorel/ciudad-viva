"""The LAN server runs the real Offline JavaScript engine, not a Python copy."""
import copy
import shutil
import unittest
from pathlib import Path

import server
from shared_engine import SharedOfflineEngine

ROOT=Path(__file__).resolve().parents[1]


@unittest.skipUnless(shutil.which("node"),"Node.js is required for shared Offline engine tests.")
class SharedOfflineEngineTests(unittest.TestCase):
    def setUp(self):
        self.engine=SharedOfflineEngine(ROOT)
        self.initial=self.engine.initialize()
    def tearDown(self):
        self.engine.close()

    def test_new_room_uses_offline_seed_and_manual_instant_building(self):
        self.assertEqual(self.initial["money"],175000)
        self.assertEqual(self.initial["roads"],[[4,10]])
        self.assertEqual(self.initial["buildings"],[])
        road=self.engine.action({"action":"placeRoad","x":5,"y":10})
        self.assertIn([5,10],road["roads"])
        self.assertEqual(road["money"],173800)
        hospital=self.engine.action({
            "action":"place","kind":"civic","serviceModel":"generalHospital","x":5,"y":9})
        self.assertEqual(hospital["money"],148300)
        self.assertEqual(hospital["projects"],[])
        self.assertEqual(len(hospital["buildings"]),1)
        self.assertEqual(hospital["buildings"][0]["serviceModel"],"generalHospital")
        self.assertEqual(hospital["buildings"][0]["hospitalWard"]["beds"],36)
        self.assertEqual(hospital["buildings"][0]["status"],"habilitado")

    def test_shared_actions_match_the_same_offline_validation_and_costs(self):
        self.engine.action({"action":"placeRoad","x":5,"y":10})
        with self.assertRaisesRegex(Exception,"calle|parcela|ocupad|tramo|red vial"):
            self.engine.action({"action":"placeRoad","x":5,"y":10})
        after=self.engine.advance()
        self.assertEqual(after["roads"],[[4,10],[5,10]])
        self.assertEqual(after["money"],173800)
        self.assertEqual(len(after["projects"]),0)

    def test_snapshot_reloads_without_losing_city_or_resetting_money(self):
        self.engine.action({"action":"placeRoad","x":5,"y":10})
        city=self.engine.action({"action":"place","kind":"civic","serviceModel":"generalHospital","x":5,"y":9})
        saved=self.engine.snapshot()
        self.assertNotIn("onlinePlayers",saved)
        self.engine.action({"action":"new"})
        recovered=self.engine.load(saved)
        self.assertEqual(recovered["money"],city["money"])
        # Loading may add catalog/heritage metadata, but must retain the asset.
        self.assertEqual(len(recovered["buildings"]),len(city["buildings"]))
        self.assertEqual(
            [(b["x"],b["y"],b["kind"],b.get("serviceModel")) for b in recovered["buildings"]],
            [(b["x"],b["y"],b["kind"],b.get("serviceModel")) for b in city["buildings"]])
        self.assertEqual(recovered["roads"],city["roads"])
        self.assertEqual(recovered["projects"],[])

    def test_existing_python_save_imported_without_deleting_its_buildings(self):
        legacy=server.new_settlement_state()
        legacy["roads"].append([5,10])
        legacy["buildings"].append({
            "x":5,"y":9,"kind":"civic","name":"Centro de pruebas",
            "serviceModel":"clinic","jobSlots":12,"status":"habilitado"})
        legacy["money"]=123456
        view=self.engine.load(copy.deepcopy(legacy))
        self.assertEqual(view["money"],123456)
        self.assertTrue(any(b["name"]=="Centro de pruebas" for b in view["buildings"]))
        self.assertIn([5,10],view["roads"])


if __name__=="__main__":
    unittest.main()
