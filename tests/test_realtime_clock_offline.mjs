import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';
import {formatGameTime} from '../simulation_time.js';

const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));

test('Offline avanza hora continua, cruza medianoche ordenadamente y se congela al pausar',async()=>{
 const previousFetch=globalThis.fetch,previousStorage=globalThis.localStorage,previousNow=Date.now;
 let now=10_000;Date.now=()=>now;
 const storage=new Map([['ciudad-viva-offline-v1',JSON.stringify(seed)]]);globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(true);
  await adapter.request('/api/action',{action:'speed',value:4});
  let state=await adapter.request('/api/state'),day=state.day;
  const startMinutes=state.timeOfDayMinutes,startRevision=state.stateRevision;
  for(let i=0;i<4;i++){
   now+=250;state=await adapter.request('/api/state');
   assert.equal(state.day,day,`la hora ${i+1} no debe adelantar el calendario antes de medianoche`);assert.equal(state.stateRevision,startRevision,'el reloj no invalida la ciudad a cada consulta');
  }
  assert.equal(state.timeOfDayMinutes,startMinutes+20,'cuatro actualizaciones de 250 ms a ×4 avanzan 20 minutos con un día de 4:48 a ×1');
  for(let i=4;i<216;i++){now+=250;state=await adapter.request('/api/state')}
  assert.equal(state.day,day+1,'la jornada avanza al cruzar medianoche');
  assert.equal(state.timeOfDayMinutes,0,'la nueva jornada comienza a medianoche');assert.equal(state.stateRevision,startRevision+1,'el cruce de día publica una única revisión de ciudad');day=state.day;
  await adapter.request('/api/action',{action:'pause'});now+=10_000;
  state=await adapter.request('/api/state');assert.equal(state.day,day);assert.equal(state.timeOfDayMinutes,0);assert.equal(state.paused,true);
  await adapter.request('/api/action',{action:'pause'});now+=250;
  state=await adapter.request('/api/state');assert.equal(state.day,day);assert.equal(state.timeOfDayMinutes,5);assert.equal(state.paused,false);
  now+=1_500;state=await adapter.request('/api/state');
  assert.equal(state.day,day,'un retraso largo no omite jornadas antes de acumular 24 horas simuladas');
  assert.equal(state.timeOfDayMinutes,35,'el reloj continuo conserva los 30 minutos simulados del retraso');
 }finally{Date.now=previousNow;globalThis.fetch=previousFetch;if(previousStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=previousStorage}
});
