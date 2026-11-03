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

    def test_housing_interest_and_population_keep_growing_without_jobs(self):
        city=server.state
        initial=city["housingDemand"]["unmet"]
        for day in range(2,12):
            city["day"]=day
            server.move_households()
        self.assertGreater(city["housingDemand"]["unmet"],initial)
        city["buildings"]=[{"kind":"home","name":"Barrio nuevo","x":5,"y":10,"capacity":120,"occupants":0,"residents":[],"quality":80}]
        capital=city["privateCapital"]
        for day in range(12,32):
            city["day"]=day
            server.move_households()
        self.assertGreater(city["population"],44)
        self.assertGreaterEqual(city["housingDemand"]["unmet"],4)
        self.assertGreater(city["privateCapital"],capital)

    def test_new_map_has_small_start_and_paid_unbounded_adjacent_expansion(self):
        server.ensure_land_claims(server.state)
        claims=server.state["landClaims"]
        self.assertEqual(claims["chunkSize"],8)
        self.assertEqual(set(claims["unlockedChunks"]),{"0,0","1,0","0,1","1,1"})
        self.assertEqual(claims["chunkTitles"]["0,0"]["rights"],"dominio municipal")
        self.assertEqual(claims["chunkTitles"]["0,0"]["origin"],"territorio inicial")
        self.assertFalse(server.land_tile_unlocked(16,10))
        options=server.land_frontier()
        self.assertIn({"chunk":"2,1","chunkX":2,"chunkY":1,"chunkSize":8,"unlocked":False,"unlockable":True,"cost":5700},options)
        before=server.state["money"]
        server.unlock_land_chunk(2,1)
        self.assertEqual(server.state["money"],before-5700)
        self.assertEqual(server.state["landClaims"]["chunkTitles"]["2,1"]["purchasePrice"],5700)
        self.assertEqual(server.state["landClaims"]["chunkTitles"]["2,1"]["ownerType"],"municipal")
        self.assertTrue(server.land_tile_unlocked(16,10))
        self.assertTrue(server.land_tile_unlocked(23,15))
        self.assertFalse(server.land_tile_unlocked(24,10))

    def test_registry_migration_records_private_title_and_keeps_zoning_as_permit(self):
        city=server.state
        city["buildings"]=[{"id":"house-test","kind":"home","name":"Casa del Parque","x":6,"y":10}]
        city["zones"]=[{"kind":"shop","x":7,"y":10,"owner":"municipal"}]
        city["landClaims"].pop("registryVersion",None)
        claims=server.ensure_land_claims(city)
        deed=claims["parcelDeeds"]["6,10"]
        self.assertEqual(deed["ownerType"],"private")
        self.assertEqual(deed["ownerName"],"Casa del Parque")
        self.assertEqual(deed["rights"],"dominio privado")
        self.assertNotIn("7,10",claims["parcelDeeds"])

    def test_unreachable_and_unfunded_expansion_are_rejected(self):
        with self.assertRaisesRegex(ValueError,"zona vecina"):
            server.unlock_land_chunk(20,20)
        server.state["money"]=4000
        server.state["projects"]=[{"cost":10000,"paid":0,"privatePaid":False}]
        with self.assertRaisesRegex(ValueError,"desbloquear esta zona"):
            server.unlock_land_chunk(-1,0)
        self.assertNotIn("-1,0",server.state["landClaims"]["unlockedChunks"])

    def test_paid_expansion_crosses_the_former_map_edge(self):
        server.state["money"]=1_000_000
        for chunk_x in range(2,6):
            server.unlock_land_chunk(chunk_x,0)
        self.assertTrue(server.land_tile_unlocked(40,3))
        self.assertFalse(server.land_tile_unlocked(48,3))
        self.assertEqual(server.land_chunk_info(40,3)["cost"],12_300)

    def test_river_continues_beyond_the_initial_view_and_has_two_banks(self):
        for y in (-100,0,20,100):
            self.assertFalse(server.is_water(23,y))
            self.assertTrue(server.is_water(24,y))
            self.assertTrue(server.is_water(25,y))
            self.assertFalse(server.is_water(26,y))
        self.assertFalse(server.is_water(20,1))
        server.unlock_land_chunk(2,1)
        self.assertTrue(server.land_chunk_info(24,10)["unlockable"])

    def test_housing_demand_grows_without_jobs(self):
        server.state["day"]=2
        server.move_households()
        self.assertGreater(server.state["housingDemand"]["unmet"],36)
        self.assertEqual(server.state["population"],0)

    def test_building_loses_and_recovers_external_road_access_when_route_is_cut(self):
        home={"kind":"home","x":5,"y":11,"name":"Hogar de prueba"}
        server.state["roads"]=[[4,10],[5,10]]
        self.assertTrue(server.building_road_access(home))
        server.state["roads"]=[[4,10]]
        self.assertFalse(server.building_road_access(home))
        server.state["roads"]=[[4,10],[5,10]]
        self.assertTrue(server.building_road_access(home))

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

    def test_zoned_home_development_reacts_on_daily_tick(self):
        server.state["roads"]=[[4,10],[5,10]]
        server.state["zones"]=[{"x":5,"y":9,"kind":"home","status":"disponible"}]
        server.state["day"]=2
        server.tick_one_day()
        project=next(p for p in server.state["projects"] if p.get("zonedDevelopment"))
        self.assertEqual(project["kind"],"home")
        self.assertEqual(project["status"],"contratada")
        self.assertEqual(project["materialsRequired"],{key:0 for key in server.MATERIAL_NAMES})


if __name__=="__main__":
    unittest.main()
