"""Autonomous private reopening of bankrupt factories in the Online engine."""
import unittest
import server

class IndustrialRecoveryTests(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.ensure_supply_state()
        self.s=server.state
        self.s["day"]=120
        self.s["privateCapital"]=20000
        self.s["money"]=30000
        self.site={"x":4,"y":9,"kind":"factory","name":"Cantera abandonada","status":"cerrado",
                   "utilityAccess":{"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100},
                   "business":{"id":"old-quarry","industryType":"quarry","status":"cerrado",
                               "closedDay":10,"cash":-300,"aggregateStock":0,
                               "quarryReserve":73,"jobSlots":20}}
        self.s["buildings"].append(self.site)
        self.s.setdefault("zones",[]).append({"x":4,"y":9,"kind":"factory"})
        # A pending project demands aggregate, but its site cannot progress while awaiting changes.
        self.s["projects"].append({"id":"pending-aggregate","kind":"road","contractor":"Estudio y Obra Norte",
            "workersAssigned":4,"status":"cambio_pendiente",
            "materialsRequired":{"aggregate":12},"materialsUsed":{"aggregate":0}})

    def test_capital_workers_time_and_inspection(self):
        cash0=self.s["supply"]["contractorCash"].copy()
        server.consider_industrial_reopenings()
        r=self.site["industrialRecovery"]
        self.assertEqual(r["status"],"en obra")
        self.assertEqual(r["cost"],5300)
        self.assertEqual(self.s["privateCapital"],14700)
        self.assertEqual(self.s["money"],30200)
        self.assertEqual(self.s["supply"]["contractorCash"][r["contractor"]],cash0[r["contractor"]]+900)
        self.assertEqual(server.contractor_free_workers(r["contractor"]),
                         server.CONTRACTORS[r["contractor"]]["workers"]-5-(4 if r["contractor"]=="Estudio y Obra Norte" else 0))
        self.assertEqual(self.site["business"]["status"],"cerrado")
        self.s["day"]=r["readyDay"]-1
        server.advance_industrial_reopenings()
        self.assertEqual(self.site["business"]["status"],"cerrado")
        self.s["day"]=r["readyDay"]
        self.site["utilityAccess"]["powerServedPct"]=0
        server.advance_industrial_reopenings()
        self.assertEqual(r["status"],"en obra")
        self.assertIn("servicios",r["statusCause"])
        self.site["utilityAccess"]["powerServedPct"]=100
        jobs_before=self.s["jobs"]
        server.advance_industrial_reopenings()
        firm=self.site["business"]
        self.assertEqual(firm["status"],"abierto")
        self.assertNotEqual(firm["id"],"old-quarry")
        self.assertEqual(firm["cash"],4200)
        self.assertEqual(firm["aggregateStock"],0)
        self.assertEqual(firm["quarryReserve"],73,"La rehabilitación no crea nueva geología")
        self.assertEqual(self.s["jobs"],jobs_before+20)
        self.assertEqual(r["status"],"completada")
        self.assertEqual(len(self.site["industrialRecoveryHistory"]),1)
        server.advance_industrial_reopenings()
        self.assertEqual(self.s["jobs"],jobs_before+20)
        self.assertEqual(len(self.site["industrialRecoveryHistory"]),1)

    def test_no_demand_no_spontaneous_reopening(self):
        self.s["projects"].clear()
        server.consider_industrial_reopenings()
        self.assertNotIn("industrialRecovery",self.site)
        self.assertEqual(self.s["privateCapital"],20000)

if __name__=="__main__":
    unittest.main()
