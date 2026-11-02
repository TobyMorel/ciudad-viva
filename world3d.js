import * as THREE from './vendor/three.module.js';
import {applyTrafficQueue} from './traffic.js';
import {daylightIntensity} from './simulation_time.js';
import {metroVisualPlan} from './metro_visuals.js';

const TILE=2, LAND_CHUNK_SIZE=8;
const COLORS={grass:'#80af70',sand:'#e4d3ae',water:'#389dac',road:'#3f464b',walk:'#d5ccba',line:'#f2df9c',home:'#e9c99e',shop:'#a3c9bd',civic:'#e7d1b0'};
const key=(x,y)=>`${x},${y}`;
const waterTile=(x,y)=>x===24||x===25;
const tilePos=(x,y)=>[(x+.5)*TILE,(y+.5)*TILE];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function seeded(n){let x=Math.sin(n*127.1+78.233)*43758.5453;return x-Math.floor(x)}

export function createWorld(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  const smallScreen=window.innerWidth<650;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,smallScreen?1.1:1.18));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.98;
  renderer.shadowMap.enabled=!smallScreen;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#bcd9df');scene.fog=new THREE.Fog('#bcd9df',132,240);
  const camera=new THREE.OrthographicCamera(-40,40,30,-30,.1,350);
  const hemi=new THREE.HemisphereLight('#fff5e5','#597d6e',.94);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#ffe4bb',2.65);sun.position.set(3,31,28);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;sun.shadow.camera.near=1;sun.shadow.camera.far=100;sun.shadow.bias=-.00035;sun.shadow.normalBias=.025;sun.shadow.radius=4;scene.add(sun);sun.target.position.set(28,0,20);scene.add(sun.target);
  const staticRoot=new THREE.Group(),vegetationRoot=new THREE.Group(),dynamicRoot=new THREE.Group(),trafficRoot=new THREE.Group();scene.add(staticRoot,vegetationRoot,dynamicRoot,trafficRoot);
  const materials=new Map(),geometries=new Map();
  function mat(color,opts={}){const id=color+JSON.stringify(opts);if(!materials.has(id))materials.set(id,new THREE.MeshStandardMaterial({color,roughness:.87,metalness:0,...opts}));return materials.get(id)}
  function geometry(id,make){if(!geometries.has(id)){const value=make();value.userData.shared=true;geometries.set(id,value)}return geometries.get(id)}
  function box(parent,w,h,d,color,x=0,y=0,z=0,options={}){const mesh=new THREE.Mesh(geometry(`b:${w}:${h}:${d}`,()=>new THREE.BoxGeometry(w,h,d)),typeof color==='string'?mat(color):color);mesh.position.set(x,y,z);mesh.castShadow=options.cast===true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
  function sphere(parent,r,color,x,y,z,detail=2){const mesh=new THREE.Mesh(geometry(`s:${r}:${detail}`,()=>new THREE.IcosahedronGeometry(r,detail)),mat(color));mesh.position.set(x,y,z);mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh}
  function cylinder(parent,topRadius,bottomRadius,height,color,x,y,z,segments=18){const mesh=new THREE.Mesh(geometry(`c:${topRadius}:${bottomRadius}:${height}:${segments}`,()=>new THREE.CylinderGeometry(topRadius,bottomRadius,height,segments)),mat(color));mesh.position.set(x,y,z);mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh}
  function plane(parent,w,d,color,x,y,z,options={}){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),typeof color==='string'?mat(color,options):color);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh}
  function groundShadow(parent,x,z,r,opacity=.18){const mesh=new THREE.Mesh(new THREE.CircleGeometry(r,24),mat('#355746',{transparent:true,opacity,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.scale.y=.62;mesh.position.set(x+.2,-.105,z+.18);parent.add(mesh)}
  function line(parent,points,color='#ffdf90',opacity=1){const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const material=new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity});material.userData.ephemeral=true;const m=new THREE.Line(geometry,material);parent.add(m);return m}
  function clear(group){group.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)o.geometry.dispose();if(o.material&&o.material.userData?.ephemeral)o.material.dispose()});group.clear()}

  // La textura terrestre se genera en el navegador: no necesita descargar recursos.
  const texCanvas=document.createElement('canvas');texCanvas.width=768;texCanvas.height=768;const tc=texCanvas.getContext('2d');tc.fillStyle='#87b77a';tc.fillRect(0,0,768,768);
  for(let i=0;i<650;i++){const x=seeded(i+1)*768,y=seeded(i+902)*768,r=8+seeded(i+1902)*42;const grad=tc.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,i%3?'#acd08b55':'#5b9f7855');grad.addColorStop(1,'#91bb8500');tc.fillStyle=grad;tc.beginPath();tc.arc(x,y,r,0,Math.PI*2);tc.fill()}
  for(let i=0;i<2600;i++){const x=seeded(i+302)*768,y=seeded(i+777)*768;tc.fillStyle=i%7===0?'#e7dba579':'#c0d6a95c';tc.fillRect(x,y,.8+seeded(i)*1.7,.8+seeded(i+1)*1.5)}
  const grassTex=new THREE.CanvasTexture(texCanvas);grassTex.colorSpace=THREE.SRGBColorSpace;grassTex.wrapS=grassTex.wrapT=THREE.RepeatWrapping;grassTex.repeat.set(2000,2000);grassTex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  let infiniteGroundOffset={x:0,z:0};const infiniteGround=[plane(staticRoot,40000,40000,mat('#8dbb7b'),0,-.24,0),plane(staticRoot,40000,40000,new THREE.MeshStandardMaterial({map:grassTex,roughness:1}),0,-.16,0)];
  const gatewayTunnel=new THREE.Group();gatewayTunnel.position.set(4*TILE,0,10.5*TILE);staticRoot.add(gatewayTunnel);
  // La boca cubre los cuatro tramos de carretera exterior (x=0..3) y llega a la entrada urbana.
  const tunnelLength=4.4,tunnelCenter=-1.9,tunnelRoof=box(gatewayTunnel,tunnelLength,.34,2.32,'#b7ad95',tunnelCenter,2.02,0,{cast:true});
  box(gatewayTunnel,tunnelLength,.07,1.98,'#4c5754',tunnelCenter,1.82,0,{cast:false});
  for(const z of [-1.08,1.08]){box(gatewayTunnel,tunnelLength,2,.28,'#978f7c',tunnelCenter,.91,z,{cast:true});box(gatewayTunnel,tunnelLength,.13,.34,'#c0b59a',tunnelCenter,1.88,z,{cast:false})}
  box(gatewayTunnel,.24,2.25,2.16,'#172629',.12,1.05,0,{cast:false});
  const archPts=[];for(let i=0;i<=16;i++){const a=Math.PI-i*Math.PI/16;archPts.push(new THREE.Vector3(.12,1.12+Math.sin(a)*1.08,Math.cos(a)*1.08))}const tunnelArch=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts),48,.16,12,false),mat('#c2b69a'));tunnelArch.castShadow=true;tunnelArch.receiveShadow=true;gatewayTunnel.add(tunnelArch);
  for(const z of [-.84,.84]){box(gatewayTunnel,.26,1.1,.28,'#c2b69a',.12,.55,z,{cast:true});box(gatewayTunnel,.35,.15,.35,'#d0c3a6',.12,1.12,z,{cast:false})}
  for(const x of [-3.85,-2.95,-2.05,-1.15,-.45])for(const z of [-1.16,1.16])box(gatewayTunnel,.32,.16,.36,'#b3a990',x,1.91,z,{cast:false});
  // Río continuo de norte a sur: cauce sinuoso y dos riberas sobre terreno jugable.
  const waterMat=mat(COLORS.water,{metalness:.08,roughness:.28,transparent:true,opacity:.97});
  function riverEdges(z){const center=49+.45*Math.sin(z*.055)+.18*Math.sin(z*.13+1),half=2.25+.12*Math.sin(z*.083+2);return[center-half,center+half]}
  function riverStrip(kind){const vertices=[],indices=[];for(let i=0;i<=5000;i++){const z=-20000+i*8,[west,east]=riverEdges(z);let left,right,height;if(kind==='water'){left=west;right=east;height=-.095}else if(kind==='west'){left=west-.56;right=west+.07;height=-.065}else{left=east-.07;right=east+.56;height=-.065}vertices.push(left,height,z,right,height,z);if(i<5000){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3)}}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,kind==='water'?waterMat:mat('#d9c9a3',{side:THREE.DoubleSide}));mesh.receiveShadow=true;staticRoot.add(mesh)}
  riverStrip('water');riverStrip('west');riverStrip('east');
  const waves=[];
  for(let i=0;i<100;i++){const z=-100+seeded(i+145)*200,[west,east]=riverEdges(z),x=west+.6+seeded(i+130)*(east-west-1.2),w=.25+seeded(i+132)*.6;waves.push(line(staticRoot,[[x-w/2,-.044,z],[x+w/2,-.044,z]],i%4?'#d8f0e6':'#a2d9d8',.32))}
  for(let i=0;i<110;i++){const z=-110+seeded(i+70)*220,[west,east]=riverEdges(z),x=(i%2?west-.32:east+.32)+(seeded(i+210)-.5)*.22,r=.09+seeded(i+18)*.17;const rock=sphere(staticRoot,r,i%3?'#b9ad91':'#d7c9a8',x,-.035,z,1);rock.scale.y=.5}
  function tree(x,z,seed,parent=vegetationRoot){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=seeded(seed+92)*Math.PI*2;const species=Math.floor(seeded(seed+8)*5),s=(.65+seeded(seed+55)*.55)*(species===2?.76:1),blossom=species===4&&seeded(seed+11)>.48,olive=species===3;groundShadow(g,0,0,.59*s,.19);const trunk=cylinder(g,.075*s,.12*s,.87*s,olive?'#716e52':'#775c45',0,.42*s,0,12);trunk.castShadow=!smallScreen&&seeded(seed+333)>.65;const palette=blossom?['#d58da9','#e5a9bb','#f1c3c8']:olive?['#719466','#94a36b','#8daa77']:species===1?['#3d8060','#568f5f','#79aa68']:['#4d8957','#67a45d','#8bb664'];const lobes=smallScreen?4:species===1?6:5;for(let i=0;i<lobes;i++){const a=i*Math.PI*2/lobes,spread=species===1?.31:.23,px=Math.cos(a)*spread*s,pz=Math.sin(a)*spread*s,y=(species===2?1.0:1.12)*s+(i%2)*.1*s;sphere(g,(species===1?.32:.27)*s,palette[i%3],px,y,pz,2)}const crown=sphere(g,(species===2?.39:.36)*s,palette[1],0,(species===2?1.15:1.3)*s,0,2);crown.castShadow=!smallScreen&&seeded(seed+333)>.65;if(!smallScreen&&species!==2)for(let i=0;i<3;i++){const a=i*2.4;sphere(g,.065*s,blossom?'#f4d5d2':'#b4c978',Math.cos(a)*.26*s,1.15*s+Math.sin(i*5)*.12*s,Math.sin(a)*.26*s,1)}parent.add(g);return g}
  const vegetationObstacles=new Set();let vegetationKey='';
  function updateVegetation(){const w=canvas.clientWidth,h=canvas.clientHeight,unit=(58/clamp(view.zoom,.55,4))/Math.max(1,h),chunkX=Math.floor((view.panX*unit+cameraAnchor.x*TILE)/16),chunkY=Math.floor((view.panY*unit+cameraAnchor.y*TILE)/16),signature=`${chunkX}:${chunkY}:${view.rotation}:${Math.round(view.zoom*4)}:${w}:${h}`;if(signature===vegetationKey)return;vegetationKey=signature;const corners=[[0,0],[w,0],[0,h],[w,h]].map(([x,y])=>screenToTile(x,y)),xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]),minX=Math.min(...xs)-3,maxX=Math.max(...xs)+3,minY=Math.min(...ys)-3,maxY=Math.max(...ys)+3,span=Math.max(maxX-minX,maxY-minY);clear(vegetationRoot);const density=smallScreen?.17:span>58?.10:.23;for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const id=(x+50000)*7919+(y+50000)*104729;if(vegetationObstacles.has(key(x,y))||waterTile(x,y)||seeded(id)>density)continue;const [cx,cz]=tilePos(x,y),dx=(seeded(id+1)-.5)*1.05,dz=(seeded(id+2)-.5)*1.05;if(seeded(id+3)<.84)tree(cx+dx,cz+dz,id);else{const g=new THREE.Group();g.position.set(cx+dx,0,cz+dz);const r=.16+seeded(id+4)*.18;sphere(g,r,seeded(id+5)>.5?'#a99a7b':'#729a65',0,r*.64,0,1).scale.y=.6;if(seeded(id+6)>.58)sphere(g,r*.7,'#93ad6c',r*.72,r*.56,.04,1);vegetationRoot.add(g)}}}
  let poweredStreetlights=new Set();
  const routeActors=[],fireVisuals=[],signalBulbs=[],streetLights=[],signalTiles=new Set();
  const actorIdentity=a=>a.selection?`${a.selection.type}:${a.selection.title}:${(a.selection.people||[]).map(p=>p.id).join(',')}`:null;
  const tripSelection=(trip,modeLabel)=>({type:modeLabel,title:modeLabel==='Peatones'?'Personas caminando':'Vehículo particular',description:`Viaje de ${trip.reason==='trabajo'?'trabajo':trip.reason==='compras'?'compras':'servicios'} en la simulación actual.`,metrics:[['Pasajeros',trip.workers||0],['Vehículos',trip.vehicles||0],['Origen',trip.from?`${trip.from[0]+1}, ${trip.from[1]+1}`:'—'],['Destino',trip.to?`${trip.to[0]+1}, ${trip.to[1]+1}`:'—'],['Distancia',`${trip.distance||0} tramos`],['Tiempo estimado',`${trip.estimatedMinutes||0} min`]],people:trip.people||[]});
  const raycaster=new THREE.Raycaster(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
  let view={zoom:1,panX:0,panY:0,rotation:0},cameraAnchor={x:14,y:10},lastFrame=0,simulationClock=0,simulationSpeed=1,simulationPaused=false,visualTimeOfDayMinutes=360,visualGameDay=1,visualSignature='',lastProjection='';
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const dpr=renderer.getPixelRatio();if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr))renderer.setSize(w,h,false);const projection=`${w}:${h}:${view.zoom}`;if(projection===lastProjection)return;lastProjection=projection;const span=58/clamp(view.zoom,.55,4),aspect=w/h;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix()}
  function updateCamera(){resize();const yaw=Math.PI/4+view.rotation*Math.PI/2,span=58/clamp(view.zoom,.55,4),units=span/Math.max(1,canvas.clientHeight);const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),upGround=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const target=new THREE.Vector3(cameraAnchor.x*TILE,0,cameraAnchor.y*TILE).addScaledVector(right,-view.panX*units).addScaledVector(upGround,-view.panY*units),recycle=20000;for(const axis of ['x','z']){const delta=target[axis]-infiniteGroundOffset[axis];if(Math.abs(delta)>10000)infiniteGroundOffset[axis]+=Math.trunc(delta/recycle)*recycle;for(const ground of infiniteGround)ground.position[axis]=infiniteGroundOffset[axis]}sun.target.position.set(target.x,0,target.z);sun.position.set(target.x+3,31,target.z+28);camera.position.copy(target).add(new THREE.Vector3(Math.sin(yaw)*60,65,Math.cos(yaw)*60));camera.lookAt(target);camera.updateMatrixWorld()}
  const daySky=new THREE.Color('#bcd9df'),nightSky=new THREE.Color('#172633'),twilightSky=new THREE.Color('#cb9b79'),dayGround=new THREE.Color('#597d6e'),nightGround=new THREE.Color('#253b4c'),sunDay=new THREE.Color('#ffe4bb'),sunNight=new THREE.Color('#8096c4'),hemiNight=new THREE.Color('#9fbad0'),hemiDay=new THREE.Color('#fff5e5'),tempSky=new THREE.Color(),tempHemi=new THREE.Color(),tempGround=new THREE.Color();
  function updateLighting(minutes){const daylight=daylightIntensity(minutes),horizon=clamp(1-Math.abs(((minutes%1440)+1440)%1440-720)/180,0,1);tempSky.copy(nightSky).lerp(daySky,daylight).lerp(twilightSky,horizon*(1-daylight)*.72);scene.background.copy(tempSky);scene.fog.color.copy(tempSky);tempHemi.copy(hemiNight).lerp(hemiDay,daylight);hemi.color.copy(tempHemi);tempGround.copy(nightGround).lerp(dayGround,daylight);hemi.groundColor.copy(tempGround);hemi.intensity=.38+daylight*.64;sun.color.copy(sunNight).lerp(sunDay,daylight);sun.intensity=.24+daylight*2.35;renderer.toneMappingExposure=.84+daylight*.18;const glow=1-daylight;for(const lamp of streetLights){const powered=poweredStreetlights.has(key(lamp.x,lamp.y));lamp.light.intensity=powered?glow*3.2:0;lamp.bulb.material.emissiveIntensity=powered?glow*3.2:0;lamp.pool.material.opacity=powered?glow*.4:0}}
  function addRoad(root,x,y,roads,stress=0,signals=false){const [cx,cz]=tilePos(x,y),n=roads.has(key(x,y-1)),s=roads.has(key(x,y+1)),e=roads.has(key(x+1,y)),w=roads.has(key(x-1,y)),degree=Number(n)+Number(s)+Number(e)+Number(w);const asphalt=view.trafficOverlay?(stress>.8?'#c64e48':stress>.45?'#e88b48':stress>.2?'#e7be58':'#55af82'):COLORS.road;box(root,1.37,.055,1.37,COLORS.walk,cx,.006,cz,{cast:false});box(root,1.03,.052,1.03,asphalt,cx,.052,cz,{cast:false});
    for(const [dx,dy] of [[1,0],[0,1]]){if(!roads.has(key(x+dx,y+dy)))continue;const horizontal=dx===1,sx=cx+dx,zs=cz+dy;box(root,horizontal?2.08:1.37,.055,horizontal?1.37:2.08,COLORS.walk,sx,.006,zs,{cast:false});box(root,horizontal?2.08:1.03,.052,horizontal?1.03:2.08,asphalt,sx,.052,zs,{cast:false});for(const step of [-.55,.55])box(root,horizontal?.27:.025,.008,horizontal?.025:.27,COLORS.line,sx+(horizontal?step:0),.083,zs+(horizontal?0:step),{cast:false})}
    if(degree===2&&n&&s||degree===2&&e&&w){for(const step of [-.31,.31])box(root,e&&w?.27:.025,.009,e&&w?.025:.27,COLORS.line,cx+(e&&w?step:0),.084,cz+(n&&s?step:0),{cast:false})}
    if(degree>=3){for(const [dx,dy,on] of [[0,-1,n],[0,1,s],[-1,0,w],[1,0,e]]){if(!on)continue;for(let j=-2;j<=2;j++){const shift=j*.16;box(root,dx?.14:.09,.009,dy?.14:.09,'#f6f1de',cx+(dx?.53*dx:shift),.085,cz+(dy?.53*dy:shift),{cast:false})}}}
    if(signals){const approaches=[{on:n,ox:.62,oz:-.62,yaw:Math.PI,axis:1},{on:s,ox:-.62,oz:.62,yaw:0,axis:1},{on:e,ox:.62,oz:.62,yaw:Math.PI/2,axis:0},{on:w,ox:-.62,oz:-.62,yaw:-Math.PI/2,axis:0}];for(const a of approaches){if(!a.on)continue;const g=new THREE.Group();g.position.set(cx+a.ox,0,cz+a.oz);g.rotation.y=a.yaw;root.add(g);cylinder(g,.025,.035,.8,'#42515a',0,.42,0,12);box(g,.13,.43,.13,'#263944',0,.88,0);box(g,.18,.06,.11,'#344a4e',0,1.13,.035);const red=sphere(g,.038,'#f04f45',0,.99,.085,2),amber=sphere(g,.034,'#806b3c',0,.88,.085,2),green=sphere(g,.038,'#397352',0,.77,.085,2);red.material=mat('#813d3a',{emissive:'#ee453d',emissiveIntensity:.08});amber.material=mat('#806b3c',{emissive:'#ffd15d',emissiveIntensity:.06});green.material=mat('#397352',{emissive:'#68ec8e',emissiveIntensity:.08});signalBulbs.push({red,amber,green,axis:a.axis})}}
    // Una farola cada dos tramos en cada dirección. El brazo apunta al asfalto,
    // nunca sobre la acera; la orientación alterna solo el lado de montaje.
    if((x+y)%2===0){const horizontal=e||w,side=(x+y)%2?1:-1,px=horizontal?cx:cx+side*.59,pz=horizontal?cz+side*.59:cz,headX=horizontal?cx:px-side*.27,headZ=horizontal?pz-side*.27:cz;box(root,.065,1.34,.065,'#4b5755',px,.69,pz);const arm=box(root,.06,.045,.48,'#4b5755',(px+headX)/2,1.34,(pz+headZ)/2);if(!horizontal)arm.rotation.y=Math.PI/2;const bulb=sphere(root,.115,'#ffe4a6',headX,1.3,headZ,2);bulb.material=mat('#ffe4a6',{emissive:'#ffc76b',emissiveIntensity:0});const light=new THREE.PointLight('#ffca70',0,8,2);light.position.set(headX,1.2,headZ);root.add(light);const pool=new THREE.Mesh(new THREE.CircleGeometry(1.45,20),new THREE.MeshBasicMaterial({color:'#ffd17a',transparent:true,opacity:0,depthWrite:false,toneMapped:false}));pool.rotation.x=-Math.PI/2;pool.position.set(headX,.072,headZ);root.add(pool);streetLights.push({light,bulb,pool,x,y})}
  }
  function addZone(root,z){const [x,y]=tilePos(z.x,z.y),color=z.kind==='home'?'#65bb80':z.kind==='factory'?'#e1bd48':'#5eb1bf';plane(root,1.62,1.62,mat(color,{transparent:true,opacity:.29,depthWrite:false}),x,.08,y);const p=[[-.84,-.84],[.84,-.84],[.84,.84],[-.84,.84],[-.84,-.84]].map(([a,b])=>[x+a,.09,y+b]);line(root,p,color,.95);for(const a of [-.7,.7])for(const b of [-.7,.7])box(root,.1,.15,.1,color,x+a,.12,y+b)}
  let lockSpriteMap;
  function addLandLock(root,chunk){const size=chunk.chunkSize||LAND_CHUNK_SIZE,[x,z]=tilePos(chunk.chunkX*size+size/2,chunk.chunkY*size+size/2);plane(root,size*1.6,size*1.6,mat('#15282d',{transparent:true,opacity:.54,depthWrite:false}),x,.11,z);if(!lockSpriteMap){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;const ctx=canvas.getContext('2d');ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowColor='#243c3a88';ctx.shadowBlur=12;ctx.shadowOffsetY=5;ctx.fillStyle='#fff5d7';ctx.beginPath();ctx.roundRect(12,17,104,126,24);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#344e4b';ctx.lineWidth=8;ctx.beginPath();ctx.arc(64,65,25,Math.PI,0);ctx.lineTo(89,97);ctx.moveTo(39,65);ctx.lineTo(39,97);ctx.stroke();ctx.fillStyle='#e5ac51';ctx.beginPath();ctx.roundRect(25,85,78,48,11);ctx.fill();ctx.strokeStyle='#344e4b';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#344e4b';ctx.beginPath();ctx.arc(64,102,6,0,Math.PI*2);ctx.fill();ctx.fillRect(61,103,6,12);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;lockSpriteMap=texture;}const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:lockSpriteMap,transparent:true,depthWrite:false,depthTest:false}));sprite.position.set(x,1.55,z);sprite.scale.set(1.6,2,1);sprite.renderOrder=30;sprite.userData.landLocked=true;root.add(sprite)}
  function sideWindow(g,x,y,z,wide=.19){box(g,wide,.31,.045,'#f7f2d6',x,y,z);box(g,wide*.75,.24,.05,'#5b9eae',x,y,z+.035);box(g,.025,.29,.065,'#ede6cb',x,y,z+.05)}
  function flankWindows(g,w,floors){for(let floor=0;floor<floors;floor++)for(const z of [-.37,.37]){const y=.67+floor*.76;for(const side of [-1,1]){box(g,.047,.32,.21,'#eee4d1',side*(w/2+.024),y,z);box(g,.055,.23,.14,'#78a9af',side*(w/2+.054),y,z);box(g,.07,.05,.22,'#e8dbbd',side*(w/2+.06),y-.17,z)}}}
  function roof(g,w,d,h,color){const shape=new THREE.Shape();shape.moveTo(-w*.52,0);shape.lineTo(0,.47);shape.lineTo(w*.52,0);shape.closePath();const fill=new THREE.Mesh(geometry(`roof:${w}:${d}`,()=>new THREE.ExtrudeGeometry(shape,{depth:d+.14,bevelEnabled:false})),mat('#cba88a'));fill.position.set(0,h,-(d+.14)/2);fill.receiveShadow=true;g.add(fill);const left=box(g,w*.74,.09,d+.25,color,-w*.26,h+.23,0,{cast:true});left.rotation.z=.62;const right=box(g,w*.74,.09,d+.25,color,w*.26,h+.23,0,{cast:true});right.rotation.z=-.62;box(g,.08,.085,d+.28,'#e2b282',0,h+.48,0);for(const z of [-d*.3,0,d*.3]){const trimL=box(g,w*.72,.017,.025,'#d79569',-w*.26,h+.29,z);trimL.rotation.z=.62;const trimR=box(g,w*.72,.017,.025,'#d79569',w*.26,h+.29,z);trimR.rotation.z=-.62}}
  function house(g,b){const h=b.level>=2?2.8:2.15,w=1.5,d=1.42,variant=(b.x*3+b.y*7)%5,wall=b.architecturalStyle==='Contemporáneo rehabilitado'?'#d9d2bd':b.urbanCondition<55?'#b7a88e':['#e5c49b','#e8d7b1','#d4aaa0','#cabca0','#abc7af'][variant],roofColor=['#a65f58','#a87557','#88615b','#a06454','#667d76'][variant];box(g,w,h,d,wall,0,h/2+.08,0,{cast:true});box(g,w+.08,.15,d+.07,'#f8e8c9',0,.19,0);if(['Moderno','Contemporáneo','Actual','Contemporáneo rehabilitado'].includes(b.architecturalStyle)&&variant===4){box(g,w+.12,.15,d+.12,roofColor,0,h+.14,0);box(g,.58,.22,.47,'#d7c99e',-.36,h+.31,-.22)}else roof(g,w,d,h+.08,roofColor);const floors=b.level>=2?3:2;for(let floor=0;floor<floors;floor++)for(const x of [-.43,.43])sideWindow(g,x,.65+floor*.77,d/2+.035);flankWindows(g,w,floors);box(g,.29,.57,.08,'#5f746d',0,.41,d/2+.075);for(const x of [-.43,.43]){box(g,.27,.035,.09,'#f2e3ce',x,.48,d/2+.11);box(g,.22,.05,.12,'#78a889',x,.42,d/2+.14)}box(g,.32,.045,.18,'#d4bca0',0,.75,d/2+.11);box(g,.46,.04,.25,'#d3ac7d',0,.14,d/2+.26);for(const x of [-.6,.6])box(g,.045,.34,.045,'#ede8c8',x,.88,d/2+.08);box(g,1.35,.055,.16,'#d5a074',0,.72,d/2+.16);box(g,.11,.5,.11,'#725750',.48,h+.55,-.26)}
  function shop(g,b){const h=b.name==='Talleres del Puerto'?1.9:2.1,closed=b.business?.status==='cerrado';box(g,1.72,h,1.55,b.name==='Talleres del Puerto'?'#9ab8ad':COLORS.shop,0,h/2+.08,0,{cast:true});box(g,1.87,.17,1.72,'#4e7774',0,h+.1,0);flankWindows(g,1.72,2);box(g,1.64,.22,.22,closed?'#77706b':'#d99069',0,1.48,.86);for(let i=-1;i<=1;i++)box(g,.43,.85,.055,closed?'#68797b':'#53969e',i*.51,.77,.81);box(g,1.57,.1,.07,'#e8dcc5',0,1.2,.85);for(const x of [-.6,.6])box(g,.11,.1,.55,'#e9b36f',x,1.56,1.03);box(g,.55,.31,.12,'#f1e4c6',0,1.74,.84);box(g,.42,.035,.14,closed?'#8c6555':'#4a8d88',0,1.73,.92);box(g,.45,.3,.4,'#819b96',-.35,h+.35,-.15);if(closed)box(g,1.2,.12,.08,'#8b5c4e',0,.28,.91)}
  function powerPlant(g){box(g,1.6,1.15,1.2,'#c7baa0',0,.62,-.08,{cast:true});box(g,1.78,.16,1.4,'#58787a',0,1.27,-.08);for(const x of [-.52,.52]){cylinder(g,.26,.38,.66,'#e7ded0',x,.44,-.55,14);cylinder(g,.34,.3,.18,'#e7ded0',x,.86,-.55,14);box(g,.18,.42,.18,'#a65f54',x,1.55,-.56)}box(g,.5,.43,.08,'#d8a75d',-.35,.59,.55);for(const x of [-.78,.78])for(const z of [-.6,.58])cylinder(g,.07,.09,.12,'#526b64',x,.08,z)}
  function gasPlant(g){box(g,1.66,.72,1.26,'#b5b6a3',0,.43,0,{cast:true});box(g,1.74,.1,1.34,'#55766b',0,.84,0);for(const x of [-.49,.49]){cylinder(g,.3,.34,.9,'#d2c7a5',x,.49,-.32,18);cylinder(g,.31,.31,.1,'#dbaa64',x,.98,-.32,18);box(g,.14,.42,.15,'#b36a51',x,1.21,-.32)}for(const z of [-.62,.62])box(g,1.68,.08,.1,'#c99c57',0,.17,z);box(g,.68,.4,.08,'#d9b469',0,.53,.69)}
  function waterPlant(g){box(g,1.68,.82,1.3,'#ded5bd',-.1,.48,-.12,{cast:true});box(g,1.78,.12,1.42,'#637e79',-.1,.94,-.12);cylinder(g,.5,.48,.92,'#74aeb2',.48,.54,-.38,20);cylinder(g,.53,.5,.12,'#d8e8d9',.48,1.03,-.38,20);for(const x of [-.64,-.2]){box(g,.26,.44,.28,'#8db8ae',x,.32,.49);box(g,.29,.06,.31,'#e4ead5',x,.56,.49)}box(g,.1,.54,.1,'#528c91',-.75,.27,-.65);for(const x of [-.76,.76])for(const z of [-.66,.65])cylinder(g,.07,.09,.12,'#526b64',x,.08,z)}
  function wastewaterPlant(g){box(g,1.72,.78,1.35,'#b8c8b9',-.12,.45,-.12,{cast:true});box(g,1.82,.12,1.45,'#617b72',-.12,.9,-.12);for(const [x,z,color] of [[-.48,-.42,'#7bb4a9'],[.43,-.42,'#829d92'],[-.48,.38,'#8ab0a2'],[.43,.38,'#72968d']]){cylinder(g,.34,.32,.58,color,x,.35,z,18);cylinder(g,.37,.34,.09,'#d6ddc8',x,.67,z,18)}box(g,.12,.66,.12,'#819590',.77,.35,-.56);box(g,.48,.08,.45,'#d9c7a5',.48,.1,.63);for(const x of [-.74,.74])for(const z of [-.62,.62])cylinder(g,.07,.09,.12,'#526b64',x,.08,z)}
  function hotel(g,b){const floors=4,closed=b.business?.status==='cerrado';box(g,1.63,2.85,1.42,closed?'#8d9990':'#e4d7bd',0,1.48,0,{cast:true});box(g,1.75,.17,1.54,closed?'#686e68':'#3e7778',0,2.98,0);box(g,1.88,.12,1.65,'#b27762',0,.18,0);for(let floor=0;floor<floors;floor++){for(const x of [-.52,0,.52]){box(g,.31,.42,.055,closed?'#78807b':'#71aeb2',x,.62+floor*.64,.74);box(g,.34,.055,.07,'#f3e7d0',x,.39+floor*.64,.78)}box(g,1.7,.055,.06,'#f1e6cf',0,.97+floor*.64,.76)}box(g,.66,.48,.12,closed?'#797a72':'#c56f5b',0,2.38,.78);box(g,.48,.28,.08,'#f8e6c8',0,2.39,.86);for(const x of [-.62,.62])box(g,.16,.22,.48,'#5c8d67',x,.31,.95);box(g,.5,.62,.12,'#6b7774',0,.42,.81);for(const x of [-.8,.8])for(const z of [-.66,.66]){cylinder(g,.09,.11,.12,'#5b735e',x,.09,z);sphere(g,.17,'#548b61',x,.34,z,1)}if(closed)box(g,1.1,.1,.08,'#9e6656',0,.25,.88)}
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
  // Complementos reutilizables: todas las fachadas se modelan para las cuatro rotaciones de cámara.
  function planter(g,x,z,color='#5e9664'){box(g,.21,.17,.19,'#b8795c',x,.18,z);sphere(g,.16,color,x,.39,z,1)}
  function balcony(g,x,y,z){box(g,.58,.055,.34,'#dfccb0',x,y,z);for(const dx of [-.25,0,.25])box(g,.025,.28,.025,'#465d56',x+dx,y+.15,z+.15);box(g,.58,.025,.025,'#465d56',x,y+.29,z+.15);box(g,.22,.11,.12,'#c48765',x,y+.09,z+.03);sphere(g,.12,'#6caa68',x,y+.23,z+.03,1)}
  function premiumArchitecture(g,b){const type=b.kind,variant=Math.abs(b.x*13+b.y*19)%5;
    if(type==='home'){
      const high=b.level>=2,h=high?2.8:2.15,d=.71;
      for(const y of high?[.7,1.47,2.24]:[.7,1.47])for(const x of [-.42,.42]){box(g,.34,.37,.06,'#f4ead2',x,y,-d-.035);box(g,.25,.27,.07,'#69929b',x,y,-d-.078);box(g,.36,.045,.12,'#ead6b5',x,y-.2,-d-.09)}
      for(const y of high?[.56,1.36,2.14]:[.56,1.36]){box(g,1.53,.045,.055,'#eed8bc',0,y,.745);box(g,1.53,.045,.055,'#eed8bc',0,y,-.745)}
      if(variant%2===0){balcony(g,-.43,high?1.89:1.55,.84);balcony(g,.43,high?1.89:1.55,.84)}
      if(variant===1||variant===4){box(g,.09,.35,.09,'#9b6854',-.48,h+.52,-.24);box(g,.17,.06,.17,'#d6a77b',-.48,h+.72,-.24)}
      planter(g,-.78,.62,variant===3?'#d69ba5':'#6ba363');planter(g,.78,-.63,'#6e9d61');
    }else if(type==='shop'){
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
    if(!['road','landfill','recyclingPlant','airport','port'].includes(kind)){
      box(g,.72,.07,.36,'#d0bdab',0,.13,.93,{cast:false});
      for(const x of [-.72,.72]){
        box(g,.075,.09,.37,'#d7c7b5',x,.17,.82,{cast:false});
        sphere(g,.16,hash%2?'#7ba68c':'#b88eaa',x,.28,.86,1);
      }
    }
    if(kind==='home'){
      const top=b.level>=2?2.7:2.0;
      for(const x of [-.49,.49]){
        box(g,.38,.06,.25,'#f4e7da',x,top-.45,.79,{cast:false});
        box(g,.27,.12,.15,hash%3?'#b8c7a5':'#d6a6ab',x,top-.38,.86,{cast:false});
      }
      if(hash%3===0){box(g,.62,.035,.55,'#758b80',0,top+.47,-.15);for(const x of [-.2,.2])box(g,.22,.015,.43,'#4a6e79',x,top+.5,-.15)}
      if(!smallScreen)for(const x of [-.5,.5])sphere(g,.13,'#e4b8b2',x,.45,1.02,1);
    }else if(kind==='shop'||kind==='hotel'){
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
  }
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
  function railStationModel(g,mode='metro',progress=1){
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
  function addBuilding(root,b,roads,renewalKeys){const [cx,cz]=tilePos(b.x,b.y),g=new THREE.Group();g.position.set(cx,0,cz);if(roads.has(key(b.x,b.y-1)))g.rotation.y=Math.PI;else if(roads.has(key(b.x+1,b.y)))g.rotation.y=Math.PI/2;else if(roads.has(key(b.x-1,b.y)))g.rotation.y=-Math.PI/2;root.add(g);groundShadow(g,0,0,1.25,.17);box(g,1.96,.055,1.96,'#d9ceb0',0,.025,0,{cast:false});if(b.name==='Municipalidad')townHall(g);else if(b.kind==='civic'&&['tvHeadend','wifiHub'].includes(b.serviceModel))digitalUtilityBuilding(g,b.serviceModel);else if(b.kind==='civic'&&['policePost','policeStation','policeHQ'].includes(b.serviceModel))policeStationModel(g,b.serviceModel==='policeHQ'?3:b.serviceModel==='policeStation'?2:1);else if(b.kind==='civic'&&b.serviceModel==='socialShelter')socialShelter(g);else if(b.kind==='civic'&&['cemetery','crematorium'].includes(b.serviceModel))funeralFacility(g,b.serviceModel);else if(b.kind==='civic')clinic(g);else if(b.kind==='school'){school(g);if(b.serviceModel==='kindergarten'){for(const x of [-.5,.5])sphere(g,.2,'#e9b35e',x,.3,1.05,1)}else if(b.serviceModel==='secondarySchool'||b.serviceModel==='university'){const high=b.serviceModel==='university';box(g,1.4,high?1.18:.52,1,'#c5cec2',0,high?2.35:1.93,-.2,{cast:true});box(g,1.52,.1,1.12,high?'#446b8b':'#577d72',0,high?3.01:2.27,-.2);if(high)cylinder(g,.14,.16,.35,'#e8c17e',0,3.26,-.2)}}else if(b.kind==='fireStation'){fireStation(g);if(b.serviceModel==='fireStationPlus'||b.serviceModel==='fireCommand')box(g,1.3,.33,.75,'#a4614d',0,1.49,-.27);if(b.serviceModel==='fireCommand')box(g,.7,.5,.55,'#ceae86',0,1.93,-.27)}else if(b.kind==='depot'){if(b.serviceModel==='taxiYard')taxiDepot(g);else depot(g);if(b.serviceModel==='wasteDepot'||b.serviceModel==='wasteComplex')box(g,1.3,.3,.7,'#607d71',0,1.97,-.2);if(b.serviceModel==='wasteComplex')box(g,.8,.35,.5,'#7b9e8b',0,2.29,-.22)}else if(b.kind==='landfill')landfillFacility(g);else if(b.kind==='recyclingPlant')recyclingFacility(g);else if(b.kind==='port')portTerminal(g);else if(b.kind==='airport')airportTerminal(g);else if(b.kind==='hotel')hotel(g,b);else if(b.kind==='powerPlant')powerPlant(g);else if(b.kind==='waterPlant')waterPlant(g);else if(b.kind==='gasPlant')gasPlant(g);else if(b.kind==='wastewaterPlant')wastewaterPlant(g);else if(b.kind==='busGarage')busGarage(g);else if(b.kind==='busStop')busShelter(g);else if(b.kind==='shop')shop(g,b);else if(b.kind==='factory')factory(g,b);else house(g,b);finishArchitecture(g,b);if(!view.preview&&view.zoom>=1.4)premiumArchitecture(g,b);if(b.kind==='home'){sphere(g,.23,'#448c62',-.82,.31,.73,1);sphere(g,.2,'#5b9c68',.82,.28,-.6,1)}if(b.heritageEligible){const protectedSite=['protección parcial','protección integral'].includes(b.heritageLevel),integral=b.heritageLevel==='protección integral',plaque=integral?'#a96b3e':protectedSite?'#568c69':'#a68b50';box(g,.34,.38,.07,'#e7d7b6',.62,1.58,.85);box(g,.27,.3,.08,plaque,.62,1.58,.9);sphere(g,.075,integral?'#f3ca72':protectedSite?'#b5dc9a':'#e6ce82',.62,1.59,.96,1);if(protectedSite)box(g,1.64,.045,.08,integral?'#bc8050':'#759f70',0,2.05,0)}if((b.urbanCondition??100)<60||renewalKeys.has(key(b.x,b.y))){const active=renewalKeys.has(key(b.x,b.y)),frame=active?'#d69a4e':'#9e9c88';for(const x of [-.98,.98])for(const z of [-.91,.91])box(g,.065,3.1,.065,frame,x,1.55,z,{cast:false});for(const y of [.55,1.65,2.75]){box(g,2.04,.055,.055,frame,0,y,.93,{cast:false});box(g,.055,.055,1.96,frame,.98,y,0,{cast:false})}for(const y of [.9,2.05])box(g,.055,1.1,.055,frame,0,y,.95,{cast:false});if(active)box(g,.28,.28,.055,'#edbd63',.81,2.94,.97,{cast:false})}if((b.backupCapacityKw||0)>0){box(g,.42,.24,.34,'#56656a',.68,.15,.66);box(g,.18,.06,.36,(b.backupFuelKwh||0)>0?'#e0a342':'#b64d48',.68,.3,.66);box(g,.045,.16,.045,'#343e41',.77,.4,.66)} }
  function addSite(root,p,abandoned=false){const [x,z]=tilePos(p.x,p.y),g=new THREE.Group();g.position.set(x,0,z);root.add(g);const progress=clamp(p.progress||0,0,1),steel=abandoned?'#8b786c':'#c28a52',concrete=abandoned?'#91867e':'#c7bca9';box(g,1.94,.065,1.94,abandoned?'#a58b75':'#bf9d72',0,.03,0,{cast:false});
    if(p.kind==='road'){box(g,1.55,.09,.98,abandoned?'#76706a':progress>.6?'#647577':'#a48767',0,.09,0,{cast:false});for(const zz of [-.7,.7])for(const xx of [-.64,.64]){box(g,.25,.25,.19,'#e2a55d',xx,.2,zz);box(g,.13,.06,.19,'#eee2c2',xx,.34,zz)}return}
    box(g,1.55,.14,1.38,concrete,0,.16,0);for(const xx of [-.82,.82])for(const zz of [-.76,.76]){box(g,.055,1.15,.055,steel,xx,.58,zz);box(g,.19,.35,.19,'#d6a560',xx,.22,zz)}
    if(progress>.15||abandoned){const levels=progress>.7?3:progress>.38?2:1;for(let level=0;level<levels;level++){const top=.43+level*.74;for(const xx of [-.63,.63])for(const zz of [-.55,.55])box(g,.105,.72,.105,concrete,xx,top+.37,zz,{cast:true});box(g,1.43,.10,1.29,'#ded2b7',0,top+.74,0,{cast:true});for(const zz of [-.67,.67])box(g,1.45,.08,.06,'#e7d9bc',0,top+.76,zz)}}
    if(progress>.45||abandoned){for(const xx of [-.81,.81])for(const zz of [-.75,.75])box(g,.055,2.8,.055,steel,xx,1.4,zz);for(const yy of [.75,1.58,2.44])for(const zz of [-.75,.75])box(g,1.68,.05,.05,steel,0,yy,zz)}
    if(progress>.25&&!smallScreen){box(g,.075,3.1,.075,'#c49454',.94,1.55,-.72);box(g,1.2,.07,.08,'#c49454',.37,3.1,-.72);box(g,.05,.45,.05,'#7d7060',-.19,2.85,-.72);box(g,.28,.08,.2,'#a27d59',-.19,2.59,-.72)}
    for(let i=0;i<3;i++){box(g,.32,.07,.2,i===2?'#d4b582':'#ae825a',-.55+i*.28,.19,.76);box(g,.31,.14,.04,'#d2ad70',-.55+i*.28,.28,.76)}
  }
  function addSelection(root,chosen){if(!chosen)return;const [x,z]=tilePos(chosen.x,chosen.y);const fill=plane(root,1.92,1.92,mat('#fff5ad',{transparent:true,opacity:.24,depthWrite:false}),x,.11,z);fill.renderOrder=5;line(root,[[x-.98,.13,z-.98],[x+.98,.13,z-.98],[x+.98,.13,z+.98],[x-.98,.13,z+.98],[x-.98,.13,z-.98]],'#fff0a3',1)}
  function shortestPath(roads,start){const queue=[start],seen=new Map([[start,null]]);for(let i=0;i<queue.length;i++){const k=queue[i],p=k.split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const next=key(p[0]+dx,p[1]+dy);if(roads.has(next)&&!seen.has(next)){seen.set(next,k);queue.push(next)}}}return {last:queue.at(-1),seen}}
  function buildRoute(roads){const keys=[...roads];if(keys.length<2)return [];const first=shortestPath(roads,keys[0]).last,{last,seen}=shortestPath(roads,first),out=[];for(let k=last;k!=null;k=seen.get(k)){const [x,y]=k.split(',').map(Number);out.push(tilePos(x,y))}return out.reverse()}
  function cityEntryRoute(roads){const start=key(4,10);if(!roads.has(start))return [[4,10]];const queue=[start],previous=new Map([[start,null]]),distance=new Map([[start,0]]);for(let i=0;i<queue.length;i++){const current=queue[i],[x,y]=current.split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const next=key(x+dx,y+dy);if(roads.has(next)&&!previous.has(next)){previous.set(next,current);distance.set(next,distance.get(current)+1);queue.push(next)}}}const targets=[...distance.keys()].filter(k=>k!==start).sort((a,b)=>distance.get(b)-distance.get(a)||a.localeCompare(b));const target=targets[0]||start,path=[];for(let k=target;k;k=previous.get(k)){const [x,y]=k.split(',').map(Number);path.push([x,y])}return path.reverse()}
  function makeVehicle(color){const g=new THREE.Group();box(g,.39,.16,.68,color,0,.22,0,{cast:true});box(g,.32,.18,.37,'#b9d6da',0,.39,-.04);box(g,.32,.035,.02,'#5a7078',0,.48,.13);for(const x of [-.22,.22]){for(const z of [-.23,.23]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.055,18),mat('#263c42'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.13,z);g.add(wheel);cylinder(g,.035,.035,.061,'#a6b4ac',x*1.12,.13,z,12)}box(g,.085,.05,.02,'#fff2c3',x,.25,.35);box(g,.08,.045,.02,'#d06f61',x,.25,-.35);box(g,.045,.05,.07,'#718f95',x*1.01,.41,.13)}box(g,.29,.025,.035,'#344d55',0,.21,.355);trafficRoot.add(g);return g}
  function makeDeliveryTruck(color='#c78c50',role=null,id=null){const g=new THREE.Group();box(g,.38,.2,.7,color,0,.27,-.08);box(g,.3,.22,.28,'#c9e4e3',0,.3,.36);box(g,.4,.035,.72,'#e5d2aa',0,.39,-.08);for(const x of [-.23,.23])for(const z of [-.28,.32])box(g,.075,.12,.13,'#303f43',x,.13,z);if(role){g.userData.emergencyRole=role;g.userData.emergencyId=id}trafficRoot.add(g);return g}
  function makeHearse(){const g=makeVehicle('#343c40');box(g,.32,.17,.34,'#273034',0,.47,-.04,{cast:true});box(g,.26,.08,.3,'#aeb8b3',0,.59,-.04,{cast:true});box(g,.12,.035,.035,'#e7e4da',0,.65,-.04,{cast:false});g.userData.emergencyRole='Coche fúnebre';return g}
  function makeBus(color='#e7a958'){
    const g=new THREE.Group();box(g,.62,.41,1.12,color,0,.36,0,{cast:true});box(g,.59,.08,1.02,'#f3ddac',0,.61,0);box(g,.62,.09,.16,'#295767',0,.55,.39);box(g,.47,.26,.035,'#69aabd',0,.44,.57);for(const x of [-.321,.321]){for(const z of [-.33,-.08,.17])box(g,.024,.19,.19,'#70afc0',x,.43,z);box(g,.045,.38,.035,'#ece2be',x,.39,.42);for(const z of [-.38,.37]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.055,18),mat('#304144'));wheel.rotation.z=Math.PI/2;wheel.position.set(x*1.09,.13,z);g.add(wheel)}}box(g,.47,.075,.1,'#214c55',0,.67,.42);box(g,.3,.052,.015,'#f5d178',0,.67,.477);for(const x of [-.24,.24]){box(g,.1,.065,.03,'#fff2c7',x,.28,.58);box(g,.1,.065,.03,'#b9574d',x,.28,-.58)}trafficRoot.add(g);return g}
  function makeCargo(color){const g=new THREE.Group();box(g,.28,.2,.28,color,0,.19,0);box(g,.31,.035,.31,'#e2cfaa',0,.3,0);trafficRoot.add(g);return g}
  function makeForklift(){const g=new THREE.Group();box(g,.38,.2,.48,'#dfaa4f',0,.27,0);box(g,.27,.42,.3,'#e9ba60',0,.57,-.05);box(g,.22,.22,.22,'#6e9897',0,.67,.09);box(g,.06,.75,.07,'#6d6354',-.18,.52,.29);box(g,.06,.75,.07,'#6d6354',.18,.52,.29);box(g,.035,.065,.42,'#ddd2ad',-.12,.08,.53);box(g,.035,.065,.42,'#ddd2ad',.12,.08,.53);for(const x of [-.23,.23])for(const z of [-.15,.18])box(g,.09,.12,.1,'#35434a',x,.14,z);trafficRoot.add(g);return g}
  function makeGarbageTruck(){const g=new THREE.Group();box(g,.42,.34,.62,'#477d65',-.18,.32,.02,{cast:true});box(g,.2,.25,.45,'#d4dec9',-.18,.63,.02);box(g,.37,.4,.4,'#608e6e',.22,.35,-.08,{cast:true});box(g,.34,.24,.025,'#86b1b7',.22,.45,.127);box(g,.16,.05,.04,'#f2d47a',.2,.68,.13);for(const x of [-.31,.31])for(const z of [-.18,.22]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.07,10),mat('#34413e'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.15,z);g.add(wheel)}trafficRoot.add(g);return g}
  function makeFireEngine(){const g=new THREE.Group();box(g,.42,.33,.65,'#c84b3e',-.11,.31,0,{cast:true});box(g,.29,.24,.31,'#e3bd91',-.11,.58,-.04);box(g,.2,.26,.38,'#b83e35',.22,.4,.02,{cast:true});box(g,.25,.2,.025,'#8ec0c0',-.11,.49,.14);box(g,.46,.045,.08,'#eee1bd',0,.71,0);box(g,.12,.1,.09,'#e9c556',0,.78,0);box(g,.035,.22,.36,'#d7d0bd',.39,.46,.13);for(const x of [-.3,.3])for(const z of [-.2,.23]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.07,10),mat('#303c3e'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.13,z);g.add(wheel)}trafficRoot.add(g);return g}

  // Servicios visibles en el mundo: sólo viajan por calzadas conectadas y habilitadas.
  function makePoliceCar(){
    const g=makeVehicle('#ebf0f3');
    box(g,.36,.06,.28,'#24567b',0,.38,-.13);
    box(g,.24,.075,.16,'#2f5785',0,.51,.05);
    box(g,.11,.065,.1,'#be4f4a',-.075,.585,.05);
    box(g,.11,.065,.1,'#457fc2',.075,.585,.05);
    return g;
  }
  function makeAmbulance(){
    const g=makeVehicle('#f5f2e9');
    box(g,.38,.27,.37,'#f4f3eb',0,.43,-.16,{cast:true});
    box(g,.405,.085,.45,'#d5504c',0,.37,-.14);
    box(g,.18,.065,.12,'#bb3d3b',0,.61,-.1);
    box(g,.09,.055,.08,'#e8f4f4',-.08,.59,.08);
    box(g,.09,.055,.08,'#5eafd4',.08,.59,.08);
    return g;
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
      add('Policía',makePoliceCar(),roundTrip,{title:`Patrulla · ${incident.location||'incidente'}`,
        description:incident.status==='atendido'?'La patrulla resolvió el incidente y vuelve a su comisaría.':'La patrulla viaja al incidente por calles conectadas.',
        metrics:[['Estado',incident.status],['Origen',incident.station||'Comisaría']]},`pol-${incident.id}`,
        {side:-.18,deliveryStartDay:incident.dispatchDay??incident.day,deliveryEndDay:(incident.arrivalDay??day)+1});
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
    for(const unit of state.healthReport?.hospital?.hospitals||[]){
      const from=[unit.x,unit.y],missions=recentMedical.filter(x=>x.stationX===unit.x&&x.stationY===unit.y);
      for(let i=0;i<Math.min(3,unit.ambulances||0);i++){
        const mission=i<unit.activeAmbulances?missions[i]:null;
        const trip=mission?serviceRoadPath(from,[mission.x,mission.y],openRoads):null;
        const path=trip;
        const idle=!trip;
        const m=makeAmbulance();
        add('Ambulancia',m,path,{title:mission&&trip?`Traslado sanitario · ${unit.name}`:`Ambulancia ${i+1} · ${unit.name}`,
          description:mission&&trip?'Traslado registrado hacia un barrio conectado, reproducido en la ciudad 3D.':'Unidad sanitaria estacionada, disponible sólo con equipo, servicios y calle.',
          metrics:[['Camas',unit.beds],['Dotación operativa',unit.activeAmbulances],['Estado',idle?'En base':'Traslado reciente']]},
          `amb-${unit.x}-${unit.y}-${i}`,{idle,side:i*.24,...(mission&&trip?{deliveryStartDay:mission.day,deliveryEndDay:mission.day+1}:{})});
        if(idle){const a=serviceRoadPath(from,[4,10],openRoads),p=a?.[0]||tilePos(unit.x,unit.y);m.position.set(p[0]+i*.4,0,p[1]-.22)}
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
  function makeWalker(color){const g=new THREE.Group();box(g,.09,.26,.09,color,0,.3,0);sphere(g,.085,'#efc9a4',0,.51,0,1);trafficRoot.add(g);return g}
  function makeShip(){const g=new THREE.Group();box(g,1.28,.28,.58,'#315d67',0,.22,0,{cast:true});box(g,1.02,.13,.48,'#e2a855',0,.39,-.02);box(g,.34,.38,.34,'#e9dfc6',-.35,.63,-.02);box(g,.28,.18,.3,'#6ba0a6',-.35,.68,.15);for(const [i,x] of [-.48,-.18,.12,.42].entries())box(g,.2,.2,.26,['#c65d4e','#d5a245','#4f8e87'][i%3],x,.55,-.02);box(g,.09,.42,.08,'#d5d0bc',-.43,.95,-.02);trafficRoot.add(g);return g}
  function makePlane(){const g=new THREE.Group();box(g,.18,.17,.98,'#f0e8d4',0,.13,0,{cast:true});box(g,1.12,.07,.28,'#70969a',0,.14,.02,{cast:true});box(g,.37,.055,.2,'#bf6954',0,.17,.35);box(g,.09,.11,.2,'#6b7e83',0,.22,-.42);box(g,.16,.22,.22,'#75a9b0',0,.25,-.31);box(g,.1,.23,.1,'#b95345',-.07,.24,0);trafficRoot.add(g);return g}

  // La formación se dibuja como proyección translúcida sobre el trazado: no circula por la calle.
  function makeElevatedTrain(){
    const g=new THREE.Group();
    box(g,.72,.46,1.43,'#c7d8db',0,.42,0,{cast:true});
    box(g,.69,.13,1.36,'#386475',0,.72,0,{cast:true});
    box(g,.72,.09,.14,'#e6ad58',0,.29,.69);
    for(const x of [-.372,.372])for(const z of [-.43,-.06,.32])
      box(g,.025,.23,.26,'#48879d',x,.49,z);
    for(const z of [-.52,.52])for(const x of [-.26,.26])
      box(g,.1,.2,.15,'#34424b',x,.12,z);
    box(g,.42,.2,.025,'#d5ecf0',0,.48,.73);
    box(g,.34,.07,.04,'#e2a857',0,.64,.73);
    g.userData.railTrain=true;trafficRoot.add(g);return g;
  }
  function makeMetroProjection(){
    const g=new THREE.Group(),ghost=mat('#55c8d2',{transparent:true,opacity:.58,depthWrite:false,emissive:'#207688',emissiveIntensity:.24});
    box(g,.45,.25,.86,ghost,0,.29,0);
    box(g,.46,.08,.88,mat('#b6f2ee',{transparent:true,opacity:.66,depthWrite:false}),0,.44,0);
    for(const x of [-.237,.237])for(const z of [-.23,.03,.28])box(g,.008,.115,.17,'#d8f5ec',x,.32,z);
    box(g,.28,.17,.012,'#eff9e3',0,.3,.44);
    const footprint=plane(g,.62,1.05,mat('#49babb',{transparent:true,opacity:.13,depthWrite:false}),0,.11,0);
    footprint.renderOrder=8;g.userData.metroProjection=true;trafficRoot.add(g);return g;
  }
  function sync(state,chosen,nextView){poweredStreetlights=new Set((state.utilities?.poweredStreetlightTiles||[]).map(([x,y])=>key(x,y)));view=nextView;gatewayTunnel.visible=Boolean(state.newSettlement);cameraAnchor=state.newSettlement?{x:8,y:8}:{x:14,y:10};simulationSpeed=clamp(Number(state.speed)||1,1,4);simulationPaused=Boolean(state.paused)||Boolean(view.preview);visualTimeOfDayMinutes=Number.isFinite(Number(state.timeOfDayMinutes))?Number(state.timeOfDayMinutes):visualTimeOfDayMinutes;visualGameDay=Math.max(1,Number(state.day)||1)+visualTimeOfDayMinutes/1440;renderer.shadowMap.enabled=!smallScreen&&!view.preview;updateCamera();const signature=JSON.stringify([
      state.roads,state.trafficSignalOverrides,
      (state.buildings||[]).map(b=>[b.missingServices,b.x,b.y,b.kind,b.name,b.serviceModel,b.level,b.architecturalStyle,b.urbanCondition,b.heritageEligible,b.heritageLevel,b.business?.status,b.business?.industryType,b.status,b.operational,Boolean(b.backupCapacityKw),Boolean(b.backupFuelKwh)]),
      (state.projects||[]).map(p=>[p.id,p.x,p.y,p.kind,p.status,p.progress>.15,p.progress>.25,p.progress>.38,p.progress>.45,p.progress>.6,p.progress>.7,p.stageIndex]),
      (state.adaptiveReuseWorks||[]).map(w=>[w.id,w.x,w.y,w.status,w.progress>.15,w.progress>.25,w.progress>.38,w.progress>.45,w.progress>.6,w.progress>.7,w.stage]),
      state.urbanRenewalWorks,(state.abandoned||[]).map(a=>[a.id,a.x,a.y,a.kind,a.status,a.progress>.15,a.progress>.25,a.progress>.38,a.progress>.45,a.progress>.6,a.progress>.7]),state.zones,state.landClaims?.frontierChunks,
      (state.supply?.orders||[]).map(o=>[o.id,o.status,o.routeProgress,o.progress,o.unloadProgress,o.items,o.destinationId,o.route]),
      (state.supply?.portOrders||[]).map(o=>[o.id,o.status,o.routeProgress,o.progress,o.travelledDistance,o.route]),(state.supply?.factoryExportOrders||[]).map(o=>[o.id,o.status,o.mode,o.route,o.travelledDistance,o.arrivalDay]),
      (state.supply?.portVoyages||[]).map(v=>[v.id,v.status,v.direction,v.cargoType,v.unloadedUnits,v.route,v.departureDay,v.arrivalDay,v.quantity,v.status==='en ruta'?Math.floor(((state.day||v.departureDay)-v.departureDay)/Math.max(1,v.arrivalDay-v.departureDay)*100):0]),state.newSettlement,
      (state.commutes||[]).map(t=>[t.mode,t.reason,t.route,t.roundTrip,t.vehicles,t.workers,t.distance,t.estimatedMinutes,t.trafficFactor]),
      (state.urbanEvolution?.deceased||[]).filter(d=>d.disposition==='en traslado').map(d=>[d.residentId,d.funeralTrip?.route,d.funeralTrip?.departDay,d.funeralTrip?.arrivalDay,d.funeralTrip?.facilityX,d.funeralTrip?.facilityY]),
      (state.busRoutes||[]).map(b=>[b.id,b.status,b.operational,b.effectiveBuses,b.buses,b.route,b.driverIds,b.originName,b.destinationName,b.ridersThisPass,b.capacity,b.headwayMinutes,b.stops,b.monthlyFareRevenue]),
      (state.taxiRoutes||[]).map(t=>[t.id,t.status,t.operational,t.route,t.stops,t.depotX,t.depotY,t.monthlyOperatingCost]),
      (state.railStations||[]).map(site=>[site.id,site.x,site.y,site.mode,site.status,site.stage,Math.floor((site.elapsed||0)/Math.max(1,site.duration||1)*10)]),
      (state.metroLines||[]).map(m=>[m.id,m.mode,m.status,m.operational,m.trainCount,m.elapsed,m.duration,m.stations,m.route]),
      state.utilities?.powerLines,state.utilities?.waterPipes,state.utilities?.sewerLines,state.utilities?.drainLines,state.utilities?.gasLines,state.utilities?.telecomLines,
      (state.utilities?.report?.failures||[]).map(f=>[f.id,f.network,f.x,f.y,f.status,f.responseRoute,f.completedDay]),state.utilities?.report?.drainage?.floodedTiles,
      (state.roadAssets||[]).filter(a=>a.bridge||(a.quality??82)<25||a.accidentClosed).map(a=>[a.x,a.y,a.bridge,a.accidentClosed]),
      (state.waste?.containers||[]).map(c=>[c.x,c.y,(c.storedTons||0)/Math.max(.15,c.capacityTons||2)>.75?2:(c.storedTons||0)/Math.max(.15,c.capacityTons||2)>.4?1:0]),
      (state.waste?.routes||[]).map(r=>[r.id,r.reachable,r.path,r.containers,r.name,r.destination]),state.waste?.report?.litterTiles,state.waste?.report?.activeTrucks,
      (state.policeReport?.units||[]).map(u=>[u.x,u.y,u.vehicles,u.activeVehicles,u.priority,u.name,u.staff]),(state.policeReport?.recentIncidents||[]).map(i=>[i.id,i.status,i.route,i.stationX,i.stationY,i.day]),
      (state.fireReport?.activeIncidents||[]).map(i=>[i.id,i.x,i.y,i.status]),(state.fireReport?.stations||[]).map(u=>[u.x,u.y,u.name,u.firefighters,u.readyDay]),(state.fireReport?.recentIncidents||[]).map(i=>[i.id,i.status,i.route,i.stationX,i.stationY,i.resolvedDay,i.dispatchDay,i.arrivalDay]),(state.fireService?.ruins||[]).map(r=>[r.x,r.y,r.destroyedDay]),
      (state.healthReport?.hospital?.hospitals||[]).map(u=>[u.x,u.y,u.name,u.beds,u.ambulances,u.activeAmbulances]),(state.healthReport?.hospital?.ambulanceDispatches||[]).map(i=>[i.id,i.status,i.route,i.stationX,i.stationY,i.day]),
      (state.roadIncidentReport?.activeIncidents||[]).map(i=>[i.id,i.x,i.y,i.status,i.responseRoute]),
      view.utilityLayer,view.trafficOverlay,view.servicePreview?.serviceModel||null,view.zoom>=1.4,view.preview,chosen?.x,chosen?.y
    ]);const roads=new Set((state.roads||[]).map(r=>key(r[0],r[1]))),closedRoads=new Set((state.roadAssets||[]).filter(a=>(a.quality??82)<25||a.accidentClosed).map(a=>key(a.x,a.y))),openRoads=new Set([...roads].filter(k=>!closedRoads.has(k)));if(signature===visualSignature){refreshServiceCoverage(state,chosen,view,openRoads);renderer.render(scene,camera);return}const previousActors=new Map(routeActors.filter(a=>actorIdentity(a)).map(a=>[actorIdentity(a),{route:a.route,offset:a.offset,position:a.mesh.position.clone(),rotation:a.mesh.rotation.y}]));visualSignature=signature;vegetationObstacles.clear();for(const p of state.roads||[])vegetationObstacles.add(key(p[0],p[1]));const buildings=state.buildings||[],projects=state.projects||[];for(const p of [...buildings,...projects,...(state.railStations||[]),...(state.adaptiveReuseWorks||[]),...(state.abandoned||[])])vegetationObstacles.add(key(p.x,p.y));vegetationKey='';clear(dynamicRoot);clear(trafficRoot);routeActors.length=0;fireVisuals.length=0;signalBulbs.length=0;streetLights.length=0;signalTiles.clear();const occupied=new Set([...roads,...buildings.map(b=>key(b.x,b.y)),...projects.map(p=>key(p.x,p.y)),...(state.railStations||[]).map(p=>key(p.x,p.y)),...(state.adaptiveReuseWorks||[]).map(w=>key(w.x,w.y)),...(state.abandoned||[]).map(a=>key(a.x,a.y))]);for(const p of occupied)vegetationObstacles.add(p);
    const roadStress=new Map();for(const trip of state.commutes||[]){if(trip.mode==='walk')continue;const load=((trip.vehicles||0)*(trip.reason==='regreso'?.45:1)+(trip.mode==='bus'?2:0))*(trip.trafficFactor||1);for(const [x,y] of trip.route||[])roadStress.set(key(x,y),(roadStress.get(key(x,y))||0)+load)}for(const line of state.busRoutes||[]){if(!line.operational)continue;for(const [x,y] of line.route||[])roadStress.set(key(x,y),(roadStress.get(key(x,y))||0)+(line.effectiveBuses||0)*2)}for(const taxi of state.taxiRoutes||[]){if(!taxi.operational)continue;for(const [x,y] of taxi.route||[])roadStress.set(key(x,y),(roadStress.get(key(x,y))||0)+1)}for(const order of state.supply?.orders||[]){if(order.status!=='en tránsito')continue;for(const [x,y] of order.route||[])roadStress.set(key(x,y),(roadStress.get(key(x,y))||0)+2)}const maxStress=Math.max(8,...roadStress.values()),signalOverrides=state.trafficSignalOverrides||{};for(const [x,y] of state.roads){const neighbors=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>roads.has(key(x+dx,y+dy))),intersection=neighbors.length>=3,signals=intersection&&signalOverrides[key(x,y)]!==false;addRoad(dynamicRoot,x,y,roads,(roadStress.get(key(x,y))||0)/maxStress,signals);if(signals)signalTiles.add(key(x,y))}
    // El tablero queda sobre el cauce y las barandas dejan libre el carril.
    // Dibujar una sola estructura por pareja de tramos al completar la obra.
    for(const a of state.roadAssets||[]){
      if(!a.bridge||a.x!==24||!roads.has(key(25,a.y)))continue;
      const [cx,cz]=tilePos(24.5,a.y);
      box(dynamicRoot,4.45,.08,1.42,'#8b9894',cx,-.025,cz,{cast:true});
      for(const side of [-1,1]){
        const z=cz+side*.72;
        box(dynamicRoot,4.45,.13,.075,'#cad2c9',cx,.35,z,{cast:true});
        for(const offset of [-1.9,-.9,0,.9,1.9])box(dynamicRoot,.095,.5,.095,'#8d9e9a',cx+offset,.17,z);
      }
      for(const offset of [-1,1])cylinder(dynamicRoot,.17,.23,.42,'#7b8c87',cx+offset,-.19,cz,10);
    }
    if(state.newSettlement){const externalRoads=new Set([...roads,...Array.from({length:4},(_,i)=>key(i,10))]);for(let x=0;x<4;x++)addRoad(dynamicRoot,x,10,externalRoads,0,false);const [ax,az]=tilePos(4,10);for(const dx of [-.58,.58]){box(dynamicRoot,.08,.52,.08,'#4b5755',ax+dx,.27,az+.04);box(dynamicRoot,.78,.07,.11,'#375e68',ax+dx*1.35,.57,az+.04);box(dynamicRoot,.53,.035,.12,'#e6d7b6',ax+dx*1.35,.62,az+.04)}}for(const a of (state.roadAssets||[]).filter(a=>(a.quality??82)<25||a.accidentClosed)){const [cx,cz]=tilePos(a.x,a.y);box(dynamicRoot,1.48,.24,.2,'#fbefe4',cx,.3,cz,{cast:true});for(const dx of [-.55,-.27,0,.27,.55]){const stripe=box(dynamicRoot,.16,.25,.22,dx===0?'#ed8e53':'#cd5c59',cx+dx,.3,cz,{cast:false});stripe.rotation.z=-.2}for(const dx of [-.57,.57]){box(dynamicRoot,.085,.42,.085,'#777783',cx+dx,.23,cz);cylinder(dynamicRoot,.12,.12,.065,'#e69a4f',cx+dx,.51,cz,9)} }
    if(view.utilityLayer){const networkKey={power:'powerLines',water:'waterPipes',sewer:'sewerLines',drainage:'drainLines',gas:'gasLines',telecom:'telecomLines'}[view.utilityLayer],points=state.utilities?.[networkKey]||[],set=new Set(points.map(([x,y])=>key(x,y))),color={power:'#f0bd4e',water:'#42a9c2',sewer:'#a88bd3',drainage:'#4e9eb9',gas:'#e28b43',telecom:'#a458d4'}[view.utilityLayer];for(const [x,y] of points){const [cx,cz]=tilePos(x,y);for(const [dx,dy] of [[1,0],[0,1]])if(set.has(key(x+dx,y+dy))){const [nx,nz]=tilePos(x+dx,y+dy);line(dynamicRoot,[[cx,.16,cz],[nx,.16,nz]],color,.9)}sphere(dynamicRoot,.07,color,cx,.19,cz,1)}for(const f of (state.utilities?.report?.failures||[]).filter(f=>f.network===view.utilityLayer)){const [fx,fz]=tilePos(f.x,f.y);sphere(dynamicRoot,.16,'#d84e4e',fx,.25,fz,1)}if(view.utilityLayer==='drainage')for(const [x,y] of state.utilities?.report?.drainage?.floodedTiles||[]){const [cx,cz]=tilePos(x,y);plane(dynamicRoot,1.18,1.18,mat('#52a9c2',{transparent:true,opacity:.44,depthWrite:false}),cx,.105,cz)}}
    for(const busLine of (state.busRoutes||[]).filter(r=>r.operational&&r.route?.length>1))for(let i=1;i<busLine.route.length;i++){
      const [ax,ay]=busLine.route[i-1],[bx,by]=busLine.route[i];if(!openRoads.has(key(ax,ay))||!openRoads.has(key(bx,by))||Math.abs(ax-bx)+Math.abs(ay-by)!==1)continue;
      const [px,pz]=tilePos((ax+bx)/2,(ay+by)/2);box(dynamicRoot,ax!==bx?1.7:.085,.009,ay!==by?1.7:.085,'#67d3b8',px,.089,pz,{cast:false});
    }
    for(const busLine of (state.busRoutes||[]).filter(r=>r.operational&&r.manualRoute))for(const stop of busLine.stops||[]){const [x,y]=stop.at||[];if(!Number.isInteger(x)||!Number.isInteger(y))continue;const [cx,cz]=tilePos(x,y),sign=new THREE.Group();sign.position.set(cx+.56,.09,cz+.46);box(sign,.055,.52,.055,'#425d62',0,.26,0,{cast:true});box(sign,.36,.25,.08,'#397f84',0,.5,0,{cast:true});box(sign,.18,.055,.09,'#e8d7a8',0,.5,.045,{cast:false});dynamicRoot.add(sign)}
    for(const c of state.waste?.containers||[]){const [cx,cz]=tilePos(c.x,c.y),fill=(c.storedTons||0)/Math.max(.15,c.capacityTons||2);const bin=new THREE.Group();bin.position.set(cx+.56,.09,cz+.45);box(bin,.34,.48,.3,'#547e70',0,.24,0,{cast:true});box(bin,.36,.055,.32,'#354f48',0,.5,0);box(bin,.22,.035,.2,fill>.75?'#d28b50':fill>.4?'#c0a45c':'#b4c99c',0,.53,0);for(const dx of [-.11,.11])cylinder(bin,.045,.045,.05,'#253b39',dx,.035,.13,10);dynamicRoot.add(bin)}
    for(const tile of state.waste?.report?.litterTiles||[]){if(!Array.isArray(tile)||tile.length<2||!Number.isFinite(tile[0])||!Number.isFinite(tile[1]))continue;const [x,y]=tile,[cx,cz]=tilePos(x,y);for(const [dx,dz,color] of [[-.24,-.12,'#647c66'],[.2,.1,'#9a8871'],[.02,-.27,'#536e66']]){const body=new THREE.Mesh(new THREE.IcosahedronGeometry(.17,1),mat(color));body.scale.set(1,.85,.8);body.position.set(cx+dx,.2,cz+dz);dynamicRoot.add(body);cylinder(dynamicRoot,.037,.055,.085,'#dfd5bf',cx+dx,.37,cz+dz,8);box(dynamicRoot,.1,.018,.065,'#e8e2d2',cx+dx+.04,.28,cz+dz+.04,{cast:false})}}
    for(const z of state.zones||[])addZone(dynamicRoot,z);for(const chunk of state.landClaims?.frontierChunks||[])addLandLock(dynamicRoot,chunk);
    for(const ruin of state.fireService?.ruins||[]){if((state.buildings||[]).some(b=>b.x===ruin.x&&b.y===ruin.y)||(state.projects||[]).some(p=>p.x===ruin.x&&p.y===ruin.y))continue;const [rx,rz]=tilePos(ruin.x,ruin.y);plane(dynamicRoot,1.82,1.82,'#4c4b47',rx,.088,rz);for(let i=0;i<15;i++){const dx=(seeded(i+ruin.x*11+ruin.y*29)-.5)*1.4,dz=(seeded(i+ruin.x*19+ruin.y*13+50)-.5)*1.4,block=box(dynamicRoot,.12+(i%3)*.06,.06+(i%4)*.055,.15+(i%2)*.05,i%3?'#77716b':'#b3a498',rx+dx,.13,rz+dz);block.rotation.y=i*.71}for(let i=0;i<4;i++)plane(dynamicRoot,.35,.32,'#292d2b',rx+(i-1.5)*.29,.093,rz+(i%2?.26:-.29))}
    const renewalKeys=new Set((state.urbanRenewalWorks||[]).map(w=>key(w.x,w.y)));for(const b of state.buildings)addBuilding(dynamicRoot,b,roads,renewalKeys);
    // Estaciones construidas por el jugador, con obra visual por etapas.
    for(const site of state.railStations||[]){
      if(!['building','active'].includes(site.status))continue;
      const [cx,cz]=tilePos(site.x,site.y),group=new THREE.Group();
      group.position.set(cx,0,cz);
      const completion=site.status==='active'?1:Math.min(.99,(site.elapsed||0)/Math.max(1,site.duration||1));
      railStationModel(group,site.mode,completion);
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
    addSelection(dynamicRoot,chosen);


    for(const trainLine of (state.metroLines||[]).filter(l=>l.mode==='elevated'&&l.operational&&l.status==='active')){
      const path=(trainLine.route||[]).map(([x,y])=>tilePos(x,y));
      if(path.length<5)continue;
      const count=Math.min(4,Math.max(0,Math.trunc(trainLine.trainCount||0)));
      for(let i=0;i<count;i++)routeActors.push({
        mesh:makeElevatedTrain(),route:path,offset:i*(path.length-1)*TILE*2/Math.max(1,count),
        speed:2.15,side:0,height:1.82,railTrain:true,
        selection:{type:'Tren elevado de pasajeros',title:trainLine.name+' · formación '+(i+1),
          description:'Tren eléctrico real del servicio municipal elevado. Requiere obras habilitadas, flota, energía y presupuesto.',
          metrics:[['Pasajeros hoy',trainLine.dailyRiders||0],['Capacidad por día',trainLine.dailyCapacity||0],
            ['Frecuencia',(trainLine.headwayMinutes||0)+' min'],['Costo mensual',trainLine.monthlyOperatingCost||0]]}
      });
    }

    // Solo hay trenes visuales cuando el motor autoritativo declara la línea operativa.
    for(const metro of (state.metroLines||[]).filter(l=>l.mode!=='elevated')){
      const plan=metroVisualPlan(metro);if(!plan||!plan.trains)continue;
      const path=plan.route.map(([x,y])=>tilePos(x,y));
      if(path.length<2)continue;
      for(let i=0;i<plan.trains;i++)routeActors.push({
        mesh:makeMetroProjection(),route:path,offset:i*(path.length-1)*TILE*2/plan.trains,
        speed:1.85,side:0,height:.045,metroProjection:true,
        selection:{type:'Proyección de tren de subte',title:(metro.name||'Subte')+' · formación '+(i+1),
          description:'Marcador translúcido de la posición ilustrativa de un tren bajo tierra. No ocupa carriles de la calle.',
          metrics:[['Estado','En servicio'],['Pasajeros diarios',metro.dailyRiders||0],
            ['Frecuencia',(metro.headwayMinutes||0)+' min'],['Formaciones',metro.trainCount||0]]}
      });
    }
    const route=buildRoute(openRoads);if(route.length>1){const commuteRoutes=(state.commutes||[]).filter(t=>t.reason==='trabajo').slice().sort((a,b)=>b.workers-a.workers).slice(0,12);for(let i=0;i<commuteRoutes.length;i++){const trip=commuteRoutes[i],path=trip.route.map(([x,y])=>tilePos(x,y));if(path.length>1&&trip.mode!=='bus')routeActors.push({mesh:trip.mode==='walk'?makeWalker(['#476d83','#b46f62','#d3a05a'][i%3]):makeVehicle(['#d89368','#f1d493','#75ada8','#c66d63'][i%4]),route:path,offset:i*3.7,speed:(trip.mode==='walk'?.5:1.55)/Math.max(1,trip.trafficFactor||1),side:trip.mode==='walk'?(i%2?.83:-.83):(i%2?.23:-.23),selection:tripSelection(trip,trip.mode==='walk'?'Peatones':'Vehículo particular')})}const nonworkRoutes=(state.commutes||[]).filter(t=>['compras','servicios'].includes(t.reason)).slice(0,8);for(let i=0;i<nonworkRoutes.length;i++){const trip=nonworkRoutes[i],path=trip.route.map(([x,y])=>tilePos(x,y)),service=trip.reason==='servicios';if(path.length>1)routeActors.push({mesh:trip.mode==='walk'?makeWalker(service?['#8c83bd','#6f93ae','#9e779d'][i%3]:['#e3bd73','#b88158','#8a9c66'][i%3]):makeVehicle(service?['#8c83bd','#6f93ae','#9e779d'][i%3]:['#e2a54d','#d37e53','#75a6a1'][i%3]),route:trip.roundTrip?[...path,...path.slice(0,-1).reverse()]:path,offset:i*2.9,speed:trip.mode==='walk'?.43:1.25,side:trip.mode==='walk'?(i%2?.72:-.72):(i%2?.3:-.3),selection:tripSelection(trip,trip.mode==='walk'?'Peatones':'Vehículo particular')})}for(const line of (state.busRoutes||[]).filter(b=>b.operational&&b.route?.length>1))for(let i=0;i<Math.min(line.effectiveBuses||0,3);i++){const path=line.route.map(([x,y])=>tilePos(x,y)),drivers=(line.driverIds||[]).map(id=>{for(const h of state.buildings||[])for(const p of h.residents||[])if(p.id===id)return{id,name:p.name||`Vecino #${String(id).slice(-5)}`,age:p.age,status:'Conductor/a',employerName:p.employerName,monthlyWage:p.monthlyWage,home:[h.x,h.y]};return{id,name:`Conductor #${String(id).slice(-5)}`,status:'Conductor/a'}});routeActors.push({mesh:makeBus(),route:path,offset:i*7.4,speed:1.15,side:0,selection:{type:'Colectivo municipal',title:`${line.originName||'Línea'} → ${line.destinationName||'corredor'} · unidad ${i+1}`,description:'Vehículo asignado a una línea real con turnos y capacidad por sentido.',metrics:[['Pasajeros del último turno',line.ridersThisPass||0],['Capacidad',`${line.capacity||0} asientos`],['Conductores',drivers.length],['Frecuencia',`${line.headwayMinutes||0} min`],['Paradas',(line.stops||[]).length],['Pasaje del último mes',`$${line.monthlyFareRevenue||0}`]],people:drivers}})}for(const taxi of (state.taxiRoutes||[]).filter(t=>t.operational&&t.route?.length>1)){const path=taxi.route.map(([x,y])=>tilePos(x,y));for(const stop of taxi.stops||[]){const [sx,sz]=tilePos(...stop.at),sign=new THREE.Group();sign.position.set(sx+.52,.08,sz+.48);box(sign,.05,.38,.05,'#5d5544',0,.19,0);box(sign,.26,.2,.08,'#dca94b',0,.42,0);dynamicRoot.add(sign)}routeActors.push({mesh:makeVehicle('#e4b144'),route:path,offset:taxi.offset||0,speed:1.4,side:.18,selection:{type:'Taxi municipal',title:`Taxi · depósito ${taxi.depotX+1},${taxi.depotY+1}`,description:'Vehículo que recorre su circuito y vuelve al depósito por calles conectadas.',metrics:[['Paradas',taxi.stops?.length||0],['Circuito',`${path.length-1} tramos`],['Estado','En servicio'],['Operación mensual',`$${taxi.monthlyOperatingCost||260}`]]}})}const wasteRoutes=(state.waste?.routes||[]).filter(r=>r.reachable&&r.path?.length>1);if(wasteRoutes.length){for(let i=0;i<Math.min(4,wasteRoutes.length);i++)routeActors.push({mesh:makeGarbageTruck(),route:wasteRoutes[i].path.map(([x,y])=>tilePos(x,y)),offset:i*4.2,speed:.72,side:i%2?.18:-.18,selection:{type:'Camión municipal',title:wasteRoutes[i].name||`Ruta de recolección ${i+1}`,description:'Recorrido de recolección conectado a su depósito o instalación de descarga.',metrics:[['Contenedores',wasteRoutes[i].containers?.length||0],['Carga del recorrido',`${wasteRoutes[i].payloadTons||0} t`],['Destino',wasteRoutes[i].destination||'Sin destino'],['Distancia',`${wasteRoutes[i].distanceTiles||0} cuadras`]]}})}}
    for(const order of (state.supply?.orders||[]).filter(o=>['en tránsito','esperando equipo','descargando'].includes(o.status)&&o.route?.length>1)){const path=order.route.map(([x,y])=>tilePos(x,y));routeActors.push({mesh:makeVehicle(order.supplier==='Flete Urgente'?'#e08b52':'#d8b56d'),route:path,deliveryProgress:['esperando equipo','descargando'].includes(order.status)?1:(order.routeProgress??order.progress??0),side:0,selection:{type:'Camión de materiales',title:`${order.supplier} · ${order.label||'Pedido de obra'}`,description:order.statusCause||'Carga contratada por una constructora.',metrics:[['Estado',order.status],['Obra',order.label||'Pedido'],['Materiales',Object.entries(order.items||{}).map(([k,v])=>`${k} ${v}`).join(' · ')||'Carga en traslado'],['Destino',order.destinationLabel||'Patio de constructoras'],['Entrega estimada',order.arrivalDay?`día ${order.arrivalDay}`:'en ruta']]}});if(order.status==='descargando'){const depot=(state.supply.depots||[]).find(d=>d.id===order.destinationId),dest=depot?[depot.x,depot.y]:[4,10],offsets=[[-.42,.04],[.42,-.04],[0,.42]],center=tilePos(dest[0],dest[1]),lift=makeForklift();lift.position.set(center[0]+.62,.01,center[1]+.3);lift.rotation.y=-Math.PI/4;for(let i=0;i<(order.unloadWorkers||0);i++){const worker=makeWalker(i?'#526d82':'#b8745b');worker.position.set(center[0]-.52+i*.16,0,center[1]+.25)}offsets.forEach(([dx,dz],i)=>{const progress=clamp((order.unloadProgress||0)*3-i,0,1),from=tilePos(dest[0],dest[1]),to=tilePos(dest[0]+dx,dest[1]+dz);routeActors.push({mesh:makeCargo(['#c89958','#769784','#bb765d'][i]),route:[from,to],deliveryProgress:progress,side:0})})}}
    spawnEmergencyActors(state,openRoads);
    for(const failure of state.utilities?.report?.failures||[]){const route=failure.responseRoute;if(!Array.isArray(route)||route.length<2)continue;const active=failure.status==='en reparación',recent=failure.status==='reparada'&&(state.day||0)-(failure.completedDay||0)<=1;if(!active&&!recent)continue;const path=route.map(([x,y])=>tilePos(x,y)),duration=Math.max(1,failure.responseDurationDays||3);routeActors.push({mesh:makeDeliveryTruck(failure.responseKind==='emergencia'?'#d94d4d':'#c78951','Cuadrilla de servicios',failure.id),route:path,...(recent?{deliveryProgress:1}:{offset:0,speed:1.3}),side:-.2,selection:{type:'Cuadrilla de servicios',title:`${failure.responseKind==='emergencia'?'Respuesta urgente':'Reparación de red'} · ${failure.network}`,description:failure.status==='reparada'?'La unidad terminó el trabajo y el servicio fue restablecido.':`Cuadrilla en camino a la avería de la calle ${failure.x+1}, ${failure.y+1}.`,metrics:[['Estado',failure.status],['Red',failure.network],['Avería',`${failure.x+1}, ${failure.y+1}`],['Plazo',`${failure.remainingDays||0} día(s)`],['Costo',`$${failure.responseKind==='emergencia'?failure.repairCost*2:failure.repairCost}`]]}})}
    for(const deceased of (state.urbanEvolution?.deceased||[]).filter(d=>d.disposition==='en traslado'&&d.funeralTrip?.route?.length>1)){
      const trip=deceased.funeralTrip,path=trip.route.map(([x,y])=>tilePos(x,y)),mesh=makeHearse(),kind=trip.kind==='crematorium'?'cremación':'sepultura',arrival=Math.max((trip.departDay||state.day)+1,trip.arrivalDay||state.day+1);
      mesh.userData.emergencyId=deceased.residentId;
      routeActors.push({mesh,route:path,deliveryStartDay:trip.departDay||state.day,deliveryEndDay:arrival,deliveryProgress:0,side:.13,selection:{type:'Coche fúnebre',title:`Traslado de ${deceased.name||'residente'}`,description:`La familia contrató ${kind}. El vehículo recorrió el hogar para recogerle y viaja a ${trip.facility||'la instalación funeraria'} por calles conectadas.`,metrics:[['Destino',trip.facility||'Instalación funeraria'],['Servicio contratado',kind],['Distancia',`${trip.distance||Math.max(0,path.length/2|0)} cuadras`],['Llegada',`día ${arrival}`],['Capacidad',trip.kind==='crematorium'?'24 cremaciones/año':'120 sepulturas']]}})
    }
    for(const order of (state.supply?.marketOrders||[]).filter(o=>o.status==='en tránsito'&&o.route?.length>1)){
      const path=order.route.map(([x,y])=>tilePos(x,y)),distance=Math.max(1,path.length-1),start=order.supplierReadyDay??order.orderedDay??state.day,arrival=Math.max(start+1,order.arrivalDay||start+2),timeline=clamp(((state.day||start)-start)/(arrival-start),0,.98),travelled=Math.min(.98,(order.travelledDistance||0)/distance),progress=Math.max(timeline,travelled),grain=order.type==='industrial_raw',cargo=grain?'Grano':'Insumos comerciales';
      routeActors.push({mesh:makeDeliveryTruck(grain?'#c69742':'#c98155'),route:path,deliveryProgress:progress,side:.13,selection:{type:'Camión regional',title:cargo+' · '+(order.quantity||0)+' unidades',description:order.statusCause||'Carga comprada por una empresa y trasladada por calles conectadas.',metrics:[['Empresa',order.businessName||'Comercio local'],['Origen',order.supplier||'Proveedor regional'],['Destino',grain?'Procesadora industrial':'Comercio'],['Ruta',distance+' tramos'],['Llegada prevista','día '+(order.arrivalDay||arrival)]]}})
    }
    for(const order of (state.supply?.portOrders||[]).filter(o=>o.status==='en tránsito'&&o.route?.length>1)){const path=order.route.map(([x,y])=>tilePos(x,y));routeActors.push({mesh:makeVehicle('#dba04e'),route:path,deliveryProgress:Math.min(1,(order.travelledDistance||0)/Math.max(1,path.length-1)),side:.08,selection:{type:'Camión de carga',title:`${order.businessName||'Comercio'} → terminal portuaria`,description:'Exportación asignada al puerto y trasladada por calles conectadas.',metrics:[['Estado',order.status],['Carga',`${order.quantity||0} unidades`],['Distancia',`${order.route?.length||0} tramos`],['Salida',`día ${order.orderedDay||0}`]]}})}
    for(const order of state.supply?.factoryExportOrders||[]){if(!order.route?.length)continue;const path=order.route.map(([x,y])=>tilePos(x,y)),factoryName=order.businessName||'Fábrica local';if(order.status==='en vuelo'){const [ax,az]=tilePos(order.destinationX||order.factoryX,order.destinationY||order.factoryY);routeActors.push({mesh:makePlane(),route:[[ax,az],[ax-5,az-3],[ax-12,az-6]],deliveryProgress:Math.min(.8,Math.max(.05,((state.day||1)-(order.orderedDay||1))/Math.max(2,(order.arrivalDay||state.day+2)-(order.orderedDay||1)))),height:5.4,selection:{type:'Avión de carga',title:`${factoryName} · ${order.quantity||0} unidades`,description:'La producción industrial viaja por aire al mercado exterior.',metrics:[['Producto',order.product||'Mercadería'],['Carga',`${order.quantity||0} unidades`],['Llegada prevista',`día ${order.arrivalDay||state.day+1}`]]}})}else if(path.length>1)routeActors.push({mesh:makeDeliveryTruck('#c68d53','Exportación industrial',order.id),route:path,deliveryProgress:Math.min(.98,(order.travelledDistance||0)/Math.max(1,order.distance||path.length-1)),side:.12,selection:{type:'Camión de exportación',title:`${factoryName} → ${order.destination||'mercado regional'}`,description:'Excedente fabricado localmente transportado por una ruta vial conectada.',metrics:[['Producto',order.product||'Mercadería'],['Carga',`${order.quantity||0} unidades`],['Ruta',`${order.distance||path.length-1} tramos`],['Destino',order.destination||'Mercado regional']]}})}
    if(state.newSettlement&&Number(state.housingDemand?.unmet||0)>0){const cityPath=cityEntryRoute(openRoads),entry=[[-1,10],[0,10],[1,10],[2,10],[3,10],...cityPath].map(([x,y])=>tilePos(x,y));for(let i=0;i<3;i++)routeActors.push({mesh:makeVehicle(['#d89368','#f1d493','#75ada8'][i]),route:[...entry,...entry.slice(0,-1).reverse()],offset:i*5.4,speed:.82+i*.08,side:i===1?.22:-.22,selection:{type:'Vehículo entrante',title:'Llegada por la ruta regional',description:'Familias recorren el acceso exterior y siguen por las calles conectadas hasta la ciudad; luego regresan por el mismo corredor.',metrics:[['Familias buscando vivienda',state.housingDemand.unmet||0],['Acceso','Ruta regional conectada'],['Destino','Calles interiores habilitadas']]}})}
    for(const airport of (state.airports||[]).filter(a=>a.operational&&a.monthlyFlights>0)){const route=[[airport.x,airport.y],[airport.x-1,airport.y-1],[airport.x-4,airport.y-3],[airport.x-8,airport.y-3]].map(([x,y])=>tilePos(x,y));routeActors.push({mesh:makePlane(),route,offset:0,speed:.7,side:0,height:4.6,selection:{type:'Avión de pasajeros',title:'Vuelo regional',description:'Aeronave conectada a la operación del aeropuerto local.',metrics:[['Pasajeros del mes',airport.monthlyPassengers||0],['Vuelos',airport.monthlyFlights||0],['Capacidad terminal',`${airport.passengerCapacity||800} personas`],['Estado',airport.pauseReason||'Ruta en servicio']]}})}
    for(const voyage of (state.supply?.portVoyages||[]).filter(v=>(v.status==='en ruta'||(v.direction==='importación'&&v.status==='atracado'))&&v.route?.length>1)){
      const incoming=voyage.direction==='importación',berth=voyage.status==='atracado',path=berth?[tilePos(...voyage.route.at(-1)),tilePos(...voyage.route.at(-1))]:voyage.route.map(([x,y])=>tilePos(x,y));
      routeActors.push({mesh:makeShip(),route:path,deliveryStartDay:incoming?voyage.departureDay:undefined,deliveryEndDay:incoming?voyage.arrivalDay:undefined,deliveryProgress:incoming?0:Math.min(.99,Math.max(0,((state.day||voyage.departureDay)-voyage.departureDay)/Math.max(1,voyage.arrivalDay-voyage.departureDay))),side:incoming ? .48 : 0,selection:{type:incoming?'Buque de importación':'Buque mercante',title:incoming?`Importación de acero · ${voyage.quantity||0} unidades`:`Buque de exportación · ${voyage.quantity||0} unidades`,description:incoming?'Remesa de acero comprada por la ciudad; el puerto limita la descarga diaria y cada unidad pasa al inventario real del proveedor.':'Viaje marítimo de exportación desde mercancía trasladada al puerto.',metrics:[['Estado',berth?`Atracado · descargado ${voyage.unloadedUnits||0}/${voyage.quantity||0}`:voyage.status],['Carga',`${voyage.quantity||0} ${incoming?'unidades de acero':'unidades'}`],...(incoming?[['Descargado',`${voyage.unloadedUnits||0} / ${voyage.quantity||0} unidades`]]:[]),['Salida',`día ${voyage.departureDay||0}`],['Arribo previsto',`día ${voyage.arrivalDay||0}`]]}})
    }
    for(const actor of routeActors){const old=previousActors.get(actorIdentity(actor));if(!old)continue;actor.route=old.route;actor.offset=old.offset;actor.mesh.position.copy(old.position);actor.mesh.rotation.y=old.rotation}
    refreshServiceCoverage(state,chosen,view,openRoads);
    renderer.render(scene,camera);
  }
  function animate(now){
    requestAnimationFrame(animate);
    const wallDelta=Math.min(.1,Math.max(0,(now-lastFrame)/1000));
    lastFrame=now;
    if(simulationPaused){resize();updateVegetation();renderer.render(scene,camera);return}
    simulationClock+=wallDelta*simulationSpeed;visualTimeOfDayMinutes=(visualTimeOfDayMinutes+wallDelta*simulationSpeed*15)%1440;visualGameDay+=wallDelta*simulationSpeed/96;updateLighting(visualTimeOfDayMinutes);resize();updateVegetation();
    const signalPhase=Math.floor(simulationClock/2.5)%2;
    for(const signal of signalBulbs){const green=signal.axis===signalPhase;signal.red.material=mat(green?'#813d3a':'#f04f45',{emissive:'#ee453d',emissiveIntensity:green?.08:.9});signal.amber.material=mat('#806b3c',{emissive:'#ffd15d',emissiveIntensity:.06});signal.green.material=mat(green?'#53ca79':'#397352',{emissive:'#68ec8e',emissiveIntensity:green?.9:.08})}
    const cursors=[];
    for(const a of routeActors){
      if(a.deliveryProgress!==undefined)continue;
      const count=a.route.length-1,total=count*TILE;if(count<1)continue;
      const travel=((simulationClock*a.speed+a.offset)%(2*total)+2*total)%(2*total),direction=travel>total?-1:1,distance=travel>total?2*total-travel:travel;
      let index=Math.min(count-1,Math.floor(distance/TILE)),f=(distance-index*TILE)/TILE;
      if(direction<0&&distance<=0){index=0;f=0}
      const isWalker=a.selection?.type==='Peatones'||a.selection?.type==='Residente',p=a.route[index],q=a.route[index+1],dx=q[0]-p[0],dz=q[1]-p[1];
      let progress=direction===1?f:1-f;
      const nextTile=direction===1?a.route[index+1]:a.route[index],gridX=Math.round(nextTile[0]/TILE-.5),gridY=Math.round(nextTile[1]/TILE-.5);
      const signalKey=key(gridX,gridY),axis=Math.abs(dx)>Math.abs(dz)?0:1;
      const waiting=!isWalker&&!a.metroProjection&&!a.railTrain&&signalTiles.has(signalKey)&&axis!==signalPhase;
      if(waiting)progress=Math.min(progress,.76);
      const from=direction===1?a.route[index]:a.route[index+1],to=direction===1?a.route[index+1]:a.route[index];
      const laneKey=`${Math.round(from[0]/TILE-.5)},${Math.round(from[1]/TILE-.5)}>${Math.round(to[0]/TILE-.5)},${Math.round(to[1]/TILE-.5)}:${Math.sign(a.side||.18)*direction}`;
      cursors.push({a,index,f,progress,direction,p,q,dx,dz,isWalker,waiting,vehicle:!isWalker&&!a.metroProjection&&!a.railTrain&&a.selection?.type!=='Avión de pasajeros',laneKey});
    }
    // Mantén una distancia de seguridad entre vehículos que avanzan por el mismo carril.
    applyTrafficQueue(cursors,.43);
    for(const c of cursors){const {a,index,direction,p,q,dx,dz,isWalker}=c;let f=direction===1?c.progress:1-c.progress;const count=a.route.length-1,next=a.route[Math.min(count,index+2)],ndx=next[0]-q[0],ndz=next[1]-q[1],turn=f>.75&&index<count-1?(f-.75)/.25:0,bend=turn&&Math.abs(ndx*dz-ndz*dx)>0?turn*turn*(3-2*turn)*.16:0,side=a.railTrain?0:isWalker?a.side:-Math.abs(a.side||.18)*direction,targetX=p[0]+dx*f+dz/TILE*side+ndx/TILE*bend,targetZ=p[1]+dz*f-dx/TILE*side+ndz/TILE*bend;
      a.mesh.position.set(targetX,a.height||0,targetZ);const angle=Math.atan2(dx*direction+ndx/TILE*bend,dz*direction+ndz/TILE*bend),delta=Math.atan2(Math.sin(angle-a.mesh.rotation.y),Math.cos(angle-a.mesh.rotation.y));a.mesh.rotation.y+=delta*.22;
    }
    for(const a of routeActors){
      if(a.deliveryProgress===undefined)continue;
      const count=a.route.length-1;if(count<1)continue;const deliveryProgress=a.deliveryStartDay!==undefined?clamp((visualGameDay-a.deliveryStartDay)/Math.max(1,a.deliveryEndDay-a.deliveryStartDay),0,.999):a.deliveryProgress,distance=clamp(count*TILE*deliveryProgress,0,count*TILE-.01),index=Math.min(count-1,Math.floor(distance/TILE)),f=(distance-index*TILE)/TILE,p=a.route[index],q=a.route[index+1],dx=q[0]-p[0],dz=q[1]-p[1],side=a.side||0;
      a.mesh.position.set(p[0]+dx*f+dz/TILE*side,a.height||0,p[1]+dz*f-dx/TILE*side);a.mesh.rotation.y=Math.atan2(dx,dz);
    }
    const ambientTime=now*.004;
    for(const f of fireVisuals){const t=simulationClock*.8+f.seed;for(const p of f.flames){const q=(t+p.phase)%1.15;p.mesh.position.set(f.fx+Math.sin(t*4+p.phase*9)*.13,.48+q*1.85,f.fz+Math.cos(t*3+p.phase*8)*.11);p.mesh.scale.set(.82+Math.sin(t*8+p.phase*12)*.2,Math.max(.05,Math.sin(q*Math.PI)),.82+Math.sin(t*8+p.phase*12)*.2);p.mesh.material.opacity=.92*(1-q*.42);p.mesh.rotation.z=Math.sin(t*5+p.phase*7)*.18}for(const p of f.smoke){const q=(t*.34+p.phase)%1;p.mesh.position.set(f.fx+Math.sin(t*1.4+p.phase*8)*(.18+q*.4),1.42+q*3.15,f.fz+Math.cos(t*1.2+p.phase*9)*(.18+q*.4));p.mesh.scale.setScalar(.62+q*1.45);p.mesh.material.opacity=.42*(1-q)}}
    for(let i=0;i<waves.length;i++)waves[i].material.opacity=.23+.11*Math.sin(now*.0014+i);
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  function projectTile(x,y,height=2.5){
    updateCamera();
    const projected=new THREE.Vector3((x+.5)*TILE,height,(y+.5)*TILE).project(camera);
    const width=canvas.clientWidth,heightPixels=canvas.clientHeight;
    const visible=projected.z>=-1&&projected.z<=1&&projected.x>-.96&&projected.x<.96&&projected.y>-.95&&projected.y<.96;
    return {x:(projected.x+1)*width/2,y:(1-projected.y)*heightPixels/2,visible};
  }
  function screenToTile(px,py){updateCamera();const w=canvas.clientWidth,h=canvas.clientHeight;raycaster.setFromCamera(new THREE.Vector2(px/w*2-1,1-py/h*2),camera);if(!raycaster.ray.intersectPlane(groundPlane,hit))return [-1,-1];return [Math.floor(hit.x/TILE),Math.floor(hit.z/TILE)]}
  function screenToActor(px,py){updateCamera();const w=canvas.clientWidth,h=canvas.clientHeight,candidates=[];for(const actor of routeActors){if(!actor.selection)continue;const point=actor.mesh.position.clone().project(camera);if(point.z<-1||point.z>1)continue;const sx=(point.x+1)*w/2,sy=(1-point.y)*h/2,d=Math.hypot(sx-px,sy-py),limit=smallScreen?26:20;if(d<=limit)candidates.push({actor,d,z:point.z})}candidates.sort((a,b)=>a.d-b.d||a.z-b.z);return candidates[0]?.actor.selection||null}
  function setView(nextView){view=nextView;updateCamera();updateVegetation();renderer.render(scene,camera)}
  function focusTile(x,y,nextView=view){view={...nextView};resize();updateVegetation();const yaw=Math.PI/4+view.rotation*Math.PI/2,right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),upGround=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),span=58/clamp(view.zoom,.55,4),units=span/Math.max(1,canvas.clientHeight),dx=cameraAnchor.x*TILE-(Number(x)+.5)*TILE,dz=cameraAnchor.y*TILE-(Number(y)+.5)*TILE;view.panX=(dx*right.x+dz*right.z)/units;view.panY=(dx*upGround.x+dz*upGround.z)/units;updateCamera();renderer.render(scene,camera);return{panX:view.panX,panY:view.panY}}
  const buildPreviewCache=new Map(),previewWidth=144,previewHeight=100,previewCanvas=document.createElement('canvas');let previewRenderer=null;
  const previewScene=new THREE.Scene();previewScene.background=new THREE.Color('#dce9da');previewScene.add(new THREE.HemisphereLight('#fff8e7','#637b68',1.3));const previewSun=new THREE.DirectionalLight('#fff0cd',2.1);previewSun.position.set(4,8,6);previewScene.add(previewSun);const previewCamera=new THREE.PerspectiveCamera(32,previewWidth/previewHeight,.1,30);previewCamera.position.set(3.7,3.1,4.8);previewCamera.lookAt(0,1,0);
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
    else if(tool==='zoneHome'||tool==='zoneShop'||tool==='zoneFactory'){const color=tool==='zoneHome'?'#4eaf75':tool==='zoneShop'?'#4da6c4':'#daa94c';box(group,2.8,.08,2.8,color,0,.02,0);for(const x of [-1.42,1.42])box(group,.09,.5,.09,'#f4edcf',x,.27,0)}
    else if(tool==='home')house(group,{x:3,y:2,level:1,urbanCondition:90,architecturalStyle:''});
    else if(tool==='shop')shop(group,{name:'Mercado de barrio',business:{status:'abierto'}});
    else if(tool==='factory')factory(group,{business:{industryType:industry,lastProduction:2}});
    else if(tool==='civic'){
      if(model==='tvHeadend'||model==='wifiHub')digitalUtilityBuilding(group,model);
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
    group.rotation.y=-.4;const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());group.position.set(-center.x,-bounds.min.y+.1,-center.z);const scale=3.5/Math.max(size.x,size.y,size.z,1);group.scale.setScalar(scale);return group;
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
  return {sync,screenToTile,screenToActor,setView,focusTile,projectTile,renderBuildPreviews,invalidate(){visualSignature=''},
    getSceneDiagnostics:()=>({drawCalls:renderer.info.render.calls,canvasWidth:canvas.width,canvasHeight:canvas.height,contextLost:renderer.getContext().isContextLost(),paused:simulationPaused,dynamicObjects:dynamicRoot.children.length,metroStations:dynamicRoot.children.filter(m=>m.userData.metroStation).length,physicalRailStations:dynamicRoot.children.filter(m=>m.userData.railStationSite).length,metroTunnelSegments:dynamicRoot.children.filter(m=>m.userData.metroTunnelSegment).length,metroTrains:trafficRoot.children.filter(m=>m.userData.metroProjection).length,railTrains:trafficRoot.children.filter(m=>m.userData.railTrain).length,railTracks:dynamicRoot.children.filter(m=>m.userData.railTrack).length,railPlatforms:dynamicRoot.children.filter(m=>m.userData.railPlatform).length,streetLightCount:streetLights.length,illuminatedStreetlights:streetLights.filter(l=>poweredStreetlights.has(key(l.x,l.y))).length,tunnel:{visible:gatewayTunnel.visible,roofVisible:tunnelRoof.visible,length:tunnelRoof.geometry.parameters.width}}),
    getMaritimeActors:()=>routeActors.filter(a=>a.selection?.type?.includes('Buque')).map(a=>{const p=a.mesh.position.clone().project(camera);return {type:a.selection.type,title:a.selection.title,x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2,visible:p.z>=-1&&p.z<=1&&p.x>-.98&&p.x<.98&&p.y>-.98&&p.y<.98,position:[a.mesh.position.x,a.mesh.position.z]}}),
    getInspectableActors:()=>routeActors.filter(a=>a.selection).map(a=>{const p=a.mesh.position.clone().project(camera);return {type:a.selection.type,title:a.selection.title,x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2,visible:p.z>=-1&&p.z<=1&&p.x>-.98&&p.x<.98&&p.y>-.98&&p.y<.98,routeLength:a.route?.length||0,rotationY:a.mesh.rotation.y}}),
    getFireParticleCounts:()=>({incidents:fireVisuals.length,flames:fireVisuals.reduce((n,f)=>n+f.flames.length,0),smoke:fireVisuals.reduce((n,f)=>n+f.smoke.length,0)}),
    getCoverageTiles:()=>dynamicRoot.children.filter(m=>m.userData.serviceCoverage).map(m=>({x:m.position.x,z:m.position.z,radius:m.userData.serviceRadius,width:m.geometry?.parameters?.width||0})),
    getEmergencyActors:()=>trafficRoot.children.filter(m=>m.userData.emergencyRole).map(m=>({
      type:m.userData.emergencyRole,id:m.userData.emergencyId,visible:m.visible,
      inScene:m.parent===trafficRoot,position:[m.position.x,m.position.z],
      moving:routeActors.some(a=>a.mesh===m),routeLength:routeActors.find(a=>a.mesh===m)?.route.length||0
    }))};
}
