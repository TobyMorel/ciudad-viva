"""La espera semafórica afecta sólo rutas motorizadas en el modelo vial."""
import unittest
import server


class SignalDelayTests(unittest.TestCase):
    def setUp(self):
        self.old_state=server.state
        server.state=server.initial_state()

    def tearDown(self):
        server.state=self.old_state

    def test_each_three_or_four_way_intersection_adds_thirty_seconds(self):
        roads = {
            (0, 1), (1, 1), (2, 1),
            (1, 0), (1, 2),
            (3, 1), (3, 0), (3, 2), (4, 1),
        }
        self.assertEqual(server.signal_delay_minutes([(0, 1), (1, 1), (2, 1)], roads), 0.5)
        self.assertEqual(server.signal_delay_minutes([(0, 1), (1, 1), (2, 1), (3, 1), (4, 1)], roads), 1.0)

    def test_straight_road_and_endpoints_add_no_signal_wait(self):
        straight_roads = {(0, 1), (1, 1), (2, 1)}
        self.assertEqual(server.signal_delay_minutes([(0, 1), (1, 1), (2, 1)], straight_roads), 0)
        self.assertEqual(server.signal_delay_minutes([(1, 1)], straight_roads), 0)

    def test_players_can_remove_and_restore_an_intersection_signal(self):
        roads={(0,1),(1,1),(2,1),(1,0)}
        server.state['roads']=[list(point) for point in roads]
        route=[(0,1),(1,1),(2,1)]
        self.assertEqual(server.signal_delay_minutes(route,roads),.5)
        self.assertFalse(server.toggle_traffic_signal(1,1))
        self.assertEqual(server.signal_delay_minutes(route,roads),0)
        self.assertTrue(server.toggle_traffic_signal(1,1))
        self.assertEqual(server.signal_delay_minutes(route,roads),.5)
        with self.assertRaisesRegex(ValueError,'cruce'):
            server.toggle_traffic_signal(0,1)


if __name__ == "__main__":
    unittest.main()
