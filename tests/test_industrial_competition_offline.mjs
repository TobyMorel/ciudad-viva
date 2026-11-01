import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const base=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function scenario(city,fn){
  const prevFetch=globalThis.fetch,prevStorage=globalThis.localStorage,prevNow=Date.now;
  let saved=JSON.stringify(city),clock=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>base()});
  globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};
  Date.now=()=>clock;
  try{
    const adapter=await createOfflineAdapter();
    const tick=()=>{clock+=1000;return adapter.request('/api/state')};
    await fn({adapter,tick});
  }finally{globalThis.fetch=prevFetch;globalThis.localStorage=prevStorage;Date.now=prevNow}
}
function fixture(stock=4){
  const city=base();
  city.day=1;city.lastMonth=0;city.paused=false;city.speed=1;
  city.supply.contractorCash['Sur Obras']=20000;
  city.supply.suppliers['Metalúrgica local']={aggregate:0,concrete:0,steel:0,timber:0,components:stock*2,cash:0};
  const vendors=[];
  for(const [x,factor] of [[4,1.35],[6,.8]]){
    const site={x,y:9,kind:'factory',name:'Metalúrgica '+x,status:'habilitado',
      business:{id:'metal-'+x,industryType:'metalworks',status:'abierto',componentStock:stock,
        materialPriceFactor:factor,cash:1000,jobSlots:20}};
    vendors.push(site);city.buildings.push(site);
  }
  city.projects.push({id:'compete',kind:'road',x:4,y:11,label:'Calle industrial',
    contractor:'Sur Obras',status:'pausada',workersAssigned:0,cost:1200,paid:0,
    duration:20,elapsed:0,progress:0,stages:['Inspección'],stageIndex:0,
    materialsRequired:{aggregate:0,concrete:0,steel:0,timber:0,components:4},
    materialsUsed:{aggregate:0,concrete:0,steel:0,timber:0,components:0}});
  return city;
}

test('Offline: la compra de obra elige la planta más competitiva y paga una sola firma',async()=>{
  await scenario(fixture(),async({adapter,tick})=>{
    let state=await adapter.request('/api/action',{
      action:'orderMaterials',projectId:'compete',supplier:'Metalúrgica local',
      items:{components:4},destinationId:'yard'
    });
    const order=state.supply.orders.at(-1);
    assert.equal(order.vendorId,'metal-6');
    assert.equal(order.vendorName,'Metalúrgica 6');
    assert.equal(order.source[0],6);
    assert.ok(order.route.length>0);
    assert.equal(order.productCost,Math.round(4*240*1.15*.8));
    assert.equal(state.supply.contractorCash['Sur Obras'],20000-order.cost);
    assert.equal(state.supply.suppliers['Metalúrgica local'].components,4);
    const expensive=state.buildings.find(b=>b.business?.id==='metal-4').business;
    const winner=state.buildings.find(b=>b.business?.id==='metal-6').business;
    assert.equal(expensive.cash,1000);
    assert.equal(expensive.componentStock,4);
    assert.equal(winner.componentStock,0);
    assert.equal(winner.cash,1000+order.productCost);
    let arrived=false;
    for(let day=0;day<12;day++){
      state=await tick();
      if(state.supply.orders.at(-1).status==='entregado'){arrived=true;break}
    }
    assert.equal(arrived,true);
    assert.equal(state.supply.contractors['Sur Obras'].components>=4,true);
    assert.equal(state.buildings.find(b=>b.business?.id==='metal-6').business.componentStock,0);
  });
});

test('Offline: sin lote completo no se compra de dos plantas con un solo camión',async()=>{
  await scenario(fixture(2),async({adapter})=>{
    await assert.rejects(adapter.request('/api/action',{
      action:'orderMaterials',projectId:'compete',supplier:'Metalúrgica local',
      items:{components:4},destinationId:'yard'
    }),/Ninguna planta conectada ofrece el lote completo/);
  });
});
