import test from 'node:test';
import assert from 'node:assert/strict';
import {planMetro,advanceMetroDay,metroRefresh,metroAssignPassengers,settleMetroMonth,metroAction,metroStationCatalog} from '../metro.js';
import {assignTaxiPassengers} from '../taxi_passengers.js';
function fixture(){return{day:1,money:90000,jobs:12,projects:[],roads:Array.from({length:9},(_,i)=>[i+4,10]),
buildings:[{kind:'home',name:'Barrio Norte',x:5,y:9,status:'operativo',householdCash:10},
{kind:'shop',name:'Centro comercial',x:11,y:9,status:'habilitado'},
{kind:'powerPlant',name:'Central',x:9,y:9,status:'habilitado',quality:82,generationKw:900}],
utilities:{},finance:{programBudgets:{mobilityFundingFactor:1}},metroLines:[],taxiRoutes:[]}}
const trip=()=>({reason:'compras',from:[5,9],to:[11,9],distance:7,mode:'auto',workers:3,vehicles:3,dailyEmissionsKg:7.56});
test('obra, etapas, cuadrillas y trenes no circulan antes de inspección',()=>{
 const s=fixture();assert.equal(metroStationCatalog(s).length,2);const line=planMetro(s,[5,9],[11,9]);
 assert.equal(s.money,90000-line.purchaseCost);metroRefresh(s);assert.equal(line.operational,false);
 s.jobs=0;advanceMetroDay(s);assert.equal(line.elapsed,0);
 s.jobs=12;for(let i=0;i<line.duration;i++){s.day++;advanceMetroDay(s)}
 assert.equal(line.status,'active');metroRefresh(s);assert.equal(line.operational,true);assert.equal(line.dailyCapacity,240);
 assert.throws(()=>planMetro(s,[5,9],[11,9]),/existe/);
});
test('energía, presupuesto y flota bloquean viajes',()=>{
 const s=fixture(),line=planMetro(s,[5,9],[11,9]);line.status='active';
 s.buildings=s.buildings.filter(b=>b.kind!=='powerPlant');
 metroRefresh(s);assert.equal(line.operational,false);assert.equal(metroAssignPassengers(s,[trip()]).metroRiders,0);
 s.buildings.push({kind:'powerPlant',status:'habilitado',generationKw:900,quality:82});
 line.trainCount=0;metroRefresh(s);assert.equal(line.operational,false);
 metroAction(s,'buyMetroTrain',{id:line.id});assert.equal(line.operational,true);
 s.finance.programBudgets.mobilityFundingFactor=0;metroRefresh(s);assert.equal(line.operational,false);
});
test('viaje real, no duplicado con taxi, cobro y liquidación sin repetición',()=>{
 const s=fixture(),line=planMetro(s,[5,9],[11,9]);line.status='active';
 const trips=[trip()],report=metroAssignPassengers(s,trips);
 assert.equal(report.metroRiders,3);assert.equal(trips[0].vehicles,0);
 assignTaxiPassengers(s,trips);assert.equal(trips[0].vehicles,0);
 assert.ok((trips[0].taxiRiders||0)+trips[0].metroRiders<=3);
 const close=settleMetroMonth(s);assert.equal(close.income,2);assert.ok(close.cost>0);assert.equal(s.buildings[0].householdCash,8);
 assert.equal(settleMetroMonth(s).income,0);assert.equal(s.buildings[0].householdCash,8);
});
test('no construir estaciones sin acceso o inversión',()=>{
 const s=fixture();s.money=1;assert.throws(()=>planMetro(s,[5,9],[11,9]),/inversión/);
 s.money=90000;s.roads=[];assert.throws(()=>planMetro(s,[5,9],[11,9]),/acceso vial/);
});
