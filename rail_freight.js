// Terminales físicos y aforo diario de carga para trenes elevados.
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const validRoute=route=>Array.isArray(route)&&route.length>=5&&route.every((p,i)=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&(!i||Math.abs(p[0]-route[i-1][0])+Math.abs(p[1]-route[i-1][1])===1));
export function freightRouteForFactoryPort(state,factory,port,roadRoute,lineId=null){
 if(!factory||factory.kind!=='factory'||!port||port.kind!=='port')return null;
 const sites=(state.railStations||[]).filter(s=>s.mode==='elevated'&&s.status==='active'),candidates=[];
 for(const line of state.metroLines||[]){
  if(lineId!=null&&String(line.id)!==String(lineId))continue;
  if(line.mode!=='elevated'||line.status!=='active'||!line.operational)continue;
  const points=line.stations||[],route=line.route||[];if(points.length!==2||!validRoute(route))continue;
  const ends=points.map(p=>sites.find(s=>s.x===p[0]&&s.y===p[1]));if(!ends[0]||!ends[1]||ends[0]===ends[1])continue;
  for(const originIndex of [0,1]){
   const origin=ends[originIndex],destination=ends[1-originIndex];
   if(distance(factory,origin)>2||distance(port,destination)>2)continue;
   const originAccess=roadRoute(factory,origin),portAccess=roadRoute(port,destination);if(!originAccess?.length||!portAccess?.length)continue;
   const railRoute=originIndex===0?route:[...route].reverse(),totalDistance=Math.max(0,originAccess.length-1)+Math.max(1,railRoute.length-1)+Math.max(0,portAccess.length-1);
   candidates.push({line,originStation:origin,portStation:destination,originAccessRoute:originAccess,portAccessRoute:portAccess,route:railRoute,distance:totalDistance});
  }
 }
 candidates.sort((a,b)=>a.distance-b.distance||String(a.line.id).localeCompare(String(b.line.id))||a.originStation.x-b.originStation.x||a.originStation.y-b.originStation.y);
 return candidates[0]||null;
}
export function reserveFreightCapacity(line,originStation,portStation,quantity,day){
 quantity=Math.max(0,Math.trunc(Number(quantity)||0));day=Math.trunc(Number(day)||0);
 if(!quantity||!line||!originStation||!portStation)return false;
 const lineCapacity=Math.max(0,Math.trunc(line.freightCapacityPerDay||Math.max(0,Math.trunc(line.trainCount||0))*60));
 const terminals=[originStation,portStation],usages=terminals.map(site=>({
  capacity:Math.max(0,Math.trunc(site.freightCapacityPerDay||120)),
  used:site.freightUsageDay===day?Math.max(0,Math.trunc(site.freightUsedToday||0)):0
 }));
 const lineUsed=line.freightUsageDay===day?Math.max(0,Math.trunc(line.freightUsedToday||0)):0;
 if(lineCapacity<quantity||lineUsed+quantity>lineCapacity||usages.some(x=>x.capacity<quantity||x.used+quantity>x.capacity))return false;
 if(line.freightUsageDay!==day){line.freightUsageDay=day;line.freightUsedToday=0}line.freightUsedToday+=quantity;
 terminals.forEach((site,i)=>{if(site.freightUsageDay!==day){site.freightUsageDay=day;site.freightUsedToday=0}site.freightUsedToday+=quantity;if(!site.freightCapacityPerDay)site.freightCapacityPerDay=usages[i].capacity});
 return true;
}
export function nextFreightDepartureDay(day,interval=3){
 interval=Math.max(1,Math.trunc(Number(interval)||1));const nextDay=Math.max(1,Math.trunc(Number(day)||1))+1;
 return nextDay+(interval-nextDay%interval)%interval;
}
export function refreshFreightTerminalRoles(state){
 for(const site of state.railStations||[]){
  const roles=[];
  if(site.mode==='elevated'&&site.status==='active'){
   const point={x:Number(site.x)||0,y:Number(site.y)||0};
   if((state.buildings||[]).some(b=>b.kind==='factory'&&b.business?.status==='abierto'&&distance(point,b)<=2))roles.push('industrial');
   if((state.buildings||[]).some(b=>b.kind==='port'&&['habilitado','operativo'].includes(b.status)&&distance(point,b)<=2))roles.push('port');
  }
  site.freightRoles=roles;site.freightTerminal=roles.length>0;
 }
}
export function railFreightReport(state){
 refreshFreightTerminalRoles(state);
 const orders=state.supply?.portOrders||[],waiting=new Set(['pendiente','esperando tren programado','esperando capacidad ferroviaria','esperando acceso ferroviario']),lines=(state.metroLines||[]).filter(l=>l.mode==='elevated');
 return {
  terminals:(state.railStations||[]).filter(s=>s.freightTerminal).length,
  operationalLines:lines.filter(l=>l.operational).length,
  dailyCapacity:lines.filter(l=>l.operational).reduce((n,l)=>n+Math.max(0,Math.trunc(l.freightCapacityPerDay||Math.max(0,Math.trunc(l.trainCount||0))*60)),0),
  waitingUnits:orders.filter(o=>o.mode==='rail'&&(waiting.has(o.status)||o.status==='en puerto')).reduce((n,o)=>n+Math.max(0,Math.trunc(o.quantity||0)),0),
  inTransitUnits:orders.filter(o=>o.mode==='rail'&&o.status==='en tránsito ferroviario').reduce((n,o)=>n+Math.max(0,Math.trunc(o.quantity||0)),0),
  deliveredUnits:lines.reduce((n,l)=>n+Math.max(0,Math.trunc(l.freightDeliveredUnits||0)),0),
  freightRevenue:lines.reduce((n,l)=>n+Math.max(0,Math.trunc(l.freightRevenue||0)),0)
 };
}
