import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const server=spawn('python',['-m','http.server','18765','--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
mkdirSync('ui-captures',{recursive:true});
try{
  for(const {name,width,height} of [{name:'movil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    let loaded=false;
    for(let attempt=0;attempt<20&&!loaded;attempt++){
      try{await page.goto('http://127.0.0.1:18765/',{waitUntil:'domcontentloaded',timeout:4000});loaded=true}
      catch{await new Promise(r=>setTimeout(r,250))}
    }
    assert.ok(loaded,'El servidor estático debe responder.');
    await page.locator('#offlineMode').click();
    await page.locator('#modeBackdrop.hidden').waitFor({timeout:30000});
    await page.waitForTimeout(400);
    let viewport=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
    assert.ok(viewport.scroll<=viewport.inner+2,name+': desborde horizontal en el juego '+JSON.stringify(viewport));
    await page.screenshot({path:'ui-captures/'+name+'-ciudad.png'});
    await page.locator('[data-popup="supply"]').click();
    await page.locator('#panelPopup:not(.hidden)').waitFor({timeout:10000});
    const popup=await page.evaluate(()=>{
      const windowEl=document.querySelector('#panelPopup .popup-window');
      const content=document.querySelector('#popupContent');
      const rect=windowEl.getBoundingClientRect();
      const scroller=content.scrollHeight>content.clientHeight?content:windowEl;
      scroller.scrollTop=scroller.scrollHeight;
      return {windowWidth:rect.width,left:rect.left,right:rect.right,scrollWidth:document.documentElement.scrollWidth,
        hasContent:Boolean(content.textContent?.trim()),scrollable:scroller.scrollHeight<=scroller.clientHeight+3||scroller.scrollTop>0,
        width:window.innerWidth};
    });
    assert.ok(popup.hasContent,name+': economía no muestra información');
    assert.ok(popup.left>=-2&&popup.right<=width+2,name+': popup de Economía fuera de pantalla '+JSON.stringify(popup));
    assert.ok(popup.scrollWidth<=popup.width+2,name+': overflow horizontal en Economía '+JSON.stringify(popup));
    assert.ok(popup.scrollable,name+': el contenido largo no se puede desplazar');
    await page.screenshot({path:'ui-captures/'+name+'-economia.png'});
    await page.locator('#popupClose').click();
    assert.deepEqual(errors,[],name+': errores JS '+errors.join('; '));
    await page.close();
  }
}finally{
  await browser.close();
  server.kill();
}
