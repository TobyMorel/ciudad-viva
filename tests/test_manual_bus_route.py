import unittest
import server


class ManualBusRoute(unittest.TestCase):
    def setUp(self):
        self.old_state = server.state
        server.state = server.initial_state()
        server.state["roads"] = [[x, 10] for x in range(4, 12)]
        server.state["buildings"] = [{"x": 5, "y": 9, "kind": "busGarage", "name": "Depósito Norte", "status": "habilitado", "busBayCapacity": 4}]
        server.state["busRoutes"] = []

    def tearDown(self):
        server.state = self.old_state

    def test_manual_line_uses_depot_ordered_stops_and_exact_cost(self):
        before = server.state["money"]
        line = server.create_manual_bus_route(5, 9, [[7, 10], [9, 10]], 2)
        self.assertTrue(line["manualRoute"])
        self.assertEqual(line["garageId"], "garage-5-9")
        self.assertEqual(line["route"], [[5, 10], [6, 10], [7, 10], [8, 10], [9, 10]])
        self.assertEqual([stop["routeIndex"] for stop in line["stops"]], [2, 4])
        self.assertEqual(server.state["money"], before - (2 * server.BUS_PURCHASE_COST + 700))

    def test_depot_only_accepts_one_line_and_rejects_duplicate_or_unbuilt_stops(self):
        server.create_manual_bus_route(5, 9, [[7, 10], [9, 10]])
        with self.assertRaisesRegex(ValueError, "una línea"):
            server.create_manual_bus_route(5, 9, [[6, 10], [8, 10]])
        server.state["busRoutes"] = []
        with self.assertRaisesRegex(ValueError, "misma parada"):
            server.create_manual_bus_route(5, 9, [[7, 10], [7, 10]])
        with self.assertRaisesRegex(ValueError, "ya no tiene una calle"):
            server.create_manual_bus_route(5, 9, [[7, 10], [30, 10]])

    def test_line_spending_respects_uncommitted_public_contracts(self):
        server.state["money"] = 2000
        server.state["projects"] = [{"cost": 1000, "paid": 0, "privatePaid": False}]
        with self.assertRaisesRegex(ValueError, r"quedan \$ 1.000"):
            server.create_manual_bus_route(5, 9, [[7, 10], [9, 10]])
        self.assertEqual(server.state["money"], 2000)
        self.assertEqual(server.state["busRoutes"], [])


if __name__ == "__main__":
    unittest.main()
