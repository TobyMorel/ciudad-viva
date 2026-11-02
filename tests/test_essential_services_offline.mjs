import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateEssentialServices,advanceEssentialServiceDay,SERVICE_GRACE_DAYS} from '../essential_services.js';
const full=()=>{
 const roads=Array.from({length:26},(_,i)=>[4+i,10]);
 return {day:1,newSettlement:true,roads,money:90000,abandoned:[],population:12,
  housingDemand:{unmet:0},buildings:[{x:6,y:9,kind:'home',name:'Barrio nuevo',occupants:12,capacity:20,status:'habilitado'}],
  utilities:{powerLines:roads,waterPipes:roads,gasLines:roads,telecomLines:roads,failures:[]}};
};
const provider=(kind,x,model)=>({x,y:9,kind,serviceModel:model,quality:82,status:'habilitado'});
test('ciudad nueva: ni servicios gratuitos ni farolas iluminadas',()=>{
 const city=full(),grid=evaluateEssentialServices(city);
 assert.deepEqual(city.buildings[0].missingServices,['power','water','gas','tv','wifi']);
 assert.deepEqual(city.utilities.poweredStreetlightTiles,[]);
 for(const id of Object.keys(grid))assert.equal(grid[id].capacity,0);
});
test('conectar centrales físicas aumenta capacidad sin inventar una conexión de consumo',()=>{
 const city=full();
 city.buildings.push(provider('powerPlant',8),provider('waterPlant',9),provider('gasPlant',10),provider('civic',11,'tvHeadend'),provider('civic',12,'wifiHub'));
 const grid=evaluateEssentialServices(city);
 assert.equal(grid.power.capacity,900);assert.equal(grid.water.capacity,220);assert.equal(grid.gas.capacity,160);
 assert.equal(grid.tv.capacity,180);assert.equal(grid.wifi.capacity,160);
 assert.deepEqual(city.buildings[0].missingServices,[]);
 assert.ok(city.utilities.poweredStreetlightTiles.length>0);
 city.utilities.telecomLines=[[4,10]];
 evaluateEssentialServices(city);
 assert.deepEqual(city.buildings[0].missingServices,['tv','wifi']);
 assert.equal(city.buildings[0].missingServiceReasons.wifi,'Red vial o cable desconectado');
});
test('capacidad máxima: se respetan conexiones anteriores y la vivienda nueva espera',()=>{
 const city=full();
 city.buildings[0].occupants=5;
 city.buildings.push({...provider('powerPlant',8),generationKw:10000},provider('waterPlant',9),provider('gasPlant',10),{...provider('civic',11,'tvHeadend'),tvConnections:1},{...provider('civic',12,'wifiHub'),wifiConnections:1});
 evaluateEssentialServices(city);
 assert.equal(city.buildings[0].utilityAccess.tvServedPct,100);
 const next={kind:'home',name:'Casa nueva',x:5,y:9,occupants:5,status:'habilitado'};
 city.buildings.push(next);
 evaluateEssentialServices(city);
 assert.equal(city.buildings[0].utilityAccess.tvServedPct,100);
 assert.deepEqual(next.missingServices.filter(s=>['tv','wifi'].includes(s)),['tv','wifi']);
 assert.equal(next.missingServiceReasons.tv,'Capacidad máxima alcanzada');
 city.buildings.push({...provider('civic',13,'tvHeadend'),tvConnections:1},{...provider('civic',14,'wifiHub'),wifiConnections:1});
 evaluateEssentialServices(city);
 assert.equal(next.utilityAccess.tvServedPct,100);
 assert.equal(next.utilityAccess.wifiServedPct,100);
});
test('los cortes diarios provocan abandono real y no crecen al consultar UI',()=>{
 const city=full(),b=city.buildings[0];
 evaluateEssentialServices(city);
 for(let day=1;day<=SERVICE_GRACE_DAYS.power;day++){
  city.day=day;evaluateEssentialServices(city);advanceEssentialServiceDay(city);
  advanceEssentialServiceDay(city); // relecturas no deben duplicar días
 }
 assert.equal(city.buildings.length,0);
 assert.equal(city.abandoned.length,1);
 assert.match(city.abandoned[0].reason,/electricidad/);
 assert.equal(city.abandoned[0].displaced,12);
 assert.equal(city.population,0);
});
test('reconectar antes del plazo reinicia el contador',()=>{
 const city=full();for(let d=1;d<=70;d++){city.day=d;evaluateEssentialServices(city);advanceEssentialServiceDay(city)}
 assert.equal(city.buildings[0].serviceOutageDays.power,70);
 city.buildings.push(provider('powerPlant',8));
 city.day++;evaluateEssentialServices(city);advanceEssentialServiceDay(city);
 assert.equal(city.buildings[0].serviceOutageDays.power,0);
 assert.equal(city.abandoned.length,0);
});
