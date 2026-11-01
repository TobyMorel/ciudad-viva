"""Las empresas privadas contratan/despiden por demanda solvente y pagan equipamiento."""
import unittest
import server


class StaffingResponseTests(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.ensure_supply_state()
        self.s=server.state
        self.s["day"]=61
        self.s["supply"].pop("businessEquipmentCash",None)

    def test_shop_expands_with_profitable_unmet_demand_and_pays_for_equipment(self):
        firm={"id":"shop-growing","name":"Tienda creciente","status":"abierto",
              "jobSlots":12,"cash":6500,"wage":10,"inventory":0,
              "lastSales":15,"lastDemand":31,"lastProfit":800}
        site={"x":4,"y":9,"kind":"shop","name":"Tienda creciente","jobSlots":12,"business":firm}
        self.s["buildings"].append(site)
        jobs=self.s["jobs"]
        server.rebalance_private_staffing({"workplaces":[{"x":4,"y":9,"staffedJobs":12}]})
        self.assertEqual(firm["jobSlots"],13)
        self.assertEqual(site["jobSlots"],13)
        self.assertEqual(firm["cash"],6350)
        self.assertEqual(self.s["jobs"],jobs+1)
        self.assertEqual(self.s["supply"]["businessEquipmentCash"],150)
        self.assertEqual(firm["lastEquipmentInvestment"],150)
        self.assertEqual(firm["lastStaffingChange"],1)

    def test_repeated_losses_remove_vacancies_and_lay_off_identified_residents(self):
        firm={"id":"shop-shrinking","name":"Tienda sin ventas","status":"abierto",
              "jobSlots":6,"cash":800,"inventory":24,"wage":10,
              "lastSales":0,"lastDemand":0,"lastProfit":-200,"lowDemandMonths":1}
        site={"x":4,"y":9,"kind":"shop","name":"Tienda sin ventas","jobSlots":6,"business":firm}
        self.s["buildings"].append(site)
        eligible=[p for b in self.s["buildings"] if b.get("kind")=="home"
                  for p in b.get("residents",[]) if p.get("workerEligible")][:6]
        self.assertEqual(len(eligible),6)
        for p in eligible:
            p.update({"status":"empleado","employerId":firm["id"],"employerName":firm["name"],
                      "monthlyWage":10,"attendance":1})
        jobs=self.s["jobs"]
        server.rebalance_private_staffing({"workplaces":[{"x":4,"y":9,"staffedJobs":6}]})
        self.assertEqual(firm["jobSlots"],4)
        self.assertEqual(self.s["jobs"],jobs-2)
        self.assertEqual(sum(p.get("employerId")==firm["id"] for p in eligible),4)
        fired=[p for p in eligible if p.get("employerId") is None]
        self.assertEqual(len(fired),2)
        self.assertTrue(all(p["status"]=="buscando" and p["unemployedSinceDay"]==61 for p in fired))
        self.assertEqual(self.s["unemploymentEvents"][-1]["workers"],2)
        self.assertEqual(self.s["supply"].get("businessEquipmentCash",0),0)

    def test_metalworks_expansion_requires_real_industrial_sales_and_cash(self):
        firm={"id":"plant-growing","name":"Metalurgia","industryType":"metalworks",
              "status":"abierto","jobSlots":20,"wage":12,"cash":6000,
              "componentStock":2,"lifetimeIndustrialSales":14,"staffingSalesCheckpoint":0}
        self.s["buildings"].append({"kind":"factory","x":4,"y":9,"business":firm})
        server.rebalance_private_staffing({"workplaces":[{"x":4,"y":9,"staffedJobs":20}]})
        self.assertEqual(firm["jobSlots"],21)
        self.assertEqual(firm["cash"],5760)
        self.assertEqual(self.s["supply"]["businessEquipmentCash"],240)
        self.assertEqual(firm["staffingSalesCheckpoint"],14)
        firm["lastLocalSales"]=0
        server.rebalance_private_staffing({"workplaces":[{"x":4,"y":9,"staffedJobs":21}]})
        self.assertEqual(firm["jobSlots"],21,"La misma venta no puede justificar dos ampliaciones")


if __name__=="__main__":
    unittest.main()
