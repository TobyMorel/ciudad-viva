import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {immersiveCityPlan,immersiveSignature,realBusStopScenes,realIndustryScenes,realPortScenes,
 realSchoolScenes,realStreetIssues,realEmergencyScenes,realSurpriseScenes} from '../city_immersive_state.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
function city(){
 return {day:45,timeOfDayMinutes:480,money:57000,population:12,roads:[[6,9],[7,9],[8,9],[8,10],[9,10],[10,10],[11,10]],
 buildings:[{kind:'home',x:6,y:10,status:'operativo',occupants:12,residents:[]},
  {kind:'shop',x:7,y:10,name:'Panadería Sur',status:'operativo',business:{status:'abierto',lastSales:5}},
  {kind:'factory',x:8,y:10,name:'Metalúrgica',status:'operativo',business:{status:'abierto',lastProduction:9,inventory:6}},
  {kind:'port',x:23,y:10,status:'habilitado',cargoStored:17},
  {kind:'school',x:9,y:10,status:'habilitado',serviceModel:'primarySchool',classrooms:4},
  {kind:'civic',x:10,y:10,status:'operativo',serviceModel:'urbanPark'}],
 workplaces:[{kind:'factory',x:8,y:10,staffedJobs:11},{kind:'school',x:9,y:10,staffedJobs:6}],
 busRoutes:[{id:'b1',operational:true,effectiveBuses:2,ridersThisPass:17,stops:[[6,9],[8,9]],route:[[6,9],[7,9],[8,9]]}],
 supply:{portVoyages:[{id:'v1',status:'atracado',unloadedUnits:6,port:[23,10]}],marketOrders:[],portOrders:[]},
 educationReport:{schools:[{x:9,y:10,enrolled:24}]},
 roadAssets:[{x:8,y:9,quality:32},{x:7,y:9,quality:89}],
 waste:{report:{litterTiles:[[7,9]]},containers:[{x:6,y:9,storedTons:1.6,capacityTons:2}]},
 utilities:{report:{drainage:{rainfallMm:13},failures:[{id:'u1',x:10,y:10,status:'en reparación',network:'agua'}]}},
 fireReport:{activeIncidents:[{id:'f1',x:8,y:10,status:'ardiendo',arrivalDay:44,dispatchDay:43,responseRoute:[[9,10],[8,10]]}]},
 healthReport:{hospital:{ambulanceDispatches:[{id:'a1',x:6,y:10,day:45,status:'traslado',route:[[8,10],[7,9]]}]}},
 tourismEvents:[{id:'fiesta-1',type:'festival',status:'realizado',visitors:85,completedDay:44}],
 livingCity:{stories:[],moments:[]}};
}
test('Colectivos: paradas reales, buses asignados y pasajeros; nunca creamos una ruta falsa',()=>{
 const s=city();const stops=realBusStopScenes(s);
 assert.equal(stops.length,2);assert.equal(stops[0].riders,17);
 s.busRoutes[0].ridersThisPass=0;
 assert.equal(realBusStopScenes(s).length,0);
 s.busRoutes[0].ridersThisPass=17;s.busRoutes[0].effectiveBuses=0;
 assert.equal(realBusStopScenes(s).length,0);
 s.busRoutes[0].effectiveBuses=2;s.busRoutes[0].stops.push([40,40]);
 assert.equal(realBusStopScenes(s).length,2);
});
test('Producción y comercios reaccionan al inventario, ventas y pedidos reales',()=>{
 const s=city(),items=realIndustryScenes(s);
 assert.equal(items.length,2);
 assert.equal(items.find(x=>x.kind==='shop').identity,'panaderia');
 assert.equal(items.find(x=>x.kind==='factory').production,9);
 assert.equal(items.every(x=>x.active),true);
 s.buildings[2].business.lastProduction=0;s.buildings[2].business.inventory=0;
 assert.equal(realIndustryScenes(s).find(x=>x.kind==='factory').active,false);
});
test('Costa: se dibuja muelle con port habilitado; ningún movimiento marítimo cambia cargas',()=>{
 const s=city(),old=JSON.stringify(s.supply);
 const plans=realPortScenes(s);
 assert.equal(plans.length,1);assert.equal(plans[0].vesselCount,1);
 assert.equal(plans[0].cargo,17);
 assert.equal(JSON.stringify(s.supply),old);
 s.buildings=s.buildings.filter(b=>b.kind!=='port');
 assert.equal(realPortScenes(s).length,0);
});
test('Fauna se ancla a hogares ocupados, comercios activos y parques; clima conserva la lluvia real',()=>{
 const s=city(),model=immersiveCityPlan(s);
 assert.equal(model.animals.homes.length,1);
 assert.equal(model.animals.shops.length,1);
 assert.equal(model.rainMm,13);
 assert.equal(model.storm,true);
 assert.equal(model.coastEnabled,true);
 s.buildings[0].occupants=0;
 assert.equal(immersiveCityPlan(s).animals.homes.length,0);
});
test('Escuelas requieren matrícula real y aula terminada',()=>{
 const s=city();
 assert.deepEqual(realSchoolScenes(s).map(x=>x.enrolled),[24]);
 s.educationReport.schools[0].enrolled=0;assert.equal(realSchoolScenes(s).length,0);
 s.educationReport.schools[0].enrolled=24;s.buildings[4].status='en obra';
 assert.equal(realSchoolScenes(s).length,0);
});
test('Desperfectos visibles desaparecen al reparar, recoger basura y retirar fallas',()=>{
 const s=city(),before=realStreetIssues(s);
 assert.equal(before.potholes.length,1);assert.equal(before.litter.length,1);
 assert.equal(before.overflowing.length,1);assert.equal(before.utilities.length,1);
 s.roadAssets[0].quality=85;s.waste.report.litterTiles=[];
 s.waste.containers[0].storedTons=0;s.utilities.report.failures[0].status='reparada';
 const after=realStreetIssues(s);
 assert.equal(after.potholes.length,0);assert.equal(after.litter.length,0);
 assert.equal(after.overflowing.length,0);assert.equal(after.utilities.length,0);
});
test('Emergencias usan incidentes y despachos efectivos, no se fabrican sin reporte',()=>{
 const s=city(),em=realEmergencyScenes(s);
 assert.equal(em.fires.length,1);assert.equal(em.fires[0].arrived,true);
 assert.equal(em.ambulances.length,1);
 assert.equal(em.ambulances[0].arrived,true);
 s.fireReport.activeIncidents=[];s.healthReport.hospital.ambulanceDispatches=[];
 assert.deepEqual(realEmergencyScenes(s),{fires:[],ambulances:[]});
});
test('Pequeñas escenas especiales solo con festivales/mudanzas/hitos registrados',()=>{
 const s=city(),events=realSurpriseScenes(s);
 assert.ok(events.some(x=>x.type==='musica'&&x.x===10&&x.y===10));
 s.tourismEvents=[];assert.equal(realSurpriseScenes(s).length,0);
 s.livingCity.stories=[{kind:'mudanza',id:'r1',day:44}];
 s.buildings[0].residents=[{id:'r1',status:'empleado'}];
 const move=realSurpriseScenes(s);
 assert.equal(move.length,1);assert.equal(move[0].type,'mudanza');
 s.day=51;assert.equal(realSurpriseScenes(s).length,0);
});
test('Todas las escenas se derivan en modo lectura, sin alterar dinero, población, obras ni horarios',()=>{
 const s=city();s.projects=[{id:'p1',kind:'home',x:11,y:11,progress:.31,duration:39,paid:200}];
 const before=JSON.stringify(s),a=immersiveCityPlan(s),sig=immersiveSignature(a);
 assert.ok(sig.length>100);
 assert.equal(JSON.stringify(s),before);
 assert.equal(s.projects[0].duration,39);
});
test('Los nueve elementos 3D están integrados en una escena procedimental y tienen diagnóstico de transforms',()=>{
 const src=readFileSync(new URL('../city_immersive_3d.js',import.meta.url),'utf8');
 const world=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
 for(const fn of ['transportStops','shops3D','coast3D','animals3D','school3D','repairs3D','emergency3D','surprises3D','weather3D']){
  assert.ok(src.includes(fn+'('),fn+' activo');
 }
 assert.match(src,/new THREE\.ShapeGeometry/);
 assert.match(src,/new THREE\.TubeGeometry/);
 assert.match(src,/invalidImmersiveTransforms/);
 assert.match(world,/immersive3d\.sceneSync/);
 assert.match(world,/immersive3d\.tick/);
 assert.match(world,/busStopKeys/);
 assert.match(world,/userData\.passengerDoor/);
 assert.match(world,/poweredStreetlights/); // Alimentación efectiva de farolas de la red
 assert.match(world,/headlightLightPool/);
});
