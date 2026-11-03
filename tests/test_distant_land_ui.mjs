import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18949,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(20000);const errors=[],failedRequests=[],badResponses=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});page.on('requestfailed',r=>failedRequests.push({url:r.url(),error:r.failure()?.errorText||'request failed'}));page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()})});page.on('dialog',d=>d.accept());
 await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
 await page.locator('#offlineMode').evaluate(el=>el.click());
 try{await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.getElementById('modeBackdrop')?.classList.contains('hidden'),undefined,{timeout:60000})}catch(error){const boot=await page.evaluate(()=>({mode:window.__ciudadVivaMode?.(),modeType:typeof window.__ciudadVivaMode,backdrop:document.getElementById('modeBackdrop')?.className}));throw new Error('Offline no inició: '+JSON.stringify({boot,pageErrors:errors,failedRequests,badResponses})+'; '+error.message)};
 await page.locator('[data-popup="city"]').evaluate(el=>el.click());await page.locator('#newBtn').evaluate(el=>el.click());
 await page.waitForFunction(()=>document.getElementById('panelPopup')?.classList.contains('hidden')&&document.getElementById('money')?.textContent.includes('175.000')&&document.getElementById('population')?.textContent.trim()==='0',undefined,{timeout:30000});
 await page.locator('#pauseBtn').evaluate(el=>el.click());await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1'))?.paused===true,undefined,{timeout:15000});
 for(let i=0;i<5;i++)await page.locator('#zoomOut').evaluate(el=>el.click());
 const canvas=await page.locator('#city').boundingBox();
 async function centerTile(x,y){
  for(let attempt=0;attempt<24;attempt++){
   const p=await page.evaluate(([a,b])=>window.__ciudadVivaProjectTile(a,b,0),[x,y]);
   const inComfortZone=p.x>canvas.width*.18&&p.x<canvas.width*.75&&p.y>canvas.height*.18&&p.y<canvas.height*.78;
   if(p.visible&&inComfortZone)return p;
   const dx=p.x-canvas.width*.47,dy=p.y-canvas.height*.47;
   const mx=-Math.max(-130,Math.min(130,dx*.8)),my=-Math.max(-110,Math.min(110,dy*.8));
   const sx=canvas.x+canvas.width*.5,sy=canvas.y+canvas.height*.5;
   await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx+mx,sy+my,{steps:6});await page.mouse.up();
  }
  throw new Error(`No se pudo encuadrar parcela ${x},${y}: ${JSON.stringify(await page.evaluate(([a,b])=>window.__ciudadVivaProjectTile(a,b,0),[x,y]))}`);
 }
 const lock=await centerTile(4,20);await page.mouse.click(canvas.x+lock.x,canvas.y+lock.y);
 const card=page.locator('.land-unlock-card');try{await card.waitFor({timeout:10000})}catch(error){const detail=await page.evaluate(()=>{const p=document.getElementById('panelPopup'),c=document.querySelector('.land-unlock-card');return{popupClass:p?.className,popupDisplay:p?getComputedStyle(p).display:null,popupBody:document.getElementById('popupBody')?.innerText,cardParent:c?.parentElement?.className,cardStyle:c?{display:getComputedStyle(c).display,visibility:getComputedStyle(c).visibility}:null,mode:window.__ciudadVivaMode?.()}});throw new Error(`Ficha de terreno oculta: ${JSON.stringify({detail,pageErrors:errors})}; ${error.message}`)}
 const copy=await card.innerText();assert.match(copy,/Zona construible bloqueada/);assert.match(copy,/SECTOR 0, 2/);
 const unlock=page.locator('[data-unlock-land][data-chunk-x="0"][data-chunk-y="2"]');await unlock.waitFor();
 await unlock.evaluate(el=>el.click());await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).landClaims.unlockedChunks.includes('0,2'),undefined,{timeout:30000});
 await page.locator('[data-popup="build"]').evaluate(el=>el.click());await page.locator('.tool[data-tool="road"]').evaluate(el=>el.click());
 const roadActive=await page.locator('.tool[data-tool="road"]').evaluate(el=>el.classList.contains('active'));assert.equal(roadActive,true,'el modo de calle queda activo');
 for(let y=11;y<=19;y++){
  const p=await centerTile(4,y),screenPoint={x:canvas.x+p.x,y:canvas.y+p.y};await page.mouse.click(screenPoint.x,screenPoint.y);
  try{await page.waitForFunction(y=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).roads.some(r=>r[0]===4&&r[1]===y),y,{timeout:8000})}catch(error){const detail=await page.evaluate(([sx,sy])=>({toast:document.getElementById('toast')?.textContent,mode:window.__ciudadVivaMode?.(),popup:document.getElementById('panelPopup')?.className,element:document.elementFromPoint(sx,sy)?.outerHTML.slice(0,350),roads:JSON.parse(localStorage.getItem('ciudad-viva-offline-v1'))?.roads?.slice(-4),money:JSON.parse(localStorage.getItem('ciudad-viva-offline-v1'))?.money}),[screenPoint.x,screenPoint.y]);throw new Error(`Calle 4,${y} sin construir: ${JSON.stringify({roadActive,detail,pageErrors:errors})}; ${error.message}`)}if(y%5===0)console.log(`calle 4,${y} construida`);
 }
 await page.locator('[data-popup="build"]').evaluate(el=>el.click());await page.locator('.tool[data-tool="civic"][data-model="clinic"]').evaluate(el=>el.click());
 const remoteClinic=await centerTile(5,19);await page.mouse.click(canvas.x+remoteClinic.x,canvas.y+remoteClinic.y);
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).buildings.some(b=>b.x===5&&b.y===19&&b.serviceModel==='clinic'),undefined,{timeout:30000});
 await page.locator('[data-popup="city"]').evaluate(el=>el.click());await page.locator('#saveBtn').evaluate(el=>el.click());
 await page.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Ciudad guardada'),undefined,{timeout:15000});
 const before=await page.evaluate(()=>{const c=JSON.parse(localStorage.getItem('ciudad-viva-offline-v1'));const clinic=c.buildings.find(b=>b.x===5&&b.y===19&&b.serviceModel==='clinic');return{roads:c.roads.length,sectors:c.landClaims.unlockedChunks.length,money:c.money,paused:c.paused,remoteClinic:clinic?{x:clinic.x,y:clinic.y,serviceModel:clinic.serviceModel,status:clinic.status}:null}});
 assert.equal(before.roads,10);assert.equal(before.sectors,5);assert.equal(before.remoteClinic?.x,5);assert.equal(before.remoteClinic?.y,19);assert.equal(before.remoteClinic?.serviceModel,'clinic');
 const moneyText=await page.locator('#money').innerText();
 await page.reload({waitUntil:'commit',timeout:60000});await page.waitForFunction(()=>typeof window.__ciudadVivaMode==='function',undefined,{timeout:60000});
 await page.locator('#offlineMode').evaluate(el=>el.click());
 await page.waitForFunction(expected=>window.__ciudadVivaMode?.()==='offline'&&document.getElementById('modeBackdrop')?.classList.contains('hidden')&&document.getElementById('money')?.innerText===expected,moneyText,{timeout:60000});
 const after=await page.evaluate(()=>{const c=JSON.parse(localStorage.getItem('ciudad-viva-offline-v1'));const clinic=c.buildings.find(b=>b.x===5&&b.y===19&&b.serviceModel==='clinic');return{roads:c.roads.length,sectors:c.landClaims.unlockedChunks.length,money:c.money,paused:c.paused,remoteClinic:clinic?{x:clinic.x,y:clinic.y,serviceModel:clinic.serviceModel,status:clinic.status}:null}});
 assert.deepEqual(after,before);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({before,after,pageErrors:errors.length}));await page.close();
}finally{await browser.close();server.kill('SIGTERM')}
