import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';
import {applyFoundationAdjustment,applySurveyHydrology,geotechnicalEstimate,geotechnicalSurvey} from '../land_survey.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));

test('El modelo de suelo es determinista, acota la incertidumbre y modifica la cimentación',()=>{
 const riverBank=geotechnicalSurvey(23,10),inland=geotechnicalSurvey(9,10),estimate=geotechnicalEstimate(23,10);
 assert.deepEqual(geotechnicalSurvey(23,10),riverBank);
 assert.ok(riverBank.floodRiskPct>inland.floodRiskPct);
 assert.ok(estimate.foundationBearingKpa.min<riverBank.foundationBearingKpa);
 assert.ok(estimate.foundationBearingKpa.max>riverBank.foundationBearingKpa);
 const adjustment=applyFoundationAdjustment(10000,40,riverBank);
 assert.ok(adjustment.cost>10000);assert.ok(adjustment.days>40);
 assert.equal(applyFoundationAdjustment(10000,40,null).cost,10000);
 const wetSite=applySurveyHydrology(.78,'firme',{permeabilityMmHour:5,floodRiskPct:82});
 const permeableSite=applySurveyHydrology(.78,'compacto',{permeabilityMmHour:35,floodRiskPct:20});
 assert.ok(wetSite.runoffCoefficient>permeableSite.runoffCoefficient);
 assert.equal(wetSite.elevationClass,'bajo');
 assert.equal(permeableSite.elevationClass,'compacto');
});

test('Offline/LAN: el estudio tiene costo y plazo, se guarda y ajusta una obra del sitio',async()=>{
 const original={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now},store=new Map();let now=0;
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
 globalThis.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};Date.now=()=>now;
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);
  await adapter.request('/api/state');
  let city=await adapter.request('/api/action',{action:'new'});
  assert.equal(city.money,175000);
  city=await adapter.request('/api/action',{action:'surveyParcel',x:5,y:10});
  assert.equal(city.money,174750);assert.equal(city.landSurveyReport.inProgress,1);
  await assert.rejects(adapter.request('/api/action',{action:'surveyParcel',x:5,y:10}),/ya tiene un estudio/);
  for(let i=0;i<6;i++){now+=1000;city=await adapter.request('/api/state')}
  assert.equal(city.landSurveyReport.parcels['5,10'].status,'in_progress');
  now+=1000;city=await adapter.request('/api/state');
  const survey=city.landSurveyReport.parcels['5,10'];assert.equal(survey.status,'completed');assert.equal(survey.result.soil,'aluvial húmedo');
  city=await adapter.request('/api/action',{action:'place',kind:'school',x:5,y:10,contractor:'Sur Obras'});
  const school=city.buildings.find(b=>b.kind==='school'&&b.x===5&&b.y===10);
  assert.ok(school.geotechnicalResult);assert.ok(school.foundationCostFactor>1);assert.ok(school.foundationCostDelta>0);
  const saved=JSON.parse(store.get('ciudad-viva-offline-v1'));assert.equal(saved.landStudies['5,10'].status,'completed');
 }finally{globalThis.fetch=original.fetch;Date.now=original.now;if(original.storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=original.storage}
});
