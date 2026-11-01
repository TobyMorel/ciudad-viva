"""Contratos privados de áridos: reservas reales, custodia y penalidad de entrega."""
import unittest
import server

class AggregateForwardContracts(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.ensure_supply_state()
        self.s=server.state;self.s["day"]=1
        self.quarry={"x":4,"y":9,"kind":"factory","name":"Cantera Alfa",
            "business":{"id":"q-alfa","industryType":"quarry","status":"abierto",
                        "aggregateStock":30,"cash":5000,"materialPriceFactor":1}}
        self.plant={"x":6,"y":9,"kind":"factory","name":"Hormigonera Beta",
            "business":{"id":"c-beta","industryType":"concrete","status":"abierto",
                        "rawMaterialInventory":0,"cash":20000}}
        self.s["buildings"].extend([self.quarry,self.plant])
        self.s["supply"]["suppliers"]["Cantera local"]["aggregate"]=30

    def test_three_shipments_reserve_once_and_credit_on_delivery(self):
        q=self.quarry["business"];buyer=self.plant["business"];start=buyer["cash"]
        contract=server.sign_aggregate_forward_contract(self.plant,30)
        self.assertIsNotNone(contract)
        lines=[o for o in self.s["supply"]["marketOrders"] if o.get("supplyContractId")==contract["id"]]
        self.assertEqual(len(lines),3)
        self.assertEqual([o["quantity"] for o in lines],[10,10,10])
        self.assertEqual(q["aggregateStock"],0)
        self.assertEqual(self.s["supply"]["suppliers"]["Cantera local"]["aggregate"],0)
        self.assertEqual(q["cash"],5000,"El vendedor no cobra por un contrato aún incumplido")
        self.assertEqual(buyer["cash"],start-contract["contractValue"])
        self.assertEqual(self.s["supply"]["logisticsCash"] if "logisticsCash" in self.s["supply"] else 0,0)
        self.assertEqual(contract["escrow"],contract["contractValue"])
        self.assertTrue(all(o["status"]=="en tránsito" and o["source"]==[4,9] for o in lines))
        self.s["day"]=2;server.process_market_orders()
        self.assertEqual(q["cash"],5000)
        for day in range(3,30):
            self.s["day"]=day;server.process_market_orders()
        self.assertEqual(contract["status"],"cumplido")
        self.assertEqual(contract["escrow"],0)
        self.assertEqual(contract["deliveredUnits"],30)
        self.assertEqual(buyer["rawMaterialInventory"],30)
        self.assertEqual(q["cash"],5000+contract["paidToSeller"])
        self.assertEqual(self.s["supply"]["logisticsCash"],contract["paidToLogistics"])
        self.assertEqual(contract["contractValue"],contract["paidToSeller"]+contract["paidToLogistics"])
        self.assertTrue(all(o.get("contractSettled") for o in lines))
        before=(q["cash"],buyer["cash"])
        server.process_market_orders()
        self.assertEqual((q["cash"],buyer["cash"]),before)

    def test_road_closure_expires_and_refunds_without_new_stock(self):
        q=self.quarry["business"];buyer=self.plant["business"];start=buyer["cash"]
        contract=server.sign_aggregate_forward_contract(self.plant,30)
        self.s["roads"]=[]
        for day in range(2,41):
            self.s["day"]=day;server.process_market_orders()
        self.assertEqual(contract["status"],"incumplido")
        self.assertEqual(contract["escrow"],0)
        self.assertEqual(contract["refunded"],contract["contractValue"])
        self.assertEqual(contract["refundedUnits"],30)
        penalty=sum(o.get("defaultPenaltyPaid",0) for o in self.s["supply"]["marketOrders"] if o.get("supplyContractId")==contract["id"])
        self.assertGreater(penalty,0)
        self.assertEqual(contract["defaultPenaltyPaid"],penalty)
        self.assertEqual(buyer["cash"],start+penalty)
        self.assertEqual(q["cash"],5000-penalty)
        server.process_market_orders()
        self.assertEqual((buyer["cash"],q["cash"]),(start+penalty,5000-penalty))
        self.assertEqual(q["aggregateStock"],30)
        self.assertEqual(self.s["supply"]["suppliers"]["Cantera local"]["aggregate"],30)
        self.assertEqual(buyer["rawMaterialInventory"],0)
        self.assertEqual(self.s["supply"].get("logisticsCash",0),0)

    def test_renegotiation_after_road_cut_preserves_stock_and_escrow(self):
        buyer=self.plant["business"];seller=self.quarry["business"]
        contract=server.sign_aggregate_forward_contract(self.plant,30)
        with self.assertRaisesRegex(ValueError,"corte vial"):
            server.renegotiate_aggregate_forward_contract(contract["id"])
        roads=self.s["roads"][:]
        self.s["roads"]=[]
        lines=[o for o in self.s["supply"]["marketOrders"] if o.get("supplyContractId")==contract["id"]]
        old_deadlines=[o["deadlineDay"] for o in lines]
        fee=max(20,(contract["contractValue"]+10)//20)
        original_escrow=contract["escrow"];original_stock=seller["aggregateStock"]
        original_buyer_cash=buyer["cash"];original_seller_cash=seller["cash"]
        self.s["day"]=2
        server.renegotiate_aggregate_forward_contract(contract["id"])
        self.assertEqual([o["deadlineDay"] for o in lines],[d+14 for d in old_deadlines])
        self.assertEqual((buyer["cash"],seller["cash"]),(original_buyer_cash-fee,original_seller_cash+fee))
        self.assertEqual(contract["escrow"],original_escrow)
        self.assertEqual(seller["aggregateStock"],original_stock)
        with self.assertRaisesRegex(ValueError,"renegociado"):
            server.renegotiate_aggregate_forward_contract(contract["id"])
        for day in range(3,20):
            self.s["day"]=day;server.process_market_orders()
        self.assertTrue(all(o["status"]=="en tránsito" for o in lines))
        self.s["roads"]=roads
        for day in range(20,42):
            self.s["day"]=day;server.process_market_orders()
        self.assertEqual(contract["status"],"cumplido")
        self.assertEqual(contract["escrow"],0)
        self.assertEqual(contract["refunded"],0)
        self.assertEqual(buyer["rawMaterialInventory"],30)
        self.assertEqual(seller["cash"],original_seller_cash+fee+contract["paidToSeller"])
        self.assertEqual(self.s["supply"]["logisticsCash"],contract["paidToLogistics"])

    def test_supplier_bankruptcy_cancels_escrow_before_deadline(self):
        quarry=self.quarry["business"];buyer=self.plant["business"]
        contract=server.sign_aggregate_forward_contract(self.plant,30)
        self.assertIsNotNone(contract)
        lines=[o for o in self.s["supply"]["marketOrders"] if o.get("supplyContractId")==contract["id"]]
        original=buyer["cash"]+contract["contractValue"]
        quarry["status"]="cerrado"
        self.s["day"]=2
        server.expire_aggregate_contract_lines()
        self.assertEqual(contract["status"],"incumplido")
        self.assertEqual(contract["escrow"],0)
        self.assertEqual(contract["refunded"],contract["contractValue"])
        self.assertEqual(contract["lostReservedUnits"],30)
        self.assertEqual(quarry["aggregateStock"],0)
        self.assertEqual(buyer["cash"],original)
        self.assertTrue(all(o["statusCause"]=="Proveedor insolvente" for o in lines))
        server.expire_aggregate_contract_lines()
        self.assertEqual(buyer["cash"],original)

    def test_financing_and_stock_shortage_prevent_contract(self):
        self.plant["business"]["cash"]=500
        self.assertIsNone(server.sign_aggregate_forward_contract(self.plant,30))
        self.assertEqual(self.quarry["business"]["aggregateStock"],30)
        self.assertFalse(self.s["supply"].get("tradeContracts"))

if __name__=="__main__":unittest.main()
