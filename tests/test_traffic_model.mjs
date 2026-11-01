import test from 'node:test';
import assert from 'node:assert/strict';
import {roadCapacity,trafficFactorForRoute,applyTrafficQueue,trafficQueueStep,trafficQueueDelay,trafficEdgeKey} from '../traffic.js';

test('la cola vial persiste entre franjas y añade demora a la ruta',()=>{
 const first=trafficQueueStep(0,10,6),second=trafficQueueStep(first.queue,2,6),route=[[0,0],[1,0]],report={segments:{[trafficEdgeKey(...route)]:{windows:{morningPeak:first,eveningPeak:second}}}};
 assert.equal(first.queue,4);assert.equal(second.queue,0);assert.ok(second.delayMinutes>0);assert.equal(trafficQueueDelay(route,report,'morningPeak'),first.delayMinutes);assert.equal(trafficQueueDelay(route,report,'eveningPeak'),second.delayMinutes);
});

test('la capacidad estructural duplica la de una calle barrial y cae con el deterioro',()=>{
  assert.equal(roadCapacity([0,0],[1,0]),1.2);
  assert.equal(roadCapacity([0,10],[1,10]),2.4);
  assert.equal(roadCapacity([0,0],[1,0],[{x:0,y:0,quality:41}]),.6);
});

test('el factor de viaje responde al flujo de sus tramos y omite accesos peatonales',()=>{
  const roads=[[0,0],[1,0],[2,0]],route=[[0,0],[1,0],[2,0]],flow=new Map([['0,0|1,0',1.2],['1,0|2,0',0]]);
  assert.equal(trafficFactorForRoute(route,new Map(),roads),1);
  assert.equal(trafficFactorForRoute(route,flow,roads),1.175);
  assert.equal(trafficFactorForRoute([[0,0]],flow,roads),1);
});

test('los vehículos mantienen distancia de seguimiento en el mismo carril',()=>{
 const cars=[{vehicle:true,laneKey:'10,4>10,5:1',progress:.8},{vehicle:true,laneKey:'10,4>10,5:1',progress:.79},{vehicle:true,laneKey:'10,4>10,5:1',progress:.78}];
 applyTrafficQueue(cars,.2);
 assert.ok(cars[0].progress-cars[1].progress>=.2-1e-9);
 assert.ok(cars[1].progress-cars[2].progress>=.2-1e-9);
 const opposite={vehicle:true,laneKey:'10,5>10,4:-1',progress:.79};
 applyTrafficQueue([...cars,opposite],.2);
 assert.equal(opposite.progress,.79,'el carril contrario no debe frenar esta fila');
});
