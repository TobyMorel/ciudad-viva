import unittest
import server


class UtilitySourcesNewCity(unittest.TestCase):
    def setUp(self):
        server.state=server.new_settlement_state()
        city=server.state
        city["buildings"].append({"x":5,"y":10,"kind":"home","name":"Casa","status":"habilitado","occupants":4,"capacity":4,"residents":[],"quality":82})

    def test_new_houses_have_no_free_power_water_or_gas(self):
        u=server.calculate_utility_balance()
        home=server.state["buildings"][0]
        self.assertEqual((u["power"]["installedKw"],u["water"]["sourceCapacityM3Day"],u["gas"]["capacityM3Day"]),(0,0,0))
        self.assertEqual((home["utilityAccess"]["powerServedPct"],home["utilityAccess"]["waterServedPct"],home["utilityAccess"]["gasServedPct"]),(0,0,0))

    def test_more_plants_add_capacity_for_more_homes(self):
        buildings=server.state["buildings"]
        buildings.extend([
            {"x":4,"y":9,"kind":"powerPlant","status":"habilitado","quality":82,"generationKw":900},
            {"x":4,"y":11,"kind":"waterPlant","status":"habilitado","quality":82,"treatmentM3Day":220},
            {"x":3,"y":10,"kind":"gasPlant","status":"habilitado","quality":82,"gasCapacityM3Day":160},
        ])
        report=server.calculate_utility_balance()
        self.assertEqual((report["power"]["installedKw"],report["water"]["sourceCapacityM3Day"],report["gas"]["capacityM3Day"]),(900,220,160))
        self.assertEqual(buildings[0]["utilityAccess"]["powerServedPct"],100)
        self.assertEqual(buildings[0]["utilityAccess"]["waterServedPct"],100)
        self.assertEqual(buildings[0]["utilityAccess"]["gasServedPct"],100)


if __name__=="__main__":unittest.main()
