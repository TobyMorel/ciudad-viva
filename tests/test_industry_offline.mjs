import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

function seed(){const s=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));s.day=1;s.lastMonth=0;s.speed=1;s.paused=false;return s}
async function scenario(city,fn){
  const fetch0=globalThis.fetch,storage0=globalThis.localStorage,now0=Date.now;
  let saved=JSON.stringify(city),time=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
  globalThis.localStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v}};
  Date.now=()=>time;
  try{const adapter=await createOfflineAdapter();const tick=()=>{time+=1000;return adapter.request('/api/state')};await fn({adapter,tick})}
  finally{globalThis.fetch=fetch0;globalThis.localStorage=storage0;Date.now=now0}
}

test('Offline: especialidad industrial se reserva al contratar y paga caja operativa',async()=>{
  const s=seed();
  s.money=100000;s.privateCapital=100000;
  for(const [x,y] of [[4,9],[6,9],[4,11]])s.zones.push({x,y,kind:'factory',status:'disponible'});
  await scenario(s,async({adapter})=>{
    let v=await adapter.request('/api/action',{action:'place',kind:'factory',x:4,y:9,contractor:'Sur Obras'});
    assert.equal(v.projects.at(-1).industryType,'food');
    assert.equal(v.projects.at(-1).operatingReserve,4200);
    v=await adapter.request('/api/action',{action:'place',kind:'factory',x:6,y:9,contractor:'Constructora Delta'});
    assert.equal(v.projects.at(-1).industryType,'quarry');
    v=await adapter.request('/api/action',{action:'place',kind:'factory',x:4,y:11,contractor:'Estudio y Obra Norte'});
    assert.equal(v.projects.at(-1).industryType,'concrete');
    assert.equal(v.projects.length,3);
    assert.ok(v.privateCapital<100000-3*4200,'Las reservas operativas deben salir del capital privado');
  });
});

test('Offline: cantera compra y entrega áridos a hormigonera que consume 2 por hormigón',async()=>{
  const s=seed();
  s.day=30;s.lastMonth=0;s.employment=100;s.money=1000000;
  const access={powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100};
  const quarry={x:4,y:9,kind:'factory',name:'Cantera de prueba',status:'habilitado',utilityAccess:{...access},monthlyOperatingCost:320,
    business:{id:'quarry-test',name:'Cantera de prueba',industryType:'quarry',status:'abierto',cash:30000,jobSlots:20,wage:12,quarryReserve:100,aggregateStock:0}};
  const plant={x:6,y:9,kind:'factory',name:'Hormigonera de prueba',status:'habilitado',utilityAccess:{...access},monthlyOperatingCost:450,
    business:{id:'concrete-test',name:'Hormigonera de prueba',industryType:'concrete',status:'abierto',cash:30000,jobSlots:20,wage:12,rawMaterialInventory:0,concreteStock:0}};
  // La industria de prueba dispone de plantas físicas conectadas, no de red gratuita.
  for(const source of s.buildings){
    if(source.kind==='powerPlant')source.generationKw=10000;
    if(source.kind==='waterPlant')source.treatmentM3Day=10000;
    if(source.kind==='gasPlant')source.gasCapacityM3Day=10000;
  }
  s.buildings.push({x:20,y:9,kind:'civic',name:'Central Wi-Fi industrial',
    serviceModel:'wifiHub',status:'habilitado',quality:82,jobSlots:12,wifiConnections:160});
  s.buildings.push(quarry,plant);s.jobs+=40;
  let assigned=0;
  for(const home of s.buildings.filter(b=>b.kind==='home'))for(const person of home.residents||[]){
    if(!person.workerEligible||assigned>=40)continue;
    const site=assigned<20?quarry:plant;
    person.status='empleado';person.employerId=site.business.id;person.employerName=site.name;
    person.skills={...(person.skills||{}),logistica:100};person.expectedMonthlyWage=0;
    person.monthlyWage=12;assigned++;
  }
  assert.equal(assigned,40,'La semilla debe tener 40 trabajadores elegibles para las dos plantas');
  await scenario(s,async({tick,adapter})=>{
    let v=await tick();
    const q=v.buildings.find(b=>b.business?.id==='quarry-test').business;
    assert.ok(q.lastProduction>0,'La cantera produce con trabajadores y servicios');
    assert.ok(q.quarryReserve<100,'La extracción consume reserva geológica');
    const orders=v.supply.marketOrders.filter(o=>o.commodity==='áridos');
    assert.equal(orders.length,3,'La hormigonera reserva tres remesas con custodia de pagos');
    assert.equal(orders.reduce((total,o)=>total+o.quantity,0),q.lastProduction);
    assert.equal(v.supply.tradeContracts[0].escrow,v.supply.tradeContracts[0].contractValue);
    assert.ok(orders.every(o=>o.supplyContractId===v.supply.tradeContracts[0].id));
    assert.equal(v.supply.suppliers['Cantera local'].aggregate,q.aggregateStock);
    assert.ok(orders[0].route.length>0);
    let delivered=false;
    for(let day=0;day<31;day++){
      v=await tick();
      delivered ||=v.supply.marketOrders.some(o=>o.commodity==='áridos'&&o.status==='entregado');
    }
    assert.equal(delivered,true,'La compra debe llegar realmente a la planta');
    const factory=v.buildings.find(b=>b.business?.id==='concrete-test').business;
    assert.ok(factory.lastProduction>0,'En el siguiente cierre se debe producir hormigón');
    assert.equal(v.supply.suppliers['Hormigonera local'].concrete,factory.concreteStock);

    assert.ok(v.localIndustry.concreteProduced>=factory.lastProduction);

    // Las calles ahora se colocan en el momento y no reservan materiales de obra.
    const beforeRoad=v.money,stockBefore=v.supply.contractors['Sur Obras'].concrete;
    v=await adapter.request('/api/action',{action:'placeRoad',x:4,y:11});
    assert.ok(v.roads.some(([x,y])=>x===4&&y===11));
    assert.equal(v.money,beforeRoad-1200);
    assert.equal(v.projects.length,0,'La calle instantánea no crea proyecto ni espera cuadrilla.');
    assert.equal(v.supply.contractors['Sur Obras'].concrete,stockBefore,'La calle instantánea no consume materiales.');
  });
});

