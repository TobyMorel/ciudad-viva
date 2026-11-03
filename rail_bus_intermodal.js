// Transbordos entre colectivos de superficie y trenes/subtes operativos.
// Se ejecuta después de asignar colectivos directos y antes del ferrocarril directo.
// Los pasajeros intermodales ocupan ambos vehículos pero se cuentan una sola vez.
const distance=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger);
function validatedStops(line,roads,closed){
 const path=line.route||[];
 if(path.length<2||!path.every(p=>valid(p)&&roads.has(p.join(','))&&!closed.has(p.join(','))))return [];
 if(path.slice(1).some((p,i)=>distance(p,path[i])!==1))return [];
 return (line.stops||[]).flatMap(s=>{
  const p=s?.at;
  if(!valid(p))return[];
  let i=s.routeIndex;
  if(!Number.isInteger(i)||i<0||i>=path.length||distance(path[i],p)!==0)i=path.findIndex(q=>distance(q,p)===0);
  return i>=0?[{p,i}]:[];
 });
}
function offers(busLines,railLines,trip){
 if(!valid(trip.from)||!valid(trip.to))return[];
 const results=[];
 for(const rail of railLines){
  const stations=rail.stations;
  if(!Array.isArray(stations)||stations.length!==2||!stations.every(valid)||!Array.isArray(rail.route)||rail.route.length<2)continue;
  const d=Math.max(1,rail.route.length-1),headway=Math.max(5,Number(rail.headwayMinutes)||30);
  for(const [entry,exit] of [[stations[0],stations[1]],[stations[1],stations[0]]]){
   const railMinutes=headway/2+d*(rail.mode==='elevated'?1:1.25);
   for(const {line,stops} of busLines){
    const busHeadway=Math.max(1,Number(line.headwayByWindow?.midday||line.headwayMinutes)||30);
    const busFare=Math.max(0,Math.round(Number(line.fare??.25)*100));
    const railFare=Math.max(0,Math.round(Number(rail.fareCents)||60));
    for(const start of stops)for(const end of stops){
     if(end.i<=start.i)continue;
     const busMinutes=busHeadway/2+(end.i-start.i)*1.8;
     // La segunda etapa recibe un 25% de descuento en el boleto, sin viajes ficticios.
     if(distance(trip.from,start.p)<=1&&distance(end.p,entry)<=1&&distance(exit,trip.to)<=2){
      const fares=[busFare,Math.round(railFare*.75)];
      const minutes=(distance(trip.from,start.p)+distance(end.p,entry)+distance(exit,trip.to))*4+busMinutes+railMinutes+2+fares.reduce((n,x)=>n+x,0)*.06;
      results.push({minutes,rail,bus:line,fares,direction:'bus-rail',transfer:[...entry]});
     }
     if(distance(trip.from,entry)<=2&&distance(exit,start.p)<=1&&distance(end.p,trip.to)<=1){
      const fares=[Math.round(busFare*.75),railFare];
      const minutes=(distance(trip.from,entry)+distance(exit,start.p)+distance(end.p,trip.to))*4+busMinutes+railMinutes+2+fares.reduce((n,x)=>n+x,0)*.06;
      results.push({minutes,rail,bus:line,fares,direction:'rail-bus',transfer:[...exit]});
     }
    }
   }
  }
 }
 return results.sort((a,b)=>a.minutes-b.minutes||String(a.rail.id).localeCompare(String(b.rail.id))||String(a.bus.id).localeCompare(String(b.bus.id))||a.direction.localeCompare(b.direction));
}
export function assignRailBusTransfers(state,trips,day){
 const roads=new Set((state.roads||[]).map(p=>p.join(',')));
 const closed=new Set((state.roadAssets||[]).filter(a=>a.accidentClosed||(a.quality??82)<25).map(a=>[a.x,a.y].join(',')));
 const buses=(state.busRoutes||[]).filter(l=>l.status==='active'&&l.operational)
  .map(line=>({line,stops:validatedStops(line,roads,closed)})).filter(b=>b.stops.length>=2);
 const rails=(state.metroLines||[]).filter(l=>l.status==='active'&&l.operational&&(l.dailyCapacity||0)>0);
 let metroRiders=0,railRiders=0,transfers=0;
 for(const trip of trips){
  if(!['compras','servicios','ocio'].includes(trip.reason)||!['auto','walk'].includes(trip.mode)||!valid(trip.from)||!valid(trip.to))continue;
  let remaining=Math.max(0,Math.trunc(trip.workers||0)-Math.trunc(trip.busRiders||0));
  if(!remaining)continue;
  const comparison=trip.mode==='walk'?2+(trip.distance||0)*4:7+(trip.distance||0)*2.5*1.25;
  for(const option of offers(buses,rails,trip)){
   if(!remaining)break;
   if(option.minutes>comparison*1.35)continue;
   const b=option.bus,l=option.rail;
   const busFree=Math.max(0,Math.trunc(b.capacityByWindow?.midday||0)-Math.trunc(b.ridersByWindow?.midday||0));
   const railFree=Math.max(0,Math.trunc(l.dailyCapacity||0)-Math.trunc(l.dailyRiders||0));
   const count=Math.min(remaining,busFree,railFree);
   if(!count)continue;
   remaining-=count;transfers+=count;l.dailyRiders+=count;
   const window=b.ridersByWindow||(b.ridersByWindow={});window.midday=(window.midday||0)+count;
   b.nonworkRiders=(b.nonworkRiders||0)+count;
   b.dailyRiders=(b.dailyRiders||0)+count;
   const busCents=option.fares[0];
   const railCents=option.fares[1];
   const home=trip.from.join(','),dayKey=String(day);
   const busLedger=(b.nonworkFaresByDay||(b.nonworkFaresByDay={}))[dayKey]||(b.nonworkFaresByDay[dayKey]={});
   busLedger[home]=(busLedger[home]||0)+count*busCents;
   const railLedger=(l.fareByDay||(l.fareByDay={}))[dayKey]||(l.fareByDay[dayKey]={});
   railLedger[home]=(railLedger[home]||0)+count*railCents;
   b.nonworkFareToday=Math.round(Object.values(busLedger).reduce((n,x)=>n+x,0))/100;
   b.nonworkFareDue=Math.round(Object.values(b.nonworkFaresByDay).reduce((n,row)=>n+Object.values(row).reduce((a,x)=>a+x,0),0))/100;
   trip.intermodalRiders=(trip.intermodalRiders||0)+count;
   trip.metroRiders=(trip.metroRiders||0)+count;
   trip.metroLineId=l.id;
   if(l.mode==='elevated'){
    trip.railRiders=(trip.railRiders||0)+count;trip.railLineId=l.id;railRiders+=count;
   }else metroRiders+=count;
   (trip.intermodalJourneys||(trip.intermodalJourneys=[])).push({
    busLineId:b.id,railLineId:l.id,mode:l.mode==='elevated'?'tren':'subte',
    direction:option.direction,riders:count,minutes:Math.round(option.minutes),
    fareCents:busCents+railCents,transferStop:option.transfer
   });
  }
 }
 return {metroRiders,railRiders,transfers};
}

export function assignRailRailTransfers(state,trips){
 const roads=new Set((state.roads||[]).map(p=>p.join(','))),stations=new Map();
 for(const site of state.railStations||[]){
  const mode=site.mode;if(site.status!=='active'||!['metro','elevated'].includes(mode)||!Number.isInteger(site.x)||!Number.isInteger(site.y))continue;
  const accessible=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>roads.has([site.x+dx,site.y+dy].join(',')));
  if(accessible){if(!stations.has(mode))stations.set(mode,new Set());stations.get(mode).add([site.x,site.y].join(','))}
 }
 const lines=[];
 for(const line of state.metroLines||[]){
  const mode=line.mode||'metro',points=line.stations,route=line.route||[];
  if(line.status!=='active'||!line.operational||!['metro','elevated'].includes(mode)||!Array.isArray(points)||points.length!==2||route.length<2||(line.dailyCapacity||0)<=0)continue;
  if(points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||!stations.get(mode)?.has(p.join(',')))||points[0].join(',')===points[1].join(','))continue;
  lines.push({line,points,mode});
 }
 const dayKey=String(Math.max(1,Math.trunc(state.day||1)));let transfers=0,metroRiders=0,railRiders=0;
 for(const trip of trips){
  if(!['compras','servicios','ocio'].includes(trip.reason)||!['auto','walk'].includes(trip.mode)||!Array.isArray(trip.from)||!Array.isArray(trip.to)||trip.from.length!==2||trip.to.length!==2||!trip.from.every(Number.isInteger)||!trip.to.every(Number.isInteger))continue;
  const start=trip.from,end=trip.to;
  let remaining=Math.max(0,Math.trunc(trip.workers||0)-Math.trunc(trip.busRiders||0)-Math.trunc(trip.intermodalRiders||0));
  if(!remaining)continue;
  const comparison=trip.mode==='walk'?2+(trip.distance||0)*4:7+(trip.distance||0)*2.5*1.25,options=[];
  for(const first of lines)for(const second of lines){
   if(first===second)continue;
   const firstMode=first.mode,secondMode=second.mode;
   const firstMinutes=(firstMode==='elevated'?4:8)+Math.max(5,first.line.headwayMinutes||30)/2+Math.max(1,first.line.route.length-1)*(firstMode==='elevated'?1:1.25);
   const secondMinutes=(secondMode==='elevated'?4:8)+Math.max(5,second.line.headwayMinutes||30)/2+Math.max(1,second.line.route.length-1)*(secondMode==='elevated'?1:1.25);
   for(const entryIndex of [0,1])for(const hubIndex of [0,1]){
    const firstHub=1-entryIndex,secondExit=1-hubIndex,entry=first.points[entryIndex],hub=first.points[firstHub],transfer=second.points[hubIndex],exit=second.points[secondExit];
    const walkIn=distance(start,entry),walkTransfer=distance(hub,transfer),walkOut=distance(exit,end);
    if(walkIn>3||walkTransfer>2||walkOut>3)continue;
    const minutes=walkIn*4+firstMinutes+4+walkTransfer*3+secondMinutes+walkOut*4;
    if(minutes>comparison*1.35)continue;
    options.push({minutes,first:first.line,second:second.line,entry,hub,transfer,exit,firstMode,secondMode});
   }
  }
  options.sort((a,b)=>a.minutes-b.minutes||String(a.first.id).localeCompare(String(b.first.id))||String(a.second.id).localeCompare(String(b.second.id))||a.entry.join(',').localeCompare(b.entry.join(','))||a.exit.join(',').localeCompare(b.exit.join(',')));
  for(const option of options){
   if(remaining<=0)break;
   const first=option.first,second=option.second;
   const firstFree=Math.max(0,Math.trunc(first.dailyCapacity||0)-Math.trunc(first.dailyRiders||0)),secondFree=Math.max(0,Math.trunc(second.dailyCapacity||0)-Math.trunc(second.dailyRiders||0));
   const count=Math.min(remaining,firstFree,secondFree);if(!count)continue;
   remaining-=count;transfers+=count;first.dailyRiders=(first.dailyRiders||0)+count;second.dailyRiders=(second.dailyRiders||0)+count;
   const fareOne=Math.max(0,Math.trunc(first.fareCents??(option.firstMode==='elevated'?85:60))),fareTwo=Math.floor(Math.max(0,Math.trunc(second.fareCents??(option.secondMode==='elevated'?85:60)))*.75+.5),home=start.join(',');
   const firstLedger=((first.fareByDay||(first.fareByDay={}))[dayKey]||(first.fareByDay[dayKey]={}));
   const secondLedger=((second.fareByDay||(second.fareByDay={}))[dayKey]||(second.fareByDay[dayKey]={}));
   firstLedger[home]=(firstLedger[home]||0)+count*fareOne;secondLedger[home]=(secondLedger[home]||0)+count*fareTwo;
   trip.intermodalRiders=(trip.intermodalRiders||0)+count;trip.metroRiders=(trip.metroRiders||0)+count;
   trip.metroLineId=first.id;trip.metroLineIds=[...new Set([...(trip.metroLineIds||[]),first.id,second.id])];
   const elevated=option.firstMode==='elevated'?first:option.secondMode==='elevated'?second:null;
   if(elevated){trip.railRiders=(trip.railRiders||0)+count;trip.railLineId=elevated.id;railRiders+=count}
   if(option.firstMode==='metro'||option.secondMode==='metro')metroRiders+=count;
   (trip.intermodalJourneys||(trip.intermodalJourneys=[])).push({
    type:'rail-rail',railLineIds:[first.id,second.id],
    modes:[option.firstMode==='elevated'?'tren':'subte',option.secondMode==='elevated'?'tren':'subte'],
    direction:'rail-rail',riders:count,minutes:Math.round(option.minutes),fareCents:fareOne+fareTwo,
    fareByLineCents:[fareOne,fareTwo],transferStations:[option.hub,option.transfer]});
  }
 }
 return{metroRiders,railRiders,transfers,railTransfers:transfers};
}
