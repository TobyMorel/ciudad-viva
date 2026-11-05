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

    def test_queue_builds_between_time_windows_and_clears_when_capacity_catches_up(self):
        queue, morning_delay = server.traffic_queue_step(0, 10, 6)
        self.assertEqual(queue, 4)
        remaining, evening_delay = server.traffic_queue_step(queue, 2, 6)
        self.assertEqual(remaining, 0)
        self.assertGreater(morning_delay, 0)
        self.assertGreater(evening_delay, 0)
        route = [(0, 0), (1, 0)]
        report = {"segments": {server.traffic_edge_key(*route): {"windows": {
            "morningPeak": {"delayMinutes": morning_delay},
            "eveningPeak": {"delayMinutes": evening_delay},
        }}}}
        self.assertEqual(server.traffic_queue_delay(route, report, "morningPeak"), morning_delay)

    def test_queue_state_is_saved_idempotently_and_carried_to_next_day(self):
        server.state.update({"day": 10, "roads": [[0, 0], [1, 0]], "roadAssets": [],
                             "busRoutes": [], "supply": {"orders": [], "marketOrders": []},
                             "traffic": {"queueState": {"lastDay": 9, "queues": {}}}})
        commute = [{"mode": "auto", "reason": "trabajo", "route": [[0, 0], [1, 0]],
                    "departureWindowKey": "morningPeak", "vehicles": 100}]
        first = server.advance_traffic_queues(commute, {(0, 0), (1, 0)})
        expected = first["segments"]["0,0|1,0"]["queueAfter"]
        self.assertGreater(expected, 0)
        self.assertIs(server.advance_traffic_queues(commute, {(0, 0), (1, 0)}), first)
        server.state["day"] = 11
        next_day = server.advance_traffic_queues([], {(0, 0), (1, 0)})
        self.assertGreater(next_day["segments"]["0,0|1,0"]["windows"]["early"]["queueBefore"], 0)

    def test_online_commutes_publish_queue_report_and_return_delay(self):
        for home in server.state["buildings"]:
            if home.get("kind") == "home":
                home["householdCash"] = 5000
                home["monthlyWageIncome"] = 200
        model = server.commute_model()
        self.assertEqual(len(model["queueReport"]["windows"]), 9)
        returns = [trip for trip in model["routes"] if trip.get("reason") == "regreso" and trip.get("mode") != "walk"]
        self.assertTrue(returns)
        self.assertTrue(all("queueDelayMinutes" in trip for trip in returns))

    def test_route_avoids_a_saturated_corridor_and_uses_it_when_queue_clears(self):
        direct = [[x, 0] for x in range(5)]
        alternate = [[x, -1] for x in range(5)]
        server.state.update({"roads": direct + alternate, "roadAssets": [], "projects": [],
                             "traffic": {"queueState": {"queues": {}}}})
        route = server.route_between((0, 0), (4, 0))
        self.assertEqual(route, direct)

        queues = {server.traffic_edge_key(a, b): 100 for a, b in zip(direct, direct[1:])}
        server.state["traffic"]["queueState"]["queues"] = queues
        route = server.route_between((0, 0), (4, 0))
        self.assertNotEqual(route, direct)
        self.assertGreater(len(route), len(direct))

        server.state["traffic"]["queueState"]["queues"] = {}
        self.assertEqual(server.route_between((0, 0), (4, 0)), direct)

    def test_parking_requires_a_connected_road(self):
        server.state.update({"roads": [[1, 1], [2, 1], [3, 1], [10, 1], [11, 1], [12, 1]],
                             "roadAssets": [], "buildings": [], "traffic": {}})
        trip = {"from": [1, 0], "to": [11, 0], "mode": "auto", "reason": "compras",
                "vehicles": 1, "estimatedMinutes": 8, "trafficFactor": 1}
        report = server.assign_parking_capacity([trip])
        self.assertIsNone(trip["parkingSlot"])
        self.assertEqual(trip["parkingShortfall"], 1)
        self.assertEqual(report["reservations"], [])

    def test_closed_road_blocks_parking_access(self):
        server.state.update({"roads": [[x, 1] for x in range(1, 13)],
                             "roadAssets": [{"x": 6, "y": 1, "quality": 10}],
                             "buildings": [], "traffic": {}})
        trip = {"from": [1, 0], "to": [11, 0], "mode": "auto", "reason": "compras",
                "vehicles": 1, "estimatedMinutes": 8, "trafficFactor": 1}
        server.assign_parking_capacity([trip])
        self.assertIsNone(trip["parkingSlot"])
        self.assertEqual(trip["parkingShortfall"], 1)


if __name__ == "__main__":
    unittest.main()
