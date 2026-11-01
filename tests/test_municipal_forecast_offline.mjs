import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
test('Offline: la previsión móvil muestra doce cierres e integra compromisos municipales',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,oldNow=Date.now,storage=new Map(),city=structuredClone(seed);
  city.paused=true;city.money=25000;city.day=121;city.projects=[{id:'offline-project',cost:12000,paid:2000,duration:90,elapsed:30,status:'en curso'}];
  city.finance=city.finance||{};city.finance.municipalLoans=[{id:'offline-loan',status:'active',balance:6000,payment:550,monthsRemaining:12,monthlyRate:.01}];
  storage.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
  globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});let now=5000;Date.now=()=>now;
  try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);now+=1000;const result=await adapter.request('/api/state'),forecast=result.municipalFinance.forecastMonths;
    assert.equal(forecast.months.length,12);assert.equal(forecast.committedProjects,10000);assert.ok(forecast.months[0].contractPayments>0);assert.ok(forecast.months[0].debtService>0);
    assert.equal(forecast.months[0].closingCash,forecast.months[0].openingCash+forecast.months[0].net);
  }finally{globalThis.fetch=oldFetch;Date.now=oldNow;if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;}
});
