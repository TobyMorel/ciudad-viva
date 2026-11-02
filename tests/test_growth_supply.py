"""La demanda de expansión aparece solo al agotarse la oferta existente."""
import unittest
from growth_demand import growth_demand
import server

class GrowthSupplyTests(unittest.TestCase):
    def test_empty_home_suppresses_pressure_even_with_waiting_migrants(self):
        state={"day":28,"population":252,"housingDemand":{"unmet":700},"buildings":[{"kind":"home","x":8,"y":13,"capacity":28,"occupants":0}],"projects":[]}
        result=growth_demand(state)
        self.assertEqual(result["housing"]["vacancies"],28)
        self.assertEqual(result["housing"]["waiting"],700)
        self.assertEqual(result["housing"]["shortage"],0)
        self.assertEqual(result["housing"]["value"],0)
        state["buildings"][0]["occupants"]=27
        self.assertEqual(growth_demand(state)["housing"]["value"],0)
        state["buildings"][0]["occupants"]=28
        self.assertEqual(growth_demand(state)["housing"]["value"],100)
        state["buildings"][0]["emergencyReturnDay"]=30
        self.assertEqual(growth_demand(state)["housing"]["vacancies"],0)

    def test_shop_demand_stays_low_with_free_operating_capacity(self):
        state={"day":28,"population":252,"housingDemand":{"unmet":0},"projects":[],
               "buildings":[{"kind":"shop","status":"operativo","business":{"status":"abierto","lastLocalDemand":5,"lastLocalSales":5,"lastRegionalDemand":0,"lastRegionalSales":0}}]}
        self.assertEqual(growth_demand(state)["commercial"]["value"],0)
        state["buildings"][0]["business"]["lastLocalDemand"]=30
        self.assertEqual(growth_demand(state)["commercial"]["shortage"],1)
        self.assertEqual(growth_demand(state)["commercial"]["value"],50)
        state["projects"].append({"kind":"shop","status":"contratada"})
        self.assertEqual(growth_demand(state)["commercial"]["value"],0)

    def test_zoning_does_not_trigger_new_homes_until_occupied(self):
        old=server.state
        try:
            city=server.state=server.new_settlement_state()
            city["money"]=250000
            city["privateCapital"]=250000
            city["housingDemand"]["unmet"]=500
            city["buildings"]=[{"kind":"home","x":5,"y":9,"capacity":28,"occupants":0,"residents":[]}]
            city["zones"]=[{"x":5,"y":10,"kind":"home","status":"disponible"}]
            server.advance_zoned_development()
            self.assertFalse(any(p.get("kind")=="home" for p in city["projects"]))
            city["buildings"][0]["occupants"]=28
            server.advance_zoned_development()
            self.assertTrue(any(p.get("kind")=="home" for p in city["projects"]))
        finally:
            server.state=old

    def test_commercial_zoning_waits_for_existing_shop_saturation(self):
        old=server.state
        try:
            city=server.state=server.new_settlement_state()
            city["money"]=250000;city["privateCapital"]=250000;city["population"]=252
            shop={"kind":"shop","x":5,"y":9,"status":"operativo","business":{"status":"abierto","lastLocalDemand":5,"lastLocalSales":5}}
            city["buildings"]=[shop];city["zones"]=[{"x":5,"y":10,"kind":"shop","status":"disponible"}]
            server.advance_zoned_development()
            self.assertFalse(any(p.get("kind")=="shop" for p in city["projects"]))
            shop["business"]["lastLocalDemand"]=30
            server.advance_zoned_development()
            self.assertTrue(any(p.get("kind")=="shop" for p in city["projects"]))
        finally:
            server.state=old

if __name__=="__main__":
    unittest.main()
