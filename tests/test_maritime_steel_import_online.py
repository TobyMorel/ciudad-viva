import unittest
from unittest.mock import patch
import server

class MaritimeSteelImport(unittest.TestCase):
    def test_import_requires_operating_port_and_real_budget(self):
        server.state=server.initial_state()
        s=server.state
        server.ensure_supply_state()
        s["paused"]=False
        s["day"]=29
        s["lastMonth"]=0
        s["supply"]["regionalSteelReserve"]=0
        s["waste"]["scrapSteelTons"]=0
        s["money"]=2800
        depot=s["supply"]["suppliers"]["Corralón del Puerto"]
        depot["steel"]=0
        s["buildings"].append({"kind":"port","x":4,"y":10,"name":"Puerto prueba","operational":True})
        with patch.object(server,"route_between",return_value=[[4,10]]):
            server.tick_one_day()
        self.assertEqual(s["supply"]["steelImportedUnits"],10)
        self.assertEqual(s["supply"]["steelImportSpend"],2800)
        self.assertEqual(depot["steel"],10)

if __name__=="__main__":
    unittest.main()
