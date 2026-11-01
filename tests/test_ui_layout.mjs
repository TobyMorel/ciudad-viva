import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const server=spawn('python',['-m','http.server','18765','--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
mkdirSync('ui-captures',{recursive:true});
try{
  for(const {name,width,height} of [{name:'movil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.stack||e.message));
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
      city.buildings.push({x:7,y:11,kind:'civic',serviceModel:'clinic',name:'Consultorio del Barrio Oeste',status:'operativo',jobSlots:12,utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}});
      city.buildings.push({x:10,y:11,kind:'civic',serviceModel:'generalHospital',name:'Hospital del corredor periurbano del Puerto Claro',status:'operativo',jobSlots:40,hospitalWard:{beds:20,ambulances:1},utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}});
      city.buildings.push({x:11,y:11,kind:'civic',serviceModel:'policeStation',name:'Comisaría Distrital Norte de Puerto Claro',status:'operativo',jobSlots:22,policeUnit:{vehicles:2,priority:'mixto'},utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}});
      city.roads=[]; // Corte real de las vías, con proveedor contractual existente.
      city.supply.marketOrders=[{id:'ui-delayed',supplyContractId:'ui-contract',businessId:'rival-4',vendorId:'rival-6',type:'industrial_raw',commodity:'áridos',status:'en tránsito',statusCause:'Sin acceso vial',supplier:'Cantera local',businessName:'Hormigonera de la zona industrial central',quantity:8,productCost:280,freight:0,source:[6,9],x:4,y:9,supplierReadyDay:99998,arrivalDay:99999,deadlineDay:100000}];
      localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city));
    });
    await page.locator('#offlineMode').click();
    await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
    await page.waitForTimeout(400);
    let viewport=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
    assert.ok(viewport.scroll<=viewport.inner+2,name+': desborde horizontal en el juego '+JSON.stringify(viewport));
    await page.screenshot({path:'ui-captures/'+name+'-ciudad.png'});
    // Ayuda y avisos deben funcionar también en móvil, sin depender del motor Online.
    await page.locator('[data-popup="guide"]').click();
    await page.locator('#panelPopup:not(.hidden)').waitFor({timeout:12000});
    const instructions=await page.locator('#popupContent').innerText();
    assert.ok(instructions.includes('Primeros pasos en tu ciudad')&&instructions.includes('Hormigón')&&instructions.includes('Hormigonera'),
      name+': la guía de construcción no explica el hormigón ni la progresión.');
    assert.equal(await page.locator('#popupContent .quick-start-step').count(),6);
    await page.locator('#popupClose').click();
    await page.locator('[data-popup="alerts"]').click();
    await page.locator('#panelPopup:not(.hidden)').waitFor({timeout:12000});
    const alertsIntro=await page.locator('#popupContent').innerText();
    assert.ok(alertsIntro.includes('avisos')||alertsIntro.includes('Avisos'),
      name+': el panel de eventos urbanos no está disponible.');
    await page.locator('#popupClose').click();
    await page.locator('[data-popup="build"]').click();
    const catalog=await page.evaluate(()=>{
      const pane=document.querySelector('#panelPopup:not(.hidden)'),buttons=[...pane.querySelectorAll('[data-model]')];
      return {count:buttons.length,factoryCount:pane.querySelectorAll('[data-industry]').length,categories:[...pane.querySelectorAll('.tool-category')].map(x=>x.textContent.trim()),
        noClippedNames:buttons.every(b=>b.querySelector('b').getBoundingClientRect().height>9&&b.scrollWidth<=b.clientWidth+3),
        noHorizontalOverflow:pane.scrollWidth<=pane.clientWidth+3};
    });
    assert.ok(catalog.count===16&&catalog.factoryCount===5&&catalog.categories.length===6&&catalog.noClippedNames&&catalog.noHorizontalOverflow,
      name+': catálogo de edificios recortado o incompleto '+JSON.stringify(catalog));
    await page.locator('#popupClose').click();

    await page.locator('[data-popup="supply"]').click();
    await page.locator('#panelPopup:not(.hidden)').waitFor({timeout:10000});
    await page.waitForFunction(()=>document.querySelector('#popupContent')?.textContent?.includes('Contratos privados de materias primas'),{timeout:10000});
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
    await page.locator('[data-popup="city"]').click();
    await page.locator('#panelPopup:not(.hidden)').waitFor({timeout:10000});
    await page.locator('[data-city-section-button="tourism"]').evaluate(button=>button.click());
    const eventUI=await page.evaluate(()=>{
      const section=document.querySelector('[data-city-section="tourism"]');
      const buttons=[...section.querySelectorAll('[data-tourism-event]')];
      const selection=document.querySelector('#selection').getBoundingClientRect();
      return {present:!section.hidden,buttons:buttons.length,within:buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>20&&r.height>20&&r.left>=selection.left-2&&r.right<=selection.right+2}),
        noOverflow:section.scrollWidth<=section.clientWidth+3,hasExplanations:section.textContent.includes('Limpieza de eventos')&&section.textContent.includes('Contratá una actividad')};
    });
    assert.ok(eventUI.present&&eventUI.buttons===3&&eventUI.within&&eventUI.noOverflow&&eventUI.hasExplanations,
      name+': eventos turísticos recortados u ocultos '+JSON.stringify(eventUI));
    await page.screenshot({path:'ui-captures/'+name+'-turismo.png'});
    await page.locator('[data-city-section-button="health"]').evaluate(button=>button.click());
    const hospitalUI=await page.evaluate(()=>{
      const section=document.querySelector('[data-city-section="health"]'),selection=document.querySelector('#selection').getBoundingClientRect();
      const buttons=[...section.querySelectorAll('[data-hospital-invest]')];
      const rects=buttons.map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,scroll:b.scrollWidth,client:b.clientWidth,hidden:getComputedStyle(b).visibility==='hidden'}});
      const overlap=rects.some((r,i)=>rects.slice(i+1).some(t=>Math.min(r.right,t.right)-Math.max(r.left,t.left)>3&&Math.min(r.bottom,t.bottom)-Math.max(r.top,t.top)>3));
      return {visible:!section.hidden,count:buttons.length,overlap,contained:rects.every(r=>r.left>=selection.left-2&&r.right<=selection.right+2&&r.width>30&&r.height>20&&!r.hidden&&r.scroll<=r.client+3),overflow:section.scrollWidth>section.clientWidth+3,
        validLabels:section.textContent.includes('HOSPITALIZACIÓN')&&section.textContent.includes('Ampliar 8 camas')&&section.textContent.includes('Equipar 12 camas')};
    });
    assert.ok(hospitalUI.visible&&hospitalUI.count===3&&hospitalUI.contained&&!hospitalUI.overlap&&!hospitalUI.overflow&&hospitalUI.validLabels,
      name+': panel hospitalario con controles o textos solapados/ocultos '+JSON.stringify(hospitalUI));
    await page.screenshot({path:'ui-captures/'+name+'-salud.png'});
    await page.locator('[data-city-section-button="security"]').evaluate(button=>button.click());
    const policeUI=await page.evaluate(()=>{
      const section=document.querySelector('[data-city-section="security"]'),selection=document.querySelector('#selection').getBoundingClientRect();
      const buttons=[...section.querySelectorAll('[data-police-action]')];
      const rects=buttons.map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,scroll:b.scrollWidth,client:b.clientWidth,hidden:getComputedStyle(b).visibility==='hidden'}});
      const overlap=rects.some((r,i)=>rects.slice(i+1).some(t=>Math.min(r.right,t.right)-Math.max(r.left,t.left)>3&&Math.min(r.bottom,t.bottom)-Math.max(r.top,t.top)>3));
      return {visible:!section.hidden,count:buttons.length,overlap,
        contained:rects.every(r=>r.left>=selection.left-2&&r.right<=selection.right+2&&r.width>25&&r.height>20&&!r.hidden&&r.scroll<=r.client+3),
        overflow:section.scrollWidth>section.clientWidth+3,
        validLabels:section.textContent.includes('BASES MUNICIPALES')&&section.textContent.includes('Comisaría Distrital')&&section.textContent.includes('Comprar móvil')};
    });
    assert.ok(policeUI.visible&&policeUI.count===4&&policeUI.contained&&!policeUI.overlap&&!policeUI.overflow&&policeUI.validLabels,
      name+': controles policiales ocultos, solapados o desbordados '+JSON.stringify(policeUI));
    await page.screenshot({path:'ui-captures/'+name+'-seguridad.png'});
    await page.locator('#popupClose').click();

    assert.deepEqual(errors,[],name+': errores JS '+errors.join('; '));
    await page.close();

    // Escena Three.js: un vehículo 3D real por base/dotación, rutas registradas y
    // posición variable en el tiempo. Se conserva acceso a la ciudad en ambos tamaños.
    const live=await browser.newPage({viewport:{width,height}});
    const threeErrors=[];live.on('pageerror',e=>threeErrors.push(e.message));
    await live.goto('http://127.0.0.1:18765/',{waitUntil:'domcontentloaded'});
    await live.evaluate(async()=>{
      const city=await fetch('/offline_seed.json').then(r=>r.json());
      city.paused=true;city.day=31;city.lastMonth=1;
      // Una comisaría sin agua o electricidad debe permanecer en base. Para esta
      // prueba de movimiento conectamos instalaciones y calles físicamente.
      const lines=[[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[10,11],[11,11],[12,11]];
      city.utilities=city.utilities||{};
      for(const network of ['powerLines','waterPipes','sewerLines'])city.utilities[network]=lines;
      city.utilities.failures=[{id:'repair-3d',network:'telecom',x:8,y:10,day:31,repairCost:500,affectedBuildings:4,status:'en reparación',remainingDays:1,responseKind:'emergencia',responseStartedDay:31,responseDurationDays:1,responseProgress:.5,responseRoute:[[4,10],[5,10],[6,10],[7,10],[8,10]]}];
      city.buildings.push({kind:'civic',serviceModel:'policeStation',name:'Comisaría visual de prueba',x:10,y:11,status:'operativo',
        policeUnit:{vehicles:1,priority:'mixto'},jobSlots:22,utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}});
      city.buildings.push({kind:'civic',serviceModel:'generalHospital',name:'Hospital visual de prueba',x:11,y:11,status:'operativo',
        hospitalWard:{beds:20,ambulances:1},jobSlots:40,utilityAccess:{powerServedPct:100,waterServedPct:100,wastewaterTreatedPct:100}});
      city.workplaces.push({kind:'civic',name:'Comisaría visual de prueba',x:10,y:11,staffedJobs:16,workersAssigned:16,jobSlots:22});
      city.workplaces.push({kind:'civic',name:'Hospital visual de prueba',x:11,y:11,staffedJobs:20,workersAssigned:20,jobSlots:40});
      city.buildings.push({kind:'fireStation',serviceModel:'firePost',name:'Cuartel de pruebas',x:12,y:11,status:'operativo',fireEngineCapacity:1,dispatchReadyDay:31});
      city.workplaces.push({kind:'fireStation',name:'Cuartel de pruebas',x:12,y:11,staffedJobs:8,workersAssigned:8,jobSlots:8});
      const route=[[9,11],[9,10],[8,10],[7,10],[6,10],[5,10],[5,9]];
      const fireRoute=[[12,11],[12,10],[11,10],[10,10],[9,10],[8,10],[7,10],[6,10],[5,10],[5,9]];
      city.police={lastProcessedMonth:1,recentIncidents:[{id:'p3d',day:31,month:1,x:5,y:9,location:'Sector viviendas',status:'atendido',station:'Municipalidad',stationX:10,stationY:11,route}]};
      city.health={lastHospitalDay:31,hospitalBacklog:0,ambulanceDispatches:[{id:'m3d',day:31,x:5,y:9,station:'Municipalidad',stationX:11,stationY:11,patients:1,status:'traslado',route}]};
      city.fireService={lastGeneratedMonth:1,incidents:[{id:'f3d',x:5,y:9,name:'Viviendas del sector',startDay:30,resolvedDay:31,status:'controlado',station:'Cuartel de pruebas',stationX:12,stationY:11,route:fireRoute,damage:2}],dispatches:1,resolved:1,unanswered:0};
      localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city));
    });
    await live.locator('#offlineMode').click();
    await live.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
    await live.waitForFunction(()=>typeof window.__ciudadViva3D==='function'&&window.__ciudadViva3D().length>=3,{timeout:30000});
    const before=await live.evaluate(()=>window.__ciudadViva3D());
    const required=['Ambulancia','Bomberos'];
    // La cuadrilla de emergencia existe como vehículo seleccionable con ruta física.
    const utilityCrew=before.find(a=>a.type==='Cuadrilla de servicios');
    assert.ok(utilityCrew&&utilityCrew.inScene&&utilityCrew.visible&&utilityCrew.moving&&utilityCrew.routeLength>1,
      name+': la cuadrilla de redes no tiene vehículo 3D en ruta '+JSON.stringify(before));
    // Una patrulla sin dotación real debe quedarse en su base; exigir movimiento
    // forzaría a mostrar móviles operativos sin personal y redes disponibles.
    const police=before.find(a=>a.type==='Policía');
    assert.ok(police&&police.inScene&&police.visible&&(police.moving?police.routeLength>1:police.routeLength===0),
      name+': la patrulla no respeta su estado de operación '+JSON.stringify(before));
    for(const role of required){
      const actor=before.find(a=>a.type===role);
      assert.ok(actor&&actor.inScene&&actor.visible&&actor.moving&&actor.routeLength>1,
        name+': el vehículo '+role+' no circula por ruta 3D real '+JSON.stringify(before));
    }
    const overflow3D=await live.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth,canvas:document.querySelector('#city').getBoundingClientRect().width}));
    assert.ok(overflow3D.document<=overflow3D.viewport+2&&overflow3D.canvas>100,name+': la escena 3D generó desborde');
    // Cobertura verde visible en calles reales, mayor en hospitales de nivel superior.
    const coverage=await live.evaluate(()=>{
      const small=window.__ciudadVivaCoverage(11,11,'clinic');
      const large=window.__ciudadVivaCoverage(11,11,'generalHospital');
      return {small:small.length,large:large.length,allGreen:large.every(x=>x.radius===16)};
    });
    assert.ok(coverage.small>0&&coverage.large>=coverage.small&&coverage.allGreen,
      name+': el radio verde no respeta niveles y calles '+JSON.stringify(coverage));
    await live.screenshot({path:'ui-captures/'+name+'-emergencias-3d.png'});
    assert.deepEqual(threeErrors,[],name+': errores Three.js '+threeErrors.join('; '));
    await live.close();
  }
}finally{
  await browser.close();
  server.kill();
}
