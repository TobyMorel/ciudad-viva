import {residentDirectory,residentCommute,parkActivityPlan,rushHourPlan,livingMomentVisuals,citizenName,commuteWindow} from './living_city.js';

// Solo geometría Three.js procedimental, separada de la física y economía.
// Dibujos únicamente a partir de proyectos, viajes y acontecimientos de la partida.
export function createLivingCity3D({THREE,scene,camera,canvas,box,sphere,cylinder,mat,geometry,tilePos,clear,smallScreen}){
 const root=new THREE.Group();root.name='Alfa 0.263 · Historias y sucesos';
 scene.add(root);
 const projectsRoot=new THREE.Group(),parkRoot=new THREE.Group(),citizenRoot=new THREE.Group(),trafficRoot=new THREE.Group(),momentsRoot=new THREE.Group();
 root.add(projectsRoot,parkRoot,citizenRoot,trafficRoot,momentsRoot);
 const residents=new Map(),animations=[],projectAnimations=[],parkAnimations=[],celebrations=[];
 let signature='',state=null,clock=0,peakVisible=false,activeParkVisitors=0,activeProjects=0;
 const C=['#d48e65','#6797a0','#d8b76d','#9e7ba8','#6aa27d','#c48078'];
 const palette=['#dba67c','#aa7657','#e5bd94'];
 function hash(s){let h=2166136261;for(let i=0;i<String(s).length;i++)h=Math.imul(h^String(s).charCodeAt(i),16777619);return h>>>0}
 function scheduledProgress(commute,minutes){
  const minute=((Number(minutes)||0)%1440+1440)%1440;
  const [outStart,outEnd]=commuteWindow(commute.departureWindowKey),[returnStart,returnEnd]=commuteWindow(commute.returnWindowKey);
  if(minute>=outStart&&minute<=outEnd)return {progress:(minute-outStart)/Math.max(1,outEnd-outStart),reverse:false};
  if(minute>=returnStart&&minute<=returnEnd)return {progress:1-(minute-returnStart)/Math.max(1,returnEnd-returnStart),reverse:true};
  if(minute>outEnd&&minute<returnStart)return {atWork:true};
  return null;
 }
 function figure(parent,x,y,z,id,{child=false,worker=false}={}){
  const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(child?.77:1);parent.add(g);
  const code=hash(id),shirt=worker?'#dfa94e':C[code%C.length],skin=palette[code%palette.length],hair=['#4a3c35','#73604d','#394651'][code%3];
  const legs=[],arms=[];
  for(const side of [-1,1]){
   const l=new THREE.Group();l.position.set(side*.06,.25,0);g.add(l);
   box(l,.09,.19,.10,'#4f6067',0,-.10,0);box(l,.11,.04,.15,'#3e484b',0,-.20,.025);legs.push(l);
   const a=new THREE.Group();a.position.set(side*.14,.46,0);g.add(a);
   box(a,.077,.20,.085,shirt,0,-.10,0);arms.push(a);
  }
  box(g,.24,.27,.18,shirt,0,.39,0);
  cylinder(g,.044,.044,.067,skin,0,.56,0,8);
  sphere(g,.112,skin,0,.65,0,1);
  const cap=sphere(g,.113,hair,0,.704,-.015,1);cap.scale.setScalar(.92);
  const entry={id,g,legs,arms,phase:(code%100)*.064};
  animations.push(entry);return entry;
 }
 function roadPosition(home,roads){
  const id=new Set(roads.map(p=>p.join(',')));
  const [dx,dy]=[[0,1],[1,0],[0,-1],[-1,0]].find(([x,y])=>id.has((home[0]+x)+','+(home[1]+y)))||[0,1];
  const [wx,wz]=tilePos(home[0],home[1]);
  return [wx+dx*.83,wz+dy*.83];
 }
 function createCitizens(data){
  const roster=residentDirectory(data,Math.max(110,Math.min(950,Number(data.population)||110)));
  const homes=new Set(),max=smallScreen?12:24;
  for(const resident of roster){
   const homeId=resident.home.join(',');
   if(homes.has(homeId)||residents.size>=max)continue;
   homes.add(homeId);
   const coords=roadPosition(resident.home,data.roads||[]),person=figure(citizenRoot,coords[0],.1,coords[1],resident.id);
   person.roadside=coords;
   const commute=residentCommute(data,resident);
   person.g.userData.residentId=resident.id;
   person.commute=commute?.mode==='walk'?commute:null;
   person.home=resident.home;person.name=resident.name;person.status=resident.status;
   residents.set(resident.id,person);
  }
 }
 function createProjectModel(p){
  if(!['home','shop','factory'].includes(p.kind)||p.status==='cancelada'||p.status==='finalizada')return;
  const progress=Math.max(0,Math.min(.999,Number(p.progress)||0)),stage=progress>=.85?4:progress>=.6?3:progress>=.34?2:progress>=.13?1:0;
  const g=new THREE.Group(),[x,z]=tilePos(p.x,p.y);g.position.set(x,0,z);projectsRoot.add(g);
  activeProjects++;
  const accent=p.kind==='factory'?'#75999a':p.kind==='shop'?'#b9906a':'#d5b27a';
  // Base y cimentación sobre la obra existente, sin reemplazar el objeto de gameplay.
  box(g,1.12,.05,1.02,'#d2cab6',0,.23,0);
  for(const cx of [-.48,.48])for(const cz of [-.42,.42]){
   box(g,.07,.42+stage*.29,.07,'#8e9991',cx,.48+stage*.145,cz);
  }
  if(stage>=1){
   const height=.15+(stage>=3?.92:stage>=2?.52:.28);
   box(g,1.03,height,.09,accent,0,.27+height/2,-.41);
   for(const sx of [-.43,.43])box(g,.09,height,.85,accent,sx,.27+height/2,0);
  }
  if(stage>=2){
   box(g,1.03,.085,.92,'#c8c3b6',0,1.11,0);
   for(const sx of [-.48,.48])for(const sz of [-.42,.42])box(g,.07,.72,.07,'#798c89',sx,1.47,sz);
  }
  if(stage>=3){
   box(g,1.05,.09,.97,'#b69c7b',0,1.84,0);
   box(g,.65,.48,.07,'#d9cdb2',0,1.55,.44);
  }
  if(stage>=4){
   const roof=box(g,1.13,.10,1.06,p.kind==='factory'?'#557378':'#8c6456',0,2.23,0);
   roof.userData.decorativeConstructionRoof=true;
  }
  for(const xx of [-.62,.62]){
   box(g,.035,2.40,.035,'#bc945d',xx,1.27,-.64);
   for(const y of [.64,1.22,1.80,2.36])box(g,.04,.035,.1,'#e0ba78',xx,y,-.64);
  }
  if(!smallScreen&&stage>=1){
   const crane=new THREE.Group();crane.position.set(.77,0,-.7);g.add(crane);
   cylinder(crane,.045,.07,2.54,'#b59a66',0,1.34,0,10);
   const pivot=new THREE.Group();pivot.position.set(0,2.63,0);crane.add(pivot);
   box(pivot,1.13,.055,.07,'#e4af58',-.19,0,0);
   box(pivot,.20,.07,.23,'#907861',.55,-.04,0);
   const hook=box(pivot,.025,.38,.025,'#6b7778',-.49,-.22,0);
   box(pivot,.12,.07,.13,'#bd9363',-.49,-.44,0);
   projectAnimations.push({pivot,hook,phase:hash(String(p.id))%89});
  }
  if(stage<4&&p.status!=='suspendida'&&p.status!=='pausada'){
   const worker=figure(g,.66,.12,.57,'obra:'+p.x+','+p.y,{worker:true});
   worker.g.userData.worksite=true;
   if(!smallScreen&&stage>=1)figure(g,-.69,.12,.55,'obra-b:'+p.x+','+p.y,{worker:true});
  }
 }
 function createParks(data){
  for(const park of parkActivityPlan(data).slice(0,smallScreen?3:6)){
   const [x,z]=tilePos(park.x,park.y),g=new THREE.Group();g.position.set(x,0,z);parkRoot.add(g);
   const n=Math.min(smallScreen?2:4,Math.max(1,Math.ceil(park.visitors/5)));
   const slots=[[-.51,-.18],[.52,-.2],[-.45,.32],[.48,.28]];
   for(let i=0;i<n;i++){
    const [px,pz]=slots[i],person=figure(g,px,.10,pz,'plaza:'+park.x+':'+park.y+':'+i,{child:i===1});
    person.g.userData.parkVisitor=true;
    activeParkVisitors++;
   }
   if(park.activities.includes('juego')){
    const ball=sphere(g,.092,'#f9e0a6',.15,.28,-.55,2);
    const stripe=box(g,.19,.015,.019,'#cb6260',.15,.28,-.55);
    parkAnimations.push({ball,stripe,seed:park.x*9+park.y,baseY:.18});
   }
   if(park.activities.includes('ejercicio')){
    const bench=box(g,.39,.04,.13,'#a27d5d',-.34,.26,.53);
    for(const sx of [-.15,.15])box(g,.036,.25,.038,'#6c7568',-.34+sx,.16,.53);
    bench.userData.parkExerciseStation=true;
   }
  }
 }
 function createTraffic(data){
  const hotspotPlan=rushHourPlan(data,480),roads=new Set((data.roads||[]).map(p=>p.join(',')));
  for(const h of hotspotPlan.hotspots.slice(0,smallScreen?4:9)){
   const [cx,cz]=tilePos(h.x,h.y);
   const horizontal=roads.has((h.x+1)+','+h.y)||roads.has((h.x-1)+','+h.y);
   const n=Math.min(3,Math.max(1,Math.floor(h.vehicles/6)));
   for(let i=0;i<n;i++){
    const car=new THREE.Group();car.position.set(cx+(horizontal?(i-1)*.38:-.18),.08,cz+(horizontal?.17:(i-1)*.38));
    car.rotation.y=horizontal?Math.PI/2:0;trafficRoot.add(car);
    const color=C[(i+h.x+h.y+100)%C.length];
    box(car,.27,.13,.32,color,0,.14,0);
    box(car,.22,.09,.15,'#9cbec2',0,.25,-.01);
    for(const side of [-1,1]){
     cylinder(car,.053,.053,.044,'#344047',side*.135,.105,-.09,8).rotation.z=Math.PI/2;
     cylinder(car,.053,.053,.044,'#344047',side*.135,.105,.105,8).rotation.z=Math.PI/2;
     box(car,.055,.033,.017,mat('#f17669',{emissive:'#ec584b',emissiveIntensity:1.2}),side*.083,.16,-.17);
    }
   }
  }
  trafficRoot.visible=false;
 }
 function createMoments(data){
  for(const item of livingMomentVisuals(data).slice(-2)){
   const [x,z]=tilePos(item.x,item.y),g=new THREE.Group();g.position.set(x,3.45,z);momentsRoot.add(g);
   for(let j=0;j<5;j++){
    const a=j*2*Math.PI/5,px=Math.cos(a)*.57,pz=Math.sin(a)*.57,color=C[(j+item.day)%C.length];
    const balloon=sphere(g,.10,color,px,.28+(j%2)*.17,pz,1);
    balloon.userData.celebrationBalloon=true;
    box(g,.012,.36,.012,'#d4cdab',px,.08,pz);
   }
   const rays=[];
   for(let i=0;i<8;i++){const a=i*Math.PI/4,c=C[i%C.length],f=sphere(g,.042,c,0,0,0,1);rays.push({mesh:f,angle:a,i})}
   celebrations.push({rays,phase:hash(item.id)%20});
   const base=box(g,.35,.05,.35,'#e4c28e',0,0,0);base.userData.celebrationDecoration=true;
  }
 }
 function planSignature(data,preview){
  const pro=(data.projects||[]).filter(p=>['home','shop','factory'].includes(p.kind)).map(p=>{
   const progress=Math.max(0,Number(p.progress)||0);
   const stage=progress>=.85?4:progress>=.6?3:progress>=.34?2:progress>=.13?1:0;
   return [p.id,p.kind,p.x,p.y,Math.floor(progress*8),stage,p.stageIndex,p.status];
  });
  const people=residentDirectory(data,Math.min(950,Math.max(110,Number(data.population)||110))).map(p=>[p.id,p.home.join(','),p.status,p.employerName]);
  const parks=parkActivityPlan(data).map(p=>[p.x,p.y,p.visitors,p.activities]);
  const hotspots=rushHourPlan(data,480).hotspots.map(p=>[p.x,p.y,Math.floor(p.vehicles/6)]);
  const moments=livingMomentVisuals(data).map(p=>[p.id,p.day,p.x,p.y]);
  return JSON.stringify([Boolean(preview),pro,people,parks,hotspots,moments]);
 }
 function sceneSync(data,{preview=false}={}){
  state=data;const sig=planSignature(data,preview);
  if(sig===signature)return;
  signature=sig;
  for(const group of [projectsRoot,parkRoot,citizenRoot,trafficRoot,momentsRoot])clear(group);
  residents.clear();animations.length=0;projectAnimations.length=0;parkAnimations.length=0;celebrations.length=0;
  activeParkVisitors=0;activeProjects=0;
  if(preview)return;
  createCitizens(data);
  for(const p of (data.projects||[]).filter(p=>['home','shop','factory'].includes(p.kind)).slice(0,smallScreen?5:11))createProjectModel(p);
  createParks(data);createTraffic(data);createMoments(data);
 }
 function tick(delta,minutes,paused=false){
  if(!state)return;
  if(!paused)clock+=Math.max(0,Math.min(.1,Number(delta)||0));
  const h=((Number(minutes)||0)%1440+1440)%1440/60;
  trafficRoot.visible=(h>=7&&h<9.5)||(h>=17&&h<19.5);
  peakVisible=trafficRoot.visible&&trafficRoot.children.length>0;
  for(const r of residents.values()){
   const movement=r.commute?scheduledProgress(r.commute,minutes):null,moving=Number.isFinite(movement?.progress);
   r.g.visible=h>=5.5&&h<=23||Boolean(r.commute&&moving);
   if(moving){
    const route=r.commute.route;
    const length=(route.length-1)*2;
    const travel=length*movement.progress;
    const index=Math.min(route.length-2,Math.floor(travel/2)),f=(travel/2-index);
    const from=movement.reverse?route[index+1]:route[index],to=movement.reverse?route[index]:route[index+1];
    const segmentProgress=movement.reverse?1-f:f;
    const dx=to[0]-from[0],dz=to[1]-from[1];
    if(Math.abs(dx)+Math.abs(dz)===1){
     // Camino sobre la vereda, no sobre el centro del carril.
     r.g.position.set((from[0]+.5+dx*segmentProgress)*2+dz*.66,.1,(from[1]+.5+dz*segmentProgress)*2-dx*.66);
     r.g.rotation.y=Math.atan2(dx,dz);
    }
   }else if(movement?.atWork){
    const route=r.commute.route,from=route.at(-2),to=route.at(-1),dx=to[0]-from[0],dz=to[1]-from[1];
    r.g.position.set((to[0]+.5)*2+dz*.66,.1,(to[1]+.5)*2-dx*.66);
   }else{
    const [x,z]=r.roadside;
    r.g.position.set(x,.1,z);
   }
  }
  for(const a of animations){
   if(!a.g.visible)continue;
   const v=clock*5+a.phase;
   a.legs[0].rotation.x=Math.sin(v)*.24;a.legs[1].rotation.x=-Math.sin(v)*.24;
   a.arms[0].rotation.x=-Math.sin(v)*.21;a.arms[1].rotation.x=Math.sin(v)*.21;
  }
  for(const a of projectAnimations){a.pivot.rotation.y=Math.sin(clock*.35+a.phase)*.25;a.hook.position.y=-.22-Math.sin(clock*.58+a.phase)*.08}
  parkRoot.visible=h>=8&&h<=21;
  for(const a of parkAnimations){const y=a.baseY+Math.abs(Math.sin(clock*2.8+a.seed))*.22;a.ball.position.y=y;a.stripe.position.y=y}
  for(const c of celebrations)for(const r of c.rays){
   const radius=.24+Math.abs(Math.sin(clock*.8+c.phase))*.39;
   r.mesh.position.set(Math.cos(r.angle)*radius,.35+Math.sin(clock*1.6+r.i)*.26,Math.sin(r.angle)*radius);
  }
 }
 function getResidentLocation(id){
  const r=residents.get(String(id));if(!r||!r.g.visible)return null;
  return {id:String(id),name:r.name,x:r.g.position.x/2-.5,y:r.g.position.z/2-.5,visible:r.g.visible};
 }
 function residentHit(px,py){
  let best=null;
  for(const [id,r] of residents){
   if(!r.g.visible)continue;
   const point=r.g.position.clone();point.y+=.43;point.project(camera);
   if(point.z<-1||point.z>1)continue;
   const x=(point.x+1)*canvas.clientWidth/2,y=(1-point.y)*canvas.clientHeight/2,d=Math.hypot(px-x,py-y);
   if(d<(smallScreen?26:21)&&(!best||d<best.distance))best={id,distance:d,person:r};
  }
  if(!best)return null;
  const p=best.person;
  return {type:'Residente',title:p.name,description:'Habitante real registrado en una vivienda. Su rutina 3D representa una persona del padrón.',residentId:best.id,people:[{id:best.id,name:p.name,status:p.status,home:p.home}],metrics:[['Situación',p.status],['Hogar',p.home.map(x=>x+1).join(', ')]]};
 }
 function diagnostics(){
  let invalidLivingTransforms=0;
  root.traverse(object=>{
   const vals=[object.position.x,object.position.y,object.position.z,object.scale.x,object.scale.y,object.scale.z,
    object.rotation.x,object.rotation.y,object.rotation.z];
   if(vals.some(value=>!Number.isFinite(value))||object.scale.x<=0||object.scale.y<=0||object.scale.z<=0)invalidLivingTransforms++;
  });
  return {invalidLivingTransforms,livingResidentFigures:residents.size,animatedHomeShopFactorySites:activeProjects,
  parkVisitors3D:activeParkVisitors,visualQueueCars:trafficRoot.children.length,peakTrafficVisible:peakVisible,
  cityCelebrations3D:celebrations.length}}
 return {sceneSync,tick,diagnostics,getResidentLocation,residentHit};
}
