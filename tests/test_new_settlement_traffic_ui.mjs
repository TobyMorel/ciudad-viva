import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18951,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
 await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
 await page.locator('#offlineMode').evaluate(el=>el.click());await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');await page.locator('#saveList button, #newSlotButton').first().evaluate(button=>button.click());
 await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.getElementById('modeBackdrop')?.classList.contains('hidden'),undefined,{timeout:60000});
 await page.locator('[data-popup="city"]').evaluate(el=>el.click());await page.locator('#newBtn').evaluate(el=>el.click());
 await page.waitForFunction(()=>{const city=JSON.parse(localStorage.getItem('ciudad-viva-offline-v1'));return city?.newSettlement===true&&city.money===175000},undefined,{timeout:30000});
 await page.locator('#pauseBtn').evaluate(el=>el.click());await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).paused===true,undefined,{timeout:15000});
 await page.waitForTimeout(250);
 await page.waitForFunction(()=>window.__ciudadVivaEntryTraffic?.().length===3,undefined,{timeout:15000});
 const before=await page.evaluate(()=>window.__ciudadVivaEntryTraffic()),canvas=await page.locator('#city').boundingBox();
 assert.equal(new Set(before.map(a=>a.id)).size,3,'cada auto de entrada conserva una identidad independiente');
 assert.ok(before.every(a=>a.route.length===11),'los autos empiezan en el acceso regional');
 assert.ok(before.every(a=>!a.route.some(([x,y])=>x===5&&y===10)),'la calle interior todavía no está conectada');
 await page.locator('[data-popup="build"]').evaluate(el=>el.click());await page.locator('.tool[data-tool="road"]').evaluate(el=>el.click());
 const point=await page.evaluate(()=>{const p=window.__ciudadVivaProjectTile(5,10,0),r=document.querySelector('#city').getBoundingClientRect();return{...p,x:p.x+r.left,y:p.y+r.top}});
 assert.ok(point.visible&&point.x>=canvas.x&&point.x<=canvas.x+canvas.width&&point.y>=canvas.y&&point.y<=canvas.y+canvas.height,'el tramo conectado queda visible');
 await page.mouse.click(point.x,point.y);
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).roads.some(([x,y])=>x===5&&y===10),undefined,{timeout:15000});
 await page.waitForFunction(()=>window.__ciudadVivaEntryTraffic?.().every(a=>a.route.length===13&&a.route.some(([x,y])=>x===5&&y===10)),undefined,{timeout:15000});
 const after=await page.evaluate(()=>window.__ciudadVivaEntryTraffic());
 assert.equal(after.length,3);assert.ok(after.every(a=>a.id===before.find(b=>b.id===a.id)?.id));assert.ok(after.every(a=>Math.hypot(a.position[0]-before.find(b=>b.id===a.id).position[0],a.position[1]-before.find(b=>b.id===a.id).position[1])<.01),'los autos conservan su posición al actualizar el recorrido');assert.deepEqual(errors,[]);
 console.log(JSON.stringify({before:before.map(a=>({id:a.id,routeLength:a.route.length,position:a.position})),after:after.map(a=>({id:a.id,routeLength:a.route.length,position:a.position,usesNewRoad:a.route.some(([x,y])=>x===5&&y===10)})),pageErrors:errors.length}));
 await page.close();
}finally{await browser.close();server.kill('SIGTERM')}
