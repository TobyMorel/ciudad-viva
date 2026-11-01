// Datos de eventos existentes: ninguna alerta inventa un robo, incendio o despacho.
const integer=n=>Number.isInteger(Number(n))&&Number.isFinite(Number(n));
const site=(x,y)=>integer(x)&&integer(y)&&Number(x)>=0&&Number(y)>=0&&Number(x)<28&&Number(y)<20;
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
 const remaining=Object.entries(project.materialsRequired||{}).map(([key,total])=>({key,required:Number(total)||0,used:Number(project.materialsUsed?.[key])||0})).filter(r=>r.required>r.used);
 const stopped=['pausada','suspendida','cambio_pendiente'].includes(project.status);
 const reason=project.status==='pausada'?'La pausaste. Reanudala desde Obras cuando estés listo.':
  project.status==='suspendida'?'El contrato está suspendido. Revisá su financiación y las órdenes pendientes.':
  project.status==='cambio_pendiente'?'La constructora pidió modificar el contrato. Aceptá o rechazá el cambio en Obras.':
  project.cause||project.statusCause||'Esta obra avanza durante los días de simulación cuando dispone de materiales, trabajadores y pagos.';
 return {title:project.label||'Obra',reason,stopped,remaining,hasConcrete:remaining.some(x=>x.key==='concrete'),
  steps:['Revisá en Obras si está pausada, esperando pago o materiales.','Tocá Pedir materiales: el proveedor necesita stock y el contratista fondos.','Esperá la entrega del camión por una calle conectada y dejá avanzar los días.','La obra termina tras sus etapas y la inspección, no inmediatamente al asignar zona.']};
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
  if(!v||!site(v.x,v.y)||now-(v.day||0)>7)continue;
  const active=v.closed===true,title=active?'Choque vial: calle cerrada':'Accidente vial despejado';
  push(item('road','🚧',title,`Causa: ${v.cause||'tránsito'}. Condición de la calzada ${Math.round(v.roadQuality??82)}%. ${active?`${v.station?'Responde '+v.station:'Sin unidad disponible'}; cierre estimado ${v.remainingDays||0} día(s).`:`Se despejó el día ${v.clearedDay||'reciente'}; la unidad y limpieza costaron $${v.cleanupCost||0}.`}`,active?'La calle queda fuera de las rutas hasta terminar la respuesta municipal. Revisá Tráfico para ver los desvíos.':'Revisá Ciudad → Mantenimiento; una calzada dañada eleva el riesgo de nuevos choques.',v.x,v.y,v.day,v.id||`road-crash-${v.x}-${v.y}-${v.day}`,active?0:2));
 }
 const police=state.policeReport?.recentIncidents||[];
 for(const v of police){
  if(!site(v.x,v.y)||now-(v.day||0)>35||now<(v.day||0))continue;
  const answered=v.status==='atendido';
  push(item('police','🚨',answered?'Incidente atendido':'Se necesita una patrulla aquí',
   (v.location||'Barrio')+'. '+(answered?'Respondió '+(v.station||'una patrulla')+' en '+(v.responseMinutes||'?')+' minutos.':'No se pudo enviar patrulla: verificá comisaría, tres agentes por vehículo, energía, agua y calles.'),
   answered?'La intervención quedó registrada. Revisá la cobertura de seguridad para evitar nuevos incidentes.':'Construí un puesto o comisaría, asegurá personal y conexiones y revisá el panel Seguridad.',v.x,v.y,v.day,v.id||`pol-${v.x}-${v.y}-${v.day}`,answered?2:1));
 }
 const fires=[...(state.fireReport?.activeIncidents||[]),...(state.fireReport?.recentIncidents||[])];
 for(const v of fires){
  if(!site(v.x,v.y))continue;
  const active=v.status==='ardiendo';
  if(!active&&now-(v.resolvedDay??v.startDay??0)>14)continue;
  push(item('fire','🔥',active?'Se necesita una dotación de bomberos':'Incendio registrado',
   (v.name||'Edificio')+'. '+(active?'Sigue ardiendo: necesita una dotación de bomberos disponible y calles conectadas.':'Estado: '+(v.status||'resuelto')+'. '+(v.station||'Sin cuartel asignado')+'. Daños: '+(v.damage||0)+'.'),
   active?'Construí y equipá un cuartel de bomberos. Un vehículo no sale sin cuatro bomberos cualificados y ruta vial.':'Inspeccioná el inmueble y revisá su calidad después del incendio.',v.x,v.y,v.startDay??v.resolvedDay,v.id||`fire-${v.x}-${v.y}`,active?0:2));
 }
 for(const v of state.health?.ambulanceDispatches||[]){
  if(!site(v.x,v.y)||now-(v.day||0)>7||now<(v.day||0))continue;
  push(item('health','✚','Emergencia sanitaria atendida','Traslado de '+(v.patients||1)+' paciente(s). '+(v.station||'Centro hospitalario')+'.','Revisá Salud para ver camas, profesionales, ambulancias y atención pendiente.',v.x,v.y,v.day,v.id||`amb-${v.x}-${v.y}-${v.day}`,2));
 }
 for(const raw of state.waste?.report?.litterTiles||[]){
  if(!raw)continue;
  const x=Array.isArray(raw)?raw[0]:raw.x,y=Array.isArray(raw)?raw[1]:raw.y;
  if(!site(x,y))continue;
  push(item('litter','🗑','Basura acumulada en la calle','Hay residuos visibles sobre este tramo. No son materiales disponibles para construir.','Construí una base de recolección con camiones, calles conectadas y capacidad de disposición. Revisá los contenedores y las rutas en Ciudad → Servicios.',x,y,now,`litter-${x}-${y}`,1));
 }
 for(const c of state.waste?.containers||[]){
  if(!c||!site(c.x,c.y))continue;
  const capacity=Math.max(.15,Number(c.capacityTons)||2),stored=Math.max(0,Number(c.storedTons)||0);
  if(stored<capacity*.75)continue;
  push(item('waste','🗑','Contenedor casi lleno',`Residuos: ${stored.toFixed(2)} de ${capacity.toFixed(2)} toneladas.`,'Construí una base de recolección y verificá ruta, camiones, destino y presupuesto. Tocá la parcela para ver más detalles.',c.x,c.y,now,`container-${c.id||c.x+'-'+c.y}`,1));
 }
 for(const project of state.projects||[]){
  if(!site(project.x,project.y)||!['pausada','suspendida','cambio_pendiente'].includes(project.status))continue;
  const g=projectGuide(state,project);
  push(item('construction','⚒','Obra detenida: '+(project.label||'Proyecto'),g.reason,
   'Abrí Obras para resolver materiales, financiación, pausa o cambio contractual.',project.x,project.y,now,`project-${project.id}`,1));
 }
 for(const r of state.roadAssets||[]){
  if(!r||!site(r.x,r.y)||Number(r.quality??100)>=25)continue;
  push(item('road','🚧','Calle en mal estado','Este tramo está deteriorado y puede impedir paso de camiones y vehículos de emergencia.','Revisá Ciudad → Mantenimiento. Sin una calle utilizable la obra y el servicio no pueden avanzar.',r.x,r.y,now,`road-${r.x}-${r.y}`,1));
 }
 return items.sort((a,b)=>a.priority-b.priority||b.day-a.day||a.id.localeCompare(b.id)).slice(0,32);
}


export function gettingStarted(state){
 const roads=state?.roads||[],zones=state?.zones||[],projects=state?.projects||[],buildings=state?.buildings||[];
 const activeOrders=state?.supply?.orders||[];
 return [
  {title:'Reconocé tu ciudad',done:true,description:'Tocá una parcela para saber qué hay y qué necesita. Abrí Avisos para ver emergencias reales.'},
  {title:'Conectá calles',done:roads.length>0,description:'Usá Construir → Proyectar calle. Las obras y los servicios necesitan caminos terminados conectados al resto de la ciudad.'},
  {title:'Prepará suelo industrial',done:zones.some(z=>z?.kind==='factory'),description:'Elegí Zona industrial y pintá una parcela libre junto a una calle. El suelo amarillo solo es un permiso, no una fábrica.'},
  {title:'Licitá la fábrica correcta',done:projects.some(p=>p?.kind==='factory')||buildings.some(b=>b?.kind==='factory'),description:'En Construir elegí Cantera para producir áridos o Hormigonera para producir hormigón. Seleccioná constructora y verificá el capital.'},
  {title:'Pedí materiales para una obra',done:activeOrders.length>0,description:'En Obras, elegí un contrato → Pedir materiales. Revisá stock del proveedor, caja, espacio de destino y conexión vial.'},
  {title:'Sostené servicios municipales',done:buildings.some(b=>b?.kind==='fireStation'||b?.kind==='school'||(b?.kind==='civic'&&b.name!=='Municipalidad')),description:'Construí escuelas, policía, bomberos y salud. No funcionan sin trabajadores, energía, agua, presupuesto y calles.'}
 ];
}
