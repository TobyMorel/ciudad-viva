"""Los salarios y el alquiler usan una caja familiar trazable, sin duplicar ingresos."""
import unittest

import server


class HouseholdFinanceWallets(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.state.update({"day":61,"buildings":[],"landClaims":{"parcelDeeds":{}},"housingRentCollectedLastMonth":0,"housingOwnerIncomeLastMonth":0,"municipalPropertyIncomeLastMonth":0})

    def test_wage_funds_household_once_then_rent_uses_available_wallet(self):
        resident={"id":"worker-1","housingContractId":"lease-1","monthlyWage":30,"status":"empleado"}
        contract={"id":"lease-1","residentIds":["worker-1"],"tenure":"inquilina","familyCash":30,"initialSavings":30,"monthlyRent":50,"rentArrears":20,"missedRentMonths":1}
        home={"x":6,"y":10,"kind":"home","name":"Casa familiar","zonedDevelopment":True,"ownerType":"private","occupants":1,"householdCash":50,"residents":[resident],"housingContracts":[contract]}
        server.state["buildings"]=[home]
        server.credit_household_wage(home,resident,30)
        self.assertEqual(home["householdCash"],80)
        self.assertEqual(home["monthlyWageIncome"],30)
        self.assertEqual(contract["familyCash"],60)
        server.settle_property_owner_income()
        self.assertEqual(contract["lastRentDue"],70)
        self.assertEqual(contract["lastRentPaid"],60)
        self.assertEqual(contract["rentArrears"],10)
        self.assertEqual(contract["familyCash"],0)
        self.assertEqual(home["householdCash"],20)
        self.assertEqual(home["privateOwnerIncome"],60)


if __name__=="__main__":unittest.main()
