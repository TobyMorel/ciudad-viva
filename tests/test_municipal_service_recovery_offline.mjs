import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
test('Offline: los servicios solo se recuperan gradualmente tras cubrir el mes y toda la mora',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,oldNow=Date.now,storage=new Map(),city=structuredClone(seed);
  city.paused=false;city.speed=1;city.day=30;city.lastMonth=0;city.money=0;city.monthlyIncome=0;city.baseMonthlyGross=0;city.monthlyExpenses=1000000;city.services=80;
  city.finance=city.finance||{};city.finance.programBudgets={servicesPct:100,mobilityPct:100,networksPct:100,arrears:{services:0,mobility:0,networks:0},underfundedMonths:{services:0,mobility:0,networks:0},financialServiceImpact:0,lastReport:{},history:[]};
  storage.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});let now=5000;Date.now=()=>now;
  try{
    let adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);now+=1000;let result=await adapter.request('/api/state');
    assert.ok(result.finance.programBudgets.financialServiceImpact>0);assert.ok(result.services<80);
    const impact=result.finance.programBudgets.financialServiceImpact,damaged=result.services;result.services-=6;result.finance.programBudgets.arrears.services=1;result.money=10000000;result.monthlyExpenses=0;result.baseMonthlyGross=10000000;result.day=60;result.lastMonth=1;result.finance.programBudgets.servicesPct=200;
    storage.set('ciudad-viva-offline-v1',JSON.stringify(result));adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);now+=1000;result=await adapter.request('/api/state');
    assert.equal(result.finance.programBudgets.arrears.services,0);assert.equal(result.finance.programBudgets.financialServiceImpact,impact-1);assert.ok(result.services>=5);assert.equal(result.finance.programBudgets.servicesFundingFactor,1);
  }finally{globalThis.fetch=oldFetch;Date.now=oldNow;if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;}
});
