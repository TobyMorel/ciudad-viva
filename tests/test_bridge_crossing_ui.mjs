import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18822,server=await startUiTestServer(port),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.money=100000;city.paused=true;city.roads=Array.from({length:20},(_,i)=>[i+4,10]);city.roadAssets=[];city.buildings=[];city.projects=[];city.landClaims={chunkSize:8,unlockedChunks:['0,0','1,0','0,1','1,1','2,1','3,1'],expansionCount:2};localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').evaluate(button=>button.click());await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');await page.locator('#saveList button, #newSlotButton').first().evaluate(button=>button.click());await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.querySelector('#modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
  for(let i=0;i<4;i++)await page.locator('#zoomOut').evaluate(button=>button.click());
  await page.locator('.game-dock [data-popup="build"]').evaluate(button=>button.click());await page.locator('[data-build-filter="terrain"]').evaluate(button=>button.click());
  const bridge=page.locator('.build-catalog-item[data-tool="bridge"]');await bridge.scrollIntoViewIfNeeded();await bridge.evaluate(button=>button.click());
  async function place(x){const point=await page.evaluate(x=>{const p=window.__ciudadVivaProjectTile(x,10),r=document.querySelector('#city').getBoundingClientRect();return{x:r.left+p.x,y:r.top+p.y,visible:p.visible}},x);assert.ok(point.visible,`${viewport.width}px: tramo ${x} visible`);await page.mouse.click(point.x,point.y);await page.waitForFunction(x=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).roadAssets.some(a=>a.x===x&&a.y===10&&a.bridge),x,{timeout:12000})}
  await place(24);await place(25);
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')));assert.equal(state.money,93600);assert.equal(state.roadAssets.filter(a=>a.bridge).length,2);assert.ok((await page.evaluate(()=>window.__ciudadVivaScene())).dynamicObjects>0);assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('Puente visible y dos tramos colocados desde Construir en Chromium móvil y escritorio.');
}finally{await browser.close();server.kill('SIGTERM')}
