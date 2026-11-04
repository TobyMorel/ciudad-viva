// Cámara cinematográfica: solo modifica la vista local; nunca pausa ni altera la simulación.
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.max(0,Math.trunc(Number(n)||0)).toLocaleString('es-AR');
const SCENES=[{id:'home',label:'Viviendas',accept:b=>b.kind==='home'},{id:'shop',label:'Comercios',accept:b=>b.kind==='shop'},
 {id:'park',label:'Plazas',accept:b=>b.serviceModel==='urbanPark'},{id:'factory',label:'Fábricas',accept:b=>b.kind==='factory'},
 {id:'port',label:'Puerto y servicios',accept:b=>['port','airport','fireStation','school','civic'].includes(b.kind)}];
export function cinematicStops(state){
 const buildings=state?.buildings||[],stops=[];
 for(const scene of SCENES){
  const options=buildings.filter(scene.accept);
  if(!options.length)continue;
  const building=options[Math.floor(Math.abs(Number(state?.day||1)+scene.id.length)%options.length)];
  stops.push({title:scene.label,x:building.x,y:building.y});
 }
 return stops.length?stops:(state?.roads||[]).length?[{title:'Primeras calles',x:state.roads[0][0],y:state.roads[0][1]}]:[];
}
export function cinematicComparison(state,area){
 const ids={oeste:[-Infinity,10],centro:[10,18],puerto:[18,Infinity]},[min,max]=ids[area]||ids.centro;
 const history=(state?.neighborhoodHistory?.snapshots||[]).filter(s=>(s.districts||[]).some(d=>d.id===area));
 const first=history[0]||null,last=history.at(-1)||null;
 const current=(state?.buildings||[]).filter(b=>Number(b.x)>=min&&Number(b.x)<max),homes=current.filter(b=>b.kind==='home');
 const snapshot={population:homes.reduce((s,b)=>s+Math.max(0,Number(b.occupants)||0),0),homes:homes.length,
  shops:current.filter(b=>b.kind==='shop').length,factories:current.filter(b=>b.kind==='factory').length,
  parks:current.filter(b=>b.serviceModel==='urbanPark').length};
 return {area,first:first?{day:first.day,...first.districts.find(d=>d.id===area)}:null,
  last:last?{day:last.day,...last.districts.find(d=>d.id===area)}:null,
  current:{day:state?.day||1,...snapshot}};
}
export function setupCinematicCamera({getState,getSubjects,onFocus,capture}){
 const trigger=document.getElementById('cinemaToggle');
 if(!trigger)return {close(){},refresh(){}};
 const panel=document.createElement('aside');
 panel.id='cinemaPanel';panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-label','Cámara cinematográfica 3D');
 panel.innerHTML='<header><div><small>CIUDAD VIVA · MODO CÁMARA</small><h2>Recorré tu ciudad</h2></div><button type="button" data-exit aria-label="Salir del modo cámara">×</button></header>'+
 '<div class="cinema-controls"><button type="button" data-tour aria-pressed="true">Recorrido automático</button>'+
 '<label>Seguir vehículo o vecino<select id="cinemaSubject"><option value="">Elegir actor real…</option></select></label>'+
 '<button type="button" data-photo>Guardar foto PNG</button><button type="button" data-compare>Antes / después</button></div>'+
 '<div class="cinema-status" role="status" aria-live="polite">Recorriendo lugares de tu ciudad.</div>'+
 '<div class="cinema-comparison" hidden></div>';
 document.body.append(panel);
 const subject=panel.querySelector('#cinemaSubject'),status=panel.querySelector('.cinema-status'),comparison=panel.querySelector('.cinema-comparison');
 let active=false,timer=null,followTimer=null,tour=true,nextStop=0,subjectId='',lastActorList='',latestStops=[];
 function refreshActors(){
  if(!active)return;
  const actors=(getSubjects?.()||[]).filter(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.title).slice(0,90);
  const signature=JSON.stringify(actors.map(a=>[a.id,a.type,a.title]));
  if(signature!==lastActorList){
   lastActorList=signature;
   const previous=subject.value;
   subject.replaceChildren(new Option('Elegir actor real…',''));
   for(const a of actors)subject.add(new Option(a.type+' · '+a.title,String(a.id)));
   subject.value=actors.some(a=>String(a.id)===previous)?previous:'';
   if(previous&&!subject.value)subjectId='';
  }
  return actors;
 }
 function follow(){
  if(!active||!subjectId)return;
  const actors=getSubjects?.()||[];
  const actor=actors.find(a=>String(a.id)===subjectId);
  if(!actor){subjectId='';status.textContent='El actor terminó su viaje. Elegí otro.';return}
  onFocus?.(actor.x,actor.y);
  status.textContent='Siguiendo '+actor.type.toLowerCase()+': '+actor.title;
 }
 function tourStep(){
  if(!active||!tour||subjectId)return;
  latestStops=cinematicStops(getState());
  if(!latestStops.length){status.textContent='Construí tus primeras calles para crear un recorrido.';return}
  const stop=latestStops[nextStop%latestStops.length];nextStop++;
  onFocus?.(stop.x,stop.y);
  status.textContent='Visitando '+stop.title.toLowerCase()+' · la escena se mueve con la simulación.';
 }
 function close(){
  if(!active)return;
  active=false;panel.hidden=true;document.body.classList.remove('cinema-mode');
  trigger.setAttribute('aria-pressed','false');clearInterval(timer);clearInterval(followTimer);timer=null;followTimer=null;
  comparison.hidden=true;
 }
 function open(){
  if(!getState())return;
  active=true;nextStop=0;tour=true;subjectId='';lastActorList='';subject.value='';
  panel.hidden=false;document.body.classList.add('cinema-mode');trigger.setAttribute('aria-pressed','true');
  panel.querySelector('[data-tour]').setAttribute('aria-pressed','true');
  panel.querySelector('[data-tour]').textContent='Recorrido: ON';
  refreshActors();tourStep();
  timer=setInterval(()=>{refreshActors();tourStep()},6500);
  followTimer=setInterval(follow,280);
 }
 trigger.addEventListener('click',()=>active?close():open());
 panel.addEventListener('click',event=>{
  if(event.target.closest('[data-exit]')){close();return}
  if(event.target.closest('[data-tour]')){
   tour=!tour;subjectId='';subject.value='';
   panel.querySelector('[data-tour]').setAttribute('aria-pressed',String(tour));
   panel.querySelector('[data-tour]').textContent=tour?'Recorrido: ON':'Recorrido: OFF';
   status.textContent=tour?'Volviendo al recorrido de los barrios.':'La cámara quedó libre. Podés moverla con el mapa.';
   if(tour)tourStep();return;
  }
  if(event.target.closest('[data-photo]')){
   try{
    const image=capture?.();
    if(!image||!image.startsWith('data:image/png'))throw Error('No se generó la foto.');
    const a=document.createElement('a');a.download='ciudad-viva-alfa-0.262-dia-'+(getState()?.day||1)+'.png';a.href=image;document.body.append(a);a.click();a.remove();
    status.textContent='Captura PNG guardada con la vista actual.';
   }catch(error){status.textContent='No se pudo generar la captura en este navegador: '+error.message}
   return;
  }
  if(event.target.closest('[data-compare]')){
   comparison.hidden=!comparison.hidden;
   if(comparison.hidden)return;
   const state=getState();
   const areas=[['oeste','Oeste'],['centro','Centro'],['puerto','Puerto']];
   comparison.innerHTML='<strong>Historia registrada de los barrios</strong><p>Comparación de datos guardados. No es una imagen reconstruida del pasado.</p>'+
     areas.map(([id,name])=>{
      const c=cinematicComparison(state,id);
      const label=v=>v?['Habitantes '+fmt(v.population),'Viviendas '+fmt(v.homes),'Comercios '+fmt(v.shops),'Fábricas '+fmt(v.factories),'Plazas '+fmt(v.parks)].join(' · '):'Sin registros anteriores';
      return '<div class="cinema-history"><b>'+name+'</b><small>Primer registro · '+(c.first?'Día '+fmt(c.first.day):'—')+'</small><span>'+label(c.first)+'</span>'+
       '<small>Ahora · Día '+fmt(c.current.day)+'</small><span>'+label(c.current)+'</span></div>';
     }).join('');return;
  }
 });
 subject.addEventListener('change',()=>{
  subjectId=subject.value;tour=false;
  panel.querySelector('[data-tour]').setAttribute('aria-pressed','false');
  panel.querySelector('[data-tour]').textContent='Recorrido: OFF';
  if(subjectId)follow();
  else status.textContent='Cámara libre. Podés elegir otro vehículo o volver al recorrido.';
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&active){event.stopPropagation();close();return}
  if(event.key?.toLowerCase()==='k'&&!event.ctrlKey&&!event.altKey&&!event.metaKey&&!['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName)&&!event.target?.isContentEditable){
   event.preventDefault();active?close():open();
  }
 });
 return {close,refresh(){if(active)refreshActors()}};
}
