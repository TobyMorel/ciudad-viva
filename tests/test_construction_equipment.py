"""La flota especializada se reserva por orden de contratación de cada obra."""
import unittest

import server


class ConstructionEquipment(unittest.TestCase):
    def setUp(self):
        self.previous_state = server.state
        server.state = server.initial_state()
        server.state["projects"] = [
            {"id": "older-road", "kind": "road", "contractor": "Sur Obras",
             "status": "contratada", "contractedDay": 2, "contractedMinute": 0},
            {"id": "newer-road", "kind": "road", "contractor": "Sur Obras",
             "status": "contratada", "contractedDay": 3, "contractedMinute": 0},
        ]

    def tearDown(self):
        server.state = self.previous_state

    def test_older_project_reserves_equipment_and_release_unblocks_next_project(self):
        older, newer = server.state["projects"]
        self.assertTrue(server.project_equipment_status(older)["available"])
        waiting = server.project_equipment_status(newer)
        self.assertFalse(waiting["available"])
        self.assertEqual(set(waiting["missing"]), {"earthmover", "paver"})
        newer["equipmentStatus"] = "limited"
        report = server.construction_equipment_report()["Sur Obras"]
        self.assertEqual(report["activeProjects"], 2)
        self.assertEqual(report["waitingProjects"], 1)
        older["status"] = "finalizada"
        self.assertTrue(server.project_equipment_status(newer)["available"])

    def test_legacy_projects_without_schedule_fields_still_get_a_stable_priority(self):
        projects = server.state["projects"]
        projects[0].pop("contractedMinute")
        projects[1]["contractedDay"] = projects[0]["contractedDay"]
        projects[1]["contractedMinute"] = 20
        self.assertTrue(server.project_equipment_status(projects[0])["available"])
        self.assertFalse(server.project_equipment_status(projects[1])["available"])


if __name__ == "__main__":
    unittest.main()
