import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';
import {evaluateContractClaim} from '../contract_arbitration.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));

test('La mediación contrasta plazo, pago y calidad con evidencia verificable',()=>{
 const late=evaluateContractClaim('delay',{cost:10000,contractedDay:10,duration:20,completedDay:80,status:'completed'},90);
 assert.equal(late.upheld,true);assert.equal(late.lateDays,50);assert.ok(late.penalty>0);
 const early=evaluateContractClaim('delay',{cost:10000,contractedDay:10,duration:20,completedDay:35,status:'completed'},90);
 assert.equal(early.upheld,false);
 const overpaid=evaluateContractClaim('certification',{cost:10000,progress:.5,paid:9000},40);
 assert.equal(overpaid.upheld,true);assert.equal(overpaid.penalty,3000);
 const clean=evaluateContractClaim('quality',{cost:10000,assetQuality:82},40);assert.equal(clean.upheld,false);
});

test('Offline/LAN: un atraso respaldado pasa por mediación y cobra multa sin crear fondos',async()=>{
 const original={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now},store=new Map();let now=0,city=seed();
 city.day=100;city.lastMonth=3;city.paused=true;city.money=50000;city.monthlyIncome=0;city.grossMonthlyIncome=0;city.monthlyExpenses=0;city.effectiveMonthlyExpenses=0;city.population=0;city.jobs=0;city.employment=0;city.services=0;city.buildings=[];city.roads=[[4,10]];city.roadAssets=[];city.projects=[{id:'late-road',kind:'road',label:'Calle del Puerto',x:5,y:10,contractor:'Sur Obras',cost:10000,paid:5000,duration:20,elapsed:29,progress:.5,status:'pausada',contractedDay:10,qualityPenalty:0}];
 city.supply.contractorCash['Sur Obras']=1000;city.contractDisputes=[];city.contractHistory=[];city.supply.contractorDebts={};
 store.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.fetch=async()=>({ok:true,json:async()=>seed()});globalThis.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};Date.now=()=>now;
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);let view=await adapter.request('/api/state');
  const originalMoney=view.money;
  view=await adapter.request('/api/action',{action:'fileContractDispute',projectId:'late-road',claim:'delay'});
  const filed=view.contractDisputeReport.cases[0];assert.equal(filed.status,'en_mediacion');assert.equal(view.money,originalMoney-filed.filingFee);
  await assert.rejects(adapter.request('/api/action',{action:'fileContractDispute',projectId:'late-road',claim:'delay'}),/mediación abierta/);
  await adapter.request('/api/action',{action:'pause',value:false});
  const persisted=JSON.parse(store.get('ciudad-viva-offline-v1'));persisted.day=104;persisted.lastMonth=3;store.set('ciudad-viva-offline-v1',JSON.stringify(persisted));await adapter.request('/api/load');now+=1000;view=await adapter.request('/api/state');
  const resolved=view.contractDisputeReport.cases[0];assert.equal(resolved.status,'fundado');assert.ok(resolved.penaltyRecovered>0);
  assert.ok(view.money<=originalMoney-filed.filingFee+resolved.penaltyRecovered,'la ciudad solo recupera fondos del contratista; el día puede incluir operación normal');
  assert.equal(resolved.penaltyRecovered+resolved.penaltyOutstanding,resolved.penaltyAssessed);
  assert.equal(view.supply.contractorCash['Sur Obras'],1000-resolved.penaltyRecovered);
  assert.equal(view.contractDisputeReport.open,0);
 }finally{globalThis.fetch=original.fetch;Date.now=original.now;if(original.storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=original.storage}
});
