import unittest
from unittest.mock import patch
import server

class TourismEventsOnline(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.ensure_supply_state()
        self.s=server.state
        self.s["money"]=30000
        for b in self.s["buildings"]:
            if b.get("kind")=="shop":
                b["business"]["inventory"]=500
                b["business"]["cash"]=4000
                b["business"]["price"]=20

    def test_fair_has_real_cost_limited_visitors_and_retail_stock(self):
        with patch.object(server,"route_between",return_value=[[4,10]]):
            initial=self.s["money"]
            item=server.schedule_tourism_event("feria")
            self.assertEqual(self.s["money"],initial-1200)
            with self.assertRaisesRegex(ValueError,"Ya existe"):
                server.schedule_tourism_event("feria")
            server.prepare_tourism_event_month(1)
            self.assertEqual(item["status"],"realizado")
            self.assertGreater(item["visitors"],0)
            self.assertEqual(self.s["money"],initial-1200-item["cleanupSpend"])
            shops=[b for b in self.s["buildings"] if b.get("kind")=="shop"]
            stock_before=sum(b["business"]["inventory"] for b in shops)
            cash_before=sum(b["business"]["cash"] for b in shops)
            server.settle_tourism_event_retail()
            self.assertGreater(item["retailSpend"],0)
            self.assertEqual(sum(b["business"]["cash"] for b in shops)-cash_before,item["retailSpend"])
            self.assertLess(sum(b["business"]["inventory"] for b in shops),stock_before)
            server.settle_tourism_event_retail()
            self.assertEqual(sum(b["business"]["cash"] for b in shops)-cash_before,item["retailSpend"],"La liquidación debe ser idempotente")
            self.assertEqual(self.s["population"],server.state["population"])

    def test_canceled_when_roads_disappear_no_infinite_refund(self):
        with patch.object(server,"route_between",return_value=[[4,10]]):
            item=server.schedule_tourism_event("festival")
        balance=self.s["money"]
        self.s["roads"]=[]
        server.prepare_tourism_event_month(1)
        self.assertEqual(item["status"],"cancelado")
        self.assertEqual(item["visitors"],0)
        self.assertEqual(self.s["money"],balance)
        server.prepare_tourism_event_month(1)
        self.assertEqual(self.s["money"],balance)
        self.assertEqual(item["status"],"cancelado")

    def test_congress_requires_open_hotel(self):
        with patch.object(server,"route_between",return_value=[[4,10]]):
            with self.assertRaisesRegex(ValueError,"hotel"):
                server.schedule_tourism_event("congreso")

if __name__=="__main__":
    unittest.main()
