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

test('Licitación de hospital y central de higiene persiste modelo y materiales crecientes',async()=>{
 const city=seed();city.money=200000;city.paused=true;
 await scenario(city,async({view,action})=>{
  const start=await view();
  const contractor='Constructora Delta';
  const tender={action:'place',contractor,kind:'civic',serviceModel:'generalHospital',x:10,y:11};
  const s=await action(tender);
  const project=s.projects.find(p=>p.x===10&&p.y===11);
  assert.equal(project.serviceModel,'generalHospital');
  assert.equal(project.label,'Hospital general');
  assert.ok(project.cost>8000);
  assert.ok(project.materialsRequired.steel>22,'El hospital debe consumir más acero que el consultorio.');
  assert.ok(s.money<start.money);
  await assert.rejects(action({...tender,serviceModel:'wasteComplex',x:11,y:11}),/incompatible/);
 });
});
