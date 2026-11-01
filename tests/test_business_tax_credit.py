"""La mora fiscal de una empresa limita el crédito que puede usar para operar."""
import unittest
import server


class BusinessTaxCreditTests(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.state['taxes']['arrearsByAsset']={'business-test':250}
        self.firm={'id':'business-test','creditLimit':1000,'creditDebt':100,'taxDelinquencyMonths':2,'cash':0}

    def test_tax_arrears_encumber_credit_dollar_for_dollar(self):
        self.assertEqual(server.business_credit_limit_after_tax(self.firm),750)
        self.assertEqual(server.draw_business_credit(self.firm,900),650)
        self.assertEqual(self.firm['creditDebt'],750)

    def test_three_missed_tax_closures_freeze_new_credit_until_tax_is_current(self):
        self.firm['taxDelinquencyMonths']=3
        self.assertEqual(server.business_credit_limit_after_tax(self.firm),0)
        server.state['taxes']['arrearsByAsset']['business-test']=0
        self.firm['taxDelinquencyMonths']=0
        self.assertEqual(server.business_credit_limit_after_tax(self.firm),1000)

    def test_tax_collection_emits_credit_suspension_and_reinstatement(self):
        shop={'x':3,'y':4,'kind':'shop','name':'Almacén de prueba','status':'operativo','business':{**self.firm,'status':'abierto','cash':0,'lastRevenue':100}}
        server.state['buildings']=[shop]
        server.state['taxes'].update({'businessRateBp':500,'lastProcessedMonth':-1,'arrearsByAsset':{}})
        for day in (1,31,61):
            server.state['day']=day
            server.collect_municipal_taxes()
        self.assertEqual(shop['business']['taxAdjustedCreditLimit'],0)
        self.assertTrue(any(e['title']=='Crédito comercial suspendido por mora tributaria' for e in server.state['events']))
        shop['business']['cash']=10000;shop['business']['lastRevenue']=0;server.state['day']=91
        server.collect_municipal_taxes()
        self.assertEqual(shop['business']['taxAdjustedCreditLimit'],1000)
        self.assertTrue(any(e['title']=='Crédito comercial restablecido' for e in server.state['events']))


if __name__=='__main__':
    unittest.main()
