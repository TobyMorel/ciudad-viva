import {citySpectaclePlan,citySceneSignatures,commerceIdentity,seasonalPalette} from './city_spectacle_state.js';

// Escenografía 100 % Three.js. Todas las figuras se construyen con medidas locales
// fijas, geometrías reutilizadas y escalas uniformes; sin sprites de peatones.
export function createCitySpectacle3D({THREE,scene,camera,canvas,buildingModels,box,sphere,cylinder,mat,tilePos,seeded,smallScreen,geometry}){
 const lifeRoot=new THREE.Group(),weatherRoot=new THREE.Group();
 lifeRoot.name='Ciudad Viva · vida real de los barrios';weatherRoot.name='Ciudad Viva · estaciones y clima';
 scene.add(lifeRoot,weatherRoot);
 const litMaterial=mat('#ffe0a2',{emissive:'#ffbc69',emissiveIntensity:1.15,roughness:.38});
 const dimMaterial=mat('#507d8d',{emissive:'#142832',emissiveIntensity:.05,roughness:.4});
 const closedMaterial=mat('#65717a',{emissive:'#000000',emissiveIntensity:0});
 const palettePeople=['#db986f','#5c8f8d','#9b74a7','#caad64','#6687ae','#81a470'];
 let plan=null,sceneKey='',climateKey='',animations=[],flags=[],retailCount=0,festivalCount=0,eventVisitors=0,windowCount=0,illuminatedWindows=0,frame=0,clock=0;
 const signCache=new Map();const weatherTint=new THREE.Color();let buildingLookup=new Map();
 const tone=(value)=>String(value||'').toUpperCase().slice(0,28);
 function makeSign(label,color){
  const key=label+'|'+color;
  if(!signCache.has(key)){
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
   const ctx=canvas.getContext('2d');
   ctx.fillStyle='#263a3c';ctx.fillRect(0,0,512,128);
   ctx.fillStyle=color;ctx.fillRect(8,8,496,112);
   ctx.fillStyle='#fff9ed';ctx.strokeStyle='#fff9ed';
   ctx.textAlign='center';ctx.textBaseline='middle';
   let size=label.length>23?39:label.length>16?46:label.length>10?57:68;
   ctx.font='800 '+size+'px system-ui, sans-serif';
   while(ctx.measureText(label).width>474&&size>26){size-=2;ctx.font='800 '+size+'px system-ui, sans-serif'}
   ctx.fillText(label,256,64);
   const texture=new THREE.CanvasTexture(canvas);
   texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;
   texture.needsUpdate=true;
   signCache.set(key,texture);
  }
  return signCache.get(key);
 }
 function decorateRetail(g,b){
  const identity=commerceIdentity(b);if(!identity)return;
  retailCount++;g.userData.cityRetail=true;
  const label=tone(identity.sign);
  const placard=new THREE.Mesh(geometry('cv-retail-sign-panel-1.28x.32',()=>new THREE.PlaneGeometry(1.28,.32)),
    new THREE.MeshBasicMaterial({map:makeSign(label,identity.color),side:THREE.FrontSide,transparent:false}));
  placard.material.userData.ephemeral=true;
  placard.position.set(0,1.89,1.015);placard.renderOrder=3;g.add(placard);
  const front=1.06;
  // Objetos discretos, siempre sobre la vereda o dentro de la ventana.
  if(identity.category==='panaderia'){
   box(g,.4,.29,.25,'#967357',.46,.18,front);
   for(let i=0;i<3;i++){const roll=sphere(g,.095,'#e9bd77',.34+i*.12,.36,front,1);roll.scale.set(1,.6,.75)}
   cylinder(g,.085,.085,.25,'#b6956f',-.66,.17,front,12);
  }else if(identity.category==='cafe'){
   for(const x of [-.51,.51]){
    cylinder(g,.19,.15,.07,'#856b59',x,.28,front,12);
    cylinder(g,.027,.027,.25,'#6f6d60',x,.14,front,8);
    cylinder(g,.064,.064,.08,'#e0d3b6',x,.35,front,12);
    cylinder(g,.036,.035,.06,'#694f3d',x,.4,front,10);
   }
  }else if(identity.category==='mercado'){
   for(const x of [-.58,.49]){
    box(g,.32,.22,.24,'#a67d4d',x,.17,front);
    for(let i=0;i<3;i++)sphere(g,.065,i%2?'#d68c43':'#90aa58',x+(i-1)*.09,.32,front,1);
   }
  }else if(identity.category==='flores'){
   for(const x of [-.57,.57]){cylinder(g,.14,.17,.19,'#b98a68',x,.17,front,10);
    cylinder(g,.016,.017,.25,'#609060',x,.35,front,8);
    for(let i=0;i<3;i++)sphere(g,.086,['#d599b6','#e9c4a8','#d8b0d7'][i],x+(i-1)*.085,.43,front,1);
   }
  }else if(identity.category==='taller'){
   box(g,.45,.36,.28,'#6d7779',.5,.23,front);
   for(let i=0;i<3;i++)box(g,.08,.06,.09,i===0?'#dfad65':'#a9bab5',.33+i*.12,.48,front);
   cylinder(g,.16,.16,.07,'#3a454b',-.56,.23,front,12).rotation.z=Math.PI/2;
  }
 }
 function decorateBuilding(g,b){
  if(!['home','shop','hotel','factory','school'].includes(b.kind))return;
  if(b.kind==='shop')decorateRetail(g,b);
  const height=b.kind==='hotel'?2.85:b.kind==='home'?Math.max(1.85,(b.level>=2?2.3:1.85)):b.kind==='school'?1.8:1.45;
  const facade=b.kind==='home'?.76:b.kind==='hotel'?.81:b.kind==='shop'?.864:b.kind==='school'?.96:.78;
  const floors=b.kind==='hotel'?4:b.kind==='home'?(b.level>=2?3:2):b.kind==='shop'?1:2;
  const rows=[],count=b.kind==='hotel'?3:2;
  for(let floor=0;floor<floors;floor++){
   const y=b.kind==='hotel'?.61+floor*.64:b.kind==='home'?.80+floor*.69:b.kind==='shop'?.78:b.kind==='school'?.79+floor*.52:.65+floor*.45;
   if(y>height+.25)break;
   for(let i=0;i<count;i++){
    // Vidrio justo delante de la fachada, sin atravesar techos ni ventanas existentes.
    const x=count===3?(i-1)*.52:(i===0?-.46:.46);
    const pane=box(g,b.kind==='hotel'?.24:.205,b.kind==='shop'?.45:.235,.018,dimMaterial,x,y,facade);
    pane.material=dimMaterial;pane.userData.cityWindow={x:b.x,y:b.y,kind:b.kind,index:rows.length};
    rows.push(pane);
   }
  }
  g.userData.cityWindows=rows;
 }
 function removeDynamic(){
  lifeRoot.traverse(obj=>{
   if(obj.geometry&&!obj.geometry.userData.shared)obj.geometry.dispose();
   if(obj.material?.userData?.ephemeral)obj.material.dispose();
  });
  lifeRoot.clear();animations=[];flags=[];
 }
 function makeHuman(parent,x,z,seed,{staff=false,child=false}={}){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=seeded(seed+8)*Math.PI*2;parent.add(g);
  const size=child?.76:1;
  g.scale.setScalar(size);
  const outfit=staff?'#e6b75b':palettePeople[Math.floor(seeded(seed+20)*palettePeople.length)];
  const trousers=['#425768','#5f5c54','#6a685b'][Math.floor(seeded(seed+21)*3)];
  const skin=['#c9936f','#e2b18a','#967059'][Math.floor(seeded(seed+19)*3)];
  const legs=[],arms=[];
  for(const side of [-1,1]){
   const leg=new THREE.Group();leg.position.set(side*.055,.235,0);g.add(leg);
   box(leg,.082,.205,.09,trousers,0,-.105,0);box(leg,.102,.045,.14,'#404446',0,-.22,.02);legs.push(leg);
   const arm=new THREE.Group();arm.position.set(side*.128,.45,0);g.add(arm);
   box(arm,.075,.205,.088,outfit,0,-.105,0);arms.push(arm);
  }
  box(g,.24,.27,.17,outfit,0,.375,0);
  cylinder(g,.045,.042,.075,skin,0,.55,0,8);
  sphere(g,.115,skin,0,.655,0,1);
  const hair=sphere(g,.114,['#44362b','#6b5240','#394247'][Math.floor(seeded(seed+23)*3)],0,.702,-.012,1);
  hair.scale.set(1,.48,1);
  animations.push({kind:'person',g,legs,arms,seed,phase:seeded(seed+40)*Math.PI*2});
  return g;
 }
 function makeDog(parent,x,z,seed){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=seeded(seed)*6.283;parent.add(g);
  const color=seed%2?'#b58b61':'#958777';
  box(g,.17,.16,.31,color,0,.19,0);
  for(const sx of [-.058,.058])for(const sz of [-.095,.105])box(g,.045,.13,.05,color,sx,.07,sz);
  sphere(g,.12,color,0,.265,.17,1);sphere(g,.045,'#3c3532',0,.24,.27,1);
  const tail=box(g,.042,.04,.16,color,0,.29,-.22);tail.rotation.x=.43;
  animations.push({kind:'dog',g,tail,seed});
 }
 function marketStall(parent,x,z,accent,seed){
  const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
  box(g,.53,.08,.43,'#a27c56',0,.48,0);
  for(const xx of [-.22,.22])for(const zz of [-.18,.18])box(g,.04,.9,.04,'#7a604a',xx,.49,zz);
  box(g,.57,.09,.53,accent,0,1.0,0);
  for(let i=0;i<4;i++)box(g,.13,.015,.56,i%2?'#fff5e3':accent,-.20+i*.135,1.055,0);
  box(g,.48,.12,.28,'#bd995e',0,.66,0);
  for(let i=0;i<5;i++)sphere(g,.048,i%2?'#ddaa56':'#74a668',-.18+i*.09,.76,-.02,1);
  for(let i=0;i<3;i++){const flag=box(g,.13,.11,.015,accent,(i-1)*.18,1.25,.02);flag.rotation.z=seeded(seed+i)*.16;flags.push({mesh:flag,phase:seeded(seed+i+5)*Math.PI*2})}
  return g;
 }
 function freePublicTile(state,center){
  const occupied=new Set([...(state.roads||[]).map(p=>p[0]+','+p[1]),...(state.buildings||[]).map(p=>p.x+','+p.y),...(state.projects||[]).map(p=>p.x+','+p.y),...(state.zones||[]).map(p=>p.x+','+p.y)]);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]]){
   const x=center.x+dx,y=center.y+dy;
   if(x===24||x===25||occupied.has(x+','+y))continue;
   const claims=state.landClaims;
   if(claims?.unlockedChunks?.length){const size=claims.chunkSize||8;if(!claims.unlockedChunks.includes(Math.floor(x/size)+','+Math.floor(y/size)))continue}
   return {x,y};
  }
  return null;
 }
 function chooseVenue(state){
  const buildings=state.buildings||[];
  return buildings.find(b=>b.serviceModel==='urbanPark'&&['operativo','habilitado'].includes(b.status))||
   buildings.find(b=>b.kind==='civic'&&['operativo','habilitado'].includes(b.status));
 }
 function activeHour(minutes){const h=((minutes%1440)+1440)%1440/60;return (h>=6&&h<=9)||(h>=16&&h<=22)}
 function roadsidePosition(state,building,shift=0){
  const roadSet=new Set((state.roads||[]).map(([x,y])=>x+','+y));
  const direction=[[0,1],[1,0],[0,-1],[-1,0]].find(([dx,dy])=>roadSet.has((building.x+dx)+','+(building.y+dy)))||[0,1];
  const [x,z]=tilePos(building.x,building.y);
  return [x+direction[0]*.84+direction[1]*shift,z+direction[1]*.84+direction[0]*shift];
 }
 function addNeighborhoodLife(state){
  if(!plan)return;
  const cap=smallScreen?16:34;let people=0;
  // Desde 0.263 las figuras residentes las dibuja living_city_3d.js,
  // asociadas a identificadores reales: no duplicarlas como extras aleatorios.
  const residents=[];
  for(const h of residents){
   if(people>=cap)break;
   const seed=Math.abs(h.x*117+h.y*193),count=Math.min(h.occupants>6?2:1,cap-people);
   for(let i=0;i<count;i++){
    const [px,pz]=roadsidePosition(state,h,i===0?-.35:.35);
    const group=makeHuman(lifeRoot,px,pz,seed+i*13,{child:i===1&&h.occupants>3});
    group.userData.cityRoutine='resident';people++;
   }
   if(h.occupants>=4&&seed%7===0&&!smallScreen){const [px,pz]=roadsidePosition(state,h,.5);makeDog(lifeRoot,px,pz,seed)}
  }
  for(const [i,b] of plan.shops.slice(0,smallScreen?4:11).entries()){
   if(people>=cap)break;
   const sales=Number(b.business?.lastSales||b.business?.lastLocalSales||0);
   if(sales<=0)continue;
   const seed=Math.abs(b.x*51+b.y*83),[x,z]=roadsidePosition(state,b,i%2?-.35:.35);
   const h=makeHuman(lifeRoot,x,z,seed+2);
   h.userData.cityRoutine='customer';people++;
  }
  for(const [i,stop] of plan.transitStops.slice(0,smallScreen?5:11).entries()){
   if(people>=cap)break;
   const [x,z]=tilePos(stop.x,stop.y);
   const group=makeHuman(lifeRoot,x+.7,z+.68,i*31+Math.abs(stop.x*3+stop.y*7),{});
   group.userData.cityRoutine='waiting';people++;
  }
  for(const [i,park] of plan.parks.slice(0,3).entries()){
   if(people>=cap)break;
   const visitors=(state.commutes||[]).filter(t=>t.reason==='ocio'&&Array.isArray(t.to)&&t.to[0]===park.x&&t.to[1]===park.y).reduce((s,t)=>s+Math.max(0,Number(t.workers)||0),0);
   if(visitors<1)continue;
   const [x,z]=tilePos(park.x,park.y);
   const group=makeHuman(lifeRoot,x+.45,z+.42,park.x*81+park.y*51+i,{child:i%2===0});
   group.userData.cityRoutine='park';people++;
  }
  for(const [i,work] of plan.activeServices.filter(w=>w.arrived).slice(0,smallScreen?2:5).entries()){
   if(people>=cap)break;
   const [x,z]=tilePos(work.x,work.y);
   const actor=makeHuman(lifeRoot,x+.64,z+.68,i*39+work.x+work.y,{staff:true});
   actor.userData.cityRoutine='emergency';people++;
  }
  const event=plan.events.at(-1),milestone=plan.milestones.at(-1),venue=chooseVenue(state);
  if((event||milestone)&&venue){
   const site=freePublicTile(state,venue);
   if(site){
    const [x,z]=tilePos(site.x,site.y);
    const fest=new THREE.Group();fest.position.set(x,0,z);lifeRoot.add(fest);
    const colors=event?.type==='festival'?['#b56c96','#ceaa5d','#5e9e93']:event?.type==='congreso'?['#5b84a4','#c09b58','#71988b']:['#db985f','#79a47a','#cb7f68'];
    for(let i=0;i<(smallScreen?2:3);i++){
     marketStall(fest,(i-1)*.62,-.33,colors[i],i+4);
    }
    for(let i=0;i<Math.min(event?smallScreen?3:6:3,cap-people);i++){
     const group=makeHuman(fest, (i%3-1)*.48,.30+Math.floor(i/3)*.26,11+i*7,{child:i===2});
     group.userData.cityRoutine='festival';people++;
    }
    if(milestone){
     for(let i=0;i<8;i++){
      const col=['#efae66','#8ac9c3','#dba0ba'][i%3];
      const balloon=sphere(fest,.083,col,(i%4-1.5)*.34,1.22+Math.floor(i/4)*.24,-.52,1);
      balloon.material=mat(col,{metalness:.04,roughness:.3});
      box(fest,.012,.3,.012,'#a7aca0',balloon.position.x,.94,balloon.position.z);
     }
    }
    festivalCount=1;eventVisitors=Number(event?.visitors)||0;
   }
  }
  // Charcos con relieve mínimo: se ubican sobre calles reales.
  if(plan.rainMm>0){
   const wetMat=mat('#91b9b7',{transparent:true,opacity:.27,depthWrite:false,roughness:.3});
   const roads=(state.roads||[]).slice(0,smallScreen?36:75);
   for(let i=0;i<roads.length;i+=2){
    const [x,z]=tilePos(roads[i][0],roads[i][1]);
    const puddle=box(lifeRoot,.23,.006,.44,wetMat,x+.15,.088,z+.24);
    puddle.renderOrder=4;
   }
  }
 }
 function setScene(state,{preview=false}={}){
  plan=citySpectaclePlan(state);
  const signatures=citySceneSignatures(plan);
  if(signatures.building+':'+signatures.climate+':'+(preview?'preview':'live')!==sceneKey){
   sceneKey=signatures.building+':'+signatures.climate+':'+(preview?'preview':'live');
   removeDynamic();festivalCount=0;eventVisitors=0;
   if(!preview)addNeighborhoodLife(state);
  }
  const nextClimate=signatures.climate;
  if(nextClimate!==climateKey){
   climateKey=nextClimate;
   leaves.material.color.set(seasonalPalette[plan.season].leaves[0]);
  }
  return plan;
 }
 const dropCount=smallScreen?72:155,leavesCount=smallScreen?18:45;
 const raindrops=new THREE.InstancedMesh(geometry('cv-rain-drop',()=>new THREE.BoxGeometry(.012,.31,.012)),
  new THREE.MeshBasicMaterial({color:'#b9e0f0',transparent:true,opacity:.43,depthWrite:false}),dropCount);
 raindrops.frustumCulled=false;raindrops.visible=false;raindrops.name='Lluvia 3D';weatherRoot.add(raindrops);
 const leaves=new THREE.InstancedMesh(geometry('cv-seasonal-leaf',()=>new THREE.PlaneGeometry(.10,.07)),
  new THREE.MeshBasicMaterial({color:'#bd8951',side:THREE.DoubleSide,transparent:true,opacity:.76,depthWrite:false}),leavesCount);
 leaves.frustumCulled=false;leaves.visible=false;leaves.name='Hojas de estación 3D';weatherRoot.add(leaves);
 const dummy=new THREE.Object3D(),direction=new THREE.Vector3(),center=new THREE.Vector3();
 let lastLitBucket='',lastWeatherFrame=0;
 function tick(delta,minutes,paused=false){
  if(!plan)return;
  frame++;if(!paused)clock+=Math.min(.1,delta||0);
  const hasRain=plan.rainMm>0;
  raindrops.visible=hasRain;leaves.visible=(plan.season==='otoño'||plan.season==='primavera')&&!hasRain;
  // La lluvia no altera la niebla global ni la exposición del mundo.
  if(plan.season==='otoño'||plan.season==='invierno'){weatherTint.set(seasonalPalette[plan.season].sky);scene.background.lerp(weatherTint,.08)}
  if(frame-lastWeatherFrame>=3){
   lastWeatherFrame=frame;
   // Punto al que mira la cámara: evita que los efectos queden en el origen al mover el mapa.
   camera.getWorldDirection(direction);
   const travel=Math.abs(direction.y)>1e-5?-camera.position.y/direction.y:85;
   center.copy(camera.position).addScaledVector(direction,travel);
   const spread=canvas.clientWidth<650?17:24,directionAngle=(Number(plan.windDirection)||0)*Math.PI/180,wind=Number(plan.windStrength)||.58;
   if(raindrops.visible)for(let i=0;i<dropCount;i++){
    const rawX=(seeded(i*13+4)-.5)*spread,rawZ=(seeded(i*23+9)-.5)*spread;
    const dx=((rawX+Math.cos(directionAngle)*clock*wind*.26+spread/2)%spread+spread)%spread-spread/2;
    const dz=((rawZ+Math.sin(directionAngle)*clock*wind*.26+spread/2)%spread+spread)%spread-spread/2;
    const y=paused?seeded(i*5+13)*6+1:((seeded(i*5+13)*7-clock*8)%7+7)%7+1;
    dummy.position.set(center.x+dx,y,center.z+dz);dummy.rotation.set(0,0,-.17-Math.sin(directionAngle)*wind*.08);dummy.scale.set(1,1,1);
    dummy.updateMatrix();raindrops.setMatrixAt(i,dummy.matrix);
   }
   if(raindrops.visible)raindrops.instanceMatrix.needsUpdate=true;
   if(leaves.visible)for(let i=0;i<leavesCount;i++){
    const dx=(seeded(i*12+17)-.5)*spread,dz=(seeded(i*31+21)-.5)*spread;
    const y=((seeded(i*7+14)*2.3-clock*(.4+wind*.14))%2.3+2.3)%2.3+.1;
    const drift=clock*wind*.34,leafX=((dx+Math.cos(directionAngle)*drift+spread/2)%spread+spread)%spread-spread/2,leafZ=((dz+Math.sin(directionAngle)*drift+spread/2)%spread+spread)%spread-spread/2;
    dummy.position.set(center.x+leafX+Math.sin(clock+i)*.2,y,center.z+leafZ);dummy.rotation.set(clock+i*.28,clock*.4+i,Math.sin(directionAngle)*wind*.24);dummy.scale.set(1,1,1);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
   }
   if(leaves.visible)leaves.instanceMatrix.needsUpdate=true;
  }
  const bucket=Math.floor((Number(minutes)||0)/20)+'|'+(plan.day%2);
  if(bucket!==lastLitBucket){
   lastLitBucket=bucket;windowCount=0;illuminatedWindows=0;
   const dark=minutes>=1080||minutes<360;
   for(const [id,{model}] of buildingModels){
    const panes=model?.userData?.cityWindows||[];
    if(!panes.length)continue;
    const [x,y]=id.split(',').map(Number);
    // Celdas de alumbrado consultadas con el estado real de la partida.
    const original=buildingLookup.get(id);
    const power=original?.utilityAccess?.powerServedPct;
    const powered=power===undefined||Number(power)>=40;
    const active=original?.kind==='home'?Number(original?.occupants||0)>0:
      original?.kind==='shop'?original?.business?.status!=='cerrado':
      original?.kind==='factory'?original?.business?.status==='abierto'||Number(original?.business?.lastProduction)>0:true;
    for(let i=0;i<panes.length;i++){
     const on=powered&&active&&dark&&(Math.abs(x*7+y*11+i*13+plan.day)%5!==0);
     panes[i].material=on?litMaterial:powered?dimMaterial:closedMaterial;
     windowCount++;if(on)illuminatedWindows++;
    }
   }
  }
  const hour=(Number(minutes)||0)/60;
  const peopleVisible=activeHour(minutes);
  for(const item of animations){
   if(item.kind==='person'){
    const routine=item.g.userData.cityRoutine;
    item.g.visible=routine==='festival'?hour>=9&&hour<=22:routine==='emergency'?true:routine==='resident'?peopleVisible:
     routine==='customer'?((hour>=7&&hour<10)||(hour>=12&&hour<14)||(hour>=17&&hour<21)):routine==='waiting'?hour>=5&&hour<=23:routine==='park'?((hour>=9&&hour<11)||(hour>=12&&hour<14)||(hour>=16&&hour<20)):true;
    if(!item.g.visible)continue;
    const cyc=clock*2.2+item.phase;
    item.g.position.y=Math.sin(cyc)*.007;
    item.arms[0].rotation.x=Math.sin(cyc)*.25;item.arms[1].rotation.x=-Math.sin(cyc)*.25;
    item.legs[0].rotation.x=Math.sin(cyc)*.13;item.legs[1].rotation.x=-Math.sin(cyc)*.13;
   }else if(item.kind==='dog'){item.tail.rotation.y=Math.sin(clock*5+item.seed)*.4}
  }
  for(const flag of flags){const gust=Math.sin(clock*2.6+flag.phase)*(Number(plan.windStrength)||.58);flag.mesh.rotation.z=gust*.22;flag.mesh.rotation.y=Math.cos(clock*1.9+flag.phase)*gust*.13}
 }
 function diagnostics(){
  let invalidVisualTransforms=0;
  const audit=object=>{
   const nums=[object.position.x,object.position.y,object.position.z,object.scale.x,object.scale.y,object.scale.z,object.rotation.x,object.rotation.y,object.rotation.z];
   if(nums.some(v=>!Number.isFinite(v))||[object.scale.x,object.scale.y,object.scale.z].some(v=>v<=0||v>20))invalidVisualTransforms++;
  };
  lifeRoot.traverse(audit);
  for(const entry of [...buildingModels.values()].slice(0,90))entry.model.traverse(audit);
  return {invalidVisualTransforms,season:plan?.season||'',rainMm:plan?.rainMm||0,rainDrops:raindrops.visible?dropCount:0,
  leafMeshes:leaves.visible?leavesCount:0,lifeFigures:animations.filter(a=>a.kind==='person').length,
  festivalSites:festivalCount,visitorsAtRecordedEvent:eventVisitors,retailModels:[...buildingModels.values()].filter(v=>v.model?.userData?.cityRetail).length,
  windows:windowCount,illuminatedWindows,sceneUpdateKey:sceneKey.slice(0,72)}}
 function sceneSync(state,options={}){
  // Evitar mantener referencias mutables a la partida: la vista solo se interpreta.
  const result=setScene(state,options);
  result._allBuildings=state.buildings||[];
  buildingLookup=new Map((state.buildings||[]).map(b=>[String(b.x)+','+String(b.y),b]));
  lastLitBucket='';
 }
 return {decorateBuilding,sceneSync,tick,diagnostics};
}
