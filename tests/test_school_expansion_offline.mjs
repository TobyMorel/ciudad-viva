import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function scenario(city,run){
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};let saved=JSON.stringify(city),now=0;
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});globalThis.localStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v}};Date.now=()=>now;
 try{const adapter=await createOfflineAdapter();await run({view:()=>adapter.request('/api/state'),action:body=>adapter.request('/api/action',body),clock:enabled=>adapter.setRealtimeClock(enabled),elapse:async(ms=1000)=>{now+=ms;return adapter.request('/api/state')}})}
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

test('Offline: el anexo consume materiales, certifica hitos y habilita plazas al completar los días de obra',async()=>{
 const city=seed();city.buildings=[{kind:'school',serviceModel:'primarySchool',name:'Escuela Integral Offline',x:10,y:11,status:'habilitado',classrooms:4,jobSlots:12,monthlyCost:820}];
 city.roads=[...Array(7)].map((_,i)=>[i+4,10]).concat([[10,11]]);city.roadAssets=[];city.population=0;city.jobs=0;city.money=200000;city.paused=false;city.speed=1;city.day=1;city.traffic={segmentFlow:{}};
 city.projects=[];city.supply.yardCapacity=100000;city.supply.storageCapacity=100000;
 for(const stock of Object.values(city.supply.contractors||{}))for(const material of ['aggregate','concrete','steel','timber','components'])stock[material]=10000;
 await scenario(city,async({view,action,clock,elapse})=>{
  const start=await action({action:'expandSchool',x:10,y:11,contractor:'Sur Obras'}),project=start.projects.find(p=>p.projectType==='schoolExpansion');
  assert.ok(project);const required={...project.materialsRequired};clock(false);
  let state=start;
  for(let i=0;i<project.duration+5&&state.projects.some(p=>p.id===project.id);i++)state=await elapse();
  assert.ok(!state.projects.some(p=>p.id===project.id),'el contrato debe llegar a inspección en la simulación diaria');
  const school=state.buildings.find(b=>b.name==='Escuela Integral Offline');assert.equal(school.classrooms,6);assert.equal(school.jobSlots,15);
  const history=school.expansionHistory.at(-1);assert.equal(history.seats,48);assert.deepEqual(history.materialsUsed,required);assert.equal(history.quality,68);
  assert.ok(state.events.some(e=>e.title==='Hito de obra certificado'));assert.ok(state.events.some(e=>e.title==='Anexo escolar habilitado'));
  assert.ok(state.contractGuarantees?.some(g=>g.label.includes('Anexo escolar')),'la recepción debe crear la garantía contractual');
 });
});
