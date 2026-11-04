import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18841,server=await startUiTestServer(port);
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
  await page.locator('#cityCompanionButton').evaluate(button=>button.click());
  await page.locator('#cityCompanion:not([hidden])').waitFor();
  assert.match(await page.locator('#cityCompanionContent').innerText(),/electricidad|calles/i);
  await page.locator('[data-tab="missions"]').evaluate(button=>button.click());
  assert.match(await page.locator('#cityCompanionContent').innerText(),/primer camino/i);
  assert.ok(await page.locator('.companion-mission').count()>=10);
  await page.locator('[data-tab="districts"]').evaluate(button=>button.click());
  assert.match(await page.locator('#cityCompanionContent').innerText(),/Barrio del Oeste/);
  assert.match(await page.locator('#cityCompanionContent').innerText(),/Barrio del Puerto/);
  await page.locator('[data-show-districts]').evaluate(button=>button.click());
  assert.equal(await page.locator('#neighborhoodMarkers').isHidden(),false);
  await page.locator('#cityCompanion [data-close]').evaluate(button=>button.click());
  await page.locator('.game-dock [data-popup="build"]').evaluate(button=>button.click());
  await page.locator('.tool[data-tool="powerPlant"]').evaluate(button=>button.click());
  await page.locator('#city').evaluate(canvas=>{
   const rect=canvas.getBoundingClientRect();
   canvas.dispatchEvent(new MouseEvent('mousemove',{clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2,bubbles:true}));
  });
  await page.locator('#cityPlanPreview:not([hidden])').waitFor();
  assert.match(await page.locator('#cityPlanPreview').innerText(),/18\.800/);
  await page.locator('#plannerToggle').evaluate(button=>button.click());
  assert.equal(await page.locator('#plannerToggle').getAttribute('aria-pressed'),'true');
  await page.locator('.tool[data-tool="inspect"]').evaluate(button=>button.click());
  assert.equal(await page.locator('#cityPlanPreview').isHidden(),true);
  assert.deepEqual(errors,[],viewport.width+': '+errors.join('; '));
  await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
