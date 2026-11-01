import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function scenario(city,run){
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};let saved=JSON.stringify(city);
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});globalThis.localStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v}};Date.now=()=>0;
 try{const adapter=await createOfflineAdapter();await run({view:()=>adapter.request('/api/state'),action:body=>adapter.request('/api/action',body)})}
 finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.storage;Date.now=old.now}
}

test('Offline: anexo escolar es obra contratada y solo suma plazas al ser inspeccionado',async()=>{
 const city=seed();city.paused=true;city.money=200000;
 city.buildings.push({kind:'school',serviceModel:'primarySchool',name:'Escuela del Parque',x:10,y:9,status:'habilitado',classrooms:4,jobSlots:12,monthlyCost:820});
 await scenario(city,async({view,action})=>{
  const before=await view(),startingMoney=before.money;
  const started=await action({action:'expandSchool',x:10,y:9,contractor:'Constructora Delta'});
  const project=started.projects.find(p=>p.projectType==='schoolExpansion');
  assert.ok(project);assert.equal(project.classroomsAdded,2);assert.equal(project.seatsAdded,48);assert.equal(project.teachersAdded,3);
  assert.equal(project.status,'contratada');assert.ok(project.materialsRequired.steel>0);assert.equal(project.paid,Math.round(project.cost*.2));
  assert.equal(startingMoney-started.money,project.paid);
  const school=started.buildings.find(b=>b.name==='Escuela del Parque');assert.equal(school.classrooms,4);assert.equal(school.jobSlots,12);
  await assert.rejects(action({action:'expandSchool',x:10,y:9,contractor:'Sur Obras'}),/ya tiene un anexo/);
 });
});
