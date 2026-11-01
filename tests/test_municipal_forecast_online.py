"""Previsión fiscal móvil: impuestos, obras y deuda sin alterar la caja real."""
import copy
import unittest
import server


class MunicipalForecast(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        self.s=server.state
        self.s['day']=121
        self.s['money']=25000
        self.s['monthlyIncome']=12000
        self.s['monthlyExpenses']=8000

    def test_twelve_months_include_commitments_and_do_not_mutate_city(self):
        self.s['projects']=[{'id':'municipal-1','cost':12000,'paid':2000,'duration':90,'elapsed':30,'status':'en curso'}]
        self.s['finance']['municipalLoans']=[{'id':'loan-1','status':'active','balance':6000,'payment':550,'monthsRemaining':12,'monthlyRate':.01}]
        before=copy.deepcopy((self.s['money'],self.s['projects'],self.s['finance']['municipalLoans']))
        report=server.municipal_finance_report(12000,8000);forecast=report['forecastMonths']
        self.assertEqual(len(forecast['months']),12)
        self.assertEqual(forecast['committedProjects'],10000)
        self.assertGreater(forecast['months'][0]['contractPayments'],0)
        self.assertGreater(forecast['months'][0]['debtService'],0)
        self.assertEqual(forecast['months'][0]['closingCash'],forecast['months'][0]['openingCash']+forecast['months'][0]['net'])
        self.assertEqual(before,(self.s['money'],self.s['projects'],self.s['finance']['municipalLoans']))

    def test_tax_rate_changes_the_projected_income(self):
        self.s['taxes']['lastReport']={'collected':100,'propertyBilled':1000,'propertyCollected':500,'businessBilled':500,'businessCollected':250}
        self.s['taxes']['propertyRateBp']=60
        low=server.municipal_finance_report(12000,8000)['forecastMonths']['months'][0]['income']
        self.s['taxes']['propertyRateBp']=120
        high=server.municipal_finance_report(12000,8000)['forecastMonths']['months'][0]['income']
        self.assertGreater(high,low)

    def test_debt_calendar_ends_after_last_installment(self):
        self.s['finance']['municipalLoans']=[{'id':'loan-short','status':'active','balance':100,'payment':120,'monthsRemaining':1,'monthlyRate':.01}]
        months=server.municipal_finance_report(12000,8000)['forecastMonths']['months']
        self.assertGreater(months[0]['debtService'],0)
        self.assertEqual(months[1]['debtService'],0)
