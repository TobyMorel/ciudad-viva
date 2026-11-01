import test from 'node:test';
import assert from 'node:assert/strict';
import {taxAdjustedBusinessCreditLimit} from '../offline.js';

test('Offline: la mora fiscal consume solvencia comercial y tres impagos suspenden nuevos giros',()=>{
  assert.equal(taxAdjustedBusinessCreditLimit(1000,250,2),750);
  assert.equal(taxAdjustedBusinessCreditLimit(1000,0,3),0);
  assert.equal(taxAdjustedBusinessCreditLimit(1000,0,0),1000);
});
