import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18858,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,
 args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
   const city=await fetch('/offline_seed.json').then(r=>r.json());
   city.paused=true;
   localStorage.setItem('cv-tutorial-introduced-v1','yes');
   localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city));
  });
  await page.locator('#offlineMode').evaluate(b=>b.click());
  await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');
  await page.locator('#saveList .save-slot-row button:not(.save-slot-delete)').first().waitFor({timeout:20000});
  await page.locator('#saveList .save-slot-row button:not(.save-slot-delete)').first().evaluate(b=>b.click());
  try{
   await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.getElementById('modeBackdrop')?.classList.contains('hidden'),null,{timeout:60000});
  }catch(error){
   const detail=await page.evaluate(()=>({
     ready:document.readyState,mode:window.__ciudadVivaMode?.(),
     modeError:document.getElementById('modeError')?.textContent,
     modeBackdrop:document.getElementById('modeBackdrop')?.className,
     slotLabels:[...document.querySelectorAll('#saveList .save-slot-row')].map(x=>x.textContent?.slice(0,100)),
     diagnostics:window.__ciudadVivaScene?.()
   }));
   throw Error('No inició la ciudad de prueba: '+JSON.stringify({detail,pageErrors:errors,reason:error.message}));
  }
  await page.waitForFunction(()=>Number.isFinite(window.__ciudadVivaScene?.()?.immersiveBoats),null,{timeout:30000});
  const values=await page.evaluate(()=>window.__ciudadVivaScene());
  assert.equal(values.invalidVisualTransforms,0,'La escena anterior conserva geometrías válidas');
  assert.equal(values.invalidLivingTransforms,0,'Las personas de 0.263 conservan las proporciones');
  assert.equal(values.invalidImmersiveTransforms,0,'La escenografía nueva no tiene transforms inválidos');
  assert.ok(values.immersiveBoats>=3,'La costanera tiene barcos y movimiento');
  assert.ok(values.immersiveBirdWings>=8,'Aves y animales urbanos tridimensionales');
  assert.ok(values.immersiveAnimalFigures>=1,'Las mascotas usan hogares ocupados');
  assert.ok(Number.isInteger(values.immersiveBusStops));
  assert.ok(Number.isInteger(values.immersiveIndustrySites));
  assert.ok(Number.isInteger(values.immersiveSchoolSites));
  assert.ok(Number.isInteger(values.immersiveRoadIssues));
  assert.ok(Number.isInteger(values.immersiveRepairCrews));
  assert.ok(Number.isInteger(values.immersiveFireHoses));
  assert.ok(Number.isInteger(values.immersiveAmbulanceScenes));
  assert.ok(Number.isInteger(values.immersiveSurprises));
  assert.ok(Number.isInteger(values.immersiveUmbrellas));
  assert.equal(values.contextLost,false,'El contexto WebGL debe mantenerse activo');
  assert.deepEqual(errors,[],viewport.width+': '+errors.join('; '));
  await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
