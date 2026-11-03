import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18949,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
 await page.locator('#offlineMode').evaluate(el=>el.click());await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline',{timeout:30000});await page.locator('.game-dock').waitFor({timeout:30000});
 await page.locator('[data-popup="city"]').evaluate(el=>el.click());await page.locator('#newBtn').evaluate(el=>el.click());await page.waitForFunction(()=>document.getElementById('money')?.textContent.includes('85.000'));
 await page.evaluate(()=>{const key='ciudad-viva-offline-v1',city=JSON.parse(localStorage.getItem(key));city.money=1000000;city.paused=true;localStorage.setItem(key,JSON.stringify(city))});
 await page.reload({waitUntil:'commit',timeout:60000});await page.locator('#offlineMode').evaluate(el=>el.click());await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.getElementById('money')?.textContent.includes('1.000.000'),{timeout:30000});await page.locator('.game-dock').waitFor({timeout:30000});
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
 for(let cy=2;cy<=6;cy++){
  const p=await centerTile(4,cy*8+4);await page.mouse.click(canvas.x+p.x,canvas.y+p.y);
  const card=page.locator('.land-unlock-card');await card.waitFor();
  const button=page.locator(`[data-unlock-land][data-chunk-x="0"][data-chunk-y="${cy}"]`);
  if(await button.count()===0){const cardText=await card.innerText(),landClaims=await page.evaluate(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1'))?.landClaims);throw new Error(`Sin botón para 0,${cy}; ficha=${JSON.stringify(cardText)}; guardado=${JSON.stringify(landClaims?.unlockedChunks)}`)}
  await button.waitFor();await button.evaluate(el=>el.click());
  await page.waitForFunction(cy=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).landClaims.unlockedChunks.includes(`0,${cy}`),cy);console.log(`sector 0,${cy} habilitado`);
 }
 await page.locator('[data-popup="build"]').click();await page.locator('.tool[data-tool="road"]').evaluate(el=>el.click());
 for(let y=11;y<=49;y++){
  const p=await centerTile(4,y);await page.mouse.click(canvas.x+p.x,canvas.y+p.y);
  await page.waitForFunction(y=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).roads.some(r=>r[0]===4&&r[1]===y),y);if(y%10===0)console.log(`calle 4,${y} construida`);
 }
 await page.locator('[data-popup="build"]').click();
 await page.locator('.tool[data-tool="civic"][data-model="clinic"]').evaluate(el=>el.click());
 const remoteClinic=await centerTile(5,49);await page.mouse.click(canvas.x+remoteClinic.x,canvas.y+remoteClinic.y);
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).buildings.some(b=>b.x===5&&b.y===49&&b.serviceModel==='clinic'),{timeout:20000});
 await page.locator('[data-popup="city"]').evaluate(el=>el.click());await page.locator('#saveBtn').evaluate(el=>el.click());
 await page.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Ciudad guardada'));
 console.log('ciudad guardada; recargando');const before=await page.evaluate(()=>{const c=JSON.parse(localStorage.getItem('ciudad-viva-offline-v1'));const clinic=c.buildings.find(b=>b.x===5&&b.y===49&&b.serviceModel==='clinic');return{roads:c.roads.length,sectors:c.landClaims.unlockedChunks.length,money:c.money,remoteClinic:clinic?{x:clinic.x,y:clinic.y,serviceModel:clinic.serviceModel,status:clinic.status}:null}});
 await page.reload({waitUntil:'commit',timeout:60000});console.log('documento recargado; esperando iniciar el juego');await page.waitForFunction(()=>typeof window.__ciudadVivaProjectTile==='function',{timeout:60000});await page.locator('#offlineMode').evaluate(el=>el.click());await page.locator('.game-dock').waitFor({timeout:60000});console.log('partida reanudada');
 const after=await page.evaluate(()=>{const c=JSON.parse(localStorage.getItem('ciudad-viva-offline-v1'));const clinic=c.buildings.find(b=>b.x===5&&b.y===49&&b.serviceModel==='clinic');return{roads:c.roads.length,sectors:c.landClaims.unlockedChunks.length,money:c.money,remoteClinic:clinic?{x:clinic.x,y:clinic.y,serviceModel:clinic.serviceModel,status:clinic.status}:null}});
 assert.equal(before.roads,40);assert.equal(before.sectors,9);assert.equal(before.remoteClinic?.x,5);assert.equal(before.remoteClinic?.y,49);assert.equal(before.remoteClinic?.serviceModel,'clinic');assert.deepEqual(after,before);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({before,after,pageErrors:errors.length}));await page.close();
}finally{await browser.close();server.kill('SIGTERM')}

