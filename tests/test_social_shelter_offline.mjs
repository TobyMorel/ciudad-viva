import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
test('Offline: el refugio aloja la demanda migratoria sin vivienda y luego la reubica sin duplicar población',async()=>{
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now},store=new Map(),city=seed(),roads=[[4,10],[5,10],[4,11]];
 city.day=30;city.lastMonth=0;city.paused=false;city.speed=1;city.money=200000;city.monthlyIncome=6000;city.baseMonthlyGross=6000;city.grossMonthlyIncome=6000;city.monthlyExpenses=1180;city.population=1;city.jobs=100;city.approval=69;city.employment=80;city.roads=roads;city.roadAssets=[];
 city.buildings=[
  {kind:'home',name:'Vivienda ocupada',x:4,y:11,occupants:1,capacity:1,residents:[{id:'worker-a',age:32,birthYear:1994,workerEligible:true,status:'buscando',skills:{salud:100,comercio:70,logistica:70,administracion:70,educacion:70,bomberos:70},expectedMonthlyWage:8,carAccess:false}],quality:90,householdCash:100},
  {kind:'civic',name:'Centro de acogida',serviceModel:'socialShelter',x:5,y:10,status:'habilitado',jobSlots:12,monthlyCost:1180,socialShelter:{beds:30,residents:[]},utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}}
 ];
 city.buildings.push({kind:'powerPlant',name:'Central de prueba',x:4,y:9,status:'habilitado',quality:82,jobSlots:0,generationKw:900},{kind:'waterPlant',name:'Potabilizadora de prueba',x:5,y:9,status:'habilitado',quality:82,jobSlots:0,treatmentM3Day:220});
 city.socialServices={housingAidBudget:0,lastReport:{},history:[],shelterResidents:[],shelterReport:{}};city.finance.programBudgets={servicesPct:100,mobilityPct:100,networksPct:100,programPriority:['services','networks','mobility'],arrears:{services:0,mobility:0,networks:0},underfundedMonths:{services:0,mobility:0,networks:0},financialServiceImpact:0,lastReport:{},history:[]};
 city.utilities=city.utilities||{};for(const key of ['powerLines','waterPipes','sewerLines','drainLines','gasLines','telecomLines'])city.utilities[key]=roads;
 city.utilities.basePowerCapacityKw=3000;city.utilities.baseWaterCapacityM3Day=1000;city.utilities.baseWastewaterTreatmentM3Day=1000;city.utilities.baseDrainageCapacityM3Day=3000;city.utilities.baseTelecomCapacityMbps=2000;
 store.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};globalThis.fetch=async()=>({ok:true,json:async()=>seed()});let now=0;Date.now=()=>now;
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);assert.equal((await adapter.request('/api/state')).day,30);
  now=1000;const admitted=await adapter.request('/api/state');assert.equal(admitted.day,31);assert.ok(admitted.socialServices.shelterResidents.length>0,`debe recibir demanda sin casa; refugio=${JSON.stringify(admitted.socialServices.shelterReport)}`);
  const count=admitted.socialServices.shelterResidents.length,population=admitted.population;assert.equal(admitted.socialServices.shelterReport.sheltered,count);assert.ok(admitted.socialServices.shelterReport.monthlyCost>=1180);
  admitted.buildings.find(b=>b.kind==='home').capacity=1;const freeHome={kind:'home',name:'Vivienda abierta',x:6,y:10,status:'habilitado',occupants:0,capacity:count,residents:[],quality:90};admitted.buildings.push(freeHome);admitted.day=60;admitted.lastMonth=1;admitted.approval=48;admitted.paused=false;store.set('ciudad-viva-offline-v1',JSON.stringify(admitted));const reloaded=await createOfflineAdapter();reloaded.setRealtimeClock(false);await reloaded.request('/api/state');
  // El cierre siguiente procesa el traslado a las nuevas viviendas vacantes.
  now=2000;const rehoused=await reloaded.request('/api/state');assert.equal(rehoused.socialServices.shelterReport.rehousedThisMonth,count,'se trasladan las personas alojadas aunque lleguen nuevas al refugio');assert.equal(freeHome.occupants,0,'la referencia anterior no muta al guardar; se consulta abajo el estado rehidratado');
  assert.equal(rehoused.buildings.find(b=>b.name==='Vivienda abierta').occupants,count);assert.ok(rehoused.population>=population);assert.ok(rehoused.housingDemand.unmet>=4);
 }finally{globalThis.fetch=old.fetch;Date.now=old.now;if(old.storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=old.storage;}
});
