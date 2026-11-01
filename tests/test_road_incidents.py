"""Choques viales son causales, cierran el tramo y esperan limpieza municipal."""
import unittest
import server


class RoadIncidentTests(unittest.TestCase):
    def setUp(self):
        server.state = server.initial_state()
        server.state["day"] = 8
        server.state["roads"] = [[0, 10], [1, 10], [2, 10]]
        server.state["roadAssets"] = [
            {"x": 0, "y": 10, "quality": 82},
            {"x": 1, "y": 10, "quality": 30},
            {"x": 2, "y": 10, "quality": 82},
        ]
        server.state["roadIncidents"] = {"events": [], "generated": 0, "responded": 0, "unanswered": 0}
        server.state["utilities"]["report"] = {"drainage": {"rainfallMm": 0}}

    def test_incident_closes_unsafe_road_then_clears_with_unserved_cost(self):
        day = next(d for d in range(8, 100000, 15)
                   if server.stable_skill(f"{d}:1:10", "accidente vial") % 100 < 16)
        server.state["day"] = day
        traffic = {"segmentFlow": {}, "workplaces": []}
        report = server.road_incident_report(traffic, advance=True)
        incident = report["activeIncidents"][0]
        self.assertEqual((incident["x"], incident["y"]), (1, 10))
        self.assertEqual(incident["cause"], "calzada deteriorada")
        self.assertTrue(server.state["roadAssets"][1]["accidentClosed"])
        self.assertIsNone(server.route_between((0, 10), (2, 10)))
        for _ in range(3):
            server.state["day"] += 1
            report = server.road_incident_report(traffic, advance=True)
        self.assertFalse(report["activeIncidents"])
        self.assertEqual(report["unanswered"], 1)
        self.assertFalse(server.state["roadAssets"][1]["accidentClosed"])
        self.assertIsNotNone(server.route_between((0, 10), (2, 10)))
        self.assertEqual(server.state["money"], 47100)
        self.assertEqual(server.state["services"], 75)


if __name__ == "__main__":
    unittest.main()
