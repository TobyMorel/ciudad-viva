import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {growthDemand} from '../growth_demand.js';
import {createOfflineAdapter} from '../offline.js';

test('Demanda residencial 0% con vivienda vacía, aunque haya 700 personas interesadas',()=>{
 const state={day:28,population:252,housingDemand:{unmet:700},buildings:[{kind:'home',x:8,y:13,capacity:28,occupants:0}],projects:[]};
 assert.equal(growthDemand(state).housing.value,0);
 assert.equal(growthDemand(state).housing.vacancies,28);
 state.buildings[0].occupants=27;assert.equal(growthDemand(state).housing.value,0);
 state.buildings[0].occupants=28;assert.equal(growthDemand(state).housing.value,100);
});
test('Demanda comercial solo cuando no hay capacidad de ventas ni locales en obra',()=>{
 const state={day:28,population:252,buildings:[{kind:'shop',status:'operativo',business:{status:'abierto',lastLocalDemand:5,lastLocalSales:5}}],projects:[]};
 assert.equal(growthDemand(state).commercial.value,0);
 state.buildings[0].business.lastLocalDemand=30;
 assert.equal(growthDemand(state).commercial.value,50);
 state.projects.push({kind:'shop',status:'contratada'});
 assert.equal(growthDemand(state).commercial.value,0);
});
test('Offline usa oferta real y no adjudica vivienda privada mientras haya plazas',async()=>{
 const previousFetch=globalThis.fetch,previousStorage=globalThis.localStorage,previousClock=Date.now;let saved=null,clock=1000;
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};Date.now=()=>clock;
 try{
   const first=await createOfflineAdapter();await first.request('/api/state');const city=JSON.parse(saved);
   city.buildings=[{kind:'home',x:5,y:9,capacity:500,occupants:0,residents:[],quality:80}];
   city.housingDemand.unmet=500;city.roads=[[4,10],[5,10]];
   city.zones=[{x:5,y:10,kind:'home',status:'disponible'}];city.paused=false;city.money=250000;city.privateCapital=250000;
   saved=JSON.stringify(city);
   const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);
   let state=await adapter.request('/api/state');
   assert.equal(state.growthDemand.housing.value,0);
   for(let i=0;i<4;i++){clock+=1000;state=await adapter.request('/api/state')}
   assert.ok(state.growthDemand.housing.vacancies>0,'la casa aún tiene plazas libres');
   assert.equal(state.growthDemand.housing.value,0);
   assert.equal(state.projects.filter(p=>p.kind==='home').length,0,'no debe iniciar obra nueva mientras hay casas libres');
 }finally{globalThis.fetch=previousFetch;globalThis.localStorage=previousStorage;Date.now=previousClock}
});
test('Demanda y calle conectada inician obras privadas con tesorería y capital promotor en cero',async()=>{
 const previousFetch=globalThis.fetch,previousStorage=globalThis.localStorage,previousClock=Date.now;let saved=null,clock=1000;
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};Date.now=()=>clock;
 try{
   const first=await createOfflineAdapter();await first.request('/api/state');const city=JSON.parse(saved);
   city.buildings=[];city.projects=[];city.money=0;city.privateCapital=0;city.population=168;city.housingDemand.unmet=325;city.roads=[[4,10],[5,10]];
   city.zones=[{x:5,y:11,kind:'home',status:'disponible'},{x:4,y:11,kind:'shop',status:'disponible'},{x:7,y:7,kind:'home',status:'disponible'}];city.paused=false;saved=JSON.stringify(city);
   const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);clock+=1000;
   const state=await adapter.request('/api/state');
   assert.ok(state.projects.some(p=>p.kind==='home'&&p.x===5&&p.y===11&&p.privatePaid));
   assert.ok(state.projects.some(p=>p.kind==='shop'&&p.x===4&&p.y===11&&p.privatePaid));
   assert.ok(!state.projects.some(p=>p.x===7&&p.y===7),'una parcela aislada no debe construirse');
   assert.equal(state.privateCapital,0);
 }finally{globalThis.fetch=previousFetch;globalThis.localStorage=previousStorage;Date.now=previousClock}
});
