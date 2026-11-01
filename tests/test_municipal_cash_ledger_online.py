"""La conciliación de caja registra cambios netos sin repetir una consulta."""
import unittest
import server

class MunicipalCashLedger(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state();server.state["money"]=10000
        server.state["events"]=[]
        server.state["finance"]["cashLedger"]={"openingBalance":10000,"recordedBalance":10000,"receipts":0,"payments":0,"sequence":0,"entries":[]}
        server.public_state()  # apertura de libro de esta partida

    def test_receipts_payments_and_idempotent_snapshot_reconcile(self):
        server.state["money"]+=400;server.state["events"].insert(0,{"title":"Tasa municipal","detail":"Cobro del período"})
        report=server.public_state()["municipalFinance"]["cashLedger"]
        self.assertEqual((report["openingBalance"],report["receipts"],report["payments"],report["difference"]),(10000,400,0,0))
        self.assertEqual(report["entries"][0]["reference"],"Tasa municipal")
        server.public_state()
        self.assertEqual(server.state["finance"]["cashLedger"]["sequence"],1)
        server.state["money"]-=250;server.state["events"].insert(0,{"title":"Pago de servicio","detail":"Operación mensual"})
        report=server.public_state()["municipalFinance"]["cashLedger"]
        self.assertEqual((report["receipts"],report["payments"],report["actualBalance"],report["calculatedBalance"],report["difference"]),(400,250,10150,10150,0))

    def test_legacy_save_opens_at_existing_cash_without_invented_history(self):
        server.state["finance"].pop("cashLedger",None);server.state["money"]=7350
        report=server.public_state()["municipalFinance"]["cashLedger"]
        self.assertEqual(report["openingBalance"],7350)
        self.assertEqual(report["entries"],[])
        self.assertEqual(report["difference"],0)

if __name__=="__main__":unittest.main()
