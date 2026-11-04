// Ciudad Viva Alfa 0.263: historia personal y grandes momentos, datos del motor.
const N=v=>Number.isFinite(Number(v))?Number(v):0;
const tile=(p)=>Array.isArray(p)?p.join(','):'';
const oper=b=>['operativo','habilitado','active'].includes(b?.status);
export function citizenName(resident){
 if(typeof resident?.name==='string'&&resident.name.trim())return resident.name.trim();
 return 'Vecino/a #'+String(resident?.id||'sin identificador').slice(-6).toUpperCase();
}
export function residentDirectory(state,limit=900){
 const records=[];
 for(const b of state?.buildings||[]){
  if(b.kind!=='home'||!Array.isArray(b.residents))continue;
  for(const p of b.residents){
   if(!p?.id)continue;
   records.push({id:String(p.id),name:citizenName(p),home:[b.x,b.y],homeName:b.name||'Vivienda',
    age:Number.isFinite(p.age)?p.age:null,status:p.status||'sin registrar',eligible:Boolean(p.workerEligible),
    employerId:p.employerId||null,employerName:p.employerName||null,
    monthlyWage:N(p.monthlyWage),unemploymentEpisodes:N(p.unemploymentEpisodes),
    unemploymentSinceDay:p.unemployedSinceDay??null,attendance:p.attendance??null,
    previousEmployer:p.previousEmployer||null,
    lastUnemploymentDurationDays:p.lastUnemploymentDurationDays??null});
   if(records.length>=limit)return records;
  }
 }
 return records;
}
export function findResident(state,id){
 return residentDirectory(state,Math.max(900,Math.min(2500,N(state?.population)+200))).find(p=>p.id===String(id))||null;
}
export function residentCommute(state,resident){
 if(!resident||resident.status!=='empleado'||!resident.employerName)return null;
 const workplaceId=String(resident.employerId||'').match(/-(-?\d+)-(-?\d+)$/);
 const workplace=(state?.workplaces||[]).find(w=>workplaceId&&w.x===Number(workplaceId[1])&&w.y===Number(workplaceId[2]))||
   (state?.workplaces||[]).find(w=>w.name===resident.employerName)||null;
 if(!workplace)return null;
 const trip=(state?.commutes||[]).find(t=>tile(t.from)===tile(resident.home)&&tile(t.to)===tile([workplace.x,workplace.y])&&Array.isArray(t.route)&&t.route.length>=2&&N(t.workers)>0);
 if(!trip)return null;
 return {route:trip.route,mode:trip.mode||'desconocido',reason:trip.reason||'trabajo',
  from:resident.home,to:[workplace.x,workplace.y],destination:workplace.name,passengers:N(trip.workers)};
}
function moment(day,id,title,detail,x,y,type='celebracion'){
 return {id,title,detail,day,x,y,type};
}
export function cityMomentCandidates(state){
 const day=Math.max(1,Math.floor(N(state?.day)||1));
 const buildings=state?.buildings||[],moments=[];
 const hospital=buildings.find(b=>b.serviceModel==='generalHospital'&&oper(b));
 if(hospital)moments.push(moment(day,'primer-hospital','Un hospital al servicio de la ciudad','Hospital habilitado: '+(hospital.name||'hospital municipal'),hospital.x,hospital.y,'salud'));
 const bus=(state?.busRoutes||[]).find(l=>l.operational&&N(l.effectiveBuses)>0&&Array.isArray(l.route)&&l.route.length>1);
 if(bus){const [x,y]=bus.route[0];moments.push(moment(day,'primera-linea-bus','Primera línea de colectivos en servicio','La línea '+(bus.name||bus.originName||'municipal')+' conecta barrios reales.',x,y,'transporte'))}
 const metro=(state?.metroLines||[]).find(l=>l.operational&&l.status==='active'&&Array.isArray(l.route)&&l.route.length>1);
 if(metro){const [x,y]=metro.route[0];moments.push(moment(day,'primera-linea-metro','Comenzó el transporte ferroviario','La línea '+(metro.name||'ferroviaria')+' está en servicio.',x,y,'transporte'))}
 const population=N(state?.population);
 const levels=[100,250,500,1000,2500,5000,10000,25000,50000].filter(level=>population>=level);
 if(levels.length){
  const level=levels.at(-1),home=buildings.find(b=>b.kind==='home'&&N(b.occupants)>0);
  moments.push(moment(day,'poblacion-'+level,'La ciudad llegó a '+level.toLocaleString('es-AR')+' habitantes',
   'El padrón actual registra '+Math.floor(population).toLocaleString('es-AR')+' habitantes.',home?.x??14,home?.y??10,'poblacion'));
 }
 const elections=(state?.government?.elections||[]).filter(e=>N(e.day)>0&&day-N(e.day)>=0&&day-N(e.day)<4);
 if(elections.length){
  const election=elections.at(-1),hall=buildings.find(b=>b.name==='Municipalidad'||b.kind==='civic');
  moments.push(moment(N(election.day),'eleccion-'+String(election.day),'Jornada electoral municipal',
   'Elección registrada en el historial de gobierno.',hall?.x??14,hall?.y??10,'eleccion'));
 }
 if(day>1&&(day-1)%360===0){
  const hall=buildings.find(b=>b.name==='Municipalidad'||b.kind==='civic');
  moments.push(moment(day,'aniversario-'+day,'Aniversario de la ciudad','Se cumplió un nuevo año de la partida municipal.',hall?.x??14,hall?.y??10,'aniversario'));
 }
 return moments;
}
export function recordLivingCity(state){
 if(!state||!Number.isFinite(Number(state.day)))return;
 const day=Math.max(1,Math.floor(N(state.day)));
 const living=state.livingCity||(state.livingCity={lastDay:0,people:{},stories:[],moments:[],momentIds:[]});
 living.people=living.people&&typeof living.people==='object'&&!Array.isArray(living.people)?living.people:{};
 living.stories=Array.isArray(living.stories)?living.stories:[];
 living.moments=Array.isArray(living.moments)?living.moments:[];
 living.momentIds=Array.isArray(living.momentIds)?living.momentIds:[];
 if(living.lastDay===day)return;
 const residents=residentDirectory(state,750),seen=new Set();
 for(const person of residents){
  seen.add(person.id);
  const previous=living.people[person.id],home=tile(person.home);
  const record={id:person.id,name:person.name,home,status:person.status,employerId:person.employerId,
   employerName:person.employerName,unemploymentEpisodes:person.unemploymentEpisodes};
  const add=(kind,detail)=>living.stories.push({id:person.id,kind,day,detail});
  if(!previous){
   add('registro','Primera aparición en el padrón de '+person.homeName+'.');
  }else{
   if(previous.home!==home)add('mudanza','Cambió su residencia a '+person.homeName+'.');
   if(previous.status!==person.status){
    if(person.status==='empleado')add('empleo','Consiguió empleo en '+(person.employerName||'un establecimiento registrado')+'.');
    else if(previous.status==='empleado')add('desempleo','Finalizó su vínculo de empleo con '+(previous.employerName||'el empleador anterior')+'.');
    else add('situacion','Su situación laboral pasó a '+person.status+'.');
   }else if(person.status==='empleado'&&previous.employerId!==person.employerId){
    add('cambio-trabajo','Cambió de empleo a '+(person.employerName||'otro establecimiento registrado')+'.');
   }
  }
  living.people[person.id]=record;
 }
 // No extrapolar la salida de un residente de la ventana de seguimiento como una defunción.
 const previousIds=Object.keys(living.people);
 if(previousIds.length>750){const keep=new Set(residents.map(p=>p.id));for(const id of previousIds)if(!keep.has(id))delete living.people[id]}
 living.stories=living.stories.slice(-1200);
 const currentIds=new Set(living.momentIds);
 for(const candidate of cityMomentCandidates(state)){
  if(currentIds.has(candidate.id))continue;
  if(candidate.id.startsWith('poblacion-')){
   // Si una ciudad cargada ya superó varios umbrales, solo celebramos el mayor observado.
   const max=Number(candidate.id.slice(10));
   for(const step of [100,250,500,1000,2500,5000,10000,25000,50000])if(step<=max)currentIds.add('poblacion-'+step);
  }
  living.moments.push(candidate);currentIds.add(candidate.id);
 }
 living.momentIds=[...currentIds].slice(-120);
 living.moments=living.moments.slice(-72);
 living.lastDay=day;
}
export function residentStory(state,id){
 const person=findResident(state,id);
 if(!person)return null;
 const history=(state?.livingCity?.stories||[]).filter(e=>e.id===person.id).slice(-9).reverse();
 const commute=residentCommute(state,person);
 return {person,history,commute,home:person.home,
  situation:person.status==='empleado'?'Trabaja en '+(person.employerName||'un establecimiento'):
    person.status==='buscando'?'Está buscando empleo':'Situación registrada: '+person.status,
  income:person.monthlyWage,school:null};
}
export function parkActivityPlan(state){
 const visits=new Map();
 for(const trip of state?.commutes||[]){
  if(trip.reason!=='ocio'||!Array.isArray(trip.to)||N(trip.workers)<=0)continue;
  const id=tile(trip.to);visits.set(id,(visits.get(id)||0)+N(trip.workers));
 }
 return (state?.buildings||[]).filter(b=>b.serviceModel==='urbanPark'&&oper(b)).map(b=>{
  const visitors=visits.get(tile([b.x,b.y]))||0;
  return {x:b.x,y:b.y,visitors,activities:visitors<=0?[]:
   ['paseo',...(visitors>=3?['descanso']:[]),...(visitors>=7?['juego']:[]),...(visitors>=12?['ejercicio']:[])]};
 }).filter(x=>x.visitors>0).slice(0,smallParkLimit(state));
}
function smallParkLimit(state){return N(state?.population)>10000?9:6}
export function rushHourPlan(state,minutes=720){
 const hour=((N(minutes)%1440)+1440)%1440/60,peak=(hour>=7&&hour<9.5)||(hour>=17&&hour<19.5);
 const loads=new Map();
 for(const trip of state?.commutes||[]){
  if(!Array.isArray(trip.route)||trip.route.length<2)continue;
  const vehicles=N(trip.vehicles);
  if(vehicles<=0)continue;
  for(const p of trip.route){
   if(!Array.isArray(p)||p.length!==2)continue;
   const id=tile(p),row=loads.get(id)||{x:p[0],y:p[1],vehicles:0,trafficFactor:0};
   row.vehicles+=vehicles;row.trafficFactor=Math.max(row.trafficFactor,N(trip.trafficFactor)||1);
   loads.set(id,row);
  }
 }
 const roads=new Set((state?.roads||[]).map(tile));
 const hotspots=[...loads.values()].filter(v=>roads.has(tile([v.x,v.y]))&&v.vehicles>=6).sort((a,b)=>
  (b.vehicles*b.trafficFactor)-(a.vehicles*a.trafficFactor)).slice(0,12);
 return {peak,hour,hotspots,totalCars:hotspots.reduce((n,h)=>n+h.vehicles,0)};
}
export function livingMomentVisuals(state){
 const day=N(state?.day),records=(state?.livingCity?.moments||[]).filter(m=>m&&Number.isInteger(m.x)&&Number.isInteger(m.y)&&day-N(m.day)>=0&&day-N(m.day)<=2);
 return records.slice(-3);
}
