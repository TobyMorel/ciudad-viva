import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
test('Offline: el cierre paga ayuda de alquiler con cupo, deuda comprobada y balance municipal',async()=>{
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now},store=new Map(),city=seed();
 city.day=30;city.lastMonth=0;city.paused=false;city.speed=1;city.money=100000;city.monthlyIncome=6000;city.baseMonthlyGross=6000;city.monthlyExpenses=0;city.population=0;city.jobs=0;
 city.buildings=[{kind:'home',name:'Vivienda con mora',x:8,y:9,adaptiveReuseDay:1,leaseStartDay:1,rentalLeaseDays:[1,1],rentalPricePerResident:24,occupants:2,capacity:4,householdCash:0,monthlyWageIncome:0,rentArrears:0,rentalOwnerCash:0,residents:[]}];
 city.roads=[];city.roadAssets=[];city.projects=[];city.busRoutes=[];city.monthlyIncome=6000;
 store.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};globalThis.fetch=async()=>({ok:true,json:async()=>seed()});let now=0;Date.now=()=>now;
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);
  const configured=await adapter.request('/api/action',{action:'adjustHousingAidBudget',delta:250});assert.equal(configured.socialServices.housingAidBudget,250);
  now+=1000;const closed=await adapter.request('/api/state');const home=closed.buildings[0];
  assert.equal(closed.day,31);assert.equal(home.rentArrears,0);assert.equal(home.rentalOwnerCash,48);assert.equal(closed.socialServices.lastReport.paid,48);assert.equal(closed.socialServices.lastReport.eligible,1);
  assert.ok(closed.finance.programBudgets.lastReport.programs.services.monthlyCost>=48,'la ayuda está contabilizada dentro del gasto municipal de servicios');
  await assert.rejects(adapter.request('/api/action',{action:'adjustHousingAidBudget',delta:50}),/pasos de \$250/);
 }finally{globalThis.fetch=old.fetch;Date.now=old.now;if(old.storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=old.storage;}
});
