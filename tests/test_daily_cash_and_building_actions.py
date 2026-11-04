import unittest
from unittest.mock import patch

import server


class DailyCashAndBuildingActions(unittest.TestCase):
    def test_daily_cash_moves_once_per_day_and_totals_the_month(self):
        server.state = server.new_settlement_state()
        city = server.state
        city.update(money=1000, monthlyIncome=300, monthlyExpenses=150, newSettlement=False)
        city["utilities"]["report"] = {"monthlyMaintenance": 0}
        city["waste"]["report"] = {"monthlyOperatingCost": 0}
        with patch.object(server, "police_service_report", return_value={"monthlyOperatingCost": 0}), patch.object(server, "road_maintenance_report", return_value={"monthlyRequired": 0}):
            for day in range(2, 32):
                city["day"] = day
                server.settle_daily_municipal_cash({"workplaces": []})
                server.accrue_municipal_cash(1)
                if day == 2:
                    self.assertEqual(city["money"], 1005)
                    server.settle_daily_municipal_cash({"workplaces": []})
                    self.assertEqual(city["money"], 1005)
        self.assertEqual(city["dailyCashFlow"]["income"], 300)
        self.assertEqual(city["dailyCashFlow"]["paid"]["services"], 150)
        self.assertEqual(city["money"], 1150)

    def test_move_then_demolish_does_not_refund_construction(self):
        server.state = server.initial_state()
        city = server.state
        home = next(b for b in city["buildings"] if b["kind"] == "home")
        x, y = home["x"], home["y"]
        money = city["money"]
        population = city["population"]
        occupants = home.get("occupants", 0)
        with patch.object(server, "land_tile_unlocked", return_value=True), patch.object(server, "is_water", return_value=False), patch.object(server, "route_between", return_value=[(4, 10)]):
            server.change_building_site("relocateBuilding", x, y, 30, 30)
        self.assertEqual((home["x"], home["y"]), (30, 30))
        self.assertEqual(city["money"], money)
        server.change_building_site("demolishBuilding", 30, 30)
        self.assertNotIn(home, city["buildings"])
        self.assertEqual(city["money"], money)
        self.assertEqual(city["population"], population - occupants)


if __name__ == "__main__":
    unittest.main()
