import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18783,server=await startUiTestServer(port),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const {name,width,height} of [{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const state=await fetch('/offline_seed.json').then(r=>r.json());state.paused=true;state.roads=Array.from({length:9},(_,i)=>[4+i,10]);state.buildings=[{x:5,y:9,kind:'depot',serviceModel:'taxiYard',name:'Base Taxi Centro',status:'habilitado',taxiCapacity:4},{x:6,y:9,kind:'busGarage',name:'Depósito colectivo Oeste',status:'habilitado',busBayCapacity:4}];state.projects=[];state.busRoutes=[];state.taxiRoutes=[];state.commutes=[{mode:'car',reason:'trabajo',workers:2,vehicles:1,route:[[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10]],trafficFactor:1,roundTrip:true}];state.landClaims={chunkSize:8,unlockedChunks:['0,0','1,0','0,1','1,1'],expansionCount:0};localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(state))});
  await page.locator('#offlineMode').evaluate(button=>button.click());await page.waitForFunction(()=>document.querySelector('#modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
  await page.locator('.game-dock [data-popup="build"]').evaluate(button=>button.click());const drawer=page.locator('#panelPopup.build-drawer-open');await drawer.waitFor();await page.waitForTimeout(260);
  const layout=await drawer.evaluate(element=>{const r=element.querySelector('.popup-window').getBoundingClientRect(),grid=element.querySelector('.build-catalog-grid').getBoundingClientRect();return{bottom:Math.abs(innerHeight-r.bottom)<8,rect:{top:r.top,bottom:r.bottom,height:r.height,viewport:innerHeight},grid:{top:grid.top,bottom:grid.bottom},gridVisible:grid.width>0&&grid.height>0,overflow:document.documentElement.scrollWidth>innerWidth+2}});
  assert.ok(layout.bottom&&layout.gridVisible&&!layout.overflow,`${name}: la bandeja no está contenida abajo ${JSON.stringify(layout)}`);
  const thumbs=page.locator('.build-catalog-item:not([hidden]) .build-item-preview'),thumbCount=await thumbs.count();assert.ok(thumbCount>10,`${name}: el catálogo debe mostrar objetos`);
  await page.waitForTimeout(150);const sample=await thumbs.first().evaluate(canvas=>{const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let min=255,max=0,sum=0;for(let i=0;i<pixels.length;i+=4){min=Math.min(min,pixels[i]);max=Math.max(max,pixels[i]);sum+=pixels[i]}return{width:canvas.width,height:canvas.height,variation:max-min,mean:Math.round(sum/(pixels.length/4)),center:[...pixels.slice((50*canvas.width+72)*4,(50*canvas.width+72)*4+4)]}});
  assert.ok(sample.width>0&&sample.height>0&&sample.variation>20,`${name}: falta miniatura renderizada desde geometría 3D ${JSON.stringify(sample)}`);
  await page.locator('[data-build-filter="transport"]').click();
  for(const label of ['Depósito de colectivos','Depósito de taxis','Paradas de colectivo','Paradas de taxi'])assert.ok(await page.locator('.build-catalog-item:not([hidden]) b').allTextContents().then(rows=>rows.includes(label)),`${name}: falta ${label} en Transporte`);
  const taxiStop=page.locator('.build-catalog-item[data-tool="taxiStop"]');await taxiStop.scrollIntoViewIfNeeded();await taxiStop.hover();
  const tooltip=page.locator('.build-help-popover:not([hidden])'),tipStructure=await tooltip.evaluate(element=>({paragraph:element.querySelector('p')?.textContent||'',items:[...element.querySelectorAll('li')].map(li=>li.textContent),paragraphFirst:element.querySelector('p')?.compareDocumentPosition(element.querySelector('ul'))===Node.DOCUMENT_POSITION_FOLLOWING}));
  assert.ok(tipStructure.paragraph.length>25&&tipStructure.items.some(text=>text.includes('$ 220'))&&tipStructure.paragraphFirst,`${name}: descripción y detalles no están separados ${JSON.stringify(tipStructure)}`);
  await taxiStop.evaluate(button=>button.click());assert.ok(await page.locator('#panelPopup').evaluate(element=>element.classList.contains('hidden')));
  const depotPoint=await page.evaluate(()=>{const point=window.__ciudadVivaProjectTile(5,9,.2),r=document.querySelector('#city').getBoundingClientRect();return{x:r.left+point.x,y:r.top+point.y}});await page.mouse.click(depotPoint.x,depotPoint.y);await page.waitForFunction(()=>document.querySelector('#busRouteComposer')?.textContent?.includes('Diseñando circuito'),{timeout:10000});
  assert.ok((await page.locator('#busRouteComposer').innerText()).includes('Base Taxi Centro')|| (await page.locator('#busRouteComposer').innerText()).includes('depósito 6,10'),`${name}: el botón de paradas de taxi debe abrir el editor de circuito`);
  await page.locator('[data-bus-draft="cancel"]').click();
  await page.locator('.game-dock [data-popup="build"]').evaluate(button=>button.click());await page.locator('[data-build-filter="services"]').click();
  await page.locator('.build-catalog-item[data-tool="civic"][data-model="clinic"]').evaluate(button=>button.click());
  const first=await page.evaluate(()=>{const p=window.__ciudadVivaProjectTile(4,9,.1),r=document.querySelector('#city').getBoundingClientRect();return{x:r.left+p.x,y:r.top+p.y}});await page.mouse.move(first.x,first.y);await page.waitForTimeout(100);
  const second=await page.evaluate(()=>{const p=window.__ciudadVivaProjectTile(5,9,.1),r=document.querySelector('#city').getBoundingClientRect();return{x:r.left+p.x,y:r.top+p.y}});await page.mouse.move(second.x,second.y);await page.waitForTimeout(100);
  const covered=await page.evaluate(()=>window.__ciudadVivaCoverage(4,9,'clinic').map(tile=>({x:Math.round(tile.x/2-.5),y:Math.round(tile.z/2-.5),width:tile.width})));
  assert.equal(covered.length,6,`${name}: cada tramo conectado dentro del radio debe colorearse · ${JSON.stringify(covered)}`);assert.ok(covered.every(tile=>tile.width>=1.8),`${name}: la cobertura debe llenar cada tramo vial`);
  assert.deepEqual(errors,[],`${name}: errores JavaScript ${errors.join('; ')}`);await page.close();
 }
 console.log('Catálogo de construcción: Chromium pasó a 390×844 y 1440×900; vistas 3D, filtros, detalle, depósitos, paradas y cobertura completa verificados.');
}finally{await browser.close();server.kill('SIGTERM')}
