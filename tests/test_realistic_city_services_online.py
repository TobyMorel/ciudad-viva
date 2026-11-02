"""Regresiones: servicios reales y pérdidas definitivas por incendios."""
import unittest
import server


class CityInfrastructureOnline(unittest.TestCase):
    def setUp(self):
        server.state = server.new_settlement_state()
        self.city = server.state
        self.city["roads"] = [[4, 10], [5, 10], [6, 10]]
        utilities = server.ensure_utility_state()
        for key in ("powerLines", "waterPipes", "sewerLines", "gasLines", "telecomLines"):
            utilities[key] = [tile[:] for tile in self.city["roads"]]

    def test_no_free_supply_and_scalable_generation(self):
        home = {"x": 6, "y": 9, "kind": "home", "name": "Barrio de ensayo",
                "occupants": 10, "capacity": 40, "status": "habilitado", "quality": 82}
        self.city["buildings"].append(home)
        empty = server.calculate_utility_balance()
        self.assertEqual(empty["power"]["installedKw"], 0)
        self.assertEqual(empty["water"]["installedM3Day"], 0)
        self.assertEqual(empty["gas"]["capacityM3Day"], 0)
        self.assertEqual(home["utilityAccess"]["powerServedPct"], 0)
        self.assertEqual(home["utilityAccess"]["waterServedPct"], 0)
        self.assertEqual(home["utilityAccess"]["gasServedPct"], 0)
        self.city["buildings"].extend([
            {"x": 4, "y": 9, "kind": "powerPlant", "status": "habilitado", "quality": 82, "generationKw": 900},
            {"x": 4, "y": 11, "kind": "waterPlant", "status": "habilitado", "quality": 82, "treatmentM3Day": 220},
        ])
        partial = server.calculate_utility_balance()
        self.assertGreater(partial["power"]["installedKw"], 0)
        self.assertGreater(partial["water"]["installedM3Day"], 0)
        self.assertEqual(partial["gas"]["capacityM3Day"], 0, "Las tuberías no producen gas")
        self.city["buildings"].append(
            {"x": 5, "y": 9, "kind": "gasPlant", "status": "habilitado", "quality": 82, "gasCapacityM3Day": 160})
        connected = server.calculate_utility_balance()
        self.assertGreater(connected["gas"]["capacityM3Day"], 0)
        self.assertGreater(home["utilityAccess"]["gasServedPct"], 0)
        first = (connected["power"]["demandKw"], connected["water"]["demandM3Day"], connected["gas"]["demandM3Day"])
        home["occupants"] = 40
        grown = server.calculate_utility_balance()
        second = (grown["power"]["demandKw"], grown["water"]["demandM3Day"], grown["gas"]["demandM3Day"])
        self.assertTrue(all(a < b for a, b in zip(first, second)))

    def test_fatal_fire_destroys_building_and_sends_absent_survivor_to_shelter_queue(self):
        self.city["population"] = 2
        self.city["day"] = 1
        self.city["timeOfDayMinutes"] = 700
        residents = [
            {"id": "trabajador-fuera", "age": 30, "workerEligible": True,
             "status": "empleado", "employerId": "oficina", "employerName": "Oficina"},
            {"id": "vecino-dentro", "age": 14, "workerEligible": False, "status": "inactivo"},
        ]
        self.city["buildings"] = [{
            "x": 5, "y": 9, "kind": "home", "name": "Casa incendiada",
            "status": "habilitado", "occupants": 2, "capacity": 2, "residents": residents, "quality": 82}]
        fire = self.city["fireService"]
        fire["lastGeneratedMonth"] = 99
        fire["incidents"] = [{
            "id": "fire-test", "x": 5, "y": 9, "name": "Casa incendiada", "buildingKind": "home",
            "startDay": 1, "status": "ardiendo", "damage": 0}]
        for day in range(2, 7):
            self.city["day"] = day
            server.fire_service_report([], advance=True)
        record = fire["incidents"][0]
        self.assertEqual(record["status"], "destruido")
        self.assertEqual(record["deaths"], 1)
        self.assertEqual(record["displaced"], 1)
        self.assertEqual(self.city["population"], 1)
        self.assertFalse(self.city["buildings"])
        self.assertEqual(len(fire["ruins"]), 1)
        self.assertTrue(self.city["socialServices"]["shelterResidents"])
        self.assertEqual(self.city["urbanEvolution"]["deceased"][-1]["cause"], "incendio")

    def test_fire_engine_must_travel_before_resolution(self):
        self.city["day"] = 2
        self.city["buildings"] = [
            {"x": 5, "y": 9, "kind": "home", "name": "Objetivo", "status": "habilitado",
             "occupants": 0, "capacity": 5, "quality": 82},
            {"x": 4, "y": 9, "kind": "fireStation", "name": "Cuartel", "serviceModel": "firePost",
             "status": "habilitado", "dispatchReadyDay": 2, "fireEngineCapacity": 1, "quality": 82},
        ]
        fire = self.city["fireService"]
        fire["lastGeneratedMonth"] = 99
        fire["incidents"] = [{"id": "fire-target", "x": 5, "y": 9, "name": "Objetivo",
                              "buildingKind": "home", "startDay": 1, "status": "ardiendo"}]
        crew = [{"kind": "fireStation", "x": 4, "y": 9, "staffedJobs": 8}]
        dispatched = server.fire_service_report(crew, advance=True)
        self.assertEqual(dispatched["dispatches"], 1)
        self.assertEqual(dispatched["resolved"], 0)
        self.assertEqual(fire["incidents"][0]["arrivalDay"], 3)
        self.assertTrue(fire["incidents"][0]["responseRoute"])
        self.city["day"] = 3
        arrived = server.fire_service_report(crew, advance=True)
        self.assertEqual(arrived["resolved"], 1)
        self.assertEqual(fire["incidents"][0]["status"], "controlado")


if __name__ == "__main__":
    unittest.main()
