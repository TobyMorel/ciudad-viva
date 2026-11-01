import unittest
import server

class ScrapSteelTest(unittest.TestCase):
    def test_scrap_conversion_is_funded_and_conserves_mass(self):
        server.state=server.initial_state()
        s=server.state
        server.ensure_supply_state()
        s["paused"]=False
        s["day"]=29
        s["lastMonth"]=0
        s["money"]=1000
        s["supply"]["regionalSteelReserve"]=0
        s["waste"]["scrapSteelTons"]=5
        depot=s["supply"]["suppliers"]["Corralón del Puerto"]
        depot["steel"]=0
        server.tick_one_day()
        self.assertGreaterEqual(depot["steel"],10)
        self.assertEqual(s["supply"]["steelRecyclingSpend"],120)
        self.assertLessEqual(s["waste"]["scrapSteelTons"],5)
        self.assertGreaterEqual(s["money"],0)

if __name__=="__main__":unittest.main()
