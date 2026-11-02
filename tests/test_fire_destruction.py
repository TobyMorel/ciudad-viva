import unittest
import server


class FireDestruction(unittest.TestCase):
    def setUp(self):
        server.state=server.new_settlement_state()
        home={"x":5,"y":10,"kind":"home","name":"Casa de prueba","status":"habilitado","quality":75,"capacity":4,"occupants":2,"residents":[
            {"id":"inside","name":"Ana","age":55,"status":"inactivo","workerEligible":False},
            {"id":"outside","name":"Luis","age":34,"status":"empleado","workerEligible":True,"employerId":"job-luis"}],"householdCash":500}
        server.state["buildings"]=[home]
        server.state["population"]=2
        server.state["timeOfDayMinutes"]=500
        server.state["day"]=15
        self.incident={"id":"fire-test","x":5,"y":10,"name":"Casa de prueba","status":"ardiendo","startDay":10,"burningDays":4,"buildingKind":"home"}
        server.state["fireService"]["incidents"]=[self.incident]

    def test_unanswered_fire_destoys_home_and_rehouses_survivor(self):
        server.fire_service_report([],advance=True)
        self.assertEqual(self.incident["status"],"destruido")
        self.assertEqual((self.incident["deaths"],self.incident["displaced"]),(1,1))
        self.assertEqual(server.state["population"],1)
        self.assertFalse(server.state["buildings"])
        self.assertEqual(server.state["fireService"]["ruins"][0]["kind"],"home")
        self.assertEqual(server.state["urbanEvolution"]["deceased"][0]["residentId"],"inside")
        self.assertEqual(server.state["socialServices"]["shelterResidents"][0]["id"],"outside")

    def test_fire_engine_dispatch_is_visible_before_fire_is_controlled(self):
        server.state["roads"]=[[4,10],[5,10]]
        home=server.state["buildings"][0];home["x"]=6
        station={"x":4,"y":9,"kind":"fireStation","serviceModel":"firePost","name":"Bomberos","status":"habilitado","fireEngineCapacity":1,"dispatchReadyDay":15}
        server.state["buildings"].append(station)
        self.incident["x"]=6
        self.incident["burningDays"]=0
        self.incident["startDay"]=15
        server.fire_service_report([{"kind":"fireStation","x":4,"y":9,"staffedJobs":4}],advance=True)
        self.assertEqual(self.incident["responseStatus"],"en camino")
        self.assertEqual(self.incident["arrivalDay"],16)
        self.assertGreaterEqual(len(self.incident["responseRoute"]),2)
        self.assertEqual(server.state["fireService"]["resolved"],0)
        server.state["day"]=16
        server.fire_service_report([{"kind":"fireStation","x":4,"y":9,"staffedJobs":4}],advance=True)
        self.assertEqual(self.incident["status"],"controlado")
        self.assertEqual(server.state["fireService"]["resolved"],1)


if __name__=="__main__":unittest.main()
