import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18842,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.setItem('cv-tutorial-introduced-v1','yes'));
  await page.locator('#offlineMode').evaluate(button=>button.click());
  await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');
  await page.locator('#newSlotButton').evaluate(button=>button.click());
  await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.getElementById('modeBackdrop')?.classList.contains('hidden'),null,{timeout:30000});
  assert.match(await page.locator('#cityClimateBadge').innerText(),/Verano/);
  const diagnostics=await page.evaluate(()=>window.__ciudadVivaScene());
  assert.equal(diagnostics.season,'verano');
  assert.ok(Number.isFinite(diagnostics.sceneSyncRebuilds));
  assert.ok(Number.isFinite(diagnostics.lifeFigures));
  assert.equal(diagnostics.invalidVisualTransforms,0,'Geometrías y proporciones Three.js válidas');
  assert.ok(Number.isFinite(diagnostics.rainDrops));
  await page.locator('#cinemaToggle').evaluate(button=>button.click());
  await page.locator('#cinemaPanel:not([hidden])').waitFor();
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('cinema-mode')),true);
  await page.waitForFunction(()=>Math.abs(document.querySelector('#city').getBoundingClientRect().width-window.innerWidth)<3);
  await page.locator('[data-compare]').evaluate(button=>button.click());
  assert.match(await page.locator('.cinema-comparison').innerText(),/Historia registrada/);
  assert.match(await page.locator('.cinema-comparison').innerText(),/Sin registros anteriores/);
  await page.locator('#cinemaPanel [data-tour]').evaluate(button=>button.click());
  assert.equal(await page.locator('[data-tour]').getAttribute('aria-pressed'),'false');
  await page.locator('#cinemaPanel [data-exit]').evaluate(button=>button.click());
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('cinema-mode')),false);
  assert.equal(await page.locator('#cinemaPanel').isHidden(),true);
  await page.waitForTimeout(100);
  const finalDiag=await page.evaluate(()=>window.__ciudadVivaScene());
  assert.equal(finalDiag.contextLost,false,'El lienzo WebGL debe seguir activo');
  assert.deepEqual(errors,[],viewport.width+': '+errors.join('; '));
  await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
