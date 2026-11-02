"""Viajes cotidianos en colectivo con aforo, transbordos y pago por hogar.

Reasigna visitantes existentes; las líneas solo aceptan viajeros si tienen
conductores, ruta y asientos en el turno del mediodía. Lecturas repetidas no
duplican cargos ni descuentan dinero hasta el cierre mensual.
"""
import math

WINDOW="midday"
def _distance(a,b):
    return abs(a[0]-b[0])+abs(a[1]-b[1])

def _stops(line):
    path=line.get("route") or []
    found=[]
    for stop in line.get("stops",[]):
        if not isinstance(stop,dict) or not isinstance(stop.get("at"),(list,tuple)):continue
        at=stop["at"]
        if len(at)!=2:continue
        i=stop.get("routeIndex")
        if not isinstance(i,int) or i<0 or i>=len(path) or list(path[i])!=list(at):
            i=next((j for j,p in enumerate(path) if list(p)==list(at)),None)
        if i is not None:found.append((at,i))
    return found

def _offers(lines,trip):
    start,end=trip.get("from"),trip.get("to")
    if not isinstance(start,(list,tuple)) or not isinstance(end,(list,tuple)):return []
    info=[];offers=[]
    for line in lines:
        stops=_stops(line)
        origins=[(p,i) for p,i in stops if _distance(start,p)<=1]
        destinations=[(p,i) for p,i in stops if _distance(end,p)<=1]
        info.append((line,stops,origins,destinations))
        for p,i in origins:
            for q,j in destinations:
                if j<=i:continue
                headway=line.get("headwayByWindow",{}).get(WINDOW,line.get("headwayMinutes",30)) or 30
                fare=max(0,round(float(line.get("fare",.25))*100))
                minutes=(_distance(start,p)+_distance(end,q))*4+headway/2+(j-i)*1.8+fare*.06
                offers.append((minutes,[line],[fare],None))
    for line_a,stops_a,origins,_ in info:
        for line_b,stops_b,_,ends in info:
            if line_a is line_b:continue
            for p,i in origins:
                for q,j in ends:
                    for ta,ia in stops_a:
                        if ia<=i:continue
                        for tb,ib in stops_b:
                            if ib>=j or _distance(ta,tb)>1:continue
                            h1=line_a.get("headwayByWindow",{}).get(WINDOW,line_a.get("headwayMinutes",30)) or 30
                            h2=line_b.get("headwayByWindow",{}).get(WINDOW,line_b.get("headwayMinutes",30)) or 30
                            fares=[max(0,round(float(line_a.get("fare",.25))*100)),max(0,round(float(line_b.get("fare",.25))*65))]
                            minutes=(_distance(start,p)+_distance(end,q))*4+(h1+h2)/2+(ia-i+j-ib)*1.8+2+_distance(ta,tb)*4+sum(fares)*.06
                            offers.append((minutes,[line_a,line_b],fares,list(ta)))
    return sorted(offers,key=lambda x:(x[0],len(x[1]),tuple(str(line.get("id")) for line in x[1])))

def assign_bus_nonwork_passengers(state,trips):
    day=max(1,int(state.get("day",1)));month=(day-1)//30
    lines=sorted((line for line in state.get("busRoutes",[]) if line.get("status")=="active" and line.get("operational") and len(line.get("route") or [])>1 and len(_stops(line))>=2),key=lambda line:str(line.get("id","")))
    for line in state.get("busRoutes",[]):
        if line.get("nonworkFareMonth")!=month:
            line["nonworkFareMonth"]=month;line["nonworkFaresByDay"]={}
        line.setdefault("nonworkFaresByDay",{})[str(day)]={}
        line["nonworkRiders"]=0
        line["nonworkFareToday"]=0
    riders_total=transfers_total=0
    for trip in trips:
        trip.pop("busRiders",None);trip.pop("busJourneys",None)
        if trip.get("reason") not in ("compras","servicios") or trip.get("mode") not in ("auto","walk") or trip.get("workers",0)<=0:continue
        remaining=int(trip["workers"])
        comparison=(2+trip.get("distance",0)*4 if trip["mode"]=="walk" else 7+trip.get("distance",0)*2.5*1.25)
        for minutes,legs,fares,transfer_stop in _offers(lines,trip):
            if not remaining:break
            if minutes>comparison*(1.35 if len(legs)==2 else 1.45):continue
            available=min(max(0,int(l.get("capacityByWindow",{}).get(WINDOW,0))-int(l.get("ridersByWindow",{}).get(WINDOW,0))) for l in legs)
            taken=min(remaining,available)
            if not taken:continue
            remaining-=taken;riders_total+=taken
            if len(legs)==2:transfers_total+=taken
            trip["busRiders"]=trip.get("busRiders",0)+taken
            trip.setdefault("busJourneys",[]).append({"lineIds":[l["id"] for l in legs],"riders":taken,"fare":sum(fares)/100,"minutes":round(minutes),"transferStop":transfer_stop})
            home_key=",".join(map(str,trip["from"]))
            for line,fare in zip(legs,fares):
                window=line.setdefault("ridersByWindow",{})
                window[WINDOW]=window.get(WINDOW,0)+taken
                line["nonworkRiders"]+=taken
                daily=line["nonworkFaresByDay"][str(day)]
                daily[home_key]=daily.get(home_key,0)+taken*fare
        if trip.get("busRiders"):
            if trip["mode"]=="auto":
                trip["vehicles"]=math.ceil(remaining/1.4)
                trip["dailyEmissionsKg"]=round(trip["vehicles"]*trip.get("distance",0)*.18*2,2)
            trip["busLineIds"]=trip["busJourneys"][0]["lineIds"]
            trip["busLineId"]=trip["busLineIds"][0]
    for line in state.get("busRoutes",[]):
        by_day=line["nonworkFaresByDay"]
        line["nonworkFareToday"]=round(sum(by_day[str(day)].values())/100,2)
        line["nonworkFareDue"]=round(sum(sum(d.values()) for d in by_day.values())/100,2)
        if line in lines:line["dailyRiders"]=line.get("ridersThisPass",0)+line.get("returnRidersThisPass",0)+line["nonworkRiders"]
    return {"busNonworkPassengers":riders_total,"busNonworkTransfers":transfers_total,
            "busNonworkFareRevenue":round(sum(l["nonworkFareToday"] for l in lines),2)}

def collect_bus_nonwork_fares(state):
    """Liquida una vez por cierre. El dinero sale del hogar, no aparece gratis."""
    homes={(b.get("x"),b.get("y")):b for b in state.get("buildings",[]) if b.get("kind")=="home"}
    received=0
    for line in state.get("busRoutes",[]):
        owed={}
        for day in line.get("nonworkFaresByDay",{}).values():
            for key,cents in day.items():owed[key]=owed.get(key,0)+cents
        paid=0
        for key,cents in sorted(owed.items()):
            try:coords=tuple(map(int,key.split(",")))
            except ValueError:continue
            home=homes.get(coords)
            if home is None:continue
            amount=min((cents+50)//100,max(0,int(home.get("householdCash",0))))
            home["householdCash"]=home.get("householdCash",0)-amount;paid+=amount
        line["nonworkFareCollected"]=paid
        line["monthlyFareRevenue"]=line.get("monthlyFareRevenue",0)+paid
        received+=paid
    return received
