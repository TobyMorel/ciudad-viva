"""El puente cruza el río mediante contrato; solo abre al superar la obra."""
import unittest
from unittest.mock import patch
import server


class BridgeCrossingTests(unittest.TestCase):
    def setUp(self):
        self.previous=server.state
        server.state=server.new_settlement_state()
        s=server.state
        s["roads"]=[[x,10] for x in range(4,24)]
        s["roadAssets"]=[]
        s["money"]=250_000
        s["landClaims"]={"chunkSize":8,"unlockedChunks":["0,0","0,1","1,0","1,1","2,1","3,1"],"expansionCount":2}

    def tearDown(self):
        server.state=self.previous

    def test_only_straight_unlocked_free_crossing_is_allowed(self):
        server.validate_bridge_site(24,10)
        with self.assertRaisesRegex(ValueError,"celda oeste"):
            server.validate_bridge_site(25,10)
        server.state["landClaims"]["unlockedChunks"].remove("3,1")
        with self.assertRaisesRegex(ValueError,"Desbloqueá"):
            server.validate_bridge_site(24,10)
        server.state["landClaims"]["unlockedChunks"].append("3,1")
        server.state["roads"].remove([23,10])
        with self.assertRaisesRegex(ValueError,"ribera oeste"):
            server.validate_bridge_site(24,10)
        server.state["roads"].append([23,10])
        server.state["projects"].append({"kind":"bridge","x":24,"y":10})
        with self.assertRaisesRegex(ValueError,"ocupado"):
            server.validate_bridge_site(24,10)

    def test_inspection_opens_two_road_tiles_and_allows_eastward_expansion(self):
        p={"id":"bridge-test","kind":"bridge","label":"Puente vial sobre el río",
           "x":24,"y":10,"contractor":"Sur Obras","cost":0,"paid":0,
           "duration":1,"elapsed":0,"progress":0,"initialProgress":0,
           "stages":["Inspección"],"stageIndex":0,"status":"contratada",
           "cause":"","workersAssigned":10,"privatePaid":True,
           "contractedDay":1,"changeOrderReviewed":True,"retentionPct":0,
           "materialsRequired":{k:0 for k in server.MATERIAL_NAMES},
           "materialsUsed":{k:0 for k in server.MATERIAL_NAMES}}
        server.state["projects"].append(p)
        self.assertNotIn([24,10],server.state["roads"])
        with patch.object(server,"assess_contract_delay",return_value=False), patch.object(server,"advance_zoned_development"), patch.object(server,"road_incident_report",return_value={}):
            for _ in range(3):
                if p not in server.state["projects"]:break
                server.tick_one_day()
        self.assertNotIn(p,server.state["projects"])
        self.assertIn([24,10],server.state["roads"])
        self.assertIn([25,10],server.state["roads"])
        assets=[a for a in server.state["roadAssets"] if a.get("bridge") and a["y"]==10]
        self.assertEqual({a["x"] for a in assets},{24,25})
        self.assertTrue(all(a["monthlyCost"]==80 for a in assets))
        self.assertTrue(server.route_between((23,10),(26,10)))
        server.place_road_instantly(26,10)
        self.assertIn([26,10],server.state["roads"])


if __name__=="__main__":
    unittest.main()
