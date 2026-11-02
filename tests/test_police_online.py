import unittest
from unittest.mock import patch
import server

class PoliceUrbanOnline(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.ensure_supply_state()
        server.ensure_finance_state()
        self.s=server.state
        self.s["money"]=50000
        self.center={"kind":"civic","name":"Comisaría de ensayo","serviceModel":"policePost","x":12,"y":12,"status":"habilitado","jobSlots":16}
        self.s["buildings"].append(self.center)
        self.center["utilityAccess"]={"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100}
        for b in self.s["buildings"]:
            if b["kind"] in ("home","shop"):
                b["utilityAccess"]={"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100}
        self.staff=[{"kind":"civic","x":self.center["x"],"y":self.center["y"],"staffedJobs":16}]

    def test_equip_vehicles_and_reassignment_take_real_money_and_staff(self):
        with patch.object(server,"route_between",return_value=[(4,10)]*4):
            base=server.health_service_report(self.staff)["primary"]["capacityPerDay"]
            before=self.s["money"]
            server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])
            self.assertEqual(self.s["money"],before-4000)
            self.assertEqual(server.police_staff_reserved(self.center,self.staff),3)
            after=server.health_service_report(self.staff)["primary"]["capacityPerDay"]
            self.assertEqual(after,base,"Una comisaría no es un consultorio ni atiende pacientes.")
            with self.assertRaisesRegex(ValueError,"ya cuenta"):
                server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])
            server.invest_police_unit("addPoliceVehicle",self.center["x"],self.center["y"])
            self.assertEqual(self.center["policeUnit"]["vehicles"],2)
            self.assertEqual(self.s["money"],before-6500)
            server.invest_police_unit("setPolicePriority",self.center["x"],self.center["y"],"comercial")
            self.assertEqual(self.center["policeUnit"]["priority"],"comercial")
            self.assertEqual(self.s["money"],before-6500,"Cambiar prioridad no cobra por duplicado.")
            self.assertGreater(server.police_service_report(self.staff)["monthlyOperatingCost"],0)

    def test_monthly_incidents_are_causal_and_idempotent(self):
        self.s["day"]=31
        with patch.object(server,"route_between",return_value=[(4,10)]*4):
            server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])
            report=server.police_service_report(self.staff,advance=True)
            self.assertGreater(report["lastIncidents"],0)
            self.assertGreater(report["lastResponded"],0)
            self.assertLessEqual(report["lastResponded"],2,"Un móvil atiende hasta dos incidentes mensuales.")
            first=report["totalResponded"]+report["totalUnanswered"]
            cash=self.s["money"]
            same=server.police_service_report(self.staff,advance=True)
            self.assertEqual(same["totalResponded"]+same["totalUnanswered"],first)
            self.assertEqual(self.s["money"],cash)
        with patch.object(server,"route_between",return_value=None):
            later=server.police_service_report(self.staff)
            self.assertEqual(later["coveredSites"],0)
        self.s["day"]=61
        with patch.object(server,"route_between",return_value=None):
            report=server.police_service_report(self.staff,advance=True)
            self.assertGreater(report["lastUnanswered"],0)
            self.assertEqual(report["lastResponded"],0)

    def test_no_free_equipment_without_access_or_available_money(self):
        self.s["money"]=5200
        self.s["projects"].append({"cost":2000,"paid":0,"privatePaid":False})
        with patch.object(server,"route_between",return_value=[(4,10)]):
            with self.assertRaisesRegex(ValueError,"Caja libre"):
                server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])
        self.assertNotIn("policeUnit",self.center)
        with patch.object(server,"route_between",return_value=None):
            with self.assertRaisesRegex(ValueError,"conexión vial"):
                server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])

    def test_existing_unanswered_incident_is_dispatched_after_station_opens(self):
        home=next(b for b in self.s["buildings"] if b["kind"]=="home")
        mission={"id":"pending-police-test","x":home["x"],"y":home["y"],"day":self.s["day"],"status":"sin respuesta","location":"Barrio de prueba"}
        self.s.setdefault("police",{})["recentIncidents"]=[mission]
        with patch.object(server,"route_between",return_value=[(4,10),(5,10),(6,10)]):
            server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])
            server.police_service_report(self.staff,advance=True)
            self.assertEqual(mission["status"],"en respuesta")
            self.assertEqual(mission["stationX"],self.center["x"])
            self.s["day"]+=1
            server.police_service_report(self.staff,advance=True)
            self.assertEqual(mission["status"],"atendido")

if __name__=="__main__":
    unittest.main()
