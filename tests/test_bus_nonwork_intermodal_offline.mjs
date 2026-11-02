import test from 'node:test';
import assert from 'node:assert/strict';
import {assignBusNonworkPassengers,collectBusNonworkFares} from '../bus_nonwork.js';
import {assignTaxiPassengers} from '../taxi_passengers.js';
function fixture(){
 const city={day:1,busRoutes:[
  {id:'A',status:'active',operational:true,fare:.25,headwayMinutes:2,route:Array.from({length:4},(_,i)=>[i,0]),stops:[{at:[0,0]},{at:[3,0]}],ridersByWindow:{midday:0},capacityByWindow:{midday:2}},
  {id:'B',status:'active',operational:true,fare:.25,headwayMinutes:2,route:Array.from({length:4},(_,i)=>[i+3,0]),stops:[{at:[3,0]},{at:[6,0]}],ridersByWindow:{midday:0},capacityByWindow:{midday:3}}
 ],taxiRoutes:[],roads:Array.from({length:7},(_,i)=>[i,0]),buildings:[{kind:'home',x:0,y:1,householdCash:10}]};
 const trips=[{reason:'compras',mode:'auto',from:[0,1],to:[6,1],workers:5,distance:12,vehicles:4,dailyEmissionsKg:17.28}];
 return {city,trips};
}
test('dos líneas con transbordo transportan como máximo los asientos libres',()=>{
 const {city,trips}=fixture(),report=assignBusNonworkPassengers(city,trips);
 assert.equal(report.busNonworkPassengers,2);assert.equal(report.busNonworkTransfers,2);
 assert.equal(trips[0].workers,5);assert.equal(trips[0].busRiders,2);assert.equal(trips[0].vehicles,3);
 assert.deepEqual(trips[0].busJourneys[0].lineIds,['A','B']);
 assert.deepEqual(city.busRoutes.map(l=>l.ridersByWindow.midday),[2,2]);
 assert.equal(report.busNonworkFareRevenue,.82);
 collectBusNonworkFares(city);assert.equal(city.buildings[0].householdCash,9);
 assert.equal(city.busRoutes.reduce((n,l)=>n+l.monthlyFareRevenue,0),1);
});
test('revisar la simulación no duplica cargos y el mes nuevo reinicia registros',()=>{
 const {city,trips}=fixture();assignBusNonworkPassengers(city,trips);
 const first=JSON.stringify(city.busRoutes.map(l=>l.nonworkFaresByDay));
 city.busRoutes.forEach(l=>l.ridersByWindow.midday=0);
 assignBusNonworkPassengers(city,trips);assert.equal(JSON.stringify(city.busRoutes.map(l=>l.nonworkFaresByDay)),first);
 city.day=31;city.busRoutes.forEach(l=>l.ridersByWindow.midday=0);
 assignBusNonworkPassengers(city,trips);
 assert.deepEqual(city.busRoutes.map(l=>Object.keys(l.nonworkFaresByDay)),[['31'],['31']]);
});
test('sin línea operativa, paradas correctas o asientos no hay viaje',()=>{
 const {city,trips}=fixture();city.busRoutes[0].operational=false;
 assert.equal(assignBusNonworkPassengers(city,trips).busNonworkPassengers,0);
 city.busRoutes[0].operational=true;city.busRoutes[0].stops=[{at:[0,0]}];
 assert.equal(assignBusNonworkPassengers(city,trips).busNonworkPassengers,0);
});
test('el taxi solo puede recibir quienes no tomaron el colectivo',()=>{
 const {city,trips}=fixture();city.busRoutes.forEach(l=>l.capacityByWindow.midday=4);
 assignBusNonworkPassengers(city,trips);assert.equal(trips[0].busRiders,4);
 assignTaxiPassengers(city,trips);assert.equal(trips[0].vehicles,1);
 assert.ok(trips[0].busRiders+(trips[0].taxiRiders||0)<=trips[0].workers);
});
