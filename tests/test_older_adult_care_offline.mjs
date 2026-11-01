import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

test('Offline: el centro asigna visitas a mayores por plantilla y ruta y conserva la ficha social',async()=>{
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now},store=new Map(),city=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
 const roads=[[4,10],[5,10]];city.day=30;city.lastMonth=0;city.paused=false;city.speed=1;city.population=2;city.jobs=30;city.employment=60;city.money=50000;city.monthlyIncome=5000;city.monthlyExpenses=1450;city.roads=roads;city.roadAssets=[];
 city.buildings=[
  {kind:'home',name:'Casa del barrio',x:4,y:10,occupants:2,capacity:4,quality:90,householdCash:0,monthlyWageIncome:0,residents:[
   {id:'care-worker',age:40,workerEligible:true,status:'buscando',skills:{salud:100,comercio:70,logistica:70,administracion:70,educacion:70,bomberos:70},expectedMonthlyWage:8,carAccess:false},
   {id:'care-senior',age:82,workerEligible:false,status:'jubilado',skills:{},expectedMonthlyWage:8,carAccess:false}]},
  {kind:'civic',name:'Centro de cuidados diurnos',serviceModel:'elderCare',x:5,y:10,status:'habilitado',jobSlots:10,monthlyCost:1450,elderCare:{careSlots:36},utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}}
 ];
 city.socialServices={housingAidBudget:0,lastReport:{},history:[],shelterResidents:[],shelterReport:{},elderCareReport:{}};
 city.finance.programBudgets={servicesPct:100,mobilityPct:100,networksPct:100,programPriority:['services','networks','mobility'],arrears:{services:0,mobility:0,networks:0},underfundedMonths:{services:0,mobility:0,networks:0},financialServiceImpact:0,lastReport:{},history:[]};
 city.utilities=city.utilities||{};for(const k of ['powerLines','waterPipes','sewerLines','drainLines','gasLines','telecomLines'])city.utilities[k]=roads;city.utilities.basePowerCapacityKw=3000;city.utilities.baseWaterCapacityM3Day=1000;city.utilities.baseWastewaterTreatmentM3Day=1000;city.utilities.baseDrainageCapacityM3Day=3000;city.utilities.baseTelecomCapacityMbps=2000;
 store.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});let now=1000;Date.now=()=>now;
 try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);const before=await adapter.request('/api/state');assert.equal(before.day,30);now+=1000;const next=await adapter.request('/api/state');const report=next.socialServices.elderCareReport;assert.ok(report,`social report not saved: ${JSON.stringify(next.socialServices)}`);assert.equal(report.eligible,1);assert.equal(report.served,1);assert.equal(report.waiting,0);assert.equal(next.buildings[0].residents.find(p=>p.id==='care-senior').careStatus,'visita mensual asignada');assert.equal(next.buildings[0].residents.find(p=>p.id==='care-senior').careNeed,'alta');
 }finally{globalThis.fetch=old.fetch;Date.now=old.now;if(old.storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=old.storage;}
});
