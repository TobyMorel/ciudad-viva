// Plan visual derivado de la simulación: nunca agrega demanda, pasajeros ni dinero.
const numeric=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
export function visualSeason(day=1){
 const month=Math.floor(((Math.max(1,Math.floor(numeric(day,1)))-1)%360)/30);
 if([11,0,1].includes(month))return 'verano';
 if([2,3,4].includes(month))return 'otoño';
 if([5,6,7].includes(month))return 'invierno';
 return 'primavera';
}
export const seasonalPalette=Object.freeze({
 verano:{leaves:['#76ac5c','#a0bc69','#c1c870'],flowers:'#efc783',sky:'#bcd9df'},
 otoño:{leaves:['#d89c53','#bb6e43','#e2bb73'],flowers:'#d4ad72',sky:'#d9d1c5'},
 invierno:{leaves:['#9c9876','#b6ab91','#c4c1b3'],flowers:'#c1c5bd',sky:'#c3d1d8'},
 primavera:{leaves:['#82b862','#a1c76f','#e6b7ce'],flowers:'#e2a6c6',sky:'#bee1de'}
});
export function commerceIdentity(building){
 if(!building||building.kind!=='shop')return null;
 const name=String(building.name||'').trim();
 const explicit=[
  [/panader|horno|pastel|confiter/i,'panaderia','Panadería'],
  [/caf[eé]|bar |restaur|bistro/i,'cafe','Café'],
  [/flor|vivero/i,'flores','Florería'],
  [/taller|repar|mecan|ferreter/i,'taller','Taller'],
  [/kiosco|almac[eé]n|mercado|tienda/i,'mercado','Mercado']
 ].find(([pattern])=>pattern.test(name));
 const kinds=['panaderia','cafe','mercado','flores','taller'];
 const index=Math.abs(Math.trunc(numeric(building.x)*17+numeric(building.y)*31))%kinds.length;
 const category=explicit?.[1]||kinds[index];
 const labels={panaderia:'Panadería',cafe:'Café',mercado:'Mercado',flores:'Florería',taller:'Taller'};
 const colors={panaderia:'#d18f55',cafe:'#815e9c',mercado:'#468b81',flores:'#b16f8b',taller:'#668399'};
 const closed=building.business?.status==='cerrado'||building.status==='cerrado';
 // Los rubros sin nombre explícito son solo variedad estética: no modifican inventarios, impuestos ni producción.
 return {category,title:explicit?.[2]||labels[category],sign:name&&name.length<=26?name:(explicit?.[2]||labels[category]),
  namedFromSimulation:Boolean(explicit),color:closed?'#777c7a':colors[category],open:!closed,
  trading:Boolean(!closed&&(numeric(building.business?.lastSales)>0||numeric(building.business?.lastLocalSales)>0))};
}
export function citySpectaclePlan(state){
 if(!state)return {day:1,season:'verano',rainMm:0,windStrength:.58,windDirection:0,storm:false,events:[],milestones:[],homes:[],shops:[],parks:[],transitStops:[],activeServices:[]};
 const day=Math.max(1,Math.floor(numeric(state.day,1))),season=visualSeason(day),rainMm=Math.max(0,numeric(state.utilities?.report?.drainage?.rainfallMm));
 const seasonalWind=season==='otoño'?.18:season==='invierno'?.24:season==='primavera'?.08:0;
 const windStrength=Math.max(.45,Math.min(1.55,.58+Math.min(.58,rainMm*.035)+seasonalWind));
 const windDirection=(day*37+['verano','otoño','invierno','primavera'].indexOf(season)*53)%360;
 const buildings=Array.isArray(state.buildings)?state.buildings:[];
 const events=(state.tourismEvents||[]).filter(event=>event?.status==='realizado'&&numeric(event.visitors)>0&&numeric(event.completedDay)>0&&day-numeric(event.completedDay)>=0&&day-numeric(event.completedDay)<=2).slice(-3);
 const milestones=(state.cityMilestones?.events||[]).filter(e=>numeric(e.day)>0&&day-numeric(e.day)>=0&&day-numeric(e.day)<=1).slice(-3);
 const homes=buildings.filter(b=>b.kind==='home'&&numeric(b.occupants)>0&&b.status!=='abandonado');
 const shops=buildings.filter(b=>b.kind==='shop'&&b.business?.status!=='cerrado');
 const parks=buildings.filter(b=>b.serviceModel==='urbanPark'&&['operativo','habilitado'].includes(b.status));
 const transitStops=(state.busRoutes||[]).filter(line=>line.operational&&numeric(line.ridersThisPass)>0).flatMap(line=>(line.stops||[]).filter(stop=>Array.isArray(stop)&&stop.length===2).slice(0,3).map(([x,y])=>({x,y,line:line.name||'Colectivo',riders:numeric(line.ridersThisPass)}))).slice(0,14);
 const activeServices=[
  ...(state.fireReport?.activeIncidents||[]).filter(i=>Number.isInteger(i.x)&&Number.isInteger(i.y)&&i.status!=='controlado').map(i=>({kind:'bomberos',x:i.x,y:i.y,title:i.name||'Incendio',arrived:numeric(i.arrivalDay,Infinity)<=day})),
  ...(state.healthReport?.hospital?.ambulanceDispatches||[]).filter(i=>i.status==='traslado'&&numeric(i.day)>0&&day-numeric(i.day)<=1&&Number.isInteger(i.x)&&Number.isInteger(i.y)).map(i=>({kind:'ambulancia',x:i.x,y:i.y,arrived:true})),
  ...(state.waste?.containers||[]).filter(i=>i&&Number(i.lastPickedTons)>0&&Number.isInteger(i.x)&&Number.isInteger(i.y)).map(i=>({kind:'residuos',x:i.x,y:i.y,arrived:true}))
 ].slice(0,18);
 return {day,season,rainMm,windStrength,windDirection,storm:rainMm>=12,events,milestones,homes,shops,parks,transitStops,activeServices,
  activeTrips:(state.commutes||[]).filter(t=>['trabajo','compras','educacion','ocio','servicios'].includes(t.reason)&&numeric(t.workers)>0).length};
}
export function citySceneSignatures(plan){
 const building=JSON.stringify([plan.homes.map(b=>[b.x,b.y,b.occupants]),plan.shops.map(b=>[b.x,b.y,b.business?.status,b.business?.lastSales]),plan.parks.map(b=>[b.x,b.y]),plan.transitStops,plan.activeServices,plan.events.map(e=>[e.id,e.status,e.visitors,e.completedDay]),plan.milestones.map(e=>[e.id,e.day])]);
 const climate=plan.season+':'+plan.rainMm+':'+plan.windStrength+':'+plan.windDirection+':'+plan.day;
 return {building,climate};
}
