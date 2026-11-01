import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

test('Offline: refinanciar extiende plazo, integra mora y no crea dinero',async()=>{
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage},store=new Map(),city=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
 city.paused=true;city.money=12345;city.finance=city.finance||{};city.finance.municipalLoans=[{id:'mun-refi-offline',status:'active',principal:10000,balance:7200,payment:950,monthsRemaining:8,termMonths:12,annualRate:.12,monthlyRate:.01,paymentArrears:1900,delinquentMonths:2}];store.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
 try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);const before=await adapter.request('/api/state');const next=await adapter.request('/api/action',{action:'refinanceMunicipalLoan',id:'mun-refi-offline'}),loan=next.finance.municipalLoans[0];assert.equal(next.money,before.money);assert.equal(loan.balance,9100);assert.equal(loan.paymentArrears,0);assert.equal(loan.monthsRemaining,72);assert.ok(loan.payment<950);assert.ok(loan.totalScheduled>loan.refinanceRecord.oldRemainingScheduled);await assert.rejects(()=>adapter.request('/api/action',{action:'refinanceMunicipalLoan',id:loan.id}),/ya fue refinanciado/);
 }finally{globalThis.fetch=old.fetch;if(old.storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=old.storage;}
});
