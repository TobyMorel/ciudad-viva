// Red urbana con proveedores físicos, cupos finitos y avisos por edificio.
// Se recalcula sin avanzar el reloj: consultar la UI no envejece edificios.
export const SERVICE_GRACE_DAYS={power:120,water:135,gas:165,tv:200,wifi:200};
export const SERVICE_LABELS={power:'electricidad',water:'agua',gas:'gas',tv:'TV por cable',wifi:'Wi-Fi'};
const NETWORK={power:'powerLines',water:'waterPipes',gas:'gasLines',tv:'telecomLines',wifi:'telecomLines'};
const k=(x,y)=>x+','+y;
const active=b=>!['abandonado','cerrado','building','en obra','retired','cancelled'].includes(b.status||'operativo');
function connectedTiles(tiles,start){
 if(!tiles.has(start))return new Set();
 const queue=[start],found=new Set(queue);
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i].split(',').map(Number);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const p=k(x+dx,y+dy);if(tiles.has(p)&&!found.has(p)){found.add(p);queue.push(p)}
  }
 }
 return found;
}
function adjacent(b,tiles){return [[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>tiles.has(k(b.x+dx,b.y+dy)))}
function demand(b,service){
 const n=Math.max(0,Number(b.occupants)||0),workers=Math.max(1,Number(b.business?.lastWorkers||b.jobSlots||0));
 if(service==='power')return Math.max(2,Number(b.utilityDemand?.powerKw)||0,n*.72,b.kind==='home'?6:Math.min(60,workers*.9));
 if(service==='water')return Math.max(.8,Number(b.utilityDemand?.waterM3Day)||0,n*.12,b.kind==='home'?2:workers*.08);
 if(service==='gas')return Math.max(.3,Number(b.utilityDemand?.gasM3Day)||0,n*.025,b.kind==='home'?1:workers*.03);
 if(service==='tv')return Math.max(1,Math.ceil(n/5));
 return Math.max(1,Math.ceil(n/5),b.kind==='home'?1:Math.ceil(workers/8));
}
function required(b){
 if(b.kind==='home')return ['power','water','gas','tv','wifi'];
 if(b.kind==='hotel')return ['power','water','gas','tv','wifi'];
 if(['powerPlant','waterPlant','gasPlant','wastewaterPlant'].includes(b.kind))return ['power','water'];
 if(b.kind==='civic'&&['tvHeadend','wifiHub'].includes(b.serviceModel))return ['power'];
 if(b.kind==='factory'||b.kind==='shop'||b.kind==='school'||b.kind==='civic')return ['power','water','gas','wifi'];
 return ['power','water','gas'];
}
export function evaluateEssentialServices(city){
 const u=city.utilities||(city.utilities={}),buildings=(city.buildings||[]).filter(active);
 const roadTiles=connectedTiles(new Set((city.roads||[]).map(p=>k(...p))),'4,10');
 const nets={};
 for(const type of Object.keys(NETWORK)){
  const roadLines=new Set((u[NETWORK[type]]||[]).map(p=>k(...p)).filter(p=>roadTiles.has(p)));
  const failed=new Set((u.failures||[]).filter(f=>f.status!=='reparada'&&f.network===(type==='tv'||type==='wifi'?'telecom':type)).map(f=>k(f.x,f.y)));
  for(const p of failed)roadLines.delete(p);
  nets[type]=connectedTiles(roadLines,'4,10');
 }
 const live=b=>active(b)&&adjacent(b,roadTiles);
 const capacity={
  power:buildings.filter(b=>b.kind==='powerPlant'&&live(b)&&adjacent(b,nets.power)).reduce((n,b)=>n+(b.generationKw??900)*Math.max(0,Math.min(1,(b.quality??82)/82)),0),
  water:0,gas:0,tv:0,wifi:0
 };
 const assigned={power:new Set(),water:new Set(),gas:new Set(),tv:new Set(),wifi:new Set()};
 const served={power:0,water:0,gas:0,tv:0,wifi:0};
 const consumers=[...buildings].sort((a,b)=>{
  const priority=x=>['powerPlant','waterPlant','gasPlant'].includes(x.kind)?0:x.kind==='civic'&&['tvHeadend','wifiHub'].includes(x.serviceModel)?1:x.kind==='home'?2:3;
  return priority(a)-priority(b)||a.y-b.y||a.x-b.x;
 });
 // Cupo indivisible por inmueble: nunca se reparte el 20% a cinco casas.
 for(const service of ['power','water','gas','tv','wifi']){
  if(service==='water')capacity.water=buildings.filter(b=>b.kind==='waterPlant'&&live(b)&&adjacent(b,nets.water)&&assigned.power.has(b)).reduce((n,b)=>n+(b.treatmentM3Day??220)*Math.max(0,Math.min(1,(b.quality??82)/82)),0);
  if(service==='gas')capacity.gas=buildings.filter(b=>b.kind==='gasPlant'&&live(b)&&adjacent(b,nets.gas)&&assigned.power.has(b)).reduce((n,b)=>n+(b.gasCapacityM3Day??160)*Math.max(0,Math.min(1,(b.quality??82)/82)),0);
  if(service==='tv'||service==='wifi'){
   const model=service==='tv'?'tvHeadend':'wifiHub',field=service==='tv'?'tvConnections':'wifiConnections',fallback=service==='tv'?180:160;
   capacity[service]=buildings.filter(b=>b.kind==='civic'&&b.serviceModel===model&&live(b)&&adjacent(b,nets[service])&&assigned.power.has(b))
    .reduce((n,b)=>n+(b[field]??fallback)*Math.max(0,Math.min(1,(b.quality??82)/82)),0);
  }
  let remaining=capacity[service];
  for(const b of consumers){
   if(!required(b).includes(service))continue;
   const qty=demand(b,service),connected=live(b)&&adjacent(b,nets[service]);
   if(connected&&remaining+1e-9>=qty){remaining-=qty;served[service]+=qty;assigned[service].add(b)}
  }
  capacity[service]=Math.round(capacity[service]*100)/100;
 }
 const summary={};
 for(const service of Object.keys(NETWORK))summary[service]={capacity:capacity[service],used:Math.round(served[service]*100)/100,free:Math.round(Math.max(0,capacity[service]-served[service])*100)/100,connectedRoadSegments:nets[service].size,buildingsServed:assigned[service].size};
 const poweredRoads=[];
 let free=Math.max(0,capacity.power-served.power);
 for(const p of [...nets.power].sort()){
  if(free<.22)break;
  free-=.22;poweredRoads.push(p.split(',').map(Number));
 }
 u.poweredStreetlightTiles=poweredRoads;
 for(const b of buildings){
  const access=b.utilityAccess||(b.utilityAccess={}),missing=[],reason={};
  for(const service of required(b)){
   const field=service==='power'?'powerServedPct':service==='water'?'waterServedPct':service==='gas'?'gasServedPct':service==='tv'?'tvServedPct':'wifiServedPct';
   const connected=live(b)&&adjacent(b,nets[service]);
   const yes=assigned[service].has(b);
   access[field]=yes?100:0;
   access[(service==='tv'||service==='wifi'?'telecom':service)+'Connected']=connected;
   if(!yes){missing.push(service);reason[service]=connected?(capacity[service]===0?'Sin central construida':'Capacidad máxima alcanzada'):'Red vial o cable desconectado'}
  }
  if(required(b).includes('wifi'))access.telecomServedPct=access.wifiServedPct;
  b.missingServices=missing;
  b.missingServiceReasons=reason;
 }
 u.essentialServices=summary;
 return summary;
}
export function advanceEssentialServiceDay(city,notify=()=>{}){
 const day=Number(city.day)||1,abandoned=[];
 for(const b of [...(city.buildings||[])]){
  if(b.kind!=='home'||!active(b))continue;
  if(b.lastServiceCheckDay===day)continue;
  const days=Math.max(1,Math.min(30,day-(Number(b.lastServiceCheckDay)||day-1)));
  b.lastServiceCheckDay=day;
  const outage=b.serviceOutageDays||(b.serviceOutageDays={});
  for(const service of Object.keys(SERVICE_GRACE_DAYS)){
   outage[service]=(b.missingServices||[]).includes(service)?(outage[service]||0)+days:0;
  }
  const expired=Object.keys(SERVICE_GRACE_DAYS).find(s=>outage[s]>=SERVICE_GRACE_DAYS[s]);
  if(!expired)continue;
  const displaced=Math.max(Number(b.occupants)||0,(b.residents||[]).length);
  b.status='abandonado';
  city.buildings=city.buildings.filter(site=>site!==b);
  (city.abandoned||(city.abandoned=[])).push({
   id:'services-'+day+'-'+b.x+'-'+b.y,x:b.x,y:b.y,kind:'home',label:'Vivienda abandonada: falta de '+SERVICE_LABELS[expired],
   status:'vivienda abandonada',reason:'Falta de '+SERVICE_LABELS[expired],progress:1,spent:0,abandonedDay:day,displaced
  });
  city.population=Math.max(0,(city.population||0)-displaced);
  (city.housingDemand||(city.housingDemand={})).unmet=Math.max(0,city.housingDemand?.unmet||0)+displaced;
  abandoned.push({building:b,service:expired,displaced});
  notify('Vivienda abandonada',b.name+' ('+(b.x+1)+','+(b.y+1)+'): '+displaced+' residentes se fueron por falta de '+SERVICE_LABELS[expired]+'.');
 }
 return abandoned;
}
