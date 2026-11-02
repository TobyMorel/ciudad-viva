import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

test('Offline: un cruce permite retirar y volver a instalar su semáforo',async()=>{
 const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
 seed.paused=true;let saved=JSON.stringify(seed);
 const old={fetch:globalThis.fetch,localStorage:globalThis.localStorage};
 globalThis.fetch=async()=>({ok:true,json:async()=>seed});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};
 try{
  const adapter=await createOfflineAdapter(),request=body=>adapter.request('/api/action',body);
  let city=await request({action:'toggleTrafficSignal',x:12,y:10});
  assert.equal(city.trafficSignalOverrides['12,10'],false);
  city=await request({action:'toggleTrafficSignal',x:12,y:10});
  assert.equal(city.trafficSignalOverrides['12,10'],true);
  await assert.rejects(request({action:'toggleTrafficSignal',x:11,y:10}),/cruce/);
 }finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.localStorage}
});
