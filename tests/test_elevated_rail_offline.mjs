import test from 'node:test';
import assert from 'node:assert/strict';
import {planElevatedRail,metroRefresh,advanceMetroDay,metroAction,metroAssignPassengers,settleMetroMonth} from '../metro.js';

const city=()=>({
 day:1,money:100000,jobs:8,projects:[],metroLines:[],
 roads:Array.from({length:11},(_,i)=>[4+i,10]),
 buildings:[
  {kind:'home',name:'Viviendas',x:5,y:9,status:'habilitado',householdCash:80},
  {kind:'shop',name:'Mercado',x:12,y:9,status:'habilitado'},
  {kind:'powerPlant',name:'Usina',x:8,y:9,status:'habilitado',generationKw:900,quality:82}
 ],finance:{programBudgets:{mobilityFundingFactor:1}},utilities:{}
});
const trip=()=>({reason:'compras',mode:'auto',from:[5,9],to:[12,9],distance:9,workers:7,busRiders:2,vehicles:5,dailyEmissionsKg:2.5});
test('obras ferroviarias, trazado y conservación de caja',()=>{
 const s=city(),cash=s.money,line=planElevatedRail(s,[5,9],[12,9],1);
 assert.equal(s.money,cash-line.purchaseCost);
 assert.equal(line.mode,'elevated');
 assert.equal(line.route.length,8);
 assert.equal(line.status,'building');
 metroRefresh(s);assert.equal(line.operational,false);
 assert.equal(line.dailyCapacity,0);
 for(let i=0;i<line.duration;i++){s.day++;advanceMetroDay(s)}
 assert.equal(line.status,'active');assert.equal(line.stage,'Habilitada');
 metroRefresh(s);assert.equal(line.operational,true);
 assert.equal(line.dailyCapacity,420);
 assert.throws(()=>planElevatedRail(s,[5,9],[12,9],1),/Ya existe|superponerse/);
});
test('energía, pausa, flota, aforo y boletos reales',()=>{
 const s=city(),line=planElevatedRail(s,[5,9],[12,9],1);
 line.status='active';metroRefresh(s);
 const t=trip(),result=metroAssignPassengers(s,[t]);
 assert.equal(result.railRiders,5);
 assert.equal(result.metroRiders,0);
 assert.equal(t.metroRiders,5,'viajeros no vuelven a contabilizarse en taxi');
 assert.equal(t.railRiders,5);
 assert.equal(t.vehicles,0);
 const cash=s.buildings[0].householdCash;
 const balance=settleMetroMonth(s);
 assert.equal(balance.income,4); // 5 x $0,85, redondeo por hogar al cierre
 assert.equal(s.buildings[0].householdCash,cash-4);
 assert.equal(settleMetroMonth(s).income,0,'sin cobro duplicado');
 metroAction(s,'pauseRailLine',{id:line.id});assert.equal(line.operational,false);
 assert.throws(()=>metroAction(s,'buyMetroTrain',{id:line.id}),/incorrecta/);
 metroAction(s,'resumeRailLine',{id:line.id});assert.equal(line.operational,true);
 metroAction(s,'buyRailTrain',{id:line.id});assert.equal(line.trainCount,2);
 s.buildings=s.buildings.filter(b=>b.kind!=='powerPlant');metroRefresh(s);assert.equal(line.operational,false);
});
test('rutas imposibles y fondos reservados bloquean la contratación',()=>{
 const s=city();s.roads=s.roads.filter(([x])=>x!==8);
 assert.throws(()=>planElevatedRail(s,[5,9],[12,9],1),/conectados/);
 const d=city();d.projects=[{cost:99000,paid:0,privatePaid:false}];
 assert.throws(()=>planElevatedRail(d,[5,9],[12,9],1),/Fondos/);
});
