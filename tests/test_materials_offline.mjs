import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createOfflineAdapter } from '../offline.js';

function fixture(){
  const s=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
  s.day=1;s.lastMonth=0;s.paused=false;s.speed=1;
  s.supply.contractors['Sur Obras'].components=0;
  s.supply.contractorCash['Sur Obras']=9000;
  s.supply.suppliers['Metalúrgica local']={aggregate:0,concrete:0,steel:0,timber:0,components:4,cash:2000,lastSales:0};
  s.buildings.push({x:4,y:9,kind:'factory',name:'Metalúrgica de prueba',status:'habilitado',
    utilityAccess:{powerServedPct:0,waterServedPct:0,wastewaterTreatedPct:0},
    monthlyOperatingCost:420,business:{id:'metal-test',name:'Metalúrgica de prueba',industryType:'metalworks',
    status:'abierto',cash:2000,componentStock:4,rawSteelInventory:0,jobSlots:20,wage:12}});
  return s;
}
async function scenario(city,fn){
  const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,oldNow=Date.now;
  let stored=JSON.stringify(city),clock=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
  globalThis.localStorage={getItem:()=>stored,setItem:(_,v)=>{stored=v}};
  Date.now=()=>clock;
  try{
    const adapter=await createOfflineAdapter();
    const tick=async()=>{clock+=1000;return adapter.request('/api/state')};
    await fn({adapter,tick});
  }finally{
    globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;Date.now=oldNow;
  }
}
test('Offline: una obra sigue sus etapas aunque no exista inventario de materiales',async()=>{
  const s=fixture();
  s.projects.push({id:'test-components',kind:'road',label:'Calle de prueba',x:4,y:11,
    contractor:'Sur Obras',status:'contratada',cause:'',duration:4,elapsed:0,progress:0,
    initialProgress:0,stages:['Inspección'],stageIndex:0,workersAssigned:4,cost:0,paid:0,
    privatePaid:true,contractedDay:1,changeOrderReviewed:true,retentionPct:0,
    materialsRequired:{aggregate:0,concrete:0,steel:0,timber:0,components:4},
    materialsUsed:{aggregate:0,concrete:0,steel:0,timber:0,components:0}});
  await scenario(s,async({adapter,tick})=>{
    let state=await tick();
    assert.equal(state.projects[0].status,'contratada');
    assert.equal(state.projects[0].elapsed,1);
    assert.equal(state.supply.orders.length,0);
    let delivered=false;
    for(let i=0;i<12;i++){
      state=await tick();
      delivered ||=state.roads.some(([x,y])=>x===4&&y===11);
      if(!state.projects.some(p=>p.id==='test-components'))break;
    }
    assert.equal(delivered,true);
    assert.ok(!state.projects.some(p=>p.id==='test-components'),'La inspección final debe completar la obra');
    assert.ok(state.roads.some(([x,y])=>x===4&&y===11));
    assert.equal(state.supply.contractors['Sur Obras'].components,0);
  });
});
test('Offline: metalúrgica sin fábrica alimentaria fantasma',async()=>{
  const city=fixture();city.day=30;city.lastMonth=0;
  city.buildings.at(-1).business.rawMaterialInventory=20;
  await scenario(city,async({tick})=>{
    const state=await tick();
    assert.equal(state.day,31);
    assert.equal(state.supply.market['Fábrica local 5-10'],undefined);
  });
});
