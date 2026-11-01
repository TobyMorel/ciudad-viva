import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
test('Offline: dos buques comparten el cupo portuario sin duplicar acero',async()=>{
  const city=seed();city.day=99;city.lastMonth=3;city.paused=false;city.speed=1;
  city.buildings.push({kind:'port',x:4,y:10,operational:true,unloadingCapacity:7});
  city.supply.suppliers['Corralón del Puerto'].steel=0;
  city.supply.steelShipments=[
    {quantity:5,port:[4,10],arrivalDay:100,status:'en viaje'},
    {quantity:8,port:[4,10],arrivalDay:100,status:'en viaje'},
  ];
  const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,oldNow=Date.now;
  let persisted=JSON.stringify(city),now=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
  globalThis.localStorage={getItem:()=>persisted,setItem:(_,v)=>{persisted=v}};
  Date.now=()=>now;
  try{
    const adapter=await createOfflineAdapter();
    now=1000;
    let s=await adapter.request('/api/state');
    assert.equal(s.day,100);
    assert.deepEqual(s.supply.steelShipments.map(x=>x.deliveredUnits),[5,2]);
    assert.equal(s.supply.suppliers['Corralón del Puerto'].steel,7);
    assert.equal(s.supply.steelImportedUnits,7);
    s=await adapter.request('/api/state');
    assert.equal(s.supply.steelImportedUnits,7,'No se reutiliza el cupo diario');
    now=2000;
    s=await adapter.request('/api/state');
    assert.deepEqual(s.supply.steelShipments.map(x=>x.deliveredUnits),[5,8]);
    assert.equal(s.supply.suppliers['Corralón del Puerto'].steel,13);
    assert.equal(s.supply.steelImportedUnits,13);
    assert.ok(s.supply.steelShipments.every(x=>x.status==='entregado'));
  }finally{globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;Date.now=oldNow}
});
