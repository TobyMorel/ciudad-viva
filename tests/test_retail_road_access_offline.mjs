import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

function seed(){
  const s=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
  s.day=30;s.lastMonth=0;s.speed=1;s.paused=false;
  for(const home of s.buildings.filter(b=>b.kind==='home')){
    home.householdCash=10000;
  }
  for(const shop of s.buildings.filter(b=>b.kind==='shop')){
    shop.business.cash=50000;
    shop.business.inventory=40;
    shop.business.inputInventory=40;
  }
  return s;
}
async function monthly(s){
  const fetch0=globalThis.fetch,storage0=globalThis.localStorage,now0=Date.now;
  let persisted=JSON.stringify(s),now=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
  globalThis.localStorage={getItem:()=>persisted,setItem:(_,v)=>{persisted=v}};
  Date.now=()=>now;
  try{
    const adapter=await createOfflineAdapter();
    now+=1000;
    const city=await adapter.request('/api/state');
    return city.buildings.filter(b=>b.kind==='shop').reduce((n,b)=>n+(b.business?.lastLocalDemand||0),0);
  } finally {globalThis.fetch=fetch0;globalThis.localStorage=storage0;Date.now=now0}
}
test('Offline: un corte total de calles impide desplazamientos de compra doméstica',async()=>{
  const connected=seed(),isolated=seed();isolated.roads=[];
  const demand=await monthly(connected);
  assert.ok(demand>0,'Con calles los hogares pueden demandar productos');
  assert.equal(await monthly(isolated),0,'Sin calles no hay compras locales ficticias');
});
