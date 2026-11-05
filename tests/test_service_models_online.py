import unittest
from unittest.mock import patch
import server

class ServiceConstruction(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.ensure_supply_state()
        server.ensure_finance_state()

    def test_no_free_services_from_municipality(self):
        report=server.health_service_report([])
        self.assertFalse(report["clinics"],"La Municipalidad no es una clínica gratuita.")
        self.assertEqual(report["primary"]["servedPerDay"],0)
        self.assertFalse(server.police_service_report([])["units"])
        self.assertFalse(server.fire_service_report([])["stations"])
        waste=server.calculate_waste_balance()
        self.assertEqual(waste["activeTrucks"],0,"Sin depósito de higiene no hay basureros.")
        town=next(b for b in server.state["buildings"] if b.get("name")=="Municipalidad")
        with self.assertRaisesRegex(ValueError,"centro sanitario"):
            server.invest_hospital_care("openHospitalWard",town["x"],town["y"])
        with self.assertRaisesRegex(ValueError,"comisaría"):
            server.invest_police_unit("openPoliceUnit",town["x"],town["y"])

    def test_service_models_have_monotone_costs_and_road_radii(self):
        families=(("clinic","medicalCenter","generalHospital"),("policePost","policeStation","policeHQ"),
            ("firePost","fireStationPlus","fireCommand"),("wasteYard","wasteDepot","wasteComplex"))
        self.assertGreaterEqual(len(server.SERVICE_MODELS),20)
        self.assertIn("parkingGarage",server.SERVICE_MODELS)
        self.assertEqual(server.SERVICE_MODELS['tvHeadend']['tvConnections'],180)
        self.assertEqual(server.SERVICE_MODELS['wifiHub']['wifiConnections'],160)
        taxi=server.SERVICE_MODELS["taxiYard"]
        self.assertEqual((taxi["kind"],taxi["cost"],taxi["radius"],taxi["taxiCapacity"]),("depot",7200,8,4))
        for family in families:
            models=[server.SERVICE_MODELS[k] for k in family]
            self.assertEqual([m["cost"] for m in models],sorted(m["cost"] for m in models))
            self.assertEqual([m["radius"] for m in models],sorted(m["radius"] for m in models))
            self.assertEqual([m["jobs"] for m in models],sorted(m["jobs"] for m in models))
        shelter=server.SERVICE_MODELS["socialShelter"]
        self.assertEqual((shelter["beds"],shelter["jobs"],shelter["monthlyCost"]),(30,12,1180))
        self.assertTrue(shelter["socialCare"])
        small={"kind":"civic","name":"Consultorio","serviceModel":"clinic","x":10,"y":11,"status":"habilitado"}
        big={**small,"serviceModel":"generalHospital"}
        target={"x":5,"y":9}
        with patch.object(server,"route_between",return_value=[[x,10] for x in range(12)]):
            self.assertIsNone(server.service_route_within(small,target))
            self.assertIsNotNone(server.service_route_within(big,target))
        with patch.object(server,"route_between",return_value=None):
            self.assertIsNone(server.service_route_within(big,target))

    def test_police_station_not_clinic_and_health_center_not_station(self):
        police={"kind":"civic","name":"Comisaría","serviceModel":"policePost","policeUnit":{"vehicles":1},"x":10,"y":11,
                "status":"habilitado","utilityAccess":{"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100}}
        clinic={**police,"name":"Policlínico","serviceModel":"medicalCenter"}
        self.assertFalse(server.service_model(police).get("care",False))
        self.assertFalse(server.service_model(clinic).get("police",False))
        server.state["buildings"].append(police)
        with patch.object(server,"route_between",return_value=[[4,10]]):
            self.assertFalse(server.health_service_report([])["clinics"])
        server.state["buildings"].append(clinic)
        with patch.object(server,"route_between",return_value=[[4,10]]):
            clinics=server.health_service_report([])["clinics"]
        self.assertEqual([x["name"] for x in clinics],["Policlínico"])

if __name__=="__main__":
    unittest.main()
