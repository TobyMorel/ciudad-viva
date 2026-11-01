"""Competencia entre fábricas: una venta pertenece a un único proveedor real."""
import unittest
import server


class IndustrialVendorCompetitionTests(unittest.TestCase):
    def setUp(self):
        server.state = server.initial_state()
        server.ensure_supply_state()
        self.s = server.state
        self.s["supply"]["suppliers"]["Metalúrgica local"]["components"] = 8
        self.sites = []
        for x, factor in ((4, 1.35), (6, .8)):
            firm = {
                "id": f"metal-{x}", "industryType": "metalworks", "status": "abierto",
                "componentStock": 4, "materialPriceFactor": factor, "cash": 2000,
                "lastLocalSales": 0, "jobSlots": 20,
            }
            site = {"kind": "factory", "x": x, "y": 9, "name": f"Metalúrgica {x}", "business": firm}
            self.s["buildings"].append(site)
            self.sites.append(site)

    def test_cheapest_connected_vendor_receives_only_its_own_sale(self):
        offers = server.industrial_vendor_offers("Metalúrgica local", "components", 4, (4, 10))
        self.assertEqual(len(offers), 2)
        winning = offers[0]
        self.assertEqual(winning["site"]["business"]["id"], "metal-6")
        self.assertEqual(winning["productCost"], round(4*240*1.15*.8))
        self.assertTrue(winning["route"])
        before_cash = [s["business"]["cash"] for s in self.sites]
        self.s["supply"]["suppliers"]["Metalúrgica local"]["components"] -= 4
        server.settle_industrial_vendor_offer("Metalúrgica local", "components", 4, winning)
        self.assertEqual(self.sites[0]["business"]["componentStock"], 4)
        self.assertEqual(self.sites[0]["business"]["cash"], before_cash[0])
        self.assertEqual(self.sites[1]["business"]["componentStock"], 0)
        self.assertEqual(self.sites[1]["business"]["cash"], before_cash[1] + winning["productCost"])
        self.assertEqual(self.s["supply"]["suppliers"]["Metalúrgica local"]["components"], 4)
        self.assertEqual(self.s["localIndustry"]["componentsSold"], 4)
        self.assertEqual(self.sites[1]["business"]["lifetimeIndustrialSales"], 4)

    def test_single_truck_cannot_buy_from_two_partial_stocks(self):
        for site in self.sites:
            site["business"]["componentStock"] = 2
        self.assertEqual(server.industrial_vendor_offers("Metalúrgica local", "components", 4, (4, 10)), [])

    def test_price_competition_reacts_to_sales_without_creating_money(self):
        cheap, expensive = self.sites
        cheap["business"].update({"lastProduction": 4, "lastLocalSales": 0, "componentStock": 30})
        expensive["business"].update({"lastProduction": 4, "lastLocalSales": 4, "componentStock": 1})
        balances = [s["business"]["cash"] for s in self.sites]
        server.price_industrial_competition()
        self.assertLess(cheap["business"]["materialPriceFactor"], 1.35)
        self.assertGreater(expensive["business"]["materialPriceFactor"], .8)
        self.assertEqual([s["business"]["cash"] for s in self.sites], balances)


if __name__ == "__main__":
    unittest.main()
