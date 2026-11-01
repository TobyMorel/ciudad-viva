import unittest
from unittest.mock import patch

import server


class SchoolExpansion(unittest.TestCase):
    def setUp(self):
        server.state = server.initial_state()
        server.ensure_finance_state()
        server.state["money"] = 200_000
        self.school = {
            "kind": "school", "serviceModel": "primarySchool", "name": "Escuela del Parque",
            "x": 10, "y": 9, "status": "habilitado", "classrooms": 4, "jobSlots": 12,
            "monthlyCost": 820,
        }
        server.state["buildings"].append(self.school)

    def test_annex_is_a_staged_material_project_and_adds_capacity_only_on_inspection(self):
        starting_money = server.state["money"]
        starting_jobs = server.state["jobs"]
        starting_expenses = server.state["monthlyExpenses"]
        with patch.object(server, "route_between", return_value=[(4, 10), (10, 9)]):
            project = server.contract_school_expansion(10, 9, "Constructora Delta")
        self.assertEqual(project["projectType"], "schoolExpansion")
        self.assertEqual(project["classroomsAdded"], 2)
        self.assertEqual(project["seatsAdded"], 48)
        self.assertEqual(project["teachersAdded"], 3)
        self.assertEqual(project["stages"][-1], "Equipamiento e inspección")
        self.assertGreater(project["materialsRequired"]["steel"], 0)
        self.assertEqual(project["paid"], round(project["cost"] * .2))
        self.assertEqual(starting_money - server.state["money"], project["paid"])
        self.assertEqual(self.school["classrooms"], 4)
        self.assertEqual(self.school["jobSlots"], 12)

        server.complete_school_expansion(project, 86)
        self.assertEqual(self.school["classrooms"], 6)
        self.assertEqual(self.school["jobSlots"], 15)
        self.assertEqual(self.school["monthlyCost"], 1440)
        self.assertEqual(server.state["jobs"] - starting_jobs, 3)
        self.assertEqual(server.state["monthlyExpenses"] - starting_expenses, 620)
        self.assertEqual(self.school["expansionHistory"][-1]["quality"], 86)
        self.assertIn("48 plazas físicas", server.state["events"][0]["detail"])

    def test_requires_operating_school_road_access_and_one_active_annex(self):
        with patch.object(server, "route_between", return_value=None):
            with self.assertRaisesRegex(ValueError, "acceso vial"):
                server.contract_school_expansion(10, 9, "Constructora Delta")
        with patch.object(server, "route_between", return_value=[(4, 10), (10, 9)]):
            project = server.contract_school_expansion(10, 9, "Constructora Delta")
            with self.assertRaisesRegex(ValueError, "ya tiene un anexo"):
                server.contract_school_expansion(10, 9, "Sur Obras")
            self.school["classrooms"] = 10
            server.state["projects"].clear()
            with self.assertRaisesRegex(ValueError, "límite de ampliación"):
                server.contract_school_expansion(10, 9, "Constructora Delta")

    def test_annex_runs_through_real_daily_material_and_certificate_pipeline(self):
        school = {
            "kind": "school", "serviceModel": "primarySchool", "name": "Escuela Integral",
            "x": 10, "y": 11, "status": "habilitado", "classrooms": 4, "jobSlots": 12,
            "monthlyCost": 820,
        }
        server.state["buildings"].append(school)
        server.state["money"] = 200_000
        server.state["paused"] = False
        project = server.contract_school_expansion(10, 11, "Constructora Delta")
        project["changeOrderReviewed"] = True
        yard = server.state["supply"]["contractors"][project["contractor"]]
        for material in yard:
            yard[material] = project["materialsRequired"].get(material, 0) + 100_000

        with patch.object(server, "assess_contract_delay", return_value=False), patch.object(server, "advance_zoned_development"), patch.object(server, "road_incident_report", return_value={}):
            for _ in range(project["duration"] + 2):
                if not server.state["projects"]:
                    break
                server.tick_one_day()

        self.assertFalse(server.state["projects"], "la obra debe llegar a recepción por el ciclo diario")
        self.assertEqual(school["classrooms"], 6)
        self.assertEqual(school["jobSlots"], 15)
        self.assertEqual(school["expansionHistory"][-1]["classrooms"], 2)
        self.assertEqual(school["expansionHistory"][-1]["seats"], 48)
        self.assertEqual(school["expansionHistory"][-1]["materialsUsed"], project["materialsRequired"])
        self.assertTrue(any(event["title"] == "Hito de obra certificado" for event in server.state["events"]))
        self.assertTrue(any(event["title"] == "Anexo escolar habilitado" for event in server.state["events"]))


if __name__ == "__main__":
    unittest.main()
