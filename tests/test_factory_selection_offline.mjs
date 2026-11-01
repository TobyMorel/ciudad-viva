import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';
const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function scene(city,run){
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};let saved=JSON.stringify(city);
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v}};
 Date.now=()=>1;
 try{const adapter=await createOfflineAdapter();await run({
  request:payload=>adapter.request('/api/action',payload),view:()=>adapter.request('/api/state')
 })}finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.storage;Date.now=old.now}
}
test('Fábrica elegida conserva la especialidad hormigonera en proyecto privado',async()=>{
 const city=seed();city.paused=true;city.money=300000;city.privateCapital=300000;
 city.zones=city.zones||[];city.zones.push({x:10,y:11,kind:'factory'});
 await scene(city,async({request,view})=>{
  const before=await view();
  const result=await request({action:'place',kind:'factory',industryType:'concrete',x:10,y:11,contractor:'Constructora Delta'});
  const job=result.projects.find(x=>x.kind==='factory'&&x.x===10&&x.y===11);
  assert.ok(job);assert.equal(job.industryType,'concrete');assert.ok(job.label.includes('Hormig'));
  assert.ok(result.privateCapital<before.privateCapital);
  await assert.rejects(request({action:'place',kind:'factory',industryType:'not-real',x:11,y:11,contractor:'Sur Obras'}),/Industria desconocida/);
 });
});
