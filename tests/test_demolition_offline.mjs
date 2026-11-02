import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));

test('Offline: demoler edificios, caminos y puentes limpia el estado sin reintegro',async()=>{
  const s=seed();
  Object.assign(s,{newSettlement:true,paused:true,money:100000,roads:[[4,10],[5,10],[6,10],[24,10],[25,10]],roadAssets:[{x:5,y:10,monthlyCost:15},{x:24,y:10,bridge:true,monthlyCost:80},{x:25,y:10,bridge:true,monthlyCost:80}],buildings:[{x:8,y:8,kind:'home',name:'Prueba',occupants:2}],projects:[],zones:[{x:8,y:8,kind:'home'}],abandoned:[],monthlyExpenses:175,population:2});
  s.government={...(s.government||{}),status:'en_mandato'};
  s.utilities={...(s.utilities||{}),powerLines:[[4,10],[5,10]]};
  s.waste={...(s.waste||{}),containers:[{x:5,y:10}]};
  s.trafficSignalOverrides={'5,10':true};
  s.taxiRoutes=[{status:'active',operational:true,route:[[4,10],[5,10]]}];
  const previous={fetch:globalThis.fetch,localStorage:globalThis.localStorage};
  let saved=JSON.stringify(s);
  globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
  globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};
  try{
    const adapter=await createOfflineAdapter();
    const action=d=>adapter.request('/api/action',d);
    await assert.rejects(action({action:'demolishAt',x:4,y:10}),/acceso regional/);
    let city=await action({action:'demolishAt',x:5,y:10});
    assert.ok(!city.roads.some(([x,y])=>x===5&&y===10));
    assert.ok(!city.roadAssets.some(a=>a.x===5&&a.y===10));
    assert.ok(!city.utilities.powerLines.some(([x,y])=>x===5&&y===10));
    assert.equal(city.waste.containers.length,0);
    assert.equal(city.taxiRoutes[0].status,'paused');
    city=await action({action:'demolishAt',x:24,y:10});
    assert.ok(!city.roads.some(([x,y])=>(x===24||x===25)&&y===10));
    city=await action({action:'demolishAt',x:8,y:8});
    assert.equal(city.buildings.length,0);
    city=await action({action:'demolishAt',x:8,y:8});
    assert.equal(city.zones.length,0);
    assert.equal(city.money,100000);
    assert.deepEqual(JSON.parse(saved).roads,city.roads,'la demolición se guarda en localStorage');
    await assert.rejects(action({action:'demolishAt',x:7,y:7}),/No hay ninguna construcción/);
  }finally{
    globalThis.fetch=previous.fetch;
    globalThis.localStorage=previous.localStorage;
  }
});
