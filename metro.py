"""Líneas de metro con obra civil, material rodante, energía y viajeros verificables.

Las estaciones exigen una construcción física terminada en una parcela libre.
"""
import math
from rail_bus_intermodal import assign_rail_bus_transfers,assign_rail_rail_transfers
from rail_sites import place_rail_station,advance_rail_stations
from rail_freight import freight_capacity_metrics

METRO_TRAIN_COST=2400
METRO_SEATS=80
METRO_FARE_CENTS=60
STAGES=("Estudios y permisos","Excavación y sostenimiento","Vías y estaciones","Inspección y habilitación")

def _station(state,point,mode=None):
    if not isinstance(point,(list,tuple)) or len(point)!=2 or not all(type(n)==int for n in point):return None
    site=next((site for site in state.get("railStations",[]) if site.get("x")==point[0] and site.get("y")==point[1]
               and site.get("status")=="active" and (mode is None or site.get("mode")==mode)),None)
    roads={tuple(p) for p in state.get("roads",[])}
    if not site or not any((point[0]+dx,point[1]+dy) in roads for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):return None
    return site

def metro_station_catalog(state,mode=None):
    result=[]
    for site in state.get("railStations",[]):
        p=[site.get("x"),site.get("y")]
        if (mode is None or site.get("mode")==mode) and _station(state,p,mode) is site:
            result.append({"point":p,"name":site["name"],"mode":site["mode"],"label":f'{site["name"]} · {p[0]+1},{p[1]+1}'})
    return sorted(result,key=lambda e:(e["point"][0],e["point"][1]))[:80]

def _path(a,b):
    # Túnel ortogonal: dos accesos y tramos subterráneos bajo otras parcelas.
    x,y=a;route=[[x,y]]
    while x!=b[0]:x+=1 if b[0]>x else -1;route.append([x,y])
    while y!=b[1]:y+=1 if b[1]>y else -1;route.append([x,y])
    return route


RAIL_TRAIN_COST=3900
RAIL_SEATS=140
RAIL_FARE_CENTS=85
RAIL_STAGES=("Estudios y trazado","Montaje de pilotes","Viaducto, vías y andenes","Pruebas e inspección")

def elevated_road_route(state,a,b):
    roads={tuple(p) for p in state.get("roads",[]) if p[0] not in (24,25)}
    def around(point):
        x,y=point
        return [(x+dx,y+dy) for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)) if (x+dx,y+dy) in roads]
    from collections import deque
    starts=around(a);goals=set(around(b))
    q=deque(starts);prev={p:None for p in starts}
    end=None
    while q:
        p=q.popleft()
        if p in goals:end=p;break
        for n in around(p):
            if n not in prev:prev[n]=p;q.append(n)
    if end is None:return None
    path=[]
    while end is not None:path.append(list(end));end=prev[end]
    return list(reversed(path))

def plan_elevated_rail(state,from_point,to_point,trains=1):
    a=_station(state,from_point,"elevated");b=_station(state,to_point,"elevated")
    if not a or not b or a is b:raise ValueError("Construí primero dos estaciones elevadas terminadas y conectadas a calles.")
    route=elevated_road_route(state,from_point,to_point)
    d=len(route)-1 if route else -1
    if d<4 or d>45:raise ValueError("El tren elevado necesita entre 4 y 45 tramos viales conectados sin cruzar el río.")
    lines=state.setdefault("metroLines",[]);rails=[l for l in lines if l.get("mode")=="elevated"]
    if len(rails)>=3:raise ValueError("Por ahora se pueden contratar hasta tres líneas ferroviarias elevadas.")
    if any(set(map(tuple,l["stations"]))==set(map(tuple,(from_point,to_point))) for l in rails if l.get("status")!="retired"):
        raise ValueError("Ya existe un tren entre esas estaciones.")
    if any(any(tuple(p) in {tuple(q) for q in route} for p in l.get("route",[])) for l in rails if l.get("status")!="retired"):
        raise ValueError("El nuevo viaducto no puede superponerse a otro corredor ferroviario.")
    trains=int(trains)
    if trains not in (1,2):raise ValueError("Contratá uno o dos trenes inicialmente.")
    construction=9500+950*d;total=construction+trains*RAIL_TRAIN_COST
    reserved=sum(max(0,p.get("cost",0)-p.get("paid",0)) for p in state.get("projects",[]) if not p.get("privatePaid"))
    if state.get("money",0)-reserved<total:raise ValueError(f"Fondos disponibles insuficientes: se necesitan $ {total:,}.")
    state["money"]-=total
    day=max(1,int(state.get("day",1)));number=len(rails)+1
    line={"id":f"rail-{day}-{number}","name":f"Tren elevado {number}","mode":"elevated",
          "stations":[list(from_point),list(to_point)],
          "stationNames":[a.get("name","Estación A"),b.get("name","Estación B")],
          "route":route,"status":"building","stageIndex":0,"stage":RAIL_STAGES[0],"elapsed":0,
          "duration":65+d*4,"constructionCost":construction,"purchaseCost":total,
          "trainCount":trains,"fareCents":RAIL_FARE_CENTS,"createdDay":day,
          "dailyRiders":0,"monthlyFareRevenue":0,"operational":False,
          "powerRequiredKw":95+trains*55}
    lines.append(line);return line

def plan_metro(state,from_point,to_point,trains=1):
    a=_station(state,from_point,"metro");b=_station(state,to_point,"metro")
    if not a or not b or a is b:raise ValueError("Construí primero dos estaciones de subte terminadas y conectadas a calles.")
    route=_path(from_point,to_point);distance=len(route)-1
    if distance<3 or distance>26:raise ValueError("Las estaciones deben separarse de 3 a 26 tramos.")
    if any(p[0] in (24,25) for p in route):raise ValueError("La primera línea no puede atravesar el cauce del río.")
    if sum(l.get("mode")!="elevated" for l in state.setdefault("metroLines",[]))>=5:raise ValueError("La red admite hasta cinco líneas de subte en esta etapa.")
    if any(set(map(tuple,line["stations"]))==set(map(tuple,[from_point,to_point])) for line in state["metroLines"] if line.get("status")!="retired"):
        raise ValueError("Ya existe una línea entre esas estaciones.")
    trains=int(trains)
    if trains not in (1,2,3):raise ValueError("La flota inicial permite de uno a tres trenes.")
    construction=12500+distance*1150
    total=construction+trains*METRO_TRAIN_COST
    reserved=sum(max(0,p.get("cost",0)-p.get("paid",0)) for p in state.get("projects",[]) if not p.get("privatePaid"))
    if state.get("money",0)-reserved<total:raise ValueError(f"La inversión requiere $ {total:,} de fondos disponibles.")
    state["money"]-=total
    day=max(1,int(state.get("day",1)))
    line={"id":f"metro-{day}-{len(state['metroLines'])+1}","name":f"Línea {len(state['metroLines'])+1}","stations":[list(from_point),list(to_point)],
          "stationNames":[a.get("name","Estación A"),b.get("name","Estación B")],"route":route,
          "status":"building","stageIndex":0,"stage":STAGES[0],"elapsed":0,
          "duration":72+distance*5,"constructionCost":construction,"purchaseCost":total,
          "trainCount":trains,"fareCents":METRO_FARE_CENTS,"createdDay":day,"dailyRiders":0,
          "monthlyFareRevenue":0,"operational":False,"powerRequiredKw":55+trains*35}
    state["metroLines"].append(line)
    return line

def advance_metro_day(state):
    advance_rail_stations(state)
    for line in state.get("metroLines",[]):
        if line.get("status")!="building":continue
        # El avance requiere obreros y caja ya contratada; la obra se detiene si la ciudad queda sin capacidad laboral.
        available=max(0,int(state.get("jobs",0)))
        if available<=0:
            line["pauseReason"]="La obra espera puestos de trabajo y cuadrillas disponibles."
            continue
        line["pauseReason"]=None
        line["elapsed"]=min(line["duration"],line.get("elapsed",0)+1)
        ratio=line["elapsed"]/max(1,line["duration"])
        line["stageIndex"]=0 if ratio<.12 else 1 if ratio<.58 else 2 if ratio<.94 else 3
        line["stage"]=(RAIL_STAGES if line.get("mode")=="elevated" else STAGES)[line["stageIndex"]]
        if line["elapsed"]>=line["duration"]:
            line["status"]="active";line["stage"]="Habilitada";line["completedDay"]=state.get("day",1)

def metro_power_available(state,line):
    plants=[b for b in state.get("buildings",[]) if b.get("kind")=="powerPlant"
            and b.get("status","operativo") in ("operativo","habilitado")]
    total=sum(max(0,b.get("generationKw",900))*max(.2,min(1,b.get("quality",82)/82)) for b in plants)
    base=max(0,state.get("utilities",{}).get("basePowerCapacityKw",0))
    return total+base>=line.get("powerRequiredKw",90)

def metro_refresh(state):
    funding=max(0,min(1,state.get("finance",{}).get("programBudgets",{}).get("mobilityFundingFactor",1)))
    for line in state.get("metroLines",[]):
        active=line.get("status")=="active"
        energy=metro_power_available(state,line)
        ready=active and line.get("trainCount",0)>0 and energy and funding>=.5
        line["operational"]=bool(ready)
        line["pauseReason"]=("Obra todavía en curso" if line.get("status")=="building" else
                            "Servicio pausado" if line.get("status")=="paused" else
                            "Sin trenes" if active and not line.get("trainCount") else
                            "Electricidad insuficiente" if active and not energy else
                            "Presupuesto de movilidad insuficiente" if active and funding<.5 else None)
        d=max(1,len(line.get("route",[]))-1)
        n=line.get("trainCount",0)
        rail=line.get("mode")=="elevated"
        line["headwayMinutes"]=max(5,math.ceil(d*(3 if rail else 4)/max(1,n)))
        line["dailyCapacity"]=n*(RAIL_SEATS if rail else METRO_SEATS)*3 if ready else 0
        line["freightCapacityPerDay"]=n*60 if ready and rail else 0
        line.update(freight_capacity_metrics(line))
        line["monthlyOperatingCost"]=round((390 if rail else 230)+(110 if rail else 85)*d+(260 if rail else 140)*n+line.get("powerRequiredKw",0)*.7) if ready else 0
        line["energyKw"]=line.get("powerRequiredKw",0) if ready else 0

def metro_action(state,action,data):
    if action in ("placeMetroStation","placeRailStation"):
        return place_rail_station(state,"elevated" if action=="placeRailStation" else "metro",data.get("x"),data.get("y"))
    if action=="planMetroLine":
        a=data.get("from");b=data.get("to")
        return plan_metro(state,a,b,data.get("trains",1))
    if action=="planRailLine":return plan_elevated_rail(state,data.get("from"),data.get("to"),data.get("trains",1))
    line=next((l for l in state.get("metroLines",[]) if l.get("id")==data.get("id")),None)
    if line is None:raise ValueError("La línea de subte ya no existe.")
    if action in ("buyMetroTrain","buyRailTrain"):
        rail=line.get("mode")=="elevated";cost=RAIL_TRAIN_COST if rail else METRO_TRAIN_COST;limit=4 if rail else 5
        if (action=="buyRailTrain")!=rail:raise ValueError("Acción incorrecta para este tipo de tren.")
        if line.get("status") not in ("active","paused") or line.get("trainCount",0)>=limit:raise ValueError("La línea no está habilitada o alcanzó su flota máxima.")
        reserved=sum(max(0,p.get("cost",0)-p.get("paid",0)) for p in state.get("projects",[]) if not p.get("privatePaid"))
        if state.get("money",0)-reserved<cost:raise ValueError("No hay fondos libres para otro tren.")
        state["money"]-=cost;line["trainCount"]+=1
    elif action in ("pauseMetroLine","pauseRailLine"):
        if (action=="pauseRailLine")!=(line.get("mode")=="elevated"):raise ValueError("Acción incorrecta para la línea.")
        if line.get("status")!="active":raise ValueError("La línea no está activa.")
        line["status"]="paused"
    elif action in ("resumeMetroLine","resumeRailLine"):
        if (action=="resumeRailLine")!=(line.get("mode")=="elevated"):raise ValueError("Acción incorrecta para la línea.")
        if line.get("status")!="paused":raise ValueError("La línea no está en pausa.")
        line["status"]="active"
    else:raise ValueError("Acción de subte desconocida.")
    metro_refresh(state)
    return line

def metro_assign_passengers(state,trips):
    metro_refresh(state)
    day=max(1,int(state.get("day",1)));month=(day-1)//30
    for line in state.get("metroLines",[]):
        if line.get("fareMonth")!=month:
            line["fareMonth"]=month;line["fareByDay"]={}
        line["dailyRiders"]=0
        line["fareByDay"][str(day)]={}
    for trip in trips:
        for key in ("metroRiders","metroLineId","metroLineIds","railRiders","railLineId","intermodalRiders","intermodalJourneys"):trip.pop(key,None)
    bus_intermodal=assign_rail_bus_transfers(state,trips,day)
    rail_intermodal=assign_rail_rail_transfers(state,trips)
    total=bus_intermodal["metroRiders"]+bus_intermodal["railRiders"]+rail_intermodal["metroRiders"]+rail_intermodal["railRiders"]
    rail_total=bus_intermodal["railRiders"]+rail_intermodal["railRiders"]
    for trip in trips:
        if trip.get("reason") not in ("compras","servicios","ocio") or trip.get("mode") not in ("auto","walk"):continue
        if not isinstance(trip.get("from"),list) or not isinstance(trip.get("to"),list):continue
        remaining=max(0,int(trip.get("workers",0))-int(trip.get("busRiders",0))-int(trip.get("intermodalRiders",0)))
        for line in state.get("metroLines",[]):
            if not remaining or not line.get("operational"):continue
            a,b=line["stations"]
            can_forward=abs(a[0]-trip["from"][0])+abs(a[1]-trip["from"][1])<=2 and abs(b[0]-trip["to"][0])+abs(b[1]-trip["to"][1])<=2
            can_backward=abs(b[0]-trip["from"][0])+abs(b[1]-trip["from"][1])<=2 and abs(a[0]-trip["to"][0])+abs(a[1]-trip["to"][1])<=2
            if not (can_forward or can_backward):continue
            wait=line["headwayMinutes"]/2
            minutes=(4 if line.get("mode")=="elevated" else 8)+wait+(len(line["route"])-1)*(1 if line.get("mode")=="elevated" else 1.25)
            car_minutes=7+trip.get("distance",0)*2.5
            if minutes>car_minutes*1.3:continue
            count=min(remaining,max(0,line["dailyCapacity"]-line["dailyRiders"]))
            if not count:continue
            line["dailyRiders"]+=count;remaining-=count;total+=count
            if line.get("mode")=="elevated":
                rail_total+=count;trip["railRiders"]=trip.get("railRiders",0)+count;trip["railLineId"]=line["id"]
            trip["metroRiders"]=trip.get("metroRiders",0)+count
            trip["metroLineId"]=line["id"]
            home=",".join(map(str,trip["from"]))
            fares=line["fareByDay"][str(day)]
            fares[home]=fares.get(home,0)+count*int(line["fareCents"])
        if trip.get("metroRiders") and trip["mode"]=="auto":
            cars=max(0,int(trip["workers"])-int(trip.get("busRiders",0))-int(trip["metroRiders"]))
            trip["vehicles"]=math.ceil(cars/1.4)
            trip["dailyEmissionsKg"]=round(trip["vehicles"]*trip.get("distance",0)*.18*2,2)
    for line in state.get("metroLines",[]):
        line["fareDue"]=round(sum(sum(v.values()) for v in line["fareByDay"].values())/100,2)
        line.update(freight_capacity_metrics(line))
    return {"metroRiders":total-rail_total,"railRiders":rail_total,
            "metroLinesOperational":sum(l.get("operational",False) for l in state.get("metroLines",[]) if l.get("mode")!="elevated"),
            "railLinesOperational":sum(l.get("operational",False) for l in state.get("metroLines",[]) if l.get("mode")=="elevated"),
            "intermodalTransfers":bus_intermodal["transfers"]+rail_intermodal["transfers"],
            "busRailTransfers":bus_intermodal["transfers"],"railTransfers":rail_intermodal["transfers"]}

def settle_metro_month(state):
    homes={(b.get("x"),b.get("y")):b for b in state.get("buildings",[]) if b.get("kind")=="home"}
    metro_refresh(state)
    revenue=cost=0
    for line in state.get("metroLines",[]):
        line_cost=line.get("monthlyOperatingCost",0)
        cost+=line_cost
        paid=0
        for daily in line.get("fareByDay",{}).values():
            for key,cents in sorted(daily.items()):
                try:home=homes.get(tuple(map(int,key.split(","))))
                except ValueError:home=None
                if home is None:continue
                charge=min((cents+50)//100,max(0,int(home.get("householdCash",0))))
                home["householdCash"]-=charge;paid+=charge
        line["monthlyFareRevenue"]=paid;revenue+=paid
        # Una vez liquidado, no cobrar el mismo mes otra vez.
        line["fareByDay"]={};line["fareMonth"]=(max(1,int(state.get("day",1)))-1)//30
    return {"income":revenue,"cost":cost}
