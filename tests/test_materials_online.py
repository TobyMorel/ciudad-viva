"""Regresión de componentes desde metalúrgica hasta inspección Online."""
import unittest
import server

class MaterialSupplyTests(unittest.TestCase):
    def test_shortage_order_delivery_resumption_single_charge(self):
        server.state=server.initial_state()
        s=server.state;s['day']=1;s['paused']=False
        server.ensure_supply_state()
        yard=s['supply']['contractors']['Sur Obras'];yard['components']=0
        s['supply']['contractorCash']['Sur Obras']=9000
        supplier=s['supply']['suppliers']['Metalúrgica local'];supplier['components']=4
        s['buildings'].append({'x':4,'y':9,'kind':'factory','name':'Metalúrgica de prueba','status':'habilitado',
            'business':{'id':'metal-test','industryType':'metalworks','status':'abierto','cash':2000,
                'componentStock':4,'rawSteelInventory':0,'jobSlots':20}})
        p={'id':'test-components','kind':'road','label':'Calle de prueba','x':4,'y':11,
           'contractor':'Sur Obras','status':'contratada','cause':'','duration':1,'elapsed':0,
           'progress':0,'initialProgress':0,'stages':['Inspección'],'stageIndex':0,
           'workersAssigned':4,'cost':0,'paid':0,'privatePaid':True,'contractedDay':1,
           'changeOrderReviewed':True,'retentionPct':0,
           'materialsRequired':{k:4 if k=='components' else 0 for k in server.MATERIAL_NAMES},
           'materialsUsed':{k:0 for k in server.MATERIAL_NAMES}}
        s['projects'].append(p)
        server.tick_one_day()
        self.assertEqual(p['status'],'suspendida')
        self.assertEqual(p['elapsed'],0)
        self.assertEqual(server.missing_materials(p,1),['components'])
        route=server.route_between((4,9),(4,10))
        self.assertTrue(route)
        cost=round(4*server.MATERIAL_PRICE['components']*server.SUPPLIERS['Metalúrgica local']['price'])
        supplier['components']-=4
        s['supply']['contractorCash']['Sur Obras']-=cost
        server.settle_metalworks_sale(4)
        s['supply']['orders'].append({'id':'test-order','projectId':p['id'],
           'label':p['label'],'contractor':'Sur Obras','supplier':'Metalúrgica local',
           'items':{'components':4},'cost':cost,'destinationId':'yard','destinationLabel':'Patio',
           'orderedDay':s['day'],'supplierReadyDay':s['day']+1,'source':[4,9],
           'route':route,'travelDistance':len(route)-1,'travelledDistance':0,
           'arrivalDay':s['day']+2,'status':'en tránsito'})
        delivered=False
        for _ in range(12):
            server.tick_one_day()
            delivered |=s['supply']['orders'][-1]['status']=='entregado'
            if p not in s['projects']:break
        self.assertTrue(delivered)
        self.assertNotIn(p,s['projects'])
        self.assertIn([4,11],s['roads'])
        self.assertEqual(yard['components'],0)
        self.assertEqual(supplier['components'],0)
        firm=next(b['business'] for b in s['buildings'] if b.get('business',{}).get('id')=='metal-test')
        self.assertEqual(firm['componentStock'],0)
        self.assertEqual(firm['cash'],2000+cost)
        self.assertEqual(s['supply']['contractorCash']['Sur Obras'],9000-cost)
        for _ in range(3):server.tick_one_day()
        self.assertEqual(yard['components'],0)
        self.assertEqual(s['supply']['contractorCash']['Sur Obras'],9000-cost)

if __name__=='__main__':
    unittest.main()
