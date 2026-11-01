import test from 'node:test';
import assert from 'node:assert/strict';
import {taxAdjustedBusinessCreditLimit,taxPressurePenalty,taxAdjustedMigrationDemand} from '../offline.js';

test('Offline: la mora fiscal consume solvencia comercial y tres impagos suspenden nuevos giros',()=>{
  assert.equal(taxAdjustedBusinessCreditLimit(1000,250,2),750);
  assert.equal(taxAdjustedBusinessCreditLimit(1000,0,3),0);
  assert.equal(taxAdjustedBusinessCreditLimit(1000,0,0),1000);
});

test('Offline: una presión tributaria alta reduce entradas y apoyo dentro del mismo límite que Online',()=>{
  assert.equal(taxPressurePenalty(5),0);
  assert.equal(taxPressurePenalty(25),4);
  assert.equal(taxAdjustedMigrationDemand(80,0),4);
  assert.equal(taxAdjustedMigrationDemand(80,25),0);
  assert.equal(taxAdjustedMigrationDemand(50,25),0);
  assert.equal(taxAdjustedMigrationDemand(30,25),-2);
});
