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
    return JSON.parse(persisted);
  }finally{globalThis.fetch=f;globalThis.localStorage=l;Date.now=n}
}
test('Offline: contrato de tres remesas aparta áridos y difiere pago hasta recepción',async()=>{
  const s=scenarioSeed();
  await play(s,async({tick})=>{
    let city=await tick();
    const contract=city.supply.tradeContracts[0];
    assert.ok(contract,'Debe negociarse el contrato por la demanda de la hormigonera');
    assert.equal(contract.quantity,24,'Sin trabajadores, la hormigonera reserva solo el mínimo operativo de 24 áridos');
    assert.equal(contract.installments,3);
    assert.equal(contract.escrow,contract.contractValue);
    const seller=city.buildings.find(b=>b.business?.id==='quarry-alfa').business;
    const buyer=city.buildings.find(b=>b.business?.id==='concrete-beta').business;
    assert.equal(seller.aggregateStock,6);
    assert.equal(seller.cash,4680,'Solo se descuenta la operación de la cantera; aún no recibe ventas');
    assert.equal(city.supply.suppliers['Cantera local'].aggregate,6);
    assert.equal(buyer.rawMaterialInventory,0);
    const orders=city.supply.marketOrders.filter(o=>o.supplyContractId===contract.id);
    assert.deepEqual(orders.map(o=>o.quantity),[8,8,8]);
    assert.ok(orders.every(o=>o.status==='en tránsito'));
    for(let i=0;i<25;i++)city=await tick();
    const finished=city.supply.tradeContracts.find(c=>c.id===contract.id);
    assert.equal(finished.status,'cumplido');
    assert.equal(finished.escrow,0);
    assert.equal(finished.deliveredUnits,24);
    assert.equal(finished.contractValue,finished.paidToSeller+finished.paidToLogistics);
    assert.equal(city.buildings.find(b=>b.business?.id==='concrete-beta').business.rawMaterialInventory,24);
    const receivedCash=city.buildings.find(b=>b.business?.id==='quarry-alfa').business.cash;
    for(let i=0;i<3;i++)city=await tick();
    assert.equal(city.buildings.find(b=>b.business?.id==='quarry-alfa').business.cash,receivedCash);
  });
});
test('Offline: comprador insolvente dispara devolución de todas las remesas no enviadas',async()=>{
  const s=scenarioSeed();
  s.lastMonth=1;
  s.buildings.find(b=>b.business?.id==='concrete-beta').business.status='cerrado';
  s.buildings.find(b=>b.business?.id==='concrete-beta').business.cash=19100;
  s.buildings.find(b=>b.business?.id==='quarry-alfa').business.aggregateStock=0;
  s.supply.suppliers['Cantera local'].aggregate=0;
  const contract={id:'contract-test',buyerId:'concrete-beta',vendorId:'quarry-alfa',
    vendorName:'Cantera Alfa',commodity:'áridos',status:'en curso',quantity:30,
    deliveredUnits:0,refundedUnits:0,escrow:900,contractValue:900,refunded:0,paidToSeller:0,paidToLogistics:0};
  s.supply.tradeContracts=[contract];
  s.supply.marketOrders=Array.from({length:3},(_,i)=>({
    id:'contract-test-'+i,businessId:'concrete-beta',vendorId:'quarry-alfa',
    supplyContractId:'contract-test',commodity:'áridos',type:'industrial_raw',quantity:10,
    productCost:300,freight:0,orderedDay:30,supplierReadyDay:31+i*7,deadlineDay:45+i*7,
    arrivalDay:32+i*7,source:[4,9],x:6,y:9,status:'en tránsito'
  }));
  await play(s,async({tick})=>{
    const city=await tick();
    const settled=city.supply.tradeContracts[0];
    assert.equal(settled.status,'incumplido');
    assert.equal(settled.escrow,0);
    assert.equal(settled.refunded,900);
    assert.equal(settled.refundedUnits,30);
    assert.equal(settled.deliveredUnits,0);
    assert.equal(city.buildings.find(b=>b.business?.id==='concrete-beta').business.cash,20000);
    assert.equal(city.buildings.find(b=>b.business?.id==='quarry-alfa').business.aggregateStock,30);
    assert.equal(city.supply.suppliers['Cantera local'].aggregate,30);
    assert.ok(city.supply.marketOrders.every(o=>o.status==='cancelado'&&o.contractSettled));
  });
});

test('Offline: plazo vencido devuelve depósitos y paga multa sin duplicación',async()=>{
  const s=scenarioSeed();
  s.lastMonth=1;s.day=50;
  s.buildings.find(b=>b.business?.id==='concrete-beta').business.cash=19100;
  s.buildings.find(b=>b.business?.id==='quarry-alfa').business.aggregateStock=0;
  s.supply.suppliers['Cantera local'].aggregate=0;
  const contract={id:'contract-test',buyerId:'concrete-beta',vendorId:'quarry-alfa',
    vendorName:'Cantera Alfa',commodity:'áridos',status:'en curso',quantity:30,
    deliveredUnits:0,refundedUnits:0,escrow:900,contractValue:900,refunded:0,paidToSeller:0,paidToLogistics:0};
  s.supply.tradeContracts=[contract];
  s.supply.marketOrders=Array.from({length:3},(_,i)=>({
    id:'contract-test-'+i,businessId:'concrete-beta',vendorId:'quarry-alfa',
    supplyContractId:'contract-test',commodity:'áridos',type:'industrial_raw',quantity:10,
    productCost:300,freight:0,orderedDay:30,supplierReadyDay:31+i*2,deadlineDay:35+i*2,
    arrivalDay:32+i*2,source:[4,9],x:6,y:9,status:'en tránsito'
  }));
  await play(s,async({tick})=>{
    const city=await tick();
    const settled=city.supply.tradeContracts[0];
    assert.equal(settled.status,'incumplido');
    assert.equal(settled.escrow,0);
    assert.equal(settled.refunded,900);
    assert.equal(settled.refundedUnits,30);
    assert.equal(settled.deliveredUnits,0);
    assert.equal(settled.defaultPenaltyPaid,45);
    assert.equal(city.buildings.find(b=>b.business?.id==='concrete-beta').business.cash,20045);
    assert.equal(city.buildings.find(b=>b.business?.id==='quarry-alfa').business.cash,4955);
    assert.equal(city.buildings.find(b=>b.business?.id==='quarry-alfa').business.aggregateStock,30);
    assert.equal(city.supply.suppliers['Cantera local'].aggregate,30);
    assert.ok(city.supply.marketOrders.every(o=>o.status==='cancelado'&&o.contractSettled));
  });
});

test('Offline: una prórroga paga al vendedor y rescata remesas sin duplicación',async()=>{
  const s=scenarioSeed();s.lastMonth=1;s.roads=[];
  const seller=s.buildings.find(b=>b.business?.id==='quarry-alfa').business,buyer=s.buildings.find(b=>b.business?.id==='concrete-beta').business;
  seller.aggregateStock=24;buyer.cash=19760;s.supply.suppliers['Cantera local'].aggregate=24;
  s.supply.tradeContracts=[{id:'blocked-1',buyerId:buyer.id,vendorId:seller.id,buyerName:'Hormigonera Beta',
    vendorName:'Cantera Alfa',commodity:'áridos',status:'en curso',quantity:6,deliveredUnits:0,
    refundedUnits:0,contractValue:240,escrow:240,paidToSeller:0,paidToLogistics:0,refunded:0,installments:3,extensionFee:20}];
  s.supply.marketOrders=[0,1,2].map(i=>({id:'blocked-'+i,type:'industrial_raw',commodity:'áridos',
    businessId:buyer.id,businessName:'Hormigonera Beta',supplier:'Cantera local',vendorId:seller.id,
    supplyContractId:'blocked-1',quantity:2,productCost:80,freight:0,cost:80,source:[4,9],x:6,y:9,
    supplierReadyDay:31+i*7,arrivalDay:31+i*7,deadlineDay:33+i*7,travelDistance:2,status:'en tránsito'}));
  const saved=await play(s,async({adapter,tick})=>{
    let city=await tick();
    assert.equal(city.supply.marketOrders[0].statusCause,'Sin acceso vial');
    city=await adapter.request('/api/action',{action:'renegotiateTradeContract',id:'blocked-1'});
    assert.equal(city.supply.tradeContracts[0].extensionFeePaid,20);
    assert.deepEqual(city.supply.marketOrders.map(o=>o.deadlineDay),[47,54,61]);
    assert.equal(city.supply.tradeContracts[0].escrow,240);
    assert.equal(city.buildings.find(b=>b.business?.id==='concrete-beta').business.cash,19740);
    assert.equal(city.buildings.find(b=>b.business?.id==='quarry-alfa').business.cash,5020);
    assert.equal(city.buildings.find(b=>b.business?.id==='quarry-alfa').business.aggregateStock,24);
    await assert.rejects(adapter.request('/api/action',{action:'renegotiateTradeContract',id:'blocked-1'}),/renegociado/);
  });
  saved.day=38;saved.lastMonth=1;saved.roads=seed().roads;
  await play(saved,async({tick})=>{
    let city=await tick();
    for(let i=0;i<15;i++)city=await tick();
    const contract=city.supply.tradeContracts[0];
    assert.equal(contract.status,'cumplido');
    assert.equal(contract.escrow,0);
    assert.equal(contract.refunded,0);
    assert.equal(city.buildings.find(b=>b.business?.id==='concrete-beta').business.rawMaterialInventory,6);
    assert.equal(contract.paidToSeller,240,'El proveedor recibe exactamente el valor contratado, una sola vez.');
     assert.ok(city.buildings.find(b=>b.business?.id==='quarry-alfa').business.cash>=5000,'El proveedor conserva caja tras gastos operativos reales.');
  });
});

test('Offline: quiebra de proveedor cancela remesas y devuelve custodia antes del vencimiento',async()=>{
  const s=scenarioSeed();s.lastMonth=1;
  const seller=s.buildings.find(b=>b.business?.id==='quarry-alfa').business;
  const buyer=s.buildings.find(b=>b.business?.id==='concrete-beta').business;
  seller.status='cerrado';seller.aggregateStock=0;
  buyer.cash=19100;s.supply.suppliers['Cantera local'].aggregate=0;
  s.supply.tradeContracts=[{id:'bankrupt',buyerId:buyer.id,vendorId:seller.id,
    vendorName:'Cantera Alfa',status:'en curso',quantity:30,deliveredUnits:0,refundedUnits:0,
    escrow:900,contractValue:900,refunded:0,paidToSeller:0,paidToLogistics:0}];
  s.supply.marketOrders=[0,1,2].map(i=>({id:'bk-'+i,businessId:buyer.id,vendorId:seller.id,
    supplyContractId:'bankrupt',type:'industrial_raw',commodity:'áridos',quantity:10,
    productCost:300,freight:0,supplierReadyDay:31+i*7,deadlineDay:45+i*7,
    source:[4,9],x:6,y:9,status:'en tránsito'}));
  await play(s,async({tick})=>{
    let city=await tick();
    const contract=city.supply.tradeContracts[0];
    assert.equal(contract.status,'incumplido');
    assert.equal(contract.escrow,0);
    assert.equal(contract.refunded,900);
    assert.equal(contract.lostReservedUnits,30);
    assert.equal(city.buildings.find(b=>b.business?.id==='concrete-beta').business.cash,20000);
    assert.equal(city.buildings.find(b=>b.business?.id==='quarry-alfa').business.aggregateStock,0);
    assert.ok(city.supply.marketOrders.every(o=>o.contractSettled&&o.statusCause==='Proveedor insolvente'));
    city=await tick();
    assert.equal(city.supply.tradeContracts[0].refunded,900);
  });
});
