import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';
import {metroAssignPassengers} from '../metro.js?v=0.241';
import {freightCapacityMetrics,freightLegRoute,freightRoutesForFactoryPort,freightRoutesFromStationToPort,railFreightReport,reserveFreightCapacity,reserveFreightRoute,serializeFreightLegs} from '../rail_freight.js?v=0.241';

const makeLine=(dailyRiders=210)=>({
 id:'rail-shared',mode:'elevated',status:'active',trainCount:1,stations:[[3,1],[11,1]],
 route:Array.from({length:9},(_,i)=>[i+3,1]),fareCents:85,powerRequiredKw:150,
 dailyRiders,monthlyFareRevenue:0,fareByDay:{}
});

test('la carga ferroviaria utiliza solo el cupo que dejan los pasajeros',()=>{
 const line=makeLine(210),origin={x:3,y:2,freightCapacityPerDay:120},port={x:18,y:2,freightCapacityPerDay:120};
 assert.deepEqual(freightCapacityMetrics({...line,dailyCapacity:420,freightCapacityPerDay:60}),{
  freightCapacityPerDay:60,freightAvailableCapacityPerDay:30,passengerLoadPct:50
 });
 const reservedLine={...line,dailyCapacity:420,freightCapacityPerDay:60};
 assert.equal(reserveFreightCapacity(reservedLine,origin,port,30,12),true);
 assert.equal(reserveFreightCapacity(reservedLine,origin,port,1,12),false);
 assert.equal(reservedLine.freightUsedToday,30);
});

test('el servicio de pasajeros lleno deja el transporte de carga en espera',()=>{
 const line={...makeLine(420),dailyCapacity:420,freightCapacityPerDay:60};
 assert.equal(freightCapacityMetrics(line).freightAvailableCapacityPerDay,0);
 assert.equal(reserveFreightCapacity(line,{x:3,y:2},{x:18,y:2},1,12),false);
});

test('la asignación diaria de pasajeros actualiza el cupo compartido',()=>{
 const line=makeLine(0),state={day:1,metroLines:[line],busRoutes:[],railStations:[],taxiRoutes:[],roads:[],roadAssets:[],
  buildings:[{kind:'powerPlant',status:'operativo',generationKw:900}],utilities:{},
  finance:{programBudgets:{mobilityFundingFactor:1}}};
 const trips=[{reason:'servicios',mode:'auto',from:[3,1],to:[11,1],workers:210,distance:20}];
 const report=metroAssignPassengers(state,trips);
 assert.equal(report.railRiders,210);
 assert.equal(line.dailyCapacity,420);
 assert.equal(line.freightAvailableCapacityPerDay,30);
});

test('el informe ferroviario distingue cupo nominal y espacio libre',()=>{
 const report=railFreightReport({metroLines:[{...makeLine(210),operational:true,dailyCapacity:420,freightCapacityPerDay:60}],railStations:[],buildings:[],supply:{}});
 assert.equal(report.dailyCapacity,60);
 assert.equal(report.availableCapacityPerDay,30);
 assert.equal(report.passengerRiders,210);
 assert.equal(report.passengerLoadPct,50);
});

test('un corredor lleno cede el envío a otra línea física disponible',()=>{
 const factory={kind:'factory',x:1,y:1},port={kind:'port',x:10,y:1};
 const stations=[{mode:'elevated',status:'active',x:2,y:1},{mode:'elevated',status:'active',x:8,y:1},
  {mode:'elevated',status:'active',x:1,y:2},{mode:'elevated',status:'active',x:9,y:2}];
 const first={...makeLine(420),id:'rail-short',operational:true,dailyCapacity:420,freightCapacityPerDay:60,
  stations:[[2,1],[8,1]],route:Array.from({length:7},(_,i)=>[i+2,1])};
 const second={...makeLine(0),id:'rail-alternate',operational:true,dailyCapacity:420,freightCapacityPerDay:60,
  stations:[[1,2],[9,2]],route:Array.from({length:9},(_,i)=>[i+1,2])};
 const routes=freightRoutesForFactoryPort({railStations:stations,metroLines:[first,second]},factory,port,
  (a,b)=>[[a.x,a.y],[b.x,b.y]]);
 assert.deepEqual(routes.map(item=>item.line.id),['rail-short','rail-alternate']);
 const selected=reserveFreightRoute(routes,30,12);
 assert.equal(selected.line.id,'rail-alternate');
 assert.equal(first.freightUsedToday,undefined);
 assert.equal(second.freightUsedToday,30);
});

test('la carga encuentra un intercambiador físico y reserva cada tramo al salir',()=>{
 const factory={kind:'factory',x:1,y:1},port={kind:'port',x:13,y:1};
 const stations=[{id:'a',mode:'elevated',status:'active',x:2,y:1},{id:'b',mode:'elevated',status:'active',x:8,y:1},
  {id:'c',mode:'elevated',status:'active',x:8,y:2},{id:'d',mode:'elevated',status:'active',x:13,y:2}];
 const first={...makeLine(0),id:'rail-a',operational:true,dailyCapacity:420,freightCapacityPerDay:60,stations:[[2,1],[8,1]],route:Array.from({length:7},(_,i)=>[i+2,1])};
 const second={...makeLine(0),id:'rail-b',operational:true,dailyCapacity:420,freightCapacityPerDay:60,stations:[[8,2],[13,2]],route:Array.from({length:6},(_,i)=>[i+8,2])};
 const state={railStations:stations,metroLines:[first,second]},routes=freightRoutesForFactoryPort(state,factory,port,(a,b)=>[[a.x,a.y],[b.x,b.y]]);
 assert.equal(routes.length,1);assert.equal(routes[0].transferCount,1);assert.deepEqual(routes[0].legs.map(leg=>leg.line.id),['rail-a','rail-b']);
 const plan=serializeFreightLegs(routes[0]),nextLeg=freightLegRoute(state,plan[1]);
 assert.equal(nextLeg.line.id,'rail-b');assert.deepEqual(nextLeg.route[0],[8,2]);
 assert.equal(reserveFreightRoute(routes,30,12).line.id,'rail-a');
 assert.equal(reserveFreightRoute([nextLeg],30,15).line.id,'rail-b');
 assert.equal(first.freightUsedToday,30);assert.equal(second.freightUsedToday,30);
 const report=railFreightReport({railStations:stations,metroLines:[first,second],buildings:[],supply:{}});
 assert.equal(report.transferStations,2);
});

test('desde el intercambiador elige otra línea si la continuación prioritaria no tiene cupo',()=>{
 const port={kind:'port',x:13,y:1},stations=[{mode:'elevated',status:'active',x:8,y:1},
  {mode:'elevated',status:'active',x:8,y:2},{mode:'elevated',status:'active',x:13,y:2},
  {mode:'elevated',status:'active',x:8,y:3},{mode:'elevated',status:'active',x:13,y:3}];
 const full={...makeLine(420),id:'rail-b',operational:true,dailyCapacity:420,stations:[[8,2],[13,2]],route:Array.from({length:6},(_,i)=>[i+8,2])};
 const alternate={...makeLine(0),id:'rail-c',operational:true,stations:[[8,3],[13,3]],route:Array.from({length:6},(_,i)=>[i+8,3])};
 const routes=freightRoutesFromStationToPort({railStations:stations,metroLines:[full,alternate]},[8,1],port,(a,b)=>[[a.x,a.y],[b.x,b.y]],['rail-a']);
 assert.deepEqual(routes.map(item=>item.line.id),['rail-b','rail-c']);
 const selected=reserveFreightRoute(routes,30,15);assert.equal(selected.line.id,'rail-c');
 assert.equal(full.freightUsedToday,undefined);assert.equal(alternate.freightUsedToday,30);
});

test('Offline: una exportación recorre dos líneas y actualiza el arribo',async()=>{
 const original={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};
 const city=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
 city.day=11;city.lastMonth=0;city.paused=false;city.speed=1;city.zones=[];city.population=0;city.jobs=0;city.workplaces=[];
 city.roads=[...Array.from({length:17},(_,i)=>[i+4,10]),...Array.from({length:7},(_,i)=>[i+10,11]),...Array.from({length:7},(_,i)=>[i+10,12])];
 city.buildings=[
  {kind:'factory',x:4,y:9,name:'Procesadora',status:'habilitado',business:{id:'offline-transfer-factory',name:'Procesadora',industryType:'quarry',status:'abierto',cash:50000,jobSlots:0}},
  {kind:'port',id:'offline-transfer-port',x:16,y:12,name:'Puerto',status:'habilitado',cargoStored:0,cargoCapacity:500},
  {kind:'powerPlant',x:8,y:9,status:'operativo',generationKw:900,quality:82}
 ];
 city.railStations=[{mode:'elevated',status:'active',x:5,y:10,name:'Fábrica'},
  {mode:'elevated',status:'active',x:10,y:10,name:'Centro A'},
  {mode:'elevated',status:'active',x:10,y:11,name:'Centro B'},
  {mode:'elevated',status:'active',x:15,y:11,name:'Puerto B'},
  {mode:'elevated',status:'active',x:10,y:12,name:'Centro C'},
  {mode:'elevated',status:'active',x:15,y:12,name:'Puerto C'}];
 city.metroLines=[
  {id:'offline-rail-a',name:'Línea A',mode:'elevated',status:'active',operational:true,trainCount:1,powerRequiredKw:50,stations:[[5,10],[10,10]],route:Array.from({length:6},(_,i)=>[i+5,10])},
  {id:'offline-rail-b',name:'Línea B',mode:'elevated',status:'active',operational:true,trainCount:1,freightUsageDay:15,freightUsedToday:60,powerRequiredKw:50,stations:[[10,11],[15,11]],route:Array.from({length:6},(_,i)=>[i+10,11])},
  {id:'offline-rail-c',name:'Línea C',mode:'elevated',status:'active',operational:true,trainCount:1,powerRequiredKw:50,stations:[[10,12],[15,12]],route:Array.from({length:6},(_,i)=>[i+10,12])}
 ];
 const order={id:'offline-transfer-shipment',originType:'factory',businessId:'offline-transfer-factory',businessName:'Procesadora',product:'áridos',mode:'rail',portId:'offline-transfer-port',status:'esperando tren programado',quantity:30,freightLineId:'offline-rail-a',scheduledDepartureDay:12,scheduleIntervalDays:3};
 city.supply.portOrders=[order];city.supply.portVoyages=[];city.supply.factoryExportOrders=[];
 let saved=JSON.stringify(city),clock=1000;
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};Date.now=()=>clock;
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);await adapter.request('/api/state');
  const tick=async()=>{clock+=1000;return adapter.request('/api/state')};
  let view=await tick();let shipment=view.supply.portOrders.find(x=>x.id===order.id);
  assert.equal(shipment.status,'en tránsito ferroviario');assert.equal(shipment.expectedPortDay,16);
  view=await tick();shipment=view.supply.portOrders.find(x=>x.id===order.id);
  assert.equal(shipment.status,'esperando tren programado');assert.equal(shipment.freightLegIndex,1);assert.equal(shipment.expectedPortDay,16);
  await tick();view=await tick();shipment=view.supply.portOrders.find(x=>x.id===order.id);
  assert.equal(shipment.status,'en tránsito ferroviario');assert.equal(shipment.freightLineId,'offline-rail-c');assert.equal(shipment.freightLegs[1].lineId,'offline-rail-c');assert.equal(shipment.expectedPortDay,16);
  view=await tick();shipment=view.supply.portOrders.find(x=>x.id===order.id);
  assert.equal(shipment.status,'en puerto');assert.equal(view.buildings.find(x=>x.kind==='port').cargoStored,30);
  assert.equal(view.metroLines.find(x=>x.id==='offline-rail-a').freightCarriedUnits,30);
  assert.equal(view.metroLines.find(x=>x.id==='offline-rail-b').freightCarriedUnits||0,0);
  assert.equal(view.metroLines.find(x=>x.id==='offline-rail-c').freightCarriedUnits,30);
 }finally{globalThis.fetch=original.fetch;globalThis.localStorage=original.storage;Date.now=original.now}
});
