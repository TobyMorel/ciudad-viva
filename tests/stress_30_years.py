"""Prueba extensiva de 30 años / cinco perfiles. Ejecutar: python tests/stress_30_years.py
Avanza cierres mensuales; no sustituye 10.950 ticks diarios ni prueba LAN física.
"""
import os
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server

PROFILES={
    "pueblo":(200,6000,20000),
    "metropoli":(5000,180000,40000),
    "puerto":(1500,95000,28000),
    "turistica":(900,65000,22000),
}

def run_profile(name, population, funds, ore):
    server.state=server.initial_state()
    s=server.state
    server.ensure_supply_state()
    s["population"]=population
    s["money"]=funds
    s["privateCapital"]=max(20000,funds//2)
    s["supply"]["regionalSteelReserve"]=ore
    s["paused"]=False
    history=[]
    for month in range(360):
        # Snapshot mensual: cierre completo, sin simular los días intermedios.
        s["day"]=30*(month+1)
        s["lastMonth"]=month
        server.tick_one_day()
        supply=s["supply"]
        assert supply.get("regionalSteelReserve",0)>=0,(name,month,"mineral negativo")
        assert supply.get("unexploredSteelOre",12000)>=0,(name,month,"yacimiento negativo")
        assert s.get("waste",{}).get("scrapSteelTons",0)>=0,(name,month,"chatarra negativa")
        assert all(v.get("steel",0)>=0 for v in supply.get("suppliers",{}).values()),(name,month,"inventario negativo")
        assert s.get("money",0)==s.get("money",0),(name,month,"caja municipal NaN")
        assert s.get("privateCapital",0)==s.get("privateCapital",0),(name,month,"capital privado NaN")
        assert supply.get("steelImportedUnits",0)>=0 and supply.get("steelRecyclingSpend",0)>=0,(name,month,"contabilidad siderúrgica inválida")
        assert supply.get("geologicalExplorationSpend",0)>=0,(name,month,"prospección inválida")
        assert all(b.get("business",{}).get("cash",0)==b.get("business",{}).get("cash",0) for b in s.get("buildings",[])),(name,month,"NaN")
        if month%12==11:history.append((month//12+1,s.get("population",0),s.get("money",0),supply.get("regionalSteelReserve",0)))
    return history

def run_remote_expansion_profile():
    """Mantiene una obra pública periférica durante 30 años de cierres."""
    server.state=server.new_settlement_state()
    s=server.state
    server.ensure_supply_state()
    s["money"]=1000000
    s["privateCapital"]=500000
    s["paused"]=False
    for chunk_y in range(2,7):
        server.unlock_land_chunk(0,chunk_y)
    for y in range(11,50):
        server.place_road_instantly(4,y)
    server.place_instant_public_service("civic",5,49,"clinic")
    assert server.land_tile_unlocked(5,49)
    assert len(s["roads"])==40
    assert any(b.get("x")==5 and b.get("y")==49 and b.get("serviceModel")=="clinic" for b in s["buildings"])
    history=[]
    for month in range(360):
        s["day"]=30*(month+1)
        s["lastMonth"]=month
        server.tick_one_day()
        supply=s["supply"]
        assert supply.get("regionalSteelReserve",0)>=0,("expansion-remota",month,"mineral negativo")
        assert supply.get("unexploredSteelOre",12000)>=0,("expansion-remota",month,"yacimiento negativo")
        assert s.get("waste",{}).get("scrapSteelTons",0)>=0,("expansion-remota",month,"chatarra negativa")
        assert all(v.get("steel",0)>=0 for v in supply.get("suppliers",{}).values()),("expansion-remota",month,"inventario negativo")
        assert s.get("money",0)==s.get("money",0),("expansion-remota",month,"caja municipal NaN")
        assert s.get("privateCapital",0)==s.get("privateCapital",0),("expansion-remota",month,"capital privado NaN")
        assert all(b.get("business",{}).get("cash",0)==b.get("business",{}).get("cash",0) for b in s.get("buildings",[])),("expansion-remota",month,"NaN")
        if month%12==11:history.append((month//12+1,s.get("population",0),s.get("money",0),supply.get("regionalSteelReserve",0)))
    assert any(b.get("x")==5 and b.get("y")==49 and b.get("serviceModel")=="clinic" for b in s["buildings"])
    return history

if __name__=="__main__":
    for name,params in PROFILES.items():
        records=run_profile(name,*params)
        print(f"{name}: 30 años comprobados; fin población={records[-1][1]} caja={records[-1][2]} mineral={records[-1][3]}")
    records=run_remote_expansion_profile()
    print(f"expansion-remota: 30 años comprobados; fin población={records[-1][1]} caja={records[-1][2]} mineral={records[-1][3]}")
    print("OK: 5 perfiles × 360 cierres mensuales")
