import test from 'node:test';
import assert from 'node:assert/strict';
import {assignBusNonworkPassengers} from '../bus_nonwork.js';
import {metroAssignPassengers,settleMetroMonth} from '../metro.js';
import {assignTaxiPassengers} from '../taxi_passengers.js';

function fixture(reverse=false,mode='metro'){
 const path=Array.from({length:4},(_,i)=>[reverse?3-i:i,0]);
 const bus={id:'bus',status:'active',operational:true,route:path,stops:[{at:path[0]},{at:path[3]}],fare:.25,headwayMinutes:4,ridersByWindow:{midday:0},capacityByWindow:{midday:2}};
 const rail={id:'train',mode:mode==='tren'?'elevated':undefined,status:'active',trainCount:1,stations:[[3,1],[11,1]],route:Array.from({length:9},(_,i)=>[i+3,1]),fareCents:mode==='tren'?85:60,powerRequiredKw:90};
 const from=reverse?[11,1]:[0,1],to=reverse?[0,1]:[11,1];
 const state={day:1,busRoutes:[bus],metroLines:[rail],taxiRoutes:[],roads:Array.from({length:12},(_,i)=>[i,0]),roadAssets:[],buildings:[{kind:'home',x:from[0],y:from[1],householdCash:20},{kind:'powerPlant',status:'habilitado',generationKw:900}],utilities:{},finance:{programBudgets:{mobilityFundingFactor:1}}};
 const trip={reason:'compras',mode:'auto',from,to,distance:12,workers:5,vehicles:4,dailyEmissionsKg:4};
 return {state,trip,bus,rail};
}
function run(f){assignBusNonworkPassengers(f.state,[f.trip]);const result=metroAssignPassengers(f.state,[f.trip]);assignTaxiPassengers(f.state,[f.trip]);return result}
test('collective to subway: seat reservation and one unique rider',()=>{const f=fixture(),r=run(f);assert.equal(r.intermodalTransfers,2);assert.equal(r.metroRiders,2);assert.equal(f.trip.vehicles,3);assert.equal(f.bus.ridersByWindow.midday,2);assert.equal(f.rail.dailyRiders,2);assert.equal(f.trip.intermodalJourneys[0].fareCents,70)});
test('subway to collective has discounted second leg',()=>{const f=fixture(true),r=run(f);assert.equal(r.intermodalTransfers,2);assert.equal(f.trip.intermodalJourneys[0].fareCents,79)});
test('elevated train to collective has separate rail count',()=>{const f=fixture(true,'tren'),r=run(f);assert.equal(r.railRiders,2);assert.equal(r.metroRiders,0)});
test('unavailable power, bus seats, roads or service blocks transfers',()=>{for(const kind of ['power','seats','road','paused']){const f=fixture();if(kind==='power')f.state.buildings.pop();if(kind==='seats')f.bus.capacityByWindow.midday=0;if(kind==='road')f.state.roads=f.state.roads.filter(p=>p[0]!==2);if(kind==='paused')f.rail.status='paused';assert.equal(run(f).intermodalTransfers,0,kind)}});

test('recalcular el mismo día no duplica tarifas ni usa dos veces los asientos',()=>{
 const f=fixture();run(f);
 const oldBus=JSON.stringify(f.bus.nonworkFaresByDay),oldRail=JSON.stringify(f.rail.fareByDay);
 f.bus.ridersByWindow.midday=0;
 f.trip={...f.trip,intermodalRiders:999};
 assert.equal(run(f).intermodalTransfers,2);
 assert.equal(f.trip.intermodalRiders,2);
 assert.equal(JSON.stringify(f.bus.nonworkFaresByDay),oldBus);
 assert.equal(JSON.stringify(f.rail.fareByDay),oldRail);
 assert.equal(f.bus.ridersByWindow.midday,2);
 assert.equal(f.rail.dailyRiders,2);
});


function railTransferFixture(workers=5){
 const roads=Array.from({length:21},(_,i)=>[i+3,10]);
 const railStations=[
  {mode:'metro',status:'active',x:3,y:9,name:'Terminal Norte'},
  {mode:'metro',status:'active',x:13,y:9,name:'Intercambiador subte'},
  {mode:'elevated',status:'active',x:13,y:11,name:'Intercambiador elevado'},
  {mode:'elevated',status:'active',x:23,y:11,name:'Terminal Sur'}
 ];
 const first={id:'metro-a',stations:[[3,9],[13,9]],route:Array.from({length:11},(_,i)=>[i+3,9]),status:'active',trainCount:2,fareCents:60,powerRequiredKw:125};
 const second={id:'rail-b',mode:'elevated',stations:[[13,11],[23,11]],route:Array.from({length:11},(_,i)=>[i+13,10]),status:'active',trainCount:2,fareCents:85,powerRequiredKw:205};
 const state={day:1,roads,roadAssets:[],railStations,metroLines:[first,second],busRoutes:[],taxiRoutes:[],utilities:{},
  finance:{programBudgets:{mobilityFundingFactor:1}},
  buildings:[{kind:'home',x:3,y:8,householdCash:20},{kind:'powerPlant',status:'habilitado',generationKw:900,quality:82}]};
 const trip={reason:'compras',mode:'auto',from:[3,8],to:[23,8],distance:30,workers,vehicles:Math.ceil(workers/1.4),dailyEmissionsKg:100};
 return{state,trip,first,second};
}
test('líneas de subte y tren conectadas por estaciones físicas comparten el viaje y el cobro',()=>{
 const f=railTransferFixture(),report=metroAssignPassengers(f.state,[f.trip]);
 assert.equal(report.railTransfers,5);assert.equal(report.intermodalTransfers,5);
 assert.equal(report.metroRiders,5);assert.equal(report.railRiders,5);
 assert.equal(f.first.dailyRiders,5);assert.equal(f.second.dailyRiders,5);assert.equal(f.trip.vehicles,0);
 assert.deepEqual(f.trip.intermodalJourneys[0].railLineIds,['metro-a','rail-b']);
 assert.deepEqual(f.trip.intermodalJourneys[0].fareByLineCents,[60,64]);
 assert.equal(settleMetroMonth(f.state).income,6);assert.equal(f.state.buildings[0].householdCash,14);
 assert.equal(settleMetroMonth(f.state).income,0);
});
test('el transbordo usa el aforo menor y requiere una estación física terminada',()=>{
 let f=railTransferFixture(300),report=metroAssignPassengers(f.state,[f.trip]);
 assert.equal(report.intermodalTransfers,240);assert.equal(f.first.dailyRiders,240);assert.equal(f.second.dailyRiders,240);
 f=railTransferFixture();f.state.railStations=f.state.railStations.filter(s=>s.x!==13||s.y!==11);
 report=metroAssignPassengers(f.state,[f.trip]);assert.equal(report.intermodalTransfers,0);
 assert.equal(f.first.dailyRiders,0);assert.equal(f.second.dailyRiders,0);
});
