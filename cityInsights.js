import {growthDemand} from './growth_demand.js?v=0.287';
import {recordLivingCity} from './living_city.js';

// Lecturas deterministas de la ciudad: nunca crean residentes, dinero ni cobertura.
export const DISTRICTS=Object.freeze([
 {id:'oeste',name:'Barrio del Oeste',min:-Infinity,max:10,x:6,y:10},
 {id:'centro',name:'Centro',min:10,max:18,x:14,y:10},
 {id:'puerto',name:'Barrio del Puerto',min:18,max:Infinity,x:21,y:10}
]);
const number=value=>Number.isFinite(Number(value))?Number(value):0;
const kindCount=(items,kind)=>items.filter(item=>item?.kind===kind).length;
const key=(x,y)=>String(x)+','+String(y);
const directions=[[1,0],[-1,0],[0,1],[0,-1]];
const reachableRoads=roads=>{
 const available=new Set(roads.map(r=>key(r[0],r[1])));
 const seed=available.has('4,10')?'4,10':null;
 if(!seed)return new Map();
 const distances=new Map([[seed,0]]),queue=[seed];
 for(let i=0;i<queue.length;i++){
  const current=queue[i],[x,y]=current.split(',').map(Number);
  for(const [dx,dy] of directions){
   const next=key(x+dx,y+dy);
   if(available.has(next)&&!distances.has(next)){distances.set(next,distances.get(current)+1);queue.push(next)}
  }
 }
 return distances;
};
const touchingRoad=(x,y,roadSet)=>directions.some(([dx,dy])=>roadSet.has(key(x+dx,y+dy)));
const ageYear=state=>2026+Math.floor((Math.max(1,number(state?.day))-1)/360);
export function collectNeighborhoods(state){
 const buildings=state?.buildings||[],roads=state?.roads||[],projects=state?.projects||[],history=state?.neighborhoodHistory?.snapshots||[];
 const report=state?.governmentReport?.districts||[];
 return DISTRICTS.map(d=>{
  const local=buildings.filter(b=>number(b.x)>=d.min&&number(b.x)<d.max);
  const homes=local.filter(b=>b.kind==='home'),shops=kindCount(local,'shop'),factories=kindCount(local,'factory');
  const parks=local.filter(b=>b.serviceModel==='urbanPark').length;
  const schools=kindCount(local,'school'),clinics=local.filter(b=>['clinic','medicalCenter','generalHospital'].includes(b.serviceModel)).length;
  const population=homes.reduce((sum,b)=>sum+Math.max(0,number(b.occupants)),0);
  const streetCount=roads.filter(r=>r[0]>=d.min&&r[0]<d.max).length;
  const underConstruction=projects.filter(p=>p.x>=d.min&&p.x<d.max).length;
  const values=homes.flatMap(b=>['powerServedPct','waterServedPct','wastewaterTreatedPct'].map(k=>b.utilityAccess?.[k]).filter(v=>Number.isFinite(Number(v))));
  const supplyPct=values.length?Math.round(values.reduce((s,v)=>s+number(v),0)/values.length):null;
  const conditionValues=local.filter(b=>Number.isFinite(Number(b.urbanCondition))).map(b=>number(b.urbanCondition));
  const condition=conditionValues.length?Math.round(conditionValues.reduce((a,v)=>a+v,0)/conditionValues.length):null;
  const builtYears=local.map(b=>number(b.yearBuilt)).filter(y=>y>=1900&&y<=ageYear(state));
  const oldestYear=builtYears.length?Math.min(...builtYears):null;
  const heritage=local.filter(b=>b.heritageEligible||b.heritageProtected||b.heritageStatus==='protegido').length;
  let character='En formación',reason='Todavía tiene pocas actividades; los próximos edificios definirán su identidad.';
  if(factories>=2&&factories>=shops){character='Productivo';reason='Concentra actividad industrial y puestos de trabajo.'}
  else if(parks>=2&&parks>=shops){character='Verde y residencial';reason='Sus plazas acompañan a las viviendas.'}
  else if(shops>=2&&shops>factories){character='Comercial';reason='Los locales y las compras marcan el ritmo del barrio.'}
  else if(population>0){character='Residencial';reason='Las familias ya viven y usan los servicios de este sector.'}
  const gov=report.find(item=>item.id===d.id);
  const notes=history.map(entry=>({day:entry.day,month:entry.month,record:entry.districts?.find(item=>item.id===d.id)})).filter(entry=>entry.record);
  const label=notes.length>1&&notes[notes.length-1].record.population>notes[notes.length-2].record.population?'La población creció en el último registro.':notes.length>1&&notes[notes.length-1].record.population<notes[notes.length-2].record.population?'La población bajó en el último registro.':'La identidad cambia con los edificios y sus habitantes.';
  return {...d,population,homes:homes.length,shops,factories,parks,schools,clinics,streets:streetCount,projects:underConstruction,supplyPct,condition,oldestYear,heritage,character,reason,trend:label,support:Number.isFinite(Number(gov?.support))?number(gov.support):null};
 });
}
const CITY_MISSIONS=Object.freeze([
 {id:'streets',title:'El primer camino',description:'Construí una calle conectada a la entrada.',goal:2,measure:s=>Math.max(0,(s.roads||[]).length),action:{type:'tool',tool:'road'}},
 {id:'electricity',title:'Que se haga la luz',description:'Colocá una central eléctrica.',goal:1,measure:s=>kindCount(s.buildings||[],'powerPlant')+kindCount(s.projects||[],'powerPlant'),action:{type:'tool',tool:'powerPlant'}},
 {id:'water',title:'Agua para todos',description:'Instalá una planta potabilizadora.',goal:1,measure:s=>kindCount(s.buildings||[],'waterPlant')+kindCount(s.projects||[],'waterPlant'),action:{type:'tool',tool:'waterPlant'}},
 {id:'sewer',title:'Un barrio limpio',description:'Instalá una planta depuradora.',goal:1,measure:s=>kindCount(s.buildings||[],'wastewaterPlant')+kindCount(s.projects||[],'wastewaterPlant'),action:{type:'tool',tool:'wastewaterPlant'}},
 {id:'zones',title:'Lugar para vivir',description:'Reservá tres parcelas residenciales.',goal:3,measure:s=>(s.zones||[]).filter(z=>z.kind==='home').length+(s.buildings||[]).filter(b=>b.kind==='home').length,action:{type:'tool',tool:'zoneHome'}},
 {id:'firstNeighbors',title:'¡Llegaron los vecinos!',description:'Alcanzá los primeros 10 habitantes.',goal:10,measure:s=>number(s.population),action:{type:'panel',panel:'city'}},
 {id:'park',title:'Una plaza para todos',description:'Construí una plaza barrial.',goal:1,measure:s=>(s.buildings||[]).filter(b=>b.serviceModel==='urbanPark').length,action:{type:'tool',tool:'civic',model:'urbanPark'}},
 {id:'shops',title:'Abrió el comercio',description:'Conseguí un comercio terminado.',goal:1,measure:s=>kindCount(s.buildings||[],'shop'),action:{type:'tool',tool:'zoneShop'}},
 {id:'population',title:'Nuestro primer barrio',description:'Llegá a 30 habitantes.',goal:30,measure:s=>number(s.population),action:{type:'panel',panel:'city'}},
 {id:'industry',title:'La ciudad produce',description:'Conseguí una fábrica operativa o terminada.',goal:1,measure:s=>kindCount(s.buildings||[],'factory'),action:{type:'tool',tool:'zoneFactory'}},
 {id:'balanced',title:'Cuentas cuidadas',description:'Con habitantes, lográ un balance mensual no negativo.',goal:1,measure:s=>number(s.population)>0&&number(s.grossMonthlyIncome??s.monthlyIncome)>=number(s.effectiveMonthlyExpenses??s.monthlyExpenses)?1:0,action:{type:'panel',panel:'supply'}},
 {id:'bigTown',title:'Una ciudad que crece',description:'Llegá a 60 habitantes.',goal:60,measure:s=>number(s.population),action:{type:'panel',panel:'city'}}
]);
export function cityMissions(state){
 if(!state)return[];
 const achieved=new Set(state.cityMilestones?.completed||[]);
 return CITY_MISSIONS.map((m,index)=>{
  const progress=Math.max(0,number(m.measure(state)));
  return {id:m.id,title:m.title,description:m.description,goal:m.goal,progress:Math.min(progress,m.goal),done:achieved.has(m.id)||progress>=m.goal,action:m.action,index};
 });
}
export function recordCityProgress(state){
 if(!state)return;
 const month=Math.floor((Math.max(1,number(state.day))-1)/30);
 const diary=state.neighborhoodHistory||(state.neighborhoodHistory={lastMonth:-1,snapshots:[]});
 diary.snapshots=Array.isArray(diary.snapshots)?diary.snapshots:[];
 if(diary.lastMonth!==month){
  diary.snapshots.push({day:Math.max(1,number(state.day)),month,districts:collectNeighborhoods(state).map(d=>({
   id:d.id,population:d.population,homes:d.homes,shops:d.shops,factories:d.factories,parks:d.parks,condition:d.condition
  }))});
  diary.snapshots=diary.snapshots.slice(-72);
  diary.lastMonth=month;
 }
 const milestones=state.cityMilestones||(state.cityMilestones={completed:[],events:[]});
 milestones.completed=Array.isArray(milestones.completed)?milestones.completed:[];
 milestones.events=Array.isArray(milestones.events)?milestones.events:[];
 for(const mission of cityMissions(state)){
  if(mission.done&& !milestones.completed.includes(mission.id)){
   milestones.completed.push(mission.id);
   milestones.events.push({id:mission.id,title:mission.title,day:Math.max(1,number(state.day))});
  }
 }
 milestones.events=milestones.events.slice(-32);
 recordLivingCity(state);
}
export function neighborhoodTimeline(state,districtId){
 const snapshots=(state?.neighborhoodHistory?.snapshots||[]).map(s=>({day:s.day,record:s.districts?.find(d=>d.id===districtId)})).filter(s=>s.record);
 const output=[];
 for(let i=0;i<snapshots.length;i++){
  const current=snapshots[i],previous=snapshots[i-1]?.record;
  if(!previous){output.push({day:current.day,text:'Primer registro: '+current.record.population+' habitantes, '+current.record.homes+' viviendas.'});continue}
  const changes=[['population','habitantes'],['homes','viviendas'],['shops','comercios'],['factories','fábricas'],['parks','plazas']].flatMap(([k,label])=>{
   const diff=number(current.record[k])-number(previous[k]);
   return diff?[(diff>0?'+':'')+diff+' '+label]:[];
  });
  if(changes.length)output.push({day:current.day,text:changes.join(' · ')});
 }
 return output.slice(-6).reverse();
}
export function cityAdvice(state){
 if(!state)return[];
 const buildings=state.buildings||[],roads=state.roads||[],zones=state.zones||[],demand=growthDemand(state),ideas=[];
 const add=(id,priority,title,description,action)=>ideas.push({id,priority,title,description,action});
 if(roads.length<=1)add('roads',100,'Empezá por las calles','Las obras y los vecinos necesitan conectarse con la entrada de la ciudad. Dibujá algunas calles primero.',{type:'tool',tool:'road'});
 if(!buildings.some(b=>b.kind==='powerPlant')&&!state.projects?.some(p=>p.kind==='powerPlant'))add('power',96,'Falta producir electricidad','No hay ninguna central eléctrica. Colocá una junto a una calle para abastecer la ciudad.',{type:'tool',tool:'powerPlant'});
 if(!buildings.some(b=>b.kind==='waterPlant')&&!state.projects?.some(p=>p.kind==='waterPlant'))add('water',95,'Falta agua potable','La ciudad todavía no tiene planta potabilizadora. Necesitarás una para recibir familias.',{type:'tool',tool:'waterPlant'});
 if(!buildings.some(b=>b.kind==='wastewaterPlant')&&!state.projects?.some(p=>p.kind==='wastewaterPlant'))add('sewer',94,'Falta tratar las aguas usadas','Instalá una planta depuradora conectada: el saneamiento es parte de la infraestructura básica.',{type:'tool',tool:'wastewaterPlant'});
 const homes=buildings.filter(b=>b.kind==='home');
 const unconnected=buildings.filter(b=>b.roadAccessConnected===false&&['home','shop','factory'].includes(b.kind));
 if(unconnected.length)add('disconnected',98,'Edificios aislados',unconnected.length+' edificios no tienen una ruta vial continua. Revisá sus calles y conectalos con el acceso exterior.',{type:'focus',x:unconnected[0].x,y:unconnected[0].y});
 const utilityKeys=[['powerServedPct','electricidad','powerPlant'],['waterServedPct','agua','waterPlant'],['wastewaterTreatedPct','saneamiento','wastewaterPlant']];
 for(const [field,label,tool] of utilityKeys){
  const missing=buildings.filter(b=>['home','shop','factory'].includes(b.kind)&&Number.isFinite(Number(b.utilityAccess?.[field]))&&Number(b.utilityAccess[field])<70);
  if(missing.length)add('utility-'+field,90,'Falta '+label+' en algunos edificios',missing.length+' edificios reciben menos del 70 % de '+label+'. Inspeccioná el más afectado; construir otra planta no garantiza la solución si faltan conexión o capacidad.',{type:'focus',x:missing[0].x,y:missing[0].y});
 }
 if(!homes.length&&!zones.some(z=>z.kind==='home'))add('residential',86,'Necesitás suelo para viviendas','Pintá una zona residencial junto a las calles. Las casas privadas se construyen cuando hay demanda.',{type:'tool',tool:'zoneHome'});
 else if(demand.housing.shortage>0)add('housingDemand',82,'Hay personas esperando una vivienda',demand.housing.shortage+' interesados no tienen plaza libre. Habilitá más suelo residencial y asegurá sus servicios.',{type:'tool',tool:'zoneHome'});
 const income=number(state.grossMonthlyIncome??state.monthlyIncome),expense=number(state.effectiveMonthlyExpenses??state.monthlyExpenses);
 if(expense>income)add('deficit',94,'La ciudad gasta más de lo que gana','Los gastos superan los ingresos en $ '+Math.round(expense-income).toLocaleString('es-AR')+' al mes. Revisá Tesorería antes de construir más servicios.',{type:'panel',panel:'supply'});
 if(number(state.money)<2000&&number(state.population)>0)add('cash',92,'Queda poco dinero','La caja municipal está por debajo de $ 2.000. Revisá ingresos, mantenimiento y compromisos.',{type:'panel',panel:'supply'});
 if(number(state.population)>0&&!buildings.some(b=>b.serviceModel==='urbanPark'))add('parks',50,'El barrio agradecería una plaza','Una plaza aporta espacio público para el ocio. Es voluntaria y tiene un costo mensual.',{type:'tool',tool:'civic',model:'urbanPark'});
 if(demand.commercial.shortage>0)add('commerce',57,'Hay demanda de comercios','La demanda indica que faltan '+demand.commercial.shortage+' comercios. Zonificá cerca de hogares y calles.',{type:'tool',tool:'zoneShop'});
 if(demand.industry.shortage>0)add('factory',45,'La industria tiene demanda','La ciudad necesita '+demand.industry.shortage+' fábricas adicionales según la actividad comercial.',{type:'tool',tool:'zoneFactory'});
 if(state.projects?.some(p=>String(p.status||'').includes('deten')||String(p.status||'').includes('espera')))add('projects',66,'Hay obras que no avanzan','Una o más obras están detenidas o esperando insumos. Abrí Obras para ver la causa.',{type:'panel',panel:'projects'});
 return ideas.sort((a,b)=>b.priority-a.priority).slice(0,8);
}
export function placementPreview(state,selection,tile,models={}){
 if(!state||!tile||!Number.isInteger(tile.x)||!Number.isInteger(tile.y))return null;
 const tool=selection?.tool,model=selection?.model;
 const chosen=models[model]||null;
 const base={road:1200,powerPlant:18800,waterPlant:14200,wastewaterPlant:16600,landfill:9800,recyclingPlant:14800,port:14500,airport:19500,gasPlant:16000};
 const price=chosen?.cost??base[tool]??null;
 const supported=Boolean(price||['zoneHome','zoneShop','zoneFactory'].includes(tool));
 if(!supported)return null;
 const x=tile.x,y=tile.y,land=state.landClaims||{},size=land.chunkSize||8;
 const unlocked=!Array.isArray(land.unlockedChunks)||land.unlockedChunks.includes(Math.floor(x/size)+','+Math.floor(y/size));
 const river=x===24||x===25;
 const occupied=(state.buildings||[]).some(b=>b.x===x&&b.y===y)||(state.projects||[]).some(b=>b.x===x&&b.y===y)||(state.roads||[]).some(r=>r[0]===x&&r[1]===y);
 const roads=state.roads||[],roadSet=new Set(roads.map(r=>key(r[0],r[1]))),network=reachableRoads(roads);
 const links=directions.map(([dx,dy])=>key(x+dx,y+dy)).filter(k=>network.has(k));
 const connected=links.length>0;
 let warning=!unlocked?'Este sector todavía está bloqueado.':river?'Esta parcela pertenece al río.':occupied?'La parcela ya está ocupada.':!connected?'No hay calle adyacente conectada a la entrada de la ciudad.':'';
 if(tool==='road')warning=!unlocked?'Sector bloqueado.':river?'No se puede construir calle en el río.':(occupied?'La parcela ya está ocupada.':'');
 const label=chosen?.label||({road:'Construir calle',powerPlant:'Central eléctrica',waterPlant:'Planta potabilizadora',wastewaterPlant:'Planta depuradora',zoneHome:'Zona residencial',zoneShop:'Zona comercial',zoneFactory:'Zona industrial'}[tool]||'Construcción');
 const potential=[];
 if(!warning&&connected){
  const radius=chosen?.radius||Infinity,visited=new Map(),queue=[];
  for(const link of links){visited.set(link,1);queue.push(link)}
  for(let i=0;i<queue.length;i++){
   const k=queue[i],[rx,ry]=k.split(',').map(Number),length=visited.get(k);
   if(length>=radius)continue;
   for(const [dx,dy] of directions){const next=key(rx+dx,ry+dy);if(network.has(next)&&!visited.has(next)){visited.set(next,length+1);queue.push(next)}}
  }
  for(const building of state.buildings||[]){
   if(!['home','shop','factory'].includes(building.kind))continue;
   if(directions.some(([dx,dy])=>visited.has(key(building.x+dx,building.y+dy))))potential.push(building);
  }
 }
 const homes=potential.filter(b=>b.kind==='home');
 const occupants=homes.reduce((n,b)=>n+number(b.occupants),0);
 const supplyField={powerPlant:'powerServedPct',waterPlant:'waterServedPct',wastewaterPlant:'wastewaterTreatedPct'}[tool];
 const lacking=supplyField?potential.filter(b=>Number.isFinite(Number(b.utilityAccess?.[supplyField]))&&Number(b.utilityAccess[supplyField])<95).length:null;
 const demand=growthDemand(state);
 const zoningHint=tool==='zoneHome'?'Demanda residencial: '+demand.housing.value+' %.':tool==='zoneShop'?'Demanda comercial: '+demand.commercial.value+' %.':tool==='zoneFactory'?'Demanda industrial: '+demand.industry.value+' %.':null;
 return {tool,model,label,x,y,price,radius:Number.isFinite(chosen?.radius)?chosen.radius:null,monthlyCost:Number.isFinite(Number(chosen?.monthlyCost))?number(chosen.monthlyCost):null,warning,connected,valid:!warning,
  reachedBuildings:potential.length,reachedHomes:homes.length,residents:occupants,lacking,zoningHint,
  note:chosen?.radius?'Estimación por calles conectadas y radio vial. El servicio real depende de personal, capacidad, suministros y presupuesto.':supplyField?'Edificios alcanzables por calle; no es una garantía de suministro. Revisá capacidad, redes y operación.':tool==='road'?'El precio corresponde a un tramo; el mantenimiento se cobra por separado.':zoningHint?'El permiso de zona no construye ni cobra automáticamente un edificio privado.':'Comprobá el coste operativo y las conexiones antes de confirmar.'};
}
