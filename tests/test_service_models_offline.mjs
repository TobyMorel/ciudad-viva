import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';
const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));

async function scenario(city,work){
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};
 let saved=JSON.stringify(city);
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v}};
 Date.now=()=>0;
 try{
  const adapter=await createOfflineAdapter();
  await work({action:body=>adapter.request('/api/action',body),view:()=>adapter.request('/api/state')});
 }finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.storage;Date.now=old.now}
}

test('Municipalidad no brinda salud seguridad bomberos o basureros sin edificios',async()=>{
 const city=seed();city.paused=true;
 await scenario(city,async({view,action})=>{
  const s=await view();
  assert.equal(s.healthReport.clinics.length,0);
  assert.equal(s.policeReport.units.length,0);
  assert.equal(s.fireReport.stations.length,0);
  assert.equal(s.waste.report.activeTrucks,0);
  const town=s.buildings.find(b=>b.name==='Municipalidad');
  await assert.rejects(action({action:'openPoliceUnit',x:town.x,y:town.y}),/construí una comisaría/);
  await assert.rejects(action({action:'openHospitalWard',x:town.x,y:town.y}),/centro sanitario/);
 });
});

test('Hospital general se habilita en el acto y conserva su modelo sin materiales',async()=>{
 const city=seed();city.money=200000;city.paused=true;
 await scenario(city,async({view,action})=>{
  const start=await view();
  const contractor='Constructora Delta';
  const tender={action:'place',contractor,kind:'civic',serviceModel:'generalHospital',x:10,y:11};
  const s=await action(tender);
  const building=s.buildings.find(b=>b.x===10&&b.y===11);
  assert.equal(building.serviceModel,'generalHospital');
  assert.equal(building.name,'Hospital general');
  assert.equal(building.status,'habilitado');
  assert.equal(building.hospitalWard.beds,36);
  assert.equal(s.projects.some(p=>p.x===10&&p.y===11),false);
  assert.equal(s.money,start.money-25500);
  await assert.rejects(action({...tender,serviceModel:'wasteComplex',x:11,y:11}),/incompatible/);
 });
});

test('El centro de acogida es una obra pública de 30 plazas con costo y personal propios',async()=>{
 const city=seed();city.money=200000;city.paused=true;
 await scenario(city,async({view,action})=>{
  const result=await action({action:'place',contractor:'Constructora Delta',kind:'civic',serviceModel:'socialShelter',x:10,y:11});
  const shelter=result.buildings.find(b=>b.x===10&&b.y===11);
  assert.equal(shelter.serviceModel,'socialShelter');assert.equal(shelter.name,'Centro de acogida temporal');assert.equal(shelter.status,'habilitado');
  assert.ok(result.money<city.money,'la inversion municipal se cobra al habilitar el centro');
  assert.ok(!result.projects.some(p=>p.x===10&&p.y===11),'el edificio no queda en obra');
  assert.ok(result.socialServices.shelterResidents.length===0,'no crea personas sin una demanda migratoria sin vivienda');
  const facility={kind:'civic',name:'Acogida',serviceModel:'socialShelter',status:'habilitado',jobSlots:12,monthlyCost:1180,socialShelter:{beds:30,residents:[]},x:5,y:10,utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}};
  const home={kind:'home',x:4,y:11,occupants:1,capacity:1,residents:[{id:'resident-a',age:32,workerEligible:true,status:'buscando',skills:{salud:100},expectedMonthlyWage:8,carAccess:false}],quality:90};
  city.buildings=[home,facility];city.roads=[[4,10],[5,10],[4,11]];city.population=1;city.jobs=100;city.approval=69;city.housingDemand={unmet:0,lastGenerated:0,lastFilled:0};
  const saved=JSON.stringify(city),storage=globalThis.localStorage;let encoded=saved;globalThis.localStorage={getItem:()=>encoded,setItem:(_,v)=>{encoded=v}};
  try{const reopened=await createOfflineAdapter();reopened.setRealtimeClock(false);const s=await reopened.request('/api/state');assert.ok(Array.isArray(s.socialServices.shelterResidents));assert.equal(s.buildings.find(b=>b.serviceModel==='socialShelter').socialShelter.beds,30)}finally{globalThis.localStorage=storage}
 });
});
