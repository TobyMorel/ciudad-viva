import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

test('Offline: hospital, comisaría y bomberos se habilitan al colocar sin cuadrillas',async()=>{
 const previousFetch=globalThis.fetch,previousStorage=globalThis.localStorage;
 const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
 seed.money=100000;seed.buildings=[];seed.projects=[];seed.roads=[[4,10]];
 for(const contractor of Object.values(seed.contractors)){contractor.capacity=0;contractor.workers=0}
 let stored=JSON.stringify(seed);
 globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});
 globalThis.localStorage={getItem:()=>stored,setItem:(_,value)=>{stored=value}};
 try{
  const adapter=await createOfflineAdapter();let city;
  for(const [kind,serviceModel,x,y] of [['civic','generalHospital',5,10],['civic','policeStation',4,9],['fireStation','fireStationPlus',4,11]]){
   city=await adapter.request('/api/action',{action:'place',kind,serviceModel,x,y});
   const building=city.buildings.find(b=>b.x===x&&b.y===y);
   assert.equal(building?.status,'habilitado');assert.equal(building.serviceModel,serviceModel);
   assert.equal(city.projects.some(p=>p.x===x&&p.y===y),false);
  }
  assert.equal(city.money,38200);
  assert.equal(city.buildings.find(b=>b.serviceModel==='generalHospital').hospitalWard.beds,36);
  assert.equal(city.buildings.find(b=>b.serviceModel==='policeStation').policeUnit.vehicles,2);
  assert.equal(city.buildings.find(b=>b.serviceModel==='fireStationPlus').fireEngineCapacity,2);
  await assert.rejects(adapter.request('/api/action',{action:'place',kind:'civic',serviceModel:'clinic',x:5,y:10}),/ocupada/);
  const before=city.money;
  await assert.rejects(adapter.request('/api/action',{action:'place',kind:'fireStation',serviceModel:'firePost',x:7,y:10}),/conectada|acceso/);
  city=await adapter.request('/api/state');assert.equal(city.money,before);
 }finally{globalThis.fetch=previousFetch;globalThis.localStorage=previousStorage}
});
