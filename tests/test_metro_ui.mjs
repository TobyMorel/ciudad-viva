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
   city.roads=Array.from({length:11},(_,i)=>[i+4,10]);
   city.buildings=[{kind:'home',name:'Barrio Norte',x:5,y:9,status:'habilitado',capacity:28,occupants:0,residents:[]},
                   {kind:'shop',name:'Centro comercial',x:11,y:9,status:'habilitado',business:{status:'abierto',jobSlots:6,lastLocalSales:0}},
                   {kind:'powerPlant',name:'Central eléctrica',x:9,y:9,status:'habilitado',generationKw:900,quality:82}];
   city.projects=[];city.busRoutes=[];city.taxiRoutes=[];
   city.railStations=[
     {id:'station-metro-6-9',mode:'metro',x:6,y:9,name:'Subte Norte',status:'active',elapsed:42,duration:42,cost:6800},
     {id:'station-metro-12-9',mode:'metro',x:12,y:9,name:'Subte Sur',status:'active',elapsed:42,duration:42,cost:6800},
     {id:'station-elevated-6-11',mode:'elevated',x:6,y:11,name:'Elevada Norte',status:'active',elapsed:50,duration:50,cost:9400},
     {id:'station-elevated-13-11',mode:'elevated',x:13,y:11,name:'Elevada Sur',status:'active',elapsed:50,duration:50,cost:9400}
   ];
   city.metroLines=[
    {id:'metro-test',name:'Línea 1',stations:[[6,9],[12,9]],stationNames:['Subte Norte','Subte Sur'],route:Array.from({length:7},(_,i)=>[i+6,9]),status:'building',elapsed:0,duration:102,trainCount:1,mode:'metro'},
    {id:'rail-test',name:'Tren elevado 1',stations:[[6,11],[13,11]],stationNames:['Elevada Norte','Elevada Sur'],route:Array.from({length:8},(_,i)=>[i+6,10]),status:'building',elapsed:0,duration:106,trainCount:1,mode:'elevated'}
   ];
   localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city));
  });
  await page.locator('#offlineMode').evaluate(e=>e.click());
  await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),null,{timeout:30000});
  await page.locator('.game-dock [data-popup="city"]').evaluate(e=>e.click());
  await page.locator('#panelPopup:not(.hidden)').waitFor({timeout:12000});
  await page.locator('#popupContent [data-city-section-button="mobility"]').evaluate(e=>e.click());
  await page.locator('#popupContent .metro-panel:not(.rail-panel)').waitFor();
  const panel=await page.evaluate(()=>document.querySelector('#popupContent').innerText);
  assert.match(panel,/Subte Norte/);assert.match(panel,/Tren elevado 1/);
  assert.match(panel,/Construir/);
  assert.equal(await page.locator('[data-metro-build], [data-rail-build]').count(),0,'Movilidad no debe crear infraestructura por botones');
  await page.waitForFunction(()=>window.__ciudadVivaScene?.().physicalRailStations===4,null,{timeout:15000});
  const scene=await page.evaluate(()=>window.__ciudadVivaScene());
  assert.equal(scene.metroStations,2,name+': la infraestructura de subte existente conserva sus accesos');
  assert.equal(scene.metroTunnelSegments,0,name+': estudios sin excavación completa');
  assert.equal(scene.metroTrains,0,name+': sin tren antes de habilitar');
  assert.equal(scene.railTrains,0,name+': tren elevado sin inspeccionar');
  assert.equal(scene.railTracks,0,name+': vías elevadas sin construir');
  const layout=await page.evaluate(()=>{
   const root=document.querySelector('#popupContent .metro-panel');
   const r=root.getBoundingClientRect();
   return {width:r.width,overflow:root.scrollWidth-root.clientWidth,visible:root.textContent.includes('Línea 1')};
  });
  assert.ok(layout.width>0&&layout.overflow<=2&&layout.visible,name+': panel ferroviario legible '+JSON.stringify(layout));
  await page.locator('.game-dock [data-popup="build"]').evaluate(e=>e.click());
  await page.locator('#panelPopup:not(.hidden)').waitFor();
  for(const tool of ['metroStation','railStation','metroLink','railLink'])
   assert.equal(await page.locator('#popupContent .build-catalog-item[data-tool="'+tool+'"]').count(),1,name+': herramienta física '+tool);
  assert.deepEqual(errors,[],name+': errores JavaScript');
  await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
