import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

test('Offline: traza colectivo desde depósito, conserva orden y cobra paradas y flota',async()=>{
 const city=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
 Object.assign(city,{paused:true,money:48000,roads:Array.from({length:8},(_,i)=>[4+i,10]),buildings:[{x:5,y:9,kind:'busGarage',name:'Depósito Norte',status:'habilitado',busBayCapacity:4}],projects:[],busRoutes:[]});
 city.landClaims={chunkSize:8,unlockedChunks:['0,0','1,0','0,1','1,1'],expansionCount:0};
 let saved=JSON.stringify(city);const old={fetch:globalThis.fetch,localStorage:globalThis.localStorage};globalThis.fetch=async()=>({ok:true,json:async()=>city});globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);const result=await adapter.request('/api/action',{action:'createBusRouteFromGarage',garageX:5,garageY:9,stops:[[7,10],[9,10]],buses:2}),line=result.busRoutes.find(x=>x.manualRoute);
  assert.ok(line);assert.equal(line.garageId,'garage-5-9');assert.deepEqual(line.route,[[5,10],[6,10],[7,10],[8,10],[9,10]]);assert.deepEqual(line.stops.map(x=>x.routeIndex),[2,4]);assert.equal(result.money,48000-(2*700+2*350));assert.ok(result.events.some(e=>e.title==='Línea de colectivo trazada'));const reloaded=await adapter.request('/api/state');assert.deepEqual(reloaded.busRoutes.find(x=>x.manualRoute).stops.map(x=>x.routeIndex),[2,4]);
  await assert.rejects(adapter.request('/api/action',{action:'createBusRouteFromGarage',garageX:5,garageY:9,stops:[[6,10],[8,10]]}),/una línea/);
 }finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.localStorage}
});
