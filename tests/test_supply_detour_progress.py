"""Un desvío logístico conserva el punto alcanzado y vuelve a estimar la llegada."""
import unittest
from unittest.mock import patch
import server


class SupplyDetourProgressTests(unittest.TestCase):
    def setUp(self):
        server.state = server.initial_state()
        server.state["day"] = 10
        server.state["roads"] = [[x, 0] for x in range(15)] + [[x, -1] for x in range(15)]
        server.state["roadAssets"] = []
        server.state["projects"] = []
        server.state["traffic"] = {"queueState": {"lastDay": 9, "queues": {}}}
        server.ensure_supply_state()
        server._commute_cache = None
        server._commute_cache_key = None

    def test_replanned_supply_route_continues_from_the_truck_position(self):
        roads = server.state["roads"]
        direct = [[x, 0] for x in range(15)]
        server.state["traffic"]["queueState"]["queues"] = {
            server.traffic_edge_key(a, b): 100
            for a, b in zip(direct[4:], direct[5:])
        }
        order = {
            "id": "detour-test", "status": "en tránsito", "supplier": "Corralón del Puerto",
            "contractor": "Sur Obras", "destinationId": "yard", "destinationLabel": "Patio",
            "source": [0, 0], "route": direct, "travelDistance": 14,
            "travelledDistance": 4, "supplierReadyDay": 1, "orderedDay": 1,
            "items": {"aggregate": 1}, "arrivalDay": 4,
        }
        server.state["supply"]["orders"] = [order]
        with patch.object(server, "storage_location", return_value={"x": 14, "y": 0, "id": "yard"}):
            server.process_supply_orders()

        self.assertEqual(order["route"][0], [4, 0])
        self.assertEqual(order["currentPosition"], order["route"][int(order["travelledDistance"])])
        self.assertGreater(order["routeProgress"], 0)
        self.assertEqual(order["travelDistance"], len(order["route"]) - 1)
        self.assertNotEqual(order["route"], direct)
        self.assertGreater(order["plannedArrivalDay"], order["supplierReadyDay"])


if __name__ == "__main__":
    unittest.main()
