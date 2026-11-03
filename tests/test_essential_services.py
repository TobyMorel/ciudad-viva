"""Regresiones de conectividad, capacidad y vivienda abandonada por servicios."""
import unittest
from essential_services import evaluate_essential_services,advance_essential_service_day,GRACE_DAYS

def fixture():
    road=[[i,10] for i in range(4,30)]
    return dict(day=1,newSettlement=True,roads=road,money=90000,abandoned=[],population=12,housingDemand={'unmet':0},
        buildings=[dict(kind='home',name='Barrio nuevo',x=6,y=9,occupants=12,capacity=20,status='habilitado')],
        utilities=dict(powerLines=road,waterPipes=road,gasLines=road,telecomLines=road,failures=[]))
def provider(kind,x,model=None,**other):
    return dict(kind=kind,x=x,y=9,serviceModel=model,quality=82,status='habilitado',**other)

class EssentialsTest(unittest.TestCase):
    def test_new_city_starts_without_any_services_or_lamps(self):
        city=fixture();grid=evaluate_essential_services(city)
        self.assertEqual(city['buildings'][0]['missingServices'],['power','water','gas','tv','wifi'])
        self.assertEqual(city['utilities']['poweredStreetlightTiles'],[])
        self.assertTrue(all(row['capacity']==0 for row in grid.values()))
    def test_sources_are_real_and_telecom_failure_disconnects_road(self):
        city=fixture()
        city['utilities'].update(powerLines=[],waterPipes=[],gasLines=[],telecomLines=[])
        city['buildings'].extend([provider('powerPlant',8),provider('waterPlant',9),provider('gasPlant',10),
                                 provider('civic',11,'tvHeadend'),provider('civic',12,'wifiHub')])
        grid=evaluate_essential_services(city)
        self.assertEqual([grid[k]['capacity'] for k in ('power','water','gas','tv','wifi')],[900,220,160,180,160])
        self.assertEqual(city['buildings'][0]['missingServices'],[])
        self.assertTrue(city['utilities']['poweredStreetlightTiles'])
        city['utilities']['failures']=[dict(network='telecom',x=4,y=10,status='avería')]
        evaluate_essential_services(city)
        self.assertEqual(city['buildings'][0]['missingServices'],['tv','wifi'])
    def test_capacity_limit_preserves_existing_homes(self):
        city=fixture();city['buildings'][0]['occupants']=5
        city['buildings'].extend([provider('powerPlant',8,generationKw=10000),provider('waterPlant',9),provider('gasPlant',10),
                                 provider('civic',11,'tvHeadend',tvConnections=1),provider('civic',12,'wifiHub',wifiConnections=1)])
        evaluate_essential_services(city)
        new=provider('home',5,occupants=5)
        city['buildings'].append(new);evaluate_essential_services(city)
        self.assertEqual(city['buildings'][0]['utilityAccess']['tvServedPct'],100)
        self.assertEqual([s for s in new['missingServices'] if s in ('tv','wifi')],['tv','wifi'])
        self.assertEqual(new['missingServiceReasons']['tv'],'Capacidad máxima alcanzada')
        city['buildings'].extend([provider('civic',13,'tvHeadend',tvConnections=1),provider('civic',14,'wifiHub',wifiConnections=1)])
        evaluate_essential_services(city)
        self.assertEqual(new['utilityAccess']['tvServedPct'],100)
    def test_abandonment_after_deadline_once_per_day(self):
        city=fixture();home=city['buildings'][0]
        for day in range(1,GRACE_DAYS['power']+1):
            city['day']=day;evaluate_essential_services(city);advance_essential_service_day(city);advance_essential_service_day(city)
        self.assertEqual(len(city['buildings']),0)
        self.assertEqual(len(city['abandoned']),1)
        self.assertEqual(city['abandoned'][0]['displaced'],12)
        self.assertEqual(city['population'],0)
    def test_reconnect_resets_outage_days(self):
        city=fixture()
        for day in range(1,71):
            city['day']=day;evaluate_essential_services(city);advance_essential_service_day(city)
        self.assertEqual(city['buildings'][0]['serviceOutageDays']['power'],70)
        city['buildings'].append(provider('powerPlant',8))
        city['day']+=1;evaluate_essential_services(city);advance_essential_service_day(city)
        self.assertEqual(city['buildings'][0]['serviceOutageDays']['power'],0)

if __name__=='__main__':unittest.main()
