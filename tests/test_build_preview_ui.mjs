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
  await clinic.hover();const help=page.locator('.build-help-popover');await help.waitFor();assert.match(await help.innerText(),/Consultorio barrial/);assert.match(await help.innerText(),/Servicio público con personal/);assert.match(await help.innerText(),/Costo de colocación: \$ 8\.000/);assert.match(await help.innerText(),/Alcance vial: 6 tramos conectados/);assert.match(await help.innerText(),/Tiempo de obra estimado: \d+ días/);assert.doesNotMatch(await help.innerText(),/seleccionar empresa|licitación|materiales/i);const helpBox=await help.boundingBox();assert.ok(helpBox&&helpBox.x>=0&&helpBox.y>=0&&helpBox.x+helpBox.width<=width+1&&helpBox.y+helpBox.height<=height+1,`${name}: ayuda fuera de pantalla ${JSON.stringify(helpBox)}`);
  await clinic.evaluate(el=>el.click());
  for(const [x,y] of [[12,4],[13,4]]){const point=await page.evaluate(([x,y])=>{const p=window.__ciudadVivaProjectTile(x,y,0),r=document.querySelector('#city').getBoundingClientRect();return{...p,x:p.x+r.left,y:p.y+r.top}},[x,y]);assert.ok(point.visible,`${name}: parcela de prueba fuera de cámara`);await page.mouse.click(point.x,point.y)}
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).projects.filter(p=>p.label==='Consultorio barrial').length===2,{timeout:15000});
  assert.equal(await page.locator('#bidBackdrop').count(),0,`${name}: no debe existir el diálogo repetitivo de obra`);assert.doesNotMatch(await page.locator('#toast').innerText(),/Cannot read properties of undefined.*map/i,`${name}: construir una obra no debe disparar error de render`);
  assert.equal(await clinic.evaluate(el=>el.classList.contains('active')),true,`${name}: herramienta permanece lista para colocar otra obra`);
  await page.locator('[data-popup="build"]').click();const roadTool=page.locator('.tool[data-tool="road"]');await roadTool.hover();assert.match(await help.innerText(),/\$ 1\.200 por tramo/);assert.match(await help.innerText(),/instantánea/i);assert.doesNotMatch(await help.innerText(),/cuadrilla|trabajadores|días de obra|empresa se asigna/i,`${name}: la calle no debe mostrar requisitos de obra`);await roadTool.click();
  const moneyBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).money);
  for(const [x,y] of [[13,5],[14,5]]){const point=await page.evaluate(([x,y])=>{const p=window.__ciudadVivaProjectTile(x,y,0),r=document.querySelector('#city').getBoundingClientRect();return{...p,x:p.x+r.left,y:p.y+r.top}},[x,y]);assert.ok(point.visible,`${name}: tramo de calle fuera de cámara`);await page.mouse.click(point.x,point.y)}
  await page.waitForFunction(()=>{const city=JSON.parse(localStorage.getItem('ciudad-viva-offline-v1'));return city.roads.some(([x,y])=>x===13&&y===5)&&city.roads.some(([x,y])=>x===14&&y===5)},{timeout:10000});
  const roadResult=await page.evaluate(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')));assert.equal(roadResult.money,moneyBefore-2400,`${name}: cobra una vez por cada tramo`);assert.equal(roadResult.projects.filter(project=>project.kind==='road').length,0,`${name}: no crea proyectos/animaciones viales`);assert.equal(await page.locator('#bidBackdrop').count(),0,`${name}: los clics viales no abren popup`);assert.equal(await roadTool.evaluate(el=>el.classList.contains('active')),true,`${name}: se pueden seguir colocando tramos`);
  assert.deepEqual(errors,[],`${name}: errores JS`);await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
