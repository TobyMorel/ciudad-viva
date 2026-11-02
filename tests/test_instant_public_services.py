"""Los servicios de emergencia se colocan al instante en la sala LAN."""
import json
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

import server


class InstantPublicServices(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http=ThreadingHTTPServer(("127.0.0.1",0),server.Handler)
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close();cls.thread.join()

    def setUp(self):
        self.previous_state,self.previous_room=server.state,server.ROOM_OPEN
        server.state=server.new_settlement_state()
        server.state["money"]=100000
        server.ROOM_OPEN=True

    def tearDown(self):
        server.state,server.ROOM_OPEN=self.previous_state,self.previous_room

    def action(self,**data):
        request=urllib.request.Request(f"http://127.0.0.1:{self.http.server_port}/api/action",data=json.dumps({"action":"place",**data}).encode(),headers={"Content-Type":"application/json"},method="POST")
        try:
            with urllib.request.urlopen(request,timeout=5) as response:return response.status,json.load(response)
        except urllib.error.HTTPError as error:return error.code,json.load(error)

    def test_hospital_police_and_fire_open_without_projects_or_crews(self):
        for kind,model,x,y in (("civic","generalHospital",5,10),("civic","policeStation",4,9),("fireStation","fireStationPlus",4,11)):
            status,body=self.action(kind=kind,serviceModel=model,x=x,y=y)
            self.assertEqual(status,200,body)
            building=next((b for b in server.state["buildings"] if b["x"]==x and b["y"]==y),None)
            self.assertIsNotNone(building)
            self.assertEqual(building["status"],"habilitado")
            self.assertEqual(building["serviceModel"],model)
            self.assertFalse(any(p["x"]==x and p["y"]==y for p in server.state["projects"]))
        self.assertEqual(server.state["money"],38200)
        self.assertEqual(server.state["buildings"][0]["hospitalWard"]["beds"],36)
        self.assertEqual(server.state["buildings"][1]["policeUnit"]["vehicles"],2)
        self.assertEqual(server.state["buildings"][2]["fireEngineCapacity"],2)
        status,_=self.action(kind="civic",serviceModel="clinic",x=5,y=10)
        self.assertEqual(status,409)

    def test_funds_and_access_are_checked_before_any_charge(self):
        server.state["money"]=100
        status,_=self.action(kind="civic",serviceModel="clinic",x=5,y=10)
        self.assertEqual(status,409)
        self.assertEqual(server.state["money"],100)
        self.assertEqual(server.state["buildings"],[])
        server.state["money"]=100000
        status,_=self.action(kind="fireStation",serviceModel="firePost",x=7,y=10)
        self.assertEqual(status,409)
        self.assertEqual(server.state["money"],100000)

    def test_error_explains_cash_reserved_for_other_projects(self):
        server.state["money"]=10780
        server.state["projects"].append({"x":7,"y":10,"kind":"school","cost":10000,"paid":296,"privatePaid":False})
        status,body=self.action(kind="civic",serviceModel="clinic",x=5,y=10)
        self.assertEqual(status,409)
        for amount in ("10.780","9.704","1.076","8.000"):
            self.assertIn(amount,body["error"])
        self.assertEqual(server.state["money"],10780)
