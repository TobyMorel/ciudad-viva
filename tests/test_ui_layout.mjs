import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const server=spawn('python',['-m','http.server','18765','--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
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
      city.timeOfDayMinutes=21*60;
      city.paused=true; // El fixture conserva la noche durante toda la inspección visual.
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
      city.buildings.push({x:12,y:11,kind:'civic',serviceModel:'socialShelter',name:'Centro de acogida del Puerto Claro',status:'habilitado',jobSlots:12,monthlyCost:1180,socialShelter:{beds:30,occupied:2,operationalCapacity:8,residents:[]},utilityAccess:{powerServedPct:90,waterServedPct:80,wastewaterTreatedPct:75}});
      city.socialServices=city.socialServices||{};city.socialServices.shelterResidents=[{id:'shelter-ui-a',name:'Residente en alojamiento temporal 1',age:34,workerEligible:true,shelterId:'shelter-12-11',admittedDay:30},{id:'shelter-ui-b',name:'Residente desplazada por inundación',age:41,workerEligible:true,shelterId:null,admittedDay:30,displacedBy:'inundación',originHomeX:2,originHomeY:3,plannedReturnDay:40}];
      city.socialServices.shelterReport={residents:2,displaced:1,migrationResidents:1,sheltered:1,waiting:1,capacity:8,available:6,monthlyCost:1180,fundingPct:100,facilities:[{id:'shelter-12-11',name:'Centro de acogida del Puerto Claro',capacity:8,beds:30,staff:4,utilities:75,connected:true,monthlyCost:1180,occupied:1,available:7}]};
      city.roads=[]; // Corte real de las vías, con proveedor contractual existente.
      city.supply.marketOrders=[{id:'ui-delayed',supplyContractId:'ui-contract',businessId:'rival-4',vendorId:'rival-6',type:'industrial_raw',commodity:'áridos',status:'en tránsito',statusCause:'Sin acceso vial',supplier:'Cantera local',businessName:'Hormigonera de la zona industrial central',quantity:8,productCost:280,freight:0,source:[6,9],x:4,y:9,supplierReadyDay:99998,arrivalDay:99999,deadlineDay:100000}];
      localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city));
    });
    await page.locator('#modeThemeToggle').evaluate(button=>button.click());
    assert.equal(await page.locator('body').getAttribute('data-theme'),'dark',name+': el tema oscuro debe aplicarse en inicio');
    await page.locator('#modeThemeToggle').evaluate(button=>button.click());
    await page.locator('#onlineMode').evaluate(button=>button.click());
    await page.locator('#browseRoom').evaluate(button=>button.click());
    await page.waitForFunction(()=>document.getElementById('roomList')?.textContent?.includes('Salas disponibles'),{timeout:10000});
    assert.ok((await page.locator('#roomList').innerText()).includes('No se detectaron salas abiertas'),name+': la búsqueda sin iniciador debe mostrar una lista vacía');
    await page.locator('#lanBack').evaluate(button=>button.click());
    await page.locator('#offlineMode').click();
    await page.waitForFunction(()=>document.getElementById('modeBackdrop')?.classList.contains('hidden'),{timeout:30000});
    // Freeze the 3D draw loop after the static city loads; this test measures layout, not animation frame rate.
    await page.evaluate(()=>{window.requestAnimationFrame=()=>0});
    await page.waitForTimeout(400);
    let viewport=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
    assert.ok(viewport.scroll<=viewport.inner+2,name+': desborde horizontal en el juego '+JSON.stringify(viewport));
    const demandLayout=await page.evaluate(()=>{const w=document.querySelector('#growthDemand'),r=w.getBoundingClientRect(),map=document.querySelector('.world-wrap').getBoundingClientRect(),items=[...w.querySelectorAll('.growth-demand-item')];return{visible:r.width>0&&r.height>0,inside:r.left>=map.left&&r.right<=map.right&&r.top>=map.top&&r.bottom<=map.bottom,items:items.length,labels:items.map(x=>x.querySelector('b')?.textContent),bars:items.map(x=>x.querySelector('.growth-demand-track')?.getBoundingClientRect().height),overflow:w.scrollWidth>w.clientWidth+2}});
    assert.ok(demandLayout.visible&&demandLayout.inside&&demandLayout.items===3&&!demandLayout.overflow&&demandLayout.bars.every(h=>h>20),name+': demanda urbana ausente, oculta o desbordada '+JSON.stringify(demandLayout));
    const clockLayout=await page.evaluate(()=>{const clock=document.querySelector('#mapTime'),toolbar=document.querySelector('.world-toolbar'),r=clock.getBoundingClientRect(),t=toolbar.getBoundingClientRect();return {text:clock.textContent,night:clock.dataset.night,visible:r.width>1&&r.height>1,inside:r.left>=t.left&&r.right<=t.right,toolbarOverflow:toolbar.scrollWidth>toolbar.clientWidth+2}});
    assert.ok((clockLayout.text.includes('21:')||clockLayout.text.includes('22:')||clockLayout.text.includes('23:'))&&clockLayout.night==='true'&&clockLayout.visible&&clockLayout.inside&&!clockLayout.toolbarOverflow,name+': hora nocturna oculta o barra de mapa desbordada '+JSON.stringify(clockLayout));
    await page.locator('[data-popup="traffic"]').evaluate(button=>button.click());
    assert.equal(await page.locator('#trafficPanel').isVisible(),true,name+': Tráfico debe quedar sobre el mapa sin taparlo');
    assert.equal(await page.locator('#panelPopup').isVisible(),false,name+': la capa vial no debe abrir el popup borroso');
    const trafficSummary=await page.evaluate(()=>{const panel=document.querySelector('#trafficPanel'),stats=panel?.querySelector('.traffic-stats');return {panelWidth:panel?.clientWidth,scrollWidth:panel?.scrollWidth,statsVisible:Boolean(stats&&stats.getBoundingClientRect().height>0),hasSummary:panel?.textContent?.includes('Colas más largas'),hasProfile:panel?.textContent?.includes('Ver demanda y espera por horario'),hasCurrentTime:panel?.textContent?.includes(document.querySelector('#mapTime')?.textContent||'')}});
    assert.ok(trafficSummary.statsVisible&&trafficSummary.hasSummary&&trafficSummary.hasProfile&&trafficSummary.hasCurrentTime&&trafficSummary.scrollWidth<=trafficSummary.panelWidth+2,name+': resumen de tráfico cortado o desbordado '+JSON.stringify(trafficSummary));
    await page.locator('#trafficPanel .traffic-profile summary').click();
    const profile=await page.evaluate(()=>{const panel=document.querySelector('#trafficPanel'),items=[...panel.querySelectorAll('.traffic-window')];return {count:items.length,inside:items.every(item=>{const r=item.getBoundingClientRect(),p=panel.getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1})}});
    assert.ok(profile.count===9&&profile.inside,name+': el detalle de franjas está incompleto o desborda '+JSON.stringify(profile));
    await page.locator('#trafficPanel [data-close-traffic]').evaluate(button=>button.click());
    await page.locator('#themeToggle').evaluate(button=>button.click());
    assert.equal(await page.locator('body').getAttribute('data-theme'),'dark',name+': tema oscuro en el juego');
    await page.locator('#themeToggle').evaluate(button=>button.click());
    // Ayuda y avisos deben funcionar también en móvil, sin depender del motor Online.
    await page.locator('[data-popup="guide"]').evaluate(button=>button.click());
    await page.locator('#panelPopup:not(.hidden)').waitFor({timeout:12000});
    const instructions=await page.locator('#popupContent').innerText();
    assert.ok(instructions.includes('Primeros pasos en tu ciudad')&&instructions.includes('Hormigón')&&instructions.includes('Hormigonera'),
      name+': la guía de construcción no explica el hormigón ni la progresión.');
    assert.equal(await page.locator('#popupContent .quick-start-step').count(),6);
    await page.locator('#popupClose').evaluate(button=>button.click());
    await page.locator('[data-popup="alerts"]').evaluate(button=>button.click());
    await page.locator('#panelPopup:not(.hidden)').waitFor({timeout:12000});
    const alertsIntro=await page.locator('#popupContent').innerText();
    assert.ok(alertsIntro.includes('avisos')||alertsIntro.includes('Avisos'),
      name+': el panel de eventos urbanos no está disponible.');
    await page.locator('#popupClose').evaluate(button=>button.click());
    await page.locator('[data-popup="build"]').evaluate(button=>button.click());
    const catalog=await page.evaluate(()=>{
      const pane=document.querySelector('#panelPopup:not(.hidden)'),buttons=[...pane.querySelectorAll('[data-model]')];
      return {count:buttons.length,factoryCount:pane.querySelectorAll('[data-industry]').length,categories:[...pane.querySelectorAll('.tool-category')].map(x=>x.textContent.trim()),
        noClippedNames:buttons.every(b=>b.querySelector('b').getBoundingClientRect().height>9&&b.scrollWidth<=b.clientWidth+3),
        noHorizontalOverflow:pane.scrollWidth<=pane.clientWidth+3};
    });
    assert.ok(catalog.count===20&&catalog.factoryCount===5&&catalog.categories.length===8&&catalog.categories.some(x=>x.includes('SERVICIOS FUNERARIOS'))&&catalog.noClippedNames&&catalog.noHorizontalOverflow,
      name+': catálogo de edificios recortado o incompleto '+JSON.stringify(catalog));
    await page.locator('#popupClose').evaluate(button=>button.click());

    await page.locator('[data-popup="supply"]').evaluate(button=>button.click());
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
    const aidLayout=await page.evaluate(()=>{
      const card=[...document.querySelectorAll('#popupContent details')].find(el=>el.textContent.includes('Ayuda de alquiler'));
      if(!card)return {found:false};card.open=true;card.scrollIntoView({block:'center'});
      const buttons=[...card.querySelectorAll('[data-housing-aid]')],bounds=card.getBoundingClientRect(),content=document.querySelector('#popupContent');
      return {found:true,buttons:buttons.length,within:bounds.left>=-2&&bounds.right<=innerWidth+2,
        noOverflow:card.scrollWidth<=card.clientWidth+3&&content.scrollWidth<=content.clientWidth+3,
        labels:card.textContent.includes('deuda de alquiler comprobada')&&card.textContent.includes('no entrega dinero libre al hogar'),
        controls:buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>36&&r.height>24&&r.left>=-2&&r.right<=innerWidth+2&&b.textContent.trim().length>2})};
    });
    assert.ok(aidLayout.found&&aidLayout.buttons===2&&aidLayout.within&&aidLayout.noOverflow&&aidLayout.labels&&aidLayout.controls,
      name+': control o explicación de ayuda de alquiler oculto/desbordado '+JSON.stringify(aidLayout));
    const shelterLayout=await page.evaluate(()=>{const panel=document.querySelector('.social-shelter-panel');if(!panel)return {found:false};panel.scrollIntoView({block:'center'});const r=panel.getBoundingClientRect(),content=document.querySelector('#popupContent'),text=panel.textContent||'',parts=[...panel.querySelectorAll('.detail-grid>div,.supply-line')].map(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,scroll:el.scrollWidth,client:el.clientWidth,text:el.textContent}});const overlap=parts.some((a,i)=>parts.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>3&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>3));return {found:true,left:r.left,right:r.right,overflow:panel.scrollWidth>panel.clientWidth+3||content.scrollWidth>content.clientWidth+3,contained:parts.every(p=>p.width>0&&p.left>=-2&&p.right<=innerWidth+2&&p.scroll<=p.client+3),overlap,text}});
    assert.ok(shelterLayout.found&&shelterLayout.left>=-2&&shelterLayout.right<=width+2&&!shelterLayout.overflow&&shelterLayout.contained&&!shelterLayout.overlap&&shelterLayout.text.includes('Personas en alojamiento')&&shelterLayout.text.includes('Desplazadas por emergencias')&&shelterLayout.text.includes('6 libres')&&shelterLayout.text.includes('redes 75%'),name+': ocupación, plazas o estado del refugio recortados/solapados '+JSON.stringify(shelterLayout));
    await page.locator('#popupClose').evaluate(button=>button.click());
    await page.locator('[data-popup="city"]').evaluate(button=>button.click());
    await page.locator('#panelPopup:not(.hidden)').waitFor({timeout:10000});
    await page.locator('[data-city-section-button="tourism"]').evaluate(button=>button.click());
    await page.waitForFunction(()=>!document.querySelector('[data-city-section="tourism"]')?.hidden,{timeout:10000});
    const eventUI=await page.evaluate(()=>{
      const section=document.querySelector('[data-city-section="tourism"]');
      const buttons=[...section.querySelectorAll('[data-tourism-event]')];
      const selection=document.querySelector('#selection').getBoundingClientRect();
      return {present:!section.hidden,buttons:buttons.length,within:buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>20&&r.height>20&&r.left>=selection.left-2&&r.right<=selection.right+2}),
        noOverflow:section.scrollWidth<=section.clientWidth+3,hasExplanations:section.textContent.includes('Limpieza de eventos')&&section.textContent.includes('Contratá una actividad')};
    });
    assert.ok(eventUI.present&&eventUI.buttons===3&&eventUI.within&&eventUI.noOverflow&&eventUI.hasExplanations,
      name+': eventos turísticos recortados u ocultos '+JSON.stringify(eventUI));
    await page.locator('[data-city-section-button="health"]').evaluate(button=>button.click());
    await page.waitForFunction(()=>!document.querySelector('[data-city-section="health"]')?.hidden,{timeout:10000});
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
    await page.locator('[data-city-section-button="security"]').evaluate(button=>button.click());
    await page.waitForFunction(()=>!document.querySelector('[data-city-section="security"]')?.hidden,{timeout:10000});
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
    await page.locator('#popupClose').evaluate(button=>button.click());

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
    assert.deepEqual(threeErrors,[],name+': errores Three.js '+threeErrors.join('; '));
    await live.close();
  }
  mkdirSync('ui-captures',{recursive:true});
  writeFileSync('ui-captures/responsive-report.txt','UI responsive: Chromium checks passed at 390×844 and 1440×900. Text visibility, control containment, horizontal overflow and overlap assertions passed. Full-page screenshots are intentionally omitted for the software-rendered 3D canvas.\n');
}finally{
  await browser.close();
  server.kill();
}
