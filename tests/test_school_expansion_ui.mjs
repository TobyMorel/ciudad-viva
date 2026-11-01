import {chromium} from 'playwright';
import {startUiTestServer} from './ui_test_server.mjs';
import assert from 'node:assert/strict';

const port=18769,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const {name,width,height} of [{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.paused=true;city.money=200000;city.buildings.push({kind:'school',serviceModel:'primarySchool',name:'Escuela del Parque',x:10,y:9,status:'habilitado',classrooms:4,jobSlots:12,monthlyCost:820,utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}});localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').click();await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
  await page.locator('[data-popup="city"]').evaluate(el=>el.click());await page.locator('[data-city-section-button="education"]').evaluate(el=>el.click());
  const card=page.locator('.school-capacity-card').filter({hasText:'Escuela del Parque'});await card.waitFor({state:'visible',timeout:15000});
  const layout=await card.evaluate(el=>{const r=el.getBoundingClientRect(),parts=[...el.children].map(c=>{const b=c.getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,scroll:c.scrollWidth,client:c.clientWidth,text:c.innerText}});return{left:r.left,right:r.right,width:r.width,scroll:el.scrollWidth,client:el.clientWidth,parts,text:el.innerText}});
  assert.ok(layout.left>=0&&layout.right<=width+2&&layout.scroll<=layout.client+3,`${name}: tarjeta escolar desbordada ${JSON.stringify(layout)}`);
  assert.ok(layout.parts.every(p=>p.width>0&&p.scroll<=p.client+3),`${name}: contenido recortado ${JSON.stringify(layout)}`);
  const pieces=layout.parts;assert.ok(pieces.every((a,i)=>pieces.slice(i+1).every(b=>Math.min(a.right,b.right)<=Math.max(a.left,b.left)+2||Math.min(a.bottom,b.bottom)<=Math.max(a.top,b.top)+2)),`${name}: textos de la tarjeta se solapan`);
  assert.doesNotMatch(layout.text,/Constructora|Sur Obras|Estudio y Obra Norte/,'la ampliación no debe pedir elegir empresa');assert.match(layout.text,/40–61 días estimados/);assert.match(layout.text,/vacantes docentes/);
  await card.locator('[data-school-expand]').click();
  await page.waitForFunction(()=>document.querySelector('.school-expansion-status')?.textContent.includes('Anexo en obra'),{timeout:10000});
  const status=await card.locator('.school-expansion-status').innerText();assert.match(status,/Anexo en obra/);
  assert.deepEqual(errors,[],`${name}: errores de interfaz`);await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
