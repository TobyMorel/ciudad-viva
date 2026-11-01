"""Impuesto soportado por el flujo de caja modifica atractivo residencial y apoyo."""
import unittest
import server


class TaxPressureTests(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()

    def test_high_tax_share_reduces_migration_and_support_by_a_bounded_amount(self):
        self.assertEqual(server.tax_adjusted_migration_demand(80,0),4)
        self.assertEqual(server.tax_adjusted_migration_demand(80,25),0)
        self.assertEqual(server.tax_adjusted_migration_demand(50,25),0)
        self.assertEqual(server.tax_adjusted_migration_demand(30,25),-2)
        server.state['taxes']['lastReport']['pressure']=0
        normal=server.government_districts()[0]
        server.state['taxes']['lastReport']['pressure']=25
        pressured=server.government_districts()[0]
        self.assertEqual(pressured['taxPenalty'],4)
        self.assertEqual(pressured['baseSupport'],normal['baseSupport']-4)

    def test_tax_report_pressure_uses_paid_tax_over_observed_household_and_sales_flow(self):
        home={'x':1,'y':1,'kind':'home','occupants':10,'capacity':10,'householdCash':100,'monthlyWageIncome':1,'residents':[]}
        server.state['buildings']=[home]
        server.state['taxes'].update({'propertyRateBp':140,'lastProcessedMonth':-1,'arrearsByAsset':{}})
        report=server.collect_municipal_taxes()
        self.assertEqual(report['propertyCollected'],28)
        self.assertEqual(report['householdWageIncome'],1)
        self.assertEqual(report['pressure'],97)


if __name__=='__main__':
    unittest.main()
