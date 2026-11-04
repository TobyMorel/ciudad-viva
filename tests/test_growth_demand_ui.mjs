import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18796,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
  const city=await fetch('/offline_seed.json').then(r=>r.json());
  city.newSettlement=true;city.day=28;city.population=252;city.paused=true;city.housingDemand={unmet:700,lastGenerated:14,lastFilled:0};
  city.buildings=[{kind:'home',name:'Viviendas nuevas',x:5,y:9,status:'operativo',capacity:28,occupants:0,residents:[],quality:80},
    {kind:'shop',name:'Local sin demanda insatisfecha',x:6,y:9,status:'operativo',business:{status:'abierto',lastLocalDemand:5,lastLocalSales:5,lastRegionalDemand:0,lastRegionalSales:0}}];
  city.roads=[[4,10],[5,10],[6,10]];city.projects=[];city.busRoutes=[];city.taxiRoutes=[];
  localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city));
 });
 await page.locator('#offlineMode').evaluate(e=>e.click());await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');await page.locator('#saveList button, #newSlotButton').first().evaluate(button=>button.click());
 await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.getElementById('modeBackdrop')?.classList.contains('hidden'),null,{timeout:30000});
 await page.waitForFunction(()=>document.querySelector('[data-growth="housing"] .growth-demand-item')||document.querySelector('[data-growth="housing"] .growth-demand-percent')?.textContent==='0%',null,{timeout:15000});
 const home=page.locator('[data-growth="housing"]'),shop=page.locator('[data-growth="commercial"]');
 assert.equal(await home.locator('.growth-demand-percent').innerText(),'0%');
 assert.match(await home.locator('small').innerText(),/28 libres/);
 assert.equal(await shop.locator('.growth-demand-percent').innerText(),'0%');
 assert.match(await home.getAttribute('title'),/28 plazas de vivienda disponibles/);
 await browser.close();
}finally{
 if(browser.isConnected())await browser.close();
 server.kill('SIGTERM');
}
