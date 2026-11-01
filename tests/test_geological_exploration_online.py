import unittest
import server

class GeologicalExploration(unittest.TestCase):
    def test_exploration_uses_private_capital_and_finite_ore(self):
        server.state=server.initial_state()
        s=server.state
        server.ensure_supply_state()
        s["paused"]=False;s["day"]=30;s["lastMonth"]=0
        s["privateCapital"]=5000
        s["supply"]["regionalSteelReserve"]=0
        s["supply"]["unexploredSteelOre"]=300
        server.tick_one_day()
        self.assertEqual(s["supply"]["unexploredSteelOre"],0)
        self.assertEqual(s["supply"]["geologicalExplorationSpend"],4500)
        self.assertGreaterEqual(s["supply"]["regionalSteelReserve"],300)
        self.assertLessEqual(s["privateCapital"],500)
if __name__=="__main__":unittest.main()
