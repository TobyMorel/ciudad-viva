import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function play(s,fn){
 const previous={fetch:globalThis.fetch,localStorage:globalThis.localStorage,now:Date.now};
 let saved=JSON.stringify(s),now=0;
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};
 Date.now=()=>now;
 try{const adapter=await createOfflineAdapter();await fn({adapter,advance:async()=>{now+=1000;return adapter.request('/api/state')},changeSave:fn=>{saved=JSON.stringify(fn(JSON.parse(saved)))}})}
 finally{globalThis.fetch=previous.fetch;globalThis.localStorage=previous.localStorage;Date.now=previous.now}
}
test('Offline: feria se contrata una sola vez y liquida visitantes separados',async()=>{
 const s=seed();s.day=30;s.lastMonth=0;s.paused=false;s.speed=1;s.money=100000;
 for(const b of s.buildings.filter(b=>b.kind==='shop')){b.business.inventory=500;b.business.cash=3000;b.business.price=20}
 await play(s,async({adapter,advance})=>{
   let city=await adapter.request('/api/action',{action:'scheduleTourismEvent',kind:'feria'});
   assert.equal(city.tourism.events[0].status,'programado');
   assert.equal(city.money,98800);
   await assert.rejects(adapter.request('/api/action',{action:'scheduleTourismEvent',kind:'feria'}),/evento/);
   city=await advance();
   const e=city.tourism.events[0];
   assert.equal(e.status,'realizado',e.statusCause||'El recinto debe operar');
   assert.ok(e.visitors>0);
   assert.ok(city.tourism.eventVisitors>0);
   assert.ok(e.retailSpend>0,'Las compras deben usar existencias');
   assert.ok(!city.buildings.some(b=>b.kind==='hotel'&&b.residents?.length),'Los turistas no se crean como residentes de hotel');
   const spend=e.retailSpend;
   const same=await adapter.request('/api/state');
   assert.equal(same.tourism.events[0].retailSpend,spend);
 });
});
test('Offline: si la feria pierde las calles se cancela sin reembolso',async()=>{
 const s=seed();s.day=30;s.lastMonth=0;s.paused=false;s.speed=1;s.money=100000;
 await play(s,async({adapter,advance,changeSave})=>{
   let city=await adapter.request('/api/action',{action:'scheduleTourismEvent',kind:'feria'});
   assert.equal(city.tourism.events[0].status,'programado');
   const balance=city.money;
   changeSave(s=>{s.roads=[];return s});
   await adapter.request('/api/load');
   city=await advance();
   assert.equal(city.tourism.events[0].status,'cancelado');
   assert.equal(city.tourism.events[0].visitors,0);
   assert.equal(city.tourism.eventRetailSpend,0);
   assert.equal(city.tourism.events[0].organizationCost,1200);
   assert.equal(city.tourism.events[0].cleanupSpend,0,'No se cobran servicios de un evento cancelado');
   assert.equal(balance,98800,'La organización se cobró al contratar, antes del cierre financiero');
 });
});
