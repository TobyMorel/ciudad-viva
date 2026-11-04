// Alfa 0.265 · Solo lectura. No genera pasajeros, producción, delitos ni dinero.
import {commerceIdentity,citySpectaclePlan} from './city_spectacle_state.js';
import {parkActivityPlan} from './living_city.js';
const N=x=>Number.isFinite(Number(x))?Number(x):0;
const point=x=>Array.isArray(x)&&Number.isInteger(x[0])&&Number.isInteger(x[1])?{x:x[0],y:x[1]}:
  x&&Number.isInteger(x.x)&&Number.isInteger(x.y)?{x:x.x,y:x.y}:
  x&&Array.isArray(x.at)?point(x.at):null;
const key=p=>p.x+','+p.y;
const open=b=>['operativo','habilitado'].includes(b?.status);
const activeShop=b=>open(b)&&b.business?.status!=='cerrado'&&(N(b.business?.lastSales)>0||N(b.business?.lastLocalSales)>0||N(b.business?.inventory)>0);
const activeFactory=b=>open(b)&&b.business?.status!=='cerrado'&&(
 N(b.business?.lastProduction)>0||N(b.business?.inventory)>0||N(b.business?.unitsProduced)>0);
function orderTouchesBuilding(order,b){
 const id=key(b);
 if(order.businessId&&[b.business?.id,b.id].includes(order.businessId))return true;
 if(order.factoryId&&[b.business?.id,b.id].includes(order.factoryId))return true;
 if(order.factoryX===b.x&&order.factoryY===b.y||order.x===b.x&&order.y===b.y)return true;
 if(order.businessName===b.name||order.originName===b.name||order.factoryName===b.name)return true;
 const route=order.roadRoute||order.route||[];
 const endpoints=[route[0],route.at(-1)];
 return endpoints.some(p=>Array.isArray(p)&&(Math.abs(p[0]-b.x)+Math.abs(p[1]-b.y))<=1);
}
export function realBusStopScenes(state){
 const stops=new Map(),roads=new Set((state?.roads||[]).map(p=>Array.isArray(p)?p.join(','):''));
 for(const line of state?.busRoutes||[]){
  if(!line.operational||N(line.effectiveBuses)<=0)continue;
  const riders=Math.max(0,N(line.ridersThisPass),N(line.dailyRiders),N(line.returnRidersThisPass));
  for(const item of line.stops||[]){
   const p=point(item);if(!p||!roads.has(key(p)))continue;
   const id=key(p),record=stops.get(id)||{x:p.x,y:p.y,riders:0,buses:0,lines:0};
   record.riders+=riders;record.buses+=N(line.effectiveBuses);record.lines++;
   stops.set(id,record);
  }
 }
 return [...stops.values()].filter(s=>s.riders>0).slice(0,28);
}
export function realIndustryScenes(state){
 const buildings=state?.buildings||[];
 const orders=[...(state?.supply?.marketOrders||[]),...(state?.supply?.portOrders||[]),
  ...(state?.supply?.factoryExportOrders||[]),...(state?.supply?.orders||[])].filter(o=>!['cancelado','cancelada'].includes(o.status));
 return buildings.filter(b=>b.kind==='shop'||b.kind==='factory').map(b=>{
  const identity=b.kind==='shop'?commerceIdentity(b):null;
  const active=b.kind==='factory'?activeFactory(b):activeShop(b);
  const deliveries=orders.filter(o=>orderTouchesBuilding(o,b)&&
    ['en tránsito','en viaje','descargando','esperando patio','descarga parcial','en ruta'].includes(o.status)).length;
  return {x:b.x,y:b.y,kind:b.kind,identity:identity?.category||null,
   active:active||deliveries>0,deliveries,open:open(b)&&b.business?.status!=='cerrado',
   production:N(b.business?.lastProduction),sales:Math.max(N(b.business?.lastSales),N(b.business?.lastLocalSales)),
   inventory:N(b.business?.inventory),workers:N((state?.workplaces||[]).find(w=>w.x===b.x&&w.y===b.y)?.staffedJobs)};
 }).filter(b=>b.open).slice(0,48);
}
export function realPortScenes(state){
 const voyages=state?.supply?.portVoyages||[],orders=state?.supply?.portOrders||[];
 return (state?.buildings||[]).filter(b=>b.kind==='port'&&open(b)).map(b=>{
  const manifest=voyages.filter(v=>['atracado','descarga parcial','descargado','cargando'].includes(v.status)&&
   (point(v.port)?.x===b.x&&point(v.port)?.y===b.y||!v.port));
  const exports=orders.filter(o=>['esperando patio','descargando','en tránsito'].includes(o.status));
  return {x:b.x,y:b.y,active:manifest.length>0||exports.length>0||N(b.cargoStored)>0,
   vesselCount:manifest.length,cargo:N(b.cargoStored),orders:exports.length,
   operations:Math.max(0,manifest.reduce((n,v)=>n+N(v.unloadedUnits),0))};
 }).slice(0,8);
}
export function realSchoolScenes(state){
 const reports=state?.educationReport?.schools||[];
 return (state?.buildings||[]).filter(b=>b.kind==='school'&&open(b)).map(b=>{
  const r=reports.find(i=>i.x===b.x&&i.y===b.y);
  return {x:b.x,y:b.y,serviceModel:b.serviceModel||'',enrolled:N(r?.enrolled),staff:N((state.workplaces||[]).find(w=>w.x===b.x&&w.y===b.y)?.staffedJobs)};
 }).filter(x=>x.enrolled>0).slice(0,15);
}
export function realStreetIssues(state){
 const roads=new Set((state?.roads||[]).map(p=>Array.isArray(p)?p.join(','):''));
 const potholes=(state?.roadAssets||[]).filter(r=>roads.has(key(r))&&N(r.quality??82)<65).map(r=>({
  x:r.x,y:r.y,quality:N(r.quality??82),closed:Boolean(r.accidentClosed)
 }));
 const litter=(state?.waste?.report?.litterTiles||[]).map(point).filter(Boolean).filter(p=>roads.has(key(p)));
 const overflowing=(state?.waste?.containers||[]).filter(c=>N(c.capacityTons)>0&&N(c.storedTons)/N(c.capacityTons)>.72).map(c=>({
  x:c.x,y:c.y,fill:N(c.storedTons)/N(c.capacityTons)
 }));
 const utilities=(state?.utilities?.report?.failures||[]).filter(f=>
  ['en reparación','en reparacion','reparando','en curso'].includes(f.status)&&Number.isInteger(f.x)&&Number.isInteger(f.y))
  .map(f=>({x:f.x,y:f.y,kind:f.network||'cuadrilla',route:f.responseRoute||[]}));
 return {potholes:potholes.slice(0,55),litter:litter.slice(0,32),
  overflowing:overflowing.slice(0,20),utilities:utilities.slice(0,16)};
}
export function realEmergencyScenes(state){
 const day=N(state?.day);
 const fires=(state?.fireReport?.activeIncidents||[]).filter(i=>Number.isInteger(i.x)&&Number.isInteger(i.y)&&
  ['ardiendo','en_respuesta','en respuesta'].includes(i.status)).map(i=>({
  x:i.x,y:i.y,status:i.status,arrived:N(i.arrivalDay)>0&&N(i.arrivalDay)<=day,
  dispatched:Boolean(i.dispatchDay||i.responseRoute?.length),severity:N(i.severity||1)}));
 const ambulances=(state?.healthReport?.hospital?.ambulanceDispatches||[]).filter(i=>
  Number.isInteger(i.x)&&Number.isInteger(i.y)&&
  ['traslado','recogida','en traslado','atendido','en atención'].includes(i.status)&&
  N(i.day)>0&&day-N(i.day)<=2).map(i=>({x:i.x,y:i.y,status:i.status,day:i.day,
    arrived:Boolean(i.arrivalDay&&N(i.arrivalDay)<=day)||i.status==='atendido'||i.status==='recogida'||i.status==='traslado'&&N(i.day)===day}));
 return {fires:fires.slice(0,12),ambulances:ambulances.slice(0,10)};
}
export function realSurpriseScenes(state){
 const day=N(state?.day);
 const moves=(state?.livingCity?.stories||[]).filter(s=>s.kind==='mudanza'&&day-N(s.day)>=0&&day-N(s.day)<=1)
  .flatMap(s=>{
   const r=(state.buildings||[]).find(b=>b.kind==='home'&&(b.residents||[]).some(p=>String(p.id)===String(s.id)));
   return r?[{x:r.x,y:r.y,type:'mudanza',id:s.id}]:[];
  });
 // El evento no guarda coordenadas: el motor selecciona una sede cívica abierta.
 const venue=(state?.buildings||[]).find(b=>b.kind==='civic'&&open(b));
 const festivals=(state?.tourismEvents||[]).filter(e=>e.status==='realizado'&&N(e.visitors)>0&&day-N(e.completedDay)>=0&&day-N(e.completedDay)<=2)
  .map(e=>({x:Number.isInteger(e.x)?e.x:venue?.x,y:Number.isInteger(e.y)?e.y:venue?.y,
   type:'musica',id:e.id,venue:e.venue}));
 const moments=(state?.livingCity?.moments||[]).filter(m=>day-N(m.day)>=0&&day-N(m.day)<=2)
  .map(m=>({x:m.x,y:m.y,type:'celebracion',id:m.id}));
 return [...moves,...festivals,...moments].filter(s=>Number.isInteger(s.x)&&Number.isInteger(s.y)).slice(-16);
}
export function immersiveCityPlan(state){
 const s=state||{},spectacle=citySpectaclePlan(s);
 const parks=parkActivityPlan(s),homes=(s.buildings||[]).filter(b=>b.kind==='home'&&open(b)&&N(b.occupants)>0);
 const shops=(s.buildings||[]).filter(b=>b.kind==='shop'&&open(b)&&b.business?.status!=='cerrado');
  return {day:N(s.day)||1,rainMm:spectacle.rainMm,windStrength:spectacle.windStrength,windDirection:spectacle.windDirection,storm:spectacle.storm,season:spectacle.season,
   buses:realBusStopScenes(s),industries:realIndustryScenes(s),ports:realPortScenes(s),
   schools:realSchoolScenes(s),issues:realStreetIssues(s),emergencies:realEmergencyScenes(s),
   surprises:realSurpriseScenes(s),parks:parks.slice(0,15),
   animals:{homes:homes.slice(0,18).map(b=>({x:b.x,y:b.y,occupants:N(b.occupants)})),
     shops:shops.slice(0,10).map(b=>({x:b.x,y:b.y})),parks:parks.slice(0,12)},
   coastEnabled:true};
}
export function immersiveSignature(plan){
  const {day,rainMm,windStrength,windDirection,season,buses,industries,ports,schools,issues,emergencies,surprises,parks,animals}=plan;
  return JSON.stringify([day,rainMm,windStrength,windDirection,season,buses,industries,ports,schools,issues,emergencies,surprises,parks,animals]);
}
