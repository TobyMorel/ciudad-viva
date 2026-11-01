"""Precios minoristas reaccionan al inventario y ventas, sin imprimir fondos."""
import unittest
import server

class RetailPricing(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        self.shop={"x":2,"y":2,"kind":"shop","name":"Almacén prueba","business":{"id":"retail-1","status":"abierto","price":18,"lastSales":20,"lastDemand":22,"inventory":4,"lastProfit":100,"cash":400}}
        server.state["buildings"].append(self.shop)

    def test_stock_scarcity_with_sales_increases_price_not_cash(self):
        server.reprice_private_shops()
        f=self.shop["business"]
        self.assertEqual(f["price"],19)
        self.assertEqual(f["cash"],400)
        self.assertEqual(f["lastPriceChangeDay"],server.state["day"])

    def test_overstock_competition_lowers_price(self):
        f=self.shop["business"]
        f.update({"inventory":80,"lastSales":2,"lastDemand":18,"lastProfit":-10})
        server.reprice_private_shops()
        self.assertEqual(f["price"],17)
        self.assertEqual(f["cash"],400)

    def test_no_increase_on_stockout_and_bounds(self):
        f=self.shop["business"]
        f["inventory"]=0
        server.reprice_private_shops()
        self.assertEqual(f["price"],18)
        f.update({"price":8,"inventory":80,"lastSales":0,"lastProfit":-1})
        server.reprice_private_shops()
        self.assertEqual(f["price"],8)

if __name__=="__main__":
    unittest.main()
