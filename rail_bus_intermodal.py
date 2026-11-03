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
        if trip.get("reason") not in ("compras","servicios","ocio") or trip.get("mode") not in ("auto","walk") or not valid(trip.get("from")) or not valid(trip.get("to")):continue
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
            window=bus.setdefault("ridersByWindow",{})
            window["midday"]=window.get("midday",0)+count
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


def assign_rail_rail_transfers(state,trips):
    """Reserva asientos en dos líneas ferroviarias que comparten un intercambiador físico."""
    roads={tuple(p) for p in state.get("roads",[])}
    stations={}
    for site in state.get("railStations",[]):
        mode=site.get("mode")
        if site.get("status")!="active" or mode not in ("metro","elevated"):continue
        point=(site.get("x"),site.get("y"))
        if type(point[0]) is not int or type(point[1]) is not int:continue
        if any((point[0]+dx,point[1]+dy) in roads for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):
            stations.setdefault(mode,set()).add(point)
    lines=[]
    for line in state.get("metroLines",[]):
        mode=line.get("mode") or "metro";points=line.get("stations");route=line.get("route") or []
        if (line.get("status")!="active" or not line.get("operational") or mode not in ("metro","elevated")
                or not isinstance(points,list) or len(points)!=2 or len(route)<2 or line.get("dailyCapacity",0)<=0):continue
        coords=[]
        for point in points:
            if not isinstance(point,(list,tuple)) or len(point)!=2 or any(type(n) is not int for n in point):break
            coords.append(tuple(point))
        if len(coords)!=2 or coords[0]==coords[1] or any(point not in stations.get(mode,set()) for point in coords):continue
        lines.append((line,coords,mode))
    transfers=metro_riders=rail_riders=0
    day_key=str(max(1,int(state.get("day",1))))
    for trip in trips:
        if trip.get("reason") not in ("compras","servicios","ocio") or trip.get("mode") not in ("auto","walk"):continue
        start,end=trip.get("from"),trip.get("to")
        if not valid(start) or not valid(end):continue
        remaining=max(0,int(trip.get("workers",0))-int(trip.get("busRiders",0))-int(trip.get("intermodalRiders",0)))
        if not remaining:continue
        comparison=(2+trip.get("distance",0)*4 if trip.get("mode")=="walk" else 7+trip.get("distance",0)*2.5*1.25)
        options=[]
        for first,first_points,first_mode in lines:
            for second,second_points,second_mode in lines:
                if first is second:continue
                first_dist=max(1,len(first.get("route") or [])-1)
                second_dist=max(1,len(second.get("route") or [])-1)
                first_headway=max(5,float(first.get("headwayMinutes") or 30))
                second_headway=max(5,float(second.get("headwayMinutes") or 30))
                first_minutes=(4 if first_mode=="elevated" else 8)+first_headway/2+first_dist*(1 if first_mode=="elevated" else 1.25)
                second_minutes=(4 if second_mode=="elevated" else 8)+second_headway/2+second_dist*(1 if second_mode=="elevated" else 1.25)
                for first_entry in (0,1):
                    first_hub=1-first_entry
                    for second_hub in (0,1):
                        second_exit=1-second_hub
                        walk_in=abs(start[0]-first_points[first_entry][0])+abs(start[1]-first_points[first_entry][1])
                        walk_transfer=abs(first_points[first_hub][0]-second_points[second_hub][0])+abs(first_points[first_hub][1]-second_points[second_hub][1])
                        walk_out=abs(second_points[second_exit][0]-end[0])+abs(second_points[second_exit][1]-end[1])
                        if walk_in>2 or walk_transfer>2 or walk_out>2:continue
                        minutes=walk_in*4+first_minutes+4+walk_transfer*3+second_minutes+walk_out*4
                        if minutes>comparison*1.35:continue
                        options.append({"minutes":minutes,"first":first,"second":second,
                                        "entry":first_points[first_entry],"hub":first_points[first_hub],
                                        "transfer":second_points[second_hub],"exit":second_points[second_exit],
                                        "firstMode":first_mode,"secondMode":second_mode})
        options.sort(key=lambda row:(row["minutes"],str(row["first"].get("id","")),str(row["second"].get("id","")),row["entry"],row["exit"]))
        for option in options:
            if remaining<=0:break
            first,second=option["first"],option["second"]
            first_free=max(0,int(first.get("dailyCapacity",0))-int(first.get("dailyRiders",0)))
            second_free=max(0,int(second.get("dailyCapacity",0))-int(second.get("dailyRiders",0)))
            count=min(remaining,first_free,second_free)
            if count<=0:continue
            remaining-=count;transfers+=count
            first["dailyRiders"]=int(first.get("dailyRiders",0))+count
            second["dailyRiders"]=int(second.get("dailyRiders",0))+count
            fare_one=first.get("fareCents")
            fare_two=second.get("fareCents")
            fare_one=max(0,int(85 if option["firstMode"]=="elevated" else 60) if fare_one is None else int(fare_one))
            fare_two=max(0,int(85 if option["secondMode"]=="elevated" else 60) if fare_two is None else int(fare_two))
            fare_two=math.floor(fare_two*.75+.5)
            home_key=",".join(map(str,start))
            first_day=first.setdefault("fareByDay",{}).setdefault(day_key,{})
            second_day=second.setdefault("fareByDay",{}).setdefault(day_key,{})
            first_day[home_key]=first_day.get(home_key,0)+count*fare_one
            second_day[home_key]=second_day.get(home_key,0)+count*fare_two
            trip["intermodalRiders"]=int(trip.get("intermodalRiders",0))+count
            trip["metroRiders"]=int(trip.get("metroRiders",0))+count
            trip["metroLineId"]=first.get("id")
            trip["metroLineIds"]=list(dict.fromkeys((trip.get("metroLineIds") or [])+[first.get("id"),second.get("id")]))
            elevated=next((line for line,mode in ((first,option["firstMode"]),(second,option["secondMode"])) if mode=="elevated"),None)
            if elevated:
                trip["railRiders"]=int(trip.get("railRiders",0))+count
                trip["railLineId"]=elevated.get("id")
                rail_riders+=count
            if "metro" in (option["firstMode"],option["secondMode"]):metro_riders+=count
            trip.setdefault("intermodalJourneys",[]).append({
                "type":"rail-rail","railLineIds":[first.get("id"),second.get("id")],
                "modes":["tren" if option["firstMode"]=="elevated" else "subte",
                         "tren" if option["secondMode"]=="elevated" else "subte"],
                "direction":"rail-rail","riders":count,"minutes":round(option["minutes"]),
                "fareCents":fare_one+fare_two,"fareByLineCents":[fare_one,fare_two],
                "transferStations":[list(option["hub"]),list(option["transfer"])]})
    return {"metroRiders":metro_riders,"railRiders":rail_riders,"transfers":transfers,
            "railTransfers":transfers}
