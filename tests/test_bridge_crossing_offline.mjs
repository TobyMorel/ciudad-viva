import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));

test('Offline: puente contratado abre ambos tramos tras inspección, nunca al solicitarlo',async()=>{
  const city=seed();
  Object.assign(city,{newSettlement:true,money:250000,paused:true,speed:1,day:1,
    roads:Array.from({length:20},(_,i)=>[i+4,10]),roadAssets:[],buildings:[],projects:[],abandoned:[],zones:[]});
  city.landClaims={chunkSize:8,unlockedChunks:['0,0','0,1','1,0','1,1','2,1','3,1'],expansionCount:2};
  const old={fetch:globalThis.fetch,localStorage:globalThis.localStorage,now:Date.now};
  let saved=JSON.stringify(city),clock=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
  globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};
  Date.now=()=>clock;
  try{
    const adapter=await createOfflineAdapter();
    const action=payload=>adapter.request('/api/action',payload);
    const tender={action:'place',kind:'bridge',x:24,y:10,contractor:'Sur Obras'};
    await assert.rejects(action({...tender,x:25}),/celda oeste/);
    const started=await action(tender),p=started.projects.find(p=>p.kind==='bridge');
    assert.ok(p,'debe existir contrato público con plazo y cuadrilla');
    assert.equal(p.workersAssigned,10);
    assert.ok(p.duration>1);
    assert.equal(started.money,city.money-p.paid);
    assert.ok(!started.roads.some(([x])=>x===24||x===25),'aún no circulan vehículos sobre el agua');
    await assert.rejects(action(tender),/ocupado/);
    await assert.rejects(action({action:'placeRoad',x:24,y:10}),/sobre agua/);
    adapter.setRealtimeClock(false);
    let state=started;
    for(let i=0;i<p.duration+35&&state.projects.some(q=>q.id===p.id);i++){
      clock+=1000;
      state=await adapter.request('/api/state');
    }
    assert.ok(!state.projects.some(q=>q.id===p.id),'la obra debe completar su inspección');
    assert.ok([[24,10],[25,10]].every(([x,y])=>state.roads.some(([rx,ry])=>rx===x&&ry===y)));
    const bridgeAssets=state.roadAssets.filter(a=>a.bridge&&a.y===10);
    assert.deepEqual(bridgeAssets.map(a=>a.x).sort((a,b)=>a-b),[24,25]);
    assert.ok(bridgeAssets.every(a=>a.monthlyCost===80));
    const extended=await action({action:'placeRoad',x:26,y:10});
    assert.ok(extended.roads.some(([x,y])=>x===26&&y===10),'habilita la conexión con la ribera este');
  }finally{
    globalThis.fetch=old.fetch;
    globalThis.localStorage=old.localStorage;
    Date.now=old.now;
  }
});
