import unittest
import server

class FactoryExports(unittest.TestCase):
    def setUp(self):
        self.old=server.state
        server.state=server.new_settlement_state()

    def tearDown(self):
        server.state=self.old

    def test_factory_surplus_uses_real_road_route_and_pays_producer_on_arrival(self):
        state=server.state
        state['roads']=[[x,10] for x in range(4,24)]
        factory={'kind':'factory','x':6,'y':10,'name':'Procesadora local','status':'habilitado',
          'business':{'id':'food-export-1','name':'Procesadora local','industryType':'food','status':'abierto','cash':1000}}
        state['buildings']=[factory]
        state['supply']['market']['Fábrica local 7-11']={'stock':100,'maxStock':100,'commodity':'alimentos','unitCost':4}
        state['day']=1
        server.queue_factory_exports()
        order=state['supply']['factoryExportOrders'][0]
        self.assertEqual(order['mode'],'land')
        self.assertEqual(order['originType'],'factory')
        self.assertEqual(order['route'][0],[6,10])
        self.assertEqual(order['route'][-1],[23,10])
        self.assertEqual(state['supply']['market']['Fábrica local 7-11']['stock'],70)
        initial=factory['business']['cash']
        for day in range(1,5):
            state['day']=day
            server.process_factory_exports()
        self.assertEqual(order['status'],'exportado')
        self.assertTrue(order['settled'])
        self.assertGreater(factory['business']['cash'],initial)
        self.assertEqual(state['localIndustry']['exportedUnits'],30)

if __name__=='__main__':unittest.main()
