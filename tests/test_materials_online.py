"""Las etapas de obra Online ya no se bloquean por inventario de construcción."""
import unittest
import server

class ConstructionMaterialRemovalTests(unittest.TestCase):
    def test_project_advances_without_material_inventory_or_orders(self):
        server.state=server.initial_state()
        s=server.state;s['day']=1;s['paused']=False
        server.ensure_supply_state()
        yard=s['supply']['contractors']['Sur Obras'];yard['components']=0
        p={'id':'test-components','kind':'road','label':'Calle de prueba','x':4,'y':11,
           'contractor':'Sur Obras','status':'contratada','cause':'','duration':1,'elapsed':0,
           'progress':0,'initialProgress':0,'stages':['Inspección'],'stageIndex':0,
           'workersAssigned':4,'cost':0,'paid':0,'privatePaid':True,'contractedDay':1,
           'changeOrderReviewed':True,'retentionPct':0,
           'materialsRequired':{k:400 for k in server.MATERIAL_NAMES},
           'materialsUsed':{k:0 for k in server.MATERIAL_NAMES}}
        s['projects'].append(p)
        server.tick_one_day()
        self.assertEqual(server.missing_materials(p,1),[])
        self.assertNotEqual(p['status'],'suspendida')
        self.assertEqual(p['elapsed'],1)
        self.assertTrue(all(amount==0 for amount in p['materialsRequired'].values()))
        self.assertTrue(all(amount==0 for amount in p['materialsUsed'].values()))
        self.assertEqual(s['supply']['orders'],[])
        server.tick_one_day()
        self.assertNotIn(p,s['projects'])
        self.assertIn([4,11],s['roads'])

if __name__=='__main__':
    unittest.main()
