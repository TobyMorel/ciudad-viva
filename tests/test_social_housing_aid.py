"""La ayuda habitacional municipal paga mora real con apropiación limitada."""
import unittest
import server


class SocialHousingAid(unittest.TestCase):
    def setUp(self):
        server.state = server.initial_state()
        server.state["socialServices"]["housingAidBudget"] = 150
        self.poor = {"kind": "home", "x": 2, "y": 3, "name": "Vivienda A", "adaptiveReuseDay": 1,
                     "occupants": 4, "monthlyWageIncome": 80, "rentalPricePerResident": 24,
                     "rentArrears": 400, "rentalOwnerCash": 0}
        self.other = {"kind": "home", "x": 4, "y": 3, "name": "Vivienda B", "adaptiveReuseDay": 1,
                      "occupants": 4, "monthlyWageIncome": 320, "rentalPricePerResident": 24,
                      "rentArrears": 400, "rentalOwnerCash": 0}
        server.state["buildings"] = [self.other, self.poor]

    def test_cap_prioritizes_lower_income_and_pays_owner_against_real_arrears(self):
        before_cash = self.poor.get("householdCash", 0)
        planned = server.plan_housing_aid()
        self.assertEqual([(x["name"], x["amount"]) for x in planned], [("Vivienda A", 96), ("Vivienda B", 54)])
        report = server.settle_housing_aid(planned, 100)
        self.assertEqual(report["paid"], 150)
        self.assertEqual(self.poor["rentArrears"], 304)
        self.assertEqual(self.poor["rentalOwnerCash"], 96)
        self.assertEqual(self.poor.get("householdCash", 0), before_cash)

    def test_unfunded_services_reduce_aid_without_creating_cash(self):
        planned = server.plan_housing_aid()
        report = server.settle_housing_aid(planned, 50)
        self.assertEqual(report["paid"], 75)
        self.assertEqual(sum(home["rentalOwnerCash"] for home in (self.poor, self.other)), 75)
        self.assertEqual(report["unserved"], 75)

    def test_homes_without_rent_arrears_are_not_eligible(self):
        self.poor["rentArrears"] = 0
        self.other.pop("adaptiveReuseDay")
        self.assertEqual(server.plan_housing_aid(), [])


if __name__ == "__main__":
    unittest.main()
