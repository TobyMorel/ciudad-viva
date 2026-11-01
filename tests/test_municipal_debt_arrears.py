"""La mora municipal conserva cuotas, principal y calendario de recuperación."""
import unittest
import server


class MunicipalDebtArrears(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        self.loan={'id':'municipal-test','status':'active','balance':10000,'payment':500,
                   'monthsRemaining':4,'monthlyRate':.01,'paymentArrears':800,'delinquentMonths':2}
        server.state['finance']['municipalLoans']=[self.loan]
        server.state['money']=10000

    def test_monthly_service_includes_one_arrears_recovery_installment(self):
        report=server.municipal_finance_report(10000,3000)
        self.assertEqual(report['monthlyDebtService'],1000)
        self.assertEqual(server.municipal_loan_due(self.loan),1000)

    def test_funded_recovery_reduces_arrears_and_amortizes_only_scheduled_principal(self):
        paid=server.municipal_debt_payment()
        self.assertEqual(paid,1000)
        self.assertEqual(self.loan['lastScheduledPayment'],500)
        self.assertEqual(self.loan['lastArrearsPayment'],500)
        self.assertEqual(self.loan['paymentArrears'],300)
        self.assertEqual(self.loan['balance'],9600)
        self.assertEqual(self.loan['monthsRemaining'],3)

    def test_default_transfers_due_installment_to_arrears_without_amortization(self):
        balance=self.loan['balance'];missed=server.municipal_debt_missed_payment()
        self.assertEqual(missed,500)
        self.assertEqual(self.loan['paymentArrears'],1300)
        self.assertEqual(self.loan['balance'],balance)
        self.assertEqual(self.loan['monthsRemaining'],4)
        self.assertEqual(self.loan['delinquentMonths'],3)

    def test_arrears_remain_due_after_regular_term_until_paid(self):
        self.loan['monthsRemaining']=0
        self.assertEqual(server.municipal_loan_due(self.loan),500)
        server.municipal_debt_payment()
        self.assertEqual(self.loan['monthsRemaining'],0)
        self.assertEqual(self.loan['paymentArrears'],300)
        self.assertEqual(self.loan['status'],'active')
