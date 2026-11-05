import {chromium} from 'playwright';
import {startUiTestServer} from './ui_test_server.mjs';
import assert from 'node:assert/strict';

const server=await startUiTestServer(18804);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
  for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
    const page=await browser.newPage({viewport}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    let dialogs=0;page.on('dialog',dialog=>{dialogs++;dialog.dismiss()});
    await page.goto('http://127.0.0.1:18804/',{waitUntil:'domcontentloaded'});
    await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.paused=true;city.money=200000;city.roads.push([11,4]);localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
    await page.locator('#offlineMode').click();await page.waitForFunction(()=>document.getElementById('saveList')?.textContent!=='Buscando partidas…');await page.locator('#saveList button, #newSlotButton').first().evaluate(button=>button.click());
    await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
    const button=page.locator('#demolishTool');
    assert.equal(await button.isVisible(),true);
    await button.evaluate(el=>el.click());
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    await page.locator('[data-citizen-toggle]').evaluateAll(items=>items.forEach(toggle=>{if(toggle.textContent.trim()==='Ocultar')toggle.click()}));
    await page.evaluate(()=>window.__ciudadVivaFocusTileForDiagnostics(11,4));
    const tile=await page.evaluate(()=>{const p=window.__ciudadVivaProjectTile(11,4,0),r=document.getElementById('city').getBoundingClientRect();return{x:p.x+r.left,y:p.y+r.top,visible:p.visible}});
    assert.equal(tile.visible,true,'el tramo debe estar a la vista');
    await page.mouse.move(tile.x,tile.y);
    assert.equal(await page.locator('#city').evaluate(el=>el.style.cursor),'pointer','el cursor indica un objeto demolible al pasar sobre él');
    await page.mouse.click(tile.x,tile.y);
    await page.waitForFunction(()=>!JSON.parse(localStorage.getItem('ciudad-viva-offline-v1')).roads.some(([x,y])=>x===11&&y===4),{timeout:15000});
    assert.equal(dialogs,0,'no debe aparecer un diálogo de confirmación');
    assert.match(await page.locator('#toast').innerText(),/Objeto Tramo de calle demolido/i);
    await page.mouse.move(tile.x,tile.y);
    assert.equal(await page.locator('#city').evaluate(el=>el.style.cursor),'crosshair','cursor normal sobre terreno libre tras demoler');
    assert.equal(await button.getAttribute('aria-pressed'),'true','debe poder demoler varias veces sin reactivar');
    await button.evaluate(el=>el.click());
    assert.equal(await button.getAttribute('aria-pressed'),'false');
    assert.deepEqual(errors,[],'errores inesperados en el navegador');
    await page.close();
  }
}finally{await browser.close();server.kill('SIGTERM')}
