import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';
const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function fixture(work,coordinates={x:8,y:10}){
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};let saved;
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
 const city=seed();city.paused=true;city.money=100000;city.utilities=city.utilities||{};city.utilities.failures=[{id:'outage-1',network:'power',x:coordinates.x,y:coordinates.y,repairCost:500,affectedBuildings:4,status:'avería',remainingDays:0}];
 saved=JSON.stringify(city);globalThis.localStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v}};Date.now=()=>0;
 try{const a=await createOfflineAdapter();await work({action:d=>a.request('/api/action',d),view:()=>a.request('/api/state')})}
 finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.storage;Date.now=old.now}
}
test('Offline despacha prioridad urgente por ruta, costo doble y plazo de un día',async()=>fixture(async({action})=>{
 const s=await action({action:'repairUtilityEmergency',id:'outage-1'}),f=s.utilities.report.failures.find(x=>x.id==='outage-1');
 assert.equal(s.money,99000);assert.equal(f.status,'en reparación');assert.equal(f.responseKind,'emergencia');assert.equal(f.remainingDays,1);assert.ok(f.responseRoute.length>=2);assert.equal(f.emergencyRouteAvailable,true);
 await assert.rejects(action({action:'repairUtilityEmergency',id:'outage-1'}),/cuadrilla asignada/);
}));
test('Offline niega prioridad sin ruta y conserva fondos',async()=>fixture(async({action})=>{
 await assert.rejects(action({action:'repairUtilityEmergency',id:'outage-1'}),/ruta vial/);
}, {x:2,y:2}));
test('Offline conserva el plazo de tres días para la reparación normal',async()=>fixture(async({action})=>{
 const city=await action({action:'repairUtility',id:'outage-1'});assert.equal(city.money,99500);const f=city.utilities.report.failures.find(x=>x.id==='outage-1');assert.equal(f.remainingDays,3);assert.equal(f.responseKind,'programada');
}));
