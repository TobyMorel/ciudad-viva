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
  const factoryGoal=Math.min(6,Math.ceil(activeShops/2)),factories=buildings.filter(b=>b.kind==='factory'&&b.business?.status!=='cerrado').length+projects.filter(p=>p.kind==='factory'&&live(p)).length;
  const factoryShortage=Math.max(0,factoryGoal-factories);
  return{
    housing:{value:Math.min(100,Math.round(shortage/36*100)),shortage,vacancies,waiting},
    commercial:{value:shopGoal?Math.min(100,Math.round(commercialShortage/shopGoal*100)):0,shortage:commercialShortage,goal:shopGoal,existing:shops.length,pipeline:pendingShops,idle:idleShops},
    industry:{value:factoryGoal?Math.min(100,Math.round(factoryShortage/factoryGoal*100)):0,shortage:factoryShortage,goal:factoryGoal}
  };
}
