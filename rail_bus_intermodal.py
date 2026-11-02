"""Transbordos reales colectivo ↔ tren/subte, con reservas de ambos aforos.

No se duplican usuarios: metroRiders incluye pasajeros intermodales; busRiders
solo contabiliza a los viajeros exclusivamente en colectivo.
"""
import math
def distance(a,b):return abs(a[0]-b[0])+abs(a[1]-b[1])
def valid(p):return isinstance(p,(list,tuple)) and len(p)==2 and all(type(x)==int for x in p)
def validated_stops(line,roads,closed):
    path=line.get("route") or []
    if len(path)<2 or any(not valid(p) or tuple(p) not in roads or tuple(p) in closed for p in path):return []
    if any(distance(a,b)!=1 for a,b in zip(path,path[1:])):return []
    result=[]
    for stop in line.get("stops",[]):
        p=stop.get("at") if isinstance(stop,dict) else None
        if not valid(p):continue
        i=stop.get("routeIndex")
        if type(i)!=int or i<0 or i>=len(path) or distance(path[i],p)!=0:
            i=next((j for j,q in enumerate(path) if distance(q,p)==0),None)
        if i is not None:result.append((p,i))
    return result

def offers(buses,rails,trip):
    if not valid(trip.get("from")) or not valid(trip.get("to")):return []
    results=[]
    for rail in rails:
        stations=rail.get("stations")
        if not isinstance(stations,list) or len(stations)!=2 or not all(valid(p) for p in stations) or len(rail.get("route") or [])<2:continue
        d=max(1,len(rail["route"])-1);headway=max(5,float(rail.get("headwayMinutes") or 30))
        for entry,exit_ in ((stations[0],stations[1]),(stations[1],stations[0])):
            rail_time=headway/2+d*(1 if rail.get("mode")=="elevated" else 1.25)
            for bus,stops in buses:
                bus_headway=max(1,float(bus.get("headwayByWindow",{}).get("midday") or bus.get("headwayMinutes") or 30))
                bus_fare=max(0,math.floor(float(bus.get("fare",.25))*100+.5))
                rail_fare=max(0,round(float(rail.get("fareCents") or 60)))
                for start,si in stops:
                    for end,ei in stops:
                        if ei<=si:continue
                        bus_time=bus_headway/2+(ei-si)*1.8
                        for direction in ("bus-rail","rail-bus"):
                            if direction=="bus-rail":
                                if distance(trip["from"],start)>1 or distance(end,entry)>1 or distance(exit_,trip["to"])>2:continue
                                fare_bus=bus_fare;fare_rail=math.floor(rail_fare*.75+.5)
                                access=distance(trip["from"],start)+distance(end,entry)+distance(exit_,trip["to"])
                                transfer=list(entry)
                            else:
                                if distance(trip["from"],entry)>2 or distance(exit_,start)>1 or distance(end,trip["to"])>1:continue
                                fare_bus=math.floor(bus_fare*.75+.5);fare_rail=rail_fare
                                access=distance(trip["from"],entry)+distance(exit_,start)+distance(end,trip["to"])
                                transfer=list(exit_)
                            minutes=access*4+bus_time+rail_time+2+(fare_bus+fare_rail)*.06
                            results.append((minutes,rail,bus,fare_bus,fare_rail,direction,transfer))
    return sorted(results,key=lambda x:(x[0],str(x[1].get("id")),str(x[2].get("id")),x[5]))

def assign_rail_bus_transfers(state,trips,day):
    roads={tuple(p) for p in state.get("roads",[])}
    closed={(a.get("x"),a.get("y")) for a in state.get("roadAssets",[]) if a.get("accidentClosed") or a.get("quality",82)<25}
    buses=[(line,validated_stops(line,roads,closed)) for line in state.get("busRoutes",[])
           if line.get("status")=="active" and line.get("operational")]
    buses=[(line,stops) for line,stops in buses if len(stops)>=2]
    rails=[l for l in state.get("metroLines",[]) if l.get("status")=="active" and l.get("operational") and l.get("dailyCapacity",0)>0]
    metro_riders=rail_riders=transfers=0
    for trip in trips:
        if trip.get("reason") not in ("compras","servicios") or trip.get("mode") not in ("auto","walk") or not valid(trip.get("from")) or not valid(trip.get("to")):continue
        remaining=max(0,int(trip.get("workers",0))-int(trip.get("busRiders",0)))
        if not remaining:continue
        comparison=(2+trip.get("distance",0)*4 if trip["mode"]=="walk" else 7+trip.get("distance",0)*2.5*1.25)
        for minutes,rail,bus,bus_cents,rail_cents,direction,transfer in offers(buses,rails,trip):
            if not remaining:break
            if minutes>comparison*1.35:continue
            bus_free=max(0,int(bus.get("capacityByWindow",{}).get("midday",0))-int(bus.get("ridersByWindow",{}).get("midday",0)))
            rail_free=max(0,int(rail.get("dailyCapacity",0))-int(rail.get("dailyRiders",0)))
            count=min(remaining,bus_free,rail_free)
            if count<=0:continue
            remaining-=count;transfers+=count
            rail["dailyRiders"]+=count
            bus["ridersByWindow"]["midday"]+=count
            bus["nonworkRiders"]=bus.get("nonworkRiders",0)+count
            bus["dailyRiders"]=bus.get("dailyRiders",0)+count
            key=",".join(map(str,trip["from"]));day_key=str(day)
            bus_row=bus.setdefault("nonworkFaresByDay",{}).setdefault(day_key,{})
            bus_row[key]=bus_row.get(key,0)+count*bus_cents
            rail_row=rail.setdefault("fareByDay",{}).setdefault(day_key,{})
            rail_row[key]=rail_row.get(key,0)+count*rail_cents
            bus["nonworkFareToday"]=round(sum(bus_row.values())/100,2)
            bus["nonworkFareDue"]=round(sum(sum(row.values()) for row in bus["nonworkFaresByDay"].values())/100,2)
            trip["intermodalRiders"]=trip.get("intermodalRiders",0)+count
            trip["metroRiders"]=trip.get("metroRiders",0)+count
            trip["metroLineId"]=rail["id"]
            if rail.get("mode")=="elevated":
                trip["railRiders"]=trip.get("railRiders",0)+count;trip["railLineId"]=rail["id"]
                rail_riders+=count
            else:metro_riders+=count
            trip.setdefault("intermodalJourneys",[]).append({
                "busLineId":bus["id"],"railLineId":rail["id"],
                "mode":"tren" if rail.get("mode")=="elevated" else "subte","direction":direction,
                "riders":count,"minutes":round(minutes),
                "fareCents":bus_cents+rail_cents,"transferStop":transfer})
    return {"metroRiders":metro_riders,"railRiders":rail_riders,"transfers":transfers}
