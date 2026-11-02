import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function scenario(input,callback){
  const prevFetch=globalThis.fetch,prevStorage=globalThis.localStorage,prevNow=Date.now;
  let saved=JSON.stringify(input),clock=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
  globalThis.localStorage={getItem:()=>saved,setItem:(_,s)=>{saved=s}};
  Date.now=()=>clock;
  try{const adapter=await createOfflineAdapter();const tick=()=>{clock+=1000;return adapter.request('/api/state')};await callback({adapter,tick})}
  finally{globalThis.fetch=prevFetch;globalThis.localStorage=prevStorage;Date.now=prevNow}
}
function recoveryFixture(demand=true){
  const city=seed();city.day=30;city.lastMonth=0;city.speed=1;city.paused=false;city.money=100000;
  city.privateCapital=30000;city.zones.push({x:4,y:9,kind:'factory',status:'disponible'});
  city.buildings.push({x:4,y:9,kind:'factory',name:'Cantera cerrada',status:'cerrado',
    utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100},
    business:{id:'old-quarry',industryType:'quarry',status:'cerrado',
      cash:-300,closedDay:-100,aggregateStock:0,quarryReserve:73,jobSlots:20}});
  if(demand)city.buildings.push({kind:'factory',x:6,y:9,name:'Hormigonera activa',status:'habilitado',utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100},business:{id:'concrete-demand',industryType:'concrete',status:'abierto',cash:5000,concreteStock:0,jobSlots:20}});
  return city;
}
test('Offline: la demanda industrial real activa una rehabilitación de cantera',async()=>{
  const input=recoveryFixture();
  await scenario(input,async({tick})=>{
    let city=await tick();
    const site=()=>city.buildings.find(b=>b.business?.id==='old-quarry'||b.industrialRecovery);
    let industry=site(),work=industry.industrialRecovery;
    assert.ok(work,'El promotor debe crear un contrato real de rehabilitación');
    assert.equal(work.status,'en obra');
    assert.equal(work.cost,5300);
    assert.equal(work.workersAssigned,5);
    assert.equal(work.operatingReserve,4200);
    assert.equal(city.privateCapital,24700);
    assert.equal(work.readyDay,city.day+7);
    assert.equal(industry.business.status,'cerrado','No se abre instantáneamente');
    let reopened=false;
    for(let i=0;i<12;i++){
      city=await tick();industry=site();
      if(industry.industrialRecovery.status==='completada'){reopened=true;break}
    }
    assert.ok(reopened,'Debe reabrir al completar rehabilitación e inspección');
    const firm=industry.business;
    assert.equal(firm.industryType,'quarry');
    assert.notEqual(firm.id,'old-quarry');
    assert.equal(firm.cash,4200);
    assert.equal(firm.quarryReserve,73,'No se inventa una nueva reserva geológica');
    assert.equal(firm.aggregateStock,0);
    assert.equal(industry.industrialRecoveryHistory.length,1);
    const jobs=city.jobs;
    for(let i=0;i<2;i++)city=await tick();
    assert.equal(city.jobs,jobs,'Reabrir una segunda vez no puede duplicar empleos');
    assert.equal(city.buildings.find(b=>b.industrialRecovery)?.industrialRecoveryHistory.length,1);
  });
});
test('Offline: una fábrica quebrada sin demanda no se abre ni recibe inversión',async()=>{
  const input=recoveryFixture(false);
  await scenario(input,async({tick})=>{
    const city=await tick();
    const plant=city.buildings.find(b=>b.business?.id==='old-quarry');
    assert.equal(plant.industrialRecovery,undefined);
    assert.equal(city.privateCapital,30000);
  });
});
