import unittest
from metro import plan_elevated_rail,metro_refresh,advance_metro_day,metro_action,metro_assign_passengers,settle_metro_month

def city():
    return dict(day=1,money=100000,jobs=8,projects=[],metroLines=[],
      roads=[[x,10] for x in range(4,15)],
      buildings=[
        dict(kind='home',name='Viviendas',x=5,y=9,status='habilitado',householdCash=80),
        dict(kind='shop',name='Mercado',x=12,y=9,status='habilitado'),
        dict(kind='powerPlant',name='Usina',x=8,y=9,status='habilitado',generationKw=900,quality=82)],
      finance={'programBudgets':{'mobilityFundingFactor':1}},utilities={})

class ElevatedRailTest(unittest.TestCase):
    def test_contract_and_inspection(self):
        s=city();initial=s['money'];line=plan_elevated_rail(s,[5,9],[12,9],1)
        self.assertEqual(line['mode'],'elevated')
        self.assertEqual(len(line['route']),8)
        self.assertEqual(s['money'],initial-line['purchaseCost'])
        metro_refresh(s);self.assertFalse(line['operational'])
        for _ in range(line['duration']):
            s['day']+=1;advance_metro_day(s)
        self.assertEqual(line['status'],'active')
        metro_refresh(s);self.assertTrue(line['operational'])
        self.assertEqual(line['dailyCapacity'],420)
        with self.assertRaises(ValueError):plan_elevated_rail(s,[5,9],[12,9])
    def test_capacity_energy_fares(self):
        s=city();line=plan_elevated_rail(s,[5,9],[12,9])
        line['status']='active';metro_refresh(s)
        t=dict(reason='compras',mode='auto',**{'from':[5,9],'to':[12,9]},distance=9,workers=7,busRiders=2,vehicles=5,dailyEmissionsKg=2.5)
        report=metro_assign_passengers(s,[t])
        self.assertEqual(report['railRiders'],5)
        self.assertEqual(report['metroRiders'],0)
        self.assertEqual(t['metroRiders'],5)
        self.assertEqual(t['vehicles'],0)
        balance=settle_metro_month(s)
        self.assertEqual(balance['income'],4)
        self.assertEqual(s['buildings'][0]['householdCash'],76)
        self.assertEqual(settle_metro_month(s)['income'],0)
        metro_action(s,'pauseRailLine',{'id':line['id']})
        self.assertFalse(line['operational'])
        metro_action(s,'resumeRailLine',{'id':line['id']})
        self.assertTrue(line['operational'])
        metro_action(s,'buyRailTrain',{'id':line['id']})
        self.assertEqual(line['trainCount'],2)
        s['buildings']=[b for b in s['buildings'] if b['kind']!='powerPlant']
        metro_refresh(s);self.assertFalse(line['operational'])
    def test_missing_route_or_funds(self):
        s=city();s['roads']=[p for p in s['roads'] if p[0]!=8]
        with self.assertRaises(ValueError):plan_elevated_rail(s,[5,9],[12,9])
        s=city();s['projects']=[dict(cost=99000,paid=0,privatePaid=False)]
        with self.assertRaises(ValueError):plan_elevated_rail(s,[5,9],[12,9])

if __name__=='__main__':unittest.main()
