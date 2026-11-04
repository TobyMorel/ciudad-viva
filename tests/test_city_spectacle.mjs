import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {citySpectaclePlan,citySceneSignatures,commerceIdentity,visualSeason,seasonalPalette} from '../city_spectacle_state.js';
import {cinematicStops,cinematicComparison} from '../city_cinema.js';

const state=()=>({day:1,roads:[[4,10],[5,10],[6,10]],buildings:[],commutes:[],tourismEvents:[],cityMilestones:{events:[]},utilities:{report:{drainage:{rainfallMm:0}}}});
test('Las estaciones corresponden al hemisferio sur y no a imágenes arbitrarias',()=>{
 assert.equal(visualSeason(1),'verano');assert.equal(visualSeason(91),'otoño');
 assert.equal(visualSeason(181),'invierno');assert.equal(visualSeason(271),'primavera');
 assert.equal(visualSeason(360),'verano');assert.equal(visualSeason(361),'verano');
 assert.equal(Object.keys(seasonalPalette).length,4);
});
test('Las escenas de eventos se activan solo con visitantes comprobados y realización reciente',()=>{
 const s=state();
 s.tourismEvents=[{id:'f1',type:'feria',status:'programado',visitors:320,completedDay:0},{id:'f2',type:'festival',status:'cancelado',visitors:90,completedDay:1}];
 assert.equal(citySpectaclePlan(s).events.length,0);
 s.tourismEvents.push({id:'f3',type:'feria',status:'realizado',visitors:60,completedDay:1});
 assert.equal(citySpectaclePlan(s).events.length,1);
 assert.equal(citySpectaclePlan(s).events[0].visitors,60);
 s.day=4;assert.equal(citySpectaclePlan(s).events.length,0,'no se simula una feria antigua como si siguiera activa');
});
test('Los vecinos, puestos de transporte y cuadrillas dependen de datos reales',()=>{
 const s=state();
 s.buildings=[{kind:'home',x:6,y:11,occupants:5},{kind:'home',x:7,y:11,occupants:0},{kind:'shop',x:8,y:11,business:{status:'cerrado'}},
  {kind:'shop',x:9,y:11,business:{status:'abierto',lastSales:3}},{kind:'civic',serviceModel:'urbanPark',status:'operativo',x:9,y:12}];
 s.busRoutes=[{operational:true,ridersThisPass:5,stops:[[5,10],[6,10]]},{operational:false,ridersThisPass:12,stops:[[4,10]]}];
 s.fireReport={activeIncidents:[{id:'x',x:11,y:12,status:'ardiendo',arrivalDay:1}]};
 s.waste={report:{activeTrucks:2},containers:[{x:6,y:10,lastPickedTons:.15}]};
 s.utilities.report.drainage.rainfallMm=18;
 const plan=citySpectaclePlan(s);
 assert.equal(plan.homes.length,1);assert.equal(plan.shops.length,1);assert.equal(plan.transitStops.length,2);
 assert.equal(plan.activeServices.length,2);assert.equal(plan.activeServices[0].kind,'bomberos');
 assert.ok(plan.activeServices.some(x=>x.kind==='residuos'));
 assert.equal(plan.rainMm,18);assert.equal(plan.storm,true);
 const signature=citySceneSignatures(plan);
 assert.ok(signature.building.includes('f3')===false);
 assert.match(signature.climate,/18/);
});
test('Los locales reciben fachadas 3D reproducibles sin falsear su rubro económico',()=>{
 const a={kind:'shop',name:'Panadería del Sol',x:6,y:11,business:{status:'abierto',lastSales:14}};
 const first=commerceIdentity(a);
 assert.equal(first.category,'panaderia');assert.ok(first.namedFromSimulation);
 assert.equal(first.sign,a.name);assert.equal(first.trading,true);
 assert.deepEqual(commerceIdentity({...a}),first);
 const generic=commerceIdentity({...a,name:'Comercio #43'});
 assert.ok(['panaderia','cafe','mercado','flores','taller'].includes(generic.category));
 assert.equal(generic.namedFromSimulation,false);
 assert.equal(commerceIdentity({...a,business:{status:'cerrado'}}).open,false);
 assert.equal(commerceIdentity({kind:'home',x:1,y:2}),null);
});
test('La cámara visita lugares existentes y compara exclusivamente registros históricos',()=>{
 const s=state();
 s.buildings=[{kind:'home',x:6,y:12,occupants:8},{kind:'shop',x:13,y:9},{kind:'civic',serviceModel:'urbanPark',x:7,y:10}];
 const tour=cinematicStops(s);
 assert.ok(tour.some(v=>v.title==='Viviendas'&&v.x===6));
 assert.ok(tour.some(v=>v.title==='Plazas'));
 assert.equal(cinematicComparison(s,'oeste').first,null);
 s.neighborhoodHistory={snapshots:[{day:1,districts:[{id:'oeste',population:3,homes:1,shops:0,factories:0,parks:0}]}]};
 const diff=cinematicComparison(s,'oeste');
 assert.equal(diff.first.population,3);assert.equal(diff.current.population,8);
 assert.equal(cinematicComparison(s,'centro').first,null);
});
test('La integración usa Three.js real, sin sprites ni escalados 3D de ejes diferentes',()=>{
 const visual=readFileSync(new URL('../city_spectacle_3d.js',import.meta.url),'utf8');
 const world=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
 const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(world,/createCitySpectacle3D/);
 assert.match(world,/spectacle\.decorateBuilding/);
 assert.match(world,/spectacle\.sceneSync/);
 assert.match(world,/spectacle\.tick/);
 assert.match(world,/getCinematicSubjects/);
 assert.match(world,/captureFrame/);
 assert.match(visual,/THREE\.InstancedMesh/);
 assert.match(visual,/THREE\.CanvasTexture/);
 assert.match(visual,/function makeHuman/);
 assert.match(visual,/function marketStall/);
 assert.match(visual,/g\.scale\.setScalar\(size\)/);
 assert.match(game,/setupCinematicCamera/);
 assert.match(html,/id="cinemaToggle"/);
 assert.match(html,/city_cinema\.css/);
});
