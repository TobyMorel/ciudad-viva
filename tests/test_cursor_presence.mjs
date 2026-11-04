import test from 'node:test';
import assert from 'node:assert/strict';
import {cursorView,cursorStatusText} from '../cursor_presence.js';

test('screen names are sent for reports and dock popups',()=>{
 assert.equal(cursorStatusText(cursorView({popup:'Movilidad',overMap:false})),'Viendo Pantalla Movilidad');
 assert.equal(cursorStatusText(cursorView({popup:'Salud',overMap:false})),'Viendo Pantalla Salud');
 assert.equal(cursorStatusText(cursorView({traffic:true,overMap:false})),'Viendo Pantalla Tráfico');
 assert.equal(cursorStatusText(cursorView({popup:'Economía y suministros'})),'Viendo Pantalla Economía y suministros');
});
test('the label is cleared on map return and describes other idle states',()=>{
 assert.equal(cursorStatusText(cursorView({overMap:true})),'');
 assert.equal(cursorStatusText(cursorView({overMap:false})),'Fuera del mapa 3D');
 assert.equal(cursorStatusText(cursorView({supply:true,overMap:false})),'Viendo Pantalla Pedidos de materiales');
 assert.equal(cursorStatusText(cursorView({hidden:true,traffic:true})),'En otra pestaña');
});
test('screen labels are bounded',()=>{
 assert.equal(cursorView({popup:'X'.repeat(100)}).length,60);
 assert.equal(cursorStatusText(null),'');
});
