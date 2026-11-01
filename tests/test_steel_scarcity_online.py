"""Escasez regional repercute en el costo del acero sin crear stock."""
import unittest
import server

class SteelScarcity(unittest.TestCase):
    def test_price_tiers_respect_stock_and_capital(self):
        for stock,expected in [(10,1.5),(40,1.25),(120,1.0)]:
            with self.subTest(stock=stock):
                server.state=server.initial_state()
                server.ensure_supply_state()
                s=server.state
                supplier=s["supply"]["suppliers"]["Corralón del Puerto"]
                supplier["steel"]=stock
                plant={"kind":"factory","x":6,"y":9,"name":"Metalúrgica",
                    "utilityAccess":{"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100},
                    "monthlyOperatingCost":0,
                    "business":{"id":"metal-test","industryType":"metalworks","status":"abierto",
                        "cash":40000,"jobSlots":20,"rawSteelInventory":0,"componentStock":0}}
                s["buildings"].append(plant)
                server.advance_local_metalworks({},[])
                self.assertEqual(supplier["lastSteelPriceFactor"],expected)
                orders=[o for o in s["supply"]["marketOrders"] if o.get("commodity")=="acero" and o.get("businessId")=="metal-test"]
                self.assertEqual(len(orders),1)
                o=orders[0]
                self.assertLessEqual(o["quantity"],stock)
                self.assertEqual(supplier["steel"]+o["quantity"],stock)
                self.assertEqual(plant["business"]["cash"]+o["cost"],40000)

if __name__=="__main__":
    unittest.main()
