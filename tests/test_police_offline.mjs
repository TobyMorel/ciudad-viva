import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';
const seed=()=>{
 const s=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
 s.buildings.push({kind:'civic',serviceModel:'policePost',name:'Comisaría construida de prueba',x:10,y:11,status:'habilitado',jobSlots:16,utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}});
 s.workplaces.push({kind:'civic',x:10,y:11,staffedJobs:16,workersAssigned:16,jobSlots:16});
 return s;
};

async function scenario(s,work){
 const old={fetch:globalThis.fetch,localStorage:globalThis.localStorage,now:Date.now};
 let saved=JSON.stringify(s),now=0;
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v}};
 Date.now=()=>now;
 try{
  const adapter=await createOfflineAdapter();
  await work({request:body=>adapter.request('/api/action',body),view:()=>adapter.request('/api/state'),
    next:()=>{now+=1000;return adapter.request('/api/state')},
    reload:async transform=>{saved=JSON.stringify(transform(JSON.parse(saved)));return adapter.request('/api/load')}});
 }finally{globalThis.fetch=old.fetch;globalThis.localStorage=old.localStorage;Date.now=old.now}
}

test('Offline: equipar base, reforzar móviles y cambiar patrullaje tiene caja y personal finitos',async()=>{
 const s=seed();s.money=50000;s.paused=true;
 await scenario(s,async({request,view})=>{
  let city=await view(),clinic=city.buildings.find(b=>b.serviceModel==='policePost'),primaryBefore=city.healthReport.primary.capacityPerDay;
  const origin=city.money;
  city=await request({action:'openPoliceUnit',x:clinic.x,y:clinic.y});
  assert.equal(city.money,origin-4000);
  assert.equal(city.policeReport.units[0].vehicles,1);
  assert.ok(city.policeReport.units[0].activeVehicles>0,'Un móvil necesita trabajadores y redes.');
  assert.equal(city.healthReport.primary.capacityPerDay,primaryBefore,'La comisaría no se contabiliza como clínica.');
  await assert.rejects(request({action:'openPoliceUnit',x:clinic.x,y:clinic.y}),/ya cuenta/);
  city=await request({action:'addPoliceVehicle',x:clinic.x,y:clinic.y});
  assert.equal(city.policeReport.units[0].vehicles,2);
  city=await request({action:'setPolicePriority',x:clinic.x,y:clinic.y,priority:'comercial'});
  assert.equal(city.policeReport.units[0].priority,'comercial');
  assert.equal(city.money,origin-6500);
  assert.ok(city.policeReport.monthlyOperatingCost>0);
 });
});

test('Offline: cierres mensuales disparan incidentes una sola vez y patrullas limitadas',async()=>{
 const s=seed();s.money=70000;s.day=30;s.lastMonth=0;s.paused=false;s.speed=1;
 await scenario(s,async({request,view,next})=>{
  const civic=s.buildings.find(b=>b.serviceModel==='policePost');
  await request({action:'openPoliceUnit',x:civic.x,y:civic.y});
  let report=(await next()).policeReport;
  assert.ok(report.lastIncidents>0);
  assert.ok(report.lastResponded>=0&&report.lastResponded<=2);
  const counted=report.totalResponded+report.totalUnanswered;
  assert.equal(counted,report.lastIncidents);
  report=(await view()).policeReport;
  assert.equal(report.totalResponded+report.totalUnanswered,counted,'No duplica incidentes en el mismo mes');
 });
});

test('Offline: el corte vial impide respuesta y obras comprometidas impiden equipar gratis',async()=>{
 const s=seed();s.money=5300;s.paused=true;
 s.projects.push({cost:1900,paid:0,privatePaid:false});
 await scenario(s,async({request,view,reload})=>{
  const clinic=s.buildings.find(b=>b.serviceModel==='policePost');
  await assert.rejects(request({action:'openPoliceUnit',x:clinic.x,y:clinic.y}),/Caja libre/);
  let city=await view();assert.equal(city.money,5300);
  city=await reload(s=>{s.roads=[];s.projects=[];return s});
  await assert.rejects(request({action:'openPoliceUnit',x:clinic.x,y:clinic.y}),/conexión vial/);
  assert.equal((await view()).policeReport.coveredSites,0);
 });
});

test('Offline: la tesorer?a liquida ingresos y gastos durante el avance',async()=>{
 const s=seed();s.day=1;s.lastMonth=0;s.paused=false;s.speed=1;s.monthlyExpenses=1200;
 await scenario(s,async({next})=>{
  let city=await next();
  city=await next();
  assert.equal(city.day,3);
  assert.ok(city.dailyCashFlow.lastGameDay>0);
  assert.ok(city.dailyCashFlow.lastIncome>0);
  assert.ok(city.dailyCashFlow.lastPaid.services>0);
 });
});

test('Offline: un móvil queda reservado en la ida y vuelta y no supera dos despachos mensuales',async()=>{
 const s=seed();s.day=1;s.lastMonth=0;s.paused=true;s.speed=1;
 await scenario(s,async({request,view,next,reload})=>{
  let city=await view();
  assert.ok(city.policeReport.coverageGapCount>0);
  assert.equal(city.policeReport.coverageGaps[0].reasonCode,'sin_base');
  const center=city.buildings.find(b=>b.serviceModel==='policePost');
  await request({action:'openPoliceUnit',x:center.x,y:center.y});
  city=await view();
  const sites=[{x:8,y:14,name:'Barrio de prueba oeste'},{x:10,y:14,name:'Barrio de prueba centro'},{x:8,y:16,name:'Barrio de prueba sur'}];
  const ids=sites.map((_,i)=>'pending-'+i);
  await reload(c=>{
   c.day=1;c.lastMonth=0;c.paused=false;
   const connector=Array.from({length:7},(_,i)=>[9,10+i]),roads=new Map([...(c.roads||[]),...connector].map(p=>[p.join(','),p]));
   c.roads=[...roads.values()];
   c.buildings.push(...sites.map(b=>({...b,kind:'home',status:'operativo'})));
   c.police={...(c.police||{}),lastProcessedMonth:0,recentIncidents:sites.map((b,i)=>({id:ids[i],x:b.x,y:b.y,day:1,month:0,status:'sin respuesta',location:b.name}))};
   return c;
  });
  let report=(await next()).policeReport;
  let missions=report.recentIncidents;
  let active=missions.filter(m=>m.status==='en respuesta');
  assert.equal(active.length,1,'El mismo móvil no se duplica en dos rutas.');
  assert.equal(active[0].vehicleIndex,0);
  assert.equal(report.units[0].busyVehicles,1);
  assert.ok(active[0].route.every((p,i,a)=>i===0||Math.abs(p[0]-a[i-1][0])+Math.abs(p[1]-a[i-1][1])===1),'La patrulla sigue una ruta vial contigua.');
  report=(await next()).policeReport;missions=report.recentIncidents;
  assert.equal(missions.find(m=>m.id===ids[0]).status,'atendido');
  assert.equal(missions.find(m=>m.id===ids[1]).status,'sin respuesta','La patrulla queda ocupada durante el regreso.');
  report=(await next()).policeReport;missions=report.recentIncidents;
  assert.equal(missions.find(m=>m.id===ids[1]).status,'en respuesta');
  assert.equal(missions.find(m=>m.id===ids[1]).vehicleIndex,0);
  assert.equal(missions.find(m=>m.id===ids[2]).status,'sin respuesta');
  assert.match(missions.find(m=>m.id===ids[2]).responseCause,/agotaron/);
  report=(await next()).policeReport;missions=report.recentIncidents;
  assert.equal(missions.find(m=>m.id===ids[2]).status,'sin respuesta','Dos despachos consumen el cupo mensual del móvil.');
 });
});
