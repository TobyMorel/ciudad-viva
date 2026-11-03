import unittest
from unittest.mock import patch

from metro import metro_assign_passengers
from rail_freight import freight_capacity_metrics, freight_routes_for_factory_port, rail_freight_report, reserve_freight_capacity, reserve_freight_route
import server


class SharedRailFreightCapacity(unittest.TestCase):
    def line(self, riders=210):
        return {
            "id": "rail-shared", "mode": "elevated", "status": "active", "operational": True,
            "trainCount": 1, "dailyCapacity": 420, "dailyRiders": riders,
            "freightCapacityPerDay": 60,
        }

    def test_passenger_load_reserves_same_corridor_capacity_before_freight(self):
        line=self.line(210)
        origin={"x": 3, "y": 2, "freightCapacityPerDay": 120}
        port={"x": 18, "y": 2, "freightCapacityPerDay": 120}

        self.assertEqual(freight_capacity_metrics(line), {
            "freightCapacityPerDay": 60,
            "freightAvailableCapacityPerDay": 30,
            "passengerLoadPct": 50,
        })
        self.assertTrue(reserve_freight_capacity(line,origin,port,30,12))
        self.assertFalse(reserve_freight_capacity(line,origin,port,1,12))
        self.assertEqual(line["freightUsedToday"],30)

    def test_full_passenger_service_leaves_no_freight_slot(self):
        line=self.line(420)
        self.assertEqual(freight_capacity_metrics(line)["freightAvailableCapacityPerDay"],0)
        self.assertFalse(reserve_freight_capacity(line,{"x":1,"y":1},{"x":9,"y":1},1,12))

    def test_passenger_assignment_refreshes_freight_share(self):
        line={"id":"rail-shared","mode":"elevated","status":"active","trainCount":1,
              "stations":[[3,1],[11,1]],"route":[[x,1] for x in range(3,12)],"fareCents":85,
              "powerRequiredKw":150,"dailyRiders":0,"monthlyFareRevenue":0,"fareByDay":{}}
        state={"day":1,"metroLines":[line],"busRoutes":[],"railStations":[],"taxiRoutes":[],"roads":[],
               "roadAssets":[],"buildings":[{"kind":"powerPlant","status":"operativo","generationKw":900}],
               "utilities":{},"finance":{"programBudgets":{"mobilityFundingFactor":1}}}
        trips=[{"reason":"servicios","mode":"auto","from":[3,1],"to":[11,1],"workers":210,"distance":20}]

        result=metro_assign_passengers(state,trips)

        self.assertEqual(result["railRiders"],210)
        self.assertEqual(line["dailyCapacity"],420)
        self.assertEqual(line["freightAvailableCapacityPerDay"],30)

    def test_report_separates_nominal_and_shared_freight_capacity(self):
        line=self.line(210)
        report=rail_freight_report({"metroLines":[line],"railStations":[],"buildings":[],"supply":{}})
        self.assertEqual(report["dailyCapacity"],60)
        self.assertEqual(report["availableCapacityPerDay"],30)
        self.assertEqual(report["passengerRiders"],210)
        self.assertEqual(report["passengerLoadPct"],50)

    def test_full_preferred_corridor_falls_back_to_another_built_line(self):
        factory={"kind":"factory","x":1,"y":1}
        port={"kind":"port","x":10,"y":1}
        stations=[{"mode":"elevated","status":"active","x":2,"y":1},
                  {"mode":"elevated","status":"active","x":8,"y":1},
                  {"mode":"elevated","status":"active","x":1,"y":2},
                  {"mode":"elevated","status":"active","x":9,"y":2}]
        first={**self.line(420),"id":"rail-short","stations":[[2,1],[8,1]],"route":[[x,1] for x in range(2,9)],"operational":True}
        second={**self.line(0),"id":"rail-alternate","stations":[[1,2],[9,2]],"route":[[x,2] for x in range(1,10)],"operational":True}
        routes=freight_routes_for_factory_port({"railStations":stations,"metroLines":[first,second]},factory,port,
            lambda a,b:[[a["x"],a["y"]],[b["x"],b["y"]]])

        self.assertEqual([item["line"]["id"] for item in routes],["rail-short","rail-alternate"])
        selected=reserve_freight_route(routes,30,12)

        self.assertEqual(selected["line"]["id"],"rail-alternate")
        self.assertNotIn("freightUsedToday",first)
        self.assertEqual(second["freightUsedToday"],30)

    def test_port_logistics_departs_on_an_alternative_line_with_free_capacity(self):
        state=server.new_settlement_state()
        state["day"]=12
        factory={"kind":"factory","x":1,"y":1,"status":"habilitado","business":{"id":"factory-1","status":"abierto"}}
        port={"kind":"port","x":10,"y":1,"id":"port-10-1","status":"habilitado","cargoStored":0,"cargoCapacity":500}
        stations=[{"mode":"elevated","status":"active","x":2,"y":1},
                  {"mode":"elevated","status":"active","x":8,"y":1},
                  {"mode":"elevated","status":"active","x":1,"y":2},
                  {"mode":"elevated","status":"active","x":9,"y":2}]
        first={**self.line(420),"id":"rail-short","stations":[[2,1],[8,1]],"route":[[x,1] for x in range(2,9)],"powerRequiredKw":100}
        second={**self.line(0),"id":"rail-alternate","stations":[[1,2],[9,2]],"route":[[x,2] for x in range(1,10)],"powerRequiredKw":100}
        order={"id":"shipment-1","originType":"factory","businessId":"factory-1","businessName":"Procesadora",
               "mode":"rail","portId":"port-10-1","status":"esperando tren programado","quantity":30,
               "freightLineId":"rail-short","scheduledDepartureDay":12,"scheduleIntervalDays":3}
        state["buildings"]=[factory,port,{"kind":"powerPlant","status":"operativo","generationKw":900}]
        state["railStations"]=stations
        state["metroLines"]=[first,second]
        state["supply"]["portOrders"]=[order]
        state["supply"]["portVoyages"]=[]
        old_state=server.state
        server.state=state
        try:
            with patch.object(server,"route_between",return_value=[[1,1],[2,1]]):
                server.process_port_logistics()
        finally:
            server.state=old_state

        self.assertEqual(order["status"],"en tránsito ferroviario")
        self.assertEqual(order["freightLineId"],"rail-alternate")
        self.assertEqual(second["freightUsedToday"],30)
        self.assertNotIn("freightUsedToday",first)


if __name__=="__main__":
    unittest.main()
