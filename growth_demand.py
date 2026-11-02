"""Presión de crecimiento: mide falta de oferta utilizable, no interés bruto.

Personas interesadas se guardan en housingDemand.unmet para que la migración
pueda ocupar las viviendas a medida que se habilitan. La presión para nuevas
obras aparece solo después de agotar las plazas habitables.
"""
def growth_demand(state):
    day=int(state.get("day",1))
    buildings=state.get("buildings",[]) or []
    projects=state.get("projects",[]) or []
    homes=[b for b in buildings if b.get("kind")=="home" and b.get("status") not in ("cerrado","abandonado")
           and b.get("emergencyReturnDay",0)<=day]
    vacancies=sum(max(0,int(b.get("capacity",0))-int(b.get("occupants",0))) for b in homes)
    interest=max(0,int(state.get("housingDemand",{}).get("unmet",0)))
    shortage=interest if vacancies==0 else 0
    shops=[b for b in buildings if b.get("kind")=="shop" and b.get("status") not in ("cerrado","abandonado")
           and b.get("business",{}).get("status")!="cerrado"]
    pending_shops=sum(p.get("kind")=="shop" and p.get("status") not in ("cancelada","finalizada") for p in projects)
    population=max(0,int(state.get("population",0)))
    shop_goal=max(1,population//90) if population>=24 else 0
    required_shops=max(0,shop_goal-len(shops)-pending_shops)
    # Si los locales existentes cubren las compras, primero ocupar su capacidad.
    idle_shops=sum(
        max(0,int(b.get("business",{}).get("lastLocalDemand",0))-int(b.get("business",{}).get("lastLocalSales",0)))==0
        and max(0,int(b.get("business",{}).get("lastRegionalDemand",0))-int(b.get("business",{}).get("lastRegionalSales",0)))==0
        for b in shops if b.get("business",{}).get("status","abierto")=="abierto")
    commercial_shortage=0 if idle_shops else required_shops
    active_shops=sum(b.get("business",{}).get("status")=="abierto" and
                     (b.get("business",{}).get("lastSales",0)>0 or b.get("business",{}).get("lastInputUnits",0)>0)
                     for b in shops)
    factory_goal=min(6,(active_shops+1)//2)
    factories=sum(b.get("kind")=="factory" and b.get("business",{}).get("status")!="cerrado" for b in buildings)
    pending_factories=sum(p.get("kind")=="factory" and p.get("status") not in ("cancelada","finalizada") for p in projects)
    factory_shortage=max(0,factory_goal-factories-pending_factories)
    return {
        "housing":{"value":min(100,round(shortage/36*100)),"shortage":shortage,"vacancies":vacancies,"waiting":interest},
        "commercial":{"value":min(100,round(commercial_shortage/max(1,shop_goal)*100)) if shop_goal else 0,
                      "shortage":commercial_shortage,"goal":shop_goal,"existing":len(shops),
                      "pipeline":pending_shops,"idle":idle_shops},
        "industry":{"value":min(100,round(factory_shortage/max(1,factory_goal)*100)) if factory_goal else 0,
                    "shortage":factory_shortage,"goal":factory_goal}
    }
