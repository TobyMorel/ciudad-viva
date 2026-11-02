import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18781,server=await startUiTestServer(port),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const {name,width,height} of [{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.paused=true;city.roads=Array.from({length:8},(_,i)=>[4+i,10]);city.buildings=[{x:5,y:9,kind:'busGarage',name:'Depósito Norte',status:'habilitado',busBayCapacity:4}];city.busRoutes=[];city.projects=[];city.landClaims={chunkSize:8,unlockedChunks:['0,0','1,0','0,1','1,1'],expansionCount:0};localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').evaluate(el=>el.click());await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
  await page.locator('.game-dock').waitFor({timeout:30000});await page.locator('.game-dock [data-popup="city"]').evaluate(el=>el.click());await page.locator('#panelPopup:not(.hidden)').waitFor();await page.locator('#popupContent [data-city-section-button="mobility"]').evaluate(el=>el.click());const garages=page.locator('#popupContent .bus-panel .bus-garages');await garages.locator('summary').click();await page.locator('#popupContent [data-bus-route-design="5,9"]').evaluate(el=>el.click());
  const composer=page.locator('#busRouteComposer'),world=page.locator('.world-wrap');assert.ok(await composer.isVisible(),`${name}: debe aparecer el diseñador`);
  for(const [x,y,index] of [[7,10,1],[9,10,2]]){const point=await page.evaluate(([tx,ty])=>{const p=window.__ciudadVivaProjectTile(tx,ty,.2),canvas=document.querySelector('#city').getBoundingClientRect();return{x:canvas.left+p.x,y:canvas.top+p.y,visible:p.visible}},[x,y]);assert.ok(point.visible,`${name}: la calle ${x},${y} tiene que entrar en cámara`);await page.mouse.click(point.x,point.y);await page.waitForFunction(n=>document.querySelectorAll('#busRouteMarkers .bus-route-marker').length===n,index);assert.equal(await page.locator('#busRouteMarkers .bus-route-marker').nth(index-1).innerText(),String(index))}
  const box=await composer.boundingBox(),bounds=await world.boundingBox();assert.ok(box&&bounds&&box.x>=bounds.x&&box.x+box.width<=bounds.x+bounds.width+1&&box.y>=bounds.y&&box.y+box.height<=bounds.y+bounds.height+1,`${name}: controles fuera del mapa`);
  await composer.locator('[data-bus-draft="finish"]').evaluate(el=>el.click());await page.waitForFunction(()=>document.querySelector('.bus-lines')?.textContent?.includes('Depósito Norte'),{timeout:15000});assert.ok(await page.locator('#busRouteMarkers').evaluate(x=>x.hidden),`${name}: los marcadores de edición deben retirarse al publicar la ruta`);assert.deepEqual(errors,[],`${name}: errores JavaScript`);await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
