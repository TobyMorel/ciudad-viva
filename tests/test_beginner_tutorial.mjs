import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BEGINNER_TUTORIAL_STEPS,isBeginnerStepComplete} from '../beginnerTutorial.js';

test('El recorrido en español enseña las mecánicas necesarias y usa controles reales',()=>{
 assert.ok(BEGINNER_TUTORIAL_STEPS.length>=12);
 const ids=BEGINNER_TUTORIAL_STEPS.map(s=>s.id);
 assert.equal(new Set(ids).size,ids.length);
 for(const key of ['roads','power','water','sewer','homes','park','demand','shops','industry','budget','projects','services']){
  assert.ok(ids.includes(key),'falta '+key);
 }
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/id="tutorialHelpButton"/);
 assert.match(html,/beginner-tutorial\.css/);
 assert.match(readFileSync(new URL('../game.js',import.meta.url),'utf8'),/setupBeginnerTutorial/);
 for(const step of BEGINNER_TUTORIAL_STEPS){
  assert.ok(step.title&&step.body.length>35&&step.action.length>40,step.id);
  if(step.target.startsWith('.tool'))assert.ok(step.tool,step.id);
  if(step.target.startsWith('.game-dock [data-popup=')){
   assert.ok(html.includes(step.target.match(/data-popup="([^"]+)"/)[0]));
  }
 }
});
test('Solo se marca un objetivo cuando la partida lo ha alcanzado',()=>{
 const steps=Object.fromEntries(BEGINNER_TUTORIAL_STEPS.map(s=>[s.id,s]));
 const empty={roads:[],zones:[],buildings:[],projects:[]};
 for(const id of ['roads','power','water','sewer','homes','park','shops','industry'])assert.equal(isBeginnerStepComplete(steps[id],empty),false,id);
 assert.equal(isBeginnerStepComplete(steps.budget,empty),null);
 const grown={roads:[[1,1]],zones:[{kind:'home'},{kind:'shop'},{kind:'factory'}],
  buildings:[{kind:'powerPlant'},{kind:'waterPlant'},{kind:'wastewaterPlant'},{kind:'civic',serviceModel:'urbanPark'}],projects:[]};
 for(const id of ['roads','power','water','sewer','homes','park','shops','industry'])assert.equal(isBeginnerStepComplete(steps[id],grown),true,id);
 assert.equal(isBeginnerStepComplete(steps.park,{...grown,buildings:[]}),false,'pintar verde no equivale a construir una plaza');
});
