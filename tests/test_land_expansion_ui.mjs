import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18948,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const{name,width,height}of[{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width,height}});page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.locator('#offlineMode').evaluate(el=>el.click());await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');await page.locator('#saveList button, #newSlotButton').first().evaluate(button=>button.click());
  await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline',{timeout:30000});
  await page.locator('.game-dock').waitFor({timeout:30000});
  await page.locator('[data-popup="city"]').evaluate(el=>el.click());await page.locator('#newBtn').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.getElementById('money')?.textContent.includes('175.000')&&document.getElementById('population')?.textContent.trim()==='0');
  await page.locator('[data-tutorial-close]').evaluateAll(items=>items.at(-1)?.click());
  await page.evaluate(()=>window.__ciudadVivaFocusTileForDiagnostics(20,4));const lock=await page.evaluate(()=>window.__ciudadVivaProjectTile(20,4,0));
  assert.ok(lock.visible,`${name}: el sector bloqueado queda visible tras desplazar el mapa`);
  const canvas=await page.locator('#city').boundingBox();await page.mouse.click(canvas.x+lock.x,canvas.y+lock.y);
  const card=page.locator('.land-unlock-card');await card.waitFor();
  const copy=await card.innerText();assert.match(copy,/Zona construible bloqueada/);assert.match(copy,/64 parcelas nuevas/);assert.match(copy,/8 × 8 parcelas/);assert.ok(copy.includes('$ 5.700'),`${name}: precio del sector oriental legible`);
  const bounds=await card.evaluate(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,scroll:el.scrollWidth,client:el.clientWidth}});
  assert.ok(bounds.left>=0&&bounds.right<=width&&bounds.top>=0&&bounds.bottom<=height,`${name}: ficha dentro del viewport ${JSON.stringify(bounds)}`);
  assert.ok(bounds.scroll<=bounds.client+3,`${name}: ficha sin desborde horizontal ${JSON.stringify(bounds)}`);
  await page.locator('[data-unlock-land]').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.getElementById('panelPopup')?.classList.contains('hidden'));
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).landClaims.unlockedChunks.includes('2,0'));
  await page.evaluate(()=>window.__ciudadVivaFocusTileForDiagnostics(20,12));
  let neighbor=await page.evaluate(()=>window.__ciudadVivaProjectTile(20,12,0));assert.ok(neighbor.visible,`${name}: el sector vecino queda visible`);await page.mouse.click(canvas.x+neighbor.x,canvas.y+neighbor.y);await page.locator('.land-unlock-card').waitFor();assert.equal(await page.locator('[data-unlock-land][data-chunk-x="2"][data-chunk-y="1"]').count(),1,`${name}: al desbloquear el sector se habilita su vecino`);
  assert.deepEqual(errors,[],`${name}: errores JavaScript`);await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
