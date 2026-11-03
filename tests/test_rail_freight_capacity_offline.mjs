import test from 'node:test';
import assert from 'node:assert/strict';
import {metroAssignPassengers} from '../metro.js?v=0.240';
import {freightCapacityMetrics,freightRoutesForFactoryPort,railFreightReport,reserveFreightCapacity,reserveFreightRoute} from '../rail_freight.js?v=0.240';

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
