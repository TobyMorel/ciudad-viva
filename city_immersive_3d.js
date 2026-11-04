import {immersiveCityPlan,immersiveSignature} from './city_immersive_state.js';

// Alfa 0.265: puramente visual, crea objetos 3D según los datos que YA existen.
export function createCityImmersive3D({THREE,scene,camera,canvas,box,sphere,cylinder,mat,tilePos,clear}){
 const root=new THREE.Group();root.name='Ciudad Viva · La ciudad respira';
 scene.add(root);
 const layers={buses:new THREE.Group(),commerce:new THREE.Group(),coast:new THREE.Group(),animals:new THREE.Group(),
  schools:new THREE.Group(),repairs:new THREE.Group(),emergency:new THREE.Group(),weather:new THREE.Group(),surprises:new THREE.Group()};
 for(const [k,l] of Object.entries(layers)){l.name='Escenografía '+k;root.add(l)}
 let plan=null,signature='',clock=0,state=null,builds=0,boardingNow=0;
 const figures=[],animals=[],wings=[],boats=[],waves=[],forklifts=[],doors=[],smoke=[],cranes=[],waterDrops=[],props=[],
  umbrellas=[],busStops=[],schoolFigures=[],inspectables=[],vanActors=[];
 const skin=['#d4a27e','#ad735b','#efc9a0','#946a50'],clothes=['#668b9b','#aa7d9b','#b88b5f','#71997e','#c77867'];
 const N=x=>Number.isFinite(Number(x))?Number(x):0;
 const rnd=x=>{let a=(Math.trunc(x)||0)>>>0;a=Math.imul(a^a>>>16,0x7feb352d);a=Math.imul(a^a>>>15,0x846ca68b);return ((a^a>>>16)>>>0)/4294967296};
 const place=(parent,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g};
 const point=(x,y)=>tilePos(x,y);
 const emissive=mat('#f5dfa6',{emissive:'#ffca71',emissiveIntensity:1.05});
 function custom(parent,geo,material,x,y,z){const a=new THREE.Mesh(geo,material);a.position.set(x,y,z);parent.add(a);return a}
 function disk(parent,r,color,x,y,z,opacity=1){
  const a=custom(parent,new THREE.CircleGeometry(r,24),new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false,side:THREE.DoubleSide}),x,y,z);
  a.rotation.x=-Math.PI/2;return a;
 }
 function pipe(parent,path,color='#ad9071',radius=.022){
  return custom(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path.map(p=>new THREE.Vector3(...p))),25,radius,7,false),mat(color),0,0,0);
 }
 function person(parent,x,z,seed,{role='civil',child=false,umbrella=true}={}){
  const g=place(parent,x,.085,z);if(child)g.scale.setScalar(.76);
  const color=role==='fire'?'#d9b85a':role==='medic'?'#e8f0ef':role==='school'?'#658aaf':role==='crew'?'#e1af56':clothes[Math.floor(rnd(seed)*clothes.length)];
  const arms=[],legs=[];
  for(const side of [-1,1]){
   const a=place(g,side*.137,.47,0);box(a,.075,.2,.08,color,0,-.10,0);arms.push(a);
   const l=place(g,side*.06,.23,0);box(l,.082,.2,.10,'#4e5e67',0,-.1,0);box(l,.10,.046,.14,'#35444c',0,-.21,.018);legs.push(l);
  }
  box(g,.25,.28,.185,color,0,.39,0);
  const face=skin[Math.floor(rnd(seed+11)*skin.length)];
  sphere(g,.116,face,0,.655,0,1);
  const hair=sphere(g,.118,['#4b3a32','#675c49','#364549'][Math.floor(rnd(seed+23)*3)],0,.719,-.02,1);hair.scale.y=.47;
  if(role==='fire'||role==='crew'){
   cylinder(g,.146,.148,.085,role==='fire'?'#d4b552':'#ecc36a',0,.771,0,12);
   box(g,.22,.039,.19,'#f7e9b5',0,.35,.09);
  }
  if(role==='school')box(g,.18,.29,.1,'#b47762',0,.42,-.15);
  if(role==='medic')box(g,.10,.025,.20,'#c24f4e',0,.47,.10);
  if(umbrella){
   const u=place(g,.17,0,.12);
   cylinder(u,.012,.012,.82,'#788887',0,.71,0,8);
   const shade=sphere(u,.345,['#e9bd64','#d8788b','#76bbc0'][Math.floor(rnd(seed+31)*3)],0,1.11,0,2);
   shade.scale.y=.38;
   u.visible=false;umbrellas.push({obj:u,host:g});
  }
  const f={g,arms,legs,seed,role};
  figures.push(f);return f;
 }
 function crate(g,x,y,z,color='#ba9566'){
  box(g,.28,.22,.27,color,x,y,z);
  for(const sx of [-.09,.09])box(g,.026,.25,.28,'#e4cf9d',x+sx,y,z);
  box(g,.29,.025,.28,'#715b46',x,y+.112,z);
 }
 function pallet(g,x,z,count=4){
  const p=place(g,x,.08,z);
  for(const sx of [-.17,.17])box(p,.1,.07,.57,'#81634b',sx,.04,0);
  box(p,.45,.04,.55,'#c29d68',0,.1,0);
  for(let i=0;i<count;i++)crate(p,(i%2-.5)*.23,.25+Math.floor(i/2)*.235,(i%3-1)*.12);
  return p;
 }
 function forklift(g,x,z,seed){
  const f=place(g,x,.085,z);
  box(f,.50,.24,.56,'#e7ab4e',0,.25,0);
  box(f,.34,.23,.28,'#a8c9c1',0,.46,-.10);
  for(const sx of [-.26,.26])for(const zz of [-.23,.23]){const wheel=cylinder(f,.095,.095,.065,'#313d40',sx,.15,zz,12);wheel.rotation.z=Math.PI/2}
  for(const sx of [-.17,.17])box(f,.049,.76,.06,'#687b7b',sx,.48,.37);
  box(f,.36,.05,.44,'#7e8f86',0,.12,.56);
  const load=crate(f,0,.27,.60,'#bfa278');
  forklifts.push({g:f,load,seed,x,z});return f;
 }
 function van(parent,x,z,seed,color='#7194a0'){
  const v=place(parent,x,.09,z);
  box(v,.52,.22,.94,color,0,.24,0);
  box(v,.50,.36,.59,'#c8d9d0',0,.5,-.16);
  box(v,.52,.29,.26,color,0,.43,.35);
  box(v,.43,.15,.025,'#8fbdc8',0,.52,.493);
  for(const sx of [-.30,.30])for(const zz of [-.30,.32]){
   const wheel=cylinder(v,.115,.115,.07,'#343f44',sx,.15,zz,12);wheel.rotation.z=Math.PI/2;
  }
  for(const sx of [-.2,.2])box(v,.09,.055,.035,emissive,sx,.28,.47);
  vanActors.push({v,x,z,seed});return v;
 }
 function transportStops(){
  for(const s of plan.buses){
   const [x,z]=point(s.x,s.y),g=place(layers.buses,x+.59,.08,z+.57);
   g.rotation.y=(s.x+s.y)%2?Math.PI/2:0;
   disk(g,.55,'#7caaa3',0,.002,0,.25);
   box(g,1.06,.08,.53,'#3f7884',0,1.03,-.15);
   box(g,1.07,.033,.56,'#d5ded3',0,1.10,-.15);
   for(const sx of [-.48,.48])box(g,.053,.96,.06,'#718f8b',sx,.52,-.2);
   box(g,.70,.054,.20,'#916e54',0,.28,.01);
   for(const sx of [-.29,.29])box(g,.045,.2,.21,'#718780',sx,.18,.01);
   cylinder(g,.04,.04,.86,'#667e81',.66,.49,-.17,10);
   box(g,.24,.24,.055,'#e4b453',.66,.91,-.17);
   box(g,.14,.145,.07,'#f8e6c7',.66,.92,-.17);
   const waiting=[],number=Math.min(6,Math.max(1,Math.ceil(s.riders/8)));
   for(let i=0;i<number;i++){
    const p=person(g,-.48+i*.20,.25+(i%2)*.13,i*43+s.x*11+s.y*13,{umbrella:true});
    p.g.position.y=.07;
    waiting.push({p,x:p.g.position.x});
   }
   busStops.push({g,waiting,pos:[x,z],boarding:0});
   inspectables.push({x:s.x,y:s.y,type:'Colectivos',title:String(s.riders)+' pasajeros esperando en la parada'});
  }
 }
 function shops3D(){
  for(const s of plan.industries){
   const [x,z]=point(s.x,s.y),g=place(layers.commerce,x,0,z),industrial=s.kind==='factory';
   if(industrial){
    box(g,1.55,.065,.56,'#879b97',0,.095,.92);
    for(const sx of [-.75,.75])box(g,.075,1.30,.1,'#708c88',sx,.72,.83);
    const shutter=box(g,1.21,.81,.06,'#7b9697',0,.60,.90);
    for(let k=0;k<7;k++)box(g,1.24,.025,.069,'#c6d0c2',0,.28+k*.13,.94);
    doors.push({obj:shutter,type:'factory',active:s.active,seed:s.x*13+s.y*5});
    for(const sx of [-.48,.48]){
     const chimney=cylinder(g,.17,.21,1.2,'#9da9a1',sx,.87,-.45,16);
     cylinder(g,.21,.21,.12,'#5b6c69',sx,1.52,-.45,16);
     if(s.active&&s.production>0)for(let i=0;i<5;i++){
      const puff=sphere(g,.14,'#d9e2df',sx,1.64+i*.23,-.45,2);
      puff.material=new THREE.MeshBasicMaterial({color:'#d3dfdd',transparent:true,opacity:.18,depthWrite:false});
      smoke.push({obj:puff,x:sx,z:-.45,seed:i*.2+sx,baseY:1.64});
     }
    }
    if(s.active){
     pallet(g,-.57,1.25,5);pallet(g,.60,1.3,3);
     forklift(g,.35,1.54,s.x*5+s.y*19);
     person(g,-.53,1.0,s.x*13+s.y,{role:'crew'});
     if(s.deliveries>0)van(g,.57,1.43,s.x+s.y*2,'#9f9176');
    }
   }else{
    const color=s.identity==='cafe'?'#9c7fa5':s.identity==='panaderia'?'#dca468':
     s.identity==='flores'?'#bb8196':s.identity==='taller'?'#7294a4':'#65a08d';
    const awning=place(g,0,1.17,.93);
    box(awning,1.40,.09,.45,color,0,0,0);
    for(let i=0;i<8;i++)box(awning,.15,.035,.48,i%2?'#f7e5ca':color,-.58+i*.165,.057,0);
    for(const sx of [-.64,.64])box(g,.07,.71,.08,'#a47e64',sx,.44,1.06);
    if(s.identity==='cafe'||s.identity==='panaderia'){
     for(const sx of [-.42,.42]){
      cylinder(g,.20,.20,.045,'#d4bb93',sx,.42,1.12,12);
      cylinder(g,.035,.035,.36,'#806750',sx,.24,1.12,10);
      box(g,.32,.07,.18,'#ac8a6b',sx,.2,1.44);
     }
    }else if(s.identity==='flores'){
     for(let i=0;i<8;i++){
      cylinder(g,.016,.015,.3,'#518b68',-.53+i*.14,.29,1.07,7);
      sphere(g,.08,['#e4a0c8','#f0ca80','#a4c4e2'][i%3],-.53+i*.14,.48,1.07,1);
     }
    }else if(s.identity==='taller'){
     for(const sx of [-.48,-.12]){
      cylinder(g,.15,.15,.07,'#424b4d',sx,.20,1.20,12).rotation.z=Math.PI/2;
     }
     box(g,.30,.09,.25,'#c49d63',.45,.26,1.12);
    }else for(let i=0;i<3;i++)crate(g,-.36+i*.35,.27,1.09);
    doors.push({obj:awning,type:'awning',active:s.active,seed:s.x*3+s.y});
    if(s.active){
     person(g,.57,1.12,s.x*7+s.y*29,{umbrella:true});
     if(s.deliveries>0){pallet(g,-.55,1.10,2);forklift(g,-.52,1.52,s.x*17+s.y)}
    }
   }
   inspectables.push({x:s.x,y:s.y,type:industrial?'Fábrica':'Comercio',
    title:industrial?'Actividad industrial y producción visible':'Actividad comercial y abastecimiento'});
  }
 }


 function boatModel(parent,x,z,seed,{fishing=false}={}){
  const g=place(parent,x,.06,z);
  box(g,.78,.18,1.16,fishing?'#b58964':'#537e89',0,.17,0);
  box(g,.72,.11,1.25,'#efe2be',0,.29,0);
  for(const sx of [-.36,.36])box(g,.075,.14,.95,'#e6d7ba',sx,.35,-.05);
  box(g,.63,.10,.12,'#715849',0,.34,.41);
  if(fishing){
   box(g,.40,.40,.33,'#f2e5c6',0,.55,-.22);
   box(g,.35,.22,.04,'#8dabb2',0,.57,.02);
   cylinder(g,.018,.02,.84,'#9dadae',.25,.80,-.27,10);
   const fisher=person(g,-.16,.14,seed,{umbrella:false});
   fisher.g.position.y=.30;
   pipe(g,[[.25,.95,.0],[.42,1.17,.49],[.52,.49,.88]],'#92775a',.011);
  }else{
   cylinder(g,.038,.04,1.56,'#ae936f',0,1.01,0,12);
   const tri=new THREE.Shape();tri.moveTo(.05,0);tri.lineTo(.54,0);tri.lineTo(.06,1.1);tri.closePath();
   const sail=custom(g,new THREE.ShapeGeometry(tri),new THREE.MeshStandardMaterial({color:'#fff2d6',roughness:.68,side:THREE.DoubleSide}),0,.36,0);
   sail.rotation.y=Math.PI/2;
   box(g,.19,.12,.17,'#d2a361',0,.42,.23);
  }
  for(const sx of [-.31,.31])sphere(g,.10,'#f3e4bc',sx,.31,-.37,1);
  boats.push({g,x,z,seed});return g;
 }
 function gull(parent,x,z,seed,species='gull'){
  const g=place(parent,x,3.2,z);
  const urban=species==='pigeon',body=sphere(g,urban?.105:.12,urban?'#89949a':'#faf6e6',0,0,0,1);body.scale.set(1,urban?.78:.7,urban?1.08:1.28);
  sphere(g,.065,urban?'#b9bec0':'#edbf66',0,-.016,.15,1);
  for(const sx of [-1,1]){
   const wing=place(g,sx*.12,.02,0);
   const plane=box(wing,urban?.34:.42,urban?.028:.035,urban?.14:.17,urban?'#777f84':'#f2f5ec',sx*(urban?.15:.19),0,0);
   plane.rotation.z=sx*.1;
   wings.push({wing,g,sx,seed,x,z,kind:'bird',species,radiusX:9+rnd(seed+91)*8,radiusZ:5+rnd(seed+92)*7,period:30+rnd(seed+93)*22,phase:rnd(seed+94)*Math.PI*2});
  }
 }
 function coast3D(){
  // El río de Ciudad Viva está en las columnas 24–25. Ninguna decoración bloquea calles.
  const centerY=plan.ports.length?plan.ports[0].y:10;
  for(let y=centerY-8;y<=centerY+8;y++){
   const [x,z]=point(24.5,y),row=place(layers.coast,x,.055,z);
   for(let i=0;i<5;i++){
    const line=box(row,.68+(i%3)*.12,.016,.026,i%2?'#d6f1ea':'#9dd3df',(i-2)*.26,.008,(i-2)*.32);
    waves.push({obj:line,seed:y*11+i,baseX:line.position.x});
   }
  }
  for(let i=0;i<3;i++){
   const [x,z]=point(24.35+i*.18,centerY-3+i*3);
   boatModel(layers.coast,x,z,centerY*29+i*61,{fishing:i===0});
  }
  for(let i=0;i<5;i++){
   const [x,z]=point(24.6+i*.08,centerY-5+i*2.5);
   gull(layers.coast,x,z,centerY*9+i*13);
  }
  for(const port of plan.ports){
   const [x,z]=point(port.x,port.y),g=place(layers.coast,x,0,z),side=port.x<24?1:-1;
   const pier=place(g,side*1.02,0,0);
   box(pier,.80,.15,1.72,'#bca17a',0,.14,0);
   for(const sx of [-.28,.28])for(const zz of [-.67,.67]){
    cylinder(pier,.07,.09,.67,'#6a584a',sx,-.24,zz,10);
    cylinder(pier,.10,.12,.14,'#526a6a',sx,.30,zz,10);
   }
   for(let j=0;j<6;j++)box(pier,.63,.026,.032,'#d7c19b',0,.23,-.68+j*.26);
   pipe(pier,[[-.32,.37,-.66],[0,.15,-.87],[.30,.37,-.68]],'#8a785f');
   for(const zz of [-.66,0,.66]){
    cylinder(g,.03,.036,1.30,'#607f81',-side*.72,.69,zz,10);
    sphere(g,.075,emissive,-side*.72,1.38,zz,1);
   }
   if(port.active){
    const crane=place(g,-side*.08,0,-.61);
    cylinder(crane,.08,.09,2.65,'#bc904f',0,1.38,0,12);
    for(let j=0;j<6;j++)box(crane,.37,.045,.04,'#e6c37e',0,.36+j*.4,0);
    const boom=place(crane,0,2.76,0);
    box(boom,1.52,.07,.12,'#e5b15a',side*.18,0,0);
    box(boom,.24,.12,.24,'#687b7c',-side*.63,0,0);
    const hook=place(boom,side*.73,-.51,0);
    box(hook,.43,.25,.37,'#bb8156',0,0,0);
    for(const sx of [-.15,.15])box(hook,.035,.48,.035,'#c7d0c4',sx,.19,0);
    cranes.push({boom,hook,seed:port.x*11+port.y*2});
    pallet(g,-.53,.7,4);pallet(g,.36,.72,3);
    forklift(g,-.38,.93,port.x*31+port.y);
    const worker=person(g,.57,.74,port.x*19+port.y,{role:'crew'});
    worker.g.rotation.y=2;
   }
   inspectables.push({x:port.x,y:port.y,type:'Puerto',
    title:port.active?'Muelles con carga, operarios y grúas':'Puerto: muelle con embarcaciones de ambientación'});
  }
  const leisure=plan.ports.length>0||plan.parks.some(p=>p.x>=20&&p.x<=27);
  if(leisure){
   for(let i=0;i<3;i++){
    const [x,z]=point(23.20,centerY-4+i*3),g=place(layers.coast,x,0,z);
    const p=person(g,0,.08,i*13+centerY,{umbrella:false});
    p.g.rotation.y=Math.PI/2;
    box(g,.41,.06,.26,'#95765d',-.17,.25,.31);
    pipe(g,[[.12,.54,.15],[.44,1.12,.38],[.88,.36,.62]],'#8f7456',.012);
   }
  }
 }
 function dog(parent,x,z,seed,cat=false){
  const g=place(parent,x,.085,z),coat=cat?'#ad9375':rnd(seed)>.5?'#c39561':'#837d6e';
  box(g,cat?.23:.28,cat?.17:.24,cat?.35:.39,coat,0,.21,0);
  for(const sx of [-.083,.083])for(const zz of [-.14,.14])box(g,.058,.17,.065,coat,sx,.08,zz);
  sphere(g,cat?.13:.155,coat,0,.38,.21,1);
  for(const sx of [-.073,.073]){
   if(cat){
    const ear=custom(g,new THREE.ConeGeometry(.048,.13,5),mat(coat),sx,.53,.22);
    ear.rotation.z=sx*.4;
   }else box(g,.083,.15,.07,coat,sx,.39,.16);
   sphere(g,.024,'#333d3d',sx,.40,.34,1);
  }
  sphere(g,.044,'#444044',0,.33,.36,1);
  const tail=place(g,0,.32,-.21);
  box(tail,.06,.09,.27,coat,0,.08,-.11);
  animals.push({g,tail,x,z,seed,cat});
  return g;
 }
 function butterflies(parent,x,z,seed){
  const g=place(parent,x,.9,z);
  cylinder(g,.013,.014,.16,'#73677a',0,0,0,7);
  for(const sx of [-1,1]){
   const wing=place(g,sx*.035,0,0);
   const patch=sphere(wing,.095,'#e6b0d4',sx*.08,0,0,1);patch.scale.set(1.20,.28,1.7);
   wings.push({wing,g,sx,seed,x,z,kind:'butterfly'});
  }
 }
 function animals3D(){
  for(const [i,b] of plan.animals.homes.entries()){
   if(i%3!==0)continue;
   const [x,z]=point(b.x,b.y);
   dog(layers.animals,x+.70,z+.69,i*53+b.x*7,false);
  }
  for(const [i,b] of plan.animals.shops.entries()){
   if(i%2)continue;
   const [x,z]=point(b.x,b.y);
   dog(layers.animals,x-.73,z+.78,i*41+b.x*5,true);
  }
  for(const [i,p] of plan.animals.parks.entries()){
   const [x,z]=point(p.x,p.y);
   dog(layers.animals,x+.57,z-.45,i*37+p.x*11,false);
   butterflies(layers.animals,x-.29,z+.38,i*37+p.y);
   if(i<5)gull(layers.animals,x,z,i*73+p.y,'pigeon');
  }
 }
 function school3D(){
  for(const s of plan.schools){
   const [x,z]=point(s.x,s.y),g=place(layers.schools,x,0,z);
   box(g,1.51,.08,.66,'#b2c4af',0,.08,1.09);
   for(let i=0;i<5;i++)box(g,.10,.085,.20,'#d9cdb3',-.65+i*.32,.13,.92);
   for(const sx of [-.78,.78]){
    cylinder(g,.036,.035,1.23,'#718b86',sx,.69,.99,8);
    sphere(g,.09,emissive,sx,1.33,.99,1);
   }
   const count=Math.min(10,Math.max(2,Math.ceil(s.enrolled/8)));
   for(let i=0;i<count;i++){
    const child=person(g,-.62+(i%5)*.26,1.05+Math.floor(i/5)*.27,i*29+s.x*17+s.y,{role:'school',child:s.serviceModel==='kindergarten'});
    child.g.position.y=.10;
    schoolFigures.push(child);
   }
   if(s.staff>0){
    const teacher=person(g,-.74,.78,s.x*51+s.y*7);
    teacher.g.rotation.y=.30;
   }
   const ball=sphere(g,.105,'#ebc362',.5,.20,-.60,1);
   props.push({obj:ball,kind:'schoolball',seed:s.y,baseY:.20});
   inspectables.push({x:s.x,y:s.y,type:'Escuela',title:String(s.enrolled)+' alumnos matriculados'});
  }
 }
 function repairs3D(){
  for(const r of plan.issues.potholes){
   const [x,z]=point(r.x,r.y),g=place(layers.repairs,x,.11,z);
   disk(g,.29,'#455150',0,.006,0,.92);
   disk(g,.18,'#586361',.04,.011,-.03,.82);
   for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    const piece=box(g,.13,.012,.033,'#a8a49b',Math.sin(a)*.26,.015,Math.cos(a)*.26);
    piece.rotation.y=a;
   }
   if(r.closed)for(const sx of [-.58,.58]){
    custom(g,new THREE.ConeGeometry(.125,.34,8),mat('#e99554'),sx,.22,.47);
    box(g,.19,.025,.19,'#e9dbb6',sx,.11,.47);
   }
  }
  for(const [i,l] of plan.issues.litter.entries()){
   const [x,z]=point(l.x,l.y),g=place(layers.repairs,x,.09,z);
   for(let j=0;j<4;j++){
    const xx=-.69+j*.16,zz=.67+j%2*.12;
    const bag=sphere(g,.11,['#586a5f','#88847c','#72847a'][j%3],xx,.12,zz,1);
    bag.scale.y=.8;
    box(g,.055,.062,.05,'#d4cbab',xx,.24,zz);
    const paper=box(g,.15,.01,.085,'#f1dfb9',xx+.1,.025,zz+.16);
    paper.rotation.y=j*.3+i;
   }
  }
  for(const c of plan.issues.overflowing){
   const [x,z]=point(c.x,c.y),g=place(layers.repairs,x,.04,z);
   box(g,.43,.47,.34,'#4b7b76',.54,.32,.51);
   box(g,.46,.085,.40,'#9aa9a4',.54,.58,.51);
   for(let i=0;i<4;i++)sphere(g,.10,['#a19c83','#5e806d','#8d9b8a'][i%3],.29+i*.13,.15,.68+(i%2)*.08,1);
  }
  for(const [i,r] of plan.issues.utilities.entries()){
   const [x,z]=point(r.x,r.y),g=place(layers.repairs,x,0,z);
   disk(g,.56,'#a08a6a',.49,.105,.43,.64);
   for(const sx of [.16,.81]){
    custom(g,new THREE.ConeGeometry(.12,.34,9),mat('#e1a35f'),sx,.23,.26);
    box(g,.17,.035,.17,'#f1e3ce',sx,.13,.26);
   }
   const worker=person(g,.54,.67,i*19+r.x*29,{role:'crew'});
   const wrench=box(worker.g,.025,.34,.026,'#c2cbc6',.20,.43,.06);
   box(g,.60,.08,.08,'#c9a05d',.48,.50,-.21);
   inspectables.push({x:r.x,y:r.y,type:'Cuadrilla municipal',title:'Reparación de la red de '+r.kind});
  }
 }


 function hose(g,start,end){
  pipe(g,[start,[start[0]+.15,.28,start[2]+.12],[end[0]-.2,.88,end[2]-.22],end],'#b3815f',.029);
  const droplets=[];
  for(let i=0;i<12;i++){
   const a=sphere(g,.045,'#a9e5f1',0,0,0,1);
   a.material=new THREE.MeshBasicMaterial({color:'#bde8f1',transparent:true,opacity:.81,depthWrite:false});
   droplets.push(a);
  }
  waterDrops.push({droplets,start,end});
 }
 function emergency3D(){
  for(const [i,fire] of plan.emergencies.fires.entries()){
   if(!fire.dispatched||!fire.arrived)continue;
   const [x,z]=point(fire.x,fire.y),g=place(layers.emergency,x,0,z);
   const left=person(g,-.60,.59,i*71+fire.x*13,{role:'fire',umbrella:false});
   left.g.rotation.y=-.25;
   const right=person(g,-.03,.76,i*29+fire.y*17,{role:'fire',umbrella:false});
   right.g.rotation.y=2.6;
   box(g,.39,.07,.27,'#d6b75d',-.57,.11,.20);
   cylinder(g,.15,.15,.06,'#b2bcb4',-.32,.14,.21,12);
   hose(g,[-.47,.44,.59],[.18,1.18,-.20]);
   const flare=sphere(g,.12,emissive,-.65,.90,-.14,1);
   props.push({obj:flare,kind:'blink',seed:i,baseY:flare.position.y});
   inspectables.push({x:fire.x,y:fire.y,type:'Bomberos',title:'Cuadrilla atendiendo un incendio real'});
  }
  for(const [i,call] of plan.emergencies.ambulances.entries()){
   if(!call.arrived)continue;
   const [x,z]=point(call.x,call.y),g=place(layers.emergency,x,0,z);
   const med=person(g,.54,.53,i*37+call.x,{role:'medic',umbrella:false});
   const med2=person(g,-.49,.56,i*47+call.y,{role:'medic',umbrella:false});
   med.g.rotation.y=1.4;med2.g.rotation.y=1.2;
   const bed=place(g,.03,.13,.72);
   box(bed,.37,.08,.82,'#e2e6de',0,.42,0);
   box(bed,.37,.035,.80,'#db9792',0,.47,0);
   box(bed,.30,.07,.18,'#f3f4ef',0,.55,-.28);
   for(const sx of [-.18,.18])for(const zz of [-.28,.28]){
    box(bed,.026,.38,.026,'#859998',sx,.24,zz);
    const w=cylinder(bed,.06,.06,.05,'#44565c',sx,.09,zz,10);w.rotation.z=Math.PI/2;
   }
   const lamp=sphere(g,.11,'#e97571',0,1.16,.22,1);
   lamp.material=mat('#e97b72',{emissive:'#f1736c',emissiveIntensity:1.1});
   inspectables.push({x:call.x,y:call.y,type:'Ambulancia',title:'Atención médica de un traslado registrado'});
  }
 }
 function surprises3D(){
  for(const [i,s] of plan.surprises.entries()){
   const [x,z]=point(s.x,s.y),g=place(layers.surprises,x,0,z);
   if(s.type==='mudanza'){
    van(g,.56,.75,i*29+s.x*7,'#7c9d8f');
    for(let j=0;j<4;j++)crate(g,-.55+j*.16,.23+j*.08,.98+(j%2)*.18,'#c8a471');
    const mover=person(g,-.53,.47,i*33+s.y);
    mover.g.rotation.y=1;
   }else if(s.type==='musica'){
    box(g,1.47,.12,.71,'#b99068',0,.18,1.05);
    for(let j=0;j<3;j++){
     const musician=person(g,-.53+j*.52,1.03,j*19+s.x*23,{umbrella:false});
     musician.g.position.y=.24;
     const inst=place(musician.g,.11,.36,.17);
     const guitar=sphere(inst,.14,'#bc895e',0,0,0,1);guitar.scale.set(.8,1.23,.68);
     box(inst,.052,.37,.05,'#d5ab78',0,.22,0);
    }
    for(let j=0;j<8;j++){
     cylinder(g,.015,.014,.24,'#65a17d',-.66+j*.19,.34,.70,7);
     sphere(g,.071,['#e9acb0','#f6d174','#a6bed7'][j%3],-.66+j*.19,.48,.70,1);
    }
   }else if(s.type==='celebracion'){
    for(let j=0;j<7;j++){
     const b=sphere(g,.097,['#eab26a','#b68dc8','#78bfad'][j%3],-.64+j*.20,1.50+(j%3)*.16,.78,1);
     box(g,.013,.34,.012,'#b7cbbd',b.position.x,1.22,b.position.z);
     props.push({obj:b,kind:'balloon',seed:i*31+j,baseY:b.position.y});
    }
    for(let j=0;j<10;j++){
     const c=box(g,.065,.02,.12,['#e3b36e','#dca0c4','#90c6b1'][j%3],-.73+j*.16,1.2+j%4*.18,.68+j%2*.25);
     props.push({obj:c,kind:'confetti',seed:j*13+i,baseY:c.position.y});
    }
   }
   inspectables.push({x:s.x,y:s.y,type:'Suceso de barrio',title:s.type==='mudanza'?'Mudanza registrada':s.type==='musica'?'Festival con música':'Celebración de la ciudad'});
  }
 }
 function weather3D(){
  if(plan.rainMm<=0)return;
  for(const [i,p] of (state.roads||[]).slice(0,210).entries()){
   if(i%3)continue;
   const [x,z]=point(p[0],p[1]);
   const puddle=disk(layers.weather,.33,'#add7da',x-.37,.105,z+.26,.31);
   puddle.scale.y=.75;
   waves.push({obj:puddle,seed:i*5,baseX:puddle.position.x,reflect:true});
   const ring=custom(layers.weather,new THREE.RingGeometry(.1,.13,18),new THREE.MeshBasicMaterial({
    color:'#d4f5f8',transparent:true,opacity:.43,side:THREE.DoubleSide,depthWrite:false}),x-.37,.115,z+.26);
   ring.rotation.x=-Math.PI/2;
   props.push({obj:ring,kind:'ripple',seed:i,baseY:ring.position.y});
  }
 }
 function sceneSync(next,{preview=false}={}){
  state=next;plan=immersiveCityPlan(next);
  const sig=immersiveSignature(plan)+'|'+Boolean(preview);
  if(sig===signature)return;
  signature=sig;builds++;
  for(const l of Object.values(layers))clear(l);
  for(const arr of [figures,animals,wings,boats,waves,forklifts,doors,smoke,cranes,waterDrops,props,umbrellas,
    busStops,schoolFigures,inspectables,vanActors])arr.length=0;
  if(preview)return;
  transportStops();shops3D();coast3D();animals3D();school3D();repairs3D();emergency3D();surprises3D();weather3D();
 }
 function tick(delta,minutes,paused=false,routeActors=[]){
  if(!plan)return;
  if(!paused)clock+=Math.max(0,Math.min(.1,Number(delta)||0));
  const hour=((N(minutes)%1440)+1440)%1440/60;
  const rain=plan.rainMm>0,night=hour>=19||hour<5.5,schoolTime=hour>=7&&hour<17;
  for(const f of figures){
   const v=clock*(f.role==='school'?5.8:3.6)+f.seed*.27;
   f.g.visible=f.role==='school'?schoolTime:!['fire','crew','medic'].includes(f.role)?
     hour>=5.5&&hour<=23.5:true;
   f.legs[0].rotation.x=Math.sin(v)*.17;f.legs[1].rotation.x=-Math.sin(v)*.17;
   f.arms[0].rotation.x=-Math.sin(v)*.22;f.arms[1].rotation.x=Math.sin(v)*.22;
  }
  for(const item of umbrellas)item.obj.visible=rain&&item.host.visible;
  boardingNow=0;
  for(const s of busStops){
   const atStop=routeActors.some(a=>a.selection?.type==='Colectivo municipal'&&a.mesh&&
    Math.hypot(a.mesh.position.x-s.pos[0],a.mesh.position.z-s.pos[1])<1.1);
   s.boarding+=((atStop?1:0)-s.boarding)*.13;
   if(s.boarding>.5)boardingNow++;
   for(const [i,p] of s.waiting.entries()){
    p.p.g.position.x=p.x+s.boarding*.21*(i+1)/s.waiting.length;
    p.p.g.rotation.y=atStop?-.6:0;
   }
  }
  // El colectivo del mundo real abre las puertas solo cerca de una parada real con pasajeros.
  for(const actor of routeActors){
   const bus=actor.mesh?.userData?.passengerDoor;
   if(!bus)continue;
   const near=busStops.some(s=>Math.hypot(actor.mesh.position.x-s.pos[0],actor.mesh.position.z-s.pos[1])<1.07);
   bus.rotation.y+=( (near?-.93:0)-bus.rotation.y)*.16;
   for(const light of actor.mesh.userData.interiorLights||[])light.visible=night||rain;
  }
  for(const f of forklifts){
   f.g.position.x=f.x+Math.sin(clock*.75+f.seed*.3)*.27;
   f.g.rotation.y=Math.sin(clock*.34+f.seed)*.28;
  }
  for(const v of vanActors)v.v.position.z=v.z+Math.sin(clock*.48+v.seed)*.10;
  for(const d of doors){
   const open=d.active&&hour>=7&&hour<=21;
   if(d.type==='factory')d.obj.position.y=.60+(open?.32:0)*(1+Math.sin(clock*.55+d.seed))*.5;
   else d.obj.rotation.z=Math.sin(clock*.8+d.seed)*(rain?.03:.015);
  }
  for(const f of smoke){
   const t=(clock*.32+f.seed)%1;
   f.obj.position.y=f.baseY+t*1.21;
   f.obj.position.x=f.x+Math.sin(clock*.9+f.seed)*(.05+t*.17);
   f.obj.scale.setScalar(.7+t*1.2);
   f.obj.material.opacity=(1-t)*.21;
  }
  for(const c of cranes){c.boom.rotation.y=Math.sin(clock*.33+c.seed)*.23;c.hook.position.y=-.51+Math.sin(clock*.61+c.seed)*.26}
  for(const b of boats){
   const phase=clock*.32+b.seed;
   b.g.position.set(b.x+Math.sin(phase*.33)*.27,.06+Math.sin(phase*2.6)*.035,b.z+Math.cos(phase*.27)*.27);
   b.g.rotation.z=Math.sin(phase*1.75)*.034;
  }
  for(const w of waves){
   if(w.reflect){
    w.obj.scale.setScalar(1+Math.abs(Math.sin(clock*1.5+w.seed))*.19);
   }else{
    w.obj.position.x=w.baseX+Math.sin(clock*.85+w.seed)*.16;
    w.obj.scale.z=1+Math.sin(clock*1.40+w.seed)*.15;
   }
  }
  for(const item of wings){
   const p=clock*(item.kind==='butterfly'?7:3.8)+item.seed;
   item.wing.rotation.z=item.sx*(.15+Math.sin(p)*.45);
   if(item.kind==='butterfly'){
    item.g.position.y=.85+Math.sin(clock*1.7+item.seed)*.20;
    item.g.position.x=item.x+Math.sin(clock*.72+item.seed)*.24;
    item.g.position.z=item.z+Math.cos(clock*.64+item.seed)*.22;
    item.g.rotation.y=Math.atan2(Math.cos(clock*.72+item.seed),-Math.sin(clock*.64+item.seed));
    item.g.visible=plan.season!=='invierno'&&!rain&&hour>=8&&hour<19;
   }else{
    const phase=clock/item.period*Math.PI*2+item.phase,dx=-Math.sin(phase)*item.radiusX,dz=Math.cos(phase)*item.radiusZ;
    item.g.position.set(item.x+Math.cos(phase)*item.radiusX,3.25+Math.sin(phase*2+item.phase)*.42,item.z+Math.sin(phase)*item.radiusZ);
    item.g.rotation.y=Math.atan2(dx,dz);
    item.g.rotation.z=Math.sin(phase)*.045;
   }
  }
  for(const a of animals){
   a.g.position.x=a.x+Math.sin(clock*.48+a.seed)*.19;
   a.g.rotation.y=Math.sin(clock*.27+a.seed)*.3;
   a.tail.rotation.y=Math.sin(clock*4+a.seed)*.38;
   a.g.visible=a.cat?hour>=6||hour<3:hour>=5&&hour<=23;
  }
  layers.schools.visible=hour>=7&&hour<=17.5;
  for(const drop of waterDrops){
   for(let i=0;i<drop.droplets.length;i++){
    const t=(i/drop.droplets.length+clock*1.7)%1;
    const p=new THREE.Vector3(...drop.start).lerp(new THREE.Vector3(...drop.end),t);
    drop.droplets[i].position.set(p.x,p.y+Math.sin(t*Math.PI)*.20,p.z);
   }
  }
  for(const p of props){
   const t=clock*1.2+p.seed;
   if(p.kind==='schoolball')p.obj.position.y=p.baseY+Math.abs(Math.sin(t*2.3))*.32;
   else if(p.kind==='ripple'){
    const radius=1+Math.abs(Math.sin(t))*.75;
    p.obj.scale.setScalar(radius);
    p.obj.material.opacity=.43*(1-(radius-1));
   }else if(p.kind==='balloon')p.obj.position.y=p.baseY+Math.sin(t)*.07;
   else if(p.kind==='confetti'){p.obj.position.y=p.baseY+Math.sin(t*.7)*.10;p.obj.rotation.set(t*.2,t*.3,t*.5)}
   else if(p.kind==='blink')p.obj.visible=Math.sin(t*4)>0;
  }
  layers.weather.visible=rain;
 }
 function inspect(px,py){
  let best=null;
  for(const item of inspectables){
   const [x,z]=point(item.x,item.y),p=new THREE.Vector3(x,1.10,z).project(camera);
   if(p.z<-1||p.z>1)continue;
   const dist=Math.hypot((p.x+1)*canvas.clientWidth/2-px,(1-p.y)*canvas.clientHeight/2-py);
   if(dist<16&&(!best||dist<best.dist))best={...item,dist};
  }
  return best?{type:best.type,title:best.title,
   description:'Escena 3D observada en la simulación de Ciudad Viva.',
   metrics:[['Parcela',(best.x+1)+', '+(best.y+1)]]}:null;
 }
 function diagnostics(){
  let invalidImmersiveTransforms=0;
  root.traverse(o=>{const scal=[o.scale.x,o.scale.y,o.scale.z];
   if([...scal,o.position.x,o.position.y,o.position.z,o.rotation.x,o.rotation.y,o.rotation.z]
     .some(v=>!Number.isFinite(v))||scal.some(v=>v<=0||v>20))invalidImmersiveTransforms++;
  });
  return {immersiveBuilds:builds,immersiveBusStops:busStops.length,
   immersiveBoardingStops:boardingNow,immersiveIndustrySites:plan?.industries.filter(b=>b.active).length||0,
   immersiveFactorySteam:smoke.length,immersiveForklifts:forklifts.length,
   immersivePortSites:plan?.ports.length||0,immersiveBoats:boats.length,
   immersiveAnimalFigures:animals.length,immersiveBirdWings:wings.length,
   immersiveSchoolSites:plan?.schools.length||0,
   immersiveRoadIssues:(plan?.issues.potholes.length||0)+(plan?.issues.litter.length||0),
   immersiveRepairCrews:plan?.issues.utilities.length||0,
   immersiveFireHoses:waterDrops.length,
   immersiveAmbulanceScenes:plan?.emergencies.ambulances.filter(a=>a.arrived).length||0,
   immersiveSurprises:plan?.surprises.length||0,
   immersiveUmbrellas:umbrellas.filter(a=>a.obj.visible).length,
   invalidImmersiveTransforms};
 }
 return {sceneSync,tick,inspect,diagnostics};
}
