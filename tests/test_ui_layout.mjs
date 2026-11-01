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
    await page.evaluate(async()=>{
      const city=await fetch('/offline_seed.json').then(response=>response.json());
      city.supply.suppliers['Metalúrgica local']={aggregate:0,concrete:0,steel:0,timber:0,components:9,cash:0};
      for(const [x,factor,stock] of [[4,1.35,4],[6,.8,5]]){
        city.buildings.push({x,y:9,kind:'factory',name:'Metalúrgica rival '+x,status:'habilitado',
          business:{id:'rival-'+x,industryType:'metalworks',status:'abierto',
            materialPriceFactor:factor,componentStock:stock,cash:2500,jobSlots:20,lastLocalSales:2}});
      }
      city.supply.tradeContracts=[{id:'ui-contract',buyerId:'rival-4',vendorId:'rival-6',buyerName:'Hormigonera de la zona industrial central',vendorName:'Cantera del corredor productivo de Puerto Claro',commodity:'áridos',status:'en curso',quantity:30,deliveredUnits:10,installments:3,escrow:600,paidToSeller:290,refunded:0,contractValue:700,extensionFee:35}];
      city.supply.marketOrders=[{id:'ui-delayed',supplyContractId:'ui-contract',businessId:'rival-4',status:'en tránsito',statusCause:'Sin acceso vial',supplier:'Cantera local',businessName:'Hormigonera de la zona industrial central',quantity:8,source:[-3,-3],x:4,y:9,supplierReadyDay:99998,arrivalDay:99999,deadlineDay:100000}];
      localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city));
    });
    await page.locator('#offlineMode').click();
    await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
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
    const vendorLayout=await page.evaluate(()=>{
      const nodes=[...document.querySelectorAll('#popupContent .supply-line')]
        .filter(el=>el.textContent.includes('proveedor independiente'));
      return nodes.map(node=>{
        const rect=node.getBoundingClientRect(),parts=[...node.querySelectorAll('span,b,small')];
        return {text:node.textContent?.slice(0,90),width:rect.width,
          overflowing:node.scrollWidth>node.clientWidth+3,
          missing:parts.some(p=>{const r=p.getBoundingClientRect();return r.width<2||r.height<2||getComputedStyle(p).visibility==='hidden'})};
      });
    });
    const contractLayout=await page.evaluate(()=>{
      const nodes=[...document.querySelectorAll('#popupContent .supply-line')]
        .filter(el=>el.textContent.includes('custodia')&&el.textContent.includes('Cantera del corredor'));
      return nodes.map(el=>{
        const visible=[...el.querySelectorAll('span,b,small')].every(n=>{
          const r=n.getBoundingClientRect();
          return r.width>1&&r.height>1&&getComputedStyle(n).visibility!=='hidden'
        });
        return {visible,overflow:el.scrollWidth>el.clientWidth+3};
      });
    });
    await page.waitForFunction(()=>document.querySelector('#popupContent')?.textContent?.includes('Contratos privados de materias primas'),{timeout:10000}).catch(()=>{});
    const extensionCount=await page.locator('[data-renegotiate-contract="ui-contract"]').count();
    assert.equal(extensionCount,1,name+': prórroga por corte vial accesible · '+(await page.locator('#popupContent').innerText()).slice(0,1200));
    assert.equal(contractLayout.length,1,name+': contrato privado visible en Economía');
    assert.ok(contractLayout.every(v=>v.visible&&!v.overflow),
      name+': texto contractual solapado u oculto '+JSON.stringify(contractLayout));
    assert.equal(vendorLayout.length,2,name+': las ofertas de dos metalúrgicas deben aparecer');
    assert.ok(vendorLayout.every(v=>!v.overflowing&&!v.missing),
      name+': precio o texto industrial oculto o desbordado '+JSON.stringify(vendorLayout));
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
