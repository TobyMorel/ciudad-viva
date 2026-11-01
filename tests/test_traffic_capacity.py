"""La capacidad vial de la simulación Online usa jerarquía y condición física."""
import unittest
import server


class TrafficCapacityTests(unittest.TestCase):
    def setUp(self):
        server.state = server.initial_state()

    def test_arterial_capacity_and_road_condition(self):
        self.assertEqual(server.road_traffic_capacity((0, 0), (1, 0)), 1.2)
        self.assertEqual(server.road_traffic_capacity((0, 10), (1, 10)), 2.4)
        server.state["roadAssets"] = [{"x": 0, "y": 0, "quality": 41}]
        self.assertEqual(server.road_traffic_capacity((0, 0), (1, 0)), 0.6)


if __name__ == "__main__":
    unittest.main()
