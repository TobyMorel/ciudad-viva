import unittest
import server


class SimulationClockTests(unittest.TestCase):
    def test_x4_emits_one_ordered_day_per_quarter_second(self):
        progress = 0.0
        days = 0
        for _ in range(4):
            progress, due = server.advance_simulation_clock(progress, .25, 4)
            days += int(due)
        self.assertEqual(days, 4)
        self.assertAlmostEqual(progress, 0)

    def test_lag_is_carried_without_batching_or_dropping_days(self):
        progress, due = server.advance_simulation_clock(0, 2.5, 4)
        self.assertTrue(due)
        self.assertAlmostEqual(progress, 9)
        for _ in range(9):
            progress, due = server.advance_simulation_clock(progress, 0, 4)
            self.assertTrue(due)
        self.assertAlmostEqual(progress, 0)

    def test_pause_does_not_add_time(self):
        progress, due = server.advance_simulation_clock(0, 0, 1)
        self.assertFalse(due)
        self.assertEqual(progress, 0)


if __name__ == '__main__':
    unittest.main()
