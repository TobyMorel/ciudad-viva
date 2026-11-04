import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18790,server=await startUiTestServer(port),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.paused=true;city.buildings.push({kind:'school',serviceModel:'university',name:'Universidad experimental',x:10,y:11,status:'habilitado',classrooms:8,jobSlots:30,utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}});localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
 await page.locator('#offlineMode').click();await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');await page.locator('#saveList button, #newSlotButton').first().evaluate(button=>button.click());await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
 await page.waitForFunction(()=>window.__ciudadVivaVehicles?.().some(actor=>actor.title==='Estudiantes en camino'&&actor.routeLength>1),{timeout:30000});
 const actors=await page.evaluate(()=>window.__ciudadVivaVehicles().filter(actor=>actor.title==='Estudiantes en camino'));
 assert.ok(actors.length>0,'los estudiantes matriculados deben tener peatones o autos animados sobre rutas');
 assert.ok(actors.every(actor=>actor.routeLength>1),'cada actor escolar debe tener una ruta vial');
 await page.locator('.game-dock [data-popup="city"]').evaluate(element=>element.click());
 await page.locator('#cityReportRail [data-city-report="mobility"]').evaluate(element=>element.click());
 const mobility=await page.locator('#popupContent .bus-mode-hint').innerText();
 assert.match(mobility,/Escuela:.*estudiantes/,'Movilidad debe resumir la asistencia escolar y sus trayectos');
 assert.deepEqual(errors,[],'la escena no debe producir errores JavaScript');
 await page.close();
}finally{await browser.close();server.kill('SIGTERM')}
