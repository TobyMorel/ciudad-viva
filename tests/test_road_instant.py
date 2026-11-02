"""Las calles municipales se pagan por tramo y se habilitan en la misma acción."""
import unittest
import server


class InstantRoadTests(unittest.TestCase):
    def setUp(self):
        self.old_state=server.state
        server.state=server.new_settlement_state()

    def tearDown(self):
        server.state=self.old_state

    def test_multiple_clicks_charge_only_each_road_and_create_no_project(self):
        before=server.state["money"]
        original_stock={key:value.copy() for key,value in server.state["supply"]["contractors"].items()}
        server.place_road_instantly(5,10)
        server.place_road_instantly(6,10)
        self.assertIn([5,10],server.state["roads"])
        self.assertIn([6,10],server.state["roads"])
        self.assertEqual(server.state["money"],before-2*server.ROAD_BUILD_COST)
        self.assertEqual(server.state["projects"],[])
        self.assertEqual(len(server.state["roadAssets"]),2)
        self.assertEqual(server.state["supply"]["contractors"],original_stock)

    def test_route_requires_connection_and_funds(self):
        with self.assertRaisesRegex(ValueError,"conectar con la red"):
            server.place_road_instantly(7,10)
        with self.assertRaisesRegex(ValueError,"ya forma parte"):
            server.place_road_instantly(4,10)
        server.state["money"]=0
        with self.assertRaisesRegex(ValueError,"cuesta"):
            server.place_road_instantly(5,10)


if __name__=="__main__":
    unittest.main()
