import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

test('Offline: asigna taxi, respeta paradas y persiste el circuito de ida y vuelta',async()=>{
 const city=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
 Object.assign(city,{paused:true,money:48000,roads:Array.from({length:9},(_,i)=>[4+i,10]),buildings:[{x:5,y:9,kind:'depot',serviceModel:'taxiYard',name:'Depósito Centro',status:'habilitado',taxiCapacity:2}],projects:[],busRoutes:[],taxiRoutes:[]});
 city.landClaims={chunkSize:8,unlockedChunks:['0,0','1,0','0,1','1,1'],expansionCount:0};
 let saved=JSON.stringify(city);const old={fetch:globalThis.fetch,localStorage:globalThis.localStorage};globalThis.fetch=async()=>({ok:true,json:async()=>city});globalThis.localStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v}};
 try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);const result=await adapter.request('/api/action',{action:'createTaxiRouteFromDepot',depotX:5,depotY:9,stops:[[7,10],[10,10]]});const taxi=result.taxiRoutes[0];assert.equal(taxi.depotId,'taxidepot-5-9');assert.deepEqual(taxi.stops.map(x=>x.at),[[7,10],[10,10]]);assert.equal(taxi.route[0].join(','),taxi.route.at(-1).join(','));assert.equal(result.money,48000-3240);assert.equal(result.taxiDepots[0].occupied,1);const reload=await adapter.request('/api/state');assert.deepEqual(reload.taxiRoutes[0].route,taxi.route);await assert.rejects(adapter.request('/api/action',{action:'createTaxiRouteFromDepot',depotX:5,depotY:9,stops:[[7,10],[7,10]]}),/repetirse/)}finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.localStorage}
});
