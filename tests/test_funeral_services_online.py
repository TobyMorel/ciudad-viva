"""Mortalidad poblacional y capacidad funeraria por rutas/cupo, Online."""
import unittest
from unittest.mock import patch
import server


class FuneralServicesOnline(unittest.TestCase):
    def setUp(self):
        server.state = server.initial_state()
        home = {"kind": "home", "name": "Hogar", "x": 4, "y": 11, "occupants": 1,
                "capacity": 1, "quality": 90, "residents": [{"id": "resident-115", "name": "Elena",
                "age": 114, "workerEligible": False, "status": "jubilado"}]}
        server.state["buildings"] = [home]
        server.state["population"] = 1
        server.state["day"] = 361
        server.state["urbanEvolution"] = {"lastProcessedYear": 2026, "lastBirthYear": 2026, "history": [], "deceased": []}
        self.home = home

    def test_mortality_dispatches_hearse_and_buries_after_road_journey(self):
        server.advance_urban_evolution()
        record = server.state["urbanEvolution"]["deceased"][0]
        self.assertEqual(record["age"], 115)
        self.assertEqual(record["disposition"], "en espera")
        self.assertEqual((server.state["population"], self.home["occupants"], len(self.home["residents"])), (0, 0, 0))
        cemetery = {"kind": "civic", "name": "Cementerio", "serviceModel": "cemetery", "x": 5, "y": 10,
                    "status": "habilitado"}
        server.state["buildings"].append(cemetery)
        with patch.object(server, "route_between", return_value=[[4, 10], [5, 10]]):
            server.advance_urban_evolution()  # Same year: queued remains process each day.
        self.assertEqual(record["funeralPreference"], "cemetery")
        self.assertEqual(record["disposition"], "en traslado")
        self.assertEqual(record["funeralTrip"]["kind"], "cemetery")
        self.assertGreaterEqual(len(record["funeralTrip"]["route"]), 3)
        server.state["day"] += 1
        server.process_funeral_queue(2027)
        self.assertEqual(record["disposition"], "sepultado")
        self.assertEqual(len(cemetery["funeralService"]["burials"]), 1)
        self.assertEqual(server.urban_evolution_report()["cemeteryOccupied"], 1)

    def test_full_cemetery_falls_back_to_annual_crematorium_capacity(self):
        cemetery = {"kind": "civic", "name": "Cementerio lleno", "serviceModel": "cemetery", "x": 5, "y": 10,
                    "status": "habilitado", "funeralService": {"burials": [{"residentId": str(i)} for i in range(120)]}}
        crematorium = {"kind": "civic", "name": "Crematorio", "serviceModel": "crematorium", "x": 6, "y": 10,
                       "status": "habilitado"}
        server.state["buildings"] = [cemetery, crematorium]
        server.state["urbanEvolution"]["deceased"] = [{"residentId": "r", "name": "Elena", "age": 115, "year": 2027,
            "homeX": 4, "homeY": 11, "disposition": "en espera"}]
        with patch.object(server, "route_between", return_value=[[4, 10], [5, 10]]):
            server.process_funeral_queue(2027)
        record = server.state["urbanEvolution"]["deceased"][0]
        self.assertEqual(record["funeralPreference"], "crematorium")
        self.assertEqual(record["disposition"], "en traslado")
        server.state["day"] += 1
        server.process_funeral_queue(2027)
        self.assertEqual(record["disposition"], "cremado")
        self.assertEqual(crematorium["funeralService"]["cremationsThisYear"], 1)
        self.assertEqual(server.urban_evolution_report()["awaitingFuneral"], 0)

    def test_family_cremation_preference_does_not_fall_back_to_a_cemetery(self):
        cemetery = {"kind": "civic", "name": "Cementerio", "serviceModel": "cemetery", "x": 5, "y": 10, "status": "habilitado"}
        server.state["buildings"] = [cemetery]
        server.state["urbanEvolution"]["deceased"] = [{"residentId": "family-choice", "name": "Ana", "age": 90,
            "year": 2027, "homeX": 4, "homeY": 11, "disposition": "en espera", "funeralPreference": "crematorium"}]
        with patch.object(server, "route_between", return_value=[[4, 10], [5, 10]]):
            server.process_funeral_queue(2027)
        record = server.state["urbanEvolution"]["deceased"][0]
        self.assertEqual(record["disposition"], "en espera")
        self.assertIn("no hay ninguno construido", record["waitReason"])
        self.assertEqual(server.urban_evolution_report()["funeralTrips"], 0)

    def test_facility_radius_uses_road_distance(self):
        crematorium = {"kind": "civic", "name": "Crematorio distante", "serviceModel": "crematorium", "x": 20, "y": 10, "status": "habilitado"}
        server.state["buildings"] = [crematorium]
        server.state["urbanEvolution"]["deceased"] = [{"residentId": "family-crem", "name": "Ana", "age": 90,
            "year": 2027, "homeX": 4, "homeY": 11, "disposition": "en espera", "funeralPreference": "crematorium"}]
        route=[[x,10] for x in range(4,22)]
        with patch.object(server, "route_between", return_value=route):
            server.process_funeral_queue(2027)
        record=server.state["urbanEvolution"]["deceased"][0]
        self.assertEqual(record["disposition"], "en espera")
        self.assertIn("alcance vial (16 cuadras)", record["waitReason"])

    def test_service_catalog_exposes_bounded_funeral_capacity(self):
        self.assertEqual(server.SERVICE_MODELS["cemetery"]["graveCapacity"], 120)
        self.assertEqual(server.SERVICE_MODELS["crematorium"]["annualCapacity"], 24)

    def test_cremation_capacity_resets_at_simulated_new_year(self):
        crematorium = {"kind": "civic", "name": "Crematorio", "serviceModel": "crematorium", "x": 6, "y": 10,
                       "status": "habilitado", "funeralService": {"year": 2026, "cremationsThisYear": 24, "totalCremations": 24}}
        server.state["day"] = 361
        server.state["buildings"] = [crematorium]
        server.ensure_urban_evolution_state()
        self.assertEqual(crematorium["funeralService"]["year"], 2027)
        self.assertEqual(crematorium["funeralService"]["cremationsThisYear"], 0)
        self.assertEqual(crematorium["funeralService"]["totalCremations"], 24)
