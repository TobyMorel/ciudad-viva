import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

test('Offline: el excedente de fábrica recorre calles y deja ingreso al exportador',async()=>{
 const original={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};let encoded=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8')),clock=1000;
 encoded.day=30;encoded.lastMonth=0;encoded.paused=false;encoded.speed=1;encoded.roads=Array.from({length:20},(_,i)=>[i+4,10]);encoded.buildings=[{kind:'factory',x:6,y:10,name:'Fábrica exportadora',status:'habilitado',business:{id:'offline-food-export',name:'Fábrica exportadora',industryType:'food',status:'abierto',cash:50000,jobSlots:0}}];encoded.supply.market['Fábrica local 7-11']={stock:100,maxStock:100,monthlyOutput:0,commodity:'alimentos',unitCost:4,source:[6,10]};let saved=JSON.stringify(encoded);
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});globalThis.localStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v}};Date.now=()=>clock;
 try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);clock+=1000;let state=await adapter.request('/api/state');let order=state.supply.factoryExportOrders?.[0];assert.ok(order);assert.equal(order.mode,'land');assert.deepEqual(order.route[0],[6,10]);assert.deepEqual(order.route.at(-1),[23,10]);for(let i=0;i<4;i++){clock+=1000;state=await adapter.request('/api/state')}order=state.supply.factoryExportOrders.find(o=>o.id===order.id);assert.equal(order.status,'exportado');assert.ok(order.settled);assert.equal(state.buildings.find(b=>b.kind==='factory').business.lastExportRevenue,order.revenue)}finally{globalThis.fetch=original.fetch;globalThis.localStorage=original.storage;Date.now=original.now}
});
