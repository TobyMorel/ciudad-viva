"""Líneas de metro con obra civil, material rodante, energía y viajeros verificables.

Las estaciones subterráneas se vinculan a edificios ya conectados a la calle.
No ocupan una segunda parcela en superficie: los accesos usan suelo edificado.
"""
import math

METRO_TRAIN_COST=2400
METRO_SEATS=80
METRO_FARE_CENTS=60
STAGES=("Estudios y permisos","Excavación y sostenimiento","Vías y estaciones","Inspección y habilitación")

def _station(state,point):
    if not isinstance(point,(list,tuple)) or len(point)!=2:return None
    if not all(type(n)==int for n in point):return None
    b=next((b for b in state.get("buildings",[]) if b.get("x")==point[0] and b.get("y")==point[1]
            and b.get("kind") in ("home","shop","civic","school","hotel","airport","port","depot","factory")
            and b.get("status","operativo") in ("operativo","habilitado")),None)
    roads={tuple(p) for p in state.get("roads",[])}
    if not b or not any((point[0]+dx,point[1]+dy) in roads for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):return None
    return b

def metro_station_catalog(state):
    result=[]
    for b in state.get("buildings",[]):
        p=[b.get("x"),b.get("y")]
        if _station(state,p) is b:
            result.append({"point":p,"name":b.get("name",b["kind"]),"label":f"{b.get('name',b['kind'])} · {p[0]+1},{p[1]+1}"})
    return sorted(result,key=lambda e:(e["point"][0],e["point"][1]))[:80]

def _path(a,b):
    # Túnel ortogonal: dos accesos y tramos subterráneos bajo otras parcelas.
    x,y=a;route=[[x,y]]
    while x!=b[0]:x+=1 if b[0]>x else -1;route.append([x,y])
    while y!=b[1]:y+=1 if b[1]>y else -1;route.append([x,y])
    return route

def plan_metro(state,from_point,to_point,trains=1):
    a=_station(state,from_point);b=_station(state,to_point)
    if not a or not b or a is b:raise ValueError("Elegí dos edificios distintos con acceso vial para las estaciones.")
    route=_path(from_point,to_point);distance=len(route)-1
    if distance<3 or distance>26:raise ValueError("Las estaciones deben separarse de 3 a 26 tramos.")
    if any(p[0] in (24,25) for p in route):raise ValueError("La primera línea no puede atravesar el cauce del río.")
    if len(state.setdefault("metroLines",[]))>=5:raise ValueError("La red admite hasta cinco líneas en esta etapa.")
    if any(set(map(tuple,line["stations"]))==set(map(tuple,[from_point,to_point])) for line in state["metroLines"] if line.get("status")!="retired"):
        raise ValueError("Ya existe una línea entre esas estaciones.")
    trains=int(trains)
    if trains not in (1,2,3):raise ValueError("La flota inicial permite de uno a tres trenes.")
    construction=12500+distance*1150+2*2200
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
        line["stage"]=STAGES[line["stageIndex"]]
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
        line["headwayMinutes"]=max(5,math.ceil(d*4/max(1,n)))
        line["dailyCapacity"]=n*METRO_SEATS*3 if ready else 0
        line["monthlyOperatingCost"]=round(230+85*d+140*n+line.get("powerRequiredKw",0)*.7) if ready else 0
        line["energyKw"]=line.get("powerRequiredKw",0) if ready else 0

def metro_action(state,action,data):
    if action=="planMetroLine":
        a=data.get("from");b=data.get("to")
        return plan_metro(state,a,b,data.get("trains",1))
    line=next((l for l in state.get("metroLines",[]) if l.get("id")==data.get("id")),None)
    if line is None:raise ValueError("La línea de subte ya no existe.")
    if action=="buyMetroTrain":
        if line.get("status") not in ("active","paused") or line.get("trainCount",0)>=5:raise ValueError("Solo se amplían líneas habilitadas, hasta cinco trenes.")
        if state.get("money",0)<METRO_TRAIN_COST:raise ValueError("No hay fondos para otro tren.")
        state["money"]-=METRO_TRAIN_COST;line["trainCount"]+=1
    elif action=="pauseMetroLine":
        if line.get("status")!="active":raise ValueError("La línea no está activa.")
        line["status"]="paused"
    elif action=="resumeMetroLine":
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
    total=0
    for trip in trips:
        if trip.get("reason") not in ("compras","servicios") or trip.get("mode") not in ("auto","walk"):continue
        if not isinstance(trip.get("from"),list) or not isinstance(trip.get("to"),list):continue
        remaining=max(0,int(trip.get("workers",0))-int(trip.get("busRiders",0)))
        for line in state.get("metroLines",[]):
            if not remaining or not line.get("operational"):continue
            a,b=line["stations"]
            can_forward=abs(a[0]-trip["from"][0])+abs(a[1]-trip["from"][1])<=2 and abs(b[0]-trip["to"][0])+abs(b[1]-trip["to"][1])<=2
            can_backward=abs(b[0]-trip["from"][0])+abs(b[1]-trip["from"][1])<=2 and abs(a[0]-trip["to"][0])+abs(a[1]-trip["to"][1])<=2
            if not (can_forward or can_backward):continue
            wait=line["headwayMinutes"]/2
            minutes=8+wait+(len(line["route"])-1)*1.25
            car_minutes=7+trip.get("distance",0)*2.5
            if minutes>car_minutes*1.3:continue
            count=min(remaining,max(0,line["dailyCapacity"]-line["dailyRiders"]))
            if not count:continue
            line["dailyRiders"]+=count;remaining-=count;total+=count
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
    return {"metroRiders":total,"metroLinesOperational":sum(l.get("operational",False) for l in state.get("metroLines",[]))}

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
