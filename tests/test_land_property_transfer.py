"""Compraventa municipal y persistencia del folio catastral."""
import json
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

import server


class LandPropertyTransfer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http=ThreadingHTTPServer(("127.0.0.1",0),server.Handler)
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close();cls.thread.join()

    def setUp(self):
        self.previous_state,self.previous_room=server.state,server.ROOM_OPEN
        server.state=server.new_settlement_state();server.state["money"]=10000
        server.state["buildings"]=[{"id":"home-6-10","x":6,"y":10,"kind":"home","name":"Casa del Parque","quality":82,"ownerType":"private"}]
        server.state["landClaims"]={"chunkSize":8,"unlockedChunks":["0,0","1,0","0,1","1,1"],"expansionCount":0,"chunkTitles":{},"parcelDeeds":{},"registryVersion":0}
        server.ensure_finance_state();ledger=server.state["finance"]["cashLedger"];ledger.update({"openingBalance":10000,"recordedBalance":10000,"receipts":0,"payments":0,"sequence":0,"entries":[]})
        server.ROOM_OPEN=True

    def tearDown(self):server.state,server.ROOM_OPEN=self.previous_state,self.previous_room

    def action(self):
        request=urllib.request.Request(f"http://127.0.0.1:{self.http.server_port}/api/action",data=json.dumps({"action":"acquirePrivateProperty","x":6,"y":10}).encode(),headers={"Content-Type":"application/json"},method="POST")
        try:
            with urllib.request.urlopen(request,timeout=5) as response:return response.status,json.load(response)
        except urllib.error.HTTPError as error:return error.code,json.load(error)

    def test_purchase_updates_cash_title_and_transfer_history(self):
        status,body=self.action();self.assertEqual(status,200,body)
        self.assertEqual(server.state["money"],5800)
        deed=server.state["landClaims"]["parcelDeeds"]["6,10"]
        self.assertEqual(deed["ownerType"],"municipal")
        self.assertEqual(deed["ownerName"],"Municipalidad de Puerto Claro")
        self.assertEqual(deed["transferHistory"][-1]["seller"],"Casa del Parque")
        self.assertEqual(deed["transferHistory"][-1]["price"],4200)
        self.assertEqual(body["municipalFinance"]["cashLedger"]["payments"],4200)

    def test_purchase_rejects_unaffordable_and_duplicate_transfer(self):
        server.state["projects"]=[{"id":"reserved","cost":7000,"paid":0,"kind":"road","x":5,"y":10}]
        status,body=self.action();self.assertEqual(status,409);self.assertIn("Quedan $ 3.000",body["error"]);self.assertEqual(server.state["money"],10000)
        server.state["projects"]=[];self.assertEqual(self.action()[0],200)
        status,body=self.action();self.assertEqual(status,409);self.assertIn("titularidad privada",body["error"])


if __name__=="__main__":unittest.main()
