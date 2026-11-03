import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18765,server=await startUiTestServer(port),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(response=>response.json());city.paused=true;localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').evaluate(button=>button.click());
  await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
  await page.locator('.game-dock').waitFor({state:'visible',timeout:30000});
  const layout=await page.evaluate(()=>{const dock=document.querySelector('.game-dock').getBoundingClientRect(),rail=document.querySelector('#cityReportRail'),railRect=rail.getBoundingClientRect(),date=document.querySelector('#mapDate'),body=document.body;return{pageWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,dock:{left:dock.left,right:dock.right,top:dock.top,bottom:dock.bottom,width:dock.width,height:dock.height},dockInside:dock.left>=-1&&dock.right<=innerWidth+1&&dock.top>=-1&&dock.bottom<=innerHeight+1,rail:{visible:railRect.width>0&&railRect.height>0,count:rail.querySelectorAll('[data-city-report]').length,inside:railRect.left>=0&&railRect.right<=innerWidth+1},date:date.textContent.trim(),hasTimeControl:body.querySelector('.game-dock .time-controls')?.textContent.trim()||''}});
  assert.ok(layout.pageWidth<=layout.viewportWidth+2,`${viewport.width}: desborde horizontal ${JSON.stringify(layout)}`);
  assert.ok(layout.dockInside&&layout.dock.height>0,`${viewport.width}: barra principal fuera del viewport ${JSON.stringify(layout)}`);
  assert.ok(layout.rail.visible&&layout.rail.count>=15&&layout.rail.inside,`${viewport.width}: barra de informes ausente o fuera de pantalla ${JSON.stringify(layout)}`);
  assert.match(layout.date,/A\u00f1o\s+\d+.*Enero.*D\u00eda\s+\d+/i,`${viewport.width}: fecha debe mostrar a?o, mes y d?a`);
  assert.equal(await page.locator('[data-popup="guide"]').count(),0,'la ayuda retirada no debe volver a aparecer');
  await page.locator('#cityReportRail [data-city-report="summary"]').evaluate(button=>button.click());
  await page.locator('#panelPopup:not(.hidden) .report-dashboard[data-report="summary"]').waitFor({timeout:10000});
  assert.deepEqual(errors,[],`${viewport.width}: errores de JavaScript ${errors.join('; ')}`);
  await page.close();
 }
 console.log('Interfaz principal y barra de informes verificadas en m?vil y escritorio.');
}finally{await browser.close();server.kill('SIGTERM')}
