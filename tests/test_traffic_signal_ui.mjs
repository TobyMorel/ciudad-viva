import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18952,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const {name,width,height} of [{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width,height}});page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.paused=true;localStorage.setItem('cv-sound','off');localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').click();await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');await page.locator('#saveList button, #newSlotButton').first().evaluate(button=>button.click());await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'));await page.locator('.game-dock').waitFor();
  await page.locator('[data-popup="build"]').evaluate(el=>el.click());await page.locator('.tool[data-tool="road"][data-road-type="local"]').evaluate(el=>el.click());
  const crossing=await page.evaluate(()=>window.__ciudadVivaProjectTile(12,10,0)),canvas=await page.locator('#city').boundingBox();assert.ok(crossing.visible,`${name}: cruce de prueba visible`);
  await page.mouse.click(canvas.x+crossing.x,canvas.y+crossing.y);await page.locator('#popupTitle').filter({hasText:'Semáforo de intersección'}).waitFor();
  const card=page.locator('[data-toggle-traffic-signal]').locator('..').locator('..');
  const bounds=await card.evaluate(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,scroll:el.scrollWidth,client:el.clientWidth}});
  assert.ok(bounds.left>=0&&bounds.right<=width&&bounds.scroll<=bounds.client+3,`${name}: ficha responsive ${JSON.stringify(bounds)}`);
  const signalButton=page.locator('[data-toggle-traffic-signal]');
  await signalButton.waitFor({state:'visible'});assert.ok(await signalButton.isEnabled(),`${name}: acción de semáforo habilitada`);await signalButton.evaluate(button=>button.click());
  await page.waitForFunction(()=>document.getElementById('panelPopup')?.classList.contains('hidden'),null,{timeout:30000});
  assert.deepEqual(errors,[],`${name}: sin errores JS`);await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
