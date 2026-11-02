"""Estaciones físicas ferroviarias: construcción, bloqueos y trazado."""
import unittest
from rail_sites import place_rail_station,advance_rail_stations
from metro import plan_metro,plan_elevated_rail,metro_station_catalog,advance_metro_day

def fixture():
    return {'day':1,'money':160000,'jobs':8,'projects':[],
            'roads':[[x,10] for x in range(3,18)],
            'buildings':[{'kind':'home','x':5,'y':9},{'kind':'shop','x':11,'y':9}],
            'railStations':[],'metroLines':[],'finance':{'programBudgets':{'mobilityFundingFactor':1}}}

class RailStationTests(unittest.TestCase):
    def test_site_occupancy_and_expense(self):
        s=fixture();site=place_rail_station(s,'metro',6,9)
        self.assertEqual(s['money'],153200)
        self.assertEqual(site['status'],'building')
        self.assertEqual(metro_station_catalog(s),[])
        with self.assertRaisesRegex(ValueError,'ocupada'):place_rail_station(s,'elevated',6,9)
        with self.assertRaisesRegex(ValueError,'ocupada'):place_rail_station(s,'metro',5,9)
        with self.assertRaisesRegex(ValueError,'ocupada'):place_rail_station(s,'metro',7,10)
    def test_requires_completed_construction(self):
        s=fixture();place_rail_station(s,'metro',6,9);place_rail_station(s,'metro',12,9)
        with self.assertRaises(ValueError):plan_metro(s,[6,9],[12,9])
        s['jobs']=0;advance_metro_day(s);self.assertEqual(s['railStations'][0]['elapsed'],0)
        s['jobs']=8
        for i in range(42):s['day']+=1;advance_metro_day(s)
        self.assertEqual(s['railStations'][0]['status'],'active')
        self.assertEqual(len(metro_station_catalog(s,'metro')),2)
        self.assertEqual(plan_metro(s,[6,9],[12,9])['status'],'building')
        with self.assertRaises(ValueError):plan_elevated_rail(s,[6,9],[12,9])
    def test_elevated_viaduct_connects_real_sites(self):
        s=fixture();place_rail_station(s,'elevated',6,11);place_rail_station(s,'elevated',13,11)
        for i in range(50):s['day']+=1;advance_rail_stations(s)
        line=plan_elevated_rail(s,[6,11],[13,11])
        self.assertEqual(line['mode'],'elevated')
        self.assertEqual(len(line['route']),8)
    def test_land_and_reserved_funds(self):
        s=fixture();s['landClaims']={'chunkSize':8,'unlockedChunks':['0,0']}
        with self.assertRaisesRegex(ValueError,'Desbloqueá'):place_rail_station(s,'metro',12,9)
        s['landClaims']['unlockedChunks'].append('1,1')
        s['projects']=[{'cost':159000,'paid':0,'privatePaid':False}]
        with self.assertRaisesRegex(ValueError,'Fondos'):place_rail_station(s,'metro',12,9)

if __name__=='__main__':unittest.main()
