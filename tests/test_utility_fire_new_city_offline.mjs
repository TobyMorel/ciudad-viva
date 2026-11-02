import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const base=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function withCity(city,work){
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};let now=0,stored=JSON.stringify(city);
 globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(city)});
 globalThis.localStorage={getItem:()=>stored,setItem:(_,v)=>{stored=v}};
 Date.now=()=>now;
 try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);return await work(adapter,()=>{now+=1000})}
 finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.storage;Date.now=old.now}
}

test('Offline: ciudad nueva requiere plantas para luz, agua y gas',async()=>{
 const city=base();city.newSettlement=true;city.day=1;city.roads=[[4,10]];city.buildings=[{x:5,y:10,kind:'home',name:'Casa',status:'habilitado',occupants:4,capacity:4,residents:[],quality:82}];city.projects=[];city.utilities={...city.utilities,basePowerCapacityKw:0,baseWaterCapacityM3Day:0,baseGasCapacityM3Day:0,powerLines:[[4,10]],waterPipes:[[4,10]],sewerLines:[[4,10]],gasLines:[[4,10]]};
 await withCity(city,async adapter=>{
  let s=await adapter.request('/api/state');assert.equal(s.utilities.report.power.installedKw,0);assert.equal(s.utilities.report.water.sourceCapacityM3Day,0);assert.equal(s.utilities.report.gas.capacityM3Day,0);
  city.buildings.push({x:4,y:9,kind:'powerPlant',status:'habilitado',quality:82,generationKw:900},{x:4,y:11,kind:'waterPlant',status:'habilitado',quality:82,treatmentM3Day:220},{x:3,y:10,kind:'gasPlant',status:'habilitado',quality:82,gasCapacityM3Day:160});
 });
 const fed=base();fed.newSettlement=true;fed.roads=[[4,10]];fed.buildings=[{x:5,y:10,kind:'home',name:'Casa',status:'habilitado',occupants:4,capacity:4,residents:[],quality:82},{x:4,y:9,kind:'powerPlant',status:'habilitado',quality:82,generationKw:900},{x:4,y:11,kind:'waterPlant',status:'habilitado',quality:82,treatmentM3Day:220},{x:3,y:10,kind:'gasPlant',status:'habilitado',quality:82,gasCapacityM3Day:160}];fed.projects=[];fed.utilities={...fed.utilities,basePowerCapacityKw:0,baseWaterCapacityM3Day:0,baseGasCapacityM3Day:0,powerLines:[[4,10]],waterPipes:[[4,10]],sewerLines:[[4,10]],gasLines:[[4,10]]};
 await withCity(fed,async adapter=>{const s=await adapter.request('/api/state');assert.equal(s.utilities.report.power.installedKw,900);assert.equal(s.utilities.report.water.sourceCapacityM3Day,220);assert.equal(s.utilities.report.gas.capacityM3Day,160)})
});
