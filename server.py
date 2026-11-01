#!/usr/bin/env python3
"""Servidor LAN local de Ciudad Viva. Solo biblioteca estándar de Python."""
import json, math, os, socket, sys, threading, time, uuid, webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SAVE = ROOT / "ciudad_guardada.json"
LOCK = threading.RLock()
ROOM_OPEN = False
ROOM_CODE = uuid.uuid4().hex[:6].upper()
DISCOVERED_ROOMS = {}
DISCOVERY_PORT = 8766
PORT = int(os.environ.get("CIUDAD_VIVA_PORT", "8765"))
MATERIAL_NAMES = {"aggregate":"áridos","concrete":"hormigón","steel":"acero","timber":"madera","components":"componentes"}
INITIAL_CONTRACTOR_STOCK = {"aggregate":20,"concrete":0,"steel":6,"timber":6,"components":3}
INITIAL_REGIONAL_STOCK = {"aggregate":600,"concrete":160,"steel":240,"timber":200,"components":180}
REGIONAL_PRODUCTION = {"aggregate":70,"concrete":24,"steel":35,"timber":28,"components":24}
MATERIAL_PRICE = {"aggregate":38,"concrete":62,"steel":210,"timber":75,"components":240}
REGIONAL_MARKETS=(
    {"id":"valle","name":"Villa del Valle","monthlyUnits":105,"monthlyBudget":2500,"competitorStrength":2.6},
    {"id":"costa","name":"Costa Serena","monthlyUnits":90,"monthlyBudget":2150,"competitorStrength":2.4},
    {"id":"paso","name":"Paso del Norte","monthlyUnits":70,"monthlyBudget":1800,"competitorStrength":2.2})
SUPPLIERS = {
    "Corralón del Puerto":{"price":1.0,"days":2,"profile":"Stock local · tarifa media · entrega por calle"},
    "Distribuidora Regional":{"price":.82,"days":9,"profile":"Compra mayorista · menor precio · viaje largo"},
    "Flete Urgente":{"price":1.75,"days":1,"profile":"Prioridad de carga · tarifa alta · despacho inmediato"},
    "Cantera local":{"price":.76,"days":1,"profile":"Producción privada de Puerto Claro · árido trazable y entrega por camión"},
    "Hormigonera local":{"price":.91,"days":1,"profile":"Hormigón producido con áridos locales · entrega por camión"},
    "Aserradero local":{"price":.92,"days":1,"profile":"Madera producida en Puerto Claro · reserva forestal y entrega por camión"},
    "Metalúrgica local":{"price":1.15,"days":1,"profile":"Componentes fabricados con acero regional · entrega por camión"}}
SUPPLIER_STOCK = {
    "Corralón del Puerto":{"aggregate":260,"concrete":60,"steel":90,"timber":110,"components":45},
    "Distribuidora Regional":{"aggregate":1200,"concrete":240,"steel":520,"timber":420,"components":300},
    "Flete Urgente":{"aggregate":70,"concrete":20,"steel":35,"timber":35,"components":32},
    "Cantera local":{"aggregate":0,"concrete":0,"steel":0,"timber":0,"components":0},
    "Hormigonera local":{"aggregate":0,"concrete":0,"steel":0,"timber":0,"components":0},
    "Aserradero local":{"aggregate":0,"concrete":0,"steel":0,"timber":0,"components":0},
    "Metalúrgica local":{"aggregate":0,"concrete":0,"steel":0,"timber":0,"components":0}}
CONTRACTOR_CASH = {"Sur Obras":5000,"Constructora Delta":9000,"Estudio y Obra Norte":14000}
MATERIAL_NEEDS = {
    "road":{"aggregate":16,"concrete":6,"steel":0,"timber":0,"components":2},
    "home":{"aggregate":20,"concrete":7,"steel":9,"timber":15,"components":10},
    "factory":{"aggregate":36,"concrete":14,"steel":28,"timber":10,"components":35},
    "shop":{"aggregate":18,"concrete":6,"steel":14,"timber":8,"components":12},
    "civic":{"aggregate":39,"concrete":13,"steel":22,"timber":12,"components":24},
    "school":{"aggregate":43,"concrete":15,"steel":25,"timber":30,"components":28},
    "fireStation":{"aggregate":46,"concrete":16,"steel":34,"timber":24,"components":36},
    "depot":{"aggregate":28,"concrete":10,"steel":18,"timber":14,"components":12},
    "busGarage":{"aggregate":22,"concrete":8,"steel":16,"timber":8,"components":10},
    "busStop":{"aggregate":7,"concrete":3,"steel":0,"timber":5,"components":2},
    "port":{"aggregate":44,"concrete":14,"steel":34,"timber":18,"components":30},
    "airport":{"aggregate":68,"concrete":22,"steel":65,"timber":22,"components":55},
    "hotel":{"aggregate":41,"concrete":14,"steel":25,"timber":24,"components":32},
    "powerPlant":{"aggregate":54,"concrete":18,"steel":48,"timber":12,"components":35},
    "waterPlant":{"aggregate":51,"concrete":17,"steel":36,"timber":20,"components":32},
    "wastewaterPlant":{"aggregate":48,"concrete":16,"steel":38,"timber":18,"components":36},
    "landfill":{"aggregate":58,"concrete":20,"steel":24,"timber":8,"components":18},
    "recyclingPlant":{"aggregate":46,"concrete":16,"steel":34,"timber":16,"components":42}}
CONTRACTOR_NAMES = ("Sur Obras","Constructora Delta","Estudio y Obra Norte")
MARKET_SUPPLIERS = {
    "Cooperativa Regional":{"unitCost":3.7,"stock":120,"maxStock":260,"monthlyOutput":65,"leadDays":4,"profile":"Precio bajo · lotes limitados · entrega lenta"},
    "Mayorista del Puerto":{"unitCost":4.6,"stock":260,"maxStock":420,"monthlyOutput":100,"leadDays":2,"profile":"Stock amplio · precio medio · entrega estable"},
    "Abasto Expreso":{"unitCost":5.5,"stock":150,"maxStock":240,"monthlyOutput":115,"leadDays":1,"profile":"Reposición rápida · precio alto"}}

def new_market_supply():
    suppliers={name:{**values,"cash":18000,"lastSales":0} for name,values in MARKET_SUPPLIERS.items()}
    suppliers["Cooperativa Agrícola Regional"]={"unitCost":3.4,"stock":320,"maxStock":600,"monthlyOutput":180,"leadDays":2,"profile":"Grano regional · cuota finita y entrega por carretera","cash":18000,"lastSales":0,"source":[21,10],"commodity":"grano"}
    return suppliers

FACTORY_LABELS = {"food":"Procesadora de alimentos", "quarry":"Cantera de Puerto Claro",
                  "concrete":"Hormigonera de Puerto Claro", "sawmill":"Aserradero de Puerto Claro",
                  "metalworks":"Metalúrgica de Puerto Claro"}

def next_factory_industry():
    """Asignar especialidad al contratar, incluyendo la capacidad que ya está en obra."""
    occupied={b.get("business",{}).get("industryType","food") for b in state.get("buildings",[])
              if b.get("kind")=="factory" and b.get("business",{}).get("status")=="abierto"}
    occupied.update(p["industryType"] for p in state.get("projects",[])
                    if p.get("kind")=="factory" and p.get("industryType") and p.get("status") not in ("pausada","cancelada"))
    return next((kind for kind in ("food","quarry","concrete","sawmill","metalworks")
                 if kind not in occupied),"food")

def settle_concrete_sale(quantity):
    remaining=max(0,int(quantity));unit_revenue=MATERIAL_PRICE["concrete"]*SUPPLIERS["Hormigonera local"]["price"]
    plants=sorted((b for b in state.get("buildings",[]) if b.get("kind")=="factory" and b.get("business",{}).get("industryType")=="concrete"),key=lambda b:(b["x"],b["y"]))
    for plant in plants:
        firm=plant["business"];sold=min(remaining,max(0,int(firm.get("concreteStock",0))))
        if sold:
            firm["concreteStock"]-=sold;firm["cash"]=int(round(firm.get("cash",0)+sold*unit_revenue));firm["lastLocalSales"]=firm.get("lastLocalSales",0)+sold;remaining-=sold
        if not remaining:break
    state.setdefault("localIndustry",{})["concreteSold"]=state.get("localIndustry",{}).get("concreteSold",0)+max(0,int(quantity))-remaining

def settle_sawmill_sale(quantity):
    remaining=max(0,int(quantity));unit_revenue=MATERIAL_PRICE["timber"]*SUPPLIERS["Aserradero local"]["price"]
    mills=sorted((b for b in state.get("buildings",[]) if b.get("kind")=="factory" and b.get("business",{}).get("industryType")=="sawmill"),key=lambda b:(b["x"],b["y"]))
    for mill in mills:
        firm=mill["business"];sold=min(remaining,max(0,int(firm.get("timberStock",0))))
        if sold:
            firm["timberStock"]-=sold;firm["cash"]=int(round(firm.get("cash",0)+sold*unit_revenue));firm["lastLocalSales"]=firm.get("lastLocalSales",0)+sold;remaining-=sold
        if not remaining:break
    industry=state.setdefault("localIndustry",{});industry["timberSold"]=industry.get("timberSold",0)+max(0,int(quantity))-remaining

def settle_metalworks_sale(quantity):
    remaining=max(0,int(quantity));unit_revenue=MATERIAL_PRICE["components"]*SUPPLIERS["Metalúrgica local"]["price"]
    plants=sorted((b for b in state.get("buildings",[]) if b.get("kind")=="factory" and b.get("business",{}).get("industryType")=="metalworks"),key=lambda b:(b["x"],b["y"]))
    for plant in plants:
        firm=plant["business"];sold=min(remaining,max(0,int(firm.get("componentStock",0))))
        if sold:
            firm["componentStock"]-=sold;firm["cash"]=int(round(firm.get("cash",0)+sold*unit_revenue));firm["lastLocalSales"]=firm.get("lastLocalSales",0)+sold;remaining-=sold
        if not remaining:break
    industry=state.setdefault("localIndustry",{});industry["componentsSold"]=industry.get("componentsSold",0)+max(0,int(quantity))-remaining

def settle_local_material_sale(supplier,items):
    if supplier=="Cantera local":settle_quarry_sale(items.get("aggregate",0))
    elif supplier=="Hormigonera local":settle_concrete_sale(items.get("concrete",0))
    elif supplier=="Aserradero local":settle_sawmill_sale(items.get("timber",0))
    elif supplier=="Metalúrgica local":settle_metalworks_sale(items.get("components",0))

INDUSTRIAL_VENDOR_GOODS = {
    "Cantera local":("quarry","aggregate","aggregateStock","materialSold"),
    "Hormigonera local":("concrete","concrete","concreteStock","concreteSold"),
    "Aserradero local":("sawmill","timber","timberStock","timberSold"),
    "Metalúrgica local":("metalworks","components","componentStock","componentsSold"),
}

def industrial_vendor_offers(supplier, material, quantity, destination):
    """Cotizaciones por planta conectada: caja y existencias pertenecen a cada firma."""
    spec=INDUSTRIAL_VENDOR_GOODS.get(supplier)
    if not spec or material!=spec[1] or quantity<=0:return []
    kind,_,stock_key,_=spec
    offers=[]
    for site in state.get("buildings",[]):
        firm=site.get("business",{})
        if site.get("kind")!="factory" or firm.get("industryType")!=kind or firm.get("status")!="abierto":continue
        if int(firm.get(stock_key,0))<quantity:continue
        route=route_between((site["x"],site["y"]),(destination[0],destination[1]))
        if not route:continue
        distance=max(0,len(route)-1)
        factor=max(.8,min(1.35,float(firm.get("materialPriceFactor",1))))
        product_cost=round(quantity*MATERIAL_PRICE[material]*SUPPLIERS[supplier]["price"]*factor)
        freight=max(0,distance-4)*5
        offers.append({"site":site,"route":route,"distance":distance,"factor":factor,
                       "productCost":product_cost,"freight":freight,"total":product_cost+freight})
    return sorted(offers,key=lambda o:(o["total"],o["distance"],o["site"]["x"],o["site"]["y"]))

def settle_industrial_vendor_offer(supplier, material, quantity, offer):
    """Liquidar exactamente una venta, sin confundir la ruta con otra fábrica."""
    kind,expected,stock_key,metric=INDUSTRIAL_VENDOR_GOODS[supplier]
    if material!=expected or quantity<=0:raise ValueError("Mercadería industrial inválida")
    firm=offer["site"]["business"]
    if firm.get("status")!="abierto" or firm.get("industryType")!=kind or int(firm.get(stock_key,0))<quantity:
        raise ValueError("La fábrica elegida ya no tiene este lote")
    firm[stock_key]-=quantity
    firm["cash"]=round(firm.get("cash",0)+offer["productCost"])
    firm["lastLocalSales"]=firm.get("lastLocalSales",0)+quantity
    firm["lifetimeIndustrialSales"]=firm.get("lifetimeIndustrialSales",0)+quantity
    firm["industrialSalesSincePricing"]=firm.get("industrialSalesSincePricing",0)+quantity
    firm["lastWinningPriceFactor"]=offer["factor"]
    industrial=state.setdefault("localIndustry",{})
    industrial[metric]=industrial.get(metric,0)+quantity


def renew_private_commercial_leases():
    """Alquileres negocian un ajuste mensual según actividad efectiva; sin transferencias ficticias."""
    for site in state.get("buildings",[]):
        if site.get("kind")!="shop" or site.get("business",{}).get("status")!="abierto":continue
        firm=site["business"]
        base=50+max(0,12-abs(site["x"]-12)-abs(site["y"]-10))*3
        old=max(0,int(firm.get("monthlyRent",base)))
        sales=max(0,int(firm.get("lastSales",0)))
        demand=max(0,int(firm.get("lastDemand",0)))
        profit=int(firm.get("lastProfit",0))
        if sales>=max(8,demand*3//4) and profit>old*2:
            new=min(180,old+5);cause="Alta actividad comercial"
        elif sales<=2 and profit<0:
            new=max(30,old-5);cause="Baja ocupación económica"
        else:continue
        if new!=old:
            firm["monthlyRent"]=new
            firm["lastLeaseReviewDay"]=state["day"]
            firm["lastLeaseCause"]=cause
            ev("Alquiler comercial renegociado",f"{site.get('name','Comercio')}: renta mensual $ {old} → $ {new} por {cause.lower()}.")

def reprice_private_shops():
    """Competencia minorista mensual: precios según demanda, stock y margen real."""
    for site in state.get("buildings",[]):
        if site.get("kind")!="shop":continue
        firm=site.get("business",{})
        if firm.get("status")!="abierto":continue
        old=max(1,int(firm.get("price",18)))
        sales=max(0,int(firm.get("lastSales",0)))
        demand=max(0,int(firm.get("lastDemand",0)))
        stock=max(0,int(firm.get("inventory",0)))
        profit=int(firm.get("lastProfit",0))
        # No subir precios ante desabastecimiento: falta oferta, no poder de mercado.
        if sales>=max(5,demand*3//4) and profit>0 and 0<stock<max(6,sales//2):
            new=min(36,old+1);cause="Demanda sostenida y existencias bajas"
        elif (stock>=max(12,sales*2) and sales<max(4,demand//2)) or (profit<0 and stock>=8):
            new=max(8,old-1);cause="Exceso de inventario o margen negativo"
        else:continue
        if new!=old:
            firm["price"]=new
            firm["lastPriceChangeDay"]=state["day"]
            firm["lastPriceCause"]=cause
            ev("Competencia comercial",f"{site.get('name','Comercio')}: precio {old} → {new}; {cause.lower()}.")

def rebalance_private_staffing(workforce=None):
    """Empresas amplían o reducen vacantes por ventas, liquidez y demanda; despidos identificables."""
    reviewed=0
    for site in state.get("buildings",[]):
        if site.get("kind") not in ("shop","factory"):continue
        firm=site.get("business",{})
        if firm.get("status")!="abierto":continue
        slots=int(firm.get("jobSlots",site.get("jobSlots",12 if site["kind"]=="shop" else 20)))
        sales=(int(firm.get("lastSales",0)) if site["kind"]=="shop" else
               max(0,int(firm.get("lifetimeIndustrialSales",0))-int(firm.get("staffingSalesCheckpoint",0))))
        if site["kind"]=="factory" and firm.get("industryType","food")=="food":
            sales=max(sales,int(firm.get("lastLocalSales",0)))
        cash=int(firm.get("cash",0))
        profit=int(firm.get("lastProfit",0))
        demand=int(firm.get("lastDemand",0)) if site["kind"]=="shop" else sales
        max_slots=18 if site["kind"]=="shop" else 24
        min_slots=4 if site["kind"]=="shop" else 8
        product_stock=(int(firm.get("inventory",0)) if site["kind"]=="shop" else
                       int(firm.get({"quarry":"aggregateStock","concrete":"concreteStock",
                                     "sawmill":"timberStock","metalworks":"componentStock"}.get(
                                         firm.get("industryType"),"inventory"),0)))
        workplace=next((w for w in (workforce or {}).get("workplaces",[]) if w.get("x")==site.get("x") and w.get("y")==site.get("y")),None)
        staffed=int(workplace.get("staffedJobs",0)) if workplace else int(firm.get("lastWorkers",0))
        equip_cost=150 if site["kind"]=="shop" else 240
        strong=(demand>sales+3 and sales>=max(3,slots//3) and profit>0 and staffed>=max(1,slots-2)
                if site["kind"]=="shop" else
                sales>=max(6,slots//2) and product_stock<max(10,sales) and staffed>=max(1,slots-2))
        weak=((sales<=max(1,slots//6) and profit<0 and product_stock>=8)
              if site["kind"]=="shop" else (sales<=1 and product_stock>=20))
        firm["lowDemandMonths"]=firm.get("lowDemandMonths",0)+1 if weak else 0
        change=0
        if strong and slots<max_slots and cash>equip_cost+max(1200,3*(slots+1)*int(firm.get("wage",10))):
            change=1
            firm["cash"]=cash-equip_cost
            state["supply"]["businessEquipmentCash"]=state["supply"].get("businessEquipmentCash",0)+equip_cost
            firm["lastEquipmentInvestment"]=equip_cost
            ev("Expansión empresarial",f"{firm.get('name',site.get('name'))} invirtió $ {equip_cost} en equipamiento y abrió una vacante por ventas verificadas.")
        elif firm["lowDemandMonths"]>=2 and slots>min_slots:
            change=-min(2,slots-min_slots)
            firm["lastEquipmentInvestment"]=0
            ev("Reducción de plantilla",f"{firm.get('name',site.get('name'))} eliminó {-change} vacantes por ventas bajas e inventario inmóvil.")
        else:firm["lastEquipmentInvestment"]=0
        if change:
            firm["jobSlots"]=slots+change
            site["jobSlots"]=slots+change
            state["jobs"]=max(0,int(state.get("jobs",0))+change)
            firm["lastStaffingChange"]=change
            firm["lastStaffingDay"]=state["day"]
            if change<0:
                people=[person for building in state.get("buildings",[]) if building.get("kind")=="home"
                        for person in building.get("residents",[])
                        if person.get("employerId")==firm.get("id") and person.get("status")=="empleado"]
                people.sort(key=lambda p:(p.get("attendance",0),str(p.get("id",""))))
                for person in people[:max(0,len(people)-(slots+change))]:
                    person.update({"previousEmployer":firm.get("name",site.get("name")),
                        "previousEmployerId":firm.get("id"),"status":"buscando",
                        "employerId":None,"employerName":None,"monthlyWage":0,"attendance":0,
                        "unemployedSinceDay":state["day"],
                        "unemploymentReason":"reducción de plantilla por falta de demanda"})
                state.setdefault("unemploymentEvents",[]).append({
                    "day":state["day"],"employerId":firm.get("id"),"employerName":firm.get("name"),
                    "workers":min(len(people),-change),"cause":"reducción de actividad"})
                state["unemploymentEvents"]=state["unemploymentEvents"][-80:]
        else:firm["lastStaffingChange"]=0
        firm["staffingSalesCheckpoint"]=int(firm.get("lifetimeIndustrialSales",0))
        reviewed+=1
    return reviewed


def price_industrial_competition():
    """Reajuste al cierre mensual: precio cae con stock ocioso, sube con ventas."""
    for site in state.get("buildings",[]):
        firm=site.get("business",{})
        kind=firm.get("industryType")
        stock_key=next((v[2] for v in INDUSTRIAL_VENDOR_GOODS.values() if v[0]==kind),None)
        if not stock_key or firm.get("status")!="abierto":continue
        stock=max(0,int(firm.get(stock_key,0)))
        produced=max(0,int(firm.get("lastProduction",0)))
        sold=max(0,int(firm.get("industrialSalesSincePricing",firm.get("lastLocalSales",0))))
        factor=float(firm.get("materialPriceFactor",1))
        if sold>=max(4,produced//2) and stock<=max(8,produced):
            factor=min(1.35,round(factor+.04,2))
        elif sold==0 and stock>max(12,produced):
            factor=max(.8,round(factor-.05,2))
        firm["materialPriceFactor"]=factor
        firm["industrialSalesSincePricing"]=0


def advance_local_metalworks(workplaces,employees):
    industry=state.setdefault("localIndustry",{});industry.setdefault("componentsProduced",0);industry.setdefault("componentsSold",0)
    supplier=state["supply"]["suppliers"].setdefault("Metalúrgica local",SUPPLIER_STOCK["Metalúrgica local"].copy());supplier["components"]=max(0,int(supplier.get("components",0)))
    orders=state["supply"].setdefault("marketOrders",[]);employees=employees or []
    plants=[b for b in state.get("buildings",[]) if b.get("kind")=="factory" and b.get("business",{}).get("industryType")=="metalworks" and b.get("business",{}).get("status")=="abierto"]
    for plant in plants:
        firm=plant["business"];work=workplaces.get((plant["x"],plant["y"]),{});staff=max(0,int(work.get("staffedJobs",0)));access=plant.get("utilityAccess",{});services=min(access.get("powerServedPct",0),access.get("waterServedPct",0),access.get("wastewaterTreatedPct",0))/100
        payroll=max(0,int(work.get("payroll",0)));operating=max(0,int(plant.get("monthlyOperatingCost",420)));firm["cash"]=int(firm.get("cash",0)-payroll-operating)
        for employee in employees:
            if employee.get("site") is plant:
                wage=max(0,int(employee.get("earnedWage",employee.get("wage",0))));home=employee.get("home")
                if home:home["householdCash"]=round(home.get("householdCash",0)+wage);home["monthlyWageIncome"]=home.get("monthlyWageIncome",0)+wage
        if firm["cash"]<0:
            firm["status"]="cerrado";plant["status"]="cerrado";supplier["components"]=max(0,supplier["components"]-int(firm.get("componentStock",0)));firm["componentStock"]=0;firm["closedDay"]=state["day"];state["jobs"]=max(0,state.get("jobs",0)-int(firm.get("jobSlots",20)))
            ev("Metalúrgica insolvente",f"{plant.get('name','Metalúrgica')}: la caja no cubrió salarios y operación; se liberaron {firm.get('jobSlots',20)} puestos.");continue
        raw=max(0,int(firm.get("rawSteelInventory",0)));potential=max(0,min(24+max(0,int(firm.get("jobSlots",20))-20)*2,round(staff*1.2)));capacity=max(0,round(potential*services));output=min(capacity,raw,max(0,180-supplier["components"]))
        firm["rawSteelInventory"]=raw-output;firm["componentStock"]=max(0,int(firm.get("componentStock",0)))+output;supplier["components"]+=output;firm["lastProduction"]=output;firm["lastProductionPotential"]=potential;firm["lastMaterialShortage"]=max(0,potential-output);firm["lastLocalSales"]=0;industry["componentsProduced"]+=output
        firm["lastMaterialCause"]=("Esperando acero regional" if raw<1 else "Faltan electricidad, agua o saneamiento" if services<1 else "Sin trabajadores suficientes" if staff<20 else "Almacén de componentes completo") if output<potential else ""
        pending=sum(o.get("quantity",0) for o in orders if o.get("businessId")==firm.get("id") and o.get("status")=="en tránsito" and o.get("commodity")=="acero")
        need=max(0,min(48,capacity*2)-raw-pending);source_name="Corralón del Puerto";source=state["supply"]["suppliers"].setdefault(source_name,SUPPLIER_STOCK[source_name].copy());route=route_between((4,10),(plant["x"],plant["y"])) if need else None
        # Escasez real: el lote disponible determina la cotización, sin crear inventario.
        stock_before=max(0,int(source.get("steel",0)))
        steel_factor=1.5 if stock_before<20 else 1.25 if stock_before<60 else 1.0
        source["lastSteelPriceFactor"]=steel_factor
        landed=MATERIAL_PRICE["steel"]*SUPPLIERS[source_name]["price"]*steel_factor+max(0,len(route or [])-1)*.08;quantity=min(need,max(0,int(source.get("steel",0))),max(0,int(max(0,firm.get("cash",0)-500)//max(.01,landed)))) if route else 0
        if quantity:
            cost=round(quantity*landed);source["steel"]-=quantity;state["supply"].setdefault("supplierCash",{}).setdefault(source_name,0);state["supply"]["supplierCash"][source_name]+=cost;firm["cash"]-=cost;distance=max(0,len(route)-1);ready=state["day"]+SUPPLIERS[source_name]["days"]
            orders.append({"id":uuid.uuid4().hex,"type":"industrial_raw","commodity":"acero","businessId":firm["id"],"businessName":firm.get("name",plant.get("name","Metalúrgica")),"supplier":source_name,"quantity":quantity,"unitCost":landed,"cost":cost,"orderedDay":state["day"],"supplierReadyDay":ready,"travelDistance":distance,"travelledDistance":0,"source":[4,10],"x":plant["x"],"y":plant["y"],"route":route,"status":"en tránsito","statusCause":"Acero regional en viaje a la metalúrgica"});firm["lastMaterialCause"]="Acero regional en tránsito"
        elif need and not route:firm["lastMaterialCause"]="Sin ruta vial al proveedor de acero"
        elif need and not source.get("steel",0):firm["lastMaterialCause"]="Corralón sin acero en stock"


def sign_aggregate_forward_contract(plant,need):
    """Reserva inventario físico y pago en custodia; la cantera cobra tras entregar."""
    supply=state["supply"];buyer=plant["business"];aggregate=supply["suppliers"]["Cantera local"]
    candidates=[]
    for site in state.get("buildings",[]):
        firm=site.get("business",{})
        if site.get("kind")!="factory" or firm.get("industryType")!="quarry" or firm.get("status")!="abierto":continue
        route=route_between((site["x"],site["y"]),(plant["x"],plant["y"]))
        if route is None:continue
        distance=max(0,len(route)-1);factor=max(.8,min(1.35,float(firm.get("materialPriceFactor",1))))
        unit=MATERIAL_PRICE["aggregate"]*SUPPLIERS["Cantera local"]["price"]*factor
        freight=max(0,distance-4)*5
        qty=min(int(need),int(aggregate.get("aggregate",0)),int(firm.get("aggregateStock",0)),
                max(0,int((buyer.get("cash",0)-500)//max(1,unit+freight))))
        if qty>0:candidates.append((unit+freight/max(1,qty),distance,site["x"],site["y"],site,route,qty,unit,freight,factor))
    if not candidates:return None
    _,distance,_,_,site,route,qty,unit,freight,factor=min(candidates,key=lambda r:r[:4])
    n=3 if qty>=9 else 1
    lines=[qty//n+(i<qty%n) for i in range(n)]
    prices=[(round(q*unit),freight) for q in lines]
    total=sum(a+b for a,b in prices)
    if buyer.get("cash",0)<total+500:return None
    buyer["cash"]-=total;aggregate["aggregate"]-=qty;site["business"]["aggregateStock"]-=qty
    ident=uuid.uuid4().hex
    contract={"id":ident,"commodity":"áridos","buyerId":buyer["id"],"buyerName":plant.get("name"),
              "vendorId":site["business"]["id"],"vendorName":site.get("name"),"quantity":qty,
              "deliveredUnits":0,"refundedUnits":0,"escrow":total,"contractValue":total,
              "paidToSeller":0,"paidToLogistics":0,"refunded":0,"orderedDay":state["day"],
              "installments":n,"extensionFee":max(20,(total+10)//20),"source":[site["x"],site["y"]],"destination":[plant["x"],plant["y"]],"status":"en curso"}
    supply.setdefault("tradeContracts",[]).append(contract)
    for index,(amount,(product,delivery)) in enumerate(zip(lines,prices)):
        ready=state["day"]+1+index*7
        supply["marketOrders"].append({"id":uuid.uuid4().hex,"type":"industrial_raw","commodity":"áridos",
            "businessId":buyer["id"],"businessName":plant.get("name"),"supplier":"Cantera local",
            "vendorId":site["business"]["id"],"vendorName":site.get("name"),"supplyContractId":ident,
            "installment":index+1,"installments":n,"quantity":amount,"unitCost":unit,
            "cost":product+delivery,"productCost":product,"freight":delivery,
            "orderedDay":state["day"],"supplierReadyDay":ready,"deadlineDay":ready+14,
            "travelDistance":distance,"travelledDistance":0,"source":[site["x"],site["y"]],
            "x":plant["x"],"y":plant["y"],"route":route,"status":"en tránsito",
            "statusCause":"Reserva contractual con pago en custodia"})
    buyer["lastMaterialPurchase"]=qty
    buyer["lastMaterialCause"]="Áridos comprometidos a plazo: pago contra entregas"
    ev("Contrato industrial a plazo",f"{plant.get('name','Hormigonera')}: {qty} áridos en {n} remesas; $ {total} en custodia privada.")
    return contract

def renegotiate_aggregate_forward_contract(contract_id):
    """Una prórroga remunerada ante corte vial, sin modificar inventario ni custodia."""
    supply=state["supply"]
    contract=next((c for c in supply.get("tradeContracts",[]) if c.get("id")==str(contract_id)),None)
    if not contract or contract.get("status")!="en curso" or contract.get("renegotiatedDay") is not None:
        raise ValueError("El contrato no está vigente o ya fue renegociado.")
    pending=[o for o in supply.get("marketOrders",[]) if o.get("supplyContractId")==contract["id"] and o.get("status")=="en tránsito" and not o.get("contractSettled")]
    if not pending or any(state["day"]>int(o.get("deadlineDay",0)) for o in pending):
        raise ValueError("No quedan remesas vigentes para reprogramar.")
    buyer=next((b.get("business") for b in state["buildings"] if b.get("business",{}).get("id")==contract.get("buyerId")),None)
    seller=next((b.get("business") for b in state["buildings"] if b.get("business",{}).get("id")==contract.get("vendorId")),None)
    if not buyer or buyer.get("status")!="abierto" or not seller or seller.get("status")!="abierto":
        raise ValueError("Ambas empresas deben seguir operativas.")
    if not any(route_between(tuple(o["source"]),(o["x"],o["y"])) is None for o in pending):
        raise ValueError("La prórroga excepcional requiere un corte vial comprobable.")
    fee=max(20,(int(contract.get("contractValue",0))+10)//20)
    if buyer.get("cash",0)<fee:
        raise ValueError(f"La compradora necesita $ {fee} de caja para compensar la reserva adicional.")
    buyer["cash"]-=fee
    seller["cash"]=seller.get("cash",0)+fee
    for order in pending:
        order["deadlineDay"]=int(order["deadlineDay"])+14
        order["statusCause"]="Plazo extendido 14 días por corte vial"
    contract.update({"renegotiatedDay":state["day"],"extensionDays":14,"extensionFee":fee,"extensionFeePaid":fee})
    ev("Plazo industrial renegociado",f"{contract.get('buyerName','Compradora')} paga $ {fee} a {contract.get('vendorName','Proveedor')} por mantener {len(pending)} remesas reservadas 14 días más.")
    return contract


def settle_aggregate_contract_line(order,received):
    if not order.get("supplyContractId") or order.get("contractSettled"):return
    supply=state["supply"]
    contract=next((c for c in supply.get("tradeContracts",[]) if c["id"]==order["supplyContractId"]),None)
    if not contract:return
    units=int(order["quantity"]);product=int(order["productCost"]);freight=int(order["freight"]);amount=product+freight
    order["contractSettled"]=True;contract["escrow"]=max(0,contract["escrow"]-amount)
    seller=next((b.get("business") for b in state["buildings"] if b.get("business",{}).get("id")==order["vendorId"]),None)
    if received:
        if seller:
            seller["cash"]=seller.get("cash",0)+product
            seller["lastLocalSales"]=seller.get("lastLocalSales",0)+units
            seller["lifetimeIndustrialSales"]=seller.get("lifetimeIndustrialSales",0)+units
            seller["industrialSalesSincePricing"]=seller.get("industrialSalesSincePricing",0)+units
        else:supply["unclaimedIndustrialReceipts"]=supply.get("unclaimedIndustrialReceipts",0)+product
        supply["logisticsCash"]=supply.get("logisticsCash",0)+freight
        contract["deliveredUnits"]+=units;contract["paidToSeller"]+=product;contract["paidToLogistics"]+=freight
        industry=state.setdefault("localIndustry",{});industry["materialSold"]=industry.get("materialSold",0)+units
    else:
        if seller and seller.get("status")=="abierto":
            seller["aggregateStock"]=seller.get("aggregateStock",0)+units
            supply["suppliers"]["Cantera local"]["aggregate"]+=units
        else:contract["lostReservedUnits"]=contract.get("lostReservedUnits",0)+units
        buyer=next((b.get("business") for b in state["buildings"] if b.get("business",{}).get("id")==order["businessId"]),None)
        if buyer:buyer["cash"]=buyer.get("cash",0)+amount
        else:supply["unclaimedContractRefunds"]=supply.get("unclaimedContractRefunds",0)+amount
        contract["refunded"]+=amount;contract["refundedUnits"]+=units
        # La demora imputable al proveedor paga indemnización desde su caja, nunca desde el escrow.
        if buyer and buyer.get("status")=="abierto" and seller and seller.get("status")=="abierto" and order.get("statusCause")=="Plazo contractual vencido":
            penalty=min(max(0,int(seller.get("cash",0))),max(1,(product+19)//20))
            seller["cash"]-=penalty;buyer["cash"]=buyer.get("cash",0)+penalty
            order["defaultPenaltyPaid"]=penalty
            contract["defaultPenaltyPaid"]=contract.get("defaultPenaltyPaid",0)+penalty
        ev("Contrato incumplido",f"Remesa de {units} áridos cancelada; devolución $ {amount} al comprador.")
    related=[o for o in supply["marketOrders"] if o.get("supplyContractId")==contract["id"]]
    if related and all(o.get("contractSettled") for o in related):
        contract["status"]="cumplido" if not contract["refundedUnits"] else "incumplido"
        contract["closedDay"]=state["day"]

def expire_aggregate_contract_lines():
    for order in state["supply"].get("marketOrders",[]):
        if order.get("status")!="en tránsito" or not order.get("supplyContractId"):continue
        buyer=next((b.get("business") for b in state["buildings"] if b.get("business",{}).get("id")==order["businessId"]),None)
        seller=next((b.get("business") for b in state["buildings"] if b.get("business",{}).get("id")==order.get("vendorId")),None)
        buyer_closed=not buyer or buyer.get("status")!="abierto"
        seller_closed=not seller or seller.get("status")!="abierto"
        if buyer_closed or seller_closed or state["day"]>order["deadlineDay"]:
            order["status"]="cancelado"
            order["statusCause"]="Comprador cerrado" if buyer_closed else "Proveedor insolvente" if seller_closed else "Plazo contractual vencido"
            settle_aggregate_contract_line(order,False)

def advance_local_concrete_plants(workplaces,employees):
    supply=state["supply"]["suppliers"].setdefault("Hormigonera local",SUPPLIER_STOCK["Hormigonera local"].copy())
    supply["concrete"]=max(0,int(supply.get("concrete",0)))
    plants=[b for b in state.get("buildings",[]) if b.get("kind")=="factory" and b.get("business",{}).get("industryType")=="concrete" and b.get("business",{}).get("status")=="abierto"]
    orders=state["supply"].setdefault("marketOrders",[])
    for plant in plants:
        firm=plant["business"];work=workplaces.get((plant["x"],plant["y"]),{});staff=max(0,int(work.get("staffedJobs",0)))
        access=plant.get("utilityAccess",{});services=min(access.get("powerServedPct",0),access.get("waterServedPct",0),access.get("wastewaterTreatedPct",0))/100
        payroll=max(0,int(work.get("payroll",0)));operating=max(0,int(plant.get("monthlyOperatingCost",450)))
        firm["cash"]=int(firm.get("cash",0)-payroll-operating)
        for employee in employees:
            if employee.get("site") is plant:
                wage=max(0,int(employee.get("earnedWage",employee.get("wage",0))));home=employee.get("home")
                if home:home["householdCash"]=round(home.get("householdCash",0)+wage);home["monthlyWageIncome"]=home.get("monthlyWageIncome",0)+wage
        if firm["cash"]<0:
            firm["status"]="cerrado";plant["status"]="cerrado";supply["concrete"]=max(0,supply["concrete"]-int(firm.get("concreteStock",0)));firm["concreteStock"]=0;firm["closedDay"]=state["day"];state["jobs"]=max(0,state.get("jobs",0)-int(firm.get("jobSlots",20)))
            ev("Hormigonera insolvente",f"{plant.get('name','Hormigonera')}: la caja no cubrió salarios y operación; se liberaron {firm.get('jobSlots',20)} puestos.")
            continue
        capacity=max(0,min(36,round(staff*1.25*services)));raw=max(0,int(firm.get("rawMaterialInventory",0)))
        produced=min(capacity,raw//2,max(0,240-supply["concrete"]))
        firm["rawMaterialInventory"]=raw-produced*2;firm["concreteStock"]=max(0,int(firm.get("concreteStock",0)))+produced
        supply["concrete"]+=produced;firm["lastProduction"]=produced;firm["lastProductionPotential"]=max(0,min(36,round(staff*1.25)))
        firm["lastMaterialShortage"]=max(0,firm["lastProductionPotential"]-produced)
        firm["lastMaterialCause"]=("Faltan áridos entregados por carretera" if produced<capacity and raw<2 else "Faltan servicios urbanos" if services<1 else "Capacidad del patio completa" if produced<capacity else "")
        firm["lastLocalSales"]=0;firm["lastRevenue"]=0;firm["lastProfit"]=0
        pending=sum(o.get("quantity",0) for o in orders if o.get("businessId")==firm.get("id") and o.get("status")=="en tránsito" and o.get("commodity")=="áridos")
        target=min(72,max(24,capacity*2));need=max(0,target-raw-pending)
        if need and not sign_aggregate_forward_contract(plant,need):
            firm["lastMaterialCause"]="No hay cantera con lote, calle y capital suficientes"

def advance_local_sawmills(workplaces,employees):
    industry=state.setdefault("localIndustry",{});industry.setdefault("timberProduced",0);industry.setdefault("timberSold",0)
    reserve=max(0,int(industry.setdefault("timberReserve",1800)));regrowth=max(0,int(industry.setdefault("timberRegrowthMonthly",18)));industry["timberReserve"]=min(2400,reserve+regrowth)
    supplier=state["supply"]["suppliers"].setdefault("Aserradero local",SUPPLIER_STOCK["Aserradero local"].copy());supplier["timber"]=max(0,int(supplier.get("timber",0)))
    mills=[b for b in state.get("buildings",[]) if b.get("kind")=="factory" and b.get("business",{}).get("industryType")=="sawmill" and b.get("business",{}).get("status")=="abierto"]
    employees=employees or []
    for mill in mills:
        firm=mill["business"];work=workplaces.get((mill["x"],mill["y"]),{});staff=max(0,int(work.get("staffedJobs",0)));access=mill.get("utilityAccess",{})
        services=min(access.get("powerServedPct",0),access.get("waterServedPct",0),access.get("wastewaterTreatedPct",0))/100
        payroll=max(0,int(work.get("payroll",0)));operating=max(0,int(mill.get("monthlyOperatingCost",360)));firm["cash"]=int(firm.get("cash",0)-payroll-operating)
        for employee in employees:
            if employee.get("site") is mill:
                wage=max(0,int(employee.get("earnedWage",employee.get("wage",0))));home=employee.get("home")
                if home:home["householdCash"]=round(home.get("householdCash",0)+wage);home["monthlyWageIncome"]=home.get("monthlyWageIncome",0)+wage
        if firm["cash"]<0:
            firm["status"]="cerrado";mill["status"]="cerrado";supplier["timber"]=max(0,supplier["timber"]-int(firm.get("timberStock",0)));firm["timberStock"]=0;firm["closedDay"]=state["day"];state["jobs"]=max(0,state.get("jobs",0)-int(firm.get("jobSlots",20)))
            ev("Aserradero insolvente",f"{mill.get('name','Aserradero')}: la caja no cubrió salarios y operación; se liberaron {firm.get('jobSlots',20)} puestos.");continue
        potential=max(0,min(30,round(staff*1.25)));capacity=max(0,round(potential*services));logs=max(0,int(industry["timberReserve"]))
        output=min(capacity,logs//2,max(0,240-supplier["timber"]));industry["timberReserve"]-=output*2;supplier["timber"]+=output;firm["timberStock"]=max(0,int(firm.get("timberStock",0)))+output;firm["lastProduction"]=output;firm["lastProductionPotential"]=potential;firm["lastMaterialShortage"]=max(0,potential-output);firm["lastLocalSales"]=0
        industry["timberProduced"]+=output
        firm["lastMaterialCause"]=("Reserva forestal agotada" if industry["timberReserve"]<2 else "Faltan electricidad, agua o tratamiento cloacal" if services<1 else "Sin trabajadores suficientes" if staffed<20 else "Capacidad de almacenamiento completa") if output<potential else ""

def advance_local_quarries(workplaces, employees):
    industry=state.setdefault("localIndustry",{"unitsProduced":0,"unitsSold":0,"unitsImported":0,"history":[]});state["localIndustry"].setdefault("timberReserve",1800);state["localIndustry"].setdefault("timberRegrowthMonthly",18);state["localIndustry"].setdefault("timberProduced",0);state["localIndustry"].setdefault("timberSold",0)
    industry.setdefault("materialProduced",0);industry.setdefault("materialSold",0);industry.setdefault("quarryReserveRemaining",0)
    stock=state["supply"].setdefault("suppliers",{}).setdefault("Cantera local",SUPPLIER_STOCK["Cantera local"].copy())
    quarries=[b for b in state.get("buildings",[]) if b.get("kind")=="factory" and b.get("business",{}).get("industryType")=="quarry" and b.get("business",{}).get("status")=="abierto"]
    stock["aggregate"]=max(0,int(stock.get("aggregate",0)))
    for quarry in quarries:
        firm=quarry["business"];work=workplaces.get((quarry["x"],quarry["y"]),{});staffed=max(0,int(work.get("staffedJobs",0)))
        access=quarry.get("utilityAccess",{});service=min(access.get("powerServedPct",0),access.get("waterServedPct",0),access.get("wastewaterTreatedPct",0))/100
        reserve=max(0,int(firm.setdefault("quarryReserve",2400)))
        potential=max(0,min(48,round(staffed*1.5)));capacity=max(0,round(potential*service))
        output=min(capacity,reserve,max(0,360-stock["aggregate"]))
        firm["quarryReserve"]=reserve-output;firm["lastProduction"]=output;firm["lastProductionPotential"]=potential;firm["lastMaterialShortage"]=max(0,potential-output)
        firm["lastMaterialCause"]=("Reserva geológica agotada" if firm["quarryReserve"]<=0 else "Faltan electricidad, agua o tratamiento cloacal" if service<1 else "Sin trabajadores suficientes" if staffed<20 else "Producción limitada por capacidad del patio") if output<potential else ""
        stock["aggregate"]+=output;firm["aggregateStock"]=max(0,int(firm.get("aggregateStock",0)))+output;industry["materialProduced"]+=output
        firm["cash"]=int(firm.get("cash",0)-max(0,int(work.get("payroll",0)))-max(0,int(quarry.get("monthlyOperatingCost",320))))
        for employee in employees:
            if employee.get("site") is quarry:
                wage=max(0,int(employee.get("earnedWage",employee.get("wage",0))));home=employee["home"]
                home["householdCash"]=round(home.get("householdCash",0)+wage);home["monthlyWageIncome"]=home.get("monthlyWageIncome",0)+wage
        if firm["cash"]<0:
            firm["status"]="cerrado";quarry["status"]="cerrado";stock["aggregate"]=max(0,stock["aggregate"]-int(firm.get("aggregateStock",0)));firm["aggregateStock"]=0;firm["closedDay"]=state["day"];state["jobs"]=max(0,state.get("jobs",0)-int(firm.get("jobSlots",20)))
            ev("Cantera local insolvente",f"{quarry.get('name','Cantera')}: el ingreso por áridos no cubrió nómina y operación. La producción local se detuvo y se liberaron {firm.get('jobSlots',20)} puestos.")
    industry["quarryReserveRemaining"]=sum(max(0,int(b.get("business",{}).get("quarryReserve",0))) for b in quarries if b.get("business",{}).get("status")=="abierto")

def settle_quarry_sale(quantity):
    remaining=max(0,int(quantity));unit_revenue=MATERIAL_PRICE["aggregate"]*SUPPLIERS["Cantera local"]["price"]
    quarries=sorted((b for b in state.get("buildings",[]) if b.get("kind")=="factory" and b.get("business",{}).get("industryType")=="quarry"),key=lambda b:(b["x"],b["y"]))
    for quarry in quarries:
        firm=quarry["business"];sold=min(remaining,max(0,int(firm.get("aggregateStock",0))))
        if sold:
            firm["aggregateStock"]-=sold;firm["cash"]=int(round(firm.get("cash",0)+sold*unit_revenue));firm["lastLocalSales"]=firm.get("lastLocalSales",0)+sold;remaining-=sold
        if not remaining:break
    state.setdefault("localIndustry",{})["materialSold"]=state.get("localIndustry",{}).get("materialSold",0)+max(0,int(quantity))-remaining

def new_business(building, job_slots, starting_cash=5000):
    slots=max(1,int(job_slots))
    return {"id":f"firm-{building['x']}-{building['y']}","name":building.get("name","Comercio local"),
            "status":"abierto","cash":starting_cash,"jobSlots":slots,"inventory":0,
            "price":18,"inputCost":5,"inputInventory":24,"wage":10,"productivity":.06,"fixedCost":40,
            "creditDebt":0,"creditLimit":slots*200,"creditRate":.02,"creditDelinquencyMonths":0,"lastCreditDraw":0,"lastInterest":0,"lastRepayment":0,
            "lastSales":0,"lastLocalSales":0,"lastRegionalSales":0,"lastLocalDemand":0,"lastRevenue":0,"lastInputs":0,"lastInputUnits":0,"lastInputSupplier":"Sin compras","lastInputShortage":0,"lastProduction":0,"lastPayroll":0,"lastProfit":0,"lastWorkers":0,"lastDemand":0}

JOB_PROFILES = {
    "shop": ("comercio", "Comercio", 35),
    "factory": ("logistica", "Producción industrial", 42),
    "civic": ("salud", "Atención sanitaria", 48),
    "school": ("educacion", "Docencia", 48),
    "fireStation": ("bomberos", "Bomberos", 48),
    "depot": ("logistica", "Logística", 42),
    "port": ("logistica", "Logística", 42),
    "airport": ("logistica", "Logística", 42),
    "hotel": ("comercio", "Hotelería", 35),
    "powerPlant": ("logistica", "Operación eléctrica", 42),
    "waterPlant": ("logistica", "Operación de agua", 42),
    "wastewaterPlant": ("logistica", "Operación sanitaria", 42),
    "landfill": ("logistica", "Gestión de residuos", 42),
    "recyclingPlant": ("logistica", "Recuperación de materiales", 42),
}
TRAINING_CATEGORIES = {"comercio":("Comercio",35),"administracion":("Administración",48),"logistica":("Logística",42),"salud":("Salud",48),"educacion":("Educación",48),"bomberos":("Bomberos",48)}
TRAINING_SEATS=6
TRAINING_MONTHS=2
TRAINING_BASE_MONTHLY_COST=180
TRAINING_COST_PER_STUDENT=40
TRAINING_SKILL_GAIN=18
BUS_PURCHASE_COST=700
BUS_MONTHLY_OPERATING_COST=140
BUS_FARE=0.25
BUS_TRANSFER_DISCOUNT=0.4
BUS_SEATS=30
MUNICIPAL_ROLES={
    "urbanismo":{"label":"Urbanismo","summary":"Parcelas, obras, permisos y materiales"},
    "hacienda":{"label":"Hacienda","summary":"Impuestos, créditos, presupuestos e inversiones"},
    "servicios":{"label":"Servicios","summary":"Salud, educación, redes, residuos y emergencias"},
    "movilidad":{"label":"Movilidad","summary":"Colectivos y operación del transporte"}}
BUS_WINDOW_DEPARTURES=(
    ("early","05:00–07:00",1.5),("morningPeak","07:00–09:00",1.0),("dayMorning","09:00–11:00",1.75),("dayNoon","11:00–13:00",1.75),
    ("midday","13:00–15:00",1.5),("afternoon","15:00–17:00",1.5),
    ("eveningPeak","17:00–19:00",1.0),("evening","19:00–21:00",1.75),("late","21:00–23:00",2.0))
BUS_WORK_SHIFTS=(("early","afternoon"),("morningPeak","eveningPeak"),("midday","late"))

def stable_skill(person_id, category):
    """Valor reproducible compartido con Offline, independiente del orden de carga."""
    value=2166136261
    for char in f"{person_id}:{category}":
        value=((value ^ ord(char))*16777619)&0xffffffff
    return value

def ensure_person_work_profile(person):
    person.setdefault("skills",{})
    for category in ("comercio","administracion","logistica","salud","educacion","bomberos"):
        person["skills"].setdefault(category,25+stable_skill(person.get("id",""),category)%76)
    person.setdefault("expectedMonthlyWage",7+stable_skill(person.get("id",""),"salario")%3)
    person.setdefault("carAccess",stable_skill(person.get("id",""),"auto")%100<65)

def workplace_profile(site):
    category,label,minimum=JOB_PROFILES.get(site.get("kind"),("comercio","Comercio",35))
    if site.get("kind")=="civic" and (service_model(site) or {}).get("police"):
        category,label,minimum="administracion","Seguridad municipal",48
    firm=site.get("business",{}) if site.get("kind") in ("shop","hotel","factory") else {}
    wage=max(1,int(firm.get("wage",10) if site.get("kind") in ("shop","hotel","factory") else 14 if site.get("kind") in ("powerPlant","waterPlant","wastewaterPlant","landfill","recyclingPlant") else 12 if site.get("kind") in ("airport","civic","school","fireStation") else 8))
    return category,label,minimum,wage

def training_candidates(category,center,excluded=None):
    if category not in TRAINING_CATEGORIES:return []
    excluded=excluded or set();_,minimum=TRAINING_CATEGORIES[category];candidates=[]
    for home in (b for b in state["buildings"] if b.get("kind")=="home" and b.get("occupants",0)>0):
        path=route_between((home["x"],home["y"]),(center["x"],center["y"]))
        if not path:continue
        for person in home.get("residents",[]):
            if not person.get("workerEligible") or person.get("status") not in ("buscando","empleado") or person.get("id") in excluded:continue
            ensure_person_work_profile(person);skill=person["skills"].get(category,0)
            if skill>=minimum:continue
            candidates.append({"person":person,"home":home,"skill":skill,"searchDays":max(0,state.get("day",1)-int(person.get("unemployedSinceDay") or state.get("day",1))),"distance":len(path)-1})
    candidates.sort(key=lambda row:(0 if row["person"].get("status")=="buscando" else 1,-row["searchDays"],row["skill"],row["distance"],row["person"].get("id","")))
    return candidates

def training_catalog():
    centers=[b for b in state["buildings"] if b.get("kind")=="civic" and b.get("status","operativo") in ("operativo","habilitado")]
    programs=state.setdefault("trainingPrograms",[]);occupied={p.get("centerId") for p in programs if p.get("status") in ("active","paused")}
    active_trainees={person_id for p in programs if p.get("status") in ("active","paused") for person_id in p.get("traineeIds",[])}
    reserved=sum(max(0,p.get("cost",0)-p.get("paid",0)) for p in state.get("projects",[]) if not p.get("privatePaid"));available=max(0,state.get("money",0)-reserved)
    result=[]
    for category,(label,minimum) in TRAINING_CATEGORIES.items():
        center=next((b for b in centers if b.get("id",f"civic-{b['x']}-{b['y']}") not in occupied),centers[0] if centers else None)
        center_id=center.get("id",f"civic-{center['x']}-{center['y']}") if center else None
        candidates=training_candidates(category,center,active_trainees) if center else []
        seats=min(TRAINING_SEATS,len(candidates));monthly=TRAINING_BASE_MONTHLY_COST+TRAINING_COST_PER_STUDENT*seats;total=monthly*TRAINING_MONTHS
        reason="" if center and center_id not in occupied and seats and available>=total else "Sin aula municipal" if not center else "Aula ocupada" if center_id in occupied else "Sin residentes accesibles que necesiten esta formación" if not seats else "Fondos municipales comprometidos"
        result.append({"category":category,"label":label,"minimumSkill":minimum,"centerId":center_id,"centerName":center.get("name","Aula municipal") if center else "Sin aula","availableCandidates":len(candidates),"seats":seats,"durationMonths":TRAINING_MONTHS,"monthlyCost":monthly,"totalCost":total,"skillGainPerMonth":TRAINING_SKILL_GAIN,"canStart":not reason,"reason":reason})
    return result

def process_training_programs():
    """Devenga una cuota prefinanciada y capacita una cohorte en cada cambio de mes."""
    for program in state.setdefault("trainingPrograms",[]):
        if program.get("status")!="active":continue
        center=next((b for b in state["buildings"] if b.get("kind")=="civic" and b.get("id",f"civic-{b['x']}-{b['y']}")==program.get("centerId") and b.get("status","operativo") in ("operativo","habilitado")),None)
        if not center:
            program.update({"status":"paused","pauseReason":"El aula municipal no está operativa"});ev("Curso pausado",f"{program['label']}: el aula municipal dejó de estar operativa; el saldo reservado se conserva.");continue
        homes={person.get("id"):home for home in state["buildings"] if home.get("kind")=="home" for person in home.get("residents",[])};accessible=[]
        for person_id in program.get("traineeIds",[]):
            home=homes.get(person_id)
            if home and route_between((home["x"],home["y"]),(center["x"],center["y"])):
                person=next((p for p in home.get("residents",[]) if p.get("id")==person_id),None)
                if person:accessible.append(person)
        if not accessible:
            program.update({"status":"paused","pauseReason":"La cohorte perdió acceso vial al aula"});ev("Curso pausado",f"{program['label']}: la cohorte no puede llegar al aula; el saldo reservado se conserva.");continue
        installment=min(program.get("monthlyCost",0),program.get("remainingBudget",0))
        for person in accessible:
            ensure_person_work_profile(person);person["skills"][program["category"]]=min(100,person["skills"].get(program["category"],0)+program.get("skillGainPerMonth",TRAINING_SKILL_GAIN))
        program["remainingBudget"]=max(0,program.get("remainingBudget",0)-installment);program["spent"]=program.get("spent",0)+installment;program["monthsCompleted"]=program.get("monthsCompleted",0)+1;program["lastTrainingDay"]=state["day"]
        program["traineeProgress"]={person.get("id"):person["skills"][program["category"]] for person in accessible}
        if program["monthsCompleted"]>=program.get("durationMonths",TRAINING_MONTHS):
            program["status"]="completed";program["completedDay"]=state["day"];ev("Curso municipal completado",f"{program['label']}: {len(accessible)} residentes terminaron tras {program['durationMonths']} ciclos; aumentaron su habilidad {program['category']}.")
        else:ev("Ciclo de formación",f"{program['label']}: ciclo {program['monthsCompleted']}/{program['durationMonths']}, {len(accessible)} participantes mejoraron {TRAINING_SKILL_GAIN} puntos. Saldo $ {program['remainingBudget']:,}.".replace(",","."))

def new_finance():
    return {"businessBank":{"name":"Banco Cooperativo","liquidity":42000,"maxLiquidity":42000,"annualRate":.24},"municipalLoans":[],"debtReserve":0,"debtReserveHistory":[],"contractEscrow":{"balance":0},"programBudgets":{"servicesPct":100,"mobilityPct":100,"networksPct":100,"arrears":{"services":0,"mobility":0,"networks":0},"underfundedMonths":{"services":0,"mobility":0,"networks":0},"lastReport":{},"history":[]}}

def new_tax_state():
    return {"propertyRateBp":60,"businessRateBp":200,"arrearsByAsset":{},"lastReport":{},"lastProcessedMonth":0,"history":[]}

HERITAGE_FOUNDING_YEARS={"Municipalidad":1942,"Mercado Central":1948,"Barrio Estación":1951,"Casas del Oeste":1957,"Pasaje del Molino":1959,"Café Estación":1963,"Almacén del Oeste":1965,"Galería Central":1968}
HERITAGE_MATERIALS={"aggregate":6,"steel":3,"timber":4,"components":3}

def ensure_heritage_state():
    current_year=2026+(max(0,int(state.get("day",1))-1)//360)
    state.setdefault("heritageWorks",[]);state.setdefault("heritageHistory",[])
    for building in state.get("buildings",[]):
        name=building.get("name","")
        default_year=HERITAGE_FOUNDING_YEARS.get(name,current_year)
        building.setdefault("yearBuilt",default_year)
        building.setdefault("architecturalEra","Fundación urbana" if building["yearBuilt"]<1950 else "Expansión cívica" if building["yearBuilt"]<1970 else "Modernización")
        building.setdefault("architecturalStyle",architectural_style_for(building["yearBuilt"]))
        building.setdefault("originalUse",{"home":"Vivienda","shop":"Comercio","civic":"Servicio público"}.get(building.get("kind"),building.get("kind","Inmueble")))
        building.setdefault("renovations",[]);building.setdefault("conservation",92 if building["yearBuilt"]<1970 else 100)
        if name in HERITAGE_FOUNDING_YEARS:
            building.setdefault("heritageEligible",True);building.setdefault("heritageSignificance",3 if name in ("Municipalidad","Mercado Central","Barrio Estación") else 2)
            building.setdefault("heritageLevel","inventariado")
        else:
            building.setdefault("heritageEligible",False);building.setdefault("heritageSignificance",0);building.setdefault("heritageLevel","sin catalogar")
        building["conservation"]=max(0,min(100,int(building["conservation"])))
    state.setdefault("adaptiveReuseWorks",[]);state.setdefault("adaptiveReuseHistory",[])
    state["version"]=max(53,int(state.get("version",1)))

def architectural_style_for(year):
    if year<1950:return "Tradicional"
    if year<1970:return "Expansión cívica"
    if year<1990:return "Moderno"
    if year<2010:return "Contemporáneo"
    return "Actual"

def ensure_urban_evolution_state():
    year=2026+(max(0,int(state.get("day",1))-1)//360)
    evolution=state.setdefault("urbanEvolution",{"lastProcessedYear":year,"history":[],"lastBirthYear":2026})
    evolution.setdefault("lastProcessedYear",year);evolution.setdefault("history",[]);evolution.setdefault("lastBirthYear",2026)
    state.setdefault("urbanRenewalNeeds",[]);state.setdefault("urbanRenewalWorks",[]);state.setdefault("urbanRenewalHistory",[])
    for building in state.get("buildings",[]):
        if building.get("kind") in ("home","shop","hotel","factory"):
            building.setdefault("urbanCondition",float(building.get("quality",80 if building.get("kind")=="home" else 100)))
            building["urbanCondition"]=max(0,min(100,float(building["urbanCondition"])))
    for home in (b for b in state.get("buildings",[]) if b.get("kind")=="home"):
        for index,person in enumerate(home.setdefault("residents",[])):
            if person.get("age") is None:
                fallback_id=f"{home.get('x',0)}-{home.get('y',0)}-{index}"
                seed=str(person.get('id') or fallback_id)
                cohort=stable_skill(seed,"edad")%100
                person["age"]=(18+stable_skill(seed,"edad-laboral")%43) if person.get("workerEligible") else (5+cohort%13 if cohort<76 else 67+cohort%20)
            person["age"]=max(0,int(person["age"]))
            person.setdefault("lifeStage","infancia" if person["age"]<18 else "jubilación" if person["age"]>=67 else "vida laboral")

def urban_evolution_report():
    year=2026+(max(0,int(state.get("day",1))-1)//360);districts=[]
    for district_id,name,xmin,xmax in (("oeste","Oeste",0,10),("centro","Centro",10,18),("puerto","Puerto",18,100)):
        homes=[b for b in state.get("buildings",[]) if b.get("kind")=="home" and xmin<=b.get("x",0)<xmax]
        people=[p for h in homes for p in h.get("residents",[])]
        buildings=[b for b in state.get("buildings",[]) if xmin<=b.get("x",0)<xmax]
        ages=[p.get("age",0) for p in people]
        districts.append({"id":district_id,"name":name,"population":sum(int(h.get("occupants",0)) for h in homes),"children":sum(a<18 for a in ages),"workingAge":sum(18<=a<67 for a in ages),"retired":sum(a>=67 for a in ages),"averageAge":round(sum(ages)/max(1,len(ages)),1),"buildings":len(buildings),"olderBuildings":sum(year-int(b.get("yearBuilt",year))>=30 for b in buildings),"renewalNeeds":sum(n.get("districtId")==district_id and n.get("status")=="disponible" for n in state.get("urbanRenewalNeeds",[]))})
    buildings=state.get("buildings",[]);conditions=[b.get("urbanCondition",100) for b in buildings if b.get("kind") in ("home","shop","hotel")]
    return {"year":year,"decade":year//10*10,"districts":districts,"population":sum(d["population"] for d in districts),"children":sum(d["children"] for d in districts),"workingAge":sum(d["workingAge"] for d in districts),"retired":sum(d["retired"] for d in districts),"averageAge":round(sum(p.get("age",0) for b in buildings if b.get("kind")=="home" for p in b.get("residents",[]))/max(1,sum(len(b.get("residents",[])) for b in buildings if b.get("kind")=="home")),1),"agingBuildings":sum(year-int(b.get("yearBuilt",year))>=30 for b in buildings),"averageCondition":round(sum(conditions)/max(1,len(conditions)),1),"renewalNeeds":[dict(n) for n in state.get("urbanRenewalNeeds",[]) if n.get("status")=="disponible"],"works":[dict(w) for w in state.get("urbanRenewalWorks",[])],"renewalHistory":[dict(w) for w in state.get("urbanRenewalHistory",[])[-8:]],"history":state.get("urbanEvolution",{}).get("history",[])[-5:]}

def advance_urban_evolution():
    year=2026+(max(0,int(state.get("day",1))-1)//360);evolution=state.setdefault("urbanEvolution",{"lastProcessedYear":year-1,"history":[],"lastBirthYear":2026})
    previous=int(evolution.get("lastProcessedYear",year-1))
    if year<=previous:return
    years=min(50,year-previous);adults=retired=births=0
    for home in (b for b in state.get("buildings",[]) if b.get("kind")=="home"):
        for person in home.setdefault("residents",[]):
            old=int(person.get("age",0));new=min(120,old+years);person["age"]=new
            if old<18<=new:
                person.update({"workerEligible":True,"status":"buscando","employerId":None,"employerName":None,"monthlyWage":0,"attendance":0,"unemployedSinceDay":state.get("day",1),"unemploymentReason":"alcanzó edad laboral"});person["lifeStage"]="vida laboral";adults+=1
                ev("Residente se incorpora al mercado laboral",f"Un residente de {home.get('name','un hogar')} alcanzó los 18 años y busca un puesto compatible con sus habilidades.")
            elif old<67<=new:
                if person.get("status")=="empleado":person.update({"previousEmployer":person.get("employerName"),"previousEmployerId":person.get("employerId"),"employerId":None,"employerName":None,"monthlyWage":0,"attendance":0})
                person.update({"workerEligible":False,"status":"jubilado","unemployedSinceDay":None,"unemploymentReason":None,"lifeStage":"jubilación"});retired+=1
                ev("Residente inicia su jubilación",f"Una persona de {home.get('name','un hogar')} dejó la vida laboral; la vacante queda disponible para el mercado de empleo.")
            else:person["lifeStage"]="infancia" if new<18 else "jubilación" if new>=67 else "vida laboral"
    for building in (b for b in (state.get("buildings",[])) if b.get("kind") in ("home","shop","hotel")):
        age=max(0,year-int(building.get("yearBuilt",year)))
        if age<=20:continue
        renewal=next((w for w in state.get("urbanRenewalWorks",[]) if w.get("x")==building.get("x") and w.get("y")==building.get("y")),None)
        if renewal:continue
        wear=.3 if age<=40 else .55 if age<=60 else .8
        building["urbanCondition"]=round(max(25,float(building.get("urbanCondition",80))-wear),1)
        if building.get("kind")=="home":building["quality"]=round(min(float(building.get("quality",80)),building["urbanCondition"]),1)
        if building["urbanCondition"]<70 and not any(n.get("x")==building.get("x") and n.get("y")==building.get("y") and n.get("status")=="disponible" for n in state.setdefault("urbanRenewalNeeds",[])):
            district="oeste" if building.get("x",0)<10 else "centro" if building.get("x",0)<18 else "puerto";name=building.get("name",building.get("kind","Inmueble"));estimate=2400+round((70-building["urbanCondition"])*95)+(500 if building.get("kind")=="shop" else 0)
            need={"id":f"renewal-{building['x']}-{building['y']}-{year}","x":building["x"],"y":building["y"],"districtId":district,"name":name,"kind":building["kind"],"yearBuilt":building.get("yearBuilt",year),"age":age,"condition":building["urbanCondition"],"estimate":estimate,"status":"disponible","openedYear":year}
            state["urbanRenewalNeeds"].append(need);ev("Inmueble envejecido necesita renovación",f"{name} tiene {age} años y condición {building['urbanCondition']}%. El propietario puede financiar una rehabilitación con materiales, cuadrilla y permiso; si no se invierte, el desgaste continuará.")
    if year>2026 and (year-2026)%4==0 and int(evolution.get("lastBirthYear",2026))<year:
        for home in (b for b in state.get("buildings",[]) if b.get("kind")=="home" and b.get("occupants",0)<b.get("capacity",0) and b.get("householdCash",0)>=180 and b.get("birthsSince2026",0)<3):
            fertile=any(24<=int(p.get("age",0))<=40 for p in home.get("residents",[]))
            if not fertile:continue
            home["householdCash"]-=180;home["occupants"]+=1;home["birthsSince2026"]=home.get("birthsSince2026",0)+1;births+=1
            person={"id":f"birth-{year}-{home['x']}-{home['y']}","age":0,"lifeStage":"infancia","workerEligible":False,"status":"inactivo","employerId":None,"employerName":None,"monthlyWage":0,"attendance":0,"birthYear":year}
            ensure_person_work_profile(person);home.setdefault("residents",[]).append(person)
        if births:
            state["population"]=state.get("population",0)+births
            ev("Nacimientos en hogares de la ciudad",f"Nacieron {births} residentes en hogares con adultos de 24–40 años, vacantes y fondos familiares para cuidados iniciales ($180 por hogar). La demanda de salud y educación crecerá con ellos.")
        evolution["lastBirthYear"]=year
    evolution["lastProcessedYear"]=year
    if year%10==0:
        report=urban_evolution_report();record={k:report[k] for k in ("year","population","children","workingAge","retired","averageAge","agingBuildings","averageCondition")};evolution.setdefault("history",[]).append(record);evolution["history"]=evolution["history"][-20:]
        ev("Balance de década urbana",f"Año {year}: población {record['population']} · edad media {record['averageAge']} · {record['children']} menores, {record['workingAge']} en edad laboral y {record['retired']} jubilados · {record['agingBuildings']} inmuebles con 30 años o más. Las obras y mudanzas siguen activas al cambiar de década.")

def advance_urban_renewals():
    for work in list(state.setdefault("urbanRenewalWorks",[])):
        work["elapsedDays"]=work.get("elapsedDays",0)+1;work["progress"]=min(1,work["elapsedDays"]/max(1,work["durationDays"]));work["stage"]="Refuerzo estructural" if work["progress"]<.35 else "Instalaciones y renovación de fachada" if work["progress"]<.85 else "Inspección y habilitación"
        if work["progress"]<1:continue
        building=next((b for b in state.get("buildings",[]) if b.get("x")==work["x"] and b.get("y")==work["y"]),None)
        if building:
            building["urbanCondition"]=85;building["quality"]=max(building.get("quality",0),85) if building.get("kind")=="home" else building.get("quality",85);building["lastUrbanRenewalYear"]=2026+(state.get("day",1)-1)//360;building["architecturalStyle"]="Contemporáneo rehabilitado";building.setdefault("renovations",[]).append({"year":2026+(state.get("day",1)-1)//360,"day":state.get("day",1),"contractor":work["contractor"],"cost":work["cost"],"scope":"Rehabilitación privada de ciclo largo"})
            if building.get("kind")=="home":building["capacity"]=building.get("capacity",0)+2
        need=next((n for n in state.get("urbanRenewalNeeds",[]) if n.get("id")==work.get("needId")),None)
        if need:need.update({"status":"rehabilitada","completedDay":state.get("day",1)})
        state.setdefault("urbanRenewalHistory",[]).append({**work,"status":"completada","completedDay":state.get("day",1)});state["urbanRenewalHistory"]=state["urbanRenewalHistory"][-40:];state["urbanRenewalWorks"].remove(work)
        ev("Renovación urbana completada",f"{work['name']} fue rehabilitado por {work['contractor']} en {work['durationDays']} días. Recuperó condición 85%, cambió a arquitectura contemporánea y amplió dos plazas habitacionales cuando correspondía.")

def start_urban_renewal(need_id,contractor):
    ensure_supply_state()
    need=next((n for n in state.get("urbanRenewalNeeds",[]) if n.get("id")==need_id and n.get("status")=="disponible"),None)
    if not need:raise ValueError("La necesidad de rehabilitación ya no está disponible.")
    if contractor not in CONTRACTORS:raise ValueError("Seleccioná una constructora habilitada.")
    if any(w.get("x")==need["x"] and w.get("y")==need["y"] for w in state.get("urbanRenewalWorks",[])):raise ValueError("El inmueble ya tiene una obra en marcha.")
    spec=CONTRACTORS[contractor];active=[p for p in state.get("projects",[]) if p.get("contractor")==contractor and p.get("status") not in ("pausada","cancelada")]
    other=[w for key in ("heritageWorks","adaptiveReuseWorks","urbanRenewalWorks") for w in state.get(key,[]) if w.get("contractor")==contractor]
    used=sum(p.get("workersAssigned",LABOR_NEEDS.get(p.get("kind"),4)) for p in active)+sum(w.get("workers",4) for w in other)
    if len(active)+len(other)>=spec["capacity"] or used+4>spec["workers"]:raise ValueError(f"{contractor} no tiene una cuadrilla libre de cuatro trabajadores.")
    materials={"aggregate":4,"steel":2,"timber":2,"components":1};stock=state["supply"]["contractors"][contractor]
    if any(stock.get(k,0)<v for k,v in materials.items()):raise ValueError(f"{contractor} no tiene el lote de rehabilitación (4 áridos, 2 acero, 2 madera y 1 componente).")
    material_cost=sum(v*MATERIAL_PRICE[k] for k,v in materials.items());labor_cost=round((1700+max(0,70-need["condition"])*70)*spec["price"]);cost=material_cost+labor_cost
    if state.get("privateCapital",0)<cost:raise ValueError(f"El capital privado disponible no cubre la rehabilitación de $ {cost:,}.".replace(",","."))
    for k,v in materials.items():stock[k]-=v
    state["privateCapital"]-=cost;state["money"]+=100;state["supply"]["contractorCash"][contractor]=state["supply"]["contractorCash"].get(contractor,0)+labor_cost
    duration=max(24,round(30*spec["days"]/30));work={"id":f"urban-{need['x']}-{need['y']}-{state['day']}","needId":need["id"],"x":need["x"],"y":need["y"],"name":need["name"],"contractor":contractor,"materials":materials,"materialCost":material_cost,"laborCost":labor_cost,"cost":cost,"permitFee":100,"workers":4,"durationDays":duration,"elapsedDays":0,"progress":0,"stage":"Diagnóstico y refuerzo estructural","startDay":state["day"],"status":"en obra"}
    state["urbanRenewalWorks"].append(work);need.update({"status":"en obra","contractor":contractor,"workId":work["id"]})
    ev("Rehabilitación urbana contratada",f"{need['name']}: inversión privada $ {cost:,}, permiso municipal $100, cuatro trabajadores, materiales de {contractor} y {duration} días de obra.".replace(",","."))
    return work

def ensure_government_state():
    day=max(1,int(state.get("day",1)))
    government=state.setdefault("government",{})
    government.setdefault("mandate",1)
    government.setdefault("startDay",day)
    government.setdefault("nextElectionDay",day+1440)
    government.setdefault("status","en_mandato")
    government.setdefault("elections",[])
    government.setdefault("crisisMonths",0)
    government.setdefault("crisisStatus","estable")
    government.setdefault("complaints",[])
    government.setdefault("complaintSequence",0)
    government.setdefault("agreements",[])
    government.setdefault("responsibilities",{})
    if "plan" not in government:government["plan"]=new_mandate_plan()

def municipal_team_report(player_id=None):
    government=state.setdefault("government",{})
    responsibilities=government.setdefault("responsibilities",{})
    cutoff=time.time()-25
    active=[(member,last) for member,last in state.get("players",{}).items() if last>cutoff]
    active.sort(key=lambda item:(item[0]!=state.get("host"),item[0]))
    labels={member:("Alcaldía · anfitrión" if member==state.get("host") else f"Jugador {member[-6:]}") for member,_ in active}
    members=[{"id":member,"label":labels[member],"isHost":member==state.get("host"),"role":next((role for role,owner in responsibilities.items() if owner==member),"compartido")} for member,_ in active]
    roles=[{"id":role,"label":meta["label"],"summary":meta["summary"],"playerId":responsibilities.get(role),"playerLabel":labels.get(responsibilities.get(role),"Titular desconectado · área compartida")} for role,meta in MUNICIPAL_ROLES.items()]
    return {"isHost":player_id is not None and player_id==state.get("host"),"myRole":next((role for role,owner in responsibilities.items() if owner==player_id),"compartido"),"members":members,"roles":roles,"online":len(active)}

def government_districts():
    districts=[{"id":"oeste","name":"Oeste","homes":[]},{"id":"centro","name":"Centro","homes":[]},{"id":"puerto","name":"Puerto","homes":[]}]
    for home in state.get("buildings",[]):
        if home.get("kind")!="home":continue
        idx=0 if home.get("x",0)<10 else 1 if home.get("x",0)<18 else 2
        districts[idx]["homes"].append(home)
    rows=[]
    for d in districts:
        residents=[r for h in d["homes"] for r in h.get("residents",[])]
        population=sum(int(h.get("occupants",len(h.get("residents",[])))) for h in d["homes"])
        eligible=[r for r in residents if r.get("workerEligible")]
        employed=sum(1 for r in eligible if r.get("status")=="empleado")
        crowding=sum(int(h.get("occupants",0)) for h in d["homes"])/max(1,sum(int(h.get("capacity",h.get("occupants",0))) for h in d["homes"]))
        quality=sum(float(h.get("quality",80)) for h in d["homes"])/max(1,len(d["homes"]))
        services=max(0,min(100,float(state.get("services",0))))
        employment=100*employed/max(1,len(eligible)) if eligible else float(state.get("employment",0))
        housing=max(0,min(100,100- max(0,crowding-.82)*95 +(quality-80)*.25))
        base_score=max(0,min(100,50+(float(state.get("approval",50))-50)*.28 +(employment-65)*.24 +(services-65)*.25 +(housing-70)*.23))
        active_complaints=[c for c in state.get("government",{}).get("complaints",[]) if c.get("districtId")==d["id"] and c.get("status")=="abierto"]
        overdue_agreements=[a for a in state.get("government",{}).get("agreements",[]) if a.get("districtId")==d["id"] and a.get("mandate")==state.get("government",{}).get("mandate") and a.get("status")=="vencido"]
        complaint_pressure=min(12,sum(2+min(3,max(0,int(c.get("monthsOpen",1))-1)*.5) for c in active_complaints)+len(overdue_agreements)*2)
        score=max(0,base_score-complaint_pressure)
        issues=[]
        if employment<55:issues.append("empleo")
        if housing<65:issues.append("vivienda")
        if services<55:issues.append("servicios")
        if base_score<45:issues.append("confianza")
        rows.append({"id":d["id"],"name":d["name"],"population":population,"eligibleWorkers":len(eligible),"employed":employed,"employment":round(employment),"housing":round(housing),"services":round(services),"baseSupport":round(base_score),"support":round(score),"openComplaints":len(active_complaints),"homes":len(d["homes"]),"issues":issues,"issue":"Empleo" if employment<55 else "Vivienda" if housing<65 else "Servicios" if services<55 else "Gestión estable"})
    return rows

def government_plan_metrics():
    districts=government_districts();population=sum(d["population"] for d in districts)
    workers=sum(d["eligibleWorkers"] for d in districts);employed=sum(d["employed"] for d in districts)
    homes=[b for b in state.get("buildings",[]) if b.get("kind")=="home"]
    occupied=sum(int(h.get("occupants",0)) for h in homes);capacity=sum(int(h.get("capacity",h.get("occupants",0))) for h in homes)
    return {"employment":round(100*employed/max(1,workers)) if workers else int(state.get("employment",0)),"housingReserve":round(100*max(0,capacity-occupied)/max(1,capacity)),"services":int(round(state.get("services",0))),"population":population}

def new_mandate_plan():
    metrics=government_plan_metrics() if "state" in globals() else {"employment":78,"housingReserve":10,"services":76}
    return {"createdDay":int(state.get("day",1)) if "state" in globals() else 1,"goals":[{"id":"employment","title":"Empleo formal","unit":"% de trabajadores elegibles","target":max(60,min(85,metrics["employment"]+5))},{"id":"housingReserve","title":"Reserva de vivienda","unit":"% de plazas libres","target":min(20,max(5,metrics["housingReserve"]+3))},{"id":"services","title":"Cobertura de servicios","unit":"% de cobertura municipal","target":max(60,min(85,metrics["services"]+5))}]}

def government_plan_report():
    g=state.get("government",{});plan=g.get("plan") or new_mandate_plan();metrics=government_plan_metrics();rows=[]
    for goal in plan.get("goals",[]):
        current=metrics.get(goal["id"],0);target=goal["target"]
        rows.append({**goal,"current":current,"fulfilled":current>=target,"progress":round(min(100,100*current/max(1,target)))})
    return {"createdDay":plan.get("createdDay",state.get("day",1)),"goals":rows,"fulfilled":sum(x["fulfilled"] for x in rows),"total":len(rows),"metrics":metrics}

def government_issue_sources(district_id,issue):
    def in_area(x):return ("oeste" if x<10 else "centro" if x<18 else "puerto")==district_id
    homes=[h for h in state.get("buildings",[]) if h.get("kind")=="home" and in_area(h.get("x",0))]
    links=[]
    if issue=="empleo":
        for home in homes:
            searching=sum(1 for r in home.get("residents",[]) if r.get("workerEligible") and r.get("status")!="empleado")
            if searching:links.append({"id":f"home-{home['x']}-{home['y']}-jobseekers","kind":"personas","label":home.get("name","Hogares del barrio"),"detail":f"{searching} residentes buscan empleo","status":"búsqueda activa"})
        for b in state.get("buildings",[]):
            if b.get("kind")=="shop" and in_area(b.get("x",0)) and b.get("business",{}).get("status")=="cerrado":links.append({"id":f"firm-{b['x']}-{b['y']}","kind":"empresa","label":b.get("name","Comercio cerrado"),"detail":"Puestos de trabajo fuera de servicio","status":"cerrado"})
    elif issue=="vivienda":
        for home in homes:
            capacity=max(1,int(home.get("capacity",home.get("occupants",0))));occupied=int(home.get("occupants",0));quality=float(home.get("quality",80))
            if occupied/capacity>=.93 or quality<65:links.append({"id":f"home-{home['x']}-{home['y']}","kind":"vivienda","label":home.get("name","Vivienda del barrio"),"detail":f"{occupied}/{capacity} plazas · calidad {round(quality)}%","status":"presión habitacional" if occupied/capacity>=.93 else "calidad baja"})
    elif issue=="servicios":
        for f in state.get("utilities",{}).get("failures",[]):
            if f.get("status")!="reparada" and in_area(f.get("x",0)):links.append({"id":str(f.get("id")),"kind":"red","label":f"Red {f.get('network','de servicios')}","detail":f"Avería en calle {f.get('x',0)+1}, {f.get('y',0)+1}","status":f.get("status","avería")})
        for n in state.get("recoveryNeeds",[]):
            if n.get("status")=="abierta" and in_area(n.get("x",0)):links.append({"id":str(n.get("id")),"kind":"obra","label":n.get("name","Activo municipal"),"detail":n.get("cause","Rehabilitación pendiente"),"status":"necesita atención"})
        for r in state.get("roadAssets",[]):
            if in_area(r.get("x",0)) and r.get("quality",100)<60:links.append({"id":f"road-{r['x']}-{r['y']}","kind":"calle","label":f"Calle {r['x']+1}, {r['y']+1}","detail":f"Condición {round(r.get('quality',0))}%","status":"deteriorada"})
    elif issue=="confianza":
        arrears=state.get("taxes",{}).get("arrearsByAsset",{})
        for h in homes:
            due=arrears.get(f"home-{h.get('x')}-{h.get('y')}",0)
            if due:links.append({"id":f"tax-home-{h['x']}-{h['y']}","kind":"impuesto","label":h.get("name","Hogares del barrio"),"detail":f"Mora municipal acumulada $ {int(due)}","status":"impago"})
    if not links:links=[{"id":f"indicator-{district_id}-{issue}","kind":"indicador","label":"Indicador territorial agregado","detail":{"empleo":"Residentes elegibles sin empleo estable","vivienda":"Ocupación y calidad del parque residencial","servicios":"Cobertura municipal y redes locales","confianza":"Aprobación ciudadana y resultados del barrio"}.get(issue,"Indicador municipal"),"status":"requiere revisión"}]
    return links[:5]

def government_agreement_report():
    g=state.get("government",{});items=[a for a in g.get("agreements",[]) if a.get("mandate")==g.get("mandate")]
    return {"items":items[-24:],"active":sum(a.get("status")=="seguimiento" for a in items),"completed":sum(a.get("status")=="cumplido" for a in items),"overdue":sum(a.get("status")=="vencido" for a in items)}

def record_government_agreement(complaint_id,author):
    ensure_government_state();g=state["government"]
    complaint=next((c for c in g.get("complaints",[]) if c.get("id")==str(complaint_id) and c.get("status")=="abierto"),None)
    if not complaint:raise ValueError("El reclamo ya se resolvió o no está disponible.")
    if any(a.get("complaintId")==complaint["id"] and a.get("mandate")==g["mandate"] and a.get("status")=="seguimiento" for a in g.get("agreements",[])):raise ValueError("Este reclamo ya tiene un seguimiento municipal vigente.")
    agreement={"id":uuid.uuid4().hex,"complaintId":complaint["id"],"districtId":complaint["districtId"],"district":complaint["district"],"issue":complaint["issue"],"issueTitle":complaint["title"],"mandate":g["mandate"],"createdDay":state["day"],"deadlineDay":state["day"]+180,"status":"seguimiento","createdBy":str(author or "Equipo municipal")[:24],"evidenceIds":[x.get("id") for x in complaint.get("evidenceLinks",[])]}
    g.setdefault("agreements",[]).append(agreement);g["agreements"]=g["agreements"][-60:]
    ev("Acuerdo de seguimiento registrado",f"El equipo acuerda recuperar {complaint['title'].lower()} en {complaint['district']} antes del día {agreement['deadlineDay']}. El plazo y el resultado quedan en el registro compartido.")
    return agreement

def update_government_cycle():
    ensure_government_state();g=state["government"]
    if g.get("status")!="en_mandato":return
    districts=government_districts();existing={(c.get("districtId"),c.get("issue")):c for c in g.setdefault("complaints",[]) if c.get("status")=="abierto"}
    active=set()
    labels={"empleo":"Empleo insuficiente","vivienda":"Presión sobre la vivienda","servicios":"Déficit de servicios municipales","confianza":"Confianza ciudadana baja"}
    for d in districts:
        for issue in d["issues"]:
            key=(d["id"],issue);active.add(key);record=existing.get(key)
            if record:record["monthsOpen"]=int(record.get("monthsOpen",0))+1;record["lastEvidence"]={"employment":d["employment"],"housing":d["housing"],"services":d["services"],"support":d["support"]};record["evidenceLinks"]=government_issue_sources(d["id"],issue);record["lastReviewedDay"]=state["day"]
            else:
                g["complaintSequence"]=int(g.get("complaintSequence",0))+1
                record={"id":f"claim-{g['complaintSequence']}","districtId":d["id"],"district":d["name"],"issue":issue,"title":labels[issue],"status":"abierto","openedDay":state["day"],"lastReviewedDay":state["day"],"monthsOpen":1,"lastEvidence":{"employment":d["employment"],"housing":d["housing"],"services":d["services"],"support":d["support"]},"evidenceLinks":government_issue_sources(d["id"],issue)}
                g["complaints"].append(record);ev("Reclamo vecinal registrado",f"{d['name']}: {labels[issue].lower()} detectado en los indicadores del barrio. Se revisará al próximo cierre mensual.")
    for record in g["complaints"]:
        key=(record.get("districtId"),record.get("issue"))
        if record.get("status")=="abierto" and key not in active:
            record.update({"status":"resuelto","resolvedDay":state["day"]});ev("Reclamo vecinal resuelto",f"{record.get('district')}: mejoró el indicador de {record.get('issue')}; se cerró el seguimiento.")
    for agreement in g.setdefault("agreements",[]):
        if agreement.get("status")!="seguimiento":continue
        complaint=next((c for c in g["complaints"] if c.get("id")==agreement.get("complaintId")),None)
        if complaint and complaint.get("status")=="resuelto":agreement.update({"status":"cumplido","completedDay":state["day"]});ev("Acuerdo municipal cumplido",f"{agreement['district']}: se resolvió {agreement['issueTitle'].lower()} antes del vencimiento.")
        elif state["day"]>=agreement.get("deadlineDay",0):agreement.update({"status":"vencido","overdueDay":state["day"]});ev("Acuerdo municipal vencido",f"{agreement['district']}: venció el plazo para {agreement['issueTitle'].lower()}; queda pendiente en el registro público.")
    g["complaints"]=g["complaints"][-36:]
    reports=government_plan_report()
    for goal in reports["goals"]:
        stored=next((x for x in g["plan"]["goals"] if x["id"]==goal["id"]),None)
        if stored:stored["current"]=goal["current"];stored["fulfilled"]=goal["fulfilled"];stored["lastReviewedDay"]=state["day"]
    average=sum(d["support"]*d["population"] for d in districts)/max(1,sum(d["population"] for d in districts))
    severe=state.get("money",0)<=0 and state.get("services",0)<=30 and average<35
    if severe:
        g["crisisMonths"]=int(g.get("crisisMonths",0))+1
        if g["crisisMonths"]==2:
            g["crisisStatus"]="alerta";ev("Alerta de crisis institucional", "La ciudad lleva dos cierres con tesorería agotada, servicios críticos y apoyo muy bajo. Recuperar caja o servicios durante el próximo mes evita la destitución extraordinaria.")
        elif g["crisisMonths"]>=3:
            g["crisisStatus"]="destituido";g["status"]="destituido";g["defeatReason"]="Destitución extraordinaria tras tres cierres mensuales de crisis sin recuperación";state["paused"]=True;ev("Gobierno destituido por crisis prolongada","La tesorería, los servicios y el apoyo ciudadano permanecieron en niveles críticos durante tres cierres mensuales. La ciudad queda en observación.")
    else:
        if g.get("crisisStatus")=="alerta":ev("Crisis institucional superada","La tesorería, los servicios o el apoyo se recuperaron antes de la destitución.")
        g["crisisMonths"]=0;g["crisisStatus"]="estable"

def government_contract_portfolio():
    """Current public/private work commitments visible across mandates."""
    mandate=int(state.get("government",{}).get("mandate",1));rows=[];public_due=private_due=0
    for project in state.get("projects",[]):
        if project.get("status") in ("cancelada","finalizada","completada"):continue
        remaining=max(0,int(project.get("cost",0))-int(project.get("paid",0)))
        private=bool(project.get("privatePaid"));public_due+=0 if private else remaining;private_due+=remaining if private else 0
        rows.append({"id":str(project.get("id","")),"label":project.get("label",project.get("kind","Obra")),"contractor":project.get("contractor","Constructora"),"x":project.get("x"),"y":project.get("y"),"stage":(project.get("stages") or ["Contratada"])[min(int(project.get("stageIndex",0)),max(0,len(project.get("stages",[]))-1))] if project.get("stages") else "Contratada","status":project.get("status","contratada"),"private":private,"remaining":remaining,"paid":int(project.get("paid",0)),"workers":int(project.get("workersAssigned",0)),"contractedMandate":project.get("contractedMandate"),"inherited":project.get("contractedMandate") is not None and int(project.get("contractedMandate"))<mandate})
    rows.sort(key=lambda row:(row["private"],row["y"] if row["y"] is not None else 0,row["x"] if row["x"] is not None else 0,row["label"]))
    return {"active":len(rows),"inherited":sum(row["inherited"] for row in rows),"municipalOutstanding":public_due,"privateOutstanding":private_due,"items":rows[:24]}

def government_report():
    ensure_government_state()
    g=state["government"];day=int(state.get("day",1));remaining=max(0,int(g["nextElectionDay"])-day)
    districts=government_districts();eligible=sum(d["population"] for d in districts)
    turnout=sum(round(d["population"]*.72) for d in districts)
    incumbent=sum(round(round(d["population"]*.72)*d["support"]/100) for d in districts)
    for complaint in g.get("complaints",[]):
        if complaint.get("status")=="abierto" and not complaint.get("evidenceLinks"):complaint["evidenceLinks"]=government_issue_sources(complaint.get("districtId"),complaint.get("issue"))
    plan=government_plan_report();agreements=government_agreement_report();agreement_adjustment=max(-6,min(4,agreements["completed"]*2-agreements["overdue"]*2));adjustment=2*plan["fulfilled"]-(plan["total"]-plan["fulfilled"])+agreement_adjustment
    vote=round(100*incumbent/max(1,turnout))+adjustment
    return {"mandate":g["mandate"],"status":g["status"],"startDay":g["startDay"],"nextElectionDay":g["nextElectionDay"],"daysRemaining":remaining,"yearsRemaining":round(remaining/360,1),"approval":round(float(state.get("approval",0))),"districts":districts,"eligibleVoters":eligible,"turnout":turnout,"projectedVote":max(0,min(100,vote)),"plan":plan,"complaints":[c for c in g.get("complaints",[]) if c.get("status")=="abierto"],"resolvedComplaints":sum(c.get("status")=="resuelto" for c in g.get("complaints",[])),"agreements":agreements,"crisisMonths":g.get("crisisMonths",0),"crisisStatus":g.get("crisisStatus","estable"),"lastElection":g["elections"][-1] if g["elections"] else None,"contractPortfolio":government_contract_portfolio(),"defeatReason":g.get("defeatReason")}

def process_government_election():
    ensure_government_state();g=state["government"]
    if g["status"]!="en_mandato" or int(state.get("day",1))<int(g["nextElectionDay"]):return
    report=government_report();districts=[]
    for d in report["districts"]:
        voters=round(d["population"]*.72);votes=round(voters*d["support"]/100)
        districts.append({"name":d["name"],"eligible":d["population"],"turnout":voters,"governmentVotes":votes,"governmentPct":round(100*votes/max(1,voters)),"issue":d["issue"]})
    total_votes=sum(d["turnout"] for d in districts);votes=sum(d["governmentVotes"] for d in districts);plan=government_plan_report();agreements=government_agreement_report();agreement_adjustment=max(-6,min(4,agreements["completed"]*2-agreements["overdue"]*2));adjustment=2*plan["fulfilled"]-(plan["total"]-plan["fulfilled"])+agreement_adjustment;pct=max(0,min(100,round(100*votes/max(1,total_votes))+adjustment));won=pct>=50
    result={"day":state["day"],"mandate":g["mandate"],"governmentVotes":votes,"totalVotes":total_votes,"governmentPct":pct,"won":won,"districts":districts,"plan":plan,"agreements":agreements,"openComplaints":len(report["complaints"]),"contractPortfolio":government_contract_portfolio(),"reasons":[f"Empleo: {round(sum(d['employment']*d['population'] for d in report['districts'])/max(1,report['eligibleVoters']))}%","Servicios municipales: "+str(round(state.get("services",0)))+"%",f"Metas cumplidas: {plan['fulfilled']}/{plan['total']}",f"Acuerdos cumplidos: {agreements['completed']} · vencidos: {agreements['overdue']}"]}
    g["elections"].append(result);g["elections"]=g["elections"][-8:];g["lastElectionDay"]=state["day"]
    if won:g["mandate"]+=1;g["startDay"]=state["day"];g["nextElectionDay"]=state["day"]+1440;ev("El gobierno renueva su mandato",f"El equipo obtuvo {pct}% de los votos habilitados. La elección consideró empleo, vivienda, servicios y confianza de los distritos.")
    else:g["status"]="derrotado";state["paused"]=True;ev("Derrota compartida en las elecciones",f"El gobierno obtuvo {pct}% y perdió la mayoría. Todo el equipo deja el mandato; la ciudad queda pausada en modo observación.")
    if won:g["plan"]=new_mandate_plan();g["complaints"]=[c for c in g.get("complaints",[]) if c.get("status")=="abierto"]

def ensure_critical_inspection_schedule(building):
    if building.get("kind") not in ("powerPlant","waterPlant","wastewaterPlant"):return
    building.setdefault("inspectionIntervalDays",180)
    building.setdefault("nextInspectionDay",int(state.get("day",1))+building["inspectionIntervalDays"])

def road_maintenance_report(funding_factor=None,advance=False):
    roads=state.setdefault("roads",[]);assets=state.setdefault("roadAssets",[])
    for x,y in roads:
        if not any(a.get("x")==x and a.get("y")==y for a in assets):assets.append({"x":x,"y":y,"quality":82,"monthlyCost":15})
    policy=max(0,min(200,int(state.get("roadMaintenancePct",100))))
    road_set={tuple(r) for r in roads};road_rows=[];required=0
    for asset in assets:
        x,y=asset["x"],asset["y"];adjacent=sum(1 for b in state.get("buildings",[]) if abs(b.get("x",-99)-x)+abs(b.get("y",-99)-y)<=1)
        degree=sum((x+dx,y+dy) in road_set for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)))
        load=1+min(2,adjacent*.25+degree*.08);quality=max(0,min(100,float(asset.get("quality",82))))
        base=round(8+load*4);required+=round(base*policy/100)
        if advance:
            quality=max(0,quality-(.22+load*.12))
            if funding_factor is not None:quality=min(100,quality+(.72*policy/100*max(0,min(1,float(funding_factor)))))
            asset["quality"]=round(quality,1);asset["useLoad"]=round(load,2)
            if quality<25 and not asset.get("safetyClosure"):
                asset["safetyClosure"]=True
                ev("Cierre preventivo de calle",f"La calle {x+1},{y+1} se cerró al tránsito por condición estructural crítica ({round(quality)}%). Los viajes y servicios buscarán rutas alternativas hasta rehabilitar el tramo.")
            elif quality>=25:asset["safetyClosure"]=False
            if quality<45 and not any(n.get("targetType")=="road" and n.get("x")==x and n.get("y")==y and n.get("status")!="reparada" for n in state.setdefault("recoveryNeeds",[])):
                estimate=max(850,round(850+(45-quality)*28))
                state["recoveryNeeds"].append({"id":f"maintenance-road-{x}-{y}-{state.get('day',1)}","targetType":"road","x":x,"y":y,"name":f"Calle {x+1}, {y+1}","day":state.get("day",1),"condition":round(quality),"estimate":estimate,"cause":"desgaste por uso y antigüedad","inspectionStatus":"pendiente","status":"abierta"})
                ev("Inspección vial requerida",f"La calle {x+1},{y+1} bajó de 45% de condición. Solicitá diagnóstico y reparación antes de que el tramo pierda seguridad.")
        road_rows.append({"x":x,"y":y,"quality":round(quality,1),"useLoad":round(load,2),"maintenanceCost":round(base*policy/100),"status":"cerrada" if quality<25 else "abierta"})
    public_kinds={"civic","school","fireStation","depot","landfill","recyclingPlant","powerPlant","waterPlant","wastewaterPlant","port","airport"}
    facilities=[]
    for b in state.get("buildings",[]):
        if b.get("kind") not in public_kinds or b.get("status") in ("cerrado","abandonado"):continue
        ensure_critical_inspection_schedule(b)
        quality=max(0,min(100,float(b.get("quality",82))));load=1+min(2,(b.get("jobSlots",0)*.012+b.get("occupants",0)*.002))
        base=round(18+load*5);cost=round(base*policy/100);required+=cost
        if advance:
            needs=state.setdefault("recoveryNeeds",[])
            quality=max(0,quality-(.18+load*.1))
            if funding_factor is not None:quality=min(100,quality+(.52*policy/100*max(0,min(1,float(funding_factor)))))
            b["quality"]=round(quality,1);b["maintenanceLoad"]=round(load,2)
            if quality<60 and not any(n.get("targetType")=="building" and n.get("x")==b["x"] and n.get("y")==b["y"] and n.get("status")!="reparada" for n in state.setdefault("recoveryNeeds",[])):
                estimate=max(900,round(850+(60-quality)*38))
                state["recoveryNeeds"].append({"id":f"maintenance-building-{b['x']}-{b['y']}-{state.get('day',1)}","targetType":"building","x":b["x"],"y":b["y"],"name":b.get("name",b["kind"]),"day":state.get("day",1),"condition":round(quality),"estimate":estimate,"cause":"desgaste por uso y antigüedad","inspectionStatus":"pendiente","status":"abierta"})
                ev("Inspección de mantenimiento requerida",f"{b.get('name',b['kind'])} bajó de 60% de condición. Solicitá una inspección y compará ofertas de rehabilitación antes de que pierda capacidad.")
            if b.get("kind") in ("powerPlant","waterPlant","wastewaterPlant") and state.get("day",1)>=b["nextInspectionDay"] and not any(n.get("targetType")=="building" and n.get("x")==b["x"] and n.get("y")==b["y"] and n.get("status")!="reparada" for n in needs):
                needs.append({"id":f"inspection-plant-{b['x']}-{b['y']}-{state.get('day',1)}","targetType":"building","x":b["x"],"y":b["y"],"name":b.get("name",b["kind"]),"day":state.get("day",1),"condition":round(quality),"estimate":max(900,round(850+(82-quality)*38)),"cause":"inspección preventiva programada","inspectionStatus":"pendiente","scheduledInspection":True,"status":"abierta"})
                ev("Inspección preventiva vencida",f"{b.get('name',b['kind'])} llegó a su revisión de seguridad de los {b['inspectionIntervalDays']} días. La inspección cuesta $150 y comprueba estructura, conexiones y capacidad antes de contratar una rehabilitación.")
        factor=max(0,min(1,quality/82));base_output=b.get("generationKw",900) if b["kind"]=="powerPlant" else b.get("treatmentM3Day",220 if b["kind"]=="waterPlant" else 260) if b["kind"] in ("waterPlant","wastewaterPlant") else None
        output_unit="kW" if b["kind"]=="powerPlant" else "m³/día"
        active_inspection=next((n for n in state.get("recoveryNeeds",[]) if n.get("targetType")=="building" and n.get("x")==b["x"] and n.get("y")==b["y"] and n.get("status")!="reparada"),None)
        facilities.append({"x":b["x"],"y":b["y"],"name":b.get("name",b["kind"]),"kind":b["kind"],"quality":round(quality,1),"functionalCapacityPct":round(factor*100),"effectiveOutput":round(base_output*factor) if base_output is not None else None,"outputUnit":output_unit,"inspectionIntervalDays":b.get("inspectionIntervalDays"),"inspectionDueDay":b.get("nextInspectionDay"),"inspectionDaysRemaining":max(0,b.get("nextInspectionDay",state.get("day",1))-state.get("day",1)),"inspectionOverdue":state.get("day",1)>=b.get("nextInspectionDay",state.get("day",1)),"inspectionStatus":active_inspection.get("inspectionStatus") if active_inspection else None,"useLoad":round(load,2),"maintenanceCost":cost})
    road_rows.sort(key=lambda r:(r["quality"],r["y"],r["x"]))
    values=[r["quality"] for r in road_rows];building_values=[b["quality"] for b in facilities]
    funded=max(0,min(1,float(funding_factor if funding_factor is not None else state.get("utilities",{}).get("maintenanceFundingFactor",1))))
    report={"policyPct":policy,"segments":len(road_rows),"averageCondition":round(sum(values)/max(1,len(values))*10)/10,"poorSegments":sum(v<45 for v in values),"criticalSegments":sum(v<25 for v in values),"closedSegments":sum(v<25 for v in values),"facilityCount":len(facilities),"averageFacilityCondition":round(sum(building_values)/max(1,len(building_values))*10)/10,"wornFacilities":sum(v<60 for v in building_values),"monthlyRequired":required,"roadMonthlyRequired":sum(r["maintenanceCost"] for r in road_rows),"facilityMonthlyRequired":sum(b["maintenanceCost"] for b in facilities),"monthlyFunded":round(required*funded),"assets":road_rows[:80],"facilities":facilities[:40]}
    state["roadMaintenanceReport"]=report
    return report

def heritage_report():
    listed=[b for b in state.get("buildings",[]) if b.get("heritageEligible")]
    protected=[b for b in listed if b.get("heritageLevel") in ("protección parcial","protección integral")]
    score=sum(b.get("heritageSignificance",1)*b.get("conservation",0)/100 for b in protected)
    candidates=[]
    active={(w.get("x"),w.get("y")) for w in state.get("adaptiveReuseWorks",[])}
    for b in state.get("buildings",[]):
        if b.get("kind")!="shop" or b.get("business",{}).get("status")!="cerrado":continue
        firm=b.get("business",{});arrears=state.get("taxes",{}).get("arrearsByAsset",{}).get(firm.get("id",f"shop-{b['x']}-{b['y']}"),0)
        heritage_locked=b.get("heritageLevel") in ("protección parcial","protección integral")
        reason="En reconversión" if (b.get("x"),b.get("y")) in active else "Protección patrimonial" if heritage_locked else "Deuda empresarial pendiente" if firm.get("creditDebt",0)>0 or arrears>0 else "Disponible para vivienda"
        candidates.append({"x":b["x"],"y":b["y"],"name":b.get("name","Local cerrado"),"reason":reason,"eligible":reason=="Disponible para vivienda"})
    return {"year":2026+(max(0,int(state.get("day",1))-1)//360),"listed":len(listed),"protected":len(protected),"restored":sum(bool(b.get("renovations")) for b in listed),"identity":round(min(100,score*9)),"works":[dict(w) for w in state.get("heritageWorks",[])],"sites":[{k:b.get(k) for k in ("x","y","name","kind","yearBuilt","architecturalEra","architecturalStyle","originalUse","renovations","conservation","heritageSignificance","heritageLevel","occupants")} for b in listed],"reuseWorks":[dict(w) for w in state.get("adaptiveReuseWorks",[])],"reuseHistory":state.get("adaptiveReuseHistory",[])[-8:],"reuseCandidates":candidates,"reuseHomes":sum(1 for b in state.get("buildings",[]) if b.get("adaptiveReuseDay"))}

def advance_adaptive_reuse():
    for work in list(state.get("adaptiveReuseWorks",[])):
        work["elapsedDays"]=work.get("elapsedDays",0)+1
        work["progress"]=min(1,work["elapsedDays"]/max(1,work["durationDays"]))
        work["stage"]=("Desmontaje y diagnóstico" if work["progress"]<.2 else "Refuerzo y nuevas divisiones" if work["progress"]<.55 else "Agua, saneamiento y electricidad" if work["progress"]<.85 else "Inspección de habitabilidad")
        if work["progress"]<1:continue
        building=next((b for b in state.get("buildings",[]) if b.get("x")==work["x"] and b.get("y")==work["y"]),None)
        if building:
            old_name=building.get("name","Local recuperado")
            building.pop("business",None);building["kind"]="home";building["name"]=f"Viviendas · {old_name}";building["status"]="habilitado";building["capacity"]=24;building["occupants"]=0;building["quality"]=work["quality"];building["householdCash"]=0;building["monthlyWageIncome"]=0;building["residents"]=[];building["adaptiveReuseDay"]=state["day"];building["rentalLeaseDays"]=[];building["rentalPricePerResident"]=work["rent"]
            building.setdefault("renovations",[]).append({"year":2026+(max(0,state["day"]-1)//360),"day":state["day"],"contractor":work["contractor"],"cost":work["investment"],"scope":"Reconversión de local a vivienda con redes y habitabilidad"})
        state.setdefault("adaptiveReuseHistory",[]).append({**work,"status":"completada","completedDay":state["day"]});del state["adaptiveReuseHistory"][:-40];state["adaptiveReuseWorks"].remove(work)
        ev("Viviendas reconvertidas",f"{work['name']} aprobó agua, saneamiento y seguridad: 24 plazas nuevas. Alquiler inicial ${work['rent']} por residente/mes; siguiente mudanza sujeta a empleo y aprobación ciudadana.")

def collect_adaptive_rents():
    paid_total=arrears=0
    for home in (b for b in state.get("buildings",[]) if b.get("adaptiveReuseDay") and b.get("occupants",0)>0 and state.get("day",1)-b.get("leaseStartDay",b.get("adaptiveReuseDay",1))>=30):
        lease_days=home.setdefault("rentalLeaseDays",[home.get("adaptiveReuseDay",1)]*home.get("occupants",0));due=max(0,int(home.get("rentalPricePerResident",24)*sum(1 for started in lease_days if state.get("day",1)-started>=30)));paid=min(due,max(0,int(home.get("householdCash",0))))
        home["householdCash"]-=paid;home["rentalOwnerCash"]=home.get("rentalOwnerCash",0)+paid;home["rentArrears"]=home.get("rentArrears",0)+due-paid;paid_total+=paid;arrears+=due-paid
    if paid_total:ev("Alquileres de viviendas reconvertidas",f"Propietarios cobraron ${paid_total} por {sum(1 for b in state['buildings'] if b.get('adaptiveReuseDay') and b.get('occupants',0)>0)} inmuebles; deuda de alquiler pendiente ${arrears}.")
    if arrears>=600:state["approval"]=max(0,state.get("approval",0)-1);ev("Presión por alquileres",f"Quedaron ${arrears} de alquiler sin pagar en inmuebles reconvertidos; los hogares pierden margen y baja la aprobación.")

def advance_heritage_works():
    day=int(state.get("day",1))
    if day>1 and (day-1)%360==0:
        for building in state.get("buildings",[]):
            if building.get("heritageEligible"):
                loss=2 if building.get("heritageLevel") in ("protección parcial","protección integral") else 3
                building["conservation"]=max(0,building.get("conservation",100)-loss)
                if building["conservation"]<35:ev("Riesgo de deterioro patrimonial",f"{building.get('name')} conserva {building['conservation']}% de su estado; financiar refuerzos antes de que el inmueble cierre por seguridad.")
    for work in list(state.get("heritageWorks",[])):
        if state["day"]<work.get("deliveryDay",state["day"]):continue
        work["elapsedDays"]=work.get("elapsedDays",0)+1
        work["progress"]=min(1,work["elapsedDays"]/max(1,work["durationDays"]))
        work["stage"]=("Consolidación estructural" if work["progress"]<.4 else "Instalaciones y accesibilidad" if work["progress"]<.72 else "Restauración de fachada e inspección")
        if work["progress"]<1:continue
        building=next((b for b in state.get("buildings",[]) if b.get("x")==work["x"] and b.get("y")==work["y"]),None)
        if building:
            quality=CONTRACTORS.get(work["contractor"],{}).get("quality",.75)
            building["conservation"]=round(94+quality*6);building.setdefault("renovations",[]).append({"year":2026+(max(0,state["day"]-1)//360),"day":state["day"],"contractor":work["contractor"],"cost":work["cost"],"scope":"Refuerzo, accesibilidad e instalaciones"})
            building["lastRestoredDay"]=state["day"]
        state.setdefault("heritageHistory",[]).append({**work,"status":"completada","completedDay":state["day"]});del state["heritageHistory"][:-40]
        state["heritageWorks"].remove(work);ev("Rehabilitación patrimonial terminada",f"{work['name']} fue inspeccionado y recuperó su conservación con {work['contractor']}; inversión $ {work['cost']:,}.".replace(",","."))

def ensure_tax_state():
    taxes=state.setdefault("taxes",new_tax_state())
    for key,value in new_tax_state().items():taxes.setdefault(key,value)
    return taxes

def collect_municipal_taxes():
    """Cobra gravámenes sobre caja existente; la mora queda como cuenta por cobrar."""
    taxes=ensure_tax_state();month=(state.get("day",1)-1)//30
    if taxes.get("lastProcessedMonth")==month:return taxes.get("lastReport",{})
    rates={"property":max(0,int(taxes.get("propertyRateBp",60))),"business":max(0,int(taxes.get("businessRateBp",200)))}
    accounts=taxes.setdefault("arrearsByAsset",{});property_due=property_paid=business_due=business_paid=late_homes=late_firms=0
    for home in (b for b in state.get("buildings",[]) if b.get("kind")=="home" and b.get("occupants",0)>0):
        key=f"home-{home['x']}-{home['y']}";due=round(home.get("occupants",0)*2400*rates["property"]/120000)+accounts.get(key,0);cash=max(0,round(home.get("householdCash",0)));paid=min(cash,due)
        home["householdCash"]=cash-paid;accounts[key]=due-paid;home["propertyTaxDue"]=due;home["propertyTaxPaid"]=paid;home["propertyTaxArrears"]=due-paid
        property_due+=due;property_paid+=paid;late_homes+=int(due>paid)
    for shop in (b for b in state.get("buildings",[]) if b.get("kind")=="shop" and b.get("business",{}).get("status")=="abierto"):
        firm=shop["business"];key=firm.get("id",f"shop-{shop['x']}-{shop['y']}");due=round(max(0,firm.get("lastRevenue",0))*rates["business"]/10000)+accounts.get(key,0);cash=max(0,round(firm.get("cash",0)));paid=min(cash,due)
        firm["cash"]=cash-paid;accounts[key]=due-paid;firm["municipalTaxDue"]=due;firm["municipalTaxPaid"]=paid;firm["municipalTaxArrears"]=due-paid
        firm["taxDelinquencyMonths"]=firm.get("taxDelinquencyMonths",0)+1 if due>paid else 0
        business_due+=due;business_paid+=paid;late_firms+=int(due>paid)
    taxes["lastProcessedMonth"]=month
    report={"propertyRateBp":rates["property"],"businessRateBp":rates["business"],"assessedHomes":sum(b.get("occupants",0)*2400 for b in state.get("buildings",[]) if b.get("kind")=="home"),"taxableBusinessSales":sum(max(0,b.get("business",{}).get("lastRevenue",0)) for b in state.get("buildings",[]) if b.get("kind")=="shop" and b.get("business",{}).get("status")=="abierto"),"propertyBilled":property_due,"propertyCollected":property_paid,"businessBilled":business_due,"businessCollected":business_paid,"collected":property_paid+business_paid,"arrears":sum(accounts.values()),"delinquentHomes":late_homes,"delinquentBusinesses":late_firms,"month":month}
    taxes["lastReport"]=report;taxes.setdefault("history",[]).append(report.copy());del taxes["history"][:-12]
    if report["collected"]:ev("Recaudación municipal",f"Se cobraron $ {report['collected']:,} de impuestos sobre viviendas y ventas; $ {report['arrears']:,} quedan en mora.".replace(",","."))
    if late_homes and late_homes>=max(3,round(sum(1 for b in state["buildings"] if b.get("kind")=="home" and b.get("occupants",0)>0)*.35)):
        state["approval"]=max(0,state.get("approval",0)-1);ev("Mora tributaria extendida",f"{late_homes} hogares no pudieron pagar el impuesto completo; la confianza municipal cae un punto.")
    return report

def municipal_finance_report(monthly_income=None, monthly_expenses=None):
    finance=state.setdefault("finance",new_finance());loans=finance.setdefault("municipalLoans",[])
    outstanding=round(sum(max(0,x.get("balance",0)) for x in loans if x.get("status")=="active"))
    service=round(sum(max(0,x.get("payment",0)) for x in loans if x.get("status")=="active"))
    income=max(0,round(monthly_income if monthly_income is not None else state.get("monthlyIncome",0)))
    expenses=max(0,round(monthly_expenses if monthly_expenses is not None else state.get("monthlyExpenses",0)))
    net=income-expenses-service
    # Proyección de referencia; mantiene las bases actuales y los pagos contratados constantes.
    debt_reserve=max(0,round(finance.get("debtReserve",0)))
    budgets=finance.setdefault("programBudgets",new_finance()["programBudgets"])
    for key,value in new_finance()["programBudgets"].items():budgets.setdefault(key,value.copy() if isinstance(value,dict) else value)
    for name in ("services","mobility","networks"):
        budgets["arrears"].setdefault(name,0);budgets["underfundedMonths"].setdefault(name,0)
    return {"cash":round(state.get("money",0)),"debtReserve":debt_reserve,"totalTreasury":round(state.get("money",0))+debt_reserve,"programBudgets":budgets,"monthlyIncome":income,"monthlyExpenses":expenses,"monthlyDebtService":service,"netAfterDebt":net,"outstandingDebt":outstanding,"activeLoans":sum(x.get("status")=="active" for x in loans),"creditLimit":max(0,min(40000,round(income*8)-outstanding)),"forecast12":round(state.get("money",0)+debt_reserve+net*12),"forecast48":round(state.get("money",0)+debt_reserve+net*48),"loans":loans}

def municipal_debt_payment():
    finance=state.setdefault("finance",new_finance());total=0
    for loan in finance.setdefault("municipalLoans",[]):
        if loan.get("status")!="active":continue
        balance=max(0,loan.get("balance",0));payment=min(balance+balance*loan.get("monthlyRate",.01),max(0,loan.get("payment",0)))
        interest=round(balance*loan.get("monthlyRate",.01));principal=max(0,round(payment-interest))
        loan["lastInterest"]=interest;loan["lastPrincipal"]=min(balance,principal);loan["lastPayment"]=round(payment)
        loan["balance"]=max(0,round(balance-loan["lastPrincipal"]));loan["monthsRemaining"]=max(0,loan.get("monthsRemaining",0)-1);loan["delinquentMonths"]=0;total+=round(payment)
        if loan["balance"]<=0 or loan["monthsRemaining"]<=0:loan.update({"balance":0,"status":"paid","paidDay":state.get("day",1)});ev("Crédito municipal cancelado",f"El municipio terminó de pagar {loan.get('label','el préstamo')}.")
    return total

def settle_municipal_program_budgets(costs,available):
    """Paga primero servicios, redes y movilidad según apropiaciones; lo pendiente queda en mora fiscal."""
    finance=state.setdefault("finance",new_finance());ensure_finance_state();budgets=finance["programBudgets"]
    names={"services":"Servicios públicos","networks":"Redes y residuos","mobility":"Transporte"};remaining=max(0,round(available));rows={}
    for key in ("services","networks","mobility"):
        current=max(0,round(costs.get(key,0)));old=max(0,round(budgets["arrears"].get(key,0)))
        rate=max(0,min(200,int(budgets.get(f"{key}Pct",100))));ceiling=round(current*rate/100)
        due=old+current;scheduled=min(due,ceiling);paid=min(scheduled,remaining);remaining-=paid
        new_arrears=max(0,due-paid);unpaid_current=min(current,max(0,new_arrears-old));factor=1-unpaid_current/max(1,current) if current else 1
        budgets["arrears"][key]=new_arrears
        budgets["underfundedMonths"][key]=budgets["underfundedMonths"].get(key,0)+1 if unpaid_current else 0
        row={"program":key,"label":names[key],"monthlyCost":current,"budgetPct":rate,"scheduled":scheduled,"paid":paid,"arrears":new_arrears,"fundingPct":round(factor*100)}
        rows[key]=row
        if key=="services":
            budgets["servicesFundingFactor"]=factor
            if unpaid_current:
                loss=max(1,math.ceil((1-factor)*4));state["services"]=max(5,state.get("services",0)-loss)
                if budgets["underfundedMonths"][key]>=2:state["approval"]=max(5,state.get("approval",0)-1)
        elif key=="mobility":budgets["mobilityFundingFactor"]=factor
        elif key=="networks":
            state.setdefault("utilities",{})["maintenanceFundingFactor"]=factor
            state.setdefault("waste",{})["fundingFactor"]=factor
    report={"month":(state.get("day",1)-1)//30,"programs":rows,"scheduled":sum(x["scheduled"] for x in rows.values()),"paid":sum(x["paid"] for x in rows.values()),"arrears":sum(x["arrears"] for x in rows.values()),"cashRemaining":remaining}
    budgets["lastReport"]=report;budgets.setdefault("history",[]).append(report.copy());del budgets["history"][:-24]
    if report["arrears"]:
        ev("Presupuesto municipal insuficiente",f"Programas pendientes: " + " · ".join(f"{r['label']} $ {r['arrears']:,}".replace(",",".") for r in rows.values() if r["arrears"]))
    return report

def new_supply():
    return {"regional":INITIAL_REGIONAL_STOCK.copy(),
            "contractors":{name:INITIAL_CONTRACTOR_STOCK.copy() for name in CONTRACTOR_NAMES},
            "contractorCash":CONTRACTOR_CASH.copy(),
            "suppliers":{name:stock.copy() for name,stock in SUPPLIER_STOCK.items()},
            "orders":[],"market":new_market_supply(),"marketOrders":[],"tradeContracts":[],"portOrders":[],"portVoyages":[],"storageCapacity":240,"yardCapacity":240,"depots":[]}

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
    return {"version":60,"regionalMarket":{"history":[],"lastReport":{}},"regionalMarketReport":{},"privateInvestments":{"proposal":None,"history":[],"nextOfferDay":1,"reason":"Los inversores esperan ventas regionales sin cubrir y una parcela comercial conectada."},"urbanEvolution":{"lastProcessedYear":2026,"history":[],"lastBirthYear":2026},"urbanRenewalNeeds":[],"urbanRenewalWorks":[],"urbanRenewalHistory":[],"government":{"mandate":1,"startDay":1,"nextElectionDay":1441,"status":"en_mandato","elections":[],"crisisMonths":0,"crisisStatus":"estable","complaints":[],"complaintSequence":0,"agreements":[]},"roadMaintenancePct":100,"name":"Puerto Claro","day":1,"speed":1,"paused":False,"money":48000,"monthlyIncome":6200,"monthlyExpenses":4700,"population":620,"jobs":286,"employment":78,"services":76,"approval":64,"privateCapital":26000,"finance":new_finance(),"taxes":new_tax_state(),"roads":roads,"roadAssets":[],"buildings":buildings,"projects":[],"contractChangeHistory":[],"contractGuarantees":[],"heritageWorks":[],"heritageHistory":[],"adaptiveReuseWorks":[],"adaptiveReuseHistory":[],"recoveryNeeds":[],"recoveryContracts":[],"education":{"lastProcessedMonth":0},"health":{"lastAdvancedDay":None,"lastQueueDay":None,"lastImpactMonth":-1,"primaryBacklog":0,"waterSafetyHistory":{}},"fireService":{"incidents":[],"lastGeneratedMonth":-1,"dispatches":0,"resolved":0,"unanswered":0},"trainingPrograms":[],"busRoutes":[],"abandoned":[],"zones":[],"housingDemand":{"unmet":0,"lastGenerated":0,"lastFilled":0},"localIndustry":{"unitsProduced":0,"unitsSold":0,"unitsImported":0,"history":[]},"waste":{"baseCollectionTonsDay":1.15,"baseLandfillCapacityTons":900,"landfillStoredTons":0,"uncollectedTons":0,"transferStoredTons":0,"containers":[],"lastCollectionTons":0,"lastWasteImpactDay":0,"lastRecycledTonsDay":0},"utilities":{"failures":[],"powerLines":[r.copy() for r in roads],"waterPipes":[r.copy() for r in roads],"sewerLines":[r.copy() for r in roads],"drainLines":[r.copy() for r in roads],"gasLines":[r.copy() for r in roads],"telecomLines":[r.copy() for r in roads],"baseGasCapacityM3Day":1200,"baseWaterCapacityM3Day":180,"powerLossRate":.06,"waterLeakRate":.08},"supply":new_supply(),"events":[{"day":1,"title":"Puerto Claro inicia una nueva gestión","detail":"Tesorería disponible: $48.000. La conexión regional mantiene activo el comercio."},{"day":1,"title":"Demanda residencial moderada","detail":"Hay hogares buscando vivienda cerca de los empleos del centro."}],"lastMonth":0,"players":{},"host":None}

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

def assess_contract_delay(project, contractor):
    """Monthly, reproducible schedule risk from past reliability and current workload."""
    day=int(state.get("day",1));start=int(project.get("contractedDay",day-max(0,int(project.get("elapsed",0)))))
    cycle=max(1,(day-start)//30)
    if day-start<30 or int(project.get("lastRiskReviewCycle",0))>=cycle:return False
    project["lastRiskReviewCycle"]=cycle
    active=sum(1 for p in state.get("projects",[]) if p.get("contractor")==project.get("contractor") and p.get("status") not in ("pausada","cancelada","finalizada"))
    capacity=max(1,int(contractor.get("capacity",1)))
    active+=sum(1 for g in state.get("contractGuarantees",[]) if g.get("contractor")==project.get("contractor") and g.get("status")=="reparacion")
    congested=active>=capacity
    reliability=max(0,min(1,float(contractor.get("reliability",.75))))
    chance=.025+(1-reliability)*.22+(.04 if congested else 0)
    salt=CONTRACTOR_NAMES.index(project.get("contractor")) if project.get("contractor") in CONTRACTOR_NAMES else 0
    seed=(int(project.get("x",0)+1)*73856093 ^ int(project.get("y",0)+1)*19349663 ^ cycle*83492791 ^ salt*2654435761)&0xffffffff
    if (seed%10000)/10000>=chance:return False
    delay=2+(seed//10000)%4
    project["duration"]+=delay;project["delayDays"]=int(project.get("delayDays",0))+delay
    project["lastDelayReason"]=(f"Confiabilidad histórica {round(reliability*100)}%"+(f" · capacidad completa {active}/{capacity}" if congested else ""))
    ev("Demora contractual detectada",f"{project.get('label','La obra')} de {project.get('contractor','la constructora')} requiere {delay} días adicionales. Causa: {project['lastDelayReason']}; avance físico y certificados se ajustaron al nuevo plazo.")
    return True

def project_certificate(project, elapsed):
    stages=max(1,len(project.get("stages",[])))
    base=max(0,min(stages,int(project.get("milestoneBase",0))))
    remaining=max(1,stages-base)
    if "scheduleBaseProgress" in project:
        baseline=float(project.get("scheduleBaseProgress",0));baseline_elapsed=int(project.get("scheduleBaseElapsed",0));remaining=max(1,int(project.get("scheduleRemainingDays",project.get("duration",1)-baseline_elapsed)))
        progress=min(1,baseline+(1-baseline)*max(0,elapsed-baseline_elapsed)/remaining)
    else:progress=min(1,float(project.get("initialProgress",0))+(1-float(project.get("initialProgress",0)))*elapsed/max(1,project.get("duration",1)))
    earned=max(0,min(remaining,int(math.floor(progress*stages+1e-9))-base))
    certified=int(project.get("certifiedMilestones",max(0,int(math.floor(float(project.get("progress",0))*stages+1e-9))-base)))
    retention=max(0,min(.2,float(project.get("retentionPct",0))))
    target=project["cost"]*(.2+(.8-retention)*earned/remaining)
    return progress,earned,certified,target,max(0,target-project.get("paid",0)),base,remaining

def contract_change_roll(project):
    index=CONTRACTOR_NAMES.index(project.get("contractor")) if project.get("contractor") in CONTRACTOR_NAMES else 0
    seed=((int(project.get("x",0)+1)*73856093) ^ (int(project.get("y",0)+1)*19349663) ^ (int(project.get("contractedDay",1)+1)*83492791) ^ index*2654435761 ^ 0x51ED270B)&0xffffffff
    return seed,(seed%10000)/10000

def request_contract_change(project):
    contractor=CONTRACTORS.get(project.get("contractor"),CONTRACTORS["Constructora Delta"])
    seed,roll=contract_change_roll(project)
    infrastructure=project.get("kind") in ("road","busStop","port","airport","waterPlant","wastewaterPlant")
    chance=.11+(1-contractor["quality"])*.18+(.025 if infrastructure else 0)
    if roll>=chance:return False
    utility_conflict=any([project.get("x"),project.get("y")] in state.get("utilities",{}).get(key,[]) for key in ("powerLines","waterPipes","sewerLines","drainLines","gasLines","telecomLines"))
    cause="Interferencia con una red enterrada no relevada" if utility_conflict else "Estrato del terreno menos competente que el relevamiento inicial"
    cost_pct=.08+(seed//10000%7)*.01
    cost_delta=max(100,round(project.get("cost",0)*cost_pct))
    delay_days=4+(seed//70000%5)
    project["changeOrderReviewed"]=True
    project["changeOrder"]={"id":f"cambio-{project['id']}","status":"pendiente","cause":cause,"createdDay":state["day"],"costDelta":cost_delta,"delayDays":delay_days,"qualityPenalty":12}
    project["status"]="cambio_pendiente"
    ev("Constructora solicita una orden de cambio",f"{project.get('label','La obra')}: {cause.lower()}. La propuesta agrega $ {cost_delta:,} y {delay_days} días; rechazarla implica una reducción de 12 puntos en la calidad final. La obra espera decisión.".replace(",","."))
    return True

def contract_guarantee_roll(project):
    names=CONTRACTOR_NAMES
    index=names.index(project.get("contractor")) if project.get("contractor") in names else 0
    seed=((int(project.get("x",0))+1)*73856093 ^ (int(project.get("y",0))+1)*19349663 ^ (int(project.get("contractedDay",1))+1)*83492791 ^ index*2654435761)&0xffffffff
    return (seed%10000)/10000

def release_contract_guarantee(guarantee):
    finance=state.setdefault("finance",new_finance());escrow=finance.setdefault("contractEscrow",{"balance":0})
    amount=max(0,int(guarantee.get("retained",0)));escrow["balance"]=max(0,int(escrow.get("balance",0))-amount)
    state.setdefault("supply",new_supply())["contractorCash"][guarantee["contractor"]]=state["supply"]["contractorCash"].get(guarantee["contractor"],0)+amount
    guarantee["status"]="released";guarantee["releasedDay"]=state["day"]
    ev("Garantía contractual liberada",f"{guarantee['label']}: inspección de garantía aprobada; se liberaron $ {amount:,} a {guarantee['contractor']}.".replace(",","."))

def advance_contract_guarantees():
    guarantees=state.setdefault("contractGuarantees",[])
    for guarantee in guarantees:
        if guarantee.get("status")=="garantia" and state["day"]>=int(guarantee.get("reviewDay",10**12)):
            if contract_guarantee_roll(guarantee)<float(guarantee.get("defectChance",.1)):
                guarantee["status"]="reclamo";guarantee["defectDay"]=state["day"]
                asset=next((b for b in state.get("buildings",[])+state.get("roadAssets",[]) if b.get("x")==guarantee.get("x") and b.get("y")==guarantee.get("y")),None)
                if asset:asset["quality"]=max(0,int(asset.get("quality",guarantee.get("initialQuality",82)))-12)
                ev("Defecto detectado en garantía",f"{guarantee['label']} en parcela {guarantee['x']+1},{guarantee['y']+1}: la inspección detectó una falla constructiva. La retención queda bloqueada hasta que {guarantee['contractor']} complete cinco días de reparación.")
            else:release_contract_guarantee(guarantee)
        elif guarantee.get("status")=="reparacion" and state["day"]>=int(guarantee.get("repairCompleteDay",10**12)):
            asset=next((b for b in state.get("buildings",[])+state.get("roadAssets",[]) if b.get("x")==guarantee.get("x") and b.get("y")==guarantee.get("y")),None)
            if asset:asset["quality"]=int(guarantee.get("initialQuality",asset.get("quality",82)))
            guarantee["repairedDay"]=state["day"];release_contract_guarantee(guarantee)
    state["contractGuarantees"]=guarantees[-60:]

CONTRACTORS = {
 "Sur Obras": {"price":1.0,"days":38,"quality":.68,"reliability":.70,"capacity":2,"workers":14,"forklifts":1,"unloadWorkers":2,"unloadRate":6,"profile":"Oferta económica · mayor riesgo de demora"},
 "Constructora Delta": {"price":1.18,"days":30,"quality":.82,"reliability":.87,"capacity":3,"workers":24,"forklifts":2,"unloadWorkers":2,"unloadRate":8,"profile":"Equilibrada · cumplimiento estable"},
 "Estudio y Obra Norte": {"price":1.42,"days":25,"quality":.95,"reliability":.94,"capacity":2,"workers":20,"forklifts":2,"unloadWorkers":3,"unloadRate":12,"profile":"Especializada · calidad alta, precio mayor"}}
PROJECTS = {"road":{"label":"Calle local","cost":1200,"days":24,"stageNames":["Proyecto y permisos","Preparación del terreno","Base y drenaje","Pavimentación","Inspección y habilitación"]},"home":{"label":"Vivienda privada","cost":4200,"days":39,"stageNames":["Permiso y financiación","Preparación de parcela","Estructura","Instalaciones y terminaciones","Inspección y ocupación"]},"shop":{"label":"Local comercial","cost":3600,"days":34,"stageNames":["Permiso y financiación","Preparación de parcela","Estructura","Instalaciones y terminaciones","Inspección y habilitación"]},"civic":{"label":"Centro de salud","cost":8000,"days":62,"stageNames":["Anteproyecto y permisos","Licitación y movilización","Cimientos y estructura","Instalaciones y equipamiento","Inspección y habilitación"]},"depot":{"label":"Depósito municipal","cost":5600,"days":50,"stageNames":["Proyecto y permisos","Preparación del terreno","Estructura y playa de carga","Estanterías y seguridad","Inspección y apertura"]},"busGarage":{"label":"Cochera municipal","cost":4200,"days":40,"stageNames":["Proyecto y permisos","Preparación del terreno","Estructura y cubierta","Taller y portones","Inspección y habilitación"]},"busStop":{"label":"Parada de colectivo","cost":950,"days":18,"stageNames":["Proyecto y permisos","Base accesible","Refugio y señalización","Iluminación","Inspección y habilitación"]},"port":{"label":"Terminal portuaria","cost":14500,"days":82,"stageNames":["Permisos costeros y licitación","Pilotaje y muelle","Patio de carga y grúa","Pruebas de atraque","Inspección y apertura"]},"airport":{"label":"Aeropuerto regional","cost":19500,"days":112,"stageNames":["Evaluación y adquisición del suelo","Terraplenado y drenaje","Pista y señalización","Terminal y equipos de seguridad","Pruebas de operación e inspección"]},"hotel":{"label":"Hotel privado","cost":13200,"days":76,"stageNames":["Licencia y capital privado","Cimientos y estructura","Agua y energía","Habitaciones y cocina","Inspección y apertura"]}}
PROJECTS["factory"]={"label":"Procesadora de alimentos","cost":9200,"days":68,"stageNames":["Licencia y capital privado","Cimentación y nave","Maquinaria y servicios","Pruebas de producción","Inspección y apertura"]}
PROJECTS["powerPlant"]={"label":"Central eléctrica","cost":18800,"days":96,"stageNames":["Estudio y permisos","Cimientos y turbina","Conexión eléctrica","Pruebas de generación","Inspección y puesta en marcha"]}
PROJECTS["school"]={"label":"Escuela primaria","cost":9600,"days":68,"stageNames":["Proyecto y permisos","Cimientos y aulas","Instalaciones y patio","Equipamiento y contratación inicial","Inspección y habilitación"]}
PROJECTS["fireStation"]={"label":"Cuartel de bomberos","cost":11200,"days":74,"stageNames":["Proyecto y permisos","Cimientos y estructura","Taller y dormitorios","Equipos y vehículos","Pruebas de despacho e inspección"]}
PROJECTS["waterPlant"]={"label":"Planta potabilizadora","cost":14200,"days":84,"stageNames":["Estudio de fuente y permisos","Captación y filtros","Conexión y bombeo","Pruebas sanitarias","Inspección y puesta en marcha"]}
PROJECTS["wastewaterPlant"]={"label":"Planta depuradora","cost":16600,"days":90,"stageNames":["Estudio ambiental y permisos","Colectores y tanques","Digestores y filtros","Pruebas de calidad","Inspección y puesta en marcha"]}
PROJECTS["landfill"]={"label":"Relleno sanitario municipal","cost":9800,"days":72,"stageNames":["Evaluación ambiental y licitación","Impermeabilización del terreno","Celdas de disposición","Báscula y control de acceso","Inspección y habilitación"]}
PROJECTS["recyclingPlant"]={"label":"Planta de reciclaje","cost":14800,"days":88,"stageNames":["Estudio ambiental y licitación","Separación y clasificación","Línea de lavado","Pruebas de recuperación","Inspección y habilitación"]}
LABOR_NEEDS = {"road":4,"home":6,"shop":7,"factory":12,"civic":11,"school":12,"fireStation":12,"depot":8,"busGarage":6,"busStop":4,"port":14,"airport":16,"hotel":10,"powerPlant":18,"waterPlant":12,"wastewaterPlant":14,"landfill":12,"recyclingPlant":16}

def material_fraction(material, progress):
    # La preparación consume áridos; estructura consume acero/madera; instalaciones consumen componentes.
    start, span = {"aggregate":(0,.45),"concrete":(.08,.42),"steel":(.15,.5),"timber":(.25,.55),"components":(.55,.4)}[material]
    return max(0,min(1,(progress-start)/span))

# Tipologías de equipamiento: el radio se mide por calles conectadas, nunca en línea recta.
SERVICE_MODELS={
 "clinic":{"kind":"civic","label":"Consultorio barrial","cost":8000,"days":62,"radius":6,"jobs":12,"care":True},
 "medicalCenter":{"kind":"civic","label":"Policlínico municipal","cost":14200,"days":85,"radius":10,"jobs":24,"care":True},
 "generalHospital":{"kind":"civic","label":"Hospital general","cost":25500,"days":115,"radius":16,"jobs":40,"care":True,"beds":36,"ambulances":2},
 "policePost":{"kind":"civic","label":"Puesto de vigilancia","cost":9200,"days":64,"radius":6,"jobs":12,"police":1},
 "policeStation":{"kind":"civic","label":"Comisaría distrital","cost":16500,"days":90,"radius":11,"jobs":22,"police":2},
 "policeHQ":{"kind":"civic","label":"Central de seguridad","cost":28700,"days":124,"radius":16,"jobs":36,"police":3},
 "firePost":{"kind":"fireStation","label":"Destacamento de bomberos","cost":11200,"days":74,"radius":7,"jobs":12,"engines":1},
 "fireStationPlus":{"kind":"fireStation","label":"Cuartel de bomberos","cost":19800,"days":96,"radius":12,"jobs":22,"engines":2},
 "fireCommand":{"kind":"fireStation","label":"Comando de emergencias","cost":33000,"days":132,"radius":17,"jobs":36,"engines":3},
 "wasteYard":{"kind":"depot","label":"Base de recolección","cost":5600,"days":50,"radius":6,"jobs":8,"trucks":1},
 "wasteDepot":{"kind":"depot","label":"Centro de transferencia","cost":12000,"days":75,"radius":11,"jobs":14,"trucks":2},
 "wasteComplex":{"kind":"depot","label":"Complejo de higiene urbana","cost":22200,"days":109,"radius":17,"jobs":26,"trucks":3},
}
# Tipologías escolares y enseñanza antigua compatible.
SCHOOL_MODELS={
 "kindergarten":{"kind":"school","label":"Jardín municipal","cost":6200,"days":52,"radius":5,"jobs":8,"classrooms":3,"seatsPerClass":18,"minAge":5,"maxAge":6,"studentsPerTeacher":12,"monthlyCost":580,"supplies":1,"studyLevel":"jardín","skillGain":0},
 "primarySchool":{"kind":"school","label":"Escuela primaria","cost":9600,"days":68,"radius":8,"jobs":12,"classrooms":4,"seatsPerClass":24,"minAge":7,"maxAge":12,"studentsPerTeacher":18,"monthlyCost":820,"supplies":1,"studyLevel":"primaria","skillGain":2},
 "secondarySchool":{"kind":"school","label":"Escuela secundaria","cost":17800,"days":100,"radius":12,"jobs":18,"classrooms":6,"seatsPerClass":24,"minAge":13,"maxAge":17,"studentsPerTeacher":18,"monthlyCost":1550,"supplies":2,"studyLevel":"secundaria","skillGain":3},
 "university":{"kind":"school","label":"Universidad municipal","cost":32000,"days":145,"radius":17,"jobs":30,"classrooms":8,"seatsPerClass":28,"minAge":18,"maxAge":24,"studentsPerTeacher":12,"monthlyCost":3200,"supplies":4,"studyLevel":"universidad","skillGain":5}
}
SERVICE_DEFAULT={"civic":"clinic","fireStation":"firePost","depot":"wasteYard"}
def service_model(building):
    ident=building.get("serviceModel")
    if ident in SERVICE_MODELS:return SERVICE_MODELS[ident]
    if ident in SCHOOL_MODELS:return SCHOOL_MODELS[ident]
    if building.get("kind")=="civic":
        if building.get("name")=="Municipalidad":return None
        if building.get("policeUnit") and not building.get("hospitalWard"):return SERVICE_MODELS["policePost"]
    if building.get("kind")=="school":return SCHOOL_MODELS["primarySchool"]
    return SERVICE_MODELS.get(SERVICE_DEFAULT.get(building.get("kind")))

def service_route_within(building,target,radius=None):
    model=service_model(building)
    radius=int(radius if radius is not None else model.get("radius",6) if model else 0)
    if radius<=0 or building.get("status") not in ("operativo","habilitado"):return None
    path=route_between((building["x"],building["y"]),(target["x"],target["y"]))
    return path if path and max(0,len(path)-1)<=radius else None

def material_plan(kind, initial_progress=0):
    return {key:max(1,round(amount*(1-initial_progress))) if amount else 0
            for key,amount in MATERIAL_NEEDS[kind].items()}

def ensure_business_state():
    shops=[b for b in state["buildings"] if b.get("kind")=="shop"]
    public=[b for b in state["buildings"] if b.get("kind") in ("civic","depot","landfill","recyclingPlant")]
    weights={"shop":1.0,"civic":.8,"school":.8,"depot":.65,"landfill":.65,"recyclingPlant":.8,"port":.85,"airport":.9}
    total_weight=max(.01,sum(weights[b["kind"]] for b in shops+public))
    estimated_slots=max(1,round(state.get("jobs",0)/total_weight))
    for building in shops:
        if "business" not in building:
            building["business"]=new_business(building,estimated_slots,5000)
        firm=building["business"]
        for key,value in new_business(building,firm.get("jobSlots",estimated_slots),firm.get("cash",5000)).items():
            firm.setdefault(key,value)
        firm.setdefault("inputInventory",20)
        firm.setdefault("creditDebt",0)
        firm.setdefault("creditLimit",max(1000,int(firm.get("jobSlots",estimated_slots))*200))
        firm.setdefault("creditRate",.02)
        firm.setdefault("creditDelinquencyMonths",0)
        firm.setdefault("lastCreditDraw",0);firm.setdefault("lastInterest",0);firm.setdefault("lastRepayment",0)
        if firm.get("status")=="cerrado":building["status"]="cerrado"

def ensure_finance_state():
    state.setdefault("finance",new_finance())
    state["finance"].setdefault("municipalLoans",[])
    state["finance"].setdefault("debtReserve",0)
    state["finance"].setdefault("debtReserveHistory",[])
    state["finance"].setdefault("contractEscrow",{"balance":0})
    state.setdefault("contractGuarantees",[])
    budgets=state["finance"].setdefault("programBudgets",new_finance()["programBudgets"])
    for key,value in new_finance()["programBudgets"].items():budgets.setdefault(key,value.copy() if isinstance(value,dict) else value)
    for name in ("services","mobility","networks"):
        budgets["arrears"].setdefault(name,0);budgets["underfundedMonths"].setdefault(name,0)
    bank=state["finance"].setdefault("businessBank",new_finance()["businessBank"])
    for key,value in new_finance()["businessBank"].items():bank.setdefault(key,value)

def ensure_resident_roster():
    for home in (b for b in state["buildings"] if b.get("kind")=="home"):
        members=home.setdefault("residents",[]);home.setdefault("householdCash",0);home.setdefault("monthlyWageIncome",0)
        eligible_target=round(max(0,home.get("occupants",0))*.42)
        eligible_now=sum(1 for person in members if person.get("workerEligible"))
        while len(members)<max(0,home.get("occupants",0)):
            eligible=eligible_now<eligible_target
            person={"id":uuid.uuid4().hex,"workerEligible":eligible,"status":"buscando" if eligible else "inactivo",
                    "employerId":None,"employerName":None,"monthlyWage":0,"attendance":0,
                    "unemployedSinceDay":state.get("day",1) if eligible else None,"unemploymentReason":"primer empleo" if eligible else None}
            members.append(person)
            if eligible:eligible_now+=1
        if len(members)>home.get("occupants",0):del members[home["occupants"]:]
        for person in members:
            person.setdefault("previousEmployer",None);person.setdefault("previousEmployerId",None)
            person.setdefault("lastUnemploymentDurationDays",None);person.setdefault("unemploymentEpisodes",0)
            if person.get("workerEligible"):
                ensure_person_work_profile(person)
                person.setdefault("unemployedSinceDay",state.get("day",1) if person.get("status")!="empleado" else None)
                person.setdefault("unemploymentReason","búsqueda general" if person.get("status")!="empleado" else None)

def ensure_supply_state():
    legacy_version=state.get("version",1)
    state["version"]=max(52,state.get("version",1))
    ensure_tax_state()
    state.setdefault("roadAssets",[])
    state.setdefault("roadMaintenancePct",100)
    state.setdefault("recoveryNeeds",[])
    state.setdefault("recoveryContracts",[])
    state.setdefault("education",{"lastProcessedMonth":(state.get("day",1)-1)//30})
    state.setdefault("health",{"lastAdvancedDay":None,"lastImpactMonth":-1,"waterSafetyHistory":{}})
    state.setdefault("trainingPrograms",[])
    state.setdefault("fireService",{"incidents":[],"lastGeneratedMonth":-1,"dispatches":0,"resolved":0,"unanswered":0})
    state.setdefault("busRoutes",[])
    state.setdefault("housingDemand",{"unmet":0,"lastGenerated":0,"lastFilled":0})
    state.setdefault("localIndustry",{"unitsProduced":0,"unitsSold":0,"unitsImported":0,"history":[]})
    ensure_heritage_state()
    ensure_urban_evolution_state()
    state.setdefault("regionalMarket",{"history":[],"lastReport":{}});state["regionalMarket"].setdefault("history",[]);state["regionalMarket"].setdefault("lastReport",{});state.setdefault("regionalMarketReport",state["regionalMarket"]["lastReport"]);state.setdefault("privateInvestments",{"proposal":None,"history":[],"nextOfferDay":state.get("day",1),"reason":"Los inversores esperan ventas regionales sin cubrir y una parcela comercial conectada."});state["privateInvestments"].setdefault("proposal",None);state["privateInvestments"].setdefault("history",[]);state["privateInvestments"].setdefault("nextOfferDay",state.get("day",1));state["privateInvestments"].setdefault("reason","Esperando condiciones de inversión.")
    ensure_government_state()
    state["version"]=max(60,int(state.get("version",1)))
    for building in state["buildings"]:
        ensure_critical_inspection_schedule(building)
        if building.get("kind")=="civic":building.setdefault("jobSlots",12)
        if building.get("kind")=="school":building.setdefault("jobSlots",12);building.setdefault("classrooms",4)
        if building["kind"]=="home":
            building.setdefault("capacity",max(building.get("occupants",0),round(building.get("occupants",0)*1.15)))
    supply=state.setdefault("supply",new_supply())
    supply.setdefault("regional",INITIAL_REGIONAL_STOCK.copy())
    supply.setdefault("contractors",{})
    supply.setdefault("contractorCash",CONTRACTOR_CASH.copy())
    supply.setdefault("suppliers",{name:stock.copy() for name,stock in SUPPLIER_STOCK.items()})
    supply.setdefault("orders",[])
    supply.setdefault("market",new_market_supply())
    supply.setdefault("marketOrders",[])
    supply.setdefault("tradeContracts",[])
    supply.setdefault("portOrders",[])
    supply.setdefault("portVoyages",[])
    for name,values in new_market_supply().items():
        supplier=supply["market"].setdefault(name,values)
        for key,value in values.items():supplier.setdefault(key,value)
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
    ensure_finance_state()
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
    assigned=sum(p["contractor"]==name and p.get("status")!="pausada" for p in state["projects"])
    assigned+=sum(p.get("contractor")==name and p.get("status")=="en obra" for p in state.get("recoveryContracts",[]))
    assigned+=sum(g.get("contractor")==name and g.get("status")=="reparacion" for g in state.get("contractGuarantees",[]))
    assigned+=sum(b.get("industrialRecovery",{}).get("contractor")==name and b.get("industrialRecovery",{}).get("status")=="en obra" for b in state.get("buildings",[]))
    return assigned<CONTRACTORS[name]["capacity"]

def contractor_free_workers(name):
    assigned=sum(p.get("workersAssigned",0 if p.get("status")=="pausada" else LABOR_NEEDS[p["kind"]])
                 for p in state["projects"] if p["contractor"]==name)
    assigned+=sum(p.get("workers",4) for p in state.get("recoveryContracts",[]) if p.get("contractor")==name and p.get("status")=="en obra")
    assigned+=sum(b.get("industrialRecovery",{}).get("workersAssigned",5) for b in state.get("buildings",[]) if b.get("industrialRecovery",{}).get("contractor")==name and b.get("industrialRecovery",{}).get("status")=="en obra")
    assigned+=sum(g.get("workersAssigned",3) for g in state.get("contractGuarantees",[]) if g.get("contractor")==name and g.get("status")=="reparacion")
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
    condition={(a.get("x"),a.get("y")):float(a.get("quality",82)) for a in state.get("roadAssets",[])}
    roads={tuple(r) for r in state["roads"] if condition.get(tuple(r),82)>=25}
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

def build_waste_collection_routes(containers,depots,facilities):
    trucks=[] # Un camión requiere su base municipal construida.
    for i,depot in enumerate(depots):
        for vehicle in range(max(1,int((service_model(depot) or {}).get("trucks",1)))):
            trucks.append({"id":f"depot-{depot['x']}-{depot['y']}-{vehicle}","name":f"Camión de {depot.get('name','base')} #{vehicle+1}","start":{"x":depot["x"],"y":depot["y"]},"depot":depot,"bins":[]})
    for index,truck in enumerate(trucks):truck["payloadTons"]=.75
    for container in sorted(containers,key=lambda c:(c.get("y",0),c.get("x",0))):
        options=[]
        for index,truck in enumerate(trucks):
            if len(truck["bins"])*.15>=truck["payloadTons"]-.001:continue
            origin=truck["bins"][-1] if truck["bins"] else truck["start"]
            path=route_between((origin["x"],origin["y"]),(container["x"],container["y"]))
            if path and service_route_within(truck["depot"],container):options.append((len(path)+len(truck["bins"])*5,index))
        if options:
            _,index=min(options);trucks[index]["bins"].append(container)
    routes=[]
    for truck in trucks:
        start=truck["start"];destination=truck["depot"]
        if destination is None:
            destination=min(depots,key=lambda b:len(route_between((4,10),(b["x"],b["y"])) or [0])) if depots else None
        if destination is None and facilities:
            reachable=[(len(route_between((4,10),(b["x"],b["y"])) or []),b) for b in facilities]
            reachable=[row for row in reachable if row[0]>0]
            if reachable:destination=min(reachable,key=lambda row:row[0])[1]
        path=[];stops=[];current=start
        for container in truck["bins"]:
            segment=route_between((current["x"],current["y"]),(container["x"],container["y"]))
            if not segment:continue
            path.extend(segment if not path else segment[1:]);stops.append({"kind":"container","x":container["x"],"y":container["y"],"id":container.get("id",f"bin-{container['x']}-{container['y']}")});current=container
        if destination:
            segment=route_between((current["x"],current["y"]),(destination["x"],destination["y"]))
            if segment:path.extend(segment if not path else segment[1:]);stops.append({"kind":"transfer" if destination.get("kind")=="depot" else "disposal","x":destination["x"],"y":destination["y"],"name":destination.get("name","Destino final")});current=destination
        back=route_between((current["x"],current["y"]),(start["x"],start["y"]))
        if back:path.extend(back if not path else back[1:])
        if truck["bins"] and destination is None:stops.append({"kind":"base","x":start["x"],"y":start["y"],"name":"Base municipal"})
        bin_ids={stop["id"] for stop in stops if stop["kind"]=="container"}
        routes.append({"id":truck["id"],"name":truck["name"],"payloadTons":truck["payloadTons"],"path":path,"stops":stops,"containerIds":sorted(bin_ids),"distanceTiles":max(0,len(path)-1),"reachable":len(path)>1 and bool(stops),"destination":stops[-1]["kind"] if stops else "sin destino"})
    return routes

def ensure_utility_state():
    utilities=state.setdefault("utilities",{})
    roads=[list(point) for point in state.get("roads",[])]
    utilities.setdefault("powerLines",roads.copy())
    utilities.setdefault("failures",[])
    utilities.setdefault("waterPipes",roads.copy())
    utilities.setdefault("sewerLines",[list(point) for point in utilities.get("waterPipes",roads)])
    utilities.setdefault("baseWastewaterTreatmentM3Day",180)
    utilities.setdefault("drainLines",[list(point) for point in utilities.get("sewerLines",roads)])
    utilities.setdefault("gasLines",roads.copy())
    utilities.setdefault("telecomLines",roads.copy())
    utilities.setdefault("baseGasCapacityM3Day",240)
    utilities.setdefault("baseTelecomCapacityMbps",500)
    utilities.setdefault("baseDrainageCapacityM3Day",3300)
    utilities.setdefault("basePowerCapacityKw",1200)
    utilities.setdefault("baseWaterCapacityM3Day",180)
    utilities.setdefault("powerLossRate",.06)
    utilities.setdefault("waterLeakRate",.08)
    utilities.setdefault("maintenanceFundingFactor",1)
    return utilities

def energized_utility_tiles(network):
    utilities=ensure_utility_state();key={"power":"powerLines","water":"waterPipes","sewer":"sewerLines","drainage":"drainLines","gas":"gasLines","telecom":"telecomLines"}.get(network,"waterPipes")
    failed={(f.get("x"),f.get("y")) for f in utilities.get("failures",[]) if f.get("status")!="reparada" and f.get("network")==network}
    lines={tuple(point) for point in utilities.get(key,[]) if tuple(point) not in failed};source=(4,10)
    if source not in lines:return set()
    connected={source};queue=[source]
    for x,y in queue:
        for neighbor in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if neighbor in lines and neighbor not in connected:connected.add(neighbor);queue.append(neighbor)
    return connected

def utility_building_connected(building,network):
    tiles=energized_utility_tiles(network)
    return any((building.get("x",-99)+dx,building.get("y",-99)+dy) in tiles for dx,dy in ((0,0),(1,0),(-1,0),(0,1),(0,-1)))

def facility_capacity_factor(building):
    """Condition 82% is the commissioned baseline; structural wear reduces plant output."""
    factor=max(0,min(1,float(building.get("quality",82))/82))
    building["functionalCapacityPct"]=round(factor*100)
    return factor

def utility_condition_report():
    utilities=ensure_utility_state();conditions=utilities.setdefault("lineConditions",{})
    line_keys={"power":"powerLines","water":"waterPipes","sewer":"sewerLines","drainage":"drainLines","gas":"gasLines","telecom":"telecomLines"}
    report={}
    for network,key in line_keys.items():
        values=[max(0,min(100,float(conditions.get(f"{network}:{x}:{y}",82)))) for x,y in utilities.get(key,[])]
        report[network]={"segments":len(values),"averageCondition":round(sum(values)/max(1,len(values)),1),"criticalSegments":sum(q<40 for q in values),"minimumCondition":round(min(values),1) if values else 100}
    return report

def advance_utility_line_conditions(funding_factor):
    utilities=ensure_utility_state();conditions=utilities.setdefault("lineConditions",{})
    line_keys={"power":"powerLines","water":"waterPipes","sewer":"sewerLines","drainage":"drainLines","gas":"gasLines","telecom":"telecomLines"}
    names={"power":"electricidad","water":"agua potable","sewer":"cloacas","drainage":"drenaje pluvial","gas":"gas","telecom":"fibra óptica"}
    bases={"power":720,"water":640,"sewer":690,"drainage":690,"gas":580,"telecom":460}
    funded=max(0,min(1,float(funding_factor)));created=[]
    for network,key in line_keys.items():
        lines=utilities.get(key,[]);risks=[];connected=energized_utility_tiles(network)
        current_buildings=[b for b in state.get("buildings",[]) if utility_building_connected(b,network)]
        for x,y in lines:
            nearby=sum(1 for b in state.get("buildings",[]) if abs(b.get("x",-99)-x)+abs(b.get("y",-99)-y)<=1)
            load=1+min(4,nearby*.5)
            asset_key=f"{network}:{x}:{y}"
            quality=max(0,min(100,float(conditions.get(asset_key,82))))
            quality=max(0,min(100,quality-(.08+load*.03)+.18*funded))
            conditions[asset_key]=round(quality,1)
            if quality<25:
                alternate=set(connected);alternate.discard((x,y));source=(4,10)
                reached={source} if source in alternate else set();queue=list(reached)
                for a,b in queue:
                    for neighbor in ((a+1,b),(a-1,b),(a,b+1),(a,b-1)):
                        if neighbor in alternate and neighbor not in reached:reached.add(neighbor);queue.append(neighbor)
                lost=sum(1 for building in current_buildings if not any((building.get("x",-99)+dx,building.get("y",-99)+dy) in reached for dx,dy in ((0,0),(1,0),(-1,0),(0,1),(0,-1))))
                risks.append((lost,quality,x,y))
        active={(f.get("network"),f.get("x"),f.get("y")) for f in utilities.get("failures",[]) if f.get("status")!="reparada"}
        risks=[r for r in risks if (network,r[2],r[3]) not in active]
        if risks:
            lost,quality,x,y=sorted(risks,key=lambda r:(-r[0],r[1],r[3],r[2]))[0]
            cost=round(bases[network]*(1+(25-quality)/50))
            failure={"id":uuid.uuid4().hex,"network":network,"x":x,"y":y,"day":state.get("day",1),"reason":"Desgaste por mantenimiento insuficiente","repairCost":cost,"affectedBuildings":lost,"status":"avería","remainingDays":0}
            utilities.setdefault("failures",[]).append(failure);created.append(failure)
            impact=f"Se interrumpió el suministro a {lost} edificios." if lost else "Las rutas alternativas mantienen el suministro, pero el tramo quedó fuera de servicio."
            ev("Avería por desgaste de red",f"El tramo de {names[network]} en calle {x+1},{y+1} falló tras acumular desgaste. {impact} Repararlo cuesta $ {cost} y requiere una cuadrilla.")
    utilities["lineConditionReport"]=utility_condition_report()
    return utilities["lineConditionReport"],created

def ensure_waste_state():
    waste=state.setdefault("waste",{})
    waste.setdefault("baseCollectionTonsDay",1.15)
    waste.setdefault("baseLandfillCapacityTons",900)
    waste.setdefault("landfillStoredTons",0)
    waste.setdefault("uncollectedTons",0)
    waste.setdefault("lastCollectionTons",0)
    waste.setdefault("lastWasteImpactDay",0)
    waste.setdefault("lastRecycledTonsDay",0)
    waste.setdefault("transferStoredTons",0)
    waste.setdefault("containers",[])
    waste.setdefault("routes",[])
    waste.setdefault("fundingFactor",1)
    return waste

def calculate_waste_balance(advance=False,apply_effects=False):
    waste=ensure_waste_state();buildings=state.get("buildings",[])
    population=max(0,state.get("population",0))
    household=population*.00115
    businesses=sum(max(1,b.get("business",{}).get("lastWorkers",round(b.get("business",{}).get("jobSlots",0)*.55)))*.00115 for b in buildings if b.get("kind")=="shop" and b.get("business",{}).get("status")!="cerrado")
    public_staff=sum(max(0,w.get("workersAssigned",0)) for w in state.get("workplaces",[]) if w.get("kind") in ("civic","school","fireStation","depot","landfill","recyclingPlant","port","airport","powerPlant","waterPlant","wastewaterPlant"))
    public=public_staff*.00075
    visitors=sum(max(0,b.get("monthlyGuests",0)) for b in buildings if b.get("kind")=="hotel")/30*.0015
    generated=household+businesses+public+visitors
    active_depot_buildings=[b for b in buildings if b.get("kind")=="depot" and b.get("status","habilitado") not in ("cerrado","abandonado") and route_between((4,10),(b.get("x",0),b.get("y",0)))]
    active_depots=len(active_depot_buildings)
    trucks=sum(int((service_model(b) or {}).get("trucks",1)) for b in active_depot_buildings)
    containers=waste.setdefault("containers",[])
    facilities=[b for b in buildings if b.get("kind") in ("landfill","recyclingPlant") and b.get("status","habilitado") not in ("cerrado","abandonado")]
    routes=build_waste_collection_routes(containers,active_depot_buildings,facilities)
    collection_factor=max(0,min(1,float(waste.get("fundingFactor",1))))
    for route in routes:route["payloadTons"]*=collection_factor
    waste["routes"]=routes
    routed_by_id={container_id:route for route in routes if route["reachable"] for container_id in route["containerIds"]}
    routed_bin_ids=set(routed_by_id)
    for container in containers:container["routeId"]=routed_by_id.get(container.get("id",f"bin-{container['x']}-{container['y']}"),{}).get("id")
    households=[b for b in buildings if b.get("kind")=="home" and b.get("occupants",0)>0]
    reachable_people=sum(max(0,int(h.get("occupants",0))) for h in households if any(service_route_within(d,h) for d in active_depot_buildings))
    covered_ratio=reachable_people/max(1,sum(max(0,int(h.get("occupants",0))) for h in households))
    collection_capacity=(trucks*.75*covered_ratio+len(routed_bin_ids)*.15)*collection_factor
    transfer_capacity=active_depots*12
    transfer_dispatch=active_depots*1.5
    landfills=[b for b in buildings if b.get("kind")=="landfill" and b.get("status","habilitado") not in ("cerrado","abandonado")]
    recyclers=[b for b in buildings if b.get("kind")=="recyclingPlant" and b.get("status","habilitado") not in ("cerrado","abandonado") and route_between((4,10),(b.get("x",0),b.get("y",0))) and utility_building_connected(b,"power") and utility_building_connected(b,"water")]
    recycling_capacity=sum(max(0,b.get("processingTonsDay",1.25)) for b in recyclers)
    landfill_capacity=waste["baseLandfillCapacityTons"]+sum(max(0,b.get("capacityAdded",1800)) for b in landfills)
    if advance:
        backlog=max(0,waste.get("uncollectedTons",0));stored=max(0,waste.get("landfillStoredTons",0))
        transfer_stored=max(0,waste.get("transferStoredTons",0))
        routed_by_id={container_id:route for route in routes if route["reachable"] for container_id in route["containerIds"]}
        per_bin=min(.15,generated/max(1,len(containers))) if containers else 0
        bin_generation=0;bin_overflow=0;bin_picked=0
        route_load={route["id"]:0.0 for route in routes}
        for container in containers:
            container_id=container.get("id",f"bin-{container['x']}-{container['y']}")
            container["id"]=container_id
            container["storedTons"]=max(0,float(container.get("storedTons",0)))
            incoming=per_bin;bin_generation+=incoming
            capacity=max(.15,float(container.get("capacityTons",2)))
            overflow=max(0,container["storedTons"]+incoming-capacity)
            container["storedTons"]=min(capacity,container["storedTons"]+incoming)
            route=routed_by_id.get(container_id);picked=0
            if route:
                room=max(0,route.get("payloadTons",.75)-route_load[route["id"]])
                picked=min(container["storedTons"],.15,room)
                route_load[route["id"]]+=picked;container["storedTons"]=round(container["storedTons"]-picked,3)
            container["lastPickedTons"]=round(picked,3);container["routeId"]=route["id"] if route else None
            bin_picked+=picked;bin_overflow+=overflow
        curb_generated=max(0,generated-bin_generation)
        curb_capacity=trucks*.75*covered_ratio*collection_factor
        curb_picked=min(backlog+curb_generated,curb_capacity)
        picked=curb_picked+bin_picked
        accepted=min(picked,max(0,transfer_capacity-transfer_stored)) if active_depots else picked
        if active_depots:
            waste["transferStoredTons"]=round(transfer_stored+accepted,3)
            dispatched=min(waste["transferStoredTons"],transfer_dispatch)
            available_downstream=dispatched
        else:
            waste["transferStoredTons"]=0;available_downstream=accepted
        recycled=min(available_downstream*.35,recycling_capacity)
        disposed=min(max(0,available_downstream-recycled),max(0,landfill_capacity-stored))
        processed=recycled+disposed
        if active_depots:waste["transferStoredTons"]=round(max(0,waste["transferStoredTons"]-processed),3)
        remaining_curb=max(0,backlog+curb_generated-curb_picked)
        waste["uncollectedTons"]=round(remaining_curb+bin_overflow+max(0,picked-accepted)+(0 if active_depots else max(0,available_downstream-processed)),3)
        waste["landfillStoredTons"]=round(stored+disposed,3)
        waste["lastCollectionTons"]=round(processed,3)
        waste["lastRouteCollectedTons"]=round(bin_picked,3)
        waste["lastBinOverflowTons"]=round(bin_overflow,3)
        waste["lastRecycledTonsDay"]=round(recycled,3)
        waste["scrapSteelTons"]=round(max(0,waste.get("scrapSteelTons",0))+recycled*.2,3)
    backlog=max(0,waste.get("uncollectedTons",0));stored=max(0,waste.get("landfillStoredTons",0))
    backlog=max(0,waste.get("uncollectedTons",0));stored=max(0,waste.get("landfillStoredTons",0))
    roads=sorted(state.get("roads",[]),key=lambda p:(p[1],p[0]));pile_count=min(18,math.ceil(backlog/1.5))
    litter_tiles=[list(roads[(i*max(1,len(roads)//max(1,pile_count)))%len(roads)]) for i in range(pile_count)] if roads and pile_count else []
    collected=waste.get("lastCollectionTons",0);recycled=waste.get("lastRecycledTonsDay",0)
    operating=round(trucks*160+len(landfills)*420+len(recyclers)*650+collected*30*7.5)
    recycling_income=round(recycled*30*18)
    report={"generatedTonsDay":round(generated,3),"householdTonsDay":round(household,3),"businessTonsDay":round(businesses,3),"publicTonsDay":round(public,3),"visitorTonsDay":round(visitors,3),"collectedTonsDay":round(collected,3),"collectionCapacityTonsDay":round(collection_capacity,2),"activeTrucks":trucks,"landfillStoredTons":round(stored,1),"landfillCapacityTons":round(landfill_capacity,1),"landfillRemainingTons":round(max(0,landfill_capacity-stored),1),"landfillFillPct":round(min(100,stored/max(1,landfill_capacity)*100)),"uncollectedTons":round(backlog,1),"litterTiles":litter_tiles,"landfills":len(landfills),"activeDepots":active_depots,"transferStoredTons":round(waste.get("transferStoredTons",0),1),"transferCapacityTons":round(transfer_capacity,1),"transferDispatchTonsDay":round(transfer_dispatch,2),"containers":len(containers),"recyclingPlants":len(recyclers),"recyclingCapacityTonsDay":round(recycling_capacity,2),"recycledTonsDay":round(recycled,3),"recyclingRevenueMonth":recycling_income,"routeCount":sum(r["reachable"] for r in routes),"routeContainersServed":len(routed_bin_ids),"routeContainersUnserved":max(0,len(containers)-len(routed_bin_ids)),"routeDistanceTiles":sum(r["distanceTiles"] for r in routes if r["reachable"]),"routeCollectedTons":round(waste.get("lastRouteCollectedTons",0),3),"containerStoredTons":round(sum(c.get("storedTons",0) for c in containers),2),"monthlyOperatingCost":operating,"routes":[{"id":r["id"],"name":r["name"],"reachable":r["reachable"],"stops":len(r["containerIds"]),"distanceTiles":r["distanceTiles"],"destination":r["destination"]} for r in routes]}
    waste["report"]=report
    if apply_effects and state.get("day",0)%30==0 and waste.get("lastWasteImpactDay")!=state.get("day"):
        threshold=max(8,population*.035)
        if backlog>=threshold:
            state["services"]=max(0,state.get("services",0)-1)
            if backlog>=max(30,population*.12):state["approval"]=max(0,state.get("approval",0)-1)
            if state.get("day",0)-waste.get("lastWasteNoticeDay",-999)>=30:
                ev("Recolección de residuos insuficiente",f"Quedaron {backlog:.1f} toneladas sin retirar. Flota: {trucks} camiones · capacidad de recolección {collection_capacity:.2f} t/día. La suciedad acumulada afecta los servicios municipales.".replace(".",","))
                waste["lastWasteNoticeDay"]=state.get("day",0)
        elif stored>=landfill_capacity:
            if state.get("day",0)-waste.get("lastLandfillNoticeDay",-999)>=30:
                ev("Relleno sanitario agotado","La disposición final alcanzó su capacidad física. La carga no recolectada permanece en la ciudad hasta ampliar la infraestructura.")
                waste["lastLandfillNoticeDay"]=state.get("day",0)
        waste["lastWasteImpactDay"]=state.get("day",0)
    return report

def ensure_climate_state():
    climate=state.setdefault("climate",{})
    climate.setdefault("region","Costa templada de Puerto Claro")
    climate.setdefault("forecast",None)
    climate.setdefault("preparedForDay",None)
    climate.setdefault("heatForecast",None)
    climate.setdefault("droughtForecast",None)
    climate.setdefault("coolingPreparedForDay",None)
    climate.setdefault("waterRestrictionsTarget",None)
    climate.setdefault("waterRestrictions",False)
    return climate

def climate_year_targets(day):
    year_start=((max(1,int(day))-1)//360)*360+1
    heat_day=year_start+24
    drought_day=year_start+45
    if day>=heat_day+5:heat_day+=360
    if day>=drought_day+30:drought_day+=360
    return heat_day,drought_day

def heat_exposure(x,y):
    roads={tuple(p) for p in state.get("roads",[])}
    occupied=roads|{(b.get("x"),b.get("y")) for b in state.get("buildings",[])}|{(p.get("x"),p.get("y")) for p in state.get("projects",[])}
    shade=0
    for tx in range(max(1,x-1),min(22,x+1)+1):
        for ty in range(max(1,y-1),min(18,y+1)+1):
            if (tx,ty) in occupied or tx>=24 or (ty<3 and tx>18):continue
            value=math.sin((tx*97+ty*53)*127.1+78.233)*43758.5453
            if value-math.floor(value)<=.27:shade+=1
    terrain=(math.sin(x*.47+y*.19)+math.cos(y*.42-x*.17)+math.sin((x+y)*.31))/3
    exposure=max(.65,min(1.5,1.35-min(5,shade)*.1+(0.12 if terrain<-.48 else 0)))
    return round(exposure,2),shade

def apply_climate_impacts():
    climate=ensure_climate_state();day=state.get("day",1);heat_day,drought_day=climate_year_targets(day)
    forecast=climate.get("heatForecast")
    if forecast and day==forecast.get("targetDay") and forecast.get("status")=="pronosticada":
        expected=max(0,int(forecast.get("expectedHealthCases",0)));centers=[]
        try:workplaces=commute_model().get("workplaces",[])
        except Exception:workplaces=[]
        for building in state.get("buildings",[]):
            if building.get("kind")!="civic" or building.get("status") in ("cerrado","abandonado"):continue
            workplace=next((w for w in workplaces if w.get("x")==building.get("x") and w.get("y")==building.get("y") and w.get("staffedJobs",0)>=2),None)
            if workplace and building.get("utilityAccess",{}).get("powerServedPct",0)>=75 and route_between((4,10),(building["x"],building["y"])):centers.append({"name":building.get("name","Centro municipal"),"x":building["x"],"y":building["y"],"capacity":min(100,max(40,workplace["staffedJobs"]*2))})
        cooling_active=climate.get("coolingPreparedForDay")==day
        shelter_capacity=sum(c["capacity"] for c in centers) if cooling_active else 0
        sheltered=min(expected,shelter_capacity)
        actual=max(0,expected-round(sheltered*.72))
        forecast.update({"status":"ocurrida","actualHealthCases":actual,"shelteredResidents":sheltered,"shelterCapacity":shelter_capacity,"coolingCenters":centers if cooling_active else []})
        if actual:
            if actual>=max(8,round(state.get("population",0)*.012)):state["services"]=max(0,state.get("services",0)-1)
            if actual>=max(25,round(state.get("population",0)*.05)):state["approval"]=max(0,state.get("approval",0)-1)
        ev("Ola de calor · balance sanitario",f"El episodio dejó {actual} consultas estimadas por estrés térmico; {sheltered} residentes tuvieron refugio con electricidad y personal. Exposición prevista: {forecast.get('exposedPopulation',0)} personas en {len(forecast.get('exposedHomes',[]))} sectores.")
    drought=climate.get("droughtForecast")
    if drought and day==drought.get("targetDay") and drought.get("status")=="pronosticada":
        drought.update({"status":"activa","endDay":day+30})
        ev("Sequía regional · fuente reducida",f"La estación seca reduce 45% la captación de agua durante 30 días. Capacidad útil prevista: {drought.get('effectiveCapacityM3Day',0)} m³/día frente a demanda de {drought.get('expectedDemandM3Day',0)} m³/día. La restricción comercial o los camiones cisterna pueden aliviar la red.")
    if drought and drought.get("status")=="activa" and day>=drought.get("endDay",day):
        drought["status"]="finalizada";ev("Fin de la sequía regional","La captación de agua recuperó su capacidad estacional normal.")
    if drought and drought.get("status")=="activa" and day-climate.get("lastDroughtImpactDay",-99)>=10:
        exposed=sum(b.get("occupants",0)*(1-b.get("utilityAccess",{}).get("waterServedPct",0)/100) for b in state.get("buildings",[]) if b.get("kind")=="home")
        drought["residentsWithoutFullWaterService"]=round(exposed)
        if exposed>=max(20,state.get("population",0)*.08):
            state["services"]=max(0,state.get("services",0)-1)
            if exposed>=max(50,state.get("population",0)*.2):state["approval"]=max(0,state.get("approval",0)-1)
            ev("Estrés de agua en hogares",f"La sequía dejó a {round(exposed)} residentes con cobertura incompleta. La capacidad de captación y las restricciones determinan cuánto dura el déficit.")
        climate["lastDroughtImpactDay"]=day

def calculate_utility_balance(apply_effects=False):
    utilities=ensure_utility_state();climate=ensure_climate_state()
    buildings=[b for b in state.get("buildings",[]) if b.get("kind") in ("home","shop","factory","civic","school","fireStation","depot","landfill","recyclingPlant","busGarage","port","airport","hotel","powerPlant","waterPlant","wastewaterPlant") and b.get("status","habilitado") not in ("cerrado","abandonado")]
    month=((state.get("day",1)-1)//30)%12
    summer=month in (11,0,1)
    day=state.get("day",1);heat_day,drought_day=climate_year_targets(day)
    heat_active=heat_day<=day<heat_day+5;drought_active=drought_day<=day<drought_day+30
    restrictions_active=bool(climate.get("waterRestrictions") and climate.get("waterRestrictionsTarget")==drought_day)
    seasonal_power=(1.1 if summer else 1.0)*(1.22 if heat_active else 1.0)
    seasonal_water=(1.12 if summer else 1.0)*(1.18 if heat_active else 1.0)
    def demand(building):
        kind=building.get("kind");occupants=max(0,building.get("occupants",0));firm=building.get("business",{})
        workers=max(1,firm.get("lastWorkers",round(firm.get("jobSlots",0)*.55)))
        if kind=="home":return occupants*.72*seasonal_power,occupants*.12*seasonal_water
        if kind in ("shop","factory"):return workers*(1.1 if kind=="factory" else 1.35)*seasonal_power,workers*.08*seasonal_water
        if kind=="hotel":return building.get("beds",48)*1.25*seasonal_power,building.get("beds",48)*.09*seasonal_water
        if kind in ("civic","school","fireStation"):return 32*seasonal_power,14*seasonal_water
        if kind=="depot":return 12*seasonal_power,4*seasonal_water
        if kind=="busGarage":return 18*seasonal_power,2*seasonal_water
        if kind=="port":return 85*seasonal_power,32*seasonal_water
        if kind=="airport":return 165*seasonal_power,38*seasonal_water
        if kind=="powerPlant":return 38*seasonal_power,5*seasonal_water
        if kind=="wastewaterPlant":return 28*seasonal_power,8*seasonal_water
        if kind=="landfill":return 18*seasonal_power,3*seasonal_water
        if kind=="recyclingPlant":return 32*seasonal_power,6*seasonal_water
        return 22*seasonal_power,4*seasonal_water
    for building in buildings:
        kw,m3=demand(building)
        kind=building.get("kind")
        if restrictions_active and kind in ("shop","hotel","port","airport"):m3*=.65
        occupants=max(0,building.get("occupants",0));firm=building.get("business",{})
        workers=max(1,firm.get("lastWorkers",round(firm.get("jobSlots",0)*.55)))
        gas=occupants*.025 if kind=="home" else workers*.11 if kind in ("shop","factory") else 4 if kind in ("hotel","airport","port") else 1
        telecom=occupants*.018 if kind=="home" else workers*.035 if kind in ("shop","factory","civic","school","hotel","airport","port") else .2
        building["utilityDemand"]={"powerKw":round(kw,1),"waterM3Day":round(m3,1),"gasM3Day":round(gas,2),"telecomMbps":round(telecom,2)}
        building["utilityAccess"]={"powerConnected":utility_building_connected(building,"power"),"waterConnected":utility_building_connected(building,"water"),"sewerConnected":utility_building_connected(building,"sewer"),"gasConnected":utility_building_connected(building,"gas"),"telecomConnected":utility_building_connected(building,"telecom"),"gasServedPct":0,"telecomServedPct":0,"powerServedPct":0,"waterServedPct":0,"wastewaterTreatedPct":0}
    power_tiles=energized_utility_tiles("power");water_tiles=energized_utility_tiles("water");sewer_tiles=energized_utility_tiles("sewer")
    generation=sum(b.get("generationKw",900)*facility_capacity_factor(b) for b in buildings if b.get("kind")=="powerPlant" and utility_building_connected(b,"power") and utility_building_connected(b,"water"))
    potable=sum(b.get("treatmentM3Day",220)*facility_capacity_factor(b) for b in buildings if b.get("kind")=="waterPlant" and utility_building_connected(b,"power") and utility_building_connected(b,"water"))
    wastewater=sum(b.get("treatmentM3Day",260)*facility_capacity_factor(b) for b in buildings if b.get("kind")=="wastewaterPlant" and all(utility_building_connected(b,n) for n in ("power","water","sewer")))
    maintenance_factor=max(0,min(1,float(utilities.get("maintenanceFundingFactor",1))))
    power_capacity=(utilities["basePowerCapacityKw"]+generation)*maintenance_factor
    source_water_capacity=(utilities["baseWaterCapacityM3Day"]+potable)*maintenance_factor
    tanker_capacity=30 if climate.get("waterTankerStart",day+1)<=day<climate.get("waterTankerUntil",0) else 0
    water_capacity=source_water_capacity*(.55 if drought_active else 1.0)+tanker_capacity
    power_usable=power_capacity*(1-utilities["powerLossRate"])
    water_usable=water_capacity*(1-utilities["waterLeakRate"])
    def allocate(network,usable,key,pct_key):
        connected=[b for b in buildings if b["utilityAccess"][f"{network}Connected"]]
        total=sum(b["utilityDemand"][key] for b in buildings)
        connected_demand=sum(b["utilityDemand"][key] for b in connected)
        remaining=usable;delivered=0
        priorities=("civic","school","fireStation","home","powerPlant","waterPlant","wastewaterPlant","recyclingPlant","shop","hotel","airport","port","depot","busGarage")
        for kind in priorities:
            group=[b for b in connected if b.get("kind")==kind];need=sum(b["utilityDemand"][key] for b in group)
            fraction=min(1,max(0,remaining/need)) if need else 1
            for b in group:b["utilityAccess"][pct_key]=round(fraction*100)
            spent=need*fraction;remaining=max(0,remaining-spent);delivered+=spent
        return total,connected_demand,delivered
    power_total,power_connected,power_delivered=allocate("power",power_usable,"powerKw","powerServedPct")
    critical_backup=[b for b in buildings if b.get("kind") in ("civic","waterPlant","wastewaterPlant")]
    backup_served=0
    for building in critical_backup:
        demand_kw=building["utilityDemand"]["powerKw"]
        backup_kw=min(float(building.get("backupCapacityKw",0)),demand_kw*(100-building["utilityAccess"]["powerServedPct"])/100,float(building.get("backupFuelKwh",0))/24)
        building["backupKwToday"]=round(max(0,backup_kw),2)
        building["utilityAccess"]["backupPowerKw"]=building["backupKwToday"]
        building["utilityAccess"]["powerServedPct"]=round(min(100,building["utilityAccess"]["powerServedPct"]+backup_kw/max(1,demand_kw)*100))
        backup_served+=backup_kw
    power_total,power_connected,power_delivered_grid=power_total,power_connected,power_delivered
    power_delivered+=backup_served
    water_total,water_connected,water_delivered=allocate("water",water_usable,"waterM3Day","waterServedPct")
    generated=sum(b["utilityDemand"]["waterM3Day"]*.8*b["utilityAccess"]["waterServedPct"]/100 for b in buildings)
    sewer_connected=[b for b in buildings if b["utilityAccess"]["sewerConnected"]]
    sewer_flow=sum(b["utilityDemand"]["waterM3Day"]*.8*b["utilityAccess"]["waterServedPct"]/100 for b in sewer_connected)
    wastewater_capacity=utilities["baseWastewaterTreatmentM3Day"]+wastewater
    treated=min(sewer_flow,wastewater_capacity)
    sewer_fraction=min(1,treated/sewer_flow) if sewer_flow else 1
    for building in buildings:
        access=building["utilityAccess"]
        flow=building["utilityDemand"]["waterM3Day"]*.8*access["waterServedPct"]/100
        access["wastewaterGeneratedM3Day"]=round(flow,1)
        access["wastewaterTreatedPct"]=round(sewer_fraction*100) if access["sewerConnected"] else 0
    untreated=max(0,generated-treated)
    sewer_coverage=round(treated/max(1,generated)*100) if generated else 100
    coverage=round((power_delivered/max(1,power_total)+water_delivered/max(1,water_total)+sewer_coverage/100)/3*100)
    gas_tiles=energized_utility_tiles("gas");telecom_tiles=energized_utility_tiles("telecom")
    gas_capacity=utilities["baseGasCapacityM3Day"]+len(gas_tiles)*4
    telecom_capacity=utilities["baseTelecomCapacityMbps"]+len(telecom_tiles)*8
    gas_total,gas_connected,gas_delivered=allocate("gas",gas_capacity,"gasM3Day","gasServedPct")
    telecom_total,telecom_connected,telecom_delivered=allocate("telecom",telecom_capacity,"telecomMbps","telecomServedPct")
    gas_coverage=gas_delivered/max(1,gas_total);telecom_coverage=telecom_delivered/max(1,telecom_total)
    coverage=round((power_delivered/max(1,power_total)+water_delivered/max(1,water_total)+sewer_coverage/100+gas_coverage+telecom_coverage)*100/5)
    drain_tiles=energized_utility_tiles("drainage")
    day_cycle=(state.get("day",1)-1)%24
    rainfall=18 if day_cycle==17 else 5 if day_cycle in (6,7) else 0
    def terrain_runoff(x,y):
        value=(math.sin(x*.47+y*.19)+math.cos(y*.42-x*.17)+math.sin((x+y)*.31))/3
        if value<-.48:return .96,"bajo"
        if value>.48:return .90,"compacto"
        return .78,"firme"
    runoff_sources=[]
    for x,y in state.get("roads",[]):
        runoff_sources.append({"x":x,"y":y,"kind":"road","area":1.0,"coefficient":.97,"height":terrain_runoff(x,y)[1]})
    for building in buildings:
        area=2.2 if building.get("kind")=="airport" else 1.8 if building.get("kind") in ("port","hotel") else 1.2
        coefficient,height=terrain_runoff(building["x"],building["y"])
        runoff_sources.append({"x":building["x"],"y":building["y"],"kind":"building","buildingKind":building.get("kind"),"name":building.get("name",building.get("kind","edificio")),"area":area,"coefficient":coefficient,"height":height})
    for source_row in runoff_sources:
        x,y=source_row["x"],source_row["y"]
        source_row["runoffM3"]=round(rainfall*5*source_row["area"]*source_row["coefficient"],1)
        source_row["connected"]=(x,y) in drain_tiles or any((x+dx,y+dy) in drain_tiles for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)))
    total_runoff=sum(row["runoffM3"] for row in runoff_sources)
    connected_runoff=sum(row["runoffM3"] for row in runoff_sources if row["connected"])
    unconnected_runoff=max(0,total_runoff-connected_runoff)
    permanent_drainage_capacity=utilities["baseDrainageCapacityM3Day"]+len(drain_tiles)*18
    emergency_capacity=round(permanent_drainage_capacity*.25) if climate.get("preparedForDay")==state.get("day") else 0
    drainage_capacity=permanent_drainage_capacity+emergency_capacity
    captured=min(connected_runoff,drainage_capacity)
    overflow=max(0,connected_runoff-captured)
    standing_water=unconnected_runoff+overflow
    flood_rows=[row for row in runoff_sources if row["runoffM3"]>0 and not row["connected"]]
    overflow_left=overflow
    for row in sorted((r for r in runoff_sources if r["runoffM3"]>0 and r["connected"]),key=lambda r:(0 if r["height"]=="bajo" else 1 if r["height"]=="firme" else 2,r["y"],r["x"])):
        if overflow_left<=0:break
        flood_rows.append(row);overflow_left=max(0,overflow_left-row["runoffM3"])
    flooded_tiles=sorted({(row["x"],row["y"]) for row in flood_rows},key=lambda xy:(xy[1],xy[0]))
    flooded_buildings=[{"x":row["x"],"y":row["y"],"kind":row.get("buildingKind"),"name":row.get("name"),"terrain":row["height"],"runoffM3":round(row["runoffM3"]),"repairCost":round(55+row["runoffM3"]*.035)} for row in flood_rows if row["kind"]=="building"]
    drainage_coverage=round(captured/max(1,total_runoff)*100) if total_runoff else 100
    forecast=climate.get("forecast")
    if day_cycle==12 and (not forecast or forecast.get("targetDay")!=state.get("day",1)+5):
        rain_forecast=18
        projected=[{**row,"runoffM3":round(rain_forecast*5*row["area"]*row["coefficient"],1)} for row in runoff_sources]
        projected_total=sum(row["runoffM3"] for row in projected)
        projected_connected=sum(row["runoffM3"] for row in projected if row["connected"])
        projected_unconnected=max(0,projected_total-projected_connected)
        projected_overflow=max(0,projected_connected-permanent_drainage_capacity)
        projected_floods=[row for row in projected if row["runoffM3"]>0 and not row["connected"]]
        left=projected_overflow
        for row in sorted((r for r in projected if r["runoffM3"]>0 and r["connected"]),key=lambda r:(0 if r["height"]=="bajo" else 1 if r["height"]=="firme" else 2,r["y"],r["x"])):
            if left<=0:break
            projected_floods.append(row);left=max(0,left-row["runoffM3"])
        expected_tiles=sorted({(r["x"],r["y"]) for r in projected_floods},key=lambda p:(p[1],p[0]))
        expected_buildings=[{"name":r.get("name"),"x":r["x"],"y":r["y"],"terrain":r["height"]} for r in projected_floods if r["kind"]=="building"]
        expected_standing=projected_unconnected+projected_overflow
        level="alto" if len(expected_buildings)>=3 or expected_standing>permanent_drainage_capacity*.45 else "moderado" if expected_standing>0 else "bajo"
        forecast={"issuedDay":state.get("day",1),"targetDay":state.get("day",1)+5,"rainfallMm":rain_forecast,"expectedRunoffM3":round(projected_total),"expectedStandingWaterM3":round(expected_standing),"expectedFloodedTiles":len(expected_tiles),"expectedFloodedBuildingCount":len(expected_buildings),"expectedFloodedBuildings":expected_buildings[:8],"warningLevel":level,"status":"pronosticada"}
        climate["forecast"]=forecast
        sample_names=", ".join(r.get("name") or f"parcela {r['x']+1},{r['y']+1}" for r in expected_buildings[:3]) or "sin edificios en riesgo calculado"
        ev("Alerta meteorológica · tormenta prevista",f"La región {climate['region']} prevé 18 mm de lluvia para el día {forecast['targetDay']} (riesgo {level}). Se estiman {len(expected_tiles)} parcelas anegables y {len(expected_buildings)} edificios expuestos; drenaje actual {round(permanent_drainage_capacity)} m³/día. Zonas expuestas: {sample_names}.")
    if day<heat_day<=day+5 and (climate.get("heatForecast") or {}).get("targetDay")!=heat_day:
        homes=sorted((b for b in buildings if b.get("kind")=="home"),key=lambda b:heat_exposure(b["x"],b["y"])[0]*b.get("occupants",0),reverse=True)
        exposed=[{"name":b.get("name",f"Barrio {b['x']+1},{b['y']+1}"),"x":b["x"],"y":b["y"],"population":b.get("occupants",0),"exposure":heat_exposure(b["x"],b["y"])[0]} for b in homes if heat_exposure(b["x"],b["y"])[0]>=1.0]
        risk_population=sum(x["population"] for x in exposed);cases=round(sum(x["population"]*.055*x["exposure"] for x in exposed))
        climate["heatForecast"]={"issuedDay":day,"targetDay":heat_day,"durationDays":5,"status":"pronosticada","warningLevel":"alto" if cases>=max(25,state.get("population",0)*.04) else "moderado","exposedPopulation":risk_population,"expectedHealthCases":cases,"exposedHomes":exposed[:6]}
        ev("Alerta de calor · refugios y consumo",f"Ola de calor prevista para el día {heat_day}, durante cinco días. Se estiman {cases} consultas por estrés térmico en {len(exposed)} sectores; la demanda eléctrica y de agua aumentará.")
    if day<drought_day<=day+5 and (climate.get("droughtForecast") or {}).get("targetDay")!=drought_day:
        effective=round(source_water_capacity*.55*(1-utilities["waterLeakRate"]))
        climate["droughtForecast"]={"issuedDay":day,"targetDay":drought_day,"durationDays":30,"status":"pronosticada","warningLevel":"alto" if effective<water_total*.95 else "moderado","capacityLossPct":45,"effectiveCapacityM3Day":effective,"expectedDemandM3Day":round(water_total),"waterRestrictions":restrictions_active}
        ev("Alerta de sequía · captación en riesgo",f"La estación seca comenzará el día {drought_day} y durará 30 días. La fuente bajará 45%: capacidad útil estimada {effective} m³/día frente a demanda actual de {round(water_total)} m³/día.")
    if climate.get("heatForecast") and climate["heatForecast"].get("targetDay")==heat_day:climate["heatForecast"]["active"]=heat_active
    if climate.get("droughtForecast") and climate["droughtForecast"].get("targetDay")==drought_day:
        climate["droughtForecast"].update({"active":drought_active,"waterRestrictions":restrictions_active})
    if forecast and climate.get("preparedForDay")==forecast.get("targetDay"):forecast["prepared"]=True
    elif forecast:forecast["prepared"]=False
    for building in buildings:
        access=building["utilityAccess"]
        factor=min(access["powerServedPct"],access["waterServedPct"],access["wastewaterTreatedPct"],access["gasServedPct"],access["telecomServedPct"])/100
        if restrictions_active and building.get("kind") in ("shop","hotel"):factor*=.88
        if building.get("kind") in ("shop","hotel") and building.get("business") is not None:
            building["business"]["utilityFactor"]=round(factor,3)
            if restrictions_active:building["business"]["waterRestrictionFactor"]=.88
            else:building["business"].pop("waterRestrictionFactor",None)
        if building.get("kind")=="hotel":
            building["utilityShortage"]="energía" if access["powerServedPct"]<100 else "agua" if access["waterServedPct"]<100 else "cloacas" if access["wastewaterTreatedPct"]<100 else "gas" if access["gasServedPct"]<100 else "telecomunicaciones" if access["telecomServedPct"]<100 else None
    report={"day":state.get("day",1),"season":"Verano" if summer else "Templada","serviceCoveragePct":coverage,
        "power":{"installedKw":round(power_capacity),"usableKw":round(power_usable),"demandKw":round(power_total),"connectedDemandKw":round(power_connected),"servedKw":round(power_delivered),"gridServedKw":round(power_delivered_grid),"backupServedKw":round(backup_served),"backupGenerators":sum(b.get("backupCapacityKw",0)>0 for b in critical_backup),"backupStoredKwh":round(sum(b.get("backupFuelKwh",0) for b in critical_backup)),"backupCapacityKwh":round(sum(b.get("backupCapacityKwh",0) for b in critical_backup)),"shortageKw":round(max(0,power_total-power_delivered)),"lossPct":round(utilities["powerLossRate"]*100),"connectedSegments":len(power_tiles),"connectedBuildings":sum(b["utilityAccess"]["powerConnected"] for b in buildings)},
        "water":{"installedM3Day":round(water_capacity),"sourceCapacityM3Day":round(source_water_capacity),"emergencyTankerM3Day":tanker_capacity,"droughtReductionPct":45 if drought_active else 0,"usableM3Day":round(water_usable),"demandM3Day":round(water_total),"connectedDemandM3Day":round(water_connected),"servedM3Day":round(water_delivered),"shortageM3Day":round(max(0,water_total-water_delivered)),"leakPct":round(utilities["waterLeakRate"]*100),"connectedSegments":len(water_tiles),"connectedBuildings":sum(b["utilityAccess"]["waterConnected"] for b in buildings)},
        "wastewater":{"treatmentCapacityM3Day":round(wastewater_capacity),"generatedM3Day":round(generated),"connectedM3Day":round(sewer_flow),"treatedM3Day":round(treated),"untreatedM3Day":round(untreated),"coveragePct":sewer_coverage,"connectedSegments":len(sewer_tiles),"connectedBuildings":sum(b["utilityAccess"]["sewerConnected"] for b in buildings),"plants":sum(b.get("kind")=="wastewaterPlant" and all(utility_building_connected(b,n) for n in ("power","water","sewer")) for b in buildings)},
        "gas":{"capacityM3Day":round(gas_capacity),"demandM3Day":round(gas_total,2),"servedM3Day":round(gas_delivered,2),"shortageM3Day":round(max(0,gas_total-gas_delivered),2),"connectedSegments":len(gas_tiles),"connectedBuildings":sum(b["utilityAccess"]["gasConnected"] for b in buildings)},
        "telecommunications":{"capacityMbps":round(telecom_capacity),"demandMbps":round(telecom_total,2),"servedMbps":round(telecom_delivered,2),"shortageMbps":round(max(0,telecom_total-telecom_delivered),2),"connectedSegments":len(telecom_tiles),"connectedBuildings":sum(b["utilityAccess"]["telecomConnected"] for b in buildings)},
        "drainage":{"rainfallMm":rainfall,"weather":"Tormenta" if rainfall>=12 else "Lluvia" if rainfall else "Seco","runoffM3Day":round(total_runoff),"capturedM3Day":round(captured),"capacityM3Day":round(drainage_capacity),"permanentCapacityM3Day":round(permanent_drainage_capacity),"emergencyCapacityM3Day":emergency_capacity,"standingWaterM3Day":round(standing_water),"coveragePct":drainage_coverage,"connectedSegments":len(drain_tiles),"connectedBuildings":sum(any((b["x"]+dx,b["y"]+dy) in drain_tiles for dx,dy in ((0,0),(1,0),(-1,0),(0,1),(0,-1))) for b in buildings),"floodedTiles":[list(xy) for xy in flooded_tiles],"floodedBuildings":flooded_buildings,"repairCostEstimate":round(sum(row["repairCost"] for row in flooded_buildings)),"forecast":forecast},
        "sources":{"powerPlants":sum(b.get("kind")=="powerPlant" and utility_building_connected(b,"power") and utility_building_connected(b,"water") for b in buildings),"waterPlants":sum(b.get("kind")=="waterPlant" and utility_building_connected(b,"power") and utility_building_connected(b,"water") for b in buildings)},
        "climate":{"heatwave":{"active":heat_active,"targetDay":heat_day,"durationDays":5,"powerDemandMultiplier":1.22 if heat_active else 1.0,"waterDemandMultiplier":1.18 if heat_active else 1.0,"coolingPrepared":climate.get("coolingPreparedForDay")==heat_day,"healthCases":(climate.get("heatForecast") or {}).get("actualHealthCases",0)},"drought":{"active":drought_active,"targetDay":drought_day,"durationDays":30,"sourceReductionPct":45 if drought_active else 0,"waterRestrictions":restrictions_active,"waterCapacityM3Day":round(water_capacity),"emergencyTankerM3Day":tanker_capacity,"demandM3Day":round(water_total),"shortageM3Day":round(max(0,water_total-water_delivered))}},
        "monthlyMaintenance":round(len(power_tiles)*1.2+len(water_tiles)*.8+len(sewer_tiles)*.9+len(drain_tiles)*.7+len(gas_tiles)*1.1+len(telecom_tiles)*.6+sum(70 for b in critical_backup if b.get("backupCapacityKw",0))),
        "lineCondition":utility_condition_report(),
        "failures":[{k:f.get(k) for k in ("id","network","x","y","day","reason","repairCost","affectedBuildings","status","remainingDays","responseKind","responseStartedDay","responseDurationDays","responseProgress","responseRoute","completedDay")} | {"emergencyRouteAvailable":bool(route_between((4,10),(f.get("x"),f.get("y"))))} for f in utilities.get("failures",[]) if f.get("status")!="reparada" or state.get("day",0)-f.get("completedDay",-99)<=1]}
    utilities["report"]=report
    if apply_effects:
        if coverage<85:
            loss=2 if coverage<60 else 1;state["services"]=max(0,state.get("services",0)-loss)
            if coverage<65:state["approval"]=max(0,state.get("approval",0)-1)
        if sewer_coverage<90:
            state["services"]=max(0,state.get("services",0)-1)
            if sewer_coverage<65:state["approval"]=max(0,state.get("approval",0)-1)
            if state.get("day",0)-utilities.get("lastWastewaterNoticeDay",-999)>=30:
                ev("Aguas residuales sin tratar",f"Se generaron {round(generated)} m³/día y solo se depuraron {round(treated)}. La descarga sin tratar presiona la salud pública.")
                utilities["lastWastewaterNoticeDay"]=state.get("day",0)
        if coverage<85 and state.get("day",0)-utilities.get("lastShortageNoticeDay",-999)>=30:
            ev("Déficit en redes de servicios",f"La cobertura efectiva es {coverage}%. Faltan {report['power']['shortageKw']} kW y {report['water']['shortageM3Day']} m³/día; las pérdidas incluyen cables y fugas.")
            utilities["lastShortageNoticeDay"]=state.get("day",0)
    return report

def register_recovery_needs(report,day):
    needs=state.setdefault("recoveryNeeds",[])
    for x,y in report.get("floodedTiles",[]):
        if [x,y] not in state.get("roads",[]):continue
        if any(n.get("targetType")=="road" and n.get("x")==x and n.get("y")==y and n.get("status")!="reparada" for n in needs):continue
        asset=next((a for a in state.setdefault("roadAssets",[]) if a.get("x")==x and a.get("y")==y),None)
        if asset is None:
            asset={"x":x,"y":y,"quality":72,"monthlyCost":15};state["roadAssets"].append(asset)
        cost=850+max(0,82-int(asset.get("quality",72)))*22
        needs.append({"id":f"recovery-road-{x}-{y}-{day}","targetType":"road","x":x,"y":y,"name":f"Calle {x+1}, {y+1}","day":day,"condition":int(asset.get("quality",72)),"estimate":cost,"cause":"daño por tormenta","inspectionStatus":"pendiente","status":"abierta"})
    public_kinds={"civic","school","fireStation","depot","landfill","recyclingPlant","powerPlant","waterPlant","wastewaterPlant","port","airport"}
    for row in report.get("floodedBuildings",[]):
        if row.get("kind") not in public_kinds:continue
        x,y=row["x"],row["y"]
        if any(n.get("targetType")=="building" and n.get("x")==x and n.get("y")==y and n.get("status")!="reparada" for n in needs):continue
        building=next((b for b in state["buildings"] if b.get("x")==x and b.get("y")==y),None)
        if not building:continue
        needs.append({"id":f"recovery-building-{x}-{y}-{day}","targetType":"building","x":x,"y":y,"name":building.get("name",row.get("name","Servicio municipal")),"day":day,"condition":int(building.get("quality",72)),"estimate":max(1100,round(row.get("repairCost",0)*3)),"cause":"daño por tormenta","inspectionStatus":"pendiente","status":"abierta"})

def advance_recovery_contracts():
    for need in state.setdefault("recoveryNeeds",[]):
        if need.get("inspectionStatus")=="en curso":
            need["inspectionRemainingDays"]=max(0,int(need.get("inspectionRemainingDays",1))-1)
            if need["inspectionRemainingDays"]==0:
                need["inspectionStatus"]="inspeccionada";need["inspectedDay"]=state.get("day",0)
                if need.get("scheduledInspection"):
                    building=next((b for b in state.get("buildings",[]) if b.get("x")==need["x"] and b.get("y")==need["y"]),None)
                    if building and building.get("quality",82)>=82:
                        building["lastInspectionDay"]=state.get("day",1);building["nextInspectionDay"]=state.get("day",1)+building.get("inspectionIntervalDays",180);need.update({"status":"reparada","completedDay":state.get("day",1)})
                        ev("Inspección preventiva aprobada",f"{need['name']} superó la revisión sin requerir obra. Próxima inspección en {building['inspectionIntervalDays']} días.")
                    else:ev("Inspección preventiva completada",f"{need['name']}: diagnóstico confirmó condición {need['condition']}% y presupuesto de $ {need['estimate']:,}. Se puede licitar una rehabilitación.".replace(",","."))
                else:ev("Inspección municipal completada",f"{need['name']}: diagnóstico y presupuesto confirmados en $ {need['estimate']:,}. La obra puede licitarse.".replace(",","."))
    for contract in state.setdefault("recoveryContracts",[]):
        if contract.get("status")!="en obra":continue
        contract["remainingDays"]=max(0,int(contract.get("remainingDays",1))-1)
        if contract["remainingDays"]:continue
        need=next((n for n in state["recoveryNeeds"] if n.get("id")==contract.get("needId")),None)
        if need:
            if need["targetType"]=="road":
                asset=next((a for a in state["roadAssets"] if a.get("x")==need["x"] and a.get("y")==need["y"]),None)
                if asset:asset["quality"]=82;asset["safetyClosure"]=False;ev("Calle reabierta",f"La rehabilitación de calle {n['x']+1},{n['y']+1} superó la inspección y recuperó su condición estructural.")
            else:
                building=next((b for b in state["buildings"] if b.get("x")==need["x"] and b.get("y")==need["y"]),None)
                if building:
                    building["quality"]=82
                    building["floodRepairCost"]=0
                    if building.get("kind") in ("powerPlant","waterPlant","wastewaterPlant"):
                        building["lastInspectionDay"]=state.get("day",1);building["nextInspectionDay"]=state.get("day",1)+building.get("inspectionIntervalDays",180)
            need.update({"status":"reparada","completedDay":state["day"]})
        contract.update({"status":"completada","completedDay":state["day"],"stage":"Inspección final aprobada"})
        ev("Rehabilitación municipal terminada",f"{contract['name']}: {contract['contractor']} restauró el activo tras {contract['duration']} días. La condición vuelve a 82% y el registro de necesidad se cierra.")

def apply_drainage_impacts():
    utilities=ensure_utility_state();report=utilities.get("report",{}).get("drainage",{});day=state.get("day",0)
    if report.get("rainfallMm",0)<12 or utilities.get("lastDrainageImpactDay")==day:return
    climate=ensure_climate_state();forecast=climate.get("forecast")
    if forecast and forecast.get("targetDay")==day:
        forecast["status"]="ocurrida";forecast["actualFloodedTiles"]=len(report.get("floodedTiles",[]));forecast["actualFloodedBuildings"]=len(report.get("floodedBuildings",[]));forecast["actualStandingWaterM3"]=round(report.get("standingWaterM3Day",0));forecast["forecastHit"]=bool(report.get("standingWaterM3Day",0)>0)
    if report.get("standingWaterM3Day",0)<=0:
        utilities["lastDrainageImpactDay"]=day
        ev("Tormenta contenida",f"Lluvia de {report['rainfallMm']} mm; la red absorbió la escorrentía sin anegamientos. Pronóstico: {forecast.get('warningLevel','sin alerta')} · preparación de emergencia: {'activa' if report.get('emergencyCapacityM3Day') else 'no desplegada'}.")
        return
    homes_affected=0;critical_flood=False;public_cost=0;private_cost=0
    for row in report.get("floodedBuildings",[]):
        building=next((b for b in state.get("buildings",[]) if b.get("x")==row["x"] and b.get("y")==row["y"]),None)
        if not building:continue
        cost=int(row["repairCost"]);building["floodEvents"]=building.get("floodEvents",0)+1;building["lastFloodDay"]=day;building["floodRepairCost"]=building.get("floodRepairCost",0)+cost;building["quality"]=max(35,int(building.get("quality",75))-2)
        if building.get("kind")=="home":
            homes_affected+=max(0,int(building.get("occupants",0)));building["householdCash"]=max(0,building.get("householdCash",0)-cost)
        elif building.get("business"):
            firm=building["business"];firm["cash"]=firm.get("cash",0)-cost;firm["lastFloodRepairCost"]=firm.get("lastFloodRepairCost",0)+cost;private_cost+=cost
        else:
            public_cost+=cost;critical_flood|=building.get("kind")=="civic"
    road_tiles={tuple(xy) for xy in report.get("floodedTiles",[])}
    for asset in state.get("roadAssets",[]):
        if (asset.get("x"),asset.get("y")) in road_tiles:
            asset["quality"]=max(30,int(asset.get("quality",75))-4);asset["monthlyCost"]=asset.get("monthlyCost",0)+2;state["monthlyExpenses"]+=2;public_cost+=45
    state["money"]=max(0,state.get("money",0)-public_cost)
    affected_count=len(report.get("floodedBuildings",[]))
    if affected_count:state["services"]=max(0,state.get("services",0)-min(3,max(1,math.ceil(affected_count/4))))
    if critical_flood or homes_affected>=max(25,round(state.get("population",0)*.08)):state["approval"]=max(0,state.get("approval",0)-1)
    register_utility_flood_damage(report.get("floodedTiles",[]),day)
    register_recovery_needs(report,day)
    utilities["lastDrainageImpactDay"]=day
    forecast_note=f"Pronóstico {forecast.get('warningLevel','sin alerta')}: {forecast.get('expectedFloodedTiles',0)} parcelas / {forecast.get("expectedFloodedBuildingCount",len(forecast.get("expectedFloodedBuildings",[])))} edificios previstos; preparación {'activa (+{report.get("emergencyCapacityM3Day",0)} m³/día)' if report.get('emergencyCapacityM3Day') else 'no desplegada'}. " if forecast and forecast.get("targetDay")==day else "Sin pronóstico previo guardado. "
    ev("Anegamiento por tormenta",f"{forecast_note}La lluvia de {report['rainfallMm']} mm dejó {len(road_tiles)} parcelas anegadas. {affected_count} edificios recibieron daños; reparaciones estimadas $ {report.get('repairCostEstimate',0)+public_cost:,} y servicios -{min(3,max(1,math.ceil(affected_count/4)) if affected_count else 0)} puntos. Cloacas y pluviales son redes independientes.".replace(",","."))

def register_utility_flood_damage(flooded_tiles,day):
    utilities=ensure_utility_state();lines={"power":"powerLines","water":"waterPipes","sewer":"sewerLines","gas":"gasLines","telecom":"telecomLines"}
    names={"power":"electricidad","water":"agua potable","sewer":"cloacas","gas":"gas","telecom":"telecomunicaciones"}
    costs={"power":720,"water":640,"sewer":690,"gas":580,"telecom":460}
    active={(f.get("network"),f.get("x"),f.get("y")) for f in utilities["failures"] if f.get("status")!="reparada"}
    tiles=sorted({tuple(point) for point in flooded_tiles},key=lambda p:(p[1],p[0]))
    def reachable_without(network,removed):
        connected=energized_utility_tiles(network);connected.discard(removed);source=(4,10)
        if source not in connected:return set()
        reached={source};queue=[source]
        for x,y in queue:
            for neighbor in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
                if neighbor in connected and neighbor not in reached:reached.add(neighbor);queue.append(neighbor)
        return reached
    for network,key in lines.items():
        connected=energized_utility_tiles(network)
        current_buildings=[b for b in state.get("buildings",[]) if utility_building_connected(b,network)]
        candidates=[]
        for tile in tiles:
            if tile not in connected or (network,tile[0],tile[1]) in active:continue
            alternate=reachable_without(network,tile)
            lost=sum(1 for b in current_buildings if not any((b.get("x",-99)+dx,b.get("y",-99)+dy) in alternate for dx,dy in ((0,0),(1,0),(-1,0),(0,1),(0,-1))))
            candidates.append((lost,tile))
        if not candidates:continue
        affected,target=max(candidates,key=lambda item:(item[0],-item[1][1],-item[1][0]))
        x,y=target;failure={"id":uuid.uuid4().hex,"network":network,"x":x,"y":y,"day":day,"reason":"Inundación de calzada","repairCost":costs[network],"affectedBuildings":affected,"status":"avería","remainingDays":0}
        utilities["failures"].append(failure);active.add((network,x,y))
        ev("Avería en red de servicios",f"La inundación dañó un tramo de {names[network]} en la calle {x+1},{y+1}. El sector perdió conexión; reparar cuesta $ {costs[network]} y demanda 3 días de cuadrilla.")
        break

def dispatch_utility_repair(failure_id,emergency=False):
    failure=next((f for f in ensure_utility_state()["failures"] if f.get("id")==str(failure_id) and f.get("status")=="avería"),None)
    if not failure:raise ValueError("La avería ya fue reparada o tiene una cuadrilla asignada.")
    reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"));available=max(0,state["money"]-reserved)
    cost=int(failure["repairCost"])*(2 if emergency else 1);duration=1 if emergency else 3;route=route_between((4,10),(failure["x"],failure["y"]))
    if route and len(route)==1:route=route*2
    if emergency and not route:raise ValueError("La cuadrilla de emergencia no puede llegar: conectá una ruta vial utilizable al tramo averiado.")
    if available<cost:raise ValueError(f"Quedan $ {available}; la reparación {'urgente' if emergency else 'programada'} cuesta $ {cost} además de los contratos.")
    state["money"]-=cost;failure.update({"status":"en reparación","remainingDays":duration,"startedDay":state["day"],"responseKind":"emergencia" if emergency else "programada","responseStartedDay":state["day"],"responseDurationDays":duration,"responseProgress":0,"responseRoute":[list(p) for p in (route or [])]})
    if emergency:ev("Cuadrilla de emergencia despachada",f"Una unidad de servicios salió por la red vial hacia la avería de {failure['network']} en calle {failure['x']+1},{failure['y']+1}. Costo $ {cost}; prioridad de reparación: un día.")
    else:ev("Cuadrilla de servicios contratada",f"Reparación programada de {failure['network']} en calle {failure['x']+1},{failure['y']+1}: $ {cost} · 3 días. Una prioridad urgente habría costado $ {cost*2} y durado un día.")
    return failure

def advance_utility_repairs():
    for failure in ensure_utility_state()["failures"]:
        if failure.get("status")!="en reparación":continue
        failure["remainingDays"]=max(0,int(failure.get("remainingDays",1))-1)
        duration=max(1,int(failure.get("responseDurationDays",3)));failure["responseProgress"]=round(min(1,(duration-failure["remainingDays"])/duration),3)
        if failure["remainingDays"]==0:
            failure["status"]="reparada";failure["completedDay"]=state.get("day",0)
            ensure_utility_state().setdefault("lineConditions",{})[f"{failure.get('network')}:{failure.get('x')}:{failure.get('y')}"]=82
            ev("Red de servicios reparada",f"La cuadrilla restableció {failure['network']} en la calle {failure['x']+1},{failure['y']+1}. La conexión y el servicio se recalculan.")

def bus_line_route(line):
    base=route_between(tuple(line.get("from",[])),tuple(line.get("to",[]))) if len(line.get("from",[]))==2 and len(line.get("to",[]))==2 else None
    if not base:return None
    stops=[]
    for building in state.get("buildings",[]):
        if building.get("kind")!="busStop" or building.get("status") not in ("operativo","habilitado"):continue
        access,index=min((abs(building["x"]-point[0])+abs(building["y"]-point[1]),i) for i,point in enumerate(base))
        if access<=1:stops.append((index,building["x"],building["y"]))
    route=[list(line["from"])]
    for _,x,y in sorted(set(stops)):
        point=(x,y);segment=route_between(tuple(route[-1]),point)
        if not segment:return None
        route.extend(segment[1:])
    segment=route_between(tuple(route[-1]),tuple(line["to"]))
    if not segment:return None
    route.extend(segment[1:])
    return route

def bus_stop_sites(line):
    if not line or line.get("status") not in ("active","paused"):return []
    path=line.get("route") or bus_line_route(line) or []
    roads={tuple(r) for r in state.get("roads",[])}
    occupied={(b["x"],b["y"]) for b in state.get("buildings",[])}|{(p["x"],p["y"]) for p in state.get("projects",[])}|{(a["x"],a["y"]) for a in state.get("abandoned",[])}|roads
    candidates=set()
    for x,y in path:
        if (x,y) not in roads:continue
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            point=(x+dx,y+dy)
            if 0<=point[0]<28 and 0<=point[1]<20 and not is_water(*point) and point not in occupied:candidates.add(point)
    built=sum(1 for b in state.get("buildings",[]) if b.get("kind")=="busStop" and b.get("status") in ("operativo","habilitado") and min((abs(b["x"]-x)+abs(b["y"]-y) for x,y in path),default=99)<=1)
    reserved=sum(1 for p in state.get("projects",[]) if p.get("kind")=="busStop" and p.get("busLineId")==line.get("id"))
    limit=max(0,4-built-reserved)
    return [{"x":x,"y":y,"label":f"Parcela {x+1},{y+1}"} for x,y in sorted(candidates)[:min(12,limit)]]

_commute_cache_key=None
_commute_cache=None
def work_shift_for(person_id):
    person_id=str(person_id);slot=sum((index+1)*ord(char) for index,char in enumerate(person_id))%len(BUS_WORK_SHIFTS)
    return BUS_WORK_SHIFTS[slot]

def bus_service_schedule(line):
    route_minutes=max(1,(len(line.get("route",[]))-1)*3.6+6)
    base=max(6,math.ceil(route_minutes/max(.25,line.get("effectiveBuses",0))))
    active=bool(line.get("operational") and line.get("effectiveBuses",0)>0)
    windows=[];headways={};capacities={};departures={}
    for key,label,multiplier in BUS_WINDOW_DEPARTURES:
        headway=math.ceil(base*multiplier);count=math.floor(120/headway) if active else 0;capacity=count*BUS_SEATS
        headways[key]=headway;capacities[key]=capacity;departures[key]=count
        windows.append({"key":key,"label":label,"headwayMinutes":headway,"departuresPerDirection":count,"capacityPerDirection":capacity})
    outbound=sum(capacities.values())
    inbound=outbound
    extra=sum(departures[k] for k in departures if k not in ("morningPeak","eveningPeak"))*2
    return {"scheduleWindows":windows,"headwayByWindow":headways,"capacityByWindow":capacities,"departuresByWindow":departures,
            "ridersByWindow":{},"returnRidersByWindow":{},"capacity":outbound,"returnCapacity":inbound,
            "headwayMinutes":headways["morningPeak"],"scheduledDeparturesPerDirection":sum(departures.values()),
            "monthlyServiceCost":round(extra*22*.08)}

def nearest_bus_node(point,path):
    return min((abs(point[0]-node[0])+abs(point[1]-node[1]),index) for index,node in enumerate(path))

def choose_bus_itinerary(emp):
    """Devuelve el trayecto más rápido con hasta un transbordo en parada construida."""
    home=(emp["home"]["x"],emp["home"]["y"]);site=(emp["site"]["x"],emp["site"]["y"])
    alternative=2+emp["distance"]*4 if emp["mode"]=="walk" else 7+emp["distance"]*2.5*1.25
    window=emp.get("departureWindowKey","morningPeak")
    lines=[line for line in state.get("busRoutes",[]) if line.get("operational") and len(line.get("route",[]))>1 and line.get("ridersByWindow",{}).get(window,0)<line.get("capacityByWindow",{}).get(window,0)]
    offers=[]
    for line in lines:
        access_from,start=nearest_bus_node(home,line["route"]);access_to,end=nearest_bus_node(site,line["route"])
        if access_from+access_to>2 or start>=end:continue
        ride=max(1,end-start)
        headway=line.get("headwayByWindow",{}).get(window,line["headwayMinutes"])
        minutes=(access_from+access_to)*4+headway/2+ride*1.8+line.get("fare",BUS_FARE)*6
        if minutes<alternative:
            offers.append({"lines":[line],"headways":[headway],"legFares":[line.get("fare",BUS_FARE)],"access":access_from+access_to,"ride":ride,"transferMinutes":0,"transferStop":None,"fare":line.get("fare",BUS_FARE),"travelRoute":line["route"][start:end+1],"minutes":minutes})
    stops=[b for b in state["buildings"] if b.get("kind")=="busStop" and b.get("status") in ("habilitado","operativo")]
    if stops and len(lines)>1:
        for first in lines:
            access_from,start=nearest_bus_node(home,first["route"])
            if access_from>2:continue
            for second in lines:
                if second is first:continue
                access_to,end=nearest_bus_node(site,second["route"])
                if access_from+access_to>2:continue
                for stop in stops:
                    access_one,leave=nearest_bus_node((stop["x"],stop["y"]),first["route"])
                    access_two,board=nearest_bus_node((stop["x"],stop["y"]),second["route"])
                    if access_one>1 or access_two>1 or start>=leave or board>=end:continue
                    ride=max(1,leave-start)+max(1,end-board)
                    first_headway=first.get("headwayByWindow",{}).get(window,first["headwayMinutes"]);second_headway=second.get("headwayByWindow",{}).get(window,second["headwayMinutes"])
                    transfer=2+(access_one+access_two)*4+second_headway/2
                    leg_fares=[first.get("fare",BUS_FARE),round(second.get("fare",BUS_FARE)*BUS_TRANSFER_DISCOUNT,2)]
                    fare=round(sum(leg_fares),2)
                    minutes=(access_from+access_to)*4+first_headway/2+ride*1.8+transfer+fare*6
                    if minutes<alternative*(1.5 if emp["mode"]=="walk" else 1.25):
                        offers.append({"lines":[first,second],"headways":[first_headway,second_headway],"legFares":leg_fares,"access":access_from+access_to,"ride":ride,"transferMinutes":round(transfer),"transferStop":stop.get("name","Parada de intercambio"),"fare":fare,"travelRoute":first["route"][start:leave+1]+second["route"][board:end+1],"minutes":minutes})
    return min(offers,key=lambda item:(item["minutes"],len(item["lines"]),tuple(str(line["id"]) for line in item["lines"]))) if offers else None

def add_return_commutes(employees,commutes):
    """Reserva capacidad vespertina por separado y publica el regreso al hogar."""
    lines={line["id"]:line for line in state.get("busRoutes",[])}
    grouped={};fare_due={};counts={"bus":0,"auto":0,"walk":0};minutes_total=0;auto_emissions=0.0;auto_vehicles=0
    for emp in employees:
        person=emp["person"]
        ids=list(reversed(emp.get("busLineIds",[])))
        window=emp.get("returnWindowKey","eveningPeak")
        bus_ready=bool(ids) and all(lines[line_id].get("operational") and lines[line_id].get("returnRidersByWindow",{}).get(window,0)<lines[line_id].get("capacityByWindow",{}).get(window,0) for line_id in ids)
        if bus_ready:
            for line_id in ids:
                lines[line_id]["returnRidersThisPass"]+=1
                counters=lines[line_id].setdefault("returnRidersByWindow",{});counters[window]=counters.get(window,0)+1
            fares=[lines[ids[0]].get("fare",BUS_FARE)]
            if len(ids)>1:fares.append(round(lines[ids[1]].get("fare",BUS_FARE)*BUS_TRANSFER_DISCOUNT,2))
            mode="bus";distance=emp["busDistance"];route=list(reversed(emp["busTravelRoute"]))
            transfer=emp.get("transferMinutes",0)
            if len(ids)>1:
                old_second=lines[emp["busLineIds"][1]]
                transfer=max(0,transfer-round(old_second.get("headwayByWindow",{}).get(emp.get("departureWindowKey","morningPeak"),old_second["headwayMinutes"])/2)+round(lines[ids[1]].get("headwayByWindow",{}).get(window,lines[ids[1]]["headwayMinutes"])/2))
            access=emp.get("busAccessSegments",0)*4
        else:
            ids=[];fares=[];mode="walk" if emp["distance"]<=3 or not person.get("carAccess") else "auto"
            distance=emp["distance"];route=list(reversed(emp["route"]));transfer=0;access=2
        emp["returnBusLineIds"]=ids;emp["returnBusLegFares"]=fares
        person.update({"returnCommuteMode":mode,"returnBusLineIds":ids,"returnBusLegFares":fares})
        cents={}
        for leg_ids,leg_fares in ((emp.get("busLineIds",[]),emp.get("busLegFares",[])),(ids,fares)):
            for line_id,fare in zip(leg_ids,leg_fares):cents[line_id]=cents.get(line_id,0)+round(fare*100)*22
        total_due=(sum(cents.values())+50)//100
        due={line_id:amount//100 for line_id,amount in cents.items()}
        remainder=total_due-sum(due.values())
        for line_id,_ in sorted(cents.items(),key=lambda item:(-(item[1]%100),str(item[0])))[:remainder]:due[line_id]+=1
        emp["monthlyBusFareByLine"]=due;person["monthlyBusFareByLine"]=due
        for line_id,amount in due.items():fare_due[line_id]=fare_due.get(line_id,0)+amount
        group=(emp["site"]["x"],emp["site"]["y"],emp["home"]["x"],emp["home"]["y"],mode,tuple(ids),window)
        grouped.setdefault(group,[]).append((emp,route,distance,access,transfer,fares))
    return_trips=[]
    for (sx,sy,hx,hy,mode,ids,window),rows in grouped.items():
        emp,route,distance,access,transfer,fares=rows[0]
        line=lines[ids[0]] if ids else None
        headway=line.get("headwayByWindow",{}).get(window,line["headwayMinutes"]) if line else None
        wait=round(headway/2) if line else 0 if mode=="walk" else 3
        factor=1 if mode=="walk" else traffic_factor(route)
        ride=round(distance*(1.8 if line else 4 if mode=="walk" else 2.5)*factor)
        parking=2 if mode=="auto" else 0
        minutes=access+wait+ride+parking+transfer
        vehicles=math.ceil(len(rows)/1.4) if mode=="auto" else 0
        emissions=round(vehicles*distance*.18,2)
        counts[mode]+=len(rows);minutes_total+=len(rows)*minutes;auto_vehicles+=vehicles;auto_emissions+=emissions
        return_trips.append({"from":[sx,sy],"to":[hx,hy],"workers":len(rows),"distance":distance,"route":route,"mode":mode,"busLineId":ids[0] if ids else None,"busLineIds":list(ids),"busLegFares":fares,"transferStop":emp.get("transferStop") if len(ids)>1 else None,"fare":round(sum(fares),2),"headwayMinutes":headway,"reason":"regreso","departureWindow":dict((key,label) for key,label,_ in BUS_WINDOW_DEPARTURES).get(window,"17:00–19:00"),"departureWindowKey":window,"walkAccessMinutes":access,"waitingMinutes":wait,"rideMinutes":ride,"parkingMinutes":parking,"transferMinutes":transfer,"estimatedMinutes":minutes,"vehicles":vehicles,"dailyEmissionsKg":emissions,"trafficFactor":round(factor,2),"attendance":1})
    commutes.extend(return_trips)
    for line_id,line in lines.items():
        line["dailyRiders"]=line.get("ridersThisPass",0)+line.get("returnRidersThisPass",0)
        line["forecastMonthlyFareRevenue"]=fare_due.get(line_id,0)
        if line.get("operational") and line.get("fareCollectedDay")!=state["day"]:line["monthlyFareRevenue"]=fare_due.get(line_id,0)
    return {"returnCommuters":len(employees),"returnBusCommuters":counts["bus"],"returnAutoCommuters":counts["auto"],"returnWalkingCommuters":counts["walk"],"returnTransferCommuters":sum(t["workers"] for t in return_trips if len(t["busLineIds"])==2),"returnMeanMinutes":round(minutes_total/max(1,len(employees))) if employees else 0,"returnVehicles":auto_vehicles+sum(line.get("effectiveBuses",0) for line in lines.values() if line.get("operational")),"returnEmissionsKg":round(auto_emissions+sum(line.get("effectiveBuses",0)*max(0,len(line.get("route",[]))-1)*.55 for line in lines.values() if line.get("operational")),2)}

def nonwork_shopping_trips(homes, shops, roads):
    """Capa inicial de viajes cotidianos: visitas a comercios abiertos, sin alterar compras ya liquidadas."""
    grouped={}
    if not shops:return []
    for home in homes:
        candidates=[]
        for shop in shops:
            route=route_between((home["x"],home["y"]),(shop["x"],shop["y"]))
            if not route:continue
            distance=sum(1 for a,b in zip(route,route[1:]) if tuple(a) in roads and tuple(b) in roads)
            if distance:candidates.append((distance,shop.get("business",{}).get("lastLocalSales",0),shop,route))
        if not candidates:continue
        candidates.sort(key=lambda row:(row[0],-row[1],row[2]["x"],row[2]["y"]))
        # El destino rota de manera reproducible entre las tres alternativas accesibles más convenientes.
        slot=(home["x"]*73856093+home["y"]*19349663+state.get("day",1))%min(3,len(candidates))
        distance,_,shop,route=candidates[slot]
        visitors=min(3,max(1,round(home.get("occupants",0)*.12)))
        residents=home.get("residents",[])
        car_share=sum(bool(p.get("carAccess")) for p in residents)/max(1,len(residents))
        mode="auto" if distance>3 and car_share>=.35 else "walk"
        key=(home["x"],home["y"],shop["x"],shop["y"],mode)
        grouped.setdefault(key,{"from":[home["x"],home["y"]],"to":[shop["x"],shop["y"]],"route":route,"mode":mode,"distance":distance,"workers":0,"reason":"compras","destinationName":shop.get("name","Comercio local")})["workers"]+=visitors
    trips=[]
    for trip in grouped.values():
        count=trip["workers"];vehicles=math.ceil(count/1.4) if trip["mode"]=="auto" else 0
        factor=traffic_factor(trip["route"]) if trip["mode"]=="auto" else 1
        ride=round(trip["distance"]*(2.5 if vehicles else 4)*factor)
        trip.update({"vehicles":vehicles,"dailyEmissionsKg":round(vehicles*trip["distance"]*.18*2,2),"walkAccessMinutes":2,"waitingMinutes":0,"rideMinutes":ride,"parkingMinutes":2 if vehicles else 0,"estimatedMinutes":ride+(2 if vehicles else 2),"trafficFactor":round(factor,2),"attendance":1,"roundTrip":True})
        trips.append(trip)
    return trips

def nonwork_service_trips(homes, centers, roads):
    """Desplazamientos básicos a equipamiento cívico, separados de las compras."""
    grouped={}
    for home in homes:
        choices=[]
        for center in centers:
            route=route_between((home["x"],home["y"]),(center["x"],center["y"]))
            if not route:continue
            distance=sum(1 for a,b in zip(route,route[1:]) if tuple(a) in roads and tuple(b) in roads)
            if distance:choices.append((distance,center,route))
        if not choices:continue
        choices.sort(key=lambda row:(row[0],row[1]["x"],row[1]["y"]))
        distance,center,route=choices[(home["x"]+home["y"]+state.get("day",1))%min(2,len(choices))]
        visitors=min(2,max(1,round(home.get("occupants",0)*.05)))
        residents=home.get("residents",[]);car_share=sum(bool(p.get("carAccess")) for p in residents)/max(1,len(residents))
        mode="auto" if distance>3 and car_share>=.35 else "walk"
        key=(home["x"],home["y"],center["x"],center["y"],mode)
        grouped.setdefault(key,{"from":[home["x"],home["y"]],"to":[center["x"],center["y"]],"route":route,"mode":mode,"distance":distance,"workers":0,"reason":"servicios","destinationName":center.get("name","Servicio cívico")})["workers"]+=visitors
    trips=[]
    for trip in grouped.values():
        vehicles=math.ceil(trip["workers"]/1.4) if trip["mode"]=="auto" else 0
        factor=traffic_factor(trip["route"]) if vehicles else 1
        ride=round(trip["distance"]*(2.5 if vehicles else 4)*factor)
        trip.update({"vehicles":vehicles,"dailyEmissionsKg":round(vehicles*trip["distance"]*.18*2,2),"walkAccessMinutes":2,"waitingMinutes":0,"rideMinutes":ride,"parkingMinutes":2 if vehicles else 0,"estimatedMinutes":ride+2,"trafficFactor":round(factor,2),"attendance":1,"roundTrip":True})
        trips.append(trip)
    return trips

def commute_model():
    """Asigna residentes identificables a una vacante y una ruta laboral cada uno."""
    global _commute_cache_key,_commute_cache
    ensure_resident_roster()
    roads={tuple(r) for r in state["roads"]}
    homes=[b for b in state["buildings"] if b.get("kind")=="home" and b.get("occupants",0)>0]
    sites=[b for b in state["buildings"] if b.get("status","operativo") in ("operativo","habilitado") and
           (b.get("kind") in ("civic","school","fireStation","depot","landfill","recyclingPlant","port","airport","powerPlant","waterPlant","wastewaterPlant") or (b.get("kind") in ("shop","hotel","factory") and b.get("business",{}).get("status")=="abierto"))]
    state.setdefault("busRoutes",[])
    for line in state["busRoutes"]:
        path=bus_line_route(line)
        line["route"]=path or []
        line["stops"]=bus_line_stops(line["route"])
        line["operational"]=bool(line.get("status")=="active" and path)
        line["pauseReason"]="Sin conexión vial entre las paradas" if line.get("status")=="active" and not path else line.get("pauseReason")
        line["ridersThisPass"]=0
        line["returnRidersThisPass"]=0
        line["ridersByWindow"]={};line["returnRidersByWindow"]={}
        line["forecastMonthlyFareRevenue"]=0
        if not line["operational"]:line.update({"monthlyOperatingCost":0,"monthlyFareRevenue":0})
    key=(state["day"],state["jobs"],state["employment"],tuple(sorted(roads)),
         tuple((b.get("x"),b.get("y"),b.get("kind"),b.get("occupants",0),b.get("status"),b.get("business",{}).get("status"),b.get("business",{}).get("jobSlots"),b.get("business",{}).get("wage"),tuple((r.get("id"),r.get("workerEligible"),r.get("status"),tuple(sorted(r.get("skills",{}).items())),r.get("expectedMonthlyWage")) for r in b.get("residents",[]))) for b in homes+sites),
         tuple((o.get("id"),o.get("status"),round(o.get("travelledDistance",0),1)) for o in state.get("supply",{}).get("orders",[]) if o.get("status")=="en tránsito"),
         tuple((b.get("id"),b.get("status"),b.get("buses"),b.get("fare"),tuple(map(tuple,b.get("route",[])))) for b in state.get("busRoutes",[])))
    if key==_commute_cache_key and not state["busRoutes"]:
        for line in state.get("busRoutes",[]):
            riders=sum(t["workers"] for t in _commute_cache["routes"] if t.get("busLineId")==line.get("id"))
            line.update({"ridersThisPass":riders,"dailyRiders":riders,"monthlyFareRevenue":line.get("monthlyFareRevenue",0) if line.get("fareCollectedDay")==state["day"] else round(riders*line.get("fare",BUS_FARE)*44) if line.get("operational") else 0,"monthlyOperatingCost":line.get("buses",1)*BUS_MONTHLY_OPERATING_COST if line.get("operational") else 0})
        return _commute_cache
    weights={"shop":1.0,"civic":.8,"school":.8,"fireStation":.8,"depot":.65,"port":.85,"airport":.9,"powerPlant":1.0,"waterPlant":.9,"wastewaterPlant":.8,"landfill":.7,"recyclingPlant":.8}
    company_jobs=sum(b.get("business",{}).get("jobSlots",0) for b in sites if b["kind"] in ("shop","hotel","factory"))
    public_sites=[b for b in sites if b["kind"] in ("civic","school","fireStation","depot","landfill","port","airport","powerPlant","waterPlant","wastewaterPlant","recyclingPlant")]
    public_jobs=max(0,state["jobs"]-company_jobs)
    public_weight=sum(weights[b["kind"]] for b in public_sites)
    caps=[max(0,int(b.get("business",{}).get("jobSlots",0))) if b["kind"] in ("shop","hotel","factory") else min(max(0,int(b.get("jobSlots",public_jobs))),public_jobs*weights[b["kind"]]/max(.01,public_weight)) for b in sites]
    routes={}; distances={}
    for hi,home in enumerate(homes):
        for si,site in enumerate(sites):
            path=route_between((home["x"],home["y"]),(site["x"],site["y"]))
            if path:
                routes[hi,si]=path
                distances[hi,si]=sum(1 for aa,bb in zip(path,path[1:]) if tuple(aa) in roads and tuple(bb) in roads)
    residents=[(hi,home,person) for hi,home in enumerate(homes) for person in home.get("residents",[]) if person.get("workerEligible")]
    airport_jobs=sum(max(0,int(site.get("jobSlots",0))) for site in sites if site.get("kind") in ("airport","hotel","powerPlant","waterPlant","wastewaterPlant","landfill"))
    target=min(round(len(residents)*max(0,min(100,state["employment"]))/100)+airport_jobs,round(sum(caps)))
    remaining={si:int(math.floor(cap)) for si,cap in enumerate(caps)}
    # Priorizar residentes sin empleo; rutas cortas primero. Cada residente recibe un solo empleador.
    reserved_drivers={pid for line in state["busRoutes"] if line.get("status")=="active" and line.get("route") for pid in line.get("driverIds",[])}
    candidates=[];seeking_without_route=[];seeking_without_skill=[];seeking_below_wage=[]
    for hi,home,person in residents:
        prior_status=person.get("status");prior_employer=person.get("employerName");prior_employer_id=person.get("employerId")
        person.update({"status":"buscando","employerId":None,"employerName":None,"monthlyWage":0,"attendance":0})
        ensure_person_work_profile(person)
        if person.get("id") in reserved_drivers:continue
        reachable=sorted((distances[hi,si],si) for si in range(len(sites)) if (hi,si) in routes)
        qualified=[(distance,si) for distance,si in reachable if person["skills"].get(workplace_profile(sites[si])[0],0)>=workplace_profile(sites[si])[2]]
        choices=[(distance,si) for distance,si in qualified if workplace_profile(sites[si])[3]>=person["expectedMonthlyWage"]]
        row=(home,person,prior_status,prior_employer,prior_employer_id)
        if choices:
            choices.sort(key=lambda row:(0 if sites[row[1]].get("kind")=="airport" else 1,row[0],row[1]))
            candidates.append((choices[0][0],hi,home,person,choices,prior_status,prior_employer,prior_employer_id))
        elif not reachable:seeking_without_route.append(row)
        elif not qualified:seeking_without_skill.append(row)
        else:seeking_below_wage.append(row)
    candidates.sort(key=lambda row:(row[0],row[1],row[3]["id"]))
    employees=[]; site_people={si:[] for si in range(len(sites))}
    for _,hi,home,person,choices,prior_status,prior_employer,prior_employer_id in candidates:
        if len(employees)>=target:break
        si=next((candidate for _,candidate in choices if remaining[candidate]>0),None)
        if si is None:continue
        site=sites[si];firm=site.get("business",{}) if site["kind"] in ("shop","hotel","factory") else {}
        wage=workplace_profile(site)[3]
        employer_id=firm.get("id",f"public-{site['kind']}-{site['x']}-{site['y']}")
        person.update({"status":"empleado","employerId":employer_id,"employerName":site.get("name",site["kind"]),"monthlyWage":wage})
        search_start=person.get("unemployedSinceDay")
        if prior_status!="empleado" and search_start is not None:
            search_days=max(0,state.get("day",1)-int(search_start));person["lastUnemploymentDurationDays"]=search_days
            person["lastHireDay"]=state.get("day",1)
            person["lastEmployerBeforeHire"]=prior_employer or person.get("previousEmployer")
            if search_days>0:
                person["unemploymentEpisodes"]=person.get("unemploymentEpisodes",0)+1
                history=state.setdefault("laborHistory",[])
                history.append({"day":state.get("day",1),"personId":person.get("id"),"fromEmployer":prior_employer or person.get("previousEmployer"),"toEmployer":site.get("name",site["kind"]),"searchDays":search_days})
                del history[:-500]
            person["unemployedSinceDay"]=None;person["unemploymentReason"]=None
        remaining[si]-=1
        distance=distances[hi,si];mode="walk" if distance<=3 or not person["carAccess"] else "auto"
        person["commuteMode"]=mode
        depart_window,return_window=work_shift_for(person["id"])
        person.update({"workShiftWindow":depart_window,"returnShiftWindow":return_window})
        item={"home":home,"person":person,"site":site,"siteIndex":si,"wage":wage,"route":routes[hi,si],"distance":distance,"mode":mode,"departureWindowKey":depart_window,"returnWindowKey":return_window}
        employees.append(item);site_people[si].append(item)
    employed_ids={emp["person"].get("id") for emp in employees}
    for home,person,prior_status,prior_employer,prior_employer_id in seeking_without_route:
        person.update({"status":"buscando","employerId":None,"employerName":None,"monthlyWage":0,"attendance":0})
        if person.get("unemployedSinceDay") is None:person["unemployedSinceDay"]=state.get("day",1)
        person["unemploymentReason"]="sin acceso vial"
        if prior_status=="empleado":
            person["previousEmployer"]=prior_employer;person["previousEmployerId"]=prior_employer_id
    for group,reason in ((seeking_without_skill,"sin cualificación para las vacantes alcanzables"),(seeking_below_wage,"salario ofrecido inferior al esperado")):
        for home,person,prior_status,prior_employer,prior_employer_id in group:
            person.update({"status":"buscando","employerId":None,"employerName":None,"monthlyWage":0,"attendance":0})
            if person.get("unemployedSinceDay") is None:person["unemployedSinceDay"]=state.get("day",1)
            person["unemploymentReason"]=reason
            if prior_status=="empleado":
                person["previousEmployer"]=prior_employer;person["previousEmployerId"]=prior_employer_id
    for _,_,_,person,_,prior_status,prior_employer,prior_employer_id in candidates:
        if person.get("id") in employed_ids:continue
        person.update({"status":"buscando","employerId":None,"employerName":None,"monthlyWage":0,"attendance":0})
        if person.get("unemployedSinceDay") is None:person["unemployedSinceDay"]=state.get("day",1)
        person["unemploymentReason"]="sin vacante alcanzable"
        if prior_status=="empleado":
            person["previousEmployer"]=prior_employer;person["previousEmployerId"]=prior_employer_id
    driver_count=0
    for line in state["busRoutes"]:
        previous=set(line.get("driverIds",[]))
        line["driverIds"]=[];line["driverShifts"]=[]
        if line.get("status")=="active" and len(line.get("route",[]))>1:
            candidates_for_line=[]
            for _,home,person in residents:
                if person.get("status")!="buscando" or person["skills"].get("logistica",0)<42 or person.get("expectedMonthlyWage",0)>10:continue
                path=route_between((home["x"],home["y"]),tuple(line["from"]))
                if path:candidates_for_line.append((0 if person["id"] in previous else 1,len(path),str(person["id"]),person))
            selected=sorted(candidates_for_line)[:line.get("buses",1)*2]
            # Una unidad presta servicio completo solo si cubre ambos turnos.
            for index,(_,_,_,person) in enumerate(selected[:len(selected)//2*2]):
                person.update({"status":"empleado","employerId":f"bus-{line['id']}","employerName":f"Colectivo · {line.get('originName','Línea')}","monthlyWage":10,"attendance":1,"commuteMode":"walk","busLineId":None,"unemployedSinceDay":None,"unemploymentReason":None})
                line["driverIds"].append(person["id"])
                line["driverShifts"].append({"personId":person["id"],"busIndex":index//2+1,"shift":"mañana" if index%2==0 else "tarde","window":"05:00–14:00" if index%2==0 else "14:00–23:00"})
        line["driverCapacityBuses"]=len(line["driverIds"])//2
        factor=max(0,min(1,float(state.get("finance",{}).get("programBudgets",{}).get("mobilityFundingFactor",1))))
        line["effectiveBuses"]=round(min(line.get("buses",1),line["driverCapacityBuses"])*factor,2)
        line["operational"]=line.get("status")=="active" and len(line.get("route",[]))>1 and line["effectiveBuses"]>0
        line["pauseReason"]=("Faltan dos conductores compatibles por colectivo para cubrir mañana y tarde" if line.get("status")=="active" and len(line.get("route",[]))>1 and not line["operational"] else "Sin conexión vial entre las paradas" if line.get("status")=="active" and len(line.get("route",[]))<=1 else None)
        line.update(bus_service_schedule(line))
        line["monthlyOperatingCost"]=line["effectiveBuses"]*BUS_MONTHLY_OPERATING_COST+line["monthlyServiceCost"] if line["operational"] else 0
        if not line["operational"]:line["monthlyFareRevenue"]=0
        driver_count+=len(line["driverIds"])
    garages=sorted((b for b in state["buildings"] if b.get("kind")=="busGarage" and b.get("status") in ("habilitado","operativo")),key=lambda b:(b["x"],b["y"]))
    free_bays={f"garage-{g['x']}-{g['y']}":g.get("busBayCapacity",4) for g in garages}
    for line in sorted(state["busRoutes"],key=lambda b:str(b.get("id"))):
        line["garageAssignments"]=[]
        if line["operational"]:
            reachable=[]
            for garage in garages:
                path=route_between((garage["x"],garage["y"]),tuple(line["from"]))
                if path:reachable.append((len(path),garage["x"],garage["y"],garage))
            for _,_,_,garage in sorted(reachable):
                garage_id=f"garage-{garage['x']}-{garage['y']}"
                assigned=min(free_bays[garage_id],line["effectiveBuses"]-sum(a["buses"] for a in line["garageAssignments"]))
                if assigned>0:line["garageAssignments"].append({"garageId":garage_id,"buses":assigned});free_bays[garage_id]-=assigned
        line["garageBuses"]=sum(a["buses"] for a in line["garageAssignments"])
        line["leasedBuses"]=line["effectiveBuses"]-line["garageBuses"]
        line["monthlyOperatingCost"]=line["effectiveBuses"]*BUS_MONTHLY_OPERATING_COST-line["garageBuses"]*30+line.get("monthlyServiceCost",0) if line["operational"] else 0
    segment_flow={}; commutes=[]; site_effective={si:0 for si in range(len(sites))}; site_minutes={si:0 for si in range(len(sites))}; weighted_minutes=0; distance_total=0
    grouped={}
    for emp in employees:
        window=emp.get("departureWindowKey","morningPeak")
        itinerary=choose_bus_itinerary(emp)
        if itinerary:
            for line,leg_fare in zip(itinerary["lines"],itinerary["legFares"]):
                line["ridersThisPass"]+=1
                counts=line.setdefault("ridersByWindow",{});counts[window]=counts.get(window,0)+1
            ids=[line["id"] for line in itinerary["lines"]]
            emp.update({"mode":"bus","busLineId":ids[0],"busLineIds":ids,"busLegFares":itinerary["legFares"],"busHeadways":itinerary.get("headways",[]),"busLine":itinerary["lines"][0],"busAccessSegments":itinerary["access"],"busDistance":itinerary["ride"],"transferMinutes":itinerary["transferMinutes"],"transferStop":itinerary["transferStop"],"busFare":itinerary["fare"],"busTravelRoute":itinerary["travelRoute"]})
            emp["person"].update({"busHeadways":itinerary.get("headways",[])})
            emp["person"].update({"commuteMode":"bus","busLineId":ids[0],"busLineIds":ids,"busLegFares":itinerary["legFares"]})
        else:
            emp["busLineId"]=None;emp["busLineIds"]=[];emp["busLegFares"]=[];emp["person"].update({"commuteMode":emp["mode"],"busLineId":None,"busLineIds":[],"busLegFares":[]})
        group=(emp["home"]["x"],emp["home"]["y"],emp["site"]["x"],emp["site"]["y"],emp["mode"],tuple(emp.get("busLineIds",[])),window)
        grouped.setdefault(group,[]).append(emp)
        distance_total+=emp["distance"]
    walking=auto_commuters=bus_commuters=vehicles=0;emissions=0.0
    for (hx,hy,sx,sy,mode,line_ids,window),items in grouped.items():
        route=items[0]["route"];distance=items[0].get("busDistance",items[0]["distance"]);factor=1.0
        line=items[0].get("busLine") if mode=="bus" else None
        headway=line.get("headwayByWindow",{}).get(window,line.get("headwayMinutes",60)) if line else None
        walk_access=items[0].get("busAccessSegments",0)*4 if line else 2;wait=0 if mode=="walk" else round(headway/2) if line else 3;ride=round(distance*(4 if mode=="walk" else 1.8 if line else 2.5)*factor);parking=0 if mode in ("walk","bus") else 2
        transfer_minutes=items[0].get("transferMinutes",0)
        minutes=walk_access+wait+ride+parking+transfer_minutes;attendance=max(.25,1-max(0,minutes-15)/240)
        trip_vehicles=math.ceil(len(items)/1.4) if mode=="auto" else 0
        trip_emissions=round(trip_vehicles*distance*.18,2)
        walking+=len(items) if mode=="walk" else 0;auto_commuters+=len(items) if mode=="auto" else 0;bus_commuters+=len(items) if mode=="bus" else 0;vehicles+=trip_vehicles;emissions+=trip_emissions
        commutes.append({"from":[hx,hy],"to":[sx,sy],"workers":len(items),"distance":distance,"route":route,"busTravelRoute":items[0].get("busTravelRoute"),"mode":mode,"busLineId":line.get("id") if line else None,"busLineIds":list(line_ids),"busLegFares":items[0].get("busLegFares",[]),"transferStop":items[0].get("transferStop"),"fare":items[0].get("busFare",0),"headwayMinutes":headway,"reason":"trabajo","departureWindow":dict((key,label) for key,label,_ in BUS_WINDOW_DEPARTURES).get(window,"07:00–09:00"),"departureWindowKey":window,"walkAccessMinutes":walk_access,"waitingMinutes":wait,"rideMinutes":ride,"parkingMinutes":parking,"transferMinutes":transfer_minutes,"estimatedMinutes":minutes,"vehicles":trip_vehicles,"dailyEmissionsKg":trip_emissions,"trafficFactor":round(factor,2),"attendance":round(attendance,2),"people":[{"id":emp["person"].get("id"),"name":emp["person"].get("name") or f"Vecino #{str(emp['person'].get('id',''))[-5:]}","age":emp["person"].get("age"),"status":emp["person"].get("status"),"employerName":emp["person"].get("employerName"),"monthlyWage":emp["person"].get("monthlyWage",0),"home":[emp["home"]["x"],emp["home"]["y"]]} for emp in items]})
        weighted_minutes+=len(items)*minutes
        si=items[0]["siteIndex"];site_effective[si]+=len(items)*attendance;site_minutes[si]+=len(items)*minutes
        for aa,bb in zip(route,route[1:]):
            aa=tuple(aa);bb=tuple(bb)
            if aa in roads and bb in roads and mode=="auto":
                edge=tuple(sorted((aa,bb)));segment_flow[edge]=segment_flow.get(edge,0)+trip_vehicles/75
    for line in state.get("busRoutes",[]):
        if not line.get("operational"):continue
        vehicles+=line.get("effectiveBuses",0);emissions+=round(line.get("effectiveBuses",0)*max(0,len(line["route"])-1)*.55,2)
        for aa,bb in zip(line["route"],line["route"][1:]):
            edge=tuple(sorted((tuple(aa),tuple(bb))))
            if edge[0] in roads and edge[1] in roads:segment_flow[edge]=segment_flow.get(edge,0)+line.get("effectiveBuses",0)/80
        line["dailyRiders"]=line.get("ridersThisPass",0)
        if line.get("fareCollectedDay")!=state["day"]:line["monthlyFareRevenue"]=line.get("forecastMonthlyFareRevenue",0)
        line["monthlyOperatingCost"]=line.get("effectiveBuses",0)*BUS_MONTHLY_OPERATING_COST-line.get("garageBuses",0)*30+line.get("monthlyServiceCost",0)
    workplaces=[];staffed=private_staffed=0
    for si,site in enumerate(sites):
        slots=caps[si];effective=min(slots,site_effective[si]);staffed+=effective
        if site["kind"]=="shop":private_staffed+=effective
        people=site_people[si]
        category,label,minimum,job_wage=workplace_profile(site)
        workplaces.append({"name":site.get("name",site["kind"].title()),"kind":site["kind"],"x":site["x"],"y":site["y"],"jobSlots":round(slots),"workersAssigned":len(people),"staffedJobs":round(effective),"payroll":sum(x["wage"] for x in people),"attendance":round(effective/max(1,len(people)),2),"meanMinutes":round(site_minutes[si]/len(people)) if people else None,"jobCategory":category,"jobCategoryLabel":label,"minimumSkill":minimum,"offeredWage":job_wage})
    total_eligible=len(residents);without_access=sum(1 for _,home,person in residents if person.get("status")!="empleado" and not any((hi,si) in routes for si in range(len(sites)) for hi,h in enumerate(homes) if h is home))
    model={"commuters":len(employees),"walkingCommuters":walking,"autoCommuters":auto_commuters,"busCommuters":bus_commuters,"vehicles":vehicles,"dailyEmissionsKg":round(emissions,2),"workersWithoutRoadAccess":without_access,"unemployed":max(0,total_eligible-len(employees)-without_access),"meanDistance":round(distance_total/max(1,len(employees)),1) if employees else 0,"meanMinutes":round(weighted_minutes/max(1,len(employees))) if employees else 0,"effectiveEmployment":round(staffed/max(1,state["population"]*.42)*100),"effectiveWorkers":round(staffed),"staffedJobs":round(staffed),"privateStaffedJobs":round(private_staffed),"workplaces":workplaces,"routes":commutes,"segmentFlow":segment_flow,"employees":employees}
    _commute_cache_key=key;_commute_cache=model
    # Now that segment flows are cached, congestion can include both commuters and trucks.
    minutes_sum=0;effective_by_site={};minutes_by_site={};workers_by_site={}
    for trip in commutes:
        bus_line=next((b for b in state.get("busRoutes",[]) if b.get("id")==trip.get("busLineId")),None) if trip["mode"]=="bus" else None
        factor=1.0 if trip["mode"]=="walk" else traffic_factor(trip.get("busTravelRoute") or trip["route"])
        ride_rate=4 if trip["mode"]=="walk" else 1.8 if trip["mode"]=="bus" else 2.5
        signal_wait=signal_delay_minutes(trip.get("busTravelRoute") or trip["route"],roads) if trip["mode"]!="walk" else 0
        minutes=trip["walkAccessMinutes"]+trip["waitingMinutes"]+round(trip["distance"]*ride_rate*factor)+trip["parkingMinutes"]+trip.get("transferMinutes",0)+signal_wait
        trip["rideMinutes"]=round(trip["distance"]*ride_rate*factor)
        trip["estimatedMinutes"]=minutes
        trip["signalWaitMinutes"]=signal_wait
        attendance=max(.25,1-max(0,minutes-15)/240)
        trip.update({"trafficFactor":round(factor,2),"estimatedMinutes":minutes,"attendance":round(attendance,2)})
        if trip.get("reason")=="regreso":continue
        group=(trip["from"][0],trip["from"][1],trip["to"][0],trip["to"][1],trip["mode"],tuple(trip.get("busLineIds",[])),trip.get("departureWindowKey","morningPeak"))
        for emp in grouped.get(group,[]):
            emp["attendance"]=attendance
            emp["earnedWage"]=round(emp["wage"]*attendance)
            emp["person"]["attendance"]=round(attendance,2)
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
        workplace["payroll"]=sum(emp.get("earnedWage",emp["wage"]) for emp in site_people[si])
        staffed+=effective
        if workplace["kind"]=="shop":private_staffed+=effective
    model.update({"meanMinutes":round(minutes_sum/max(1,len(employees))) if employees else 0,"effectiveWorkers":round(staffed),"staffedJobs":round(staffed),"privateStaffedJobs":round(private_staffed),"effectiveEmployment":round(staffed/max(1,state["population"]*.42)*100)})
    model["transferCommuters"]=sum(trip["workers"] for trip in commutes if trip.get("reason")=="trabajo" and len(trip.get("busLineIds",[]))==2)
    model["carAccessWorkers"]=sum(1 for _,_,person in residents if person.get("carAccess"))
    for line in state["busRoutes"]:
        if line.get("status")=="cancelled":continue
        workplaces.append({"name":f"Colectivo · {line.get('originName','Línea')}","kind":"bus","x":line["from"][0],"y":line["from"][1],"jobSlots":line.get("buses",0)*2,"workersAssigned":len(line["driverIds"]),"staffedJobs":len(line["driverIds"]),"payroll":len(line["driverIds"])*10,"attendance":1 if line["driverIds"] else 0,"meanMinutes":None,"jobCategory":"logistica","jobCategoryLabel":"Logística","minimumSkill":42,"offeredWage":10})
    model.update({"effectiveWorkers":round(staffed+driver_count),"staffedJobs":round(staffed+driver_count),"effectiveEmployment":round((staffed+driver_count)/max(1,state["population"]*.42)*100)})
    returning=add_return_commutes(employees,commutes)
    model.update({key:value for key,value in returning.items() if key!="returnEmissionsKg"})
    model["dailyEmissionsKg"]=round(model["dailyEmissionsKg"]+returning["returnEmissionsKg"],2)
    shopping=nonwork_shopping_trips(homes,[s for s in sites if s.get("kind")=="shop"],roads)
    services=nonwork_service_trips(homes,[b for b in state["buildings"] if b.get("kind")=="civic" and b.get("status","operativo") in ("operativo","habilitado")],roads)
    for trip in shopping+services:
        commutes.append(trip)
        model["dailyEmissionsKg"]+=trip["dailyEmissionsKg"]
        model["vehicles"]+=trip["vehicles"]
        for a,b in zip(trip["route"],trip["route"][1:]):
            edge=tuple(sorted((tuple(a),tuple(b))))
            segment_flow[edge]=segment_flow.get(edge,0)+trip["vehicles"]*2
    model["shoppingTrips"]=len(shopping)
    model["shoppingPassengers"]=sum(t["workers"] for t in shopping)
    model["shoppingVehicles"]=sum(t["vehicles"]*2 for t in shopping)
    model["shoppingEmissionsKg"]=round(sum(t["dailyEmissionsKg"] for t in shopping),2)
    model["serviceTrips"]=len(services)
    model["serviceVisitors"]=sum(t["workers"] for t in services)
    model["serviceVehicles"]=sum(t["vehicles"]*2 for t in services)
    model["serviceEmissionsKg"]=round(sum(t["dailyEmissionsKg"] for t in services),2)
    model["dailyTrips"] = sum(t["workers"] for t in commutes)
    model["routes"]=commutes
    eligible_people=[person for home in homes for person in home.get("residents",[]) if person.get("workerEligible")]
    jobseekers=[person for person in eligible_people if person.get("status")=="buscando"]
    search_days=[max(0,state.get("day",1)-int(person.get("unemployedSinceDay",state.get("day",1)))) for person in jobseekers]
    jobseeker_rows=[(hi,home,person) for hi,home,person in residents if person.get("status")=="buscando"]
    reachable_sites={si for hi,_,_ in jobseeker_rows for si in range(len(sites)) if (hi,si) in routes}
    model["laborMarket"]={"workingAge":len(eligible_people),"employed":sum(1 for person in eligible_people if person.get("status")=="empleado"),
        "jobSeekers":len(jobseekers),"outsideLaborForce":sum(1 for person in eligible_people if person.get("status")=="inactivo"),
        "seekersWithoutQualification":sum(1 for person in jobseekers if person.get("unemploymentReason")=="sin cualificación para las vacantes alcanzables"),
        "seekersBelowExpectedWage":sum(1 for person in jobseekers if person.get("unemploymentReason")=="salario ofrecido inferior al esperado"),
        "seekersWithoutRoadAccess":sum(1 for person in jobseekers if person.get("unemploymentReason")=="sin acceso vial"),
        "reachableVacancies":sum(max(0,round(workplaces[si].get("jobSlots",0))-workplaces[si].get("workersAssigned",0)) for si in reachable_sites),
        "openVacancies":sum(max(0,round(w.get("jobSlots",0))-w.get("workersAssigned",0)) for w in workplaces),
        "averageSearchDays":round(sum(search_days)/max(1,len(search_days)),1),"longestSearchDays":max(search_days,default=0),
        "previouslyEmployed":sum(1 for person in jobseekers if person.get("previousEmployer")),
        "completedSearches30Days":sum(1 for item in state.get("laborHistory",[]) if state.get("day",1)-30<item.get("day",0)<=state.get("day",1))}
    return model

def bus_line_stops(path):
    if not path:return []
    buildings=[b for b in state.get("buildings",[]) if b.get("kind") in ("home","shop","civic","depot","busStop") and b.get("status","operativo") in ("operativo","habilitado") and (b.get("kind")!="shop" or b.get("business",{}).get("status")=="abierto")]
    stops=[]
    for building in buildings:
        access,index=min((abs(building["x"]-point[0])+abs(building["y"]-point[1]),i) for i,point in enumerate(path))
        if access>1:continue
        stops.append({"index":index,"at":path[index],"name":building.get("name",building.get("kind","Parada")),"kind":building["kind"],"accessSegments":access})
    unique={}
    for stop in sorted(stops,key=lambda x:(x["index"],x["accessSegments"],x["name"])):
        unique.setdefault((stop["index"],tuple(stop["at"])),stop)
    return list(unique.values())

def bus_route_catalog(commute=None):
    commute=commute or commute_model();grouped={}
    for trip in commute["routes"]:
        if trip.get("reason")!="trabajo":continue
        key=(*trip["from"],*trip["to"]);row=grouped.setdefault(key,{"from":trip["from"],"to":trip["to"],"route":trip["route"],"distance":trip["distance"],"potentialRiders":0})
        row["potentialRiders"]+=trip["workers"]
    reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state.get("projects",[]) if not p.get("privatePaid"));available=max(0,state["money"]-reserved)
    result=[]
    for row in sorted(grouped.values(),key=lambda x:(-x["potentialRiders"],-x["distance"],x["from"],x["to"])):
        if row["distance"]<4:continue
        line_id=f"bus-{row['from'][0]}-{row['from'][1]}-{row['to'][0]}-{row['to'][1]}"
        origin=next((b.get("name","Barrio residencial") for b in state["buildings"] if b.get("kind")=="home" and [b["x"],b["y"]]==row["from"]),"Barrio residencial")
        destination=next((b.get("name",b.get("kind","Destino")) for b in state["buildings"] if [b["x"],b["y"]]==row["to"]),"Centro de empleo")
        existing=next((b for b in state.get("busRoutes",[]) if b.get("from")==row["from"] and b.get("to")==row["to"] and b.get("status")!="cancelled"),None)
        result.append({**row,"id":line_id,"originName":origin,"destinationName":destination,"stops":bus_line_stops(row["route"]),"buses":1,"purchaseCost":BUS_PURCHASE_COST,"canStart":not existing and available>=BUS_PURCHASE_COST,"reason":"Ya existe una línea para este corredor" if existing else "Fondos municipales comprometidos" if available<BUS_PURCHASE_COST else ""})
    return result[:8]

def signal_delay_minutes(route, roads):
    """Espera media de 30 s por cruce señalizado (tres o cuatro accesos)."""
    delay=0
    for x,y in (route or [])[1:-1]:
        degree=sum((x+dx,y+dy) in roads for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)))
        if degree>=3:delay+=.5
    return delay


def traffic_factor(route, exclude_order=None):
    """Tiempo relativo por tramo: empleo local más camiones que ocupan ese tramo hoy."""
    if not route or len(route)<2:return 1.0
    factors=[]
    supply=state.get("supply",{})
    active=[o for o in supply.get("orders",[])+supply.get("marketOrders",[])
            if o is not exclude_order and o.get("status")=="en tránsito" and state["day"]>o.get("supplierReadyDay",o.get("orderedDay",0)) and len(o.get("route",[]))>1]
    for i in range(len(route)-1):
        a=tuple(route[i]);b=tuple(route[i+1]);edge=tuple(sorted((a,b)))
        arterial=a[1]==10 or b[1]==10 or a[0]==12 or b[0]==12
        background=(_commute_cache or commute_model())["segmentFlow"].get(edge,0)
        capacity=road_traffic_capacity(a,b)
        trucks=0
        for order in active:
            path=order.get("route",[]);idx=min(len(path)-2,max(0,int(order.get("travelledDistance",0))))
            if tuple(sorted((tuple(path[idx]),tuple(path[idx+1]))))==edge:trucks+=1
        ratio=(background+trucks)/capacity
        factors.append(1+.35*ratio*ratio+2.4*max(0,ratio-1)**2)
    return sum(factors)/len(factors)

def road_traffic_capacity(a,b):
    """Capacidad relativa por tramo; calzadas deterioradas admiten menos flujo."""
    arterial=a[1]==10 or b[1]==10 or a[0]==12 or b[0]==12
    assets={(x.get("x"),x.get("y")):float(x.get("quality",82)) for x in state.get("roadAssets",[])}
    quality=min(assets.get(a,82),assets.get(b,82))
    return (2.4 if arterial else 1.2)*max(.35,min(1,quality/82))

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
        if emp["site"].get("kind") not in ("civic","school","fireStation","depot","landfill","recyclingPlant","port","airport","powerPlant","waterPlant","wastewaterPlant"):continue
        wage=emp.get("earnedWage",emp["wage"]);home=emp["home"]
        home["householdCash"]=round(home.get("householdCash",0)+wage)
        home["monthlyWageIncome"]=home.get("monthlyWageIncome",0)+wage
        payroll+=wage
    # El salario del conductor ya está dentro del costo operativo de la línea.
    active_ids={pid for line in state.get("busRoutes",[]) if line.get("operational") for pid in line.get("driverIds",[])}
    for home in state["buildings"]:
        if home.get("kind")!="home":continue
        for person in home.get("residents",[]):
            if person.get("id") in active_ids and person.get("status")=="empleado":
                wage=person.get("monthlyWage",0)
                home["householdCash"]=round(home.get("householdCash",0)+wage)
                home["monthlyWageIncome"]=home.get("monthlyWageIncome",0)+wage
    return payroll

def draw_business_credit(firm, amount):
    if amount<=0:return 0
    ensure_finance_state();bank=state["finance"]["businessBank"]
    room=max(0,int(firm.get("creditLimit",0)-firm.get("creditDebt",0)))
    draw=min(int(math.ceil(amount)),room,max(0,int(bank.get("liquidity",0))))
    if draw:
        firm["creditDebt"]=firm.get("creditDebt",0)+draw
        firm["cash"]=firm.get("cash",0)+draw
        firm["lastCreditDraw"]=firm.get("lastCreditDraw",0)+draw
        bank["liquidity"]-=draw
    return draw

def close_business(shop, workforce, reason):
    firm=shop.get("business",{})
    if firm.get("status")!="abierto":return 0
    firm["status"]="cerrado";firm["closedDay"]=state["day"];firm["closureReason"]=reason;shop["status"]="cerrado"
    state["jobs"]=max(0,state.get("jobs",0)-firm.get("jobSlots",0));dismissed=0
    for home in (b for b in state["buildings"] if b.get("kind")=="home"):
        for person in home.get("residents",[]):
            if person.get("employerId")!=firm.get("id"):continue
            person["previousEmployer"]=firm.get("name",shop.get("name","Comercio"));person["previousEmployerId"]=firm.get("id");person["unemployedSinceDay"]=state["day"];person["unemploymentReason"]="cierre por insolvencia"
            person.update({"status":"buscando","employerId":None,"employerName":None,"monthlyWage":0,"attendance":0})
            dismissed+=1
    state.setdefault("unemploymentEvents",[]).append({"day":state["day"],"employerId":firm.get("id"),"employerName":firm.get("name"),"workers":dismissed,"cause":reason})
    ev("Empresa insolvente",f"{firm.get('name',shop.get('name','Comercio'))} cerró: {reason}. {dismissed} trabajadores perdieron el puesto y vuelven a buscar empleo; se eliminan {firm.get('jobSlots',0)} vacantes.")
    return dismissed

def refill_market_suppliers():
    for supplier in state["supply"].get("market",{}).values():
        supplier["stock"]=min(supplier.get("maxStock",0),supplier.get("stock",0)+supplier.get("monthlyOutput",0))

def process_market_orders():
    expire_aggregate_contract_lines()
    for order in state["supply"].get("marketOrders",[]):
        if order.get("status")!="en tránsito":continue
        route=route_between(tuple(order.get("source",(4,10))),(order["x"],order["y"]))
        if not route:
            if order.get("statusCause")!="Sin acceso vial":ev("Entrega comercial demorada",f"{order['supplier']} no encuentra una ruta vial hasta {order['businessName']}; la mercadería espera una calle conectada.")
            order["route"]=[];order["statusCause"]="Sin acceso vial";order["arrivalDay"]=state["day"]+1;continue
        order["route"]=route;order["statusCause"]=""
        distance=max(0,len(route)-1);order["travelDistance"]=distance
        factor=traffic_factor(route,order);order["trafficFactor"]=round(factor,2)
        if state["day"]>order["supplierReadyDay"] and order.get("travelledDistance",0)<distance:
            order["travelledDistance"]=min(distance,order.get("travelledDistance",0)+6/max(1,factor))
        remaining=max(0,distance-order.get("travelledDistance",0))
        order["arrivalDay"]=max(state["day"]+1,max(state["day"],order["supplierReadyDay"])+math.ceil(remaining*factor/6))
        if state["day"]<=order["supplierReadyDay"] or order.get("travelledDistance",0)<distance:continue
        building=next((b for b in state["buildings"] if b.get("kind") in ("shop","factory") and b.get("business",{}).get("id")==order["businessId"]),None)
        firm=building.get("business") if building else None
        if firm and firm.get("status")=="abierto":
            if order.get("type")=="industrial_raw" and building.get("kind")=="factory" and order.get("commodity")=="áridos":
                firm["rawMaterialInventory"]=firm.get("rawMaterialInventory",0)+order["quantity"]
                firm["lastMaterialCause"]="Áridos recibidos desde cantera local"
                ev("Áridos recibidos en hormigonera",f"{order['businessName']} recibió {order['quantity']} unidades para fabricar hormigón.")
            elif order.get("type")=="industrial_raw" and building.get("kind")=="factory" and order.get("commodity")=="acero":
                firm["rawSteelInventory"]=firm.get("rawSteelInventory",0)+order["quantity"]
                firm["lastMaterialCause"]="Acero regional recibido"
                ev("Acero recibido en metalúrgica",f"{order['businessName']} recibió {order['quantity']} unidades de acero para fabricar componentes.")
            elif order.get("type")=="industrial_raw" and building.get("kind")=="factory":
                firm["rawMaterialInventory"]=firm.get("rawMaterialInventory",0)+order["quantity"]
                industry=state.setdefault("localIndustry",{"unitsProduced":0,"unitsSold":0,"unitsImported":0,"history":[]})
                industry["unitsImported"]=industry.get("unitsImported",0)+order["quantity"]
                firm["lastMaterialCause"]="Entrega recibida"
                ev("Grano recibido en fábrica",f"{order['businessName']} recibió {order['quantity']} unidades tras {distance} tramos; existencias {firm['rawMaterialInventory']}.")
            else:
                firm["inputInventory"]=firm.get("inputInventory",0)+order["quantity"]
                ev("Insumos recibidos",f"{order['supplier']} entregó {order['quantity']} unidades a {order['businessName']} tras {distance} tramos de ruta.")
            order["status"]="entregado";order["deliveredDay"]=state["day"]
            settle_aggregate_contract_line(order,True)
        else:
            order["status"]="cancelado";order["statusCause"]="Empresa cerrada antes de recibir la carga"
            settle_aggregate_contract_line(order,False)

def allocate_regional_export_demand(shops,workforce):
    """Reparte compradores externos finitos entre empresas con personal y salida logística."""
    storage=state.setdefault("regionalMarket",{"history":[],"lastReport":{}});storage.setdefault("history",[])
    workplaces={(w["x"],w["y"]):w for w in workforce.get("workplaces",[])};scores={};access={}
    destinations=[("Salida vial regional",(23,10))]
    destinations.extend((f"Puerto {b.get('name','')}",(b["x"],b["y"])) for b in state.get("buildings",[]) if b.get("kind")=="port" and b.get("status") in ("habilitado","operativo"))
    for shop in shops:
        firm=shop.get("business",{});site=workplaces.get((shop["x"],shop["y"]),{});staffed=max(0,int(site.get("staffedJobs",0)));routes=[]
        if staffed:
            for label,destination in destinations:
                route=route_between((shop["x"],shop["y"]),destination)
                if route:routes.append((len(route),label))
        if not routes:scores[firm.get("id",f"shop-{shop['x']}-{shop['y']}")]=0;access[firm.get("id",f"shop-{shop['x']}-{shop['y']}")]=None;continue
        distance,label=min(routes);access[firm.get("id",f"shop-{shop['x']}-{shop['y']}")]={"destination":label,"distance":max(0,distance-1)}
        job_slots=max(1,int(firm.get("jobSlots",site.get("jobSlots",12))));staff_factor=.4+.6*min(1,staffed/job_slots);price_factor=(22/max(1,int(firm.get("price",18))))**1.15
        quality=max(.35,min(1.15,float(shop.get("urbanCondition",shop.get("quality",82)))/82));utility=max(.2,min(1,float(firm.get("utilityFactor",1))));freight=1/(1+max(0,distance-1)*.027)
        scores[firm.get("id",f"shop-{shop['x']}-{shop['y']}")]=round(staff_factor*price_factor*quality*utility*freight,6)
    score_total=sum(scores.values());competitor_strength=sum(m["competitorStrength"] for m in REGIONAL_MARKETS);city_share=min(.74,score_total/max(.001,score_total+competitor_strength)) if score_total and any(v for v in access.values()) else 0
    capacities=[];budget_total=0
    for market in REGIONAL_MARKETS:
        units=round(market["monthlyUnits"]*city_share);budget=round(market["monthlyBudget"]*city_share);capacities.append({"id":market["id"],"name":market["name"],"regionalDemand":market["monthlyUnits"],"cityOffer":units,"regionalBudget":market["monthlyBudget"],"cityBudget":budget,"competitorSharePct":round((1-city_share)*100)});budget_total+=budget
    total_units=sum(m["cityOffer"] for m in capacities)
    def distribute(total):
        if total<=0 or score_total<=0:return {key:0 for key in scores}
        exact={key:total*value/score_total for key,value in scores.items()};result={key:int(value) for key,value in exact.items()};left=total-sum(result.values())
        for key in sorted(exact,key=lambda k:(-(exact[k]-result[k]),k))[:left]:result[key]+=1
        return result
    units_by_firm=distribute(total_units);budget_by_firm=distribute(budget_total);demand={}
    for shop in shops:
        firm=shop.get("business",{});key=firm.get("id",f"shop-{shop['x']}-{shop['y']}");export_price=max(1,round(max(1,int(firm.get("price",18)))*.78));demand[key]=min(units_by_firm.get(key,0),budget_by_firm.get(key,0)//export_price)
    month=(max(1,int(state.get("day",1)))-1)//30;report={"month":month,"networkAccess":bool(total_units),"accessReason":"Calles conectadas a la salida este o al puerto" if total_units else "Sin calle conectada a la salida regional ni a un puerto operativo","competingCities":[dict(m) for m in capacities],"regionalDemand":sum(m["regionalDemand"] for m in capacities),"cityOffer":total_units,"cityBudget":budget_total,"capturedUnits":0,"capturePct":round(city_share*100),"revenue":0,"unmetOffer":total_units,"companies":sum(v>0 for v in scores.values()),"companyDemand":demand,"routes":access}
    storage["lastReport"]=report;state["regionalMarketReport"]=report
    return demand,report

def refresh_private_investment_opportunity(report,local_unmet=0):
    """Create one reviewable private shop proposal from persistently unserved demand."""
    book=state.setdefault("privateInvestments",{"proposal":None,"history":[],"nextOfferDay":state.get("day",1),"reason":"Esperando condiciones de inversión."})
    book.setdefault("history",[]);book.setdefault("nextOfferDay",state.get("day",1));book.setdefault("delegation",{"enabled":False,"maxPermit":500})
    current=book.get("proposal")
    if current and current.get("status")=="disponible":
        valid_zone=any(z.get("x")==current.get("x") and z.get("y")==current.get("y") and z.get("kind")=="shop" for z in state.get("zones",[]))
        occupied=any(e.get("x")==current.get("x") and e.get("y")==current.get("y") for key in ("buildings","projects","abandoned") for e in state.get(key,[]))
        if state.get("day",1)>current.get("expiresDay",0) or not valid_zone or occupied:
            current["status"]="vencida" if state.get("day",1)>current.get("expiresDay",0) else "parcela ocupada"
            book["history"].append(dict(current));book["history"]=book["history"][-24:];book["proposal"]=None;book["nextOfferDay"]=state.get("day",1)+45
        else:
            # Las parcelas zonificadas pasan al circuito automático también en guardados antiguos.
            current["status"]="absorbida por promotores automáticos"
            book["history"].append(dict(current));book["history"]=book["history"][-24:];book["proposal"]=None
    book["reason"]=""
    if state.get("day",1)<book["nextOfferDay"]:return
    regional_unmet=max(0,int(report.get("unmetOffer",0)))
    local_unmet=max(0,int(local_unmet))
    report["localUnmet"]=local_unmet
    if regional_unmet<12 and local_unmet<12:
        book["reason"]="El promotor espera ventas regionales pendientes o compras de hogares que las tiendas actuales no logran cubrir.";return
    candidates=[];reserved={(e.get("x"),e.get("y")) for key in ("buildings","projects","abandoned") for e in state.get(key,[])}
    for z in state.get("zones",[]):
        if z.get("kind")!="shop" or z.get("status") not in (None,"disponible") or (z.get("x"),z.get("y")) in reserved:continue
        if not any(abs(rx-z["x"])+abs(ry-z["y"])==1 for rx,ry in state.get("roads",[])):continue
        regional_route=route_between((z["x"],z["y"]),(23,10))
        local_route=route_between((z["x"],z["y"]),(4,10)) if local_unmet>=12 else None
        route=regional_route or local_route
        if route:candidates.append((len(route),z["y"],z["x"],z))
    if not candidates:
        book["reason"]="Zonificá una parcela comercial libre junto a una calle conectada para que un inversor pueda evaluarla.";return
    spec=PROJECTS["shop"];permit=round(spec["cost"]*.12);choices=[]
    for contractor,specification in CONTRACTORS.items():
        if not contractor_has_capacity(contractor) or contractor_free_workers(contractor)<LABOR_NEEDS["shop"]:continue
        total=round(spec["cost"]*specification["price"]);private_cost=total-permit
        if state.get("privateCapital",0)<private_cost+1200 or state.get("money",0)<permit:continue
        choices.append((total,round(spec["days"]*specification["days"]/30),contractor,private_cost,specification))
    if not choices:
        book["reason"]="Falta capital privado, presupuesto para permisos o una cuadrilla libre de siete trabajadores.";return
    _,duration,contractor,private_cost,company=min(choices,key=lambda row:(row[0],row[1],row[2]));_,_,_,zone=min(candidates,key=lambda row:(row[0],row[1],row[2]))
    demand_kind="regional" if regional_unmet>=12 else "local"
    unmet_units=max(regional_unmet,local_unmet)
    proposal={"id":uuid.uuid4().hex,"status":"disponible","x":zone["x"],"y":zone["y"],"district":"Puerto" if zone["x"]>=18 else "Centro" if zone["x"]>=10 else "Oeste","contractor":contractor,"createdDay":state.get("day",1),"expiresDay":state.get("day",1)+90,"unmetUnits":unmet_units,"demandSource":demand_kind,"jobs":12,"privateCost":private_cost,"operatingReserve":1200,"municipalPermit":permit,"durationDays":duration,"companyProfile":company["profile"]}
    book["proposal"]=proposal;book["reason"]="La demanda de hogares o de mercados regionales justifica evaluar un nuevo comercio.";ev("Propuesta privada de comercio",f"Un inversor propone abrir un local en parcela {proposal['x']+1},{proposal['y']+1}: {unmet_units} ventas quedaron sin cubrir por demanda {demand_kind}. Requiere $ {private_cost:,} privados, permiso $ {permit}, siete trabajadores de obra y {duration} días estimados.".replace(",","."))
    policy=book.get("delegation",{})
    # Delegación municipal: contratación ordinaria, con los mismos pagos y cuadrilla que una aprobación manual.
    project_id=uuid.uuid4().hex;advance=round(private_cost*.2);zero={key:0 for key in MATERIAL_NAMES};materials=material_plan("shop");purchases=[];bill=0;feasible=True
    for material,amount in materials.items():
        shortage=max(0,amount-state["supply"]["contractors"][contractor].get(material,0))
        if shortage:
            suppliers=sorted((SUPPLIERS[name]["price"],name) for name in SUPPLIERS if state["supply"]["suppliers"].get(name,{}).get(material,0)>=shortage)
            if not suppliers:feasible=False;break
            factor,name=suppliers[0];cost=round(shortage*MATERIAL_PRICE[material]*factor);purchases.append((name,material,shortage,cost));bill+=cost
    if feasible and state["privateCapital"]>=private_cost+bill+1200:
        project={"id":project_id,"kind":"shop","label":PROJECTS["shop"]["label"],"x":zone["x"],"y":zone["y"],"contractor":contractor,"cost":private_cost,"duration":duration,"elapsed":0,"progress":0,"paid":advance,"stages":PROJECTS["shop"]["stageNames"],"stageIndex":0,"status":"contratada","cause":company["profile"],"contractedMandate":int(state.get("government",{}).get("mandate",1)),"contractedDay":state.get("day",1),"monthlyCost":0,"workersAssigned":LABOR_NEEDS["shop"],"materialsRequired":materials,"materialsUsed":zero,"privatePaid":True,"municipalPermitPaid":permit,"delegated":True,"zonedDevelopment":True}
        for supplier,material,amount,cost in purchases:
            state["supply"]["suppliers"][supplier][material]-=amount;state["supply"]["contractors"][contractor][material]+=amount;state["supply"].setdefault("supplierCash",{}).setdefault(supplier,0);state["supply"]["supplierCash"][supplier]+=cost
            settle_local_material_sale(supplier,{material:amount})
        state["money"]-=permit;state["privateCapital"]-=private_cost+bill;state["supply"]["contractorCash"][contractor]+=advance;state["projects"].append(project)
        proposal.update({"status":"aceptada","decisionDay":state.get("day",1),"projectId":project_id,"delegated":True,"zonedDevelopment":True});zone["status"]="en obra";book["history"].append(dict(proposal));book["history"]=book["history"][-24:];book["nextOfferDay"]=state.get("day",1)+90;book["reason"]="La inversión privada quedó contratada con materiales pagados y cuadrilla asignada.";ev("Promotor contrata comercio",f"Permiso $ {permit}; inversión privada $ {private_cost}; materiales $ {bill}; anticipo $ {advance}; siete trabajadores asignados. La obra conserva etapas e inspección.".replace(",","."))
    else:
        book["reason"]="La propuesta espera capital privado o materiales disponibles; no se reserva la parcela."

def simulate_business_month(workforce):
    shops=[b for b in state["buildings"] if b.get("kind")=="shop" and b.get("business",{}).get("status")=="abierto"]
    homes=[b for b in state["buildings"] if b.get("kind")=="home" and b.get("occupants",0)>0]
    demand={(b["x"],b["y"]):0 for b in shops};shopping={key:[] for key in demand};roads={tuple(r) for r in state["roads"]}
    ensure_finance_state();workplace={(w["x"],w["y"]):w for w in workforce["workplaces"]};advance_local_quarries(workplace,workforce.get("employees",[]));advance_local_concrete_plants(workplace,workforce.get("employees",[]));advance_local_sawmills(workplace,workforce.get("employees",[]));advance_local_metalworks(workplace,workforce.get("employees",[]));payroll_paid={}
    for shop in list(shops):
        firm=shop["business"];site=workplace.get((shop["x"],shop["y"]),{});payroll=max(0,int(site.get("payroll",0)))
        firm["lastCreditDraw"]=0;firm["lastInterest"]=0;firm["lastRepayment"]=0
        if firm.get("cash",0)<0:
            close_business(shop,workforce,"caja negativa antes de cubrir la nómina");continue
        if firm.get("cash",0)<payroll:draw_business_credit(firm,payroll-firm.get("cash",0))
        if firm.get("cash",0)<payroll:
            close_business(shop,workforce,"la caja y el crédito disponible no alcanzaron para pagar salarios");continue
        firm["cash"]-=payroll;payroll_paid[firm["id"]]=payroll
        for emp in workforce.get("employees",[]):
            if emp["site"] is shop:
                wage=emp.get("earnedWage",emp["wage"]);home=emp["home"]
                home["householdCash"]=round(home.get("householdCash",0)+wage);home["monthlyWageIncome"]=home.get("monthlyWageIncome",0)+wage
    shops=[b for b in shops if b.get("business",{}).get("status")=="abierto"]
    demand={ (b["x"],b["y"]):0 for b in shops};shopping={key:[] for key in demand}
    regional_demand,regional_report=allocate_regional_export_demand(shops,workforce)
    for shop in shops:shop["business"]["lastRegionalSales"]=0
    for home in homes:
        choices=[]
        for shop in shops:
            route=route_between((home["x"],home["y"]),(shop["x"],shop["y"]))
            if not route:continue
            distance=sum(1 for x,y in zip(route,route[1:]) if tuple(x) in roads and tuple(y) in roads)
            proximity=1/max(1,distance+1)**1.4
            preference=proximity*(18/max(1,shop["business"].get("price",18)))**2
            choices.append((shop,preference))
        if not choices:continue
        choices.sort(key=lambda x:(-x[1],x[0]["x"],x[0]["y"]))
        desired=max(0,round(home.get("occupants",0)*.12))
        cheapest=min(max(1,shop["business"].get("price",18)) for shop,_ in choices)
        units=min(desired,max(0,int(home.get("householdCash",0)//cheapest)))
        total_weight=sum(w for _,w in choices)
        shares=[units*w/total_weight for _,w in choices]
        allocations=[int(value) for value in shares]
        for index in sorted(range(len(choices)),key=lambda i:(-(shares[i]-allocations[i]),-choices[i][1]))[:max(0,units-sum(allocations))]:allocations[index]+=1
        for (shop,_),quantity in zip(choices,allocations):
            if quantity:
                key=(shop["x"],shop["y"]);demand[key]+=quantity;shopping[key].append((home,quantity))
    visitors=state.get("airportVisitorsThisMonth",0)
    if visitors and shops:
        accessible=[]
        airport=next((b for b in state["buildings"] if b.get("kind")=="airport" and b.get("operational")),None)
        for shop in shops:
            route=route_between((airport["x"],airport["y"]),(shop["x"],shop["y"])) if airport else None
            if route:accessible.append(shop)
        units=min(visitors,max(0,round(visitors*.65)))
        for index,shop in enumerate(sorted(accessible,key=lambda b:(b["x"],b["y"]))):
            quantity=units//len(accessible)+(1 if index<units%len(accessible) else 0)
            if quantity:
                key=(shop["x"],shop["y"]);price=max(1,int(shop["business"].get("price",18)))
                demand[key]+=quantity;shopping[key].append(({"householdCash":quantity*price},quantity))
    market_suppliers=state["supply"].setdefault("market",new_market_supply())
    market_orders=state["supply"].setdefault("marketOrders",[])
    industry=state.setdefault("localIndustry",{"unitsProduced":0,"unitsSold":0,"unitsImported":0,"history":[]})
    for factory in [b for b in state.get("buildings",[]) if b.get("kind")=="factory" and b.get("business",{}).get("status")=="abierto"]:
        firm=factory["business"]
        if firm.get("industryType") in ("quarry","concrete","sawmill","metalworks"):continue
        work=workplace.get((factory["x"],factory["y"]),{});staffed=max(0,int(work.get("staffedJobs",0)))
        utility=factory.get("utilityAccess",{});utility_factor=min(utility.get("powerServedPct",0),utility.get("waterServedPct",0),utility.get("wastewaterTreatedPct",0))/100
        capacity=max(0,min(90,round(staffed*1.5*utility_factor)))
        name=f"Fábrica local {factory['x']+1}-{factory['y']+1}"
        supplier=market_suppliers.setdefault(name,{"unitCost":4.0,"stock":0,"maxStock":180,"monthlyOutput":0,"leadDays":1,"profile":"Alimentos procesados · producción local","source":[factory["x"],factory["y"]],"cash":0,"lastSales":0,"commodity":"alimentos"})
        firm.setdefault("rawMaterialInventory",0);firm.setdefault("lastMaterialPurchase",0);firm.setdefault("lastMaterialShortage",0);firm.setdefault("lastMaterialCause","")
        raw_inventory=max(0,int(firm.get("rawMaterialInventory",0)))
        produced=min(capacity,raw_inventory,max(0,supplier.get("maxStock",180)-supplier.get("stock",0)))
        payroll=max(0,int(work.get("payroll",0)));operating=max(0,int(factory.get("monthlyOperatingCost",180)))
        firm["cash"]=int(firm.get("cash",0)-payroll-operating);firm["lastSales"]=0;firm["lastRevenue"]=0;firm["lastInputs"]=0;firm["lastProfit"]=-payroll-operating
        for employee in workforce.get("employees",[]):
            if employee.get("site") is factory:
                wage=max(0,int(employee.get("earnedWage",employee.get("wage",0))));home=employee["home"]
                home["householdCash"]=round(home.get("householdCash",0)+wage);home["monthlyWageIncome"]=home.get("monthlyWageIncome",0)+wage
        supplier["lastSales"]=0;firm["lastLocalSales"]=0
        if firm["cash"]<0:
            firm["status"]="cerrado";factory["status"]="cerrado";state["jobs"]=max(0,state.get("jobs",0)-int(firm.get("jobSlots",20)));supplier["stock"]=0
            ev("Fábrica insolvente",f"{factory.get('name','Fábrica')}: ingresos locales insuficientes para pagar nómina de $ {payroll} y operación de $ {operating}. Se liberaron {firm.get('jobSlots',20)} puestos.")
            continue
        supplier["stock"]+=produced;firm["rawMaterialInventory"]=raw_inventory-produced;firm["lastProduction"]=produced;industry["unitsProduced"]+=produced;supplier["cash"]=firm["cash"]
        pending=sum(o.get("quantity",0) for o in market_orders if o.get("businessId")==firm.get("id") and o.get("status")=="en tránsito" and o.get("type")=="industrial_raw")
        raw_supplier=market_suppliers.get("Cooperativa Agrícola Regional",{});target=min(60,max(12,capacity*2));need=max(0,target-firm["rawMaterialInventory"]-pending)
        route=route_between(tuple(raw_supplier.get("source",(21,10))),(factory["x"],factory["y"])) if need and raw_supplier.get("stock",0)>0 else None
        firm["lastMaterialPurchase"]=0;firm["lastMaterialCost"]=0;firm["lastMaterialShortage"]=need
        if need and route:
            landed=float(raw_supplier.get("unitCost",3.4))+max(0,len(route)-1)*.08+raw_supplier.get("leadDays",2)*.15
            quantity=min(need,int(raw_supplier.get("stock",0)),max(0,int(max(0,firm["cash"]-500)//max(.01,landed))))
            if quantity:
                cost=round(quantity*landed,2);firm["cash"]-=round(cost);raw_supplier["stock"]-=quantity;raw_supplier["cash"]+=cost;raw_supplier["lastSales"]=raw_supplier.get("lastSales",0)+quantity
                ready=state["day"]+int(raw_supplier.get("leadDays",2));distance=max(0,len(route)-1)
                market_orders.append({"id":uuid.uuid4().hex,"type":"industrial_raw","commodity":"grano","businessId":firm["id"],"businessName":firm.get("name",factory.get("name","Fábrica")),"supplier":"Cooperativa Agrícola Regional","quantity":quantity,"unitCost":round(landed,2),"cost":round(cost),"orderedDay":state["day"],"supplierReadyDay":ready,"travelDistance":distance,"travelledDistance":0,"source":list(raw_supplier.get("source",(21,10))),"x":factory["x"],"y":factory["y"],"route":route,"status":"en tránsito","statusCause":"Preparación y viaje de materia prima"})
                firm["lastMaterialPurchase"]=quantity;firm["lastMaterialCost"]=round(cost);firm["lastInputs"]=round(cost);firm["lastProfit"]-=round(cost);firm["lastMaterialCause"]="Pedido en tránsito";firm["lastMaterialShortage"]=max(0,need-quantity)
                ev("Materia prima encargada",f"{factory.get('name','Fábrica')}: {quantity} unidades de grano por ${round(cost):,}; entrega vial prevista día {ready+max(1,math.ceil(distance/6))}.".replace(",","."))
        elif need:
            firm["lastMaterialShortage"]=need
            firm["lastMaterialCause"]="Sin ruta vial a la cooperativa regional" if raw_supplier.get("stock",0)>0 else "Cuota regional de grano agotada"
        else:firm["lastMaterialCause"]=""
    revenue_total=payroll_total=sales_total=closed=inputs_total=0
    for shop in shops:shop["business"]["lastRegionalSales"]=0
    for shop in shops:
        firm=shop["business"];key=(shop["x"],shop["y"]);site=workplace.get(key,{})
        staffed=max(0,round(site.get("staffedJobs",0)));headcount=max(0,int(site.get("workersAssigned",0)))
        local_demand=demand.get(key,0);shop_regional_demand=max(0,regional_demand.get(firm.get("id"),0));total_demand=local_demand+shop_regional_demand
        inventory=max(0,int(firm.get("inventory",0)));input_inventory=max(0,int(firm.get("inputInventory",0)))
        production_target=min(max(0,200-inventory),max(0,math.ceil(total_demand-inventory)),max(0,round(staffed*firm.get("productivity",.06)*30*firm.get("utilityFactor",1))))
        production=min(production_target,input_inventory)
        local_target=min(inventory+production,local_demand);local_left=local_target;sold_local=0
        unit_price=max(1,int(firm.get("price",18)))
        for home,quantity in shopping.get(key,[]):
            if local_left<=0:break
            bought=min(quantity,local_left,max(0,int(home.get("householdCash",0)//unit_price)))
            if bought:
                home["householdCash"]-=bought*unit_price;sold_local+=bought;local_left-=bought
        regional_sales=min(max(0,inventory+production-sold_local),shop_regional_demand)
        sales=sold_local+regional_sales;export_price=max(1,round(unit_price*.78))
        revenue=sold_local*unit_price+regional_sales*export_price
        payroll=payroll_paid.get(firm["id"],0);overhead=max(0,int(firm.get("fixedCost",40)))
        # Renta del local: pago real a propietarios privados, independiente de impuestos.
        rent=max(0,int(firm.get("monthlyRent",50+max(0,12-abs(shop["x"]-12)-abs(shop["y"]-10))*3)))
        overhead+=rent
        firm["inputInventory"]=input_inventory-production
        cash_before_orders=firm.get("cash",0)+revenue-overhead
        if cash_before_orders<0:
            draw_business_credit(firm,-cash_before_orders);cash_before_orders=firm.get("cash",0)+revenue-overhead
        paid_rent=min(rent,max(0,int(cash_before_orders+rent)))
        firm["lastRentPaid"]=paid_rent
        state["supply"]["propertyRentalCash"]=state["supply"].get("propertyRentalCash",0)+paid_rent
        if cash_before_orders<0:
            firm["cash"]=round(cash_before_orders);close_business(shop,workforce,"las ventas no cubrieron gastos fijos y agotó su línea de crédito");closed+=1;continue
        target_inputs=min(110,max(12,round(staffed*firm.get("productivity",.06)*30*1.15)))
        pending=sum(order.get("quantity",0) for order in market_orders if order.get("businessId")==firm.get("id") and order.get("status")=="en tránsito")
        needed=max(0,target_inputs-firm["inputInventory"]-pending);purchases=procurement_cost=0;chosen=[]
        source=(4,10)
        providers=[]
        for name,supplier in market_suppliers.items():
            if supplier.get("commodity")=="grano" or supplier.get("stock",0)<=0:continue
            source=tuple(supplier.get("source",(4,10)))
            route=route_between(source,(shop["x"],shop["y"]))
            if not route:continue
            distance=max(0,len(route)-1);factor=traffic_factor(route)
            freight=distance*.055+max(0,factor-1)*.22
            landed=supplier["unitCost"]+freight+supplier.get("leadDays",0)*.035
            providers.append((landed,name,supplier,route,distance))
        providers.sort(key=lambda item:(item[0],item[2].get("leadDays",0),item[1]))
        cash_for_orders=max(0,int(cash_before_orders+min(max(0,firm.get("creditLimit",0)-firm.get("creditDebt",0)),state["finance"]["businessBank"].get("liquidity",0))))
        for landed,name,supplier,route,distance in providers:
            if needed<=0 or cash_for_orders<=0:break
            quantity=min(needed,int(supplier.get("stock",0)),int(cash_for_orders//max(.01,landed)))
            if quantity<=0:continue
            cost=round(quantity*landed)
            if cost>cash_for_orders:quantity=max(0,int(cash_for_orders//max(.01,landed)));cost=round(quantity*landed)
            if not quantity:continue
            if cash_before_orders<cost:
                draw_business_credit(firm,cost-cash_before_orders);cash_before_orders=firm.get("cash",0)+revenue-overhead
                if cash_before_orders<cost:
                    quantity=max(0,int(max(0,cash_before_orders)//max(.01,landed)));cost=round(quantity*landed)
            if not quantity:continue
            supplier["stock"]-=quantity;supplier["cash"]=supplier.get("cash",0)+cost;supplier["lastSales"]+=quantity
            if name.startswith("Fábrica local "):
                industry["unitsSold"]+=quantity
                source_factory=next((b for b in state.get("buildings",[]) if b.get("kind")=="factory" and supplier.get("source")==[b.get("x"),b.get("y")]),None)
                if source_factory:
                    source_factory["business"]["lastLocalSales"]=source_factory["business"].get("lastLocalSales",0)+quantity
                    source_factory["business"]["lastSales"]=source_factory["business"].get("lastSales",0)+quantity
                    revenue=round(quantity*supplier["unitCost"]);source_factory["business"]["lastRevenue"]=source_factory["business"].get("lastRevenue",0)+revenue;source_factory["business"]["lastProfit"]=source_factory["business"].get("lastProfit",0)+revenue
                    source_factory["business"]["cash"]+=revenue
            else:
                industry["unitsImported"]+=quantity
            order={"id":uuid.uuid4().hex,"businessId":firm["id"],"businessName":firm.get("name",shop.get("name")),"supplier":name,"quantity":quantity,"unitCost":round(landed,2),"cost":cost,"orderedDay":state["day"],"supplierReadyDay":state["day"]+supplier.get("leadDays",1),"travelDistance":distance,"travelledDistance":0,"source":list(source),"x":shop["x"],"y":shop["y"],"route":route,"trafficFactor":1,"status":"en tránsito","statusCause":"Preparación en proveedor"}
            market_orders.append(order);needed-=quantity;cash_for_orders-=cost;purchases+=quantity;procurement_cost+=cost;chosen.append(name)
        cash_after_ops=cash_before_orders-procurement_cost
        debt=firm.get("creditDebt",0);interest=round(debt*firm.get("creditRate",.02));firm["lastInterest"]=interest
        if cash_after_ops<interest:draw_business_credit(firm,interest-cash_after_ops);cash_after_ops=firm.get("cash",0)+revenue-overhead-procurement_cost
        if cash_after_ops<0:
            firm["cash"]=round(cash_after_ops);close_business(shop,workforce,"agotó caja y crédito antes de cubrir sus costos operativos");closed+=1;continue
        if cash_after_ops>=interest:
            cash_after_ops-=interest;firm["creditDelinquencyMonths"]=0;state["finance"]["businessBank"]["liquidity"]+=interest
        else:
            paid_interest=max(0,cash_after_ops);cash_after_ops=0;state["finance"]["businessBank"]["liquidity"]+=paid_interest
            firm["creditDebt"]+=interest-paid_interest;firm["creditDelinquencyMonths"]=firm.get("creditDelinquencyMonths",0)+1
        repayment=min(firm.get("creditDebt",0),max(0,int(cash_after_ops-500)))
        if repayment:
            cash_after_ops-=repayment;firm["creditDebt"]-=repayment;firm["lastRepayment"]=repayment;state["finance"]["businessBank"]["liquidity"]+=repayment
        firm["cash"]=round(cash_after_ops)
        firm["inventory"]=inventory+production-sales;firm["lastSales"]=sales;firm["lastLocalSales"]=sold_local;firm["lastRegionalSales"]=regional_sales
        if regional_sales>0:
            selected_route=regional_report.get("routes",{}).get(firm.get("id"),{})
            destination=selected_route.get("destination") if isinstance(selected_route,dict) else None
            port=next((b for b in state["buildings"] if b.get("kind")=="port" and b.get("status") in ("habilitado","operativo") and f"Puerto {b.get('name','')}"==destination),None)
            if port:state["supply"].setdefault("portOrders",[]).append({"id":uuid.uuid4().hex,"portId":port.get("id",f"port-{port['x']}-{port['y']}"),"businessId":firm.get("id"),"businessName":firm.get("name",shop.get("name","Comercio")),"quantity":regional_sales,"orderedDay":state["day"],"travelledDistance":0,"status":"pendiente","route":[]})
        firm["lastLocalDemand"]=local_demand;firm["lastRegionalDemand"]=shop_regional_demand;firm["lastRevenue"]=revenue;firm["lastInputs"]=procurement_cost;firm["lastInputUnits"]=purchases;firm["lastInputSupplier"]=" · ".join(chosen) if chosen else "Sin stock o fondos"
        firm["lastInputShortage"]=max(0,needed);firm["lastProduction"]=production;firm["lastPayroll"]=payroll;firm["lastProfit"]=revenue-payroll-overhead-procurement_cost-interest
        firm["creditAvailable"]=max(0,min(firm.get("creditLimit",0)-firm.get("creditDebt",0),state["finance"]["businessBank"].get("liquidity",0)))
        firm["creditStatus"]="mora" if firm.get("creditDelinquencyMonths",0) else ("utilizada" if firm.get("creditDebt",0)>0 else "disponible")
        firm["lastWorkers"]=headcount;firm["lastDemand"]=round(total_demand)
        revenue_total+=revenue;payroll_total+=payroll;sales_total+=sales;inputs_total+=procurement_cost
        if firm["cash"]<0 or firm.get("creditDelinquencyMonths",0)>=2:
            close_business(shop,workforce,"incumplió dos vencimientos de intereses" if firm.get("creditDelinquencyMonths",0)>=2 else "caja negativa y crédito agotado");closed+=1
    regional_sold=sum(max(0,int(b.get("business",{}).get("lastRegionalSales",0))) for b in shops if b.get("business",{}).get("status")=="abierto")
    regional_revenue=sum(max(0,int(b.get("business",{}).get("lastRegionalSales",0)))*max(1,round(max(1,int(b.get("business",{}).get("price",18)))*.78)) for b in shops if b.get("business",{}).get("status")=="abierto")
    local_unmet=sum(max(0,int(shop.get("business",{}).get("lastLocalDemand",0))-int(shop.get("business",{}).get("lastLocalSales",0))) for shop in shops if shop.get("business",{}).get("status")=="abierto")
    regional_report.update({"capturedUnits":regional_sold,"revenue":regional_revenue,"unmetOffer":max(0,regional_report["cityOffer"]-regional_sold),"localUnmet":local_unmet});state["regionalMarketReport"]=regional_report;state["regionalMarket"]["lastReport"]=regional_report;state["regionalMarket"]["history"].append({k:regional_report[k] for k in ("month","regionalDemand","cityOffer","capturedUnits","capturePct","revenue")});state["regionalMarket"]["history"]=state["regionalMarket"]["history"][-24:];refresh_private_investment_opportunity(regional_report,local_unmet)
    return {"revenue":revenue_total,"payroll":payroll_total,"sales":sales_total,"inputs":inputs_total,"closed":closed,"regionalUnits":regional_sold,"regionalRevenue":regional_revenue}

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
        origin=tuple(order.get("source",(4,10)))
        route=route_between(origin,(location["x"],location["y"])) if location else None
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

def collect_bus_fares(workforce):
    for line in state.get("busRoutes",[]):
        line["monthlyFareRevenue"]=0
        if not line.get("operational"):continue
        for employee in workforce.get("employees",[]):
            if line.get("id") not in employee.get("busLineIds",[employee.get("busLineId")]):continue
            home=employee["home"]
            cost=employee.get("monthlyBusFareByLine",{}).get(line["id"],0)
            paid=min(max(0,home.get("householdCash",0)),cost)
            home["householdCash"]=home.get("householdCash",0)-paid
            line["monthlyFareRevenue"]+=paid;line["fareCollectedDay"]=state["day"]


INDUSTRIAL_REOPENING_COST = {"operating":4200,"rehabilitation":900,"permit":200,"workers":5,"days":7}

def industrial_reopening_demand(kind):
    if kind=="food":
        return any(b.get("kind")=="shop" and b.get("business",{}).get("status")=="abierto" and
                   (b["business"].get("lastSales",0)>0 or b["business"].get("lastInputUnits",0)>0)
                   for b in state.get("buildings",[]))
    material={"quarry":"aggregate","concrete":"concrete","sawmill":"timber","metalworks":"components"}.get(kind)
    if not material:return False
    needs=any(p.get("status") not in ("pausada","cancelada") and
              p.get("materialsRequired",{}).get(material,0)>p.get("materialsUsed",{}).get(material,0)
              for p in state.get("projects",[]))
    if kind=="quarry":
        needs=needs or any(b.get("kind")=="factory" and b.get("business",{}).get("industryType")=="concrete"
                           and b.get("business",{}).get("status")=="abierto" for b in state.get("buildings",[]))
    return needs

def consider_industrial_reopenings():
    """Promotores rehabilitan plantas cerradas con capital propio, demanda y cuadrilla real."""
    cost=INDUSTRIAL_REOPENING_COST
    for site in state.get("buildings",[]):
        if site.get("kind")!="factory" or site.get("business",{}).get("status")!="cerrado":continue
        firm=site["business"]
        firm.setdefault("closedDay",state["day"])
        if site.get("industrialRecovery",{}).get("status")=="en obra":continue
        if state["day"]-firm["closedDay"]<90:continue
        if not any(z.get("kind")=="factory" and z.get("x")==site["x"] and z.get("y")==site["y"] for z in state.get("zones",[])):continue
        if not industrial_reopening_demand(firm.get("industryType","food")):continue
        if not route_between((4,10),(site["x"],site["y"])):continue
        utility=site.get("utilityAccess",{})
        if min(utility.get("powerServedPct",0),utility.get("waterServedPct",0),utility.get("wastewaterTreatedPct",0))<65:continue
        amount=cost["operating"]+cost["rehabilitation"]+cost["permit"]
        if state.get("privateCapital",0)<amount+1500:continue
        eligible=[name for name in CONTRACTORS if contractor_has_capacity(name) and contractor_free_workers(name)>=cost["workers"]]
        if not eligible:continue
        contractor=min(eligible,key=lambda name:(CONTRACTORS[name]["price"],name))
        state["privateCapital"]-=amount
        state["money"]+=cost["permit"]
        state["supply"]["contractorCash"][contractor]+=cost["rehabilitation"]
        site["industrialRecovery"]={"status":"en obra","contractor":contractor,
            "workersAssigned":cost["workers"],"contractedDay":state["day"],
            "readyDay":state["day"]+cost["days"],"cost":amount,
            "operatingReserve":cost["operating"],"permitPaid":cost["permit"],"workPaid":cost["rehabilitation"],
            "statusCause":"Rehabilitación y revisión de servicios"}
        ev("Rehabilitación industrial adjudicada",f"{site['name']} será reacondicionada por {contractor} durante 7 días: 5 trabajadores, inversión privada $ {amount:,} y permiso municipal $ 200. La reapertura exige accesos y servicios.".replace(",","."))
        break

def advance_industrial_reopenings():
    for site in state.get("buildings",[]):
        recovery=site.get("industrialRecovery",{})
        if recovery.get("status")!="en obra" or state["day"]<recovery.get("readyDay",0):continue
        utility=site.get("utilityAccess",{})
        if not route_between((4,10),(site["x"],site["y"])):
            recovery["statusCause"]="Inspección suspendida: falta acceso vial";continue
        if min(utility.get("powerServedPct",0),utility.get("waterServedPct",0),utility.get("wastewaterTreatedPct",0))<65:
            recovery["statusCause"]="Inspección suspendida: faltan servicios";continue
        old=site["business"];kind=old.get("industryType","food")
        key={"quarry":("Cantera local","aggregateStock","aggregate"),
             "concrete":("Hormigonera local","concreteStock","concrete"),
             "sawmill":("Aserradero local","timberStock","timber"),
             "metalworks":("Metalúrgica local","componentStock","components")}.get(kind)
        if key:
            supplier,field,material=key
            stock=state["supply"]["suppliers"].get(supplier,{})
            stock[material]=max(0,int(stock.get(material,0))-max(0,int(old.get(field,0))))
        else:
            state["supply"].setdefault("market",{}).get(f"Fábrica local {site['x']+1}-{site['y']+1}",{}).update({"stock":0})
        site.setdefault("industrialRecoveryHistory",[]).append({"day":state["day"],"oldFirmId":old.get("id"),
            "oldCash":old.get("cash",0),"industryType":kind,"contractor":recovery["contractor"],
            "investment":recovery["cost"]})
        site["industrialRecoveryHistory"]=site["industrialRecoveryHistory"][-8:]
        firm={"id":f"factory-{site['x']}-{site['y']}-re-{state['day']}",
              "name":site.get("name",FACTORY_LABELS.get(kind,"Fábrica")), "industryType":kind,
              "status":"abierto","cash":recovery["operatingReserve"],"jobSlots":20,"wage":12,
              "lastProduction":0,"lastLocalSales":0,"lastProfit":0,"inventory":0,
              "rawMaterialInventory":0,"rawSteelInventory":0,"componentStock":0,
              "lastMaterialPurchase":0,"lastMaterialShortage":0,"lastMaterialCause":"",
              "quarryReserve":max(0,int(old.get("quarryReserve",0))) if kind=="quarry" else 0,
              "aggregateStock":0,"concreteStock":0,"timberStock":0}
        site["business"]=firm;site["status"]="habilitado";state["jobs"]+=20
        recovery["status"]="completada";recovery["completedDay"]=state["day"];recovery["statusCause"]="Inspección aprobada y nueva firma habilitada"
        ev("Fábrica recuperada",f"{site['name']} reabrió con nuevo operador, 20 puestos y $ {firm['cash']:,} de caja privada ya reservada. La producción debe volver a conseguir insumos y personal.".replace(",","."))


def plan_private_construction_deliveries(project):
    """Cotizar sin alterar estado; precio, ruta y depósito deben estar disponibles juntos."""
    supply=state["supply"];contractor=project["contractor"]
    needs=project.get("materialsRequired",{})
    destinations=[storage_location("yard")]+list(supply.get("depots",[]))
    capacity={}
    for dest in destinations:
        if not dest:continue
        destination_id=dest["id"]
        available=max(0,int(dest["capacity"])-storage_used(destination_id)-storage_reserved(destination_id))
        if route_between((dest["x"],dest["y"]),(project["x"],project["y"])) is None:available=0
        capacity[destination_id]=available
    quotes=[]
    for material,required in needs.items():
        shortage=max(0,int(required)-int(supply["contractors"][contractor].get(material,0)))
        if not shortage:continue
        options=[]
        for dest in destinations:
            if not dest or capacity.get(dest["id"],0)<shortage:continue
            for name,provider in SUPPLIERS.items():
                stock=supply["suppliers"].get(name,{})
                if stock.get(material,0)<shortage:continue
                if name in INDUSTRIAL_VENDOR_GOODS:
                    if INDUSTRIAL_VENDOR_GOODS[name][1]!=material:continue
                    offers=industrial_vendor_offers(name,material,shortage,(dest["x"],dest["y"]))
                    if not offers:continue
                    quote=offers[0]
                    route=quote["route"];origin=(quote["site"]["x"],quote["site"]["y"])
                    cost=quote["total"];product_cost=quote["productCost"];freight=quote["freight"]
                else:
                    origin=(21,10) if name=="Distribuidora Regional" else (4,10)
                    route=route_between(origin,(dest["x"],dest["y"]))
                    if route is None:continue
                    distance=max(0,len(route)-1)
                    freight=max(0,distance-4)*5
                    product_cost=round(shortage*MATERIAL_PRICE[material]*provider["price"])
                    cost=product_cost+freight;quote=None
                options.append((cost,len(route),name,dest["id"],{
                    "supplier":name,"material":material,"quantity":shortage,"cost":cost,
                    "productCost":product_cost,"freight":freight,
                    "quote":quote,"route":route,"source":list(origin),
                    "destinationId":dest["id"],"destinationLabel":dest["label"]}))
        if not options:return None
        chosen=min(options,key=lambda option:option[:4])[-1]
        capacity[chosen["destinationId"]]-=shortage
        quotes.append(chosen)
    return quotes

def commit_private_construction_deliveries(project,quotes):
    """El promotor paga hoy, las constructoras reciben después del viaje y descarga."""
    supply=state["supply"];day=state["day"]
    for seq,purchase in enumerate(quotes):
        supplier=purchase["supplier"];material=purchase["material"];quantity=purchase["quantity"]
        supply["suppliers"][supplier][material]-=quantity
        order={"id":uuid.uuid4().hex,"projectId":project["id"],"label":project["label"],
            "contractor":project["contractor"],"supplier":supplier,"items":{material:quantity},
            "cost":purchase["cost"],"productCost":purchase["productCost"],"freight":purchase["freight"],
            "destinationId":purchase["destinationId"],"destinationLabel":purchase["destinationLabel"],
            "priority":"normal","orderedDay":day,
            "supplierReadyDay":day+SUPPLIERS[supplier]["days"],
            "arrivalDay":day+SUPPLIERS[supplier]["days"]+max(1,math.ceil((len(purchase["route"])-1)/6)),
            "travelDistance":max(0,len(purchase["route"])-1),"travelledDistance":0,
            "route":purchase["route"],"source":purchase["source"],
            "progress":0,"status":"en tránsito","statusCause":"Insumos privados pendientes de entrega",
            "privateContract":True}
        if purchase["quote"]:
            offer=purchase["quote"]
            settle_industrial_vendor_offer(supplier,material,quantity,offer)
            order.update({"vendorId":offer["site"]["business"].get("id"),
                          "vendorName":offer["site"].get("name"),"quotedFactor":offer["factor"]})
            supply["logisticsCash"]=supply.get("logisticsCash",0)+purchase["freight"]
        else:
            supply.setdefault("supplierCash",{})[supplier]=supply.get("supplierCash",{}).get(supplier,0)+purchase["cost"]
        supply["orders"].append(order)
    project["materialsCost"]=sum(q["cost"] for q in quotes)
    project["privateSupplyOrders"]=[o["id"] for o in supply["orders"] if o.get("projectId")==project["id"] and o.get("privateContract")]

def advance_zoned_development():
    """Promoters spend real capital and buy the materials for approved projects."""
    demand=state.setdefault("housingDemand",{"unmet":0,"lastGenerated":0,"lastFilled":0})
    reserved={(e.get("x"),e.get("y")) for key in ("buildings","projects","abandoned") for e in state.get(key,[])}
    for kind,threshold in (("home",12),("factory",0)):
        if kind=="home" and int(demand.get("unmet",0))<threshold:continue
        if kind=="factory" and not any(b.get("kind")=="shop" and b.get("business",{}).get("status")=="abierto" and (b.get("business",{}).get("lastSales",0)>0 or b.get("business",{}).get("lastInputUnits",0)>0) for b in state.get("buildings",[])):continue
        candidates=[]
        for z in state.get("zones",[]):
            if z.get("kind")!=kind or z.get("status") not in (None,"disponible") or (z.get("x"),z.get("y")) in reserved:continue
            if not any(abs(rx-z["x"])+abs(ry-z["y"])==1 for rx,ry in state.get("roads",[])):continue
            route=route_between((z["x"],z["y"]),(4,10))
            if route:candidates.append((len(route),z["y"],z["x"],z))
        if not candidates:continue
        _,_,_,zone=min(candidates,key=lambda row:(row[0],row[1],row[2]))
        specification=PROJECTS[kind];required=material_plan(kind);options=[]
        for name,company in CONTRACTORS.items():
            if not contractor_has_capacity(name) or contractor_free_workers(name)<LABOR_NEEDS[kind]:continue
            cost=round(specification["cost"]*company["price"]);permit=round(specification["cost"]*.12);private_cost=cost-permit
            proposal={"contractor":name,"x":zone["x"],"y":zone["y"],"materialsRequired":required}
            purchases=plan_private_construction_deliveries(proposal)
            if purchases is None:continue
            material_bill=sum(item["cost"] for item in purchases)
            reserve=4200 if kind=="factory" else 0
            if state.get("money",0)>=permit and state.get("privateCapital",0)>=private_cost+material_bill+reserve+1500:
                options.append((cost,name,company,permit,private_cost,purchases,material_bill,reserve))
        if not options:continue
        _,name,company,permit,private_cost,purchases,material_bill,reserve=min(options,key=lambda row:(row[0],row[1]))
        project_id=uuid.uuid4().hex;advance=round(private_cost*.2);zero={key:0 for key in MATERIAL_NAMES}
        project={"id":project_id,"kind":kind,"label":specification["label"],"x":zone["x"],"y":zone["y"],"contractor":name,"cost":private_cost,"duration":round(specification["days"]*company["days"]/30),"elapsed":0,"progress":0,"paid":advance,"stages":specification["stageNames"],"stageIndex":0,"status":"contratada","cause":"Promotor privado: demanda y parcela zonificada","contractedMandate":int(state.get("government",{}).get("mandate",1)),"contractedDay":state.get("day",1),"monthlyCost":0,"workersAssigned":LABOR_NEEDS[kind],"materialsRequired":required,"materialsUsed":zero,"privatePaid":True,"municipalPermitPaid":permit,"zonedDevelopment":True}
        commit_private_construction_deliveries(project,purchases)
        state["money"]-=permit;state["privateCapital"]-=private_cost+reserve+material_bill;state["supply"]["contractorCash"][name]+=advance;state["projects"].append(project);reserved.add((zone["x"],zone["y"]))
        zone["status"]="en obra"
        if kind=="factory":
            project["operatingReserve"]=reserve
            project["industryType"]=next_factory_industry()
            project["label"]=FACTORY_LABELS[project["industryType"]]
        ev("Promotor inicia obra",f"Demanda activa: {specification['label'].lower()} en parcela {zone['x']+1},{zone['y']+1}. Permiso municipal $ {permit}, inversión privada $ {private_cost:,}, materiales $ {material_bill:,}, cuadrilla {LABOR_NEEDS[kind]} personas.".replace(",","."))

def move_households():
    homes=[b for b in state.get("buildings",[]) if b.get("kind")=="home"]
    desired=max(-5,min(12,round((state.get("approval",0)-45)/8)))
    demand_state=state.setdefault("housingDemand",{"unmet":0,"lastGenerated":0,"lastFilled":0})
    if desired>0:
        jobs_room=max(0,round(state.get("jobs",0)/.42-state.get("population",0)))
        generated=min(desired,jobs_room)
        demand_state["unmet"]=min(600,max(0,int(demand_state.get("unmet",0)))+generated)
        demand_state["lastGenerated"]=generated;demand_state["lastFilled"]=0
        vacancies=sum(max(0,b.get("capacity",0)-b.get("occupants",0)) for b in homes)
        jobs_room=max(0,round(state.get("jobs",0)/.42-state.get("population",0)))
        arrivals=min(int(demand_state.get("unmet",0)),vacancies,jobs_room);placed=0
        for index in range(arrivals):
            available=[b for b in homes if b.get("occupants",0)<b.get("capacity",0)]
            if not available:break
            home=min(available,key=lambda b:(b.get("occupants",0)/max(1,b.get("capacity",1)),b.get("y",0),b.get("x",0)))
            home["occupants"]=home.get("occupants",0)+1
            if home.get("adaptiveReuseDay"):home.setdefault("rentalLeaseDays",[]).append(state.get("day",1))
            members=home.setdefault("residents",[])
            identifier=f"migrant-{state.get('day',1)}-{home.get('x',0)}-{home.get('y',0)}-{index}"
            eligible_now=sum(bool(person.get("workerEligible")) for person in members)
            eligible=eligible_now<round(home["occupants"]*.42)
            age_seed=stable_skill(identifier,"migration-cohort")
            age=(18+stable_skill(identifier,"migration-age")%49) if eligible else ((age_seed%18) if age_seed%100<80 else 67+age_seed%18)
            person={"id":identifier,"age":age,"birthYear":2026+(max(0,state.get("day",1)-1)//360),"lifeStage":"vida laboral" if 18<=age<67 else "infancia" if age<18 else "jubilación","workerEligible":eligible,"status":"buscando" if eligible else "inactivo" if age<18 else "jubilado","employerId":None,"employerName":None,"monthlyWage":0,"attendance":0,"unemployedSinceDay":state.get("day",1) if eligible else None,"unemploymentReason":"primer empleo" if eligible else None}
            ensure_person_work_profile(person);members.append(person);placed+=1
        demand_state["unmet"]=max(0,int(demand_state.get("unmet",0))-placed);demand_state["lastFilled"]=placed
        if placed:
            state["population"]=state.get("population",0)+placed;state["monthlyIncome"]=state.get("monthlyIncome",0)+placed*3
            ev("Nuevos hogares",f"{placed} residentes llegaron a viviendas vacantes. Cada persona tiene edad, perfil laboral y elegibilidad propios; solo quienes encuentran un puesto viable se incorporan al empleo. Ingreso tributario futuro +$ {placed*3}/mes.")
        elif not vacancies:ev("Vivienda sin vacantes","La demanda de mudanza no puede concretarse: los hogares existentes están completos.")
        elif not jobs_room:ev("Migración frenada por empleo","Hay viviendas disponibles, pero faltan empleos para atraer nuevos hogares.")
    elif desired<0:
        departures=min(-desired,sum(max(0,b.get("occupants",0)) for b in homes));left=0
        for _ in range(departures):
            occupied=[b for b in homes if b.get("occupants",0)>0]
            if not occupied:break
            home=min(occupied,key=lambda b:(b.get("quality",70),b.get("y",0),b.get("x",0)))
            members=home.setdefault("residents",[])
            if len(members)<home.get("occupants",0):
                ensure_resident_roster()
                members=home.setdefault("residents",[])
            if members:members.pop()
            home["occupants"]-=1
            if home.get("adaptiveReuseDay") and home.get("rentalLeaseDays"):home["rentalLeaseDays"].pop()
            left+=1
        state["population"]=max(0,state.get("population",0)-left);state["monthlyIncome"]=max(0,state.get("monthlyIncome",0)-left*3)
        if left:ev("Salida de residentes",f"{left} residentes dejaron hogares con menor calidad; sus perfiles laborales y plazas ocupadas se liberaron y los ingresos tributarios futuros bajan $ {left*3}/mes.")

def process_port_logistics():
    """Exportaciones reales de comercios: camión por calles, patio limitado y barco por demanda."""
    supply=state["supply"];ports=[b for b in state["buildings"] if b.get("kind")=="port" and b.get("status") in ("habilitado","operativo")]
    orders=supply.setdefault("portOrders",[]);voyages=supply.setdefault("portVoyages",[])
    for order in orders:
        if order.get("status") not in ("pendiente","en tránsito","esperando acceso","esperando patio"):continue
        port=next((b for b in ports if b.get("id")==order.get("portId")),None)
        shop=next((b for b in state["buildings"] if b.get("kind")=="shop" and b.get("business",{}).get("id")==order.get("businessId")),None)
        if not port or not shop:order["status"]="cancelado";continue
        route=route_between((shop["x"],shop["y"]),(port["x"],port["y"]))
        if not route:order.update({"status":"esperando acceso","route":[]});continue
        order["route"]=route;distance=max(1,len(route)-1);order["status"]="en tránsito"
        order["travelledDistance"]=min(distance,order.get("travelledDistance",0)+6/max(1,traffic_factor(route)))
        if order["travelledDistance"]<distance:continue
        if port.get("cargoStored",0)+order["quantity"]>port.get("cargoCapacity",500):order["status"]="esperando patio";continue
        port["cargoStored"]=port.get("cargoStored",0)+order["quantity"];order.update({"status":"en puerto","arrivedDay":state["day"]})
        ev("Carga recibida en el puerto",f"{order['quantity']} unidades de {order['businessName']} llegaron por camión; patio {port['cargoStored']}/{port.get('cargoCapacity',500)}.")
    for port in ports:
        if port.get("cargoStored",0)<60 or state["day"]-port.get("lastShipDay",0)<10:continue
        quantity=min(port.get("shipCapacity",180),port["cargoStored"]);port["cargoStored"]-=quantity;port["lastShipDay"]=state["day"];port["shipsDeparted"]=port.get("shipsDeparted",0)+1
        fee=round(quantity*.6);port["feeIncome"]=port.get("feeIncome",0)+fee;state["money"]+=fee
        voyage={"id":uuid.uuid4().hex,"portId":port.get("id",f"port-{port['x']}-{port['y']}"),"quantity":quantity,"departureDay":state["day"],"arrivalDay":state["day"]+2,"status":"en ruta","route":[[23,port["y"]],[24,port["y"]],[25,port["y"]],[26,port["y"]],[27,port["y"]]],"businessNames":[]}
        voyages.append(voyage);ev("Buque de carga zarpó",f"Un buque partió con {quantity} unidades exportadas; tasa portuaria $ {fee} ingresó a tesorería.")
    for voyage in voyages:
        if voyage.get("status")=="en ruta" and state["day"]>=voyage.get("arrivalDay",999999):voyage["status"]="entregado";voyage["deliveredDay"]=state["day"];ev("Exportación entregada",f"El cargamento de {voyage['quantity']} unidades llegó al mercado regional.")
    supply["portOrders"]=orders[-80:];supply["portVoyages"]=voyages[-30:]

def simulate_airport_month(workforce):
    airports=[b for b in state["buildings"] if b.get("kind")=="airport" and b.get("status") in ("habilitado","operativo")]
    state["airportVisitorsThisMonth"]=0;state["airportMonthlyIncome"]=0
    for airport in airports:
        workplace=next((w for w in workforce.get("workplaces",[]) if w.get("x")==airport["x"] and w.get("y")==airport["y"]),{})
        connected=bool(route_between((4,10),(airport["x"],airport["y"])))
        eligible=sum(1 for home in state["buildings"] if home.get("kind")=="home" for person in home.get("residents",[]) if person.get("status")=="empleado" and home.get("householdCash",0)>=200)
        demand=min(800,round(eligible*.15));staffed=workplace.get("staffedJobs",0);utility_factor=min(airport.get("utilityAccess",{}).get("powerServedPct",100),airport.get("utilityAccess",{}).get("waterServedPct",100),airport.get("utilityAccess",{}).get("wastewaterTreatedPct",100))/100
        ready=connected and staffed>=4 and demand>=8 and utility_factor>=.65
        flights=min(12,math.ceil(demand/80)) if ready else 0
        passengers=min(airport.get("passengerCapacity",800),flights*80,demand) if flights else 0
        airline_revenue=passengers*70;airline_cost=flights*500
        if airline_revenue<airline_cost:flights=0;passengers=0
        arrivals=passengers//2;fee=passengers*4+flights*75
        airport.update({"operational":bool(flights),"airline":"Aerolíneas del Litoral" if flights else None,"monthlyPassengers":passengers,"monthlyArrivals":arrivals,"monthlyDepartures":passengers-arrivals,"monthlyFlights":flights,"monthlyDemand":demand,"airlineRevenue":airline_revenue if flights else 0,"airlineCost":airline_cost if flights else 0,"airportFeeIncome":fee,"accessConnected":connected,"staffedJobs":staffed,"pauseReason":"Sin acceso vial regional" if not connected else "Faltan 4 trabajadores aeroportuarios" if staffed<4 else "Demanda baja: la aerolínea no cubre el costo de ruta" if not flights else None})
        state["airportVisitorsThisMonth"]+=arrivals;state["airportMonthlyIncome"]+=fee
        if flights:ev("Ruta aérea operativa",f"{airport['airline']} atendió {passengers} pasajeros ({arrivals} visitantes) en {flights} vuelo(s); tasa municipal $ {fee}.")
        elif airport.get("monthlyPassengers",0):ev("Ruta aérea suspendida",f"La ruta requiere acceso, personal y demanda suficientes para cubrir sus costos.")
    return state["airportVisitorsThisMonth"]

# Fase 25: las ferias se contratan con dinero municipal y demandan aforo real.
TOURISM_EVENT_TYPES = {
    "feria": {"name":"Feria de productores","cost":1200,"visitors":110,"cleaning":3,"shopMinimum":1,"retailBudget":30},
    "festival": {"name":"Festival cultural","cost":3500,"visitors":320,"cleaning":5,"shopMinimum":2,"retailBudget":38},
    "congreso": {"name":"Congreso regional","cost":5200,"visitors":190,"cleaning":4,"shopMinimum":2,"retailBudget":46},
}

def tourism_event_access():
    """Instalaciones físicas conectadas para visitantes y servicios."""
    venues=[b for b in state["buildings"] if b.get("kind")=="civic" and b.get("status") in ("operativo","habilitado") and route_between((4,10),(b["x"],b["y"]))]
    if not venues:return None,[]
    venue=venues[0]
    shops=[b for b in state["buildings"] if b.get("kind")=="shop" and b.get("business",{}).get("status")=="abierto" and route_between((venue["x"],venue["y"]),(b["x"],b["y"]))]
    return venue,shops

def schedule_tourism_event(kind):
    spec=TOURISM_EVENT_TYPES.get(str(kind))
    if spec is None:raise ValueError("Elegí un evento turístico válido.")
    target=int(state.get("lastMonth",0))+1
    events=state.setdefault("tourismEvents",[])
    if any(x.get("targetMonth")==target and x.get("status")=="programado" for x in events):
        raise ValueError("Ya existe un evento contratado para el próximo cierre mensual.")
    venue,shops=tourism_event_access()
    if venue is None or len(shops)<spec["shopMinimum"]:
        raise ValueError("Se necesitan un centro cívico y comercios abiertos con acceso vial.")
    if kind=="congreso" and not any(b.get("kind")=="hotel" and b.get("business",{}).get("status")=="abierto" and route_between((venue["x"],venue["y"]),(b["x"],b["y"])) for b in state["buildings"]):
        raise ValueError("El congreso necesita un hotel abierto y accesible.")
    reserved=sum(max(0,int(p["cost"]-p.get("paid",0))) for p in state.get("projects",[]) if not p.get("privatePaid"))
    if state.get("money",0)-reserved<spec["cost"]:
        raise ValueError("No hay fondos libres suficientes después de los compromisos de obra.")
    state["money"]-=spec["cost"]
    item={"id":uuid.uuid4().hex,"type":kind,"name":spec["name"],"targetMonth":target,"bookedDay":state["day"],"organizationCost":spec["cost"],"status":"programado","visitors":0,"retailSpend":0,"cleanupSpend":0}
    events.append(item)
    state["tourismEvents"]=events[-24:]
    ev("Evento turístico contratado",f"{spec['name']} para el próximo mes: organización $ {spec['cost']}, con visitantes y limpieza sujetos a accesibilidad y servicios.")
    return item

def prepare_tourism_event_month(month):
    state["eventVisitorsThisMonth"]=0
    state["eventRetailSpendThisMonth"]=0
    state["eventCleanupSpendThisMonth"]=0
    state["eventWaterM3ThisMonth"]=0
    state["eventWasteTonsThisMonth"]=0
    for item in state.setdefault("tourismEvents",[]):
        if item.get("status")!="programado" or item.get("targetMonth",0)>month:continue
        spec=TOURISM_EVENT_TYPES.get(item.get("type"))
        venue,shops=tourism_event_access()
        problem=None
        if spec is None or venue is None or len(shops)<spec["shopMinimum"]:
            problem="Sin recinto cívico o comercios conectados al realizar el evento"
        elif item["type"]=="congreso" and not any(b.get("kind")=="hotel" and b.get("business",{}).get("status")=="abierto" and route_between((venue["x"],venue["y"]),(b["x"],b["y"])) for b in state["buildings"]):
            problem="Sin alojamiento accesible para el congreso"
        if problem:
            item.update({"status":"cancelado","statusCause":problem,"completedDay":state["day"]})
            ev("Evento turístico cancelado",f"{item['name']}: {problem}. La organización contratada ya se pagó.")
            continue
        utilities=venue.get("utilityAccess",{})
        quality=min(utilities.get("powerServedPct",100),utilities.get("waterServedPct",100),utilities.get("wastewaterTreatedPct",100))/100
        if quality<.5:
            item.update({"status":"cancelado","statusCause":"Servicios de agua, energía o saneamiento insuficientes","completedDay":state["day"]})
            ev("Evento turístico cancelado",f"{item['name']}: servicios insuficientes. El gasto inicial no se recupera.")
            continue
        # 70 asistentes por comercio conectado; aforo y limpieza tienen límites físicos/financieros.
        cap=min(spec["visitors"],len(shops)*70)
        attendees=min(max(0,int(cap*quality)),max(0,int(state.get("money",0)//spec["cleaning"])))
        cleanup=attendees*spec["cleaning"]
        state["money"]-=cleanup
        item.update({"status":"realizado","statusCause":"Aforo limitado por comercios, servicios y presupuesto de limpieza","completedDay":state["day"],"visitors":attendees,"cleanupSpend":cleanup})
        state["eventVisitorsThisMonth"]+=attendees
        state["eventCleanupSpendThisMonth"]+=cleanup
        state["eventWaterM3ThisMonth"]+=round(attendees*.08,2)
        state["eventWasteTonsThisMonth"]+=round(attendees*.002,3)
        ev("Evento turístico realizado",f"{item['name']}: {attendees} visitantes, limpieza municipal $ {cleanup}; la ocupación y las compras dependen del stock y acceso.")
    state["tourismEvents"]=state["tourismEvents"][-24:]

def settle_tourism_event_retail():
    """Los turistas externos compran mercadería existente; no crean stock ni residentes."""
    events=[e for e in state.get("tourismEvents",[]) if e.get("completedDay")==state["day"] and e.get("status")=="realizado" and not e.get("retailSettled")]
    if not events:return
    venue,shops=tourism_event_access()
    shops=sorted(shops,key=lambda b:(b["x"],b["y"]))
    for item in events:
        spec=TOURISM_EVENT_TYPES[item["type"]]
        budget=item["visitors"]*spec["retailBudget"]
        for shop in shops:
            if budget<=0:break
            firm=shop["business"];price=max(1,int(firm.get("price",18)))
            stock=max(0,int(firm.get("inventory",0)))
            units=min(stock,budget//price)
            if units<=0:continue
            sale=units*price
            firm["inventory"]-=units
            firm["cash"]=firm.get("cash",0)+sale
            firm["lastRevenue"]=firm.get("lastRevenue",0)+sale
            firm["lastProfit"]=firm.get("lastProfit",0)+sale
            firm["eventSalesThisMonth"]=firm.get("eventSalesThisMonth",0)+sale
            budget-=sale
            item["retailSpend"]+=sale
            state["eventRetailSpendThisMonth"]+=sale
        item["retailSettled"]=True
    if state["eventRetailSpendThisMonth"]:
        ev("Compras de visitantes",f"Los turistas gastaron $ {state['eventRetailSpendThisMonth']} en existencias reales de comercios conectados.")

def simulate_hotel_month(workforce):
    hotels=[b for b in state["buildings"] if b.get("kind")=="hotel" and b.get("business")]
    arrivals=state.get("airportVisitorsThisMonth",0)
    event_arrivals=state.get("eventVisitorsThisMonth",0)
    open_count=max(1,sum(1 for h in hotels if h.get("business",{}).get("status")=="abierto" and route_between((4,10),(h["x"],h["y"]))))
    for hotel in hotels:
        firm=hotel["business"]
        if firm.get("status")!="abierto":
            firm["lastTourismTax"]=0
            continue
        connected=bool(route_between((4,10),(hotel["x"],hotel["y"])))
        has_airport=any(a.get("kind")=="airport" and a.get("operational") and route_between((a["x"],a["y"]),(hotel["x"],hotel["y"])) for a in state["buildings"])
        utility_factor=min(hotel.get("utilityAccess",{}).get("powerServedPct",100),hotel.get("utilityAccess",{}).get("waterServedPct",100),hotel.get("utilityAccess",{}).get("wastewaterTreatedPct",100))/100
        guests=min(hotel.get("beds",48),math.floor(((arrivals*.45 if has_airport else 0)+event_arrivals*.24)/open_count*utility_factor)) if connected and utility_factor>=.5 else 0
        nights=guests*2;capacity=max(1,hotel.get("beds",48)*30);occupancy=round(nights/capacity*100)
        revenue=guests*max(50,hotel.get("nightlyRate",90));workplace=next((w for w in workforce.get("workplaces",[]) if w.get("x")==hotel["x"] and w.get("y")==hotel["y"]),{})
        payroll=max(0,int(workplace.get("payroll",0)));costs=payroll+guests*18+260;profit=revenue-costs;tax=round(revenue*.05)
        for emp in workforce.get("employees",[]):
            if emp.get("site") is hotel:
                wage=emp.get("earnedWage",emp.get("wage",0));home=emp.get("home",{});home["householdCash"]=round(home.get("householdCash",0)+wage);home["monthlyWageIncome"]=home.get("monthlyWageIncome",0)+wage
        hotel.update({"monthlyGuests":guests,"monthlyGuestNights":nights,"occupancy":occupancy,"accessConnected":connected})
        firm.update({"lastRevenue":revenue,"lastPayroll":payroll,"lastProfit":profit,"lastTourismTax":tax,"cash":firm.get("cash",0)+profit})
        if occupancy<25:hotel["nightlyRate"]=max(55,hotel.get("nightlyRate",90)-5)
        elif occupancy>78:hotel["nightlyRate"]=min(180,hotel.get("nightlyRate",90)+5)
        firm["closureMonths"]=firm.get("closureMonths",0)+1 if profit<0 else 0
        if firm["cash"]<0:
            firm["status"]="cerrado";hotel["status"]="cerrado";state["jobs"]=max(0,state["jobs"]-firm.get("jobSlots",10))
            for home in (b for b in state["buildings"] if b.get("kind")=="home"):
                for person in home.get("residents",[]):
                    if person.get("employerId")==firm.get("id"):
                        person.update({"previousEmployer":firm.get("name"),"previousEmployerId":firm.get("id"),"unemployedSinceDay":state["day"],"unemploymentReason":"cierre del hotel por falta de huéspedes","status":"buscando","employerId":None,"employerName":None,"monthlyWage":0,"attendance":0})
            ev("Hotel cerrado",f"{hotel.get('name')}: la caja llegó a $ {round(firm['cash'])}; sin huéspedes no pudo cubrir sus costos y liberó sus vacantes.")
        elif guests:ev("Actividad turística",f"{hotel.get('name')}: {guests} huéspedes · {nights} noches · ocupación {occupancy}% · ventas $ {revenue} · impuesto turístico $ {tax}.")
    return sum(h.get("business",{}).get("lastTourismTax",0) for h in hotels)

def advance_utility_backup_fuel():
    for building in state.get("buildings",[]):
        used=min(float(building.get("backupFuelKwh",0)),float(building.get("backupKwToday",0))*24)
        if used>0:
            building["backupFuelKwh"]=round(max(0,building["backupFuelKwh"]-used),2)
            if building["backupFuelKwh"]<=0:
                ev("Grupo electrógeno sin combustible",f"{building.get('name','Servicio crítico')} agotó su reserva. Reabastecer para recuperar el respaldo eléctrico.")

def advance_maritime_steel_shipments():
    """La cuota diaria de cada puerto se comparte entre todos sus buques."""
    supply=state["supply"]
    shipments=supply.setdefault("steelShipments",[])
    for shipment in shipments:
        if shipment.get("status") not in ("en viaje","descarga parcial") or state["day"]<shipment["arrivalDay"] or shipment.get("lastUnloadedDay")==state["day"]:continue
        port=next((b for b in state.get("buildings",[]) if b.get("kind")=="port" and b.get("x")==shipment["port"][0] and b.get("y")==shipment["port"][1] and b.get("operational")),None)
        if not port or route_between(tuple(shipment["port"]),(4,10)) is None:
            shipment["statusCause"]="Puerto inhabilitado o conexión vial interrumpida"
            continue
        daily_capacity=max(0,int(port.get("unloadingCapacity",20)))
        # Reconstruir el uso desde remesas conserva la cuota tras recarga y reintentos.
        # Las remesas antiguas sin volumen diario usan un límite conservador.
        used_today=sum(max(0,int(other.get("lastUnloadedUnits",min(int(other.get("deliveredUnits",0)),daily_capacity))))
                       for other in shipments if other.get("port")==shipment["port"] and other.get("lastUnloadedDay")==state["day"])
        remaining=max(0,int(shipment["quantity"])-int(shipment.get("deliveredUnits",0)))
        qty=min(remaining,max(0,daily_capacity-used_today))
        if not qty:
            shipment["statusCause"]="Puerto sin cupo diario de descarga"
            continue
        supply["suppliers"]["Corralón del Puerto"]["steel"]+=qty
        shipment["deliveredUnits"]=shipment.get("deliveredUnits",0)+qty
        shipment["status"]="entregado" if shipment["deliveredUnits"]>=shipment["quantity"] else "descarga parcial"
        shipment["lastUnloadedDay"]=state["day"]
        shipment["lastUnloadedUnits"]=qty
        shipment["statusCause"]="" if shipment["status"]=="entregado" else "Descarga parcial pendiente"
        if shipment["status"]=="entregado":shipment["deliveredDay"]=state["day"]
        supply["steelImportedUnits"]=supply.get("steelImportedUnits",0)+qty
        ev("Acero desembarcado",f"{qty} unidades descargadas; {shipment['quantity']-shipment['deliveredUnits']} pendientes.")

def tick_one_day():
    if state["paused"]: return
    ensure_supply_state()
    state["day"] += 1
    day=state["day"]
    advance_maritime_steel_shipments()
    advance_contract_guarantees()
    advance_industrial_reopenings()
    advance_heritage_works()
    advance_urban_evolution()
    advance_urban_renewals()
    advance_adaptive_reuse()
    advance_utility_repairs()
    calculate_utility_balance();advance_utility_backup_fuel();apply_climate_impacts();apply_drainage_impacts();advance_recovery_contracts();calculate_waste_balance(advance=True,apply_effects=True);health_service_report(advance=True);education_service_report(advance=True);fire_service_report(advance=True)
    month=(day-1)//30
    if month>state["lastMonth"]:
        police_service_report(advance=True)
        for home in state["buildings"]:
            if home.get("kind")=="home":home["monthlyWageIncome"]=0
        supplier_stock=state["supply"]["suppliers"]
        refill_market_suppliers()
        # Mineral regional finito: la reposición de acero no puede crear materia de la nada.
        regional_reserve=max(0,int(state["supply"].setdefault("regionalSteelReserve",30000)))
        for key,amount in REGIONAL_PRODUCTION.items():
            batches=[round(amount*.6),round(amount*.25),round(amount*.15)]
            if key=="steel":
                remaining=min(regional_reserve,sum(batches))
                allocated=[]
                for request in batches:
                    delivered=min(remaining,request)
                    allocated.append(delivered)
                    remaining-=delivered
                batches=allocated
                regional_reserve-=sum(batches)
            for name,quantity in zip(("Distribuidora Regional","Corralón del Puerto","Flete Urgente"),batches):
                supplier_stock[name][key]+=quantity
        # Prospección geológica privada: inversión real y depósitos sin explotar finitos.
        unexplored=max(0,int(state["supply"].setdefault("unexploredSteelOre",12000)))
        if regional_reserve<900 and unexplored>=300 and int(state.get("privateCapital",0))>=4500:
            state["privateCapital"]-=4500
            state["supply"]["geologicalExplorationSpend"]=state["supply"].get("geologicalExplorationSpend",0)+4500
            regional_reserve+=300
            unexplored-=300
            state["supply"]["unexploredSteelOre"]=unexplored
            ev("Prospección minera regional","Capital privado financió $4500 para habilitar 300 unidades de mineral siderúrgico verificado.")
        state["supply"]["regionalSteelReserve"]=regional_reserve
        # Recuperación industrial con masa y presupuesto: la chatarra reciclada es el insumo.
        scrap=max(0,float(state.get("waste",{}).get("scrapSteelTons",0)))
        recycled_units=min(int(scrap*2),max(0,int(state.get("money",0)//12)),max(0,240-int(supplier_stock["Corralón del Puerto"].get("steel",0))))
        if recycled_units:
            cost=recycled_units*12
            state["money"]-=cost
            state["waste"]["scrapSteelTons"]=round(scrap-recycled_units/2,3)
            supplier_stock["Corralón del Puerto"]["steel"]+=recycled_units
            state["supply"]["steelRecyclingSpend"]=state["supply"].get("steelRecyclingSpend",0)+cost
            ev("Acero reciclado",f"Recuperadas {recycled_units} unidades desde chatarra municipal; procesamiento $ {cost}.")
        # Importación marítima excepcional: requiere puerto operativo, acceso vial y fondos.
        depot=supplier_stock["Corralón del Puerto"]
        inbound=sum(o["quantity"] for o in state["supply"].get("steelShipments",[]) if o.get("status") in ("en viaje","descarga parcial"))
        if int(depot.get("steel",0))+inbound<30:
            ports=[b for b in state.get("buildings",[]) if b.get("kind")=="port" and b.get("operational")]
            viable=[b for b in ports if route_between((b["x"],b["y"]),(4,10)) is not None]
            if viable:
                port=viable[0]
                port_capacity=sum(max(0,min(int(b.get("shipCapacity",180)),int(b.get("cargoCapacity",500))-int(b.get("cargoStored",0)))) for b in viable)
                units=min(60,max(0,port_capacity-inbound),240-max(0,int(depot.get("steel",0)))-inbound,max(0,int(state.get("money",0)//280)))
                if units>0:
                    cost=units*280
                    state["money"]-=cost
                    state["supply"].setdefault("steelShipments",[]).append({"quantity":units,"port":[port["x"],port["y"]],"orderedDay":state["day"],"arrivalDay":state["day"]+12,"cost":cost,"status":"en viaje"})
                    state["supply"]["steelImportSpend"]=state["supply"].get("steelImportSpend",0)+cost
                    ev("Acero contratado por puerto",f"{units} unidades zarparon; anticipo $ {cost}, llegada prevista en 12 días.")
        ev("Producción regional", "Canteras, acerías y talleres repusieron parte de las existencias de proveedores.")
        process_training_programs()
        calculate_utility_balance(apply_effects=True)
        economic=commute_model()
        public_payroll=pay_public_wages(economic)
        simulate_airport_month(economic)
        prepare_tourism_event_month(month)
        tourism_tax=simulate_hotel_month(economic)
        renew_private_commercial_leases()
        activity=simulate_business_month(economic)
        settle_tourism_event_retail()
        rebalance_private_staffing(economic)
        reprice_private_shops()
        price_industrial_competition()
        tax_report=collect_municipal_taxes()
        economic=commute_model()
        collect_bus_fares(economic)
        business_income=round(economic["privateStaffedJobs"]*2)
        transit_income=sum(line.get("monthlyFareRevenue",0) for line in state.get("busRoutes",[]) if line.get("operational"))
        transit_cost=sum(line.get("monthlyOperatingCost",0) for line in state.get("busRoutes",[]) if line.get("operational"))
        airport_income=state.get("airportMonthlyIncome",0)
        monthly_income=state["monthlyIncome"]+business_income+transit_income+airport_income+tourism_tax+tax_report.get("collected",0)
        utility_maintenance=state.get("utilities",{}).get("report",{}).get("monthlyMaintenance",0)
        road_maintenance=road_maintenance_report().get("monthlyRequired",0)
        waste_report=calculate_waste_balance()
        recycling_income=waste_report.get("recyclingRevenueMonth",0)
        monthly_income+=recycling_income
        waste_cost=waste_report.get("monthlyOperatingCost",0)
        health_summary=health_service_report(economic["workplaces"]);health_cost=health_summary.get("monthlySupplyCost",0)+health_summary.get("hospital",{}).get("monthlyOperatingCost",0);education_cost=education_service_report(economic["workplaces"]).get("monthlySuppliesCost",0)
        operating_costs={"services":state["monthlyExpenses"]+public_payroll+health_cost+education_cost+police_service_report(economic["workplaces"]).get("monthlyOperatingCost",0),"mobility":transit_cost,"networks":utility_maintenance+waste_cost+road_maintenance}
        full_operating_cost=sum(operating_costs.values())
        debt_due=municipal_finance_report(monthly_income,full_operating_cost)["monthlyDebtService"]
        available=state["money"]+monthly_income
        budget_report=settle_municipal_program_budgets(operating_costs,available);available=budget_report["cashRemaining"]
        road_maintenance_report(budget_report["programs"]["networks"]["fundingPct"]/100,advance=True)
        advance_utility_line_conditions(budget_report["programs"]["networks"]["fundingPct"]/100)
        road_report=state.get("roadMaintenanceReport",{});poor=road_report.get("poorSegments",0);total=road_report.get("segments",0)
        facilities=road_report.get("facilityCount",0);worn=road_report.get("wornFacilities",0)
        if (total and poor/max(1,total)>=.35) or (facilities and worn/max(1,facilities)>=.25):
            state["services"]=max(5,state["services"]-1);ev("Calles con mantenimiento diferido",f"Calles deterioradas: {poor}/{total}; edificios públicos bajo 60%: {worn}/{facilities}. El nivel de servicios municipales baja hasta financiar reparaciones.")
        due=full_operating_cost+debt_due
        net=monthly_income-due
        if available>=debt_due:
            state["money"]=available-debt_due
            if debt_due:municipal_debt_payment()
        else:
            # El fondo de deuda cubre faltantes de servicio; no cuenta como caja de libre disposición.
            finance=state.setdefault("finance",new_finance());reserve=max(0,int(finance.get("debtReserve",0)))
            reserve_used=min(debt_due,max(0,debt_due-available),reserve)
            if reserve_used and available+reserve_used>=debt_due:
                finance["debtReserve"]=reserve-reserve_used;state["money"]=available-debt_due+reserve_used
                municipal_debt_payment();finance.setdefault("debtReserveHistory",[]).append({"day":day,"amount":-reserve_used,"reason":"Servicio mensual de deuda"});del finance["debtReserveHistory"][:-24]
                ev("Reserva de deuda aplicada",f"El fondo de deuda aportó $ {reserve_used:,} para completar las cuotas municipales. Saldo protegido: $ {finance['debtReserve']:,}.".replace(",","."))
            else:
                # No sobregiro implícito: se agota la caja y cae la capacidad de servicio financiada.
                shortfall=debt_due-available
                state["money"]=0
                loss=max(1,min(8,round(shortfall/900)))
                state["services"]=max(5,state["services"]-loss)
                state["approval"]=max(5,state["approval"]-max(1,loss//2))
                for loan in state.get("finance",{}).get("municipalLoans",[]):
                    if loan.get("status")=="active":
                        loan["delinquentMonths"]=loan.get("delinquentMonths",0)+1
                        if loan["delinquentMonths"]>=2:state["services"]=max(5,state["services"]-1)
                ev("Servicios sin financiación completa",f"Faltaron $ {shortfall:,} para el gasto mensual; la cobertura cae {loss} puntos hasta recuperar caja.".replace(",","."))
        state["lastMonth"]=month
        ev("Actividad de empresas",f"Comercios vendieron {activity['sales']} unidades por $ {activity['revenue']:,}; nómina pagada $ {activity['payroll']:,}. Empresas cerradas este mes: {activity['closed']}.".replace(",","."))
        ev("Balance mensual",f"Ingresos $ {monthly_income:,} · programas abonados $ {budget_report['paid']:,} · mora programática $ {budget_report['arrears']:,} · cuotas $ {debt_due:,} · caja final $ {state['money']:,}.".replace(",","."))
        move_households()
        advance_zoned_development()
        consider_industrial_reopenings()
        collect_adaptive_rents()
        update_government_cycle()
        if net<0: ev("Presión sobre la tesorería","El gasto mensual supera los ingresos disponibles; revisar compromisos y servicios.")
    process_government_election()
    process_market_orders()
    process_supply_orders()
    process_port_logistics()
    for p in list(state["projects"]):
        if p.get("status")=="pausada": continue
        if p.get("status")=="cambio_pendiente": continue
        if p.get("status")=="suspendida":
            if not p.get("cause","").startswith("Faltan materiales") or missing_materials(p,p["elapsed"]+1): continue
            p["status"]="contratada";p["cause"]="Insumos recibidos; la cuadrilla vuelve a trabajar"
            ev("Obra reanudada por abastecimiento",f"{p['label']} recibió materiales y retoma el avance.")
        c=CONTRACTORS[p["contractor"]]
        if assess_contract_delay(p,c): continue
        next_elapsed=p["elapsed"]+1
        missing=missing_materials(p,next_elapsed)
        if missing:
            p["status"]="suspendida"
            p["cause"]="Faltan materiales: "+", ".join(MATERIAL_NAMES[key] for key in missing)
            ev("Obra demorada por insumos",f"{p['label']} en {p['x']+1},{p['y']+1}: {p['cause']}. Pedí los materiales faltantes desde la tarjeta de la obra.")
            continue
        next_progress,earned_milestones,certified,targetPaid,due,milestone_base,milestones_remaining=project_certificate(p,next_elapsed)
        if not p.get("privatePaid") and not p.get("changeOrderReviewed") and next_progress>=.2:
            p["changeOrderReviewed"]=True
            if request_contract_change(p):continue
        retention_due=round(p.get("cost",0)*max(0,min(.2,float(p.get("retentionPct",0))))) if next_progress>=1 and not p.get("privatePaid") else 0
        if not p.get("privatePaid") and due+retention_due>state["money"]:
            p["status"]="suspendida"; p["cause"]=f"Tesorería insuficiente para certificar el hito {earned_milestones}/{milestones_remaining} y apartar su garantía" if retention_due else f"Tesorería insuficiente para certificar el hito {earned_milestones}/{milestones_remaining}"; continue
        material_cost=material_delta(p,next_elapsed)
        consume_materials(p,material_cost)
        for key,amount in material_cost.items():p["materialsUsed"][key]=p["materialsUsed"].get(key,0)+amount
        if not p.get("privatePaid"): state["money"]-=due
        if due>0: state["supply"]["contractorCash"][p["contractor"]]+=due
        p["paid"]=targetPaid
        p["elapsed"]=next_elapsed
        p["progress"]=next_progress
        if earned_milestones>certified:
            p["certifiedMilestones"]=earned_milestones;p.setdefault("certificationHistory",[]).append({"milestone":milestone_base+earned_milestones,"day":day,"physicalProgress":round(next_progress,4),"amount":round(due),"cumulativePaid":round(targetPaid)})
            if due:ev("Hito de obra certificado",f"{p['label']}: {p['stages'][min(milestone_base+earned_milestones-1,len(p['stages'])-1)]} · avance físico {round(next_progress*100)}% · certificado ${round(due):,} · total pagado ${round(targetPaid):,} de ${round(p['cost']):,}.".replace(",","."))
        stage=int(p["progress"]*len(p["stages"]))
        p["stageIndex"]=min(len(p["stages"])-1,stage)
        if p["progress"]>=1:
            quality=max(35,round(c["quality"]*100-p.get("qualityPenalty",0)))
            if p["kind"]=="road":
                state["roads"].append([p["x"],p["y"]])
                state["monthlyIncome"]+=85
                maintenance=round(70*(1.2-c["quality"]))
                state["monthlyExpenses"]+=maintenance
                state["roadAssets"].append({"x":p["x"],"y":p["y"],"quality":quality,"monthlyCost":maintenance})
            elif p["kind"]=="home":
                b={"x":p["x"],"y":p["y"],"kind":"home","name":"Viviendas en calle nueva","level":1,"occupants":0,"capacity":28,"status":"habilitado","quality":quality}; state["buildings"].append(b)
                ev("Vivienda terminada",f"La vivienda en {p['x']+1},{p['y']+1} superó la inspección y quedó disponible. Los hogares llegarán según demanda y empleos.")
            elif p["kind"]=="shop":
                building={"x":p["x"],"y":p["y"],"kind":"shop","name":"Nuevo comercio","level":1,"occupants":0,"status":"habilitado","quality":quality}
                opening_capital=min(1200,max(0,state["privateCapital"]));state["privateCapital"]-=opening_capital
                building["business"]=new_business(building,12,opening_capital);state["buildings"].append(building);state["jobs"]+=12
            elif p["kind"]=="factory":
                industry_type=p.get("industryType") or next_factory_industry();is_quarry=industry_type=="quarry";is_sawmill=industry_type=="sawmill";is_metalworks=industry_type=="metalworks";name=FACTORY_LABELS.get(industry_type,"Procesadora de alimentos")
                building={"x":p["x"],"y":p["y"],"kind":"factory","name":name,"level":1,"occupants":0,"status":"habilitado","quality":quality,"jobSlots":20,"monthlyOperatingCost":320 if is_quarry else 360 if is_sawmill else 420 if is_metalworks else 180}
                if industry_type=="concrete":name="Hormigonera de Puerto Claro"
                building["name"]=name;building["monthlyOperatingCost"]=450 if industry_type=="concrete" else building["monthlyOperatingCost"]
                building["business"]={"id":f"factory-{p['x']}-{p['y']}","name":building["name"],"industryType":industry_type,"status":"abierto","cash":int(p.get("operatingReserve",4200)),"jobSlots":20,"wage":12,"lastProduction":0,"lastLocalSales":0,"lastProfit":0,"inventory":0,"rawMaterialInventory":0,"rawSteelInventory":0,"componentStock":0,"lastMaterialPurchase":0,"lastMaterialShortage":0,"lastMaterialCause":"","quarryReserve":2400 if is_quarry else 0,"aggregateStock":0,"concreteStock":0,"timberStock":0}
                state["buildings"].append(building);state["jobs"]+=20
                if is_quarry:ev("Cantera local habilitada","20 puestos industriales y una reserva geológica finita de 2.400 unidades. La extracción depende de personal, electricidad, agua y tratamiento cloacal; los áridos se venden por el sistema de pedidos con camiones.")
                elif industry_type=="concrete":ev("Hormigonera local habilitada","20 puestos y producción de hormigón en proporción 2 áridos por 1 hormigón. Compra a la cantera local por ruta vial; personal y servicios limitan la producción.")
                elif is_sawmill:ev("Aserradero local habilitado","20 puestos y madera de una reserva forestal finita con regeneración mensual. La producción depende de personal, electricidad, agua y saneamiento; la madera se vende por pedidos con camión.")
                elif is_metalworks:ev("Metalúrgica local habilitada","20 puestos; compra acero por carretera y lo convierte en componentes de construcción. La producción depende de personal, servicios y caja; los componentes se venden a obras.")
                else:ev("Fábrica habilitada",f"{building['name']} abre con 20 puestos. Debe comprar grano regional por camión; la producción y venta local dependen de inventario, personal y servicios.")
            elif p["kind"]=="depot":
                model=SERVICE_MODELS.get(p.get("serviceModel"),SERVICE_MODELS["wasteYard"])
                capacity=500*model["trucks"]
                state["buildings"].append({"x":p["x"],"y":p["y"],"kind":"depot","name":model["label"],"serviceModel":p.get("serviceModel","wasteYard"),"level":1,
                    "status":"habilitado","capacityAdded":capacity,"jobSlots":model["jobs"],"quality":quality})
                depot_id=f"depot-{p['x']}-{p['y']}"
                state["supply"].setdefault("depots",[]).append({"id":depot_id,"x":p["x"],"y":p["y"],"capacity":capacity,"label":model["label"],"stocks":{name:{key:0 for key in MATERIAL_NAMES} for name in CONTRACTOR_NAMES}})
                state["supply"]["storageCapacity"]+=capacity;state["monthlyExpenses"]+=180*model["trucks"];state["jobs"]+=model["jobs"]
                ev("Depósito logístico habilitado",f"El depósito abre con 500 unidades de capacidad adicional. Operación y seguridad $ 180/mes.")
            elif p["kind"]=="busGarage":
                state["buildings"].append({"x":p["x"],"y":p["y"],"kind":"busGarage","name":"Cochera municipal","level":1,"status":"habilitado","busBayCapacity":4,"monthlyCost":50,"quality":quality})
                state["monthlyExpenses"]+=50
                ev("Cochera habilitada",f"La cochera ofrece cuatro plazas para colectivos con acceso vial. Mantenimiento $ 50/mes; cada vehículo alojado ahorra $ 30/mes frente al alquiler externo.")
            elif p["kind"]=="powerPlant":
                plant={"x":p["x"],"y":p["y"],"kind":"powerPlant","name":"Central eléctrica","level":1,"status":"habilitado","quality":quality,"jobSlots":18,"generationKw":900,"monthlyCost":460}
                state["buildings"].append(plant);state["jobs"]+=18;state["monthlyExpenses"]+=460
                ev("Central eléctrica habilitada",f"Aporta hasta 900 kW si se conecta a las redes eléctrica y de agua. Operación $460/mes; 18 puestos técnicos.")
            elif p["kind"]=="waterPlant":
                plant={"x":p["x"],"y":p["y"],"kind":"waterPlant","name":"Planta potabilizadora","level":1,"status":"habilitado","quality":quality,"jobSlots":12,"treatmentM3Day":220,"monthlyCost":340}
                state["buildings"].append(plant);state["jobs"]+=12;state["monthlyExpenses"]+=340
                ev("Planta potabilizadora habilitada",f"Trata hasta 220 m³/día si tiene conexiones de electricidad y agua. Operación $340/mes; 12 puestos técnicos.")
            elif p["kind"]=="wastewaterPlant":
                plant={"x":p["x"],"y":p["y"],"kind":"wastewaterPlant","name":"Planta depuradora","level":1,"status":"habilitado","quality":quality,"jobSlots":14,"treatmentM3Day":260,"monthlyCost":380}
                state["buildings"].append(plant);state["jobs"]+=14;state["monthlyExpenses"]+=380
            elif p["kind"]=="recyclingPlant":
                facility={"x":p["x"],"y":p["y"],"kind":"recyclingPlant","name":"Planta municipal de reciclaje","level":1,"status":"habilitado","quality":quality,"jobSlots":16,"processingTonsDay":1.25,"monthlyCost":650}
                state["buildings"].append(facility);state["jobs"]+=16
                ev("Planta de reciclaje habilitada","Puede clasificar hasta 1,25 t/día: recupera 35% de lo recolectado y vende material recuperado. Operación $650/mes; 16 puestos.")
            elif p["kind"]=="landfill":
                facility={"x":p["x"],"y":p["y"],"kind":"landfill","name":"Relleno sanitario municipal","level":1,"status":"habilitado","quality":quality,"jobSlots":12,"capacityAdded":1800,"monthlyCost":420}
                state["buildings"].append(facility);state["jobs"]+=12
                ev("Celda sanitaria habilitada",f"El nuevo relleno amplía la disposición final en 1.800 toneladas y suma 12 puestos. Operación $420/mes.")
                ev("Planta depuradora habilitada",f"Trata hasta 260 m³/día si está conectada a cloacas, energía y agua. Operación $380/mes; 14 puestos técnicos.")
            elif p["kind"]=="hotel":
                opening=min(4500,max(0,state.get("privateCapital",0)));state["privateCapital"]-=opening
                hotel={"x":p["x"],"y":p["y"],"kind":"hotel","name":"Hotel Independiente","level":1,"status":"habilitado","quality":quality,"jobSlots":10,"rooms":24,"beds":48,"nightlyRate":90,"monthlyGuests":0,"monthlyGuestNights":0,"business":{**new_business({"x":p["x"],"y":p["y"],"name":"Hotel Independiente"},10,opening),"wage":10,"fixedCost":260,"closureMonths":0,"lastTourismTax":0}}
                state["buildings"].append(hotel);state["jobs"]+=10
                ev("Hotel privado habilitado",f"Abrió con 24 habitaciones, 48 plazas y 10 empleos. Depende de llegadas, acceso vial y caja privada para seguir operando.")
            elif p["kind"]=="airport":
                airport={"x":p["x"],"y":p["y"],"kind":"airport","name":"Aeropuerto regional","level":1,"status":"habilitado","quality":quality,"jobSlots":18,"passengerCapacity":800,"runwayMovements":12,"monthlyPassengers":0,"monthlyArrivals":0,"monthlyDepartures":0,"monthlyFlights":0,"airportFeeIncome":0,"monthlyCost":600,"operational":False}
                state["buildings"].append(airport);state["jobs"]+=18;state["monthlyExpenses"]+=600
                ev("Aeropuerto regional habilitado",f"Pista y terminal pasan a pruebas. Capacidad 800 pasajeros y 12 vuelos por mes; 18 puestos y $ 600/mes de operación.")
            elif p["kind"]=="port":
                port={"x":p["x"],"y":p["y"],"kind":"port","name":"Terminal portuaria","level":1,"status":"habilitado","quality":quality,"jobSlots":12,"cargoCapacity":500,"cargoStored":0,"shipCapacity":180,"shipsDeparted":0,"lastShipDay":0,"monthlyCost":320,"feeIncome":0}
                state["buildings"].append(port);state["jobs"]+=12;state["monthlyExpenses"]+=320
                ev("Terminal portuaria habilitada",f"Muelle y patio de 500 unidades abiertos; 12 puestos logísticos y costo operativo $ 320/mes. Requiere ruta vial para recibir cargas.")
            elif p["kind"]=="busStop":
                state["buildings"].append({"x":p["x"],"y":p["y"],"kind":"busStop","name":"Parada de colectivo","level":1,"status":"habilitado","quality":quality,"monthlyCost":25})
                state["monthlyExpenses"]+=25
                ev("Parada de colectivo habilitada",f"La parada abrió junto a la vía con calidad {quality}%. Operación y mantenimiento $ 25/mes.")
            elif p["kind"]=="civic":
                model=SERVICE_MODELS.get(p.get("serviceModel"),SERVICE_MODELS["clinic"])
                operating_cost=round((320+model["jobs"]*23)*(1.4-c["quality"]*.5))
                building={"x":p["x"],"y":p["y"],"kind":"civic","name":model["label"],"serviceModel":p.get("serviceModel","clinic"),"level":1,
                     "occupants":0,"jobSlots":model["jobs"],"status":"habilitado","monthlyCost":operating_cost,"quality":quality}
                if model.get("police"):building["policeUnit"]={"vehicles":model["police"],"priority":"mixto","equippedDay":day}
                if model.get("beds"):building["hospitalWard"]={"beds":model["beds"],"ambulances":model.get("ambulances",0),"equippedDay":day}
                state["buildings"].append(building);state["jobs"]+=model["jobs"];state["monthlyExpenses"]+=operating_cost
                ev("Equipamiento público habilitado",f"{model['label']}: {model['jobs']} puestos, radio vial {model['radius']} calles. Operación $ {operating_cost}/mes; necesita empleados y redes para servir.")
            elif p["kind"]=="school":
                model=SCHOOL_MODELS.get(p.get("serviceModel"))
                jobs=model["jobs"] if model else 12
                monthly=model["monthlyCost"] if model else 820
                building={"x":p["x"],"y":p["y"],"kind":"school","name":model["label"] if model else "Escuela primaria municipal",
                          "level":1,"occupants":0,"jobSlots":jobs,"classrooms":model["classrooms"] if model else 4,
                          "status":"habilitado","monthlyCost":monthly,"quality":quality}
                if model:building["serviceModel"]=p["serviceModel"]
                state["buildings"].append(building);state["jobs"]+=jobs;state["monthlyExpenses"]+=monthly
                ev("Centro educativo habilitado",f"{building['name']}: {jobs} puestos y {building['classrooms']} aulas. Operación $ {monthly}/mes; se requieren docentes, rutas y servicios.")
            elif p["kind"]=="fireStation":
                model=SERVICE_MODELS.get(p.get("serviceModel"),SERVICE_MODELS["firePost"])
                monthly=round(model["cost"]*.065)
                state["buildings"].append({"x":p["x"],"y":p["y"],"kind":"fireStation","name":model["label"],"serviceModel":p.get("serviceModel","firePost"),"level":1,
                    "occupants":0,"jobSlots":model["jobs"],"fireEngineCapacity":model["engines"],"dispatchReadyDay":state["day"],
                    "status":"habilitado","monthlyCost":monthly,"quality":quality});state["jobs"]+=model["jobs"];state["monthlyExpenses"]+=monthly
                ev("Cuartel de bomberos habilitado","El cuartel ofrece 12 puestos y hasta tres dotaciones de cuatro bomberos. Sin personal cualificado o ruta no puede responder; operación y mantenimiento $950/mes.")
            if p["kind"] not in ("civic","school","fireStation","depot","landfill","recyclingPlant","port","airport","hotel","powerPlant","waterPlant","wastewaterPlant"): ev(f"{p['label']} habilitado",f"{p['contractor']} entregó la obra con calidad {quality}%. Su mantenimiento afecta el balance municipal." if p["kind"]=="road" else f"{p['contractor']} completó la inspección y entregó la obra con calidad {quality}%.")
            retention_pct=max(0,min(.2,float(p.get("retentionPct",0))))
            retained=min(max(0,round(p.get("cost",0)-p.get("paid",0))),round(p.get("cost",0)*retention_pct))
            if not p.get("privatePaid") and retained:
                state["money"]=max(0,state["money"]-retained)
                state["finance"].setdefault("contractEscrow",{"balance":0})["balance"]+=retained
                contractor=CONTRACTORS.get(p.get("contractor"),CONTRACTORS["Constructora Delta"])
                guarantee={"id":f"garantia-{p['id']}","projectId":p["id"],"label":p["label"],"contractor":p["contractor"],"x":p["x"],"y":p["y"],"kind":p["kind"],"retained":retained,"status":"garantia","startDay":day,"reviewDay":day+30,"initialQuality":quality,"defectChance":.025+(1-quality/100)*.18+(1-contractor["reliability"])*.12}
                state.setdefault("contractGuarantees",[]).append(guarantee)
                ev("Recepción provisional de obra",f"{p['label']}: inspección de entrega aprobada. $ {retained:,} quedan retenidos hasta el control de garantía del día {day+30}.".replace(",","."))
            state["projects"].remove(p)
    if day%30==0 and state["projects"]: ev("Revisión de contratos",f"{len(state['projects'])} obra(s) activa(s). El avance depende del tiempo y de los pagos disponibles.")

# Fase 28: hospitalización municipal y ambulancias asociadas a centros de salud.
HOSPITAL_COSTS={"openHospitalWard":7200,"expandHospitalWard":4600,"addAmbulance":2800}

def invest_hospital_care(action,x,y):
    center=next((b for b in state.get("buildings",[]) if b.get("kind")=="civic" and b.get("x")==x and b.get("y")==y and b.get("status") in ("operativo","habilitado")),None)
    if center is None or not (service_model(center) or {}).get("care"):raise ValueError("La ampliación requiere un centro sanitario construido y habilitado.")
    if route_between((4,10),(x,y)) is None:raise ValueError("El centro necesita acceso vial para recibir equipos y ambulancias.")
    ward=center.get("hospitalWard")
    if action=="openHospitalWard" and ward:raise ValueError("Este centro ya dispone de internación.")
    if action!="openHospitalWard" and not ward:raise ValueError("Primero hay que equipar una sala de internación.")
    if action=="expandHospitalWard" and int(ward.get("beds",0))>=36:raise ValueError("La sala alcanzó su capacidad máxima de 36 camas.")
    if action=="addAmbulance" and int(ward.get("ambulances",0))>=3:raise ValueError("Este centro admite hasta tres ambulancias.")
    if action not in HOSPITAL_COSTS:raise ValueError("Intervención sanitaria no reconocida.")
    reserved=sum(max(0,int(p.get("cost",0)-p.get("paid",0))) for p in state.get("projects",[]) if not p.get("privatePaid"))
    cost=HOSPITAL_COSTS[action]
    if state.get("money",0)-reserved<cost:raise ValueError("Fondos libres insuficientes después de reservar las obras municipales.")
    state["money"]-=cost
    if action=="openHospitalWard":center["hospitalWard"]={"beds":12,"ambulances":0,"equippedDay":state["day"]}
    elif action=="expandHospitalWard":ward["beds"]=min(36,int(ward["beds"])+8)
    else:ward["ambulances"]=int(ward.get("ambulances",0))+1
    ev("Inversión hospitalaria",f"{center.get('name','Centro de salud')}: {action}; inversión municipal $ {cost}. La atención depende del personal sanitario, las redes y las calles.")
    return center["hospitalWard"]

def hospital_care_report(workplaces,homes,advance=False):
    """Camas con rotación de 3 días, equipos sanitarios y traslados con ruta física."""
    health=state.setdefault("health",{})
    staff={(w.get("x"),w.get("y")):max(0,int(w.get("staffedJobs",0))) for w in workplaces if w.get("kind")=="civic"}
    funding=max(0,min(1,float(state.get("finance",{}).get("programBudgets",{}).get("servicesFundingFactor",1))))
    hospitals=[]
    for b in state.get("buildings",[]):
        ward=b.get("hospitalWard")
        if b.get("kind")!="civic" or not ward or b.get("status") not in ("operativo","habilitado") or not (service_model(b) or {}).get("care"):continue
        doctors=max(0,staff.get((b["x"],b["y"]),0)-police_staff_reserved(b,workplaces))
        utility=b.get("utilityAccess",{})
        factor=min(utility.get("powerServedPct",0),utility.get("waterServedPct",0),utility.get("wastewaterTreatedPct",0))/100*funding
        beds=max(0,int(ward.get("beds",0)))
        units=max(0,int(ward.get("ambulances",0)))
        crews=min(units,max(0,(doctors-6)//2)) if factor>=.5 else 0
        capacity=min(beds/3,max(0,doctors-4-crews*2)*1.25)*factor
        hospitals.append({"building":b,"name":b.get("name","Centro de salud"),"staff":doctors,"beds":beds,
            "ambulances":units,"activeAmbulances":crews,"dailyCapacity":capacity,"remaining":capacity,
            "ambulanceRemaining":crews*2,"admitted":0,"transferred":0,"utilityPct":round(factor*100)})
    population=max(1,sum(int(h.get("occupants",0)) for h in homes))
    heat=state.get("climate",{}).get("heatForecast") or {}
    heat_extra=(float(heat.get("actualHealthCases",heat.get("expectedHealthCases",0)))/max(1,int(heat.get("durationDays",5)))*.16) if heat.get("active") else 0
    carry=max(0,float(health.get("hospitalBacklog",0)))*.2
    demand=served=ambulance_cases=0
    neighborhoods=[]
    current_dispatches=[]
    for home in homes:
        occupants=max(0,int(home.get("occupants",0)))
        util=home.get("utilityAccess",{})
        risk=1-min(util.get("waterServedPct",0),util.get("wastewaterTreatedPct",0))/100
        need=occupants*.0018*(1+risk*.5)+heat_extra*occupants/population+carry*occupants/population
        demand+=need
        options=[]
        for h in hospitals:
            path=service_route_within(h["building"],home)
            if path:
                minutes=round(max(0,len(path)-1)*2.5+4)
                if minutes<=45:options.append((minutes,h,path))
        options.sort(key=lambda row:(row[0],row[1]["name"]))
        handled=transferred=0
        for minutes,h,path in options:
            if handled>=need:break
            if minutes<=25:
                take=min(need-handled,h["remaining"])
            else:
                take=min(need-handled,h["remaining"],h["ambulanceRemaining"])
                h["ambulanceRemaining"]-=take
                transferred+=take
                h["transferred"]+=take
                if take>0 and advance and health.get("lastHospitalDay")!=state.get("day"):
                    current_dispatches.append({"id":f"amb-{state['day']}-{home['x']}-{home['y']}-{h['building']['x']}-{h['building']['y']}",
                        "day":state["day"],"station":h["name"],"stationX":h["building"]["x"],"stationY":h["building"]["y"],
                        "x":home["x"],"y":home["y"],"route":list(reversed(path)),"patients":round(take,3),
                        "responseMinutes":minutes,"status":"traslado"})
            h["remaining"]-=take
            h["admitted"]+=take
            handled+=take
        served+=handled;ambulance_cases+=transferred
        neighborhoods.append({"name":home.get("name","Barrio"),"population":occupants,"demand":round(need,2),
            "admitted":round(handled,2),"waiting":round(max(0,need-handled),2),"reachable":bool(options),
            "ambulanceTransfers":round(transferred,2)})
    waiting=max(0,demand-served)
    if advance and health.get("lastHospitalDay")!=state.get("day"):
        health["hospitalBacklog"]=round(min(population*.12,waiting),3)
        health["ambulanceDispatches"]=(health.get("ambulanceDispatches",[])+current_dispatches)[-24:]
        health["lastHospitalDay"]=state["day"]
    fixed=sum(h["beds"]*22+h["ambulances"]*360 for h in hospitals)
    return {"demandPerDay":round(demand,2),"admittedPerDay":round(served,2),"waitingPerDay":round(waiting,2),
        "capacityPerDay":round(sum(h["dailyCapacity"] for h in hospitals),2),
        "ambulanceTransfersPerDay":round(ambulance_cases,2),"coveragePct":round(100*served/max(0.001,demand)) if demand else 100,
        "monthlyOperatingCost":round(fixed+served*20*30),
        "hospitals":[{"name":h["name"],"x":h["building"]["x"],"y":h["building"]["y"],"beds":h["beds"],
            "staff":h["staff"],"ambulances":h["ambulances"],"activeAmbulances":h["activeAmbulances"],
            "capacityPerDay":round(h["dailyCapacity"],2),"admittedPerDay":round(h["admitted"],2),
            "transfersPerDay":round(h["transferred"],2),"utilityPct":h["utilityPct"]} for h in hospitals],
        "ambulanceDispatches":health.get("ambulanceDispatches",[])[-12:],
        "neighborhoods":sorted(neighborhoods,key=lambda n:-n["waiting"])[:6]}

# Fase 28: seguridad urbana con puestos físicos, dotaciones y sucesos causales.
POLICE_COSTS={"openPoliceUnit":4000,"addPoliceVehicle":2500}
POLICE_PRIORITIES=("mixto","residencial","comercial")

def police_staff_reserved(building,workplaces):
    unit=building.get("policeUnit")
    if not unit or building.get("status") not in ("operativo","habilitado"):return 0
    job=next((w for w in workplaces if w.get("kind")=="civic" and w.get("x")==building["x"] and w.get("y")==building["y"]),{})
    assigned=max(0,int(job.get("staffedJobs",0)))
    u=building.get("utilityAccess",{})
    factor=min(u.get("powerServedPct",0),u.get("waterServedPct",0))/100
    funding=max(0,min(1,float(state.get("finance",{}).get("programBudgets",{}).get("servicesFundingFactor",1))))
    if factor*funding<.5:return 0
    return 3*min(max(0,int(unit.get("vehicles",0))),max(0,(assigned-4)//3))

def invest_police_unit(action,x,y,priority=None):
    building=next((b for b in state.get("buildings",[]) if b.get("kind")=="civic" and b.get("x")==x and b.get("y")==y and b.get("status") in ("operativo","habilitado")),None)
    if not building or not (service_model(building) or {}).get("police"):raise ValueError("Primero construí una comisaría o puesto de seguridad.")
    if action=="setPolicePriority":
        if not building.get("policeUnit"):raise ValueError("Primero equipá una base de seguridad.")
        if priority not in POLICE_PRIORITIES:raise ValueError("Prioridad de patrullaje inválida.")
        building["policeUnit"]["priority"]=priority
        ev("Prioridad de patrullaje",f"{building['name']}: prioridad {priority} desde el próximo operativo.")
        return
    if action not in POLICE_COSTS:raise ValueError("Inversión en seguridad desconocida.")
    if route_between((4,10),(x,y)) is None:raise ValueError("La base necesita conexión vial para recibir vehículos.")
    unit=building.get("policeUnit")
    if action=="openPoliceUnit" and unit:raise ValueError("Esta base ya cuenta con seguridad urbana.")
    if action=="addPoliceVehicle" and not unit:raise ValueError("Primero equipá una base de seguridad.")
    if action=="addPoliceVehicle" and int(unit.get("vehicles",0))>=3:raise ValueError("La base admite como máximo tres móviles.")
    reserved=sum(max(0,int(p.get("cost",0)-p.get("paid",0))) for p in state.get("projects",[]) if not p.get("privatePaid"))
    cost=POLICE_COSTS[action]
    if state.get("money",0)-reserved<cost:raise ValueError("Caja libre insuficiente después de reservar las obras.")
    state["money"]-=cost
    if action=="openPoliceUnit":building["policeUnit"]={"vehicles":1,"priority":"mixto","equippedDay":state["day"]}
    else:unit["vehicles"]=int(unit.get("vehicles",0))+1
    ev("Equipamiento de seguridad urbana",f"{building['name']}: inversión $ {cost}. Los móviles necesitan tres trabajadores cada uno y acceso por calles.")

def police_service_report(workplaces=None,advance=False):
    workplaces=workplaces if workplaces is not None else commute_model().get("workplaces",[])
    police=state.setdefault("police",{})
    month=(state.get("day",1)-1)//30
    units=[]
    for b in state.get("buildings",[]):
        if b.get("kind")!="civic" or not b.get("policeUnit") or b.get("status") not in ("operativo","habilitado") or not (service_model(b) or {}).get("police"):continue
        u=b["policeUnit"];personnel=police_staff_reserved(b,workplaces);units.append({"building":b,"name":b.get("name","Base de seguridad"),
            "vehicles":max(0,int(u.get("vehicles",0))),"active":personnel//3,"staff":personnel,
            "priority":u.get("priority","mixto"),"remaining":personnel//3*2,"responded":0})
    sites=[b for b in state.get("buildings",[]) if b.get("kind") in ("home","shop") and b.get("status") not in ("cerrado","abandonado")]
    rows=[]
    for b in sites:
        choices=[]
        for unit in units:
            path=service_route_within(unit["building"],b)
            if path:
                minutes=round(max(0,len(path)-1)*2.5+4)
                if minutes<=40:choices.append((minutes,unit,path))
        choices.sort(key=lambda pair:(pair[0],pair[1]["name"]))
        protected=bool(choices and any(u["active"]>0 for _,u,_ in choices))
        rows.append({"building":b,"choices":choices,"protected":protected})
    if advance and month>police.get("lastProcessedMonth",state.get("lastMonth",0)):
        police["lastProcessedMonth"]=month
        incidents=[];unanswered=responded=damage=0
        for row in rows:
            b=row["building"];kind=b["kind"]
            road_quality=next((float(a.get("quality",82)) for a in state.get("roadAssets",[]) if a.get("x")==b["x"] and a.get("y")==b["y"]),82)
            power=float(b.get("utilityAccess",{}).get("powerServedPct",100))
            threshold=14+(10 if road_quality<40 else 0)+(8 if power<60 else 0)+(7 if kind=="shop" else 0)
            options=[(mins,u,path) for mins,u,path in row["choices"] if u["remaining"]>0 and u["active"]>0]
            if any(u["priority"] in ("mixto","comercial" if kind=="shop" else "residencial") for _,u,_ in options):threshold=max(3,threshold-7)
            token=(month*37+b["x"]*19+b["y"]*43+(11 if kind=="shop" else 0))%100
            if token>=threshold:continue
            response=None
            if options:
                minutes,unit,path=min(options,key=lambda it:(it[0],it[1]["name"]))
                unit["remaining"]-=1;unit["responded"]+=1
                response={"station":unit["name"],"minutes":minutes,"stationX":unit["building"]["x"],"stationY":unit["building"]["y"],"route":path}
                responded+=1
            else:
                unanswered+=1
                if kind=="shop" and b.get("business",{}).get("status")=="abierto":
                    firm=b["business"];lost=min(3,max(0,int(firm.get("inventory",0))))
                    firm["inventory"]=max(0,int(firm.get("inventory",0))-lost);damage+=lost
            incidents.append({"id":f"seg-{month}-{kind}-{b['x']}-{b['y']}","month":month,
                "day":state["day"],"location":b.get("name","Barrio"),"kind":"Comercio" if kind=="shop" else "Espacio residencial",
                "x":b["x"],"y":b["y"],"status":"atendido" if response else "sin respuesta",
                "responseMinutes":response["minutes"] if response else None,
                "station":response["station"] if response else None,"stationX":response["stationX"] if response else None,
                "stationY":response["stationY"] if response else None,"route":response["route"] if response else None})
        police["recentIncidents"]=(police.get("recentIncidents",[])+incidents)[-24:]
        police["lastIncidents"]=len(incidents);police["lastResponded"]=responded;police["lastUnanswered"]=unanswered;police["lastInventoryLoss"]=damage
        police["totalResponded"]=police.get("totalResponded",0)+responded
        police["totalUnanswered"]=police.get("totalUnanswered",0)+unanswered
        if unanswered>=2:state["approval"]=max(0,state.get("approval",0)-1)
        if unanswered>=4:state["services"]=max(0,state.get("services",0)-1)
        if incidents:ev("Operativo mensual de seguridad",f"{len(incidents)} incidentes de convivencia y comercio; {responded} atendidos, {unanswered} sin dotación. Pérdidas físicas de comercios: {damage} unidades.")
    coverage=sum(1 for x in rows if x["protected"])
    base=sum(u["vehicles"]*390 for u in units)
    variable=max(0,int(police.get("lastResponded",0)))*70
    return {"month":month,"sites":len(sites),"coveredSites":coverage,"coveragePct":round(100*coverage/max(1,len(sites))),
        "lastIncidents":police.get("lastIncidents",0),"lastResponded":police.get("lastResponded",0),
        "lastUnanswered":police.get("lastUnanswered",0),"totalResponded":police.get("totalResponded",0),
        "totalUnanswered":police.get("totalUnanswered",0),"lostInventoryUnits":police.get("lastInventoryLoss",0),
        "monthlyOperatingCost":base+variable,
        "units":[{"name":u["name"],"x":u["building"]["x"],"y":u["building"]["y"],
            "vehicles":u["vehicles"],"activeVehicles":u["active"],"staff":u["staff"],
            "priority":u["priority"],"responded":u["responded"]} for u in units],
        "recentIncidents":police.get("recentIncidents",[])[-8:]}

def health_service_report(workplaces=None,advance=False):
    health=state.setdefault("health",{"lastAdvancedDay":None,"lastImpactMonth":-1,"waterSafetyHistory":{}})
    homes=[b for b in state.get("buildings",[]) if b.get("kind")=="home" and b.get("occupants",0)>0]
    workplaces=workplaces if workplaces is not None else commute_model().get("workplaces",[])
    staff={(w.get("x"),w.get("y")):w for w in workplaces if w.get("kind")=="civic"}
    utilities=state.get("utilities",{}).get("report",{})
    heat=(state.get("climate",{}).get("heatForecast") or {})
    heat_per_day=(heat.get("actualHealthCases",heat.get("expectedHealthCases",0))/max(1,heat.get("durationDays",5))) if heat.get("active") else 0
    history=health.setdefault("waterSafetyHistory",{})
    if advance and health.get("lastAdvancedDay")!=state.get("day"):
        for home in homes:
            key=f"{home['x']},{home['y']}"
            served=home.get("utilityAccess",{}).get("waterServedPct",0)
            treated=home.get("utilityAccess",{}).get("wastewaterTreatedPct",0)
            sample=min(served,treated)/100
            samples=history.setdefault(key,[sample]*30);samples.append(sample);history[key]=samples[-30:]
        health["lastAdvancedDay"]=state.get("day")
    clinics=[]
    for building in state.get("buildings",[]):
        if building.get("kind")!="civic" or building.get("status") in ("cerrado","abandonado") or not (service_model(building) or {}).get("care"):continue
        workplace=staff.get((building.get("x"),building.get("y")),{});people=max(0,int(workplace.get("staffedJobs",0))-police_staff_reserved(building,workplaces))
        access=building.get("utilityAccess",{});utility=min(access.get("powerServedPct",0),access.get("waterServedPct",0),access.get("wastewaterTreatedPct",0))/100*max(0,min(1,float(state.get("finance",{}).get("programBudgets",{}).get("servicesFundingFactor",1))))
        clinic_staff=min(4,people) if building.get("hospitalWard") else people
        clinics.append({"building":building,"name":building.get("name","Centro de salud"),"staff":people,"utility":utility,
            "primaryCapacity":clinic_staff*2.2*utility,"urgentCapacity":clinic_staff*.35*utility,"primaryRemaining":clinic_staff*2.2*utility,"urgentRemaining":clinic_staff*.35*utility,
            "served":0,"urgentServed":0,"patients":0,"travelMinutes":[]})
    population=max(1,sum(max(0,b.get("occupants",0)) for b in homes));base_demand=0;urgent_demand=0;primary_served=0;urgent_served=0;areas=[]
    for home in homes:
        key=f"{home['x']},{home['y']}";samples=history.get(key,[])
        if not samples:
            safety=min(home.get("utilityAccess",{}).get("waterServedPct",0),home.get("utilityAccess",{}).get("wastewaterTreatedPct",0))/100;samples=[safety]*30
        safety=sum(samples[-30:])/max(1,len(samples));water_risk=1-safety
        occupants=max(0,home.get("occupants",0));sewer_risk=1-home.get("utilityAccess",{}).get("wastewaterTreatedPct",0)/100
        need=occupants*.045*(1+water_risk*.45+sewer_risk*.25)
        urgent_need=occupants*.004+heat_per_day*occupants/population
        base_demand+=need;urgent_demand+=urgent_need
        choices=[]
        for clinic in clinics:
            building=clinic["building"];path=service_route_within(building,home)
            if not path:continue
            minutes=round(max(0,len(path)-1)*2.5+4)
            if minutes<=45:choices.append((minutes,clinic))
        if choices:
            minutes,clinic=min(choices,key=lambda row:(row[0],row[1]["name"]))
            served=min(need,clinic["primaryRemaining"]);clinic["primaryRemaining"]-=served;clinic["served"]+=served;clinic["patients"]+=1;clinic["travelMinutes"].append(minutes);primary_served+=served
            urgent=min(urgent_need,clinic["urgentRemaining"]);clinic["urgentRemaining"]-=urgent;clinic["urgentServed"]+=urgent;urgent_served+=urgent
        else:served=0;urgent=0
        areas.append({"name":home.get("name",f"Barrio {home['x']+1},{home['y']+1}"),"population":occupants,"travelMinutes":minutes if choices else None,"waterRiskPct":round(water_risk*100),"primaryDemand":round(need,1),"primaryServed":round(served,1),"waiting":round(max(0,need-served),1),"urgentDemand":round(urgent_need,1),"urgentUnserved":round(max(0,urgent_need-urgent),1)})
    backlog=max(0,float(health.get("primaryBacklog",0)));pending=base_demand+backlog;primary_served=min(primary_served,pending)
    unserved=max(0,pending-primary_served);urgent_unserved=max(0,urgent_demand-urgent_served)
    if advance and health.get("lastQueueDay")!=state.get("day"):
        health["primaryBacklog"]=min(population*.25,unserved);health["lastQueueDay"]=state.get("day")
        month=(state.get("day",1)-1)//30
        if month>health.get("lastImpactMonth",-1) and (pending and primary_served/pending<.65 or urgent_demand and urgent_served/urgent_demand<.5):
            state["services"]=max(0,state.get("services",0)-1)
            if primary_served/max(1,pending)<.4 or urgent_served/max(1,urgent_demand)<.35:state["approval"]=max(0,state.get("approval",0)-1)
            ev("Demanda sanitaria sin cubrir",f"La red atendió {round(primary_served)} de {round(pending)} consultas primarias y {round(urgent_served)} de {round(urgent_demand)} urgencias. Las colas presionan los servicios municipales.")
            health["lastImpactMonth"]=month
    area_rows=sorted(areas,key=lambda a:(-a["waiting"]-a["urgentUnserved"],a["name"]))
    monthly_supplies=round(primary_served*.65*30+urgent_served*2.4*30)
    delayed_risk=0
    for home in homes:
        key=f"{home['x']},{home['y']}";samples=history.get(key,[min(home.get("utilityAccess",{}).get("waterServedPct",0),home.get("utilityAccess",{}).get("wastewaterTreatedPct",0))/100]*30)
        delayed_risk+=(1-sum(samples[-30:])/max(1,len(samples[-30:])))*home.get("occupants",0)
    return {"hospital":hospital_care_report(workplaces,homes,advance),"day":state.get("day",1),"population":population,"primary":{"demandPerDay":round(pending,1),"servedPerDay":round(primary_served,1),"capacityPerDay":round(sum(c["primaryCapacity"] for c in clinics),1),"waitlist":round(unserved,1),"coveragePct":round(min(100,primary_served/max(1,pending)*100))},
        "urgent":{"demandPerDay":round(urgent_demand,1),"servedPerDay":round(urgent_served,1),"capacityPerDay":round(sum(c["urgentCapacity"] for c in clinics),1),"unservedPerDay":round(urgent_unserved,1),"coveragePct":round(min(100,urgent_served/max(1,urgent_demand)*100))},
        "clinics":[{"name":c["name"],"x":c["building"]["x"],"y":c["building"]["y"],"staff":c["staff"],"primaryCapacity":round(c["primaryCapacity"],1),"urgentCapacity":round(c["urgentCapacity"],1),"utilityPct":round(c["utility"]*100),"averageTravelMinutes":round(sum(c["travelMinutes"])/max(1,len(c["travelMinutes"]))) if c["travelMinutes"] else None,"patients":c["patients"]} for c in clinics],
        "neighborhoods":area_rows[:6],"unreachableResidents":sum(a["population"] for a in areas if a["travelMinutes"] is None),"delayedWaterRiskPct":round(delayed_risk/population*100),"monthlySupplyCost":monthly_supplies,"primaryBacklog":round(health.get("primaryBacklog",0),1)}

def education_service_report(workplaces=None,advance=False):
    """Alumnado individual con edad, cupos, dotación, presupuesto y acceso vial real."""
    workplaces=workplaces if workplaces is not None else commute_model().get("workplaces",[])
    pupils=[]
    for home in (b for b in state["buildings"] if b.get("kind")=="home" and b.get("occupants",0)>0):
        for person in home.get("residents",[]):
            ensure_person_work_profile(person)
            if person.get("age") is None:
                seed=stable_skill(person.get("id",""),"edad")
                person["age"]=18+seed%48 if person.get("workerEligible") else (5+seed%13 if seed%100<62 else 66+seed%20)
            if 5<=person["age"]<=24:pupils.append((home,person))
    funding=max(0,min(1,float(state.get("finance",{}).get("programBudgets",{}).get("servicesFundingFactor",1))))
    schools=[]
    for b in (b for b in state["buildings"] if b.get("kind")=="school" and b.get("status") in ("habilitado","operativo")):
        model=SCHOOL_MODELS.get(b.get("serviceModel"))
        work=next((w for w in workplaces if w.get("kind")=="school" and w.get("x")==b["x"] and w.get("y")==b["y"]),{})
        teachers=max(0,int(work.get("staffedJobs",0)));access=b.get("utilityAccess",{})
        utility=min(access.get("powerServedPct",0),access.get("waterServedPct",0),access.get("wastewaterTreatedPct",0))/100*funding
        seats=max(0,int(b.get("classrooms",model["classrooms"] if model else 4))*(model["seatsPerClass"] if model else 24))
        teacher_capacity=teachers*(model["studentsPerTeacher"] if model else 18)
        schools.append({"building":b,"model":model,"ageMin":model["minAge"] if model else 5,
                        "ageMax":model["maxAge"] if model else 17,"radius":model["radius"] if model else 15,
                        "teachers":teachers,"utility":utility,"seats":seats,"teacherCapacity":teacher_capacity,
                        "capacity":round(min(seats,teacher_capacity)*utility),"assigned":[],"nearby":0})
    within=0
    for home,person in pupils:
        options=[]
        for school in schools:
            if not school["ageMin"]<=person["age"]<=school["ageMax"]:continue
            path=route_between((home["x"],home["y"]),(school["building"]["x"],school["building"]["y"]))
            if not path or len(path)-1>school["radius"]:continue
            minutes=(len(path)-1)*2.5+4
            if minutes<=(50 if school["model"] and school["model"]["studyLevel"]=="universidad" else 40):
                options.append((minutes,school))
        if not options:continue
        within+=1
        options.sort(key=lambda item:(item[0],item[1]["building"]["x"],item[1]["building"]["y"]))
        options[0][1]["nearby"]+=1
        chosen=next((s for _,s in options if len(s["assigned"])<s["capacity"]),None)
        if chosen:chosen["assigned"].append((person,next(t for t,s in options if s is chosen)))
    rows=[];served=0;supplies=0
    for school in schools:
        enrolled=len(school["assigned"]);served+=enrolled;model=school["model"]
        supplies+=enrolled*(model["supplies"] if model else .35)
        times=[t for _,t in school["assigned"]]
        rows.append({"name":school["building"].get("name","Escuela municipal"),"x":school["building"]["x"],"y":school["building"]["y"],
                     "serviceModel":school["building"].get("serviceModel"),"ageMin":school["ageMin"],"ageMax":school["ageMax"],
                     "radius":school["radius"],"teachers":school["teachers"],"classrooms":school["building"].get("classrooms",4),
                     "seatCapacity":school["seats"],"teacherCapacity":school["teacherCapacity"],"operationalCapacity":school["capacity"],
                     "studentsNearby":school["nearby"],"enrolled":enrolled,"unserved":max(0,school["nearby"]-enrolled),
                     "utilityPct":round(school["utility"]*100),"averageTravelMinutes":round(sum(times)/len(times),1) if times else None})
    month=(state.get("day",1)-1)//30
    education=state.setdefault("education",{"lastProcessedMonth":month})
    if advance and month>education.get("lastProcessedMonth",-1):
        education["lastProcessedMonth"]=month
        for school in schools:
            model=school["model"];level=model["studyLevel"] if model else "primaria";gain=model["skillGain"] if model else 2
            for person,_ in school["assigned"]:
                progress=person.setdefault("educationProgress",{"months":0,"level":"inicial"})
                progress["months"]=progress.get("months",0)+1
                levels=progress.setdefault("monthsByLevel",{})
                levels[level]=levels.get(level,0)+1
                if levels[level]%12==0:
                    progress["level"]=level
                    if gain:
                        for skill in ("comercio","administracion","logistica","salud","educacion"):
                            person["skills"][skill]=min(100,person["skills"].get(skill,25)+gain)
        ev("Ciclo escolar",f"{served} cursan; {within-served} esperan plaza y {len(pupils)-within} no tienen centro de su nivel conectado.")
    total=len(pupils)
    return {"schoolAgePopulation":total,"withinReach":within,"enrolled":served,"waiting":within-served,"unreachable":total-within,
            "coveragePct":round(served/max(1,total)*100),"schools":rows,"monthlySuppliesCost":round(supplies)}

def fire_service_report(workplaces=None,advance=False):
    """Incendios urbanos deterministas: cobertura, despacho y daño dependen de personal y calles."""
    fire=state.setdefault("fireService",{"incidents":[],"lastGeneratedMonth":-1,"dispatches":0,"resolved":0,"unanswered":0})
    incidents=fire.setdefault("incidents",[]);day=state.get("day",1)
    workplaces=workplaces if workplaces is not None else commute_model().get("workplaces",[])
    if advance:
        month=(day-1)//30
        if day%30==10 and month>fire.get("lastGeneratedMonth",-1):
            fire["lastGeneratedMonth"]=month
            active=[b for b in state.get("buildings",[]) if b.get("kind") in ("home","shop","hotel","airport","port","school") and b.get("status") not in ("cerrado","abandonado")]
            climate=state.get("climate",{});heat=(climate.get("heatForecast") or {}).get("active",False);drought=(climate.get("droughtForecast") or {}).get("status")=="activa"
            threshold=min(82,12+len(active)*2+(10 if heat else 0)+(8 if drought else 0))
            roll=stable_skill(f"{month}:{state.get('population',0)}","incendio")%100
            if active and roll<threshold and not any(i.get("status")=="ardiendo" for i in incidents):
                target=active[stable_skill(str(month),"parcela")%len(active)]
                incident={"id":f"fire-{month}-{target['x']}-{target['y']}","x":target["x"],"y":target["y"],"buildingKind":target["kind"],"name":target.get("name",target["kind"]),"startDay":day,"status":"ardiendo","damage":0}
                incidents.append(incident);ev("Incendio urbano detectado",f"Se inició un incendio en {incident['name']}. La dotación, el estado de los vehículos y el tiempo por calles definen si puede llegar a controlarlo.")
        stations=[]
        for b in state.get("buildings",[]):
            if b.get("kind")!="fireStation" or b.get("status") in ("cerrado","abandonado"):continue
            work=next((w for w in workplaces if w.get("kind")=="fireStation" and w.get("x")==b.get("x") and w.get("y")==b.get("y")),{})
            stations.append({"building":b,"staff":max(0,work.get("staffedJobs",0)),"ready":b.get("dispatchReadyDay",day)})
        for incident in incidents:
            if incident.get("status")!="ardiendo":continue
            choices=[]
            for station in stations:
                if station["staff"]<4 or station["ready"]>day:continue
                path=service_route_within(station["building"],incident)
                if path:choices.append((5+max(0,len(path)-1)*2.5,station))
            if choices:
                minutes,station=min(choices,key=lambda row:(row[0],row[1]["building"]["x"],row[1]["building"]["y"]))
                target=next((b for b in state["buildings"] if b.get("x")==incident["x"] and b.get("y")==incident["y"]),None)
                damage=max(1,min(18,round(minutes/5)))
                if target:
                    target["quality"]=max(20,target.get("quality",75)-damage)
                    if target.get("kind")=="home":target["householdCash"]=max(0,target.get("householdCash",0)-damage*25)
                    elif target.get("business"):target["business"]["cash"]=max(0,target["business"].get("cash",0)-damage*45)
                station["building"]["dispatchReadyDay"]=day+2;incident.update({"status":"controlado","responseMinutes":round(minutes),"station":station["building"].get("name","Cuartel municipal"),"stationX":station["building"]["x"],"stationY":station["building"]["y"],"route":path,"damage":damage,"resolvedDay":day})
                fire["dispatches"]+=1;fire["resolved"]+=1
                if damage>=10:state["services"]=max(0,state.get("services",0)-1)
                ev("Incendio controlado",f"{station['building'].get('name','Cuartel municipal')} llegó en {round(minutes)} min con cuatro bomberos. Daño de condición: {damage} puntos; la dotación queda ocupada dos días.")
            else:
                incident["burningDays"]=incident.get("burningDays",0)+1
                target=next((b for b in state["buildings"] if b.get("x")==incident["x"] and b.get("y")==incident["y"]),None)
                if target:target["quality"]=max(20,target.get("quality",75)-2)
                if incident["burningDays"]>=5:
                    incident.update({"status":"extinguido sin dotación","resolvedDay":day,"damage":10});fire["unanswered"]+=1
                    state["services"]=max(0,state.get("services",0)-2);state["approval"]=max(0,state.get("approval",0)-1)
                    ev("Incendio sin respuesta",f"{incident['name']} ardió durante cinco días sin una dotación cualificada o una ruta operativa. La condición del inmueble y la confianza pública empeoraron.")
    stations=[]
    for b in state.get("buildings",[]):
        if b.get("kind")!="fireStation" or b.get("status") in ("cerrado","abandonado"):continue
        work=next((w for w in workplaces if w.get("kind")=="fireStation" and w.get("x")==b.get("x") and w.get("y")==b.get("y")),{})
        stations.append({"name":b.get("name","Cuartel de bomberos"),"x":b["x"],"y":b["y"],"firefighters":max(0,work.get("staffedJobs",0)),"crews":min(int(b.get("fireEngineCapacity",1)),max(0,work.get("staffedJobs",0)//4)),"readyDay":b.get("dispatchReadyDay",day)})
    eligible=[b for b in state.get("buildings",[]) if b.get("kind") in ("home","shop","hotel","airport","port","school")]
    covered=0
    for target in eligible:
        if any(s["firefighters"]>=4 and (station:=next((b for b in state["buildings"] if b.get("kind")=="fireStation" and b["x"]==s["x"] and b["y"]==s["y"]),None)) and service_route_within(station,target) for s in stations):covered+=1
    return {"day":day,"stations":stations,"coveragePct":round(covered/max(1,len(eligible))*100),"coveredBuildings":covered,"eligibleBuildings":len(eligible),"dispatches":fire.get("dispatches",0),"resolved":fire.get("resolved",0),"unanswered":fire.get("unanswered",0),"activeIncidents":[dict(i) for i in incidents if i.get("status")=="ardiendo"],"recentIncidents":[dict(i) for i in incidents[-8:][::-1]],"monthlyOperatingCost":len(stations)*950}

def public_state(player_id=None):
    ensure_supply_state()
    ensure_finance_state()
    cutoff=time.time()-25
    online=sum(1 for t in state["players"].values() if t>cutoff)
    ensure_utility_state();calculate_utility_balance();calculate_waste_balance()
    reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"))
    view={k:v for k,v in state.items() if k not in ("players","host")}
    view["governmentReport"]=government_report()
    view["municipalTeam"]=municipal_team_report(player_id)
    view["municipalFinance"]=municipal_finance_report()
    view["heritageReport"]=heritage_report()
    view["urbanEvolutionReport"]=urban_evolution_report()
    view["regionalMarketReport"]=state.get("regionalMarketReport",state.get("regionalMarket",{}).get("lastReport",{}))
    view["roadMaintenanceReport"]=road_maintenance_report()
    order_views=[]
    for order in state["supply"]["orders"]:
        extra=order_urgency(order)
        if order.get("status")=="en tránsito":
            factor,delay,arrival=order_route_eta(order)
            extra.update({"trafficFactor":round(factor,2),"trafficDelayDays":delay,"arrivalDay":arrival,
                          "routeProgress":order.get("routeProgress",order.get("progress",0))})
        order_views.append({**order,**extra})
    view["supply"]={**state["supply"],"orders":order_views}
    view["airports"]=[{**p,"accessConnected":bool(route_between((4,10),(p["x"],p["y"]))) } for p in state["buildings"] if p.get("kind")=="airport"]
    view["hotels"]=[b for b in state["buildings"] if b.get("kind")=="hotel"]
    view["tourism"]={"visitors":state.get("airportVisitorsThisMonth",0),"eventVisitors":state.get("eventVisitorsThisMonth",0),"eventRetailSpend":state.get("eventRetailSpendThisMonth",0),"eventCleanupSpend":state.get("eventCleanupSpendThisMonth",0),"events":state.get("tourismEvents",[])[-6:],"overnightGuests":sum(b.get("monthlyGuests",0) for b in view["hotels"]),"guestNights":sum(b.get("monthlyGuestNights",0) for b in view["hotels"]),"hotelRevenue":sum(b.get("business",{}).get("lastRevenue",0) for b in view["hotels"]),"municipalTax":sum(b.get("business",{}).get("lastTourismTax",0) for b in view["hotels"]),"openHotels":sum(b.get("business",{}).get("status")=="abierto" for b in view["hotels"])}
    view["ports"]=[{**p,"inTransit":sum(o.get("status") in ("pendiente","en tránsito","esperando acceso","esperando patio") for o in state["supply"].get("portOrders",[]) if o.get("portId")==p.get("id",f"port-{p['x']}-{p['y']}")),"waitingAccess":sum(o.get("status")=="esperando acceso" for o in state["supply"].get("portOrders",[]) if o.get("portId")==p.get("id",f"port-{p['x']}-{p['y']}"))} for p in state["buildings"] if p.get("kind")=="port"]
    commute=commute_model()
    view["traffic"]={k:commute[k] for k in ("commuters","walkingCommuters","autoCommuters","vehicles","dailyEmissionsKg","workersWithoutRoadAccess","meanDistance","meanMinutes","effectiveEmployment","effectiveWorkers","staffedJobs","privateStaffedJobs","shoppingTrips","shoppingPassengers","shoppingVehicles","shoppingEmissionsKg","serviceTrips","serviceVisitors","serviceVehicles","serviceEmissionsKg","dailyTrips")}
    for key in ("returnCommuters","returnBusCommuters","returnAutoCommuters","returnWalkingCommuters","returnTransferCommuters","returnMeanMinutes","returnVehicles"):view["traffic"][key]=commute.get(key,0)
    view["traffic"]["busCommuters"]=commute.get("busCommuters",0)
    view["traffic"]["transferCommuters"]=commute.get("transferCommuters",0)
    view["traffic"]["carAccessWorkers"]=commute.get("carAccessWorkers",0)
    view["commutes"]=commute["routes"]
    view["busRouteCatalog"]=bus_route_catalog(commute)
    view["busRoutes"]=state.get("busRoutes",[])
    view["busGarages"]=[{"id":f"garage-{g['x']}-{g['y']}","x":g["x"],"y":g["y"],"name":g.get("name","Cochera municipal"),"capacity":g.get("busBayCapacity",4),"occupied":sum(a["buses"] for line in state["busRoutes"] for a in line.get("garageAssignments",[]) if a["garageId"]==f"garage-{g['x']}-{g['y']}")} for g in state["buildings"] if g.get("kind")=="busGarage" and g.get("status") in ("habilitado","operativo")]
    view["jobs"]=state["jobs"]+sum(line.get("buses",0)*2 for line in state["busRoutes"] if line.get("status")=="active")
    view["busStopSites"]={line["id"]:bus_stop_sites(line) for line in state.get("busRoutes",[]) if line.get("status") in ("active","paused")}
    view["workplaces"]=commute["workplaces"]
    view["laborMarket"]=commute["laborMarket"]
    view["trainingCatalog"]=training_catalog()
    view["healthReport"]=health_service_report(commute["workplaces"]);view["educationReport"]=education_service_report(commute["workplaces"]);view["fireReport"]=fire_service_report(commute["workplaces"]);view["policeReport"]=police_service_report(commute["workplaces"])
    bank=state["finance"]["businessBank"]
    view["finance"]["businessBank"].update({"openLoans":sum(b.get("business",{}).get("creditDebt",0) for b in state["buildings"] if b.get("kind")=="shop" and b.get("business",{}).get("status")=="abierto"),"borrowers":sum(1 for b in state["buildings"] if b.get("kind")=="shop" and b.get("business",{}).get("status")=="abierto" and b.get("business",{}).get("creditDebt",0)>0)})
    view["householdWageIncome"]=sum(h.get("monthlyWageIncome",0) for h in state["buildings"] if h.get("kind")=="home")
    view["publicPayroll"]=sum(w.get("payroll",0) for w in commute["workplaces"] if w["kind"] in ("civic","school","fireStation","depot","landfill","recyclingPlant","port","airport","powerPlant","waterPlant","wastewaterPlant"))
    transit_cost=sum(line.get("monthlyOperatingCost",0) for line in state.get("busRoutes",[]) if line.get("operational"))
    transit_income=sum(line.get("monthlyFareRevenue",0) for line in state.get("busRoutes",[]) if line.get("operational"))
    view["effectiveMonthlyExpenses"]=round(state["monthlyExpenses"]+view["publicPayroll"]+transit_cost+state.get("utilities",{}).get("report",{}).get("monthlyMaintenance",0)+state.get("waste",{}).get("report",{}).get("monthlyOperatingCost",0)+road_maintenance_report().get("monthlyRequired",0)+view["healthReport"].get("monthlySupplyCost",0)+view["healthReport"].get("hospital",{}).get("monthlyOperatingCost",0)+view["policeReport"].get("monthlyOperatingCost",0)+view["educationReport"].get("monthlySuppliesCost",0))
    view["transitMonthlyIncome"]=transit_income
    view["recyclingIncome"]=state.get("waste",{}).get("report",{}).get("recyclingRevenueMonth",0)
    view["transitMonthlyCost"]=transit_cost
    business_income=round(commute["privateStaffedJobs"]*2)
    tourism_tax=sum(b.get("business",{}).get("lastTourismTax",0) for b in state["buildings"] if b.get("kind")=="hotel")
    gross=round(state["monthlyIncome"]+business_income+transit_income+state.get("airportMonthlyIncome",0)+tourism_tax+view["recyclingIncome"]+state.get("taxes",{}).get("lastReport",{}).get("collected",0))
    view["municipalFinance"]=municipal_finance_report(gross,view["effectiveMonthlyExpenses"])
    view["taxReport"]=state.get("taxes",{}).get("lastReport",{})
    return {**view,"businessIncome":business_income,"grossMonthlyIncome":gross,"online":online,"isHost":player_id is not None and player_id==state.get("host"),"contractors":CONTRACTORS,"suppliers":SUPPLIERS,"materialPrices":MATERIAL_PRICE,"reserved":round(reserved),"available":max(0,round(state["money"]-reserved))}

def discovery_loop():
    """Anuncia y descubre salas en la subred; no usa servicios externos."""
    sock=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
    try:
        sock.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
        sock.setsockopt(socket.SOL_SOCKET,socket.SO_BROADCAST,1)
        sock.bind(("0.0.0.0",DISCOVERY_PORT));sock.settimeout(1)
        last=0
        while True:
            now=time.time()
            if ROOM_OPEN and now-last>=3:
                packet=json.dumps({"tag":"CiudadVivaLAN","name":state.get("name","Ciudad Viva"),"code":ROOM_CODE,"port":PORT}).encode()
                try:sock.sendto(packet,("255.255.255.255",DISCOVERY_PORT))
                except OSError:pass
                last=now
            try:data,address=sock.recvfrom(512)
            except socket.timeout:continue
            except OSError:continue
            try:room=json.loads(data)
            except (ValueError,UnicodeDecodeError):continue
            if room.get("tag")!="CiudadVivaLAN" or address[0] in local_ips():continue
            with LOCK:DISCOVERED_ROOMS[(address[0],room.get("port"))]={"name":str(room.get("name","Ciudad Viva"))[:40],"code":str(room.get("code",""))[:8],"address":f"http://{address[0]}:{room.get('port')}/","seen":now}
    finally:sock.close()

class Handler(BaseHTTPRequestHandler):
    server_version="CiudadViva/0.88"
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
                if not ROOM_OPEN:self._send(409,{"error":"La sala todavía no fue creada por el anfitrión."});return
                state["players"][pid]=time.time()
                for key,last in list(state["players"].items()):
                    if last<time.time()-25: del state["players"][key]
                self._send(200,public_state(pid))
            return
        if path=="/api/info": self._send(200,{"ips":local_ips(),"port":PORT,"roomOpen":ROOM_OPEN,"roomCode":ROOM_CODE if ROOM_OPEN else None}); return
        if path=="/api/rooms":
            with LOCK:
                now=time.time();rooms=[{"name":state.get("name","Ciudad Viva"),"code":ROOM_CODE,"address":f"http://{ip}:{PORT}/","host":True} for ip in local_ips()[:1]] if ROOM_OPEN else []
                rooms += [{**{k:v for k,v in r.items() if k!="seen"},"host":False} for r in DISCOVERED_ROOMS.values() if now-r["seen"]<12]
            self._send(200,{"rooms":rooms});return
        rel="index.html" if path=="/" else path.lstrip("/")
        if rel not in ("index.html","style.css","design.css","reference.css","reference-ui.js","game.js","offline.js","offline_seed.json","release_notes.json","world3d.js","favicon.svg","vendor/three.module.js","vendor/three.core.js"):
            self._send(404,{"error":"No encontrado"}); return
        file=(ROOT/rel).resolve()
        if ROOT not in file.parents and file!=ROOT: self._send(403,{"error":"Ruta inválida"}); return
        if not file.is_file(): self._send(404,{"error":"No encontrado"}); return
        typ="text/html; charset=utf-8" if file.suffix==".html" else "text/css; charset=utf-8" if file.suffix==".css" else "application/javascript; charset=utf-8" if file.suffix==".js" else "application/json; charset=utf-8" if file.suffix==".json" else "image/svg+xml" if file.suffix==".svg" else "application/octet-stream"
        self._send(200,file.read_bytes(),typ)
    def do_POST(self):
        global state
        try: data=json.loads(self.rfile.read(int(self.headers.get("Content-Length","0"))) or b"{}")
        except Exception: self._send(400,{"error":"JSON inválido"}); return
        path=self.path.split("?",1)[0]
        pid=self.headers.get("X-Player-Id","jugador-local")
        with LOCK:
            global ROOM_OPEN
            if path=="/api/room/create":
                if self.client_address[0] not in ("127.0.0.1","::1"):
                    self._send(403,{"error":"La sala solo puede crearla el anfitrión desde su equipo."});return
                if ROOM_OPEN and state.get("host")!=pid:
                    self._send(409,{"error":"Ya hay una sala creada en este equipo."});return
                ROOM_OPEN=True;state["host"]=pid;state["players"][pid]=time.time()
                self._send(200,{"roomCode":ROOM_CODE,"address":f"http://{local_ips()[0]}:{PORT}/"});return
            if path=="/api/room/join":
                if not ROOM_OPEN:self._send(409,{"error":"El anfitrión todavía no creó la sala."});return
                if data.get("code") and str(data["code"]).upper()!=ROOM_CODE:
                    self._send(403,{"error":"Código de sala incorrecto."});return
                state["players"][pid]=time.time();self._send(200,public_state(pid));return
            if path=="/api/action":
                if not ROOM_OPEN:self._send(409,{"error":"La sala no está abierta."});return
                action=data.get("action")
                ensure_government_state()
                if state["government"].get("status") in ("derrotado","destituido") and action not in ("new",):
                    self._send(409,{"error":"El equipo dejó el gobierno. La partida quedó en modo observación; podés guardar la ciudad o iniciar una nueva."});return
                if action in POLICE_COSTS or action=="setPolicePriority":
                    try:invest_police_unit(action,int(data.get("x",-1)),int(data.get("y",-1)),data.get("priority"))
                    except (ValueError,TypeError) as error:self._send(409,{"error":str(error)});return
                    self._send(200,public_state(pid));return
                if action in HOSPITAL_COSTS:
                    try:invest_hospital_care(action,int(data.get("x",-1)),int(data.get("y",-1)))
                    except (ValueError,TypeError) as error:self._send(409,{"error":str(error)});return
                    self._send(200,public_state(pid));return
                if action=="scheduleTourismEvent":
                    try:schedule_tourism_event(data.get("kind"))
                    except ValueError as error:self._send(409,{"error":str(error)});return
                    self._send(200,public_state(pid));return
                if action=="renegotiateTradeContract":
                    try:renegotiate_aggregate_forward_contract(data.get("id"))
                    except ValueError as error:self._send(409,{"error":str(error)});return
                    self._send(200,public_state(pid));return
                if action=="repairContractGuarantee":
                    guarantee=next((g for g in state.get("contractGuarantees",[]) if g.get("id")==str(data.get("id")) and g.get("status")=="reclamo"),None)
                    if not guarantee:self._send(409,{"error":"La garantía no tiene un reclamo reparable."});return
                    if not contractor_has_capacity(guarantee["contractor"]) or contractor_free_workers(guarantee["contractor"])<3:self._send(409,{"error":"La constructora no tiene cupo y tres trabajadores libres para reparar. La retención continúa bloqueada."});return
                    guarantee.update({"status":"reparacion","repairStartedDay":state["day"],"repairCompleteDay":state["day"]+5,"workersAssigned":3})
                    ev("Reparación contractual iniciada",f"{guarantee['contractor']} movilizó tres trabajadores por cinco días para corregir {guarantee['label']}; la retención sigue bloqueada.")
                    self._send(200,public_state(pid));return
                elif action in ("approveContractChange","rejectContractChange"):
                    project=next((p for p in state.get("projects",[]) if p.get("id")==str(data.get("id"))),None);change=project.get("changeOrder") if project else None
                    if not project or project.get("status")!="cambio_pendiente" or not change or change.get("status")!="pendiente":self._send(409,{"error":"La orden de cambio ya se resolvió o la obra no está esperando decisión."});return
                    if action=="approveContractChange":
                        reserved=sum(max(0,int(p.get("cost",0)-p.get("paid",0))) for p in state.get("projects",[]) if not p.get("privatePaid"));available=max(0,int(state.get("money",0))-reserved)
                        if available<int(change["costDelta"]):self._send(409,{"error":f"Faltan fondos libres: la tesorería dispone de $ {available:,} y la ampliación exige comprometer $ {change['costDelta']:,}.".replace(",",".")});return
                        baseline=max(0,float(project.get("progress",0)));elapsed=int(project.get("elapsed",0));remaining=max(1,int(project.get("duration",1))-elapsed+int(change["delayDays"]))
                        project.update({"scheduleBaseProgress":baseline,"scheduleBaseElapsed":elapsed,"scheduleRemainingDays":remaining,"duration":elapsed+remaining,"cost":int(project["cost"])+int(change["costDelta"])})
                        change.update({"status":"aprobada","decidedDay":state["day"]});detail=f"Se comprometieron $ {change['costDelta']:,} y {change['delayDays']} días adicionales".replace(",",".")
                    else:
                        project["qualityPenalty"]=int(project.get("qualityPenalty",0))+int(change.get("qualityPenalty",12));change.update({"status":"rechazada","decidedDay":state["day"]});detail=f"Se mantiene el contrato original; la inspección final tendrá {project['qualityPenalty']} puntos menos de calidad por el trabajo sin refuerzo."
                    project["status"]="contratada";state.setdefault("contractChangeHistory",[]).append({"projectId":project["id"],"label":project.get("label"),"contractor":project.get("contractor"),**change});state["contractChangeHistory"]=state["contractChangeHistory"][-40:]
                    ev("Orden de cambio " + change["status"],f"{project.get('label','La obra')}: {change['cause']}. {detail}.")
                    self._send(200,public_state(pid));return
                elif action=="assignMunicipalRole":
                    role=str(data.get("role",""));target=str(data.get("playerId",""))
                    if role not in MUNICIPAL_ROLES:
                        self._send(400,{"error":"Elegí una cartera municipal válida."});return
                    if target and target not in state.get("players",{}):
                        self._send(409,{"error":"Ese jugador ya no está conectado. Pedile que vuelva a entrar e intentá otra vez."});return
                    if target and state["players"].get(target,0)<time.time()-25:
                        self._send(409,{"error":"Elegí a un integrante conectado para coordinar esta área."});return
                    responsibilities=state["government"].setdefault("responsibilities",{})
                    for area,owner in list(responsibilities.items()):
                        if area==role or (target and owner==target):responsibilities.pop(area,None)
                    if target:responsibilities[role]=target
                    assigned=next((item for item in municipal_team_report(pid)["members"] if item["id"]==target),None)
                    label=MUNICIPAL_ROLES[role]["label"]
                    ev("Referente municipal actualizado",f"{label}: {assigned['label'] if assigned else 'decisiones compartidas'}. El equipo comparte todas las decisiones.")
                    self._send(200,public_state(pid));return
                if action=="recordGovernmentAgreement":
                    try:record_government_agreement(data.get("complaintId"),pid)
                    except ValueError as error:self._send(409,{"error":str(error)});return
                    self._send(200,public_state(pid));return
                if action=="setInvestmentDelegation":
                    book=state.setdefault("privateInvestments",{"proposal":None,"history":[],"nextOfferDay":state.get("day",1)})
                    enabled=bool(data.get("enabled"));cap=data.get("maxPermit",500)
                    try:cap=max(0,min(1500,int(cap)))
                    except (TypeError,ValueError):self._send(400,{"error":"Tope de permiso inválido."});return
                    book["delegation"]={"enabled":enabled,"maxPermit":cap};ev("Política de inversión actualizada",("Delegación automática hasta permiso $ %s."%cap).replace(",","." ) if enabled else "Las nuevas propuestas requieren aprobación manual.");self._send(200,public_state(pid));return
                if action=="declinePrivateInvestment":
                    book=state.setdefault("privateInvestments",{"proposal":None,"history":[],"nextOfferDay":state.get("day",1)})
                    offer=book.get("proposal")
                    if not offer or offer.get("status")!="disponible" or offer.get("id")!=str(data.get("investmentId")):
                        self._send(409,{"error":"La propuesta de inversión ya no está disponible."});return
                    offer["status"]="rechazada";offer["decisionDay"]=state["day"];book.setdefault("history",[]).append(dict(offer));book["history"]=book["history"][-24:];book["proposal"]=None;book["nextOfferDay"]=state["day"]+90;book["reason"]="El municipio rechazó la última propuesta; nuevos inversores evaluarán la demanda más adelante.";ev("Inversión privada rechazada",f"Se descartó la propuesta de comercio en parcela {offer['x']+1},{offer['y']+1}; la ciudad no gastó fondos ni ocupó el terreno.");self._send(200,public_state(pid));return
                if action=="startAdaptiveReuse":
                    ensure_supply_state();x=int(data.get("x",-1));y=int(data.get("y",-1));contractor=str(data.get("contractor",""))
                    building=next((b for b in state.get("buildings",[]) if b.get("x")==x and b.get("y")==y),None)
                    if not building or building.get("kind")!="shop" or building.get("business",{}).get("status")!="cerrado":self._send(409,{"error":"Solo se pueden reconvertir locales comerciales cerrados."});return
                    firm=building.get("business",{});arrears=state.get("taxes",{}).get("arrearsByAsset",{}).get(firm.get("id",f"shop-{x}-{y}"),0)
                    if building.get("heritageEligible"):self._send(409,{"error":"El inmueble catalogado debe conservar su uso patrimonial."});return
                    if firm.get("creditDebt",0)>0 or arrears>0:self._send(409,{"error":"El inmueble mantiene deuda empresarial o tributaria pendiente."});return
                    if any(w.get("x")==x and w.get("y")==y for w in state.get("adaptiveReuseWorks",[])):self._send(409,{"error":"La reconversión ya está en marcha."});return
                    if contractor not in CONTRACTORS:self._send(409,{"error":"Seleccioná una constructora habilitada."});return
                    spec=CONTRACTORS[contractor];active=[p for p in state.get("projects",[]) if p.get("contractor")==contractor and p.get("status") not in ("pausada","cancelada")];heritage=[w for w in state.get("heritageWorks",[]) if w.get("contractor")==contractor];reuse=[w for w in state.get("adaptiveReuseWorks",[]) if w.get("contractor")==contractor];used=sum(p.get("workersAssigned",LABOR_NEEDS.get(p.get("kind"),4)) for p in active)+sum(w.get("workers",4) for w in heritage+reuse)
                    if len(active)+len(heritage)+len(reuse)>=spec["capacity"] or used+4>spec["workers"]:self._send(409,{"error":f"{contractor} no tiene una cuadrilla libre de cuatro trabajadores."});return
                    investment=4200;permit=200
                    if state.get("privateCapital",0)<investment:self._send(409,{"error":f"El proyecto privado requiere $ {investment:,} de capital disponible.".replace(",",".")});return
                    state["privateCapital"]-=investment;state["money"]+=permit;state["supply"]["contractorCash"][contractor]+=investment;duration=max(20,round(24*spec["days"]/30));work={"id":f"reuse-{x}-{y}-{state['day']}","x":x,"y":y,"name":building.get("name","Local cerrado"),"contractor":contractor,"investment":investment,"permitFee":permit,"workers":4,"durationDays":duration,"elapsedDays":0,"progress":0,"stage":"Desmontaje y diagnóstico","rent":24,"quality":round(spec["quality"]*100),"startDay":state["day"],"status":"en obra"};state.setdefault("adaptiveReuseWorks",[]).append(work);ev("Permiso de reconversión aprobado",f"{work['name']} pasa de local cerrado a vivienda: inversión privada $ {investment:,}, permiso municipal $ {permit}, cuatro trabajadores y {duration} días. Se requiere inspección de agua, saneamiento y seguridad.".replace(",","."));self._send(200,public_state(pid));return
                if action=="heritageProtect":
                    ensure_heritage_state()
                    x=int(data.get("x",-1));y=int(data.get("y",-1));level=str(data.get("level",""));building=next((b for b in state.get("buildings",[]) if b.get("x")==x and b.get("y")==y and b.get("heritageEligible")),None)
                    if not building or level not in ("protección parcial","protección integral"):self._send(409,{"error":"Elegí un inmueble histórico y un nivel de protección válido."});return
                    if building.get("heritageLevel")=="protección integral":self._send(409,{"error":"El inmueble ya tiene protección integral."});return
                    building["heritageLevel"]=level;building["protectedDay"]=state.get("day",1);ev("Inmueble histórico protegido",f"{building.get('name')}: {level}. Se conserva su uso y se habilita una rehabilitación patrimonial financiada.")
                    self._send(200,public_state(pid));return
                if action=="startUrbanRenewal":
                    try:start_urban_renewal(data.get("needId"),str(data.get("contractor","")))
                    except ValueError as error:self._send(409,{"error":str(error)});return
                    self._send(200,public_state(pid));return
                if action=="heritageRestore":
                    ensure_supply_state()
                    x=int(data.get("x",-1));y=int(data.get("y",-1));contractor=str(data.get("contractor",""));building=next((b for b in state.get("buildings",[]) if b.get("x")==x and b.get("y")==y and b.get("heritageEligible") and b.get("heritageLevel") in ("protección parcial","protección integral")),None)
                    if not building:self._send(409,{"error":"Primero inventariá y protegé el inmueble histórico."});return
                    if building.get("conservation",100)>=94:self._send(409,{"error":"La conservación está en buen estado; no necesita esta rehabilitación."});return
                    if contractor not in CONTRACTORS:self._send(409,{"error":"Seleccioná una constructora habilitada."});return
                    supply=state.setdefault("supply",new_supply());busy=[p for p in state.get("projects",[]) if p.get("contractor")==contractor and p.get("status") not in ("pausada","cancelada")]
                    works=[w for w in state.get("heritageWorks",[]) if w.get("contractor")==contractor]
                    used=sum(p.get("workersAssigned",LABOR_NEEDS.get(p.get("kind"),4)) for p in busy)+sum(w.get("workers",4) for w in works);spec=CONTRACTORS[contractor]
                    if len(busy)+len(works)>=spec["capacity"] or used+4>spec["workers"]:self._send(409,{"error":f"{contractor} no tiene una cuadrilla libre de cuatro trabajadores."});return
                    supplier_name=None
                    for candidate in sorted(SUPPLIERS,key=lambda name:(SUPPLIERS[name]["price"],SUPPLIERS[name]["days"])):
                        stock=supply.setdefault("suppliers",{}).setdefault(candidate,SUPPLIER_STOCK[candidate].copy())
                        if all(stock.get(k,0)>=v for k,v in HERITAGE_MATERIALS.items()):supplier_name=candidate;break
                    if not supplier_name:self._send(409,{"error":"Los proveedores no tienen el lote de refuerzo y terminaciones. Esperá la reposición regional."});return
                    stock=supply["suppliers"][supplier_name];materials_cost=round(sum(HERITAGE_MATERIALS[k]*MATERIAL_PRICE[k] for k in HERITAGE_MATERIALS)*SUPPLIERS[supplier_name]["price"])
                    labor_cost=round((2200+max(0,100-building.get("conservation",92))*24)*spec["price"]);cost=materials_cost+labor_cost
                    reserved=sum(max(0,p.get("cost",0)-p.get("paid",0)) for p in state.get("projects",[]) if not p.get("privatePaid"));available=max(0,int(state.get("money",0))-reserved)
                    if available<cost:self._send(409,{"error":f"Quedan $ {available:,} libres; restaurar {building.get('name')} cuesta $ {cost:,}.".replace(",",".")});return
                    for key,amount in HERITAGE_MATERIALS.items():
                        stock[key]-=amount
                        settle_local_material_sale(supplier_name,{key:amount})
                    state["money"]-=cost;supply.setdefault("contractorCash",CONTRACTOR_CASH.copy())[contractor]=supply.setdefault("contractorCash",CONTRACTOR_CASH.copy()).get(contractor,0)+labor_cost
                    lead=SUPPLIERS[supplier_name]["days"];days=max(15,round(24*spec["days"]/30));work={"id":f"heritage-{x}-{y}-{state['day']}","x":x,"y":y,"name":building.get("name"),"contractor":contractor,"supplier":supplier_name,"materials":dict(HERITAGE_MATERIALS),"materialCost":materials_cost,"laborCost":labor_cost,"cost":cost,"workers":4,"deliveryDay":state["day"]+lead,"deliveryDays":lead,"durationDays":days,"elapsedDays":0,"progress":0,"stage":"Esperando materiales","startDay":state["day"],"status":"en obra"}
                    state.setdefault("heritageWorks",[]).append(work);ev("Rehabilitación patrimonial contratada",f"{building.get('name')}: cuatro trabajadores, materiales {supplier_name} (llegan en {lead} días) y {days} días de obra. Inversión $ {cost:,}.".replace(",","."))
                    self._send(200,public_state(pid));return
                if action=="adjustTax":
                    taxes=ensure_tax_state();kind=str(data.get("kind",""));delta=int(data.get("delta",0))
                    if kind=="property":key="propertyRateBp";low,high,step=20,140,10
                    elif kind=="business":key="businessRateBp";low,high,step=0,500,25
                    else:self._send(409,{"error":"Tipo de impuesto no reconocido."});return
                    if delta not in (-step,step):self._send(409,{"error":"Cambio de alícuota inválido."});return
                    old=taxes.get(key,60 if kind=="property" else 200);new=max(low,min(high,old+delta))
                    if new==old:self._send(409,{"error":"La alícuota ya está en su límite."});return
                    taxes[key]=new;ev("Política tributaria ajustada",f"Impuesto {'inmobiliario anual' if kind=='property' else 'a ventas comerciales'}: {old/100:.2f}% → {new/100:.2f}%. El cobro real y la mora se actualizarán al cierre mensual.")
                    self._send(200,public_state(pid));return
                if action=="municipalDebtReserve":
                    ensure_finance_state();finance=state["finance"];direction=str(data.get("direction",""));amount=int(data.get("amount",0))
                    if direction not in ("deposit","withdraw") or amount not in (500,1000,2500):self._send(409,{"error":"Elegí un movimiento válido de $500, $1.000 o $2.500."});return
                    reserve=max(0,int(finance.get("debtReserve",0)))
                    if direction=="deposit":
                        reserved=sum(max(0,p.get("cost",0)-p.get("paid",0)) for p in state.get("projects",[]) if not p.get("privatePaid"));free=max(0,int(state.get("money",0))-reserved)
                        if free<amount:self._send(409,{"error":f"Quedan $ {free:,} libres después de compromisos; no alcanza para apartar $ {amount:,}.".replace(",",".")});return
                        state["money"]-=amount;finance["debtReserve"]=reserve+amount;label="apartados para deuda"
                    else:
                        if reserve<amount:self._send(409,{"error":f"El fondo de deuda solo tiene $ {reserve:,}.".replace(",",".")});return
                        finance["debtReserve"]=reserve-amount;state["money"]+=amount;label="devueltos a caja"
                    finance.setdefault("debtReserveHistory",[]).append({"day":state.get("day",1),"amount":amount if direction=="deposit" else -amount,"reason":"Aporte al fondo de deuda" if direction=="deposit" else "Retiro del fondo de deuda"});del finance["debtReserveHistory"][:-24]
                    ev("Fondo de deuda actualizado",f"$ {amount:,} {label}. Fondo protegido: $ {finance['debtReserve']:,}.".replace(",","."));self._send(200,public_state(pid));return
                if action=="adjustRoadMaintenance":
                    delta=int(data.get("delta",0));old=max(0,min(200,int(state.get("roadMaintenancePct",100))));new=max(0,min(200,old+delta))
                    if delta not in (-25,25) or new==old:self._send(409,{"error":"El plan cambia en pasos de 25%, entre 0% y 200%."});return
                    state["roadMaintenancePct"]=new;ev("Plan municipal de mantenimiento actualizado",f"Mantenimiento preventivo de calles y edificios públicos: {new}% de la necesidad mensual estimada. El presupuesto de redes determina cuánto trabajo se ejecuta y la condición cambia por uso.")
                    self._send(200,public_state(pid));return
                if action=="adjustProgramBudget":
                    ensure_finance_state();budgets=state["finance"]["programBudgets"];program=str(data.get("program",""));delta=int(data.get("delta",0))
                    keys={"services":"servicesPct","mobility":"mobilityPct","networks":"networksPct"}
                    if program not in keys or delta not in (-10,10):self._send(409,{"error":"Programa o ajuste de presupuesto inválido."});return
                    key=keys[program];old=int(budgets.get(key,100));new=max(0,min(200,old+delta))
                    if new==old:self._send(409,{"error":"El presupuesto ya está en su límite."});return
                    budgets[key]=new;label={"services":"servicios públicos","mobility":"transporte","networks":"redes y residuos"}[program]
                    ev("Presupuesto municipal actualizado",f"Asignación mensual de {label}: {new}% del costo vigente. Se liquida al próximo cierre; lo que no alcance queda como obligación del programa.")
                    self._send(200,public_state(pid));return
                if action=="municipalLoan":
                    ensure_finance_state();amount=int(data.get("amount",0));term=int(data.get("termMonths",48));report=municipal_finance_report()
                    if amount not in (5000,10000,20000) or term not in (24,48):self._send(409,{"error":"Elegí un monto y plazo disponibles."});return
                    if amount>report["creditLimit"]:self._send(409,{"error":f"El límite de solvencia actual es $ {report['creditLimit']:,}.".replace(",",".")});return
                    rate=.01;monthly=amount*rate*(1+rate)**term/((1+rate)**term-1);gross=max(1,report["monthlyIncome"]);existing=report["monthlyDebtService"]
                    if monthly+existing>gross*.35:self._send(409,{"error":"La cuota superaría el 35% de los ingresos mensuales de referencia."});return
                    loan={"id":f"mun-{uuid.uuid4().hex[:10]}","label":"Crédito de inversión municipal","principal":amount,"balance":amount,"annualRate":.12,"monthlyRate":rate,"termMonths":term,"monthsRemaining":term,"payment":round(monthly),"createdDay":state["day"],"status":"active","delinquentMonths":0,"totalScheduled":round(monthly*term)}
                    state["finance"]["municipalLoans"].append(loan);state["money"]+=amount;ev("Crédito municipal contratado",f"Ingresaron $ {amount:,} a caja. Cuota fija $ {loan['payment']:,}/mes durante {term} meses; costo total estimado $ {loan['totalScheduled']:,}.".replace(",","."));self._send(200,public_state(pid));return
                if action=="speed": state["speed"]=max(1,min(4,int(data.get("value",1))))
                elif action=="pause": state["paused"]=not state["paused"]
                elif action=="startBusRoute":
                    catalog={x["id"]:x for x in bus_route_catalog()};offer=catalog.get(str(data.get("routeId","")))
                    buses=max(1,min(3,int(data.get("buses",1))))
                    if not offer:self._send(409,{"error":"El corredor laboral ya no está disponible."});return
                    if any(x.get("from")==offer["from"] and x.get("to")==offer["to"] and x.get("status")!="cancelled" for x in state.setdefault("busRoutes",[])):
                        self._send(409,{"error":"Ya existe una línea para ese corredor."});return
                    cost=buses*BUS_PURCHASE_COST;reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"));available=max(0,state["money"]-reserved)
                    if available<cost:self._send(409,{"error":f"La flota cuesta $ {cost:,} y quedan $ {available:,} después de contratos.".replace(",",".")});return
                    line={"id":uuid.uuid4().hex,"from":offer["from"],"to":offer["to"],"route":offer["route"],"stops":offer["stops"],"originName":offer["originName"],"destinationName":offer["destinationName"],"buses":buses,"capacity":buses*BUS_SEATS,"headwayMinutes":max(6,math.ceil((offer["distance"]*3.6)/buses)),"fare":BUS_FARE,"status":"active","operational":True,"dailyRiders":0,"monthlyFareRevenue":0,"monthlyOperatingCost":buses*BUS_MONTHLY_OPERATING_COST,"purchaseCost":cost,"createdDay":state["day"]}
                    state["money"]-=cost;state["busRoutes"].append(line);ev("Línea de autobús inaugurada",f"{line['originName']} – {line['destinationName']} · {buses} colectivo(s) · {len(line['stops'])} paradas · frecuencia cada {line['headwayMinutes']} min · inversión $ {cost:,}. Operación $ {line['monthlyOperatingCost']:,}/mes.".replace(",","."))
                elif action in ("pauseBusRoute","resumeBusRoute","cancelBusRoute"):
                    line=next((b for b in state.setdefault("busRoutes",[]) if b.get("id")==str(data.get("id"))),None)
                    if not line:self._send(404,{"error":"La línea ya no existe."});return
                    if action=="pauseBusRoute":line.update({"status":"paused","operational":False,"pauseReason":"Pausa decidida por el gobierno"});ev("Línea de autobús pausada",f"{line['originName']} – {line['destinationName']}: se detienen servicio y gasto operativo.")
                    elif action=="resumeBusRoute":
                        path=route_between(tuple(line["from"]),tuple(line["to"]))
                        if not path:self._send(409,{"error":"El corredor todavía no tiene conexión vial."});return
                        line.update({"route":path,"status":"active","operational":True,"pauseReason":None});ev("Línea de autobús reanudada",f"{line['originName']} – {line['destinationName']} vuelve a operar con {line['buses']} colectivo(s).")
                    else:
                        refund=round(line.get("purchaseCost",line["buses"]*BUS_PURCHASE_COST)*.5);state["money"]+=refund;line.update({"status":"cancelled","operational":False,"cancelledDay":state["day"]});ev("Línea de autobús retirada",f"Se retiró {line['originName']} – {line['destinationName']}; se recuperaron $ {refund:,} por los vehículos.".replace(",","."))
                elif action=="startTrainingProgram":
                    category=str(data.get("category",""))
                    if category not in TRAINING_CATEGORIES:self._send(400,{"error":"Perfil de formación inválido."});return
                    ensure_resident_roster();catalog={x["category"]:x for x in training_catalog()};offer=catalog[category]
                    if not offer["canStart"]:self._send(409,{"error":offer["reason"] or "El programa no está disponible."});return
                    center=next((b for b in state["buildings"] if b.get("id",f"civic-{b['x']}-{b['y']}")==offer["centerId"]),None)
                    programs=state.setdefault("trainingPrograms",[]);excluded={person_id for p in programs if p.get("status") in ("active","paused") for person_id in p.get("traineeIds",[])}
                    candidates=training_candidates(category,center,excluded);cohort=candidates[:TRAINING_SEATS]
                    if not cohort:self._send(409,{"error":"No hay residentes con esa necesidad de formación y acceso al aula."});return
                    monthly=TRAINING_BASE_MONTHLY_COST+TRAINING_COST_PER_STUDENT*len(cohort);total=monthly*TRAINING_MONTHS
                    reserved=sum(max(0,pending["cost"]-pending.get("paid",0)) for pending in state["projects"] if not pending.get("privatePaid"));available=max(0,state["money"]-reserved)
                    if available<total:self._send(409,{"error":f"El curso cuesta $ {total:,} y quedan $ {available:,} disponibles después de los contratos.".replace(",",".")});return
                    trainee_ids=[row["person"].get("id") for row in cohort];label=TRAINING_CATEGORIES[category][0]
                    program={"id":uuid.uuid4().hex,"category":category,"label":label,"centerId":offer["centerId"],"centerName":offer["centerName"],"status":"active","createdDay":state["day"],"durationMonths":TRAINING_MONTHS,"monthsCompleted":0,"seats":len(cohort),"traineeIds":trainee_ids,"traineeProgress":{row["person"]["id"]:row["skill"] for row in cohort},"skillGainPerMonth":TRAINING_SKILL_GAIN,"monthlyCost":monthly,"cost":total,"paid":total,"spent":0,"remainingBudget":total}
                    state["money"]-=total;programs.append(program);del programs[:-30]
                    ev("Programa de formación adjudicado",f"Aula municipal · {label} · {len(cohort)} participantes · {TRAINING_MONTHS} ciclos · $ {total:,} prepagados. La formación empieza en el próximo cierre mensual.".replace(",","."))
                elif action in ("pauseTrainingProgram","resumeTrainingProgram","cancelTrainingProgram"):
                    program=next((p for p in state.setdefault("trainingPrograms",[]) if p.get("id")==str(data.get("id"))),None)
                    if not program:self._send(404,{"error":"El curso ya no está disponible."});return
                    if action=="pauseTrainingProgram":
                        if program.get("status")!="active":self._send(409,{"error":"Solo se puede pausar un curso en marcha."});return
                        program.update({"status":"paused","pauseReason":"Pausa decidida por el gobierno"});ev("Curso pausado",f"{program['label']}: el saldo de $ {program.get('remainingBudget',0):,} queda reservado.".replace(",","."))
                    elif action=="resumeTrainingProgram":
                        if program.get("status")!="paused":self._send(409,{"error":"El curso no está pausado."});return
                        center=next((b for b in state["buildings"] if b.get("id",f"civic-{b['x']}-{b['y']}")==program.get("centerId") and b.get("kind")=="civic"),None)
                        homes={p.get("id"):home for home in state["buildings"] if home.get("kind")=="home" for p in home.get("residents",[])}
                        if not center or not any((home:=homes.get(person_id)) and route_between((home["x"],home["y"]),(center["x"],center["y"])) for person_id in program.get("traineeIds",[])):
                            self._send(409,{"error":"La cohorte todavía no tiene acceso vial al aula."});return
                        program.update({"status":"active","pauseReason":None});ev("Curso reanudado",f"{program['label']} retomará la formación en el próximo cierre mensual.")
                    else:
                        refund=max(0,program.get("remainingBudget",0));state["money"]+=refund;program.update({"status":"cancelled","remainingBudget":0,"cancelledDay":state["day"]});ev("Curso cancelado",f"{program['label']}: se devolvieron $ {refund:,} de presupuesto no utilizado.".replace(",","."))
                elif action=="place":
                    kind=data.get("kind"); x=int(data.get("x",-1)); y=int(data.get("y",-1)); contractor=data.get("contractor")
                    if kind not in PROJECTS or x<0 or y<0 or x>=28 or y>=20: self._send(400,{"error":"Proyecto o parcela inválidos"}); return
                    investment_id=str(data.get("investmentId", ""));investment_book=state.setdefault("privateInvestments",{"proposal":None,"history":[],"nextOfferDay":state.get("day",1)});investment_offer=investment_book.get("proposal")
                    if investment_id and (not investment_offer or investment_offer.get("status")!="disponible" or investment_offer.get("id")!=investment_id or investment_offer.get("x")!=x or investment_offer.get("y")!=y or contractor!=investment_offer.get("contractor") or kind!="shop" or state["day"]>investment_offer.get("expiresDay",0)):
                        self._send(409,{"error":"La oportunidad privada cambió o venció. Revisá la propuesta actual."});return
                    if is_water(x,y) and not (kind=="port" and x==23 and not is_water(x,y) and is_water(x+1,y)): self._send(409,{"error":"La terminal debe ocupar la franja costera edificable, junto al agua."}); return
                    if kind=="port" and (x!=23 or not is_water(x+1,y)): self._send(409,{"error":"La terminal portuaria debe ubicarse en la costa este (parcela 24) con agua al lado."}); return
                    if kind=="port" and any(b.get("kind")=="port" for b in state["buildings"]): self._send(409,{"error":"La ciudad ya tiene una terminal portuaria."}); return
                    if kind=="airport" and any(b.get("kind")=="airport" for b in state["buildings"]): self._send(409,{"error":"La ciudad ya tiene un aeropuerto regional."}); return
                    contractor=contractor if contractor in CONTRACTORS else "Constructora Delta"
                    if not contractor_has_capacity(contractor): self._send(409,{"error":f"{contractor} no tiene cuadrillas disponibles. Elegí otra empresa o esperá la entrega de una obra."}); return
                    if contractor_free_workers(contractor)<LABOR_NEEDS[kind]: self._send(409,{"error":f"{contractor} necesita {LABOR_NEEDS[kind]} trabajadores para esta obra y solo tiene {contractor_free_workers(contractor)} libres."}); return
                    if any(b["x"]==x and b["y"]==y for b in state["buildings"]) or any(p["x"]==x and p["y"]==y for p in state["projects"]) or any(a["x"]==x and a["y"]==y for a in state.get("abandoned",[])): self._send(409,{"error":"La parcela ya está ocupada"}); return
                    if kind!="road" and [x,y] in state["roads"]: self._send(409,{"error":"No se puede construir sobre una calle existente."}); return
                    if kind=="road" and [x,y] in state["roads"]: self._send(409,{"error":"Ese tramo ya forma parte de la red vial."}); return
                    if kind!="road" and not any(abs(rx-x)+abs(ry-y)==1 for rx,ry in state["roads"]): self._send(409,{"error":"La parcela necesita acceso a una calle terminada"}); return
                    if kind in ("airport","hotel","school","fireStation","powerPlant","waterPlant","wastewaterPlant","landfill","recyclingPlant") and not route_between((4,10),(x,y)): self._send(409,{"error":"La obra necesita una conexión vial continua con la ciudad."}); return
                    bus_line=None
                    if kind=="busStop":
                        bus_line=next((line for line in state.get("busRoutes",[]) if line.get("id")==str(data.get("busLineId")) and line.get("status")=="active"),None)
                        if not bus_line:self._send(409,{"error":"Elegí una línea activa para ubicar la parada."});return
                        if not any(site["x"]==x and site["y"]==y for site in bus_stop_sites(bus_line)):
                            self._send(409,{"error":"La parcela ya no está disponible junto al recorrido o la línea alcanzó su límite de paradas."});return
                    zone=next((z for z in state.get("zones",[]) if z["x"]==x and z["y"]==y),None)
                    if kind in ("home","shop","factory") and (not zone or zone["kind"]!=kind):
                        required="residencial" if kind=="home" else "comercial" if kind=="shop" else "industrial"
                        self._send(409,{"error":f"Primero asigná uso {required} a esta parcela."}); return
                    industry_choice=data.get("industryType") if kind=="factory" else None
                    if industry_choice is not None and industry_choice not in FACTORY_LABELS:
                        self._send(400,{"error":"Industria desconocida: elegí cantera, hormigonera, aserradero, metalúrgica o alimentos."});return
                    if kind=="road":
                        if not any(abs(rx-x)+abs(ry-y)<=1 for rx,ry in state["roads"]): self._send(409,{"error":"La calle debe conectar con la red existente"}); return
                        contractor=contractor if contractor in CONTRACTORS else "Constructora Delta"
                    elif kind in ("home","shop","hotel","factory"):
                        # Promotor privado financia la inversión; el municipio cubre permisos e inspección.
                        need=PROJECTS[kind]["cost"]*.12
                        if state["money"]<need: self._send(409,{"error":f"Fondos municipales insuficientes para permisos ($ {need:.0f})"}); return
                        state["money"]-=need
                        contractor=contractor if contractor in CONTRACTORS else "Constructora Delta"
                    else:
                        contractor=contractor if contractor in CONTRACTORS else "Constructora Delta"
                    service_id=data.get("serviceModel") or ("primarySchool" if kind=="school" else SERVICE_DEFAULT.get(kind))
                    model=SERVICE_MODELS.get(service_id) or SCHOOL_MODELS.get(service_id)
                    if data.get("serviceModel") and (model is None or model["kind"]!=kind):
                        self._send(400,{"error":"Categoría de servicio inválida para esta obra"});return
                    spec=({**PROJECTS[kind],"cost":model["cost"],"days":model["days"],"label":model["label"]} if model else PROJECTS[kind])
                    c=CONTRACTORS[contractor]; total=round(spec["cost"]*c["price"]); duration=round(spec["days"]*c["days"]/30)
                    # Proyectos privados pagan al contratista desde capital privado; fondos ingresan por hitos a medida que llegan.
                    p={"id":uuid.uuid4().hex,"kind":kind,"label":spec["label"],"x":x,"y":y,"contractor":contractor,"cost":total,"duration":duration,"elapsed":0,"progress":0,"paid":0,"stages":spec["stageNames"],"stageIndex":0,"status":"contratada","cause":c["profile"],"contractedMandate":int(state.get("government",{}).get("mandate",1)),"contractedDay":state["day"],"monthlyCost":0,"workersAssigned":LABOR_NEEDS[kind],"materialsRequired":material_plan(kind),"materialsUsed":{key:0 for key in MATERIAL_NAMES}}
                    if model:
                        p["serviceModel"]=service_id
                        p["materialsRequired"]={k:math.ceil(q*model["cost"]/PROJECTS[kind]["cost"]) if q else 0 for k,q in p["materialsRequired"].items()}
                    if kind=="busStop":p["busLineId"]=bus_line["id"]
                    if kind=="factory":
                        p["industryType"]=industry_choice or next_factory_industry()
                        p["label"]=FACTORY_LABELS[p["industryType"]]
                    if kind in ("home","shop","hotel","factory"):
                        p["privatePaid"]=True; p["municipalPermitPaid"]=round(spec["cost"]*.12); p["cost"]=total-p["municipalPermitPaid"]
                        operating_reserve=4200 if kind=="factory" else 0
                        if state["privateCapital"]<p["cost"]+operating_reserve:
                            state["money"]+=round(spec["cost"]*.12); self._send(409,{"error":f"Los promotores necesitan $ {p['cost']+operating_reserve:,}, incluido el capital operativo inicial.".replace(",",".")}); return
                        state["privateCapital"]-=p["cost"]+operating_reserve
                        if operating_reserve:p["operatingReserve"]=operating_reserve
                        advance=round(p["cost"]*.2);p["paid"]=advance
                        state["supply"]["contractorCash"][contractor]+=advance
                    else:
                        reserved=sum(max(0,pending["cost"]-pending.get("paid",0)) for pending in state["projects"] if not pending.get("privatePaid"))
                        available=max(0,state["money"]-reserved)
                        if available<total: self._send(409,{"error":f"Fondos disponibles insuficientes. Contrato: $ {total:,}; disponible después de compromisos: $ {available:,}.".replace(",",".")}); return
                        advance=round(total*.2)
                        state["money"]-=advance; p["paid"]=advance
                        state["supply"]["contractorCash"][contractor]+=advance
                    p["retentionPct"]=0 if p.get("privatePaid") else .1
                    state["projects"].append(p); ev(f"Contrato adjudicado: {spec['label']}",f"{contractor} · $ {total:,} · {LABOR_NEEDS[kind]} trabajadores · plazo estimado {duration} días. Se reservó el anticipo.".replace(",","."))
                    if investment_id:
                        investment_offer["status"]="aceptada";investment_offer["decisionDay"]=state["day"];investment_offer["projectId"]=p["id"];investment_book.setdefault("history",[]).append(dict(investment_offer));investment_book["history"]=investment_book["history"][-24:];investment_book["nextOfferDay"]=state["day"]+90;investment_book["reason"]="La obra comercial está contratada; la empresa abrirá después de construcción e inspección.";ev("Inversión comercial adjudicada",f"El promotor invierte $ {p['cost']:,}; se aprobó el permiso por $ {p['municipalPermitPaid']}. La apertura depende de materiales, cuadrilla, etapas e inspección.".replace(",","."))
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
                    vendor_offer=None
                    if supplier in INDUSTRIAL_VENDOR_GOODS:
                        expected=INDUSTRIAL_VENDOR_GOODS[supplier][1]
                        if set(clean)!={expected}:
                            self._send(409,{"error":"Este proveedor industrial solo vende "+MATERIAL_NAMES[expected]+"."});return
                        offers=industrial_vendor_offers(supplier,expected,clean[expected],(location["x"],location["y"]))
                        if not offers:
                            self._send(409,{"error":"Ninguna planta ofrece el lote completo con acceso vial. Probá otra fábrica o dividí el pedido."});return
                        vendor_offer=offers[0]
                        origin=(vendor_offer["site"]["x"],vendor_offer["site"]["y"])
                        route=vendor_offer["route"]
                    else:
                        origin=(4,10)
                        route=route_between(origin,(location["x"],location["y"]))
                    if route is None:self._send(409,{"error":"El depósito elegido no tiene acceso de camiones por la red vial."});return
                    free=max(0,location["capacity"]-storage_used(destination_id)-storage_reserved(destination_id))
                    if sum(clean.values())>free:
                        self._send(409,{"error":f"{location['label'] if 'label' in location else 'El depósito'} tiene espacio para {free} unidades más. Elegí otro destino o reducí el pedido."});return
                    distance=max(0,len(route)-1);provider=SUPPLIERS[supplier];inventory=state["supply"]["suppliers"][supplier]
                    missing=[MATERIAL_NAMES[k] for k,q in clean.items() if inventory[k]<q]
                    if missing:self._send(409,{"error":"El proveedor no tiene stock de "+", ".join(missing)+"."});return
                    freight=max(0,distance-4)*5
                    cost=vendor_offer["total"] if vendor_offer else round(sum(q*MATERIAL_PRICE[k]*provider["price"] for k,q in clean.items())+freight)
                    cash=state["supply"]["contractorCash"][project["contractor"]]
                    if cash<cost:self._send(409,{"error":f"{project['contractor']} tiene $ {cash:,} de caja de obra; el pedido cuesta $ {cost:,}.".replace(",",".")});return
                    eta=provider["days"]+math.ceil(distance/6)
                    for material,qty in clean.items():inventory[material]-=qty
                    state["supply"]["contractorCash"][project["contractor"]]-=cost
                    order={"id":uuid.uuid4().hex,"projectId":project["id"],"label":project["label"],"contractor":project["contractor"],"supplier":supplier,"items":clean,"cost":cost,"destinationId":destination_id,"destinationLabel":location.get("label",f"Depósito municipal {location['x']+1},{location['y']+1}"),"priority":priority,"orderedDay":state["day"],"supplierReadyDay":state["day"]+provider["days"],"travelDistance":distance,"travelledDistance":0,"routeProgress":0,"arrivalDay":state["day"]+eta,"progress":0,"status":"en tránsito","statusCause":"Preparación en proveedor","route":route,"source":list(origin)}
                    state["supply"]["orders"].append(order)
                    if vendor_offer:
                        material=INDUSTRIAL_VENDOR_GOODS[supplier][1]
                        settle_industrial_vendor_offer(supplier,material,clean[material],vendor_offer)
                        state["supply"]["logisticsCash"]=state["supply"].get("logisticsCash",0)+vendor_offer["freight"]
                        order["vendorId"]=vendor_offer["site"]["business"].get("id")
                        order["vendorName"]=vendor_offer["site"].get("name")
                        order["productCost"]=vendor_offer["productCost"]
                        order["freight"]=vendor_offer["freight"]
                        order["quotedFactor"]=vendor_offer["factor"]
                    else:settle_local_material_sale(supplier,clean)
                    order["trafficFactor"]=round(traffic_factor(route,order),2)
                    order["arrivalDay"]=order_route_eta(order)[2]
                    detail=" · ".join(f"{MATERIAL_NAMES[k]} {v}" for k,v in clean.items())
                    eta=max(0,order["arrivalDay"]-state["day"])
                    ev("Pedido de materiales",f"{project['contractor']} compró {detail} a {supplier} por $ {cost:,}; entrega estimada en {eta} días por {distance} tramos (con congestión estimada). Prioridad de descarga: {priority}.".replace(",","."))
                elif action in ("installPowerBackup","refuelPowerBackup"):
                    x=int(data.get("x",-1));y=int(data.get("y",-1));building=next((b for b in state["buildings"] if b.get("x")==x and b.get("y")==y and b.get("kind") in ("civic","waterPlant","wastewaterPlant")),None)
                    if not building:self._send(409,{"error":"El respaldo solo se instala en hospitales, bombeo de agua y plantas cloacales."});return
                    reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"));available=max(0,state["money"]-reserved)
                    if action=="installPowerBackup":
                        if building.get("backupCapacityKw",0):self._send(409,{"error":"Este servicio ya tiene un grupo electrógeno."});return
                        cost=2800
                        if available<cost:self._send(409,{"error":f"Quedan $ {available}; instalar y cargar el grupo cuesta $ {cost}."});return
                        kw=min(75,max(1,building.get("utilityDemand",{}).get("powerKw",32)));building.update({"backupCapacityKw":kw,"backupCapacityKwh":kw*24*3,"backupFuelKwh":kw*24*3,"backupInstalledDay":state["day"]});state["money"]-=cost
                        ev("Grupo electrógeno instalado",f"{building.get('name','Servicio crítico')}: {kw:g} kW y tres días de reserva inicial · inversión $2.800 · mantenimiento $70/mes.")
                    else:
                        if not building.get("backupCapacityKw",0):self._send(409,{"error":"Primero instalá un grupo electrógeno."});return
                        missing=max(0,building["backupCapacityKwh"]-building.get("backupFuelKwh",0));cost=math.ceil(missing*.12)
                        if missing<=0:self._send(409,{"error":"La reserva de combustible ya está completa."});return
                        if available<cost:self._send(409,{"error":f"Quedan $ {available}; el combustible cuesta $ {cost}."});return
                        building["backupFuelKwh"]=building["backupCapacityKwh"];state["money"]-=cost
                        ev("Combustible de emergencia repuesto",f"{building.get('name','Servicio crítico')}: reserva restaurada a tres días · costo $ {cost}.")
                elif action=="inspectRecovery":
                    need=next((n for n in state.setdefault("recoveryNeeds",[]) if n.get("id")==str(data.get("id")) and n.get("status")=="abierta"),None)
                    if not need or need.get("inspectionStatus")!="pendiente":self._send(409,{"error":"La inspección ya comenzó o el activo no requiere una inspección nueva."});return
                    reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"));available=max(0,state["money"]-reserved)
                    if available<150:self._send(409,{"error":f"Quedan $ {available}; la inspección municipal cuesta $ 150."});return
                    state["money"]-=150;need.update({"inspectionStatus":"en curso","inspectionRemainingDays":1,"inspectionCost":150})
                    ev("Inspección preventiva iniciada" if need.get("scheduledInspection") else "Inspección de emergencia iniciada",f"Una cuadrilla revisará {need['name']} durante un día; costo municipal $ 150. El informe determinará si requiere una rehabilitación.")
                elif action=="awardRecovery":
                    need=next((n for n in state.setdefault("recoveryNeeds",[]) if n.get("id")==str(data.get("id")) and n.get("status")=="abierta" and n.get("inspectionStatus")=="inspeccionada"),None)
                    contractor=data.get("contractor")
                    if not need or contractor not in CONTRACTORS:self._send(409,{"error":"La inspección debe estar completa y el contrato seguir disponible."});return
                    if not contractor_has_capacity(contractor):self._send(409,{"error":f"{contractor} no tiene una cuadrilla disponible."});return
                    if contractor_free_workers(contractor)<4:self._send(409,{"error":f"{contractor} no tiene los cuatro trabajadores libres para esta reparación."});return
                    cost=round(need["estimate"]*CONTRACTORS[contractor]["price"]);reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"));available=max(0,state["money"]-reserved)
                    if available<cost:self._send(409,{"error":f"Quedan $ {available}; el contrato cuesta $ {cost} además de las obras comprometidas."});return
                    duration=max(2,round(4*CONTRACTORS[contractor]["days"]/30));contract={"id":uuid.uuid4().hex,"needId":need["id"],"targetType":need["targetType"],"x":need["x"],"y":need["y"],"name":need["name"],"contractor":contractor,"cost":cost,"paid":cost,"duration":duration,"remainingDays":duration,"workers":4,"startDay":state["day"],"status":"en obra","stage":"Refuerzo estructural y renovación de instalaciones" if need.get("cause")=="desgaste por uso y antigüedad" else "Desagote y retiro de materiales dañados"}
                    state["money"]-=cost;state.setdefault("recoveryContracts",[]).append(contract);need["status"]="en reparación";need["contractId"]=contract["id"]
                    ev("Contrato municipal adjudicado",f"{contractor} rehabilitará {need['name']} por $ {cost:,} en {duration} días; cuatro trabajadores quedan asignados. El pago sale de la tesorería al iniciar.".replace(",","."))
                elif action=="prepareHeatwave":
                    climate=ensure_climate_state();forecast=climate.get("heatForecast") or {};target=int(data.get("targetDay",-1))
                    if forecast.get("targetDay")!=target or forecast.get("status")!="pronosticada" or target<=state["day"]:self._send(409,{"error":"No hay una ola de calor futura disponible para preparar."});return
                    if climate.get("coolingPreparedForDay")==target:self._send(409,{"error":"Ya hay centros de enfriamiento preparados para este episodio."});return
                    try:workplaces=commute_model().get("workplaces",[])
                    except Exception:workplaces=[]
                    centers=[b for b in state["buildings"] if b.get("kind")=="civic" and b.get("status") not in ("cerrado","abandonado") and next((w for w in workplaces if w.get("x")==b.get("x") and w.get("y")==b.get("y") and w.get("staffedJobs",0)>=2),None) and b.get("utilityAccess",{}).get("powerServedPct",0)>=75 and route_between((4,10),(b["x"],b["y"]))]
                    if not centers:self._send(409,{"error":"No hay centros municipales con personal, electricidad y acceso vial para abrir refugios."});return
                    reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"));available=max(0,state["money"]-reserved)
                    if available<650:self._send(409,{"error":f"Quedan $ {available}; habilitar refugios y turnos de emergencia cuesta $ 650."});return
                    state["money"]-=650;climate["coolingPreparedForDay"]=target
                    ev("Refugios de calor preparados",f"Se habilitarán hasta {len(centers)} centros municipales para el día {target}; capacidad conjunta de {sum(min(100,max(40,next(w['staffedJobs'] for w in workplaces if w.get('x')==b['x'] and w.get('y')==b['y'])*2)) for b in centers)} residentes. Personal, agua y electricidad son requisitos operativos. Costo $ 650.")
                elif action=="toggleWaterRestrictions":
                    climate=ensure_climate_state();forecast=climate.get("droughtForecast") or {};target=int(forecast.get("targetDay",-1))
                    if target<state["day"] or target>state["day"]+30:self._send(409,{"error":"Las restricciones solo pueden activarse ante una sequía prevista o en curso."});return
                    climate["waterRestrictionsTarget"]=target;climate["waterRestrictions"]=not climate.get("waterRestrictions",False)
                    if climate["waterRestrictions"]:ev("Restricción de agua no esencial",f"Comercios, hoteles, puerto y aeropuerto reducen 35% su demanda hídrica durante la sequía. Sus operaciones pueden producir menos; los hogares y servicios esenciales conservan prioridad.")
                    else:ev("Restricción de agua levantada","Se restablece el consumo comercial normal; la sequía puede volver a causar faltantes en la red.")
                elif action=="deployWaterTankers":
                    climate=ensure_climate_state();forecast=climate.get("droughtForecast") or {};target=int(forecast.get("targetDay",-1))
                    if target<state["day"] or target>state["day"]+30:self._send(409,{"error":"Los camiones cisterna solo se despliegan ante una sequía prevista o en curso."});return
                    if climate.get("waterTankerForDay")==target:self._send(409,{"error":"Ya se contrató el refuerzo de cisternas para esta sequía."});return
                    reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"));available=max(0,state["money"]-reserved);cost=1200
                    if available<cost:self._send(409,{"error":f"Quedan $ {available}; el despliegue de cisternas cuesta $ {cost}."});return
                    state["money"]-=cost;climate.update({"waterTankerForDay":target,"waterTankerStart":max(state["day"],target),"waterTankerUntil":target+10})
                    ev("Cisternas contratadas",f"El refuerzo entregará hasta 30 m³/día durante diez días desde el día {target}. Costo total $ 1.200.")
                elif action=="prepareStorm":
                    climate=ensure_climate_state();forecast=climate.get("forecast");target=int(data.get("targetDay",-1))
                    if not forecast or forecast.get("targetDay")!=target or forecast.get("warningLevel")=="bajo" or target<=state["day"]:self._send(409,{"error":"No hay una alerta futura de riesgo que necesite despliegue."});return
                    if climate.get("preparedForDay")==target:self._send(409,{"error":"Ya hay bombas móviles y cuadrillas asignadas para esa tormenta."});return
                    reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"));available=max(0,state["money"]-reserved);cost=850
                    if available<cost:self._send(409,{"error":f"Quedan $ {available}; el despliegue de bombas y limpieza cuesta $ {cost}."});return
                    state["money"]-=cost;climate["preparedForDay"]=target;forecast["prepared"]=True
                    ev("Respuesta preventiva desplegada",f"Se limpiaron sumideros y se preposicionaron bombas para el día {target}. $850; la capacidad pluvial aumentará 25% durante la tormenta.")
                elif action in ("repairUtility","repairUtilityEmergency"):
                    try:dispatch_utility_repair(data.get("id"),action=="repairUtilityEmergency")
                    except (ValueError,TypeError) as error:self._send(409,{"error":str(error)});return
                elif action=="utilityLine":
                    network=data.get("network");x=int(data.get("x",-1));y=int(data.get("y",-1))
                    if network not in ("power","water","sewer","drainage","gas","telecom") or [x,y] not in state["roads"]:self._send(409,{"error":"El tendido necesita un tramo de calle terminado y una red válida."});return
                    utilities=ensure_utility_state();key={"power":"powerLines","water":"waterPipes","sewer":"sewerLines","drainage":"drainLines","gas":"gasLines","telecom":"telecomLines"}[network];cost={"power":165,"water":130,"sewer":145,"drainage":155,"gas":120,"telecom":105}[network]
                    if [x,y] in utilities[key]:self._send(409,{"error":"Este tramo ya está conectado a esa red."});return
                    connected=energized_utility_tiles(network)
                    if not any((x+dx,y+dy) in connected for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):self._send(409,{"error":"El nuevo tramo debe prolongar una red conectada al sistema."});return
                    reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"));available=max(0,state["money"]-reserved)
                    if available<cost:self._send(409,{"error":f"Quedan $ {available}; el tendido cuesta $ {cost} además de los contratos."});return
                    state["money"]-=cost;utilities[key].append([x,y]);network_name={"power":"eléctrica","water":"de agua","sewer":"cloacal","drainage":"pluvial","gas":"de gas","telecom":"de fibra óptica"}[network]
                    maintenance={"power":1.2,"water":.8,"sewer":.9,"drainage":.7,"gas":1.1,"telecom":.6}[network]
                    ev("Red de servicios ampliada",f"Se conectó un tramo {network_name} sobre la calle {x+1},{y+1}; mantenimiento aproximado $ {maintenance:.1f}/mes.")
                elif action=="wasteContainer":
                    x=int(data.get("x",-1));y=int(data.get("y",-1));waste=ensure_waste_state()
                    if [x,y] not in state["roads"]:self._send(409,{"error":"El contenedor debe colocarse sobre una calle terminada."});return
                    if any(c.get("x")==x and c.get("y")==y for c in waste["containers"]):self._send(409,{"error":"Ya hay un contenedor en ese tramo."});return
                    cost=350;reserved=sum(max(0,p["cost"]-p.get("paid",0)) for p in state["projects"] if not p.get("privatePaid"));available=max(0,state["money"]-reserved)
                    if available<cost:self._send(409,{"error":f"Quedan $ {available}; el contenedor cuesta $ {cost} además de los contratos."});return
                    waste["containers"].append({"id":f"bin-{x}-{y}","x":x,"y":y,"capacityTons":2,"storedTons":0,"installedDay":state["day"]});state["money"]-=cost
                    ev("Contenedor instalado",f"Calle {x+1},{y+1}: inversión $350 · capacidad de recolección +0,15 t/día. Cada depósito conectado suma además una estación de transferencia con 12 t de almacenamiento y despacho de 1,5 t/día.")
                elif action=="zone":
                    kind=data.get("kind")
                    if kind not in ("home","shop","factory"):self._send(400,{"error":"Uso de suelo inválido"});return
                    cells=data.get("cells") or [[data.get("x",-1),data.get("y",-1)]]
                    if not isinstance(cells,list) or not cells or len(cells)>560:self._send(400,{"error":"La pintura debe incluir entre 1 y 560 parcelas."});return
                    normalized=[];seen=set()
                    for cell in cells:
                        if not isinstance(cell,(list,tuple)) or len(cell)!=2:self._send(400,{"error":"Parcela de zonificación inválida."});return
                        x,y=map(int,cell)
                        if x<0 or y<0 or x>=28 or y>=20 or is_water(x,y):self._send(409,{"error":"La franja incluye una parcela fuera del suelo edificable."});return
                        if any(b.get("x")==x and b.get("y")==y for b in state["buildings"]) or any(p.get("x")==x and p.get("y")==y for p in state["projects"]) or any(a.get("x")==x and a.get("y")==y for a in state.get("abandoned",[])) or [x,y] in state["roads"]:self._send(409,{"error":f"La parcela {x+1},{y+1} está ocupada."});return
                        if not any(abs(rx-x)+abs(ry-y)==1 for rx,ry in state["roads"]):self._send(409,{"error":f"La parcela {x+1},{y+1} necesita una calle terminada al lado."});return
                        if (x,y) not in seen:normalized.append((x,y));seen.add((x,y))
                    state["zones"]=[z for z in state.setdefault("zones",[]) if (z.get("x"),z.get("y")) not in seen]
                    for x,y in normalized:state["zones"].append({"x":x,"y":y,"kind":kind,"owner":"municipal","status":"disponible","autoDeveloperPermit":True})
                    label={"home":"residencial","shop":"comercial","factory":"industrial"}[kind]
                    ev("Permisos de suelo pintados",f"Se asignó permiso {label} a {len(normalized)} parcela(s). La construcción depende de demanda, capital, materiales, cuadrillas y acceso.")
                elif action in ("pauseProject","resumeProject","cancelProject"):
                    project=next((p for p in state["projects"] if p["id"]==str(data.get("id"))),None)
                    if not project: self._send(404,{"error":"La obra ya no está activa."}); return
                    if action=="pauseProject":
                        if project["status"]=="pausada": self._send(409,{"error":"La obra ya está pausada."}); return
                        project["status"]="pausada"; project["workersAssigned"]=0; project["cause"]="Pausa decidida por el equipo de gobierno"; ev("Obra pausada",f"{project['label']}: se conserva el avance ({round(project['progress']*100)}%) y se liberan cuadrillas.")
                    elif action=="resumeProject":
                        if project["status"] not in ("pausada","suspendida"): self._send(409,{"error":"La obra no está pausada ni suspendida."}); return
                        next_certificate=project_certificate(project,project.get("elapsed",0)+1)
                        nextPayment=0 if project.get("privatePaid") else next_certificate[4]+(round(project.get("cost",0)*max(0,min(.2,float(project.get("retentionPct",0))))) if next_certificate[0]>=1 else 0)
                        if state["money"]<nextPayment: self._send(409,{"error":f"Falta caja para el próximo certificado y su garantía ($ {nextPayment:.0f})."}); return
                        if project["status"]=="pausada":
                            if not contractor_has_capacity(project["contractor"]): self._send(409,{"error":"La constructora tiene todos sus cupos ocupados. Esperá otra entrega antes de reanudar."}); return
                            if contractor_free_workers(project["contractor"])<LABOR_NEEDS[project["kind"]]: self._send(409,{"error":"La constructora no tiene trabajadores libres para reanudar esta obra."}); return
                            project["workersAssigned"]=LABOR_NEEDS[project["kind"]]
                        project["status"]="contratada"; project["cause"]=CONTRACTORS[project["contractor"]]["profile"]; ev("Obra reanudada",f"{project['label']} continúa desde {round(project['progress']*100)}% con el saldo pendiente comprometido.")
                    else:
                        spent=round(project.get("priorSpent",0)+(project["cost"]+project.get("municipalPermitPaid",0) if project.get("privatePaid") else project.get("paid",0))); progress=project.get("progress",0)
                        if progress>0:
                            state.setdefault("abandoned",[]).append({"id":project["id"],"x":project["x"],"y":project["y"],"kind":project["kind"],"label":project["label"],"progress":progress,"spent":spent,"contractor":project["contractor"],"stage":project["stages"][project["stageIndex"]],"status":"obra inconclusa","privatePaid":project.get("privatePaid",False),"busLineId":project.get("busLineId")})
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
                    milestone_base=min(len(spec["stageNames"]),int(initial*len(spec["stageNames"])))
                    p={"id":uuid.uuid4().hex,"kind":kind,"label":abandoned["label"],"x":abandoned["x"],"y":abandoned["y"],"contractor":contractor,"cost":total,"duration":duration,"elapsed":0,"progress":initial,"initialProgress":initial,"milestoneBase":milestone_base,"certifiedMilestones":0,"paid":0,"priorSpent":abandoned.get("spent",0),"stages":spec["stageNames"],"stageIndex":min(len(spec["stageNames"])-1,int(initial*len(spec["stageNames"]))),"status":"contratada","cause":c["profile"],"contractedMandate":int(state.get("government",{}).get("mandate",1)),"contractedDay":state["day"],"monthlyCost":0,"workersAssigned":LABOR_NEEDS[kind],"materialsRequired":material_plan(kind,initial),"materialsUsed":{key:0 for key in MATERIAL_NAMES}}
                    if kind=="busStop":p["busLineId"]=abandoned.get("busLineId")
                    private=kind in ("home","shop","hotel","factory")
                    if private:
                        fee=max(50,round(spec["cost"]*(1-initial)*.12));privateCost=total-fee
                        if state["money"]<fee or state["privateCapital"]<privateCost: self._send(409,{"error":"No alcanza el capital promotor o municipal para financiar el rescate."}); return
                        state["money"]-=fee;state["privateCapital"]-=privateCost;p["cost"]=privateCost;p["municipalPermitPaid"]=fee;p["privatePaid"]=True
                        p["paid"]=round(privateCost*.2);state["supply"]["contractorCash"][contractor]+=p["paid"]
                    else:
                        reserved=sum(max(0,q["cost"]-q.get("paid",0)) for q in state["projects"] if not q.get("privatePaid"));available=max(0,state["money"]-reserved)
                        if available<total: self._send(409,{"error":"La tesorería disponible no cubre el contrato de rescate."}); return
                        p["paid"]=round(total*.2);state["money"]-=p["paid"];state["supply"]["contractorCash"][contractor]+=p["paid"]
                    p["retentionPct"]=0 if private else .1
                    state["abandoned"].remove(abandoned);state["projects"].append(p)
                    ev("Rescate de obra adjudicado",f"{abandoned['label']} continúa desde {round(initial*100)}% con {contractor}; contrato nuevo $ {total:,} y plazo estimado {duration} días.".replace(",","."))
                elif action=="new":
                    room_host=state.get("host",pid);active_players=state.get("players",{})
                    state=initial_state();state["host"]=room_host;state["players"]=active_players
                    ev("Nueva partida","Puerto Claro comenzó una nueva gestión municipal.")
                else: self._send(400,{"error":"Acción desconocida"}); return
                self._send(200,public_state(pid)); return
            if path=="/api/save":
                SAVE.write_text(json.dumps({k:v for k,v in state.items() if k not in ("players","host")},ensure_ascii=False,indent=2),encoding="utf-8"); self._send(200,{"ok":True,"file":SAVE.name}); return
            if path=="/api/load":
                if not SAVE.exists(): self._send(404,{"error":"No hay ciudad guardada todavía"}); return
                loaded=json.loads(SAVE.read_text(encoding="utf-8")); loaded["players"]=state.get("players",{}); loaded["host"]=state.get("host",pid); state=loaded; ev("Ciudad cargada","Se restauró el último estado guardado."); self._send(200,public_state(pid)); return
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
    threading.Thread(target=discovery_loop,daemon=True).start()
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
