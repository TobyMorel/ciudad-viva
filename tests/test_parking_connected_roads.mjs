import test from 'node:test';
import assert from 'node:assert/strict';
import {assignParking} from '../road_network.js';

const trip=(from,to)=>({from,to,mode:'auto',reason:'compras',vehicles:1,workers:1,estimatedMinutes:8,trafficFactor:1,departureWindowKey:'midday'});

test('una plaza inaccesible no se reserva ni cuenta como estacionamiento del viaje',()=>{
  const state={roads:[[1,1],[2,1],[3,1],[10,1],[11,1],[12,1]],roadAssets:[],buildings:[],traffic:{}};
  const journey=trip([1,0],[11,0]);
  const report=assignParking(state,[journey]);
  assert.equal(journey.parkingSlot,null);
  assert.equal(journey.parkingShortfall,1);
  assert.deepEqual(journey.parkingRoute,[]);
  assert.equal(report.reservations.length,0);
});

test('viajes simultáneos usan plazas distintas y rutas viales conectadas',()=>{
  const roads=Array.from({length:12},(_,i)=>[i+1,1]);
  const state={roads,roadAssets:[],buildings:[],traffic:{}};
  const journeys=[trip([1,0],[11,0]),trip([1,0],[11,0])];
  assignParking(state,journeys);
  assert.ok(journeys.every(journey=>journey.parkingSlot&&journey.parkingRoute.length));
  assert.notEqual(journeys[0].parkingSlot.id,journeys[1].parkingSlot.id);
  const roadIds=new Set(roads.map(([x,y])=>`${x},${y}`));
  assert.ok(journeys.every(journey=>journey.parkingRoute.every(([x,y])=>roadIds.has(`${x},${y}`))));
});

test('el regreso conserva el faltante cuando tampoco hubo plaza en el destino',()=>{
  const state={roads:[[1,1],[2,1],[3,1],[10,1],[11,1],[12,1]],roadAssets:[],buildings:[],traffic:{}};
  const outward={...trip([1,0],[11,0]),reason:'trabajo'};
  const back={...trip([11,0],[1,0]),reason:'regreso'};
  assignParking(state,[outward,back]);
  assert.equal(outward.parkingShortfall,1);
  assert.equal(back.parkingShortfall,1);
  assert.equal(back.parkingSearching,true);
});

test('una calle cerrada interrumpe el acceso a las plazas del otro lado',()=>{
  const roads=Array.from({length:12},(_,i)=>[i+1,1]);
  const state={roads,roadAssets:[{x:6,y:1,quality:10}],buildings:[],traffic:{}};
  const journey=trip([1,0],[11,0]);
  assignParking(state,[journey]);
  assert.equal(journey.parkingSlot,null);
  assert.equal(journey.parkingShortfall,1);
});
