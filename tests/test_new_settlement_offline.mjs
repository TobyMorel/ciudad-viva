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

test('Offline: pintar vivienda activa promotor privado sin esperar pedidos de materiales',async()=>{
 const fetch0=globalThis.fetch,storage0=globalThis.localStorage,now0=Date.now;let stored=null,clock=1000;
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});
 globalThis.localStorage={getItem:()=>stored,setItem:(_,value)=>{stored=value}};Date.now=()=>clock;
 try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);let state=await adapter.request('/api/state');assert.deepEqual(state.buildings,[]);await adapter.request('/api/action',{action:'zone',kind:'home',x:5,y:10});for(let i=0;i<5;i++){clock+=6000;state=await adapter.request('/api/state')}const project=state.projects.find(p=>p.zonedDevelopment&&p.kind==='home');assert.ok(project,'la demanda acumulada inicia la obra privada al cierre mensual');assert.equal(project.privateMaterialsIncluded,true);assert.ok(Object.values(project.materialsRequired).every(n=>n===0));assert.equal(state.supply.orders.filter(o=>o.projectId===project.id).length,0);assert.ok(project.duration>0,'la obra conserva etapas y plazo')}
 finally{globalThis.fetch=fetch0;globalThis.localStorage=storage0;Date.now=now0}
});
