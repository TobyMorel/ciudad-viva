import unittest
import server

class RegionalSteelReserve(unittest.TestCase):
    def test_depleted_ore_prevents_fictitious_steel_replenishment(self):
        server.state=server.initial_state()
        s=server.state
        server.ensure_supply_state()
        s["supply"]["regionalSteelReserve"]=0
        s["paused"]=False
        s["day"]=29
        s["lastMonth"]=0
        suppliers=s["supply"]["suppliers"]
        before={name:suppliers[name]["steel"] for name in ("Distribuidora Regional","Corralón del Puerto","Flete Urgente")}
        server.tick_one_day()
        self.assertEqual(s["supply"]["regionalSteelReserve"],0)
        for name,old in before.items():
            self.assertLessEqual(suppliers[name]["steel"],old,"No debe aparecer acero regional sin mineral")

if __name__=="__main__":
    unittest.main()
