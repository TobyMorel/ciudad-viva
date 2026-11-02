"""Refugio municipal: capacidad financiada, personal, acceso y regreso a vivienda."""
import unittest
from unittest.mock import patch
import server


class SocialShelter(unittest.TestCase):
    def setUp(self):
        server.state = server.initial_state()
        person = {"id": "resident-a", "age": 32, "workerEligible": True, "status": "buscando",
                  "skills": {"salud": 100}, "expectedMonthlyWage": 8, "carAccess": False}
        home = {"kind": "home", "name": "Vivienda completa", "x": 4, "y": 11, "occupants": 1,
                "capacity": 1, "residents": [person], "quality": 90}
        shelter = {"kind": "civic", "name": "Centro de acogida", "serviceModel": "socialShelter",
                   "x": 5, "y": 10, "status": "habilitado", "jobSlots": 12, "monthlyCost": 1180,
                   "socialShelter": {"beds": 30, "residents": []},
                   "utilityAccess": {"powerServedPct": 100, "waterServedPct": 100, "wastewaterTreatedPct": 100}}
        server.state["buildings"] = [home, shelter]
        server.state.update({"population": 1, "jobs": 100, "approval": 69})
        server.state["housingDemand"] = {"unmet": 0, "lastGenerated": 0, "lastFilled": 0}
        server.state["socialServices"]["shelterResidents"] = []
        self.home, self.shelter = home, shelter

    def test_shelter_takes_unhoused_migration_until_a_home_opens_then_rehouses(self):
        workplaces = [{"kind": "civic", "x": 5, "y": 10, "staffedJobs": 10}]
        with patch.object(server, "route_between", return_value=[[4, 10], [5, 10]]), \
             patch.object(server, "commute_model", return_value={"workplaces": workplaces}):
            report = server.update_social_shelters(workplaces, 100)
            self.assertEqual(report["capacity"], 30)
            server.move_households()
            social = server.state["socialServices"]
            sheltered=social["shelterReport"]["sheltered"]
            self.assertGreaterEqual(sheltered,3)
            self.assertEqual(server.state["population"],1+sheltered)
            self.assertGreaterEqual(server.state["housingDemand"]["unmet"],sheltered)
            self.assertTrue(all(p.get("shelterId") == "shelter-5-10" for p in social["shelterResidents"]))
            new_home = {"kind": "home", "name": "Vivienda disponible", "x": 6, "y": 10,
                        "occupants": 0, "capacity": 3, "residents": [], "quality": 90}
            server.state["buildings"].append(new_home)
            server.state["approval"] = 45
            server.state["jobs"] = 0
            server.move_households()
            self.assertEqual(new_home["occupants"], 3)
            self.assertEqual(len(new_home["residents"]), 3)
            self.assertEqual(len(social["shelterResidents"]),sheltered-3)
            self.assertEqual(server.state["population"],1+sheltered,"el traslado de cama a vivienda no duplica población")
            self.assertGreaterEqual(server.state["housingDemand"]["unmet"],4)

    def test_storm_displaces_household_temporarily_and_returns_same_people(self):
        person=self.home["residents"][0]
        server.state["day"]=18
        server.state["population"]=1
        server.state["utilities"]["lastDrainageImpactDay"]=None
        server.state["utilities"]["report"]={"drainage":{"rainfallMm":18,"standingWaterM3Day":80,
            "floodedTiles":[[4,11]],"floodedBuildings":[{"x":4,"y":11,"kind":"home","name":"Vivienda completa","runoffM3":80,"repairCost":60}],"repairCostEstimate":60}}
        server.apply_drainage_impacts()
        social=server.state["socialServices"]
        self.assertEqual(self.home["occupants"],0)
        self.assertEqual(social["shelterResidents"],[person])
        self.assertEqual(social["shelterReport"]["displaced"],1)
        self.assertEqual(server.state["population"],1,"evacuar no cambia el padrón")
        server.state["day"]=self.home["emergencyReturnDay"]
        server.state["jobs"]=0
        with patch.object(server,"route_between",return_value=[[4,10],[5,10]]), \
             patch.object(server,"commute_model",return_value={"workplaces":[{"kind":"civic","x":5,"y":10,"staffedJobs":10}]}), \
             patch.object(server,"tax_adjusted_migration_demand",return_value=0):
            server.move_households()
        self.assertEqual(self.home["occupants"],1)
        self.assertIs(self.home["residents"][0],person)
        self.assertEqual(social["shelterResidents"],[])
        self.assertEqual(server.state["population"],1)

    def test_staff_utilities_access_and_service_funding_limit_beds(self):
        workplaces = [{"kind": "civic", "x": 5, "y": 10, "staffedJobs": 6}]
        with patch.object(server, "route_between", return_value=[[4, 10], [5, 10]]):
            report = server.update_social_shelters(workplaces, 100)
            self.assertEqual(report["capacity"], 18)
            report = server.update_social_shelters(workplaces, 50)
            self.assertEqual(report["capacity"], 9)
            self.shelter["utilityAccess"]["waterServedPct"] = 0
            report = server.update_social_shelters(workplaces, 100)
            self.assertEqual(report["capacity"], 0)
            self.shelter["utilityAccess"]["waterServedPct"] = 100
            with patch.object(server, "route_between", return_value=None):
                report = server.update_social_shelters(workplaces, 100)
            self.assertEqual(report["capacity"], 0)


if __name__ == "__main__":
    unittest.main()
