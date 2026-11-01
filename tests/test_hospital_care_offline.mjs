import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function scenario(city,check){
  const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};
  let saved=JSON.stringify(city);
  globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
  globalThis.localStorage={getItem:()=>saved,setItem:(_,data)=>{saved=data}};
  Date.now=()=>0;
  try{
    const adapter=await createOfflineAdapter();
    await check({request:(body)=>adapter.request('/api/action',body),view:()=>adapter.request('/api/state'),
      reload:async mutator=>{saved=JSON.stringify(mutator(JSON.parse(saved)));return adapter.request('/api/load')}});
  }finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.storage;Date.now=old.now}
}

test('Offline: inversión hospitalaria consume caja una vez y agrega capacidad física',async()=>{
  const s=seed();s.money=60000;s.paused=true;
  await scenario(s,async({request,view,reload})=>{
    let city=await view();
    const clinic=city.buildings.find(b=>b.kind==='civic'),initial=city.money;
    city=await request({action:'openHospitalWard',x:clinic.x,y:clinic.y});
    assert.equal(city.money,initial-7200);
    assert.equal(city.healthReport.hospital.hospitals[0].beds,12);
    await assert.rejects(request({action:'openHospitalWard',x:clinic.x,y:clinic.y}),/ya dispone/);
    city=await request({action:'expandHospitalWard',x:clinic.x,y:clinic.y});
    assert.equal(city.buildings.find(b=>b.kind==='civic').hospitalWard.beds,20);
    assert.equal(city.money,initial-7200-4600);
    city=await request({action:'addAmbulance',x:clinic.x,y:clinic.y});
    assert.equal(city.healthReport.hospital.hospitals[0].ambulances,1);
    assert.equal(city.money,initial-7200-4600-2800);
    const report=city.healthReport.hospital;
    assert.ok(report.monthlyOperatingCost>0,'Camas y vehículo demandan operación.');
    city=await reload(s=>{for(const w of s.workplaces||[])if(w.kind==='civic')w.staffedJobs=0;return s});
    assert.equal(city.healthReport.hospital.hospitals[0].capacityPerDay,0,'Sin profesionales las camas quedan inactivas.');
    assert.equal(city.healthReport.hospital.admittedPerDay,0);
  });
});
test('Offline: sin rutas no hay traslados hospitalarios ni inversiones nuevas',async()=>{
  const s=seed();s.money=60000;s.paused=true;s.roads=[];
  await scenario(s,async({request,view})=>{
    const city=await view(),clinic=city.buildings.find(b=>b.kind==='civic'),before=city.money;
    await assert.rejects(request({action:'openHospitalWard',x:clinic.x,y:clinic.y}),/acceso vial/);
    const afterwards=await view();
    assert.equal(afterwards.money,before);
    assert.equal(afterwards.healthReport.hospital.hospitals.length,0);
  });
});
