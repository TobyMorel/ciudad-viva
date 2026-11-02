import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function withCity(run){
  const previous={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};
  let saved=null,now=0;
  globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(seed)});
  globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};
  Date.now=()=>now;
  const next=async(adapter,ms=1000)=>{now+=ms;return adapter.request('/api/state')};
  try{
    const adapter=await createOfflineAdapter();
    await run({adapter,next,get:()=>JSON.parse(saved),load:async city=>{
      saved=JSON.stringify(city);return adapter.request('/api/load');
    }});
  }finally{globalThis.fetch=previous.fetch;globalThis.localStorage=previous.storage;Date.now=previous.now}
}

test('Sin plantas no hay electricidad, agua ni gas gratis; el consumo crece por residente',async()=>{
  await withCity(async({adapter,get,load})=>{
    let city=await adapter.request('/api/state');
    assert.equal(city.utilities.report.power.installedKw,0);
    assert.equal(city.utilities.report.water.installedM3Day,0);
    assert.equal(city.utilities.report.gas.capacityM3Day,0);
    const next=get();next.roads=[[4,10],[5,10],[6,10]];
    for(const field of ['powerLines','waterPipes','sewerLines','gasLines','telecomLines'])
      next.utilities[field]=structuredClone(next.roads);
    next.buildings=[
      {x:6,y:9,kind:'home',name:'Barrio',status:'habilitado',quality:82,occupants:10,capacity:80,residents:[]},
      {x:4,y:9,kind:'powerPlant',status:'habilitado',quality:82,generationKw:900},
      {x:4,y:11,kind:'waterPlant',status:'habilitado',quality:82,treatmentM3Day:220},
    ];
    city=await load(next);
    assert.ok(city.utilities.report.power.installedKw>0);
    assert.ok(city.utilities.report.water.installedM3Day>0);
    assert.equal(city.utilities.report.gas.capacityM3Day,0);
    next.buildings.push({x:5,y:9,kind:'gasPlant',status:'habilitado',quality:82,gasCapacityM3Day:160});
    city=await load(next);
    assert.ok(city.utilities.report.gas.capacityM3Day>0);
    const old=[city.utilities.report.power.demandKw,city.utilities.report.water.demandM3Day,city.utilities.report.gas.demandM3Day];
    next.buildings[0].occupants=65;
    city=await load(next);
    const newer=[city.utilities.report.power.demandKw,city.utilities.report.water.demandM3Day,city.utilities.report.gas.demandM3Day];
    assert.ok(old.every((v,i)=>v<newer[i]),'La demanda debe crecer con la población');
  });
});

test('Incendio sin respuesta: cenizas, fallecidos y sobrevivientes realojados',async()=>{
  await withCity(async({adapter,get,load,next})=>{
    await adapter.request('/api/state');
    const city=get();
    city.roads=[[4,10],[5,10]];
    city.day=1;city.lastMonth=0;city.timeOfDayMinutes=700;city.paused=false;
    city.housingDemand={unmet:0,lastGenerated:0,lastFilled:0};
    city.population=2;city.jobs=0;
    city.buildings=[{x:5,y:9,kind:'home',name:'Casa incendio',status:'habilitado',quality:85,
      occupants:2,capacity:2,residents:[
        {id:'out-7',age:30,status:'inactivo',workerEligible:false},
        {id:'home-0',age:15,status:'inactivo',workerEligible:false},
      ]}];
    city.fireService={incidents:[{id:'fire-test',name:'Casa incendio',buildingKind:'home',x:5,y:9,
      status:'ardiendo',startDay:1,damage:0}],lastGeneratedMonth:99,dispatches:0,resolved:0,unanswered:0,ruins:[]};
    await load(city);
    let final;
    for(let day=2;day<=6;day++)final=await next(adapter);
    const fire=final.fireReport.recentIncidents[0];
    assert.equal(fire.status,'destruido');
    assert.equal(fire.deaths,1);
    assert.equal(fire.displaced,1);
    assert.equal(final.population,1);
    assert.equal(final.buildings.filter(b=>b.kind==='home').length,0);
    assert.equal(final.fireService.ruins.length,1);
    assert.equal(final.socialServices.shelterResidents.length,1);
    assert.equal(final.urbanEvolution.deceased.at(-1).cause,'incendio');
  });
});

test('Un cuartel recién habilitado despacha al incendio activo y lo controla al llegar',async()=>{
  await withCity(async({adapter,get,load,next})=>{
    await adapter.request('/api/state');
    const city=get();
    city.day=2;city.lastMonth=0;city.timeOfDayMinutes=720;city.roads=[[4,10],[5,10]];
    city.money=200000;city.population=24;city.employment=95;city.jobs=0;
    city.housingDemand={unmet:0,lastGenerated:0,lastFilled:0};
    city.buildings=[{x:5,y:9,kind:'home',name:'Objetivo',status:'habilitado',quality:85,
      occupants:24,capacity:24,residents:Array.from({length:24},(_,i)=>({
        id:'worker-'+i,age:30,workerEligible:true,status:'buscando',monthlyWage:0,
        skills:{bomberos:96,comercio:50,administracion:50,logistica:50,salud:50,educacion:50},carAccess:true
      }))}];
    city.fireService={incidents:[{id:'fire-active',name:'Objetivo',x:5,y:9,buildingKind:'home',
      status:'ardiendo',startDay:1,burningDays:1,damage:0}],lastGeneratedMonth:99,dispatches:0,resolved:0,unanswered:0};
    await load(city);
    const placed=await adapter.request('/api/action',{action:'place',kind:'fireStation',serviceModel:'firePost',x:4,y:9});
    const fire=placed.fireReport.activeIncidents[0];
    assert.equal(placed.fireReport.dispatches,1);
    assert.ok(fire.responseRoute.length>=2);
    assert.equal(fire.arrivalDay,3);
    const arrived=await next(adapter);
    assert.equal(arrived.fireReport.recentIncidents[0].status,'controlado');
    assert.equal(arrived.fireReport.resolved,1);
  });
});
