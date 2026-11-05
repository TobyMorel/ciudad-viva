import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';
import {airportNoiseSource,airportWeatherAdjustment,tourismSeason} from '../airport_operations.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));

test('Tormentas reducen pasajeros, la temporada cambia visitantes y los vuelos crean ruido local',()=>{
 const calm=airportWeatherAdjustment(400,0),stormy=airportWeatherAdjustment(400,2);
 assert.equal(calm.passengers,400);assert.equal(stormy.passengers,352);assert.equal(stormy.disruptedPassengers,48);assert.equal(stormy.delayHours,4);
 assert.equal(tourismSeason(1).name,'Verano');assert.notEqual(tourismSeason(1).visitorFactor,tourismSeason(181).visitorFactor);
 assert.ok(airportNoiseSource(12).noise>airportNoiseSource(0).noise);
});

test('Offline: los movimientos aéreos elevan más el ruido cerca de la terminal',async()=>{
 const original={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now},store=new Map();
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
 globalThis.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};Date.now=()=>1000;
 try{
  const adapter=await createOfflineAdapter();await adapter.request('/api/state');
  const city=JSON.parse(store.get('ciudad-viva-offline-v1'));city.day=90;city.paused=true;city.population=20;city.roads=[[4,10],[5,10],[6,10]];city.projects=[];city.commutes=[];city.buildings=[
   {kind:'home',name:'Barrio junto al aeropuerto',x:11,y:10,status:'operativo',capacity:10,occupants:10,residents:[],quality:80},
   {kind:'home',name:'Barrio distante',x:20,y:20,status:'operativo',capacity:10,occupants:10,residents:[],quality:80},
   {kind:'airport',name:'Aeropuerto regional',x:10,y:10,status:'operativo',monthlyFlights:12,monthlyPassengers:800}
  ];store.set('ciudad-viva-offline-v1',JSON.stringify(city));
  const view=await adapter.request('/api/load'),near=view.environmentReport.neighborhoods.find(row=>row.name==='Barrio junto al aeropuerto'),far=view.environmentReport.neighborhoods.find(row=>row.name==='Barrio distante');
  assert.ok(near.noiseIndex>far.noiseIndex,`${near.noiseIndex} should exceed ${far.noiseIndex}`);
  assert.equal(view.environmentReport.noise.monthlyAirportMovements,12);
 }finally{globalThis.fetch=original.fetch;Date.now=original.now;if(original.storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=original.storage}
});
