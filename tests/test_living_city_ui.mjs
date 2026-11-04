import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';
const port=18856,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#offlineMode').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');
  await page.locator('#newSlotButton').evaluate(el=>el.click());
  await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.getElementById('modeBackdrop')?.classList.contains('hidden'),null,{timeout:30000});
  const diagnostics=await page.evaluate(()=>window.__ciudadVivaScene());
  assert.ok(Number.isInteger(diagnostics.animatedHomeShopFactorySites));
  assert.ok(Number.isInteger(diagnostics.livingResidentFigures));
  assert.ok(Number.isInteger(diagnostics.parkVisitors3D));
  assert.ok(Number.isInteger(diagnostics.visualQueueCars));
  assert.ok(Number.isInteger(diagnostics.cityCelebrations3D));
  assert.equal(diagnostics.invalidLivingTransforms,0,'Modelos 3D de personas, grúas y vehículos con proporciones válidas');
  assert.equal(diagnostics.contextLost,false);
  await page.locator('#lifeStoriesToggle').evaluate(el=>el.click());
  await page.locator('#lifeStoriesPanel:not([hidden])').waitFor();
  assert.match(await page.locator('#lifeStoriesPanel h2').innerText(),/Historias/);
  await page.locator('#lifeResidentSearch').fill('Municipalidad');
  assert.match(await page.locator('.life-people-list').innerText(),/No hay residentes/);
  await page.locator('[data-life-tab="moments"]').evaluate(el=>el.click());
  assert.equal(await page.locator('[data-life-tab="moments"]').getAttribute('aria-selected'),'true');
  await page.locator('#lifeStoriesPanel .life-moments').waitFor({state:'visible'});
  await page.locator('#lifeStoriesPanel [data-life-close]').evaluate(el=>el.click());
  assert.equal(await page.locator('#lifeStoriesPanel').isHidden(),true);
  assert.deepEqual(errors,[],viewport.width+': '+errors.join('; '));
  await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
