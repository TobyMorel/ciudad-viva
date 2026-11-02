import {chromium} from 'playwright';
import {startUiTestServer} from './ui_test_server.mjs';
import assert from 'node:assert/strict';

const server=await startUiTestServer(18766);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport});
  await page.goto('http://127.0.0.1:18766/',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
   const city=await fetch('/offline_seed.json').then(r=>r.json());
   city.paused=true;city.newSettlement=true;city.police={lastProcessedMonth:1,recentIncidents:[{id:'camera-pin-test',day:city.day,x:10,y:10,location:'Prueba de cámara',status:'atendido',station:'Comisaría',route:[[10,10],[10,9]]}]};
   localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city));
  });
  await page.locator('#offlineMode').click();
  await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'));
  await page.waitForFunction(()=>document.getElementById('netLabel')?.textContent.includes('Partida offline'));
  const pin=page.locator('[data-city-alert="camera-pin-test"]');
  await pin.waitFor({state:'visible',timeout:10000});
  const initial=await pin.evaluate(e=>({left:e.style.left,top:e.style.top}));
  const canvas=page.locator('#city'),box=await canvas.boundingBox();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.62,box.y+box.height*.57,{steps:8});
  await page.waitForFunction(({id,initial})=>{const e=document.querySelector(`[data-city-alert="${id}"]`);return e&&(e.style.left!==initial.left||e.style.top!==initial.top)},{id:'camera-pin-test',initial});
  const duringDrag=await pin.evaluate(e=>({left:e.style.left,top:e.style.top}));
  assert.notDeepEqual(duringDrag,initial,`${viewport.width}px: el icono debe seguir el arrastre antes de soltar`);
  await page.mouse.up();
  const beforeZoom=await pin.evaluate(e=>({left:e.style.left,top:e.style.top}));
  await page.locator('#zoomIn').click();
  await page.waitForFunction(({id,beforeZoom})=>{const e=document.querySelector(`[data-city-alert="${id}"]`);return e&&(e.style.left!==beforeZoom.left||e.style.top!==beforeZoom.top)},{id:'camera-pin-test',beforeZoom});
  const afterZoom=await pin.evaluate(e=>({left:e.style.left,top:e.style.top}));
  assert.notDeepEqual(afterZoom,beforeZoom,`${viewport.width}px: el icono debe seguir el zoom`);
  await page.close();
 }
}finally{await browser.close();server.kill()}
