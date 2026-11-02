// Obras ferroviarias físicas: una parcela y un edificio 3D por estación.
export const RAIL_SITE_SPECS={
 metro:{cost:6800,duration:42,label:'Acceso y estación de subte'},
 elevated:{cost:9400,duration:50,label:'Estación de tren elevado'}
};
const key=(x,y)=>x+','+y;
export function railSiteCatalog(state,mode=null){
 return (state.railStations||[]).filter(s=>!mode||s.mode===mode);
}
export function placeRailStation(state,mode,x,y){
 const spec=RAIL_SITE_SPECS[mode];
 if(!spec)throw Error('Tipo de estación ferroviaria inválido.');
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x===24||x===25)throw Error('La estación debe ocupar una parcela terrestre válida.');
 const claims=state.landClaims;
 if(claims?.unlockedChunks&&!claims.unlockedChunks.includes(key(Math.floor(x/(claims.chunkSize||8)),Math.floor(y/(claims.chunkSize||8)))))throw Error('Desbloqueá primero el sector de esta estación.');
 const roads=new Set((state.roads||[]).map(p=>key(p[0],p[1])));
 if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>roads.has(key(x+dx,y+dy))))throw Error('La estación requiere una calle adyacente.');
 if(roads.has(key(x,y))||['buildings','projects','abandoned','railStations'].some(group=>(state[group]||[]).some(p=>p.x===x&&p.y===y)))throw Error('La parcela está ocupada: buscá un terreno libre junto a la calle.');
 const reserved=(state.projects||[]).filter(p=>!p.privatePaid).reduce((sum,p)=>sum+Math.max(0,(p.cost||0)-(p.paid||0)),0);
 if((state.money||0)-reserved<spec.cost)throw Error('Fondos libres insuficientes para construir la estación ($ '+spec.cost+').');
 state.money-=spec.cost;
 const site={id:'station-'+mode+'-'+x+'-'+y,kind:'railStation',mode,x,y,name:spec.label+' '+(x+1)+','+(y+1),status:'building',elapsed:0,duration:spec.duration,cost:spec.cost,createdDay:state.day||1,stage:'Cimientos y acceso'};
 (state.railStations||(state.railStations=[])).push(site);
 return site;
}
export function advanceRailStations(state){
 for(const site of state.railStations||[]){
  if(site.status!=='building')continue;
  if((state.jobs||0)<=0){site.pauseReason='La obra requiere cuadrillas disponibles.';continue}
  site.pauseReason=null;
  site.elapsed=Math.min(site.duration,(site.elapsed||0)+1);
  const ratio=site.elapsed/Math.max(1,site.duration);
  site.stage=ratio<.25?'Cimientos y acceso':ratio<.68?'Estructura y andenes':ratio<1?'Instalaciones e inspección':'Habilitada';
  if(site.elapsed>=site.duration){site.status='active';site.completedDay=state.day||1}
 }
}
