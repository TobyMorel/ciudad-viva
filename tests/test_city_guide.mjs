import test from 'node:test';
import assert from 'node:assert/strict';
import {collectCityAlerts,projectGuide,INDUSTRIES,gettingStarted} from '../cityGuide.js';

test('Incidentes físicos muestran marcador 2D con acción y sin inventar eventos',()=>{
 const empty={day:32,policeReport:{recentIncidents:[]},fireReport:{recentIncidents:[]},waste:{report:{litterTiles:[]}},projects:[],roadAssets:[]};
 assert.deepEqual(collectCityAlerts(empty),[]);
 const city={...empty,policeReport:{recentIncidents:[{id:'p1',day:31,x:8,y:10,status:'sin respuesta',location:'Barrio norte'}]},
  fireReport:{activeIncidents:[{id:'f1',startDay:32,x:9,y:11,status:'ardiendo',name:'Casa del barrio'}],recentIncidents:[]},
  waste:{report:{litterTiles:[null,[7,10]]},containers:[{id:'c1',x:10,y:11,storedTons:1.9,capacityTons:2}]},
  projects:[{id:'o1',x:12,y:11,label:'Comisaría',status:'pausada',materialsRequired:{concrete:12},materialsUsed:{concrete:2}}]};
 const alerts=collectCityAlerts(city);
 assert.deepEqual(new Set(alerts.map(a=>a.kind)),new Set(['fire','police','litter','waste','construction']));
 assert.ok(alerts.every(a=>a.title&&a.detail&&a.action&&Number.isFinite(a.x)&&Number.isFinite(a.y)));
 assert.equal(alerts.find(a=>a.kind==='fire').priority,0);
 assert.ok(alerts.find(a=>a.kind==='police').detail.includes('patrulla'));
 assert.equal(collectCityAlerts({...city,day:150}).filter(a=>a.kind==='police').length,1,'El aviso continúa mientras el incidente siga sin respuesta.');
});

test('Las alertas siguen disponibles en sectores lejanos y coordenadas negativas',()=>{
 const city={day:200,policeReport:{recentIncidents:[
  {id:'far-east',day:200,x:128,y:64,status:'sin respuesta',location:'Extremo oriental'},
  {id:'far-west',day:200,x:-40,y:-24,status:'atendido',location:'Extremo occidental'}]},projects:[],roadAssets:[]};
 assert.deepEqual(collectCityAlerts(city).map(a=>[a.id,a.x,a.y]),[['far-east',128,64]]);
});

test('Calle deteriorada no interpreta ausencia de calidad como desperfecto',()=>{
 const a=collectCityAlerts({day:2,roadAssets:[{x:5,y:5},{x:6,y:5,quality:18},{x:7,y:5,quality:60}]});
 assert.equal(a.filter(x=>x.kind==='road').length,1);
 assert.equal(a[0].x,6);
});

test('Las obras avanzan sin pedir materiales y la industria conserva su producción',()=>{
 assert.equal(INDUSTRIES.concrete.label,'Hormigonera');
 const p=projectGuide({}, {label:'Comisaría',status:'pausada',materialsRequired:{concrete:20,steel:5},materialsUsed:{concrete:7,steel:1}});
 assert.ok(!JSON.stringify(p).toLowerCase().includes('faltan materiales'));
 assert.ok(p.reason.includes('pausaste'));
});

test('Tutorial inicial marca únicamente pasos alcanzados por el estado real',()=>{
 const empty=gettingStarted({roads:[],zones:[],projects:[],buildings:[],supply:{orders:[]}});
 assert.equal(empty.length,6);
 assert.equal(empty.filter(x=>x.done).length,1,'Reconocer la ciudad es el único paso inicial no condicionado.');
 const advanced=gettingStarted({roads:[[4,10]],zones:[{kind:'home'},{kind:'shop'},{kind:'factory'}],projects:[{kind:'factory'}],
  buildings:[{kind:'school',name:'Escuela'},{kind:'factory'},{kind:'fireStation'}],supply:{orders:[]}});
 assert.ok(advanced.every(x=>x.done));
 assert.ok(advanced.every(x=>x.description.length>=40));
});

test('Los cortes de redes son avisos accionables y reflejan la respuesta despachada',()=>{
 const city={day:20,utilities:{report:{failures:[{id:'u1',network:'power',x:8,y:10,day:19,reason:'inundación',repairCost:500,affectedBuildings:4,status:'avería',emergencyRouteAvailable:true},{id:'u2',network:'water',x:9,y:10,day:18,repairCost:300,affectedBuildings:2,status:'en reparación',remainingDays:1,responseKind:'emergencia'}]}},projects:[],roadAssets:[]};
 const alerts=collectCityAlerts(city).filter(a=>a.kind==='utility');
 assert.equal(alerts.length,2);
 assert.ok(alerts.some(a=>a.title==='Corte de electricidad'&&a.detail.includes('$1000')&&a.action.includes('Servicios')));
 assert.ok(alerts.some(a=>a.title==='Cuadrilla reparando red'&&a.detail.includes('Respuesta urgente')));
});

test('Edificio sin camino continuo a la entrada muestra aviso seleccionable',()=>{
 const alerts=collectCityAlerts({day:40,buildings:[{x:8,y:10,name:'Casa aislada',roadAccessConnected:false,roadAccessReason:'Sin una ruta vial continua hasta el acceso exterior.'}]});
 assert.equal(alerts.length,1);assert.equal(alerts[0].kind,'roadAccess');assert.equal(alerts[0].id,'road-access-8-10');
 assert.match(alerts[0].detail,/Casa aislada/);assert.match(alerts[0].action,/Reconectá los tramos/);
});
