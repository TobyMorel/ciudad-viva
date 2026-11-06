import {cityAdvice,cityMissions,collectNeighborhoods,neighborhoodTimeline,placementPreview} from './cityInsights.js';

const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt=value=>Math.round(Number(value)||0).toLocaleString('es-AR');
const money=value=>'$ '+fmt(value);
const gameDate=day=>'Año '+(Math.floor((Math.max(1,Number(day)||1)-1)/360)+1)+' · mes '+(Math.floor(((Math.max(1,Number(day)||1)-1)%360)/30)+1);
const buttonAction=(action,label)=>'<button type="button" class="companion-action" data-action="'+safe(action.type)+'"'+
 (action.tool?' data-tool="'+safe(action.tool)+'"':'')+
 (action.model?' data-model="'+safe(action.model)+'"':'')+
 (action.panel?' data-panel="'+safe(action.panel)+'"':'')+
 (Number.isFinite(action.x)?' data-x="'+action.x+'" data-y="'+action.y+'"':'')+'>'+safe(label)+'</button>';

export function setupCityCompanion({getState,projectTile,projectTiles,onTool,onPanel,onFocus,onCelebrate,serviceModels={}}){
 const launch=document.getElementById('cityCompanionButton'),canvas=document.getElementById('city'),wrap=document.querySelector('.world-wrap');
 if(!launch||!canvas||!wrap)return {refresh(){},gameReady(){},previewTool(){},previewTile(){},hidePreview(){},confirmPlanClick(){return false},updateMap(){}};
 const card=document.createElement('aside');
 card.id='cityCompanion';card.hidden=true;card.setAttribute('role','region');card.setAttribute('aria-label','Asesor y misiones de Ciudad Viva');
 card.innerHTML='<header class="companion-head"><div><small>TU AYUDANTE MUNICIPAL</small><h2>Descubrí tu ciudad</h2></div><button type="button" data-close aria-label="Cerrar asesor">×</button></header>'+
  '<nav class="companion-tabs" role="tablist" aria-label="Secciones del asesor">'+
  '<button role="tab" type="button" data-tab="advice">Asesor</button>'+
  '<button role="tab" type="button" data-tab="missions">Misiones</button>'+
  '<button role="tab" type="button" data-tab="districts">Barrios</button></nav><div class="companion-content" id="cityCompanionContent"></div>';
 document.body.append(card);
 const preview=document.createElement('aside');
 preview.id='cityPlanPreview';preview.hidden=true;preview.setAttribute('aria-label','Previsión de construcción');
 wrap.append(preview);
 const control=document.getElementById('plannerToggle');
 const markers=document.createElement('div');markers.id='neighborhoodMarkers';markers.className='neighborhood-markers';markers.setAttribute('aria-label','Nombres de los barrios');wrap.append(markers);
 let active=false,tab='advice',labelsVisible=false,planning=false,pending=null,currentTool=null,currentModel=null,lastPreviewTile=null,lastPreviewSignature='',lastRendered='',seen=new Set(),ready=false,districtSignature='',districtItems=[];
 const pane=card.querySelector('#cityCompanionContent');
 const sectionLabel=(text)=>'<p class="companion-note">'+safe(text)+'</p>';
 function stateSignature(){
  const s=getState();if(!s)return 'no-city';
  return JSON.stringify([s.stateRevision,s.day,s.population,s.money,(s.roads||[]).length,(s.zones||[]).length,(s.buildings||[]).length,(s.projects||[]).length,
   s.services,s.grossMonthlyIncome??s.monthlyIncome,s.effectiveMonthlyExpenses??s.monthlyExpenses,s.neighborhoodHistory?.lastMonth,s.cityMilestones?.completed?.length,tab]);
 }
 function close(){active=false;card.hidden=true;launch.setAttribute('aria-expanded','false')}
 function open(nextTab='advice'){
  if(!getState())return;
  active=true;tab=nextTab;card.hidden=false;launch.setAttribute('aria-expanded','true');lastRendered='';render();card.querySelector('[data-tab="'+tab+'"]')?.focus({preventScroll:true});
 }
 launch.addEventListener('click',()=>active?close():open('advice'));
 card.addEventListener('click',event=>{
  if(event.target.closest('[data-close]')){close();return}
  const tabButton=event.target.closest('[data-tab]');
  if(tabButton){tab=tabButton.dataset.tab;lastRendered='';render();return}
  const toggle=event.target.closest('[data-show-districts]');
  if(toggle){labelsVisible=!labelsVisible;lastRendered='';render();updateMap();return}
  const district=event.target.closest('[data-focus-district]');
  if(district){const entry=collectNeighborhoods(getState()).find(x=>x.id===district.dataset.focusDistrict);if(entry){onFocus?.(entry.x,entry.y);updateMap()}return}
  const button=event.target.closest('[data-action]');
  if(!button)return;
  const action=button.dataset.action;
  if(action==='tool'){onTool?.(button.dataset.tool,button.dataset.model||null);close()}
  else if(action==='panel'){onPanel?.(button.dataset.panel);close()}
  else if(action==='focus'){onFocus?.(Number(button.dataset.x),Number(button.dataset.y));close()}
 });
 function advisorMarkup(){
  const items=cityAdvice(getState());
  return '<div class="companion-intro"><strong>¿Qué necesita mi ciudad ahora?</strong><p>Te contamos causas reales y qué botón tocar. Las sugerencias no hacen obras solas.</p></div>'+
   (items.length?items.slice(0,6).map((item,index)=>
    '<article class="companion-item '+(index===0?'companion-primary':'')+'"><span class="companion-step">'+(index===0?'PRIMERO':'SUGERENCIA')+'</span><h3>'+safe(item.title)+'</h3><p>'+safe(item.description)+'</p>'+
    buttonAction(item.action,item.action.type==='tool'?'Mostrar herramienta':item.action.type==='focus'?'Ir al edificio':'Abrir panel')+'</article>').join(''):
   '<div class="companion-empty"><strong>La ciudad está equilibrada según estos indicadores.</strong><p>Podés seguir planificando o consultar las misiones.</p></div>')+
   sectionLabel('El asesor usa demanda, servicios, carreteras y tesorería del estado actual. Si un servicio tiene capacidad o personal insuficiente, construir una planta no garantiza la solución.');
 }
 function missionMarkup(){
  const items=cityMissions(getState()),total=items.filter(m=>m.done).length,first=items.find(m=>!m.done);
  return '<div class="companion-intro"><strong>'+total+' de '+items.length+' misiones cumplidas</strong>'+
   '<div class="companion-progress"><i style="width:'+(total/items.length*100)+'%"></i></div>'+
   '<p>Son desafíos voluntarios. No bloquean construcciones ni entregan dinero gratis. Los hitos quedan guardados con la partida.</p></div>'+
   items.map(m=>'<article class="companion-item companion-mission '+(m.done?'is-done':m===first?'is-next':'')+'">'+
    '<div class="companion-mission-top"><span class="companion-step">'+(m.done?'CUMPLIDA':m===first?'PRÓXIMA':'MISIÓN '+(m.index+1))+'</span><b>'+fmt(m.progress)+' / '+fmt(m.goal)+'</b></div>'+
    '<h3>'+safe(m.title)+'</h3><p>'+safe(m.description)+'</p>'+
    '<div class="companion-progress"><i style="width:'+Math.min(100,Math.round(m.progress/m.goal*100))+'%"></i></div>'+
    (m.done?'<small>Completada con resultados de tu ciudad.</small>':buttonAction(m.action,m.action.type==='tool'?'Ir a construir':'Consultar ciudad'))+
    '</article>').join('');
 }
 function districtMarkup(){
  const s=getState(),districts=collectNeighborhoods(s);
  return '<div class="companion-intro"><strong>Tres distritos, tres historias</strong>'+
   '<p>Cada barrio cambia con sus residentes, comercios, plazas y edificios. El diario se actualiza una vez por mes del juego.</p>'+
   '<button type="button" class="companion-layer" data-show-districts aria-pressed="'+labelsVisible+'">'+(labelsVisible?'Ocultar nombres en el mapa':'Mostrar nombres en el mapa')+'</button></div>'+
   districts.map(d=>{
    const timeline=neighborhoodTimeline(s,d.id);
    return '<article class="companion-item companion-district"><span class="companion-step">'+safe(d.character.toUpperCase())+'</span><h3>'+safe(d.name)+'</h3>'+
    '<p>'+safe(d.reason)+'</p>'+
    '<div class="companion-stats"><span><b>'+fmt(d.population)+'</b> vecinos</span><span><b>'+fmt(d.homes)+'</b> viviendas</span><span><b>'+fmt(d.shops)+'</b> comercios</span><span><b>'+fmt(d.factories)+'</b> fábricas</span><span><b>'+fmt(d.parks)+'</b> plazas</span><span><b>'+fmt(d.streets)+'</b> calles</span></div>'+
    (d.supplyPct===null?'':sectionLabel('Suministros de viviendas: '+fmt(d.supplyPct)+' % de media.'))+
    (d.condition===null?'':sectionLabel('Estado edilicio medio: '+fmt(d.condition)+' %.'))+
    (d.oldestYear?' <p class="companion-history">Edificio más antiguo conservado: '+d.oldestYear+'.</p>':'')+
    (d.heritage?' <p class="companion-history">Bienes de interés patrimonial: '+fmt(d.heritage)+'.</p>':'')+
    '<details class="companion-history"><summary>Historia real del barrio</summary>'+
    (timeline.length?'<ul>'+timeline.map(t=>'<li><b>'+gameDate(t.day)+'</b> · '+safe(t.text)+'</li>').join('')+'</ul>':'<p>El diario empieza al guardar el primer mes de la ciudad.</p>')+
    '</details>'+
    '<button type="button" class="companion-action" data-focus-district="'+safe(d.id)+'">Ver barrio en el mapa</button></article>';
   }).join('')+sectionLabel('Los nombres señalan los distritos oficiales Oeste, Centro y Puerto. No se crean habitantes ni eventos ficticios.');
 }
 function render(){
  if(!active)return;
  const signature=stateSignature()+'|'+labelsVisible;
  if(signature===lastRendered)return;
  const scroll=pane.scrollTop;
  for(const button of card.querySelectorAll('[data-tab]')){
   const chosen=button.dataset.tab===tab;button.setAttribute('aria-selected',String(chosen));button.tabIndex=chosen?0:-1;
  }
  pane.innerHTML=tab==='advice'?advisorMarkup():tab==='missions'?missionMarkup():districtMarkup();
  pane.scrollTop=scroll;lastRendered=signature;
 }
 function refresh(){
  const s=getState();if(!s)return;
  const problems=cityAdvice(s),count=problems.filter(p=>p.priority>=85).length;
  const indicator=launch.querySelector('.companion-indicator');
  if(indicator){indicator.hidden=count===0;indicator.textContent=String(count);launch.title=count?count+' recomendaciones prioritarias para tu ciudad':'Abrir asesor de la ciudad'}
  if(ready){
   const done=cityMissions(s).filter(m=>m.done),newly=done.filter(m=>!seen.has(m.id));
   for(const m of newly){seen.add(m.id);onCelebrate?.('¡Misión cumplida! '+m.title)}
  }
  render();
  if(labelsVisible)updateMap();
  if(lastPreviewTile)previewTile(lastPreviewTile,{force:true});
 }
 function gameReady(){
  ready=true;seen=new Set(cityMissions(getState()).filter(m=>m.done).map(m=>m.id));
  pending=null;lastPreviewTile=null;hidePreview();lastRendered='';if(active)render();updateMap();
 }
 function previewTool(tool,model){
  currentTool=tool;currentModel=model||null;pending=null;lastPreviewSignature='';hidePreview();
 }
 function eligibleTool(){
  return !['inspect','demolish','zoneClear','relocateBuilding','metroLink','railLink','busStop','taxiStop'].includes(currentTool);
 }
 function previewTile(tile,{force=false}={}){
  if(!eligibleTool()||!getState())return hidePreview();
  const report=placementPreview(getState(),{tool:currentTool,model:currentModel},tile,serviceModels);
  if(!report)return hidePreview();
  const key=[getState()?.stateRevision,currentTool,currentModel,report.x,report.y,pending].join('/');
  if(!force&&key===lastPreviewSignature)return;
  lastPreviewTile={x:tile.x,y:tile.y};lastPreviewSignature=key;
  const title='<header><b>'+safe(report.label)+'</b><span>PARCELA '+(report.x+1)+' · '+(report.y+1)+'</span></header>';
  const stats='<div class="plan-stats">'+
   (report.price!==null?'<span>Construcción <b>'+money(report.price)+'</b></span>':'<span>Permiso privado <b>Sin coste directo</b></span>')+
   (report.monthlyCost!==null?'<span>Operación base <b>'+money(report.monthlyCost)+'/mes</b></span>':'')+
   (report.radius!==null?'<span>Radio vial <b>'+report.radius+' calles</b></span>':'')+
   (report.radius!==null||['powerPlant','waterPlant','wastewaterPlant'].includes(report.tool)?'<span>Edificios alcanzables <b>'+fmt(report.reachedBuildings)+'</b></span>':'')+
   (report.radius!==null?'<span>Hogares / vecinos <b>'+fmt(report.reachedHomes)+' / '+fmt(report.residents)+'</b></span>':'')+
   (report.lacking!==null?'<span>Edificios con déficit actual <b>'+fmt(report.lacking)+'</b></span>':'')+'</div>';
  const confirmed=planning&&pending===[currentTool,currentModel||'',report.x,report.y].join(':');
  preview.innerHTML=title+(report.warning?'<p class="plan-warning">'+safe(report.warning)+'</p>':'')+stats+
   (report.zoningHint?'<p>'+safe(report.zoningHint)+'</p>':'')+
   '<small>'+safe(report.note)+'</small>'+
   (planning&&eligibleTool()&&!['zoneHome','zoneShop','zoneFactory'].includes(currentTool)?'<p class="plan-confirm">'+(confirmed?'Tocá o hacé clic otra vez en la misma parcela para confirmar.':'Modo planificar: primer toque para revisar; segundo toque en la misma parcela para construir.')+'</p>':'');
  preview.hidden=false;preview.dataset.tool=report.tool;
 }
 function hidePreview(){preview.hidden=true;lastPreviewSignature='';lastPreviewTile=null}
 function confirmPlanClick(tile){
  if(!planning||!eligibleTool()||['zoneHome','zoneShop','zoneFactory'].includes(currentTool)||!tile||!Number.isInteger(tile.x)||!Number.isInteger(tile.y))return false;
  if(!placementPreview(getState(),{tool:currentTool,model:currentModel},tile,serviceModels))return false;
  const next=[currentTool,currentModel||'',tile.x,tile.y].join(':');
  if(pending===next){pending=null;return false}
  pending=next;previewTile(tile,{force:true});return true;
 }
 if(control)control.addEventListener('click',()=>{
  planning=!planning;pending=null;control.setAttribute('aria-pressed',String(planning));
  control.textContent=planning?'Planificar: ON':'Planificar';
  control.title=planning?'Primer toque: ver previsión; segundo toque: construir':'Activar confirmación en dos toques para edificios';
  if(lastPreviewTile)previewTile(lastPreviewTile,{force:true});
 });
 markers.addEventListener('click',event=>{
  const button=event.target.closest('[data-map-district]');
  if(!button)return;
  const d=collectNeighborhoods(getState()).find(v=>v.id===button.dataset.mapDistrict);
  if(d){open('districts');onFocus?.(d.x,d.y)}
 });
 let frame=0;
 function updateMap(){
  if(!labelsVisible||!getState()){markers.hidden=true;return}
  markers.hidden=false;
  if(frame)return;
  frame=requestAnimationFrame(()=>{
   frame=0;
   if(!labelsVisible)return;
   const state=getState(),signature=`${state.stateRevision||0}:${state.day||0}:${state.population||0}:${(state.buildings||[]).length}`;
   if(signature!==districtSignature){districtSignature=signature;districtItems=collectNeighborhoods(state);markers.replaceChildren();for(const d of districtItems){const button=document.createElement('button');button.type='button';button.className='neighborhood-marker';button.dataset.mapDistrict=d.id;button.textContent=d.name+' · '+fmt(d.population);button.title=d.character+' · Ver barrio';markers.append(button)}}
   const c=canvas.getBoundingClientRect(),w=wrap.getBoundingClientRect(),points=projectTiles?projectTiles(districtItems.map(d=>({x:d.x,y:d.y,height:2.5}))):districtItems.map(d=>projectTile(d.x,d.y,2.5));
   districtItems.forEach((d,index)=>{const p=points[index],button=markers.children[index];button.hidden=!p.visible;if(p.visible){button.style.left=c.left-w.left+p.x+'px';button.style.top=c.top-w.top+p.y+'px'}});
  });
 }
 window.addEventListener('resize',updateMap);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active)close()});
 return {refresh,gameReady,previewTool,previewTile,hidePreview,confirmPlanClick,updateMap};
}
