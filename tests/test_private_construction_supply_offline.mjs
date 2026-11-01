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
test('Offline: promotor autónomo compra mercancía que llega en camión, no instantánea',async()=>{
  const city=base(),before=city.privateCapital;
  await withCity(city,async({tick})=>{
    let s=await tick();
    const project=s.projects.find(p=>p.zonedDevelopment&&p.kind==='home');
    assert.ok(project,'Debe iniciar una vivienda privada cuando hay demanda y capital');
    const orders=s.supply.orders.filter(o=>o.projectId===project.id);
    assert.ok(orders.length>=1,'Cada material necesario necesita un pedido');
    assert.ok(orders.every(o=>o.privateContract&&o.status==='en tránsito'));
    assert.ok(orders.every(o=>o.route.length>0&&o.cost>0&&o.arrivalDay>s.day));
    assert.equal(project.materialsCost,orders.reduce((n,o)=>n+o.cost,0));
    assert.ok(s.privateCapital<=before-project.materialsCost);
    for(const key of Object.keys(project.materialsRequired))
      if(project.materialsRequired[key])assert.equal(s.supply.contractors[project.contractor][key],0,
        'Los materiales no aparecen hasta que llegan los camiones');
    let arrived=false;
    for(let i=0;i<24;i++){
      s=await tick();
      if(orders.every(order=>s.supply.orders.find(o=>o.id===order.id)?.status==='entregado')){arrived=true;break}
    }
    assert.ok(arrived,'La carga debe llegar por una ruta vial');
    const projected=s.projects.find(p=>p.id===project.id);
    assert.ok(!projected||projected.elapsed>=0);
    assert.ok(s.supply.orders.filter(o=>o.projectId===project.id).every(o=>o.deliveredDay),
      'Cada pedido recibe fecha real de entrega');
  });
});
test('Offline: sin inventario de ningún proveedor no inicia obra con recursos mágicos',async()=>{
  const city=base();
  for(const stock of Object.values(city.supply.suppliers))
    for(const key of ['aggregate','concrete','steel','timber','components'])if(key in stock)stock[key]=0;
  const cash=city.privateCapital;
  await withCity(city,async({tick})=>{
    const s=await tick();
    assert.equal(s.projects.filter(p=>p.zonedDevelopment).length,0);
    assert.equal(s.supply.orders.filter(o=>o.privateContract).length,0);
    assert.equal(s.privateCapital,cash);
  });
});
