import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const server=await startUiTestServer(18797);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const {name,width,height} of [{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:18797/',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
   const city=await fetch('/offline_seed.json').then(r=>r.json());
   city.paused=true;city.money=120000;city.jobs=30;
   city.roads=Array.from({length:9},(_,i)=>[i+4,10]);
   city.buildings=[{kind:'home',name:'Barrio Norte',x:5,y:9,status:'habilitado',capacity:28,occupants:0,residents:[]},
                   {kind:'shop',name:'Centro comercial',x:11,y:9,status:'habilitado',business:{status:'abierto',jobSlots:6,lastLocalSales:0}},
                   {kind:'powerPlant',name:'Central eléctrica',x:9,y:9,status:'habilitado',generationKw:900,quality:82}];
   city.projects=[];city.busRoutes=[];city.taxiRoutes=[];city.metroLines=[];
   localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city));
  });
  await page.locator('#offlineMode').evaluate(e=>e.click());
  await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),null,{timeout:30000});
  await page.locator('.game-dock [data-popup="city"]').evaluate(e=>e.click());
  await page.locator('#panelPopup:not(.hidden)').waitFor({timeout:12000});
  await page.locator('#popupContent [data-city-section-button="mobility"]').evaluate(e=>e.click());
  await page.locator('#popupContent .metro-panel').waitFor();
  await page.locator('[data-metro-from]').selectOption('5,9');
  await page.locator('[data-metro-to]').selectOption('11,9');
  await page.locator('[data-metro-build]').evaluate(e=>e.click());
  await page.waitForFunction(()=>document.querySelector('#popupContent .metro-line')?.textContent?.includes('En obra'),null,{timeout:15000});
  await page.locator('[data-rail-from]').selectOption('5,9');
  await page.locator('[data-rail-to]').selectOption('11,9');
  await page.locator('[data-rail-build]').evaluate(e=>e.click());
  await page.waitForFunction(()=>document.querySelector('.rail-panel .metro-line')?.textContent?.includes('En obra'),null,{timeout:15000});
  const railDisplay=await page.evaluate(()=>({scene:window.__ciudadVivaScene?.(),panel:document.querySelector('.rail-panel')?.innerText||''}));
  assert.ok(railDisplay.scene&&railDisplay.scene.railTrains===0&&railDisplay.scene.railTracks===0,
    name+': el tren en obra no debe aparecer habilitado '+JSON.stringify(railDisplay.scene));
  assert.match(railDisplay.panel,/Tren elevado 1/);

  // La obra nueva marca dos estaciones, pero los estudios aún no han excavado.
  await page.waitForFunction(()=>window.__ciudadVivaScene?.().metroStations===2,null,{timeout:15000});
  const scene=await page.evaluate(()=>window.__ciudadVivaScene());
  assert.equal(scene.metroTunnelSegments,0,name+': los estudios no dibujan túneles terminados');
  assert.equal(scene.metroTrains,0,name+': no circulan trenes antes de la habilitación');
  const layout=await page.evaluate(()=>{
   const root=document.querySelector('#popupContent .metro-panel');
   const r=root.getBoundingClientRect(),controls=[...root.querySelectorAll('.metro-build label,.metro-build button')].map(el=>el.getBoundingClientRect());
   const texts=[...root.querySelectorAll('p,small,.metro-line b,.metro-line span')].filter(el=>el.getBoundingClientRect().height>0);
   const within=rect=>rect.left>=r.left-3&&rect.right<=r.right+3&&rect.width>0;
   return{rootWidth:r.width,panelOverflow:root.scrollWidth-root.clientWidth,controlsWithin:controls.every(within),
    textOverflow:texts.filter(el=>el.scrollWidth>el.clientWidth+3).map(el=>el.textContent.slice(0,75)),
    controlsOverlap:controls.some((a,i)=>controls.slice(i+1).some(b=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)),
    lineVisible:root.textContent.includes('Línea 1')};
  });
  assert.ok(layout.rootWidth>0&&layout.panelOverflow<=2&&layout.controlsWithin&&!layout.textOverflow.length&&!layout.controlsOverlap&&layout.lineVisible,
    name+': interfaz del subte con controles o textos superpuestos '+JSON.stringify(layout));
  assert.deepEqual(errors,[],name+': errores JavaScript');
  await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
