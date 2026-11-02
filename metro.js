// Metro municipal: paridad con metro.py, estaciones en edificios existentes.
export const METRO_TRAIN_COST=2400, METRO_SEATS=80, METRO_FARE_CENTS=60;
const STAGES=['Estudios y permisos','Excavación y sostenimiento','Vías y estaciones','Inspección y habilitación'];
const distance=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
const active=b=>['habilitado','operativo'].includes(b.status||'operativo');
export function metroStationCatalog(s){
 const roads=new Set((s.roads||[]).map(p=>p.join(',')));
 return (s.buildings||[]).filter(b=>['home','shop','civic','school','hotel','airport','port','depot','factory'].includes(b.kind)&&active(b)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([x,y])=>roads.has([b.x+x,b.y+y].join(','))))
 .sort((a,b)=>a.x-b.x||a.y-b.y).slice(0,80).map(b=>({point:[b.x,b.y],name:b.name||b.kind,label:`${b.name||b.kind} · ${b.x+1},${b.y+1}`}));
}
function routeBetween(a,b){const points=[[...a]];let[x,y]=a;while(x!==b[0]){x+=x<b[0]?1:-1;points.push([x,y])}while(y!==b[1]){y+=y<b[1]?1:-1;points.push([x,y])}return points}
export function planMetro(s,from,to,trains=1){
 const entries=metroStationCatalog(s),a=entries.find(r=>Array.isArray(from)&&distance(r.point,from)===0),b=entries.find(r=>Array.isArray(to)&&distance(r.point,to)===0);
 if(!a||!b||a===b)throw Error('Elegí dos edificios distintos con acceso vial para las estaciones.');
 const route=routeBetween(from,to),d=route.length-1;
 if(d<3||d>26)throw Error('Las estaciones deben separarse de 3 a 26 tramos.');
 if(route.some(p=>p[0]===24||p[0]===25))throw Error('La primera línea no puede atravesar el cauce del río.');
 const lines=s.metroLines||(s.metroLines=[]);
 if(lines.length>=5)throw Error('La red admite hasta cinco líneas en esta etapa.');
 if(lines.some(line=>line.status!=='retired'&&line.stations?.every(p=>[from,to].some(q=>distance(p,q)===0))))throw Error('Ya existe una línea entre esas estaciones.');
 trains=Number(trains);if(![1,2,3].includes(trains))throw Error('La flota inicial permite de uno a tres trenes.');
 const construction=12500+d*1150+4400,total=construction+trains*METRO_TRAIN_COST,reserved=(s.projects||[]).filter(p=>!p.privatePaid).reduce((sum,p)=>sum+Math.max(0,(p.cost||0)-(p.paid||0)),0);
 if((s.money||0)-reserved<total)throw Error(`La inversión requiere $ ${total.toLocaleString('es-AR')} de fondos disponibles.`);
 s.money-=total;const day=Math.max(1,Math.trunc(s.day||1));
 const line={id:`metro-${day}-${lines.length+1}`,name:`Línea ${lines.length+1}`,stations:[from,to],stationNames:[a.name,b.name],route,status:'building',stageIndex:0,stage:STAGES[0],elapsed:0,duration:72+d*5,constructionCost:construction,purchaseCost:total,trainCount:trains,fareCents:METRO_FARE_CENTS,createdDay:day,dailyRiders:0,monthlyFareRevenue:0,operational:false,powerRequiredKw:55+trains*35};
 lines.push(line);return line;
}
export function advanceMetroDay(s){
 for(const line of s.metroLines||[]){
  if(line.status!=='building')continue;
  if((s.jobs||0)<=0){line.pauseReason='La obra espera puestos de trabajo y cuadrillas disponibles.';continue}
  line.pauseReason=null;line.elapsed=Math.min(line.duration,(line.elapsed||0)+1);
  const ratio=line.elapsed/Math.max(1,line.duration);
  line.stageIndex=ratio<.12?0:ratio<.58?1:ratio<.94?2:3;line.stage=STAGES[line.stageIndex];
  if(line.elapsed>=line.duration){line.status='active';line.stage='Habilitada';line.completedDay=s.day}
 }
}
export function metroPowerAvailable(s,line){
 const total=(s.buildings||[]).filter(b=>b.kind==='powerPlant'&&active(b)).reduce((sum,b)=>sum+Math.max(0,b.generationKw??900)*Math.max(.2,Math.min(1,(b.quality??82)/82)),0);
 return total+Math.max(0,s.utilities?.basePowerCapacityKw||0)>=(line.powerRequiredKw||90);
}
export function metroRefresh(s){
 const funding=Math.max(0,Math.min(1,s.finance?.programBudgets?.mobilityFundingFactor??1));
 for(const line of s.metroLines||[]){
  const activeLine=line.status==='active',energy=metroPowerAvailable(s,line),ready=activeLine&&(line.trainCount||0)>0&&energy&&funding>=.5;
  line.operational=Boolean(ready);
  line.pauseReason=line.status==='building'?'Obra todavía en curso':line.status==='paused'?'Servicio pausado':activeLine&&!line.trainCount?'Sin trenes':activeLine&&!energy?'Electricidad insuficiente':activeLine&&funding<.5?'Presupuesto de movilidad insuficiente':null;
  const d=Math.max(1,(line.route?.length||2)-1),n=line.trainCount||0;
  line.headwayMinutes=Math.max(5,Math.ceil(d*4/Math.max(1,n)));
  line.dailyCapacity=ready?n*METRO_SEATS*3:0;
  line.monthlyOperatingCost=ready?Math.round(230+85*d+140*n+(line.powerRequiredKw||0)*.7):0;
  line.energyKw=ready?line.powerRequiredKw||0:0;
 }
}
export function metroAction(s,action,data){
 if(action==='planMetroLine')return planMetro(s,data.from,data.to,data.trains??1);
 const line=(s.metroLines||[]).find(l=>l.id===data.id);if(!line)throw Error('La línea de subte ya no existe.');
 if(action==='buyMetroTrain'){
  if(!['active','paused'].includes(line.status)||(line.trainCount||0)>=5)throw Error('Solo se amplían líneas habilitadas, hasta cinco trenes.');
  if((s.money||0)<METRO_TRAIN_COST)throw Error('No hay fondos para otro tren.');
  s.money-=METRO_TRAIN_COST;line.trainCount++;
 }else if(action==='pauseMetroLine'){
  if(line.status!=='active')throw Error('La línea no está activa.');line.status='paused';
 }else if(action==='resumeMetroLine'){
  if(line.status!=='paused')throw Error('La línea no está en pausa.');line.status='active';
 }else throw Error('Acción de subte desconocida.');
 metroRefresh(s);return line;
}
export function metroAssignPassengers(s,trips){
 metroRefresh(s);const day=Math.max(1,Math.trunc(s.day||1)),month=Math.floor((day-1)/30);
 for(const line of s.metroLines||[]){if(line.fareMonth!==month){line.fareMonth=month;line.fareByDay={}}line.dailyRiders=0;(line.fareByDay||(line.fareByDay={}))[String(day)]={}}
 let total=0;
 for(const trip of trips){
  if(!['compras','servicios'].includes(trip.reason)||!['auto','walk'].includes(trip.mode)||!Array.isArray(trip.from)||!Array.isArray(trip.to))continue;
  let remaining=Math.max(0,(trip.workers||0)-(trip.busRiders||0));
  for(const line of s.metroLines||[]){
   if(!remaining||!line.operational)continue;const [a,b]=line.stations;
   const accessible=(distance(a,trip.from)<=2&&distance(b,trip.to)<=2)||(distance(b,trip.from)<=2&&distance(a,trip.to)<=2);
   if(!accessible)continue;
   const minutes=8+line.headwayMinutes/2+(line.route.length-1)*1.25,carMinutes=7+(trip.distance||0)*2.5;
   if(minutes>carMinutes*1.3)continue;
   const count=Math.min(remaining,Math.max(0,line.dailyCapacity-line.dailyRiders));if(!count)continue;
   line.dailyRiders+=count;remaining-=count;total+=count;trip.metroRiders=(trip.metroRiders||0)+count;trip.metroLineId=line.id;
   const home=trip.from.join(','),fare=line.fareByDay[String(day)];fare[home]=(fare[home]||0)+count*line.fareCents;
  }
  if(trip.metroRiders&&trip.mode==='auto'){
   const cars=Math.max(0,(trip.workers||0)-(trip.busRiders||0)-trip.metroRiders);
   trip.vehicles=Math.ceil(cars/1.4);trip.dailyEmissionsKg=Math.round(trip.vehicles*(trip.distance||0)*.18*2*100)/100;
  }
 }
 for(const line of s.metroLines||[])line.fareDue=Math.round(Object.values(line.fareByDay).reduce((n,d)=>n+Object.values(d).reduce((a,b)=>a+b,0),0))/100;
 return{metroRiders:total,metroLinesOperational:(s.metroLines||[]).filter(l=>l.operational).length};
}
export function settleMetroMonth(s){
 const homes=new Map((s.buildings||[]).filter(b=>b.kind==='home').map(b=>[[b.x,b.y].join(','),b]));metroRefresh(s);
 let income=0,cost=0;
 for(const line of s.metroLines||[]){
  cost+=line.monthlyOperatingCost||0;let paid=0;
  for(const daily of Object.values(line.fareByDay||{}))for(const [key,cents] of Object.entries(daily)){
   const home=homes.get(key);if(!home)continue;const charge=Math.min(Math.floor((cents+50)/100),Math.max(0,Math.trunc(home.householdCash||0)));home.householdCash-=charge;paid+=charge;
  }
  line.monthlyFareRevenue=paid;income+=paid;line.fareByDay={};line.fareMonth=Math.floor((Math.max(1,Math.trunc(s.day||1))-1)/30);
 }
 return{income,cost};
}
