import unittest
import server

class CommercialLeases(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        self.site={"kind":"shop","x":12,"y":10,"name":"Tienda","business":{"id":"lease-test","status":"abierto","monthlyRent":80,"lastSales":20,"lastDemand":20,"lastProfit":400,"cash":1000}}
        server.state["buildings"].append(self.site)
    def test_high_activity_increases_rent_without_minting_cash(self):
        server.renew_private_commercial_leases()
        self.assertEqual(self.site["business"]["monthlyRent"],85)
        self.assertEqual(self.site["business"]["cash"],1000)
    def test_low_activity_reduces_rent(self):
        f=self.site["business"]
        f.update(lastSales=0,lastDemand=20,lastProfit=-90)
        server.renew_private_commercial_leases()
        self.assertEqual(f["monthlyRent"],75)
    def test_limits(self):
        f=self.site["business"];f["monthlyRent"]=180
        server.renew_private_commercial_leases()
        self.assertEqual(f["monthlyRent"],180)
        f.update(monthlyRent=30,lastSales=0,lastProfit=-90)
        server.renew_private_commercial_leases()
        self.assertEqual(f["monthlyRent"],30)
if __name__=="__main__":unittest.main()
