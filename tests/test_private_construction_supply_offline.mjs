import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';
function base(){
  const city=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
  city.day=30;city.lastMonth=0;city.paused=false;city.speed=1;
  city.money=150000;city.privateCapital=150000;
  city.supply.yardCapacity=3000;
  city.projects=[];
  city.zones=[{x:7,y:11,kind:'home',status:'disponible'}];
  city.housingDemand={unmet:100,lastGenerated:0,lastFilled:0};
  for(const stock of Object.values(city.supply.contractors))
    for(const key of ['aggregate','concrete','steel','timber','components'])stock[key]=0;
  for(const stock of Object.values(city.supply.suppliers))
    for(const key of ['aggregate','concrete','steel','timber','components'])
      if(key in stock)stock[key]=Math.max(200,stock[key]||0);
  return city;
}
async function withCity(city,callback){
  const fetch0=globalThis.fetch,storage0=globalThis.localStorage,now0=Date.now;
  let stored=JSON.stringify(city),clock=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>base()});
  globalThis.localStorage={getItem:()=>stored,setItem:(_,value)=>{stored=value}};
  Date.now=()=>clock;
  try{
    const adapter=await createOfflineAdapter();
    const tick=()=>{clock+=1000;return adapter.request('/api/state')};
    await callback({tick,adapter});
  }finally{
    globalThis.fetch=fetch0;globalThis.localStorage=storage0;Date.now=now0;
  }
}
test('Offline: viviendas zonificadas usan inversión privada y no esperan entregas municipales',async()=>{
  const city=base(),before=city.privateCapital;
  await withCity(city,async({tick})=>{
    const s=await tick(),project=s.projects.find(p=>p.zonedDevelopment&&p.kind==='home');
    assert.ok(project,'Debe iniciar una vivienda privada cuando hay demanda y capital');
    assert.equal(project.privateMaterialsIncluded,true);
    assert.ok(Object.values(project.materialsRequired).every(n=>n===0));
    assert.equal(s.supply.orders.filter(o=>o.projectId===project.id).length,0);
    assert.ok(s.privateCapital<before,'El promotor aporta el costo de la obra desde su capital');
    assert.equal(project.status,'contratada','La casa igualmente pasa por construcción y lleva plazos');
  });
});
test('Offline: materiales agotados no bloquean vivienda privada zonificada',async()=>{
  const city=base();
  city.supply.yardCapacity=1;
  for(const depot of city.supply.depots||[])depot.capacity=0;
  for(const stock of Object.values(city.supply.suppliers))
    for(const key of ['aggregate','concrete','steel','timber','components'])if(key in stock)stock[key]=0;
  const cash=city.privateCapital;
  await withCity(city,async({tick})=>{
    const s=await tick();
    assert.equal(s.projects.filter(p=>p.zonedDevelopment&&p.kind==='home').length,1);
    assert.equal(s.supply.orders.filter(o=>o.privateContract).length,0);
    assert.ok(s.privateCapital<cash);
  });
});
