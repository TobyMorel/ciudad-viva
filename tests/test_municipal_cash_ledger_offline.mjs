import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
test('Offline: concilia transferencias de caja y no duplica consultas',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,oldNow=Date.now,storage=new Map(),city=structuredClone(seed);
  city.paused=true;city.money=10000;city.finance=city.finance||{};city.finance.debtReserve=0;storage.set('ciudad-viva-offline-v1',JSON.stringify(city));
  globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});Date.now=()=>5000;
  try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);let report=(await adapter.request('/api/state')).municipalFinance.cashLedger;assert.equal(report.openingBalance,10000);assert.equal(report.sequence,0);
    let result=await adapter.request('/api/action',{action:'municipalDebtReserve',direction:'deposit',amount:500});report=result.municipalFinance.cashLedger;
    assert.equal(report.sequence,1);assert.equal(report.payments,500);assert.equal(report.actualBalance,9500);assert.equal(report.calculatedBalance,9500);assert.equal(report.difference,0);assert.equal(result.finance.debtReserve,500);
    report=(await adapter.request('/api/state')).municipalFinance.cashLedger;assert.equal(report.sequence,1);assert.equal(report.payments,500);
  }finally{globalThis.fetch=oldFetch;Date.now=oldNow;if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage}
});
