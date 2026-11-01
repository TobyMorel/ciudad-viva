"""La refinanciación baja cuota con un mayor costo futuro y no acredita caja."""
import unittest
import server

class MunicipalRefinancing(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state();server.state['money']=12345
        self.loan={'id':'mun-refi','status':'active','principal':10000,'balance':7200,'payment':950,
                   'monthsRemaining':8,'termMonths':12,'annualRate':.12,'monthlyRate':.01,
                   'paymentArrears':1900,'delinquentMonths':2}
        server.state['finance']['municipalLoans']=[self.loan]
    def test_restructures_arrears_without_creating_cash_and_reports_higher_cost(self):
        cash=server.state['money'];record=server.refinance_municipal_loan('mun-refi')
        self.assertEqual(server.state['money'],cash)
        self.assertEqual(self.loan['balance'],9100)
        self.assertEqual(self.loan['paymentArrears'],0)
        self.assertEqual(self.loan['monthsRemaining'],72)
        self.assertLess(record['newMonthlyPayment'],record['oldMonthlyPayment'])
        self.assertGreater(record['newTotalScheduled'],record['oldRemainingScheduled'])
        self.assertEqual(record['arrearsRolledIn'],1900)
    def test_refinancing_is_one_time_only(self):
        server.refinance_municipal_loan('mun-refi')
        with self.assertRaisesRegex(ValueError,'ya fue refinanciado'):
            server.refinance_municipal_loan('mun-refi')
    def test_short_loan_is_not_refinanced(self):
        self.loan['monthsRemaining']=3
        with self.assertRaisesRegex(ValueError,'tres cuotas o menos'):
            server.refinance_municipal_loan('mun-refi')
if __name__=='__main__':unittest.main()
