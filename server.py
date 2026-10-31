#!/usr/bin/env python3
"""Servidor LAN local de Ciudad Viva. Solo biblioteca estándar de Python."""
import json, math, os, socket, sys, threading, time, uuid, webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SAVE = ROOT / "ciudad_guardada.json"
LOCK = threading.RLock()
PORT = int(os.environ.get("CIUDAD_VIVA_PORT", "8765"))
MATERIAL_NAMES = {"aggregate":"áridos","steel":"acero","timber":"madera","components":"componentes"}
INITIAL_CONTRACTOR_STOCK = {"aggregate":20,"steel":6,"timber":6,"components":3}
INITIAL_REGIONAL_STOCK = {"aggregate":600,"steel":240,"timber":200,"components":180}
REGIONAL_PRODUCTION = {"aggregate":70,"steel":35,"timber":28,"components":24}
MATERIAL_PRICE = {"aggregate":38,"steel":210,"timber":75,"components":240}
SUPPLIERS = {
    "Corralón del Puerto":{"price":1.0,"days":2,"profile":"Stock local · tarifa media · entrega por calle"},
    "Distribuidora Regional":{"price":.82,"days":9,"profile":"Compra mayorista · menor precio · viaje largo"},
    "Flete Urgente":{"price":1.75,"days":1,"profile":"Prioridad de carga · tarifa alta · despacho inmediato"}}
SUPPLIER_STOCK = {
    "Corralón del Puerto":{"aggregate":260,"steel":90,"timber":110,"components":45},
    "Distribuidora Regional":{"aggregate":1200,"steel":520,"timber":420,"components":300},
    "Flete Urgente":{"aggregate":70,"steel":35,"timber":35,"components":32}}
CONTRACTOR_CASH = {"Sur Obras":5000,"Constructora Delta":9000,"Estudio y Obra Norte":14000}
MATERIAL_NEEDS = {
    "road":{"aggregate":22,"steel":0,"timber":0,"components":2},
    "home":{"aggregate":27,"steel":9,"timber":15,"components":10},
    "shop":{"aggregate":24,"steel":14,"timber":8,"components":12},
    "civic":{"aggregate":52,"steel":22,"timber":12,"components":24},
    "depot":{"aggregate":38,"steel":18,"timber":14,"components":12}}
CONTRACTOR_NAMES = ("Sur Obras","Constructora Delta","Estudio y Obra Norte")

def new_business(building, job_slots, starting_cash=5000):
    return {"id":f"firm-{building['x']}-{building['y']}","name":building.get("name","Comercio local"),
            "status":"abierto","cash":starting_cash,"jobSlots":max(1,int(job_slots)),"inventory":0,
            "price":18,"inputCost":5,"wage":10,"productivity":.06,"fixedCost":40,
            "lastSales":0,"lastRevenue":0,"lastInputs":0,"lastProduction":0,"lastPayroll":0,"lastProfit":0,"lastWorkers":0,"lastDemand":0}

def new_supply():
    return {"regional":INITIAL_REGIONAL_STOCK.copy(),
            "contractors":{name:INITIAL_CONTRACTOR_STOCK.copy() for name in CONTRACTOR_NAMES},
            "contractorCash":CONTRACTOR_CASH.copy(),
            "suppliers":{name:stock.copy() for name,stock in SUPPLIER_STOCK.items()},
            "orders":[],"storageCapacity":240,"yardCapacity":240,"depots":[]}

def initial_state():
    roads = [[x, 10] for x in range(4, 22)] + [[12, y] for y in range(5, 16)] + [[18, y] for y in range(10, 16)]
    buildings = [
        {"x":8,"y":9,"kind":"home","name":"Viviendas del Parque","level":2,"occupants":126,"status":"operativo"},
        {"x":10,"y":9,"kind":"home","name":"Barrio Estación","level":2,"occupants":78,"status":"operativo"},
        {"x":15,"y":9,"kind":"shop","name":"Mercado Central","level":1,"occupants":0,"status":"operativo"},
        {"x":20,"y":11,"kind":"home","name":"Las Moreras","level":2,"occupants":92,"status":"operativo"},
        {"x":9,"y":11,"kind":"civic","name":"Municipalidad","level":1,"occupants":0,"status":"operativo"},
        {"x":15,"y":11,"kind":"shop","name":"Talleres del Puerto","level":1,"occupants":0,"status":"operativo"},
        {"x":5,"y":9,"kind":"home","name":"Casas del Oeste","level":1,"occupants":22,"status":"operativo"},
        {"x":6,"y":11,"kind":"home","name":"Pasaje del Molino","level":1,"occupants":28,"status":"operativo"},
        {"x":7,"y":9,"kind":"home","name":"Jardines de Abril","level":1,"occupants":26,"status":"operativo"},
        {"x":8,"y":11,"kind":"home","name":"Residencias del Centro","level":1,"occupants":30,"status":"operativo"},
        {"x":11,"y":9,"kind":"home","name":"Casas de la Plaza","level":1,"occupants":33,"status":"operativo"},
        {"x":13,"y":8,"kind":"home","name":"Conjunto Estación","level":1,"occupants":27,"status":"operativo"},
        {"x":13,"y":11,"kind":"home","name":"Los Tilos","level":1,"occupants":24,"status":"operativo"},
        {"x":16,"y":9,"kind":"home","name":"Viviendas del Mercado","level":1,"occupants":32,"status":"operativo"},
        {"x":17,"y":11,"kind":"home","name":"Casas del Canal","level":1,"occupants":26,"status":"operativo"},
        {"x":19,"y":11,"kind":"home","name":"Lomas del Puerto","level":1,"occupants":26,"status":"operativo"},
        {"x":11,"y":14,"kind":"home","name":"Barrio del Sur","level":1,"occupants":25,"status":"operativo"},
        {"x":13,"y":14,"kind":"home","name":"Los Aromos","level":1,"occupants":25,"status":"operativo"},
        {"x":5,"y":11,"kind":"shop","name":"Almacén del Oeste","level":1,"occupants":0,"status":"operativo"},
        {"x":14,"y":9,"kind":"shop","name":"Galería Central","level":1,"occupants":0,"status":"operativo"},
        {"x":19,"y":13,"kind":"shop","name":"Depósito Costero","level":1,"occupants":0,"status":"operativo"},
        {"x":11,"y":7,"kind":"shop","name":"Café Estación","level":1,"occupants":0,"status":"operativo"}
    ]
    for building in buildings:
        if building["kind"]=="home":
            building["capacity"]=max(building["occupants"],round(building["occupants"]*1.15))
        elif building["kind"]=="shop":
            building["business"]=new_business(building,42,5000)
    return {"version":14,"name":"Puerto Claro","day":1,"speed":1,"paused":False,"money":48000,"monthlyIncome":6200,"monthlyExpenses":4700,"population":620,"jobs":286,"employment":78,"services":76,"approval":64,"privateCapital":26000,"roads":roads,"roadAssets":[],"buildings":buildings,"projects":[],"abandoned":[],"zones":[],"supply":new_supply(),"events":[{"day":1,"title":"Puerto Claro inicia una nueva gestión","detail":"Tesorería disponible: $48.000. La conexión regional mantiene activo el comercio."},{"day":1,"title":"Demanda residencial moderada","detail":"Hay hogares buscando vivienda cerca de los empleos del centro."}],"lastMonth":0,"players":{},"host":None}

state = initial_state()

def local_ips():
    ips=set()
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET): ips.add(info[4][0])
        s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
        try: s.connect(("192.0.2.1",80)); ips.add(s.getsockname()[0])
        finally: s.close()
    except OSError: pass
    return sorted(ip for ip in ips if not ip.startswith("127."))

def ev(title, detail):
    state["events"].insert(0,{"day":state["day"],"title":title,"detail":detail})
    del state["events"][30:]

CONTRACTORS = {
 "Sur Obras": {"price":1.0,"days":38,"quality":.68,"reliability":.70,"capacity":2,"workers":14,"forklifts":1,"unloadWorkers":2,"unloadRate":6,"profile":"Oferta económica · mayor riesgo de demora"},
 "Constructora Delta": {"price":1.18,"days":30,"quality":.82,"reliability":.87,"capacity":3,"workers":24,"forklifts":2,"unloadWorkers":2,"unloadRate":8,"profile":"Equilibrada · cumplimiento estable"},
 "Estudio y Obra Norte": {"price":1.42,"days":25,"quality":.95,"reliability":.94,"capacity":2,"workers":20,"forklifts":2,"unloadWorkers":3,"unloadRate":12,"profile":"Especializada · calidad alta, precio mayor"}}
PROJECTS = {"road":{"label":"Calle local","cost":1200,"days":24,"stageNames":["Proyecto y permisos","Preparación del terreno","Base y drenaje","Pavimentación","Inspección y habilitación"]},"home":{"label":"Vivienda privada","cost":4200,"days":39,"stageNames":["Permiso y financiación","Preparación de parcela","Estructura","Instalaciones y terminaciones","Inspección y ocupación"]},"shop":{"label":"Local comercial","cost":3600,"days":34,"stageNames":["Permiso y financiación","Preparación de parcela","Estructura","Instalaciones y terminaciones","Inspección y habilitación"]},"civic":{"label":"Centro de salud","cost":8000,"days":62,"stageNames":["Anteproyecto y permisos","Licitación y movilización","Cimientos y estructura","Instalaciones y equipamiento","Inspección y habilitación"]},"depot":{"label":"Depósito municipal","cost":5600,"days":50,"stageNames":["Proyecto y permisos","Preparación del terreno","Estructura y playa de carga","Estanterías y seguridad","Inspección y apertura"]}}
LABOR_NEEDS = {"road":4,"home":6,"shop":7,"civic":11,"depot":8}

def material_fraction(material, progress):
    # La preparación consume áridos; estructura consume acero/madera; instalaciones consumen componentes.
    start, span = {"aggregate":(0,.45),"steel":(.15,.5),"timber":(.25,.55),"components":(.55,.4)}[material]
    return max(0,min(1,(progress-start)/span))

def material_plan(kind, initial_progress=0):
    return {key:max(1,round(amount*(1-initial_progress))) if amount else 0
            for key,amount in MATERIAL_NEEDS[kind].items()}

def ensure_business_state():
    shops=[b for b in state["buildings"] if b.get("kind")=="shop"]
    public=[b for b in state["buildings"] if b.get("kind") in ("civic","depot")]
    weights={"shop":1.0,"civic":.8,"depot":.65}
    total_weight=max(.01,sum(weights[b["kind"]] for b in shops+public))
    estimated_slots=max(1,round(state.get("jobs",0)/total_weight))
    for building in shops:
        if "business" not in building:
            building["business"]=new_business(building,estimated_slots,5000)
        firm=building["business"]
        for key,value in new_business(building,firm.get("jobSlots",estimated_slots),firm.get("cash",5000)).items():
            firm.setdefault(key,value)
        if firm.get("status")=="cerrado":building["status"]="cerrado"

def ensure_resident_roster():
    for home in (b for b in state["buildings"] if b.get("kind")=="home"):
        members=home.setdefault("residents",[]);home.setdefault("householdCash",0);home.setdefault("monthlyWageIncome",0)
        eligible_target=round(max(0,home.get("occupants",0))*.42)
        eligible_now=sum(1 for person in members if person.get("workerEligible"))
        while len(members)<max(0,home.get("occupants",0)):
            eligible=eligible_now<eligible_target
            person={"id":uuid.uuid4().hex,"workerEligible":eligible,"status":"buscando" if eligible else "inactivo",
                    "employerId":None,"employerName":None,"monthlyWage":0,"attendance":0}
            members.append(person)
            if eligible:eligible_now+=1
        if len(members)>home.get("occupants",0):del members[home["occupants"]:]

def ensure_supply_state():
    legacy_version=state.get("version",1)
    state["version"]=max(14,state.get("version",1))
    state.setdefault("roadAssets",[])
    for building in state["buildings"]:
        if building["kind"]=="home":
            building.setdefault("capacity",max(building.get("occupants",0),round(building.get("occupants",0)*1.15)))
    supply=state.setdefault("supply",new_supply())
    supply.setdefault("regional",INITIAL_REGIONAL_STOCK.copy())
    supply.setdefault("contractors",{})
    supply.setdefault("contractorCash",CONTRACTOR_CASH.copy())
    supply.setdefault("suppliers",{name:stock.copy() for name,stock in SUPPLIER_STOCK.items()})
    supply.setdefault("orders",[])
    for order in supply["orders"]:
        order.setdefault("priority","normal")
        if order.get("status") in ("esperando equipo","descargando"):
            order.setdefault("arrivedDay",min(state["day"],order.get("arrivalDay",state["day"])))
        if order.get("status")=="en tránsito":
            route=order.get("route",[]);distance=max(0,len(route)-1)
            if legacy_version<10:
                order["travelDistance"]=distance
                order["supplierReadyDay"]=max(order.get("orderedDay",state["day"]),order.get("arrivalDay",state["day"])-max(1,math.ceil(distance/6)))
                drive_days=max(1,math.ceil(distance/6))
                order["travelledDistance"]=distance*max(0,min(1,(state["day"]-order["supplierReadyDay"])/drive_days))
                order["routeProgress"]=0 if not distance else order["travelledDistance"]/distance
            else:
                order.setdefault("travelDistance",distance)
                order.setdefault("travelledDistance",distance*max(0,min(1,order.get("progress",0))))
                order.setdefault("supplierReadyDay",max(order.get("orderedDay",state["day"]),order.get("arrivalDay",state["day"])-max(1,math.ceil(distance/6))))
    supply.setdefault("depots",[])
    if legacy_version<8:
        for order in supply.get("orders",[]):
            if order.get("status")=="descargando":
                order["status"]="esperando equipo";order["statusCause"]="Reasignación de cuadrilla tras actualizar la simulación";order["unloadWorkers"]=0;order.pop("forkliftId",None);order["unloadProgress"]=0;order["arrivalDay"]=state["day"]
    supply.setdefault("yardCapacity",240)
    supply.setdefault("storageCapacity",240+500*sum(1 for b in state["buildings"] if b.get("kind")=="depot"))
    for name in CONTRACTOR_NAMES:
        supply["contractors"].setdefault(name,INITIAL_CONTRACTOR_STOCK.copy())
        supply["contractorCash"].setdefault(name,CONTRACTOR_CASH[name])
        for key,value in INITIAL_CONTRACTOR_STOCK.items():
            supply["contractors"][name].setdefault(key,value)
    for name,stock in SUPPLIER_STOCK.items():
        supply["suppliers"].setdefault(name,stock.copy())
        for key,value in stock.items(): supply["suppliers"][name].setdefault(key,value)
    known={d.get("id") for d in supply["depots"]}
    for building in state["buildings"]:
        if building.get("kind")!="depot":continue
        depot_id=f"depot-{building['x']}-{building['y']}"
        if depot_id not in known:
            supply["depots"].append({"id":depot_id,"x":building["x"],"y":building["y"],"capacity":building.get("capacityAdded",500),"label":building.get("name","Depósito municipal"),"stocks":{name:{key:0 for key in MATERIAL_NAMES} for name in CONTRACTOR_NAMES}})
    for depot in supply["depots"]:
        depot.setdefault("stocks",{})
        for name in CONTRACTOR_NAMES:
            depot["stocks"].setdefault(name,{key:0 for key in MATERIAL_NAMES})
            for key in MATERIAL_NAMES:depot["stocks"][name].setdefault(key,0)
    if legacy_version<7:
        for name in CONTRACTOR_NAMES:
            yard=supply["contractors"][name]
            overflow=max(0,sum(yard.values())-supply["yardCapacity"])
            for depot in supply["depots"]:
                free=max(0,depot["capacity"]-sum(sum(stock.values()) for stock in depot["stocks"].values()))
                move=min(overflow,free)
                for material in MATERIAL_NAMES:
                    quantity=min(yard[material],move)
                    yard[material]-=quantity;depot["stocks"][name][material]+=quantity;move-=quantity
                    if not move:break
                overflow-=min(overflow,free)
            if overflow:
                supply["yardCapacity"]+=overflow
    stored=sum(sum(stock.values()) for stock in supply["contractors"].values())+sum(sum(stock.values()) for d in supply["depots"] for stock in d["stocks"].values())
    inbound=sum(sum(order.get("items",{}).values()) for order in supply["orders"] if order.get("status") in ("en tránsito","esperando equipo","descargando"))
    if legacy_version<7:
        yard_inbound=sum(sum(order.get("items",{}).values()) for order in supply["orders"]
                         if order.get("status") in ("en tránsito","esperando equipo","descargando") and order.get("destinationId","yard")=="yard")
        supply["yardCapacity"]=max(supply["yardCapacity"],sum(sum(stock.values()) for stock in supply["contractors"].values())+yard_inbound)
    # A saved city can already have more stock in flight than its new default capacity.
    # Preserve those paid deliveries during migration instead of making the old save impossible to load.
    capacity_floor=supply["yardCapacity"]+sum(depot["capacity"] for depot in supply["depots"])
    supply["storageCapacity"]=max(int(supply["storageCapacity"]),capacity_floor,stored+inbound)
    for p in state["projects"]:
        p.setdefault("workersAssigned",0 if p.get("status")=="pausada" else LABOR_NEEDS[p["kind"]])
        if "materialsRequired" not in p:
            p["materialsRequired"]=material_plan(p["kind"],p.get("initialProgress",0))
            local_progress=p.get("elapsed",0)/max(1,p.get("duration",1))
            # Compatibilidad: obras de versiones anteriores no vuelven a gastar materiales ya ejecutados.
            p["materialsUsed"]={key:math.ceil(amount*material_fraction(key,local_progress))
                                for key,amount in p["materialsRequired"].items()}
        p.setdefault("materialsUsed",{key:0 for key in MATERIAL_NAMES})
    ensure_business_state()
    ensure_resident_roster()

def material_delta(p, next_elapsed):
    local_progress=next_elapsed/max(1,p["duration"])
    return {key:max(0,math.ceil(amount*material_fraction(key,local_progress))-p["materialsUsed"].get(key,0))
            for key,amount in p["materialsRequired"].items()}

def material_sources(contractor, project):
    sources=[("patio",state["supply"]["contractors"][contractor],route_between((4,10),(project["x"],project["y"])))]
    for depot in state["supply"].get("depots",[]):
        route=route_between((depot["x"],depot["y"]),(project["x"],project["y"]))
        if route:sources.append((depot["id"],depot["stocks"][contractor],route))
    return sorted((source for source in sources if source[2]),key=lambda source:len(source[2]))

def missing_materials(p, next_elapsed):
    sources=material_sources(p["contractor"],p)
    available={key:sum(stock[key] for _,stock,_ in sources) for key in MATERIAL_NAMES}
    return [key for key,amount in material_delta(p,next_elapsed).items() if available[key]<amount]

def consume_materials(project, amounts):
    sources=material_sources(project["contractor"],project)
    for material,amount in amounts.items():
        remaining=amount
        for _,stock,_ in sources:
            used=min(stock[material],remaining);stock[material]-=used;remaining-=used
            if not remaining:break
        if remaining:raise RuntimeError("Inventario logístico cambió durante el consumo")

def contractor_has_capacity(name):
    return sum(p["contractor"]==name and p.get("status")!="pausada" for p in state["projects"])<CONTRACTORS[name]["capacity"]

def contractor_free_workers(name):
    assigned=sum(p.get("workersAssigned",0 if p.get("status")=="pausada" else LABOR_NEEDS[p["kind"]])
                 for p in state["projects"] if p["contractor"]==name)
    assigned+=sum(o.get("unloadWorkers",0) for o in state["supply"].get("orders",[]) if o.get("contractor")==name and o.get("status")=="descargando")
    return CONTRACTORS[name]["workers"]-assigned

def free_forklift(name):
    in_use={o.get("forkliftId") for o in state["supply"].get("orders",[]) if o.get("contractor")==name and o.get("status")=="descargando"}
    return next((i for i in range(1,CONTRACTORS[name]["forklifts"]+1) if i not in in_use),None)

def begin_unloading(order):
    contractor=order["contractor"];spec=CONTRACTORS[contractor];forklift=free_forklift(contractor)
    workers=spec["unloadWorkers"]
    if forklift is None:
        order["statusCause"]="Esperando autoelevador disponible";return False
    if contractor_free_workers(contractor)<workers:
        order["statusCause"]="Esperando cuadrilla de descarga";return False
    amount=sum(order["items"].values());days=max(1,math.ceil(amount/spec["unloadRate"]))
    order["status"]="descargando";order["statusCause"]="";order["forkliftId"]=forklift;order["unloadWorkers"]=workers
    order["unloadRate"]=spec["unloadRate"];order["unloadStartDay"]=state["day"];order["unloadUntilDay"]=state["day"]+days;order["unloadProgress"]=0
    ev("Descarga en curso",f"{contractor} asignó {workers} operarios y el autoelevador {forklift}; descarga estimada: {days} día(s).")
    return True

def is_water(x,y):
    return x>=24 or (y<3 and x>18)

def route_between(start_coord, destination_coord):
    roads={tuple(r) for r in state["roads"]}
    adjacent=lambda point:{(point[0]+dx,point[1]+dy) for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))}
    starts={start_coord} if start_coord in roads else adjacent(start_coord)&roads
    goals={destination_coord} if destination_coord in roads else adjacent(destination_coord)&roads
    if not starts or not goals:return None
    queue=list(starts);previous={point:None for point in starts};target=None
    for current in queue:
        if current in goals: target=current;break
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            neighbor=(current[0]+dx,current[1]+dy)
            if neighbor in roads and neighbor not in previous:
                previous[neighbor]=current;queue.append(neighbor)
    if target is None:return None
    path=[];current=target
    while current is not None:path.append([current[0],current[1]]);current=previous[current]
    path.reverse()
    if start_coord not in roads:path.insert(0,list(start_coord))
    if destination_coord not in roads:path.append(list(destination_coord))
    return path

_commute_cache_key=None
_commute_cache=None
def commute_model():
    """Asigna residentes identificables a una vacante y una ruta laboral cada uno."""
    global _commute_cache_key,_commute_cache
    ensure_resident_roster()
    roads={tuple(r) for r in state["roads"]}
    homes=[b for b in state["buildings"] if b.get("kind")=="home" and b.get("occupants",0)>0]
    sites=[b for b in state["buildings"] if b.get("status","operativo") in ("operativo","habilitado") and
           (b.get("kind") in ("civic","depot") or (b.get("kind")=="shop" and b.get("business",{}).get("status")=="abierto"))]
    key=(state["day"],state["jobs"],state["employment"],tuple(sorted(roads)),
         tuple((b.get("x"),b.get("y"),b.get("kind"),b.get("occupants",0),b.get("status"),b.get("business",{}).get("status"),b.get("business",{}).get("jobSlots"),tuple((r.get("id"),r.get("workerEligible")) for r in b.get("residents",[]))) for b in homes+sites),
         tuple((o.get("id"),o.get("status"),round(o.get("travelledDistance",0),1)) for o in state.get("supply",{}).get("orders",[]) if o.get("status")=="en tránsito"))
    if key==_commute_cache_key:return _commute_cache
    weights={"shop":1.0,"civic":.8,"depot":.65}
    company_jobs=sum(b.get("business",{}).get("jobSlots",0) for b in sites if b["kind"]=="shop")
    public_sites=[b for b in sites if b["kind"] in ("civic","depot")]
    public_jobs=max(0,state["jobs"]-company_jobs)
    public_weight=sum(weights[b["kind"]] for b in public_sites)
    caps=[max(0,int(b.get("business",{}).get("jobSlots",0))) if b["kind"]=="shop" else public_jobs*weights[b["kind"]]/max(.01,public_weight) for b in sites]
    routes={}; distances={}
    for hi,home in enumerate(homes):
        for si,site in enumerate(sites):
            path=route_between((home["x"],home["y"]),(site["x"],site["y"]))
            if path:
                routes[hi,si]=path
                distances[hi,si]=sum(1 for aa,bb in zip(path,path[1:]) if tuple(aa) in roads and tuple(bb) in roads)
    residents=[(hi,home,person) for hi,home in enumerate(homes) for person in home.get("residents",[]) if person.get("workerEligible")]
    target=min(round(len(residents)*max(0,min(100,state["employment"]))/100),round(sum(caps)))
    remaining={si:int(math.floor(cap)) for si,cap in enumerate(caps)}
    # Priorizar residentes sin empleo; rutas cortas primero. Cada residente recibe un solo empleador.
    candidates=[]
    for hi,home,person in residents:
        person.update({"status":"buscando","employerId":None,"employerName":None,"monthlyWage":0,"attendance":0})
        choices=sorted((distances[hi,si],si) for si in range(len(sites)) if (hi,si) in routes)
        if choices:candidates.append((choices[0][0],hi,home,person,choices))
    candidates.sort(key=lambda row:(row[0],row[1],row[3]["id"]))
    employees=[]; site_people={si:[] for si in range(len(sites))}
    for _,hi,home,person,choices in candidates:
        if len(employees)>=target:break
        si=next((candidate for _,candidate in choices if remaining[candidate]>0),None)
        if si is None:continue
        site=sites[si];firm=site.get("business",{}) if site["kind"]=="shop" else {}
        wage=max(1,int(firm.get("wage",10) if site["kind"]=="shop" else 8))
        employer_id=firm.get("id",f"public-{site['kind']}-{site['x']}-{site['y']}")
        person.update({"status":"empleado","employerId":employer_id,"employerName":site.get("name",site["kind"]),"monthlyWage":wage})
        remaining[si]-=1
        item={"home":home,"person":person,"site":site,"siteIndex":si,"wage":wage,"route":routes[hi,si],"distance":distances[hi,si]}
        employees.append(item);site_people[si].append(item)
    segment_flow={}; commutes=[]; site_effective={si:0 for si in range(len(sites))}; site_minutes={si:0 for si in range(len(sites))}; weighted_minutes=0; distance_total=0
    grouped={}
    for emp in employees:
        group=(emp["home"]["x"],emp["home"]["y"],emp["site"]["x"],emp["site"]["y"])
        grouped.setdefault(group,[]).append(emp)
        distance_total+=emp["distance"]
    for (hx,hy,sx,sy),items in grouped.items():
        route=items[0]["route"];distance=items[0]["distance"];factor=1.0
        minutes=round(distance*2.5*factor);attendance=max(.25,1-max(0,minutes-15)/240)
        commutes.append({"from":[hx,hy],"to":[sx,sy],"workers":len(items),"distance":distance,"route":route,"trafficFactor":round(factor,2),"estimatedMinutes":minutes,"attendance":round(attendance,2)})
        weighted_minutes+=len(items)*minutes
        si=items[0]["siteIndex"];site_effective[si]+=len(items)*attendance;site_minutes[si]+=len(items)*minutes
        for aa,bb in zip(route,route[1:]):
            aa=tuple(aa);bb=tuple(bb)
            if aa in roads and bb in roads:
                edge=tuple(sorted((aa,bb)));segment_flow[edge]=segment_flow.get(edge,0)+len(items)/75
    workplaces=[];staffed=private_staffed=0
    for si,site in enumerate(sites):
        slots=caps[si];effective=min(slots,site_effective[si]);staffed+=effective
        if site["kind"]=="shop":private_staffed+=effective
        people=site_people[si]
        workplaces.append({"name":site.get("name",site["kind"].title()),"kind":site["kind"],"x":site["x"],"y":site["y"],"jobSlots":round(slots),"workersAssigned":len(people),"staffedJobs":round(effective),"payroll":sum(x["wage"] for x in people),"attendance":round(effective/max(1,len(people)),2),"meanMinutes":round(site_minutes[si]/len(people)) if people else None})
    total_eligible=len(residents);without_access=sum(1 for _,home,person in residents if person.get("status")!="empleado" and not any((hi,si) in routes for si in range(len(sites)) for hi,h in enumerate(homes) if h is home))
    model={"commuters":len(employees),"workersWithoutRoadAccess":without_access,"unemployed":max(0,total_eligible-len(employees)-without_access),"meanDistance":round(distance_total/max(1,len(employees)),1) if employees else 0,"meanMinutes":round(weighted_minutes/max(1,len(employees))) if employees else 0,"effectiveEmployment":round(staffed/max(1,state["population"]*.42)*100),"effectiveWorkers":round(staffed),"staffedJobs":round(staffed),"privateStaffedJobs":round(private_staffed),"workplaces":workplaces,"routes":commutes,"segmentFlow":segment_flow,"employees":employees}
    _commute_cache_key=key;_commute_cache=model
    # Now that segment flows are cached, congestion can include both commuters and trucks.
    minutes_sum=0;effective_by_site={};minutes_by_site={};workers_by_site={}
    for trip in commutes:
        factor=traffic_factor(trip["route"]);minutes=round(trip["distance"]*2.5*factor)
        attendance=max(.25,1-max(0,minutes-15)/240)
        trip.update({"trafficFactor":round(factor,2),"estimatedMinutes":minutes,"attendance":round(attendance,2)})
        minutes_sum+=trip["workers"]*minutes
        si=next((i for i,site in enumerate(sites) if site["x"]==trip["to"][0] and site["y"]==trip["to"][1]),None)
        if si is not None:
            effective_by_site[si]=effective_by_site.get(si,0)+trip["workers"]*attendance
            minutes_by_site[si]=minutes_by_site.get(si,0)+trip["workers"]*minutes
            workers_by_site[si]=workers_by_site.get(si,0)+trip["workers"]
    staffed=private_staffed=0
    for si,workplace in enumerate(workplaces):
        effective=min(workplace["jobSlots"],effective_by_site.get(si,0));workplace["staffedJobs"]=round(effective)
        workplace["attendance"]=round(effective/max(1,workplace["workersAssigned"]),2)
        workplace["meanMinutes"]=round(minutes_by_site[si]/workers_by_site[si]) if workers_by_site.get(si) else None
        staffed+=effective
        if workplace["kind"]=="shop":private_staffed+=effective
    model.update({"meanMinutes":round(minutes_sum/max(1,len(employees))) if employees else 0,"effectiveWorkers":round(staffed),"staffedJobs":round(staffed),"privateStaffedJobs":round(private_staffed),"effectiveEmployment":round(staffed/max(1,state["population"]*.42)*100)})
    return model

def traffic_factor(route, exclude_order=None):
    """Tiempo relativo por tramo: empleo local más camiones que ocupan ese tramo hoy."""
    if not route or len(route)<2:return 1.0
    factors=[]
    active=[o for o in state.get("supply",{}).get("orders",[])
            if o is not exclude_order and o.get("status")=="en tránsito" and state["day"]>o.get("supplierReadyDay",o.get("orderedDay",0)) and len(o.get("route",[]))>1]
    for i in range(len(route)-1):
        a=tuple(route[i]);b=tuple(route[i+1]);edge=tuple(sorted((a,b)))
        arterial=a[1]==10 or b[1]==10 or a[0]==12 or b[0]==12
        background=commute_model()["segmentFlow"].get(edge,0)
        capacity=2.4 if arterial else 1.2
        trucks=0
        for order in active:
            path=order.get("route",[]);idx=min(len(path)-2,max(0,int(order.get("travelledDistance",0))))
            if tuple(sorted((tuple(path[idx]),tuple(path[idx+1]))))==edge:trucks+=1
        ratio=(background+trucks)/capacity
        factors.append(1+.35*ratio*ratio+2.4*max(0,ratio-1)**2)
    return sum(factors)/len(factors)

def order_route_eta(order):
    distance=max(0,order.get("travelDistance",len(order.get("route",[]))-1))
    factor=traffic_factor(order.get("route",[]),order)
    remaining=max(0,distance-order.get("travelledDistance",0))
    travel_days=math.ceil(remaining*factor/6)
    ready=max(state["day"],order.get("supplierReadyDay",state["day"]))
    arrival=max(state["day"]+1,max(state["day"],ready)+travel_days)
    planned=order.get("supplierReadyDay",state["day"])+math.ceil(distance/6)
    return factor,max(0,arrival-planned),arrival

def pay_public_wages(workforce):
    payroll=0
    for emp in workforce.get("employees",[]):
        if emp["site"].get("kind") not in ("civic","depot"):continue
        wage=emp["wage"];home=emp["home"]
        home["householdCash"]=round(home.get("householdCash",0)+wage)
        home["monthlyWageIncome"]=home.get("monthlyWageIncome",0)+wage
        payroll+=wage
    return payroll

def simulate_business_month(workforce):
    shops=[b for b in state["buildings"] if b.get("kind")=="shop" and b.get("business",{}).get("status")=="abierto"]
    homes=[b for b in state["buildings"] if b.get("kind")=="home" and b.get("occupants",0)>0]
    demand={(b["x"],b["y"]):0.0 for b in shops};roads={tuple(r) for r in state["roads"]}
    for emp in workforce.get("employees",[]):
        if emp["site"].get("kind")=="shop":
            home=emp["home"];home["householdCash"]=round(home.get("householdCash",0)+emp["wage"]);home["monthlyWageIncome"]=home.get("monthlyWageIncome",0)+emp["wage"]
    reachable_by_home={}
    for home in homes:
        reachable=[]
        for shop in shops:
            route=route_between((home["x"],home["y"]),(shop["x"],shop["y"]))
            if route:
                distance=sum(1 for a,b in zip(route,route[1:]) if tuple(a) in roads and tuple(b) in roads)
                reachable.append((shop,1/max(1,distance+1)**1.4))
        weight=sum(w for _,w in reachable);reachable_by_home[id(home)]=reachable
        if weight:
            desired=max(0,round(home.get("occupants",0)*.12));affordable=max(0,round(home.get("householdCash",0)/18));buy=min(desired,affordable)
            for shop,w in reachable:demand[shop["x"],shop["y"]]+=buy*w/weight
    workplace={(w["x"],w["y"]):w for w in workforce["workplaces"]}
    revenue_total=payroll_total=sales_total=closed=0
    for shop in shops:
        firm=shop["business"];key=(shop["x"],shop["y"]);site=workplace.get(key,{})
        if firm.get("cash",0)<0:
            firm["status"]="cerrado";shop["status"]="cerrado";state["jobs"]=max(0,state["jobs"]-firm.get("jobSlots",0));closed+=1
            ev("Empresa en quiebra",f"{firm['name']} no pudo pagar sus compromisos y cerró con saldo negativo. Se pierden {firm['jobSlots']} puestos potenciales.");continue
        staffed=max(0,round(site.get("staffedJobs",0)));headcount=max(0,int(site.get("workersAssigned",0)))
        market=demand.get(key,0);regional=max(0,round(firm.get("jobSlots",0)*.35));total_demand=market+regional;inventory=max(0,int(firm.get("inventory",0)))
        production=min(max(0,200-inventory),max(0,math.ceil(total_demand-inventory)),max(0,round(staffed*firm.get("productivity",.06)*30)))
        sales=min(inventory+production,max(0,math.floor(total_demand)));local_sales=min(sales,max(0,round(market)))
        revenue=sales*firm.get("price",18);inputs=production*firm.get("inputCost",5);payroll=headcount*firm.get("wage",10);overhead=firm.get("fixedCost",40)
        local_left=local_sales
        buyers=sorted(homes,key=lambda h:sum(w for sh,w in reachable_by_home[id(h)] if sh is shop),reverse=True)
        for home in buyers:
            if local_left<=0:break
            if not any(sh is shop for sh,_ in reachable_by_home[id(home)]):continue
            bought=min(max(0,round(home.get("occupants",0)*.12)),max(0,round(home.get("householdCash",0)/18)),local_left)
            home["householdCash"]-=bought*18;local_left-=bought
        profit=revenue-inputs-payroll-overhead;firm["cash"]=round(firm.get("cash",0)+profit);firm["inventory"]=inventory+production-sales
        firm["lastSales"]=sales;firm["lastLocalSales"]=local_sales;firm["lastRegionalSales"]=sales-local_sales;firm["lastRevenue"]=revenue;firm["lastInputs"]=inputs;firm["lastProduction"]=production;firm["lastPayroll"]=payroll;firm["lastProfit"]=profit;firm["lastWorkers"]=headcount;firm["lastDemand"]=round(total_demand)
        revenue_total+=revenue;payroll_total+=payroll;sales_total+=sales
        if firm["cash"]<0:
            firm["status"]="cerrado";shop["status"]="cerrado";state["jobs"]=max(0,state["jobs"]-firm.get("jobSlots",0));closed+=1
            ev("Empresa en quiebra",f"{firm['name']} dejó de cubrir salarios e insumos; cerró con saldo negativo. Se pierden {firm['jobSlots']} puestos potenciales.")
    return {"revenue":revenue_total,"payroll":payroll_total,"sales":sales_total,"closed":closed}

def route_to_project(project):return route_between((4,10),(project["x"],project["y"]))

def storage_location(location_id):
    if not location_id or location_id=="yard":return {"id":"yard","x":4,"y":10,"capacity":state["supply"].get("yardCapacity",240),"label":"Patio de constructoras"}
    return next((d for d in state["supply"].get("depots",[]) if d["id"]==location_id),None)

def storage_used(location_id):
    if location_id=="yard":
        return sum(sum(stock.values()) for stock in state["supply"]["contractors"].values())
    depot=storage_location(location_id)
    return sum(sum(stock.values()) for stock in depot["stocks"].values()) if depot else 0

def storage_reserved(location_id):
    return sum(sum(order.get("items",{}).values()) for order in state["supply"]["orders"]
               if order.get("status") in ("en tránsito","esperando equipo","descargando") and order.get("destinationId","yard")==location_id)

def order_urgency(order):
    """Prioridad visible de cola; exposición es una estimación y nunca un débito."""
    waiting=max(0,state["day"]-order.get("arrivedDay",order.get("arrivalDay",state["day"]))) if order.get("status") in ("esperando equipo","descargando") else 0
    project=next((p for p in state["projects"] if p["id"]==order.get("projectId")),None)
    critical=[]
    if project and project.get("status") not in ("pausada","terminada"):
        sources=material_sources(project["contractor"],project)
        needed=material_delta(project,project.get("elapsed",0)+1)
        available={key:sum(stock[key] for _,stock,_ in sources) for key in MATERIAL_NAMES}
        accessible={source_id for source_id,_,_ in sources}
        destination=order.get("destinationId","yard")
        source_id="patio" if destination=="yard" else destination
        if source_id in accessible:
            critical=[key for key,amount in needed.items() if available[key]<amount<=available[key]+order.get("items",{}).get(key,0)]
    exposure=round(project.get("cost",0)/max(1,project.get("duration",1))*waiting) if critical and project else 0
    manual=order.get("priority")=="alta"
    # Keep explicit mayoral priority ahead of every automatically accumulated wait.
    score=(100000 if manual else 0)+(50000 if critical else 0)+min(waiting,365)*100+min(9999,exposure)
    reason=("Prioridad municipal alta" if manual else "")
    if critical:
        names=" y ".join(MATERIAL_NAMES[k] for k in critical)
        reason=(reason+" · " if reason else "")+f"destraba falta de {names}"
    if not reason: reason="Turno de llegada"
    return {"waitingDays":waiting,"criticalMaterials":critical,"delayExposure":exposure,"urgencyScore":score,"urgencyReason":reason}

def process_supply_orders():
    ensure_supply_state()
    for order in sorted(state["supply"]["orders"],key=lambda o:(-order_urgency(o)["urgencyScore"],o.get("arrivedDay",o.get("arrivalDay",0)),o.get("orderedDay",0))):
        if order["status"] not in ("en tránsito","esperando equipo","descargando"):continue
        destination=order.get("destinationId","yard")
        location=storage_location(destination)
        route=route_between((4,10),(location["x"],location["y"])) if location else None
        if route is None:
            if order.get("statusCause")!="Sin acceso de camiones":
                ev("Entrega retrasada","El camión no encuentra una calle conectada hasta el depósito; el pedido espera una ruta abierta.")
            order["status"]="en tránsito";order["statusCause"]="Sin acceso de camiones";order["arrivalDay"]=state["day"]+1;order["route"]=[]
            order.pop("forkliftId",None);order["unloadWorkers"]=0;order["unloadProgress"]=0
            continue
        order["route"]=route
        if order["status"]=="en tránsito":
            order.setdefault("travelDistance",max(0,len(route)-1))
            order.setdefault("travelledDistance",0)
            order.setdefault("supplierReadyDay",order.get("orderedDay",state["day"]))
            order["travelDistance"]=max(0,len(route)-1)
            if state["day"]>order["supplierReadyDay"] and order["travelledDistance"]<order["travelDistance"]:
                factor=traffic_factor(route,order)
                order["travelledDistance"]=min(order["travelDistance"],order["travelledDistance"]+6/max(1,factor))
            factor,delay,arrival=order_route_eta(order)
            order["trafficFactor"]=round(factor,2);order["trafficDelayDays"]=delay;order["arrivalDay"]=arrival
            order["routeProgress"]=1 if not order["travelDistance"] else min(1,order["travelledDistance"]/order["travelDistance"])
            order["progress"]=order["routeProgress"]
            if state["day"]<=order["supplierReadyDay"] or order["travelledDistance"]<order["travelDistance"]:
                order["statusCause"]=("Preparación en proveedor" if state["day"]<=order["supplierReadyDay"] else
                                       f"Tránsito lento · congestión ×{factor:.2f}" if factor>=1.35 else "En ruta")
                continue
            order["status"]="esperando equipo";order["unloadWorkers"]=0;order["progress"]=1;order["arrivedDay"]=state["day"]
            ev("Camión en zona de descarga",f"{order['supplier']} llegó a {order.get('destinationLabel','Patio de constructoras')}; espera autoelevador y operarios de {order['contractor']}.")
        if order["status"]=="esperando equipo":
            begin_unloading(order)
            continue
        order["unloadProgress"]=min(1,max(0,(state["day"]-order.get("unloadStartDay",state["day"]))/max(1,order.get("unloadUntilDay",state["day"]+1)-order.get("unloadStartDay",state["day"]))))
        if state["day"]<order.get("unloadUntilDay",state["day"]):continue
        order["status"]="entregado";order["deliveredDay"]=state["day"];order["statusCause"]="";order["unloadWorkers"]=0;order.pop("forkliftId",None)
        stock=(state["supply"]["contractors"][order["contractor"]] if destination=="yard"
               else location["stocks"][order["contractor"]])
        for material,amount in order["items"].items():stock[material]+=amount
        summary=" · ".join(f"{MATERIAL_NAMES[k]} {v}" for k,v in order["items"].items())
        ev("Materiales entregados",f"{order['supplier']} llevó {summary} a {order['label']} por {len(route)-1} tramos de calle.")

def move_households():
    homes=[b for b in state["buildings"] if b["kind"]=="home"]
    desired=max(-5,min(12,round((state["approval"]-45)/8)))
    if desired>0:
        vacancies=sum(max(0,b["capacity"]-b["occupants"]) for b in homes)
        jobs_room=max(0,round(state["jobs"]/.42-state["population"]))
        arrivals=min(desired,vacancies,jobs_room)
        for _ in range(arrivals):
            available=[b for b in homes if b["occupants"]<b["capacity"]]
            if not available: break
            home=min(available,key=lambda b:b["occupants"]/max(1,b["capacity"]))
            home["occupants"]+=1
        if arrivals:
            state["population"]+=arrivals
            state["monthlyIncome"]+=arrivals*3
            ev("Nuevos hogares",f"{arrivals} residentes se mudaron a viviendas con vacantes y acceso a empleo. Ingreso tributario futuro +$ {arrivals*3}/mes.")
        elif vacancies==0:
            ev("Vivienda sin vacantes","La demanda de mudanza no puede concretarse: los hogares existentes están completos.")
        elif jobs_room==0:
            ev("Migración frenada por empleo","Hay viviendas disponibles, pero faltan empleos para atraer nuevos hogares.")
    elif desired<0:
        departures=min(-desired,sum(b["occupants"] for b in homes))
        for _ in range(departures):
            occupied=[b for b in homes if b["occupants"]>0]
            if not occupied: break
            home=min(occupied,key=lambda b:b.get("quality",70))
            home["occupants"]-=1
        state["population"]=max(0,state["population"]-departures)
        state["monthlyIncome"]=max(0,state["monthlyIncome"]-departures*3)
        if departures: ev("Salida de residentes",f"{departures} personas dejaron viviendas de la ciudad; se reducen los ingresos tributarios en $ {departures*3}/mes.")

def tick_one_day():
    if state["paused"]: return
    ensure_supply_state()
    state["day"] += 1
    day=state["day"]
    month=(day-1)//30
    if month>state["lastMonth"]:
        for home in state["buildings"]:
            if home.get("kind")=="home":home["monthlyWageIncome"]=0
        supplier_stock=state["supply"]["suppliers"]
        for key,amount in REGIONAL_PRODUCTION.items():
            supplier_stock["Distribuidora Regional"][key]+=round(amount*.6)
            supplier_stock["Corralón del Puerto"][key]+=round(amount*.25)
            supplier_stock["Flete Urgente"][key]+=round(amount*.15)
        ev("Producción regional", "Canteras, acerías y talleres repusieron parte de las existencias de proveedores.")
        economic=commute_model()
        public_payroll=pay_public_wages(economic)
        activity=simulate_business_month(economic)
        economic=commute_model()
        business_income=round(economic["privateStaffedJobs"]*2)
        monthly_income=state["monthlyIncome"]+business_income
        due=state["monthlyExpenses"]+public_payroll
        available=state["money"]+monthly_income
        net=monthly_income-due
        if available>=due:
            state["money"]=available-due
        else:
            # No sobregiro implícito: se agota la caja y cae la capacidad de servicio financiada.
            shortfall=due-available
            state["money"]=0
            loss=max(1,min(8,round(shortfall/900)))
            state["services"]=max(5,state["services"]-loss)
            state["approval"]=max(5,state["approval"]-max(1,loss//2))
            ev("Servicios sin financiación completa",f"Faltaron $ {shortfall:,} para el gasto mensual; la cobertura cae {loss} puntos hasta recuperar caja.".replace(",","."))
        state["lastMonth"]=month
        ev("Actividad de empresas",f"Comercios vendieron {activity['sales']} unidades por $ {activity['revenue']:,}; nómina pagada $ {activity['payroll']:,}. Empresas cerradas este mes: {activity['closed']}.".replace(",","."))
        ev("Balance mensual",f"Ingresos $ {monthly_income:,} (impuesto comercial $ {business_income:,}) · gastos base $ {state['monthlyExpenses']:,} + nómina pública $ {public_payroll:,} · balance neto $ {net:,}.".replace(",","."))
        move_households()
        if net<0: ev("Presión sobre la tesorería","El gasto mensual supera los ingresos disponibles; revisar compromisos y servicios.")
    process_supply_orders()
    for p in list(state["projects"]):
        if p.get("status")=="pausada": continue
        if p.get("status")=="suspendida":
            if not p.get("cause","").startswith("Faltan materiales") or missing_materials(p,p["elapsed"]+1): continue
            p["status"]="contratada";p["cause"]="Insumos recibidos; la cuadrilla vuelve a trabajar"
            ev("Obra reanudada por abastecimiento",f"{p['label']} recibió materiales y retoma el avance.")
        c=CONTRACTORS[p["contractor"]]
        next_elapsed=p["elapsed"]+1
        missing=missing_materials(p,next_elapsed)
        if missing:
            p["status"]="suspendida"
            p["cause"]="Faltan materiales: "+", ".join(MATERIAL_NAMES[key] for key in missing)
            ev("Obra demorada por insumos",f"{p['label']} en {p['x']+1},{p['y']+1}: {p['cause']}. Pedí los materiales faltantes desde la tarjeta de la obra.")
            continue
        targetPaid=p["cost"]*(.2+.8*next_elapsed/p["duration"])
        due=max(0,targetPaid-p["paid"])
        if not p.get("privatePaid") and due>state["money"]:
            p["status"]="suspendida"; p["cause"]="Tesorería insuficiente para el pago por avance"; continue
        material_cost=material_delta(p,next_elapsed)
        consume_materials(p,material_cost)
        for key,amount in material_cost.items():p["materialsUsed"][key]=p["materialsUsed"].get(key,0)+amount
        if not p.get("privatePaid"): state["money"]-=due
        if due>0: state["supply"]["contractorCash"][p["contractor"]]+=due
        p["paid"]=targetPaid
        p["elapsed"]=next_elapsed
        p["progress"]=min(1,p.get("initialProgress",0)+(1-p.get("initialProgress",0))*next_elapsed/p["duration"])
        stage=int(p["progress"]*len(p["stages"]))
        p["stageIndex"]=min(len(p["stages"])-1,stage)
        if p["progress"]>=1:
            quality=round(c["quality"]*100)
            if p["kind"]=="road":
                state["roads"].append([p["x"],p["y"]])
                state["monthlyIncome"]+=85
                maintenance=round(70*(1.2-c["quality"]))
                state["monthlyExpenses"]+=maintenance
                state["roadAssets"].append({"x":p["x"],"y":p["y"],"quality":quality,"monthlyCost":maintenance})
            elif p["kind"]=="home":
                b={"x":p["x"],"y":p["y"],"kind":"home","name":"Viviendas en calle nueva","level":1,"occupants":0,"capacity":28,"status":"habilitado","quality":quality}; state["buildings"].append(b)
                residents=min(28,max(0,state["jobs"]-state["population"]*.42)); b["occupants"]=round(residents); state["population"]+=round(residents); state["monthlyIncome"]+=round(residents*3)
                ev("Primeros hogares se mudan",f"{round(residents)} residentes ocuparon las nuevas viviendas; ya tienen acceso vial.")
            elif p["kind"]=="shop":
                building={"x":p["x"],"y":p["y"],"kind":"shop","name":"Nuevo comercio","level":1,"occupants":0,"status":"habilitado","quality":quality}
                opening_capital=min(1200,max(0,state["privateCapital"]));state["privateCapital"]-=opening_capital
                building["business"]=new_business(building,12,opening_capital);state["buildings"].append(building);state["jobs"]+=12
            elif p["kind"]=="depot":
                state["buildings"].append({"x":p["x"],"y":p["y"],"kind":"depot","name":"Depósito municipal","level":1,"status":"habilitado","capacityAdded":500,"quality":quality})
                depot_id=f"depot-{p['x']}-{p['y']}"
                state["supply"].setdefault("depots",[]).append({"id":depot_id,"x":p["x"],"y":p["y"],"capacity":500,"label":"Depósito municipal","stocks":{name:{key:0 for key in MATERIAL_NAMES} for name in CONTRACTOR_NAMES}})
                state["supply"]["storageCapacity"]+=500;state["monthlyExpenses"]+=180
                ev("Depósito logístico habilitado",f"El depósito abre con 500 unidades de capacidad adicional. Operación y seguridad $ 180/mes.")
            elif p["kind"]=="civic":
                operating_cost=round(650*(1.4-c["quality"]*.5))
                coverage=round(5+5*c["quality"])
                state["buildings"].append({"x":p["x"],"y":p["y"],"kind":"civic","name":"Centro de salud","level":1,"occupants":0,"status":"habilitado","monthlyCost":operating_cost,"quality":quality}); state["monthlyExpenses"]+=operating_cost; state["services"]=min(100,state["services"]+coverage); state["approval"]=min(100,state["approval"]+3)
                ev("Centro de salud habilitado",f"Inspección aprobada con calidad {quality}%. Cobertura +{coverage} puntos; operación y mantenimiento $ {operating_cost}/mes.")
            if p["kind"] not in ("civic","depot"): ev(f"{p['label']} habilitado",f"{p['contractor']} entregó la obra con calidad {quality}%. Su mantenimiento afecta el balance municipal." if p["kind"]=="road" else f"{p['contractor']} completó la inspección y entregó la obra con calidad {quality}%.")
            state["projects"].remove(p)
    if day%30==0 and state["projects"]: ev("Revisión de contratos",f"{len(state['projects'])} obra(s) activa(s). El avance depende del tiempo y de los pagos disponibles.")

def public_state(player_id=None):
    ensure_supply_state()
    cutoff=time.time()-25
    online=sum(1 for t in state["players"].values() if t>cutoff)
    reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"))
    view={k:v for k,v in state.items() if k not in ("players","host")}
    order_views=[]
    for order in state["supply"]["orders"]:
        extra=order_urgency(order)
        if order.get("status")=="en tránsito":
            factor,delay,arrival=order_route_eta(order)
            extra.update({"trafficFactor":round(factor,2),"trafficDelayDays":delay,"arrivalDay":arrival,
                          "routeProgress":order.get("routeProgress",order.get("progress",0))})
        order_views.append({**order,**extra})
    view["supply"]={**state["supply"],"orders":order_views}
    commute=commute_model()
    view["traffic"]={k:commute[k] for k in ("commuters","workersWithoutRoadAccess","meanDistance","meanMinutes","effectiveEmployment","effectiveWorkers","staffedJobs","privateStaffedJobs")}
    view["commutes"]=commute["routes"]
    view["workplaces"]=commute["workplaces"]
    view["householdWageIncome"]=sum(h.get("monthlyWageIncome",0) for h in state["buildings"] if h.get("kind")=="home")
    view["publicPayroll"]=sum(w.get("payroll",0) for w in commute["workplaces"] if w["kind"] in ("civic","depot"))
    view["effectiveMonthlyExpenses"]=round(state["monthlyExpenses"]+view["publicPayroll"])
    business_income=round(commute["privateStaffedJobs"]*2)
    return {**view,"businessIncome":business_income,"grossMonthlyIncome":round(state["monthlyIncome"]+business_income),"online":online,"isHost":player_id is not None and player_id==state.get("host"),"contractors":CONTRACTORS,"suppliers":SUPPLIERS,"materialPrices":MATERIAL_PRICE,"reserved":round(reserved),"available":max(0,round(state["money"]-reserved))}

class Handler(BaseHTTPRequestHandler):
    server_version="CiudadViva/0.15"
    def log_message(self,*args): pass
    def _send(self,status,body,typ="application/json; charset=utf-8"):
        data=body if isinstance(body,bytes) else (json.dumps(body,ensure_ascii=False).encode() if typ.startswith("application/json") else body.encode())
        self.send_response(status); self.send_header("Content-Type",typ); self.send_header("Content-Length",str(len(data))); self.send_header("Cache-Control","no-store"); self.end_headers(); self.wfile.write(data)
    def do_OPTIONS(self): self._send(405,{"error":"Método no permitido"})
    def do_GET(self):
        path=self.path.split("?",1)[0]
        if path=="/api/state":
            pid=self.headers.get("X-Player-Id","jugador-local")
            with LOCK:
                if not state.get("host"): state["host"]=pid
                state["players"][pid]=time.time()
                for key,last in list(state["players"].items()):
                    if last<time.time()-25: del state["players"][key]
                self._send(200,public_state(pid))
            return
        if path=="/api/info": self._send(200,{"ips":local_ips(),"port":PORT}); return
        rel="index.html" if path=="/" else path.lstrip("/")
        if rel not in ("index.html","style.css","game.js","world3d.js","favicon.svg","vendor/three.module.js","vendor/three.core.js"):
            self._send(404,{"error":"No encontrado"}); return
        file=(ROOT/rel).resolve()
        if ROOT not in file.parents and file!=ROOT: self._send(403,{"error":"Ruta inválida"}); return
        if not file.is_file(): self._send(404,{"error":"No encontrado"}); return
        typ="text/html; charset=utf-8" if file.suffix==".html" else "text/css; charset=utf-8" if file.suffix==".css" else "application/javascript; charset=utf-8" if file.suffix==".js" else "image/svg+xml" if file.suffix==".svg" else "application/octet-stream"
        self._send(200,file.read_bytes(),typ)
    def do_POST(self):
        global state
        try: data=json.loads(self.rfile.read(int(self.headers.get("Content-Length","0"))) or b"{}")
        except Exception: self._send(400,{"error":"JSON inválido"}); return
        path=self.path.split("?",1)[0]
        pid=self.headers.get("X-Player-Id","jugador-local")
        with LOCK:
            if path=="/api/action":
                action=data.get("action")
                if action in ("speed","pause","new") and pid!=state.get("host"):
                    self._send(403,{"error":"Esta acción está reservada al anfitrión de la sala."}); return
                if action=="speed": state["speed"]=max(1,min(4,int(data.get("value",1))))
                elif action=="pause": state["paused"]=not state["paused"]
                elif action=="place":
                    kind=data.get("kind"); x=int(data.get("x",-1)); y=int(data.get("y",-1)); contractor=data.get("contractor")
                    if kind not in PROJECTS or x<0 or y<0 or x>=28 or y>=20: self._send(400,{"error":"Proyecto o parcela inválidos"}); return
                    if is_water(x,y): self._send(409,{"error":"Esta parcela está bajo agua. Las obras portuarias todavía no están disponibles."}); return
                    contractor=contractor if contractor in CONTRACTORS else "Constructora Delta"
                    if not contractor_has_capacity(contractor): self._send(409,{"error":f"{contractor} no tiene cuadrillas disponibles. Elegí otra empresa o esperá la entrega de una obra."}); return
                    if contractor_free_workers(contractor)<LABOR_NEEDS[kind]: self._send(409,{"error":f"{contractor} necesita {LABOR_NEEDS[kind]} trabajadores para esta obra y solo tiene {contractor_free_workers(contractor)} libres."}); return
                    if any(b["x"]==x and b["y"]==y for b in state["buildings"]) or any(p["x"]==x and p["y"]==y for p in state["projects"]) or any(a["x"]==x and a["y"]==y for a in state.get("abandoned",[])): self._send(409,{"error":"La parcela ya está ocupada"}); return
                    if kind!="road" and [x,y] in state["roads"]: self._send(409,{"error":"No se puede construir sobre una calle existente."}); return
                    if kind=="road" and [x,y] in state["roads"]: self._send(409,{"error":"Ese tramo ya forma parte de la red vial."}); return
                    if kind!="road" and not any(abs(rx-x)+abs(ry-y)==1 for rx,ry in state["roads"]): self._send(409,{"error":"La parcela necesita acceso a una calle terminada"}); return
                    zone=next((z for z in state.get("zones",[]) if z["x"]==x and z["y"]==y),None)
                    if kind in ("home","shop") and (not zone or zone["kind"]!=kind):
                        required="residencial" if kind=="home" else "comercial"
                        self._send(409,{"error":f"Primero asigná uso {required} a esta parcela."}); return
                    if kind=="road":
                        if not any(abs(rx-x)+abs(ry-y)<=1 for rx,ry in state["roads"]): self._send(409,{"error":"La calle debe conectar con la red existente"}); return
                        contractor=contractor if contractor in CONTRACTORS else "Constructora Delta"
                    elif kind in ("home","shop"):
                        # Promotor privado financia la inversión; el municipio cubre permisos e inspección.
                        need=PROJECTS[kind]["cost"]*.12
                        if state["money"]<need: self._send(409,{"error":f"Fondos municipales insuficientes para permisos ($ {need:.0f})"}); return
                        state["money"]-=need
                        contractor=contractor if contractor in CONTRACTORS else "Constructora Delta"
                    else:
                        contractor=contractor if contractor in CONTRACTORS else "Constructora Delta"
                    spec=PROJECTS[kind]; c=CONTRACTORS[contractor]; total=round(spec["cost"]*c["price"]); duration=round(spec["days"]*c["days"]/30)
                    # Proyectos privados pagan al contratista desde capital privado; fondos ingresan por hitos a medida que llegan.
                    p={"id":uuid.uuid4().hex,"kind":kind,"label":spec["label"],"x":x,"y":y,"contractor":contractor,"cost":total,"duration":duration,"elapsed":0,"progress":0,"paid":0,"stages":spec["stageNames"],"stageIndex":0,"status":"contratada","cause":c["profile"],"monthlyCost":0,"workersAssigned":LABOR_NEEDS[kind],"materialsRequired":material_plan(kind),"materialsUsed":{key:0 for key in MATERIAL_NAMES}}
                    if kind in ("home","shop"):
                        p["privatePaid"]=True; p["municipalPermitPaid"]=round(spec["cost"]*.12); p["cost"]=total-p["municipalPermitPaid"]
                        if state["privateCapital"]<p["cost"]:
                            state["money"]+=round(spec["cost"]*.12); self._send(409,{"error":"Los promotores locales no tienen capital suficiente. Esperá nuevos ingresos."}); return
                        state["privateCapital"]-=p["cost"]
                        advance=round(p["cost"]*.2);p["paid"]=advance
                        state["supply"]["contractorCash"][contractor]+=advance
                    else:
                        reserved=sum(max(0,pending["cost"]-pending.get("paid",0)) for pending in state["projects"] if not pending.get("privatePaid"))
                        available=max(0,state["money"]-reserved)
                        if available<total: self._send(409,{"error":f"Fondos disponibles insuficientes. Contrato: $ {total:,}; disponible después de compromisos: $ {available:,}.".replace(",",".")}); return
                        advance=round(total*.2)
                        state["money"]-=advance; p["paid"]=advance
                        state["supply"]["contractorCash"][contractor]+=advance
                    state["projects"].append(p); ev(f"Contrato adjudicado: {spec['label']}",f"{contractor} · $ {total:,} · {LABOR_NEEDS[kind]} trabajadores · plazo estimado {duration} días. Se reservó el anticipo.".replace(",","."))
                elif action=="orderMaterials":
                    project=next((p for p in state["projects"] if p["id"]==str(data.get("projectId"))),None)
                    supplier=data.get("supplier");items=data.get("items")
                    if not project:self._send(404,{"error":"La obra ya no está activa."});return
                    if supplier not in SUPPLIERS:self._send(400,{"error":"Proveedor inválido."});return
                    if not isinstance(items,dict):self._send(400,{"error":"Detalle de materiales inválido."});return
                    clean={}
                    try:
                        for material,amount in items.items():
                            if material not in MATERIAL_NAMES: self._send(400,{"error":"Categoría de material inválida."});return
                            qty=int(amount)
                            if qty<0 or qty>300:self._send(400,{"error":"Cada pedido admite de 0 a 300 unidades por material."});return
                            if qty:clean[material]=qty
                    except (TypeError,ValueError):self._send(400,{"error":"Las cantidades deben ser números enteros."});return
                    if not clean:self._send(400,{"error":"Indicá al menos un material."});return
                    destination_id=str(data.get("destinationId","yard"));location=storage_location(destination_id)
                    priority=str(data.get("priority","normal"))
                    if priority not in ("normal","alta"):self._send(400,{"error":"Prioridad de descarga inválida."});return
                    if not location:self._send(400,{"error":"Depósito de destino inválido."});return
                    route=route_between((4,10),(location["x"],location["y"]))
                    if route is None:self._send(409,{"error":"El depósito elegido no tiene acceso de camiones por la red vial."});return
                    free=max(0,location["capacity"]-storage_used(destination_id)-storage_reserved(destination_id))
                    if sum(clean.values())>free:
                        self._send(409,{"error":f"{location['label'] if 'label' in location else 'El depósito'} tiene espacio para {free} unidades más. Elegí otro destino o reducí el pedido."});return
                    distance=max(0,len(route)-1);provider=SUPPLIERS[supplier];inventory=state["supply"]["suppliers"][supplier]
                    missing=[MATERIAL_NAMES[k] for k,q in clean.items() if inventory[k]<q]
                    if missing:self._send(409,{"error":"El proveedor no tiene stock de "+", ".join(missing)+"."});return
                    freight=max(0,distance-4)*5
                    cost=round(sum(q*MATERIAL_PRICE[k]*provider["price"] for k,q in clean.items())+freight)
                    cash=state["supply"]["contractorCash"][project["contractor"]]
                    if cash<cost:self._send(409,{"error":f"{project['contractor']} tiene $ {cash:,} de caja de obra; el pedido cuesta $ {cost:,}.".replace(",",".")});return
                    eta=provider["days"]+math.ceil(distance/6)
                    for material,qty in clean.items():inventory[material]-=qty
                    state["supply"]["contractorCash"][project["contractor"]]-=cost
                    order={"id":uuid.uuid4().hex,"projectId":project["id"],"label":project["label"],"contractor":project["contractor"],"supplier":supplier,"items":clean,"cost":cost,"destinationId":destination_id,"destinationLabel":location.get("label",f"Depósito municipal {location['x']+1},{location['y']+1}"),"priority":priority,"orderedDay":state["day"],"supplierReadyDay":state["day"]+provider["days"],"travelDistance":distance,"travelledDistance":0,"routeProgress":0,"arrivalDay":state["day"]+eta,"progress":0,"status":"en tránsito","statusCause":"Preparación en proveedor","route":route}
                    state["supply"]["orders"].append(order)
                    order["trafficFactor"]=round(traffic_factor(route,order),2)
                    order["arrivalDay"]=order_route_eta(order)[2]
                    detail=" · ".join(f"{MATERIAL_NAMES[k]} {v}" for k,v in clean.items())
                    eta=max(0,order["arrivalDay"]-state["day"])
                    ev("Pedido de materiales",f"{project['contractor']} compró {detail} a {supplier} por $ {cost:,}; entrega estimada en {eta} días por {distance} tramos (con congestión estimada). Prioridad de descarga: {priority}.".replace(",","."))
                elif action=="zone":
                    x=int(data.get("x",-1)); y=int(data.get("y",-1)); kind=data.get("kind")
                    if kind not in ("home","shop") or x<0 or y<0 or x>=28 or y>=20: self._send(400,{"error":"Uso de suelo o parcela inválidos"}); return
                    if is_water(x,y): self._send(409,{"error":"No se puede zonificar el agua costera."}); return
                    if any(b["x"]==x and b["y"]==y for b in state["buildings"]) or any(p["x"]==x and p["y"]==y for p in state["projects"]) or any(a["x"]==x and a["y"]==y for a in state.get("abandoned",[])) or any(z["x"]==x and z["y"]==y for z in state.get("zones",[])) or [x,y] in state["roads"]:
                        self._send(409,{"error":"Esta parcela ya tiene un uso asignado u ocupado"}); return
                    if not any(abs(rx-x)+abs(ry-y)==1 for rx,ry in state["roads"]): self._send(409,{"error":"Zonificar requiere acceso a una calle terminada"}); return
                    state.setdefault("zones",[]).append({"x":x,"y":y,"kind":kind,"owner":"municipal","status":"disponible"})
                    ev("Uso de suelo asignado",f"Parcela {x+1},{y+1}: zona {'residencial' if kind=='home' else 'comercial'}. La zonificación permite inversión; no construye por sí sola.")
                elif action in ("pauseProject","resumeProject","cancelProject"):
                    project=next((p for p in state["projects"] if p["id"]==str(data.get("id"))),None)
                    if not project: self._send(404,{"error":"La obra ya no está activa."}); return
                    if action=="pauseProject":
                        if project["status"]=="pausada": self._send(409,{"error":"La obra ya está pausada."}); return
                        project["status"]="pausada"; project["workersAssigned"]=0; project["cause"]="Pausa decidida por el equipo de gobierno"; ev("Obra pausada",f"{project['label']}: se conserva el avance ({round(project['progress']*100)}%) y se liberan cuadrillas.")
                    elif action=="resumeProject":
                        if project["status"] not in ("pausada","suspendida"): self._send(409,{"error":"La obra no está pausada ni suspendida."}); return
                        nextPayment=0 if project.get("privatePaid") else project["cost"]*.8/project["duration"]
                        if state["money"]<nextPayment: self._send(409,{"error":f"Falta caja para el próximo certificado de $ {nextPayment:.0f}."}); return
                        if project["status"]=="pausada":
                            if not contractor_has_capacity(project["contractor"]): self._send(409,{"error":"La constructora tiene todos sus cupos ocupados. Esperá otra entrega antes de reanudar."}); return
                            if contractor_free_workers(project["contractor"])<LABOR_NEEDS[project["kind"]]: self._send(409,{"error":"La constructora no tiene trabajadores libres para reanudar esta obra."}); return
                            project["workersAssigned"]=LABOR_NEEDS[project["kind"]]
                        project["status"]="contratada"; project["cause"]=CONTRACTORS[project["contractor"]]["profile"]; ev("Obra reanudada",f"{project['label']} continúa desde {round(project['progress']*100)}% con el saldo pendiente comprometido.")
                    else:
                        spent=round(project.get("priorSpent",0)+(project["cost"]+project.get("municipalPermitPaid",0) if project.get("privatePaid") else project.get("paid",0))); progress=project.get("progress",0)
                        if progress>0:
                            state.setdefault("abandoned",[]).append({"id":project["id"],"x":project["x"],"y":project["y"],"kind":project["kind"],"label":project["label"],"progress":progress,"spent":spent,"contractor":project["contractor"],"stage":project["stages"][project["stageIndex"]],"status":"obra inconclusa","privatePaid":project.get("privatePaid",False)})
                        state["projects"].remove(project)
                        ev("Contrato cancelado",f"{project['label']}: gasto hundido $ {spent:,}; se libera el saldo contractual no pagado. {('La estructura inconclusa permanece en la parcela.' if progress>0 else 'La obra no había iniciado trabajos físicos.') }".replace(",","."))
                elif action=="rescue":
                    abandoned=next((a for a in state.get("abandoned",[]) if a["id"]==str(data.get("id"))),None)
                    contractor=data.get("contractor");
                    if not abandoned: self._send(404,{"error":"La obra inconclusa ya no está disponible."}); return
                    if contractor not in CONTRACTORS: self._send(400,{"error":"Constructora inválida."}); return
                    if not contractor_has_capacity(contractor): self._send(409,{"error":f"{contractor} no tiene cuadrillas disponibles para rescatar la obra."}); return
                    kind=abandoned["kind"]; initial=abandoned["progress"]; spec=PROJECTS[kind]; c=CONTRACTORS[contractor]
                    if contractor_free_workers(contractor)<LABOR_NEEDS[kind]: self._send(409,{"error":f"{contractor} no tiene {LABOR_NEEDS[kind]} trabajadores libres para el rescate."}); return
                    total=round(spec["cost"]*(1-initial)*c["price"]); duration=max(1,round(spec["days"]*(1-initial)*c["days"]/30))
                    p={"id":uuid.uuid4().hex,"kind":kind,"label":abandoned["label"],"x":abandoned["x"],"y":abandoned["y"],"contractor":contractor,"cost":total,"duration":duration,"elapsed":0,"progress":initial,"initialProgress":initial,"paid":0,"priorSpent":abandoned.get("spent",0),"stages":spec["stageNames"],"stageIndex":min(len(spec["stageNames"])-1,int(initial*len(spec["stageNames"]))),"status":"contratada","cause":c["profile"],"monthlyCost":0,"workersAssigned":LABOR_NEEDS[kind],"materialsRequired":material_plan(kind,initial),"materialsUsed":{key:0 for key in MATERIAL_NAMES}}
                    private=kind in ("home","shop")
                    if private:
                        fee=max(50,round(spec["cost"]*(1-initial)*.12));privateCost=total-fee
                        if state["money"]<fee or state["privateCapital"]<privateCost: self._send(409,{"error":"No alcanza el capital promotor o municipal para financiar el rescate."}); return
                        state["money"]-=fee;state["privateCapital"]-=privateCost;p["cost"]=privateCost;p["municipalPermitPaid"]=fee;p["privatePaid"]=True
                        p["paid"]=round(privateCost*.2);state["supply"]["contractorCash"][contractor]+=p["paid"]
                    else:
                        reserved=sum(max(0,q["cost"]-q.get("paid",0)) for q in state["projects"] if not q.get("privatePaid"));available=max(0,state["money"]-reserved)
                        if available<total: self._send(409,{"error":"La tesorería disponible no cubre el contrato de rescate."}); return
                        p["paid"]=round(total*.2);state["money"]-=p["paid"];state["supply"]["contractorCash"][contractor]+=p["paid"]
                    state["abandoned"].remove(abandoned);state["projects"].append(p)
                    ev("Rescate de obra adjudicado",f"{abandoned['label']} continúa desde {round(initial*100)}% con {contractor}; contrato nuevo $ {total:,} y plazo estimado {duration} días.".replace(",","."))
                elif action=="new": state=initial_state(); state["host"]=pid; state["players"][pid]=time.time(); ev("Nueva partida","Puerto Claro comenzó una nueva gestión municipal.")
                else: self._send(400,{"error":"Acción desconocida"}); return
                self._send(200,public_state(pid)); return
            if path=="/api/save":
                if pid!=state.get("host"): self._send(403,{"error":"Solo el anfitrión puede guardar la ciudad."}); return
                SAVE.write_text(json.dumps({k:v for k,v in state.items() if k not in ("players","host")},ensure_ascii=False,indent=2),encoding="utf-8"); self._send(200,{"ok":True,"file":SAVE.name}); return
            if path=="/api/load":
                if pid!=state.get("host"): self._send(403,{"error":"Solo el anfitrión puede cargar la ciudad."}); return
                if not SAVE.exists(): self._send(404,{"error":"No hay ciudad guardada todavía"}); return
                loaded=json.loads(SAVE.read_text(encoding="utf-8")); loaded.setdefault("players",{}); loaded["host"]=pid; state=loaded; ev("Ciudad cargada","Se restauró el último estado guardado."); self._send(200,public_state(pid)); return
        self._send(404,{"error":"No encontrado"})

def simulation_loop():
    last=time.monotonic()
    while True:
        time.sleep(.25)
        now=time.monotonic()
        with LOCK:
            if state["paused"]: last=now; continue
            elapsed=now-last
            if elapsed>=1/max(1,state["speed"]):
                days=int(elapsed*max(1,state["speed"]))
                last=now
                for _ in range(min(days,60)): tick_one_day()

def main():
    global state
    if SAVE.exists():
        try:
            loaded=json.loads(SAVE.read_text(encoding="utf-8")); state={**initial_state(),**loaded,"players":{}}
        except Exception: pass
    srv=ThreadingHTTPServer(("0.0.0.0",PORT),Handler)
    threading.Thread(target=simulation_loop,daemon=True).start()
    url=f"http://127.0.0.1:{PORT}/"
    if "--no-browser" not in sys.argv: threading.Timer(.8,lambda:webbrowser.open(url)).start()
    print("Ciudad Viva está lista:",url)
    print("Direcciones LAN:")
    for ip in local_ips(): print(f"  http://{ip}:{PORT}/")
    print("Dejá esta ventana abierta mientras se juega. Ctrl+C para cerrar.")
    try: srv.serve_forever()
    except KeyboardInterrupt: pass
    finally: srv.server_close()

if __name__=="__main__": main()
