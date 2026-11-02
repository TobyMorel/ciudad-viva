import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const base=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function withCity(city,work){
 const old={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};let now=0,stored=JSON.stringify(city);
 globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(city)});
 globalThis.localStorage={getItem:()=>stored,setItem:(_,v)=>{stored=v}};
 Date.now=()=>now;
 try{const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);return await work(adapter,()=>{now+=1000})}
 finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.storage;Date.now=old.now}
}

test('Offline: ciudad nueva requiere plantas para luz, agua y gas',async()=>{
 const city=base();city.newSettlement=true;city.day=1;city.roads=[[4,10]];city.buildings=[{x:5,y:10,kind:'home',name:'Casa',status:'habilitado',occupants:4,capacity:4,residents:[],quality:82}];city.projects=[];city.utilities={...city.utilities,basePowerCapacityKw:0,baseWaterCapacityM3Day:0,baseGasCapacityM3Day:0,powerLines:[[4,10]],waterPipes:[[4,10]],sewerLines:[[4,10]],gasLines:[[4,10]]};
 await withCity(city,async adapter=>{
  let s=await adapter.request('/api/state');assert.equal(s.utilities.report.power.installedKw,0);assert.equal(s.utilities.report.water.sourceCapacityM3Day,0);assert.equal(s.utilities.report.gas.capacityM3Day,0);
  city.buildings.push({x:4,y:9,kind:'powerPlant',status:'habilitado',quality:82,generationKw:900},{x:4,y:11,kind:'waterPlant',status:'habilitado',quality:82,treatmentM3Day:220},{x:3,y:10,kind:'gasPlant',status:'habilitado',quality:82,gasCapacityM3Day:160});
 });
 const fed=base();fed.newSettlement=true;fed.roads=[[4,10]];fed.buildings=[{x:5,y:10,kind:'home',name:'Casa',status:'habilitado',occupants:4,capacity:4,residents:[],quality:82},{x:4,y:9,kind:'powerPlant',status:'habilitado',quality:82,generationKw:900},{x:4,y:11,kind:'waterPlant',status:'habilitado',quality:82,treatmentM3Day:220},{x:3,y:10,kind:'gasPlant',status:'habilitado',quality:82,gasCapacityM3Day:160}];fed.projects=[];fed.utilities={...fed.utilities,basePowerCapacityKw:0,baseWaterCapacityM3Day:0,baseGasCapacityM3Day:0,powerLines:[[4,10]],waterPipes:[[4,10]],sewerLines:[[4,10]],gasLines:[[4,10]]};
 await withCity(fed,async adapter=>{const s=await adapter.request('/api/state');assert.equal(s.utilities.report.power.installedKw,900);assert.equal(s.utilities.report.water.sourceCapacityM3Day,220);assert.equal(s.utilities.report.gas.capacityM3Day,160)})
});

test('Offline: incendio sin respuesta deja cenizas y víctimas',async()=>{
 const city=base();city.day=14;city.lastMonth=0;city.timeOfDayMinutes=720;city.roads=[[4,10],[5,10]];city.buildings=[{x:6,y:10,kind:'home',name:'Casa de prueba',status:'habilitado',quality:75,capacity:2,occupants:2,residents:[{id:'inside',age:55,status:'inactivo',workerEligible:false},{id:'outside',age:34,status:'empleado',workerEligible:true}]}];city.population=2;city.projects=[];city.zones=[];city.fireService={incidents:[{id:'fire-test',x:6,y:10,name:'Casa de prueba',status:'ardiendo',startDay:10,burningDays:4,outsideResidentIds:['outside']}],lastGeneratedMonth:0,dispatches:0,resolved:0,unanswered:0};
 await withCity(city,async(adapter,step)=>{await adapter.request('/api/state');step();const s=await adapter.request('/api/state'),fire=s.fireService.incidents[0];assert.equal(fire.status,'destruido');assert.equal(fire.fatalities,1);assert.equal(fire.displaced,1);assert.equal(s.abandoned.find(a=>a.x===6&&a.y===10)?.status,'cenizas');assert.equal(s.urbanEvolution.deceased.find(d=>d.residentId==='inside')?.cause,'incendio');assert.ok(s.socialServices.shelterResidents.some(p=>p.id==='outside'))})
});

test('Offline: autobomba se despacha antes de controlar el fuego',async()=>{
 const city=base();city.day=14;city.lastMonth=0;city.timeOfDayMinutes=720;city.roads=[[4,10],[5,10]];city.buildings=[{x:6,y:10,kind:'home',name:'Casa',status:'habilitado',quality:75,capacity:0,occupants:0,residents:[]},{x:4,y:9,kind:'fireStation',serviceModel:'firePost',name:'Cuartel',status:'habilitado',fireEngineCapacity:1,dispatchReadyDay:14}];city.projects=[];city.zones=[];city.fireService={incidents:[{id:'fire-route',x:6,y:10,name:'Casa',status:'ardiendo',startDay:10,burningDays:0}],lastGeneratedMonth:0,dispatches:0,resolved:0,unanswered:0};
 await withCity(city,async(adapter,step)=>{await adapter.request('/api/state');step();let s=await adapter.request('/api/state');assert.equal(s.fireService.incidents[0].status,'despachado');assert.ok(s.fireService.incidents[0].route.length>=2);assert.equal(s.fireService.resolved,0);step();s=await adapter.request('/api/state');assert.equal(s.fireService.incidents[0].status,'controlado');assert.equal(s.fireService.resolved,1)})
});
