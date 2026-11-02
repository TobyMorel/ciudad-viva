"""Regresión para demoler construcciones desde el mapa 3D."""
import unittest
import server


class DemolitionTests(unittest.TestCase):
    def setUp(self):
        self.previous = server.state
        server.state = server.new_settlement_state()
        server.state["money"] = 100_000

    def tearDown(self):
        server.state = self.previous

    def test_road_cleans_assets_utilities_containers_and_routes(self):
        s = server.state
        s["roads"].extend([[5, 10], [6, 10]])
        s["roadAssets"] = [{"x": 5, "y": 10, "monthlyCost": 15}, {"x": 6, "y": 10, "monthlyCost": 15}]
        s["monthlyExpenses"] = 30
        s["utilities"]["powerLines"] = [[4, 10], [5, 10], [6, 10]]
        s["waste"]["containers"] = [{"x": 5, "y": 10}]
        s["trafficSignalOverrides"] = {"5,10": False}
        s["busRoutes"] = [{"status": "active", "operational": True, "route": [[4, 10], [5, 10]]}]
        cash = s["money"]

        server.demolish_at(5, 10)

        self.assertNotIn([5, 10], s["roads"])
        self.assertIn([6, 10], s["roads"])
        self.assertFalse(any(a["x"] == 5 for a in s["roadAssets"]))
        self.assertNotIn([5, 10], s["utilities"]["powerLines"])
        self.assertEqual(s["waste"]["containers"], [])
        self.assertNotIn("5,10", s["trafficSignalOverrides"])
        self.assertEqual(s["busRoutes"][0]["status"], "paused")
        self.assertFalse(s["busRoutes"][0]["operational"])
        self.assertEqual(s["monthlyExpenses"], 15)
        self.assertEqual(s["money"], cash)

    def test_bridge_demolition_removes_both_halves(self):
        s = server.state
        s["roads"].extend([[24, 10], [25, 10], [26, 10]])
        s["roadAssets"] = [{"x": x, "y": 10, "bridge": True, "monthlyCost": 80} for x in (24, 25)]
        s["monthlyExpenses"] = 160
        server.demolish_at(25, 10)
        self.assertNotIn([24, 10], s["roads"])
        self.assertNotIn([25, 10], s["roads"])
        self.assertIn([26, 10], s["roads"])
        self.assertEqual(s["roadAssets"], [])
        self.assertEqual(s["monthlyExpenses"], 0)

    def test_building_and_project_and_zone_can_be_removed(self):
        s = server.state
        s["buildings"].append({"x": 6, "y": 9, "kind": "home", "name": "Prueba", "occupants": 5})
        s["population"] = 5
        s["zones"].append({"x": 6, "y": 9, "kind": "home"})
        s["projects"].append({"id": "p1", "x": 7, "y": 9, "label": "Obra"})
        money = s["money"]

        server.demolish_at(6, 9)
        self.assertEqual(s["buildings"], [])
        self.assertEqual(s["population"], 0)
        server.demolish_at(6, 9)
        self.assertEqual(s["zones"], [])
        server.demolish_at(7, 9)
        self.assertEqual(s["projects"], [])
        self.assertEqual(s["money"], money)

    def test_station_and_lines_are_removed_together(self):
        s = server.state
        s["railStations"] = [{"x": 8, "y": 8, "name": "Central"}]
        s["metroLines"] = [{"stations": [[8, 8], [9, 8]]}, {"stations": [[10, 8], [11, 8]]}]
        server.demolish_at(8, 8)
        self.assertEqual(s["railStations"], [])
        self.assertEqual(s["metroLines"], [{"stations": [[10, 8], [11, 8]]}])

    def test_regional_access_is_protected_and_empty_parcels_rejected(self):
        with self.assertRaisesRegex(ValueError, "acceso regional"):
            server.demolish_at(4, 10)
        with self.assertRaisesRegex(ValueError, "No hay ninguna"):
            server.demolish_at(7, 7)
        self.assertIn([4, 10], server.state["roads"])


if __name__ == "__main__":
    unittest.main()
