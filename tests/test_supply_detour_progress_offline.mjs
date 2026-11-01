import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));

test('Offline: un camión conserva su ubicación al desviarse por una cola',async()=>{
  const previousFetch=globalThis.fetch,previousStorage=globalThis.localStorage,previousNow=Date.now;
  const storage=new Map(),state=structuredClone(seed),direct=Array.from({length:15},(_,x)=>[x,0]);
  globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
  state.day=10;state.paused=false;state.speed=1;state.roads=[...direct,...Array.from({length:15},(_,x)=>[x,-1])];
  state.traffic={queueState:{lastDay:9,queues:Object.fromEntries(direct.slice(4,-1).map(a=>[`${a[0]},${a[1]}|${a[0]+1},${a[1]}`,100]))}};
  state.supply.depots=[{id:'detour-depot',x:14,y:0,capacity:100,stocks:{'Sur Obras':{aggregate:0,concrete:0,steel:0,timber:0,components:0}}}];
  state.supply.orders=[{id:'offline-detour',status:'en tránsito',supplier:'Corralón del Puerto',contractor:'Sur Obras',destinationId:'detour-depot',destinationLabel:'Depósito de prueba',source:[0,0],route:direct,travelDistance:14,travelledDistance:4,supplierReadyDay:1,orderedDay:1,items:{aggregate:1},arrivalDay:4}];
  storage.set('ciudad-viva-offline-v1',JSON.stringify(state));
  globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});
  let now=5000;Date.now=()=>now;
  try{
    const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);now+=1000;
    const view=await adapter.request('/api/state'),order=view.supply.orders.find(x=>x.id==='offline-detour');
    assert.equal(order.route[0][0],4);assert.equal(order.route[0][1],0);
    assert.notDeepEqual(order.route,direct);
    assert.deepEqual(order.currentPosition,order.route[Math.floor(order.travelledDistance)]);
    assert.equal(order.travelDistance,order.route.length-1);
    assert.equal(order.status,'en tránsito');
  }finally{
    globalThis.fetch=previousFetch;Date.now=previousNow;
    if(previousStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=previousStorage;
  }
});
