"""Estaciones ferroviarias físicas con parcela, obra, costo y puesta en servicio."""
RAIL_SITE_SPECS={
    "metro":{"cost":6800,"duration":42,"label":"Acceso y estación de subte"},
    "elevated":{"cost":9400,"duration":50,"label":"Estación de tren elevado"},
}

def place_rail_station(state,mode,x,y):
    spec=RAIL_SITE_SPECS.get(mode)
    if not spec:raise ValueError("Tipo de estación ferroviaria inválido.")
    if type(x)!=int or type(y)!=int or x<0 or y<0 or x in (24,25):
        raise ValueError("La estación debe ocupar una parcela terrestre válida.")
    claims=state.get("landClaims") or {}
    if isinstance(claims.get("unlockedChunks"),list):
        size=claims.get("chunkSize",8) or 8
        if f"{x//size},{y//size}" not in claims["unlockedChunks"]:
            raise ValueError("Desbloqueá primero el sector de esta estación.")
    roads={tuple(p) for p in state.get("roads",[])}
    if not any((x+dx,y+dy) in roads for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):
        raise ValueError("La estación requiere una calle adyacente.")
    if (x,y) in roads or any(p.get("x")==x and p.get("y")==y for group in ("buildings","projects","abandoned","railStations") for p in state.get(group,[])):
        raise ValueError("La parcela está ocupada: buscá un terreno libre junto a la calle.")
    reserved=sum(max(0,p.get("cost",0)-p.get("paid",0)) for p in state.get("projects",[]) if not p.get("privatePaid"))
    if state.get("money",0)-reserved<spec["cost"]:
        raise ValueError(f'Fondos libres insuficientes para construir la estación ($ {spec["cost"]}).')
    state["money"]-=spec["cost"]
    site={"id":f"station-{mode}-{x}-{y}","kind":"railStation","mode":mode,"x":x,"y":y,
          "name":f'{spec["label"]} {x+1},{y+1}',"status":"building","elapsed":0,
          "duration":spec["duration"],"cost":spec["cost"],"createdDay":state.get("day",1),"stage":"Cimientos y acceso"}
    state.setdefault("railStations",[]).append(site)
    return site

def advance_rail_stations(state):
    for site in state.get("railStations",[]):
        if site.get("status")!="building":continue
        if state.get("jobs",0)<=0:
            site["pauseReason"]="La obra requiere cuadrillas disponibles."
            continue
        site["pauseReason"]=None
        site["elapsed"]=min(site["duration"],site.get("elapsed",0)+1)
        ratio=site["elapsed"]/max(1,site["duration"])
        site["stage"]="Cimientos y acceso" if ratio<.25 else "Estructura y andenes" if ratio<.68 else "Instalaciones e inspección" if ratio<1 else "Habilitada"
        if site["elapsed"]>=site["duration"]:
            site["status"]="active"
            site["completedDay"]=state.get("day",1)
