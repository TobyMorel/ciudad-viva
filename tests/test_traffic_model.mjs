import test from 'node:test';
import assert from 'node:assert/strict';
import {roadCapacity,trafficFactorForRoute} from '../traffic.js';

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
