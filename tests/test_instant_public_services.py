"""Los servicios de emergencia se colocan al instante en la sala LAN."""
import json
import threading
import unittest
from unittest import mock
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


    def test_manual_catalog_matches_offline_instant_construction_without_crews_or_materials(self):
        # Cover the manual building catalogue, not automatically developed zoning works.
        catalogue=[
            ("civic","clinic"),("civic","medicalCenter"),("civic","generalHospital"),
            ("civic","socialShelter"),("civic","elderCare"),("civic","cemetery"),
            ("civic","crematorium"),("civic","policePost"),("civic","policeStation"),
            ("civic","policeHQ"),("civic","urbanPark"),("civic","tvHeadend"),
            ("civic","wifiHub"),("school","kindergarten"),("school","primarySchool"),
            ("school","secondarySchool"),("school","university"),
            ("fireStation","firePost"),("fireStation","fireStationPlus"),
            ("fireStation","fireCommand"),("depot","wasteYard"),("depot","wasteDepot"),
            ("depot","wasteComplex"),("depot","taxiYard"),
            ("busGarage",None),("powerPlant",None),("waterPlant",None),
            ("gasPlant",None),("wastewaterPlant",None),("landfill",None),
            ("recyclingPlant",None),("home",None),("shop",None),("factory",None),
            ("hotel",None),("airport",None),
        ]
        for kind,model_id in catalogue:
            with self.subTest(kind=kind,model=model_id):
                server.state=server.new_settlement_state()
                city=server.state
                city["money"]=500000
                city["privateCapital"]=500000
                if kind in ("home","shop","factory"):
                    city["zones"].append({"x":5,"y":10,"kind":kind,"owner":"municipal","status":"disponible"})
                for stock in city["supply"]["contractors"].values():
                    for material in stock:stock[material]=0
                data={"kind":kind,"x":5,"y":10,"contractor":"Sur Obras"}
                if model_id:data["serviceModel"]=model_id
                with mock.patch.object(server,"contractor_has_capacity",return_value=False),mock.patch.object(server,"contractor_free_workers",return_value=0):
                    status,body=self.action(**data)
                self.assertEqual(status,200,(kind,model_id,body))
                finished=[building for building in city["buildings"] if (building["x"],building["y"])==(5,10)]
                self.assertEqual(len(finished),1,(kind,model_id))
                self.assertEqual(finished[0]["kind"],kind)
                self.assertEqual(finished[0]["status"],"habilitado")
                self.assertEqual(len(city["projects"]),0,"La obra manual no debe quedar como contrato pendiente.")
                if model_id:self.assertEqual(finished[0].get("serviceModel"),model_id)
                spec=server.SERVICE_MODELS.get(model_id) or server.SCHOOL_MODELS.get(model_id) or server.PROJECTS[kind]
                expected_cost=spec["cost"]
                expected_municipal_cost=max(50,round(expected_cost*.12)) if kind in ("home","shop","factory","hotel") else expected_cost
                self.assertEqual(500000-city["money"],expected_municipal_cost,(kind,model_id))

    def test_bridge_port_and_bus_stop_are_also_immediate(self):
        for kind,x,y in (("bridge",24,10),("port",23,9),("busStop",4,9)):
            with self.subTest(kind=kind):
                server.state=server.new_settlement_state()
                city=server.state
                city["money"]=500000
                city["roads"]=[[road_x,10] for road_x in range(4,24)]
                city["landClaims"]["unlockedChunks"].extend(["2,1","3,1"])
                if kind=="busStop":
                    city["busRoutes"]=[{"id":"test-bus","route":[[4,10],[5,10],[6,10]],"status":"active",
                                         "stops":[],"operational":True,"buses":1}]
                payload={"kind":kind,"x":x,"y":y,"contractor":"Sur Obras"}
                if kind=="busStop":payload["busLineId"]="test-bus"
                with mock.patch.object(server,"contractor_has_capacity",return_value=False),mock.patch.object(server,"contractor_free_workers",return_value=0):
                    status,response=self.action(**payload)
                self.assertEqual(status,200,(kind,response))
                self.assertFalse(city["projects"],"Un proyecto manual no queda pendiente")
                self.assertEqual(500000-city["money"],server.PROJECTS[kind]["cost"])
                if kind=="bridge":
                    self.assertIn([24,10],city["roads"])
                    self.assertIn([25,10],city["roads"])
                else:
                    self.assertTrue(any(b.get("kind")==kind and (b["x"],b["y"])==(x,y) for b in city["buildings"]))

    def test_failed_manual_construction_does_not_charge_money_or_create_project(self):
        server.state=server.new_settlement_state()
        server.state["money"]=100
        status,body=self.action(kind="school",serviceModel="primarySchool",x=5,y=10,contractor="Sur Obras")
        self.assertEqual(status,409,body)
        self.assertEqual(server.state["money"],100)
        self.assertEqual(server.state["buildings"],[])
        self.assertEqual(server.state["projects"],[])

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
