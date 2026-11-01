"""Cobertura de acompañamiento a mayores según plantilla, ruta, redes y financiación."""
import unittest
from unittest.mock import patch
import server

class OlderAdultCare(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        people=[{"id":f"senior-{age}","age":age,"workerEligible":False,"status":"jubilado"} for age in (74,75,82)]
        server.state["buildings"]=[{"kind":"home","x":6,"y":10,"occupants":3,"residents":people},{"kind":"civic","name":"Centro de cuidados","serviceModel":"elderCare","x":5,"y":10,"status":"habilitado","jobSlots":10,"monthlyCost":1450,"elderCare":{"careSlots":36},"utilityAccess":{"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100}}]
        self.people=people;self.center=server.state["buildings"][1]
    def test_staff_routes_and_funding_limit_real_visits(self):
        staff=[{"kind":"civic","x":5,"y":10,"staffedJobs":1}]
        with patch.object(server,"route_between",return_value=[[5,10],[6,10]]):
            report=server.update_older_adult_care(staff,100)
            self.assertEqual((report["eligible"],report["served"],report["waiting"]),(2,2,0))
            self.assertEqual(self.people[2]["careStatus"],"visita mensual asignada")
            self.assertEqual(self.people[1]["careStatus"],"visita mensual asignada")
            self.assertEqual(self.people[0]["careStatus"],"no requiere")
            report=server.update_older_adult_care(staff,25)
            self.assertEqual(report["served"],1)
            server.update_older_adult_care(staff,0)
            self.assertEqual(server.state["socialServices"]["elderCareReport"]["served"],0)
            self.center["utilityAccess"]["waterServedPct"]=0
            report=server.update_older_adult_care(staff,100)
            self.assertEqual(report["served"],0)
        with patch.object(server,"route_between",return_value=None):
            report=server.update_older_adult_care(staff,100)
            self.assertEqual(report["served"],0)

if __name__=="__main__":unittest.main()
