import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const server=await startUiTestServer(18799);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const size of [{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width:size.width,height:size.height}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:18799/',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
   const city=await fetch('/offline_seed.json').then(r=>r.json());
   city.newSettlement=true;city.money=90000;city.day=1;city.paused=true;city.population=12;
   city.roads=Array.from({length:9},(_,i)=>[i+4,10]);
   city.roadAssets=[];city.projects=[];city.abandoned=[];city.metroLines=[];city.railStations=[];
   city.buildings=[{x:6,y:9,name:'Barrio sin servicios',kind:'home',status:'habilitado',occupants:12,capacity:28,residents:[],quality:82}];
   for(const k of ['powerLines','waterPipes','gasLines','telecomLines'])city.utilities[k]=city.roads.map(p=>[...p]);
   city.utilities.failures=[];
   localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city));
  });
  await page.locator('#offlineMode').evaluate(e=>e.click());
  await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),null,{timeout:30000});
  await page.locator('.city-alert-pin.city-alert-service').waitFor({state:'visible',timeout:30000});
  const scene=await page.evaluate(()=>window.__ciudadVivaScene());
  assert.equal(scene.illuminatedStreetlights,0,size.name+': sin central eléctrica las farolas deben estar apagadas');
  const pin=page.locator('.city-alert-pin.city-alert-service');
  assert.equal(await pin.count(),1,size.name+': la casa debe tener un único icono interactivo');
  await pin.evaluate(element=>element.click());
  const needs=await page.locator('#popupContent').innerText();
  for(const service of ['Electricidad','Agua','Gas','TV por cable','Internet y Wi-Fi'])assert.match(needs,new RegExp(service),size.name+': el panel enumera '+service);
  await page.locator('#popupClose').click();
  await page.locator('.game-dock [data-popup="build"]').evaluate(e=>e.click());
  await page.locator('#panelPopup:not(.hidden)').waitFor();
  assert.equal(await page.locator('#popupContent .build-catalog-item[data-model="tvHeadend"]').count(),1);
  assert.equal(await page.locator('#popupContent .build-catalog-item[data-model="wifiHub"]').count(),1);
  await page.locator('.game-dock [data-popup="city"]').evaluate(e=>e.click());
  await page.locator('#cityReportRail [data-city-report="utilities"]').evaluate(e=>e.click());
  const summary=await page.locator('#popupContent').innerText();
  assert.match(summary,/CAPACIDAD REAL DE CENTRALES CONSTRUIDAS/);
  assert.match(summary,/Internet\/Wi-Fi/i);
  assert.match(summary,/0 edificios|0\s*\/\s*0/);
  assert.deepEqual(errors,[],size.name+': sin errores JavaScript');
  await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
