import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18821,server=await startUiTestServer(port),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.money=100000;city.paused=true;city.buildings=[];city.projects=[];city.roads=Array.from({length:10},(_,i)=>[i+4,10]);localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').evaluate(button=>button.click());await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');await page.locator('#saveList button, #newSlotButton').first().evaluate(button=>button.click());await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.querySelector('#modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
  await page.locator('.game-dock [data-popup="build"]').evaluate(button=>button.click());
  const hospital=page.locator('.build-catalog-item[data-model="generalHospital"]');await hospital.scrollIntoViewIfNeeded();await hospital.hover();
  const tip=await page.locator('.build-help-popover:not([hidden])').innerText();assert.match(tip,/inmediatamente/);assert.doesNotMatch(tip,/Tiempo de obra/);
  await hospital.evaluate(button=>button.click());
  await page.waitForFunction(()=>window.__ciudadVivaProjectTile?.(14,10,.2)?.visible,{timeout:30000});const point=await page.evaluate(()=>{const p=window.__ciudadVivaProjectTile(14,10,.2),r=document.querySelector('#city').getBoundingClientRect();return{x:r.left+p.x,y:r.top+p.y,visible:p.visible,canvas:{left:r.left,top:r.top,width:r.width,height:r.height},project:p}});if(!point.visible){await page.screenshot({path:'work/instant-build-failure.png'});throw Error(`${viewport.width}x${viewport.height}: parcela fuera de c?mara ${JSON.stringify(point)}`)}
  await page.mouse.click(point.x,point.y);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).buildings.some(b=>b.serviceModel==='generalHospital'),{timeout:4000}).catch(async error=>{await page.screenshot({path:'work/instant-build-failure.png'});throw Error(`no se habilit? el hospital; aviso ${await page.locator('#toast').textContent().catch(()=>'(sin aviso)')} ? proyectos ${await page.evaluate(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).projects.map(p=>p.kind+':'+p.x+','+p.y).join('|'))} ? ${error.message}`)});
  const city=await page.evaluate(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')));assert.equal(city.money,74500);assert.equal(city.projects.length,0);
  const idleAmbulances=await page.evaluate(()=>window.__ciudadViva3D().filter(actor=>actor.type==='Ambulancia'));
  assert.equal(idleAmbulances.length,0,'No deben aparecer ambulancias sobre la calle solo por construir un hospital');
  assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('Hospital inmediato y tooltip sin plazo de obra verificados en Chromium mÃ³vil y escritorio.');
}finally{await browser.close();server.kill('SIGTERM')}
