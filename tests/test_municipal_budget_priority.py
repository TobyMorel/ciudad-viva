"""La caja municipal escasa sigue la prioridad elegida por el gobierno."""
import unittest
import server


class MunicipalBudgetPriority(unittest.TestCase):
    def setUp(self):
        server.state = server.initial_state()

    def test_chosen_program_gets_limited_cash_before_other_programs(self):
        budgets = server.state["finance"]["programBudgets"]
        self.assertEqual(budgets["programPriority"], ["services", "networks", "mobility"])
        server.set_municipal_program_priority("mobility")
        report = server.settle_municipal_program_budgets(
            {"services": 1000, "networks": 1000, "mobility": 1000}, 1000
        )
        self.assertEqual(report["programs"]["mobility"]["paid"], 1000)
        self.assertEqual(report["programs"]["services"]["paid"], 0)
        self.assertEqual(budgets["programPriority"], ["mobility", "services", "networks"])

    def test_invalid_priority_is_rejected_and_legacy_order_is_completed(self):
        budgets = server.state["finance"]["programBudgets"]
        budgets["programPriority"] = ["networks", "networks", "invalid"]
        self.assertEqual(server.municipal_program_priority(budgets), ["networks", "services", "mobility"])
        with self.assertRaises(ValueError):
            server.set_municipal_program_priority("education")


if __name__ == "__main__":
    unittest.main()
