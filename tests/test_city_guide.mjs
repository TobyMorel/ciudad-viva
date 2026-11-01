import test from 'node:test';
import assert from 'node:assert/strict';
import {collectCityAlerts,projectGuide,MATERIAL_HELP,INDUSTRIES} from '../cityGuide.js';

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
 assert.equal(collectCityAlerts({...city,day:150}).filter(a=>a.kind==='police').length,0);
});

test('Calle deteriorada no interpreta ausencia de calidad como desperfecto',()=>{
 const a=collectCityAlerts({day:2,roadAssets:[{x:5,y:5},{x:6,y:5,quality:18},{x:7,y:5,quality:60}]});
 assert.equal(a.filter(x=>x.kind==='road').length,1);
 assert.equal(a[0].x,6);
});

test('La guía de hormigón explica cantera, planta, orden de compra y trabajo real',()=>{
 const help=MATERIAL_HELP.concrete;
 assert.ok(help.steps.join(' ').includes('Hormigonera'));
 assert.ok(help.steps.join(' ').includes('Pedir materiales'));
 assert.equal(INDUSTRIES.concrete.label,'Hormigonera');
 const p=projectGuide({}, {label:'Comisaría',status:'pausada',materialsRequired:{concrete:20,steel:5},materialsUsed:{concrete:7,steel:1}});
 assert.equal(p.remaining.find(x=>x.key==='concrete').required,20);
 assert.equal(p.remaining.find(x=>x.key==='concrete').used,7);
 assert.ok(p.reason.includes('pausaste'));
});
