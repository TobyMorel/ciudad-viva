import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn('python',['-m','http.server','18767','--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const {name,width,height} of [{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));let opened=false;
  for(let attempt=0;attempt<15&&!opened;attempt++){try{await page.goto('http://127.0.0.1:18767/',{waitUntil:'domcontentloaded',timeout:5000});opened=true}catch{await new Promise(r=>setTimeout(r,150))}}
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.paused=true;city.money=25000;localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').click();await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
  await page.locator('[data-popup="supply"]').click();await page.locator('#panelPopup:not(.hidden) .municipal-forecast').waitFor({timeout:12000});
  const summary=page.locator('.municipal-forecast > summary');await summary.click();
  const report=await page.locator('.municipal-forecast').evaluate(el=>{const r=el.getBoundingClientRect(),cards=[...el.querySelectorAll('.forecast-month')].map(c=>{const x=c.getBoundingClientRect();return {left:x.left,right:x.right,top:x.top,bottom:x.bottom,scroll:c.scrollWidth,client:c.clientWidth,text:c.innerText}});return {left:r.left,right:r.right,width:r.width,scroll:el.scrollWidth,client:el.clientWidth,cards,text:el.innerText}});
  assert.equal(report.cards.length,12,`${name}: deben verse los 12 meses`);assert.ok(report.scroll<=report.client+3,`${name}: desborde horizontal ${JSON.stringify(report)}`);
  assert.ok(report.cards.every(c=>c.scroll<=c.client+3&&c.left>=0&&c.right<=width+2),`${name}: tarjeta recortada/desbordada`);
  const boxes=report.cards.map(c=>c);assert.ok(boxes.every((a,i)=>boxes.slice(i+1).every(b=>Math.min(a.right,b.right)<=Math.max(a.left,b.left)+2||Math.min(a.bottom,b.bottom)<=Math.max(a.top,b.top)+2)),`${name}: tarjetas solapadas`);
  assert.deepEqual(errors,[],`${name}: errores de interfaz`);await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
