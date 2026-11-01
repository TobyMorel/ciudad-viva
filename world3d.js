import * as THREE from './vendor/three.module.js';

const GRID_W=28, GRID_H=20, TILE=2;
const COLORS={grass:'#80af70',sand:'#e4d3ae',water:'#389dac',road:'#3f464b',walk:'#d5ccba',line:'#f2df9c',home:'#e9c99e',shop:'#a3c9bd',civic:'#e7d1b0'};
const key=(x,y)=>`${x},${y}`;
const waterTile=(x,y)=>x>=24||(y<3&&x>18);
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
  const staticRoot=new THREE.Group(),dynamicRoot=new THREE.Group(),trafficRoot=new THREE.Group();scene.add(staticRoot,dynamicRoot,trafficRoot);
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
  const grassTex=new THREE.CanvasTexture(texCanvas);grassTex.colorSpace=THREE.SRGBColorSpace;grassTex.wrapS=grassTex.wrapT=THREE.RepeatWrapping;grassTex.repeat.set(3,2.4);grassTex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  plane(staticRoot,180,150,mat('#8dbb7b'),28,-.24,20);
  plane(staticRoot,56,40,new THREE.MeshStandardMaterial({map:grassTex,roughness:1}),28,-.16,20);
  box(staticRoot,2.1,.12,35.8,COLORS.sand,47,-.08,23);
  box(staticRoot,9.8,.12,2.1,COLORS.sand,43,-.08,7);
  box(staticRoot,.84,.06,31,'#ab805c',46.74,.025,23);
  for(let z=8;z<39;z+=.85)box(staticRoot,.86,.014,.035,'#e0b784',46.74,.065,z,{cast:false});
  for(let z=9;z<39;z+=2.5)box(staticRoot,.05,.48,.05,'#e3c498',47.17,.27,z);
  box(staticRoot,.05,.055,30.5,'#dcc09b',47.17,.49,23.5);
  const waterMat=mat(COLORS.water,{metalness:.08,roughness:.28,transparent:true,opacity:.97});
  plane(staticRoot,96,100,waterMat,96,-.09,20);
  plane(staticRoot,10,6,waterMat,43,-.08,3);
  const waves=[];
  for(let i=0;i<88;i++){const x=49+seeded(i+130)*62,z=-8+seeded(i+145)*60;if(x>100&&z>40)continue;const w=.45+seeded(i+132)*1.1;const wave=line(staticRoot,[[x-w/2,-.045,z],[x+w/2,-.045,z]],i%4?'#d8f0e6':'#a2d9d8',.38);waves.push(wave)}
  for(let i=0;i<18;i++){const x=38.7+seeded(i+217)*8.2,z=.6+seeded(i+369)*4.7,w=.23+seeded(i+411)*.56;waves.push(line(staticRoot,[[x-w/2,-.038,z],[x+w/2,-.038,z]],'#dbf1e7',.34))}
  for(let i=0;i<11;i++){const x=38.6+i*.82;const stone=sphere(staticRoot,.12+seeded(i+783)*.08,i%2?'#d7cbaa':'#bcb6a0',x,-.025,6.1+seeded(i+44)*.35,1);stone.scale.y=.42}
  for(let z=8;z<40;z+=1.6){box(staticRoot,.65,.045,1.48,'#e8dfca',45.68,.02,z,{cast:false});box(staticRoot,.16,.35,1.48,'#a19b89',47.48,-.04,z,{cast:false});for(let j=0;j<2;j++)box(staticRoot,.045,.12,.37,'#f0e2ce',47.51,.12,z-.3+j*.53,{cast:false})}
  for(let z=10;z<38;z+=5){for(const offset of [-.33,.33])box(staticRoot,.13,.07,.1,'#9b7654',46.15+offset,.16,z,{cast:false});box(staticRoot,.82,.09,.27,'#c78f5d',46.15,.24,z);box(staticRoot,.055,.36,.055,'#475b55',46.5,.34,z+1.4);sphere(staticRoot,.12,'#ffdfad',46.5,.57,z+1.4,1)}
  for(let i=0;i<20;i++){const z=8+seeded(i+70)*31;const rock=sphere(staticRoot,.11+seeded(i+18)*.12,i%3?'#b9ad91':'#d7c9a8',47.65+seeded(i+210)*.35,-.015,z,1);rock.scale.y=.5}
  // Lomas y arboledas en el borde externo suavizan el horizonte del mapa.
  for(let i=0;i<24;i++){const x=-21+seeded(i+450)*100,z=-15+seeded(i+653)*77;if(x>-7&&x<63&&z>-7&&z<49||x>49)continue;const r=2+seeded(i+9)*4;const hill=sphere(staticRoot,r,i%2?'#77a56d':'#739d73',x,-.05,z,2);hill.scale.y=.27+seeded(i+770)*.13;hill.rotation.y=seeded(i+91)*Math.PI}
  const treeSpots=[];
  function tree(x,z,seed){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=seeded(seed+92)*Math.PI*2;const species=Math.floor(seeded(seed+8)*5),s=(.65+seeded(seed+55)*.55)*(species===2?.76:1),blossom=species===4&&seeded(seed+11)>.48,olive=species===3;groundShadow(g,0,0,.59*s,.19);const trunk=cylinder(g,.075*s,.12*s,.87*s,olive?'#716e52':'#775c45',0,.42*s,0,10);trunk.castShadow=!smallScreen&&seeded(seed+333)>.65;const palette=blossom?['#d58da9','#e5a9bb','#f1c3c8']:olive?['#719466','#94a36b','#8daa77']:species===1?['#3d8060','#568f5f','#79aa68']:['#4d8957','#67a45d','#8bb664'];const lobes=smallScreen?3:species===1?5:4;for(let i=0;i<lobes;i++){const a=i*Math.PI*2/lobes,spread=species===1?.28:.21,px=Math.cos(a)*spread*s,pz=Math.sin(a)*spread*s,y=(species===2?1.0:1.12)*s+(i%2)*.1*s;sphere(g,(species===1?.31:.26)*s,palette[i%3],px,y,pz,2)}const crown=sphere(g,(species===2?.38:.35)*s,palette[1],0,(species===2?1.15:1.3)*s,0,2);crown.castShadow=!smallScreen&&seeded(seed+333)>.65;if(!smallScreen&&species!==2)for(let i=0;i<3;i++){const a=i*2.4;sphere(g,.065*s,blossom?'#f4d5d2':'#b4c978',Math.cos(a)*.26*s,1.15*s+Math.sin(i*5)*.12*s,Math.sin(a)*.26*s,1)}staticRoot.add(g);return g}
  for(let y=1;y<GRID_H-1;y++)for(let x=1;x<23;x++){
    if(waterTile(x,y)||seeded(x*97+y*53)>(smallScreen?.76:.72))continue;
    const [cx,cz]=tilePos(x,y),dx=(seeded(x*12+y*70)-.5)*.9,dz=(seeded(x*88+y*13)-.5)*.9;
    treeSpots.push({x,y,mesh:tree(cx+dx,cz+dz,(x+1)*63+y*23)});
  }
  for(let i=0;i<70;i++){const x=1+Math.floor(seeded(i+824)*22),y=1+Math.floor(seeded(i+532)*18);if(waterTile(x,y))continue;const [cx,cz]=tilePos(x,y),g=new THREE.Group();g.position.set(cx+(seeded(i+44)-.5)*1.1,0,cz+(seeded(i+91)-.5)*1.1);const r=.15+seeded(i+59)*.13;sphere(g,r,i%7===0?'#bf9d91':i%5===0?'#d3b37c':'#6c9d61',0,.13,0,1);if(i%4===0)sphere(g,r*.7,'#89ad65',r,.1,.03,1);staticRoot.add(g);treeSpots.push({x,y,mesh:g})}
  const routeActors=[],fireVisuals=[],signalBulbs=[],signalTiles=new Set();
  const tripSelection=(trip,modeLabel)=>({type:modeLabel,title:modeLabel==='Peatones'?'Personas caminando':'Vehículo particular',description:`Viaje de ${trip.reason==='trabajo'?'trabajo':trip.reason==='compras'?'compras':'servicios'} en la simulación actual.`,metrics:[['Pasajeros',trip.workers||0],['Vehículos',trip.vehicles||0],['Origen',trip.from?`${trip.from[0]+1}, ${trip.from[1]+1}`:'—'],['Destino',trip.to?`${trip.to[0]+1}, ${trip.to[1]+1}`:'—'],['Distancia',`${trip.distance||0} tramos`],['Tiempo estimado',`${trip.estimatedMinutes||0} min`]],people:trip.people||[]});
  const raycaster=new THREE.Raycaster(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
  let view={zoom:1,panX:0,panY:0,rotation:0},lastFrame=0,frameInterval=33,visualSignature='',lastProjection='';
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const dpr=renderer.getPixelRatio();if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr))renderer.setSize(w,h,false);const projection=`${w}:${h}:${view.zoom}`;if(projection===lastProjection)return;lastProjection=projection;const span=58/clamp(view.zoom,.55,4),aspect=w/h;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix()}
  function updateCamera(){resize();const yaw=Math.PI/4+view.rotation*Math.PI/2,span=58/clamp(view.zoom,.55,4),units=span/Math.max(1,canvas.clientHeight);const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),upGround=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const target=new THREE.Vector3(28,0,20).addScaledVector(right,-view.panX*units).addScaledVector(upGround,-view.panY*units);camera.position.copy(target).add(new THREE.Vector3(Math.sin(yaw)*60,65,Math.cos(yaw)*60));camera.lookAt(target);camera.updateMatrixWorld()}
  function addRoad(root,x,y,roads,stress=0,signals=false){const [cx,cz]=tilePos(x,y),n=roads.has(key(x,y-1)),s=roads.has(key(x,y+1)),e=roads.has(key(x+1,y)),w=roads.has(key(x-1,y)),degree=Number(n)+Number(s)+Number(e)+Number(w);const asphalt=view.trafficOverlay?(stress>.8?'#c64e48':stress>.45?'#e88b48':stress>.2?'#e7be58':'#55af82'):COLORS.road;box(root,1.37,.055,1.37,COLORS.walk,cx,.006,cz,{cast:false});box(root,1.03,.052,1.03,asphalt,cx,.052,cz,{cast:false});
    for(const [dx,dy] of [[1,0],[0,1]]){if(!roads.has(key(x+dx,y+dy)))continue;const horizontal=dx===1,sx=cx+dx,zs=cz+dy;box(root,horizontal?2.08:1.37,.055,horizontal?1.37:2.08,COLORS.walk,sx,.006,zs,{cast:false});box(root,horizontal?2.08:1.03,.052,horizontal?1.03:2.08,asphalt,sx,.052,zs,{cast:false});for(const step of [-.55,.55])box(root,horizontal?.27:.025,.008,horizontal?.025:.27,COLORS.line,sx+(horizontal?step:0),.083,zs+(horizontal?0:step),{cast:false})}
    if(degree===2&&n&&s||degree===2&&e&&w){for(const step of [-.31,.31])box(root,e&&w?.27:.025,.009,e&&w?.025:.27,COLORS.line,cx+(e&&w?step:0),.084,cz+(n&&s?step:0),{cast:false})}
    if(degree>=3){for(const [dx,dy,on] of [[0,-1,n],[0,1,s],[-1,0,w],[1,0,e]]){if(!on)continue;for(let j=-2;j<=2;j++){const shift=j*.16;box(root,dx?.14:.09,.009,dy?.14:.09,'#f6f1de',cx+(dx?.53*dx:shift),.085,cz+(dy?.53*dy:shift),{cast:false})}}}
    if(signals){for(const [ox,oz] of [[.72,.72],[-.72,-.72]]){cylinder(root,.025,.035,.8,'#42515a',cx+ox,.42,cz+oz,8);box(root,.1,.24,.11,'#263944',cx+ox,.88,cz+oz);signalBulbs.push({mesh:sphere(root,.037,'#80be86',cx+ox,.94,cz+oz+.06,1),axis:ox>0?0:1});sphere(root,.027,'#dfb55d',cx+ox,.85,cz+oz+.06,1)}}
    if((x*5+y*3)%8===0){box(root,.055,1.28,.055,'#4b5755',cx+.7,.67,cz+.7);box(root,.42,.045,.055,'#4b5755',cx+.51,1.31,cz+.7);box(root,.22,.08,.18,'#ffe4a6',cx+.31,1.28,cz+.7);box(root,.06,.13,.06,'#3b4e4b',cx+.7,.08,cz+.7)}
  }
  function addZone(root,z){const [x,y]=tilePos(z.x,z.y),color=z.kind==='home'?'#65bb80':z.kind==='factory'?'#e1bd48':'#5eb1bf';plane(root,1.62,1.62,mat(color,{transparent:true,opacity:.29,depthWrite:false}),x,.08,y);const p=[[-.84,-.84],[.84,-.84],[.84,.84],[-.84,.84],[-.84,-.84]].map(([a,b])=>[x+a,.09,y+b]);line(root,p,color,.95);for(const a of [-.7,.7])for(const b of [-.7,.7])box(root,.1,.15,.1,color,x+a,.12,y+b)}
  function sideWindow(g,x,y,z,wide=.19){box(g,wide,.31,.045,'#f7f2d6',x,y,z);box(g,wide*.75,.24,.05,'#5b9eae',x,y,z+.035);box(g,.025,.29,.065,'#ede6cb',x,y,z+.05)}
  function flankWindows(g,w,floors){for(let floor=0;floor<floors;floor++)for(const z of [-.37,.37]){const y=.67+floor*.76;for(const side of [-1,1]){box(g,.047,.32,.21,'#eee4d1',side*(w/2+.024),y,z);box(g,.055,.23,.14,'#78a9af',side*(w/2+.054),y,z);box(g,.07,.05,.22,'#e8dbbd',side*(w/2+.06),y-.17,z)}}}
  function roof(g,w,d,h,color){const shape=new THREE.Shape();shape.moveTo(-w*.52,0);shape.lineTo(0,.47);shape.lineTo(w*.52,0);shape.closePath();const fill=new THREE.Mesh(geometry(`roof:${w}:${d}`,()=>new THREE.ExtrudeGeometry(shape,{depth:d+.14,bevelEnabled:false})),mat('#cba88a'));fill.position.set(0,h,-(d+.14)/2);fill.receiveShadow=true;g.add(fill);const left=box(g,w*.74,.09,d+.25,color,-w*.26,h+.23,0,{cast:true});left.rotation.z=.62;const right=box(g,w*.74,.09,d+.25,color,w*.26,h+.23,0,{cast:true});right.rotation.z=-.62;box(g,.08,.085,d+.28,'#e2b282',0,h+.48,0);for(const z of [-d*.3,0,d*.3]){const trimL=box(g,w*.72,.017,.025,'#d79569',-w*.26,h+.29,z);trimL.rotation.z=.62;const trimR=box(g,w*.72,.017,.025,'#d79569',w*.26,h+.29,z);trimR.rotation.z=-.62}}
  function house(g,b){const h=b.level>=2?2.8:2.15,w=1.5,d=1.42,variant=(b.x*3+b.y*7)%5,wall=b.architecturalStyle==='Contemporáneo rehabilitado'?'#d9d2bd':b.urbanCondition<55?'#b7a88e':['#e5c49b','#e8d7b1','#d4aaa0','#cabca0','#abc7af'][variant],roofColor=['#a65f58','#a87557','#88615b','#a06454','#667d76'][variant];box(g,w,h,d,wall,0,h/2+.08,0,{cast:true});box(g,w+.08,.15,d+.07,'#f8e8c9',0,.19,0);if(['Moderno','Contemporáneo','Actual','Contemporáneo rehabilitado'].includes(b.architecturalStyle)&&variant===4){box(g,w+.12,.15,d+.12,roofColor,0,h+.14,0);box(g,.58,.22,.47,'#d7c99e',-.36,h+.31,-.22)}else roof(g,w,d,h+.08,roofColor);const floors=b.level>=2?3:2;for(let floor=0;floor<floors;floor++)for(const x of [-.43,.43])sideWindow(g,x,.65+floor*.77,d/2+.035);flankWindows(g,w,floors);box(g,.29,.57,.08,'#5f746d',0,.41,d/2+.075);for(const x of [-.43,.43]){box(g,.27,.035,.09,'#f2e3ce',x,.48,d/2+.11);box(g,.22,.05,.12,'#78a889',x,.42,d/2+.14)}box(g,.32,.045,.18,'#d4bca0',0,.75,d/2+.11);box(g,.46,.04,.25,'#d3ac7d',0,.14,d/2+.26);for(const x of [-.6,.6])box(g,.045,.34,.045,'#ede8c8',x,.88,d/2+.08);box(g,1.35,.055,.16,'#d5a074',0,.72,d/2+.16);box(g,.11,.5,.11,'#725750',.48,h+.55,-.26)}
  function shop(g,b){const h=b.name==='Talleres del Puerto'?1.9:2.1,closed=b.business?.status==='cerrado';box(g,1.72,h,1.55,b.name==='Talleres del Puerto'?'#9ab8ad':COLORS.shop,0,h/2+.08,0,{cast:true});box(g,1.87,.17,1.72,'#4e7774',0,h+.1,0);flankWindows(g,1.72,2);box(g,1.64,.22,.22,closed?'#77706b':'#d99069',0,1.48,.86);for(let i=-1;i<=1;i++)box(g,.43,.85,.055,closed?'#68797b':'#53969e',i*.51,.77,.81);box(g,1.57,.1,.07,'#e8dcc5',0,1.2,.85);for(const x of [-.6,.6])box(g,.11,.1,.55,'#e9b36f',x,1.56,1.03);box(g,.55,.31,.12,'#f1e4c6',0,1.74,.84);box(g,.42,.035,.14,closed?'#8c6555':'#4a8d88',0,1.73,.92);box(g,.45,.3,.4,'#819b96',-.35,h+.35,-.15);if(closed)box(g,1.2,.12,.08,'#8b5c4e',0,.28,.91)}
  function powerPlant(g){box(g,1.6,1.15,1.2,'#c7baa0',0,.62,-.08,{cast:true});box(g,1.78,.16,1.4,'#58787a',0,1.27,-.08);for(const x of [-.52,.52]){cylinder(g,.26,.38,.66,'#e7ded0',x,.44,-.55,14);cylinder(g,.34,.3,.18,'#e7ded0',x,.86,-.55,14);box(g,.18,.42,.18,'#a65f54',x,1.55,-.56)}box(g,.5,.43,.08,'#d8a75d',-.35,.59,.55);for(const x of [-.78,.78])for(const z of [-.6,.58])cylinder(g,.07,.09,.12,'#526b64',x,.08,z)}
  function waterPlant(g){box(g,1.68,.82,1.3,'#ded5bd',-.1,.48,-.12,{cast:true});box(g,1.78,.12,1.42,'#637e79',-.1,.94,-.12);cylinder(g,.5,.48,.92,'#74aeb2',.48,.54,-.38,20);cylinder(g,.53,.5,.12,'#d8e8d9',.48,1.03,-.38,20);for(const x of [-.64,-.2]){box(g,.26,.44,.28,'#8db8ae',x,.32,.49);box(g,.29,.06,.31,'#e4ead5',x,.56,.49)}box(g,.1,.54,.1,'#528c91',-.75,.27,-.65);for(const x of [-.76,.76])for(const z of [-.66,.65])cylinder(g,.07,.09,.12,'#526b64',x,.08,z)}
  function wastewaterPlant(g){box(g,1.72,.78,1.35,'#b8c8b9',-.12,.45,-.12,{cast:true});box(g,1.82,.12,1.45,'#617b72',-.12,.9,-.12);for(const [x,z,color] of [[-.48,-.42,'#7bb4a9'],[.43,-.42,'#829d92'],[-.48,.38,'#8ab0a2'],[.43,.38,'#72968d']]){cylinder(g,.34,.32,.58,color,x,.35,z,18);cylinder(g,.37,.34,.09,'#d6ddc8',x,.67,z,18)}box(g,.12,.66,.12,'#819590',.77,.35,-.56);box(g,.48,.08,.45,'#d9c7a5',.48,.1,.63);for(const x of [-.74,.74])for(const z of [-.62,.62])cylinder(g,.07,.09,.12,'#526b64',x,.08,z)}
  function hotel(g,b){const floors=4,closed=b.business?.status==='cerrado';box(g,1.63,2.85,1.42,closed?'#8d9990':'#e4d7bd',0,1.48,0,{cast:true});box(g,1.75,.17,1.54,closed?'#686e68':'#3e7778',0,2.98,0);box(g,1.88,.12,1.65,'#b27762',0,.18,0);for(let floor=0;floor<floors;floor++){for(const x of [-.52,0,.52]){box(g,.31,.42,.055,closed?'#78807b':'#71aeb2',x,.62+floor*.64,.74);box(g,.34,.055,.07,'#f3e7d0',x,.39+floor*.64,.78)}box(g,1.7,.055,.06,'#f1e6cf',0,.97+floor*.64,.76)}box(g,.66,.48,.12,closed?'#797a72':'#c56f5b',0,2.38,.78);box(g,.48,.28,.08,'#f8e6c8',0,2.39,.86);for(const x of [-.62,.62])box(g,.16,.22,.48,'#5c8d67',x,.31,.95);box(g,.5,.62,.12,'#6b7774',0,.42,.81);for(const x of [-.8,.8])for(const z of [-.66,.66]){cylinder(g,.09,.11,.12,'#5b735e',x,.09,z);sphere(g,.17,'#548b61',x,.34,z,1)}if(closed)box(g,1.1,.1,.08,'#9e6656',0,.25,.88)}
  function clinic(g){const h=2.77;box(g,1.78,h,1.65,COLORS.civic,0,h/2+.08,0,{cast:true});box(g,1.98,.15,1.87,'#b8796b',0,h+.12,0);flankWindows(g,1.78,3);box(g,1.83,.16,.16,'#e6b291',0,1.39,.87);for(const floor of [0,1,2])for(const x of [-.59,0,.59])sideWindow(g,x,.65+floor*.73,.85,.27);box(g,.45,.67,.12,'#558b96',0,.45,.89);box(g,1.3,.08,.58,'#f2d9b3',0,1.13,1.11);for(const x of [-.55,.55])box(g,.09,1.03,.09,'#e6d3ae',x,.59,1.26);box(g,.47,.47,.07,'#fbf8e9',0,h+.47,.77);box(g,.28,.075,.08,'#c8665f',0,h+.49,.82);box(g,.08,.3,.08,'#c8665f',0,h+.49,.82)}
  function school(g){const h=1.65;box(g,1.82,h,1.62,'#e8d4ad',0,h/2+.08,0,{cast:true});box(g,1.96,.16,1.78,'#537d78',0,h+.12,0);flankWindows(g,1.82,2);for(const x of [-.58,0,.58]){box(g,.31,.43,.06,'#72aeb0',x,.95,.84);box(g,.35,.06,.08,'#f0e4c9',x,.71,.88)}box(g,.4,.58,.12,'#477a83',0,.38,.9);box(g,.76,.25,.1,'#f2e6c9',0,2.05,.85);for(const x of [-.16,.16])box(g,.07,.18,.12,'#cf755f',x,2.06,.91);box(g,1.4,.1,.13,'#d58b65',0,.18,0);for(const x of [-.7,.7]){cylinder(g,.07,.08,.12,'#526b64',x,.08,.7);sphere(g,.18,'#649568',x,.3,.7,1)}}
  function fireStation(g){box(g,1.86,1.12,1.58,'#d9c9b1',0,.62,0,{cast:true});box(g,1.98,.16,1.72,'#9b5d4b',0,1.23,0);for(const x of [-.53,.53]){box(g,.72,.72,.08,'#344f51',x,.48,.84);box(g,.62,.6,.1,'#b96448',x,.43,.9);box(g,.62,.075,.12,'#e3d2b5',x,.75,.92);for(const dx of [-.2,.2])box(g,.045,.45,.08,'#d8c6a6',x+dx,.43,.96)}box(g,.58,.26,.1,'#f4e7c9',0,1.56,.82);box(g,.2,.22,.06,'#b94f40',0,1.57,.9);cylinder(g,.055,.06,.34,'#bd7054',-.66,1.48,-.44);cylinder(g,.055,.06,.34,'#bd7054',.66,1.48,-.44);box(g,.3,.08,.26,'#59696a',-.72,.09,.64);box(g,.18,.11,.24,'#dfad56',-.72,.17,.64)}
  function townHall(g){const h=2.5;box(g,1.86,h,1.7,'#e8d1a6',0,h/2+.08,0,{cast:true});box(g,2.03,.18,1.89,'#877c75',0,h+.15,0);flankWindows(g,1.86,3);for(const floor of [0,1])for(const x of [-.62,0,.62])sideWindow(g,x,.79+floor*.89,.88,.22);box(g,.52,.83,.12,'#688b8e',0,.49,.92);for(const x of [-.58,.58])box(g,.11,1.23,.11,'#f3e5c5',x,.68,1.0);box(g,1.42,.13,.53,'#c59c7b',0,1.4,1.05);box(g,.63,.69,.62,'#e8d7b7',0,h+.52,0);box(g,.79,.12,.79,'#a16e64',0,h+.91,0);const dial=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.04,16),mat('#f6ead3'));dial.rotation.x=Math.PI/2;dial.position.set(0,h+.55,.34);g.add(dial);box(g,.03,.16,.04,'#4c625e',0,h+.57,.37);box(g,.42,.07,.36,'#d1aa75',0,.08,1.15)}
  function depot(g){box(g,1.72,1.52,1.58,'#c5b99e',0,.83,0,{cast:true});box(g,1.82,.16,1.7,'#667b76',0,1.66,0);box(g,1.72,.22,.08,'#a97856',0,.26,.83);box(g,.1,1.04,.08,'#725f50',-.66,.83,.87);box(g,.1,1.04,.08,'#725f50',.66,.83,.87);for(let y of [.55,.9,1.25]){box(g,1.24,.055,.1,'#8f7458',0,y,.91);for(let x of [-.46,0,.46])box(g,.28,.26,.24,['#bd8957','#7e9c8b','#d2ad68'][(Math.round(y*10)+Math.round((x+1)*10))%3],x,y+.15,.78)}box(g,.42,.28,.12,'#6d8988',0,.53,.94);box(g,.52,.13,.08,'#eee0c4',0,1.89,.74)}
  function landfillFacility(g){box(g,1.78,.16,1.62,'#82907a',0,.1,0,{cast:true});box(g,1.42,.42,1.16,'#96785a',0,.34,-.05,{cast:true});box(g,1.5,.11,1.24,'#5e7f67',0,.58,-.05);for(const x of [-.58,.58])for(const z of [-.44,.4])cylinder(g,.055,.055,.55,'#68766b',x,.33,z);box(g,.48,.32,.08,'#d9cba9',.52,.82,.51);box(g,.34,.08,.02,'#697e70',.52,.83,.56);box(g,.68,.07,.48,'#766a58',-.55,.18,.76);for(const x of [-.76,.74])sphere(g,.14,'#67876a',x,.23,-.5,1)}
  function recyclingFacility(g){box(g,1.72,.16,1.55,'#8a9b79',0,.1,0,{cast:true});box(g,1.32,.7,1.08,'#aebeb0',-.08,.47,-.08,{cast:true});box(g,1.4,.09,1.15,'#678c7d',-.08,.86,-.08);for(const [x,z,color] of [[-.43,-.4,'#5c8d72'],[.38,-.4,'#c0914d'],[-.43,.34,'#5d8290'],[.4,.34,'#b9755c']]){box(g,.38,.26,.32,color,x,.19,z);box(g,.38,.035,.32,'#d3d7c5',x,.34,z)}box(g,.38,.3,.42,'#d6c9a8',.53,.72,.46);box(g,.28,.16,.04,'#6d978b',.53,.78,.68);for(const x of [-.72,.72])cylinder(g,.07,.09,.16,'#566e5f',x,.12,-.62)}
  function busGarage(g){box(g,1.78,1.02,1.65,'#b8c9be',0,.56,-.08,{cast:true});box(g,1.95,.14,1.86,'#466e68',0,1.13,-.08);box(g,1.87,.12,.16,'#dfb46e',0,1.1,.81);for(const x of [-.56,0,.56]){box(g,.47,.68,.08,'#477077',x,.48,.78);box(g,.4,.09,.095,'#d6e5d5',x,.74,.84);box(g,.38,.05,.1,'#84aab0',x,.4,.85)}for(const x of [-.58,.58])for(const z of [-.4,.2])box(g,.18,.26,.04,'#75a3a2',x,.69,z);box(g,.86,.11,.42,'#a3a79d',0,.12,1.04);box(g,.66,.08,.25,'#d2b773',0,.09,1.12);const parked=makeBus('#dfad5d');parked.scale.setScalar(.48);parked.position.set(.62,.07,1.12);parked.rotation.y=Math.PI/2;g.add(parked)}
  function busShelter(g){box(g,1.2,.1,.48,'#35766c',0,1.43,0,{cast:true});for(const x of [-.51,.51])box(g,.075,1.38,.075,'#526c62',x,.7,0);box(g,.92,.1,.34,'#c6b99e',0,.42,-.04);for(const x of [-.35,.35])box(g,.07,.43,.07,'#526c62',x,.22,-.04);box(g,.16,.58,.13,'#e9e2c9',-.72,.45,.12);box(g,.19,.1,.16,'#be7358',-.72,.75,.12);box(g,.035,.34,.035,'#667a68',-.72,.35,.12);box(g,.22,.17,.035,'#e8b962',-.72,.53,.15);box(g,.82,.055,.08,'#dbb477',0,.12,.38)}
  function portTerminal(g){box(g,1.92,.13,1.82,'#b7a98c',0,.09,0,{cast:false});box(g,1.75,.1,.66,'#527c80',0,.17,.44);box(g,.62,.62,.82,'#d5c6a2',-.42,.53,-.28,{cast:true});box(g,.68,.1,.9,'#687d78',-.42,.9,-.28);for(let i=0;i<3;i++){const x=-.69+i*.3;box(g,.25,.2,.29,['#bd6550','#d2a454','#527d80'][i],x,.32,-.3);box(g,.25,.035,.29,'#e8d6ad',x,.44,-.3)}box(g,.1,1.65,.1,'#b56543',.55,.91,.18);box(g,.08,1.65,.08,'#b56543',.93,.91,.18);box(g,.48,.09,.09,'#b56543',.74,1.7,.18);box(g,.62,.08,.08,'#d8b16e',.76,1.31,.18);box(g,.06,.72,.06,'#536f70',.76,.98,.18);for(const x of [-.76,.76])for(const z of [-.74,.7])cylinder(g,.08,.08,.16,'#76847b',x,.08,z)}
  function airportTerminal(g){box(g,1.8,.045,.7,'#414e53',0,.06,0,{cast:false});for(let i=-2;i<=2;i++)box(g,.035,.018,.7,'#ece6d0',i*.31,.09,0,{cast:false});for(let x of [-.83,.83])for(let z of [-.28,.28])sphere(g,.045,'#e6c46d',x,.13,z,1);box(g,.92,.62,.72,'#d8d1bd',-.12,.38,-.52,{cast:true});box(g,1.02,.09,.81,'#557c7c',-.12,.73,-.52);for(let x of [-.42,-.12,.18])box(g,.18,.24,.04,'#72aab0',x,.42,-.12);box(g,.4,.82,.36,'#c1b493',.57,.49,-.47);box(g,.22,.34,.22,'#6c8d8f',.57,1.08,-.47);box(g,.06,.38,.06,'#c45d4c',.57,1.42,-.47);box(g,.06,.1,.06,'#e3be63',.57,1.66,-.47);box(g,.36,.05,.28,'#b9b09d',-.67,.12,.58);box(g,.42,.07,.32,'#d6cbb5',.34,.12,.58)}
  function factory(g,b){const wall='#d7c795',roof='#b5a25e',dark='#687a73';box(g,1.3,.82,1.35,wall,0,.48,0);box(g,1.42,.12,1.42,roof,0,.94,0);for(let i=0;i<3;i++)box(g,.48,.34,.16,'#eee5cc',-.43+i*.43,.62,.69);box(g,.24,1.35,.24,dark,-.52,1.45,-.42);box(g,.2,.22,.2,'#d6d4c5',-.52,2.2,-.42);box(g,.22,.9,.22,'#7e8879',.48,1.2,-.4);for(let i=0;i<4;i++)box(g,.16,.35,.9,roof,-.55+i*.36,1.1,-.86);for(const x of [-.46,.46]){cylinder(g,.13,.13,.11,'#738487',x,1.08,.25,18);cylinder(g,.09,.09,.17,'#c2c8ba',x,1.22,.25,18);box(g,.17,.14,.025,'#668e9a',x,.55,-.69)}box(g,.5,.08,.25,'#8c9c8c',0,.16,.78);for(let i=0;i<3;i++)box(g,.4,.025,.025,'#e8c790',0,.27+i*.065,.82);if((b.business?.lastProduction||0)>0){sphere(g,.12,'#d5d7c9',-.52,2.43,-.42,.9);sphere(g,.16,'#e2e1d2',-.62,2.66,-.42,.8)}}
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
  const SERVICE_RADII={clinic:6,medicalCenter:10,generalHospital:16,policePost:6,policeStation:11,policeHQ:16,
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
      const mesh=plane(dynamicRoot,1.04,1.04,mat('#43d485',{transparent:true,opacity:.52,depthWrite:false}),px,.125,pz);
      mesh.renderOrder=8;mesh.userData.serviceCoverage=true;mesh.userData.serviceRadius=radius;
    }
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
  function addBuilding(root,b,roads,renewalKeys){const [cx,cz]=tilePos(b.x,b.y),g=new THREE.Group();g.position.set(cx,0,cz);if(roads.has(key(b.x,b.y-1)))g.rotation.y=Math.PI;else if(roads.has(key(b.x+1,b.y)))g.rotation.y=Math.PI/2;else if(roads.has(key(b.x-1,b.y)))g.rotation.y=-Math.PI/2;root.add(g);groundShadow(g,0,0,1.25,.17);box(g,1.96,.055,1.96,'#d9ceb0',0,.025,0,{cast:false});if(b.name==='Municipalidad')townHall(g);else if(b.kind==='civic'&&['policePost','policeStation','policeHQ'].includes(b.serviceModel))policeStationModel(g,b.serviceModel==='policeHQ'?3:b.serviceModel==='policeStation'?2:1);else if(b.kind==='civic')clinic(g);else if(b.kind==='school'){school(g);if(b.serviceModel==='kindergarten'){for(const x of [-.5,.5])sphere(g,.2,'#e9b35e',x,.3,1.05,1)}else if(b.serviceModel==='secondarySchool'||b.serviceModel==='university'){const high=b.serviceModel==='university';box(g,1.4,high?1.18:.52,1,'#c5cec2',0,high?2.35:1.93,-.2,{cast:true});box(g,1.52,.1,1.12,high?'#446b8b':'#577d72',0,high?3.01:2.27,-.2);if(high)cylinder(g,.14,.16,.35,'#e8c17e',0,3.26,-.2)}}else if(b.kind==='fireStation'){fireStation(g);if(b.serviceModel==='fireStationPlus'||b.serviceModel==='fireCommand')box(g,1.3,.33,.75,'#a4614d',0,1.49,-.27);if(b.serviceModel==='fireCommand')box(g,.7,.5,.55,'#ceae86',0,1.93,-.27)}else if(b.kind==='depot'){depot(g);if(b.serviceModel==='wasteDepot'||b.serviceModel==='wasteComplex')box(g,1.3,.3,.7,'#607d71',0,1.97,-.2);if(b.serviceModel==='wasteComplex')box(g,.8,.35,.5,'#7b9e8b',0,2.29,-.22)}else if(b.kind==='landfill')landfillFacility(g);else if(b.kind==='recyclingPlant')recyclingFacility(g);else if(b.kind==='port')portTerminal(g);else if(b.kind==='airport')airportTerminal(g);else if(b.kind==='hotel')hotel(g,b);else if(b.kind==='powerPlant')powerPlant(g);else if(b.kind==='waterPlant')waterPlant(g);else if(b.kind==='wastewaterPlant')wastewaterPlant(g);else if(b.kind==='busGarage')busGarage(g);else if(b.kind==='busStop')busShelter(g);else if(b.kind==='shop')shop(g,b);else if(b.kind==='factory')factory(g,b);else house(g,b);finishArchitecture(g,b);if(!view.preview&&view.zoom>=1.4)premiumArchitecture(g,b);if(b.kind==='home'){sphere(g,.23,'#448c62',-.82,.31,.73,1);sphere(g,.2,'#5b9c68',.82,.28,-.6,1)}if(b.heritageEligible){const protectedSite=['protección parcial','protección integral'].includes(b.heritageLevel),integral=b.heritageLevel==='protección integral',plaque=integral?'#a96b3e':protectedSite?'#568c69':'#a68b50';box(g,.34,.38,.07,'#e7d7b6',.62,1.58,.85);box(g,.27,.3,.08,plaque,.62,1.58,.9);sphere(g,.075,integral?'#f3ca72':protectedSite?'#b5dc9a':'#e6ce82',.62,1.59,.96,1);if(protectedSite)box(g,1.64,.045,.08,integral?'#bc8050':'#759f70',0,2.05,0)}if((b.urbanCondition??100)<60||renewalKeys.has(key(b.x,b.y))){const active=renewalKeys.has(key(b.x,b.y)),frame=active?'#d69a4e':'#9e9c88';for(const x of [-.98,.98])for(const z of [-.91,.91])box(g,.065,3.1,.065,frame,x,1.55,z,{cast:false});for(const y of [.55,1.65,2.75]){box(g,2.04,.055,.055,frame,0,y,.93,{cast:false});box(g,.055,.055,1.96,frame,.98,y,0,{cast:false})}for(const y of [.9,2.05])box(g,.055,1.1,.055,frame,0,y,.95,{cast:false});if(active)box(g,.28,.28,.055,'#edbd63',.81,2.94,.97,{cast:false})}if((b.backupCapacityKw||0)>0){box(g,.42,.24,.34,'#56656a',.68,.15,.66);box(g,.18,.06,.36,(b.backupFuelKwh||0)>0?'#e0a342':'#b64d48',.68,.3,.66);box(g,.045,.16,.045,'#343e41',.77,.4,.66)} }
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
  function makeVehicle(color){const g=new THREE.Group();box(g,.39,.16,.68,color,0,.22,0,{cast:true});box(g,.32,.18,.37,'#b9d6da',0,.39,-.04);box(g,.32,.035,.02,'#5a7078',0,.48,.13);for(const x of [-.22,.22]){for(const z of [-.23,.23]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.055,18),mat('#263c42'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.13,z);g.add(wheel);cylinder(g,.035,.035,.061,'#a6b4ac',x*1.12,.13,z,12)}box(g,.085,.05,.02,'#fff2c3',x,.25,.35);box(g,.08,.045,.02,'#d06f61',x,.25,-.35);box(g,.045,.05,.07,'#718f95',x*1.01,.41,.13)}box(g,.29,.025,.035,'#344d55',0,.21,.355);trafficRoot.add(g);return g}
  function makeDeliveryTruck(color='#c78c50',role=null,id=null){const g=new THREE.Group();box(g,.38,.2,.7,color,0,.27,-.08);box(g,.3,.22,.28,'#c9e4e3',0,.3,.36);box(g,.4,.035,.72,'#e5d2aa',0,.39,-.08);for(const x of [-.23,.23])for(const z of [-.28,.32])box(g,.075,.12,.13,'#303f43',x,.13,z);if(role){g.userData.emergencyRole=role;g.userData.emergencyId=id}trafficRoot.add(g);return g}
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
    const add=(role,mesh,route,description,id,{idle=false,side=0}={})=>{
      mesh.userData.emergencyRole=role;mesh.userData.emergencyId=id;
      if(idle||!route?.length){
        const pos=route?.[0]||tilePos(4,10);
        mesh.position.set(pos[0]+side,0,pos[1]+.18);
        return;
      }
      routeActors.push({mesh,route,offset:0,speed:1.3,side,emergencyRole:role,
        selection:{type:role,title:description.title,description:description.description,
        metrics:description.metrics||[]}});
    };
    const recentPolice=(state.policeReport?.recentIncidents||[]).filter(x=>x.status==='atendido'
      &&Number.isInteger(x.day)&&state.day-x.day>=0&&state.day-x.day<=2&&x.route?.length>1);
    for(const unit of state.policeReport?.units||[]){
      const origin=[unit.x,unit.y],dispatched=recentPolice.filter(x=>x.stationX===unit.x&&x.stationY===unit.y);
      for(let i=0;i<Math.min(3,unit.vehicles||0);i++){
        const incident=i<unit.activeVehicles?dispatched[i]:null;
        const trip=incident?serviceRoadPath(origin,[incident.x,incident.y],openRoads):null;
        const path=trip||(i<unit.activeVehicles?patrolPath(origin,unit.priority,openRoads,state):null);
        const idle=!path||i>=unit.activeVehicles;
        const title=incident&&trip?`Patrulla · intervención en ${incident.location}`:`Patrulla ${i+1} · ${unit.name}`;
        add('Policía',makePoliceCar(),path,{title,description:incident&&trip?
          'Recorrido de un incidente registrado, reproducido en 3D por las calles de la ciudad.':'Patrullaje de prevención con móvil equipado, personal y calles habilitadas.',
          metrics:[['Dotación',unit.staff+' trabajadores'],['Prioridad',unit.priority],
            ['Estado',idle?'Estacionado':incident&&trip?'Intervención reciente':'Patrullando']]},
          `pol-${unit.x}-${unit.y}-${i}`,{idle,side:(i-1)*.16});
        if(idle){const a=serviceRoadPath(origin,[4,10],openRoads);const p=a?.[0]||tilePos(unit.x,unit.y);const m=trafficRoot.children.at(-1);m.position.set(p[0]+(i-1)*.42,0,p[1]+.18)}
      }
    }
    const recentFire=(state.fireReport?.recentIncidents||[]).filter(x=>x.status==='controlado'
      &&Number.isInteger(x.resolvedDay)&&state.day-x.resolvedDay>=0&&state.day-x.resolvedDay<=2&&x.route?.length>1);
    for(const unit of state.fireReport?.stations||[]){
      const incident=recentFire.find(x=>x.stationX===unit.x&&x.stationY===unit.y);
      const trip=incident?serviceRoadPath([unit.x,unit.y],[incident.x,incident.y],openRoads):null;
      const active=unit.firefighters>=4&&unit.readyDay<=state.day;
      const path=trip||(!active?null:patrolPath([unit.x,unit.y],'mixto',openRoads,state));
      const idle=!path||(!trip&&!active);
      const m=makeFireEngine();
      add('Bomberos',m,path,{title:incident&&trip?`Bomberos · ${incident.name}`:`Autobomba · ${unit.name}`,
        description:incident&&trip?'Recorrido de una respuesta real registrada; el cuartel vuelve a estar disponible al cumplir su turno.':
          'Vehículo del cuartel sujeto a personal, calles y disponibilidad de dotación.',
        metrics:[['Bomberos',unit.firefighters],['Estado',idle?'En cuartel':incident&&trip?'Respuesta reciente':'Disponible']]},
        `fire-${unit.x}-${unit.y}`,{idle,side:-.2});
      if(idle){const road=serviceRoadPath([unit.x,unit.y],[4,10],openRoads);const p=road?.[0]||tilePos(unit.x,unit.y);m.position.set(p[0]-.2,0,p[1]+.13)}
    }
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
          `amb-${unit.x}-${unit.y}-${i}`,{idle,side:i*.24});
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
  function sync(state,chosen,nextView){view=nextView;renderer.shadowMap.enabled=!smallScreen&&!view.preview;if(document.getElementById('panelPopup')?.classList.contains('hidden')===false){visualSignature='';return}updateCamera();const signature=JSON.stringify([state.day,state.roads,state.buildings,state.projects,state.adaptiveReuseWorks,state.urbanRenewalWorks,state.urbanRenewalNeeds,state.abandoned,state.zones,state.jobs,state.population,state.supply?.orders,state.supply?.portOrders,state.supply?.portVoyages,state.commutes,state.busRoutes,state.utilities?.powerLines,state.utilities?.waterPipes,state.utilities?.sewerLines,state.utilities?.drainLines,state.utilities?.gasLines,state.utilities?.telecomLines,state.utilities?.report?.failures,state.roadAssets?.filter(a=>(a.quality??82)<25),state.utilities?.report?.drainage?.floodedTiles,state.waste?.containers,state.waste?.routes,state.waste?.report?.litterTiles,state.waste?.report?.activeTrucks,state.waste?.report?.recycledTonsDay,state.waste?.report?.transferStoredTons,state.policeReport,state.fireReport?.recentIncidents,state.fireReport?.stations,state.healthReport?.hospital?.hospitals,state.healthReport?.hospital?.ambulanceDispatches,view.utilityLayer,view.trafficOverlay,view.servicePreview,view.zoom>=1.4,view.preview,chosen?.x,chosen?.y]);if(signature===visualSignature){renderer.render(scene,camera);return}visualSignature=signature;clear(dynamicRoot);clear(trafficRoot);routeActors.length=0;fireVisuals.length=0;signalBulbs.length=0;signalTiles.clear();const roads=new Set(state.roads.map(r=>key(r[0],r[1]))),closedRoads=new Set((state.roadAssets||[]).filter(a=>(a.quality??82)<25).map(a=>key(a.x,a.y))),openRoads=new Set([...roads].filter(k=>!closedRoads.has(k))),occupied=new Set([...roads,...state.buildings.map(b=>key(b.x,b.y)),...state.projects.map(p=>key(p.x,p.y)),...(state.adaptiveReuseWorks||[]).map(w=>key(w.x,w.y)),...(state.abandoned||[]).map(a=>key(a.x,a.y))]);for(const t of treeSpots)t.mesh.visible=!occupied.has(key(t.x,t.y));
    const roadStress=new Map();for(const trip of state.commutes||[]){if(trip.mode==='walk')continue;const load=(trip.vehicles||0)*(trip.reason==='regreso'?.45:1)+(trip.mode==='bus'?2:0);for(const [x,y] of trip.route||[])roadStress.set(key(x,y),(roadStress.get(key(x,y))||0)+load)}for(const line of state.busRoutes||[]){if(!line.operational)continue;for(const [x,y] of line.route||[])roadStress.set(key(x,y),(roadStress.get(key(x,y))||0)+(line.effectiveBuses||0)*2)}for(const order of state.supply?.orders||[]){if(order.status!=='en tránsito')continue;for(const [x,y] of order.route||[])roadStress.set(key(x,y),(roadStress.get(key(x,y))||0)+2)}const maxStress=Math.max(8,...roadStress.values());for(const [x,y] of state.roads){const neighbors=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>roads.has(key(x+dx,y+dy)));addRoad(dynamicRoot,x,y,roads,(roadStress.get(key(x,y))||0)/maxStress,neighbors.length>=3);if(neighbors.length>=3)signalTiles.add(key(x,y))}for(const a of (state.roadAssets||[]).filter(a=>(a.quality??82)<25)){const [cx,cz]=tilePos(a.x,a.y);box(dynamicRoot,1.48,.24,.2,'#fbefe4',cx,.3,cz,{cast:true});for(const dx of [-.55,-.27,0,.27,.55]){const stripe=box(dynamicRoot,.16,.25,.22,dx===0?'#ed8e53':'#cd5c59',cx+dx,.3,cz,{cast:false});stripe.rotation.z=-.2}for(const dx of [-.57,.57]){box(dynamicRoot,.085,.42,.085,'#777783',cx+dx,.23,cz);cylinder(dynamicRoot,.12,.12,.065,'#e69a4f',cx+dx,.51,cz,9)} }
    if(view.utilityLayer){const networkKey={power:'powerLines',water:'waterPipes',sewer:'sewerLines',drainage:'drainLines',gas:'gasLines',telecom:'telecomLines'}[view.utilityLayer],points=state.utilities?.[networkKey]||[],set=new Set(points.map(([x,y])=>key(x,y))),color={power:'#f0bd4e',water:'#42a9c2',sewer:'#a88bd3',drainage:'#4e9eb9',gas:'#e28b43',telecom:'#a458d4'}[view.utilityLayer];for(const [x,y] of points){const [cx,cz]=tilePos(x,y);for(const [dx,dy] of [[1,0],[0,1]])if(set.has(key(x+dx,y+dy))){const [nx,nz]=tilePos(x+dx,y+dy);line(dynamicRoot,[[cx,.16,cz],[nx,.16,nz]],color,.9)}sphere(dynamicRoot,.07,color,cx,.19,cz,1)}for(const f of (state.utilities?.report?.failures||[]).filter(f=>f.network===view.utilityLayer)){const [fx,fz]=tilePos(f.x,f.y);sphere(dynamicRoot,.16,'#d84e4e',fx,.25,fz,1)}if(view.utilityLayer==='drainage')for(const [x,y] of state.utilities?.report?.drainage?.floodedTiles||[]){const [cx,cz]=tilePos(x,y);plane(dynamicRoot,1.18,1.18,mat('#52a9c2',{transparent:true,opacity:.44,depthWrite:false}),cx,.105,cz)}}
    for(const busLine of (state.busRoutes||[]).filter(r=>r.operational&&r.route?.length>1))for(let i=1;i<busLine.route.length;i++){
      const [ax,ay]=busLine.route[i-1],[bx,by]=busLine.route[i];if(!openRoads.has(key(ax,ay))||!openRoads.has(key(bx,by))||Math.abs(ax-bx)+Math.abs(ay-by)!==1)continue;
      const [px,pz]=tilePos((ax+bx)/2,(ay+by)/2);box(dynamicRoot,ax!==bx?1.7:.085,.009,ay!==by?1.7:.085,'#67d3b8',px,.089,pz,{cast:false});
    }
    for(const c of state.waste?.containers||[]){const [cx,cz]=tilePos(c.x,c.y),fill=(c.storedTons||0)/Math.max(.15,c.capacityTons||2);const bin=new THREE.Group();bin.position.set(cx+.56,.09,cz+.45);box(bin,.34,.48,.3,'#547e70',0,.24,0,{cast:true});box(bin,.36,.055,.32,'#354f48',0,.5,0);box(bin,.22,.035,.2,fill>.75?'#d28b50':fill>.4?'#c0a45c':'#b4c99c',0,.53,0);for(const dx of [-.11,.11])cylinder(bin,.045,.045,.05,'#253b39',dx,.035,.13,10);dynamicRoot.add(bin)}
    for(const tile of state.waste?.report?.litterTiles||[]){if(!Array.isArray(tile)||tile.length<2||!Number.isFinite(tile[0])||!Number.isFinite(tile[1]))continue;const [x,y]=tile,[cx,cz]=tilePos(x,y);for(const [dx,dz,color] of [[-.24,-.12,'#647c66'],[.2,.1,'#9a8871'],[.02,-.27,'#536e66']]){const body=new THREE.Mesh(new THREE.IcosahedronGeometry(.17,1),mat(color));body.scale.set(1,.85,.8);body.position.set(cx+dx,.2,cz+dz);dynamicRoot.add(body);cylinder(dynamicRoot,.037,.055,.085,'#dfd5bf',cx+dx,.37,cz+dz,8);box(dynamicRoot,.1,.018,.065,'#e8e2d2',cx+dx+.04,.28,cz+dz+.04,{cast:false})}}
    showServiceCoverage(state,chosen,view,openRoads);
    for(const z of state.zones||[])addZone(dynamicRoot,z);
    const renewalKeys=new Set((state.urbanRenewalWorks||[]).map(w=>key(w.x,w.y)));for(const b of state.buildings)addBuilding(dynamicRoot,b,roads,renewalKeys);
    for(const incident of state.fireReport?.activeIncidents||[]){if(!incident||!Number.isInteger(incident.x)||!Number.isInteger(incident.y))continue;const [fx,fz]=tilePos(incident.x,incident.y),outer=new THREE.Mesh(new THREE.ConeGeometry(.27,.78,7),mat('#e45e36')),inner=new THREE.Mesh(new THREE.ConeGeometry(.15,.48,7),mat('#f2c15f'));outer.position.set(fx,.58,fz);inner.position.set(fx,.45,fz);dynamicRoot.add(outer,inner);const smoke1=sphere(dynamicRoot,.16,'#777777',fx-.15,1.08,fz-.08,1),smoke2=sphere(dynamicRoot,.12,'#a19896',fx+.16,.96,fz+.11,1);fireVisuals.push({outer,inner,smoke1,smoke2,seed:fx+fz});}
    for(const a of state.abandoned||[])addSite(dynamicRoot,a,true);
    for(const p of state.projects)addSite(dynamicRoot,p,false);for(const w of state.adaptiveReuseWorks||[])addSite(dynamicRoot,w,false);
    addSelection(dynamicRoot,chosen);
    const route=buildRoute(openRoads);if(route.length>1){const commuteRoutes=(state.commutes||[]).filter(t=>t.reason==='trabajo').slice().sort((a,b)=>b.workers-a.workers).slice(0,12);for(let i=0;i<commuteRoutes.length;i++){const trip=commuteRoutes[i],path=trip.route.map(([x,y])=>tilePos(x,y));if(path.length>1&&trip.mode!=='bus')routeActors.push({mesh:trip.mode==='walk'?makeWalker(['#476d83','#b46f62','#d3a05a'][i%3]):makeVehicle(['#d89368','#f1d493','#75ada8','#c66d63'][i%4]),route:path,offset:i*3.7,speed:(trip.mode==='walk'?.5:1.55)/Math.max(1,trip.trafficFactor||1),side:trip.mode==='walk'?(i%2?.83:-.83):(i%2?.23:-.23),selection:tripSelection(trip,trip.mode==='walk'?'Peatones':'Vehículo particular')})}const nonworkRoutes=(state.commutes||[]).filter(t=>['compras','servicios'].includes(t.reason)).slice(0,8);for(let i=0;i<nonworkRoutes.length;i++){const trip=nonworkRoutes[i],path=trip.route.map(([x,y])=>tilePos(x,y)),service=trip.reason==='servicios';if(path.length>1)routeActors.push({mesh:trip.mode==='walk'?makeWalker(service?['#8c83bd','#6f93ae','#9e779d'][i%3]:['#e3bd73','#b88158','#8a9c66'][i%3]):makeVehicle(service?['#8c83bd','#6f93ae','#9e779d'][i%3]:['#e2a54d','#d37e53','#75a6a1'][i%3]),route:trip.roundTrip?[...path,...path.slice(0,-1).reverse()]:path,offset:i*2.9,speed:trip.mode==='walk'?.43:1.25,side:trip.mode==='walk'?(i%2?.72:-.72):(i%2?.3:-.3),selection:tripSelection(trip,trip.mode==='walk'?'Peatones':'Vehículo particular')})}for(const line of (state.busRoutes||[]).filter(b=>b.operational&&b.route?.length>1))for(let i=0;i<Math.min(line.effectiveBuses||0,3);i++){const path=line.route.map(([x,y])=>tilePos(x,y)),drivers=(line.driverIds||[]).map(id=>{for(const h of state.buildings||[])for(const p of h.residents||[])if(p.id===id)return{id,name:p.name||`Vecino #${String(id).slice(-5)}`,age:p.age,status:'Conductor/a',employerName:p.employerName,monthlyWage:p.monthlyWage,home:[h.x,h.y]};return{id,name:`Conductor #${String(id).slice(-5)}`,status:'Conductor/a'}});routeActors.push({mesh:makeBus(),route:path,offset:i*7.4,speed:1.15,side:0,selection:{type:'Colectivo municipal',title:`${line.originName||'Línea'} → ${line.destinationName||'corredor'} · unidad ${i+1}`,description:'Vehículo asignado a una línea real con turnos y capacidad por sentido.',metrics:[['Pasajeros del último turno',line.ridersThisPass||0],['Capacidad',`${line.capacity||0} asientos`],['Conductores',drivers.length],['Frecuencia',`${line.headwayMinutes||0} min`],['Paradas',(line.stops||[]).length],['Pasaje del último mes',`$${line.monthlyFareRevenue||0}`]],people:drivers}})}const wasteRoutes=(state.waste?.routes||[]).filter(r=>r.reachable&&r.path?.length>1);if(wasteRoutes.length){for(let i=0;i<Math.min(4,wasteRoutes.length);i++)routeActors.push({mesh:makeGarbageTruck(),route:wasteRoutes[i].path.map(([x,y])=>tilePos(x,y)),offset:i*4.2,speed:.72,side:i%2?.18:-.18,selection:{type:'Camión municipal',title:wasteRoutes[i].name||`Ruta de recolección ${i+1}`,description:'Recorrido de recolección conectado a su depósito o instalación de descarga.',metrics:[['Contenedores',wasteRoutes[i].containers?.length||0],['Carga del recorrido',`${wasteRoutes[i].payloadTons||0} t`],['Destino',wasteRoutes[i].destination||'Sin destino'],['Distancia',`${wasteRoutes[i].distanceTiles||0} cuadras`]]}})}else for(let i=0;i<Math.min(4,state.waste?.report?.activeTrucks||0);i++)routeActors.push({mesh:makeGarbageTruck(),route,offset:i*15.3,speed:.72,side:i%2?.18:-.18});const ambientResidents=(state.buildings||[]).filter(b=>b.kind==='home').flatMap(h=>(h.residents||[]).map(p=>({home:h,person:p}))).filter(x=>x.person.status==='empleado'||x.person.status==='buscando');for(let i=0;i<Math.min(6,Math.round(state.population/120),ambientResidents.length);i++){const {home,person}=ambientResidents[(i*17)%ambientResidents.length],id=String(person.id||`${home.x}-${home.y}-${i}`),profile={id,name:person.name||`Vecino #${id.slice(-5)}`,age:person.age,status:person.status==='empleado'?'Residente en paseo':'Busca empleo',employerName:person.employerName,monthlyWage:person.monthlyWage,home:[home.x,home.y]};routeActors.push({mesh:makeWalker(['#476d83','#b46f62','#d3a05a'][i%3]),route,offset:i*5.4,speed:.5+i*.04,side:i%2?.83:-.83,selection:{type:'Residente',title:profile.name,description:'Habitante representativo que circula por la red de calles de la ciudad.',metrics:[['Situación laboral',profile.employerName||profile.status],['Ingreso mensual',`$${profile.monthlyWage||0}`],['Hogar',`${home.x+1}, ${home.y+1}`]],people:[profile]}})}}
    for(const order of (state.supply?.orders||[]).filter(o=>['en tránsito','esperando equipo','descargando'].includes(o.status)&&o.route?.length>1)){const path=order.route.map(([x,y])=>tilePos(x,y));routeActors.push({mesh:makeVehicle(order.supplier==='Flete Urgente'?'#e08b52':'#d8b56d'),route:path,deliveryProgress:['esperando equipo','descargando'].includes(order.status)?1:(order.routeProgress??order.progress??0),side:0,selection:{type:'Camión de materiales',title:`${order.supplier} · ${order.label||'Pedido de obra'}`,description:order.statusCause||'Carga contratada por una constructora.',metrics:[['Estado',order.status],['Obra',order.label||'Pedido'],['Materiales',Object.entries(order.items||{}).map(([k,v])=>`${k} ${v}`).join(' · ')||'Carga en traslado'],['Destino',order.destinationLabel||'Patio de constructoras'],['Entrega estimada',order.arrivalDay?`día ${order.arrivalDay}`:'en ruta']]}});if(order.status==='descargando'){const depot=(state.supply.depots||[]).find(d=>d.id===order.destinationId),dest=depot?[depot.x,depot.y]:[4,10],offsets=[[-.42,.04],[.42,-.04],[0,.42]],center=tilePos(dest[0],dest[1]),lift=makeForklift();lift.position.set(center[0]+.62,.01,center[1]+.3);lift.rotation.y=-Math.PI/4;for(let i=0;i<(order.unloadWorkers||0);i++){const worker=makeWalker(i?'#526d82':'#b8745b');worker.position.set(center[0]-.52+i*.16,0,center[1]+.25)}offsets.forEach(([dx,dz],i)=>{const progress=clamp((order.unloadProgress||0)*3-i,0,1),from=tilePos(dest[0],dest[1]),to=tilePos(dest[0]+dx,dest[1]+dz);routeActors.push({mesh:makeCargo(['#c89958','#769784','#bb765d'][i]),route:[from,to],deliveryProgress:progress,side:0})})}}
    spawnEmergencyActors(state,openRoads);
    for(const failure of state.utilities?.report?.failures||[]){const route=failure.responseRoute;if(!Array.isArray(route)||route.length<2)continue;const active=failure.status==='en reparación',recent=failure.status==='reparada'&&(state.day||0)-(failure.completedDay||0)<=1;if(!active&&!recent)continue;const path=route.map(([x,y])=>tilePos(x,y)),duration=Math.max(1,failure.responseDurationDays||3);routeActors.push({mesh:makeDeliveryTruck(failure.responseKind==='emergencia'?'#d94d4d':'#c78951','Cuadrilla de servicios',failure.id),route:path,...(recent?{deliveryProgress:1}:{offset:0,speed:1.3}),side:-.2,selection:{type:'Cuadrilla de servicios',title:`${failure.responseKind==='emergencia'?'Respuesta urgente':'Reparación de red'} · ${failure.network}`,description:failure.status==='reparada'?'La unidad terminó el trabajo y el servicio fue restablecido.':`Cuadrilla en camino a la avería de la calle ${failure.x+1}, ${failure.y+1}.`,metrics:[['Estado',failure.status],['Red',failure.network],['Avería',`${failure.x+1}, ${failure.y+1}`],['Plazo',`${failure.remainingDays||0} día(s)`],['Costo',`$${failure.responseKind==='emergencia'?failure.repairCost*2:failure.repairCost}`]]}})}
    for(const order of (state.supply?.marketOrders||[]).filter(o=>o.status==='en tránsito'&&o.route?.length>1)){
      const path=order.route.map(([x,y])=>tilePos(x,y)),distance=Math.max(1,path.length-1),start=order.supplierReadyDay??order.orderedDay??state.day,arrival=Math.max(start+1,order.arrivalDay||start+2),timeline=clamp(((state.day||start)-start)/(arrival-start),0,.98),travelled=Math.min(.98,(order.travelledDistance||0)/distance),progress=Math.max(timeline,travelled),grain=order.type==='industrial_raw',cargo=grain?'Grano':'Insumos comerciales';
      routeActors.push({mesh:makeDeliveryTruck(grain?'#c69742':'#c98155'),route:path,deliveryProgress:progress,side:.13,selection:{type:'Camión regional',title:cargo+' · '+(order.quantity||0)+' unidades',description:order.statusCause||'Carga comprada por una empresa y trasladada por calles conectadas.',metrics:[['Empresa',order.businessName||'Comercio local'],['Origen',order.supplier||'Proveedor regional'],['Destino',grain?'Procesadora industrial':'Comercio'],['Ruta',distance+' tramos'],['Llegada prevista','día '+(order.arrivalDay||arrival)]]}})
    }
    for(const order of (state.supply?.portOrders||[]).filter(o=>o.status==='en tránsito'&&o.route?.length>1)){const path=order.route.map(([x,y])=>tilePos(x,y));routeActors.push({mesh:makeVehicle('#dba04e'),route:path,deliveryProgress:Math.min(1,(order.travelledDistance||0)/Math.max(1,path.length-1)),side:.08,selection:{type:'Camión de carga',title:`${order.businessName||'Comercio'} → terminal portuaria`,description:'Exportación asignada al puerto y trasladada por calles conectadas.',metrics:[['Estado',order.status],['Carga',`${order.quantity||0} unidades`],['Distancia',`${order.route?.length||0} tramos`],['Salida',`día ${order.orderedDay||0}`]]}})}
    for(const airport of (state.airports||[]).filter(a=>a.operational&&a.monthlyFlights>0)){const route=[[airport.x,airport.y],[airport.x-1,airport.y-1],[airport.x-4,airport.y-3],[airport.x-8,airport.y-3]].map(([x,y])=>tilePos(x,y));routeActors.push({mesh:makePlane(),route,offset:0,speed:.7,side:0,height:4.6,selection:{type:'Avión de pasajeros',title:'Vuelo regional',description:'Aeronave conectada a la operación del aeropuerto local.',metrics:[['Pasajeros del mes',airport.monthlyPassengers||0],['Vuelos',airport.monthlyFlights||0],['Capacidad terminal',`${airport.passengerCapacity||800} personas`],['Estado',airport.pauseReason||'Ruta en servicio']]}})}
    for(const voyage of (state.supply?.portVoyages||[]).filter(v=>v.status==='en ruta'&&v.route?.length>1)){const path=voyage.route.map(([x,y])=>tilePos(x,y)),duration=Math.max(1,voyage.arrivalDay-voyage.departureDay),progress=Math.min(.99,Math.max(0,((state.day||voyage.departureDay)-voyage.departureDay)/duration));routeActors.push({mesh:makeShip(),route:path,deliveryProgress:progress,side:0,selection:{type:'Buque mercante',title:`Buque · ${voyage.quantity||0} unidades`,description:'Viaje marítimo con fecha y estado persistentes.',metrics:[['Estado',voyage.status],['Carga',`${voyage.quantity||0} unidades`],['Salida',`día ${voyage.departureDay||0}`],['Arribo previsto',`día ${voyage.arrivalDay||0}`]]}})}
    renderer.render(scene,camera);
  }
  function animate(now){requestAnimationFrame(animate);if(document.getElementById('panelPopup')?.classList.contains('hidden')===false)return;if(now-lastFrame<frameInterval)return;const renderStart=performance.now();const frameDelta=Math.min(.15,(now-lastFrame)/1000);lastFrame=now;resize();const signalPhase=Math.floor(now/5000)%2;for(const signal of signalBulbs)signal.mesh.material=mat(signal.axis===signalPhase?'#7ed494':'#df6c5b');for(const a of routeActors){const count=a.route.length-1,total=count*TILE;let distance,direction=1;if(a.deliveryProgress!==undefined)distance=clamp(total*a.deliveryProgress,0,total-.01);else{const travel=((now/1000*a.speed+a.offset)%(2*total)+2*total)%(2*total);distance=travel>total?2*total-travel:travel;direction=travel>total?-1:1}const index=Math.min(count-1,Math.floor(distance/TILE)),f=(distance-index*TILE)/TILE,p=a.route[index],q=a.route[index+1],dx=q[0]-p[0],dz=q[1]-p[1];if(a.deliveryProgress===undefined&&a.selection?.type!=='Peatones'&&a.selection?.type!=='Residente'&&f>.72&&signalTiles.has(key(Math.round(q[0]/TILE-.5),Math.round(q[1]/TILE-.5)))){const axis=Math.abs(dx)>Math.abs(dz)?0:1;if(axis!==signalPhase)a.offset-=frameDelta*a.speed}{const isWalker=a.selection?.type==='Peatones'||a.selection?.type==='Residente',lane=Math.abs(a.side||.18)*direction;const side=isWalker?a.side:-lane,turn=f>.75&&index<count-1?(f-.75)/.25:0,next=a.route[Math.min(count,index+2)],ndx=next[0]-q[0],ndz=next[1]-q[1],bend=turn&&Math.abs(ndx*dz-ndz*dx)>0?turn*turn*(3-2*turn)*.16:0;const targetX=p[0]+dx*f+dz/TILE*side+ndx/TILE*bend,targetZ=p[1]+dz*f-dx/TILE*side+ndz/TILE*bend;a.mesh.position.set(targetX,a.height||0,targetZ);const angle=Math.atan2(dx*direction+ndx/TILE*bend,dz*direction+ndz/TILE*bend),delta=Math.atan2(Math.sin(angle-a.mesh.rotation.y),Math.cos(angle-a.mesh.rotation.y));a.mesh.rotation.y+=delta*.22}}for(const f of fireVisuals){const t=now*.004+f.seed;f.outer.scale.y=.84+.2*Math.sin(t);f.inner.scale.y=.88+.14*Math.sin(t+1);f.smoke1.position.y=1.08+.1*Math.sin(t*.8);f.smoke2.position.y=.96+.12*Math.sin(t*.7+1)}for(let i=0;i<waves.length;i++)waves[i].material.opacity=.23+.11*Math.sin(now*.0014+i);renderer.render(scene,camera);frameInterval=Math.max(33,Math.min(700,(performance.now()-renderStart)*2.3))}requestAnimationFrame(animate);
  function projectTile(x,y,height=2.5){
    updateCamera();
    const projected=new THREE.Vector3((x+.5)*TILE,height,(y+.5)*TILE).project(camera);
    const width=canvas.clientWidth,heightPixels=canvas.clientHeight;
    const visible=projected.z>=-1&&projected.z<=1&&projected.x>-.96&&projected.x<.96&&projected.y>-.95&&projected.y<.96;
    return {x:(projected.x+1)*width/2,y:(1-projected.y)*heightPixels/2,visible};
  }
  function screenToTile(px,py){updateCamera();const w=canvas.clientWidth,h=canvas.clientHeight;raycaster.setFromCamera(new THREE.Vector2(px/w*2-1,1-py/h*2),camera);if(!raycaster.ray.intersectPlane(groundPlane,hit))return [-1,-1];return [Math.floor(hit.x/TILE),Math.floor(hit.z/TILE)]}
  function screenToActor(px,py){updateCamera();const w=canvas.clientWidth,h=canvas.clientHeight,candidates=[];for(const actor of routeActors){if(!actor.selection)continue;const point=actor.mesh.position.clone().project(camera);if(point.z<-1||point.z>1)continue;const sx=(point.x+1)*w/2,sy=(1-point.y)*h/2,d=Math.hypot(sx-px,sy-py),limit=smallScreen?26:20;if(d<=limit)candidates.push({actor,d,z:point.z})}candidates.sort((a,b)=>a.d-b.d||a.z-b.z);return candidates[0]?.actor.selection||null}
  function setView(nextView){view=nextView;updateCamera();renderer.render(scene,camera)}
  window.addEventListener('resize',updateCamera);
  return {sync,screenToTile,screenToActor,setView,projectTile,
    getCoverageTiles:()=>dynamicRoot.children.filter(m=>m.userData.serviceCoverage).map(m=>({x:m.position.x,z:m.position.z,radius:m.userData.serviceRadius})),
    getEmergencyActors:()=>trafficRoot.children.filter(m=>m.userData.emergencyRole).map(m=>({
      type:m.userData.emergencyRole,id:m.userData.emergencyId,visible:m.visible,
      inScene:m.parent===trafficRoot,position:[m.position.x,m.position.z],
      moving:routeActors.some(a=>a.mesh===m),routeLength:routeActors.find(a=>a.mesh===m)?.route.length||0
    }))};
}
