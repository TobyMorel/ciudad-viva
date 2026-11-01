"""Integración: las obras privadas zonificadas NO reciben materiales instantáneos."""
import unittest
import server


class PrivateConstructionFreightTests(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.ensure_supply_state()
        self.s=server.state
        self.s["day"]=1
        self.s["paused"]=False
        self.s["supply"]["yardCapacity"]=3000
        self.s["privateCapital"]=150000
        self.s["money"]=150000

    def test_industrial_purchase_books_truck_and_pays_one_factory(self):
        s=self.s;contractor="Sur Obras"
        s["supply"]["contractors"][contractor]["components"]=0
        for name in server.SUPPLIERS:
            s["supply"]["suppliers"][name]["components"]=0
        s["supply"]["suppliers"]["Metalúrgica local"]["components"]=4
        firm={"id":"private-metal","industryType":"metalworks","status":"abierto",
              "componentStock":4,"cash":1000,"materialPriceFactor":.9}
        s["buildings"].append({"x":4,"y":9,"kind":"factory","name":"Metalurgia privada","business":firm})
        project={"id":"priv-1","kind":"home","label":"Casa privada","x":4,"y":11,
                 "contractor":contractor,"materialsRequired":{key:(4 if key=="components" else 0)
                     for key in server.MATERIAL_NAMES}}
        quotes=server.plan_private_construction_deliveries(project)
        self.assertIsNotNone(quotes)
        self.assertEqual(len(quotes),1)
        self.assertEqual(quotes[0]["supplier"],"Metalúrgica local")
        self.assertEqual(quotes[0]["quote"]["site"]["business"]["id"],firm["id"])
        cash_before=firm["cash"]
        old=server.state["supply"]["contractors"][contractor]["components"]
        server.commit_private_construction_deliveries(project,quotes)
        order=s["supply"]["orders"][-1]
        self.assertTrue(order["privateContract"])
        self.assertEqual(order["vendorId"],firm["id"])
        self.assertEqual(order["status"],"en tránsito")
        self.assertEqual(order["source"],[4,9])
        self.assertGreater(order["arrivalDay"],s["day"])
        self.assertEqual(s["supply"]["contractors"][contractor]["components"],old)
        self.assertEqual(s["supply"]["suppliers"]["Metalúrgica local"]["components"],0)
        self.assertEqual(firm["componentStock"],0)
        self.assertEqual(firm["cash"],cash_before+order["productCost"])
        self.assertEqual(project["materialsCost"],order["cost"])
        self.assertEqual(s["supply"]["logisticsCash"],order["freight"])
        self.assertEqual(len(project["privateSupplyOrders"]),1)

    def test_no_source_or_full_yard_blocks_plan_without_debit(self):
        s=self.s
        p={"id":"priv-2","kind":"home","label":"Vivienda","x":4,"y":11,
           "contractor":"Sur Obras","materialsRequired":{"components":100}}
        s["supply"]["contractors"]["Sur Obras"]["components"]=0
        for name in server.SUPPLIERS:s["supply"]["suppliers"][name]["components"]=0
        original=s["privateCapital"]
        self.assertIsNone(server.plan_private_construction_deliveries(p))
        self.assertEqual(len(s["supply"]["orders"]),0)
        self.assertEqual(s["privateCapital"],original)

    def test_automatic_zoned_development_includes_private_materials_without_municipal_delivery(self):
        s=self.s
        s["zones"]=[{"x":7,"y":11,"kind":"home","status":"disponible"}]
        s["housingDemand"]={"unmet":80,"lastGenerated":0,"lastFilled":0}
        s["projects"]=[]
        for stock in s["supply"]["contractors"].values():
            for key in server.MATERIAL_NAMES:stock[key]=0
        for supplier in s["supply"]["suppliers"].values():
            for key in server.MATERIAL_NAMES:
                if key in supplier:supplier[key]=max(200,int(supplier[key]))
        old_capital=s["privateCapital"]
        server.advance_zoned_development()
        projects=[p for p in s["projects"] if p.get("zonedDevelopment")]
        self.assertEqual(len(projects),1,"Debe empezar una vivienda privada con demanda y permisos")
        p=projects[0]
        orders=[o for o in s["supply"]["orders"] if o.get("projectId")==p["id"]]
        self.assertEqual(orders,[])
        self.assertTrue(p["privateMaterialsIncluded"])
        self.assertTrue(all(amount==0 for amount in p["materialsRequired"].values()))
        self.assertLess(s["privateCapital"],old_capital)
        self.assertTrue(all(sum(stock.get(k,0) for stock in s["supply"]["contractors"].values())==0
                            for k in server.MATERIAL_NAMES),"No aparecen materiales en el patio al contratar")


if __name__=="__main__":
    unittest.main()
