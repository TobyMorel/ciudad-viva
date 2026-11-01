import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function scenario(city,fn){
  const fetch0=globalThis.fetch,store0=globalThis.localStorage,now0=Date.now;
  let saved=JSON.stringify(city),clock=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
  globalThis.localStorage={getItem:()=>saved,setItem:(_,data)=>{saved=data}};
  Date.now=()=>clock;
  try{
    const adapter=await createOfflineAdapter(),tick=()=>{clock+=1000;return adapter.request('/api/state')};
    await fn({adapter,tick});
  }finally{globalThis.fetch=fetch0;globalThis.localStorage=store0;Date.now=now0}
}
test('Offline: planta con excedentes persistentes reduce vacantes, no crea caja',async()=>{
  const s=seed();
  s.day=30;s.lastMonth=0;s.paused=false;s.speed=1;s.privateCapital=0;s.money=80000;
  s.supply.suppliers['Cantera local']={aggregate:40,concrete:0,steel:0,timber:0,components:0,cash:0};
  s.buildings.push({x:4,y:9,kind:'factory',name:'Cantera saturada',status:'habilitado',
    jobSlots:20,monthlyOperatingCost:320,
    utilityAccess:{powerServedPct:0,waterServedPct:0,wastewaterTreatedPct:0},
    business:{id:'idle-quarry',name:'Cantera saturada',status:'abierto',industryType:'quarry',
      cash:5000,jobSlots:20,wage:12,aggregateStock:40,quarryReserve:0,lowDemandMonths:1,
      lifetimeIndustrialSales:0,staffingSalesCheckpoint:0}});
  s.jobs+=20;
  await scenario(s,async({tick})=>{
    const city=await tick(),site=city.buildings.find(b=>b.business?.id==='idle-quarry');
    assert.equal(city.day,31);
    assert.ok(site);
    assert.equal(site.business.jobSlots,18);
    assert.equal(site.jobSlots,18);
    assert.equal(site.business.lastStaffingChange,-2);
    assert.equal(site.business.lowDemandMonths,2);
    assert.equal(site.business.lastEquipmentInvestment,0);
    assert.equal(city.supply.businessEquipmentCash||0,0);
    assert.equal(site.business.aggregateStock,40,'Reducir trabajadores no debe consumir mercancía');
    assert.ok((city.events||[]).some(event=>JSON.stringify(event).includes('Reducción de actividad')));
  });
});
