import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';
const port=18951,server=await startUiTestServer(port),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(response=>response.json());city.paused=true;city.money=10000;city.projects=[];city.buildings=[{id:'home-14-10',x:14,y:10,kind:'home',name:'Casa del Parque',quality:82,ownerType:'private',occupants:0,residents:[]}];city.landClaims={chunkSize:8,unlockedChunks:['0,0','1,0','0,1','1,1'],expansionCount:0,chunkTitles:{},parcelDeeds:{},registryVersion:1};localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
 await page.locator('#offlineMode').evaluate(button=>button.click());await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');await page.locator('#saveList button, #newSlotButton').first().evaluate(button=>button.click());await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.querySelector('#modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
 const point=await page.evaluate(()=>window.__ciudadVivaProjectTile(14,10,.2)),canvas=await page.locator('#city').boundingBox();assert.ok(point.visible);await page.mouse.click(canvas.x+point.x,canvas.y+point.y);
 const card=page.locator('#popupContent .property-transfer');await card.waitFor();assert.match(await card.innerText(),/Tasación estimada:.*4\.200/s);await card.locator('[data-acquire-property]').evaluate(button=>button.click());
 await page.waitForFunction(()=>{const city=JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')),deed=city.landClaims.parcelDeeds['14,10'];return deed?.ownerType==='municipal'&&deed.transferHistory?.length===1});await page.waitForFunction(()=>document.querySelector('#popupContent')?.innerText.includes('HISTORIAL DE TITULARIDAD'));assert.match(await page.locator('#popupContent').innerText(),/HISTORIAL DE TITULARIDAD/);assert.deepEqual(errors,[]);
 console.log('Ficha de compraventa, compra y titularidad actualizada verificadas en Chromium.');
}finally{await browser.close();server.kill('SIGTERM')}
