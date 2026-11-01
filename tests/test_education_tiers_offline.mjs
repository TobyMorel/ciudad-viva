import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';
const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function scenario(city,run){
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};
 let saved=JSON.stringify(city);
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v}};
 Date.now=()=>0;
 try{const adapter=await createOfflineAdapter();await run({view:()=>adapter.request('/api/state'),action:body=>adapter.request('/api/action',body)})}
 finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.storage;Date.now=old.now}
}
test('Offline: secundaria contrata costo y materiales reales',async()=>{
 const city=seed();city.money=250000;city.paused=true;
 await scenario(city,async({view,action})=>{
  const before=await view();
  const s=await action({action:'place',kind:'school',serviceModel:'secondarySchool',x:10,y:11,contractor:'Constructora Delta'});
  const p=s.projects.find(p=>p.x===10&&p.y===11);
  assert.equal(p.serviceModel,'secondarySchool');
  assert.equal(p.label,'Escuela secundaria');
  assert.ok(p.cost>=17800);
  assert.ok(p.materialsRequired.steel>25);
  assert.ok(s.money<before.money);
  await assert.rejects(action({action:'place',kind:'school',serviceModel:'policePost',x:11,y:11,contractor:'Sur Obras'}),/incompatible/);
 });
});
test('Offline: universidad distingue edades y no crea plazas sin docentes',async()=>{
 const city=seed();city.paused=true;
 city.buildings.push({kind:'school',serviceModel:'university',name:'Universidad experimental',x:10,y:11,
  status:'habilitado',classrooms:8,jobSlots:30,utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}});
 await scenario(city,async({view})=>{
  const s=await view(),school=s.educationReport.schools.find(x=>x.serviceModel==='university');
  assert.ok(school);
  assert.equal(school.ageMin,18);
  assert.equal(school.ageMax,24);
  assert.equal(school.radius,17);
  assert.equal(school.enrolled,0);
 });
});
