import {chromium} from 'playwright';
import {startUiTestServer} from './ui_test_server.mjs';
import assert from 'node:assert/strict';

const port=18778,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const {name,width,height} of [{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.paused=true;city.money=200000;city.roads.push([11,4],[14,4]);localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').click();await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});await page.evaluate(()=>window.requestAnimationFrame=()=>0);
  await page.locator('[data-popup="build"]').evaluate(el=>el.click());
  const clinic=page.locator('.tool[data-tool="civic"][data-model="clinic"]');
  await clinic.hover();const help=page.locator('.build-help-popover');await help.waitFor();assert.match(await help.innerText(),/Consultorio barrial/);assert.match(await help.innerText(),/8\.000/);assert.match(await help.innerText(),/asigna automáticamente/i);const helpBox=await help.boundingBox();assert.ok(helpBox&&helpBox.x>=0&&helpBox.y>=0&&helpBox.x+helpBox.width<=width+1&&helpBox.y+helpBox.height<=height+1,`${name}: ayuda fuera de pantalla ${JSON.stringify(helpBox)}`);assert.match(await help.innerText(),/días de obra/);assert.match(await help.innerText(),/trabajadores/);assert.match(await help.innerText(),/Ciclo de vida orientativo/);assert.match(await help.innerText(),/20 a\. \$/);assert.match(await help.innerText(),/no modifica la simulación/i);
  await clinic.evaluate(el=>el.click());
  for(const [x,y] of [[12,4],[13,4]]){const point=await page.evaluate(([x,y])=>{const p=window.__ciudadVivaProjectTile(x,y,0),r=document.querySelector('#city').getBoundingClientRect();return{...p,x:p.x+r.left,y:p.y+r.top}},[x,y]);assert.ok(point.visible,`${name}: parcela de prueba fuera de cámara`);await page.mouse.click(point.x,point.y)}
  await page.waitForFunction(()=>[...document.querySelectorAll('#projects .project')].filter(el=>el.textContent.includes('Consultorio barrial')).length===2,{timeout:15000});
  assert.equal(await page.locator('#bidBackdrop').count(),0,`${name}: no debe existir el diálogo repetitivo de obra`);
  assert.equal(await clinic.evaluate(el=>el.classList.contains('active')),true,`${name}: herramienta permanece lista para colocar otra obra`);
  assert.deepEqual(errors,[],`${name}: errores JS`);await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
