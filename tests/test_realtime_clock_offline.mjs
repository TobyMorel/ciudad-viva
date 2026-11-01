import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));

test('Offline avanza un día ordenado por actualización, escala x4 y se congela al pausar',async()=>{
 const previousFetch=globalThis.fetch,previousStorage=globalThis.localStorage,previousNow=Date.now;
 let now=10_000;Date.now=()=>now;
 const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(true);
  await adapter.request('/api/action',{action:'speed',value:4});
  let state=await adapter.request('/api/state'),day=state.day;
  for(let i=0;i<4;i++){
   now+=250;state=await adapter.request('/api/state');
   assert.equal(state.day,day+1,`la actualización ${i+1} debe procesar un solo día, sin saltos`);day=state.day;
  }
  await adapter.request('/api/action',{action:'pause'});now+=10_000;
  state=await adapter.request('/api/state');assert.equal(state.day,day);assert.equal(state.paused,true);
  await adapter.request('/api/action',{action:'pause'});now+=250;
  state=await adapter.request('/api/state');assert.equal(state.day,day+1);assert.equal(state.paused,false);
  day=state.day;now+=1_500;
  for(let i=0;i<6;i++){
   state=await adapter.request('/api/state');
   assert.equal(state.day,day+1,'el atraso largo debe recuperarse de a un día y sin perder tiempo');day=state.day;
  }
 }finally{Date.now=previousNow;globalThis.fetch=previousFetch;if(previousStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=previousStorage}
});
