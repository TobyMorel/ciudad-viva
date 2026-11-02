"""Comprobación LAN de pasajeros con transbordo entre tren, subte y colectivo."""
import unittest
from metro import metro_assign_passengers,settle_metro_month
from bus_nonwork import assign_bus_nonwork_passengers,collect_bus_nonwork_fares
from taxi_passengers import assign_taxi_passengers

def fixture(reverse=False,mode='metro'):
    path=[[3-i if reverse else i,0] for i in range(4)]
    bus={'id':'bus','status':'active','operational':True,'route':path,
         'stops':[{'at':path[0]},{'at':path[3]}],'fare':.25,'headwayMinutes':4,
         'ridersByWindow':{'midday':0},'capacityByWindow':{'midday':2}}
    rail={'id':'train','mode':'elevated' if mode=='tren' else None,'status':'active',
          'trainCount':1,'stations':[[3,1],[11,1]],'route':[[3+i,1] for i in range(9)],
          'fareCents':85 if mode=='tren' else 60,'powerRequiredKw':90}
    start=[11,1] if reverse else [0,1]
    end=[0,1] if reverse else [11,1]
    state={'day':1,'busRoutes':[bus],'metroLines':[rail],'taxiRoutes':[],
           'roads':[[i,0] for i in range(12)],'roadAssets':[],
           'buildings':[{'kind':'home','x':start[0],'y':start[1],'householdCash':20},
                        {'kind':'powerPlant','status':'habilitado','generationKw':900,'quality':82}],
           'utilities':{},'finance':{'programBudgets':{'mobilityFundingFactor':1}}}
    trip={'reason':'compras','mode':'auto','from':start,'to':end,
          'distance':12,'workers':5,'vehicles':4,'dailyEmissionsKg':4}
    return state,trip,bus,rail

def run(state,trip):
    assign_bus_nonwork_passengers(state,[trip])
    report=metro_assign_passengers(state,[trip])
    assign_taxi_passengers(state,[trip])
    return report

class IntermodalPassengerTests(unittest.TestCase):
    def test_bus_to_metro_and_two_real_fares(self):
        state,trip,bus,rail=fixture()
        report=run(state,trip)
        self.assertEqual(report['intermodalTransfers'],2)
        self.assertEqual(report['metroRiders'],2)
        self.assertEqual(trip['intermodalRiders'],2)
        self.assertEqual(trip['vehicles'],3)
        self.assertEqual(trip['intermodalJourneys'][0]['fareCents'],70)
        self.assertEqual(bus['ridersByWindow']['midday'],2)
        self.assertEqual(rail['dailyRiders'],2)
        self.assertEqual(settle_metro_month(state)['income'],1)
        self.assertEqual(collect_bus_nonwork_fares(state),1)
        self.assertEqual(state['buildings'][0]['householdCash'],18)
        self.assertEqual(settle_metro_month(state)['income'],0)
    def test_reverse_direction_and_rail_mode(self):
        state,trip,_,_=fixture(reverse=True)
        report=run(state,trip)
        self.assertEqual(report['intermodalTransfers'],2)
        self.assertEqual(trip['intermodalJourneys'][0]['fareCents'],79)
        self.assertEqual(trip['intermodalJourneys'][0]['direction'],'rail-bus')
        state,trip,_,_=fixture(reverse=True,mode='tren')
        report=run(state,trip)
        self.assertEqual(report['railRiders'],2)
        self.assertEqual(report['metroRiders'],0)
    def test_road_closure_power_pause_and_no_bus_seat(self):
        for condition in ('road','power','pause','capacity'):
            state,trip,bus,rail=fixture()
            if condition=='road':state['roads']=[p for p in state['roads'] if p[0]!=2]
            if condition=='power':state['buildings'].pop()
            if condition=='pause':rail['status']='paused'
            if condition=='capacity':bus['capacityByWindow']['midday']=0
            with self.subTest(condition=condition):
                self.assertEqual(run(state,trip)['intermodalTransfers'],0)
                self.assertEqual(rail['dailyRiders'],0)

if __name__=='__main__':unittest.main()
