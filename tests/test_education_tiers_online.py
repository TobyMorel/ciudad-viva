import unittest
from unittest.mock import patch
import server

class EducationTiers(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.ensure_finance_state()
        server.state["education"]={"lastProcessedMonth":-1}

    def test_four_tiers_increase_capacity_and_costs(self):
        models=server.SCHOOL_MODELS
        self.assertEqual(set(models),{"kindergarten","primarySchool","secondarySchool","university"})
        self.assertEqual([models[k]["minAge"] for k in models],[5,7,13,18])
        self.assertEqual([models[k]["maxAge"] for k in models],[6,12,17,24])
        self.assertEqual([models[k]["cost"] for k in models],sorted(m["cost"] for m in models.values()))
        self.assertTrue(all(m["jobs"]>0 and m["monthlyCost"]>0 for m in models.values()))

    def test_real_university_attendance_and_idempotent_studies(self):
        student={"id":"student20","age":20,"workerEligible":True,"skills":{"salud":30}}
        server.state["buildings"].append({"kind":"home","x":10,"y":10,"occupants":1,"residents":[student]})
        server.state["buildings"].append({"kind":"school","serviceModel":"university","x":10,"y":11,"name":"Universidad",
            "status":"habilitado","classrooms":8,
            "utilityAccess":{"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100}})
        teachers=[{"kind":"school","x":10,"y":11,"staffedJobs":2}]
        with patch.object(server,"route_between",return_value=[[10,10],[10,11]]):
            self.assertEqual(server.education_service_report([])["enrolled"],0)
            for month in range(12):
                server.state["day"]=1+month*30
                r=server.education_service_report(teachers,advance=True)
                self.assertEqual(r["schools"][-1]["ageMin"],18)
                self.assertGreaterEqual(r["enrolled"],1)
            previous=student["educationProgress"]["months"]
            server.education_service_report(teachers,advance=True)
        self.assertEqual(student["educationProgress"]["months"],previous)
        self.assertEqual(student["educationProgress"]["level"],"universidad")
        self.assertGreater(student["skills"]["salud"],30)
        with patch.object(server,"route_between",return_value=None):
            self.assertEqual(server.education_service_report(teachers)["enrolled"],0)

    def test_wrong_age_cannot_take_university_place(self):
        student={"id":"child6","age":6,"workerEligible":False}
        server.state["buildings"].append({"kind":"home","x":10,"y":10,"occupants":1,"residents":[student]})
        server.state["buildings"].append({"kind":"school","serviceModel":"university","x":10,"y":11,"status":"habilitado",
            "classrooms":8,"utilityAccess":{"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100}})
        with patch.object(server,"route_between",return_value=[[10,10],[10,11]]):
            report=server.education_service_report([{"kind":"school","x":10,"y":11,"staffedJobs":10}])
            self.assertEqual(report["enrolled"],0)

if __name__=="__main__":
    unittest.main()
