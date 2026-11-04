import {residentDirectory,residentStory,livingMomentVisuals,citizenName} from './living_city.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const n=value=>Math.max(0,Math.trunc(Number(value)||0)).toLocaleString('es-AR');
export function setupLivingCityUI({getState,getResidentPosition,onFocus}){
 const trigger=document.getElementById('lifeStoriesToggle');
 if(!trigger)return {refresh(){},openResident(){},close(){}};
 const panel=document.createElement('aside');panel.id='lifeStoriesPanel';panel.hidden=true;
 panel.setAttribute('role','region');panel.setAttribute('aria-label','Historias de vecinos y grandes momentos');
 panel.innerHTML='<header><div><small>CIUDAD VIVA · ALFA 0.263</small><h2>Historias de la ciudad</h2></div><button type="button" data-life-close aria-label="Cerrar historias">×</button></header>'+
 '<div class="life-tabs" role="tablist"><button data-life-tab="people" role="tab" aria-selected="true">Vecinos</button><button data-life-tab="moments" role="tab" aria-selected="false">Grandes momentos</button></div>'+
 '<div class="life-list-zone"><label class="life-search-label">Buscar vecino por identificador o empleo<input id="lifeResidentSearch" placeholder="Por ejemplo: Municipalidad" autocomplete="off"></label><div class="life-people-list"></div></div>'+
 '<div class="life-details" aria-live="polite"></div><div class="life-moments" hidden></div>';
 document.body.append(panel);
 const list=panel.querySelector('.life-people-list'),details=panel.querySelector('.life-details'),search=panel.querySelector('#lifeResidentSearch'),moments=panel.querySelector('.life-moments');
 let active=false,tab='people',selectedId=null,followId=null,previousFocus=null,followTimer=null,roster=[],rosterKey='',seenMoments=new Set();
 function directory(){const s=getState();return residentDirectory(s,Math.min(800,Math.max(200,(Number(s?.population)||200)+100)))}
 function renderList(){
  if(!active||tab!=='people')return;
  const term=search.value.toLocaleLowerCase('es-AR').trim();
  const rows=(term?roster.filter(p=>(p.name+' '+(p.employerName||'')+' '+p.status+' '+p.id).toLocaleLowerCase('es-AR').includes(term)):roster).slice(0,36);
  list.innerHTML=rows.map(p=>'<button type="button" data-life-resident="'+esc(p.id)+'" class="life-person'+(p.id===selectedId?' is-active':'')+'">'+
   '<span class="life-avatar" aria-hidden="true">●</span><span><b>'+esc(p.name)+'</b><small>'+esc(p.employerName||p.status)+' · hogar '+(p.home[0]+1)+','+(p.home[1]+1)+'</small></span></button>').join('')+
   (!rows.length?'<p>No hay residentes que coincidan con la búsqueda.</p>':'')+
   (roster.length>36&&!term?'<small>Mostrando una selección de 36 vecinos. Usá el buscador para encontrar más.</small>':'');
 }
 function renderPerson(){
  if(!active||tab!=='people')return;
  const state=getState(),story=residentStory(state,selectedId);
  if(!story){details.innerHTML='<p>Elegí un habitante para conocer su historia real.</p>';return}
  const p=story.person;
  const commute=story.commute;
  details.innerHTML='<h3>'+esc(p.name)+'</h3><p>'+esc(story.situation)+'. Vive en '+esc(p.homeName)+'.</p>'+
   '<div class="life-data"><span>Hogar<b>'+p.home.map(x=>x+1).join(', ')+'</b></span><span>Ingreso mensual<b>$ '+n(p.monthlyWage)+'</b></span>'+
   '<span>Desempleo registrado<b>'+n(p.unemploymentEpisodes)+' episodio(s)</b></span></div>'+
   (commute?'<p>Trabajo: '+esc(commute.destination)+' · '+n(commute.route.length-1)+' tramos. '+(commute.mode==='walk'?'Su caminata puede seguirse en el mapa.':'Su traslado está agrupado en la simulación; el modelo 3D permanece cerca de su vivienda.')+'</p>':
    '<p>No hay un trayecto individual de trabajo confirmado; el seguimiento se realiza desde su vivienda.</p>')+
   '<button type="button" class="life-follow" data-life-follow="'+esc(p.id)+'" aria-pressed="'+String(followId===p.id)+'">'+(followId===p.id?'Dejar de seguir':'Seguir en 3D')+'</button>'+
   '<h4>Su historia registrada</h4><ol class="life-timeline">'+story.history.map(e=>'<li><small>Día '+n(e.day)+'</small><span>'+esc(e.detail)+'</span></li>').join('')+'</ol>'+
   (!story.history.length?'<p class="life-empty">Los cambios registrados desde esta versión aparecerán aquí; no se inventa el pasado anterior.</p>':'');
 }
 function renderMoments(){
  if(!active||tab!=='moments')return;
  const current=getState()?.livingCity?.moments||[];
  moments.innerHTML='<p>Hitos detectados en el motor; los cambios anteriores a esta versión no se reconstruyen.</p>'+
   [...current].reverse().slice(0,25).map(m=>'<article class="life-moment"><small>Día '+n(m.day)+' · '+esc(m.type||'Acontecimiento')+'</small><h3>'+esc(m.title)+'</h3><p>'+esc(m.detail)+'</p><button type="button" data-life-moment="'+esc(m.id)+'">Ver lugar en el mapa</button></article>').join('')+
   (!current.length?'<p>No se registraron grandes momentos todavía. Desarrollá la ciudad y participá en sus acontecimientos.</p>':'');
 }
 function render(){
  if(!active)return;
  roster=directory();
  panel.querySelector('.life-list-zone').hidden=tab!=='people';
  panel.querySelector('.life-details').hidden=tab!=='people';
  moments.hidden=tab!=='moments';
  for(const btn of panel.querySelectorAll('[data-life-tab]'))btn.setAttribute('aria-selected',String(btn.dataset.lifeTab===tab));
  if(tab==='people'){renderList();renderPerson()}else renderMoments();
 }
 function show(t='people'){
  if(!getState())return;
  active=true;tab=t;panel.hidden=false;trigger.setAttribute('aria-pressed','true');render();
 }
 function stopFollow(){followId=null;previousFocus=null}
 function close(){active=false;stopFollow();panel.hidden=true;trigger.setAttribute('aria-pressed','false')}
 function focusResident(id){
  const person=residentStory(getState(),id)?.person;if(!person)return;
  const loc=getResidentPosition?.(id),x=loc?.x??person.home[0],y=loc?.y??person.home[1];
  if(!previousFocus||Math.hypot(x-previousFocus[0],y-previousFocus[1])>.09){
   previousFocus=[x,y];onFocus?.(x,y);
  }
 }
 function openResident(id){
  const p=residentStory(getState(),id);if(!p)return;
  selectedId=String(id);tab='people';show('people');renderPerson();
 }
 trigger.addEventListener('click',()=>active?close():show());
 panel.addEventListener('input',e=>{if(e.target===search)renderList()});
 document.addEventListener('click',event=>{
  const open=event.target.closest('[data-life-resident]');
  if(open){event.preventDefault();openResident(open.dataset.lifeResident);return}
 });
 panel.addEventListener('click',event=>{
  if(event.target.closest('[data-life-close]')){close();return}
  const tabButton=event.target.closest('[data-life-tab]');
  if(tabButton){tab=tabButton.dataset.lifeTab;render();return}
  const follow=event.target.closest('[data-life-follow]');
  if(follow){
   const id=String(follow.dataset.lifeFollow);
   if(followId===id){stopFollow();renderPerson();return}
   followId=id;previousFocus=null;focusResident(id);renderPerson();return;
  }
  const moment=event.target.closest('[data-life-moment]');
  if(moment){
   const m=(getState()?.livingCity?.moments||[]).find(x=>x.id===moment.dataset.lifeMoment);
   if(m&&Number.isInteger(m.x)&&Number.isInteger(m.y)){onFocus?.(m.x,m.y);close()}
  }
 });
 followTimer=setInterval(()=>{
  if(!active||!followId)return;
  if(!residentStory(getState(),followId)){stopFollow();render();return}
  focusResident(followId);
 },550);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active)close()});
 function refresh(){
  if(!getState())return;
  if(active)render();
  // Una sola señal discreta por hito real, no reaparece cada actualización o cada render.
  const current=livingMomentVisuals(getState()).filter(m=>m.day===getState().day);
  const canNotify=document.getElementById('modeBackdrop')?.classList.contains('hidden');
  if(!canNotify)return;
  const newMoment=current.filter(m=>!seenMoments.has(m.id)).at(-1);
  if(newMoment){
   for(const moment of current)seenMoments.add(moment.id);
   const banner=document.createElement('button');banner.type='button';banner.className='life-event-banner';
   banner.textContent='✦ '+newMoment.title+' · Ver historia';
   banner.setAttribute('aria-label',newMoment.title+'. Abrir grandes momentos');
   banner.addEventListener('click',()=>{banner.remove();show('moments')});
   document.querySelector('.life-event-banner')?.remove();
   document.body.append(banner);
   setTimeout(()=>banner.remove(),7800);
  }
 }
 return {refresh,openResident,close};
}
