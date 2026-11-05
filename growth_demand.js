// Una cola de interesados no equivale a escasez: las viviendas libres deben ocuparse primero.
// La capacidad comercial se considera libre cuando los locales ya abiertos cubren sus ventas.
export function growthDemand(state){
  const buildings=state?.buildings||[],projects=state?.projects||[],day=Number(state?.day||1);
  const homes=buildings.filter(b=>b.kind==='home'&&!['cerrado','abandonado'].includes(b.status)&&(b.emergencyReturnDay||0)<=day);
  const vacancies=homes.reduce((n,b)=>n+Math.max(0,Math.trunc(b.capacity||0)-Math.trunc(b.occupants||0)),0);
  const waiting=Math.max(0,Math.trunc(state?.housingDemand?.unmet||0)),shortage=vacancies>0?0:waiting;
  const shops=buildings.filter(b=>b.kind==='shop'&&!['cerrado','abandonado'].includes(b.status)&&b.business?.status!=='cerrado');
  const live=p=>!['cancelada','finalizada'].includes(p.status),pendingShops=projects.filter(p=>p.kind==='shop'&&live(p)).length;
  const population=Math.max(0,Math.trunc(state?.population||0)),shopGoal=population>=24?Math.max(1,Math.floor(population/90)):0;
  const requiredShops=Math.max(0,shopGoal-shops.length-pendingShops);
  const idleShops=shops.filter(b=>(b.business?.status??'abierto')==='abierto'&&
    Math.max(0,(b.business?.lastLocalDemand||0)-(b.business?.lastLocalSales||0))===0&&
    Math.max(0,(b.business?.lastRegionalDemand||0)-(b.business?.lastRegionalSales||0))===0).length;
  const commercialShortage=idleShops?0:requiredShops;
  const activeShops=shops.filter(b=>b.business?.status==='abierto'&&((b.business?.lastSales||0)>0||(b.business?.lastInputUnits||0)>0)).length;
  const residents=buildings.filter(b=>b.kind==='home').flatMap(b=>b.residents||[]).filter(p=>p.workerEligible&&p.status==='buscando');
  const lowSkillSeekers=residents.filter(p=>Number(p.educationRank||0)<=1).length;
  const openFactoryJobs=buildings.filter(b=>b.kind==='factory'&&b.business?.status!=='cerrado').reduce((n,b)=>n+Math.max(0,Number(b.business?.jobSlots||b.jobSlots||0)-Number(b.business?.lastWorkers||0)),0);
  const factoryGoal=Math.min(12,Math.max(Math.ceil(activeShops/2),Math.ceil(Math.max(0,lowSkillSeekers-openFactoryJobs)/20))),factories=buildings.filter(b=>b.kind==='factory'&&b.business?.status!=='cerrado').length+projects.filter(p=>p.kind==='factory'&&live(p)).length;
  const factoryShortage=Math.max(0,factoryGoal-factories);
  const universitySeekers=residents.filter(p=>Number(p.educationRank||0)>=3).length,officeBuildings=buildings.filter(b=>b.kind==='office'&&b.business?.status!=='cerrado'),offices=officeBuildings.length,officeProjects=projects.filter(p=>p.kind==='office'&&live(p)&&!['pausada','suspendida'].includes(p.status)),pendingOffices=officeProjects.length;
  const officeOpenJobs=officeBuildings.reduce((n,b)=>n+Math.max(0,Number(b.business?.jobSlots||b.jobSlots||0)-Number(b.business?.lastWorkers??b.workersAssigned??0)),0);
  const pendingOfficeJobs=officeProjects.reduce((n,p)=>n+(p.density==='high'?40:p.density==='medium'?32:24),0),unplacedGraduates=Math.max(0,universitySeekers-officeOpenJobs-pendingOfficeJobs);
  // Only graduates still looking for work create demand. Vacancies in open offices
  // and jobs in offices already being built are counted before another project starts.
  const officeShortage=Math.min(12,Math.ceil(unplacedGraduates/24)),officeGoal=offices+pendingOffices+officeShortage;
  return{
    housing:{value:Math.min(100,Math.round(shortage/36*100)),shortage,vacancies,waiting},
    commercial:{value:shopGoal?Math.min(100,Math.round(commercialShortage/shopGoal*100)):0,shortage:commercialShortage,goal:shopGoal,existing:shops.length,pipeline:pendingShops,idle:idleShops},
    industry:{value:factoryGoal?Math.min(100,Math.round(factoryShortage/factoryGoal*100)):0,shortage:factoryShortage,goal:factoryGoal},
    office:{value:Math.min(100,Math.round(unplacedGraduates/24*100)),shortage:officeShortage,goal:officeGoal,universitySeekers,unplacedGraduates,openJobs:officeOpenJobs,pendingJobs:pendingOfficeJobs,existing:offices,pipeline:pendingOffices}
  };
}
