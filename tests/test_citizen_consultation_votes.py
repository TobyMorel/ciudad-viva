"""La votación online en consultas queda separada de la muestra vecinal."""
import unittest
import re

import server


class CitizenConsultationVotes(unittest.TestCase):
    def setUp(self):
        self.previous_state = server.state
        server.state = server.initial_state()
        server.state.update({
            "day": 1,
            "money": 10000,
            "population": 2,
            "projects": [],
            "buildings": [{
                "kind": "home", "name": "Hogares del Oeste", "x": 8, "y": 9,
                "status": "operativo", "capacity": 2, "occupants": 2,
                "quality": 80,
                "residents": [
                    {"id": "resident-a", "age": 34, "workerEligible": True,
                     "status": "empleado", "monthlyWage": 120},
                    {"id": "resident-b", "age": 42, "workerEligible": True,
                     "status": "buscando", "monthlyWage": 80},
                ],
            }],
        })

    def tearDown(self):
        server.state = self.previous_state

    def test_online_players_are_snapshotted_and_can_vote_once(self):
        poll = server.start_government_consultation("oeste", "employment", [
            {"id": "player-a", "name": "Abril"},
            {"id": "player-b", "name": "Matías"},
            {"id": "player-a", "name": "Duplicado"},
        ])
        self.assertEqual([row["id"] for row in poll["playerParticipants"]],
                         ["player-a", "player-b"])
        server.record_government_consultation_vote(poll["id"], "player-a", "yes")
        with self.assertRaisesRegex(ValueError, "ya fue registrado"):
            server.record_government_consultation_vote(poll["id"], "player-a", "no")
        with self.assertRaisesRegex(ValueError, re.compile("no estabas conectado", re.I)):
            server.record_government_consultation_vote(poll["id"], "outsider", "yes")
        server.record_government_consultation_vote(poll["id"], "player-b", "no")
        server.state["day"] = poll["deadlineDay"]
        server.advance_government_consultations()
        result = poll["result"]
        self.assertEqual(result["playerParticipation"]["eligible"], 2)
        self.assertEqual(result["playerParticipation"]["voted"], 2)
        self.assertEqual((result["playerParticipation"]["yes"],
                          result["playerParticipation"]["no"]), (1, 1))
        self.assertEqual(result["yes"] + result["no"], result["respondents"])

    def test_vote_rejects_invalid_choice_and_closed_poll(self):
        poll = server.start_government_consultation(
            "oeste", "housing", [{"id": "player-a", "name": "Abril"}])
        with self.assertRaisesRegex(ValueError, "a favor o en contra"):
            server.record_government_consultation_vote(poll["id"], "player-a", "maybe")
        poll["status"] = "cerrada"
        with self.assertRaisesRegex(ValueError, "cerró o no existe"):
            server.record_government_consultation_vote(poll["id"], "player-a", "yes")


if __name__ == "__main__":
    unittest.main()
