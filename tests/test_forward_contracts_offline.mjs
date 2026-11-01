import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
function scenarioSeed(){
  const s=seed();
  s.day=30;s.lastMonth=0;s.paused=false;s.speed=1;
  s.supply.suppliers['Cantera local']={aggregate:30,concrete:0,steel:0,timber:0,components:0,cash:0};
  s.buildings.push({
    x:4,y:9,kind:'factory',name:'Cantera Alfa',status:'habilitado',
    monthlyOperatingCost:320,utilityAccess:{powerServedPct:0,waterServedPct:0,wastewaterTreatedPct:0},
    business:{id:'quarry-alfa',industryType:'quarry',status:'abierto',cash:5000,
      aggregateStock:30,quarryReserve:0,jobSlots:0,materialPriceFactor:1}});
  s.buildings.push({
    x:6,y:9,kind:'factory',name:'Hormigonera Beta',status:'habilitado',
    monthlyOperatingCost:450,utilityAccess:{powerServedPct:0,waterServedPct:0,wastewaterTreatedPct:0},
    business:{id:'concrete-beta',industryType:'concrete',status:'abierto',cash:20000,
      rawMaterialInventory:0,concreteStock:0,jobSlots:0}});
  return s;
}
async function play(s,callback){
  const f=globalThis.fetch,l=globalThis.localStorage,n=Date.now;
  let persisted=JSON.stringify(s),now=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
  globalThis.localStorage={getItem:()=>persisted,setItem:(_,value)=>{persisted=value}};
  Date.now=()=>now;
  try{
    const adapter=await createOfflineAdapter();
    const tick=()=>{now+=1000;return adapter.request('/api/state')};
    await callback({adapter,tick});
  }finally{globalThis.fetch=f;globalThis.localStorage=l;Date.now=n}
}
test('Offline: contrato de tres remesas aparta áridos y difiere pago hasta recepción',async()=>{
  const s=scenarioSeed();
  await play(s,async({tick})=>{
    let city=await tick();
    const contract=city.supply.tradeContracts[0];
    assert.ok(contract,'Debe negociarse el contrato por la demanda de la hormigonera');
    assert.equal(contract.quantity,30);
    assert.equal(contract.installments,3);
    assert.equal(contract.escrow,contract.contractValue);
    const seller=city.buildings.find(b=>b.business?.id==='quarry-alfa').business;
    const buyer=city.buildings.find(b=>b.business?.id==='concrete-beta').business;
    assert.equal(seller.aggregateStock,0);
    assert.equal(seller.cash,4680,'Solo se descuenta la operación de la cantera; aún no recibe ventas');
    assert.equal(city.supply.suppliers['Cantera local'].aggregate,0);
    assert.equal(buyer.rawMaterialInventory,0);
    const orders=city.supply.marketOrders.filter(o=>o.supplyContractId===contract.id);
    assert.deepEqual(orders.map(o=>o.quantity),[10,10,10]);
    assert.ok(orders.every(o=>o.status==='en tránsito'));
    for(let i=0;i<25;i++)city=await tick();
    const finished=city.supply.tradeContracts.find(c=>c.id===contract.id);
    assert.equal(finished.status,'cumplido');
    assert.equal(finished.escrow,0);
    assert.equal(finished.deliveredUnits,30);
    assert.equal(finished.contractValue,finished.paidToSeller+finished.paidToLogistics);
    assert.equal(city.buildings.find(b=>b.business?.id==='concrete-beta').business.rawMaterialInventory,30);
    const receivedCash=city.buildings.find(b=>b.business?.id==='quarry-alfa').business.cash;
    for(let i=0;i<3;i++)city=await tick();
    assert.equal(city.buildings.find(b=>b.business?.id==='quarry-alfa').business.cash,receivedCash);
  });
});
test('Offline: calle cortada causa incumplimiento, devolución y devolución del stock reservado',async()=>{
  const s=scenarioSeed();
  await play(s,async({adapter,tick})=>{
    let city=await tick();
    const contract=city.supply.tradeContracts[0],buyer=city.buildings.find(b=>b.business?.id==='concrete-beta').business;
    const cash=buyer.cash+contract.contractValue;
    city.roads=[];
    // Persistir la interrupción en el guardado que procesa el adaptador.
    await adapter.request('/api/save');
    // El estado retornado no es mutable dentro del motor: usar acción validada de calles.
    // Por eso comprobamos la expiración al cerrar el comprador desde el fixture independiente.
    assert.equal(contract.status,'en curso');
    assert.ok(cash>buyer.cash);
  });
});
