import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

test('Offline nueva partida: empieza en terreno vacío, con acceso regional y demanda residencial',async()=>{
 const fetch0=globalThis.fetch,storage0=globalThis.localStorage;
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
 globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
 try{const adapter=await createOfflineAdapter(),state=await adapter.request('/api/state');assert.deepEqual(state.buildings,[]);assert.deepEqual(state.roads,[[4,10]]);assert.equal(state.population,0);assert.equal(state.housingDemand.unmet,36);assert.equal(state.newSettlement,true);assert.equal(state.buildings.length,0)}finally{globalThis.fetch=fetch0;globalThis.localStorage=storage0}
});

test('Offline: los candados desbloquean sectores contiguos pagando y la coordenada no tiene borde',async()=>{
 const fetch0=globalThis.fetch,storage0=globalThis.localStorage;
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
 globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
 try{
  const adapter=await createOfflineAdapter();let state=await adapter.request('/api/state');
  assert.equal(state.landClaims.unlockedChunks.length,4);assert.equal(state.landClaims.chunkSize,8);
  const before=state.money;
  await assert.rejects(adapter.request('/api/action',{action:'unlockLand',chunkX:8,chunkY:8}),/zona vecina/);
  state=await adapter.request('/api/action',{action:'unlockLand',chunkX:-1,chunkY:0});
  assert.equal(state.money,before-3500);assert.ok(state.landClaims.unlockedChunks.includes('-1,0'));
  await assert.rejects(adapter.request('/api/action',{action:'place',kind:'road',x:-1,y:10,contractor:'Sur Obras'}),/zona bloqueada/);
 }finally{globalThis.fetch=fetch0;globalThis.localStorage=storage0}
});

test('Offline: el río continúa y deja terreno desbloqueable en la otra orilla',async()=>{
 const fetch0=globalThis.fetch,storage0=globalThis.localStorage;
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
 globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
 try{
  const adapter=await createOfflineAdapter();
  await adapter.request('/api/action',{action:'unlockLand',chunkX:2,chunkY:1});
  const city=await adapter.request('/api/action',{action:'unlockLand',chunkX:3,chunkY:1});
  assert.ok(city.landClaims.unlockedChunks.includes('3,1'));
  await assert.rejects(adapter.request('/api/action',{action:'placeRoad',x:24,y:10}),/agua/);
  await assert.rejects(adapter.request('/api/action',{action:'placeRoad',x:25,y:10}),/agua/);
  await assert.rejects(adapter.request('/api/action',{action:'placeRoad',x:26,y:10}),/conectar/);
 }finally{globalThis.fetch=fetch0;globalThis.localStorage=storage0}
});

test('Offline: pintar vivienda activa promotor privado sin esperar pedidos de materiales',async()=>{
 const fetch0=globalThis.fetch,storage0=globalThis.localStorage,now0=Date.now;let stored=null,clock=1000;
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
 globalThis.localStorage={getItem:()=>stored,setItem:(_,value)=>{stored=value}};Date.now=()=>clock;
 try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);let state=await adapter.request('/api/state');assert.deepEqual(state.buildings,[]);await adapter.request('/api/action',{action:'zone',kind:'home',x:5,y:10});let project;for(let i=0;i<35;i++){clock+=1000;state=await adapter.request('/api/state');project=state.projects.find(p=>p.zonedDevelopment&&p.kind==='home');if(project)break}assert.ok(project,'la demanda acumulada inicia la obra privada al cierre mensual');assert.equal(project.privateMaterialsIncluded,true);assert.ok(Object.values(project.materialsRequired).every(n=>n===0));assert.equal(state.supply.orders.filter(o=>o.projectId===project.id).length,0);assert.ok(project.duration>0,'la obra conserva etapas y plazo')}
 finally{globalThis.fetch=fetch0;globalThis.localStorage=storage0;Date.now=now0}
});

test('Offline: demanda continua y población supera 44 con vivienda disponible',async()=>{
 const fetch0=globalThis.fetch,storage0=globalThis.localStorage,now0=Date.now;let stored=null,clock=1000;
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
 globalThis.localStorage={getItem:()=>stored,setItem:(_,value)=>{stored=value}};Date.now=()=>clock;
 try{const first=await createOfflineAdapter();await first.request('/api/state');const city=JSON.parse(stored);city.buildings=[{kind:'home',name:'Barrio nuevo',x:5,y:10,capacity:120,occupants:0,residents:[],quality:80}];city.roads=[[4,10],[5,10]];stored=JSON.stringify(city);const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);let state=await adapter.request('/api/state');for(let i=0;i<28;i++){clock+=1000;state=await adapter.request('/api/state')}assert.ok(state.population>44,`población ${state.population}`);assert.ok(state.housingDemand.unmet>=4);assert.ok(state.privateCapital>42000)}finally{globalThis.fetch=fetch0;globalThis.localStorage=storage0;Date.now=now0}
});
