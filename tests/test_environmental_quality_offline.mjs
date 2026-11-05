import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const originals={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};
async function adapterWithCity(transform){
 let saved=null;
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};
 const first=await createOfflineAdapter();await first.request('/api/state');const city=transform(JSON.parse(saved));saved=JSON.stringify(city);
 return createOfflineAdapter();
}
test('Offline: industrias y saneamiento incompleto elevan riesgos locales de agua, suelo y salud',async()=>{
 try{
  const adapter=await adapterWithCity(city=>{
   city.day=45;city.population=20;city.roads=[[4,10],[5,10],[6,10]];city.projects=[];city.commutes=[];city.busRoutes=[];city.taxiRoutes=[];city.urbanRenewalWorks=[];
   city.buildings=[
    {kind:'home',name:'Barrio junto a la metalúrgica',x:9,y:10,status:'operativo',capacity:10,occupants:10,residents:[],quality:80,utilityAccess:{waterServedPct:100,wastewaterTreatedPct:100}},
    {kind:'home',name:'Barrio distante',x:20,y:20,status:'operativo',capacity:10,occupants:10,residents:[],quality:80,utilityAccess:{waterServedPct:100,wastewaterTreatedPct:100}},
    {kind:'factory',name:'Metalúrgica del puerto',x:10,y:10,status:'habilitado',business:{status:'abierto',industryType:'metalworks',lastProduction:24,lastWorkers:12}}
   ];return city;
  });
  const state=await adapter.request('/api/state'),near=state.environmentReport.neighborhoods.find(x=>x.name==='Barrio junto a la metalúrgica'),far=state.environmentReport.neighborhoods.find(x=>x.name==='Barrio distante');
  assert.ok(near&&far);assert.ok(near.waterIndex>far.waterIndex);assert.ok(near.soilIndex>far.soilIndex);assert.ok(near.airIndex>far.airIndex);
  assert.equal(state.governmentReport.cityDevelopment.goals.length,8);assert.equal(state.governmentReport.cityDevelopment.specializations.length,6);
  assert.ok(state.healthReport.environmentalPrimaryDemandPerDay>0);
 }finally{globalThis.fetch=originals.fetch;globalThis.localStorage=originals.storage;Date.now=originals.now}
});

test('Offline: la interfaz ofrece capas de agua, suelo y calidad de vida',()=>{
 const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 for(const layer of ['water','soil','quality'])assert.match(source,new RegExp(`layer\\('${layer}'`));
});
