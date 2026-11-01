import unittest
from unittest.mock import patch
import server

class MaritimeSteelImport(unittest.TestCase):
    def test_import_requires_operating_port_and_real_budget(self):
        server.state=server.initial_state()
        s=server.state
        server.ensure_supply_state()
        s["paused"]=False
        s["day"]=30
        s["lastMonth"]=0
        s["supply"]["regionalSteelReserve"]=0
        s["waste"]["scrapSteelTons"]=0
        s["money"]=2800
        depot=s["supply"]["suppliers"]["Corralón del Puerto"]
        depot["steel"]=0
        s["buildings"].append({"kind":"port","x":4,"y":10,"name":"Puerto prueba","operational":True,"shipCapacity":6,"cargoCapacity":10,"cargoStored":6})
        with patch.object(server,"route_between",return_value=[[4,10]]):
            server.tick_one_day()
        self.assertEqual(s["supply"].get("steelImportedUnits",0),0)
        self.assertEqual(s["supply"]["steelImportSpend"],1120)
        self.assertEqual(depot["steel"],0)
        shipment=s["supply"]["steelShipments"][0]
        self.assertEqual(shipment["quantity"],4)
        self.assertEqual(shipment["status"],"en viaje")
        with patch.object(server,"route_between",return_value=[[4,10]]):
            s["day"]=shipment["arrivalDay"]
            server.advance_maritime_steel_shipments()
        self.assertEqual(depot["steel"],4)
        self.assertEqual(s["supply"]["steelImportedUnits"],4)
        server.advance_maritime_steel_shipments()
        self.assertEqual(depot["steel"],4)

    def test_partial_unloading_respects_daily_capacity(self):
        server.state=server.initial_state()
        s=server.state
        server.ensure_supply_state()
        s["day"]=100
        s["buildings"].append({"kind":"port","x":4,"y":10,"operational":True,"unloadingCapacity":7})
        depot=s["supply"]["suppliers"]["Corralón del Puerto"]
        before=depot["steel"]
        s["supply"]["steelShipments"]=[{"quantity":20,"port":[4,10],"arrivalDay":100,"status":"en viaje"}]
        with patch.object(server,"route_between",return_value=[[4,10]]):
            server.advance_maritime_steel_shipments()
            self.assertEqual(depot["steel"]-before,7)
            self.assertEqual(s["supply"]["steelShipments"][0]["status"],"descarga parcial")
            server.advance_maritime_steel_shipments()
            self.assertEqual(depot["steel"]-before,7)
            s["day"]=101
            server.advance_maritime_steel_shipments()
            s["day"]=102
            server.advance_maritime_steel_shipments()
        self.assertEqual(depot["steel"]-before,20)
        self.assertEqual(s["supply"]["steelShipments"][0]["status"],"entregado")
        self.assertEqual(s["supply"]["steelImportedUnits"],20)

if __name__=="__main__":
    unittest.main()
