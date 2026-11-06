// Datos de eventos existentes: ninguna alerta inventa un robo, incendio o despacho.
const site=(x,y)=>Number.isSafeInteger(Number(x))&&Number.isSafeInteger(Number(y));
const item=(kind,icon,title,detail,action,x,y,day,id,priority=2)=>({kind,icon,title,detail,action,x:Number(x),y:Number(y),day,id:String(id),priority});
export const INDUSTRIES={
  food:{label:'Procesadora de alimentos',produces:'Alimentos para comercios'},
  quarry:{label:'Cantera local',produces:'Áridos para obras y hormigoneras'},
  concrete:{label:'Hormigonera',produces:'Hormigón: consume 2 áridos por unidad'},
  sawmill:{label:'Aserradero',produces:'Madera de construcción'},
  metalworks:{label:'Metalúrgica',produces:'Componentes técnicos a partir de acero'}
};
export const MATERIAL_HELP={
  aggregate:{title:'Áridos',description:'Piedra y arena utilizadas por las obras. Podés pedirlas a proveedores regionales; una cantera conectada puede producirlas localmente.',steps:['Abrí Obras, seleccioná la obra y tocá Pedir materiales.','Elegí un proveedor que tenga áridos y comprobá ruta, fondos y espacio.','Para producirlos localmente, zonificá terreno industrial y licitá una Cantera.']},
  concrete:{title:'Hormigón',description:'El hormigón para construir no aparece por tener fábricas amarillas. Es un material físico que debe comprarse y entregarse; una hormigonera local consume dos áridos por unidad.',steps:['Para resolver una obra hoy: Obras → Pedir materiales → proveedor con hormigón y stock.', 'Para producirlo: Construir → Zona industrial y marcá una parcela junto a una calle terminada.', 'Construir → Cantera (áridos) y, en otra parcela industrial, Hormigonera. Son dos obras distintas.', 'Esperá a que ambas obras reciban materiales y terminen; necesitás trabajadores, electricidad, agua y saneamiento.', 'La hormigonera compra áridos de la cantera por carretera. Después pedí el hormigón disponible para la comisaría.']},
  steel:{title:'Acero',description:'Metal estructural disponible en proveedores. También se importa y se transforma en otras industrias.',steps:['Abrí la obra y tocá Pedir materiales.', 'Elegí un proveedor con acero en stock y suficiente caja de obra.', 'El camión debe poder llegar por calles conectadas.']},
  timber:{title:'Madera',description:'Puede comprarse o producirse en un aserradero con personal y servicios.',steps:['Pedí madera desde Obras → Pedir materiales.', 'Para producción local, construí un Aserradero sobre una zona industrial conectada.']},
  components:{title:'Componentes',description:'Piezas técnicas para instalaciones. Se compran a proveedores o se fabrican en una metalúrgica a partir de acero.',steps:['Pedí componentes desde Obras → Pedir materiales.', 'Para producirlos, construí una Metalúrgica y asegurá acero, personal, servicios y ruta de entrega.']}
};
export function projectGuide(state,project){
 const stopped=['pausada','suspendida','cambio_pendiente'].includes(project.status);
 const reason=project.status==='pausada'?'La pausaste. Reanudala desde Obras cuando estés listo.':
  project.status==='suspendida'?'El contrato está suspendido. Revisá la financiación y la causa que figura en la obra.':
  project.status==='cambio_pendiente'?'La constructora pidió modificar el contrato. Aceptá o rechazá el cambio en Obras.':
  project.cause||project.statusCause||'Esta obra conserva sus etapas y avanza con los días de simulación.';
 return {title:project.label||'Obra',reason,stopped,
  steps:['Revisá el estado y los fondos comprometidos en Obras.','Comprobá que el sitio tenga acceso por una calle conectada.','Dejá avanzar los días para ver el progreso y cada etapa.','La obra se habilita después de completar la última etapa y su inspección.']};
}
export function collectCityAlerts(state){
 if(!state)return [];
 const now=Number(state.day)||1,items=[],seen=new Set();
 const push=a=>{if(!site(a.x,a.y)||seen.has(a.id))return;seen.add(a.id);items.push(a)};
 for(const f of state.utilities?.report?.failures||[]){
  if(!f||!['avería','en reparación'].includes(f.status)||!site(f.x,f.y))continue;
  const working=f.status==='en reparación',urgent=f.responseKind==='emergencia';
  const network=({power:'electricidad',water:'agua potable',sewer:'cloacas',gas:'gas',telecom:'telecomunicaciones'}[f.network]||f.network);
  push(item('utility','⚡',working?'Cuadrilla reparando red':'Corte de '+network,
   `${f.affectedBuildings||0} edificios afectados. ${working?`${urgent?'Respuesta urgente':'Reparación programada'}: ${f.remainingDays||0} día(s) restantes.`:`Avería por ${f.reason||'daño de infraestructura'}. Reparación normal $${Number(f.repairCost)||0} (3 días); urgente $${(Number(f.repairCost)||0)*2} (1 día)${f.emergencyRouteAvailable===false?'; falta ruta vial para despacho urgente':''}.`}`,
   working?'Seguí la reparación en Ciudad → Servicios.':'Abrí Ciudad → Servicios para elegir cuadrilla normal o respuesta urgente y comprobar ruta y presupuesto.',f.x,f.y,f.day,f.id||`utility-${f.network}-${f.x}-${f.y}`,working?1:0));
 }
 for(const v of [...(state.roadIncidentReport?.activeIncidents||[]),...(state.roadIncidentReport?.recentIncidents||[])]){
  if(!v||!site(v.x,v.y)||v.closed!==true||now-(v.day||0)>7)continue;
  const active=true,title='Choque vial: calle cerrada';
  push(item('road','🚧',title,`Causa: ${v.cause||'tránsito'}. Condición de la calzada ${Math.round(v.roadQuality??82)}%. ${active?`${v.station?'Responde '+v.station:'Sin unidad disponible'}; cierre estimado ${v.remainingDays||0} día(s).`:`Se despejó el día ${v.clearedDay||'reciente'}; la unidad y limpieza costaron $${v.cleanupCost||0}.`}`,active?'La calle queda fuera de las rutas hasta terminar la respuesta municipal. Revisá Tráfico para ver los desvíos.':'Revisá Ciudad → Mantenimiento; una calzada dañada eleva el riesgo de nuevos choques.',v.x,v.y,v.day,v.id||`road-crash-${v.x}-${v.y}-${v.day}`,active?0:2));
 }
 const police=state.policeReport?.recentIncidents||[];
 for(const v of police){
  if(!site(v.x,v.y)||!['sin respuesta','en respuesta'].includes(v.status)||now<(v.day||0))continue;
  const dispatched=v.status==='en respuesta';
  push(item('police','🚨',dispatched?'Patrulla en camino':'Se necesita una patrulla aquí',
   (v.location||'Barrio')+'. '+(dispatched?`Respondió ${v.station||'una patrulla'}; llegará el día ${v.arrivalDay}.`:'No se pudo enviar patrulla: verificá la comisaría, sus vehículos y las calles.'),
   dispatched?'Seguí el patrullero en el mapa 3D.':'Construí un puesto o comisaría conectado y revisá el panel Seguridad.',v.x,v.y,v.day,v.id||`pol-${v.x}-${v.y}-${v.day}`,1));
 }
 const fires=[...(state.fireReport?.activeIncidents||[]),...(state.fireReport?.recentIncidents||[])];
 for(const v of fires){
  if(!site(v.x,v.y)||!['ardiendo','despachado'].includes(v.status))continue;
  const dispatched=v.status==='despachado'||Boolean(v.responseRoute?.length);
  push(item('fire','🔥',dispatched?'Bomberos en camino':'Se necesita una dotación de bomberos',
   (v.name||'Edificio')+'. '+(dispatched?`La autobomba de ${v.station||'un cuartel'} viene por las calles y llegará el día ${v.arrivalDay}.`:'Sigue ardiendo: necesita una dotación de bomberos disponible y calles conectadas.'),
   dispatched?'Seguí la autobomba en el mapa 3D hasta el edificio.':'Construí un cuartel conectado; su guardia inicial puede despachar una autobomba.',v.x,v.y,v.startDay??v.resolvedDay,v.id||`fire-${v.x}-${v.y}`,0));
 }
 for(const b of state.buildings||[]){
  if(!b||b.roadAccessConnected!==false||!site(b.x,b.y))continue;
  push(item('roadAccess','⛔','Edificio aislado de la red vial',`${b.name||'Edificio'}: ${b.roadAccessReason||'no tiene una calle conectada a la salida regional'}`,'Reconectá los tramos hasta la entrada exterior. El acceso y los viajes se recuperan cuando vuelve a existir un camino continuo.',b.x,b.y,state.day,`road-access-${b.x}-${b.y}`,0));
 }
 for(const d of state.urbanEvolution?.deceased||[]){
  if(d?.disposition!=="en espera"||!site(d.homeX,d.homeY))continue;
  const cremation=d.funeralPreference==="crematorium",need=cremation?"cremación":"sepultura",facility=cremation?"crematorio":"cementerio",reason=d.waitReason||`La familia solicita ${need}, pero todavía no hay un ${facility} operativo, conectado y dentro de alcance.`;
  push(item('funeral','⚱️','Traslado funerario pendiente',`${d.name||'Residente fallecido'} · ${reason}`,
   `Construí un ${facility} municipal, asegurá una ruta desde este hogar y mantenelo dentro de su alcance. El coche fúnebre saldrá cuando haya cupo.`,d.homeX,d.homeY,d.deathDay,`funeral-${d.residentId}`,0));
 }
 const alertedWasteBuildings=new Set();
 const fullWasteContainers=(state.waste?.containers||[]).filter(c=>c&&site(c.x,c.y)).map(c=>({
  container:c,fill:Math.max(0,Number(c.storedTons)||0)/Math.max(.15,Number(c.capacityTons)||2)
 })).filter(x=>x.fill>=.75).sort((a,b)=>b.fill-a.fill);
 for(const {container:c,fill} of fullWasteContainers){
  const capacity=Math.max(.15,Number(c.capacityTons)||2),stored=Math.max(0,Number(c.storedTons)||0);
  const building=(state.buildings||[]).filter(b=>['home','shop','office','factory','hotel'].includes(b.kind)&&site(b.x,b.y))
   .map(b=>({building:b,distance:Math.abs(b.x-c.x)+Math.abs(b.y-c.y)}))
   .filter(x=>x.distance<=1&&!alertedWasteBuildings.has(`${x.building.x},${x.building.y}`))
   .sort((a,b)=>a.distance-b.distance||a.building.x-b.building.x||a.building.y-b.building.y)[0]?.building;
  if(!building)continue;
  alertedWasteBuildings.add(`${building.x},${building.y}`);
  push(item('waste','🗑','Recolección de residuos pendiente',`El contenedor de esta cuadra llegó al ${Math.round(fill*100)}% (${stored.toFixed(2)} de ${capacity.toFixed(2)} toneladas).`,'El aviso queda asociado a este edificio. Revisá la ruta de recolección, los camiones y la capacidad de destino en Ciudad → Servicios.',building.x,building.y,now,`container-${c.id||c.x+'-'+c.y}`,1));
 }
 for(const project of state.projects||[]){
  if(!site(project.x,project.y)||!['pausada','suspendida','cambio_pendiente'].includes(project.status))continue;
  const g=projectGuide(state,project);
  push(item('construction','⚒','Obra detenida: '+(project.label||'Proyecto'),g.reason,
   'Abrí Obras para revisar fondos, pausa o cambio contractual.',project.x,project.y,now,`project-${project.id}`,1));
 }
 for(const r of state.roadAssets||[]){
  if(!r||!site(r.x,r.y)||Number(r.quality??100)>=25)continue;
  push(item('road','🚧','Calle en mal estado','Este tramo está deteriorado y puede impedir paso de camiones y vehículos de emergencia.','Revisá Ciudad → Mantenimiento. Sin una calle utilizable la obra y el servicio no pueden avanzar.',r.x,r.y,now,`road-${r.x}-${r.y}`,1));
 }
 return items.sort((a,b)=>a.priority-b.priority||b.day-a.day||a.id.localeCompare(b.id)).slice(0,32);
}

const SERVICE_NEEDS={
 power:{icon:'⚡',name:'Electricidad',action:'Construí una central eléctrica conectada a las calles y comprobá su capacidad disponible.'},
 water:{icon:'💧',name:'Agua',action:'Construí una planta de agua conectada a las calles y comprobá su capacidad disponible.'},
 gas:{icon:'🔥',name:'Gas',action:'Construí una planta de gas conectada a las calles y comprobá su capacidad disponible.'},
 tv:{icon:'📺',name:'TV por cable',action:'Construí una cabecera de TV conectada a las calles y comprobá sus conexiones disponibles.'},
 wifi:{icon:'📶',name:'Internet y Wi-Fi',action:'Construí un centro de internet conectado a las calles y comprobá sus conexiones disponibles.'}
};
export function collectBuildingNeeds(state){
 const needs=[];
 for(const building of [...(state?.buildings||[]),...(state?.railStations||[])]){
  if(!site(building?.x,building?.y))continue;
  for(const service of new Set(building.missingServices||[])){
   const spec=SERVICE_NEEDS[service];if(!spec)continue;
   const days=Math.max(0,Number(building.serviceOutageDays?.[service])||0);
   needs.push(item('service',spec.icon,'Falta '+spec.name,
    `${building.name||'Edificio'}: ${building.missingServiceReasons?.[service]||'sin suministro'}. ${days} ${days===1?'día':'días'} sin servicio.`,
    spec.action,building.x,building.y,state.day,`service-${service}-${building.x}-${building.y}`,1));
  }
 }
 return needs;
}
export function collectCitizenNeedAlerts(state){
 if(!state)return [];
 const homes=(state.buildings||[]).filter(b=>b?.kind==='home'&&(b.occupants||0)>0),day=Number(state.day)||1,alerts=[];
 const add=(type,title,detail,action,home,id,icon)=>{if(!home)return;const alert=item('complaint',icon,title,detail,action,home.x,home.y,day,`need-${id}`,1);alert.citizenRequest=true;alert.complaintType=type;alerts.push(alert)};
 const occupied=homes[0];
 const education=state.educationReport||{},waiting=Math.max(0,Number(education.waiting)||0),unreachable=Math.max(0,Number(education.unreachable)||0);
 if(waiting+unreachable>0){
  const home=homes.find(b=>(b.residents||[]).some(p=>Number(p.age)>=5&&Number(p.age)<=24))||occupied;
  add('school','Familias piden m\u00e1s vacantes escolares',`${waiting} estudiantes esperan una vacante y ${unreachable} no tienen una escuela de su nivel a distancia alcanzable.`,'Constru\u00ed una escuela conectada y revis\u00e1 en Ciudad > Educaci\u00f3n los cupos, docentes, servicios y alumnos en espera.',home,'school','\u{1f3eb}');
 }
 const parks=homes.length?(state.buildings||[]).filter(b=>b?.serviceModel==='urbanPark'&&['operativo','habilitado'].includes(b.status)):[],radius=8;
 const outside=homes.filter(h=>!parks.some(p=>Math.abs(h.x-p.x)+Math.abs(h.y-p.y)<=radius));
 const expectedVisitors=homes.reduce((n,h)=>n+Math.min(3,Math.max(1,Math.round((h.occupants||0)*.06))),0),capacity=parks.length*90;
 if(homes.length&&(!parks.length||outside.length>0||expectedVisitors>capacity)){
  const home=outside[0]||occupied,uncovered=outside.length;
  const detail=!parks.length?'El barrio todav\u00eda no tiene una plaza p\u00fablica.':uncovered?`${uncovered} hogares ocupados quedan fuera del alcance aproximado de 8 parcelas de una plaza.`:`La demanda estimada es de ${expectedVisitors} visitas diarias y las plazas ofrecen ${capacity} lugares.`;
  add('park','Vecinos piden una plaza cerca',detail,'Constru\u00ed una Plaza barrial conectada a las calles. Cada plaza puede recibir hasta 90 visitas por jornada; mir\u00e1 Ciudad > Evoluci\u00f3n para revisar la cobertura.',home,'park','\u{1f333}');
 }
 const police=state.policeReport||{},sites=Math.max(0,Number(police.sites)||0),covered=Math.max(0,Number(police.coveredSites)||0),coverage=Math.max(0,Number(police.coveragePct)||0);
 if(sites>0&&(coverage<80||Number(police.lastUnanswered)>0)){
  add('police','Vecinos piden m\u00e1s presencia policial',`${covered} de ${sites} hogares y comercios tienen cobertura policial (${coverage}%). ${Number(police.lastUnanswered)>0?`${police.lastUnanswered} incidentes recientes quedaron sin respuesta.`:''}`,'Constru\u00ed o equip\u00e1 un puesto/comisar\u00eda, asegur\u00e1 personal y m\u00f3viles, y revis\u00e1 Ciudad > Seguridad para localizar la cobertura faltante.',occupied,'police','\u{1f6e1}');
 }
 const health=state.healthReport||{},primary=health.primary||{},urgent=health.urgent||{},healthNeed=Math.round((Number(primary.waitlist)||0)+(Number(urgent.unservedPerDay)||0));
 if(healthNeed>0){
  add('health','Vecinos piden m\u00e1s atenci\u00f3n de salud',`Hay ${Math.round(Number(primary.waitlist)||0)} consultas primarias en espera y ${Math.round(Number(urgent.unservedPerDay)||0)} urgencias diarias sin capacidad suficiente.`,'Constru\u00ed o ampli\u00e1 un centro de salud conectado; revis\u00e1 Ciudad > Salud para ver personal, camas, servicios y cobertura.',occupied,'health','\u{1f3e5}');
 }
 return alerts;
}

export function groupAlertsByTile(alerts){
 const groups=new Map();
 for(const alert of alerts||[]){
  if(!site(alert?.x,alert?.y))continue;
  const key=`${alert.x},${alert.y}`;
  if(!groups.has(key))groups.set(key,{key,x:alert.x,y:alert.y,items:[]});
  groups.get(key).items.push(alert);
 }
 return [...groups.values()];
}


export function gettingStarted(state){
 const roads=state?.roads||[],zones=state?.zones||[],projects=state?.projects||[],buildings=state?.buildings||[];
 const activeOrders=state?.supply?.orders||[];
 return [
  {title:'Reconocé tu ciudad',done:true,description:'Tocá una parcela para saber qué hay y qué necesita. Abrí Avisos para ver emergencias reales.'},
  {title:'Conectá calles',done:roads.length>0,description:'Usá Construir → Construir calle. Cada tramo cuesta $1.200 y queda habilitado al instante; las obras y los servicios necesitan caminos conectados.'},
  {title:'Habilitá viviendas',done:zones.some(z=>z?.kind==='home')||buildings.some(b=>b?.kind==='home'),description:'Pintá verde parcelas vacías junto a calles. Las familias interesadas financiarán sus casas y llegarán cuando haya capacidad.'},
  {title:'Abrí actividad económica',done:zones.some(z=>z?.kind==='shop'||z?.kind==='factory')||buildings.some(b=>b?.kind==='shop'||b?.kind==='factory'),description:'Pintá zonas azules para comercios o amarillas para fábricas. La demanda y el acceso guían la expansión privada.'},
  {title:'Impulsá la producción local',done:buildings.some(b=>b?.kind==='factory'),description:'Las industrias abastecen a los comercios y pueden exportar por conexiones terrestres, puerto o aeropuerto.'},
  {title:'Sostené servicios municipales',done:buildings.some(b=>b?.kind==='fireStation'||b?.kind==='school'||(b?.kind==='civic'&&b.name!=='Municipalidad')),description:'Bomberos, policía, salud y educación necesitan personal, redes, presupuesto y calles conectadas.'}
 ];
}
