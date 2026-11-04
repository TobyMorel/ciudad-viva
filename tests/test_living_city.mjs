import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordLivingCity,residentDirectory,residentCommute,residentStory,parkActivityPlan,rushHourPlan,cityMomentCandidates,livingMomentVisuals} from '../living_city.js';
import {recordCityProgress} from '../cityInsights.js';

function city(){
 return {day:1,population:2,money:10000,buildings:[{kind:'home',x:6,y:9,name:'Hogar de prueba',status:'operativo',occupants:2,residents:[
  {id:'vecino-a',status:'buscando',workerEligible:true,unemploymentEpisodes:1,unemployedSinceDay:1},
  {id:'vecino-b',status:'empleado',workerEligible:true,employerId:'firm-7-9',employerName:'Almacén',monthlyWage:20}
 ]},{kind:'shop',x:7,y:9,name:'Almacén',status:'operativo',business:{status:'abierto'}}],
 workplaces:[{kind:'shop',name:'Almacén',x:7,y:9}],commutes:[{from:[6,9],to:[7,9],workers:1,vehicles:2,mode:'walk',reason:'trabajo',route:[[6,9],[7,9]],trafficFactor:1.2}],
 roads:[[6,9],[7,9]],projects:[],tourismEvents:[],busRoutes:[],metroLines:[],government:{elections:[]},cityMilestones:{completed:[],events:[]}};
}
test('El padrón expone IDs y biografía observada; nunca asigna nombres, edad o familia inventados',()=>{
 const s=city(),a=residentDirectory(s);
 assert.equal(a.length,2);assert.equal(a[0].id,'vecino-a');
 assert.match(a[0].name,/vecino\/a/i);assert.equal(a[0].age,null);
 assert.deepEqual(residentCommute(s,a[1]).route,[[6,9],[7,9]]);
 assert.equal(residentCommute(s,a[0]),null);
});
test('El diario de ciudadanos es persistente, acotado e idempotente dentro de un día',()=>{
 const s=city(),first=JSON.stringify({money:s.money,buildings:s.buildings,roads:s.roads,projects:s.projects});
 recordLivingCity(s);
 assert.equal(s.livingCity.stories.length,2);
 assert.match(s.livingCity.stories[0].detail,/Primera aparición/);
 recordLivingCity(s);assert.equal(s.livingCity.stories.length,2);
 s.day=2;s.buildings[0].residents[0].status='empleado';
 s.buildings[0].residents[0].employerName='Almacén';
 s.buildings[0].residents[0].employerId='firm-7-9';
 recordLivingCity(s);
 assert.match(s.livingCity.stories.at(-1).detail,/Consiguió empleo/);
 s.day=3;s.buildings[0].residents[0].employerName='Municipalidad';
 s.buildings[0].residents[0].employerId='public-civic-9-11';
 recordLivingCity(s);assert.equal(s.livingCity.stories.at(-1).kind,'cambio-trabajo');
 s.day=4;s.buildings[0].residents[0].status='buscando';recordLivingCity(s);
 assert.equal(s.livingCity.stories.at(-1).kind,'desempleo');
 s.day=5;s.buildings[0].residents[0].status='empleado';
 s.buildings[0].residents[0].employerName='Almacén';
 s.buildings[0].residents[0].employerId='firm-7-9';
 recordLivingCity(s);
 assert.equal(residentStory(s,'vecino-a').history[0].kind,'empleo');
 assert.equal(JSON.stringify({money:s.money,buildings:s.buildings,roads:s.roads,projects:s.projects}).includes('"money":10000'),true);
 assert.deepEqual(s.roads,[[6,9],[7,9]]);
 assert.equal(s.money,10000);
 assert.equal(s.projects.length,0);
});
test('La mudanza se infiere exclusivamente de un cambio real de domicilio',()=>{
 const s=city();recordLivingCity(s);s.day=2;
 const r=s.buildings[0].residents.shift();
 s.buildings.push({kind:'home',x:9,y:9,occupants:1,name:'Casa nueva',status:'operativo',residents:[r]});
 recordLivingCity(s);assert.equal(residentStory(s,r.id).history[0].kind,'mudanza');
});
test('Momentos registrados sin eventos ficticios, con umbral máximo y sin duplicados',()=>{
 const s=city();
 assert.equal(cityMomentCandidates(s).length,0);
 s.population=1120;recordLivingCity(s);
 assert.equal(s.livingCity.moments.length,1);
 assert.equal(s.livingCity.moments[0].id,'poblacion-1000');
 assert.equal(livingMomentVisuals(s).length,1);
 s.day=2;recordLivingCity(s);assert.equal(s.livingCity.moments.length,1);
 s.buildings.push({kind:'civic',serviceModel:'generalHospital',status:'operativo',name:'Hospital del Centro',x:10,y:11});
 s.day=3;recordLivingCity(s);
 assert.ok(s.livingCity.moments.some(m=>m.id==='primer-hospital'&&m.x===10));
 s.day=6;assert.equal(livingMomentVisuals(s).length,0);
});
test('La animación de la plaza usa viajes de ocio, no la simple existencia de una plaza',()=>{
 const s=city();s.buildings.push({kind:'civic',serviceModel:'urbanPark',status:'operativo',x:9,y:9});
 assert.equal(parkActivityPlan(s).length,0);
 s.commutes.push({reason:'ocio',to:[9,9],workers:8});
 const activities=parkActivityPlan(s);
 assert.equal(activities.length,1);assert.equal(activities[0].visitors,8);
 assert.deepEqual(activities[0].activities,['paseo','descanso','juego']);
 s.commutes[1].workers=0;assert.equal(parkActivityPlan(s).length,0);
});
test('Congestión visual ligada a vehículos reales y limitada a horarios de pico',()=>{
 const s=city();
 assert.equal(rushHourPlan(s,480).hotspots.length,0);
 s.commutes[0].vehicles=12;
 assert.equal(rushHourPlan(s,480).peak,true);
 assert.equal(rushHourPlan(s,720).peak,false);
 assert.ok(rushHourPlan(s,480).hotspots.length>0);
 s.commutes[0].vehicles=0;assert.equal(rushHourPlan(s,480).hotspots.length,0);
});
test('El registro se integra al motor sin modificar requisitos, precios ni plazos de construcción',()=>{
 const s=city();s.projects=[{id:'obra-1',kind:'home',x:11,y:11,progress:.3,status:'en obra',duration:39,cost:4200,paid:400}];
 const before=JSON.stringify(s.projects);
 recordCityProgress(s);
 assert.equal(JSON.stringify(s.projects),before);
 assert.equal(s.money,10000);
 assert.ok(s.livingCity?.lastDay===1);
});
test('Three.js muestra obras de casas, comercios y fábricas; nada se deforma ni acelera el proyecto',()=>{
 const source=readFileSync(new URL('../living_city_3d.js',import.meta.url),'utf8');
 const world=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const kind of ['home','shop','factory'])assert.match(source,new RegExp(kind));
 assert.match(source,/createProjectModel/);assert.match(source,/createParks/);assert.match(source,/createTraffic/);
 assert.match(source,/createMoments/);assert.match(source,/g\.scale\.setScalar/);
 assert.match(world,/living3d\.sceneSync/);assert.match(world,/living3d\.tick/);
 assert.match(world,/living3d\.residentHit/);
 assert.match(html,/id="lifeStoriesToggle"/);
});
