"""Capacidad y terminales del ferrocarril de carga."""
import math

def freight_capacity_metrics(line):
    """Calcula el cupo de carga que queda después de atender a pasajeros.

    Se comparte la fracción de capacidad diaria ocupada: los pasajeros tienen
    prioridad y la carga utiliza solo la parte libre del mismo corredor.
    """
    raw_capacity=line.get("freightCapacityPerDay")
    nominal=max(0,int(raw_capacity if raw_capacity is not None else max(0,int(line.get("trainCount",0)))*60))
    passenger_capacity=max(0,int(line.get("dailyCapacity",0) or 0))
    passengers=max(0,int(line.get("dailyRiders",0) or 0))
    occupied=min(passengers,passenger_capacity) if passenger_capacity else 0
    available=nominal if passenger_capacity<=0 else math.floor(nominal*(passenger_capacity-occupied)/passenger_capacity+1e-9)
    return {
        "freightCapacityPerDay":nominal,
        "freightAvailableCapacityPerDay":max(0,available),
        "passengerLoadPct":round(occupied/passenger_capacity*100) if passenger_capacity else 0,
    }

def _distance(a,b):
    return abs(int(a["x"])-int(b["x"]))+abs(int(a["y"])-int(b["y"]))

def _valid_route(route):
    return isinstance(route,list) and len(route)>=5 and all(
        isinstance(p,(list,tuple)) and len(p)==2 and all(type(n) is int for n in p)
        for p in route
    ) and all(abs(a[0]-b[0])+abs(a[1]-b[1])==1 for a,b in zip(route,route[1:]))

def freight_routes_for_factory_port(state,factory,port,road_route):
    """Lista corredores operativos entre una fábrica y un puerto por estaciones físicas."""
    if not factory or factory.get("kind")!="factory" or not port or port.get("kind")!="port":
        return []
    sites=[s for s in state.get("railStations",[])
           if s.get("mode")=="elevated" and s.get("status")=="active"]
    candidates=[]
    for line in state.get("metroLines",[]):
        if line.get("mode")!="elevated" or line.get("status")!="active" or not line.get("operational"):
            continue
        points=line.get("stations") or [];route=line.get("route") or []
        if len(points)!=2 or not _valid_route(route):continue
        ends=[]
        for point in points:
            if not isinstance(point,(list,tuple)) or len(point)!=2 or any(type(n) is not int for n in point):
                ends=[];break
            site=next((s for s in sites if s.get("x")==point[0] and s.get("y")==point[1]),None)
            if not site:ends=[];break
            ends.append(site)
        if len(ends)!=2 or ends[0] is ends[1]:continue
        for origin_index in (0,1):
            origin=ends[origin_index];destination=ends[1-origin_index]
            if _distance(factory,origin)>2 or _distance(port,destination)>2:continue
            origin_access=road_route(factory,origin);port_access=road_route(port,destination)
            if not origin_access or not port_access:continue
            rail_route=route if origin_index==0 else list(reversed(route))
            distance=max(0,len(origin_access)-1)+max(1,len(rail_route)-1)+max(0,len(port_access)-1)
            candidates.append({
                "line":line,"originStation":origin,"portStation":destination,
                "originAccessRoute":origin_access,"portAccessRoute":port_access,
                "route":rail_route,"distance":distance,
            })
    candidates.sort(key=lambda r:(r["distance"],str(r["line"].get("id","")),
                                  r["originStation"]["x"],r["originStation"]["y"]))
    return candidates

def freight_route_for_factory_port(state,factory,port,road_route,line_id=None):
    """Devuelve el mejor corredor, o uno específico para un envío ya en tránsito."""
    routes=freight_routes_for_factory_port(state,factory,port,road_route)
    if line_id is not None:
        routes=[route for route in routes if str(route["line"].get("id"))==str(line_id)]
    return routes[0] if routes else None

def reserve_freight_capacity(line,origin_station,port_station,quantity,day):
    """Reserva el cupo restante del corredor y de ambos patios terminales."""
    quantity=max(0,int(quantity or 0));day=int(day or 0)
    if quantity<=0 or not line or not origin_station or not port_station:return False
    line_capacity=freight_capacity_metrics(line)["freightAvailableCapacityPerDay"]
    terminals=(origin_station,port_station)
    usages=[]
    for terminal in terminals:
        capacity=max(0,int(terminal.get("freightCapacityPerDay") or 120))
        used=max(0,int(terminal.get("freightUsedToday",0))) if terminal.get("freightUsageDay")==day else 0
        usages.append((capacity,used))
    line_used=max(0,int(line.get("freightUsedToday",0))) if line.get("freightUsageDay")==day else 0
    if line_capacity<quantity or line_used+quantity>line_capacity or any(capacity<quantity or used+quantity>capacity for capacity,used in usages):
        return False
    if line.get("freightUsageDay")!=day:line["freightUsageDay"]=day;line["freightUsedToday"]=0
    line["freightUsedToday"]+=quantity
    for terminal,(capacity,used) in zip(terminals,usages):
        if terminal.get("freightUsageDay")!=day:terminal["freightUsageDay"]=day;terminal["freightUsedToday"]=0
        terminal["freightUsedToday"]+=quantity
        terminal.setdefault("freightCapacityPerDay",capacity)
    return True

def reserve_freight_route(routes,quantity,day):
    """Reserva la primera alternativa física con cupo en corredor y terminales."""
    for route in routes:
        if reserve_freight_capacity(route.get("line"),route.get("originStation"),route.get("portStation"),quantity,day):
            return route
    return None

def next_freight_departure_day(day,interval=3):
    interval=max(1,int(interval or 1));next_day=max(1,int(day or 1))+1
    return next_day+(interval-next_day%interval)%interval

def refresh_freight_terminal_roles(state):
    buildings=state.get("buildings",[])
    for site in state.get("railStations",[]):
        roles=[]
        if site.get("mode")=="elevated" and site.get("status")=="active":
            point={"x":site.get("x",0),"y":site.get("y",0)}
            if any(b.get("kind")=="factory" and b.get("business",{}).get("status")=="abierto"
                   and _distance(point,b)<=2 for b in buildings):roles.append("industrial")
            if any(b.get("kind")=="port" and b.get("status") in ("habilitado","operativo")
                   and _distance(point,b)<=2 for b in buildings):roles.append("port")
        site["freightRoles"]=roles
        site["freightTerminal"]=bool(roles)

def rail_freight_report(state):
    refresh_freight_terminal_roles(state)
    supply=state.get("supply",{})
    orders=supply.get("portOrders",[])
    waiting={"pendiente","esperando tren programado","esperando capacidad ferroviaria","esperando acceso ferroviario"}
    return {
        "terminals":sum(bool(s.get("freightTerminal")) for s in state.get("railStations",[])),
        "operationalLines":sum(l.get("mode")=="elevated" and l.get("operational") for l in state.get("metroLines",[])),
        "dailyCapacity":sum(freight_capacity_metrics(l)["freightCapacityPerDay"] for l in state.get("metroLines",[]) if l.get("mode")=="elevated" and l.get("operational")),
        "availableCapacityPerDay":sum(freight_capacity_metrics(l)["freightAvailableCapacityPerDay"] for l in state.get("metroLines",[]) if l.get("mode")=="elevated" and l.get("operational")),
        "passengerRiders":sum(max(0,int(l.get("dailyRiders",0) or 0)) for l in state.get("metroLines",[]) if l.get("mode")=="elevated" and l.get("operational")),
        "passengerLoadPct":round(sum(min(max(0,int(l.get("dailyRiders",0) or 0)),max(0,int(l.get("dailyCapacity",0) or 0))) for l in state.get("metroLines",[]) if l.get("mode")=="elevated" and l.get("operational"))/max(1,sum(max(0,int(l.get("dailyCapacity",0) or 0)) for l in state.get("metroLines",[]) if l.get("mode")=="elevated" and l.get("operational")))*100),
        "waitingUnits":sum(max(0,int(o.get("quantity",0))) for o in orders if o.get("mode")=="rail" and (o.get("status") in waiting or o.get("status")=="en puerto")),
        "inTransitUnits":sum(max(0,int(o.get("quantity",0))) for o in orders if o.get("mode")=="rail" and o.get("status")=="en tránsito ferroviario"),
        "deliveredUnits":sum(max(0,int(l.get("freightDeliveredUnits",0))) for l in state.get("metroLines",[]) if l.get("mode")=="elevated"),
        "freightRevenue":sum(max(0,int(l.get("freightRevenue",0))) for l in state.get("metroLines",[]) if l.get("mode")=="elevated"),
    }
