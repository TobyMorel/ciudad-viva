import unittest
from unittest.mock import patch
import server

class UtilityResponse(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.state['money']=100000
        server.ensure_utility_state()['failures']=[{'id':'outage-1','network':'power','x':8,'y':10,'repairCost':500,'affectedBuildings':4,'status':'avería','remainingDays':0}]

    def test_urgent_dispatch_costs_double_uses_connected_route_and_one_day(self):
        with patch.object(server,'route_between',return_value=[(4,10),(5,10),(8,10)]):
            failure=server.dispatch_utility_repair('outage-1',True)
        self.assertEqual(server.state['money'],99000)
        self.assertEqual(failure['status'],'en reparación')
        self.assertEqual(failure['remainingDays'],1)
        self.assertEqual(failure['responseKind'],'emergencia')
        self.assertEqual(failure['responseRoute'],[[4,10],[5,10],[8,10]])
        with self.assertRaisesRegex(ValueError,'ya fue reparada'):
            server.dispatch_utility_repair('outage-1',True)

    def test_urgent_response_needs_road_and_unreserved_cash(self):
        with patch.object(server,'route_between',return_value=None):
            with self.assertRaisesRegex(ValueError,'ruta vial'):
                server.dispatch_utility_repair('outage-1',True)
        self.assertEqual(server.state['money'],100000)
        server.state['projects']=[{'cost':99700,'paid':0}]
        with patch.object(server,'route_between',return_value=[(4,10),(8,10)]):
            with self.assertRaisesRegex(ValueError,'Quedan'):
                server.dispatch_utility_repair('outage-1',True)
        self.assertEqual(server.state['money'],100000)

    def test_regular_repair_keeps_base_price_and_three_day_eta(self):
        with patch.object(server,'route_between',return_value=None):
            failure=server.dispatch_utility_repair('outage-1',False)
        self.assertEqual(server.state['money'],99500)
        self.assertEqual(failure['remainingDays'],3)
        self.assertEqual(failure['responseKind'],'programada')
        self.assertEqual(failure['responseRoute'],[])

if __name__=='__main__':
    unittest.main()
