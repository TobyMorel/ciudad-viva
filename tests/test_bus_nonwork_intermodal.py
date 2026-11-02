"""Contratos de pasajeros no laborales, transbordos, aforo y recaudación."""
import copy
import unittest
from bus_nonwork import assign_bus_nonwork_passengers,collect_bus_nonwork_fares
from taxi_passengers import assign_taxi_passengers

def fixture():
    a={"id":"A","status":"active","operational":True,"fare":.25,"headwayMinutes":2,
       "route":[[i,0] for i in range(4)],"stops":[{"at":[0,0]},{"at":[3,0]}],
       "ridersByWindow":{"midday":0},"capacityByWindow":{"midday":2}}
    b={"id":"B","status":"active","operational":True,"fare":.25,"headwayMinutes":2,
       "route":[[i,0] for i in range(3,7)],"stops":[{"at":[3,0]},{"at":[6,0]}],
       "ridersByWindow":{"midday":0},"capacityByWindow":{"midday":3}}
    city={"day":1,"busRoutes":[a,b],"taxiRoutes":[],"roads":[[i,0] for i in range(7)],
          "buildings":[{"kind":"home","x":0,"y":1,"householdCash":10}]}
    visit={"reason":"compras","mode":"auto","from":[0,1],"to":[6,1],"route":[[i,0] for i in range(7)],
           "workers":5,"distance":12,"vehicles":4,"dailyEmissionsKg":17.28}
    return city,[visit]

class NonworkBusTests(unittest.TestCase):
    def test_transfer_capacity_partial_car_replacement_and_fares(self):
        city,trips=fixture()
        report=assign_bus_nonwork_passengers(city,trips)
        self.assertEqual(report["busNonworkPassengers"],2)
        self.assertEqual(report["busNonworkTransfers"],2)
        self.assertEqual(trips[0]["workers"],5)
        self.assertEqual(trips[0]["busRiders"],2)
        self.assertEqual(trips[0]["vehicles"],3)
        self.assertEqual(trips[0]["busJourneys"][0]["lineIds"],["A","B"])
        self.assertEqual([l["nonworkRiders"] for l in city["busRoutes"]],[2,2])
        self.assertEqual([l["ridersByWindow"]["midday"] for l in city["busRoutes"]],[2,2])
        self.assertAlmostEqual(report["busNonworkFareRevenue"],.82)
        before=city["buildings"][0]["householdCash"]
        collect_bus_nonwork_fares(city)
        self.assertEqual(city["buildings"][0]["householdCash"],before-1)
        self.assertEqual(sum(l["monthlyFareRevenue"] for l in city["busRoutes"]),1)

    def test_repeated_view_not_duplicate_fares_and_month_reset(self):
        city,trips=fixture()
        assign_bus_nonwork_passengers(city,trips)
        first=[copy.deepcopy(l["nonworkFaresByDay"]) for l in city["busRoutes"]]
        for l in city["busRoutes"]:l["ridersByWindow"]["midday"]=0
        assign_bus_nonwork_passengers(city,trips)
        self.assertEqual([l["nonworkFaresByDay"] for l in city["busRoutes"]],first)
        city["day"]=31
        for l in city["busRoutes"]:l["ridersByWindow"]["midday"]=0
        assign_bus_nonwork_passengers(city,trips)
        self.assertEqual([list(l["nonworkFaresByDay"]) for l in city["busRoutes"]],[["31"],["31"]])

    def test_no_riders_if_paused_no_drivers_or_stops_missing(self):
        city,trips=fixture();city["busRoutes"][0]["operational"]=False
        self.assertEqual(assign_bus_nonwork_passengers(city,trips)["busNonworkPassengers"],0)
        city["busRoutes"][0]["operational"]=True
        city["busRoutes"][0]["stops"]=[{"at":[0,0]}]
        self.assertEqual(assign_bus_nonwork_passengers(city,trips)["busNonworkPassengers"],0)

    def test_no_double_taxi_boardings(self):
        city,trips=fixture()
        city["busRoutes"][0]["capacityByWindow"]["midday"]=4
        city["busRoutes"][1]["capacityByWindow"]["midday"]=4
        assign_bus_nonwork_passengers(city,trips)
        self.assertEqual(trips[0]["busRiders"],4)
        assign_taxi_passengers(city,trips)
        self.assertEqual(trips[0]["vehicles"],1)
        self.assertLessEqual(trips[0].get("taxiRiders",0)+trips[0]["busRiders"],trips[0]["workers"])

if __name__=="__main__":unittest.main()
