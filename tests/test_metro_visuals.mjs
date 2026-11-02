import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// No exige package.json ni modifica el modo de módulos del cliente web.
const source = readFileSync(new URL('../metro_visuals.js',import.meta.url),'utf8');
const {metroVisualPlan} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const base = {id:'metro-test',status:'building',operational:false,elapsed:0,duration:100,
  stations:[[1,2],[5,2]],route:[[1,2],[2,2],[3,2],[4,2],[5,2]],trainCount:2};

assert.equal(metroVisualPlan(base).tunnelSegments,0,'Los estudios no crean un túnel');
assert.equal(metroVisualPlan({...base,elapsed:40}).tunnelSegments,1,'La excavación se dibuja gradualmente');
assert.equal(metroVisualPlan({...base,elapsed:99}).trains,0,'Los trenes esperan habilitación');
assert.equal(metroVisualPlan({...base,status:'active',operational:false}).trains,0,'Sin servicio no aparecen trenes');
assert.equal(metroVisualPlan({...base,status:'active',operational:true,trainCount:2}).trains,2,'La flota operativa se proyecta');
assert.equal(metroVisualPlan({...base,status:'paused',operational:true}).trains,0,'El servicio pausado no mueve trenes');
assert.equal(metroVisualPlan({...base,status:'active',operational:true,trainCount:9}).trains,5,'La cantidad visible tiene límite');
assert.equal(metroVisualPlan({...base,status:'active'}).tunnelSegments,4,'El túnel habilitado está completo');
assert.equal(metroVisualPlan({...base,status:'retired'}),null,'No se dibuja una línea retirada');
assert.equal(metroVisualPlan({...base,route:[[1,2],['x',2],[5,2]]}),null,'Se descartan rutas corruptas');
assert.equal(metroVisualPlan({...base,stations:[[1,2],[9,9]]}),null,'Los extremos deben coincidir');
assert.equal(metroVisualPlan({...base,route:[[1,2],[2,2],[5,2]]}),null,'Se rechazan saltos entre tramos');
console.log('OK: proyección del subte, progreso de obras y flota operativa');
