// Tutorial básico independiente del motor: no modifica partidas ni ejecuta construcciones.
export const BEGINNER_TUTORIAL_STEPS = Object.freeze([
 {id:'welcome',title:'¡Hola, alcaldesa o alcalde!',body:'Esta es tu ciudad. Vamos a aprender de a poquito. No hace falta saber nada. Podés jugar, equivocarte y volver a intentar.',action:'Este botón dice Construir. Ahí están las herramientas. Tocá Siguiente para empezar.',target:'.game-dock [data-popup="build"]'},
 {id:'roads',title:'1. Dibujá las calles',body:'Las calles son los caminos de la ciudad. Las casas, las obras y los camiones necesitan estar conectados por caminos.',action:'Elegí Construir calle y tocá o arrastrá sobre el mapa para hacer un camino unido a la entrada de la ciudad.',tool:'road',target:'.tool[data-tool="road"]',check:'roads'},
 {id:'power',title:'2. Llevá electricidad',body:'La luz no aparece sola. Una central eléctrica produce energía, y las calles conectadas la llevan a los edificios.',action:'Elegí Central eléctrica y colocala en un terreno libre junto a una calle conectada. La obra necesita terminar para dar luz.',tool:'powerPlant',target:'.tool[data-tool="powerPlant"]',check:'power'},
 {id:'water',title:'3. Llevá agua',body:'Las personas necesitan agua limpia. Una planta potabilizadora la prepara para los edificios unidos por calles.',action:'Elegí Planta potabilizadora. Colocala junto a una calle y dejá que termine su construcción.',tool:'waterPlant',target:'.tool[data-tool="waterPlant"]',check:'water'},
 {id:'sewer',title:'4. Limpiá el agua usada',body:'Después de usar el agua, hay que tratarla. La planta depuradora ayuda a que la ciudad tenga saneamiento.',action:'Elegí Planta depuradora y construí una cerca de las calles. Recordá que las obras cuestan dinero.',tool:'wastewaterPlant',target:'.tool[data-tool="wastewaterPlant"]',check:'sewer'},
 {id:'homes',title:'5. Pintá un lugar para vivir',body:'El verde de Zona residencial significa: aquí pueden aparecer casas. No es lo mismo que una plaza o un parque.',action:'Elegí Zona residencial y arrastrá por parcelas vacías junto a una calle. Las casas privadas llegarán si hay demanda y servicios.',tool:'zoneHome',target:'.tool[data-tool="zoneHome"]',check:'homes'},
 {id:'park',title:'6. Poné una plaza linda',body:'Una plaza es un lugar para jugar, pasear y descansar. Ayuda al bienestar del barrio; no reemplaza las casas ni la electricidad.',action:'Buscá Plaza barrial y colocala cerca de las viviendas, con acceso a una calle.',tool:'civic',model:'urbanPark',target:'.tool[data-tool="civic"][data-model="urbanPark"]',check:'park'},
 {id:'demand',title:'7. Mirá qué te pide la ciudad',body:'Estas barritas se llaman Demanda. Te cuentan si hace falta más vivienda, más comercios o más fábricas. Si una barra está baja, no hace falta construir de más.',action:'Mirá las tres barritas: VIVIENDAS, COMERCIOS y FÁBRICAS. Después elegí qué necesita tu ciudad.',target:'#growthDemand'},
 {id:'shops',title:'8. Dejá que abran comercios',body:'Las tiendas venden cosas y ofrecen trabajo. Necesitan compradores y calles para recibir productos.',action:'Elegí Zona comercial y pintá unas parcelas cerca de las viviendas y las calles. Esperá a que exista demanda.',tool:'zoneShop',target:'.tool[data-tool="zoneShop"]',check:'shops'},
 {id:'industry',title:'9. Prepará lugares de trabajo',body:'Las fábricas crean productos y empleos. También usan suministros y pueden necesitar trabajadores.',action:'Si la barra de FÁBRICAS muestra demanda, elegí Zona industrial y pintá cerca de una calle. No llenes todo el mapa de una vez.',tool:'zoneFactory',target:'.tool[data-tool="zoneFactory"]',check:'industry'},
 {id:'budget',title:'10. Cuidá el dinero',body:'La Tesorería es la alcancía de la ciudad. Construir gasta dinero. Mantener calles y servicios también cuesta todos los meses.',action:'Mirá el dinero de arriba y tocá su flechita para ver ingresos y gastos. Si gastás más de lo que entra, frená un poco.',target:'.metric-treasury #treasuryDetails'},
 {id:'projects',title:'11. Revisá las obras',body:'Algunos edificios no aparecen al instante. Primero se construyen. En Obras podés mirar si siguen avanzando o si se detuvieron.',action:'Abrí Obras y revisá los proyectos. Si algo no avanza, comprobá calles, suministros y presupuesto.',target:'.game-dock [data-popup="projects"]'},
 {id:'services',title:'12. Escuchá a tus vecinos',body:'Con más habitantes, harán falta escuelas, salud, bomberos, policía y recolección de residuos. Cada servicio necesita dinero, personal y caminos.',action:'Abrí Avisos cuando alguien necesite ayuda. Construí solo lo que haga falta y revisá los servicios de vez en cuando.',target:'.game-dock [data-popup="alerts"]'},
 {id:'finish',title:'¡Ya podés hacer crecer tu ciudad!',body:'Recordá: calles, luz, agua, viviendas, plazas, trabajo y dinero. Mirá la demanda y avanzá despacito. La ciudad mejora paso a paso.',action:'Podés abrir esta guía otra vez desde el botón Guía. ¡Ahora te toca jugar!',target:'#tutorialHelpButton'}
]);

const built = (state,kind,model) => [...(state?.buildings||[]),...(state?.projects||[])].some(item =>
 (item?.kind===kind||item?.buildingKind===kind||item?.type===kind) && (!model||item?.serviceModel===model||item?.model===model)
);
export function isBeginnerStepComplete(step,state){
 if(!state||!step?.check)return null;
 const zones=state.zones||[],buildings=state.buildings||[];
 switch(step.check){
  case 'roads':return (state.roads||[]).length>0;
  case 'power':return built(state,'powerPlant');
  case 'water':return built(state,'waterPlant');
  case 'sewer':return built(state,'wastewaterPlant');
  case 'homes':return zones.some(z=>z?.kind==='home')||buildings.some(b=>b?.kind==='home');
  case 'park':return built(state,'civic','urbanPark');
  case 'shops':return zones.some(z=>z?.kind==='shop')||buildings.some(b=>b?.kind==='shop');
  case 'industry':return zones.some(z=>z?.kind==='factory')||buildings.some(b=>b?.kind==='factory');
  default:return null;
 }
}

export function setupBeginnerTutorial({getState}){
 const trigger=document.getElementById('tutorialHelpButton');
 if(!trigger)return {onGameReady(){},refresh(){}};
 const card=document.createElement('aside');
 card.id='beginnerTutorial';card.hidden=true;card.setAttribute('role','dialog');
 card.setAttribute('aria-modal','false');card.setAttribute('aria-labelledby','tutorialTitle');
 card.innerHTML='<header class="tutorial-head"><span class="tutorial-eyebrow">GUÍA PARA EMPEZAR</span><button type="button" data-tutorial-close aria-label="Cerrar el tutorial">×</button></header>'+
  '<div class="tutorial-progress"><span id="tutorialCount"></span><div class="tutorial-progress-track"><i></i></div></div>'+
  '<h2 id="tutorialTitle" tabindex="-1"></h2><p id="tutorialDescription"></p><p class="tutorial-action" id="tutorialAction"></p>'+
  '<p class="tutorial-check" id="tutorialCheck" aria-live="polite"></p>'+
  '<footer class="tutorial-controls"><button type="button" data-tutorial-voice aria-pressed="true">Silenciar voz</button>'+
  '<button type="button" data-tutorial-repeat>Escuchar otra vez</button></footer>'+
  '<nav class="tutorial-navigation" aria-label="Pasos del tutorial"><button type="button" data-tutorial-prev>Anterior</button>'+
  '<button type="button" data-tutorial-next>Siguiente</button></nav>'+
  '<button type="button" class="tutorial-skip" data-tutorial-close>Salir de la guía</button>';
 const spotlight=document.createElement('div');
 spotlight.id='tutorialSpotlight';spotlight.hidden=true;spotlight.setAttribute('aria-hidden','true');
 document.body.append(spotlight,card);
 let stepIndex=0,active=false,ready=false,toolChosen=false,frame=0;
 let voiceEnabled=true;
 try{voiceEnabled=localStorage.getItem('cv-tutorial-voice-v1')!=='off'}catch{}
 const $=selector=>card.querySelector(selector);
 const canSpeak=()=>typeof window!=='undefined'&&'speechSynthesis' in window&&typeof SpeechSynthesisUtterance!=='undefined';
 const stopSpeaking=()=>{if(canSpeak())window.speechSynthesis.cancel()};
 function speak(){
  stopSpeaking();
  if(!active||!voiceEnabled||!canSpeak())return;
  const step=BEGINNER_TUTORIAL_STEPS[stepIndex];
  try{
   const speech=new SpeechSynthesisUtterance([step.title,step.body,step.action].join('. '));
   speech.lang='es-AR';speech.rate=.88;speech.pitch=1.08;
   const voices=window.speechSynthesis.getVoices();
   speech.voice=voices.find(v=>v.lang.toLowerCase()==='es-ar')||
    voices.find(v=>v.lang.toLowerCase().startsWith('es'))||null;
   window.speechSynthesis.speak(speech);
  }catch{/* El tutorial escrito sigue disponible aunque falle el motor de voz. */}
 }
 function schedulePosition(){
  if(frame||!active)return;
  frame=requestAnimationFrame(()=>{frame=0;position()});
 }
 function position(){
  if(!active)return;
  const step=BEGINNER_TUTORIAL_STEPS[stepIndex];
  const selector=step.tool&&toolChosen?'#city':step.target;
  const target=document.querySelector(selector);
  if(!target||!target.getClientRects().length){spotlight.hidden=true;return}
  const rect=target.getBoundingClientRect();
  if(rect.width<2||rect.height<2){spotlight.hidden=true;return}
  const margin=5;
  spotlight.hidden=false;spotlight.dataset.target=step.tool&&toolChosen?'map':step.id;
  Object.assign(spotlight.style,{left:Math.max(0,rect.left-margin)+'px',top:Math.max(0,rect.top-margin)+'px',
   width:Math.min(innerWidth,rect.width+margin*2)+'px',height:Math.min(innerHeight,rect.height+margin*2)+'px'});
  const w=card.offsetWidth||320,h=card.offsetHeight||275;
  if(innerWidth<=650){
   card.style.left=Math.max(8,(innerWidth-w)/2)+'px';
   card.style.top='8px';return;
  }
  let left=rect.left+rect.width/2-w/2;
  left=Math.max(12,Math.min(innerWidth-w-12,left));
  const below=rect.bottom+15,above=rect.top-h-15;
  let top=above>=10?above:(below+h<innerHeight-10?below:Math.max(10,innerHeight-h-15));
  if(step.tool&&toolChosen){left=Math.max(12,innerWidth-w-22);top=90}
  if(step.id==='demand'){left=Math.max(12,rect.left-w-18);top=Math.min(rect.top,innerHeight-h-12)}
  card.style.left=left+'px';card.style.top=Math.max(10,Math.min(innerHeight-h-10,top))+'px';
 }
 function status(){
  const step=BEGINNER_TUTORIAL_STEPS[stepIndex];
  const done=isBeginnerStepComplete(step,getState());
  const label=$('#tutorialCheck');
  label.hidden=done===null;
  label.textContent=done?'¡Bien! Este paso ya aparece en tu ciudad.':'Todavía no está hecho. Podés probar ahora o seguir aprendiendo.';
 }
 function showToolPlacement(){
  if(!active||!toolChosen)return;
  $('#tutorialAction').textContent='¡Bien! Elegiste la herramienta. Ahora tocá o arrastrá sobre el mapa donde quieras colocarla. '+BEGINNER_TUTORIAL_STEPS[stepIndex].action;
  schedulePosition();
 }
 function prepareTool(step){
  if(!step.tool)return;
  const popup=document.getElementById('panelPopup');
  if(popup?.classList.contains('hidden')||!popup?.classList.contains('build-drawer-open')){
   document.querySelector('.game-dock [data-popup="build"]')?.click();
  }
  // El catálogo recuerda filtros y búsquedas anteriores: recuperamos la herramienta indicada.
  const all=document.querySelector('[data-build-filter="all"]');
  if(all&&all.getAttribute('aria-pressed')!=='true')all.click();
  const search=document.querySelector('[data-build-search]');
  if(search&&search.value){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}))}
  const target=document.querySelector(step.target);
  if(target)target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
 }
 function showStep({read=true}={}){
  if(!active)return;
  toolChosen=false;
  const step=BEGINNER_TUTORIAL_STEPS[stepIndex];
  const popup=document.getElementById('panelPopup');
  if(!step.tool&&!popup?.classList.contains('hidden'))document.getElementById('popupClose')?.click();
  if(step.tool)prepareTool(step);
  $('#tutorialTitle').textContent=step.title;
  $('#tutorialDescription').textContent=step.body;
  $('#tutorialAction').textContent=step.action;
  $('#tutorialCount').textContent='PASO '+(stepIndex+1)+' DE '+BEGINNER_TUTORIAL_STEPS.length;
  $('.tutorial-progress-track i').style.width=((stepIndex+1)/BEGINNER_TUTORIAL_STEPS.length*100)+'%';
  $('[data-tutorial-prev]').disabled=stepIndex===0;
  $('[data-tutorial-next]').textContent=stepIndex===BEGINNER_TUTORIAL_STEPS.length-1?'Terminar':'Siguiente';
  status();
  schedulePosition();
  if(read)speak();
 }
 function close(){
  active=false;card.hidden=true;spotlight.hidden=true;stopSpeaking();
  try{localStorage.setItem('cv-tutorial-introduced-v1','yes')}catch{}
  trigger.setAttribute('aria-expanded','false');
 }
 function open(){
  if(!ready)return;
  active=true;card.hidden=false;stepIndex=0;toolChosen=false;
  trigger.setAttribute('aria-expanded','true');
  showStep();$('#tutorialTitle').focus({preventScroll:true});
  try{localStorage.setItem('cv-tutorial-introduced-v1','yes')}catch{}
 }
 trigger.setAttribute('aria-expanded','false');
 trigger.setAttribute('aria-controls',card.id);
 trigger.addEventListener('click',()=>active?close():open());
 card.addEventListener('click',event=>{
  if(event.target.closest('[data-tutorial-close]')){close();return}
  if(event.target.closest('[data-tutorial-prev]')){stepIndex=Math.max(0,stepIndex-1);showStep();return}
  if(event.target.closest('[data-tutorial-next]')){
   if(stepIndex>=BEGINNER_TUTORIAL_STEPS.length-1){close();return}
   stepIndex++;showStep();return;
  }
  if(event.target.closest('[data-tutorial-repeat]')){speak();return}
  if(event.target.closest('[data-tutorial-voice]')){
   voiceEnabled=!voiceEnabled;
   try{localStorage.setItem('cv-tutorial-voice-v1',voiceEnabled?'on':'off')}catch{}
   const button=$('[data-tutorial-voice]');
   button.textContent=voiceEnabled?'Silenciar voz':'Activar voz';
   button.setAttribute('aria-pressed',String(voiceEnabled));
   if(voiceEnabled)speak();else stopSpeaking();
  }
 });
 $('[data-tutorial-voice]').textContent=voiceEnabled?'Silenciar voz':'Activar voz';
 $('[data-tutorial-voice]').setAttribute('aria-pressed',String(voiceEnabled));
 document.addEventListener('click',event=>{
  if(!active)return;
  const step=BEGINNER_TUTORIAL_STEPS[stepIndex];
  if(step.tool&&event.target.closest(step.target)){
   toolChosen=true;
   requestAnimationFrame(()=>{showToolPlacement();speak()});
  }else schedulePosition();
 },true);
 document.addEventListener('keydown',event=>{if(active&&event.key==='Escape')close()},true);
 window.addEventListener('resize',schedulePosition);
 document.addEventListener('scroll',schedulePosition,true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeaking()});
 return {
  onGameReady({newCity=false}={}){
   ready=true;
   if(newCity&&!active){
    let introduced=false;try{introduced=Boolean(localStorage.getItem('cv-tutorial-introduced-v1'))}catch{}
    if(!introduced)open();
   }
  },
  refresh(){if(active){status();schedulePosition()}},
  close
 };
}
