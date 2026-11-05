"""Presión de crecimiento: mide falta de oferta utilizable, no interés bruto.

Personas interesadas se guardan en housingDemand.unmet para que la migración
pueda ocupar las viviendas a medida que se habilitan. La presión para nuevas
obras aparece solo después de agotar las plazas habitables.
"""
import math
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
    residents=[p for h in buildings if h.get("kind")=="home" for p in h.get("residents",[]) if p.get("workerEligible")]
    low_skill_seekers=sum(p.get("status")=="buscando" and int(p.get("educationRank",1) or 0)<=1 for p in residents)
    factory_open_jobs=sum(max(0,int(b.get("business",{}).get("jobSlots",b.get("jobSlots",0)))-int(b.get("business",{}).get("lastWorkers",b.get("workersAssigned",0)))) for b in buildings if b.get("kind")=="factory" and b.get("business",{}).get("status")!="cerrado")
    factory_job_gap=max(0,low_skill_seekers-factory_open_jobs)
    factory_goal=min(12,max((active_shops+1)//2,math.ceil(factory_job_gap/20)))
    factories=sum(b.get("kind")=="factory" and b.get("business",{}).get("status")!="cerrado" for b in buildings)
    pending_factories=sum(p.get("kind")=="factory" and p.get("status") not in ("cancelada","finalizada") for p in projects)
    factory_shortage=max(0,factory_goal-factories-pending_factories)
    offices=[b for b in buildings if b.get("kind")=="office" and b.get("business",{}).get("status")!="cerrado"]
    pending_offices=sum(p.get("kind")=="office" and p.get("status") not in ("cancelada","finalizada") for p in projects)
    university_seekers=sum(p.get("status")=="buscando" and int(p.get("educationRank",0) or 0)>=3 for p in residents)
    office_open_jobs=sum(max(0,int(b.get("business",{}).get("jobSlots",b.get("jobSlots",0)))-int(b.get("business",{}).get("lastWorkers",b.get("workersAssigned",0)))) for b in offices)
    pending_office_projects=[p for p in projects if p.get("kind")=="office" and p.get("status") not in ("cancelada","finalizada","pausada","suspendida")]
    pending_office_jobs=sum(40 if p.get("density")=="high" else 32 if p.get("density")=="medium" else 24 for p in pending_office_projects)
    unplaced_graduates=max(0,university_seekers-office_open_jobs-pending_office_jobs)
    # Vacantes operativas y oficinas en obra cubren primero a los universitarios
    # que buscan trabajo. La demanda representa puestos todavía sin ofrecer.
    office_shortage=min(12,math.ceil(unplaced_graduates/24))
    office_goal=len(offices)+pending_offices+office_shortage
    return {
        "housing":{"value":min(100,round(shortage/36*100)),"shortage":shortage,"vacancies":vacancies,"waiting":interest},
        "commercial":{"value":min(100,round(commercial_shortage/max(1,shop_goal)*100)) if shop_goal else 0,
                      "shortage":commercial_shortage,"goal":shop_goal,"existing":len(shops),
                      "pipeline":pending_shops,"idle":idle_shops},
        "industry":{"value":min(100,round(factory_shortage/max(1,factory_goal)*100)) if factory_goal else 0,
                    "shortage":factory_shortage,"goal":factory_goal,"unemployedCandidates":low_skill_seekers,"openJobs":factory_open_jobs},
        "office":{"value":min(100,round(unplaced_graduates/24*100)),
                  "shortage":office_shortage,"goal":office_goal,"unemployedCandidates":university_seekers,
                  "unplacedGraduates":unplaced_graduates,"openJobs":office_open_jobs,"pendingJobs":pending_office_jobs}
    }
