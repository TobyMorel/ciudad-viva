import unittest
import server

class ManualTaxiRoute(unittest.TestCase):
    def setUp(self):
        self.old_state=server.state
        server.state=server.initial_state()
        server.state['roads']=[[x,10] for x in range(4,13)]
        server.state['buildings']=[{'x':5,'y':9,'kind':'depot','serviceModel':'taxiYard','name':'Depósito Centro','status':'habilitado','taxiCapacity':2}]
        server.state['taxiRoutes']=[]
    def tearDown(self): server.state=self.old_state
    def test_vehicle_returns_to_depot_and_stops_follow_player_order(self):
        before=server.state['money'];taxi=server.create_taxi_route_from_depot(5,9,[[7,10],[10,10]])
        self.assertEqual(taxi['route'],[[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[9,10],[8,10],[7,10],[6,10],[5,10]])
        self.assertEqual([s['at'] for s in taxi['stops']],[[7,10],[10,10]])
        self.assertEqual(server.state['money'],before-3240)
    def test_capacity_duplicate_stops_and_committed_funds_are_checked(self):
        server.create_taxi_route_from_depot(5,9,[[7,10],[10,10]])
        with self.assertRaisesRegex(ValueError,'misma parada'):server.create_taxi_route_from_depot(5,9,[[7,10],[7,10]])
        server.create_taxi_route_from_depot(5,9,[[6,10],[8,10]])
        with self.assertRaisesRegex(ValueError,'cuatro plazas|dos plazas'):server.create_taxi_route_from_depot(5,9,[[8,10],[11,10]])
        server.state['taxiRoutes']=[];server.state['money']=1000;server.state['projects']=[{'cost':500,'paid':0}]
        with self.assertRaisesRegex(ValueError,'quedan'):server.create_taxi_route_from_depot(5,9,[[7,10],[10,10]])
        self.assertEqual(server.state['money'],1000)

if __name__=='__main__':unittest.main()
