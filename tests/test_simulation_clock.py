import unittest
import server


class SimulationClockTests(unittest.TestCase):
    def test_x4_advances_one_game_hour_per_real_second(self):
        progress = 6.0
        days = 0
        for _ in range(4):
            progress, due = server.advance_simulation_clock(progress, .25, 4)
            days += int(due)
        self.assertEqual(days, 0)
        self.assertAlmostEqual(progress, 7)

    def test_midnight_emits_one_day_and_preserves_remainder(self):
        progress, due = server.advance_simulation_clock(23.5, .5, 4)
        self.assertTrue(due)
        self.assertAlmostEqual(progress, 0)

    def test_lag_carries_full_day_backlog_one_day_at_a_time(self):
        progress, due = server.advance_simulation_clock(0, 100, 4)
        self.assertTrue(due)
        self.assertAlmostEqual(progress, 76)
        progress, due = server.advance_simulation_clock(progress, 0, 1)
        self.assertTrue(due)
        self.assertAlmostEqual(progress, 52)
        progress, due = server.advance_simulation_clock(progress, 0, 1)
        self.assertTrue(due)
        self.assertAlmostEqual(progress, 28)
        progress, due = server.advance_simulation_clock(progress, 0, 1)
        self.assertTrue(due)
        self.assertAlmostEqual(progress, 4)

    def test_pause_does_not_add_time(self):
        progress, due = server.advance_simulation_clock(6, 0, 1)
        self.assertFalse(due)
        self.assertEqual(progress, 6)


if __name__ == '__main__':
    unittest.main()
