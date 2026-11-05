import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18838,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.setItem('cv-tutorial-introduced-v1','yes'));
  await page.locator('#offlineMode').evaluate(b=>b.click());
  await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');
  await page.locator('#newSlotButton').evaluate(b=>b.click());
  await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.getElementById('modeBackdrop')?.classList.contains('hidden'),null,{timeout:30000});
  await page.locator('#tutorialHelpButton').evaluate(b=>b.click());
  await page.locator('#beginnerTutorial:not([hidden])').waitFor();
  assert.match(await page.locator('#tutorialTitle').innerText(),/Hola/);
  await page.locator('[data-tutorial-next]').evaluate(b=>b.click());
  await page.waitForFunction(()=>document.getElementById('panelPopup')?.classList.contains('build-drawer-open'));
  await page.waitForFunction(()=>document.querySelector('#tutorialSpotlight')?.dataset.target==='roads');
  assert.equal(await page.locator('#tutorialSpotlight').getAttribute('data-target'),'roads');
  await page.locator('.tool[data-tool="road"][data-road-type="local"]').evaluate(b=>b.click());
  await page.waitForFunction(()=>document.querySelector('#tutorialSpotlight')?.dataset.target==='map');
  assert.match(await page.locator('#tutorialAction').innerText(),/mapa/);
  await page.locator('[data-tutorial-voice]').evaluate(b=>b.click());
  assert.equal(await page.locator('[data-tutorial-voice]').getAttribute('aria-pressed'),'false');
  await page.locator('[data-tutorial-next]').evaluate(b=>b.click());
  await page.waitForFunction(()=>document.getElementById('popupTitle')?.textContent==='Construir');
  assert.match(await page.locator('#tutorialTitle').innerText(),/electricidad/);
  await page.locator('[data-tutorial-close]').first().evaluate(b=>b.click());
  assert.equal(await page.locator('#beginnerTutorial').isHidden(),true);
  assert.deepEqual(errors,[],viewport.width+': '+errors.join('; '));
  await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
