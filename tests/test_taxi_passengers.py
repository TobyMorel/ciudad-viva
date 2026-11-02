"""El taxi cobra viajes de compradores existentes, una sola vez por día."""
import unittest
from taxi_passengers import assign_taxi_passengers

def fixture():
    state={"day":1,"roads":[[x,10] for x in range(4,14)],
           "buildings":[{"x":5,"y":9,"kind":"depot","serviceModel":"taxiYard","status":"habilitado"}],
           "taxiRoutes":[{"id":"taxi-a","depotX":5,"depotY":9,"status":"active","operational":True,
                          "route":[[x,10] for x in range(5,14)]+[[x,10] for x in range(12,4,-1)],
                          "stops":[{"at":[7,10]},{"at":[12,10]}],"fare":.45}]}
    trip={"from":[7,9],"to":[12,9],"route":[[x,10] for x in range(7,13)],
          "mode":"auto","reason":"compras","distance":5,"workers":10,"vehicles":8,"dailyEmissionsKg":14.4}
    return state,[trip]

class TaxiPassengerTests(unittest.TestCase):
    def test_real_demand_capacity_fares_and_repeated_reads(self):
        state,trips=fixture()
        report=assign_taxi_passengers(state,trips)
        taxi=state["taxiRoutes"][0]
        self.assertEqual(trips[0]["taxiRiders"],8)
        self.assertEqual(trips[0]["vehicles"],2)
        self.assertEqual(report["activeVehicles"],1)
        self.assertEqual(taxi["monthlyFareRevenue"],4)
        assign_taxi_passengers(state,trips)
        self.assertEqual(taxi["monthlyFareRevenue"],4,"una segunda consulta no duplica tarifa")
        state["day"]=2
        assign_taxi_passengers(state,trips)
        self.assertEqual(taxi["monthlyFareRevenue"],7)
        state["day"]=31
        assign_taxi_passengers(state,trips)
        self.assertEqual(taxi["monthlyFareRevenue"],4,"mes nuevo no hereda cobros anteriores")

    def test_no_demand_when_paused_or_route_broken(self):
        state,trips=fixture()
        trip=trips[0]
        trip["reason"]="trabajo"
        assign_taxi_passengers(state,trips)
        self.assertEqual(state["taxiRoutes"][0]["dailyRiders"],0)
        trip["reason"]="servicios"
        state["taxiRoutes"][0]["status"]="paused"
        assign_taxi_passengers(state,trips)
        self.assertEqual(state["taxiRoutes"][0]["dailyRiders"],0)
        state["taxiRoutes"][0]["status"]="active"
        state["roads"].remove([10,10])
        report=assign_taxi_passengers(state,trips)
        self.assertEqual(report["dailyRiders"],0)
        self.assertEqual(report["activeVehicles"],0)
        self.assertTrue(state["taxiRoutes"][0]["pauseReason"])
        self.assertNotIn("taxiRiders",trip)

    def test_circuit_does_not_count_short_or_walk_trips(self):
        state,trips=fixture()
        trip=trips[0]
        trip["mode"]="walk"
        assign_taxi_passengers(state,trips)
        self.assertEqual(state["taxiRoutes"][0]["dailyRiders"],0)
        trip["mode"]="auto"
        trip["distance"]=2
        assign_taxi_passengers(state,trips)
        self.assertEqual(state["taxiRoutes"][0]["dailyRiders"],0)

if __name__=="__main__":
    unittest.main()
