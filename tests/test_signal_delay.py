"""La espera semafórica afecta sólo rutas motorizadas en el modelo vial."""
import unittest
import server


class SignalDelayTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
