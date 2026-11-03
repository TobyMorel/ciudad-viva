import {chromium} from 'playwright';
import {startUiTestServer} from './ui_test_server.mjs';
import assert from 'node:assert/strict';
const server=await startUiTestServer(18766);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const {name,width,height} of [{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:18766/',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.paused=true;city.utilities=city.utilities||{};city.utilities.failures=[{id:'ui-outage',network:'power',x:8,y:10,day:12,reason:'daño de red',repairCost:500,affectedBuildings:4,status:'avería',remainingDays:0}];localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').click();await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
  await page.locator('[data-popup="city"]').click();await page.locator('#panelPopup:not(.hidden)').waitFor({timeout:10000});
  await page.locator('#cityReportRail [data-city-report=\"utilities\"]').evaluate(button=>button.click());
  const panel=page.locator('[data-city-section="utilities"]');await page.waitForFunction(()=>!document.querySelector('[data-city-section="utilities"]')?.hidden);
  const card=panel.locator('.workplace').filter({hasText:'calle 9, 11'}).first();await card.waitFor({state:'visible',timeout:10000});
  const result=await card.evaluate((el,viewportWidth)=>{const buttons=[...el.querySelectorAll('[data-repair-utility]')],rects=buttons.map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,disabled:b.disabled,scroll:b.scrollWidth,client:b.clientWidth,title:b.title}});const overlap=rects.some((r,i)=>rects.slice(i+1).some(t=>Math.min(r.right,t.right)-Math.max(r.left,t.left)>3&&Math.min(r.bottom,t.bottom)-Math.max(r.top,t.top)>3));return {buttons:rects,overlap,text:el.textContent}},width);
  assert.equal(result.buttons.length,2,`${name}: deben ofrecer reparación normal y urgente`);
  assert.ok(result.buttons.every(b=>b.width>45&&b.height>22&&b.left>=0&&b.right<=width+2&&b.scroll<=b.client+3),`${name}: botones cortados ${JSON.stringify(result.buttons)}`);
  assert.equal(result.overlap,false,`${name}: botones solapados`);assert.equal(result.buttons[1].disabled,false,`${name}: ruta conectada no habilitó urgencia`);
  assert.ok(result.text.includes('$1.000')&&result.text.includes('1 día')&&result.text.includes('3 días'),`${name}: costo y plazos no están explicados`);
  assert.deepEqual(errors,[],`${name}: errores JS ${errors.join('; ')}`);await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
