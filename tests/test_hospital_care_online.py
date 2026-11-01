import unittest
from unittest.mock import patch
import server

class HospitalCareOnline(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.ensure_supply_state()
        server.ensure_finance_state()
        self.s=server.state
        self.s["money"]=60000
        self.center=next(b for b in self.s["buildings"] if b["kind"]=="civic")
        self.center["utilityAccess"]={"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100}
        for h in self.s["buildings"]:
            if h["kind"]=="home":
                h["utilityAccess"]={"waterServedPct":100,"wastewaterTreatedPct":100}
        self.homes=[h for h in self.s["buildings"] if h["kind"]=="home" and h.get("occupants",0)>0]
        self.staff=[{"kind":"civic","x":self.center["x"],"y":self.center["y"],"staffedJobs":18}]

    def test_ward_needs_staff_capacity_and_cost(self):
        with patch.object(server,"route_between",return_value=[(0,0)]*4):
            before=self.s["money"]
            server.invest_hospital_care("openHospitalWard",self.center["x"],self.center["y"])
            self.assertEqual(self.s["money"],before-7200)
            report=server.hospital_care_report([],self.homes)
            self.assertEqual(report["admittedPerDay"],0,"El equipamiento sin profesionales no opera.")
            with self.assertRaisesRegex(ValueError,"ya dispone"):
                server.invest_hospital_care("openHospitalWard",self.center["x"],self.center["y"])
            staffed=server.hospital_care_report(self.staff,self.homes)
            self.assertGreater(staffed["admittedPerDay"],0)
            self.assertGreater(staffed["monthlyOperatingCost"],0)
            server.invest_hospital_care("expandHospitalWard",self.center["x"],self.center["y"])
            self.assertEqual(self.center["hospitalWard"]["beds"],20)
            self.assertEqual(self.s["money"],before-7200-4600)

    def test_ambulance_requires_roads_teams_and_capacity(self):
        with patch.object(server,"route_between",return_value=[(0,0)]*14):
            server.invest_hospital_care("openHospitalWard",self.center["x"],self.center["y"])
            no_vehicle=server.hospital_care_report(self.staff,self.homes)
            self.assertEqual(no_vehicle["admittedPerDay"],0,"Los barrios alejados necesitan traslado.")
            server.invest_hospital_care("addAmbulance",self.center["x"],self.center["y"])
            covered=server.hospital_care_report(self.staff,self.homes)
            self.assertGreater(covered["ambulanceTransfersPerDay"],0)
            self.assertLessEqual(covered["ambulanceTransfersPerDay"],2)
            self.assertEqual(covered["hospitals"][0]["activeAmbulances"],1)
            health=self.s.setdefault("health",{})
            server.hospital_care_report(self.staff,self.homes,advance=True)
            once=health["hospitalBacklog"]
            server.hospital_care_report(self.staff,self.homes,advance=True)
            self.assertEqual(health["hospitalBacklog"],once,"Las consultas del mismo día no duplican cola.")
        with patch.object(server,"route_between",return_value=None):
            cut=server.hospital_care_report(self.staff,self.homes)
            self.assertEqual(cut["admittedPerDay"],0)
            self.assertGreater(cut["waitingPerDay"],0)

    def test_investment_respects_reserved_public_projects(self):
        self.s["money"]=8000
        self.s["projects"].append({"cost":2000,"paid":0,"privatePaid":False})
        with patch.object(server,"route_between",return_value=[(0,0)]):
            with self.assertRaisesRegex(ValueError,"Fondos libres"):
                server.invest_hospital_care("openHospitalWard",self.center["x"],self.center["y"])
        self.assertEqual(self.s["money"],8000)
        self.assertNotIn("hospitalWard",self.center)

if __name__=="__main__":
    unittest.main()
