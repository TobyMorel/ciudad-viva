// Terminales físicos y aforo diario de carga para trenes elevados.
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const validRoute=route=>Array.isArray(route)&&route.length>=5&&route.every((p,i)=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&(!i||Math.abs(p[0]-route[i-1][0])+Math.abs(p[1]-route[i-1][1])===1));
function activeRailEdges(state){
 const sites=new Map((state.railStations||[]).filter(s=>s.mode==='elevated'&&s.status==='active').map(s=>[[s.x,s.y].join(','),s])),edges=[];
 for(const line of state.metroLines||[]){
  if(line.mode!=='elevated'||line.status!=='active'||!line.operational)continue;
  const points=line.stations||[],route=line.route||[];if(points.length!==2||!validRoute(route))continue;
  const ends=points.map(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)?sites.get(p.join(',')):null);
  if(ends.some(x=>!x)||ends[0]===ends[1]||route[0].join(',')!==points[0].join(',')||route.at(-1).join(',')!==points[1].join(','))continue;
  for(const i of [0,1]){const originStation=ends[i],portStation=ends[1-i],path=i===0?route:route.slice().reverse();edges.push({line,originStation,portStation,route:path,distance:Math.max(1,path.length-1)})}
 }
 return edges;
}
export function freightCapacityMetrics(line){
 const raw=line?.freightCapacityPerDay,nominal=Math.max(0,Math.trunc(raw==null?Math.max(0,Math.trunc(line?.trainCount||0))*60:Number(raw)||0));
 const passengerCapacity=Math.max(0,Math.trunc(line?.dailyCapacity||0)),passengers=Math.max(0,Math.trunc(line?.dailyRiders||0));
 const occupied=passengerCapacity?Math.min(passengers,passengerCapacity):0;
 const available=passengerCapacity?Math.floor(nominal*(passengerCapacity-occupied)/passengerCapacity+1e-9):nominal;
 return{freightCapacityPerDay:nominal,freightAvailableCapacityPerDay:Math.max(0,available),passengerLoadPct:passengerCapacity?Math.round(occupied/passengerCapacity*100):0};
}
export function freightRoutesForFactoryPort(state,factory,port,roadRoute){
 if(!factory||factory.kind!=='factory'||!port||port.kind!=='port')return [];
 const edges=activeRailEdges(state),candidates=[],originAccess=new Map(),portAccess=new Map();
 for(const edge of edges){
  const fromKey=[edge.line.id,edge.originStation.x,edge.originStation.y].join(':');
  if(distance(factory,edge.originStation)<=2)originAccess.set(fromKey,roadRoute(factory,edge.originStation));
  const toKey=[edge.line.id,edge.portStation.x,edge.portStation.y].join(':');
  if(distance(port,edge.portStation)<=2)portAccess.set(toKey,roadRoute(port,edge.portStation));
 }
 for(const first of edges){
  if(distance(factory,first.originStation)>2)continue;
  const originAccessRoute=originAccess.get([first.line.id,first.originStation.x,first.originStation.y].join(':'));if(!originAccessRoute?.length)continue;
  for(const second of edges){
   if(first.line===second.line||distance(first.portStation,second.originStation)>2||distance(port,second.portStation)>2)continue;
   const portAccessRoute=portAccess.get([second.line.id,second.portStation.x,second.portStation.y].join(':'));if(!portAccessRoute?.length)continue;
   const legs=[first,second],total=Math.max(0,originAccessRoute.length-1)+first.distance+distance(first.portStation,second.originStation)+second.distance+Math.max(0,portAccessRoute.length-1);
   candidates.push({line:first.line,originStation:first.originStation,portStation:second.portStation,originAccessRoute,portAccessRoute,
    route:[...first.route,...second.route],distance:total,routingCost:total+36,transferCount:1,legs});
  }
  if(distance(port,first.portStation)<=2){
   const portAccessRoute=portAccess.get([first.line.id,first.portStation.x,first.portStation.y].join(':'));if(!portAccessRoute?.length)continue;
   const total=Math.max(0,originAccessRoute.length-1)+first.distance+Math.max(0,portAccessRoute.length-1);
   candidates.push({line:first.line,originStation:first.originStation,portStation:first.portStation,originAccessRoute,portAccessRoute,
    route:first.route,distance:total,routingCost:total,transferCount:0,legs:[first]});
  }
 }
 candidates.sort((a,b)=>(a.routingCost??a.distance)-(b.routingCost??b.distance)||a.distance-b.distance||String(a.line.id).localeCompare(String(b.line.id))||a.originStation.x-b.originStation.x||a.originStation.y-b.originStation.y);
 return candidates;
}
export function freightRouteForFactoryPort(state,factory,port,roadRoute,lineId=null){
 const routes=freightRoutesForFactoryPort(state,factory,port,roadRoute).filter(route=>lineId==null||(route.legs||[route]).some(leg=>String(leg.line.id)===String(lineId)));
 return routes[0]||null;
}
export function freightRoutesFromStationToPort(state,stationCoords,port,roadRoute,excludedLineIds=[]){
 if(!Array.isArray(stationCoords)||stationCoords.length!==2||!port||port.kind!=='port')return [];
 const station=(state.railStations||[]).find(site=>site.mode==='elevated'&&site.status==='active'&&site.x===stationCoords[0]&&site.y===stationCoords[1]);
 if(!station)return [];
 const excluded=new Set(excludedLineIds.map(String)),candidates=[];
 for(const edge of activeRailEdges(state)){
  if(excluded.has(String(edge.line.id)))continue;
  const transferDistance=distance(station,edge.originStation);if(transferDistance>2||distance(port,edge.portStation)>2)continue;
  const portAccessRoute=roadRoute(port,edge.portStation);if(!portAccessRoute?.length)continue;
  const total=transferDistance+edge.distance+Math.max(0,portAccessRoute.length-1);
  candidates.push({line:edge.line,originStation:edge.originStation,portStation:edge.portStation,originAccessRoute:[],portAccessRoute,
   route:edge.route,distance:total,routingCost:total,transferCount:0,legs:[edge]});
 }
 candidates.sort((a,b)=>a.routingCost-b.routingCost||a.distance-b.distance||String(a.line.id).localeCompare(String(b.line.id))||a.originStation.x-b.originStation.x||a.originStation.y-b.originStation.y);
 return candidates;
}
export function freightLegRoute(state,leg){
 if(!leg||typeof leg!=='object')return null;
 const line=(state.metroLines||[]).find(item=>String(item.id)===String(leg.lineId)&&item.mode==='elevated'&&item.status==='active'&&item.operational);
 if(!line||!Array.isArray(leg.originStation)||!Array.isArray(leg.portStation))return null;
 const originStation=(state.railStations||[]).find(site=>site.mode==='elevated'&&site.status==='active'&&site.x===leg.originStation[0]&&site.y===leg.originStation[1]);
 const portStation=(state.railStations||[]).find(site=>site.mode==='elevated'&&site.status==='active'&&site.x===leg.portStation[0]&&site.y===leg.portStation[1]);
 const points=line.stations||[],route=line.route||[];if(!originStation||!portStation||points.length!==2||!validRoute(route))return null;
 const forward=points[0].join(',')===leg.originStation.join(',')&&points[1].join(',')===leg.portStation.join(',');
 const reverse=points[1].join(',')===leg.originStation.join(',')&&points[0].join(',')===leg.portStation.join(',');if(!forward&&!reverse)return null;
 const path=forward?route:route.slice().reverse(),item={line,originStation,portStation,route:path,distance:Math.max(1,path.length-1)};return{...item,legs:[item]};
}
export function serializeFreightLegs(route){
 return(route.legs||[route]).map(leg=>({lineId:leg.line.id,originStation:[leg.originStation.x,leg.originStation.y],portStation:[leg.portStation.x,leg.portStation.y],route:leg.route.map(p=>[...p])}));
}
export function reserveFreightCapacity(line,originStation,portStation,quantity,day){
 quantity=Math.max(0,Math.trunc(Number(quantity)||0));day=Math.trunc(Number(day)||0);
 if(!quantity||!line||!originStation||!portStation)return false;
 const lineCapacity=freightCapacityMetrics(line).freightAvailableCapacityPerDay;
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
export function reserveFreightRoute(routes,quantity,day){
 for(const route of routes||[]){const leg=(route.legs||[route])[0];if(reserveFreightCapacity(leg.line,leg.originStation,leg.portStation,quantity,day))return route;}
 return null;
}
export function nextFreightDepartureDay(day,interval=3){
 interval=Math.max(1,Math.trunc(Number(interval)||1));const nextDay=Math.max(1,Math.trunc(Number(day)||1))+1;
 return nextDay+(interval-nextDay%interval)%interval;
}
export function refreshFreightTerminalRoles(state){
 const endpointLines=new Map();
 for(const edge of activeRailEdges(state))for(const site of [edge.originStation,edge.portStation]){const key=[site.x,site.y].join(','),ids=endpointLines.get(key)||new Set();ids.add(String(edge.line.id));endpointLines.set(key,ids)}
 for(const site of state.railStations||[]){
  const roles=[];
  if(site.mode==='elevated'&&site.status==='active'){
   const point={x:Number(site.x)||0,y:Number(site.y)||0};
   if((state.buildings||[]).some(b=>b.kind==='factory'&&b.business?.status==='abierto'&&distance(point,b)<=2))roles.push('industrial');
   if((state.buildings||[]).some(b=>b.kind==='port'&&['habilitado','operativo'].includes(b.status)&&distance(point,b)<=2))roles.push('port');
   const own=endpointLines.get([site.x,site.y].join(','))||new Set(),transfer=own.size>1||(state.railStations||[]).some(other=>other!==site&&distance(point,other)<=2&&[...(endpointLines.get([other.x,other.y].join(','))||[])].some(id=>!own.has(id)));
   if(transfer)roles.push('transfer');
  }
  site.freightRoles=roles;site.freightTerminal=roles.length>0;
 }
}
export function railFreightReport(state){
 refreshFreightTerminalRoles(state);
 const orders=state.supply?.portOrders||[],waiting=new Set(['pendiente','esperando tren programado','esperando capacidad ferroviaria','esperando acceso ferroviario']),lines=(state.metroLines||[]).filter(l=>l.mode==='elevated');
 return {
  terminals:(state.railStations||[]).filter(s=>s.freightTerminal).length,
 transferStations:(state.railStations||[]).filter(s=>s.freightRoles?.includes('transfer')).length,
  operationalLines:lines.filter(l=>l.operational).length,
  dailyCapacity:lines.filter(l=>l.operational).reduce((n,l)=>n+freightCapacityMetrics(l).freightCapacityPerDay,0),
  availableCapacityPerDay:lines.filter(l=>l.operational).reduce((n,l)=>n+freightCapacityMetrics(l).freightAvailableCapacityPerDay,0),
  passengerRiders:lines.filter(l=>l.operational).reduce((n,l)=>n+Math.max(0,Math.trunc(l.dailyRiders||0)),0),
  passengerLoadPct:Math.round(lines.filter(l=>l.operational).reduce((r,l)=>r+Math.min(Math.max(0,Math.trunc(l.dailyRiders||0)),Math.max(0,Math.trunc(l.dailyCapacity||0))),0)/Math.max(1,lines.filter(l=>l.operational).reduce((n,l)=>n+Math.max(0,Math.trunc(l.dailyCapacity||0)),0))*100),
  waitingUnits:orders.filter(o=>o.mode==='rail'&&(waiting.has(o.status)||o.status==='en puerto')).reduce((n,o)=>n+Math.max(0,Math.trunc(o.quantity||0)),0),
  inTransitUnits:orders.filter(o=>o.mode==='rail'&&o.status==='en tránsito ferroviario').reduce((n,o)=>n+Math.max(0,Math.trunc(o.quantity||0)),0),
  deliveredUnits:lines.reduce((n,l)=>n+Math.max(0,Math.trunc(l.freightDeliveredUnits||0)),0),
  freightRevenue:lines.reduce((n,l)=>n+Math.max(0,Math.trunc(l.freightRevenue||0)),0)
 };
}
