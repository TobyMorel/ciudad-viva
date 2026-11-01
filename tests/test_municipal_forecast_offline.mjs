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

test('Offline: la previsión contabiliza mora de cuotas y su recuperación cuando hay caja',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,oldNow=Date.now,storage=new Map(),city=structuredClone(seed);
  city.paused=true;city.money=25000;city.day=121;city.finance=city.finance||{};city.finance.municipalLoans=[{id:'arrears-offline',status:'active',balance:10000,payment:500,monthsRemaining:4,monthlyRate:.01,paymentArrears:500,delinquentMonths:1}];
  storage.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});let now=5000;Date.now=()=>now;
  try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);const result=await adapter.request('/api/state'),month=result.municipalFinance.forecastMonths.months[0];assert.equal(month.scheduledDebtService,1000);assert.equal(month.debtService,1000);assert.equal(month.debtArrears,0);assert.equal(month.debtDefault,false)}
  finally{globalThis.fetch=oldFetch;Date.now=oldNow;if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage}
});

test('Offline: una previsión sin caja arrastra la cuota impaga sin reducir principal',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,oldNow=Date.now,storage=new Map(),city=structuredClone(seed);
  city.paused=true;city.money=0;city.monthlyIncome=0;city.baseMonthlyGross=0;city.monthlyExpenses=1000000;city.day=121;city.finance=city.finance||{};city.finance.municipalLoans=[{id:'default-offline',status:'active',balance:10000,payment:500,monthsRemaining:4,monthlyRate:.01,paymentArrears:0}];
  storage.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});let now=5000;Date.now=()=>now;
  try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);const result=await adapter.request('/api/state'),forecast=result.municipalFinance.forecastMonths,month=forecast.months[0];assert.equal(month.debtDefault,true);assert.equal(month.debtArrears,500);assert.equal(month.debtService,0);assert.equal(result.municipalFinance.loans[0].balance,10000);assert.equal(forecast.earlyWarning.month,1);assert.ok(forecast.earlyWarning.shortfall>0);assert.ok(forecast.earlyWarning.causes.length);assert.ok(forecast.earlyWarning.actions.length)}
  finally{globalThis.fetch=oldFetch;Date.now=oldNow;if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage}
});

test('Offline: el cierre mensual registra cuota impaga y congela la amortización del crédito',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,oldNow=Date.now,storage=new Map(),city=structuredClone(seed);
  city.paused=false;city.speed=1;city.day=30;city.lastMonth=0;city.money=0;city.monthlyIncome=0;city.baseMonthlyGross=0;city.monthlyExpenses=1000000;city.finance=city.finance||{};city.finance.municipalLoans=[{id:'default-month-close',status:'active',balance:10000,payment:500,monthsRemaining:4,monthlyRate:.01,paymentArrears:0,delinquentMonths:0}];
  storage.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});let now=5000;Date.now=()=>now;
  try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);now+=1000;const result=await adapter.request('/api/state'),loan=result.finance.municipalLoans[0];assert.equal(result.day,31);assert.equal(loan.paymentArrears,500);assert.equal(loan.balance,10000);assert.equal(loan.monthsRemaining,4);assert.equal(loan.delinquentMonths,1);assert.ok(result.events.some(e=>e.title==='Cuota municipal impaga'))}
  finally{globalThis.fetch=oldFetch;Date.now=oldNow;if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage}
});
