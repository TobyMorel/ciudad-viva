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
  await page.locator('#offlineMode').evaluate(el=>el.click());
  await page.locator('.game-dock').waitFor({timeout:30000});
  await page.locator('#newBtn').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.getElementById('money')?.textContent.includes('48.000')&&document.getElementById('population')?.textContent.trim()==='0');
  for(let i=0;i<5;i++)await page.locator('#zoomOut').evaluate(el=>el.click());
  const lock=await page.evaluate(()=>window.__ciudadVivaProjectTile(20,4));
  assert.ok(lock.visible,`${name}: el sector bloqueado queda visible desde la cámara inicial`);
  await page.mouse.click(lock.x,lock.y);
  const card=page.locator('.land-unlock-card');await card.waitFor();
  const copy=await card.innerText();assert.match(copy,/Zona construible bloqueada/);assert.match(copy,/64 parcelas nuevas/);assert.match(copy,/8 × 8 parcelas/);assert.ok(copy.includes('$ 3.500'),`${name}: precio inicial legible`);
  const bounds=await card.evaluate(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,scroll:el.scrollWidth,client:el.clientWidth}});
  assert.ok(bounds.left>=0&&bounds.right<=width&&bounds.top>=0&&bounds.bottom<=height,`${name}: ficha dentro del viewport ${JSON.stringify(bounds)}`);
  assert.ok(bounds.scroll<=bounds.client+3,`${name}: ficha sin desborde horizontal ${JSON.stringify(bounds)}`);
  await page.locator('[data-unlock-land]').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.getElementById('panelPopup')?.classList.contains('hidden'));
  await page.mouse.click(lock.x,lock.y);
  await page.locator('#popupTitle').filter({hasText:'Parcela seleccionada'}).waitFor();
  assert.equal(await page.locator('[data-unlock-land]').count(),0,`${name}: parcela comprada deja de mostrar compra`);
  assert.deepEqual(errors,[],`${name}: errores JavaScript`);await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
