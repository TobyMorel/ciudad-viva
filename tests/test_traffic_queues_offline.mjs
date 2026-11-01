import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));

test('Offline publica las nueve franjas y aplica demora de cola a los viajes motorizados',async()=>{
 const previousFetch=globalThis.fetch,previousStorage=globalThis.localStorage;
 const storage=new Map([['ciudad-viva-offline-v1',JSON.stringify(seed)]]);globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});
 try{
  const adapter=await createOfflineAdapter(),state=await adapter.request('/api/state'),report=state.traffic.queueReport;
  assert.equal(report.windows.length,9);
  assert.ok(report.windows.every(row=>typeof row.meanDelayMinutes==='number'));
  const motorized=state.commutes.filter(trip=>trip.mode!=='walk');
  assert.ok(motorized.length>0);
  assert.ok(motorized.every(trip=>typeof trip.queueDelayMinutes==='number'));
  const stored=state.traffic.queueState;
  assert.equal(stored.lastDay,state.day);
  assert.ok(stored.queues&&typeof stored.queues==='object');
 }finally{
  globalThis.fetch=previousFetch;
  if(previousStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=previousStorage;
 }
});
