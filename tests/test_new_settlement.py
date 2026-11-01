import unittest
import server

SERVER_BOOT_STATE=server.state


class NewSettlement(unittest.TestCase):
    def setUp(self):
        self.old_state=server.state
        server.state=server.new_settlement_state()

    def tearDown(self):
        server.state=self.old_state

    def test_online_server_boots_into_an_empty_new_settlement(self):
        self.assertTrue(SERVER_BOOT_STATE["newSettlement"])
        self.assertEqual(SERVER_BOOT_STATE["buildings"],[])
        self.assertEqual(SERVER_BOOT_STATE["roads"],[[4,10]])
        self.assertEqual(SERVER_BOOT_STATE["population"],0)

    def test_starts_empty_with_one_external_access_and_waiting_residents(self):
        self.assertEqual(server.state["buildings"],[])
        self.assertEqual(server.state["roads"],[[4,10]])
        self.assertEqual(server.state["population"],0)
        self.assertEqual(server.state["housingDemand"]["unmet"],36)
        self.assertTrue(server.state["newSettlement"])

    def test_housing_demand_grows_without_jobs_until_startup_resident_pool_is_full(self):
        server.state["day"]=2
        server.move_households()
        self.assertEqual(server.state["housingDemand"]["unmet"],40)
        self.assertEqual(server.state["population"],0)

    def test_private_home_project_does_not_wait_for_city_material_delivery(self):
        server.state["zones"]=[{"x":5,"y":10,"kind":"home","status":"disponible"}]
        before=server.state["privateCapital"]
        server.advance_zoned_development()
        project=next(p for p in server.state["projects"] if p.get("zonedDevelopment"))
        self.assertEqual(project["kind"],"home")
        self.assertTrue(project.get("privateMaterialsIncluded"))
        self.assertTrue(all(not amount for amount in project["materialsRequired"].values()))
        self.assertEqual(server.state["supply"]["orders"],[])
        self.assertLess(server.state["privateCapital"],before)


if __name__=="__main__":
    unittest.main()
