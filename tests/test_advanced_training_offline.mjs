import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
test('Offline/LAN: formación docente y técnica usa niveles educativos y mejora habilidades laborales',async()=>{
 const original={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now},city=seed(),store=new Map();let now=0;
 city.day=30;city.lastMonth=0;city.paused=false;city.speed=1;city.timeOfDayMinutes=420;city.money=100000;city.population=2;city.jobs=0;
 city.roads=[[4,10],[5,10],[6,10]];city.roadAssets=[];city.projects=[];city.workplaces=[];city.buildings=[
  {kind:'home',name:'Hogar de práctica',x:4,y:10,status:'habilitado',capacity:4,occupants:2,quality:80,householdCash:500,residents:[
   {id:'teacher',age:32,workerEligible:true,status:'buscando',educationRank:2,skills:{educacion:40},monthlyWage:0},
   {id:'technical',age:29,workerEligible:true,status:'buscando',educationRank:1,skills:{logistica:40},monthlyWage:0}
  ]},
  {kind:'civic',name:'Aula municipal',id:'civic-6-10',x:6,y:10,status:'habilitado',jobSlots:6,monthlyCost:0}
 ];
 city.utilities={...(city.utilities||{}),failures:[],powerLines:city.roads.map(x=>x.slice()),waterPipes:city.roads.map(x=>x.slice()),sewerLines:city.roads.map(x=>x.slice()),drainLines:city.roads.map(x=>x.slice()),gasLines:city.roads.map(x=>x.slice()),telecomLines:city.roads.map(x=>x.slice())};
 store.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};globalThis.fetch=async()=>({ok:true,json:async()=>seed()});Date.now=()=>now;
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);
  let view=await adapter.request('/api/state');
  assert.equal(view.trainingCatalog.find(x=>x.category==='docencia').availableCandidates,1);
  assert.equal(view.trainingCatalog.find(x=>x.category==='tecnica').availableCandidates,2);
  view=await adapter.request('/api/action',{action:'startTrainingProgram',category:'docencia'});
  assert.deepEqual(view.trainingPrograms.at(-1).traineeIds,['teacher']);
  now+=1000;view=await adapter.request('/api/state');
  assert.equal(view.day,31);assert.equal(view.buildings[0].residents.find(p=>p.id==='teacher').skills.educacion,58);
  assert.equal(view.trainingPrograms.at(-1).monthsCompleted,1);
 }finally{globalThis.fetch=original.fetch;Date.now=original.now;if(original.storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=original.storage}
});
