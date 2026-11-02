import test from 'node:test';
import assert from 'node:assert/strict';
import {placeRailStation,advanceRailStations} from '../rail_sites.js';
import {metroStationCatalog,planMetro,planElevatedRail,advanceMetroDay} from '../metro.js';
const fixture=()=>({
 day:1,money:160000,jobs:8,projects:[],
 roads:Array.from({length:15},(_,i)=>[i+3,10]),
 buildings:[{x:5,y:9,kind:'home',name:'Vivienda'},{x:11,y:9,kind:'shop',name:'Comercio'}],
 metroLines:[],railStations:[],finance:{programBudgets:{mobilityFundingFactor:1}}
});
test('una estación ocupa físicamente un lote y consume dinero',()=>{
 const s=fixture(),site=placeRailStation(s,'metro',6,9);
 assert.equal(s.money,153200);
 assert.equal(site.status,'building');
 assert.equal(site.duration,42);
 assert.equal(metroStationCatalog(s).length,0);
 assert.throws(()=>placeRailStation(s,'elevated',6,9),/ocupada/);
 assert.throws(()=>placeRailStation(s,'metro',5,9),/ocupada/);
 assert.throws(()=>placeRailStation(s,'metro',7,10),/ocupada/);
 assert.throws(()=>placeRailStation(s,'metro',40,40),/calle adyacente/);
});
test('las estaciones en obra no habilitan rutas hasta su inspección',()=>{
 const s=fixture();
 placeRailStation(s,'metro',6,9);placeRailStation(s,'metro',12,9);
 assert.throws(()=>planMetro(s,[6,9],[12,9]),/estaciones/);
 s.jobs=0;advanceMetroDay(s);assert.equal(s.railStations[0].elapsed,0);
 s.jobs=8;for(let i=0;i<42;i++){s.day++;advanceMetroDay(s)}
 assert.equal(s.railStations[0].status,'active');
 assert.equal(metroStationCatalog(s,'metro').length,2);
 const line=planMetro(s,[6,9],[12,9]);
 assert.equal(line.status,'building');assert.equal(line.stations.length,2);
 assert.throws(()=>planElevatedRail(s,[6,9],[12,9]),/estaciones elevadas/);
});
test('dos estaciones elevadas construidas permiten viaducto',()=>{
 const s=fixture();
 const a=placeRailStation(s,'elevated',6,11),b=placeRailStation(s,'elevated',13,11);
 s.jobs=8;for(let i=0;i<50;i++){s.day++;advanceRailStations(s)}
 assert.equal(a.status,'active');assert.equal(b.status,'active');
 const line=planElevatedRail(s,[6,11],[13,11]);
 assert.equal(line.mode,'elevated');assert.equal(line.route.length,8);
 assert.equal(metroStationCatalog(s,'elevated').length,2);
});
test('parcelas bloqueadas y caja reservada impiden empezar obras',()=>{
 const s=fixture();s.landClaims={chunkSize:8,unlockedChunks:['0,0']};
 assert.throws(()=>placeRailStation(s,'metro',12,9),/Desbloqueá/);
 s.landClaims.unlockedChunks.push('1,1');
 s.projects=[{cost:159000,paid:0,privatePaid:false}];
 assert.throws(()=>placeRailStation(s,'metro',12,9),/Fondos/);
 assert.equal(s.railStations.length,0);
});
