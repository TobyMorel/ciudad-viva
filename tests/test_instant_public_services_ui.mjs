import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18821,server=await startUiTestServer(port),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.money=100000;city.paused=true;city.buildings=[];city.projects=[];city.roads=[[4,10]];localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').evaluate(button=>button.click());await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.querySelector('#modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
  await page.locator('.game-dock [data-popup="build"]').evaluate(button=>button.click());
  const hospital=page.locator('.build-catalog-item[data-model="generalHospital"]');await hospital.scrollIntoViewIfNeeded();await hospital.hover();
  const tip=await page.locator('.build-help-popover:not([hidden])').innerText();assert.match(tip,/inmediatamente/);assert.doesNotMatch(tip,/Tiempo de obra/);
  await hospital.evaluate(button=>button.click());
  const point=await page.evaluate(()=>{const p=window.__ciudadVivaProjectTile(5,10),r=document.querySelector('#city').getBoundingClientRect();return{x:r.left+p.x,y:r.top+p.y,visible:p.visible}});assert.ok(point.visible);
  await page.mouse.click(point.x,point.y);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).buildings.some(b=>b.serviceModel==='generalHospital'),{timeout:12000});
  const city=await page.evaluate(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')));assert.equal(city.money,74500);assert.equal(city.projects.length,0);assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('Hospital inmediato y tooltip sin plazo de obra verificados en Chromium móvil y escritorio.');
}finally{await browser.close();server.kill('SIGTERM')}
