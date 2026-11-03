import unittest
from unittest.mock import patch
import server

class PoliceUrbanOnline(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.ensure_supply_state()
        server.ensure_finance_state()
        self.s=server.state
        self.s["money"]=50000
        self.center={"kind":"civic","name":"Comisaría de ensayo","serviceModel":"policePost","x":12,"y":12,"status":"habilitado","jobSlots":16}
        self.s["buildings"].append(self.center)
        self.center["utilityAccess"]={"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100}
        for b in self.s["buildings"]:
            if b["kind"] in ("home","shop"):
                b["utilityAccess"]={"powerServedPct":100,"waterServedPct":100,"wastewaterTreatedPct":100}
        self.staff=[{"kind":"civic","x":self.center["x"],"y":self.center["y"],"staffedJobs":16}]

    def test_equip_vehicles_and_reassignment_take_real_money_and_staff(self):
        with patch.object(server,"route_between",return_value=[(4,10)]*4):
            base=server.health_service_report(self.staff)["primary"]["capacityPerDay"]
            before=self.s["money"]
            server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])
            self.assertEqual(self.s["money"],before-4000)
            self.assertEqual(server.police_staff_reserved(self.center,self.staff),3)
            after=server.health_service_report(self.staff)["primary"]["capacityPerDay"]
            self.assertEqual(after,base,"Una comisaría no es un consultorio ni atiende pacientes.")
            with self.assertRaisesRegex(ValueError,"ya cuenta"):
                server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])
            server.invest_police_unit("addPoliceVehicle",self.center["x"],self.center["y"])
            self.assertEqual(self.center["policeUnit"]["vehicles"],2)
            self.assertEqual(self.s["money"],before-6500)
            server.invest_police_unit("setPolicePriority",self.center["x"],self.center["y"],"comercial")
            self.assertEqual(self.center["policeUnit"]["priority"],"comercial")
            self.assertEqual(self.s["money"],before-6500,"Cambiar prioridad no cobra por duplicado.")
            self.assertGreater(server.police_service_report(self.staff)["monthlyOperatingCost"],0)

    def test_monthly_incidents_are_causal_and_idempotent(self):
        self.s["day"]=31
        with patch.object(server,"route_between",return_value=[(4,10)]*4):
            server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])
            report=server.police_service_report(self.staff,advance=True)
            self.assertGreater(report["lastIncidents"],0)
            self.assertGreater(report["lastResponded"],0)
            self.assertLessEqual(report["lastResponded"],2,"Un móvil atiende hasta dos incidentes mensuales.")
            first=report["totalResponded"]+report["totalUnanswered"]
            cash=self.s["money"]
            same=server.police_service_report(self.staff,advance=True)
            self.assertEqual(same["totalResponded"]+same["totalUnanswered"],first)
            self.assertEqual(self.s["money"],cash)
        with patch.object(server,"route_between",return_value=None):
            later=server.police_service_report(self.staff)
            self.assertEqual(later["coveredSites"],0)
        self.s["day"]=61
        with patch.object(server,"route_between",return_value=None):
            report=server.police_service_report(self.staff,advance=True)
            self.assertGreater(report["lastUnanswered"],0)
            self.assertEqual(report["lastResponded"],0)

    def test_no_free_equipment_without_access_or_available_money(self):
        self.s["money"]=5200
        self.s["projects"].append({"cost":2000,"paid":0,"privatePaid":False})
        with patch.object(server,"route_between",return_value=[(4,10)]):
            with self.assertRaisesRegex(ValueError,"Caja libre"):
                server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])
        self.assertNotIn("policeUnit",self.center)
        with patch.object(server,"route_between",return_value=None):
            with self.assertRaisesRegex(ValueError,"conexión vial"):
                server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])

    def test_existing_unanswered_incident_is_dispatched_after_station_opens(self):
        home=next(b for b in self.s["buildings"] if b["kind"]=="home")
        mission={"id":"pending-police-test","x":home["x"],"y":home["y"],"day":self.s["day"],"status":"sin respuesta","location":"Barrio de prueba"}
        self.s.setdefault("police",{})["recentIncidents"]=[mission]
        with patch.object(server,"route_between",return_value=[(4,10),(5,10),(6,10)]):
            server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])
            server.police_service_report(self.staff,advance=True)
            self.assertEqual(mission["status"],"en respuesta")
            self.assertEqual(mission["stationX"],self.center["x"])
            self.s["day"]+=1
            server.police_service_report(self.staff,advance=True)
            self.assertEqual(mission["status"],"atendido")


    def test_patrol_vehicle_is_reserved_through_return_and_monthly_limit_persists(self):
        self.s["day"]=1
        self.s.setdefault("police",{})["recentIncidents"]=[]
        uncovered=server.police_service_report(self.staff)
        self.assertGreater(uncovered["coverageGapCount"],0)
        self.assertEqual(uncovered["coverageGaps"][0]["reasonCode"],"sin_base")
        path=[(12,12),(12,13),(13,13)]
        with patch.object(server,"route_between",return_value=[(4,10),(12,12)]), patch.object(server,"service_route_within",return_value=path):
            server.invest_police_unit("openPoliceUnit",self.center["x"],self.center["y"])
            sites=[b for b in self.s["buildings"] if b.get("kind") in ("home","shop")][:3]
            self.assertEqual(len(sites),3)
            missions=[{"id":f"pending-{i}","x":b["x"],"y":b["y"],"day":1,"month":0,
                       "status":"sin respuesta","location":b.get("name","Barrio")} for i,b in enumerate(sites)]
            self.s["police"]["recentIncidents"]=missions
            report=server.police_service_report(self.staff,advance=True)
            dispatched=[m for m in missions if m["status"]=="en respuesta"]
            self.assertEqual(len(dispatched),1,"Un móvil no puede atender dos incidentes a la vez.")
            self.assertEqual(dispatched[0]["vehicleIndex"],0)
            self.assertEqual(report["units"][0]["busyVehicles"],1)
            self.assertEqual(report["coverageGapCount"],0)
            self.s["day"]=2
            report=server.police_service_report(self.staff,advance=True)
            self.assertEqual(missions[0]["status"],"atendido")
            self.assertEqual(missions[1]["status"],"sin respuesta","El móvil sigue volviendo a la base.")
            self.assertEqual(report["units"][0]["busyVehicles"],1)
            self.s["day"]=3
            report=server.police_service_report(self.staff,advance=True)
            self.assertEqual(missions[1]["status"],"en respuesta")
            self.assertEqual(missions[1]["vehicleIndex"],0)
            self.assertEqual(missions[2]["status"],"sin respuesta")
            self.assertIn("agotaron",missions[2]["responseCause"])
            self.s["day"]=4
            server.police_service_report(self.staff,advance=True)
            self.assertEqual(missions[2]["status"],"sin respuesta","Un móvil conserva el límite de dos despachos en el mes.")


    def test_nearest_available_base_takes_next_incident_when_closer_mobile_is_busy(self):
        homes=[b for b in self.s["buildings"] if b.get("kind")=="home"][:2]
        self.assertEqual(len(homes),2)
        nearby={"kind":"civic","name":"Base Este","serviceModel":"policePost","x":18,"y":12,
                "status":"habilitado","jobSlots":16,"policeUnit":{"vehicles":1,"priority":"mixto"}}
        self.s["buildings"].append(nearby)
        self.center["policeUnit"]={"vehicles":1,"priority":"mixto"}
        workplaces=self.staff+[{"kind":"civic","x":18,"y":12,"staffedJobs":16}]
        paths={}
        for home in homes:
            key=(home["x"],home["y"])
            paths[(18,12,*key)]=[(18,12),(18,11),key]
            paths[(12,12,*key)]=[(12,12),(13,12),(14,12),(15,12),key]
        missions=[{"id":f"multi-base-{i}","x":home["x"],"y":home["y"],"day":1,
                   "status":"sin respuesta","location":home.get("name","Barrio")} for i,home in enumerate(homes)]
        self.s["day"]=1
        self.s["police"]={"lastProcessedMonth":0,"recentIncidents":missions}
        def route(base,target):
            return paths.get((base["x"],base["y"],target["x"],target["y"]))
        with patch.object(server,"service_route_within",side_effect=route):
            report=server.police_service_report(workplaces,advance=True)
        self.assertEqual(missions[0]["station"],"Base Este","La primera incidencia usa la base con menor tiempo de llegada.")
        self.assertEqual(missions[1]["station"],self.center["name"],"La patrulla cercana ocupada deja paso a otra base disponible.")
        units={unit["name"]:unit for unit in report["units"]}
        self.assertEqual(units["Base Este"]["busyVehicles"],1)
        self.assertEqual(units[self.center["name"]]["busyVehicles"],1)

    def test_dispatch_uses_another_base_when_the_nearest_route_is_cut(self):
        home=next(b for b in self.s["buildings"] if b.get("kind")=="home")
        nearby={"kind":"civic","name":"Base Este","serviceModel":"policePost","x":18,"y":12,
                "status":"habilitado","jobSlots":16,"policeUnit":{"vehicles":1,"priority":"mixto"}}
        self.s["buildings"].append(nearby)
        self.center["policeUnit"]={"vehicles":1,"priority":"mixto"}
        workplaces=self.staff+[{"kind":"civic","x":18,"y":12,"staffedJobs":16}]
        far_path=[(12,12),(13,12),(14,12),(15,12),(home["x"],home["y"])]
        mission={"id":"cut-near-route","x":home["x"],"y":home["y"],"day":1,
                 "status":"sin respuesta","location":home.get("name","Barrio")}
        self.s["day"]=1
        self.s["police"]={"lastProcessedMonth":0,"recentIncidents":[mission]}
        def route(base,target):
            if (target["x"],target["y"])!=(home["x"],home["y"]):return None
            if base["x"]==18 and base["y"]==12:return None
            if base["x"]==12 and base["y"]==12:return far_path
            return None
        with patch.object(server,"service_route_within",side_effect=route):
            report=server.police_service_report(workplaces,advance=True)
        self.assertEqual(mission["status"],"en respuesta")
        self.assertEqual(mission["station"],self.center["name"])
        self.assertEqual(mission["route"],far_path)
        self.assertEqual(report["lastResponded"],0,"El aviso pendiente se despacha fuera del operativo mensual.")
        self.assertIsNone(mission["responseCause"])

if __name__=="__main__":
    unittest.main()
