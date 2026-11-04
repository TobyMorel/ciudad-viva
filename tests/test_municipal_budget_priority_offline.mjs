import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
test('Offline: la prioridad de caja se guarda y ordena los pagos municipales',async()=>{
 const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,storage=new Map();
 storage.set('ciudad-viva-offline-v1',JSON.stringify(seed));
 globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);
  let state=await adapter.request('/api/state');
  assert.deepEqual(state.finance.programBudgets.programPriority,['services','networks','mobility']);
  state=await adapter.request('/api/action',{action:'setProgramPriority',program:'mobility'});
  assert.deepEqual(state.finance.programBudgets.programPriority,['mobility','services','networks']);
  assert.ok(state.events.some(event=>/Prioridad de gasto municipal/.test(event.title)));
  await assert.rejects(adapter.request('/api/action',{action:'setProgramPriority',program:'education'}),/programa municipal válido/);
 }finally{
  globalThis.fetch=oldFetch;
  if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;
 }
});

test('Offline forecast honors the chosen payment priority under a municipal cash shortfall',async()=>{
 const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,storage=new Map(),city=structuredClone(seed);
 city.paused=true;city.day=1;city.lastMonth=0;city.buildings=[];city.workplaces=[];city.roads=[];city.busRoutes=[];city.money=0;city.monthlyIncome=0;city.baseMonthlyGross=0;city.monthlyExpenses=0;city.publicPayroll=0;
 city.utilities={failures:[],powerLines:[],waterPipes:[],sewerLines:[],drainLines:[],gasLines:[],telecomLines:[],maintenanceFundingFactor:1};city.waste={baseCollectionTonsDay:0,baseLandfillCapacityTons:0,containers:[],fundingFactor:1};
 city.finance.programBudgets={servicesPct:100,networksPct:100,mobilityPct:100,programPriority:['mobility','services','networks'],arrears:{services:0,networks:0,mobility:0},underfundedMonths:{services:0,networks:0,mobility:0},lastReport:{programs:Object.fromEntries(['services','networks','mobility'].map(program=>[program,{monthlyCost:100}]))},history:[]};
 storage.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});
 try{
  let adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);let baseline=await adapter.request('/api/state');
  city.airportMonthlyIncome=100; // fuente real: tasas aeroportuarias, no ingreso mensual ficticio
  storage.set('ciudad-viva-offline-v1',JSON.stringify(city));adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);
  const month=(await adapter.request('/api/state')).municipalFinance.forecastMonths.months[0];
  assert.equal(month.programPayments,100);assert.equal(month.programArrears,200);
  assert.deepEqual(month.underfundedPrograms,['services','networks']);assert.equal(month.fundingGap,200);
 }finally{globalThis.fetch=oldFetch;if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage}
});
