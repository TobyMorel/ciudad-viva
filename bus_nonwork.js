// Viajes de compras, servicios y ocio en colectivos existentes, sin crear población.
const WINDOW='midday';
const distance=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
function stops(line){const path=line.route||[];return(line.stops||[]).flatMap(stop=>{const at=stop?.at;if(!Array.isArray(at)||at.length!==2)return[];let i=stop.routeIndex;if(!Number.isInteger(i)||i<0||i>=path.length||distance(path[i],at)!==0)i=path.findIndex(p=>distance(p,at)===0);return i<0?[]:[{at,i}]})}
function offers(lines,trip){
 if(!Array.isArray(trip.from)||!Array.isArray(trip.to))return[];
 const info=[],results=[];
 for(const line of lines){
  const st=stops(line),origins=st.filter(s=>distance(s.at,trip.from)<=1),ends=st.filter(s=>distance(s.at,trip.to)<=1);info.push({line,st,origins,ends});
  for(const p of origins)for(const q of ends){if(q.i<=p.i)continue;const h=line.headwayByWindow?.[WINDOW]||line.headwayMinutes||30,fare=Math.max(0,Math.round(Number(line.fare??.25)*100)),minutes=(distance(p.at,trip.from)+distance(q.at,trip.to))*4+h/2+(q.i-p.i)*1.8+fare*.06;results.push({minutes,legs:[line],fares:[fare],transferStop:null})}
 }
 for(const first of info)for(const second of info){if(first===second)continue;
  for(const p of first.origins)for(const q of second.ends)for(const ta of first.st){if(ta.i<=p.i)continue;
   for(const tb of second.st){if(tb.i>=q.i||distance(ta.at,tb.at)>1)continue;
    const h1=first.line.headwayByWindow?.[WINDOW]||first.line.headwayMinutes||30,h2=second.line.headwayByWindow?.[WINDOW]||second.line.headwayMinutes||30,fares=[Math.max(0,Math.round(Number(first.line.fare??.25)*100)),Math.max(0,Math.round(Number(second.line.fare??.25)*65))],minutes=(distance(p.at,trip.from)+distance(q.at,trip.to))*4+(h1+h2)/2+(ta.i-p.i+q.i-tb.i)*1.8+2+distance(ta.at,tb.at)*4+fares.reduce((a,b)=>a+b,0)*.06;
    results.push({minutes,legs:[first.line,second.line],fares,transferStop:ta.at});
   }
  }
 }
 return results.sort((a,b)=>a.minutes-b.minutes||a.legs.length-b.legs.length||a.legs.map(l=>String(l.id)).join('|').localeCompare(b.legs.map(l=>String(l.id)).join('|')));
}
export function assignBusNonworkPassengers(state,trips){
 const day=Math.max(1,Math.trunc(state.day||1)),month=Math.floor((day-1)/30),lines=(state.busRoutes||[]).filter(l=>l.status==='active'&&l.operational&&(l.route||[]).length>1&&stops(l).length>=2).sort((a,b)=>String(a.id||'').localeCompare(String(b.id||'')));
 for(const l of state.busRoutes||[]){if(l.nonworkFareMonth!==month){l.nonworkFareMonth=month;l.nonworkFaresByDay={}}(l.nonworkFaresByDay||(l.nonworkFaresByDay={}))[String(day)]={};l.nonworkRiders=0;l.nonworkFareToday=0}
 let total=0,transfers=0;
 for(const trip of trips){
  delete trip.busRiders;delete trip.busJourneys;
  if(!['compras','servicios','ocio'].includes(trip.reason)||!['auto','walk'].includes(trip.mode)||(trip.workers||0)<=0)continue;
  let remaining=Math.trunc(trip.workers),comparison=trip.mode==='walk'?2+(trip.distance||0)*4:7+(trip.distance||0)*2.5*1.25;
  for(const option of offers(lines,trip)){
   if(remaining<=0)break;if(option.minutes>comparison*(option.legs.length===2?1.35:1.45))continue;
   const available=Math.min(...option.legs.map(l=>Math.max(0,Math.trunc(l.capacityByWindow?.[WINDOW]||0)-Math.trunc(l.ridersByWindow?.[WINDOW]||0))));
   const taken=Math.min(remaining,available);if(!taken)continue;
   remaining-=taken;total+=taken;if(option.legs.length===2)transfers+=taken;
   trip.busRiders=(trip.busRiders||0)+taken;
   (trip.busJourneys||(trip.busJourneys=[])).push({lineIds:option.legs.map(l=>l.id),riders:taken,fare:option.fares.reduce((n,f)=>n+f,0)/100,minutes:Math.round(option.minutes),transferStop:option.transferStop});
   const home=trip.from.join(',');
   for(let i=0;i<option.legs.length;i++){const l=option.legs[i],window=l.ridersByWindow||(l.ridersByWindow={});window[WINDOW]=(window[WINDOW]||0)+taken;l.nonworkRiders+=taken;const daily=l.nonworkFaresByDay[String(day)];daily[home]=(daily[home]||0)+taken*option.fares[i]}
  }
  if(trip.busRiders){if(trip.mode==='auto'){trip.vehicles=Math.ceil(remaining/1.4);trip.dailyEmissionsKg=Math.round(trip.vehicles*(trip.distance||0)*.18*2*100)/100}trip.busLineIds=trip.busJourneys[0].lineIds;trip.busLineId=trip.busLineIds[0]}
 }
 for(const l of state.busRoutes||[]){l.nonworkFareToday=Math.round(Object.values(l.nonworkFaresByDay[String(day)]).reduce((n,v)=>n+v,0))/100;l.nonworkFareDue=Math.round(Object.values(l.nonworkFaresByDay).reduce((n,record)=>n+Object.values(record).reduce((a,v)=>a+v,0),0))/100;if(lines.includes(l))l.dailyRiders=(l.ridersThisPass||0)+(l.returnRidersThisPass||0)+l.nonworkRiders}
 return{busNonworkPassengers:total,busNonworkTransfers:transfers,busNonworkFareRevenue:Math.round(lines.reduce((n,l)=>n+l.nonworkFareToday,0)*100)/100};
}
export function collectBusNonworkFares(state){
 const homes=new Map((state.buildings||[]).filter(b=>b.kind==='home').map(b=>[[b.x,b.y].join(','),b]));let received=0;
 for(const l of state.busRoutes||[]){
  const owed={};for(const daily of Object.values(l.nonworkFaresByDay||{}))for(const [key,cents] of Object.entries(daily))owed[key]=(owed[key]||0)+cents;
  let paid=0;for(const key of Object.keys(owed).sort()){const home=homes.get(key);if(!home)continue;const amount=Math.min(Math.floor((owed[key]+50)/100),Math.max(0,Math.trunc(home.householdCash||0)));home.householdCash=Math.max(0,(home.householdCash||0)-amount);paid+=amount}
  l.nonworkFareCollected=paid;l.monthlyFareRevenue=(l.monthlyFareRevenue||0)+paid;received+=paid;
 }
 return received;
}
