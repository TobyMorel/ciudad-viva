"""Producción industrial y reserva de especialidades: motor autoritativo Online."""
import unittest
import server

class IndustryChainTest(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.ensure_supply_state()

    def test_factory_specialty_is_reserved_on_contract(self):
        s=server.state
        self.assertEqual(server.next_factory_industry(),"food")
        s["projects"].append({"kind":"factory","industryType":"food","status":"contratada"})
        self.assertEqual(server.next_factory_industry(),"quarry")
        s["projects"].append({"kind":"factory","industryType":"quarry","status":"contratada"})
        self.assertEqual(server.next_factory_industry(),"concrete")
        s["projects"].append({"kind":"factory","industryType":"concrete","status":"contratada"})
        self.assertEqual(server.next_factory_industry(),"sawmill")
        s["projects"].append({"kind":"factory","industryType":"sawmill","status":"contratada"})
        self.assertEqual(server.next_factory_industry(),"metalworks")

    def test_aggregate_is_purchased_delivered_and_converted_into_concrete(self):
        s=server.state
        s["day"]=1
        utilities={"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100}
        quarry={"kind":"factory","x":4,"y":9,"name":"Cantera test","utilityAccess":utilities,"monthlyOperatingCost":320,
                "business":{"id":"quarry-test","name":"Cantera test","industryType":"quarry","status":"abierto",
                            "cash":30000,"jobSlots":20,"aggregateStock":0,"quarryReserve":100}}
        plant={"kind":"factory","x":6,"y":9,"name":"Hormigonera test","utilityAccess":utilities,"monthlyOperatingCost":450,
                "business":{"id":"concrete-test","name":"Hormigonera test","industryType":"concrete","status":"abierto",
                            "cash":30000,"jobSlots":20,"rawMaterialInventory":0,"concreteStock":0}}
        s["buildings"].extend([quarry,plant])
        workforce={(4,9):{"staffedJobs":20,"payroll":200},(6,9):{"staffedJobs":20,"payroll":200}}
        initial_quarry_cash=quarry["business"]["cash"]
        server.advance_local_quarries(workforce,[])
        extracted=quarry["business"]["lastProduction"]
        self.assertEqual(extracted,30)
        self.assertEqual(quarry["business"]["quarryReserve"],70)
        server.advance_local_concrete_plants(workforce,[])
        orders=[o for o in s["supply"]["marketOrders"] if o.get("commodity")=="áridos"]
        self.assertEqual(len(orders),3,"El contrato divide el lote en tres envíos semanales")
        contract=s["supply"]["tradeContracts"][-1]
        self.assertEqual(sum(o["quantity"] for o in orders),extracted)
        self.assertEqual(contract["escrow"],contract["contractValue"])
        self.assertEqual(s["supply"]["suppliers"]["Cantera local"]["aggregate"],0)
        self.assertEqual(quarry["business"]["aggregateStock"],0)
        cash_before=quarry["business"]["cash"]
        self.assertLess(cash_before,initial_quarry_cash,"Aún solo pagó nómina y operación")
        self.assertTrue(all(order["route"] for order in orders))
        for day in range(2,30):
            s["day"]=day
            server.process_market_orders()
            if all(o["status"]=="entregado" for o in orders):break
        self.assertTrue(all(o["status"]=="entregado" for o in orders))
        self.assertEqual(contract["status"],"cumplido")
        self.assertEqual(contract["escrow"],0)
        self.assertGreater(quarry["business"]["cash"],cash_before)
        self.assertEqual(plant["business"]["rawMaterialInventory"],extracted)
        server.advance_local_concrete_plants(workforce,[])
        self.assertEqual(plant["business"]["lastProduction"],15)
        self.assertEqual(plant["business"]["rawMaterialInventory"],0)
        self.assertEqual(s["supply"]["suppliers"]["Hormigonera local"]["concrete"],15)
        self.assertEqual(plant["business"]["concreteStock"],15)
        
if __name__=="__main__":
    unittest.main()
