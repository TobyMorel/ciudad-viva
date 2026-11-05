import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
async function scenario(city,run){
 const originals={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now};let saved=JSON.stringify(city),now=100000;
 globalThis.fetch=async()=>({ok:true,json:async()=>seed()});
 globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value}};
 Date.now=()=>now;
 try{
  const adapter=await createOfflineAdapter();
  await run({view:async()=>adapter.request('/api/state'),action:async data=>adapter.request('/api/action',data),tick:async()=>{now+=1000;return adapter.request('/api/state')},clock:enabled=>adapter.setRealtimeClock(enabled)});
 }finally{globalThis.fetch=originals.fetch;globalThis.localStorage=originals.storage;Date.now=originals.now}
}

test('Offline: la remediación tarda 30 días, reduce una fuente local y vence con historial',async()=>{
 const city=seed();city.paused=false;city.speed=1;city.day=1;city.money=100000;city.roads=[[4,10],[5,10],[6,10]];city.roadAssets=[];city.projects=[];city.commutes=[];city.zones=[];city.buildings=[
  {kind:'home',name:'Barrio cercano',x:8,y:10,status:'operativo',capacity:12,occupants:12,quality:80,residents:[]},
  {kind:'home',name:'Barrio lejano',x:18,y:18,status:'operativo',capacity:12,occupants:12,quality:80,residents:[]},
  {kind:'factory',name:'Metalúrgica del puerto',x:7,y:10,status:'habilitado',business:{status:'abierto',industryType:'metalworks',lastProduction:24,lastWorkers:12}}
 ];city.population=24;
 await scenario(city,async({view,action,tick})=>{
  const before=await view(),beforeAir=before.environmentReport.neighborhoods.find(n=>n.name==='Barrio cercano').airIndex;
  const started=await action({action:'startEnvironmentalRemediation',x:7,y:10,medium:'air',contractor:'Sur Obras'});
  assert.equal(started.environmentReport.remediation.inProgress.length,1);
  for(let i=0;i<29;i++)await tick();
  const notReady=await view();assert.equal(notReady.environmentReport.remediation.active.length,0);
  const completed=await tick();assert.equal(completed.environmentReport.remediation.active.length,1);
  const afterAir=completed.environmentReport.neighborhoods.find(n=>n.name==='Barrio cercano').airIndex;
  assert.ok(afterAir<beforeAir,`La exposición cercana debe bajar (${beforeAir} → ${afterAir})`);
  assert.equal(completed.environmentReport.remediation.monthlyCost,45);
  assert.equal(completed.municipalFinance.expenseBreakdown.environmentalRemediation,45);
  for(let i=0;i<360;i++)await tick();
  const expired=await view();assert.equal(expired.environmentReport.remediation.active.length,0);
  assert.equal(expired.environmentReport.remediation.history.at(-1).status,'vencida');
 });
});

test('Offline: la consulta distrital conserva muestra por edad y bloquea una segunda consulta simultánea',async()=>{
 const city=seed();city.paused=false;city.speed=1;city.day=1;city.money=10000;city.buildings=[
  {kind:'home',name:'Familias del Oeste',x:8,y:9,status:'operativo',capacity:4,occupants:4,quality:80,residents:[
   {id:'menor-1',age:12,workerEligible:false,status:'inactivo'},
   {id:'adulta-1',age:34,workerEligible:true,status:'empleado',monthlyWage:120},
   {id:'adulta-2',age:42,workerEligible:true,status:'buscando',monthlyWage:80},
   {id:'mayor-1',age:72,workerEligible:false,status:'inactivo',retired:true}
  ]}
 ];city.buildings[0].occupants=30;city.buildings[0].capacity=30;city.buildings[0].residents=Array.from({length:30},(_,i)=>({id:`resident-${i+1}`,age:i<10?12:i<20?34:72,workerEligible:i>=10&&i<20,status:i===10?'empleado':i>=10&&i<20?'buscando':'inactivo',monthlyWage:i===10?120:80,retired:i>=20}));city.population=30;city.projects=[];
 await scenario(city,async({view,action,tick})=>{
  const opened=await action({action:'startCitizenConsultation',districtId:'oeste',topic:'employment'});
  const poll=opened.governmentReport.consultations.at(-1);assert.equal(poll.status,'abierta');assert.equal(poll.deadlineDay,opened.day+7);
  await assert.rejects(action({action:'startCitizenConsultation',districtId:'oeste',topic:'housing'}),/ya tiene una consulta abierta/);
  for(let i=0;i<7;i++)await tick();
  const closed=await view(),result=closed.governmentReport.consultations.at(-1).result;
  assert.equal(closed.governmentReport.consultations.at(-1).status,'cerrada');
  assert.equal(result.eligible,30);assert.ok(result.respondents>0);assert.equal(result.byAge.menores.eligible,10);assert.equal(result.byAge.adultos.eligible,10);assert.equal(result.byAge.mayores.eligible,10);
  assert.equal(result.yes+result.no,result.respondents);assert.ok(result.supportPct>=0&&result.supportPct<=100);
 });
});

test('Offline: el centro de respuesta enlaza crisis de bomberos, calles, residuos, presupuesto y contratos',async()=>{
 const city=seed();city.paused=true;city.day=40;city.population=200;city.roads=[[4,10],[5,10],[6,10]];city.buildings=[{kind:'home',name:'Barrio en emergencia',x:7,y:10,status:'operativo',capacity:20,occupants:20,quality:80,residents:[]}];
 city.fireService={incidents:[{id:'fire-test',x:7,y:10,name:'Barrio en emergencia',status:'ardiendo',startDay:39,burningDays:1}],dispatches:0,resolved:0,unanswered:0};
 city.roadIncidents={events:[{id:'road-test',x:5,y:10,day:39,cause:'congestión',status:'sin_respuesta',closed:true,remainingDays:2}],generated:1,responded:0,unanswered:0};
 city.waste={...city.waste,uncollectedTons:10};city.finance=city.finance||{};city.finance.programBudgets={...(city.finance.programBudgets||{}),arrears:{services:6000,mobility:0,networks:0}};
 city.projects=[];city.projects.push({id:'paused-test',kind:'civic',label:'Ampliación detenida',x:8,y:10,cost:5000,paid:1000,progress:.3,elapsed:4,duration:20,status:'suspendida',cause:'insumos demorados'});
 city.climate={...(city.climate||{}),droughtForecast:{status:'activa',targetDay:35,capacityLossPct:45}};
 await scenario(city,async({view})=>{
  const state=await view(),desk=state.crisisReport,ids=new Set(desk.cases.map(item=>item.id));
  assert.ok(desk.supportedTypes.length>=12);assert.ok(desk.openCount>=6);assert.ok(desk.criticalCount>=2);
  for(const id of ['fire','road-crash','waste-backlog','fiscal-arrears','contract-delay','drought'])assert.ok(ids.has(id),`Falta la crisis ${id}`);
  assert.ok(desk.cases.every(item=>item.evidence&&item.response&&item.section));
 });
});

test('UI: el panel de recuperación presenta el tablero de crisis y sus accesos',()=>{
 const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 assert.match(source,/CENTRO DE RESPUESTA/);assert.match(source,/data-crisis-open/);assert.match(source,/historial procede del registro/);
});
