"""Metro: inversión, obra por etapas, energía, trenes, pasajeros y cobro real."""
import unittest
from metro import plan_metro,advance_metro_day,metro_refresh,metro_assign_passengers,settle_metro_month,metro_action,metro_station_catalog
from taxi_passengers import assign_taxi_passengers

def fixture():
    return {"day":1,"money":90000,"jobs":12,"projects":[],"roads":[[x,10] for x in range(4,13)],
            "buildings":[{"kind":"home","name":"Barrio Norte","x":5,"y":9,"status":"operativo","householdCash":10},
                         {"kind":"shop","name":"Centro comercial","x":11,"y":9,"status":"habilitado"},
                         {"kind":"powerPlant","name":"Central","x":9,"y":9,"status":"habilitado","quality":82,"generationKw":900}],
            "utilities":{},"finance":{"programBudgets":{"mobilityFundingFactor":1}},"metroLines":[],"taxiRoutes":[]}
def trip():
    return {"reason":"compras","from":[5,9],"to":[11,9],"distance":7,"mode":"auto","workers":3,"vehicles":3,"dailyEmissionsKg":7.56}

class MetroTests(unittest.TestCase):
    def test_construction_requires_time_and_crew_and_cannot_cross_river(self):
        city=fixture()
        self.assertEqual(len(metro_station_catalog(city)),2)
        line=plan_metro(city,[5,9],[11,9],1)
        self.assertEqual(city["money"],90000-line["purchaseCost"])
        self.assertEqual(line["status"],"building")
        metro_refresh(city);self.assertFalse(line["operational"])
        city["jobs"]=0
        advance_metro_day(city)
        self.assertEqual(line["elapsed"],0)
        city["jobs"]=12
        for day in range(2,line["duration"]+2):
            city["day"]=day;advance_metro_day(city)
        self.assertEqual(line["status"],"active")
        self.assertEqual(line["stage"],"Habilitada")
        metro_refresh(city);self.assertTrue(line["operational"])
        self.assertEqual(line["dailyCapacity"],240)
        with self.assertRaises(ValueError):plan_metro(city,[5,9],[11,9],1)

    def test_energy_or_fleet_or_budget_stop_trains_without_fictitious_riders(self):
        city=fixture();line=plan_metro(city,[5,9],[11,9]);line["status"]="active"
        city["buildings"]=[b for b in city["buildings"] if b["kind"]!="powerPlant"]
        metro_refresh(city);self.assertFalse(line["operational"])
        self.assertEqual(metro_assign_passengers(city,[trip()])["metroRiders"],0)
        city["buildings"].append({"kind":"powerPlant","status":"habilitado","generationKw":900,"quality":82})
        line["trainCount"]=0;metro_refresh(city);self.assertFalse(line["operational"])
        metro_action(city,"buyMetroTrain",{"id":line["id"]})
        self.assertTrue(line["operational"])
        city["finance"]["programBudgets"]["mobilityFundingFactor"]=0
        metro_refresh(city);self.assertFalse(line["operational"])

    def test_real_trips_reduce_car_count_and_fares_leave_household(self):
        city=fixture();line=plan_metro(city,[5,9],[11,9]);line["status"]="active"
        people=[trip()]
        r=metro_assign_passengers(city,people)
        self.assertEqual(r["metroRiders"],3)
        self.assertEqual(people[0]["metroRiders"],3)
        self.assertEqual(people[0]["vehicles"],0)
        assign_taxi_passengers(city,people)
        self.assertEqual(people[0]["vehicles"],0)
        self.assertLessEqual(people[0].get("taxiRiders",0)+people[0]["metroRiders"],3)
        balance=settle_metro_month(city)
        self.assertEqual(balance["income"],2)
        self.assertEqual(city["buildings"][0]["householdCash"],8)
        self.assertGreater(balance["cost"],0)
        again=settle_metro_month(city)
        self.assertEqual(again["income"],0)
        self.assertEqual(city["buildings"][0]["householdCash"],8)

    def test_no_station_without_road_or_funds(self):
        city=fixture();city["money"]=1
        with self.assertRaises(ValueError):plan_metro(city,[5,9],[11,9])
        city["money"]=90000;city["roads"]=[]
        with self.assertRaises(ValueError):plan_metro(city,[5,9],[11,9])

if __name__=="__main__":unittest.main()
