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
  if(!['compras','servicios'].includes(trip.reason)||!['auto','walk'].includes(trip.mode)||!valid(trip.from)||!valid(trip.to))continue;
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
