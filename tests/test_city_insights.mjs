import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DISTRICTS,cityAdvice,cityMissions,collectNeighborhoods,neighborhoodTimeline,placementPreview,recordCityProgress} from '../cityInsights.js';

const city=()=>({
 day:1,money:175000,population:0,roads:[[4,10],[5,10],[6,10],[7,10]],zones:[],projects:[],buildings:[],
 monthlyIncome:0,monthlyExpenses:0,landClaims:{chunkSize:8,unlockedChunks:['0,1','1,1','2,1']}
});
test('El asesor da causas y acciones reales, sin alterar la ciudad',()=>{
 const state=city(),original=JSON.stringify(state),list=cityAdvice(state);
 assert.ok(list.some(x=>x.id==='power'&&x.action.tool==='powerPlant'));
 assert.ok(list.some(x=>x.id==='residential'&&x.action.tool==='zoneHome'));
 assert.equal(JSON.stringify(state),original,'El asesor es de solo lectura');
 const built={...state,buildings:[{kind:'powerPlant'},{kind:'waterPlant'},{kind:'wastewaterPlant'}]};
 assert.ok(!cityAdvice(built).some(x=>x.id==='power'));
 const deficit={...built,monthlyIncome:100,monthlyExpenses:500};
 assert.equal(cityAdvice(deficit).find(x=>x.id==='deficit').action.panel,'supply');
 const disconnected={...built,buildings:[...built.buildings,{kind:'home',x:9,y:11,roadAccessConnected:false}]};
 assert.deepEqual(cityAdvice(disconnected).find(x=>x.id==='disconnected').action,{type:'focus',x:9,y:11});
});
test('Las misiones se basan en medidas y los hitos se guardan una sola vez',()=>{
 const state=city(),initial=cityMissions(state);
 assert.equal(initial.find(m=>m.id==='streets').done,true);
 assert.equal(initial.find(m=>m.id==='firstNeighbors').done,false);
 recordCityProgress(state);recordCityProgress(state);
 assert.deepEqual(state.cityMilestones.completed,['streets']);
 assert.equal(state.cityMilestones.events.length,1);
 state.buildings.push({kind:'powerPlant',x:6,y:11});state.population=10;
 recordCityProgress(state);
 assert.ok(state.cityMilestones.completed.includes('electricity'));
 assert.ok(state.cityMilestones.completed.includes('firstNeighbors'));
 state.population=0;
 assert.equal(cityMissions(state).find(m=>m.id==='firstNeighbors').done,true,'El logro histórico se conserva');
 assert.equal(state.cityMilestones.events.filter(x=>x.id==='firstNeighbors').length,1);
});
test('Los barrios tienen indicadores y un diario mensual persistente, sin inventar residentes',()=>{
 const state=city();
 state.buildings=[
  {kind:'home',x:6,y:11,occupants:12,yearBuilt:2026,utilityAccess:{powerServedPct:90,waterServedPct:80,wastewaterTreatedPct:70}},
  {kind:'civic',x:7,y:12,serviceModel:'urbanPark',yearBuilt:2026},
  {kind:'shop',x:13,y:10,yearBuilt:2026},
  {kind:'factory',x:20,y:12,yearBuilt:2026}
 ];
 state.population=12;
 const before=collectNeighborhoods(state);
 assert.equal(DISTRICTS.length,3);
 assert.equal(before.find(x=>x.id==='oeste').population,12);
 assert.equal(before.find(x=>x.id==='centro').shops,1);
 assert.equal(before.find(x=>x.id==='puerto').factories,1);
 assert.equal(before.find(x=>x.id==='oeste').supplyPct,80);
 recordCityProgress(state);
 assert.equal(state.neighborhoodHistory.snapshots.length,1);
 state.day=31;
 state.buildings[0].occupants=16;state.population=16;
 recordCityProgress(state);recordCityProgress(state);
 assert.equal(state.neighborhoodHistory.snapshots.length,2);
 assert.match(neighborhoodTimeline(state,'oeste')[0].text,/\+4 habitantes/);
 assert.deepEqual(JSON.parse(JSON.stringify(state.neighborhoodHistory)).snapshots.length,2);
});
test('La vista previa señala costos, conectividad y alcance potencial sin afirmar cobertura real',()=>{
 const state=city();state.buildings.push({kind:'home',x:7,y:11,occupants:8,utilityAccess:{powerServedPct:20}});
 const models={urbanPark:{label:'Plaza barrial',cost:2400,radius:8,monthlyCost:90}};
 const plant=placementPreview(state,{tool:'powerPlant'},{x:6,y:11},models);
 assert.equal(plant.price,18800);
 assert.equal(plant.reachedHomes,1);
 assert.equal(plant.lacking,1);
 assert.match(plant.note,/no es una garantía/);
 const park=placementPreview(state,{tool:'civic',model:'urbanPark'},{x:6,y:12},models);
 assert.equal(park.price,2400);
 assert.equal(park.monthlyCost,90);
 assert.ok(park.radius===8);
 assert.equal(placementPreview(state,{tool:'powerPlant'},{x:24,y:10},models).valid,false);
 assert.equal(placementPreview(state,{tool:'powerPlant'},{x:15,y:12},models).valid,false);
 assert.equal(placementPreview(state,{tool:'inspect'},{x:6,y:11},models),null);
});
test('La nueva interfaz está integrada y tiene salida responsive',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 const engine=readFileSync(new URL('../offline.js',import.meta.url),'utf8');
 assert.match(html,/id="cityCompanionButton"/);
 assert.match(html,/id="plannerToggle"/);
 assert.match(html,/city-companion\.css/);
 assert.match(game,/setupCityCompanion/);
 assert.match(game,/companion\.confirmPlanClick/);
 assert.match(engine,/recordCityProgress\(state\)/);
 assert.match(readFileSync(new URL('../city-companion.css',import.meta.url),'utf8'),/@media\(max-width:650px\)/);
});
