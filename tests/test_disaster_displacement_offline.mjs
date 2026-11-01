import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
test('Offline: una inundación evacua el hogar al refugio y devuelve a sus mismos residentes',async()=>{
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now},store=new Map(),city=seed(),roads=[[4,10],[5,10]];
 city.day=17;city.lastMonth=0;city.paused=false;city.speed=1;city.money=200000;city.monthlyIncome=6000;city.baseMonthlyGross=6000;city.grossMonthlyIncome=6000;city.monthlyExpenses=1180;city.population=1;city.jobs=100;city.approval=45;city.employment=80;city.roads=roads;city.roadAssets=[];
 city.buildings=[
  {kind:'home',name:'Casa inundable',x:12,y:12,occupants:1,capacity:1,residents:[{id:'persona-afectada',age:35,birthYear:1991,workerEligible:true,status:'empleado',employerId:'work-a',monthlyWage:12,attendance:1,skills:{salud:75,comercio:70,logistica:70,administracion:70,educacion:70,bomberos:70},carAccess:false}],quality:90,householdCash:1500},
  {kind:'civic',name:'Refugio municipal',serviceModel:'socialShelter',x:5,y:10,status:'habilitado',jobSlots:12,monthlyCost:1180,socialShelter:{beds:30,residents:[]},utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}}
 ];
 city.socialServices={housingAidBudget:0,lastReport:{},history:[],shelterResidents:[],shelterReport:{}};city.housingDemand={unmet:0,lastGenerated:0,lastFilled:0};
 city.finance.programBudgets={servicesPct:100,mobilityPct:100,networksPct:100,programPriority:['services','networks','mobility'],arrears:{services:0,mobility:0,networks:0},underfundedMonths:{services:0,mobility:0,networks:0},financialServiceImpact:0,lastReport:{},history:[]};
 city.utilities=city.utilities||{};for(const key of ['powerLines','waterPipes','sewerLines','gasLines','telecomLines'])city.utilities[key]=roads;city.utilities.drainLines=[[4,10],[5,10]];city.utilities.basePowerCapacityKw=3000;city.utilities.baseWaterCapacityM3Day=1000;city.utilities.baseWastewaterTreatmentM3Day=1000;city.utilities.baseDrainageCapacityM3Day=3000;city.utilities.baseTelecomCapacityMbps=2000;
 store.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};globalThis.fetch=async()=>({ok:true,json:async()=>seed()});let now=0;Date.now=()=>now;
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);await adapter.request('/api/state');
  now=1000;const evacuated=await adapter.request('/api/state');assert.equal(evacuated.day,18);const home=evacuated.buildings.find(b=>b.kind==='home'),person=evacuated.socialServices.shelterResidents.find(p=>p.id==='persona-afectada');
  assert.ok(person?.displacedBy==='inundación',JSON.stringify({report:evacuated.utilities.report?.drainage,people:evacuated.socialServices.shelterResidents}));assert.equal(home.occupants,0);assert.equal(evacuated.population,1);assert.equal(person.originHomeX,12);assert.ok(person.plannedReturnDay>evacuated.day);
  evacuated.day=60;evacuated.lastMonth=1;evacuated.approval=45;store.set('ciudad-viva-offline-v1',JSON.stringify(evacuated));const reloaded=await createOfflineAdapter();reloaded.setRealtimeClock(false);await reloaded.request('/api/state');
  now=2000;const returned=await reloaded.request('/api/state');const restored=returned.buildings.find(b=>b.kind==='home');assert.equal(restored.occupants,1);assert.equal(restored.residents[0].id,'persona-afectada');assert.equal(returned.socialServices.shelterResidents.some(p=>p.id==='persona-afectada'),false);assert.equal(returned.population,1);
 }finally{globalThis.fetch=old.fetch;Date.now=old.now;if(old.storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=old.storage;}
});
