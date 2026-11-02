import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assignTaxiPassengers} from '../taxi_passengers.js';

function fixture(){
 const state={day:1,roads:Array.from({length:10},(_,i)=>[i+4,10]),
 buildings:[{x:5,y:9,kind:'depot',serviceModel:'taxiYard',status:'habilitado'}],
 taxiRoutes:[{id:'taxi-a',depotX:5,depotY:9,status:'active',operational:true,route:[...Array.from({length:9},(_,i)=>[i+5,10]),...Array.from({length:8},(_,i)=>[12-i,10])],stops:[{at:[7,10]},{at:[12,10]}],fare:.45}]};
 const trips=[{from:[7,9],to:[12,9],route:Array.from({length:6},(_,i)=>[7+i,10]),mode:'auto',reason:'compras',distance:5,workers:10,vehicles:8,dailyEmissionsKg:14.4}];
 return{state,trips};
}
test('taxis atienden viajes reales con aforo, sin doble facturación y reinicio mensual',()=>{
 const{state,trips}=fixture(),taxi=state.taxiRoutes[0];
 const first=assignTaxiPassengers(state,trips);
 assert.equal(first.dailyRiders,8);assert.equal(first.activeVehicles,1);assert.equal(trips[0].vehicles,2);
 assert.equal(taxi.monthlyFareRevenue,4);
 assignTaxiPassengers(state,trips);assert.equal(taxi.monthlyFareRevenue,4);
 state.day=2;assignTaxiPassengers(state,trips);assert.equal(taxi.monthlyFareRevenue,7);
 state.day=31;assignTaxiPassengers(state,trips);assert.equal(taxi.monthlyFareRevenue,4);
});
test('servicio pausado, ruta cortada y viaje peatonal no cobran',()=>{
 const{state,trips}=fixture(),taxi=state.taxiRoutes[0];trips[0].reason='trabajo';
 assignTaxiPassengers(state,trips);assert.equal(taxi.dailyRiders,0);
 trips[0].reason='servicios';taxi.status='paused';
 assignTaxiPassengers(state,trips);assert.equal(taxi.dailyRiders,0);
 taxi.status='active';state.roads=state.roads.filter(([x])=>x!==10);
 const report=assignTaxiPassengers(state,trips);
 assert.equal(report.dailyRiders,0);assert.equal(report.activeVehicles,0);
 assert.match(taxi.pauseReason,/circuito/);assert.equal(trips[0].taxiRiders,undefined);
 state.roads.push([10,10]);trips[0].mode='walk';
 assignTaxiPassengers(state,trips);assert.equal(taxi.dailyRiders,0);
});
