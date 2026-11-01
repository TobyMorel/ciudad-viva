import {chromium} from 'playwright';
import {startUiTestServer} from './ui_test_server.mjs';
import assert from 'node:assert/strict';

const port=18770,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const {name,width,height} of [{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.paused=true;city.money=200000;city.roads.push([11,4]);localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').click();await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});await page.evaluate(()=>window.requestAnimationFrame=()=>0);
  await page.locator('[data-popup="build"]').evaluate(el=>el.click());
  await page.locator('.tool[data-tool="civic"][data-model="clinic"]').evaluate(el=>el.click());
  const point=await page.evaluate(()=>{const p=window.__ciudadVivaProjectTile(12,4,0),r=document.querySelector('#city').getBoundingClientRect();return{...p,x:p.x+r.left,y:p.y+r.top}});assert.ok(point.visible,`${name}: parcela de prueba fuera de cámara`);
  await page.mouse.click(point.x,point.y);
  await page.locator('#bidBackdrop:not(.hidden)').waitFor({timeout:10000});
  const dialog=page.locator('#bidBackdrop');
  const text=await dialog.innerText();assert.match(text,/Consultorio barrial/);assert.match(text,/\$\s*8\.000/);assert.match(text,/PLAZO ESTIMADO/i);assert.match(text,/11 trabajadores/);assert.match(text,/Iniciar construcción/);
  const lifecycle=dialog.locator('.lifecycle-estimate');await lifecycle.locator('summary').click();const lifeText=await lifecycle.innerText();assert.match(lifeText,/ciclo de vida/i);assert.match(lifeText,/1 año/);assert.match(lifeText,/4 años/);assert.match(lifeText,/10 años/);assert.match(lifeText,/20 años/);assert.match(lifeText,/mantenimiento/i);assert.match(lifeText,/Operación no cuantificada/i);assert.match(lifeText,/no modifica la simulación/i);
  const caveat=await lifecycle.locator('.lifecycle-caveat').evaluate(el=>{const r=el.getBoundingClientRect(),m=el.closest('.bid-modal').getBoundingClientRect();return{top:r.top,bottom:r.bottom,modalTop:m.top,modalBottom:m.bottom,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}});if(caveat.bottom>caveat.modalBottom||caveat.top<caveat.modalTop)await dialog.locator('.bid-modal').evaluate(el=>el.scrollTop=el.scrollHeight);const visibleCaveat=await lifecycle.locator('.lifecycle-caveat').evaluate(el=>{const r=el.getBoundingClientRect(),m=el.closest('.bid-modal').getBoundingClientRect();return r.top>=m.top-1&&r.bottom<=m.bottom+1&&el.scrollWidth<=el.clientWidth+2});assert.ok(visibleCaveat,`${name}: detalle de ciclo de vida no se puede leer completo`);
  assert.doesNotMatch(text,/LICITACIÓN|Elegir constructora|Sur Obras|Constructora Delta|Estudio y Obra Norte/);
  const box=await dialog.locator('.bid-modal').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el),p=el.parentElement.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,scroll:el.scrollWidth,client:el.clientWidth,cssWidth:s.width,maxWidth:s.maxWidth,minWidth:s.minWidth,backdrop:{left:p.left,right:p.right,width:p.width,padding:getComputedStyle(el.parentElement).padding},innerWidth,clientWidth:document.documentElement.clientWidth}});
  assert.ok(box.left>=0&&box.right<=width+1&&box.top>=0&&box.bottom<=height+1&&box.scroll<=box.client+3,`${name}: ficha fuera de viewport ${JSON.stringify(box)}`);
  await dialog.locator('#bidConfirm').evaluate(el=>el.click());
  await page.waitForFunction(()=>[...document.querySelectorAll('#projects .project')].some(el=>el.textContent.includes('Consultorio barrial')),{timeout:15000});
  assert.deepEqual(errors,[],`${name}: errores JS`);await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
