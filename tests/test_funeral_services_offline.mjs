import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function scenario(city,work){
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now},store=new Map();
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};store.set('ciudad-viva-offline-v1',JSON.stringify(city));let now=0;Date.now=()=>now;
 try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);await adapter.request('/api/state');now=1000;return await work(adapter,store,()=>now+=1000)}finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.storage;Date.now=old.now}
}
function cityWithHome(){const c=seed();c.day=360;c.lastMonth=11;c.paused=false;c.speed=1;c.population=1;c.money=200000;c.roads=[[4,10],[4,11],[5,10]];c.roadAssets=[];c.buildings=[{kind:'home',name:'Hogar',x:4,y:11,occupants:1,capacity:1,quality:90,residents:[{id:'resident-115',name:'Elena',age:114,workerEligible:false,status:'jubilado'}]}];c.urbanEvolution={lastProcessedYear:2026,lastBirthYear:2026,history:[],deceased:[]};c.newSettlement=false;c.housingDemand={unmet:0,lastGenerated:0,lastFilled:0};c.utilities=c.utilities||{};for(const k of ['powerLines','waterPipes','sewerLines','drainLines','gasLines','telecomLines'])c.utilities[k]=c.roads;return c}

test('Offline: morir libera población/hogar y la ruta sepulta en el mismo día',async()=>{
 const c=cityWithHome();c.buildings.push({kind:'civic',name:'Cementerio',serviceModel:'cemetery',x:5,y:10,status:'habilitado'});
 await scenario(c,async adapter=>{const s=await adapter.request('/api/state'),d=s.urbanEvolution.deceased[0],grave=s.buildings.find(b=>b.serviceModel==='cemetery');assert.equal(s.day,361);assert.equal(d.age,115);assert.equal(d.disposition,'sepultado');assert.equal(s.population,1,'la mudanza mensual puede ocupar la plaza que liberó el fallecimiento');assert.equal(s.buildings.find(b=>b.kind==='home').occupants,1);assert.notEqual(s.buildings.find(b=>b.kind==='home').residents[0].id,'resident-115');assert.equal(grave.funeralService.burials.length,1);assert.equal(s.urbanEvolutionReport.cemeteryOccupied,1)})
});

test('Offline: reintenta la cola cada día y deriva a crematorio al agotarse cementerio',async()=>{
 const c=cityWithHome();c.urbanEvolution.lastProcessedYear=2027;c.buildings[0].residents=[];c.buildings[0].occupants=0;c.population=0;c.urbanEvolution.deceased=[{residentId:'old',name:'Persona en espera',age:115,year:2026,homeX:4,homeY:11,disposition:'en espera'}];c.buildings.push({kind:'civic',name:'Cementerio lleno',serviceModel:'cemetery',x:5,y:10,status:'habilitado',funeralService:{burials:Array.from({length:120},(_,i)=>({residentId:String(i)}))}},{kind:'civic',name:'Crematorio',serviceModel:'crematorium',x:5,y:10,status:'habilitado'});
 await scenario(c,async adapter=>{const s=await adapter.request('/api/state'),d=s.urbanEvolution.deceased[0],crem=s.buildings.find(b=>b.serviceModel==='crematorium');assert.equal(d.disposition,'cremado');assert.equal(crem.funeralService.cremationsThisYear,1);assert.equal(s.urbanEvolutionReport.awaitingFuneral,0)})
});


test('Offline: capacidad anual de cremación se renueva incluso sin ruta conectada',async()=>{
 const c=cityWithHome();c.day=361;c.urbanEvolution.lastProcessedYear=2027;c.buildings[0].residents=[];c.buildings[0].occupants=0;c.population=0;c.buildings.push({kind:'civic',name:'Crematorio aislado',serviceModel:'crematorium',x:20,y:18,status:'habilitado',funeralService:{year:2026,cremationsThisYear:24,totalCremations:24,history:[]}});
 await scenario(c,async adapter=>{const s=await adapter.request('/api/state'),f=s.buildings.find(b=>b.serviceModel==='crematorium');assert.equal(f.funeralService.year,2027);assert.equal(f.funeralService.cremationsThisYear,0);assert.equal(f.funeralService.totalCremations,24)})
});
