import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

test('Offline: coloca varios tramos al instante y solo cobra el costo vial',async()=>{
 const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
 Object.assign(seed,{newSettlement:true,money:48000,roads:[[4,10]],roadAssets:[],buildings:[],projects:[],abandoned:[],zones:[],paused:true});
 seed.landClaims={chunkSize:8,unlockedChunks:['0,0','0,1','1,0','1,1'],expansionCount:0};
 let saved=JSON.stringify(seed);const old={fetch:globalThis.fetch,localStorage:globalThis.localStorage};
 globalThis.fetch=async()=>({ok:true,json:async()=>seed});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};
 try{
  const adapter=await createOfflineAdapter();let city=await adapter.request('/api/action',{action:'placeRoad',x:5,y:10});
  city=await adapter.request('/api/action',{action:'placeRoad',x:6,y:10});
  assert.deepEqual(city.roads,[[4,10],[5,10],[6,10]]);
  assert.equal(city.money,45600);
  assert.equal(city.projects.length,0);
  assert.ok([[5,10],[6,10]].every(([x,y])=>city.roadAssets.some(asset=>asset.x===x&&asset.y===y)));
  assert.ok(city.events.filter(event=>event.title==='Vía construida').length>=2);
  await assert.rejects(adapter.request('/api/action',{action:'placeRoad',x:6,y:10}),/ya forma parte/);
  await assert.rejects(adapter.request('/api/action',{action:'placeRoad',x:8,y:10}),/conectar con la red/);
 }finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.localStorage}
});
