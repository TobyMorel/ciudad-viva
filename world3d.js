import * as THREE from './vendor/three.module.js';
import {applyTrafficQueue} from './traffic.js';
import {daylightIntensity} from './simulation_time.js?v=0.280';
import {metroVisualPlan} from './metro_visuals.js';
import {createCitySpectacle3D} from './city_spectacle_3d.js?v=0.280';
import {createLivingCity3D} from './living_city_3d.js?v=0.280';
import {createCityImmersive3D} from './city_immersive_3d.js?v=0.280';

// La cuadrícula lógica conserva sus celdas; en escena, cada celda mide 3
// unidades y los modelos crecen un 35%, dejando más espacio entre ellos.
const MAP_WORLD_SCALE=1.35, MAP_CELL_WORLD_SIZE=3, TILE=MAP_CELL_WORLD_SIZE/MAP_WORLD_SCALE, LAND_CHUNK_SIZE=8;
const ROAD_TYPES_RENDER={local:{lanes:1,parking:2},avenue:{lanes:2,parking:0},route:{lanes:1,parking:0},highway:{lanes:2,parking:0}};
const STREET_SECTION=Object.freeze({walk:2.30,asphalt:1.96,parkingCenter:.71,parkingDivider:.46,curb:.96,trafficLane:.29});
const COLORS={grass:'#80af70',sand:'#e4d3ae',water:'#389dac',road:'#3f464b',walk:'#d5ccba',line:'#f2df9c',home:'#e9c99e',shop:'#a3c9bd',civic:'#e7d1b0'};
const key=(x,y)=>`${x},${y}`;
function riverEdges(z){const center=49+.45*Math.sin(z*.055)+.18*Math.sin(z*.13+1),half=2.25+.12*Math.sin(z*.083+2);return[center-half,center+half]}
function waterTile(x,y){
  if(x===24||x===25)return true;
  const [cx,cz]=tilePos(x,y),[west,east]=riverEdges(cz),bankBuffer=.7;
  return cx>=west-bankBuffer&&cx<=east+bankBuffer;
}
const tilePos=(x,y)=>[(x+.5)*TILE,(y+.5)*TILE];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const TRIP_WINDOWS=Object.freeze({early:[300,420],morningPeak:[420,570],midday:[660,840],afternoon:[840,1020],afternoonReturn:[960,1080],eveningPeak:[1020,1170],late:[1170,1320],dayNoon:[570,1020]});
function tripRoutine(trip){
  const key=TRIP_WINDOWS[trip.departureWindowKey]?trip.departureWindowKey:'morningPeak';
  if(trip.reason==='trabajo'||trip.reason==='regreso')return [{window:key,reverse:false}];
  if(trip.reason==='educacion')return [{window:key,reverse:false},{window:'eveningPeak',reverse:true}];
  return [{window:'midday',reverse:false},{window:'afternoonReturn',reverse:true}];
}
function routineTravel(actor,minutes,total){
  if(!actor.dailyRoutine)return null;
  const minute=((Number(minutes)||0)%1440+1440)%1440;
  for(let index=0;index<actor.dailyRoutine.length;index++){
    const leg=actor.dailyRoutine[index],range=TRIP_WINDOWS[leg.window]||TRIP_WINDOWS.morningPeak;
    const span=clamp(Number(actor.routineSpanMinutes)||range[1]-range[0],1,range[1]-range[0]);
    const start=leg.fromEnd?range[1]-span:range[0];
    if(minute<start||minute>start+span)continue;
    const progress=clamp((minute-start)/span,0,1);
    return {visible:true,leg:index,progress,reverse:Boolean(leg.reverse),travel:leg.reverse?total+progress*total:progress*total};
  }
  return {visible:false,leg:-1,travel:0};
}
function seeded(n){let x=Math.sin(n*127.1+78.233)*43758.5453;return x-Math.floor(x)}

export function createWorld(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  const gl=renderer.getContext(),rendererInfo=gl.getExtension('WEBGL_debug_renderer_info');
  const softwareRenderer=Boolean(rendererInfo&&/swiftshader|llvmpipe|software/i.test(String(gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL))));
  const smallScreen=window.innerWidth<650;
  const minPixelRatio=softwareRenderer?0.28:smallScreen?0.78:0.8,maxPixelRatio=softwareRenderer?0.4:smallScreen?1.25:1.5;
  let renderPixelRatio=clamp(window.devicePixelRatio||1,minPixelRatio,maxPixelRatio);
  let lastSoftwareRender=0;
  renderer.setPixelRatio(renderPixelRatio);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.98;
  // Las sombras de suelo de árboles y edificios son geometría pintada. Evitar
  // el shadow map evita una pasada adicional justo al acercar la cámara.
  renderer.shadowMap.enabled=false;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.scale.setScalar(MAP_WORLD_SCALE);scene.background=new THREE.Color('#bcd9df');scene.fog=new THREE.Fog('#bcd9df',132*MAP_WORLD_SCALE,240*MAP_WORLD_SCALE);
  const camera=new THREE.OrthographicCamera(-40,40,30,-30,.1,350*MAP_WORLD_SCALE);
  const hemi=new THREE.HemisphereLight('#fff5e5','#597d6e',.94);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#ffe4bb',2.65);sun.position.set(3,31,28);sun.castShadow=false;scene.add(sun);sun.target.position.set(28,0,20);scene.add(sun.target);
  const staticRoot=new THREE.Group(),vegetationRoot=new THREE.Group(),landShadeRoot=new THREE.Group(),buildingRoot=new THREE.Group(),dynamicRoot=new THREE.Group(),trafficRoot=new THREE.Group(),selectionRoot=new THREE.Group(),weatherSprayRoot=new THREE.Group();scene.add(staticRoot,vegetationRoot,landShadeRoot,buildingRoot,dynamicRoot,trafficRoot,selectionRoot,weatherSprayRoot);const buildingModels=new Map();
  const materials=new Map(),geometries=new Map();
  function mat(color,opts={}){const id=color+JSON.stringify(opts);if(!materials.has(id))materials.set(id,new THREE.MeshStandardMaterial({color,roughness:.87,metalness:0,...opts}));return materials.get(id)}
  function geometry(id,make){if(!geometries.has(id)){const value=make();value.userData.shared=true;geometries.set(id,value)}return geometries.get(id)}
  function box(parent,w,h,d,color,x=0,y=0,z=0,options={}){const mesh=new THREE.Mesh(geometry(`b:${w}:${h}:${d}`,()=>new THREE.BoxGeometry(w,h,d)),typeof color==='string'?mat(color):color);mesh.position.set(x,y,z);mesh.castShadow=options.cast===true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
  let pendingRoadMarks=null;
  function addRoadMark(parent,w,h,d,color,x,y,z,rotation=0){
    if(!pendingRoadMarks){const mark=box(parent,w,h,d,color,x,y,z,{cast:false});mark.rotation.y=rotation;return mark}
    const chunkX=Math.floor(x/(LAND_CHUNK_SIZE*TILE)),chunkY=Math.floor(z/(LAND_CHUNK_SIZE*TILE)),id=`${chunkX},${chunkY}|${color}`,marks=pendingRoadMarks.get(id)||[];
    marks.push([w,h,d,x,y,z,rotation]);pendingRoadMarks.set(id,marks);
  }
  function flushRoadMarks(parent){
    if(!pendingRoadMarks)return;
    const unit=geometry('cv-road-mark-unit',()=>new THREE.BoxGeometry(1,1,1)),dummy=new THREE.Object3D();
    for(const [id,marks] of pendingRoadMarks){
      const color=id.slice(id.indexOf('|')+1),batch=new THREE.InstancedMesh(unit,mat(color),marks.length);
      batch.name=`Señalización vial · ${id.split('|')[0]}`;batch.castShadow=false;batch.receiveShadow=false;
      marks.forEach(([w,h,d,x,y,z,rotation=0],index)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,rotation,0);dummy.scale.set(w,h,d);dummy.updateMatrix();batch.setMatrixAt(index,dummy.matrix)});
      batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();parent.add(batch);
    }
    pendingRoadMarks=null;
  }
  function sphere(parent,r,color,x,y,z,detail=2){const mesh=new THREE.Mesh(geometry(`s:${r}:${detail}`,()=>new THREE.IcosahedronGeometry(r,detail)),mat(color));mesh.position.set(x,y,z);mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh}
  function cylinder(parent,topRadius,bottomRadius,height,color,x,y,z,segments=18){const mesh=new THREE.Mesh(geometry(`c:${topRadius}:${bottomRadius}:${height}:${segments}`,()=>new THREE.CylinderGeometry(topRadius,bottomRadius,height,segments)),mat(color));mesh.position.set(x,y,z);mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh}
  const tireSprayCapacity=smallScreen?36:96,tireSprayMaterial=new THREE.MeshBasicMaterial({color:'#d9eef0',transparent:true,opacity:.38,depthWrite:false});
  const tireSprays=new THREE.InstancedMesh(geometry('cv-tire-spray',()=>new THREE.SphereGeometry(1,8,5)),tireSprayMaterial,tireSprayCapacity);
  tireSprays.name='Salpicaduras de neumáticos';tireSprays.count=0;tireSprays.frustumCulled=false;weatherSprayRoot.add(tireSprays);
  const tireSprayDummy=new THREE.Object3D();let lastTireSprayUpdate=0;
  function updateTireSprays(now){
    if(now-lastTireSprayUpdate<55)return;lastTireSprayUpdate=now;
    const raining=Number(lastSceneState?.utilities?.report?.drainage?.rainfallMm||0)>0;let count=0;
    if(raining){
      const limit=smallScreen?18:48;
      for(const actor of routeActors){
        if(count>=limit*2)break;
        const mesh=actor.mesh,type=actor.selection?.type||'';
        if(actor.parkingStay||!mesh?.visible||!type||type.includes('Peatones')||type.includes('Visitante')||type.includes('Tren')||type.includes('Avión')||type.includes('Buque'))continue;
        const yaw=mesh.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw);
        for(const side of [-1,1]){
          if(count>=limit*2)break;
          const localX=side*.22,localZ=-.43,phase=now*.014+count*1.7,pulse=.82+Math.sin(phase)*.18;
          const x=mesh.position.x+localX*cos+localZ*sin,y=.075+Math.abs(Math.sin(phase*1.3))*.018,z=mesh.position.z-localX*sin+localZ*cos;
          tireSprayDummy.position.set(x,y,z);tireSprayDummy.rotation.set(0,yaw,0);tireSprayDummy.scale.set(.10*pulse,.024,.17*pulse);tireSprayDummy.updateMatrix();tireSprays.setMatrixAt(count++,tireSprayDummy.matrix);
        }
        if(count/2>=limit)break;
      }
    }
    tireSprays.count=count;tireSprays.instanceMatrix.needsUpdate=true;
  }

  function roundedBox(parent,w,h,d,color,x=0,y=0,z=0,r=.035,options={}){
    const depth=Math.max(.02,d-r*2),shapeWidth=Math.max(.02,w-r*2),shapeHeight=Math.max(.02,h-r*2),id='rounded:'+w+':'+h+':'+d+':'+r;
    const mesh=new THREE.Mesh(geometry(id,()=>{
      const shape=new THREE.Shape(),left=-shapeWidth/2,bottom=-shapeHeight/2;
      shape.moveTo(left+r,bottom);shape.lineTo(-left-r,bottom);shape.quadraticCurveTo(-left,bottom,-left,bottom+r);
      shape.lineTo(-left,-bottom-r);shape.quadraticCurveTo(-left,-bottom,-left-r,-bottom);
      shape.lineTo(left+r,-bottom);shape.quadraticCurveTo(left,-bottom,left,-bottom-r);
      shape.lineTo(left,bottom+r);shape.quadraticCurveTo(left,bottom,left+r,bottom);
      const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:r*.42,bevelThickness:r*.42,curveSegments:4});
      geo.translate(0,0,-depth/2);geo.computeVertexNormals();return geo
    }),typeof color==='string'?mat(color):color);
    mesh.position.set(x,y,z);mesh.castShadow=options.cast===true;mesh.receiveShadow=true;parent.add(mesh);return mesh
  }
  function rodBetween(parent,a,b,r,color,segments=8){
    const av=new THREE.Vector3(a[0],a[1],a[2]),bv=new THREE.Vector3(b[0],b[1],b[2]),delta=new THREE.Vector3().subVectors(bv,av);
    const radius=Number(r).toFixed(3),length=delta.length(),roundedLength=Number(length.toFixed(3));
    const geo=geometry(`rod:${radius}:${roundedLength.toFixed(3)}:${segments}`,()=>new THREE.CylinderGeometry(Number(radius),Number(radius),roundedLength,segments));
    const mesh=new THREE.Mesh(geo,typeof color==='string'?mat(color):color);
    mesh.position.copy(av).add(bv).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh
  }
  function pipe(parent,points,color='#829b96',radius=.026){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],p[2])));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*4),radius,7,false),mat(color));
    mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh
  }
  function ring(parent,r,tubeRadius,color,x,y,z,options={}){
    const geo=geometry(`ring:${r}:${tubeRadius}:8:24`,()=>new THREE.TorusGeometry(r,tubeRadius,8,24));
    const mesh=new THREE.Mesh(geo,typeof color==='string'?mat(color):color);
    mesh.position.set(x,y,z);mesh.rotation.x=options.rotationX||0;mesh.rotation.y=options.rotationY||0;mesh.rotation.z=options.rotationZ||0;mesh.castShadow=options.cast===true;mesh.receiveShadow=true;parent.add(mesh);return mesh
  }

  function plane(parent,w,d,color,x,y,z,options={}){const geo=geometry(`plane:${w}:${d}`,()=>new THREE.PlaneGeometry(w,d)),mesh=new THREE.Mesh(geo,typeof color==='string'?mat(color,options):color);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh}
  function groundShadow(parent,x,z,r,opacity=.18){const radius=Number(r.toFixed(2)),mesh=new THREE.Mesh(geometry(`ground-shadow:${radius}`,()=>new THREE.CircleGeometry(radius,24)),mat('#355746',{transparent:true,opacity,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.scale.y=.62;mesh.position.set(x+.2,-.105,z+.18);mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh)}
  function line(parent,points,color='#ffdf90',opacity=1){const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const material=new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity});material.userData.ephemeral=true;const m=new THREE.Line(geometry,material);parent.add(m);return m}
  function clear(group){group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry&&!o.geometry.userData.shared)o.geometry.dispose();if(o.material&&o.material.userData?.ephemeral)o.material.dispose()});group.clear()}

  // La textura terrestre se genera en el navegador: no necesita descargar recursos.
  const texCanvas=document.createElement('canvas');texCanvas.width=768;texCanvas.height=768;const tc=texCanvas.getContext('2d');tc.fillStyle='#87b77a';tc.fillRect(0,0,768,768);
  for(let i=0;i<650;i++){const x=seeded(i+1)*768,y=seeded(i+902)*768,r=8+seeded(i+1902)*42;const grad=tc.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,i%3?'#acd08b55':'#5b9f7855');grad.addColorStop(1,'#91bb8500');tc.fillStyle=grad;tc.beginPath();tc.arc(x,y,r,0,Math.PI*2);tc.fill()}
  for(let i=0;i<2600;i++){const x=seeded(i+302)*768,y=seeded(i+777)*768;tc.fillStyle=i%7===0?'#e7dba579':'#c0d6a95c';tc.fillRect(x,y,.8+seeded(i)*1.7,.8+seeded(i+1)*1.5)}
  const grassTex=new THREE.CanvasTexture(texCanvas);grassTex.colorSpace=THREE.SRGBColorSpace;grassTex.wrapS=grassTex.wrapT=THREE.RepeatWrapping;grassTex.repeat.set(2000,2000);grassTex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  let infiniteGroundOffset={x:0,z:0};const infiniteGround=[plane(staticRoot,40000,40000,mat('#8dbb7b'),0,-.24,0),plane(staticRoot,40000,40000,new THREE.MeshStandardMaterial({map:grassTex,roughness:1}),0,-.16,0)];
  const gatewayTunnel=new THREE.Group();gatewayTunnel.position.set(4*TILE,0,10.5*TILE);staticRoot.add(gatewayTunnel);
  // La boca recorre desde el inicio de la carretera exterior hasta la misma entrada urbana.
  const tunnelStart=-4*TILE,tunnelEnd=.30,tunnelLength=tunnelEnd-tunnelStart,tunnelCenter=(tunnelStart+tunnelEnd)/2,tunnelRoof=box(gatewayTunnel,tunnelLength,.34,2.32,'#b7ad95',tunnelCenter,2.02,0,{cast:true});
  box(gatewayTunnel,tunnelLength,.07,1.98,'#4c5754',tunnelCenter,1.82,0,{cast:false});
  for(const z of [-1.08,1.08]){box(gatewayTunnel,tunnelLength,2,.28,'#978f7c',tunnelCenter,.91,z,{cast:true});box(gatewayTunnel,tunnelLength,.13,.34,'#c0b59a',tunnelCenter,1.88,z,{cast:false})}
  box(gatewayTunnel,.24,2.25,2.16,'#172629',.12,1.05,0,{cast:false});
  const archPts=[];for(let i=0;i<=16;i++){const a=Math.PI-i*Math.PI/16;archPts.push(new THREE.Vector3(.12,1.12+Math.sin(a)*1.08,Math.cos(a)*1.08))}const tunnelArch=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts),48,.16,12,false),mat('#c2b69a'));tunnelArch.castShadow=true;tunnelArch.receiveShadow=true;gatewayTunnel.add(tunnelArch);
  for(const z of [-.84,.84]){box(gatewayTunnel,.26,1.1,.28,'#c2b69a',.12,.55,z,{cast:true});box(gatewayTunnel,.35,.15,.35,'#d0c3a6',.12,1.12,z,{cast:false})}
  for(let x=tunnelStart+.4;x<tunnelEnd-.45;x+=.9)for(const z of [-1.16,1.16])box(gatewayTunnel,.32,.16,.36,'#b3a990',x,1.91,z,{cast:false});
  roundedBox(gatewayTunnel,tunnelLength+.08,.2,.23,'#d1c4a4',tunnelCenter,2.26,1.11,.06,{cast:true});
  for(let x=tunnelStart+.35;x<tunnelEnd-.1;x+=.53){
    roundedBox(gatewayTunnel,.07,.42,.22,'#c7b99b',x,1.98,1.16,.025);
    roundedBox(gatewayTunnel,.16,.07,.18,'#e0d5ba',x,2.23,1.16,.025);
  }
  for(let x=tunnelStart+.8;x<tunnelEnd-.3;x+=1.55){
    rodBetween(gatewayTunnel,[x,1.72,-.78],[x,1.72,.78],.025,'#5f716b',7);
    roundedBox(gatewayTunnel,.24,.13,.21,'#536c68',x,1.68,-.76,.035);
    sphere(gatewayTunnel,.09,'#ffe6a5',x,1.75,-.76,2);
  }
  for(const z of [-.85,.85])for(let x=tunnelStart+.8;x<tunnelEnd-.3;x+=1.55){
    roundedBox(gatewayTunnel,.28,.38,.1,'#a7b19e',x,.42,z,.035);
    for(let j=0;j<3;j++)sphere(gatewayTunnel,.105,['#5e9568','#84ad73','#b7c67d'][j],x+(j-1)*.07,.65,z,1);
  }

  // Río continuo de norte a sur: cauce sinuoso y dos riberas sobre terreno jugable.
  const waterMat=mat(COLORS.water,{metalness:.08,roughness:.28,transparent:true,opacity:.97});
  function riverStrip(kind){const vertices=[],indices=[];for(let i=0;i<=5000;i++){const z=-20000+i*8,[west,east]=riverEdges(z);let left,right,height;if(kind==='water'){left=west;right=east;height=-.095}else if(kind==='west'){left=west-.56;right=west+.07;height=-.065}else{left=east-.07;right=east+.56;height=-.065}vertices.push(left,height,z,right,height,z);if(i<5000){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3)}}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,kind==='water'?waterMat:mat('#d9c9a3',{side:THREE.DoubleSide}));mesh.receiveShadow=true;staticRoot.add(mesh)}
  riverStrip('water');riverStrip('west');riverStrip('east');
  const waves=[];
  for(let i=0;i<100;i++){const z=-100+seeded(i+145)*200,[west,east]=riverEdges(z),x=west+.6+seeded(i+130)*(east-west-1.2),w=.25+seeded(i+132)*.6;waves.push(line(staticRoot,[[x-w/2,-.044,z],[x+w/2,-.044,z]],i%4?'#d8f0e6':'#a2d9d8',.32))}
  for(let i=0;i<54;i++){
    const z=-112+i*4.2,[west,east]=riverEdges(z);
    for(const side of [-1,1]){
      const x=side<0?west-.17:east+.17,seed=i*11+(side+1)*3,lean=seeded(seed+9)>.5?1:-1;
      for(let j=0;j<3;j++){
        const px=x+(j-1)*.075,angle=(j-1)*.24+lean*.12,height=.2+seeded(seed+j)*.17;
        rodBetween(staticRoot,[px,-.025,z+(j-1)*.06],[px+Math.sin(angle)*.08,height,z+(j-1)*.11],.012,'#688a62',6);
        sphere(staticRoot,.065,['#739a68','#92aa72','#8aa36d'][j],px+Math.sin(angle)*.08,height,z+(j-1)*.11,1);
      }
    }
  }

  for(let i=0;i<110;i++){const z=-110+seeded(i+70)*220,[west,east]=riverEdges(z),x=(i%2?west-.32:east+.32)+(seeded(i+210)-.5)*.22,r=.09+seeded(i+18)*.17;const rock=sphere(staticRoot,r,i%3?'#b9ad91':'#d7c9a8',x,-.035,z,1);rock.scale.y=.5}
  function tree(x,z,seed,parent=vegetationRoot,tileX,tileY){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=seeded(seed+92)*Math.PI*2;const species=Math.floor(seeded(seed+8)*5),s=(.65+seeded(seed+55)*.55)*(species===2?.76:1),blossom=species===4&&seeded(seed+11)>.48,olive=species===3;groundShadow(g,0,0,.59*s,.19);const trunk=cylinder(g,.075*s,.12*s,.87*s,olive?'#716e52':'#775c45',0,.42*s,0,12);trunk.castShadow=false;const palette=blossom?['#d58da9','#e5a9bb','#f1c3c8']:olive?['#719466','#94a36b','#8daa77']:species===1?['#3d8060','#568f5f','#79aa68']:['#4d8957','#67a45d','#8bb664'];const lobes=smallScreen?4:species===1?6:5;for(let i=0;i<lobes;i++){const a=i*Math.PI*2/lobes,spread=species===1?.31:.23,px=Math.cos(a)*spread*s,pz=Math.sin(a)*spread*s,y=(species===2?1.0:1.12)*s+(i%2)*.1*s;sphere(g,(species===1?.32:.27)*s,palette[i%3],px,y,pz,2)}const crown=sphere(g,(species===2?.39:.36)*s,palette[1],0,(species===2?1.15:1.3)*s,0,2);
    // Ramas curvadas, raíces visibles y brotes de distinta edad rompen la silueta repetida.
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2+seeded(seed+73)*.35,reach=(.28+seeded(seed+i+150)*.09)*s;
      rodBetween(g,[0,.56*s,0],[Math.cos(a)*reach,.94*s,Math.sin(a)*reach],.038*s,olive?'#716e52':'#785d42',7);
      if(i%2===0)sphere(g,.11*s,palette[(i+1)%palette.length],Math.cos(a)*reach,.96*s,Math.sin(a)*reach,1);
    }
    for(let i=0;i<4;i++){const a=i*Math.PI/2+.5,rx=Math.cos(a)*.15*s,rz=Math.sin(a)*.15*s;rodBetween(g,[rx,.08*s,rz],[rx*1.8,.025*s,rz*1.8],.045*s,olive?'#777558':'#795d46',7)}
    for(let i=0;i<3;i++){const a=i*2.1+.4,dx=Math.cos(a)*.24*s,dz=Math.sin(a)*.24*s;sphere(g,.09*s,blossom?'#edb6c5':palette[(i+2)%palette.length],dx,(1.06+i%2*.14)*s,dz,1)}
  crown.castShadow=false;if(!smallScreen&&species!==2)for(let i=0;i<3;i++){const a=i*2.4;sphere(g,.065*s,blossom?'#f4d5d2':'#b4c978',Math.cos(a)*.26*s,1.15*s+Math.sin(i*5)*.12*s,Math.sin(a)*.26*s,1)}parent.add(g);windTrees.push({mesh:g,phase:seeded(seed+401)*Math.PI*2,strength:.085+seeded(seed+402)*.035,crown,baseCrownY:(species===2?1.15:1.3)*s,tileX,tileY});registerVegetationBlocker(tileX,tileY,blocked=>{g.visible=!blocked});return g}
  const vegetationObstacles=new Set(),vegetationBlockers=new Map(),windTrees=[],instancedWindTrees=[];
  const hiddenVegetationMatrix=new THREE.Matrix4().makeScale(0,0,0);
  function registerVegetationBlocker(tileX,tileY,update){if(!Number.isInteger(tileX)||!Number.isInteger(tileY))return;const id=key(tileX,tileY),updates=vegetationBlockers.get(id)||[];updates.push(update);vegetationBlockers.set(id,updates);update(vegetationObstacles.has(id))}
  function registerVegetationInstance(tileX,tileY,mesh,index){const base=new THREE.Matrix4();mesh.getMatrixAt(index,base);const original=base.clone();registerVegetationBlocker(tileX,tileY,blocked=>{mesh.setMatrixAt(index,blocked?hiddenVegetationMatrix:original);mesh.instanceMatrix.needsUpdate=true})}
  function syncVegetationObstacles(next){const changed=new Set([...vegetationObstacles,...next]);for(const id of [...changed])if(vegetationObstacles.has(id)===next.has(id))changed.delete(id);vegetationObstacles.clear();for(const id of next)vegetationObstacles.add(id);for(const id of changed)for(const update of vegetationBlockers.get(id)||[])update(next.has(id))}
  let vegetationKey='',windClock=0,instancedWindElapsed=0,vegetationLOD='detailed',vegetationInstances=0,vegetationTreeCount=0,vegetationBatchCount=0;
  let farTreeTrunks=null,farTreeCrowns=null,farTreeCrownsSmall=null,farBushes=null;
  const farTrunkGeometry=geometry('lod-tree-trunk',()=>new THREE.CylinderGeometry(.075,.12,.72,6));
  const farCrownGeometry=geometry('lod-tree-crown',()=>new THREE.IcosahedronGeometry(1,1));
  const farBushGeometry=geometry('lod-tree-bush',()=>new THREE.IcosahedronGeometry(1,0));
  const farTrunkMaterial=mat('#775c45'),farCrownMaterial=mat('#68a45c'),farBushMaterial=mat('#729a65');

  const detailedBarkColors=new Set(['#716e52','#775c45','#785d42','#777558','#795d46'].map(color=>new THREE.Color(color).getHex()));
  const detailedTreeTemplates=new Map(),detailedWindTrees=[],detailedWindMeshes=[],detailedVegetationBatches=[];
  const detailedTreeMaterial=mat('#ffffff',{vertexColors:true,roughness:.88});
  const detailedShadowGeometry=geometry('lod-detailed-tree-shadow',()=>new THREE.CircleGeometry(1,24));
  const detailedShadowMaterial=mat('#355746',{transparent:true,opacity:.19,depthWrite:false});
  const detailedBushGeometry=geometry('lod-detailed-bush',()=>new THREE.IcosahedronGeometry(1,1));
  const detailedBushMaterials=[mat('#a99a7b'),mat('#729a65')],detailedBushTopMaterial=mat('#93ad6c');
  function mergeDetailedTreeGeometry(root,bark){
    root.updateMatrixWorld(true);const positions=[],normals=[],colors=[];
    root.traverse(object=>{
      if(!object.isMesh||object.material?.transparent)return;
      const base=object.material?.color||instanceColor.set('#ffffff');
      if(detailedBarkColors.has(base.getHex())!==bark)return;
      const source=object.geometry;if(!source.attributes.normal)source.computeVertexNormals();
      const part=source.index?source.toNonIndexed():source.clone(),p=part.attributes.position,n=part.attributes.normal,c=part.attributes.color,normalMatrix=new THREE.Matrix3().getNormalMatrix(object.matrixWorld),point=new THREE.Vector3(),normal=new THREE.Vector3();
      for(let i=0;i<p.count;i++){
        point.fromBufferAttribute(p,i).applyMatrix4(object.matrixWorld);normal.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();
        positions.push(point.x,point.y,point.z);normals.push(normal.x,normal.y,normal.z);
        colors.push(base.r*(c?c.getX(i):1),base.g*(c?c.getY(i):1),base.b*(c?c.getZ(i):1));
      }
      part.dispose();
    });
    const merged=new THREE.BufferGeometry();merged.userData.shared=true;merged.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));merged.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));merged.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));merged.computeBoundingSphere();return merged
  }
  function getDetailedTreeTemplate(species,blossom){
    const id=species+':'+(blossom?1:0);if(detailedTreeTemplates.has(id))return detailedTreeTemplates.get(id);
    let sampleSeed=1;
    for(;sampleSeed<50000;sampleSeed++){
      if(Math.floor(seeded(sampleSeed+8)*5)!==species)continue;
      if(species===4&&((seeded(sampleSeed+11)>.48)!==blossom))continue;
      break
    }
    const holder=new THREE.Group(),model=tree(0,0,sampleSeed,holder);windTrees.pop();model.rotation.set(0,0,0);model.position.set(0,0,0);holder.updateMatrixWorld(true);
    const template={wood:mergeDetailedTreeGeometry(holder,true),canopy:mergeDetailedTreeGeometry(holder,false),scale:(.65+seeded(sampleSeed+55)*.55)*(species===2?.76:1)};
    holder.clear();detailedTreeTemplates.set(id,template);return template
  }
  function setDetailedMatrix(mesh,index,x,y,z,sx,sy,sz,yaw,lean=0,rotationX=0){
    instanceDummy.position.set(x,y,z);instanceDummy.rotation.set(rotationX,yaw,lean);instanceDummy.scale.set(sx,sy,sz);instanceDummy.updateMatrix();mesh.setMatrixAt(index,instanceDummy.matrix)
  }
  function updateDetailedTreeWind(tree,wave){
    const lean=wave*tree.strength,s=tree.scale;if(vegetationObstacles.has(key(tree.tileX,tree.tileY))){setDetailedMatrix(tree.wood,tree.index,tree.x,0,tree.z,0,0,0,tree.yaw,0);setDetailedMatrix(tree.canopy,tree.index,tree.x,0,tree.z,0,0,0,tree.yaw,0);return}
    setDetailedMatrix(tree.wood,tree.index,tree.x,0,tree.z,s,s,s,tree.yaw,lean);
    const crownLift=Math.sin(windClock*1.6+tree.phase+1)*.105*s;
    setDetailedMatrix(tree.canopy,tree.index,tree.x,crownLift,tree.z,s,s,s,tree.yaw,lean*1.25)
  }
  function addDetailedVegetation(trees,bushes){
    const prepared=trees.map(item=>{
      const species=Math.floor(seeded(item.seed+8)*5),blossom=species===4&&seeded(item.seed+11)>.48;
      return{item,species,blossom,template:getDetailedTreeTemplate(species,blossom)}
    }),variants=new Map();
    for(const record of prepared){const id=record.species+':'+(record.blossom?1:0);if(!variants.has(id))variants.set(id,[]);variants.get(id).push(record)}
    for(const records of variants.values()){
      const template=records[0].template,wood=new THREE.InstancedMesh(template.wood,detailedTreeMaterial,records.length),canopy=new THREE.InstancedMesh(template.canopy,detailedTreeMaterial,records.length);
      for(const mesh of [wood,canopy]){mesh.castShadow=false;mesh.receiveShadow=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);vegetationRoot.add(mesh);detailedVegetationBatches.push(mesh);detailedWindMeshes.push(mesh)}
      for(let index=0;index<records.length;index++){
        const {item}=records[index],species=records[index].species,size=(.65+seeded(item.seed+55)*.55)*(species===2?.76:1),s=size/template.scale,yaw=seeded(item.seed+92)*Math.PI*2,phase=seeded(item.seed+401)*Math.PI*2,brightness=.92+seeded(item.seed+402)*.16;
        const record={x:item.x,z:item.z,index,scale:s,yaw,phase,strength:.085+seeded(item.seed+402)*.035,wood,canopy,tileX:item.tileX,tileY:item.tileY};
        detailedWindTrees.push(record);updateDetailedTreeWind(record,0);registerVegetationBlocker(item.tileX,item.tileY,()=>updateDetailedTreeWind(record,Math.sin(windClock*1.25+record.phase)));
        instanceColor.setRGB(brightness,brightness,brightness);wood.setColorAt(index,instanceColor);canopy.setColorAt(index,instanceColor)
      }
      for(const mesh of [wood,canopy]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere()}
    }
    if(trees.length){
      const shadows=new THREE.InstancedMesh(detailedShadowGeometry,detailedShadowMaterial,trees.length);shadows.castShadow=false;shadows.receiveShadow=false;
      for(let index=0;index<trees.length;index++){const item=trees[index],species=Math.floor(seeded(item.seed+8)*5),size=(.65+seeded(item.seed+55)*.55)*(species===2?.76:1);setDetailedMatrix(shadows,index,item.x+.2*size,-.105,item.z+.18*size,.59*size,.59*size*.62,1,0,0,-Math.PI/2);registerVegetationInstance(item.tileX,item.tileY,shadows,index)}
      shadows.instanceMatrix.needsUpdate=true;shadows.computeBoundingSphere();vegetationRoot.add(shadows);detailedVegetationBatches.push(shadows)
    }
    const shrubColors=[[],[]],shrubTops=[];
    for(const item of bushes){
      const r=.16+seeded(item.seed+4)*.18,index=seeded(item.seed+5)>.5?1:0;
      shrubColors[index].push({x:item.x,z:item.z,r,seed:item.seed,tileX:item.tileX,tileY:item.tileY});
      if(seeded(item.seed+6)>.58)shrubTops.push({x:item.x+r*.72,z:item.z+.04,r:r*.7,seed:item.seed,tileX:item.tileX,tileY:item.tileY})
    }
    for(let color=0;color<shrubColors.length;color++){
      const shrubs=shrubColors[color];if(!shrubs.length)continue;
      const mesh=new THREE.InstancedMesh(detailedBushGeometry,detailedBushMaterials[color],shrubs.length);mesh.castShadow=false;mesh.receiveShadow=false;
      for(let index=0;index<shrubs.length;index++){const shrub=shrubs[index];setDetailedMatrix(mesh,index,shrub.x,shrub.r*.64,shrub.z,shrub.r,shrub.r*.36,shrub.r,seeded(shrub.seed+5)*Math.PI*2);registerVegetationInstance(shrub.tileX,shrub.tileY,mesh,index);instanceColor.setRGB(.92+seeded(shrub.seed+6)*.16,.92+seeded(shrub.seed+6)*.16,.92+seeded(shrub.seed+6)*.16);mesh.setColorAt(index,instanceColor)}
      mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();vegetationRoot.add(mesh);detailedVegetationBatches.push(mesh)
    }
    if(shrubTops.length){
      const mesh=new THREE.InstancedMesh(detailedBushGeometry,detailedBushTopMaterial,shrubTops.length);mesh.castShadow=false;mesh.receiveShadow=false;
      for(let index=0;index<shrubTops.length;index++){const shrub=shrubTops[index];setDetailedMatrix(mesh,index,shrub.x,shrub.r*.8,shrub.z,shrub.r,shrub.r,shrub.r,seeded(shrub.seed+5)*Math.PI*2);registerVegetationInstance(shrub.tileX,shrub.tileY,mesh,index)}
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();vegetationRoot.add(mesh);detailedVegetationBatches.push(mesh)
    }
    vegetationBatchCount=detailedVegetationBatches.length
  }

  const instanceDummy=new THREE.Object3D(),instanceColor=new THREE.Color();
  function setLODMatrix(mesh,index,x,y,z,sx,sy,sz,yaw,lean=0){
    instanceDummy.position.set(x,y,z);instanceDummy.rotation.set(0,yaw,lean);instanceDummy.scale.set(sx,sy,sz);instanceDummy.updateMatrix();mesh.setMatrixAt(index,instanceDummy.matrix)
  }
  function updateLODTreeMatrices(tree,wave){
    const {index,x,z,s,yaw,strength}=tree,lean=wave*strength;if(vegetationObstacles.has(key(tree.tileX,tree.tileY))){for(const mesh of [farTreeTrunks,farTreeCrowns,farTreeCrownsSmall])if(mesh)setLODMatrix(mesh,index,x,0,z,0,0,0,yaw,0);return}
    setLODMatrix(farTreeTrunks,index,x,.36*s,z,s,s,s,yaw,lean);
    setLODMatrix(farTreeCrowns,index,x,1.19*s,z,.39*s,.42*s,.39*s,yaw,lean*1.25);
    setLODMatrix(farTreeCrownsSmall,index,x+.22*s,1.09*s,z+.035*s,.28*s,.3*s,.28*s,yaw,lean*1.5)
  }
  function addFarVegetation(trees,bushes){
    const makeBatch=(geo,material,count,dynamic=false)=>{if(!count)return null;const mesh=new THREE.InstancedMesh(geo,material,count);mesh.castShadow=false;mesh.receiveShadow=false;mesh.instanceMatrix.setUsage(dynamic?THREE.DynamicDrawUsage:THREE.StaticDrawUsage);return mesh};
    farTreeTrunks=makeBatch(farTrunkGeometry,farTrunkMaterial,trees.length,true);
    farTreeCrowns=makeBatch(farCrownGeometry,farCrownMaterial,trees.length,true);
    farTreeCrownsSmall=makeBatch(farCrownGeometry,farCrownMaterial,trees.length,true);
    farBushes=makeBatch(farBushGeometry,farBushMaterial,bushes.length);
    for(let i=0;i<trees.length;i++){
      const item=trees[i],species=Math.floor(seeded(item.seed+8)*5),size=(.65+seeded(item.seed+55)*.55)*(species===2?.76:1),blossom=species===4&&seeded(item.seed+11)>.48,olive=species===3;
      const palette=blossom?['#d58da9','#e5a9bb','#f1c3c8']:olive?['#719466','#94a36b','#8daa77']:species===1?['#3d8060','#568f5f','#79aa68']:['#4d8957','#67a45d','#8bb664'];
      const record={...item,index:i,s:size,yaw:seeded(item.seed+92)*Math.PI*2,phase:seeded(item.seed+401)*Math.PI*2,strength:.055+seeded(item.seed+402)*.025};
      instancedWindTrees.push(record);updateLODTreeMatrices(record,0);registerVegetationBlocker(item.tileX,item.tileY,()=>updateLODTreeMatrices(record,Math.sin(windClock*1.25+record.phase)));
      farTreeTrunks.setColorAt(i,instanceColor.set(olive?'#716e52':'#775c45'));
      farTreeCrowns.setColorAt(i,instanceColor.set(palette[1]));
      farTreeCrownsSmall.setColorAt(i,instanceColor.set(palette[0]));
    }
    for(let i=0;i<bushes.length;i++){
      const item=bushes[i],r=.16+seeded(item.seed+4)*.18;setLODMatrix(farBushes,i,item.x,r*.64,item.z,r,r*.64,r,seeded(item.seed+5)*Math.PI*2);registerVegetationInstance(item.tileX,item.tileY,farBushes,i);
      farBushes.setColorAt(i,instanceColor.set(seeded(item.seed+5)>.5?'#a99a7b':'#729a65'));
    }
    const batches=[farTreeTrunks,farTreeCrowns,farTreeCrownsSmall,farBushes].filter(Boolean);
    for(const mesh of batches){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();vegetationRoot.add(mesh)}
    vegetationBatchCount=batches.length
  }
  function updateWind(delta){
    const dt=Math.min(.1,Math.max(0,delta)),rain=Number(lastSceneState?.utilities?.report?.drainage?.rainfallMm)||0;
    const month=Math.floor(((Math.max(1,Number(lastSceneState?.day)||1)-1)%360)/30),seasonWind=[5,6,7].includes(month)?.16:[2,3,4].includes(month)?.12:0;
    const wind=clamp(.78+Math.min(.52,rain*.035)+seasonWind+.12*Math.sin(windClock*.23),.62,1.48);
    windClock+=dt*(.72+wind*.34);
    for(const tree of windTrees){const wave=Math.sin(windClock*1.25+tree.phase)*wind;tree.mesh.rotation.z=wave*tree.strength;tree.mesh.rotation.x=Math.sin(windClock*.83+tree.phase)*tree.strength*.13;tree.crown.position.y=tree.baseCrownY+Math.sin(windClock*1.6+tree.phase+1)*.105*wind}
    if(!instancedWindTrees.length&&!detailedWindTrees.length)return;
    instancedWindElapsed+=Math.min(.1,Math.max(0,delta));if(instancedWindElapsed<.085)return;instancedWindElapsed=0;
    for(const tree of instancedWindTrees)updateLODTreeMatrices(tree,Math.sin(windClock*1.25+tree.phase)*wind);
    for(const tree of detailedWindTrees)updateDetailedTreeWind(tree,Math.sin(windClock*1.25+tree.phase)*wind);
    for(const mesh of [farTreeTrunks,farTreeCrowns,farTreeCrownsSmall,...detailedWindMeshes])if(mesh)mesh.instanceMatrix.needsUpdate=true
  }
  function updateVegetation(){
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
    const unit=(58/clamp(view.zoom,.43,4))/Math.max(1,h),chunkX=Math.floor((view.panX*unit/MAP_WORLD_SCALE+cameraAnchor.x*TILE)/(LAND_CHUNK_SIZE*TILE)),chunkY=Math.floor((view.panY*unit/MAP_WORLD_SCALE+cameraAnchor.y*TILE)/(LAND_CHUNK_SIZE*TILE)),signature=`${chunkX}:${chunkY}:${view.rotation}:${Math.round(view.zoom*4)}:${w}:${h}`;
    if(signature===vegetationKey)return;vegetationKey=signature;
    vegetationBlockers.clear();
    const corners=[[0,0],[w,0],[0,h],[w,h]].map(([x,y])=>screenToTile(x,y)),xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]),minX=Math.min(...xs)-3,maxX=Math.max(...xs)+3,minY=Math.min(...ys)-3,maxY=Math.max(...ys)+3,span=Math.max(maxX-minX,maxY-minY);
    clear(vegetationRoot);windTrees.length=0;instancedWindTrees.length=0;detailedWindTrees.length=0;detailedWindMeshes.length=0;detailedVegetationBatches.length=0;farTreeTrunks=farTreeCrowns=farTreeCrownsSmall=farBushes=null;vegetationInstances=vegetationTreeCount=vegetationBatchCount=0;instancedWindElapsed=0;
    const farLOD=span>62||view.zoom<.72,nearLOD=!farLOD&&view.zoom>=1.65&&span<=42;vegetationLOD=farLOD?'instanced-far':nearLOD?'detailed':'instanced-detailed';
    const density=farLOD?(smallScreen ? .38 : .42):(smallScreen ? .44 : .48),trees=[],bushes=[];
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const id=(x+50000)*7919+(y+50000)*104729;if(vegetationObstacles.has(key(x,y))||waterTile(x,y)||seeded(id)>density)continue;
      vegetationInstances++;const [cx,cz]=tilePos(x,y),dx=(seeded(id+1)-.5)*1.05,dz=(seeded(id+2)-.5)*1.05,px=cx+dx,pz=cz+dz,seed=id;
      if(seeded(id+3)<.84){vegetationTreeCount++;if(farLOD||!nearLOD)trees.push({x:px,z:pz,seed,tileX:x,tileY:y});else tree(px,pz,id,vegetationRoot,x,y)}
      else if(farLOD||!nearLOD)bushes.push({x:px,z:pz,seed,tileX:x,tileY:y});
      else{const g=new THREE.Group();g.position.set(px,0,pz);const r=.16+seeded(id+4)*.18;sphere(g,r,seeded(id+5)>.5?'#a99a7b':'#729a65',0,r*.64,0,1).scale.y=.6;if(seeded(id+6)>.58)sphere(g,r*.7,'#93ad6c',r*.72,r*.56,.04,1);vegetationRoot.add(g);registerVegetationBlocker(x,y,blocked=>{g.visible=!blocked})}
    }
    if(farLOD)addFarVegetation(trees,bushes);else if(!nearLOD)addDetailedVegetation(trees,bushes)
  }
  const spectacle=createCitySpectacle3D({THREE,scene,camera,canvas,buildingModels,box,sphere,cylinder,mat,tilePos,seeded,smallScreen,geometry});
  const living3d=createLivingCity3D({THREE,scene,camera,canvas,box,sphere,cylinder,mat,geometry,tilePos,clear,smallScreen,worldScale:MAP_WORLD_SCALE,tileSize:TILE});
  const immersive3d=createCityImmersive3D({THREE,scene,camera,canvas,box,sphere,cylinder,mat,tilePos,clear,smallScreen,worldScale:MAP_WORLD_SCALE});
  let poweredStreetlights=new Set();
  const routeActors=[],fireVisuals=[],signalBulbs=[],streetLights=[],signalTiles=new Set(),wasteContainerModels=new Map();
  // Presupuesto acotado de luces de faros: fuentes reales, sin mapas de sombra.
  const headlightCarBudget=smallScreen?5:10,headlightLightPool=Array.from({length:headlightCarBudget*2},()=>{
    const light=new THREE.PointLight('#ffe1a4',0,3.2*MAP_WORLD_SCALE,2);light.castShadow=false;light.visible=false;scene.add(light);return light;
  });
  const headlightProjection=new THREE.Vector3();let activeHeadlightActors=[],nextHeadlightRefresh=0;
  function actorInsideGatewayTunnel(actor){
    if(!gatewayTunnel.visible)return false;
    const p=actor.mesh.position,left=gatewayTunnel.position.x+tunnelStart-.12,right=gatewayTunnel.position.x+tunnelEnd+.12;
    return p.x>=left&&p.x<=right&&Math.abs(p.z-gatewayTunnel.position.z)<=1.18;
  }
  function updateTrafficHeadlights(actors,enabled,now){
    if(!enabled){for(const light of headlightLightPool){light.visible=false;light.intensity=0}return}
    if(now>=nextHeadlightRefresh){
      const candidates=[];camera.updateMatrixWorld(true);
      for(const actor of actors){const offsets=actor.mesh?.userData.headlightOffsets;if(!offsets||actor.mesh.visible===false||actor.parked||actor.parkingPhase==='parked'||actorInsideGatewayTunnel(actor))continue;
        const projected=headlightProjection.copy(actor.mesh.position).multiplyScalar(MAP_WORLD_SCALE).project(camera);
        if(projected.z< -1||projected.z>1||Math.abs(projected.x)>1.08||Math.abs(projected.y)>1.08)continue;
        candidates.push({actor,distance:projected.x*projected.x+projected.y*projected.y});
      }
      candidates.sort((a,b)=>a.distance-b.distance);
      activeHeadlightActors=candidates.slice(0,headlightCarBudget).map(item=>item.actor);
      nextHeadlightRefresh=now+220;
    }
    let index=0;
    for(const actor of activeHeadlightActors){
      if(actor.parked||actor.parkingPhase==='parked'||actorInsideGatewayTunnel(actor)||actor.mesh.visible===false)continue;
      for(const offset of actor.mesh.userData.headlightOffsets||[]){const light=headlightLightPool[index++];if(!light)break;
        light.position.set(offset[0],offset[1],offset[2]);actor.mesh.localToWorld(light.position);light.position.multiplyScalar(1/MAP_WORLD_SCALE);
        light.visible=true;light.intensity=.58;
      }
    }
    for(;index<headlightLightPool.length;index++){headlightLightPool[index].visible=false;headlightLightPool[index].intensity=0}
  }
  const walkerModelPool=new Map(),bicycleModelPool=new Map(),vehicleModelPool=new Map();
  const actorIdentity=a=>a.selection?`${a.selection.type}:${a.selection.title}:${(a.selection.people||[]).map(p=>p.id).join(',')}:${a.actorKey||''}`:null;
  const sameRoute=(a,b)=>a?.length===b?.length&&a.every((point,index)=>point[0]===b[index][0]&&point[1]===b[index][1]);
  function projectRoutePhase(route,position,direction){
    const total=Math.max(TILE,(route.length-1)*TILE);let bestDistance=Infinity,bestAlong=0;
    for(let index=1;index<route.length;index++){
      const p=route[index-1],q=route[index],dx=q[0]-p[0],dz=q[1]-p[1],lengthSquared=dx*dx+dz*dz;
      const progress=lengthSquared?clamp(((position.x-p[0])*dx+(position.z-p[1])*dz)/lengthSquared,0,1):0,px=p[0]+dx*progress,pz=p[1]+dz*progress,distance=(position.x-px)**2+(position.z-pz)**2;
      if(distance<bestDistance){bestDistance=distance;bestAlong=(index-1+progress)*TILE}
    }
    return{total,phase:direction<0?2*total-bestAlong:bestAlong}
  }
  const tripSelection=(trip,modeLabel)=>({type:modeLabel,title:modeLabel==='Ciclistas'?'Ciclistas en camino':trip.reason==='educacion'?'Estudiantes en camino':trip.reason==='ocio'?'Vecinos de paseo':modeLabel==='Peatones'?'Personas caminando':'Vehículo particular',description:`Viaje de ${trip.reason==='trabajo'?'trabajo':trip.reason==='compras'?'compras':trip.reason==='educacion'?'estudio':trip.reason==='ocio'?'ocio':'servicios'} en la simulación actual.`,metrics:[[trip.mode==='bicycle'?'Ciclistas':trip.reason==='educacion'?'Estudiantes':'Pasajeros',Math.max(0,(trip.workers||0)-(trip.busRiders||0)-(trip.metroRiders||0)-(trip.taxiRiders||0))],...((trip.busRiders||trip.metroRiders||trip.intermodalRiders||trip.taxiRiders)?[['En transporte p\u00fablico',(trip.busRiders||0)+(trip.metroRiders||0)+(trip.intermodalRiders||0)+(trip.taxiRiders||0)]]:[]),[trip.mode==='bicycle'?'Bicicletas':'Veh\u00edculos',trip.mode==='bicycle'?(trip.workers||0):(trip.vehicles||0)],['Origen',trip.from?`${trip.from[0]+1}, ${trip.from[1]+1}`:'—'],['Destino',trip.destinationName|| (trip.to?`${trip.to[0]+1}, ${trip.to[1]+1}`:'—')],['Distancia',`${trip.distance||0} tramos`],['Tiempo estimado',`${trip.estimatedMinutes||0} min`]],people:trip.people||[]});
  function tripActorKey(trip,scope){return `${scope}:${trip.reason||'viaje'}:${trip.mode||'auto'}:${trip.from?.join(',')||'sin-origen'}>${trip.to?.join(',')||'sin-destino'}`}
  let parkingRoadOrientation=new Map();
  function parkingSlotPose(slot){if(!slot)return null;const gx=Number(slot.road?.[0]??slot.x),gy=Number(slot.road?.[1]??slot.y),[x,z]=tilePos(gx,gy),horizontal=parkingRoadOrientation.get(key(gx,gy))??false,side=Number(slot.index)%2===0?1:-1,offset=STREET_SECTION.parkingCenter*side;return{x:x+(horizontal?0:offset),z:z+(horizontal?offset:0),yaw:horizontal?Math.PI/2:0}}
  function parkingDrivingRoute(roadPath,origin,destination){const points=(roadPath||[]).map(([x,y],index,path)=>{const before=path[Math.max(0,index-1)],after=path[Math.min(path.length-1,index+1)],dx=(after[0]-before[0]),dz=(after[1]-before[1]),length=Math.hypot(dx,dz)||1,[xw,zw]=tilePos(x,y);return[xw-dz/length*.29,zw+dx/length*.29]});const first=parkingSlotPose(origin),last=parkingSlotPose(destination);if(first)points.unshift([first.x,first.z]);if(last)points.push([last.x,last.z]);return points.filter((p,i)=>i===0||Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1])>.025)}
  function streetUserPath(tileRoute,roads,mode='walk'){
    if(!Array.isArray(tileRoute)||tileRoute.length<2)return[];const points=tileRoute.map(([x,y])=>tilePos(Number(x),Number(y)));
    if(mode==='walk'||mode==='bicycle')for(const end of [0,points.length-1]){const tile=tileRoute[end],adjacent=tileRoute[end===0?1:end-1];if(roads.has(key(tile[0],tile[1])))continue;const center=points[end],next=tilePos(adjacent[0],adjacent[1]),dx=next[0]-center[0],dz=next[1]-center[1],length=Math.hypot(dx,dz)||1;points[end]=[center[0]+dx/length*.98,center[1]+dz/length*.98]}
    return points;
  }
  function addParkingPedestrian(trip,back,index,tag='work',spot=trip.parkingSlots?.[index]||trip.parkingSlot,roadPath=trip.parkingWalkRoutes?.[index]){
    if(!spot||!Array.isArray(trip.to)||!Array.isArray(roadPath)||!roadPath.length)return;
    const destination=trip.to.map(Number),door=tilePos(destination[0],destination[1]),firstRoad=tilePos(roadPath[0][0],roadPath[0][1]),dx=firstRoad[0]-door[0],dz=firstRoad[1]-door[1],length=Math.hypot(dx,dz)||1,doorPoint=[door[0]+dx/length*.98,door[1]+dz/length*.98],roadPoints=roadPath.map(([x,y])=>tilePos(x,y)),road=(spot.road||[spot.x,spot.y]).map(Number),center=tilePos(road[0],road[1]),pose=parkingSlotPose(spot),sideLength=Math.hypot(pose.x-center[0],pose.z-center[1])||1,curbPoint=[center[0]+(pose.x-center[0])/sideLength*1.04,center[1]+(pose.z-center[1])/sideLength*1.04],walkRoute=[doorPoint,...roadPoints,curbPoint].filter((point,i,all)=>i===0||Math.hypot(point[0]-all[i-1][0],point[1]-all[i-1][1])>.025);
    if(walkRoute.length<2)return;const outbound=trip.departureWindowKey||'morningPeak',returnWindow=back?.departureWindowKey||trip.returnWindowKey||'eveningPeak',walk=makeWalker(['#688b83','#b68162','#718aa2'][index%3]);routeActors.push({mesh:walk,route:walkRoute,dailyRoutine:[{window:outbound,reverse:true,fromEnd:true},{window:returnWindow,reverse:false}],routineSpanMinutes:Math.min(12,Math.max(5,Number(trip.parkingWalkDistance||1)*2)),offset:index*1.3,speed:.42,side:0,actorKey:`parking-walk:${tag}:${trip.reason}:${trip.from?.join(',')}:${trip.to?.join(',')}:${index}`,selection:{type:'Peatones',title:`Caminata desde estacionamiento · ${trip.destinationName||'destino'}`,description:'La persona deja el auto en una plaza reservada y camina por la vereda hasta el destino; al regreso vuelve a pie hasta el mismo vehículo.',metrics:[['Caminata',`${trip.parkingWalkDistance||0} cuadras`],['Estacionamiento',`${spot.x+1}, ${spot.y+1}`],['Destino',`${destination[0]+1}, ${destination[1]+1}`]]}});
  }
  function addRepresentativeTravelers(trip,base,scope,routine,back,roads){
    if(trip.mode==='auto'){
      const people=Math.max(Number(trip.vehicles)||0,Math.ceil(Math.max(0,Number(trip.workers)||0)*.22)),current=routeActors.filter(actor=>actor.selection?.type==='Vehículo particular').length,count=Math.min(4,Math.max(1,Math.ceil(people/3)),1+Math.max(0,65-current)),colors=['#d89368','#f1d493','#75ada8','#c66d63'];
      for(let index=1;index<count;index++){
        const spot=trip.parkingSlots?.[index]||null,origin=trip.parkingOriginSlots?.[index]||null,roadPath=spot?trip.parkingRoutes?.[index]:trip.parkingSearchRoute||trip.parkingRoute;if(!Array.isArray(roadPath)||!roadPath.length)continue;
        const path=parkingDrivingRoute(roadPath,origin,spot);if(path.length<2)continue;const mesh=makeVehicle(colors[index%colors.length],true),actor={...base,mesh,route:path,offset:(base.offset||0)+index*3.7,actorKey:`${base.actorKey}:car-${index}`,selection:{...base.selection,title:`${base.selection?.title||'Vehículo particular'} · ${index+1}`}};
        if(spot){actor.parkingSearching=false;actor.parkingVehicle={origin,destination:spot,outboundWindow:trip.departureWindowKey||'morningPeak',returnWindow:back?.departureWindowKey||trip.returnWindowKey||'eveningPeak'};addParkingPedestrian(trip,back,index,scope,spot,trip.parkingWalkRoutes?.[index])}
        else{delete actor.parkingVehicle;actor.parkingSearching=Boolean(trip.parkingSearching);if(actor.parkingSearching){const badge=makeParkingSearchBadge();badge.position.set(0,1.15,0);mesh.add(badge);mesh.userData.parkingSearchBadge=badge}}
        routeActors.push(actor);
      }
      return;
    }
    const roadUsers=Math.max(0,(trip.workers||0)-(trip.busRiders||0)-(trip.metroRiders||0)-(trip.taxiRiders||0)),current=routeActors.filter(actor=>actor.selection?.type==='Peatones'||actor.selection?.type==='Ciclistas').length,count=Math.min(4,Math.max(1,Math.ceil(roadUsers/12)),1+Math.max(0,110-current));
    for(let index=1;index<count;index++){
      const shopping=Boolean(base.shoppingBags),mesh=trip.mode==='bicycle'?makeBicycle(['#438a67','#3288aa','#d39b39'][index%3]):makeWalker(['#688b83','#b68162','#718aa2','#a46e79'][index%4],shopping),actor={...base,mesh,route:base.route.map(point=>point.slice()),offset:(base.offset||0)+index*2.8,actorKey:`${base.actorKey}:traveler-${index}`,selection:{...base.selection,title:`${base.selection?.title||'Vecino en camino'} · ${index+1}`}};
      if(shopping&&mesh.userData.shoppingBags?.length){actor.shoppingBags=mesh.userData.shoppingBags;actor.shoppingReturnAt=base.shoppingReturnAt}
      routeActors.push(actor);
    }
  }
  const raycaster=new THREE.Raycaster(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
  let view={zoom:1,panX:0,panY:0,rotation:0},cameraAnchor={x:14,y:10},lastFrame=0,simulationClock=0,simulationSpeed=1,simulationPaused=false,visualTimeOfDayMinutes=360,visualGameDay=1,visualSignature='',lastProjection='',fpsWindowStart=performance.now(),fpsWindowFrames=0,renderFps=0,lastSceneSyncMs=0,sceneSyncRebuilds=0,sceneSyncFastPaths=0;
  const fpsCounter=document.getElementById('fpsCounter');
  function adaptRenderResolution(now){fpsWindowFrames++;const elapsed=now-fpsWindowStart;if(elapsed<1800)return;renderFps=fpsWindowFrames*1000/elapsed;fpsCounter.textContent=`FPS ${Math.round(renderFps)}`;fpsCounter.setAttribute('aria-label',`${Math.round(renderFps)} fotogramas por segundo`);fpsWindowFrames=0;fpsWindowStart=now;let next=renderPixelRatio;if(renderFps<38)next=Math.max(minPixelRatio,renderPixelRatio*.88);else if(renderFps>56)next=Math.min(maxPixelRatio,renderPixelRatio+.05);if(Math.abs(next-renderPixelRatio)>.025){renderPixelRatio=Number(next.toFixed(2));renderer.setPixelRatio(renderPixelRatio);lastProjection=''}}
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const dpr=renderer.getPixelRatio();if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr))renderer.setSize(w,h,false);const projection=`${w}:${h}:${view.zoom}`;if(projection===lastProjection)return;lastProjection=projection;const span=58/clamp(view.zoom,.43,4),aspect=w/h;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix()}
  function updateCamera(){resize();const yaw=Math.PI/4+view.rotation*Math.PI/2,span=58/clamp(view.zoom,.43,4),units=span/Math.max(1,canvas.clientHeight);const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),upGround=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const target=new THREE.Vector3(cameraAnchor.x*TILE*MAP_WORLD_SCALE,0,cameraAnchor.y*TILE*MAP_WORLD_SCALE).addScaledVector(right,-view.panX*units).addScaledVector(upGround,-view.panY*units),targetLocalX=target.x/MAP_WORLD_SCALE,targetLocalZ=target.z/MAP_WORLD_SCALE,recycle=20000;for(const [axis,localTarget] of [['x',targetLocalX],['z',targetLocalZ]]){const delta=localTarget-infiniteGroundOffset[axis];if(Math.abs(delta)>10000)infiniteGroundOffset[axis]+=Math.trunc(delta/recycle)*recycle;for(const ground of infiniteGround)ground.position[axis]=infiniteGroundOffset[axis]}sun.target.position.set(targetLocalX,0,targetLocalZ);sun.position.set(targetLocalX+3,31,targetLocalZ+28);camera.position.copy(target).add(new THREE.Vector3(Math.sin(yaw)*60*MAP_WORLD_SCALE,65*MAP_WORLD_SCALE,Math.cos(yaw)*60*MAP_WORLD_SCALE));camera.lookAt(target);camera.updateMatrixWorld()}
  const daySky=new THREE.Color('#bcd9df'),nightSky=new THREE.Color('#172633'),twilightSky=new THREE.Color('#cb9b79'),dayGround=new THREE.Color('#597d6e'),nightGround=new THREE.Color('#253b4c'),sunDay=new THREE.Color('#ffe4bb'),sunNight=new THREE.Color('#8096c4'),hemiNight=new THREE.Color('#9fbad0'),hemiDay=new THREE.Color('#fff5e5'),tempSky=new THREE.Color(),tempHemi=new THREE.Color(),tempGround=new THREE.Color();
  function updateLighting(minutes){const daylight=daylightIntensity(minutes),horizon=clamp(1-Math.abs(((minutes%1440)+1440)%1440-720)/180,0,1);tempSky.copy(nightSky).lerp(daySky,daylight).lerp(twilightSky,horizon*(1-daylight)*.72);scene.background.copy(tempSky);scene.fog.color.copy(tempSky);tempHemi.copy(hemiNight).lerp(hemiDay,daylight);hemi.color.copy(tempHemi);tempGround.copy(nightGround).lerp(dayGround,daylight);hemi.groundColor.copy(tempGround);hemi.intensity=.38+daylight*.64;sun.color.copy(sunNight).lerp(sunDay,daylight);sun.intensity=.24+daylight*2.35;renderer.toneMappingExposure=.84+daylight*.18;const glow=1-daylight;for(const lamp of streetLights){const powered=poweredStreetlights.has(key(lamp.x,lamp.y));lamp.light.intensity=powered?glow*3.2:0;lamp.bulb.material.emissiveIntensity=powered?glow*3.2:0;lamp.pool.material.opacity=powered?glow*.4:0}}
  function environmentalRoadColor(score){if(!view.environmentOverlay)return null;if(view.environmentOverlay==='flood')return score>=65?'#3694aa':score>=1?'#8cbecc':'#aaa997';if(score<20)return'#58a47a';if(score<40)return'#d2bd65';if(score<65)return'#e28b58';return'#c95850'}
  function addRoad(root,x,y,roads,stress=0,signals=false,environmentIndex=0,asset=null){
    const roadType=asset?.roadType||'local',spec=ROAD_TYPES_RENDER[roadType]||ROAD_TYPES_RENDER.local,[cx,cz]=tilePos(x,y),n=roads.has(key(x,y-1)),s=roads.has(key(x,y+1)),e=roads.has(key(x+1,y)),w=roads.has(key(x-1,y)),degree=Number(n)+Number(s)+Number(e)+Number(w);
    const asphalt=environmentalRoadColor(environmentIndex)||(view.trafficOverlay?(stress>.8?'#c64e48':stress>.45?'#e88b48':stress>.2?'#e7be58':'#55af82'):COLORS.road);
    const roadDegreeAt=(tx,ty)=>[[0,-1],[0,1],[-1,0],[1,0]].reduce((sum,[dx,dy])=>sum+Number(roads.has(key(tx+dx,ty+dy))),0);
    box(root,STREET_SECTION.walk,.055,STREET_SECTION.walk,COLORS.walk,cx,.006,cz,{cast:false});
    // El centro del cruce se pavimenta de lado a lado para que las esquinas de
    // las aceras no queden dibujadas encima de la calzada al conectar ramales.
    const centerRoadWidth=degree>=3?STREET_SECTION.walk:STREET_SECTION.asphalt;
    box(root,centerRoadWidth,.052,centerRoadWidth,asphalt,cx,.052,cz,{cast:false});
    const paintLanes=(mx,mz,horizontal,length,parkingBays)=>{
      const mark=(side,width,color,yLevel=.083)=>addRoadMark(root,horizontal?length:width,.008,horizontal?width:length,color,mx+(horizontal?0:side),yLevel,mz+(horizontal?side:0));
      // Las avenidas y autopistas incorporan dos carriles por sentido en la sección ampliada.
      for(const side of [-.018,.018])mark(side,.018,'#e7c86d');
      if(spec.lanes===2)for(const side of [-.43,.43])mark(side,.014,'#f1ebd9');
      // Las calles locales conservan las franjas de estacionamiento y las veredas.
      if(spec.parking)for(const side of [-STREET_SECTION.parkingDivider,STREET_SECTION.parkingDivider])mark(side,.018,'#f1ebd9');
      // Bordillo claro: delimita la vereda y deja la franja de estacionamiento a su lado.
      for(const side of [-STREET_SECTION.curb,STREET_SECTION.curb])mark(side,.035,'#b8b2a4',.079);
      if(parkingBays&&spec.parking){
        for(const offset of [-TILE/3,TILE/3])for(const side of [-1,1]){
          const xPos=mx+(horizontal?offset:side*STREET_SECTION.parkingCenter),zPos=mz+(horizontal?side*STREET_SECTION.parkingCenter:offset);
          addRoadMark(root,horizontal?.024:.31,.009,horizontal?.31:.024,'#e1dfd2',xPos,.083,zPos);
        }
      }
    };
    for(const [dx,dy] of [[1,0],[0,1]]){
      if(!roads.has(key(x+dx,y+dy)))continue;
      const horizontal=dx===1,sx=cx+dx*TILE,zs=cz+dy*TILE,neighborDegree=roadDegreeAt(x+dx,y+dy),neighborIsIntersection=neighborDegree>=3,length=TILE+.08;
      box(root,horizontal?length:STREET_SECTION.walk,.055,horizontal?STREET_SECTION.walk:length,COLORS.walk,sx,.006,zs,{cast:false});
      box(root,horizontal?length:STREET_SECTION.asphalt,.052,horizontal?STREET_SECTION.asphalt:length,asphalt,sx,.052,zs,{cast:false});
      const straightCurrent=horizontal?w&&!n&&!s:n&&!e&&!w,straightNeighbor=horizontal?roads.has(key(x+2,y))&&!roads.has(key(x+1,y-1))&&!roads.has(key(x+1,y+1)):roads.has(key(x,y+2))&&!roads.has(key(x-1,y+1))&&!roads.has(key(x+1,y+1));
      // Las marcas de estacionamiento solo se dibujan en tramos realmente rectos.
      // Así no forman una cuadrícula en las esquinas ni invaden cruces.
      paintLanes(sx,zs,horizontal,length,degree===2&&neighborDegree===2&&straightCurrent&&straightNeighbor);
      if(asset?.busLane){const bx=sx+(horizontal?0:-.57),bz=zs+(horizontal?-.57:0);addRoadMark(root,horizontal?length:.055,.018,horizontal?.055:length,'#58b99a',bx,.087,bz)}
    }
    if(asset?.busLane)addRoadMark(root,.78,.025,.055,'#58b99a',cx,.087,cz);
    if(asset?.oneWay){const vectors={east:[1,0,0],west:[-1,0,Math.PI],north:[0,-1,Math.PI/2],south:[0,1,-Math.PI/2]},[dx,dz,rotation]=vectors[asset.oneWay]||vectors.east;for(let j=-1;j<=1;j++){const ax=cx+j*.38*dx,az=cz+j*.38*dz;addRoadMark(root,.24,.014,.045,'#f2d279',ax,.091,az,rotation);addRoadMark(root,.11,.014,.04,'#f2d279',ax+Math.cos(rotation)*.065,.091,az-Math.sin(rotation)*.065,rotation+Math.PI/4);addRoadMark(root,.11,.014,.04,'#f2d279',ax+Math.cos(rotation)*.065,.091,az-Math.sin(rotation)*.065,rotation-Math.PI/4)}}
    if(degree>=3){
      for(const [dx,dy,on] of [[0,-1,n],[0,1,s],[-1,0,w],[1,0,e]]){
        if(!on)continue;
        for(let j=-5;j<=5;j++){
          const shift=j*.16;
          addRoadMark(root,dx?.15:.1,.012,dy?.15:.1,'#f6f1de',cx+(dx?dx*.72:shift),.091,cz+(dy?dy*.72:shift));
        }
      }
    }
    if(signals){
      const approaches=[];
      if(n||s)approaches.push({axis:1,ox:n?.92:-.92,oz:n?-.62:.62,yaw:n?Math.PI:0});
      if(e||w)approaches.push({axis:0,ox:e?.62:-.62,oz:e?.92:-.92,yaw:e?Math.PI/2:-Math.PI/2});
      for(const a of approaches){
        const g=new THREE.Group();g.position.set(cx+a.ox,0,cz+a.oz);g.rotation.y=a.yaw;root.add(g);
        cylinder(g,.025,.035,.8,'#42515a',0,.42,0,12);box(g,.13,.43,.13,'#263944',0,.88,0);
        const red=[],amber=[],green=[];
        for(const faceZ of [.085,-.085]){
          const r=sphere(g,.038,'#f04f45',0,.99,faceZ,2),y=sphere(g,.034,'#806b3c',0,.88,faceZ,2),gr=sphere(g,.038,'#397352',0,.77,faceZ,2);
          r.material=mat('#813d3a',{emissive:'#ee453d',emissiveIntensity:.08});y.material=mat('#806b3c',{emissive:'#ffd15d',emissiveIntensity:.06});gr.material=mat('#397352',{emissive:'#68ec8e',emissiveIntensity:.08});
          red.push(r);amber.push(y);green.push(gr);
          roundedBox(g,.17,.075,.06,'#53676b',0,1.13,faceZ*1.45,.035);
          for(const yy of [.99,.88,.77])roundedBox(g,.075,.075,.035,yy>.9?'#d86b5d':yy>.8?'#d4aa52':'#63ad79',0,yy,faceZ*1.55,.025);
        }
        roundedBox(g,.17,.075,.15,'#53676b',0,.18,0,.035);
        signalBulbs.push({red,amber,green,axis:a.axis});
      }
    }
    // Las farolas solo van en tramos rectos, separadas de cruces y esquinas.
    // El poste queda en el centro de la vereda, fuera del estacionamiento y la calzada.
    const hasHorizontal=e||w,hasVertical=n||s,straightHorizontal=hasHorizontal&&!hasVertical,straightVertical=hasVertical&&!hasHorizontal;
    const nearIntersection=[[0,-1,n],[0,1,s],[-1,0,w],[1,0,e]].some(([dx,dy,on])=>on&&roadDegreeAt(x+dx,y+dy)>=3);
    const endpoint=degree===1,lightCandidate=(straightHorizontal||straightVertical)&&(endpoint||nearIntersection||(degree===2&&((x*7+y*11)%2===0)));
    if(lightCandidate){const horizontal=straightHorizontal,side=((x*31+y*17)&1)?1:-1,offset=STREET_SECTION.asphalt/2+.10,px=horizontal?cx:cx+side*offset,pz=horizontal?cz+side*offset:cz,headX=horizontal?cx:px-side*.27,headZ=horizontal?pz-side*.27:cz;box(root,.065,1.34,.065,'#4b5755',px,.69,pz);const arm=box(root,.06,.045,.48,'#4b5755',(px+headX)/2,1.34,(pz+headZ)/2);if(!horizontal)arm.rotation.y=Math.PI/2;const bulb=sphere(root,.115,'#ffe4a6',headX,1.3,headZ,2);bulb.material=mat('#ffe4a6',{emissive:'#ffc76b',emissiveIntensity:0});const light=new THREE.PointLight('#ffca70',0,8*MAP_WORLD_SCALE,2);light.position.set(headX,1.2,headZ);root.add(light);const pool=new THREE.Mesh(new THREE.CircleGeometry(1.45,20),new THREE.MeshBasicMaterial({color:'#ffd17a',transparent:true,opacity:0,depthWrite:false,toneMapped:false}));pool.rotation.x=-Math.PI/2;pool.position.set(headX,.072,headZ);root.add(pool);streetLights.push({light,bulb,pool,x,y})
      roundedBox(root,.18,.13,.18,'#66766c',px,.085,pz,.035);
      rodBetween(root,[px,.99,pz],[headX,1.31,headZ],.018,'#64746b',6);
      roundedBox(root,.22,.085,.19,'#f2daa0',headX,1.2,headZ,.04);
      ring(root,.092,.014,'#f8dfa1',headX,1.15,headZ);
      if((((x*7+y*11)%4)+4)%4===0){
        const mx=cx+(e?-.22:0),mz=cz+(s?-.22:0);
        cylinder(root,.16,.16,.025,'#59635f',mx,.082,mz,18);
        ring(root,.135,.012,'#a7ada1',mx,.1,mz);
        for(let k=-2;k<=2;k++)roundedBox(root,.016,.028,.16,'#838c84',mx+k*.045,.1,mz,.004);
      }
      if(degree>=3)for(const [dx,dy,on] of [[0,-1,n],[0,1,s],[-1,0,w],[1,0,e]])if(on){
        const rx=cx+dx*.92,rz=cz+dy*.92;
        roundedBox(root,.24,.025,.25,'#b9b5a2',rx,.088,rz,.025);
        for(let j=-1;j<=1;j++)roundedBox(root,dx?.03:.13,.012,dy?.03:.13,'#eee5cd',rx+(dx?j*.055:0),.106,rz+(dy?j*.055:0),.006);
      }
      if((((x*5+y*3)%5)+5)%5===0){
        const horizontal=e||w,sx=horizontal?cx+(e?-.55:.55):cx+.94,sz=horizontal?cz+.94:cz+(s?-.55:.55);
        roundedBox(root,.22,.022,.12,'#596a66',sx,.085,sz,.018);
        for(let j=-2;j<=2;j++)roundedBox(root,.018,.025,.11,'#b8bbb0',sx+j*.035,.1,sz,.005);
      }
}
  }
  function addZone(root,z){const [x,y]=tilePos(z.x,z.y),color=z.kind==='home'?'#65bb80':z.kind==='factory'?'#e1bd48':z.kind==='office'?'#8e83c4':'#5eb1bf',score=Math.max(0,Math.min(100,Number(z.suitability)||0)),fillColor=view.zoneSuitability?(score>=70?'#4da879':score>=40?'#e1b64f':'#d66d61'):color,fillOpacity=view.zoneSuitability ? .52 : .29,density=z.density==='high'?3:z.density==='medium'?2:1;plane(root,1.62,1.62,mat(fillColor,{transparent:true,opacity:fillOpacity,depthWrite:false}),x,.08,y);const p=[[-.84,-.84],[.84,-.84],[.84,.84],[-.84,.84],[-.84,-.84]].map(([a,b])=>[x+a,.09,y+b]);line(root,p,color,.95);for(const a of [-.7,.7])for(const b of [-.7,.7]){roundedBox(root,.14,.22,.14,color,x+a,.14,y+b,.035);sphere(root,.065,'#f1dfaa',x+a,.27,y+b,2);rodBetween(root,[x+a,.08,y+b],[x+a*1.13,.12,y+b*1.13],.012,color,6)}for(let i=0;i<density;i++)roundedBox(root,.09,.07,.06,'#f1dfaa',x+(i-(density-1)/2)*.13,.13,y,.025)}
  let lockSpriteMap,landShadeSignature='',landShadeState=null;
  function addLandShade(root,chunkX,chunkY,size=LAND_CHUNK_SIZE){const [x,z]=tilePos(chunkX*size+(size-1)/2,chunkY*size+(size-1)/2);plane(root,size*TILE,size*TILE,mat('#15282d',{transparent:true,opacity:.54,depthWrite:false}),x,.11,z)}
  function updateLandShading(state){if(!state||!canvas.clientWidth||!canvas.clientHeight)return;const w=canvas.clientWidth,h=canvas.clientHeight,corners=[[0,0],[w,0],[0,h],[w,h]].map(([x,y])=>screenToTile(x,y)),xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]),minChunkX=Math.floor((Math.min(...xs)-2)/LAND_CHUNK_SIZE),maxChunkX=Math.floor((Math.max(...xs)+2)/LAND_CHUNK_SIZE),minChunkY=Math.floor((Math.min(...ys)-2)/LAND_CHUNK_SIZE),maxChunkY=Math.floor((Math.max(...ys)+2)/LAND_CHUNK_SIZE),unlocked=new Set(state.landClaims?.unlockedChunks||[]),signature=`${minChunkX}:${maxChunkX}:${minChunkY}:${maxChunkY}|${[...unlocked].sort().join(';')}`;if(signature===landShadeSignature)return;landShadeSignature=signature;clear(landShadeRoot);for(let cy=minChunkY;cy<=maxChunkY;cy++)for(let cx=minChunkX;cx<=maxChunkX;cx++)if(!unlocked.has(`${cx},${cy}`))addLandShade(landShadeRoot,cx,cy)}
  function addLandLock(root,chunk){const size=chunk.chunkSize||LAND_CHUNK_SIZE,[x,z]=tilePos(chunk.chunkX*size+(size-1)/2,chunk.chunkY*size+(size-1)/2);if(!lockSpriteMap){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;const ctx=canvas.getContext('2d');ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowColor='#243c3a88';ctx.shadowBlur=12;ctx.shadowOffsetY=5;ctx.fillStyle='#fff5d7';ctx.beginPath();ctx.roundRect(12,17,104,126,24);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#344e4b';ctx.lineWidth=8;ctx.beginPath();ctx.arc(64,65,25,Math.PI,0);ctx.lineTo(89,97);ctx.moveTo(39,65);ctx.lineTo(39,97);ctx.stroke();ctx.fillStyle='#e5ac51';ctx.beginPath();ctx.roundRect(25,85,78,48,11);ctx.fill();ctx.strokeStyle='#344e4b';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#344e4b';ctx.beginPath();ctx.arc(64,102,6,0,Math.PI*2);ctx.fill();ctx.fillRect(61,103,6,12);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;lockSpriteMap=texture;}const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:lockSpriteMap,transparent:true,depthWrite:false,depthTest:false}));sprite.position.set(x,1.55,z);sprite.scale.set(1.6,2,1);sprite.renderOrder=30;sprite.userData.landLocked=true;
    roundedBox(root,.4,.12,.34,'#b88743',x,.08,z,.035);
    cylinder(root,.045,.045,.48,'#64736a',x,.36,z,10);
    ring(root,.12,.018,'#e7c36f',x,.63,z);
    sphere(root,.055,'#fff0bd',x,.68,z,2);
    root.add(sprite)}
  function sideWindow(g,x,y,z,wide=.19){box(g,wide,.31,.045,'#f7f2d6',x,y,z);box(g,wide*.75,.24,.05,'#5b9eae',x,y,z+.035);box(g,.025,.29,.065,'#ede6cb',x,y,z+.05)}
  function flankWindows(g,w,floors){for(let floor=0;floor<floors;floor++)for(const z of [-.37,.37]){const y=.67+floor*.76;for(const side of [-1,1]){box(g,.047,.32,.21,'#eee4d1',side*(w/2+.024),y,z);box(g,.055,.23,.14,'#78a9af',side*(w/2+.054),y,z);box(g,.07,.05,.22,'#e8dbbd',side*(w/2+.06),y-.17,z)}}}
  function detailedHomeShell(g,w,wallHeight,gableHeight,d,baseY,color,flat){
    const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w/2,wallHeight);
    if(!flat){shape.lineTo(0,wallHeight+gableHeight);shape.lineTo(-w/2,wallHeight)}
    else shape.lineTo(-w/2,wallHeight);
    shape.closePath();
    const id='home-shell:'+w+':'+wallHeight+':'+gableHeight+':'+d+':'+flat;
    const shellGeo=geometry(id,()=>{const geo=new THREE.ExtrudeGeometry(shape,{depth:d,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:.024,bevelThickness:.028,curveSegments:8});geo.translate(0,0,-d/2);return geo});
    const shell=new THREE.Mesh(shellGeo,mat(color,{roughness:.9}));shell.position.y=baseY;shell.castShadow=true;shell.receiveShadow=true;g.add(shell);return shell;
  }
  function detailedHomeWindow(g,x,y,z,scale=1,rotation=0,style='classic',flowers=false){
    const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=rotation;g.add(group);
    const width=.36*scale,height=.48*scale,trim=style==='modern'?'#dce7dc':'#f4e8d3',glass=mat('#75aeb9',{roughness:.24,metalness:.06});
    box(group,width+.11,height+.1,.075,trim,0,0,.014,{cast:true});
    box(group,width-.07,height-.08,.025,glass,0,0,.057);
    for(const side of [-1,1])box(group,.035,height+.04,.075,trim,side*(width/2+.02),0,.03,{cast:true});
    box(group,width+.075,.045,.075,trim,0,height/2+.035,.03,{cast:true});
    box(group,width+.13,.075,.13,style==='modern'?'#d5dfd5':'#dfc9a9',0,-height/2-.035,.055,{cast:true});
    box(group,.026,height-.08,.045,trim,0,0,.083);
    box(group,width-.08,.025,.045,trim,0,0,.083);
    box(group,.035,height*.72,.012,'#d4e7df',-width*.23,.02,.09);
    if(style!=='modern'){
      const shutter=style==='heritage'?'#657866':'#647b69';
      for(const side of [-1,1]){
        box(group,.075,height+.015,.07,shutter,side*(width/2+.085),0,.025,{cast:true});
        for(const row of [-.12,0,.12])box(group,.08,.022,.08,style==='heritage'?'#a8b091':'#a9b79a',side*(width/2+.085),row,.07);
      }
    }
    if(flowers){
      box(group,width+.04,.09,.15,'#9a684b',0,-height/2-.13,.13,{cast:true});
      for(let i=-1;i<=1;i++){sphere(group,.075,['#d18c8f','#e4ba72','#9dbb7c'][(i+1)%3],i*.12,-height/2-.075,.17,2);sphere(group,.05,'#668e5d',i*.12-.03,-height/2-.025,.16,2)}
    }
    return group;
  }
  function detailedHomeDoor(g,baseY,frontZ,modern){
    const wood=modern?'#685f4e':'#735344',trim=modern?'#dce6d9':'#f0dfc5';
    box(g,.55,.92,.09,trim,0,baseY+.42,frontZ+.025,{cast:true});
    box(g,.39,.76,.075,wood,0,baseY+.4,frontZ+.078,{cast:true});
    for(const x of [-.115,0,.115])box(g,.018,.63,.018,'#b18b66',x,baseY+.39,frontZ+.12);
    box(g,.29,.12,.025,'#82b6bd',0,baseY+.79,frontZ+.124);
    box(g,.32,.025,.03,'#e7d9c2',0,baseY+.71,frontZ+.14);
    sphere(g,.035,'#d8ad62',.13,baseY+.38,frontZ+.13,3);
    box(g,.64,.08,.34,modern?'#536b63':'#8b6752',0,baseY+1.02,frontZ+.16,{cast:true});
    for(const x of [-.27,.27])box(g,.045,.36,.05,trim,x,baseY+.84,frontZ+.22,{cast:true});
    box(g,.62,.08,.43,'#d2c1a6',0,baseY+.1,frontZ+.19);
    box(g,.78,.07,.55,'#bba98d',0,baseY+.035,frontZ+.23);
    const points=[];for(let i=0;i<=18;i++){const a=Math.PI*i/18;points.push(new THREE.Vector3(Math.cos(a)*.23,baseY+.82+Math.sin(a)*.1,frontZ+.13))}
    const arch=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),36,.018,8,false),mat(trim));arch.castShadow=true;g.add(arch);
  }
  function detailedHomeRoofPanel(half,eaveY,ridgeY,depth,side){
    const id='home-roof-plane:'+half+':'+eaveY+':'+ridgeY+':'+depth+':'+side;
    return geometry(id,()=>{const geo=new THREE.BufferGeometry(),x=side*half;geo.setAttribute('position',new THREE.Float32BufferAttribute([x,eaveY,-depth/2,0,ridgeY,-depth/2,0,ridgeY,depth/2,x,eaveY,depth/2],3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();return geo});
  }
  function detailedHomeRoof(g,w,d,eaveY,ridgeY,variant,roofColor,modern){
    if(modern){
      const top=eaveY;box(g,w+.18,.13,d+.18,'#526d68',0,top+.055,0,{cast:true});
      box(g,w+.2,.045,d+.2,'#d1d9c8',0,top+.145,0,{cast:true});
      for(const side of [-1,1])box(g,.07,.23,d+.16,'#c9d5c7',side*(w/2+.035),top+.27,0,{cast:true});
      for(const z of [-1,1])box(g,w+.12,.23,.07,'#c9d5c7',0,top+.27,z*(d/2+.035),{cast:true});
      for(const x of [-.39,.27]){
        const panel=box(g,.4,.028,.32,'#31535b',x,top+.19,-.16,{cast:true});panel.rotation.z=.08;
        for(let line=-1;line<=1;line++)box(g,.012,.014,.28,'#98b6b3',x+line*.105,top+.212,-.16);
        box(g,.42,.025,.025,'#c8b48b',x,top+.21,-.32);
      }
      for(const x of [-.6,.58])for(const z of [-.46,.38])cylinder(g,.045,.045,.34,'#d9ded0',x,top+.28,z,12);
      box(g,1.25,.045,.045,'#d9ded0',0,top+.47,.38);
      return;
    }
    const overhang=.13,half=w/2+overhang,depth=d+.25,rise=ridgeY-eaveY,angle=Math.atan2(rise,half),slopeLength=Math.hypot(half,rise);
    for(const side of [-1,1]){
      const panel=new THREE.Mesh(detailedHomeRoofPanel(half,eaveY,ridgeY,depth,side),mat('#704d45',{side:THREE.DoubleSide,roughness:.95}));panel.castShadow=true;panel.receiveShadow=true;g.add(panel);
    }
    const tilePalette=[
      ['#91453e','#a64e42','#b65849','#873e39','#c0604d'],
      ['#87503b','#a45b40','#b66a49','#92503d','#c07a52'],
      ['#555f60','#6a7070','#777a73','#596565','#858177'],
      ['#75483f','#955344','#a75e4d','#81493f','#b36b53'],
      ['#546c66','#657c70','#7a8e7c','#5a736c','#8c9680']
    ][variant];
    const rows=7,cols=7,tileLength=Math.hypot(half/rows,rise/rows)*.94,tileDepth=depth/cols*.9;
    const tileGeometry=geometry('home-roof-tile:'+tileLength+':'+tileDepth,()=>new THREE.BoxGeometry(tileLength,.03,tileDepth));
    const tiles=new THREE.InstancedMesh(tileGeometry,mat('#ffffff',{vertexColors:true,roughness:.92}),rows*cols*2);
    const object=new THREE.Object3D();let index=0;
    for(const side of [-1,1])for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const t=(row+.5)/rows;object.position.set(side*half*(1-t),eaveY+rise*t+.027,-depth/2+(col+.5)*tileDepth/.9);object.rotation.set(0,0,side===1?-angle:angle);object.updateMatrix();tiles.setMatrixAt(index,object.matrix);tiles.setColorAt(index,new THREE.Color(tilePalette[(variant+row*2+col*3)%tilePalette.length]));index++;
    }
    tiles.instanceMatrix.needsUpdate=true;if(tiles.instanceColor)tiles.instanceColor.needsUpdate=true;tiles.castShadow=true;tiles.receiveShadow=true;g.add(tiles);
    const fascia=['#d7b994','#dfc79f','#b8b8a3','#d9c3a4','#c8d1b7'][variant];
    for(const side of [-1,1]){
      for(const z of [-depth/2,depth/2]){const rake=box(g,slopeLength+.06,.07,.075,fascia,side*half/2,(eaveY+ridgeY)/2,z,{cast:true});rake.rotation.z=side===1?-angle:angle}
      const gutter=box(g,.065,.065,depth,variant===4?'#5e786f':'#596866',side*half,eaveY-.035,0,{cast:true});
      for(const z of [-depth/2,depth/2]){const pipe=box(g,.045,Math.max(.5,eaveY-.2),.045,'#6c7470',side*half,eaveY/2,Math.sign(z)*(depth/2-.025),{cast:true});pipe.receiveShadow=true}
      const roofLight=box(g,.28,.035,.3,'#507985',side*.39,eaveY+rise*(1-Math.abs(.39)/half)+.045,0,{cast:true});roofLight.rotation.z=side===1?-angle:angle;
      const skylightFrame=box(g,.35,.035,.37,fascia,side*.39,eaveY+rise*(1-Math.abs(.39)/half)+.03,0,{cast:true});skylightFrame.rotation.z=side===1?-angle:angle;
    }
    const ridge=cylinder(g,.065,.065,depth,'#d7b981',0,ridgeY+.025,0,18);ridge.rotation.x=Math.PI/2;ridge.castShadow=true;
    const cx=-.48,chimneyY=eaveY+rise*(1-Math.abs(cx)/half);
    box(g,.2,.55,.22,'#a65f50',cx,chimneyY+.25,-.26,{cast:true});
    for(const y of [.11,.23,.35,.47])box(g,.21,.025,.235,'#d98a6f',cx,chimneyY+y,-.26);
    box(g,.28,.08,.28,'#5f5d54',cx,chimneyY+.56,-.26,{cast:true});
  }
  function detailedHomeBalcony(g,x,y,z,style){
    const metal=style==='heritage'?'#4d6154':'#596b64';
    box(g,.56,.05,.2,'#d7c4a4',x,y,z+.07,{cast:true});
    box(g,.59,.035,.035,metal,x,y+.28,z+.18,{cast:true});
    for(const dx of [-.25,-.08,.08,.25])box(g,.025,.28,.025,metal,x+dx,y+.14,z+.18,{cast:true});
    for(const dx of [-.2,.2])box(g,.025,.18,.025,metal,x+dx,y+.08,z+.02,{cast:true});
  }
  function house(g,b){
    const variant=Math.abs(b.x*3+b.y*7)%5,style=b.architecturalStyle||'',modern=/moderno|contemporáneo|actual/i.test(style)||variant===4,heritage=/hist|colon|patrimonial/i.test(style)||variant===2;
    const dense=b.density==='high',floors=dense?5:b.level>=2?3:2,w=1.48,d=1.36,baseY=.18,wallHeight=dense?3.72:floors===3?2.42:1.86,gableHeight=modern||dense?0:.54;
    const walls=['#e4c69f','#ead9b8','#d6aaa0','#c7b999','#b8cfbf'],wall=b.urbanCondition<55?'#b9ab94':walls[variant],trim=modern?'#e0e8dc':'#f5ead6',roofColors=['#9b4b43','#a96147','#68716c','#925242','#5f766d'],roofColor=roofColors[variant];
    const frontZ=d/2+.015,roofY=baseY+wallHeight,ridgeY=roofY+gableHeight+.08;
    box(g,1.67,.18,1.55,'#96816b',0,.09,0,{cast:true});
    box(g,1.61,.075,1.49,heritage?'#dbc9a8':'#f1e4cd',0,.205,0,{cast:true});
    detailedHomeShell(g,w,wallHeight,gableHeight,d,baseY,wall,modern);
    const corner=heritage?'#dbc49e':trim;
    for(const x of [-1,1]){
      box(g,.065,wallHeight-.08,.085,corner,x*(w/2-.015),baseY+wallHeight/2,frontZ-.005,{cast:true});
      for(let floor=0;floor<floors;floor++)box(g,.085,.07,.095,floor%2?'#e1caa5':'#f4e8d5',x*(w/2-.01),baseY+.3+floor*.66,frontZ+.025);
    }
    for(let floor=1;floor<floors;floor++)box(g,w-.08,.045,.06,heritage?'#b58a68':'#e4d3ba',0,baseY+.3+floor*.68,frontZ+.006);
    for(let floor=0;floor<floors;floor++){
      const y=baseY+.62+floor*.69,windowStyle=modern?'modern':heritage?'heritage':'classic';
      if(modern&&floor>0)detailedHomeWindow(g,0,y,frontZ,1.45,0,windowStyle,false);
      else for(const x of [-.47,.47])detailedHomeWindow(g,x,y,frontZ,modern?1.12:1,0,windowStyle,floor===0);
      if(!modern&&floor===1&&b.level>=2&&variant%2===0)for(const x of [-.47,.47])detailedHomeBalcony(g,x,y-.29,frontZ,windowStyle);
      for(const side of [-1,1])detailedHomeWindow(g,side*(w/2+.012),y,-.28,heritage ? .84 : .94,side*Math.PI/2,windowStyle,false);
    }
    detailedHomeDoor(g,baseY,frontZ,modern);
    if(!modern){
      const oculus=new THREE.Mesh(new THREE.CylinderGeometry(.125,.125,.055,32),mat(heritage?'#a9c2bb':'#87b8bd',{roughness:.32}));oculus.rotation.x=Math.PI/2;oculus.position.set(0,roofY+gableHeight*.48,frontZ+.02);oculus.castShadow=true;g.add(oculus);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.14,.023,8,32),mat(trim));ring.rotation.x=Math.PI/2;ring.position.set(0,roofY+gableHeight*.48,frontZ+.062);ring.castShadow=true;g.add(ring);
      for(const side of [-1,1]){const brace=box(g,.62,.035,.04,heritage?'#8e6b50':'#d2b795',side*.19,roofY+gableHeight*.73,frontZ+.025);brace.rotation.z=side===1?-.56:.56}
    }
    detailedHomeRoof(g,w,d,roofY,ridgeY,variant,roofColor,modern);
    for(const x of [-.74,.74]){
      const tone=variant%2?'#739267':'#648965';box(g,.34,.16,.25,'#9a7355',x,.12,.89,{cast:true});
      for(const dx of [-.1,0,.1]){sphere(g,.12,tone,x+dx,.27,.89,2);sphere(g,.072,variant%2?'#d5a28b':'#91b57f',x+dx,.35,.88,2)}
    }
    box(g,.2,.045,.7,'#c6b89e',0,.045,.92);
    if(heritage){for(const x of [-.67,.67])for(const y of [.42,.7,1.02])box(g,.055,.18,.07,'#d7c3a1',x,y,.73)}
  }
  function shop(g,b){const h=b.name==='Talleres del Puerto'?1.9:b.density==='high'?2.8:b.density==='medium'?2.4:2.1,closed=b.business?.status==='cerrado';box(g,1.72,h,1.55,b.name==='Talleres del Puerto'?'#9ab8ad':COLORS.shop,0,h/2+.08,0,{cast:true});box(g,1.87,.17,1.72,'#4e7774',0,h+.1,0);flankWindows(g,1.72,2);box(g,1.64,.22,.22,closed?'#77706b':'#d99069',0,1.48,.86);for(let i=-1;i<=1;i++)box(g,.43,.85,.055,closed?'#68797b':'#53969e',i*.51,.77,.81);box(g,1.57,.1,.07,'#e8dcc5',0,1.2,.85);for(const x of [-.6,.6])box(g,.11,.1,.55,'#e9b36f',x,1.56,1.03);box(g,.55,.31,.12,'#f1e4c6',0,1.74,.84);box(g,.42,.035,.14,closed?'#8c6555':'#4a8d88',0,1.73,.92);box(g,.45,.3,.4,'#819b96',-.35,h+.35,-.15);if(closed)box(g,1.2,.12,.08,'#8b5c4e',0,.28,.91)}
  function powerPlant(g){box(g,1.6,1.15,1.2,'#c7baa0',0,.62,-.08,{cast:true});box(g,1.78,.16,1.4,'#58787a',0,1.27,-.08);for(const x of [-.52,.52]){cylinder(g,.26,.38,.66,'#e7ded0',x,.44,-.55,14);cylinder(g,.34,.3,.18,'#e7ded0',x,.86,-.55,14);box(g,.18,.42,.18,'#a65f54',x,1.55,-.56)}box(g,.5,.43,.08,'#d8a75d',-.35,.59,.55);for(const x of [-.78,.78])for(const z of [-.6,.58])cylinder(g,.07,.09,.12,'#526b64',x,.08,z)}
  function gasPlant(g){box(g,1.66,.72,1.26,'#b5b6a3',0,.43,0,{cast:true});box(g,1.74,.1,1.34,'#55766b',0,.84,0);for(const x of [-.49,.49]){cylinder(g,.3,.34,.9,'#d2c7a5',x,.49,-.32,18);cylinder(g,.31,.31,.1,'#dbaa64',x,.98,-.32,18);box(g,.14,.42,.15,'#b36a51',x,1.21,-.32)}for(const z of [-.62,.62])box(g,1.68,.08,.1,'#c99c57',0,.17,z);box(g,.68,.4,.08,'#d9b469',0,.53,.69)}
  function waterPlant(g){box(g,1.68,.82,1.3,'#ded5bd',-.1,.48,-.12,{cast:true});box(g,1.78,.12,1.42,'#637e79',-.1,.94,-.12);cylinder(g,.5,.48,.92,'#74aeb2',.48,.54,-.38,20);cylinder(g,.53,.5,.12,'#d8e8d9',.48,1.03,-.38,20);for(const x of [-.64,-.2]){box(g,.26,.44,.28,'#8db8ae',x,.32,.49);box(g,.29,.06,.31,'#e4ead5',x,.56,.49)}box(g,.1,.54,.1,'#528c91',-.75,.27,-.65);for(const x of [-.76,.76])for(const z of [-.66,.65])cylinder(g,.07,.09,.12,'#526b64',x,.08,z)}
  function wastewaterPlant(g){box(g,1.72,.78,1.35,'#b8c8b9',-.12,.45,-.12,{cast:true});box(g,1.82,.12,1.45,'#617b72',-.12,.9,-.12);for(const [x,z,color] of [[-.48,-.42,'#7bb4a9'],[.43,-.42,'#829d92'],[-.48,.38,'#8ab0a2'],[.43,.38,'#72968d']]){cylinder(g,.34,.32,.58,color,x,.35,z,18);cylinder(g,.37,.34,.09,'#d6ddc8',x,.67,z,18)}box(g,.12,.66,.12,'#819590',.77,.35,-.56);box(g,.48,.08,.45,'#d9c7a5',.48,.1,.63);for(const x of [-.74,.74])for(const z of [-.62,.62])cylinder(g,.07,.09,.12,'#526b64',x,.08,z)}
  function hotel(g,b){const floors=4,closed=b.business?.status==='cerrado';box(g,1.63,2.85,1.42,closed?'#8d9990':'#e4d7bd',0,1.48,0,{cast:true});box(g,1.75,.17,1.54,closed?'#686e68':'#3e7778',0,2.98,0);box(g,1.88,.12,1.65,'#b27762',0,.18,0);for(let floor=0;floor<floors;floor++){for(const x of [-.52,0,.52]){box(g,.31,.42,.055,closed?'#78807b':'#71aeb2',x,.62+floor*.64,.74);box(g,.34,.055,.07,'#f3e7d0',x,.39+floor*.64,.78)}box(g,1.7,.055,.06,'#f1e6cf',0,.97+floor*.64,.76)}box(g,.66,.48,.12,closed?'#797a72':'#c56f5b',0,2.38,.78);box(g,.48,.28,.08,'#f8e6c8',0,2.39,.86);for(const x of [-.62,.62])box(g,.16,.22,.48,'#5c8d67',x,.31,.95);box(g,.5,.62,.12,'#6b7774',0,.42,.81);for(const x of [-.8,.8])for(const z of [-.66,.66]){cylinder(g,.09,.11,.12,'#5b735e',x,.09,z);sphere(g,.17,'#548b61',x,.34,z,1)}if(closed)box(g,1.1,.1,.08,'#9e6656',0,.25,.88)}
  function parkingGarage(g,b){
    const stories=b.density==='high'?3:2;
    box(g,1.72,.1,1.72,'#b9b39f',0,.05,0,{cast:false});
    for(let floor=0;floor<stories;floor++){
      const y=.18+floor*.68;
      box(g,1.54,.47,1.38,floor%2?'#8daba4':'#9db7ad',0,y+.24,0,{cast:true});
      box(g,1.62,.07,1.46,'#3e5554',0,y+.49,0,{cast:false});
      for(const z of [-.48,-.16,.16,.48])box(g,.025,.035,.18,'#e6d39c',.67,y+.54,z,{cast:false});
      for(const x of [-.48,-.16,.16,.48])box(g,.18,.035,.025,'#e6d39c',x,y+.54,.59,{cast:false});
      box(g,1.54,.055,.09,'#e5e4d2',0,y+.04,.7,{cast:false});
    }
    box(g,.54,.12,.52,'#bba883',-.48,.12,.82,{cast:false});
    for(let i=0;i<5;i++)box(g,.08,.08,.68,'#c5b690',-.48+i*.1,.19+i*.12,.82,{cast:false});
    box(g,.54,.34,.07,'#315f63',0,stories*.68+.28,.73,{cast:false});
    box(g,.34,.22,.035,'#e8ddbd',0,stories*.68+.28,.78,{cast:false});
    for(let i=0;i<Math.min(3,Math.ceil((b.parkingOccupied||0)/5));i++){
      const car=makeVehicle(['#d89368','#f1d493','#75ada8'][i%3]);car.scale.setScalar(.34);car.position.set(-.46+i*.42,.18,.23);car.rotation.y=Math.PI/2;g.add(car);
    }
  }
  function urbanPark(g){
    // Espacio público abierto: pavimento, senderos y mobiliario, sin zócalo ni fachada.
    box(g,1.94,.06,1.94,'#83a66d',0,.015,0,{cast:false});
    box(g,1.94,.045,.19,'#cdbb98',0,.065,-.86,{cast:false});
    box(g,1.94,.045,.19,'#cdbb98',0,.065,.86,{cast:false});
    box(g,.2,.045,1.58,'#d8c7a7',0,.068,0,{cast:false});
    box(g,1.58,.045,.2,'#d8c7a7',0,.069,0,{cast:false});
    // Juntas de piedra hacen legible la plaza desde la vista isométrica.
    for(const x of [-.72,-.48,-.24,.24,.48,.72])box(g,.012,.008,.16,'#b9a987',x,.094,0,{cast:false});
    for(const z of [-.72,-.48,-.24,.24,.48,.72])box(g,.16,.008,.012,'#b9a987',0,.095,z,{cast:false});
    // Fuente baja, sin cuerpo edilicio.
    cylinder(g,.38,.4,.11,'#c6b798',0,.14,0,24);
    cylinder(g,.29,.31,.12,'#70b9bf',0,.24,0,24);
    cylinder(g,.2,.22,.17,'#a4d9d7',0,.36,0,20);
    cylinder(g,.12,.14,.1,'#62b4bd',0,.48,0,18);
    for(const [x,z] of [[-.6,-.58],[.6,.58],[-.62,.6],[.62,-.6]]){
      box(g,.46,.075,.11,'#8b6145',x,.17,z);
      for(const dx of [-.18,.18])box(g,.045,.16,.12,'#68503e',x+dx,.105,z);
    }
    for(const [x,z] of [[-.72,.48],[.72,-.48]]){
      box(g,.34,.13,.34,'#b89169',x,.13,z);
      cylinder(g,.055,.07,.35,'#795536',x,.35,z);
      sphere(g,.27,'#438c50',x,.68,z,1);sphere(g,.18,'#65a85b',x-.08,.78,z+.04,1);
    }
    for(const [x,z,c] of [[-.38,-.67,'#e9c451'],[.38,.67,'#e97c91'],[-.8,0,'#efe7cf'],[.8,0,'#e9c451']]){
      box(g,.24,.12,.2,'#ad8966',x,.11,z);
      for(const dx of [-.07,0,.07])sphere(g,.045,c,x+dx,.2,z,1);
      sphere(g,.035,'#f8ead1',x+.045,.22,z,1);
    }
  
    // Iluminación cálida, jardineras florales y detalles de fuente en las cuatro esquinas.
    for(const [x,z] of [[-.82,-.82],[.82,-.82],[-.82,.82],[.82,.82]]){
      roundedBox(g,.28,.07,.28,'#d7c4a4',x,.085,z,.035);cylinder(g,.045,.06,.34,'#596e61',x,.27,z,10);
      roundedBox(g,.17,.08,.17,'#efcf82',x,.45,z,.035);sphere(g,.085,'#fff0c6',x,.48,z,2);
      for(let j=0;j<4;j++){const a=j*Math.PI/2;sphere(g,.075,j%2?'#d7899a':'#e8c65d',x+Math.cos(a)*.15,.18,z+Math.sin(a)*.15,1)}
    }
    for(const z of [-.43,.43])for(const x of [-.72,.72]){
      roundedBox(g,.15,.045,.15,'#f1e4ca',x,.105,z,.025);
      for(let j=0;j<4;j++)sphere(g,.045,['#e8b96b','#d9829a','#8bb978','#f1e5c7'][j],x+((j%2)-.5)*.1,.16,z+(Math.floor(j/2)-.5)*.1,1);
    }
    ring(g,.33,.022,'#e8e0ce',0,.31,0);
    for(let j=0;j<4;j++){const a=j*Math.PI/2,px=Math.cos(a)*.16,pz=Math.sin(a)*.16;rodBetween(g,[px,.38,pz],[px,.58,pz],.012,'#b2dfe0',6);sphere(g,.035,'#e8fbf2',px,.61,pz,2)}
    for(const x of [-.29,-.1,.1,.29])ring(g,.07,.012,'#61766b',x,.17,-.79,{rotationX:Math.PI/2});
    for(const [x,z] of [[-.84,0],[.84,0]]){roundedBox(g,.12,.2,.12,'#67887b',x,.17,z,.025);roundedBox(g,.14,.035,.14,'#4e7065',x,.29,z,.02)}
}
  function clinic(g){const h=2.77;box(g,1.78,h,1.65,COLORS.civic,0,h/2+.08,0,{cast:true});box(g,1.98,.15,1.87,'#b8796b',0,h+.12,0);flankWindows(g,1.78,3);box(g,1.83,.16,.16,'#e6b291',0,1.39,.87);for(const floor of [0,1,2])for(const x of [-.59,0,.59])sideWindow(g,x,.65+floor*.73,.85,.27);box(g,.45,.67,.12,'#558b96',0,.45,.89);box(g,1.3,.08,.58,'#f2d9b3',0,1.13,1.11);for(const x of [-.55,.55])box(g,.09,1.03,.09,'#e6d3ae',x,.59,1.26);box(g,.47,.47,.07,'#fbf8e9',0,h+.47,.77);box(g,.28,.075,.08,'#c8665f',0,h+.49,.82);box(g,.08,.3,.08,'#c8665f',0,h+.49,.82)}
  function school(g){const h=1.65;box(g,1.82,h,1.62,'#e8d4ad',0,h/2+.08,0,{cast:true});box(g,1.96,.16,1.78,'#537d78',0,h+.12,0);flankWindows(g,1.82,2);for(const x of [-.58,0,.58]){box(g,.31,.43,.06,'#72aeb0',x,.95,.84);box(g,.35,.06,.08,'#f0e4c9',x,.71,.88)}box(g,.4,.58,.12,'#477a83',0,.38,.9);box(g,.76,.25,.1,'#f2e6c9',0,2.05,.85);for(const x of [-.16,.16])box(g,.07,.18,.12,'#cf755f',x,2.06,.91);box(g,1.4,.1,.13,'#d58b65',0,.18,0);for(const x of [-.7,.7]){cylinder(g,.07,.08,.12,'#526b64',x,.08,.7);sphere(g,.18,'#649568',x,.3,.7,1)}}
  function fireStation(g){box(g,1.86,1.12,1.58,'#d9c9b1',0,.62,0,{cast:true});box(g,1.98,.16,1.72,'#9b5d4b',0,1.23,0);for(const x of [-.53,.53]){box(g,.72,.72,.08,'#344f51',x,.48,.84);box(g,.62,.6,.1,'#b96448',x,.43,.9);box(g,.62,.075,.12,'#e3d2b5',x,.75,.92);for(const dx of [-.2,.2])box(g,.045,.45,.08,'#d8c6a6',x+dx,.43,.96)}box(g,.58,.26,.1,'#f4e7c9',0,1.56,.82);box(g,.2,.22,.06,'#b94f40',0,1.57,.9);cylinder(g,.055,.06,.34,'#bd7054',-.66,1.48,-.44);cylinder(g,.055,.06,.34,'#bd7054',.66,1.48,-.44);box(g,.3,.08,.26,'#59696a',-.72,.09,.64);box(g,.18,.11,.24,'#dfad56',-.72,.17,.64)}
  function townHall(g){const h=2.5;box(g,1.86,h,1.7,'#e8d1a6',0,h/2+.08,0,{cast:true});box(g,2.03,.18,1.89,'#877c75',0,h+.15,0);flankWindows(g,1.86,3);for(const floor of [0,1])for(const x of [-.62,0,.62])sideWindow(g,x,.79+floor*.89,.88,.22);box(g,.52,.83,.12,'#688b8e',0,.49,.92);for(const x of [-.58,.58])box(g,.11,1.23,.11,'#f3e5c5',x,.68,1.0);box(g,1.42,.13,.53,'#c59c7b',0,1.4,1.05);box(g,.63,.69,.62,'#e8d7b7',0,h+.52,0);box(g,.79,.12,.79,'#a16e64',0,h+.91,0);const dial=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.04,16),mat('#f6ead3'));dial.rotation.x=Math.PI/2;dial.position.set(0,h+.55,.34);g.add(dial);box(g,.03,.16,.04,'#4c625e',0,h+.57,.37);box(g,.42,.07,.36,'#d1aa75',0,.08,1.15)}
  function socialShelter(g){
    box(g,1.78,1.72,1.54,'#ded1bd',0,.94,0,{cast:true});box(g,1.91,.16,1.68,'#597e79',0,1.84,0);
    box(g,1.05,.11,.24,'#e5d9c7',0,1.2,.83);for(const x of [-.65,.65])box(g,.11,.92,.11,'#668b83',x,.82,.86);
    for(const x of [-.56,0,.56]){box(g,.34,.55,.07,'#83aeb2',x,.74,.8);box(g,.38,.06,.09,'#f3e6d2',x,.47,.86);box(g,.38,.07,.09,'#ad806a',x,.42,.87)}
    box(g,.34,.52,.08,'#59746f',0,.4,.82);box(g,.38,.07,.13,'#e9d9bc',0,.71,.88);
    box(g,.58,.32,.08,'#f4ead7',0,2.05,.68);box(g,.48,.08,.05,'#648f87',0,2.05,.73);box(g,.18,.17,.05,'#d58e71',-.12,2.05,.77);box(g,.18,.17,.05,'#7399a0',.12,2.05,.77);
    for(const x of [-.86,.86]){box(g,.12,.09,.35,'#d2ba91',x,.18,.9);sphere(g,.17,'#73956c',x,.35,1.02,1)}
  }
  function depot(g){box(g,1.72,1.52,1.58,'#c5b99e',0,.83,0,{cast:true});box(g,1.82,.16,1.7,'#667b76',0,1.66,0);box(g,1.72,.22,.08,'#a97856',0,.26,.83);box(g,.1,1.04,.08,'#725f50',-.66,.83,.87);box(g,.1,1.04,.08,'#725f50',.66,.83,.87);for(let y of [.55,.9,1.25]){box(g,1.24,.055,.1,'#8f7458',0,y,.91);for(let x of [-.46,0,.46])box(g,.28,.26,.24,['#bd8957','#7e9c8b','#d2ad68'][(Math.round(y*10)+Math.round((x+1)*10))%3],x,y+.15,.78)}box(g,.42,.28,.12,'#6d8988',0,.53,.94);box(g,.52,.13,.08,'#eee0c4',0,1.89,.74)}
  function landfillFacility(g){box(g,1.78,.16,1.62,'#82907a',0,.1,0,{cast:true});box(g,1.42,.42,1.16,'#96785a',0,.34,-.05,{cast:true});box(g,1.5,.11,1.24,'#5e7f67',0,.58,-.05);for(const x of [-.58,.58])for(const z of [-.44,.4])cylinder(g,.055,.055,.55,'#68766b',x,.33,z);box(g,.48,.32,.08,'#d9cba9',.52,.82,.51);box(g,.34,.08,.02,'#697e70',.52,.83,.56);box(g,.68,.07,.48,'#766a58',-.55,.18,.76);for(const x of [-.76,.74])sphere(g,.14,'#67876a',x,.23,-.5,1)}
  function recyclingFacility(g){box(g,1.72,.16,1.55,'#8a9b79',0,.1,0,{cast:true});box(g,1.32,.7,1.08,'#aebeb0',-.08,.47,-.08,{cast:true});box(g,1.4,.09,1.15,'#678c7d',-.08,.86,-.08);for(const [x,z,color] of [[-.43,-.4,'#5c8d72'],[.38,-.4,'#c0914d'],[-.43,.34,'#5d8290'],[.4,.34,'#b9755c']]){box(g,.38,.26,.32,color,x,.19,z);box(g,.38,.035,.32,'#d3d7c5',x,.34,z)}box(g,.38,.3,.42,'#d6c9a8',.53,.72,.46);box(g,.28,.16,.04,'#6d978b',.53,.78,.68);for(const x of [-.72,.72])cylinder(g,.07,.09,.16,'#566e5f',x,.12,-.62)}
  function taxiDepot(g){box(g,1.7,.86,1.48,'#d4c8a3',0,.47,-.08,{cast:true});box(g,1.82,.13,1.62,'#b57d47',0,.98,-.08);box(g,1.35,.56,.08,'#5d6c6c',0,.42,.68);box(g,.64,.11,.1,'#ddc07b',0,.71,.75);for(const x of [-.52,.52]){box(g,.34,.21,.08,'#e2b457',x,.41,.74);box(g,.3,.08,.1,'#28393b',x,.25,.76)}const cab=makeVehicle('#e7b74f');cab.scale.setScalar(.58);cab.position.set(.58,.07,1.08);cab.rotation.y=Math.PI/2;g.add(cab)}
  function busGarage(g){box(g,1.78,1.02,1.65,'#b8c9be',0,.56,-.08,{cast:true});box(g,1.95,.14,1.86,'#466e68',0,1.13,-.08);box(g,1.87,.12,.16,'#dfb46e',0,1.1,.81);for(const x of [-.56,0,.56]){box(g,.47,.68,.08,'#477077',x,.48,.78);box(g,.4,.09,.095,'#d6e5d5',x,.74,.84);box(g,.38,.05,.1,'#84aab0',x,.4,.85)}for(const x of [-.58,.58])for(const z of [-.4,.2])box(g,.18,.26,.04,'#75a3a2',x,.69,z);box(g,.86,.11,.42,'#a3a79d',0,.12,1.04);box(g,.66,.08,.25,'#d2b773',0,.09,1.12);const parked=makeBus('#dfad5d');parked.scale.setScalar(.48);parked.position.set(.62,.07,1.12);parked.rotation.y=Math.PI/2;g.add(parked)}
  function busShelter(g){box(g,1.2,.1,.48,'#35766c',0,1.43,0,{cast:true});for(const x of [-.51,.51])box(g,.075,1.38,.075,'#526c62',x,.7,0);box(g,.92,.1,.34,'#c6b99e',0,.42,-.04);for(const x of [-.35,.35])box(g,.07,.43,.07,'#526c62',x,.22,-.04);box(g,.16,.58,.13,'#e9e2c9',-.72,.45,.12);box(g,.19,.1,.16,'#be7358',-.72,.75,.12);box(g,.035,.34,.035,'#667a68',-.72,.35,.12);box(g,.22,.17,.035,'#e8b962',-.72,.53,.15);box(g,.82,.055,.08,'#dbb477',0,.12,.38)}
  function portTerminal(g){box(g,1.92,.13,1.82,'#b7a98c',0,.09,0,{cast:false});box(g,1.75,.1,.66,'#527c80',0,.17,.44);box(g,.62,.62,.82,'#d5c6a2',-.42,.53,-.28,{cast:true});box(g,.68,.1,.9,'#687d78',-.42,.9,-.28);for(let i=0;i<3;i++){const x=-.69+i*.3;box(g,.25,.2,.29,['#bd6550','#d2a454','#527d80'][i],x,.32,-.3);box(g,.25,.035,.29,'#e8d6ad',x,.44,-.3)}box(g,.1,1.65,.1,'#b56543',.55,.91,.18);box(g,.08,1.65,.08,'#b56543',.93,.91,.18);box(g,.48,.09,.09,'#b56543',.74,1.7,.18);box(g,.62,.08,.08,'#d8b16e',.76,1.31,.18);box(g,.06,.72,.06,'#536f70',.76,.98,.18);for(const x of [-.76,.76])for(const z of [-.74,.7])cylinder(g,.08,.08,.16,'#76847b',x,.08,z)}
  function airportTerminal(g){box(g,1.8,.045,.7,'#414e53',0,.06,0,{cast:false});for(let i=-2;i<=2;i++)box(g,.035,.018,.7,'#ece6d0',i*.31,.09,0,{cast:false});for(let x of [-.83,.83])for(let z of [-.28,.28])sphere(g,.045,'#e6c46d',x,.13,z,1);box(g,.92,.62,.72,'#d8d1bd',-.12,.38,-.52,{cast:true});box(g,1.02,.09,.81,'#557c7c',-.12,.73,-.52);for(let x of [-.42,-.12,.18])box(g,.18,.24,.04,'#72aab0',x,.42,-.12);box(g,.4,.82,.36,'#c1b493',.57,.49,-.47);box(g,.22,.34,.22,'#6c8d8f',.57,1.08,-.47);box(g,.06,.38,.06,'#c45d4c',.57,1.42,-.47);box(g,.06,.1,.06,'#e3be63',.57,1.66,-.47);box(g,.36,.05,.28,'#b9b09d',-.67,.12,.58);box(g,.42,.07,.32,'#d6cbb5',.34,.12,.58)}
  function factory(g,b){const wall='#d7c795',roof='#b5a25e',dark='#687a73';box(g,1.3,.82,1.35,wall,0,.48,0);box(g,1.42,.12,1.42,roof,0,.94,0);for(let i=0;i<3;i++)box(g,.48,.34,.16,'#eee5cc',-.43+i*.43,.62,.69);box(g,.24,1.35,.24,dark,-.52,1.45,-.42);box(g,.2,.22,.2,'#d6d4c5',-.52,2.2,-.42);box(g,.22,.9,.22,'#7e8879',.48,1.2,-.4);for(let i=0;i<4;i++)box(g,.16,.35,.9,roof,-.55+i*.36,1.1,-.86);for(const x of [-.46,.46]){cylinder(g,.13,.13,.11,'#738487',x,1.08,.25,18);cylinder(g,.09,.09,.17,'#c2c8ba',x,1.22,.25,18);box(g,.17,.14,.025,'#668e9a',x,.55,-.69)}box(g,.5,.08,.25,'#8c9c8c',0,.16,.78);for(let i=0;i<3;i++)box(g,.4,.025,.025,'#e8c790',0,.27+i*.065,.82);if((b.business?.lastProduction||0)>0){sphere(g,.12,'#d5d7c9',-.52,2.43,-.42,1);sphere(g,.16,'#e2e1d2',-.62,2.66,-.42,1)}}
  function office(g,b){const floors=b.density==='high'?4:b.density==='medium'?3:2,baseY=.18,floorH=.58,width=1.48,depth=1.32,height=floors*floorH;box(g,width,.16,depth,'#b8c6bd',0,baseY,0,{cast:true});box(g,width-.1,height,depth-.1,'#7f9b98',0,baseY+.1+height/2,0,{cast:true});for(let floor=0;floor<floors;floor++){const y=baseY+.22+floor*floorH;box(g,width+.08,.045,depth+.04,'#4d6e70',0,y+.25,0);for(const x of [-.48,0,.48]){box(g,.31,.29,.045,'#b8d7d2',x,y,.675);box(g,.34,.035,.055,'#e2c886',x,y+.17,.71);box(g,.035,.31,.05,'#d9d8c6',x-.18,y,.705);box(g,.035,.31,.05,'#d9d8c6',x+.18,y,.705)}}box(g,width+.12,.12,depth+.12,'#355d62',0,baseY+.17+height,0);for(const x of [-.47,.47])box(g,.28,.32,.09,'#e6ddc6',x,.36,.71);box(g,.3,.53,.12,'#4b6970',0,.48,.74);box(g,.24,.22,.035,'#f1d27c',0,baseY+.32+height,.73);for(const x of [-.46,.46]){box(g,.19,.18,.22,'#84988b',x,baseY+.2+height,-.38);box(g,.24,.05,.28,'#c6c9b7',x,baseY+.31+height,-.38)}if((b.business?.lastWorkers||0)>0){for(const x of [-.52,.52])sphere(g,.075,'#f1d27c',x,.36,.79,2)}}
  // Complementos reutilizables: todas las fachadas se modelan para las cuatro rotaciones de cámara.
  function planter(g,x,z,color='#5e9664'){box(g,.21,.17,.19,'#b8795c',x,.18,z);sphere(g,.16,color,x,.39,z,1)}
  function balcony(g,x,y,z){box(g,.58,.055,.34,'#dfccb0',x,y,z);for(const dx of [-.25,0,.25])box(g,.025,.28,.025,'#465d56',x+dx,y+.15,z+.15);box(g,.58,.025,.025,'#465d56',x,y+.29,z+.15);box(g,.22,.11,.12,'#c48765',x,y+.09,z+.03);sphere(g,.12,'#6caa68',x,y+.23,z+.03,1)}

  function refinedArchitecture(g,b){
    const kind=b.kind,service=b.serviceModel||'',isIndustrial=['factory','powerPlant','waterPlant','gasPlant','wastewaterPlant','recyclingPlant','landfill'].includes(kind);
    const isPublic=['civic','school','fireStation','hotel','shop','office','depot','busGarage','busStop','airport','port'].includes(kind);
    if(kind==='home'||kind==='road')return;
    const trim=isIndustrial?'#687f79':kind==='school'?'#d8c69d':kind==='fireStation'?'#bb5c4b':kind==='hotel'?'#527e7a':kind==='shop'?'#b77b59':kind==='office'?'#4d7880':'#819a91';
    const stone=isIndustrial?'#c7c5b5':'#e7dfcc';
      const roofY=kind==='hotel'?2.94:kind==='office'?2.48:kind==='shop'?2.16:kind==='school'?1.88:kind==='factory'?1.02:kind==='fireStation'?1.67:(kind==='civic'&&service==='policeHQ')?2.5:(kind==='civic'&&service==='policeStation')?2.05:kind==='civic'?1.72:kind==='airport'||kind==='port'||kind==='depot'||kind==='busGarage'?1.5:kind==='powerPlant'||kind==='gasPlant'||kind==='waterPlant'||kind==='wastewaterPlant'?1.22:1.45;
    // Molduras en capas, zócalos de piedra y cornisas definen las siluetas.
    roundedBox(g,1.86,.105,1.86,trim,0,.105,0,.025);
    for(const x of [-.88,.88]){
      roundedBox(g,.075,Math.max(.58,roofY-.34),.075,stone,x,Math.max(.43,roofY/2-.02),.86,.018);
      roundedBox(g,.09,.09,.1,trim,x,.25,.88,.02);
    }
    roundedBox(g,1.82,.075,.1,trim,0,roofY,.88,.022);
    roundedBox(g,1.72,.045,.07,stone,0,roofY-.15,.91,.018);
    const floors=kind==='hotel'||kind==='office'?(kind==='office'&&b.density!=='high'?3:4):(kind==='civic'&&service==='policeHQ')?3:(kind==='civic'&&service==='policeStation')?2:kind==='school'?2:1;
    for(let floor=0;floor<floors;floor++){
      const y=kind==='hotel'?.62+floor*.64:kind==='school'?.66+floor*.66:.63+floor*.62;
      if(y<roofY-.08){
        roundedBox(g,1.58,.028,.055,trim,0,y+.27,.866,.012);
        for(const x of [-.64,-.21,.21,.64]){
          roundedBox(g,.035,.48,.055,stone,x,y,.867,.012);
          roundedBox(g,.34,.035,.075,trim,x,y+.25,.89,.012);
        }
      }
    }
    if(isPublic&&kind!=='airport'&&kind!=='port'){
      roundedBox(g,.9,.07,.39,stone,0,.34,.98,.025);
      for(const x of [-.39,.39])rodBetween(g,[x,.31,.99],[x,.55,.94],.022,trim,7);
      roundedBox(g,.62,.055,.07,trim,0,1.72,.98,.018);
      for(const x of [-.28,.28])sphere(g,.045,'#ffe3a0',x,1.72,1.025,2);
    }
    if(kind==='shop'||kind==='hotel'){
      for(const x of [-.48,0,.48])roundedBox(g,.27,.12,.24,(x===0?'#e5bc76':trim),x,1.57,1.1,.025);
      for(const x of [-.7,.7]){rodBetween(g,[x,.15,1.04],[x,.48,1.04],.018,'#536d65',7);roundedBox(g,.24,.19,.2,'#aa7659',x,.19,1.03,.035);sphere(g,.13,businessColor(b),x,.39,1.03,2)}
    }
    if(kind==='hotel')for(let floor=1;floor<4;floor++)for(const x of [-.52,.52]){
      roundedBox(g,.34,.045,.19,'#d7c6a9',x,.45+floor*.64,.91,.018);
      for(const dx of [-.12,0,.12])rodBetween(g,[x+dx,.47+floor*.64,.99],[x+dx,.63+floor*.64,.99],.012,'#617b76',6);
    }
    if(kind==='school'){
      roundedBox(g,.42,.28,.08,'#eee3c8',0,1.93,.94,.025);ring(g,.105,.012,'#ad7657',0,1.95,.99);rodBetween(g,[0,1.95,.995],[0,2.025,.995],.009,'#ad7657',6);
      for(const x of [-.74,.74]){roundedBox(g,.12,.38,.1,'#d3c7ac',x,.39,.91,.025);sphere(g,.055,'#e5ae62',x,.62,.91,2)}
    }
    if(kind==='fireStation'){
      for(const x of [-.54,.54]){roundedBox(g,.62,.68,.07,'#4d6670',x,.54,.97,.035);for(let y=.3;y<=.76;y+=.23)roundedBox(g,.56,.028,.09,'#e4d3b1',x,y,.995,.012)}
      for(const x of [-.2,.2])sphere(g,.07,'#f4bd56',x,1.73,1.02,2);
    }
    if(kind==='factory'){
      const industry=b.business?.industryType||'food';
      for(const z of [-.55,.55]){pipe(g,[[.72,.32,z],[.72,.58,z],[.52,.73,z],[.52,.92,z]],'#88978d',.025);ring(g,.105,.016,'#d5c59c',.52,.92,z)}
      for(const x of [-.45,.45]){cylinder(g,.16,.19,.09,'#a6b3a9',x,1.08,-.51,12);cylinder(g,.11,.14,.04,'#d5c39e',x,1.14,-.51,12)}
      if(industry==='food'||industry==='textile'||industry==='metalworks')for(const x of [-.2,.2]){
        roundedBox(g,.3,.18,.08,industry==='metalworks'?'#81949a':'#6c9990',x,.33,.79,.025);
        for(const dz of [-.045,.045])roundedBox(g,.22,.018,.025,'#e1d1ad',x,.33,.84+dz,.009);
      }
    }
    if(['powerPlant','waterPlant','gasPlant','wastewaterPlant'].includes(kind)){
      const lineColor=kind==='waterPlant'||kind==='wastewaterPlant'?'#5eabb3':kind==='gasPlant'?'#d49a53':'#c49355';
      pipe(g,[[-.72,.23,.67],[-.72,.67,.67],[-.44,.67,.67],[.4,.67,.67],[.62,.34,.67]],lineColor,.031);
      for(const x of [-.47,0,.47]){cylinder(g,.045,.045,.055,'#667b79',x,.67,.69,10);ring(g,.07,.012,lineColor,x,.77,.69)}
      for(const x of [-.65,.65]){roundedBox(g,.19,.16,.08,'#697f7b',x,.28,.73,.025);ring(g,.055,.01,'#e3d7b8',x,.33,.78)}
      if(kind==='powerPlant')for(const x of [-.42,.42])for(let i=0;i<3;i++)roundedBox(g,.48,.035,.12,i===1?'#c49b57':'#8e9d98',x,.26+i*.08,.49,.015);
      if(kind==='waterPlant'||kind==='wastewaterPlant'){
        cylinder(g,.09,.09,.26,'#e7e6d7',.72,.32,-.48,12);
        for(let i=0;i<6;i++){const a=i*Math.PI/3;rodBetween(g,[.72,.46,-.48],[.72+Math.cos(a)*.22,.46+Math.sin(a)*.09,-.48+Math.sin(a)*.22],.009,'#d9eee7',6)}
      }
    }
    if(['depot','busGarage','airport','port','landfill','recyclingPlant'].includes(kind)){
      for(const z of [-.58,.58])for(let i=-2;i<=2;i++)roundedBox(g,.22,.025,.07,i%2?'#f4ead0':'#e7bb62',i*.24,.09,z,.012);
      for(const x of [-.72,.72]){roundedBox(g,.12,.24,.12,'#526a6a',x,1.15,.74,.025);sphere(g,.075,'#ffd68a',x,1.3,.74,2)}
      for(const x of [-.45,.45]){cylinder(g,.11,.12,.15,'#677a79',x,roofY+.06,-.52,12);ring(g,.12,.014,'#d3c6a7',x,roofY+.14,-.52)}
    }
    if(kind==='civic'){
      const badge=service.startsWith('police')?'#608eb0':service==='hospital'?'#cb7068':service==='clinic'?'#65a797':service==='cemetery'?'#afa18c':'#d2a86a';
      ring(g,.13,.028,badge,0,1.36,1.02);sphere(g,.065,badge,0,1.36,1.045,2);
      if(service.startsWith('police'))for(const x of [-.17,.17])roundedBox(g,.06,.34,.07,'#476f93',x,1.04,.99,.015);
    }
    for(const x of [-.78,.78]){
      roundedBox(g,.09,.26,.09,'#60736d',x,.48,.82,.025);
      roundedBox(g,.16,.07,.16,'#e8c77b',x,.64,.82,.03);
      sphere(g,.065,'#fff0c7',x,.68,.82,2);
    }
  }
  function businessColor(b){const kind=b.business?.industryType||b.serviceModel||'';return kind.includes('food')?'#79aa75':kind.includes('cafe')?'#c58b67':kind.includes('textile')?'#9b7daa':kind.includes('metal')?'#78969b':'#75a88d'}

  function premiumArchitecture(g,b){const type=b.kind,variant=Math.abs(b.x*13+b.y*19)%5;
    if(type==='shop'){
      const shade=['#b56854','#4b886d','#ca9456','#567e95','#b97672'][variant];
      for(let i=-3;i<=3;i++)box(g,.225,.12,.45,i%2?'#f7eee0':shade,i*.225,1.6,1.1);
      box(g,1.66,.045,.07,'#70564b',0,1.55,1.31);box(g,.5,.71,.06,'#94b7b4',0,.72,.86);box(g,.055,.68,.06,'#f4e7d1',0,.72,.9);
      for(const x of [-.72,.72])planter(g,x,1.05,variant%2?'#6d9d69':'#d496a9');
      for(const z of [-.38,.38])for(const side of [-1,1]){box(g,.055,.38,.28,'#eee1c6',side*.9,.78,z);box(g,.063,.29,.2,'#719ba1',side*.94,.78,z)}
    }else if(type==='factory'){
      const industry=b.business?.industryType||'food',roofColor={quarry:'#8e9189',concrete:'#7e9290',food:'#9b6c5a',sawmill:'#9a7b5b',metalworks:'#6f8690'}[industry]||'#899084';
      box(g,1.48,.07,1.48,roofColor,0,1.03,0);for(let i=-2;i<=2;i++)box(g,.04,.045,1.38,'#c3c4b4',i*.28,1.09,0);
      box(g,.36,.64,.075,'#657a7b',.52,.53,.72);for(let i=0;i<3;i++)box(g,.3,.07,.08,'#d9c8aa',.52,.35+i*.15,.77);
      if(industry==='concrete'){for(const z of [-.36,.3]){cylinder(g,.2,.2,1.25,'#bec9c6',.72,.74,z,12);cylinder(g,.24,.24,.07,'#e0e1d2',.72,1.4,z,12)}box(g,.08,.08,.9,'#879a9a',.45,1.52,-.03)}
      else if(industry==='quarry'){for(let i=0;i<3;i++){const rock=sphere(g,.24,'#a9a18e',-.5+i*.43,.28,.9,1);rock.scale.y=.6}}
      else if(industry==='sawmill'){for(let i=0;i<3;i++)cylinder(g,.12,.12,.78,'#9c7351',-.43+i*.27,.25,.84,10).rotation.z=Math.PI/2}
      else if(industry==='metalworks'){for(const x of [-.43,.43]){cylinder(g,.12,.15,.54,'#6d7779',x,1.39,-.35,12);cylinder(g,.16,.16,.065,'#b9bcb4',x,1.7,-.35,12)}}
      else{for(const x of [-.43,.43]){cylinder(g,.18,.18,.46,'#d4c9b7',x,1.33,-.33,12);cylinder(g,.21,.21,.06,'#efe4c9',x,1.59,-.33,12)}}
      for(let i=0;i<2;i++){box(g,.24,.19,.22,'#b58b59',-.6+i*.27,.18,.94);box(g,.26,.025,.24,'#d2ac6d',-.6+i*.27,.29,.94)}
    }else if(type==='civic'&&!b.serviceModel?.startsWith('police')){
      const hospital=b.serviceModel==='generalHospital',center=b.serviceModel==='medicalCenter';
      box(g,hospital?1.2:.8,.07,.48,'#f0e9d8',0,2.94,-.05);if(hospital||center){box(g,.69,hospital?.75:.43,.62,'#e1d9c8',-.48,hospital?3.34:3.19,-.18);box(g,.77,.08,.68,'#be7566',-.48,hospital?3.74:3.45,-.18)}
      for(const x of [-.7,.7])planter(g,x,1.1,'#69a275');
    }else if(type==='school'){
      const high=b.serviceModel==='university',secondary=b.serviceModel==='secondarySchool';
      if(high||secondary){box(g,.7,.54,.55,'#d8b794',0,high?3.17:2.47,-.18);box(g,.74,.08,.59,'#5d7778',0,high?3.48:2.78,-.18)}
      for(const x of [-.6,.6])planter(g,x,1.05,b.serviceModel==='kindergarten'?'#d6a36d':'#76a66b');
    }
  }
  const SERVICE_RADII={clinic:6,medicalCenter:10,generalHospital:16,socialShelter:8,policePost:6,policeStation:11,policeHQ:16,
    firePost:7,fireStationPlus:12,fireCommand:17,wasteYard:6,wasteDepot:11,wasteComplex:17,kindergarten:5,primarySchool:8,secondarySchool:12,university:17};
  function coverageRoads(start,radius,roads){
    if(!radius||!start||!Number.isInteger(start.x)||!Number.isInteger(start.y))return [];
    const points=[[start.x,start.y],[start.x+1,start.y],[start.x-1,start.y],[start.x,start.y+1],[start.x,start.y-1]]
      .filter(([x,y])=>roads.has(key(x,y)));
    if(!points.length)return [];
    const covered=new Map(),queue=[];
    for(const [x,y] of points){const k=key(x,y);if(!covered.has(k)){covered.set(k,0);queue.push([x,y,0])}}
    for(let i=0;i<queue.length;i++){
      const [x,y,d]=queue[i];if(d>=radius-1)continue;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const next=key(x+dx,y+dy);
        if(roads.has(next)&&!covered.has(next)){covered.set(next,d+1);queue.push([x+dx,y+dy,d+1])}
      }
    }
    return [...covered.keys()].map(p=>p.split(',').map(Number));
  }
  function showServiceCoverage(state,chosen,view,roads){
    const pick=view.servicePreview||chosen;
    if(!pick)return;
    const b=(state.buildings||[]).find(b=>b.x===pick.x&&b.y===pick.y)
      ||(state.projects||[]).find(p=>p.x===pick.x&&p.y===pick.y);
    const model=view.servicePreview?.serviceModel||b?.serviceModel;
    const radius=SERVICE_RADII[model]||(!b?.serviceModel&&b?.kind==='fireStation'?7:
      !b?.serviceModel&&b?.kind==='depot'?6:
      !b?.serviceModel&&b?.kind==='civic'&&b.name!=='Municipalidad'?6:
      !b?.serviceModel&&b?.kind==='school'?15:0);
    if(!radius)return;
    for(const [x,y]of coverageRoads(pick,radius,roads)){
      const [px,pz]=tilePos(x,y);
      const mesh=plane(dynamicRoot,TILE*.92,TILE*.92,mat('#43d485',{transparent:true,opacity:.52,depthWrite:false}),px,.125,pz);
      mesh.renderOrder=8;mesh.userData.serviceCoverage=true;mesh.userData.serviceRadius=radius;
    }
  }
  function refreshServiceCoverage(state,chosen,currentView,roads){
    for(const child of [...dynamicRoot.children])if(child.userData.serviceCoverage){dynamicRoot.remove(child);child.geometry?.dispose()}
    showServiceCoverage(state,chosen,currentView,roads);
  }
  function policeStationModel(g,level=1){
    const h=1.25+level*.49;
    box(g,1.82,h,1.65,'#8faebd',0,h/2+.08,0,{cast:true});
    box(g,1.96,.17,1.82,'#345b79',0,h+.16,0);
    for(let floor=0;floor<level;floor++)for(const x of [-.55,.55])
      box(g,.4,.25,.06,'#8ed0e6',x,.9+floor*.48,.85);
    box(g,.7,.73,.12,'#2e5976',0,.45,.91);
    box(g,1.12,.25,.1,'#f0e6ce',0,h+.23,.93);
    box(g,.28,.09,.08,'#426e9e',0,h+.29,1.0);
    box(g,.17,.09,.08,'#c95751',-.19,h+.29,1.0);
  }

  // Segunda capa arquitectónica coherente para todas las tipologías, con LOD en móvil.
  function finishArchitecture(g,b){
    const kind=b.kind,hash=Math.abs(b.x*17+b.y*31),isCivic=['civic','school','fireStation','depot','busGarage','landfill','recyclingPlant','waterPlant','wastewaterPlant','powerPlant'].includes(kind);
    const wall=['#f2d4cf','#e6d9c4','#d5dfe0','#d5dbc7','#f1d9b8'][hash%5];
    // Umbral de entrada, marquesina, dos faroles y canteros que permiten distinguir una fachada habitable.
    if(kind!=='home'&&!['road','landfill','recyclingPlant','airport','port'].includes(kind)){
      box(g,.72,.07,.36,'#d0bdab',0,.13,.93,{cast:false});
      for(const x of [-.72,.72]){
        box(g,.075,.09,.37,'#d7c7b5',x,.17,.82,{cast:false});
        sphere(g,.16,hash%2?'#7ba68c':'#b88eaa',x,.28,.86,1);
      }
    }
    if(kind==='shop'||kind==='hotel'){
      const h=kind==='hotel'?3.12:2.25;
      for(const x of [-.64,.64]){box(g,.07,.7,.08,'#e9e1d2',x,.54,.9);box(g,.12,.13,.1,'#ffdfb4',x,1.23,.92)}
      box(g,1.28,.08,.57,hash%2?'#d79d9f':'#9eb5bb',0,h-.42,.95);
      for(let i=-2;i<=2;i++)box(g,.21,.035,.34,wall,i*.255,h-.42,1.09,{cast:false});
    }else if(kind==='factory'){
      const industry=b.business?.industryType||'food';
      if(industry==='concrete'){
        const drum=cylinder(g,.41,.41,.84,'#d2bbc0',.52,.6,.48,16);drum.rotation.z=Math.PI/2;
        cylinder(g,.46,.46,.08,'#87999e',.06,.6,.48,16).rotation.z=Math.PI/2;
        box(g,.85,.14,.15,'#a4a4a0',.37,.29,.52);
      }else if(industry==='quarry'){
        for(let i=0;i<3;i++){const h=.27+i*.12;const pile=new THREE.Mesh(new THREE.ConeGeometry(.3+i*.035,h,7),mat('#c6ab8d'));pile.position.set(-.5+i*.48,h/2+.1,.65);g.add(pile)}
      }else if(industry==='sawmill'){
        for(let i=0;i<4;i++)box(g,.68,.10,.13,'#bc8c6e',-.42+i*.08,.26+i*.1,.73);
      }else if(industry==='metalworks'){
        for(let i=0;i<3;i++){cylinder(g,.12,.12,.42,'#8b9aa0',-.5+i*.23,.35,.65,10);box(g,.19,.07,.21,'#b8b8af',-.5+i*.23,.6,.65)}
      }else{cylinder(g,.28,.29,.85,'#e9d6c2',.55,.52,.5,16);box(g,.65,.08,.6,'#b5c4b8',.48,.99,.45)}
      box(g,.8,.22,.07,'#faf2e8',0,1.14,.77);
      box(g,.13,.09,.08,'#d8a4aa',.35,1.15,.83);
    }else if(kind==='school'){
      for(let i=-1;i<=1;i++){box(g,.3,.12,.21,'#acc5be',i*.48,.20,.91);sphere(g,.12,'#d8a5b0',i*.48,.36,1.05,1)}
      if(b.serviceModel==='kindergarten')for(const x of [-.48,.48])sphere(g,.22,x<0?'#e5b473':'#99bfbb',x,.35,1.2,1);
      if(b.serviceModel==='university'){for(const x of [-.75,.75])box(g,.12,1.3,.12,'#e9e0d1',x,.7,1.04)}
    }else if(kind==='civic'){
      box(g,1.1,.09,.32,'#f8f1e9',0,1.18,.92);
      for(const x of [-.47,.47])box(g,.11,.65,.12,'#e1d3c8',x,.72,1.0);
      if(b.serviceModel?.startsWith('police')){box(g,.12,.7,.12,'#416b90',.62,1.08,.8);sphere(g,.16,'#567cab',.62,1.51,.8,1)}
      else{box(g,.16,.48,.06,'#d36c83',0,1.32,1.0);box(g,.5,.14,.06,'#d36c83',0,1.33,1.0)}
    }else if(kind==='fireStation'){
      box(g,.65,.08,.29,'#e8e4d8',0,1.53,.92);
      for(const x of [-.55,.55])sphere(g,.12,'#d66c61',x,1.54,.95,1);
    }else if(kind==='depot'||kind==='busGarage'){
      box(g,1.25,.1,.42,'#c4d0c8',0,1.5,.83);
      for(const x of [-.48,.48])box(g,.2,.13,.08,'#e4ad8e',x,.46,.97);
    }else if(kind==='powerPlant'||kind==='waterPlant'||kind==='wastewaterPlant'){
      box(g,1.25,.08,.22,'#e2d9c7',0,1.11,.81);
      for(const x of [-.4,.4])cylinder(g,.06,.07,.24,'#8ea4a4',x,.18,.89);
    }else if(isCivic){
      box(g,.86,.1,.27,'#e4c0b2',0,.31,.85);
    }else if(kind==='port'||kind==='airport'){
      for(const x of [-.63,.63]){box(g,.05,.71,.05,'#6d848b',x,.42,.75);sphere(g,.1,'#fff1c9',x,.81,.75,1)}
    }
    // Sistema de iluminación: luces visibles sin emitir luz real por cada objeto (performance).
    if(!smallScreen&&kind!=='landfill'&&kind!=='recyclingPlant'){
      sphere(g,.085,'#f8d2ac',-.78,.55,-.73,1);
    }
  refinedArchitecture(g,b);}
  function funeralFacility(g,type){
    if(type==='cemetery'){
      box(g,1.78,.08,1.78,'#8da77a',0,.09,0,{cast:false});
      box(g,.48,.7,.42,'#d7d0bb',0,.49,-.58);box(g,.58,.1,.5,'#766c5b',0,.9,-.58);
      box(g,.26,.56,.24,'#eee8d7',-.56,.36,.18);box(g,.26,.56,.24,'#eee8d7',-.18,.18,.55);box(g,.26,.56,.24,'#eee8d7',.52,.27,.28);box(g,.26,.56,.24,'#eee8d7',.15,.23,-.02);
      for(const [x,z] of [[-.9,-.9],[.9,-.9],[-.9,.9],[.9,.9]])cylinder(g,.035,.035,.23,'#b8a987',x,.18,z,4);
      box(g,.56,.035,.13,'#c5b890',0,.13,.76,{cast:false});return
    }
    box(g,1.5,.82,1.26,'#d9d9cc',0,.54,0);box(g,1.58,.11,1.33,'#728a83',0,1.02,0);box(g,.6,.52,.16,'#eee7d5',0,.37,.66);
    cylinder(g,.13,.16,1.45,'#8b8a7e',.46,1.72,-.35,8);cylinder(g,.16,.17,.16,'#af7251',.46,2.5,-.35,8);
    box(g,.55,.06,.42,'#9baf9d',-.52,.12,.62,{cast:false});
  }
  // Edificios ferroviarios físicos visibles desde la colocación de los cimientos.
  function railStationModel(g,mode='metro',progress=1,freightRoles=[]){
    const elevated=mode==='elevated',done=progress>=1;
    box(g,1.82,.12,1.8,'#c3c5b5',0,.045,0,{cast:false});
    if(elevated){
      // Estación ferroviaria elevada: pilares, escaleras, plataforma y cubierta.
      for(const x of [-.62,.62])for(const z of [-.48,.48])box(g,.2,1.54,.2,'#9aa7a6',x,.79,z,{cast:true});
      box(g,1.78,.18,1.46,'#667f82',0,1.63,0,{cast:true});
      box(g,1.74,.075,.82,'#ded8bd',0,1.75,.24);
      // Escalera visible en la entrada principal.
      for(let i=0;i<6;i++)box(g,.56,.08,.18,'#c8d2c5',0,.18+i*.247,.78-i*.14,{cast:true});
      for(const z of [-.38,.38])box(g,1.61,.08,.07,'#e3ca7c',0,1.78,z);
      if(done){
        for(const x of [-.71,.71])for(const z of [-.48,.48])box(g,.08,.65,.08,'#427585',x,2.16,z);
        box(g,1.84,.12,1.35,'#336c7a',0,2.53,0,{cast:true});
        box(g,1.24,.26,.09,'#f2ead0',0,2.34,.67);
        box(g,.44,.22,.04,'#2d6878',0,2.34,.731);
        if(freightRoles.includes('industrial')){
          box(g,.34,.22,.28,'#ba8454',-.47,1.91,-.18,{cast:true});
          box(g,.31,.2,.26,'#6d9879',.43,1.9,-.19,{cast:true});
        }
        if(freightRoles.includes('port')){
          box(g,.09,.78,.09,'#b6784a',.84,2.94,-.28,{cast:true});
          box(g,.88,.08,.09,'#b6784a',.42,3.3,-.28,{cast:true});
          box(g,.1,.46,.1,'#b6784a',.06,3.05,-.28,{cast:true});
          box(g,.25,.13,.22,'#d3a05c',.06,2.77,-.28,{cast:true});
        }
      }
    }else{
      // Subte: edificio de acceso y marquesina; el túnel real queda bajo tierra.
      box(g,1.46,.12,1.26,'#777c73',0,.13,0,{cast:true});
      box(g,.9,.06,.66,'#263b44',0,.23,.21);
      for(const x of [-.54,.54])box(g,.115,1.18,.12,'#3d7787',x,.75,-.3,{cast:true});
      box(g,1.28,.16,.96,'#406c7d',0,1.39,-.24,{cast:true});
      for(const z of [-.47,.33])box(g,1.12,.37,.09,'#b4dfdf',0,1.06,z);
      if(done){
        box(g,1.19,.28,.08,'#e0ece7',0,1.26,.29);
        box(g,.42,.29,.085,'#2d8e97',0,1.26,.344);
        for(const x of [-.7,.7])cylinder(g,.07,.07,.68,'#566e75',x,.41,.58,8);
      }
    }
    if(!done){
      for(const x of [-.75,.75])for(const z of [-.74,.74])box(g,.07,1.05,.07,'#dd9d43',x,.59,z);
      for(const z of [-.74,.74])box(g,1.56,.06,.06,'#dd9d43',0,1.11,z);
      box(g,1.23,.12,.17,'#e7bd5c',0,.21,.76);
    }
    
    // Marquesina con costillas, barandas, luminarias y mobiliario de espera.
    const canopyY=elevated?(done?2.64:1.88):1.52;
    roundedBox(g,1.9,.09,1.68,elevated?'#315f70':'#3c7380',0,canopyY,0,.035);
    roundedBox(g,1.74,.035,1.52,'#d9cda9',0,canopyY-.065,0,.012);
    for(const x of [-.78,-.39,0,.39,.78]){
      rodBetween(g,[x,canopyY-.08,-.69],[x,canopyY-.08,.69],.012,'#758a87',6);
    }
    for(const z of [-.65,.65]){
      roundedBox(g,1.74,.05,.07,'#e2c993',0,elevated?1.79:.39,z,.014);
      for(const x of [-.68,-.34,0,.34,.68])rodBetween(g,[x,elevated?1.82:.42,z],[x,elevated?1.98:.66,z],.012,'#6b8587',6);
    }
    for(const x of [-.63,.63]){
      roundedBox(g,.38,.17,.22,'#826c55',x,elevated?1.85:.32,.35,.035);
      for(const dx of [-.14,.14])rodBetween(g,[x+dx,elevated?1.77:.23,.28],[x+dx,elevated?2.02:.47,.28],.016,'#566b68',6);
      roundedBox(g,.13,.22,.09,'#e9cb7b',x,elevated?2.16:.92,.69,.025);
      sphere(g,.055,'#fff0bd',x,elevated?2.27:1.03,.69,2);
    }
    roundedBox(g,.46,.34,.08,done?'#33768b':'#d19a49',0,elevated?2.2:.97,.77,.035);
    roundedBox(g,.32,.19,.025,'#e7ecdf',0,elevated?2.2:.97,.82,.012);
  return g;
  }
  function digitalUtilityBuilding(g,kind){
    const tv=kind==='tvHeadend',accent=tv?'#4b86a4':'#4baaa1';
    box(g,1.58,1.45,1.36,'#b3c6c2',0,.77,0,{cast:true});
    box(g,1.66,.14,1.44,accent,0,1.58,0,{cast:true});
    box(g,1.12,.7,.12,'#304b5a',0,.94,.72);
    for(const x of [-.42,0,.42])box(g,.28,.38,.035,'#7bdbd7',x,.98,.79);
    box(g,.86,.31,.09,'#f4ebca',0,1.4,.75);
    if(tv){cylinder(g,.06,.07,1.14,'#536b76',.4,2.19,0,8);
      cylinder(g,.47,.47,.055,'#d7e7de',.4,2.8,0,12);box(g,.06,.48,.06,'#587987',.4,2.78,.23)}
    else{cylinder(g,.09,.09,1.45,'#4e7280',0,2.38,0,10);
      for(const h of [2.5,2.9,3.25]){const ring=new THREE.Mesh(new THREE.TorusGeometry(h===3.25?.16:.3,.032,6,14),mat('#9ee4d5'));ring.rotation.x=Math.PI/2;ring.position.set(0,h,0);g.add(ring)}
    }
  }
  function shouldUseFarBuildingLOD(){
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return view.zoom<.72;
    const corners=[[0,0],[w,0],[0,h],[w,h]].map(([x,y])=>screenToTile(x,y)),xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);
    return Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))+6>62||view.zoom<.72;
  }
  function addBuilding(root,b,roads,renewalKeys){const [cx,cz]=tilePos(b.x,b.y),g=new THREE.Group();g.position.set(cx,0,cz);if(roads.has(key(b.x,b.y-1)))g.rotation.y=Math.PI;else if(roads.has(key(b.x+1,b.y)))g.rotation.y=Math.PI/2;else if(roads.has(key(b.x-1,b.y)))g.rotation.y=-Math.PI/2;g.rotation.y+=(Number(b.rotation)||0)*Math.PI/2;root.add(g);
    if(!view.preview&&shouldUseFarBuildingLOD()){
      if(b.serviceModel==='urbanPark'){box(g,1.82,.06,1.82,'#79a773',0,.03,0,{cast:false});return}if(b.serviceModel==='parkingGarage'){box(g,1.4,.82,1.32,'#86a69e',0,.44,0,{cast:false});for(let y=.2;y<.9;y+=.33)box(g,1.45,.05,1.38,'#3e5554',0,y,0,{cast:false});return}
      const colors=b.kind==='home'?['#d6c2a1','#8a6c56']:b.kind==='shop'?['#d7c29f','#557886']:b.kind==='factory'?['#9eaea2','#50696c']:b.kind==='school'?['#d3cfac','#49767b']:b.kind==='civic'?['#d8d1b8','#5c7a80']:['#c7c1ab','#6b7773'];
      const h=b.kind==='home'?.52+clamp(Number(b.level)||1,1,4)*.16:b.kind==='shop'?1.02:b.kind==='office'?1.6:b.kind==='factory'?1.18:1.12;
      box(g,1.28,.06,1.28,'#b5aa8e',0,.03,0,{cast:false});
      box(g,1.04,h,.96,colors[0],0,.08+h/2,0,{cast:false});
      box(g,1.18,.11,1.08,colors[1],0,.13+h,0,{cast:false});
      return
    }
    if(b.serviceModel==='urbanPark'){urbanPark(g);return}groundShadow(g,0,0,1.25,.17);box(g,1.96,.055,1.96,'#d9ceb0',0,.025,0,{cast:false});if(b.name==='Municipalidad')townHall(g);else if(b.kind==='civic'&&['tvHeadend','wifiHub'].includes(b.serviceModel))digitalUtilityBuilding(g,b.serviceModel);else if(b.kind==='civic'&&['policePost','policeStation','policeHQ'].includes(b.serviceModel))policeStationModel(g,b.serviceModel==='policeHQ'?3:b.serviceModel==='policeStation'?2:1);else if(b.kind==='civic'&&b.serviceModel==='socialShelter')socialShelter(g);else if(b.kind==='civic'&&['cemetery','crematorium'].includes(b.serviceModel))funeralFacility(g,b.serviceModel);else if(b.kind==='civic'&&b.serviceModel==='parkingGarage')parkingGarage(g,b);else if(b.kind==='civic')clinic(g);else if(b.kind==='school'){school(g);if(b.serviceModel==='kindergarten'){for(const x of [-.5,.5])sphere(g,.2,'#e9b35e',x,.3,1.05,1)}else if(b.serviceModel==='secondarySchool'||b.serviceModel==='university'){const high=b.serviceModel==='university';box(g,1.4,high?1.18:.52,1,'#c5cec2',0,high?2.35:1.93,-.2,{cast:true});box(g,1.52,.1,1.12,high?'#446b8b':'#577d72',0,high?3.01:2.27,-.2);if(high)cylinder(g,.14,.16,.35,'#e8c17e',0,3.26,-.2)}}else if(b.kind==='fireStation'){fireStation(g);if(b.serviceModel==='fireStationPlus'||b.serviceModel==='fireCommand')box(g,1.3,.33,.75,'#a4614d',0,1.49,-.27);if(b.serviceModel==='fireCommand')box(g,.7,.5,.55,'#ceae86',0,1.93,-.27)}else if(b.kind==='depot'){if(b.serviceModel==='taxiYard')taxiDepot(g);else depot(g);if(b.serviceModel==='wasteDepot'||b.serviceModel==='wasteComplex')box(g,1.3,.3,.7,'#607d71',0,1.97,-.2);if(b.serviceModel==='wasteComplex')box(g,.8,.35,.5,'#7b9e8b',0,2.29,-.22)}else if(b.kind==='landfill')landfillFacility(g);else if(b.kind==='recyclingPlant')recyclingFacility(g);else if(b.kind==='port')portTerminal(g);else if(b.kind==='airport')airportTerminal(g);else if(b.kind==='hotel')hotel(g,b);else if(b.kind==='powerPlant')powerPlant(g);else if(b.kind==='waterPlant')waterPlant(g);else if(b.kind==='gasPlant')gasPlant(g);else if(b.kind==='wastewaterPlant')wastewaterPlant(g);else if(b.kind==='busGarage')busGarage(g);else if(b.kind==='busStop')busShelter(g);else if(b.kind==='shop')shop(g,b);else if(b.kind==='factory')factory(g,b);else if(b.kind==='office')office(g,b);else house(g,b);finishArchitecture(g,b);if(!view.preview&&view.zoom>=1.4)premiumArchitecture(g,b);if(!view.preview)spectacle.decorateBuilding(g,b);if(b.kind==='home'){sphere(g,.23,'#448c62',-.82,.31,.73,1);sphere(g,.2,'#5b9c68',.82,.28,-.6,1)}if(b.heritageEligible){const protectedSite=['protección parcial','protección integral'].includes(b.heritageLevel),integral=b.heritageLevel==='protección integral',plaque=integral?'#a96b3e':protectedSite?'#568c69':'#a68b50';box(g,.34,.38,.07,'#e7d7b6',.62,1.58,.85);box(g,.27,.3,.08,plaque,.62,1.58,.9);sphere(g,.075,integral?'#f3ca72':protectedSite?'#b5dc9a':'#e6ce82',.62,1.59,.96,1);if(protectedSite)box(g,1.64,.045,.08,integral?'#bc8050':'#759f70',0,2.05,0)}if((b.urbanCondition??100)<60||renewalKeys.has(key(b.x,b.y))){const active=renewalKeys.has(key(b.x,b.y)),frame=active?'#d69a4e':'#9e9c88';for(const x of [-.98,.98])for(const z of [-.91,.91])box(g,.065,3.1,.065,frame,x,1.55,z,{cast:false});for(const y of [.55,1.65,2.75]){box(g,2.04,.055,.055,frame,0,y,.93,{cast:false});box(g,.055,.055,1.96,frame,.98,y,0,{cast:false})}for(const y of [.9,2.05])box(g,.055,1.1,.055,frame,0,y,.95,{cast:false});if(active)box(g,.28,.28,.055,'#edbd63',.81,2.94,.97,{cast:false})}if((b.backupCapacityKw||0)>0){box(g,.42,.24,.34,'#56656a',.68,.15,.66);box(g,.18,.06,.36,(b.backupFuelKwh||0)>0?'#e0a342':'#b64d48',.68,.3,.66);box(g,.045,.16,.045,'#343e41',.77,.4,.66)} }
  function syncBuildingModels(buildings,roads,renewalKeys){
    const farLOD=!view.preview&&shouldUseFarBuildingLOD(),detailLOD=!view.preview&&view.zoom>=1.4,active=new Set();
    for(const b of buildings){
      const id=key(b.x,b.y),signature=JSON.stringify([b.x,b.y,b.kind,b.name,b.serviceModel,b.level,b.density,b.parkingOccupied,b.rotation,b.architecturalStyle,b.urbanCondition,b.heritageEligible,b.heritageLevel,b.backupCapacityKw,b.backupFuelKwh,b.business?.status,b.business?.lastSales,roads.has(key(b.x,b.y-1)),roads.has(key(b.x+1,b.y)),roads.has(key(b.x-1,b.y)),renewalKeys.has(id),farLOD,detailLOD,view.preview]);active.add(id);
      const cached=buildingModels.get(id);if(cached?.signature===signature)continue;
      if(cached){buildingRoot.remove(cached.model);clear(cached.model)}
      const temporary=new THREE.Group();addBuilding(temporary,b,roads,renewalKeys);const model=temporary.children[0];if(model){temporary.remove(model);buildingRoot.add(model);buildingModels.set(id,{signature,model})}else buildingModels.delete(id)
    }
    for(const [id,cached] of buildingModels)if(!active.has(id)){buildingRoot.remove(cached.model);clear(cached.model);buildingModels.delete(id)}
  }
  function addSite(root,p,abandoned=false){const [x,z]=tilePos(p.x,p.y),g=new THREE.Group();g.position.set(x,0,z);root.add(g);const progress=clamp(p.progress||0,0,1),steel=abandoned?'#8b786c':'#c28a52',concrete=abandoned?'#91867e':'#c7bca9';box(g,1.94,.065,1.94,abandoned?'#a58b75':'#bf9d72',0,.03,0,{cast:false});
    if(p.kind==='road'){box(g,1.55,.09,.98,abandoned?'#76706a':progress>.6?'#647577':'#a48767',0,.09,0,{cast:false});for(const zz of [-.7,.7])for(const xx of [-.64,.64]){box(g,.25,.25,.19,'#e2a55d',xx,.2,zz);box(g,.13,.06,.19,'#eee2c2',xx,.34,zz)}
      for(const [xx,zz] of [[-.62,-.7],[.62,-.7],[-.62,.7],[.62,.7]]){
        roundedBox(g,.12,.14,.12,'#d39a50',xx,.39,zz,.025);
        for(const yy of [.36,.42])roundedBox(g,.14,.025,.14,'#f5e8c8',xx,yy,zz,.008);
      }
      roundedBox(g,.34,.07,.18,'#536e70',0,.18,.02,.025);
      for(let i=-1;i<=1;i++)roundedBox(g,.1,.1,.02,i===0?'#e8bc62':'#d66356',i*.11,.23,.12,.018);
      return}
    box(g,1.55,.14,1.38,concrete,0,.16,0);for(const xx of [-.82,.82])for(const zz of [-.76,.76]){box(g,.055,1.15,.055,steel,xx,.58,zz);box(g,.19,.35,.19,'#d6a560',xx,.22,zz)}
    if(progress>.15||abandoned){const levels=progress>.7?3:progress>.38?2:1;for(let level=0;level<levels;level++){const top=.43+level*.74;for(const xx of [-.63,.63])for(const zz of [-.55,.55])box(g,.105,.72,.105,concrete,xx,top+.37,zz,{cast:true});box(g,1.43,.10,1.29,'#ded2b7',0,top+.74,0,{cast:true});for(const zz of [-.67,.67])box(g,1.45,.08,.06,'#e7d9bc',0,top+.76,zz)}}
    if(progress>.45||abandoned){for(const xx of [-.81,.81])for(const zz of [-.75,.75])box(g,.055,2.8,.055,steel,xx,1.4,zz);for(const yy of [.75,1.58,2.44])for(const zz of [-.75,.75])box(g,1.68,.05,.05,steel,0,yy,zz)}
    if(progress>.25&&!smallScreen){box(g,.075,3.1,.075,'#c49454',.94,1.55,-.72);box(g,1.2,.07,.08,'#c49454',.37,3.1,-.72);box(g,.05,.45,.05,'#7d7060',-.19,2.85,-.72);box(g,.28,.08,.2,'#a27d59',-.19,2.59,-.72)}
    for(let i=0;i<3;i++){box(g,.32,.07,.2,i===2?'#d4b582':'#ae825a',-.55+i*.28,.19,.76);box(g,.31,.14,.04,'#d2ad70',-.55+i*.28,.28,.76)}
  
    const top=progress>.7?2.58:progress>.38?1.84:.98;
    for(const zz of [-.75,.75])for(const yy of [.62,1.34,2.06])if(yy<top+.1){
      rodBetween(g,[-.81,yy-.3,zz],[.81,yy+.3,zz],.018,steel,7);
      rodBetween(g,[.81,yy-.3,zz],[-.81,yy+.3,zz],.018,steel,7);
    }
    for(const zz of [-.73,.73])for(let i=0;i<3;i++){
      const xx=-.47+i*.47,yy=Math.min(top-.1,.82+i*.68);
      roundedBox(g,.27,.29,.045,i===1?'#80a6a5':'#a9b5ac',xx,yy,zz>0?.73:-.73,.018);
      roundedBox(g,.31,.035,.07,'#e2d8c4',xx,yy+.16,zz>0?.76:-.76,.01);
    }
    for(let i=0;i<4;i++){
      roundedBox(g,.36,.1,.27,i%2?'#bf976c':'#d1b389',-.64+i*.39,.2,.8,.025);
      for(const dx of [-.12,.12])roundedBox(g,.025,.13,.03,'#9b7959',-.64+i*.39+dx,.3,.8,.008);
    }
    pipe(g,[[-.8,.18,.55],[-.46,.2,.55],[-.46,.35,.55],[.02,.35,.55]],'#6f99a0',.018);
    for(const x of [-.88,.88]){
      roundedBox(g,.14,.12,.14,'#526c67',x,.12,.74,.025);
      cylinder(g,.085,.1,.14,'#d69e4e',x,.24,.74,10);
      ring(g,.055,.01,'#f4e5bc',x,.32,.74);
    }
    if(progress>.18){roundedBox(g,.31,.22,.12,'#b84e43',-.8,.18,-.78,.02);for(let i=0;i<3;i++)roundedBox(g,.035,.23,.14,'#f4ddbe',-.86+i*.1,.19,-.71,.008)}
}
  function addSelection(root,chosen){if(!chosen)return;const [x,z]=tilePos(chosen.x,chosen.y);const fill=plane(root,1.92,1.92,mat('#fff5ad',{transparent:true,opacity:.24,depthWrite:false}),x,.11,z);fill.renderOrder=5;line(root,[[x-.98,.13,z-.98],[x+.98,.13,z-.98],[x+.98,.13,z+.98],[x-.98,.13,z+.98],[x-.98,.13,z-.98]],'#fff0a3',1);for(const [dx,dz] of [[-.96,-.96],[.96,-.96],[-.96,.96],[.96,.96]]){roundedBox(root,.17,.055,.17,'#fff0a3',x+dx,.14,z+dz,.025);sphere(root,.055,'#f7d579',x+dx,.2,z+dz,2)}}
  function shortestPath(roads,start){const queue=[start],seen=new Map([[start,null]]);for(let i=0;i<queue.length;i++){const k=queue[i],p=k.split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const next=key(p[0]+dx,p[1]+dy);if(roads.has(next)&&!seen.has(next)){seen.set(next,k);queue.push(next)}}}return {last:queue.at(-1),seen}}
  function buildRoute(roads){const keys=[...roads];if(keys.length<2)return [];const first=shortestPath(roads,keys[0]).last,{last,seen}=shortestPath(roads,first),out=[];for(let k=last;k!=null;k=seen.get(k)){const [x,y]=k.split(',').map(Number);out.push(tilePos(x,y))}return out.reverse()}
  function cityEntryRoute(roads){const start=key(4,10);if(!roads.has(start))return [[4,10]];const queue=[start],previous=new Map([[start,null]]),distance=new Map([[start,0]]);for(let i=0;i<queue.length;i++){const current=queue[i],[x,y]=current.split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const next=key(x+dx,y+dy);if(roads.has(next)&&!previous.has(next)){previous.set(next,current);distance.set(next,distance.get(current)+1);queue.push(next)}}}const targets=[...distance.keys()].filter(k=>k!==start).sort((a,b)=>distance.get(b)-distance.get(a)||a.localeCompare(b));const target=targets[0]||start,path=[];for(let k=target;k;k=previous.get(k)){const [x,y]=k.split(',').map(Number);path.push([x,y])}return path.reverse()}

  function vehicleFinish(g,style){
    const hub=(x,z,y,r)=>{const h=cylinder(g,r*.46,r*.46,.026,'#c5c9b9',x,y,z,12);h.rotation.z=Math.PI/2;ring(g,r*.48,.012,'#e0c98b',x+(x<0?-.019:.019),y,z,{rotationY:Math.PI/2})};
    const lamp=(x,y,z,c)=>roundedBox(g,.085,.05,.03,c,x,y,z,.018);
    if(style==='car'){
      roundedBox(g,.27,.15,.34,'#87b2b5',0,.39,-.04,.045);
      roundedBox(g,.36,.052,.06,'#3b4849',0,.18,.39,.018);roundedBox(g,.17,.13,.035,'#435b61',0,.255,.365,.02);
      for(const x of [-.15,-.05,.05,.15])roundedBox(g,.018,.014,.015,'#c9d8cf',x,.255,.387,.004);
      lamp(-.145,.28,.357,'#ffe9af');lamp(.145,.28,.357,'#ffe9af');
      roundedBox(g,.22,.025,.035,'#59696a',0,.18,-.36,.01);
      for(const x of [-.21,.21]){rodBetween(g,[x,.34,.02],[x*1.18,.39,.02],.012,'#4e6466',6);roundedBox(g,.045,.035,.045,'#e5d8bd',x*1.19,.39,.035,.012);roundedBox(g,.025,.09,.035,'#cfc9b7',x,.34,.12,.008)}
      for(const x of [-.22,.22])for(const z of [-.23,.23])hub(x,z,.13,.09);
      roundedBox(g,.13,.028,.018,'#f4e8cf',0,.18,.4,.006);
      g.userData.headlightOffsets=[[-.20,.25,.39],[.20,.25,.39]];
    }else if(style==='delivery'||style==='truck'||style==='service'){
      roundedBox(g,.25,.16,.2,'#a8ccca',0,.31,.35,.035);
      roundedBox(g,.36,.055,.07,'#3a4847',0,.19,.42,.015);
      for(const x of [-.13,-.065,0,.065,.13])roundedBox(g,.022,.018,.015,'#d7d5c9',x,.27,.368,.006);
      lamp(-.13,.27,.37,'#fff0b8');lamp(.13,.27,.37,'#fff0b8');
      g.userData.headlightOffsets=[[-.13,.27,.39],[.13,.27,.39]];
      for(const x of [-.22,.22]){roundedBox(g,.055,.06,.09,'#e0d5bd',x,.41,.36,.016);roundedBox(g,.12,.025,.035,'#ce644e',x,.22,-.39,.008);for(const z of [-.28,.32])hub(x,z,.14,.09)}
      for(let z=-.29;z<=.14;z+=.14)roundedBox(g,.34,.018,.018,'#e2c58d',0,.3,z,.006);
      roundedBox(g,.3,.025,.06,'#7d8e85',0,.41,-.43,.012);
    }else if(style==='bus'){
      roundedBox(g,.43,.22,.045,'#80b9c0',0,.45,.59,.04);
      for(const x of [-.329,.329])for(const z of [-.3,-.05,.2]){roundedBox(g,.035,.23,.22,'#dce9dd',x,.43,z,.01);roundedBox(g,.035,.025,.24,'#e6d8b9',x,.56,z,.008)}
      roundedBox(g,.4,.05,.035,'#2f5058',0,.72,-.02,.012);
      for(const x of [-.25,.25]){cylinder(g,.13,.13,.1,'#788b89',x,.7,-.04,12);roundedBox(g,.12,.025,.12,'#e8c574',x,.76,-.04,.012)}
      for(const x of [-.32,.32])for(const z of [-.38,.37])hub(x,z,.13,.105);
      roundedBox(g,.19,.035,.03,'#f5df9c',0,.69,.48,.01);
    }else if(style==='garbage'||style==='fire'||style==='emergency'){
      if(style==='emergency'){roundedBox(g,.3,.055,.1,'#345563',0,.58,.03,.02);roundedBox(g,.12,.06,.08,'#d94b45',-.09,.62,.03,.018);roundedBox(g,.12,.06,.08,'#4c89bb',.09,.62,.03,.018)}
      if(style==='garbage')for(const x of [-.37,.02,.38])roundedBox(g,.035,.32,.22,'#8db29a',x,.36,-.2,.015);
      if(style==='fire')for(const x of [-.29,.29]){const reel=cylinder(g,.1,.1,.045,'#d5c6a7',x,.47,-.12,12);reel.rotation.z=Math.PI/2;ring(g,.08,.012,'#e4dfc7',x+(x<0?-.03:.03),.47,-.12,{rotationY:Math.PI/2})}
      if(style!=='emergency')for(const x of [-.31,.31])for(const z of [-.2,.22])hub(x,z,.15,.105);
      for(const x of [-.13,.13])lamp(x,.52,.16,style==='fire'?'#fff0af':'#ffe7ac');
      roundedBox(g,.19,.05,.06,style==='fire'?'#f2d27e':'#d5c9ae',0,.73,0,.014);
      for(const z of [-.22,.23])roundedBox(g,.08,.04,.04,'#f3dc9a',0,.26,z,.012);
    }else if(style==='forklift'){
      for(const x of [-.23,.23])for(const z of [-.15,.18])hub(x,z,.14,.09);
      roundedBox(g,.29,.045,.12,'#d78e36',0,.31,.1,.018);
      for(const x of [-.1,.1])rodBetween(g,[x,.18,.29],[x,.63,.29],.013,'#34484a',7);
      roundedBox(g,.12,.035,.38,'#e7d8ad',0,.1,.55,.012);
    }else if(style==='walker'){
      roundedBox(g,.16,.25,.12,'#f0d3a7',-.1,.31,.01,.04);
      for(const x of [-.085,.085]){
        rodBetween(g,[x,.23,0],[x*1.1,.06,.025],.034,'#344a4d',8);
        roundedBox(g,.075,.035,.12,'#38444a',x*1.1,.035,.045,.018);
        rodBetween(g,[x*.7,.38,0],[x*1.55,.21,.02],.025,'#efc9a4',7);
      }
      sphere(g,.08,'#56483f',0,.55,-.015,1);sphere(g,.024,'#d87967',0,.46,.045,2);
    }else if(style==='bicycle'){
      for(const z of [-.23,.23])for(let i=0;i<8;i++){const a=i*Math.PI/4;rodBetween(g,[0,.15,z],[Math.cos(a)*.13,.15+Math.sin(a)*.13,z],.006,'#b7c3b7',5)}
      roundedBox(g,.13,.04,.075,'#584d42',0,.33,-.04,.018);
      rodBetween(g,[0,.2,.08],[0,.4,.08],.018,'#3b5755',6);
      for(const z of [-.23,.23])ring(g,.025,.008,'#d1bd85',0,.15,z,{rotationX:Math.PI/2});
    }else if(style==='ship'){
      for(const z of [-.28,.28]){for(let i=0;i<=5;i++)rodBetween(g,[-.57+i*.23,.35,z],[-.57+i*.23,.52,z],.012,'#e4d8bc',6);rodBetween(g,[-.57,.48,z],[.58,.48,z],.014,'#d9ccb0',6)}
      for(let i=0;i<4;i++){const x=-.45+i*.3;cylinder(g,.045,.045,.02,'#d9e0d3',x,.8,.18,10);roundedBox(g,.12,.03,.015,'#815e49',x,.66,.14,.006)}
      roundedBox(g,.34,.12,.06,'#d9ded0',-.35,.89,.02,.018);
      for(const x of [-.44,-.25])roundedBox(g,.035,.16,.035,'#6b7780',x,.92,.07,.009);
    }else if(style==='plane'){
      for(const x of [-.34,.34]){const pod=cylinder(g,.11,.11,.34,'#d8ddd3',x,.1,.02,12);pod.rotation.x=Math.PI/2;roundedBox(g,.19,.035,.2,'#789da0',x,.1,-.02,.012)}
      roundedBox(g,.11,.24,.23,'#b96b58',0,.25,-.39,.025);
      for(const z of [-.34,-.18,.02,.22])sphere(g,.018,'#567d86',0,.13,z,2);
      for(const x of [-.52,.52])roundedBox(g,.04,.06,.09,'#f0d282',x,.18,.03,.012);
    }else if(style==='train'){
      for(const x of [-.26,.26])for(const z of [-.4,-.03,.34]){roundedBox(g,.025,.2,.27,'#8fc1c5',x,.48,z,.018);roundedBox(g,.035,.025,.29,'#e7e2cf',x,.59,z,.01)}
      roundedBox(g,.48,.035,.05,'#e1b75d',0,.2,-.03,.01);
      for(const x of [-.33,.33])for(const z of [-.52,.52])hub(x,z,.12,.1);
    }
  }

  function makeVehicle(color,pooled=false){
    if(pooled){const pool=vehicleModelPool.get(color),recycled=pool?.pop();if(recycled){if(!pool.length)vehicleModelPool.delete(color);recycled.visible=true;recycled.position.set(0,0,0);recycled.rotation.set(0,0,0);recycled.scale.setScalar(1);for(const wheel of recycled.userData.steeringWheels||[])wheel.rotation.y=0;trafficRoot.add(recycled);return recycled}}
    const g=new THREE.Group(),steeringWheels=[],turnSignals=[];
    box(g,.39,.16,.68,color,0,.22,0,{cast:true});box(g,.32,.18,.37,'#b9d6da',0,.39,-.04);box(g,.32,.035,.02,'#5a7078',0,.48,.13);
    for(const x of [-.22,.22]){
      for(const z of [-.23,.23]){
        const assembly=new THREE.Group();assembly.position.set(x,0,z);g.add(assembly);
        const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.055,18),mat('#263c42'));wheel.rotation.z=Math.PI/2;wheel.position.y=.13;assembly.add(wheel);
        const hub=cylinder(assembly,.035,.035,.061,'#a6b4ac',0,.13,0,12);hub.rotation.z=Math.PI/2;if(z>0)steeringWheels.push(assembly);
      }
      box(g,.085,.05,.02,'#fff2c3',x,.25,.35);box(g,.08,.045,.02,'#d06f61',x,.25,-.35);box(g,.045,.05,.07,'#718f95',x*1.01,.41,.13);
      const frontSignal=box(g,.025,.035,.055,'#d28b47',x*.98,.25,.27),rearSignal=box(g,.025,.03,.055,'#d28b47',x*.98,.25,-.27);turnSignals.push(frontSignal,rearSignal);
    }
    box(g,.29,.025,.035,'#344d55',0,.21,.355);g.userData.steeringWheels=steeringWheels;g.userData.turnSignals=turnSignals;
    if(pooled)g.userData.vehicleModelKey=color;trafficRoot.add(g);vehicleFinish(g,'car');return g;
  }
  function makeParkingSearchBadge(){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const ctx=canvas.getContext('2d');
    ctx.fillStyle='rgba(18,45,47,.94)';ctx.beginPath();ctx.roundRect(10,14,236,100,28);ctx.fill();
    ctx.strokeStyle='#f3c95f';ctx.lineWidth=8;ctx.stroke();ctx.fillStyle='#ffe28b';ctx.font='bold 76px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('P',128,66);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));sprite.scale.set(.62,.31,1);sprite.userData.release=()=>{texture.dispose();sprite.material.dispose()};return sprite;
  }
  function makeDeliveryTruck(color='#c78c50',role=null,id=null,withCargo=false){const g=new THREE.Group();box(g,.38,.2,.7,color,0,.27,-.08);box(g,.3,.22,.28,'#c9e4e3',0,.3,.36);box(g,.4,.035,.72,'#e5d2aa',0,.39,-.08);for(const x of [-.23,.23])for(const z of [-.28,.32])box(g,.075,.12,.13,'#303f43',x,.13,z);const cargoMeshes=[];if(withCargo){for(const [x,y,z,color] of [[-.11,.49,-.21,'#bd8650'],[.05,.49,-.22,'#72947a'],[0,.61,-.2,'#d0a153'],[.12,.49,-.04,'#b96d58']]){const crate=roundedBox(g,.14,.13,.15,color,x,y,z,.025);roundedBox(g,.145,.022,.16,'#e6d2ac',x,y+.035,z,.012);cargoMeshes.push(crate,g.children.at(-1))}for(const x of [-.18,.18])rodBetween(g,[x,.44,-.31],[x,.66,-.31],.012,'#e8d7b2',5)}g.userData.cargoMeshes=cargoMeshes;if(role){g.userData.emergencyRole=role;g.userData.emergencyId=id}trafficRoot.add(g);vehicleFinish(g,'delivery');return g}
  function makeHearse(){const g=makeVehicle('#343c40');box(g,.32,.17,.34,'#273034',0,.47,-.04,{cast:true});box(g,.26,.08,.3,'#aeb8b3',0,.59,-.04,{cast:true});box(g,.12,.035,.035,'#e7e4da',0,.65,-.04,{cast:false});g.userData.emergencyRole='Coche fúnebre';vehicleFinish(g,'delivery');return g}
  function makeBus(color='#e7a958',passengerCount=0){
    const g=new THREE.Group();box(g,.62,.41,1.12,color,0,.36,0,{cast:true});box(g,.59,.08,1.02,'#f3ddac',0,.61,0);box(g,.62,.09,.16,'#295767',0,.55,.39);box(g,.47,.26,.035,'#69aabd',0,.44,.57);for(const x of [-.321,.321]){for(const z of [-.33,-.08,.17])box(g,.024,.19,.19,'#70afc0',x,.43,z);box(g,.045,.38,.035,'#ece2be',x,.39,.42);for(const z of [-.38,.37]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.055,18),mat('#304144'));wheel.rotation.z=Math.PI/2;wheel.position.set(x*1.09,.13,z);g.add(wheel)}}box(g,.47,.075,.1,'#214c55',0,.67,.42);box(g,.3,.052,.015,'#f5d178',0,.67,.477);for(const x of [-.24,.24]){box(g,.1,.065,.03,'#fff2c7',x,.28,.58);box(g,.1,.065,.03,'#b9574d',x,.28,-.58)}// Acceso articulado y luz interior: se abre solo en paradas de rutas operativas.
    const door=new THREE.Group();door.position.set(.32,.355,.285);g.add(door);
    box(door,.027,.42,.27,'#e4ddd1',0,0,-.10);
    box(door,.030,.19,.20,'#7fb3bc',.01,.085,-.09);
    box(door,.037,.085,.04,'#b5bfb2',.018,-.07,.01);
    g.userData.passengerDoor=door;
    g.userData.headlightOffsets=[[-.23,.28,.60],[.23,.28,.60]];
    const interior=box(g,.35,.044,.22,mat('#f5dab1',{emissive:'#fbcf91',emissiveIntensity:1}),0,.617,-.16);
    interior.visible=false;g.userData.interiorLights=[interior];
    const passengers=[];
    for(let index=0;index<3;index++){
      const z=[-.28,-.05,.16][index];
      const seat=new THREE.Group();seat.position.set(-.17,0,z);g.add(seat);
      const shirts=['#71958a','#c18b65','#6f8fa7'],skins=['#d5a17e','#e3bd96','#a9735a'];
      sphere(seat,.043,skins[index],0,.49,0,1);box(seat,.085,.13,.075,shirts[index],0,.385,0);
      box(seat,.10,.05,.11,'#708f97',0,.30,.015);
      seat.visible=passengers.length<Math.min(3,Math.max(0,passengerCount));passengers.push(seat);
    }
    g.userData.passengerSeats=passengers;
    trafficRoot.add(g);vehicleFinish(g,'bus');return g}
  function makeCargo(color){const g=new THREE.Group();box(g,.28,.2,.28,color,0,.19,0);box(g,.31,.035,.31,'#e2cfaa',0,.3,0);trafficRoot.add(g);vehicleFinish(g,'delivery');return g}
  function makeForklift(){const g=new THREE.Group();box(g,.38,.2,.48,'#dfaa4f',0,.27,0);box(g,.27,.42,.3,'#e9ba60',0,.57,-.05);box(g,.22,.22,.22,'#6e9897',0,.67,.09);box(g,.06,.75,.07,'#6d6354',-.18,.52,.29);box(g,.06,.75,.07,'#6d6354',.18,.52,.29);box(g,.035,.065,.42,'#ddd2ad',-.12,.08,.53);box(g,.035,.065,.42,'#ddd2ad',.12,.08,.53);for(const x of [-.23,.23])for(const z of [-.15,.18])box(g,.09,.12,.1,'#35434a',x,.14,z);trafficRoot.add(g);vehicleFinish(g,'forklift');return g}
  function makeGarbageTruck(){
    const g=new THREE.Group();box(g,.42,.34,.62,'#477d65',-.18,.32,.02,{cast:true});box(g,.2,.25,.45,'#d4dec9',-.18,.63,.02);box(g,.37,.4,.4,'#608e6e',.22,.35,-.08,{cast:true});box(g,.34,.24,.025,'#86b1b7',.22,.45,.127);box(g,.16,.05,.04,'#f2d47a',.2,.68,.13);
    for(const x of [-.31,.31])for(const z of [-.18,.22]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.07,10),mat('#34413e'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.15,z);g.add(wheel)}
    const collection=new THREE.Group();collection.position.set(.38,.08,-.08);collection.visible=false;g.add(collection);
    const lift=new THREE.Group();lift.position.set(-.02,.13,-.06);collection.add(lift);
    for(const z of [-.10,.10]){box(lift,.035,.23,.035,'#a4b2a2',-.08,.11,z);box(lift,.035,.23,.035,'#a4b2a2',.08,.11,z);box(lift,.21,.035,.035,'#c4c9b7',0,.22,z)}
    const bin=new THREE.Group();bin.position.set(0,.31,.02);lift.add(bin);box(bin,.18,.23,.16,'#357b68',0,.10,0);box(bin,.20,.035,.18,'#273e39',0,.235,0);for(const x of [-.07,.07])cylinder(bin,.018,.018,.045,'#252f30',x,.025,.075,8);
    const worker=new THREE.Group();worker.position.set(.10,.02,.24);collection.add(worker);box(worker,.16,.25,.11,'#e2ae54',0,.32,0);box(worker,.07,.07,.07,'#d2a382',0,.49,.005);box(worker,.18,.045,.12,'#f0d17b',0,.34,.005);for(const x of [-.05,.05]){box(worker,.05,.18,.055,'#475b55',x,.10,0);const arm=new THREE.Group();arm.position.set(x*1.45,.41,.005);box(arm,.045,.19,.05,'#e2ae54',0,-.075,.035);worker.add(arm);if(x<0)worker.userData.arm=arm}
    g.userData.collectionRig={collection,lift,worker,arm:worker.userData.arm};trafficRoot.add(g);vehicleFinish(g,'garbage');return g
  }
  function makeTransferTruck(){
    const g=new THREE.Group(),green='#477e62',deep='#315d4c',metal='#4b5853';
    box(g,.54,.13,1.12,'#34413e',0,.2,-.01,{cast:true});
    box(g,.58,.55,.69,green,0,.58,-.2,{cast:true});
    box(g,.6,.06,.74,deep,0,.9,-.2,{cast:true});
    for(const z of [-.47,-.3,-.13,.04])for(const x of [-.301,.301])box(g,.018,.44,.025,'#70947c',x,.59,z,{cast:false});
    box(g,.38,.38,.39,'#6c947b',0,.49,.38,{cast:true});
    box(g,.32,.22,.025,'#9fc6c1',0,.54,.585,{cast:false});
    box(g,.36,.035,.05,'#e5d8ab',0,.72,.39,{cast:false});
    for(const x of [-.21,.21]){
      box(g,.12,.055,.035,'#f4db83',x,.34,.59,{cast:false});box(g,.1,.055,.035,'#bd5548',x,.31,-.57,{cast:false});
      cylinder(g,.018,.018,.57,metal,x*1.15,.27,-.19,8).rotation.z=Math.PI/2;
      for(const z of [-.42,-.04,.43]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.125,.125,.085,14),mat('#2c3838'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.15,z);g.add(wheel);const hub=cylinder(g,.044,.044,.09,'#a9b5a8',x*1.16,.15,z,12);hub.rotation.z=Math.PI/2}
    }
    for(const z of [-.51,.48])box(g,.68,.055,.08,'#d4b45d',0,.25,z,{cast:false});
    for(const x of [-.33,.33]){rodBetween(g,[x,.27,-.42],[x,.49,-.48],.025,'#c2c9bb',7);rodBetween(g,[x,.49,-.48],[x,.65,-.37],.025,'#8f9b8e',7)}
    box(g,.16,.14,.04,'#e4d8b5',0,.72,-.19,{cast:false});box(g,.1,.045,.045,'#345b4e',0,.72,-.16,{cast:false});
    trafficRoot.add(g);vehicleFinish(g,'garbage');return g
  }
  function makeFireEngine(){const g=new THREE.Group();box(g,.42,.33,.65,'#c84b3e',-.11,.31,0,{cast:true});box(g,.29,.24,.31,'#e3bd91',-.11,.58,-.04);box(g,.2,.26,.38,'#b83e35',.22,.4,.02,{cast:true});box(g,.25,.2,.025,'#8ec0c0',-.11,.49,.14);box(g,.46,.045,.08,'#eee1bd',0,.71,0);box(g,.12,.1,.09,'#e9c556',0,.78,0);box(g,.035,.22,.36,'#d7d0bd',.39,.46,.13);for(const x of [-.3,.3])for(const z of [-.2,.23]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.07,10),mat('#303c3e'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.13,z);g.add(wheel)}trafficRoot.add(g);vehicleFinish(g,'fire');return g}

  // Servicios visibles en el mundo: sólo viajan por calzadas conectadas y habilitadas.
  function makePoliceCar(){
    const g=makeVehicle('#ebf0f3');
    box(g,.36,.06,.28,'#24567b',0,.38,-.13);
    box(g,.24,.075,.16,'#2f5785',0,.51,.05);
    box(g,.11,.065,.1,'#be4f4a',-.075,.585,.05);
    box(g,.11,.065,.1,'#457fc2',.075,.585,.05);
    vehicleFinish(g,'emergency');return g;
  }
  function makeAmbulance(){
    const g=makeVehicle('#f5f2e9');
    box(g,.38,.27,.37,'#f4f3eb',0,.43,-.16,{cast:true});
    box(g,.405,.085,.45,'#d5504c',0,.37,-.14);
    box(g,.18,.065,.12,'#bb3d3b',0,.61,-.1);
    box(g,.09,.055,.08,'#e8f4f4',-.08,.59,.08);
    box(g,.09,.055,.08,'#5eafd4',.08,.59,.08);
    vehicleFinish(g,'emergency');return g;
  }
  function serviceRoadPath(from,to,roads){
    if(!Array.isArray(from)||!Array.isArray(to))return null;
    const neighbors=p=>[[p[0],p[1]],[p[0]+1,p[1]],[p[0]-1,p[1]],[p[0],p[1]+1],[p[0],p[1]-1]]
      .filter(q=>roads.has(key(q[0],q[1])));
    const a=neighbors(from),b=new Set(neighbors(to).map(p=>key(p[0],p[1])));
    let best=null;
    for(const start of a){
      const q=[start],seen=new Map([[key(start[0],start[1]),null]]);
      for(let i=0;i<q.length;i++){
        const cur=q[i],k=key(cur[0],cur[1]);
        if(b.has(k)){
          const route=[];for(let j=k;j!==null;j=seen.get(j))route.push(j.split(',').map(Number));
          route.reverse();if(!best||route.length<best.length)best=route;
          break;
        }
        if(best&&i>40)break;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const n=[cur[0]+dx,cur[1]+dy],nk=key(n[0],n[1]);
          if(roads.has(nk)&&!seen.has(nk)){seen.set(nk,k);q.push(n)}
        }
      }
    }
    return best?.length>=2?best.map(([x,y])=>tilePos(x,y)):null;
  }
  function spawnEmergencyActors(state,openRoads){
    const add=(role,mesh,route,description,id,{idle=false,side=0,deliveryStartDay=null,deliveryEndDay=null}={})=>{
      mesh.userData.emergencyRole=role;mesh.userData.emergencyId=id;
      if(idle||!route?.length){
        const pos=route?.[0]||tilePos(4,10);
        mesh.position.set(pos[0]+side,0,pos[1]+.18);
        return;
      }
      routeActors.push({mesh,route,offset:0,speed:1.3,side,emergencyRole:role,...(deliveryStartDay===null?{}:{deliveryProgress:0,deliveryStartDay,deliveryEndDay}),
        selection:{type:role,title:description.title,description:description.description,
        metrics:description.metrics||[]}});
    };
    const day=Number(state.day)||1;
    const missions=(state.policeReport?.recentIncidents||[]).filter(i=>i.route?.length>1&&i.stationX!=null&&(
      i.status==='en respuesta'||i.status==='atendido'&&day<=(i.resolvedDay||0)+1));
    for(const incident of missions){
      const outward=incident.route.map(([x,y])=>tilePos(x,y));
      const roundTrip=[...outward,...outward.slice(0,-1).reverse()];
      add('Policía',makePoliceCar(),roundTrip,{title:`Patrulla · móvil ${Number.isInteger(incident.vehicleIndex)?incident.vehicleIndex+1:1} · ${incident.location||'incidente'}`,
        description:incident.status==='atendido'?'El móvil resolvió el incidente y vuelve a su comisaría.':'El móvil viaja al incidente por su ruta vial reservada.',
        metrics:[['Estado',incident.status],['Móvil',Number.isInteger(incident.vehicleIndex)?incident.vehicleIndex+1:1],['Origen',incident.station||'Comisaría']]},`pol-${incident.id}`,
        {side:-.18+Math.max(0,Number(incident.vehicleIndex)||0)*.24,deliveryStartDay:incident.dispatchDay??incident.day,deliveryEndDay:incident.returnDay??((incident.arrivalDay??day)+1)});
    }
    const fireHistory=[...(state.fireReport?.activeIncidents||[]),...(state.fireReport?.recentIncidents||[])];
    const fireMissions=fireHistory.filter((i,index)=>fireHistory.findIndex(other=>other.id===i.id)===index&&i.responseRoute?.length>1&&i.stationX!=null&&(
      i.status==='ardiendo'||i.status==='controlado'&&day<=(i.resolvedDay||0)+1));
    for(const incident of fireMissions){
      const outward=incident.responseRoute.map(([x,y])=>tilePos(x,y));
      const roundTrip=[...outward,...outward.slice(0,-1).reverse()];
      add('Bomberos',makeFireEngine(),roundTrip,{title:`Autobomba · ${incident.name||'incendio'}`,
        description:incident.status==='controlado'?'El incendio está controlado; la dotación regresa al cuartel.':'La dotación viaja al incendio.',
        metrics:[['Estado',incident.status],['Cuartel',incident.station||'Bomberos']]},`fire-${incident.id}`,
        {side:-.2,deliveryStartDay:incident.dispatchDay??incident.startDay,deliveryEndDay:(incident.arrivalDay??day)+1});
    }
    for(const incident of state.roadIncidentReport?.activeIncidents||[]){if(incident.status!=='en_respuesta'||!incident.responseRoute?.length)continue;const route=incident.responseRoute.map(([x,y])=>tilePos(x,y));add('Rescate vial',makeFireEngine(),route,{title:`Rescate vial · ${incident.x+1},${incident.y+1}`,description:`Unidad municipal responde a un choque por ${incident.cause}. La calle está cerrada mientras se limpia el tramo.`,metrics:[['Causa',incident.cause],['Estado',incident.status],['Respuesta',incident.station||'Cuartel municipal'],['Cierre estimado',`${incident.remainingDays} día(s)`]]},incident.id,{side:.24})}
    const recentMedical=(state.healthReport?.hospital?.ambulanceDispatches||[]).filter(x=>x.status==='traslado'
      &&Number.isInteger(x.day)&&state.day-x.day>=0&&state.day-x.day<=2&&x.route?.length>1);
    // Ambulances appear on streets only for real dispatches. Building a hospital
    // must not create parked vehicles on road tiles in either game mode.
    for(const unit of state.healthReport?.hospital?.hospitals||[]){
      const from=[unit.x,unit.y],missions=recentMedical.filter(x=>x.stationX===unit.x&&x.stationY===unit.y);
      for(const [i,mission] of missions.slice(0,Math.min(3,unit.ambulances||0)).entries()){
        const trip=serviceRoadPath(from,[mission.x,mission.y],openRoads);
        if(!trip?.length||trip.length<2)continue;
        const m=makeAmbulance();
        add('Ambulancia',m,trip,{title:`Traslado sanitario · ${unit.name}`,
          description:'Traslado registrado hacia un barrio conectado, reproducido en la ciudad 3D.',
          metrics:[['Camas',unit.beds],['Dotación operativa',unit.activeAmbulances],['Estado','Traslado reciente']]},
          `amb-${unit.x}-${unit.y}-${i}`,{side:i*.24,deliveryStartDay:mission.day,deliveryEndDay:mission.day+1});
      }
    }
  }
  function patrolPath(origin,priority,roads,state){
    const targets=(state.buildings||[]).filter(b=>b.kind===(priority==='comercial'?'shop':'home'));
    if(priority==='mixto')targets.push(...(state.buildings||[]).filter(b=>b.kind==='shop'));
    const choices=targets.map(b=>serviceRoadPath(origin,[b.x,b.y],roads)).filter(p=>p&&p.length>=3);
    if(!choices.length)return null;
    const path=choices.sort((a,b)=>a.length-b.length)[Math.min(2,choices.length-1)];
    return [...path,...path.slice(0,-1).reverse()];
  }
  function makeWalker(color,shopping=false){
    const modelKey=`${color}|${shopping?'shopping':'walking'}`,recycled=walkerModelPool.get(modelKey);
    if(recycled?.length){const g=recycled.pop();if(!recycled.length)walkerModelPool.delete(modelKey);g.userData.shoppingBags?.forEach(mesh=>mesh.visible=false);trafficRoot.add(g);return g}
    const g=new THREE.Group(),skin='#d8aa83',pants=['#405360','#47584b','#625260'][Math.abs(String(color).length+String(color).charCodeAt(0))%3],shoe='#384044',shoppingBags=[],arms=[],legs=[];g.scale.setScalar(.4);
    const pelvis=roundedBox(g,.21,.15,.15,pants,0,.51,0,.055);roundedBox(g,.31,.34,.19,color,0,.75,0,.075);roundedBox(g,.19,.11,.2,'#e4d7bd',0,.59,.01,.035);
    for(const side of [-1,1]){
      const leg=new THREE.Group();leg.position.set(side*.065,.49,0);g.add(leg);roundedBox(leg,.13,.25,.135,pants,0,-.12,0,.05);
      const knee=new THREE.Group();knee.position.y=-.235;leg.add(knee);sphere(knee,.059,pants,0,0,0,1);roundedBox(knee,.105,.235,.12,pants,0,-.11,.012,.045);roundedBox(knee,.15,.065,.21,shoe,0,-.235,.035,.025);legs.push(leg);
      const arm=new THREE.Group();arm.position.set(side*.17,.87,0);g.add(arm);sphere(arm,.082,color,0,0,0,1);roundedBox(arm,.105,.22,.12,color,side*.012,-.105,0,.04);
      const elbow=new THREE.Group();elbow.position.set(side*.018,-.2,.005);arm.add(elbow);sphere(elbow,.052,color,0,0,0,1);roundedBox(elbow,.078,.19,.09,color,side*.012,-.09,.018,.033);sphere(elbow,.049,skin,side*.012,-.19,.025,1);arms.push(arm);
      if(shopping){const bag=new THREE.Group();bag.position.set(side*.012,-.29,.04);elbow.add(bag);roundedBox(bag,.105,.12,.085,'#d7b66e',0,-.02,.03,.025);roundedBox(bag,.11,.023,.09,'#af8a4e',0,.045,.03,.01);rodBetween(bag,[-.027,.035,.03],[0,.083,.03],.009,'#68583e',5);rodBetween(bag,[0,.083,.03],[.027,.035,.03],.009,'#68583e',5);bag.traverse(mesh=>{if(mesh.isMesh)shoppingBags.push(mesh)})}
    }
    const head=new THREE.Group();head.position.set(0,1.055,0);g.add(head);sphere(head,.103,skin,0,0,0,2);const hair=sphere(head,.107,['#433831','#5b4536','#2e3437'][Math.abs(String(color).charCodeAt(0)||0)%3],0,.045,-.015,1);hair.scale.set(1,.64,1);roundedBox(head,.125,.065,.1,'#514036',0,.004,-.055,.03);
    for(const side of [-1,1]){sphere(head,.014,'#f2e5d3',side*.036,.012,.091,1);sphere(head,.008,'#344044',side*.036,.012,.103,1);sphere(head,.024,skin,side*.103,-.008,0,1)}
    roundedBox(head,.035,.022,.04,'#c7876a',0,-.035,.086,.009);
    const torso=g.children.find(o=>o.isMesh&&Math.abs(o.position.y-.75)<.01),walkCycle={arms,legs,head,torso,phase:Math.random()*Math.PI*2};
    g.userData.walkCycle=walkCycle;g.userData.shoppingBags=shoppingBags;g.userData.walkerModelKey=modelKey;shoppingBags.forEach(mesh=>mesh.visible=false);trafficRoot.add(g);vehicleFinish(g,'walker');return g
  }
  function makeBicycle(color='#287b80'){
    const recycled=bicycleModelPool.get(color);if(recycled?.length){const g=recycled.pop();if(!recycled.length)bicycleModelPool.delete(color);trafficRoot.add(g);return g}
    const g=new THREE.Group(),rubber=mat('#26343a'),metal=mat('#bec6bd',{metalness:.55,roughness:.48}),darkMetal=mat('#4a5553',{metalness:.38,roughness:.58}),frame=mat(color,{metalness:.22,roughness:.56}),front=0.47,rear=-0.47,wheelY=.36,wheelRadius=.31,wheels=[];g.scale.setScalar(.3);
    for(const z of [rear,front]){
      const tire=new THREE.Mesh(geometry('bicycle-tire',()=>new THREE.TorusGeometry(wheelRadius,.034,8,28)),rubber);tire.rotation.y=Math.PI/2;tire.position.set(0,wheelY,z);tire.castShadow=false;g.add(tire);wheels.push(tire);
      const rim=new THREE.Mesh(geometry('bicycle-rim',()=>new THREE.TorusGeometry(.267,.009,5,28)),metal);rim.rotation.y=Math.PI/2;rim.position.set(0,wheelY,z);g.add(rim);
      for(const side of [-1,1]){
        const x=side*.044; cylinder(g,.028,.028,.12,'#687774',x,wheelY,z,10).rotation.z=Math.PI/2;
        for(let i=0;i<10;i++){const a=i*Math.PI/5,edge=[x,wheelY+Math.cos(a)*.252,z+Math.sin(a)*.252];rodBetween(g,[x,wheelY,z],edge,.0045,'#aeb8ad',5)}
      }
      const guard=new THREE.Mesh(geometry('bicycle-fender',()=>new THREE.TorusGeometry(.342,.012,5,20,Math.PI)),darkMetal);guard.rotation.y=Math.PI/2;guard.position.set(0,wheelY,z);g.add(guard);
    }
    const rearAxle=[0,wheelY,rear],frontAxle=[0,wheelY,front],bottom=[0,.32,-.035],seat=[0,.79,-.22],head=[0,.76,.24],crankAxis=[0,.32,-.035];
    rodBetween(g,rearAxle,seat,.022,frame,8);rodBetween(g,seat,bottom,.024,frame,8);rodBetween(g,bottom,rearAxle,.02,frame,8);
    rodBetween(g,bottom,head,.025,frame,8);rodBetween(g,head,seat,.025,frame,8);rodBetween(g,head,frontAxle,.021,frame,8);rodBetween(g,seat,[0,.84,-.22],.019,frame,8);
    rodBetween(g,[0,.78,-.22],[0,.93,-.22],.018,darkMetal,8);roundedBox(g,.2,.045,.085,'#37383a',0,.95,-.22,.02);
    rodBetween(g,frontAxle,[0,.79,.24],.018,metal,8);rodBetween(g,[0,.77,.24],[0,.87,.24],.018,darkMetal,8);rodBetween(g,[0,.87,.24],[-.14,.87,.24],.014,darkMetal,8);rodBetween(g,[0,.87,.24],[.14,.87,.24],.014,darkMetal,8);
    for(const x of [-.14,.14])roundedBox(g,.075,.028,.045,'#253239',x,.87,.24,.012);
    const crank=new THREE.Group();crank.position.set(...crankAxis);g.add(crank);cylinder(crank,.07,.07,.13,'#78847e',0,0,0,12).rotation.z=Math.PI/2;
    for(const side of [-1,1]){rodBetween(crank,[side*.07,0,0],[side*.07,side*.13,.01],.012,darkMetal,7);roundedBox(crank,.09,.025,.045,'#283237',side*.07,side*.13,.01,.01)}
    rodBetween(g,[.052,.32,-.04],[.052,.32,-.45],.008,'#a9aaa0',6);rodBetween(g,[.052,.32,-.45],[.052,.36,-.47],.008,'#a9aaa0',6);
    for(const side of [-1,1]){
      rodBetween(g,[side*.04,.69,-.08],[side*.04,.48,-.17],.055,color,7);rodBetween(g,[side*.04,.48,-.17],[side*.04,.39,-.02],.043,'#47525a',7);
      rodBetween(g,[side*.04,.39,-.02],[side*.04,.34,.03],.04,'#47525a',7);
      rodBetween(g,[side*.04,1.15,.02],[side*.045,.9,.2],.035,color,7);rodBetween(g,[side*.045,.9,.2],[side*.14,.87,.24],.025,color,7);
    }
    sphere(g,.105,'#d5aa87',0,1.29,.04,2);const helmet=new THREE.Mesh(geometry('bicycle-helmet',()=>new THREE.IcosahedronGeometry(.108,1)),mat('#e9cf74'));helmet.position.set(0,1.35,.035);helmet.scale.set(1,.55,1);g.add(helmet);
    roundedBox(g,.23,.3,.16,color,0,1.04,.04,.055).rotation.x=.24;
    g.userData.bikeCycle={crank,wheels,phase:Math.random()*Math.PI*2};g.userData.bicycleModelKey=color;trafficRoot.add(g);return g
  }
  function makeShip(){const g=new THREE.Group();box(g,1.28,.28,.58,'#315d67',0,.22,0,{cast:true});box(g,1.02,.13,.48,'#e2a855',0,.39,-.02);box(g,.34,.38,.34,'#e9dfc6',-.35,.63,-.02);box(g,.28,.18,.3,'#6ba0a6',-.35,.68,.15);for(const [i,x] of [-.48,-.18,.12,.42].entries())box(g,.2,.2,.26,['#c65d4e','#d5a245','#4f8e87'][i%3],x,.55,-.02);box(g,.09,.42,.08,'#d5d0bc',-.43,.95,-.02);trafficRoot.add(g);vehicleFinish(g,'ship');return g}
  function makePlane(){const g=new THREE.Group();box(g,.18,.17,.98,'#f0e8d4',0,.13,0,{cast:true});box(g,1.12,.07,.28,'#70969a',0,.14,.02,{cast:true});box(g,.37,.055,.2,'#bf6954',0,.17,.35);box(g,.09,.11,.2,'#6b7e83',0,.22,-.42);box(g,.16,.22,.22,'#75a9b0',0,.25,-.31);box(g,.1,.23,.1,'#b95345',-.07,.24,0);trafficRoot.add(g);vehicleFinish(g,'plane');return g}

  function addCargoTruck(order,route,{type,title,description,destination,progress,side=.12}={}){
    if(!Array.isArray(route)||route.length<2)return;
    const path=route.map(([x,y])=>tilePos(x,y)),factoryLoad=order.originType==='factory'||String(order.supplier||'').startsWith('Fábrica local '),hasRoadReturn=factoryLoad&&path.length>1;
    const movementRoute=hasRoadReturn?[...path,...path.slice(0,-1).reverse()]:path,distance=Math.max(1,path.length-1);
    let movementProgress=clamp(Number(progress)||0,0,1),emptyAt=hasRoadReturn?.5:null;
    if(hasRoadReturn){
      if(order.returnStatus==='retornado')movementProgress=1;
      else if(order.returnStatus==='en ruta')movementProgress=.5+.5*clamp((order.returnTravelledDistance||0)/Math.max(1,order.returnDistance||distance),0,1);
      else movementProgress*=.5;
    }
    const product=order.product||order.commodity||'mercadería',quantity=order.quantity||0,mesh=makeDeliveryTruck('#c68d53',null,null,true);
    if(emptyAt!==null)for(const cargo of mesh.userData.cargoMeshes||[])cargo.visible=movementProgress<emptyAt;
    routeActors.push({mesh,route:movementRoute,deliveryProgress:movementProgress,cargoEmptyAt:emptyAt,side,actorKey:'shipment:'+order.id,
      selection:{type,title,description,metrics:[['Producto',product],['Carga',`${quantity} unidades`],['Destino',destination||order.businessName||'Comercio'],['Recorrido',order.returnStatus==='en ruta'?'Camión vacío de regreso a fábrica':order.returnStatus==='retornado'?'Camión de vuelta en fábrica':'Camión cargado hacia el destino'],['Ruta',`${distance} tramos`]]}});
  }

  // La formación se dibuja como proyección translúcida sobre el trazado: no circula por la calle.
  function makeElevatedTrain(freight=false){
    const g=new THREE.Group();
    box(g,.72,.46,1.43,'#c7d8db',0,.42,0,{cast:true});
    box(g,.69,.13,1.36,'#386475',0,.72,0,{cast:true});
    box(g,.72,.09,.14,'#e6ad58',0,.29,.69);
    for(const x of [-.372,.372])for(const z of [-.43,-.06,.32])
      box(g,.025,.23,.26,'#48879d',x,.49,z);
    const passengerDoor=new THREE.Group();passengerDoor.position.set(.379,.49,.16);g.add(passengerDoor);
    box(passengerDoor,.026,.23,.15,'#e1e3d7',0,0,0);
    box(passengerDoor,.030,.11,.095,'#80b8c3',.006,.035,.01);
    for(const z of [-.52,.52])for(const x of [-.26,.26])
      box(g,.1,.2,.15,'#34424b',x,.12,z);
    box(g,.42,.2,.025,'#d5ecf0',0,.48,.73);
    box(g,.34,.07,.04,'#e2a857',0,.64,.73);
    if(freight){
      box(g,.32,.15,.34,'#c58a4d',0,.77,-.24,{cast:true});
      box(g,.3,.13,.3,'#668d72',0,.77,.14,{cast:true});
    }
    g.userData.railFreightTrain=freight;g.userData.railPassengerDoor=passengerDoor;g.userData.railPassengerDoorClosedZ=.16;g.userData.railTrain=true;trafficRoot.add(g);vehicleFinish(g,'train');return g;
  }
  function makeMetroProjection(){
    const g=new THREE.Group(),ghost=mat('#55c8d2',{transparent:true,opacity:.58,depthWrite:false,emissive:'#207688',emissiveIntensity:.24});
    box(g,.45,.25,.86,ghost,0,.29,0);
    box(g,.46,.08,.88,mat('#b6f2ee',{transparent:true,opacity:.66,depthWrite:false}),0,.44,0);
    for(const x of [-.237,.237])for(const z of [-.23,.03,.28])box(g,.008,.115,.17,'#d8f5ec',x,.32,z);
    box(g,.28,.17,.012,'#eff9e3',0,.3,.44);
    const footprint=plane(g,.62,1.05,mat('#49babb',{transparent:true,opacity:.13,depthWrite:false}),0,.11,0);
    footprint.renderOrder=8;
    const glow=mat('#a9f6ef',{transparent:true,opacity:.45,depthWrite:false,emissive:'#59d3d5',emissiveIntensity:.4});
    roundedBox(g,.48,.025,.9,glow,0,.49,0,.06);
    for(const x of [-.26,.26])ring(g,.065,.012,glow,x,.36,.03);
    g.userData.metroProjection=true;trafficRoot.add(g);return g;
  }
  let activeShadowMapSize=2048;
  function updateShadowQuality(){
    renderer.shadowMap.enabled=false;
    activeShadowMapSize=0
  }
  let lastSceneState=null,lastChosenTile=null,lastSelectionSignature='',environmentalTileScores=new Map();
  function updateSelection(chosen){const signature=chosen?key(chosen.x,chosen.y):'';if(signature===lastSelectionSignature)return;lastSelectionSignature=signature;clear(selectionRoot);addSelection(selectionRoot,chosen)}
  function sync(state,chosen,nextView){const syncStarted=performance.now();lastSceneState=state;lastChosenTile=chosen;poweredStreetlights=new Set((state.utilities?.poweredStreetlightTiles||[]).map(([x,y])=>key(x,y)));view=nextView;environmentalTileScores=view.environmentOverlay?new Map((state.environmentReport?.tiles||[]).map(tile=>[key(tile.x,tile.y),tile])):new Map();landShadeState=state;gatewayTunnel.visible=Boolean(state.newSettlement);cameraAnchor=state.newSettlement?{x:8,y:8}:{x:14,y:10};simulationSpeed=clamp(Number(state.speed)||1,1,4);simulationPaused=Boolean(state.paused)||Boolean(view.preview);visualTimeOfDayMinutes=Number.isFinite(Number(state.timeOfDayMinutes))?Number(state.timeOfDayMinutes):visualTimeOfDayMinutes;visualGameDay=Math.max(1,Number(state.day)||1)+visualTimeOfDayMinutes/1440;updateShadowQuality();updateCamera();updateLandShading(state);const signature=JSON.stringify([
      state.roads,state.trafficSignalOverrides,
      (state.buildings||[]).map(b=>[b.missingServices,b.x,b.y,b.kind,b.name,b.serviceModel,b.level,b.architecturalStyle,b.urbanCondition,b.heritageEligible,b.heritageLevel,b.business?.status,b.business?.industryType,b.business?.status,b.business?.lastSales,b.status,b.operational,Boolean(b.backupCapacityKw),Boolean(b.backupFuelKwh)]),
      (state.projects||[]).map(p=>[p.id,p.x,p.y,p.kind,p.status,p.progress>.15,p.progress>.25,p.progress>.38,p.progress>.45,p.progress>.6,p.progress>.7,p.stageIndex]),
      (state.adaptiveReuseWorks||[]).map(w=>[w.id,w.x,w.y,w.status,w.progress>.15,w.progress>.25,w.progress>.38,w.progress>.45,w.progress>.6,w.progress>.7,w.stage]),
        state.urbanRenewalWorks,(state.abandoned||[]).map(a=>[a.id,a.x,a.y,a.kind,a.status,a.progress>.15,a.progress>.25,a.progress>.38,a.progress>.45,a.progress>.6,a.progress>.7]),state.zones,state.landClaims?.unlockedChunks,state.landClaims?.frontierChunks,
      (state.supply?.orders||[]).map(o=>[o.id,o.status,o.routeProgress,o.progress,o.unloadProgress,o.items,o.destinationId,o.route]),
      (state.supply?.marketOrders||[]).map(o=>[o.id,o.status,o.routeProgress,o.progress,o.travelledDistance,o.returnStatus,o.returnTravelledDistance,o.returnedDay,o.route,o.roadRoute]),
      (state.supply?.portOrders||[]).map(o=>[o.id,o.status,o.routeProgress,o.progress,o.travelledDistance,o.returnStatus,o.returnTravelledDistance,o.returnedDay,o.route,o.roadRoute]),(state.supply?.factoryExportOrders||[]).map(o=>[o.id,o.status,o.mode,o.route,o.roadRoute,o.travelledDistance,o.returnStatus,o.returnTravelledDistance,o.returnedDay,o.arrivalDay]),
      (state.supply?.portVoyages||[]).map(v=>[v.id,v.status,v.direction,v.cargoType,v.unloadedUnits,v.route,v.departureDay,v.arrivalDay,v.quantity,v.status==='en ruta'?Math.floor(((state.day||v.departureDay)-v.departureDay)/Math.max(1,v.arrivalDay-v.departureDay)*100):0]),state.newSettlement,
      (state.commutes||[]).map(t=>[t.mode,t.reason,t.route,t.roundTrip,t.vehicles,t.workers,t.distance,t.estimatedMinutes,t.trafficFactor]),
      (state.urbanEvolution?.deceased||[]).filter(d=>d.disposition==='en traslado').map(d=>[d.residentId,d.funeralTrip?.route,d.funeralTrip?.departDay,d.funeralTrip?.arrivalDay,d.funeralTrip?.facilityX,d.funeralTrip?.facilityY]),
      (state.busRoutes||[]).map(b=>[b.id,b.status,b.operational,b.effectiveBuses,b.buses,b.route,b.driverIds,b.originName,b.destinationName,b.ridersThisPass,b.capacity,b.headwayMinutes,b.stops,b.monthlyFareRevenue]),
      (state.taxiRoutes||[]).map(t=>[t.id,t.status,t.operational,t.route,t.stops,t.depotX,t.depotY,t.monthlyOperatingCost]),
      (state.railStations||[]).map(site=>[site.id,site.x,site.y,site.mode,site.status,site.stage,site.freightRoles,Math.floor((site.elapsed||0)/Math.max(1,site.duration||1)*10)]),
      (state.metroLines||[]).map(m=>[m.id,m.mode,m.status,m.operational,m.trainCount,m.elapsed,m.duration,m.stations,m.route]),
      state.utilities?.powerLines,state.utilities?.waterPipes,state.utilities?.sewerLines,state.utilities?.drainLines,state.utilities?.gasLines,state.utilities?.telecomLines,
      (state.utilities?.report?.failures||[]).map(f=>[f.id,f.network,f.x,f.y,f.status,f.responseRoute,f.completedDay]),state.utilities?.report?.drainage?.floodedTiles,
      (state.roadAssets||[]).map(a=>[a.x,a.y,a.roadType||'local',a.oneWay||null,a.busLane||false,a.truckRestricted||false,a.bridge||false,Math.floor((a.quality??82)/10),a.accidentClosed||false]),
      (state.waste?.containers||[]).map(c=>[c.x,c.y,(c.storedTons||0)/Math.max(.15,c.capacityTons||2)>.75?2:(c.storedTons||0)/Math.max(.15,c.capacityTons||2)>.4?1:0]),
       (state.waste?.routes||[]).map(r=>[r.id,r.reachable,r.path,r.containers,r.stops,r.name,r.destination]),state.waste?.report?.litterTiles,state.waste?.report?.activeTrucks,
      (state.policeReport?.units||[]).map(u=>[u.x,u.y,u.vehicles,u.activeVehicles,u.priority,u.name,u.staff]),(state.policeReport?.recentIncidents||[]).map(i=>[i.id,i.status,i.route,i.stationX,i.stationY,i.day]),
      (state.fireReport?.activeIncidents||[]).map(i=>[i.id,i.x,i.y,i.status]),(state.fireReport?.stations||[]).map(u=>[u.x,u.y,u.name,u.firefighters,u.readyDay]),(state.fireReport?.recentIncidents||[]).map(i=>[i.id,i.status,i.route,i.stationX,i.stationY,i.resolvedDay,i.dispatchDay,i.arrivalDay]),(state.fireService?.ruins||[]).map(r=>[r.x,r.y,r.destroyedDay]),
      (state.healthReport?.hospital?.hospitals||[]).map(u=>[u.x,u.y,u.name,u.beds,u.ambulances,u.activeAmbulances]),(state.healthReport?.hospital?.ambulanceDispatches||[]).map(i=>[i.id,i.status,i.route,i.stationX,i.stationY,i.day]),
      (state.roadIncidentReport?.activeIncidents||[]).map(i=>[i.id,i.x,i.y,i.status,i.responseRoute]),
       view.utilityLayer,view.trafficOverlay,view.environmentOverlay,view.zoneSuitability,state.stateRevision,state.day,view.servicePreview?.serviceModel||null,view.zoom>=1.4,shouldUseFarBuildingLOD(),view.preview
     ]);updateSelection(chosen);const roads=new Set((state.roads||[]).map(r=>key(r[0],r[1]))),closedRoads=new Set((state.roadAssets||[]).filter(a=>(a.quality??82)<25||a.accidentClosed).map(a=>key(a.x,a.y))),openRoads=new Set([...roads].filter(k=>!closedRoads.has(k)));spectacle.sceneSync(state,{preview:Boolean(view.preview)});living3d.sceneSync(state,{preview:Boolean(view.preview)});immersive3d.sceneSync(state,{preview:Boolean(view.preview)});if(signature===visualSignature){refreshServiceCoverage(state,chosen,view,openRoads);renderer.render(scene,camera);sceneSyncFastPaths++;lastSceneSyncMs=performance.now()-syncStarted;return}parkingRoadOrientation=new Map([...roads].map(id=>{const[x,y]=id.split(',').map(Number);return[id,roads.has(key(x-1,y))||roads.has(key(x+1,y))]}));const previousActors=new Map(routeActors.filter(a=>actorIdentity(a)).map(a=>[actorIdentity(a),{route:a.route,offset:a.offset,speed:a.speed,position:a.mesh.position.clone(),rotation:a.mesh.rotation.y,busWaitUntil:a.busWaitUntil,lastBusStopKey:a.lastBusStopKey,busStopVisitCount:a.busStopVisitCount,busStopVisitKey:a.busStopVisitKey,railWaitUntil:a.railWaitUntil,lastRailStopKey:a.lastRailStopKey,railStopVisitCount:a.railStopVisitCount,railStopVisitKey:a.railStopVisitKey,parkingPhase:a.parkingPhase,parkingElapsed:a.parkingElapsed,parkingDeparturePending:a.parkingDeparturePending,parkingSteer:a.parkingSteer}]));walkerModelPool.clear();bicycleModelPool.clear();for(const actor of routeActors){const model=actor.mesh,modelKey=model.userData.walkerModelKey,bikeKey=model.userData.bicycleModelKey,vehicleKey=model.userData.vehicleModelKey;if(modelKey||bikeKey!==undefined||vehicleKey){const poolBadge=model.userData.parkingSearchBadge;if(poolBadge){model.remove(poolBadge);poolBadge.userData.release?.();delete model.userData.parkingSearchBadge}trafficRoot.remove(model);const pool=modelKey?walkerModelPool:bikeKey!==undefined?bicycleModelPool:vehicleModelPool,id=modelKey||bikeKey||vehicleKey,items=pool.get(id)||[];if(items.length<16){items.push(model);pool.set(id,items)}else clear(model)}}const buildings=state.buildings||[],projects=state.projects||[],nextVegetationObstacles=new Set([...roads,...buildings.map(b=>key(b.x,b.y)),...projects.map(p=>key(p.x,p.y)),...(state.railStations||[]).map(p=>key(p.x,p.y)),...(state.adaptiveReuseWorks||[]).map(w=>key(w.x,w.y)),...(state.abandoned||[]).map(a=>key(a.x,a.y))]);syncVegetationObstacles(nextVegetationObstacles);clear(dynamicRoot);clear(trafficRoot);wasteContainerModels.clear();routeActors.length=0;fireVisuals.length=0;signalBulbs.length=0;streetLights.length=0;signalTiles.clear();
    const roadStress=new Map();for(const trip of state.commutes||[]){if(trip.mode==='walk')continue;const load=((trip.vehicles||0)*(trip.reason==='regreso'?.45:1)+(trip.mode==='bus'?2:0))*(trip.trafficFactor||1);for(const [x,y] of trip.route||[])roadStress.set(key(x,y),(roadStress.get(key(x,y))||0)+load)}for(const line of state.busRoutes||[]){if(!line.operational)continue;for(const [x,y] of line.route||[])roadStress.set(key(x,y),(roadStress.get(key(x,y))||0)+(line.effectiveBuses||0)*2)}for(const taxi of state.taxiRoutes||[]){if(!taxi.operational)continue;for(const [x,y] of taxi.route||[])roadStress.set(key(x,y),(roadStress.get(key(x,y))||0)+1)}for(const order of state.supply?.orders||[]){if(order.status!=='en tránsito')continue;for(const [x,y] of order.route||[])roadStress.set(key(x,y),(roadStress.get(key(x,y))||0)+2)}const maxStress=Math.max(8,...roadStress.values()),signalOverrides=state.trafficSignalOverrides||{};pendingRoadMarks=new Map();const roadAssetsByTile=new Map((state.roadAssets||[]).map(a=>[key(a.x,a.y),a]));for(const [x,y] of state.roads){const neighbors=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>roads.has(key(x+dx,y+dy))),intersection=neighbors.length>=3,signals=intersection&&signalOverrides[key(x,y)]!==false,env=environmentalTileScores.get(key(x,y))?.[view.environmentOverlay]||0;addRoad(dynamicRoot,x,y,roads,(roadStress.get(key(x,y))||0)/maxStress,signals,env,roadAssetsByTile.get(key(x,y)));if(signals)signalTiles.add(key(x,y))}
    // El tablero queda sobre el cauce y las barandas dejan libre el carril.
    // Dibujar una sola estructura por pareja de tramos al completar la obra.
    for(const a of state.roadAssets||[]){
      if(!a.bridge||a.x!==24||!roads.has(key(25,a.y)))continue;
      const [cx,cz]=tilePos(24.5,a.y);
      box(dynamicRoot,4.45,.08,1.42,'#8b9894',cx,-.025,cz,{cast:true});
      roundedBox(dynamicRoot,4.38,.035,1.34,'#737f7a',cx,.035,cz,.045);
      for(let i=-4;i<=4;i++)roundedBox(dynamicRoot,.07,.016,1.15,'#a7b0a8',cx+i*.49,.083,cz,.008);
      pipe(dynamicRoot,[[cx-2.15,-.2,cz-.48],[cx-1,-.36,cz-.48],[cx,-.4,cz-.48],[cx+1,-.36,cz-.48],[cx+2.15,-.2,cz-.48]],'#667873',.028);
      for(const x of [cx-2.05,cx+2.05]){cylinder(dynamicRoot,.08,.1,.12,'#63746e',x,.05,cz,12);sphere(dynamicRoot,.075,'#f3dc9c',x,.52,cz-.68,2)}

      for(const side of [-1,1]){
        const z=cz+side*.72;
        box(dynamicRoot,4.45,.13,.075,'#cad2c9',cx,.35,z,{cast:true});
        for(const offset of [-1.9,-.9,0,.9,1.9])box(dynamicRoot,.095,.5,.095,'#8d9e9a',cx+offset,.17,z);
      }
      for(const offset of [-1,1])cylinder(dynamicRoot,.17,.23,.42,'#7b8c87',cx+offset,-.19,cz,10);
    }
    if(state.newSettlement){const externalRoads=new Set([...roads,...Array.from({length:4},(_,i)=>key(i,10))]);for(let x=0;x<4;x++)addRoad(dynamicRoot,x,10,externalRoads,0,false);const [ax,az]=tilePos(4,10);for(const dx of [-.58,.58]){box(dynamicRoot,.08,.52,.08,'#4b5755',ax+dx,.27,az+.04);box(dynamicRoot,.78,.07,.11,'#375e68',ax+dx*1.35,.57,az+.04);box(dynamicRoot,.53,.035,.12,'#e6d7b6',ax+dx*1.35,.62,az+.04)}}for(const a of (state.roadAssets||[]).filter(a=>(a.quality??82)<25||a.accidentClosed)){const [cx,cz]=tilePos(a.x,a.y);box(dynamicRoot,1.48,.24,.2,'#fbefe4',cx,.3,cz,{cast:true});for(const dx of [-.55,-.27,0,.27,.55]){const stripe=box(dynamicRoot,.16,.25,.22,dx===0?'#ed8e53':'#cd5c59',cx+dx,.3,cz,{cast:false});stripe.rotation.z=-.2}for(const dx of [-.57,.57]){box(dynamicRoot,.085,.42,.085,'#777783',cx+dx,.23,cz);cylinder(dynamicRoot,.12,.12,.065,'#e69a4f',cx+dx,.51,cz,9)} }
    flushRoadMarks(dynamicRoot);
    if(view.utilityLayer){const networkKey={power:'powerLines',water:'waterPipes',sewer:'sewerLines',drainage:'drainLines',gas:'gasLines',telecom:'telecomLines'}[view.utilityLayer],points=state.utilities?.[networkKey]||[],set=new Set(points.map(([x,y])=>key(x,y))),color={power:'#f0bd4e',water:'#42a9c2',sewer:'#a88bd3',drainage:'#4e9eb9',gas:'#e28b43',telecom:'#a458d4'}[view.utilityLayer];for(const [x,y] of points){const [cx,cz]=tilePos(x,y);for(const [dx,dy] of [[1,0],[0,1]])if(set.has(key(x+dx,y+dy))){const [nx,nz]=tilePos(x+dx,y+dy);rodBetween(dynamicRoot,[cx,.16,cz],[nx,.16,nz],.018,color,8);ring(dynamicRoot,.046,.01,color,cx,.17,cz)}sphere(dynamicRoot,.07,color,cx,.19,cz,1)}for(const f of (state.utilities?.report?.failures||[]).filter(f=>f.network===view.utilityLayer)){const [fx,fz]=tilePos(f.x,f.y);sphere(dynamicRoot,.16,'#d84e4e',fx,.25,fz,1)}if(view.utilityLayer==='drainage')for(const [x,y] of state.utilities?.report?.drainage?.floodedTiles||[]){const [cx,cz]=tilePos(x,y);plane(dynamicRoot,1.18,1.18,mat('#52a9c2',{transparent:true,opacity:.44,depthWrite:false}),cx,.105,cz)}}
    for(const busLine of (state.busRoutes||[]).filter(r=>r.operational&&r.route?.length>1))for(let i=1;i<busLine.route.length;i++){
      const [ax,ay]=busLine.route[i-1],[bx,by]=busLine.route[i];if(!openRoads.has(key(ax,ay))||!openRoads.has(key(bx,by))||Math.abs(ax-bx)+Math.abs(ay-by)!==1)continue;
      const [px,pz]=tilePos((ax+bx)/2,(ay+by)/2);box(dynamicRoot,ax!==bx?1.7:.085,.009,ay!==by?1.7:.085,'#67d3b8',px,.089,pz,{cast:false});
    }
    for(const busLine of (state.busRoutes||[]).filter(r=>r.operational&&r.manualRoute))for(const stop of busLine.stops||[]){const [x,y]=stop.at||[];if(!Number.isInteger(x)||!Number.isInteger(y))continue;const [cx,cz]=tilePos(x,y),sign=new THREE.Group();sign.position.set(cx+.56,.09,cz+.46);box(sign,.055,.52,.055,'#425d62',0,.26,0,{cast:true});roundedBox(sign,.36,.26,.08,'#397f84',0,.5,0,.025,{cast:true});roundedBox(sign,.22,.1,.025,'#e8d7a8',0,.5,.05,.012);ring(sign,.055,.012,'#f0d991',0,.5,.069);sphere(sign,.026,'#fff2c5',0,.5,.083,2);roundedBox(sign,.07,.18,.05,'#d1c5a8',0,.3,0,.012);dynamicRoot.add(sign)}
    for(const c of state.waste?.containers||[]){const [cx,cz]=tilePos(c.x,c.y),fill=(c.storedTons||0)/Math.max(.15,c.capacityTons||2);const bin=new THREE.Group();bin.position.set(cx+.56,.09,cz+.45);roundedBox(bin,.34,.48,.3,'#547e70',0,.24,0,.055,{cast:true});roundedBox(bin,.36,.055,.32,'#354f48',0,.5,0,.025);roundedBox(bin,.22,.035,.2,fill>.75?'#d28b50':fill>.4?'#c0a45c':'#b4c99c',0,.53,0,.018);roundedBox(bin,.16,.055,.035,'#304a44',0,.48,.16,.012);for(const dx of [-.11,.11]){cylinder(bin,.045,.045,.05,'#253b39',dx,.035,.13,10);ring(bin,.044,.009,'#86988d',dx,.035,.16,{rotationX:Math.PI/2})}roundedBox(bin,.11,.09,.025,'#dce7d7',0,.34,.161,.012);for(const yy of [.31,.34,.37])roundedBox(bin,.07,.012,.028,'#718f7c',0,yy,.178,.004);roundedBox(bin,.07,.055,.08,'#d2ac60',0,.045,.23,.018);bin.userData.serviceBasePosition=bin.position.clone();bin.userData.serviceBaseRotation=bin.rotation.clone();wasteContainerModels.set(key(c.x,c.y),bin);dynamicRoot.add(bin)}
    for(const tile of state.waste?.report?.litterTiles||[]){if(!Array.isArray(tile)||tile.length<2||!Number.isFinite(tile[0])||!Number.isFinite(tile[1]))continue;const [x,y]=tile,[cx,cz]=tilePos(x,y);for(const [dx,dz,color] of [[-.24,-.12,'#647c66'],[.2,.1,'#9a8871'],[.02,-.27,'#536e66']]){const body=new THREE.Mesh(new THREE.IcosahedronGeometry(.17,1),mat(color));body.scale.set(1,.85,.8);body.position.set(cx+dx,.2,cz+dz);dynamicRoot.add(body);cylinder(dynamicRoot,.037,.055,.085,'#dfd5bf',cx+dx,.37,cz+dz,8);box(dynamicRoot,.1,.018,.065,'#e8e2d2',cx+dx+.04,.28,cz+dz+.04,{cast:false})}}
    for(const z of state.zones||[])addZone(dynamicRoot,z);for(const chunk of state.landClaims?.frontierChunks||[])addLandLock(dynamicRoot,chunk);
    for(const ruin of state.fireService?.ruins||[]){if((state.buildings||[]).some(b=>b.x===ruin.x&&b.y===ruin.y)||(state.projects||[]).some(p=>p.x===ruin.x&&p.y===ruin.y))continue;const [rx,rz]=tilePos(ruin.x,ruin.y);plane(dynamicRoot,1.82,1.82,'#4c4b47',rx,.088,rz);for(let i=0;i<15;i++){const dx=(seeded(i+ruin.x*11+ruin.y*29)-.5)*1.4,dz=(seeded(i+ruin.x*19+ruin.y*13+50)-.5)*1.4,block=box(dynamicRoot,.12+(i%3)*.06,.06+(i%4)*.055,.15+(i%2)*.05,i%3?'#77716b':'#b3a498',rx+dx,.13,rz+dz);block.rotation.y=i*.71}for(let i=0;i<4;i++)plane(dynamicRoot,.35,.32,'#292d2b',rx+(i-1.5)*.29,.093,rz+(i%2?.26:-.29))}
    const renewalKeys=new Set((state.urbanRenewalWorks||[]).map(w=>key(w.x,w.y)));syncBuildingModels(buildings,roads,renewalKeys);
    // Estaciones construidas por el jugador, con obra visual por etapas.
    for(const site of state.railStations||[]){
      if(!['building','active'].includes(site.status))continue;
      const [cx,cz]=tilePos(site.x,site.y),group=new THREE.Group();
      group.position.set(cx,0,cz);
      const completion=site.status==='active'?1:Math.min(.99,(site.elapsed||0)/Math.max(1,site.duration||1));
      railStationModel(group,site.mode,completion,site.freightRoles||[]);
      group.userData.railStationSite=true;
      group.userData.railSiteId=site.id;
      dynamicRoot.add(group);
    }

    // Primer ferrocarril urbano: un viaducto propio sobre tramos de calle ya conectados.
    for(const trainLine of (state.metroLines||[]).filter(l=>l.mode==='elevated')){
      if(!['building','active','paused'].includes(trainLine.status))continue;
      const route=trainLine.route||[];
      if(route.length<5||!route.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)))continue;
      if(route.some((p,i)=>i&&Math.abs(p[0]-route[i-1][0])+Math.abs(p[1]-route[i-1][1])!==1))continue;
      const completed=trainLine.status!=='building',ratio=completed?1:clamp((trainLine.elapsed||0)/Math.max(1,trainLine.duration||1),0,1);
      const max=route.length-1;
      const supports=completed?max:Math.floor(max*clamp(ratio/.58,0,1));
      const rails=completed?max:Math.floor(max*clamp((ratio-.58)/.36,0,1));
      for(let i=1;i<=supports;i++){
        const [ax,ay]=route[i-1],[bx,by]=route[i],across=ax!==bx,[cx,cz]=tilePos((ax+bx)/2,(ay+by)/2);
        if(i%2===1){
          const [px,pz]=tilePos(ax,ay);
          box(dynamicRoot,.23,1.65,.23,'#b2b7ad',px+.68,.72,pz+.68,{cast:true});
          box(dynamicRoot,.72,.16,.72,'#b2b7ad',px+.4,1.48,pz+.4);
        }
        const deck=box(dynamicRoot,across?2.03:.8,.15,across?.8:2.03,'#738d8f',cx,1.67,cz,{cast:true});
        deck.userData.railDeck=true;
        if(i<=rails){
          for(const side of [-.25,.25]){
            const track=box(dynamicRoot,across?1.97:.055,.07,across?.055:1.97,'#36474d',cx+(across?0:side),1.79,cz+(across?side:0));
            track.userData.railTrack=true;
          }
          for(let k=0;k<3;k++)box(dynamicRoot,across?.06:.7,.05,across?.7:.06,'#977e62',
            cx+(across?(k-1)*.58:0),1.74,cz+(across?0:(k-1)*.58));
        }
      }
      if(completed){
        for(const p of [route[0],route.at(-1)]){
          const [px,pz]=tilePos(...p),platform=new THREE.Group();
          platform.position.set(px,1.74,pz);
          box(platform,1.38,.12,.42,'#d5d5c4',0,.04,.59);
          for(const side of [-.52,.52])box(platform,.08,.58,.08,'#507681',side,.38,.77);
          box(platform,1.25,.11,.55,'#4a7880',0,.73,.7);
          box(platform,.52,.21,.07,'#eff3dd',0,.56,.98);
          platform.userData.railPlatform=true;dynamicRoot.add(platform);
        }
      }
    }

    // Vista técnica de la infraestructura subterránea: trazado proyectado, no vías sobre la calzada.
    const stationTiles=new Set();
    const metroLines=(state.metroLines||[]).filter(l=>l.mode!=='elevated').slice().sort((a,b)=>(a.status==='building')-(b.status==='building'));
    for(const metro of metroLines){
      const plan=metroVisualPlan(metro);if(!plan)continue;
      for(let i=1;i<=plan.tunnelSegments;i++){
        const [ax,ay]=plan.route[i-1],[bx,by]=plan.route[i];
        if(Math.abs(ax-bx)+Math.abs(ay-by)!==1)continue;
        const across=ax!==bx,[cx,cz]=tilePos((ax+bx)/2,(ay+by)/2);
        const tunnel=box(dynamicRoot,across?1.8:.43,.024,across?.43:1.8,
          mat('#397f89',{transparent:true,opacity:.36,depthWrite:false}),cx,.135,cz);
        tunnel.renderOrder=6;tunnel.userData.metroTunnelSegment=true;
        for(const side of [-.145,.145]){
          const rail=box(dynamicRoot,across?1.8:.034,.028,across?.034:1.8,
            mat('#73d5d6',{transparent:true,opacity:.56,depthWrite:false}),
            cx+(across?0:side),.174,cz+(across?side:0));
          rail.renderOrder=7;
        }
      }
      for(const [sx,sy] of plan.stations){
        if(stationTiles.has(key(sx,sy)))continue;stationTiles.add(key(sx,sy));
        const [cx,cz]=tilePos(sx,sy),entrance=new THREE.Group();
        entrance.position.set(cx+.63,.09,cz+.62);
        box(entrance,.58,.07,.53,plan.completed?'#345963':'#9f8156',0,.055,0);
        if(plan.completed){
          box(entrance,.53,.12,.54,'#d4e0d9',0,.53,0);
          for(const side of [-.23,.23])box(entrance,.065,.46,.065,'#477780',side,.3,-.22);
          box(entrance,.46,.08,.09,'#3c9ca9',0,.44,.24);
          box(entrance,.22,.23,.035,'#e5f5e5',0,.7,0);
        }else{
          for(const side of [-.25,.25])box(entrance,.055,.4,.055,'#d4a15b',side,.25,-.23);
          box(entrance,.55,.07,.08,'#d4a15b',0,.47,-.23);
        }
        entrance.userData.metroStation=true;entrance.userData.metroComplete=plan.completed;
        dynamicRoot.add(entrance);
        if(plan.trains)addStationPassengerActors(metro,[sx,sy],false,stationTiles.size);
      }
    }

    for(const incident of state.fireReport?.activeIncidents||[]){if(!incident||!Number.isInteger(incident.x)||!Number.isInteger(incident.y))continue;const [fx,fz]=tilePos(incident.x,incident.y),flames=[],smoke=[];for(let i=0;i<11;i++){const mesh=new THREE.Mesh(new THREE.ConeGeometry(.12+(i%3)*.025,.42+(i%3)*.12,7),new THREE.MeshBasicMaterial({color:['#f1a03a','#ef6435','#f6cb62'][i%3],transparent:true,opacity:.88,depthWrite:false}));mesh.renderOrder=20;dynamicRoot.add(mesh);flames.push({mesh,phase:i/11});}for(let i=0;i<18;i++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.18+(i%4)*.025,9,7),new THREE.MeshBasicMaterial({color:i%3?'#687375':'#8a8980',transparent:true,opacity:0,depthWrite:false}));mesh.renderOrder=19;dynamicRoot.add(mesh);smoke.push({mesh,phase:i/18});}fireVisuals.push({fx,fz,flames,smoke,seed:fx+fz});}
    for(const a of state.abandoned||[]){
      if(a.status==='vivienda abandonada'){
        const houseData={...a,kind:'home',level:1,urbanCondition:12,status:'abandonado',occupants:0};
        addBuilding(dynamicRoot,houseData,roads,renewalKeys);
        const [hx,hz]=tilePos(a.x,a.y);
        for(const z of [-.7,.7])for(const x of [-.37,.37])box(dynamicRoot,.45,.075,.045,'#826b51',hx+x,1.15,hz+z);
        for(const x of [-.68,.68])box(dynamicRoot,.18,.35,.1,'#8f8778',hx+x,.22,hz+.48);
      }else addSite(dynamicRoot,a,true);
    }
    for(const p of state.projects)addSite(dynamicRoot,p,false);for(const w of state.adaptiveReuseWorks||[])addSite(dynamicRoot,w,false);


    for(const trainLine of (state.metroLines||[]).filter(l=>l.mode==='elevated'&&l.operational&&l.status==='active')){
      const path=(trainLine.route||[]).map(([x,y])=>tilePos(x,y));
      if(path.length<5)continue;
      const count=Math.min(4,Math.max(0,Math.trunc(trainLine.trainCount||0)));
      for(let i=0;i<count;i++)routeActors.push({
        mesh:makeElevatedTrain(),route:path,offset:i*(path.length-1)*TILE*2/Math.max(1,count),
        speed:2.15,side:0,height:1.82,railTrain:true,railLineId:String(trainLine.id),railStopKeys:new Set((trainLine.stations||[]).map(p=>Array.isArray(p)?key(p[0],p[1]):'')),
        selection:{type:'Tren elevado de pasajeros',title:trainLine.name+' · formación '+(i+1),
          description:'Tren eléctrico real del servicio municipal elevado. Requiere obras habilitadas, flota, energía y presupuesto.',
          metrics:[['Pasajeros hoy',trainLine.dailyRiders||0],['Capacidad por día',trainLine.dailyCapacity||0],
            ['Frecuencia',(trainLine.headwayMinutes||0)+' min'],['Costo mensual',trainLine.monthlyOperatingCost||0]]}
      });
      for(const [stationIndex,station] of (trainLine.stations||[]).entries())addStationPassengerActors(trainLine,station,true,stationIndex);
    }

    // Solo hay trenes visuales cuando el motor autoritativo declara la línea operativa.
    const freightLines=new Map((state.metroLines||[]).filter(line=>line.mode==='elevated').map(line=>[String(line.id),line]));
    for(const order of (state.supply?.portOrders||[]).filter(item=>item.mode==='rail'&&item.status==='en tránsito ferroviario').slice(0,16)){
      const line=freightLines.get(String(order.freightLineId)),railRoute=order.railRoute||[],freightLegs=order.freightLegs||[],freightLegIndex=Math.max(0,Math.min(freightLegs.length-1,order.freightLegIndex||0));
      if(!line||railRoute.length<2||railRoute.some((point,index)=>!Array.isArray(point)||point.length!==2||!point.every(Number.isInteger)||index&&Math.abs(point[0]-railRoute[index-1][0])+Math.abs(point[1]-railRoute[index-1][1])!==1))continue;
      const path=railRoute.map(([x,y])=>tilePos(x,y)),progress=clamp((order.travelledDistance||0)/Math.max(1,order.railDistance||railRoute.length-1),0,.999),spanDays=Math.max(1,(railRoute.length-1)/12),actor={
        mesh:makeElevatedTrain(true),route:path,offset:0,speed:1.5,side:0,height:1.82,railTrain:true,
        deliveryProgress:progress,actorKey:'rail-cargo-'+order.id,
        selection:{type:'Carga ferroviaria',title:'Tren de carga · '+(order.businessName||'Fábrica'),description:freightLegs.length>1?'Carga industrial que cambia de corredor en estaciones elevadas construidas antes de llegar al puerto.':'Carga industrial en ruta al puerto por una línea elevada operativa.',metrics:[['Mercadería',(order.quantity||0)+' u. de '+(order.product||'mercadería')],['Línea',line.name||'Tren elevado'],['Tramo',`${freightLegIndex+1}/${Math.max(1,freightLegs.length)}`],['Intercambios',Math.max(0,freightLegs.length-1)],['Arribo previsto','Día '+(order.expectedPortDay||order.departureDay||state.day)]]}
      };
      if(line.operational){actor.deliveryStartDay=visualGameDay-progress*spanDays;actor.deliveryEndDay=actor.deliveryStartDay+spanDays}
      routeActors.push(actor);
    }

    for(const metro of (state.metroLines||[]).filter(l=>l.mode!=='elevated')){
      const plan=metroVisualPlan(metro);if(!plan||!plan.trains)continue;
      const path=plan.route.map(([x,y])=>tilePos(x,y));
      if(path.length<2)continue;
      for(let i=0;i<plan.trains;i++)routeActors.push({
        mesh:makeMetroProjection(),route:path,offset:i*(path.length-1)*TILE*2/plan.trains,
        speed:1.85,side:0,height:.045,metroProjection:true,railTrain:true,railLineId:String(metro.id),railStopKeys:new Set((metro.stations||[]).map(p=>Array.isArray(p)?key(p[0],p[1]):'')),
        selection:{type:'Proyección de tren de subte',title:(metro.name||'Subte')+' · formación '+(i+1),
          description:'Marcador translúcido de la posición ilustrativa de un tren bajo tierra. No ocupa carriles de la calle.',
          metrics:[['Estado','En servicio'],['Pasajeros diarios',metro.dailyRiders||0],
            ['Frecuencia',(metro.headwayMinutes||0)+' min'],['Formaciones',metro.trainCount||0]]}
      });
    }
    let transitAccessActors=0,stationPassengerActors=0;const transitAccessLimit=smallScreen?12:24,stationPassengerLimit=smallScreen?6:12;
    function addTransitAccessActors(trip,index,tag){
      const transitPassengers=Math.max(Number(trip.busRiders)||0,trip.mode==='bus'?Number(trip.workers)||0:0);
      if(transitAccessActors>=transitAccessLimit||!(transitPassengers>0)||!Array.isArray(trip.from)||!Array.isArray(trip.to))return;
      let transitPath=trip.busTravelRoute?.filter(p=>Array.isArray(p)&&p.length===2)||[];
      const ids=trip.busLineIds||[trip.busLineId,trip.schoolBusLineId,trip.schoolReturnLineId].filter(Boolean),line=(state.busRoutes||[]).find(b=>ids.some(id=>String(id)===String(b.id)));
      if(transitPath.length<2&&line?.route?.length>1){
        const nearest=point=>line.route.map((p,i)=>[Math.abs(point[0]-p[0])+Math.abs(point[1]-p[1]),i]).sort((a,b)=>a[0]-b[0]||a[1]-b[1])[0],from=nearest(trip.from),to=nearest(trip.to);
        if(from&&to&&from[0]<=1&&to[0]<=1&&from[1]!==to[1])transitPath=from[1]<to[1]?line.route.slice(from[1],to[1]+1):line.route.slice(to[1],from[1]+1).reverse();
      }
      if(transitPath.length<2)return;
      const endpoints=[[trip.from,transitPath[0],false],[transitPath.at(-1),trip.to,true]];
      for(const [from,to,isDestination] of endpoints){
        if(transitAccessActors>=transitAccessLimit)break;
        let segment=null;
        const matches=(trip.route||[]).findIndex(p=>p[0]===to[0]&&p[1]===to[1]);
        if(matches>=0)segment=isDestination?(trip.route||[]).slice(matches):(trip.route||[]).slice(0,matches+1);
        else if(Math.abs(from[0]-to[0])+Math.abs(from[1]-to[1])<=1)segment=[from,to];
        if(!segment||segment.length<2)continue;
        const schedule=tripRoutine(trip).map(leg=>({...leg,fromEnd:isDestination!==Boolean(leg.reverse)}));
        const actorIndex=transitAccessActors++,walker=makeWalker(['#8e7a63','#6587a2','#bd875d'][actorIndex%3]);
        routeActors.push({mesh:walker,route:segment.map(([x,y])=>tilePos(x,y)),dailyRoutine:schedule,routineSpanMinutes:clamp(Number(trip.walkAccessMinutes)||4,3,8),offset:actorIndex*1.1,speed:.48,side:actorIndex%2?.64:-.64,actorKey:`transit-access:${tag}:${trip.reason}:${index}:${isDestination?'destination':'origin'}:${trip.from.join(',')}:${trip.to.join(',')}`,selection:{type:'Peatones',title:`Acceso al colectivo · ${trip.destinationName||trip.reason}`,description:'Caminata de acceso o salida asociada a un viaje real en colectivo; sigue los extremos del recorrido y su horario.',metrics:[['Pasajeros del viaje',transitPassengers],['Destino',trip.destinationName||trip.to.join(',')],['Acceso',isDestination?'Desde la parada al destino':'Desde el origen a la parada']]}});
      }
    }
    function addStationPassengerActors(line,station,elevated=false,sequence=0){
      const riders=Math.max(0,Number(line.dailyRiders)||Number(line.ridersThisPass)||0);
      if(!line.operational||line.status!=='active'||riders<=0||!Array.isArray(station)||station.length!==2)return;
      const remaining=stationPassengerLimit-stationPassengerActors;if(remaining<=0)return;
      const limit=smallScreen?2:4,count=Math.min(remaining,limit,Math.max(1,Math.ceil(riders/90))),[cx,cz]=tilePos(station[0],station[1]);
        const originX=elevated?cx:cx+.63,originZ=elevated?cz:cz+.62,radius=elevated?.31:.24;
      for(let i=0;i<count;i++){
        const shade=['#6d91a0','#b78162','#719775','#a37998'][i%4],walk=makeWalker(shade),shift=(i-(count-1)/2)*.055;
        walk.scale.setScalar(.68);
        const loop=[[-radius,-radius],[radius,-radius],[radius,radius],[-radius,radius],[-radius,-radius]].map(([x,z])=>[originX+x+shift,originZ+z+shift]);
          const platform=new THREE.Vector3(originX+shift,.035+(elevated?1.85:0),originZ+shift),exit=new THREE.Vector3(elevated?cx+.52:originX,.035,elevated?cz+.68:originZ+.30);
          const boarding=i%2===1;
          routeActors.push({mesh:walk,route:loop,offset:i*2.2,speed:.23,side:0,height:elevated?1.88:.035,activeMinutes:[390,1200],stationPassenger:{lineId:String(line.id),tile:key(station[0],station[1]),platform,exit,boarding},actorKey:`station-passenger:${line.id}:${station[0]},${station[1]}:${sequence}:${i}`,selection:{type:'Peatones',title:`Pasajero/a · ${line.name||'transporte ferroviario'}`,description:boarding?'Camina desde la entrada al andén cuando llega una formación operativa.':'Espera en el andén y baja hacia la salida cuando llega una formación operativa.',metrics:[['Pasajeros reales de la línea',riders],['Estación',`${station[0]+1}, ${station[1]+1}`],['Servicio',elevated?'Tren elevado':'Subte']]}});
          stationPassengerActors++;
      }
    }
    const parkVisits=new Map();for(const trip of state.commutes||[]){if(trip.reason!=='ocio'||!Array.isArray(trip.to))continue;const id=key(trip.to[0],trip.to[1]);parkVisits.set(id,(parkVisits.get(id)||0)+Math.max(0,Number(trip.workers)||0))}for(const park of buildings.filter(b=>b.serviceModel==='urbanPark'&&['operativo','habilitado'].includes(b.status))){const visitors=parkVisits.get(key(park.x,park.y))||0;if(!visitors)continue;const center=tilePos(park.x,park.y),count=Math.min(5,Math.ceil(visitors/6)),colors=['#4d8d68','#d49a5b','#6387a2','#a46e79','#7c9b54'];for(let i=0;i<count;i++){const shift=(Math.floor(i/2)-1)*.16,loop=[[-.58,-.58],[.58,-.58],[.58,.58],[-.58,.58],[-.58,-.58]].map(([x,z])=>[center[0]+x+shift,center[1]+z+shift]);routeActors.push({mesh:makeWalker(colors[i%colors.length]),route:loop,offset:i*1.7,speed:.3+(i%3)*.035,side:i%2?.045:-.045,activeMinutes:[600,1200],selection:{type:'Visitante de plaza',title:`${park.name||'Plaza barrial'} · paseo ${i+1}`,description:'Vecino que eligió este espacio público como destino de ocio. Los caminantes del mapa corresponden a visitas generadas por hogares conectados.',metrics:[['Visitantes simulados hoy',visitors],['Actividad','Paseo por senderos y mobiliario'],['Ubicación',`${park.x+1}, ${park.y+1}`]]}})}}    const route=buildRoute(openRoads);if(route.length>1){
      const commuteRoutes=(state.commutes||[]).filter(t=>['trabajo','regreso'].includes(t.reason)&&!(t.mode==='auto'&&t.reason==='regreso')).slice().sort((a,b)=>b.workers-a.workers).slice(0,18);
      for(let i=0;i<commuteRoutes.length;i++){
        const trip=commuteRoutes[i],back=trip.reason==='trabajo'?(state.commutes||[]).find(t=>t.reason==='regreso'&&t.mode==='auto'&&t.from?.[0]===trip.to?.[0]&&t.from?.[1]===trip.to?.[1]&&t.to?.[0]===trip.from?.[0]&&t.to?.[1]===trip.from?.[1]):null;
        const rawPath=trip.mode==='auto'?(trip.parkingRoutes?.[0]||trip.parkingRoute):trip.route,hasParkingRoute=trip.mode==='auto'&&Array.isArray(rawPath)&&rawPath.length>0,path=trip.mode==='auto'&&hasParkingRoute?parkingDrivingRoute(rawPath,trip.parkingOriginSlot,trip.parkingSlot):trip.mode==='walk'?streetUserPath(trip.route,openRoads,'walk'):trip.mode==='bicycle'?streetUserPath(trip.route,openRoads,'bicycle'):[];
        if(trip.busRiders>0||trip.mode==='bus')addTransitAccessActors(trip,i,'commute');
        if(path.length<2||trip.mode==='bus')continue;
        const mesh=trip.mode==='walk'?makeWalker(['#476d83','#b46f62','#d3a05a'][i%3]):trip.mode==='bicycle'?makeBicycle(['#287b80','#398e68','#d39b39'][i%3]):makeVehicle(['#d89368','#f1d493','#75ada8','#c66d63'][i%4],trip.mode==='auto');
        const routine=trip.mode==='auto'&&trip.reason==='trabajo'?[{window:trip.departureWindowKey||'morningPeak',reverse:false},{window:back?.departureWindowKey||trip.returnWindowKey||'eveningPeak',reverse:true}]:tripRoutine(trip);
        const actor={mesh,route:path,parkingDriving:Boolean(hasParkingRoute),dailyRoutine:routine,hideOutsideRoutine:Boolean(trip.mode==='auto'&&trip.parkingSearching),offset:i*3.7,speed:(trip.mode==='walk'?.5:trip.mode==='bicycle'?1.05:1.55)/Math.max(1,trip.trafficFactor||1),side:trip.mode==='walk'?(i%2?1.04:-1.04):trip.mode==='bicycle'?(i%2?.48:-.48):hasParkingRoute?0:(i%2?.23:-.23),actorKey:tripActorKey(trip,'commute'),selection:tripSelection(trip,trip.mode==='walk'?'Peatones':trip.mode==='bicycle'?'Ciclistas':'Vehículo particular')};
        if(trip.mode==='auto'){
          actor.parkingSearching=Boolean(trip.parkingSearching&&!trip.parkingSlot);
          if(actor.parkingSearching){const badge=makeParkingSearchBadge();badge.position.set(0,1.15,0);mesh.add(badge);mesh.userData.parkingSearchBadge=badge}
          if(trip.parkingSlot){actor.parkingVehicle={origin:trip.parkingOriginSlot||null,destination:trip.parkingSlot,outboundWindow:trip.departureWindowKey||'morningPeak',returnWindow:back?.departureWindowKey||trip.returnWindowKey||'eveningPeak'};addParkingPedestrian(trip,back,0,'commute',trip.parkingSlots?.[0]||trip.parkingSlot,trip.parkingWalkRoutes?.[0])}
        }
        routeActors.push(actor);addRepresentativeTravelers(trip,actor,'commute',routine,back,openRoads);
      }
      const nonworkRoutes=(state.commutes||[]).filter(t=>['compras','servicios','ocio'].includes(t.reason)).sort((a,b)=>(b.reason==='ocio')-(a.reason==='ocio')).slice(0,8);
    for(let i=0;i<nonworkRoutes.length;i++){
      const trip=nonworkRoutes[i],rawPath=trip.mode==='auto'?(trip.parkingRoutes?.[0]||trip.parkingRoute):trip.route,hasParkingRoute=trip.mode==='auto'&&Array.isArray(rawPath)&&rawPath.length>0,path=trip.mode==='auto'&&hasParkingRoute?parkingDrivingRoute(rawPath,trip.parkingOriginSlot,trip.parkingSlot):trip.mode==='walk'?streetUserPath(trip.route,openRoads,'walk'):trip.mode==='bicycle'?streetUserPath(trip.route,openRoads,'bicycle'):[],service=trip.reason==='servicios',leisure=trip.reason==='ocio',shopping=trip.reason==='compras',roadUsers=Math.max(0,(trip.workers||0)-(trip.busRiders||0)-(trip.metroRiders||0)-(trip.taxiRiders||0));if(trip.busRiders>0||trip.mode==='bus')addTransitAccessActors(trip,i,'nonwork');
      if(path.length<2||!(trip.mode==='walk'||trip.mode==='bicycle'?roadUsers>0:trip.mode==='auto'?(trip.vehicles||0)>0:false))continue;
      const mesh=trip.mode==='walk'?makeWalker(service?['#8c83bd','#6f93ae','#9e779d'][i%3]:leisure?['#68a66e','#78b874','#4d9472'][i%3]:['#e3bd73','#b88158','#8a9c66'][i%3],shopping):trip.mode==='bicycle'?makeBicycle('#438a67'):makeVehicle(service?['#8c83bd','#6f93ae','#9e779d'][i%3]:leisure?['#68a66e','#78b874','#4d9472'][i%3]:['#e2a54d','#d37e53','#75a6a1'][i%3],trip.mode==='auto');
      const visitRoutine=tripRoutine(trip),actor={mesh,route:path,parkingDriving:Boolean(hasParkingRoute),dailyRoutine:visitRoutine,hideOutsideRoutine:Boolean(trip.mode==='auto'&&trip.parkingSearching),offset:i*2.9,speed:trip.mode==='walk'?.43:trip.mode==='bicycle'?.95:1.25,side:trip.mode==='walk'?(i%2?1.04:-1.04):trip.mode==='bicycle'?(i%2?.48:-.48):hasParkingRoute?0:(i%2?.3:-.3),actorKey:shopping?`shopping-trip:${tripActorKey(trip,'visit')}`:tripActorKey(trip,'visit'),selection:tripSelection(trip,trip.mode==='walk'?'Peatones':trip.mode==='bicycle'?'Ciclistas':'Vehículo particular')};if(trip.mode==='auto'){actor.parkingSearching=Boolean(trip.parkingSearching&&!trip.parkingSlot);if(actor.parkingSearching){const badge=makeParkingSearchBadge();badge.position.set(0,1.15,0);mesh.add(badge);mesh.userData.parkingSearchBadge=badge}if(trip.parkingSlot){actor.parkingVehicle={origin:trip.parkingOriginSlot||null,destination:trip.parkingSlot,outboundWindow:'midday',returnWindow:'afternoonReturn'};addParkingPedestrian(trip,null,0,'visit',trip.parkingSlots?.[0]||trip.parkingSlot,trip.parkingWalkRoutes?.[0])}}
      if(shopping&&trip.mode==='walk'&&mesh.userData.shoppingBags?.length){actor.shoppingBags=mesh.userData.shoppingBags;actor.shoppingReturnAt=TILE*Math.max(1,path.length-1)}
      routeActors.push(actor);addRepresentativeTravelers(trip,actor,'visit',visitRoutine,null,openRoads);
      if(shopping&&trip.mode!=='walk'&&trip.mode!=='bus'){
        const access=streetUserPath(trip.route.slice(-2),openRoads,'walk');
        if(access.length===2){const shopper=makeWalker(['#e3bd73','#b88158','#8a9c66'][i%3],true),shoppingPath=access;
          routeActors.push({mesh:shopper,route:shoppingPath,dailyRoutine:tripRoutine(trip),offset:i*3.1+1.2,speed:.48,side:.62,actorKey:`shopping-entry:${trip.from?.join(',')}:${trip.to?.join(',')}`,shoppingBags:shopper.userData.shoppingBags,shoppingReturnAt:TILE,
            selection:{type:'Peatones',title:`Compras · ${trip.destinationName||'comercio local'}`,description:'Visitante real del viaje de compras del hogar; camina desde la calle al comercio y sale con bolsas.',metrics:[['Visitantes simulados',trip.workers||0],['Destino',trip.destinationName||'Comercio local'],['Modo de llegada',trip.mode==='bicycle'?'Bicicleta':trip.mode==='bus'?'Colectivo':trip.mode==='metro'?'Subte':trip.mode==='taxi'?'Taxi':'Automóvil']]}})}
      }
    }
    const schoolRoutes=(state.commutes||[]).filter(t=>t.reason==='educacion').slice(0,10);
    for(let i=0;i<schoolRoutes.length;i++){
      const trip=schoolRoutes[i],rawPath=trip.mode==='auto'?(trip.parkingRoutes?.[0]||trip.parkingRoute):trip.route,hasParkingRoute=trip.mode==='auto'&&Array.isArray(rawPath)&&rawPath.length>0,path=trip.mode==='auto'&&hasParkingRoute?parkingDrivingRoute(rawPath,trip.parkingOriginSlot,trip.parkingSlot):trip.mode==='walk'?streetUserPath(trip.route,openRoads,'walk'):trip.mode==='bicycle'?streetUserPath(trip.route,openRoads,'bicycle'):[];
      if(trip.busRiders>0||trip.mode==='bus')addTransitAccessActors(trip,i,'school');const roadUsers=Math.max(0,(trip.workers||0)-(trip.busRiders||0));
      if(path.length<2||!['walk','bicycle','auto'].includes(trip.mode)||(trip.mode==='auto'?(trip.vehicles||0)<=0:roadUsers<=0))continue;
      const routine=tripRoutine(trip),actor={mesh:trip.mode==='walk'?makeWalker(['#5a9bd5','#75c4d1','#f0c85a'][i%3]):trip.mode==='bicycle'?makeBicycle('#3288aa'):makeVehicle(['#4f91c6','#66b6c4','#e3ba54'][i%3],trip.mode==='auto'),route:path,parkingDriving:Boolean(hasParkingRoute),dailyRoutine:routine,offset:i*2.4,speed:trip.mode==='walk'?.58:trip.mode==='bicycle'?1.05:1.45,hideOutsideRoutine:Boolean(trip.mode==='auto'&&trip.parkingSearching),side:trip.mode==='walk'?(i%2?1.04:-1.04):trip.mode==='bicycle'?(i%2?.48:-.48):hasParkingRoute?0:(i%2?.28:-.28),actorKey:tripActorKey(trip,'school'),selection:tripSelection(trip,trip.mode==='walk'?'Peatones':trip.mode==='bicycle'?'Ciclistas':'Vehículo particular')};
      if(trip.mode==='auto'){
        actor.parkingSearching=Boolean(trip.parkingSearching&&!trip.parkingSlot);
        if(actor.parkingSearching){const badge=makeParkingSearchBadge();badge.position.set(0,1.15,0);actor.mesh.add(badge);actor.mesh.userData.parkingSearchBadge=badge}
        if(trip.parkingSlot){actor.parkingVehicle={origin:trip.parkingOriginSlot||null,destination:trip.parkingSlot,outboundWindow:trip.departureWindowKey||'morningPeak',returnWindow:trip.returnWindowKey||'eveningPeak'};addParkingPedestrian(trip,null,0,'school',trip.parkingSlots?.[0]||trip.parkingSlot,trip.parkingWalkRoutes?.[0])}
      }
      routeActors.push(actor);addRepresentativeTravelers(trip,actor,'school',routine,null,openRoads);
    }
    for(const line of (state.busRoutes||[]).filter(b=>b.operational&&b.route?.length>1))for(let i=0;i<Math.min(line.effectiveBuses||0,3);i++){const path=line.route.map(([x,y])=>tilePos(x,y)),drivers=(line.driverIds||[]).map(id=>{for(const h of state.buildings||[])for(const p of h.residents||[])if(p.id===id)return{id,name:p.name||`Vecino #${String(id).slice(-5)}`,age:p.age,status:'Conductor/a',employerName:p.employerName,monthlyWage:p.monthlyWage,home:[h.x,h.y]};return{id,name:`Conductor #${String(id).slice(-5)}`,status:'Conductor/a'}});routeActors.push({actorKey:`bus-${line.id}-${i}`,mesh:makeBus('#e7a958',Math.min(3,Math.ceil((line.dailyRiders||line.ridersThisPass||0)/Math.max(1,(line.effectiveBuses||1)*7)))),route:path,offset:i*7.4,speed:1.15,side:0,
  busStopKeys:new Set((line.stops||[]).map(s=>Array.isArray(s)?s.join(','):Array.isArray(s?.at)?s.at.join(','):'')),
  selection:{type:'Colectivo municipal',title:`${line.originName||'Línea'} → ${line.destinationName||'corredor'} · unidad ${i+1}`,description:'Vehículo asignado a una línea real con turnos y capacidad por sentido.',metrics:[['Pasajeros del d\u00eda',line.dailyRiders||line.ridersThisPass||0],['Capacidad',`${line.capacity||0} asientos`],['Conductores',drivers.length],['Frecuencia',`${line.headwayMinutes||0} min`],['Paradas',(line.stops||[]).length],['Pasaje del último mes',`$${line.monthlyFareRevenue||0}`]],people:drivers}})}for(const taxi of (state.taxiRoutes||[]).filter(t=>t.operational&&t.route?.length>1)){const path=taxi.route.map(([x,y])=>tilePos(x,y));for(const stop of taxi.stops||[]){const [sx,sz]=tilePos(...stop.at),sign=new THREE.Group();sign.position.set(sx+.52,.08,sz+.48);roundedBox(sign,.1,.09,.1,'#6a7469',0,.05,0,.02);cylinder(sign,.028,.035,.38,'#5d5544',0,.24,0,10);roundedBox(sign,.3,.23,.08,'#dca94b',0,.45,0,.025);roundedBox(sign,.2,.13,.025,'#f2e8d1',0,.45,.05,.014);ring(sign,.052,.012,'#5e8c8b',0,.45,.068);sphere(sign,.024,'#f3e5bc',0,.45,.083,2);dynamicRoot.add(sign)}routeActors.push({mesh:makeVehicle('#e4b144'),route:path,offset:taxi.offset||0,speed:1.4,side:.18,selection:{type:'Taxi municipal',title:`Taxi · depósito ${taxi.depotX+1},${taxi.depotY+1}`,description:'Vehículo que recorre su circuito y vuelve al depósito por calles conectadas.',metrics:[['Paradas',taxi.stops?.length||0],['Circuito',`${path.length-1} tramos`],['Estado','En servicio'],['Operación mensual',`$${taxi.monthlyOperatingCost||260}`]]}})}const wasteRoutes=(state.waste?.routes||[]).filter(r=>r.reachable&&r.path?.length>1);
    for(let i=0;i<Math.min(4,wasteRoutes.length);i++){
      const route=wasteRoutes[i],transfer=route.destination==='transfer'||/centro de transferencia/i.test(route.name||''),mesh=transfer?makeTransferTruck():makeGarbageTruck();
      const serviceStops=new Map((route.stops||[]).filter(stop=>Number.isInteger(stop.x)&&Number.isInteger(stop.y)).map(stop=>[key(stop.x,stop.y),stop.kind||'container']));
      routeActors.push({mesh,route:route.path.map(([x,y])=>tilePos(x,y)),offset:i*4.2,speed:.72,side:i%2?.18:-.18,...(!transfer&&serviceStops.size?{serviceStops}:{}),selection:{type:transfer?'Camión de centro de transferencia':'Camión municipal',title:route.name||`Ruta de recolección ${i+1}`,description:'El camión recorre los contenedores atendidos por esta ruta, se detiene y realiza la maniobra de carga antes de continuar al destino.',metrics:[['Contenedores',route.stops?.filter(stop=>stop.kind==='container').length||route.containers?.length||0],['Carga del recorrido',`${route.payloadTons||0} t`],['Destino',route.destination||'Sin destino'],['Distancia',`${route.distanceTiles||0} cuadras`]]}});
    }
    }
    for(const order of (state.supply?.orders||[]).filter(o=>['en tránsito','esperando equipo','descargando'].includes(o.status)&&o.route?.length>1)){const path=order.route.map(([x,y])=>tilePos(x,y));routeActors.push({mesh:makeVehicle(order.supplier==='Flete Urgente'?'#e08b52':'#d8b56d'),route:path,deliveryProgress:['esperando equipo','descargando'].includes(order.status)?1:(order.routeProgress??order.progress??0),side:0,selection:{type:'Camión de materiales',title:`${order.supplier} · ${order.label||'Pedido de obra'}`,description:order.statusCause||'Carga contratada por una constructora.',metrics:[['Estado',order.status],['Obra',order.label||'Pedido'],['Materiales',Object.entries(order.items||{}).map(([k,v])=>`${k} ${v}`).join(' · ')||'Carga en traslado'],['Destino',order.destinationLabel||'Patio de constructoras'],['Entrega estimada',order.arrivalDay?`día ${order.arrivalDay}`:'en ruta']]}});if(order.status==='descargando'){const depot=(state.supply.depots||[]).find(d=>d.id===order.destinationId),dest=depot?[depot.x,depot.y]:[4,10],offsets=[[-.42,.04],[.42,-.04],[0,.42]],center=tilePos(dest[0],dest[1]),lift=makeForklift();lift.position.set(center[0]+.62,.01,center[1]+.3);lift.rotation.y=-Math.PI/4;for(let i=0;i<(order.unloadWorkers||0);i++){const worker=makeWalker(i?'#526d82':'#b8745b');worker.position.set(center[0]-.52+i*.16,0,center[1]+.25)}offsets.forEach(([dx,dz],i)=>{const progress=clamp((order.unloadProgress||0)*3-i,0,1),from=tilePos(dest[0],dest[1]),to=tilePos(dest[0]+dx,dest[1]+dz);routeActors.push({mesh:makeCargo(['#c89958','#769784','#bb765d'][i]),route:[from,to],deliveryProgress:progress,side:0})})}}
    spawnEmergencyActors(state,openRoads);
    for(const failure of state.utilities?.report?.failures||[]){const route=failure.responseRoute;if(!Array.isArray(route)||route.length<2)continue;const active=failure.status==='en reparación',recent=failure.status==='reparada'&&(state.day||0)-(failure.completedDay||0)<=1;if(!active&&!recent)continue;const path=route.map(([x,y])=>tilePos(x,y)),duration=Math.max(1,failure.responseDurationDays||3);routeActors.push({mesh:makeDeliveryTruck(failure.responseKind==='emergencia'?'#d94d4d':'#c78951','Cuadrilla de servicios',failure.id),route:path,...(recent?{deliveryProgress:1}:{offset:0,speed:1.3}),side:-.2,selection:{type:'Cuadrilla de servicios',title:`${failure.responseKind==='emergencia'?'Respuesta urgente':'Reparación de red'} · ${failure.network}`,description:failure.status==='reparada'?'La unidad terminó el trabajo y el servicio fue restablecido.':`Cuadrilla en camino a la avería de la calle ${failure.x+1}, ${failure.y+1}.`,metrics:[['Estado',failure.status],['Red',failure.network],['Avería',`${failure.x+1}, ${failure.y+1}`],['Plazo',`${failure.remainingDays||0} día(s)`],['Costo',`$${failure.responseKind==='emergencia'?failure.repairCost*2:failure.repairCost}`]]}})}
    for(const deceased of (state.urbanEvolution?.deceased||[]).filter(d=>d.disposition==='en traslado'&&d.funeralTrip?.route?.length>1)){
      const trip=deceased.funeralTrip,path=trip.route.map(([x,y])=>tilePos(x,y)),mesh=makeHearse(),kind=trip.kind==='crematorium'?'cremación':'sepultura',arrival=Math.max((trip.departDay||state.day)+1,trip.arrivalDay||state.day+1);
      mesh.userData.emergencyId=deceased.residentId;
      routeActors.push({mesh,route:path,deliveryStartDay:trip.departDay||state.day,deliveryEndDay:arrival,deliveryProgress:0,side:.13,selection:{type:'Coche fúnebre',title:`Traslado de ${deceased.name||'residente'}`,description:`La familia contrató ${kind}. El vehículo recorrió el hogar para recogerle y viaja a ${trip.facility||'la instalación funeraria'} por calles conectadas.`,metrics:[['Destino',trip.facility||'Instalación funeraria'],['Servicio contratado',kind],['Distancia',`${trip.distance||Math.max(0,path.length/2|0)} cuadras`],['Llegada',`día ${arrival}`],['Capacidad',trip.kind==='crematorium'?'24 cremaciones/año':'120 sepulturas']]}})
    }
    for(const order of (state.supply?.marketOrders||[])){
      const returning=order.returnStatus==='en ruta'||order.returnStatus==='retornado'&&(state.day||0)===order.returnedDay;
      if(order.status!=='en tránsito'&&!returning)continue;
      const route=order.roadRoute||order.route||[];if(route.length<2)continue;
      const distance=Math.max(1,route.length-1),start=order.supplierReadyDay??order.orderedDay??state.day,arrival=Math.max(start+1,order.arrivalDay||start+2),timeline=clamp(((state.day||start)-start)/(arrival-start),0,.98),travelled=Math.min(.98,(order.travelledDistance||0)/distance),progress=Math.max(timeline,travelled),factoryLoad=order.originType==='factory'||String(order.supplier||'').startsWith('Fábrica local ');
      const sourceName=order.supplier||'Proveedor regional',destination=order.businessName||'Comercio local',title=`${sourceName} → ${destination}`;
      addCargoTruck(order,route,{type:factoryLoad?'Camión de fábrica':'Camión regional',title,description:factoryLoad?'Mercadería producida en esta fábrica; el camión la entrega al comercio y regresa vacío por la misma ruta.':order.statusCause||'Carga comprada por una empresa y trasladada por calles conectadas.',destination,progress,side:.13});
    }
    for(const order of (state.supply?.portOrders||[])){
      if(order.mode==='rail')continue;
      const returning=order.originType==='factory'&&order.status!=='en viaje'&&(order.returnStatus==='en ruta'||order.returnStatus==='retornado'&&(state.day||0)===order.returnedDay),waitingAtPort=order.originType==='factory'&&order.status==='esperando patio'&&order.roadRoute?.length>1;
      if(order.status!=='en tránsito'&&!returning&&!waitingAtPort)continue;
      const route=order.roadRoute||order.route||[];if(route.length<2)continue;
      const distance=Math.max(1,route.length-1),progress=waitingAtPort ? .999 : Math.min(.99,(order.travelledDistance||0)/distance),factoryLoad=order.originType==='factory';
      addCargoTruck(order,route,{type:factoryLoad?'Camión de exportación':'Camión de carga',title:`${order.businessName||'Empresa local'} → terminal portuaria`,description:factoryLoad?'Producción de fábrica en traslado al puerto; el camión vuelve vacío cuando descarga.':'Exportación asignada al puerto y trasladada por calles conectadas.',destination:'Puerto',progress,side:.08});
    }
    for(const order of state.supply?.factoryExportOrders||[]){
      const factoryName=order.businessName||'Fábrica local',route=order.roadRoute||order.route||[],returning=order.returnStatus==='en ruta'||order.returnStatus==='retornado'&&(state.day||0)===order.returnedDay;
      if(order.status==='en vuelo'){
        const [ax,az]=tilePos(order.destinationX||order.factoryX,order.destinationY||order.factoryY);
        routeActors.push({mesh:makePlane(),route:[[ax,az],[ax-5,az-3],[ax-12,az-6]],deliveryProgress:Math.min(.8,Math.max(.05,((state.day||1)-(order.orderedDay||1))/Math.max(2,(order.arrivalDay||state.day+2)-(order.orderedDay||1)))),height:5.4,selection:{type:'Avión de carga',title:`${factoryName} · ${order.quantity||0} unidades`,description:'La producción industrial viaja por aire al mercado exterior.',metrics:[['Producto',order.product||'Mercadería'],['Carga',`${order.quantity||0} unidades`],['Llegada prevista',`día ${order.arrivalDay||state.day+1}`]]}});
      }
      if(route.length>1&&['land','air','ship'].includes(order.mode)&&(order.status==='en tránsito'||returning)){
        const distance=Math.max(1,route.length-1),progress=Math.min(.99,(order.travelledDistance||0)/Math.max(1,order.distance||distance));
        addCargoTruck(order,route,{type:'Camión de exportación',title:`${factoryName} → ${order.destination||'mercado regional'}`,description:'Carga industrial en ruta por calles reales; el camión regresa vacío a la fábrica.',destination:order.destination||'Mercado regional',progress,side:.12});
      }
    }
    if(state.newSettlement&&Number(state.housingDemand?.unmet||0)>0){const cityPath=cityEntryRoute(openRoads),entry=[[-1,10],[0,10],[1,10],[2,10],[3,10],...cityPath].map(([x,y])=>tilePos(x,y));for(let i=0;i<3;i++)routeActors.push({actorKey:`inbound:${i}`,mesh:makeVehicle(['#d89368','#f1d493','#75ada8'][i]),route:[...entry,...entry.slice(0,-1).reverse()],offset:i*5.4,speed:.82+i*.08,side:i===1?.22:-.22,selection:{type:'Vehículo entrante',title:'Llegada por la ruta regional',description:'Familias recorren el acceso exterior y siguen por las calles conectadas hasta la ciudad; luego regresan por el mismo corredor.',metrics:[['Familias buscando vivienda',state.housingDemand.unmet||0],['Acceso','Ruta regional conectada'],['Destino','Calles interiores habilitadas']]}})}
    for(const airport of (state.airports||[]).filter(a=>a.operational&&a.monthlyFlights>0)){const route=[[airport.x,airport.y],[airport.x-1,airport.y-1],[airport.x-4,airport.y-3],[airport.x-8,airport.y-3]].map(([x,y])=>tilePos(x,y));routeActors.push({mesh:makePlane(),route,offset:0,speed:.7,side:0,height:4.6,selection:{type:'Avión de pasajeros',title:'Vuelo regional',description:'Aeronave conectada a la operación del aeropuerto local.',metrics:[['Pasajeros del mes',airport.monthlyPassengers||0],['Vuelos',airport.monthlyFlights||0],['Capacidad terminal',`${airport.passengerCapacity||800} personas`],['Estado',airport.pauseReason||'Ruta en servicio']]}})}
    for(const voyage of (state.supply?.portVoyages||[]).filter(v=>(v.status==='en ruta'||(v.direction==='importación'&&v.status==='atracado'))&&v.route?.length>1)){
      const incoming=voyage.direction==='importación',berth=voyage.status==='atracado',path=berth?[tilePos(...voyage.route.at(-1)),tilePos(...voyage.route.at(-1))]:voyage.route.map(([x,y])=>tilePos(x,y));
      routeActors.push({mesh:makeShip(),route:path,deliveryStartDay:incoming?voyage.departureDay:undefined,deliveryEndDay:incoming?voyage.arrivalDay:undefined,deliveryProgress:incoming?0:Math.min(.99,Math.max(0,((state.day||voyage.departureDay)-voyage.departureDay)/Math.max(1,voyage.arrivalDay-voyage.departureDay))),side:incoming ? .48 : 0,selection:{type:incoming?'Buque de importación':'Buque mercante',title:incoming?`Importación de acero · ${voyage.quantity||0} unidades`:`Buque de exportación · ${voyage.quantity||0} unidades`,description:incoming?'Remesa de acero comprada por la ciudad; el puerto limita la descarga diaria y cada unidad pasa al inventario real del proveedor.':'Viaje marítimo de exportación desde mercancía trasladada al puerto.',metrics:[['Estado',berth?`Atracado · descargado ${voyage.unloadedUnits||0}/${voyage.quantity||0}`:voyage.status],['Carga',`${voyage.quantity||0} ${incoming?'unidades de acero':'unidades'}`],...(incoming?[['Descargado',`${voyage.unloadedUnits||0} / ${voyage.quantity||0} unidades`]]:[]),['Salida',`día ${voyage.departureDay||0}`],['Arribo previsto',`día ${voyage.arrivalDay||0}`]]}})
    }
    for(const actor of routeActors){const old=previousActors.get(actorIdentity(actor));if(!old)continue;if(actor.parkingStay){actor.parkingPhase=old.parkingPhase||actor.parkingPhase;actor.parkingElapsed=old.parkingElapsed||0;actor.parkingDeparturePending=old.parkingDeparturePending||false;actor.parkingSteer=old.parkingSteer||0;actor.mesh.position.copy(old.position);actor.mesh.rotation.y=old.rotation;continue}if((actor.selection?.type==='Vehículo entrante'||actor.actorKey?.startsWith('shopping-')||actor.parkingDriving)&&!sameRoute(actor.route,old.route)){const oldTotal=Math.max(TILE,(old.route.length-1)*TILE),oldPhase=((simulationClock*(old.speed||actor.speed||1)+(old.offset||0))%(2*oldTotal)+2*oldTotal)%(2*oldTotal),mapped=projectRoutePhase(actor.route,old.position,oldPhase>oldTotal?-1:1);const loop=mapped.total*2;actor.offset=((mapped.phase-simulationClock*actor.speed)%loop+loop)%loop;actor.mesh.position.copy(old.position);actor.mesh.rotation.y=old.rotation;continue}if(actor.actorKey?.startsWith('shipment:'))continue;actor.route=old.route;actor.offset=old.offset;actor.busWaitUntil=old.busWaitUntil;actor.lastBusStopKey=old.lastBusStopKey;actor.busStopVisitCount=old.busStopVisitCount;actor.busStopVisitKey=old.busStopVisitKey;actor.railWaitUntil=old.railWaitUntil;actor.lastRailStopKey=old.lastRailStopKey;actor.railStopVisitCount=old.railStopVisitCount;actor.railStopVisitKey=old.railStopVisitKey;actor.mesh.position.copy(old.position);actor.mesh.rotation.y=old.rotation}
    for(const pool of [...walkerModelPool.values(),...bicycleModelPool.values(),...vehicleModelPool.values()])for(const model of pool)clear(model);walkerModelPool.clear();bicycleModelPool.clear();vehicleModelPool.clear();
    refreshServiceCoverage(state,chosen,view,openRoads);
    positionDeliveryActors();renderer.render(scene,camera);visualSignature=signature;sceneSyncRebuilds++;lastSceneSyncMs=performance.now()-syncStarted;
  }
  function setParkingIndicators(actor,active,now){
    const blink=active&&Math.floor(now/260)%2===0;
    for(const indicator of actor.mesh.userData.turnSignals||[])indicator.visible=blink;
    for(const wheel of actor.mesh.userData.steeringWheels||[])wheel.rotation.y=active?(actor.parkingSteer||0):0;
  }
  function updateParkingActor(actor,minute,wallDelta,now){
    const stay=actor.parkingStay,parking=actor.parking,mesh=actor.mesh;
    const phase=actor.parkingPhase||'waiting';
    if(minute<stay.start){
      actor.parked=false;
      if(phase==='gone'||phase==='parked'||phase==='departing'){actor.parkingPhase='waiting';actor.parkingElapsed=0;actor.parkingDeparturePending=false}
      mesh.visible=false;setParkingIndicators(actor,false,now);return;
    }
    if(minute>=stay.end){
      if(phase==='waiting'||phase==='gone'){actor.parkingPhase='gone';mesh.visible=false;setParkingIndicators(actor,false,now);return}
      if(phase==='arriving')actor.parkingDeparturePending=true;
      if(phase==='parked'){actor.parkingPhase='departing';actor.parkingElapsed=0}
    }else if(phase==='waiting'||phase==='gone'){
      actor.parkingPhase='arriving';actor.parkingElapsed=0;
    }
    const setPose=(along,lateral,yaw)=>{
      mesh.position.set(parking.centerX+parking.dx*along+parking.dz*lateral,.025,parking.centerZ+parking.dz*along-parking.dx*lateral);
      mesh.rotation.y=yaw;
    };
    if(actor.parkingPhase==='arriving'){
      actor.parked=false;mesh.visible=true;actor.parkingElapsed=(actor.parkingElapsed||0)+wallDelta;
      const progress=clamp(actor.parkingElapsed/2.15,0,1),steerSign=Math.sign(parking.side),rollEnd=.42;
      if(progress<rollEnd){
        const t=progress/rollEnd,smooth=t*t*(3-2*t),along=-.58+1.01*smooth;
        setPose(along,parking.laneSide,parking.yaw);actor.parkingSteer=steerSign*.25*(1-smooth);
      }else{
        const t=(progress-rollEnd)/(1-rollEnd),smooth=t*t*(3-2*t),along=.42*(1-smooth),lateral=parking.laneSide+(parking.side-parking.laneSide)*smooth;
        setPose(along,lateral,parking.yaw+steerSign*.38*Math.sin(Math.PI*t));actor.parkingSteer=-steerSign*.42*(1-smooth);
      }
      setParkingIndicators(actor,true,now);
      if(progress>=1){
        actor.parkingPhase='parked';actor.parkingElapsed=0;actor.parkingSteer=0;setPose(0,parking.side,parking.yaw);setParkingIndicators(actor,false,now);
        if(actor.parkingDeparturePending||minute>=stay.end){actor.parkingPhase='departing';actor.parkingElapsed=0}
      }
      return;
    }
    if(actor.parkingPhase==='parked'){
      actor.parked=true;mesh.visible=true;setPose(0,parking.side,parking.yaw);actor.parkingSteer=0;setParkingIndicators(actor,false,now);return;
    }
    if(actor.parkingPhase==='departing'){
      actor.parked=false;mesh.visible=true;actor.parkingElapsed=(actor.parkingElapsed||0)+wallDelta;
      const progress=clamp(actor.parkingElapsed/2.05,0,1),steerSign=Math.sign(parking.side),reverseEnd=.48;
      if(progress<reverseEnd){
        const t=progress/reverseEnd,smooth=t*t*(3-2*t),along=-.48*smooth,lateral=parking.side+(parking.laneSide-parking.side)*smooth;
        setPose(along,lateral,parking.yaw-steerSign*.34*Math.sin(Math.PI*t));actor.parkingSteer=steerSign*.4*(1-smooth);
      }else{
        const t=(progress-reverseEnd)/(1-reverseEnd),smooth=t*t*(3-2*t);
        setPose(-.48+1.16*smooth,parking.laneSide,parking.yaw);actor.parkingSteer=-steerSign*.2*(1-smooth);
      }
      setParkingIndicators(actor,true,now);
      if(progress>=1){actor.parkingPhase='gone';mesh.visible=false;actor.parkingSteer=0;setParkingIndicators(actor,false,now)}
      return;
    }
    mesh.visible=false;setParkingIndicators(actor,false,now);
  }
  function positionDeliveryActors(){
    for(const a of routeActors){
      if(a.deliveryProgress===undefined)continue;
      const count=a.route.length-1;if(count<1)continue;const deliveryProgress=a.deliveryStartDay!==undefined?clamp((visualGameDay-a.deliveryStartDay)/Math.max(1,a.deliveryEndDay-a.deliveryStartDay),0,.999):a.deliveryProgress,distance=clamp(count*TILE*deliveryProgress,0,count*TILE-.01),index=Math.min(count-1,Math.floor(distance/TILE)),f=(distance-index*TILE)/TILE,p=a.route[index],q=a.route[index+1],dx=q[0]-p[0],dz=q[1]-p[1],side=a.side||0;
      if(a.cargoEmptyAt!==null&&a.mesh.userData.cargoMeshes?.length)for(const cargo of a.mesh.userData.cargoMeshes)cargo.visible=deliveryProgress<a.cargoEmptyAt;
      a.mesh.position.set(p[0]+dx*f+dz/TILE*side,a.height||0,p[1]+dz*f-dx/TILE*side);a.mesh.rotation.y=Math.atan2(dx,dz);
    }
  }
  function animate(now){
    requestAnimationFrame(animate);
    if(softwareRenderer&&now-lastSoftwareRender<400)return;
    if(softwareRenderer)lastSoftwareRender=now;
    const wallDelta=Math.min(softwareRenderer?0.25:0.1,Math.max(0,(now-lastFrame)/1000));
    lastFrame=now;adaptRenderResolution(now);updateWind(wallDelta);
    if(simulationPaused){resize();updateVegetation();spectacle.tick(0,visualTimeOfDayMinutes,true);living3d.tick(0,visualTimeOfDayMinutes,true);immersive3d.tick(0,visualTimeOfDayMinutes,true,routeActors);const pausedHeadlights=visualTimeOfDayMinutes>=1110||visualTimeOfDayMinutes<350||Number(lastSceneState?.utilities?.report?.drainage?.rainfallMm||0)>0;updateTrafficHeadlights(routeActors,pausedHeadlights,now);updateTireSprays(now);renderer.render(scene,camera);return}
    simulationClock+=wallDelta*simulationSpeed;visualTimeOfDayMinutes=(visualTimeOfDayMinutes+wallDelta*simulationSpeed*15)%1440;visualGameDay+=wallDelta*simulationSpeed/96;updateLighting(visualTimeOfDayMinutes);resize();updateVegetation();spectacle.tick(wallDelta,visualTimeOfDayMinutes);living3d.tick(wallDelta,visualTimeOfDayMinutes);
    const signalPhase=Math.floor(simulationClock/9)%2,signalAmber=simulationClock%9>=8;
    for(const signal of signalBulbs){
      const green=signal.axis===signalPhase,amber=green&&signalAmber;
      for(let i=0;i<signal.red.length;i++){
        signal.red[i].material=mat(green?'#813d3a':'#f04f45',{emissive:'#ee453d',emissiveIntensity:green?.08:.9});
        signal.amber[i].material=mat('#806b3c',{emissive:'#ffd15d',emissiveIntensity:amber?.9:.06});
        signal.green[i].material=mat(green?'#53ca79':'#397352',{emissive:'#68ec8e',emissiveIntensity:green?.9:.08});
      }
    }
    const cursors=[];
    for(const a of routeActors){
      if(a.parkingStay){const minute=((visualTimeOfDayMinutes%1440)+1440)%1440;updateParkingActor(a,minute,wallDelta,now);continue}
      if(a.parkingVehicle){
        const minute=((visualTimeOfDayMinutes%1440)+1440)%1440,total=Math.max(TILE,(a.route.length-1)*TILE),ride=routineTravel(a,minute,total),vehicle=a.parkingVehicle,badge=a.mesh.userData.parkingSearchBadge;
        if(ride?.visible){a.parked=false;if(badge)badge.visible=false}
        else{
          const outbound=TRIP_WINDOWS[vehicle.outboundWindow]||TRIP_WINDOWS.morningPeak,back=TRIP_WINDOWS[vehicle.returnWindow]||TRIP_WINDOWS.eveningPeak,between=minute>=outbound[1]&&minute<back[0],slot=between?vehicle.destination:vehicle.origin,pose=parkingSlotPose(slot),fallback=between?a.route.at(-1):a.route[0];
          a.parked=true;a.mesh.visible=true;if(pose){a.mesh.position.set(pose.x,.025,pose.z);a.mesh.rotation.y=pose.yaw}else if(fallback){a.mesh.position.set(fallback[0],.025,fallback[1]);if(a.route[1])a.mesh.rotation.y=Math.atan2(a.route[1][0]-fallback[0],a.route[1][1]-fallback[1])}
          if(badge)badge.visible=false;setParkingIndicators(a,false,now);continue;
        }
      }
      if(a.stationPassenger){
        const minute=((visualTimeOfDayMinutes%1440)+1440)%1440,active=minute>=390&&minute<=1200,station=a.stationPassenger;
        if(!active){a.mesh.visible=false;continue}
        const train=routeActors.find(actor=>actor.railTrain&&String(actor.railLineId)===station.lineId&&actor.railAtStop&&actor.railStopVisitKey?.startsWith(station.tile+':'));
        if(train&&train.railStopVisitKey!==a.stationLastTrainVisit&&simulationClock>=(a.stationHiddenUntil||0)){
          a.stationLastTrainVisit=train.railStopVisitKey;a.stationWalkStarted=simulationClock;a.stationWalkDuration=2.2*simulationSpeed;a.stationHiddenUntil=simulationClock+8*simulationSpeed;
        }
        if(a.stationWalkStarted!==undefined&&simulationClock<a.stationWalkStarted+a.stationWalkDuration){
          const progress=clamp((simulationClock-a.stationWalkStarted)/Math.max(.1,a.stationWalkDuration),0,1),smooth=progress*progress*(3-2*progress);
          const from=station.boarding?station.exit:station.platform,to=station.boarding?station.platform:station.exit;
          a.mesh.visible=true;a.mesh.position.lerpVectors(from,to,smooth);a.mesh.rotation.y=Math.atan2(to.x-from.x,to.z-from.z);
          const gait=simulationClock*6.8+(a.offset||0),cycle=a.mesh.userData.walkCycle;if(cycle){cycle.legs[0].rotation.x=Math.sin(gait)*.4;cycle.legs[1].rotation.x=-Math.sin(gait)*.4;cycle.arms[0].rotation.x=-Math.sin(gait)*.3;cycle.arms[1].rotation.x=Math.sin(gait)*.3}
        }else if(simulationClock<(a.stationHiddenUntil||0))a.mesh.visible=false;
        else{a.stationWalkStarted=undefined;a.mesh.visible=true;a.mesh.position.copy(station.boarding?station.exit:station.platform)}
        continue;
      }
      if(a.activeMinutes){const minute=((visualTimeOfDayMinutes%1440)+1440)%1440;a.mesh.visible=minute>=a.activeMinutes[0]&&minute<=a.activeMinutes[1];if(!a.mesh.visible)continue}
      if(a.deliveryProgress!==undefined)continue;
      // Detención breve en las paradas asignadas a la línea; no altera frecuencias ni viajes simulados.
      a.busAtStop=a.busWaitUntil>simulationClock;
      if(a.busAtStop)a.offset-=wallDelta*simulationSpeed*a.speed;
      else if(a.busStopKeys?.size){
        const p=a.mesh.position;
        const tx=Math.round(p.x/TILE-.5),ty=Math.round(p.z/TILE-.5),tileKey=key(tx,ty);
        const center=tilePos(tx,ty);
        if(a.busStopKeys.has(tileKey)&&Math.hypot(p.x-center[0],p.z-center[1])<.46&&a.lastBusStopKey!==tileKey){
          a.busWaitUntil=simulationClock+2.4*simulationSpeed;a.lastBusStopKey=tileKey;a.busStopVisitCount=(a.busStopVisitCount||0)+1;a.busStopVisitKey=tileKey+':'+a.busStopVisitCount;
          a.offset-=wallDelta*simulationSpeed*a.speed;
        }
        if(!a.busStopKeys.has(tileKey))a.lastBusStopKey='';
      }
      a.railAtStop=a.railWaitUntil>simulationClock;
      if(a.railAtStop)a.offset-=wallDelta*simulationSpeed*a.speed;
      else if(a.railStopKeys?.size){
        const p=a.mesh.position,tx=Math.round(p.x/TILE-.5),ty=Math.round(p.z/TILE-.5),tileKey=key(tx,ty),center=tilePos(tx,ty);
        if(a.railStopKeys.has(tileKey)&&Math.hypot(p.x-center[0],p.z-center[1])<.48&&a.lastRailStopKey!==tileKey){
          a.railWaitUntil=simulationClock+2.8*simulationSpeed;a.lastRailStopKey=tileKey;a.railStopVisitCount=(a.railStopVisitCount||0)+1;a.railStopVisitKey=tileKey+':'+a.railStopVisitCount;a.railAtStop=true;
          a.offset-=wallDelta*simulationSpeed*a.speed;
        }
        if(!a.railStopKeys.has(tileKey))a.lastRailStopKey='';
      }
      const passengerDoor=a.mesh.userData.railPassengerDoor;
      if(passengerDoor&&!a.mesh.userData.railFreightTrain){const closed=a.mesh.userData.railPassengerDoorClosedZ??.16;passengerDoor.position.z+=( (a.railAtStop?closed+.13:closed)-passengerDoor.position.z)*.2}
      a.serviceAtStop=a.serviceWaitUntil>simulationClock;
      if(a.serviceAtStop)a.offset-=wallDelta*simulationSpeed*a.speed;
      else if(a.serviceStops?.size){
        const p=a.mesh.position,tx=Math.round(p.x/TILE-.5),ty=Math.round(p.z/TILE-.5),tileKey=key(tx,ty),center=tilePos(tx,ty),kind=a.serviceStops.get(tileKey);
        if(kind&&Math.hypot(p.x-center[0],p.z-center[1])<.46&&a.lastServiceStopKey!==tileKey){
          a.serviceWaitUntil=simulationClock+(kind==='container'?2.2:1.8)*simulationSpeed;a.serviceStopKind=kind;a.serviceStopKey=tileKey;a.lastServiceStopKey=tileKey;a.serviceAtStop=true;a.offset-=wallDelta*simulationSpeed*a.speed;
        }
        if(!kind)a.lastServiceStopKey='';
      }
      const count=a.route.length-1,total=count*TILE;if(count<1)continue;
      const routine=routineTravel(a,visualTimeOfDayMinutes,total);if(a.hideOutsideRoutine&&!routine){a.mesh.visible=false;for(const bag of a.shoppingBags||[])bag.visible=false;continue}if(routine){a.mesh.visible=routine.visible;if(!routine.visible){for(const bag of a.shoppingBags||[])bag.visible=false;continue}}
      const travel=routine?routine.travel:((simulationClock*a.speed+a.offset)%(2*total)+2*total)%(2*total),direction=travel>total?-1:1,distance=travel>total?2*total-travel:travel;
      if(a.shoppingBags){const leavingStore=routine?routine.leg>0:direction===-1;for(const bag of a.shoppingBags)bag.visible=leavingStore}
      let index=Math.min(count-1,Math.floor(distance/TILE)),f=(distance-index*TILE)/TILE;
      if(direction<0&&distance<=0){index=0;f=0}
      const isWalker=a.selection?.type==='Peatones'||a.selection?.type==='Residente'||a.selection?.type==='Visitante de plaza',p=a.route[index],q=a.route[index+1],dx=q[0]-p[0],dz=q[1]-p[1];
      let progress=direction===1?f:1-f;
      const nextTile=direction===1?a.route[index+1]:a.route[index],gridX=Math.round(nextTile[0]/TILE-.5),gridY=Math.round(nextTile[1]/TILE-.5);
      const signalKey=key(gridX,gridY),axis=Math.abs(dx)>Math.abs(dz)?0:1,roadVehicle=!isWalker&&!a.metroProjection&&!a.railTrain&&!a.selection?.type?.includes('Avión')&&!a.selection?.type?.includes('Buque');
      const waiting=(roadVehicle||isWalker)&&signalTiles.has(signalKey)&&axis!==signalPhase;
      if(waiting)progress=Math.min(progress,.76);
      const from=direction===1?a.route[index]:a.route[index+1],to=direction===1?a.route[index+1]:a.route[index],laneClass=Math.abs(a.side||.18)>.6?'ciclista':'motor';
      const laneKey=`${Math.round(from[0]/TILE-.5)},${Math.round(from[1]/TILE-.5)} > ${Math.round(to[0]/TILE-.5)},${Math.round(to[1]/TILE-.5)}:${laneClass}`;
      const routeKey=roadVehicle?(a.trafficRouteKey||(a.trafficRouteKey=a.route.map(point=>Math.round(point[0]*100)+','+Math.round(point[1]*100)).join(';'))):'',routeQueueKey=roadVehicle?routeKey+':'+direction+':'+laneClass:'';
       cursors.push({a,index,f,progress,direction,p,q,dx,dz,isWalker,routine,waiting,vehicle:roadVehicle,laneKey,routeQueueKey,count});
    }
    // Mantén una distancia de seguridad entre vehículos que avanzan por el mismo carril.
    applyTrafficQueue(cursors,.5);
    for(const c of cursors){
      const {a,direction,isWalker,routine}=c,count=a.route.length-1;let index=c.index,progress=c.progress;
      while(progress<0&&index-direction>=0&&index-direction<count){index-=direction;progress+=1}
      if(progress<0)progress=0;
       const p=a.route[index],q=a.route[index+1],dx=q[0]-p[0],dz=q[1]-p[1];let f=direction===1?progress:1-progress;
       const next=a.route[direction===1?Math.min(count,index+2):Math.max(0,index-1)],ndx=direction===1?next[0]-q[0]:next[0]-p[0],ndz=direction===1?next[1]-q[1]:next[1]-p[1],turn=progress>.75&&(direction===1?index<count-1:index>0)?(progress-.75)/.25:0,bend=turn&&Math.abs(ndx*dz-ndz*dx)>0?turn*turn*(3-2*turn)*.16:0,side=a.railTrain?0:isWalker?a.side:a.parkingDriving?-Math.max(0,Math.abs(a.side||0))*direction:-Math.max(.29,Math.abs(a.side||.18))*direction;let targetX=p[0]+dx*f+dz/TILE*side+ndx/TILE*bend,targetZ=p[1]+dz*f-dx/TILE*side+ndz/TILE*bend;
       if(isWalker&&routine){const t=routine.progress,first=a.route[routine.reverse?count:0],last=a.route[routine.reverse?0:count],band=.055,smooth=v=>v*v*(3-2*v);if(t<band){const blend=smooth(t/band);targetX=first[0]*(1-blend)+targetX*blend;targetZ=first[1]*(1-blend)+targetZ*blend}else if(t>1-band){const blend=smooth((t-(1-band))/band);targetX=targetX*(1-blend)+last[0]*blend;targetZ=targetZ*(1-blend)+last[1]*blend}}
       a.mesh.position.set(targetX,a.height||0,targetZ);const angle=Math.atan2(dx*direction+ndx/TILE*bend,dz*direction+ndz/TILE*bend),delta=Math.atan2(Math.sin(angle-a.mesh.rotation.y),Math.cos(angle-a.mesh.rotation.y));a.mesh.rotation.y+=delta*.22;const collectionRig=a.mesh.userData.collectionRig;if(collectionRig){const collecting=Boolean(a.serviceAtStop&&a.serviceStopKind==='container'),serviceBin=collecting?wasteContainerModels.get(a.serviceStopKey):null;collectionRig.collection.visible=collecting;collectionRig.lift.rotation.x+=(collecting?-1.48-collectionRig.lift.rotation.x:-collectionRig.lift.rotation.x)*.14;if(collectionRig.arm)collectionRig.arm.rotation.x+=(collecting?-.92-collectionRig.arm.rotation.x:-collectionRig.arm.rotation.x)*.18;if(a.serviceBin&&a.serviceBin!==serviceBin){a.serviceBin.position.copy(a.serviceBin.userData.serviceBasePosition);a.serviceBin.rotation.copy(a.serviceBin.userData.serviceBaseRotation);a.serviceBin=null}if(serviceBin){const base=serviceBin.userData.serviceBasePosition,cycle=Math.abs(Math.sin(simulationClock*2.4+(a.offset||0)));serviceBin.position.y=base.y+.48*cycle;serviceBin.rotation.z=serviceBin.userData.serviceBaseRotation.z-.58*cycle;a.serviceBin=serviceBin}else if(a.serviceBin){a.serviceBin.position.copy(a.serviceBin.userData.serviceBasePosition);a.serviceBin.rotation.copy(a.serviceBin.userData.serviceBaseRotation);a.serviceBin=null}}if(isWalker&&a.mesh.userData.walkCycle){const cycle=a.mesh.userData.walkCycle,gait=simulationClock*(5.2+Math.min(2,a.speed||0)*1.5)+(a.offset||0)+cycle.phase;cycle.legs[0].rotation.x=Math.sin(gait)*.48;cycle.legs[1].rotation.x=Math.sin(gait+Math.PI)*.48;cycle.arms[0].rotation.x=Math.sin(gait+Math.PI)*.38;cycle.arms[1].rotation.x=Math.sin(gait)*.38;if(cycle.torso)cycle.torso.position.y=.75+Math.abs(Math.sin(gait*2))*.018}const bike=a.mesh.userData.bikeCycle;if(bike){const cadence=simulationClock*7.5+bike.phase;bike.crank.rotation.x=cadence;for(const wheel of bike.wheels)wheel.rotation.x=cadence*.55}
    }
    positionDeliveryActors();
    const ambientTime=now*.004;
    for(const f of fireVisuals){const t=simulationClock*.8+f.seed;for(const p of f.flames){const q=(t+p.phase)%1.15;p.mesh.position.set(f.fx+Math.sin(t*4+p.phase*9)*.13,.48+q*1.85,f.fz+Math.cos(t*3+p.phase*8)*.11);p.mesh.scale.set(.82+Math.sin(t*8+p.phase*12)*.2,Math.max(.05,Math.sin(q*Math.PI)),.82+Math.sin(t*8+p.phase*12)*.2);p.mesh.material.opacity=.92*(1-q*.42);p.mesh.rotation.z=Math.sin(t*5+p.phase*7)*.18}for(const p of f.smoke){const q=(t*.34+p.phase)%1;p.mesh.position.set(f.fx+Math.sin(t*1.4+p.phase*8)*(.18+q*.4),1.42+q*3.15,f.fz+Math.cos(t*1.2+p.phase*9)*(.18+q*.4));p.mesh.scale.setScalar(.62+q*1.45);p.mesh.material.opacity=.42*(1-q)}}
    immersive3d.tick(wallDelta,visualTimeOfDayMinutes,false,routeActors);
    const lampsOn=visualTimeOfDayMinutes>=1110||visualTimeOfDayMinutes<350||
      Number(lastSceneState?.utilities?.report?.drainage?.rainfallMm||0)>0;
    updateTrafficHeadlights(routeActors,lampsOn,now);
    updateTireSprays(now);
    for(let i=0;i<waves.length;i++)waves[i].material.opacity=.23+.11*Math.sin(now*.0014+i);
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  function projectLocalPosition(position){return position.clone().multiplyScalar(MAP_WORLD_SCALE).project(camera)}
  function projectTile(x,y,height=2.5){
    updateCamera();
    const projected=new THREE.Vector3((x+.5)*TILE*MAP_WORLD_SCALE,height*MAP_WORLD_SCALE,(y+.5)*TILE*MAP_WORLD_SCALE).project(camera);
    const width=canvas.clientWidth,heightPixels=canvas.clientHeight;
    const visible=projected.z>=-1&&projected.z<=1&&projected.x>-.96&&projected.x<.96&&projected.y>-.95&&projected.y<.96;
    return {x:(projected.x+1)*width/2,y:(1-projected.y)*heightPixels/2,visible};
  }
  function screenToMap(px,py){updateCamera();const w=canvas.clientWidth,h=canvas.clientHeight;raycaster.setFromCamera(new THREE.Vector2(px/w*2-1,1-py/h*2),camera);if(!raycaster.ray.intersectPlane(groundPlane,hit))return [NaN,NaN];return [hit.x/(TILE*MAP_WORLD_SCALE),hit.z/(TILE*MAP_WORLD_SCALE)]}
  function screenToTile(px,py){const [x,y]=screenToMap(px,py);return [Number.isFinite(x)?Math.floor(x):-1,Number.isFinite(y)?Math.floor(y):-1]}
  function screenToActor(px,py){updateCamera();const w=canvas.clientWidth,h=canvas.clientHeight,candidates=[];for(const actor of routeActors){if(!actor.selection)continue;const point=projectLocalPosition(actor.mesh.position);if(point.z<-1||point.z>1)continue;const sx=(point.x+1)*w/2,sy=(1-point.y)*h/2,d=Math.hypot(sx-px,sy-py),limit=smallScreen?26:20;if(d<=limit)candidates.push({actor,d,z:point.z})}candidates.sort((a,b)=>a.d-b.d||a.z-b.z);return living3d.residentHit(px,py)||candidates[0]?.actor.selection||immersive3d.inspect(px,py)||null}
  function setView(nextView){
    const wasFar=shouldUseFarBuildingLOD();view=nextView;updateShadowQuality();
    if(wasFar!==shouldUseFarBuildingLOD()&&lastSceneState){visualSignature='';sync(lastSceneState,lastChosenTile,nextView);return}
    updateCamera();updateVegetation();updateLandShading(landShadeState);renderer.render(scene,camera)
  }
  function focusTile(x,y,nextView=view){view={...nextView};updateShadowQuality();resize();updateVegetation();const yaw=Math.PI/4+view.rotation*Math.PI/2,right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),upGround=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),span=58/clamp(view.zoom,.43,4),units=span/Math.max(1,canvas.clientHeight),dx=(cameraAnchor.x*TILE-(Number(x)+.5)*TILE)*MAP_WORLD_SCALE,dz=(cameraAnchor.y*TILE-(Number(y)+.5)*TILE)*MAP_WORLD_SCALE;view.panX=(dx*right.x+dz*right.z)/units;view.panY=(dx*upGround.x+dz*upGround.z)/units;updateCamera();updateLandShading(landShadeState);renderer.render(scene,camera);return{panX:view.panX,panY:view.panY}}
  const buildPreviewCache=new Map(),previewWidth=144,previewHeight=100,previewCanvas=document.createElement('canvas');let previewRenderer=null;
  const previewScene=new THREE.Scene();previewScene.background=new THREE.Color('#dce9da');previewScene.add(new THREE.HemisphereLight('#fff8e7','#637b68',1.3));const previewSun=new THREE.DirectionalLight('#fff0cd',2.1);previewSun.position.set(4,8,6);previewScene.add(previewSun);const previewCamera=new THREE.PerspectiveCamera(32,previewWidth/previewHeight,.1,30);previewCamera.position.set(3.7,3.1,4.8);previewCamera.lookAt(0,1,0);

  function finishBuildPreview(group,item){
    const tool=item.tool,model=item.model||'';
    if(tool==='home')return;
    if(['shop','factory','hotel','civic','fireStation','depot','busGarage','busStop','airport','port','powerPlant','waterPlant','gasPlant','wastewaterPlant','landfill','recyclingPlant','school'].includes(tool)&&!(tool==='civic'&&model==='urbanPark')){
      refinedArchitecture(group,{kind:tool,serviceModel:model,business:{industryType:item.industry||'food'},x:2,y:3});
    }
    if(tool==='road'){
      for(const x of [-1.54,1.54])roundedBox(group,.12,.095,1.62,'#c4b69b',x,.075,0,.025);
      for(const x of [-1.2,1.2])for(const z of [-.58,.58])roundedBox(group,.18,.035,.14,'#eee6d0',x,.095,z,.012);
      cylinder(group,.17,.17,.025,'#58625e',0,.075,0,18);ring(group,.145,.012,'#b1b7aa',0,.092,0);
    }else if(tool==='bridge'){
      for(const z of [-.74,.74]){
        roundedBox(group,3.55,.13,.1,'#d9dfd1',0,.73,z,.035);
        for(const x of [-1.38,-.92,-.46,0,.46,.92,1.38])rodBetween(group,[x,.28,z],[x,.72,z],.03,'#819995',7);
        pipe(group,[[-1.65,.78,z],[0,.8,z],[1.65,.78,z]],'#e4e4d5',.018);
      }
      for(const x of [-.8,.8])ring(group,.19,.022,'#9bb4b0',x,.19,0,{rotationX:Math.PI/2});
    }else if(tool==='taxiStop'){
      for(const x of [-.58,.58])roundedBox(group,.15,.13,.15,'#66776d',x,.11,0,.035);
      roundedBox(group,1.05,.07,.18,'#e9c566',0,.85,.38,.02);
      for(const x of [-.35,.35])cylinder(group,.055,.055,.24,'#506b69',x,1.05,.39,10);
      ring(group,.16,.025,'#f2dfad',0,.42,.49);sphere(group,.09,'#567c82',0,.42,.51,2);
    }else if(tool==='wasteContainer'){
      roundedBox(group,1,.82,.72,'#517c66',0,.43,0,.12);
      roundedBox(group,1.07,.13,.79,'#394f46',0,.88,0,.045);
      roundedBox(group,.51,.09,.12,'#e6c56f',0,.91,.4,.025);
      for(const x of [-.36,.36]){const w=cylinder(group,.11,.11,.06,'#2d413a',x,.095,.22,12);w.rotation.z=Math.PI/2;ring(group,.055,.012,'#b7c2ad',x+Math.sign(x)*.035,.095,.22,{rotationY:Math.PI/2})}
      for(const x of [-.25,.25])roundedBox(group,.2,.19,.03,'#e1e8d7',x,.42,.37,.025);
    }else if(tool==='powerLine'||tool==='telecomLine'){
      for(const x of [-.52,.52])ring(group,.08,.012,'#e3c892',x,1.75,.06,{rotationX:Math.PI/2});
      for(const x of [-.5,.5])rodBetween(group,[x,1.4,0],[0,1.74,0],.018,'#b5a488',6);
    }else if(['waterPipe','sewerLine','drainLine','gasLine'].includes(tool)){
      for(const y of [.12,.3])ring(group,.2,.025,'#d5ded4',0,y,.2,{rotationX:Math.PI/2});
      for(const x of [-.22,.22])cylinder(group,.045,.045,.12,'#e6d9bb',x,.59,.06,10);
    }else if(tool.startsWith('zoneHome')||tool.startsWith('zoneShop')||tool.startsWith('zoneFactory')||tool.startsWith('zoneOffice')){
      for(const x of [-1.42,1.42])for(const z of [-1.42,1.42]){
        roundedBox(group,.16,.62,.16,'#e9dfc7',x,.33,z,.035);
        sphere(group,.085,'#f2d786',x,.7,z,2);
      }
    }else if(tool!=='bridge'&&tool!=='railLink'&&tool!=='metroLink'&&tool!=='metroStation'&&tool!=='railStation'){
      roundedBox(group,1.75,.06,1.65,'#d6cbb3',0,.08,0,.035);
    }
  }

  function makeBuildPreview(item){
    const group=new THREE.Group(),tool=item.tool,model=item.model||'',industry=item.industry||'food',label=(item.title||'').toLowerCase();previewScene.add(group);
    plane(group,3.7,3.7,'#9fc58d',0,-.08,0);
    if(tool==='road'){box(group,3.35,.08,1.62,'#43494b',0,.01,0);for(let x=-1.2;x<1.5;x+=.65)box(group,.38,.015,.045,'#e6d9a8',x,.06,0)}
    else if(tool==='bridge'){
      plane(group,3.7,2.25,'#6caec0',0,-.05,0);
      box(group,3.45,.13,1.45,'#48535b',0,.22,0);
      for(const z of [-.73,.73]){box(group,3.4,.12,.07,'#d4ddd3',0,.67,z);for(const x of [-1.4,-.45,.45,1.4])box(group,.08,.53,.08,'#a3b5b0',x,.44,z)}
      for(const x of [-.8,.8])cylinder(group,.14,.2,.46,'#748d8d',x,-.02,0,10);
    }
    else if(tool.startsWith('zoneHome')||tool.startsWith('zoneShop')||tool.startsWith('zoneFactory')||tool.startsWith('zoneOffice')){const color=tool.startsWith('zoneHome')?'#4eaf75':tool.startsWith('zoneShop')?'#4da6c4':tool.startsWith('zoneOffice')?'#8e83c4':'#daa94c';box(group,2.8,.08,2.8,color,0,.02,0);for(const x of [-1.42,1.42])box(group,.09,.5,.09,'#f4edcf',x,.27,0)}
    else if(tool==='home')house(group,{x:3,y:2,level:1,urbanCondition:90,architecturalStyle:''});
    else if(tool==='shop')shop(group,{name:'Mercado de barrio',business:{status:'abierto'}});
    else if(tool==='factory')factory(group,{business:{industryType:industry,lastProduction:2}});
    else if(tool==='office')office(group,{business:{lastWorkers:18},density:'high'});
    else if(tool==='civic'){
      if(model==='urbanPark')urbanPark(group);
      else if(model==='tvHeadend'||model==='wifiHub')digitalUtilityBuilding(group,model);
      else if(model.startsWith('police'))policeStationModel(group,model==='policeHQ'?3:model==='policeStation'?2:1);
      else if(model==='cemetery'||model==='crematorium')funeralFacility(group,model);
      else if(model==='socialShelter')socialShelter(group);
      else if(model==='elderCare')clinic(group);
      else clinic(group);
      if(model==='generalHospital'){box(group,1.4,.85,.9,'#e0d9c8',-.4,3.15,-.12);box(group,1.48,.1,.98,'#b87068',-.4,3.6,-.12)}
    }
    else if(tool==='school'){school(group);if(model==='university'){box(group,1.4,1.1,1,'#ccd6ca',0,2.8,-.2);box(group,1.55,.1,1.1,'#476b88',0,3.4,-.2)}}
    else if(tool==='fireStation')fireStation(group);
    else if(tool==='depot'){if(model==='taxiYard')taxiDepot(group);else depot(group)}
    else if(tool==='metroStation'||tool==='railStation')railStationModel(group,tool==='railStation'?'elevated':'metro');
    else if(tool==='metroLink'||tool==='railLink'){
      railStationModel(group,tool==='railLink'?'elevated':'metro');
      box(group,3.2,.05,.1,tool==='railLink'?'#687f83':'#37a4b1',0,tool==='railLink'?1.83:.18,-1.1);
    }
    else if(tool==='busGarage')busGarage(group);
    else if(tool==='busStop'){busShelter(group)}
    else if(tool==='taxiStop'){box(group,1.35,.07,.72,'#566d61',0,1.2,0);for(const x of [-.58,.58])box(group,.07,1.15,.07,'#6a7363',x,.58,0);box(group,.92,.12,.12,'#e5bd58',0,.75,.37);box(group,.42,.35,.08,'#fff1c7',0,.39,.43);box(group,.32,.14,.08,'#dca63f',0,.38,.49)}
    else if(tool==='port'||tool==='airport'||tool==='hotel'||tool==='powerPlant'||tool==='waterPlant'||tool==='gasPlant'||tool==='wastewaterPlant'||tool==='landfill'||tool==='recyclingPlant'){
      const color=tool==='port'?'#568c8f':tool==='airport'?'#7b9693':tool==='hotel'?'#bb8768':tool==='powerPlant'?'#c39450':tool==='waterPlant'?'#599aa6':tool==='gasPlant'?'#d0ae6e':tool==='wastewaterPlant'?'#6c93a0':tool==='recyclingPlant'?'#739b76':'#928a69';box(group,2.05,1.25,1.8,color,0,.68,0);box(group,2.2,.12,1.92,'#516c69',0,1.36,0);for(const x of [-.55,.55]){box(group,.5,.55,.12,'#c9d9ce',x,.85,.94);box(group,.6,.07,.16,'#d7aa61',x,1.18,1.02)}if(tool==='airport')box(group,3.2,.05,.42,'#454b4b',0,.03,1.55);if(tool==='port')box(group,2.55,.1,.58,'#8a9c90',0,.08,1.1);if(tool==='powerPlant')cylinder(group,.18,.22,.95,'#757d75',-.4,1.85,-.35,16)}
    else if(tool==='powerLine'||tool==='waterPipe'||tool==='sewerLine'||tool==='drainLine'||tool==='gasLine'||tool==='telecomLine'){const color=tool==='powerLine'||tool==='telecomLine'?'#725f4e':tool==='waterPipe'?'#4b9fbd':tool==='gasLine'?'#dd9b4f':'#786f8d';if(tool==='powerLine'||tool==='telecomLine'){box(group,.1,2,.1,color,0,1,0);box(group,1.3,.09,.09,color,0,1.75,0);for(const x of [-.5,.5])box(group,.06,.65,.06,color,x,1.45,0)}else{cylinder(group,.2,.2,.85,color,0,.15,0,20);cylinder(group,.17,.17,.1,'#d1e2dc',0,.6,0,20)}}
    else if(tool==='wasteContainer'){box(group,.95,.85,.7,'#517c66',0,.43,0);box(group,1.02,.12,.76,'#394f46',0,.88,0);box(group,.5,.08,.12,'#e6c56f',0,.91,.4)}
    else {box(group,1.65,1.2,1.45,'#c9bb9f',0,.62,0);box(group,1.78,.12,1.58,'#5b7c73',0,1.26,0);box(group,.65,.55,.12,'#6a9ca3',0,.57,.79)}
    finishBuildPreview(group,item);group.rotation.y=-.4;const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());group.position.set(-center.x,-bounds.min.y+.1,-center.z);const scale=3.5/Math.max(size.x,size.y,size.z,1);group.scale.setScalar(scale);return group;
  }
  function renderBuildPreviews(items){
    const todo=items.filter(({canvas:target,item})=>target&&item&&!buildPreviewCache.has(JSON.stringify(item)));
    if(!todo.length){for(const entry of items)paintBuildPreview(entry);return}
    try{previewRenderer ||= new THREE.WebGLRenderer({canvas:previewCanvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});previewRenderer.setPixelRatio(1);previewRenderer.setSize(previewWidth,previewHeight,false);previewRenderer.outputColorSpace=THREE.SRGBColorSpace;previewRenderer.toneMapping=THREE.ACESFilmicToneMapping;previewRenderer.toneMappingExposure=.98;
      for(const {item} of todo){let model=null;try{const key=JSON.stringify(item);model=makeBuildPreview(item);previewRenderer.render(previewScene,previewCamera);const snapshot=document.createElement('canvas');snapshot.width=previewWidth;snapshot.height=previewHeight;const context=snapshot.getContext('2d');context.drawImage(previewCanvas,0,0,previewWidth,previewHeight);buildPreviewCache.set(key,new Uint8ClampedArray(context.getImageData(0,0,previewWidth,previewHeight).data))}catch(error){console.warn(`No se pudo dibujar la vista 3D de ${item.title}`,error)}finally{if(model){previewScene.remove(model);model.traverse(object=>{if(object.geometry&&!object.geometry.userData.shared)object.geometry.dispose()})}}}
    }catch(error){console.warn('No se pudo renderizar la galería 3D',error)}for(const entry of items)paintBuildPreview(entry);
  }
  function paintBuildPreview({canvas:target,item}){if(!target||!item)return;const data=buildPreviewCache.get(JSON.stringify(item));if(!data)return;const ctx=target.getContext('2d');if(!ctx)return;target.width=previewWidth;target.height=previewHeight;ctx.putImageData(new ImageData(data,previewWidth,previewHeight),0,0)}
  window.addEventListener('resize',updateCamera);
  return {sync,screenToTile,screenToMap,screenToActor,setView,focusTile,projectTile,renderBuildPreviews,
    captureFrame(){updateCamera();updateLighting(visualTimeOfDayMinutes);spectacle.tick(0,visualTimeOfDayMinutes,true);living3d.tick(0,visualTimeOfDayMinutes,true);immersive3d.tick(0,visualTimeOfDayMinutes,true,routeActors);renderer.render(scene,camera);return canvas.toDataURL('image/png')},
    getResidentLocation:id=>living3d.getResidentLocation(id),
    getCinematicSubjects:()=>routeActors.filter(a=>a.selection&&a.mesh&&a.route?.length>1).slice(0,85).map((a,i)=>({id:a.actorKey||a.selection.type+':'+a.selection.title+':'+i,type:a.selection.type,title:a.selection.title,x:a.mesh.position.x/TILE-.5,y:a.mesh.position.z/TILE-.5})),
    invalidate(){visualSignature=''},
    getSceneDiagnostics:()=>({mapWorldScale:MAP_WORLD_SCALE,mapCellWorldSize:MAP_CELL_WORLD_SIZE,farBuildingLOD:shouldUseFarBuildingLOD(),lastSceneSyncMs:Number(lastSceneSyncMs.toFixed(1)),sceneSyncRebuilds,sceneSyncFastPaths,animatedPedestrians:routeActors.filter(a=>a.mesh.userData.walkCycle).length,animatedCyclists:routeActors.filter(a=>a.mesh.userData.bikeCycle).length,cachedBuildingModels:buildingModels.size,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometryCount:renderer.info.memory.geometries,pixelRatio:renderer.getPixelRatio(),renderFps:Number(renderFps.toFixed(1)),vegetationLOD,vegetationInstances,vegetationTrees:vegetationTreeCount,vegetationBatches:vegetationBatchCount,canvasWidth:canvas.width,canvasHeight:canvas.height,shadowMapEnabled:renderer.shadowMap.enabled,shadowMapSize:activeShadowMapSize,contextLost:renderer.getContext().isContextLost(),paused:simulationPaused,dynamicObjects:dynamicRoot.children.length,...spectacle.diagnostics(),...living3d.diagnostics(),...immersive3d.diagnostics(),metroStations:dynamicRoot.children.filter(m=>m.userData.metroStation).length,physicalRailStations:dynamicRoot.children.filter(m=>m.userData.railStationSite).length,metroTunnelSegments:dynamicRoot.children.filter(m=>m.userData.metroTunnelSegment).length,metroTrains:trafficRoot.children.filter(m=>m.userData.metroProjection).length,railTrains:trafficRoot.children.filter(m=>m.userData.railTrain).length,railTracks:dynamicRoot.children.filter(m=>m.userData.railTrack).length,railPlatforms:dynamicRoot.children.filter(m=>m.userData.railPlatform).length,streetLightCount:streetLights.length,illuminatedStreetlights:streetLights.filter(l=>poweredStreetlights.has(key(l.x,l.y))).length,tunnel:{visible:gatewayTunnel.visible,roofVisible:tunnelRoof.visible,length:tunnelRoof.geometry.parameters.width}}),
    getMaritimeActors:()=>routeActors.filter(a=>a.selection?.type?.includes('Buque')).map(a=>{const p=projectLocalPosition(a.mesh.position);return {type:a.selection.type,title:a.selection.title,x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2,visible:p.z>=-1&&p.z<=1&&p.x>-.98&&p.x<.98&&p.y>-.98&&p.y<.98,position:[a.mesh.position.x,a.mesh.position.z]}}),
    getInspectableActors:()=>routeActors.filter(a=>a.selection).map(a=>{const p=projectLocalPosition(a.mesh.position);return {type:a.selection.type,title:a.selection.title,x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2,visible:p.z>=-1&&p.z<=1&&p.x>-.98&&p.x<.98&&p.y>-.98&&p.y<.98,routeLength:a.route?.length||0,rotationY:a.mesh.rotation.y}}),getEntryTrafficRoutes:()=>routeActors.filter(a=>a.actorKey?.startsWith('inbound:')).map(a=>({id:a.actorKey,route:a.route.map(point=>[Math.round(point[0]/TILE-.5),Math.round(point[1]/TILE-.5)]),position:[a.mesh.position.x,a.mesh.position.z]})),
    getFireParticleCounts:()=>({incidents:fireVisuals.length,flames:fireVisuals.reduce((n,f)=>n+f.flames.length,0),smoke:fireVisuals.reduce((n,f)=>n+f.smoke.length,0)}),
    getCoverageTiles:()=>dynamicRoot.children.filter(m=>m.userData.serviceCoverage).map(m=>({x:m.position.x,z:m.position.z,radius:m.userData.serviceRadius,width:m.geometry?.parameters?.width||0})),
    getEmergencyActors:()=>trafficRoot.children.filter(m=>m.userData.emergencyRole).map(m=>({
      type:m.userData.emergencyRole,id:m.userData.emergencyId,visible:m.visible,
      inScene:m.parent===trafficRoot,position:[m.position.x,m.position.z],
      moving:routeActors.some(a=>a.mesh===m),routeLength:routeActors.find(a=>a.mesh===m)?.route.length||0
    }))};
}
