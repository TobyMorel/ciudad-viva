"""Assigna visitas cotidianas a colectivos existentes con capacidad libre."""
def assign_bus_nonwork_passengers(state, trips):
    assigned=0;fare_total=0
    daypart="midday"
    for line in sorted(state.get("busRoutes",[]),key=lambda row:str(row.get("id",""))):
        if not line.get("operational") or line.get("status")!="active":continue
        path=line.get("route") or [];stops=[s.get("at") for s in line.get("stops",[]) if isinstance(s,dict) and s.get("at")]
        if len(path)<2 or len(stops)<2:continue
        capacity=(line.get("capacityByWindow") or {}).get(daypart,0)
        used=(line.setdefault("ridersByWindow",{})).get(daypart,0)
        for trip in trips:
            if trip.get("reason") not in ("compras","servicios") or trip.get("mode") not in ("auto","walk") or trip.get("workers",0)<=0:continue
            origin,dest=trip.get("from",[]),trip.get("to",[])
            def nearest(point):
                options=[(abs(point[0]-p[0])+abs(point[1]-p[1]),i) for i,p in enumerate(path)]
                return min(options,default=(999,-1))
            od,oi=nearest(origin);dd,di=nearest(dest)
            if od>1 or dd>1 or oi==di:continue
            if not any(min((abs(s[0]-point[0])+abs(s[1]-point[1]) for s in stops),default=999)<=1 for point in (path[oi],path[di])):continue
            count=min(trip["workers"],max(0,capacity-used))
            if count<=0:continue
            # Se reasigna el viaje existente: no se crean pasajeros ni se altera su destino.
            trip["mode"]="bus";trip["busLineId"]=line.get("id");trip["busLineIds"]=[line.get("id")];trip["busRiders"]=count;trip["busFare"]=round(float(line.get("fare",.25))*count,2);trip["busTravelRoute"]=path[min(oi,di):max(oi,di)+1]
            trip["vehicles"]=0;trip["dailyEmissionsKg"]=0;trip["waitingMinutes"]=round((line.get("headwayByWindow") or {}).get(daypart,line.get("headwayMinutes",30))/2);trip["estimatedMinutes"]=trip["waitingMinutes"]+max(1,abs(di-oi)*2)
            used+=count;assigned+=count;fare_total+=trip["busFare"]
        line["ridersByWindow"][daypart]=used;line["nonworkRiders"]=line.get("nonworkRiders",0)+max(0,used-(line.get("commuteRidersByWindow") or {}).get(daypart,0));line["nonworkFareRevenue"]=round(line.get("nonworkFareRevenue",0)+fare_total,2)
    return {"busNonworkPassengers":assigned,"busNonworkFareRevenue":round(fare_total,2)}
