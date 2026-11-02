"""Servicios esenciales finitos: centrales físicas conectadas, avisos y abandono residencial."""
GRACE_DAYS={"power":120,"water":135,"gas":165,"tv":200,"wifi":200}
LABELS={"power":"electricidad","water":"agua","gas":"gas","tv":"TV por cable","wifi":"Wi-Fi"}
NETWORK={"power":"powerLines","water":"waterPipes","gas":"gasLines","tv":"telecomLines","wifi":"telecomLines"}
OFFSETS=((0,0),(1,0),(-1,0),(0,1),(0,-1))

def _live(b):
    return b.get("status","operativo") not in ("abandonado","cerrado","building","en obra","retired","cancelled")

def _connected(tiles):
    root=(4,10)
    if root not in tiles:return set()
    result={root};queue=[root]
    for x,y in queue:
        for dx,dy in OFFSETS[1:]:
            p=(x+dx,y+dy)
            if p in tiles and p not in result:result.add(p);queue.append(p)
    return result

def _adjacent(b,tiles):
    return any((b["x"]+dx,b["y"]+dy) in tiles for dx,dy in OFFSETS)

def _required(b):
    kind=b.get("kind")
    if kind in ("home","hotel"):return ("power","water","gas","tv","wifi")
    if kind in ("powerPlant","waterPlant","gasPlant","wastewaterPlant"):return ("power","water")
    if kind=="civic" and b.get("serviceModel") in ("tvHeadend","wifiHub"):return ("power",)
    if kind in ("factory","shop","school","civic"):return ("power","water","gas","wifi")
    return ("power","water","gas")

def _demand(b,service):
    people=max(0,float(b.get("occupants") or 0))
    workers=max(1,float((b.get("business") or {}).get("lastWorkers") or b.get("jobSlots") or 0))
    used=b.get("utilityDemand") or {}
    if service=="power":return max(2,float(used.get("powerKw") or 0),people*.72,6 if b.get("kind")=="home" else min(60,workers*.9))
    if service=="water":return max(.8,float(used.get("waterM3Day") or 0),people*.12,2 if b.get("kind")=="home" else workers*.08)
    if service=="gas":return max(.3,float(used.get("gasM3Day") or 0),people*.025,1 if b.get("kind")=="home" else workers*.03)
    if service=="tv":return max(1,int((people+4)//5))
    return max(1,int((people+4)//5),1 if b.get("kind")=="home" else int((workers+7)//8))

def evaluate_essential_services(city):
    u=city.setdefault("utilities",{})
    buildings=[b for b in city.get("buildings",[]) if _live(b)]
    roads=_connected({tuple(p) for p in city.get("roads",[])})
    nets={}
    for service,key in NETWORK.items():
        tiles={tuple(p) for p in u.get(key,[]) if tuple(p) in roads}
        network="telecom" if service in ("tv","wifi") else service
        failed={(f.get("x"),f.get("y")) for f in u.get("failures",[]) if f.get("network")==network and f.get("status")!="reparada"}
        nets[service]=_connected(tiles-failed)
    live=lambda b:_live(b) and _adjacent(b,roads)
    def available(b,network):return live(b) and _adjacent(b,nets[network])
    def quality(b):return max(0,min(1,float(b.get("quality",82))/82))
    capacity={"power":sum(float(b.get("generationKw",900))*quality(b) for b in buildings if b.get("kind")=="powerPlant" and available(b,"power")),"water":0,"gas":0,"tv":0,"wifi":0}
    assigned={s:set() for s in NETWORK}
    served={s:0 for s in NETWORK}
    def priority(b):
        if b.get("kind") in ("powerPlant","waterPlant","gasPlant"):return 0
        if b.get("kind")=="civic" and b.get("serviceModel") in ("tvHeadend","wifiHub"):return 1
        if b.get("kind")=="home":return 2
        return 3
    consumers=sorted(buildings,key=lambda b:(priority(b),b["y"],b["x"]))
    for service in NETWORK:
        if service=="water":
            capacity["water"]=sum(float(b.get("treatmentM3Day",220))*quality(b) for b in buildings if b.get("kind")=="waterPlant" and available(b,"water") and id(b) in assigned["power"])
        if service=="gas":
            capacity["gas"]=sum(float(b.get("gasCapacityM3Day",160))*quality(b) for b in buildings if b.get("kind")=="gasPlant" and available(b,"gas") and id(b) in assigned["power"])
        if service in ("tv","wifi"):
            model="tvHeadend" if service=="tv" else "wifiHub"
            field="tvConnections" if service=="tv" else "wifiConnections"
            fallback=180 if service=="tv" else 160
            capacity[service]=sum(float(b.get(field,fallback))*quality(b) for b in buildings if b.get("kind")=="civic" and b.get("serviceModel")==model and available(b,service) and id(b) in assigned["power"])
        remaining=capacity[service]
        for building in consumers:
            if service not in _required(building):continue
            requested=_demand(building,service)
            if available(building,service) and remaining+1e-9>=requested:
                remaining-=requested
                served[service]+=requested
                assigned[service].add(id(building))
        capacity[service]=round(capacity[service],2)
    summary={s:{"capacity":capacity[s],"used":round(served[s],2),"free":round(max(0,capacity[s]-served[s]),2),"connectedRoadSegments":len(nets[s]),"buildingsServed":len(assigned[s])} for s in NETWORK}
    remaining=max(0,capacity["power"]-served["power"])
    streetlights=[]
    for x,y in sorted(nets["power"]):
        if remaining<.22:break
        remaining-=.22;streetlights.append([x,y])
    u["poweredStreetlightTiles"]=streetlights
    for building in buildings:
        access=building.setdefault("utilityAccess",{})
        missing=[];reasons={}
        for service in _required(building):
            field={"power":"powerServedPct","water":"waterServedPct","gas":"gasServedPct","tv":"tvServedPct","wifi":"wifiServedPct"}[service]
            connected=available(building,service)
            yes=id(building) in assigned[service]
            access[field]=100 if yes else 0
            access[("telecom" if service in ("tv","wifi") else service)+"Connected"]=connected
            if not yes:
                missing.append(service)
                reasons[service]=("Sin central construida" if not capacity[service] else "Capacidad máxima alcanzada") if connected else "Red vial o cable desconectado"
        if "wifi" in _required(building):access["telecomServedPct"]=access["wifiServedPct"]
        building["missingServices"]=missing
        building["missingServiceReasons"]=reasons
    u["essentialServices"]=summary
    return summary

def advance_essential_service_day(city,notify=None):
    day=int(city.get("day") or 1);removed=[]
    for b in list(city.get("buildings",[])):
        if b.get("kind")!="home" or not _live(b):continue
        if b.get("lastServiceCheckDay")==day:continue
        days=max(1,min(30,day-int(b.get("lastServiceCheckDay",day-1))))
        b["lastServiceCheckDay"]=day
        outage=b.setdefault("serviceOutageDays",{})
        for service in GRACE_DAYS:outage[service]=outage.get(service,0)+days if service in b.get("missingServices",[]) else 0
        expired=next((s for s in GRACE_DAYS if outage.get(s,0)>=GRACE_DAYS[s]),None)
        if not expired:continue
        displaced=max(int(b.get("occupants") or 0),len(b.get("residents") or []))
        b["status"]="abandonado"
        city["buildings"].remove(b)
        city.setdefault("abandoned",[]).append({
            "id":f'services-{day}-{b["x"]}-{b["y"]}',"x":b["x"],"y":b["y"],"kind":"home",
            "label":"Vivienda abandonada: falta de "+LABELS[expired],"status":"vivienda abandonada",
            "reason":"Falta de "+LABELS[expired],"progress":1,"spent":0,"abandonedDay":day,"displaced":displaced
        })
        city["population"]=max(0,city.get("population",0)-displaced)
        housing=city.setdefault("housingDemand",{})
        housing["unmet"]=max(0,housing.get("unmet",0))+displaced
        removed.append({"building":b,"service":expired,"displaced":displaced})
        if notify:notify("Vivienda abandonada",f'{b.get("name","Vivienda")} ({b["x"]+1},{b["y"]+1}): {displaced} residentes se fueron por falta de {LABELS[expired]}.')
    return removed
