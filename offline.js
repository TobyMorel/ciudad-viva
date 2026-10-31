const SAVE_KEY='ciudad-viva-offline-v1';
const SPECS={
 road:{label:'Calle local',cost:1200,days:24,stages:['Proyecto y permisos','Preparación del terreno','Base y drenaje','Pavimentación','Inspección y habilitación']},
 home:{label:'Vivienda privada',cost:4200,days:39,stages:['Permiso y financiación','Preparación de parcela','Estructura','Instalaciones y terminaciones','Inspección y ocupación']},
 shop:{label:'Local comercial',cost:3600,days:34,stages:['Permiso y financiación','Preparación de parcela','Estructura','Instalaciones y terminaciones','Inspección y habilitación']},
 civic:{label:'Centro de salud',cost:8000,days:62,stages:['Anteproyecto y permisos','Licitación y movilización','Cimientos y estructura','Instalaciones y equipamiento','Inspección y habilitación']},
 depot:{label:'Depósito municipal',cost:5600,days:50,stages:['Proyecto y permisos','Preparación del terreno','Estructura y playa de carga','Estanterías y seguridad','Inspección y apertura']}
};
const NEEDS={road:4,home:6,shop:7,civic:11,depot:8};
const clone=x=>JSON.parse(JSON.stringify(x));
function stableSkill(id,category){let value=2166136261;for(const char of `${id}:${category}`)value=Math.imul(value^char.charCodeAt(0),16777619)>>>0;return value>>>0}
function ensureWorkProfile(person){person.skills=person.skills||{};for(const category of ['comercio','administracion','logistica'])if(person.skills[category]===undefined)person.skills[category]=25+stableSkill(person.id||'',category)%76;if(person.expectedMonthlyWage===undefined)person.expectedMonthlyWage=7+stableSkill(person.id||'','salario')%3}
function jobProfile(building){const profiles={shop:['comercio','Comercio',35],civic:['administracion','Administración',48],depot:['logistica','Logística',42]},[category,label,minimum]=profiles[building.kind]||profiles.shop,wage=Math.max(1,Math.floor(building.business?.wage??8));return {category,label,minimum,wage}}
const TRAINING={comercio:{label:'Comercio',minimum:35},administracion:{label:'Administración',minimum:48},logistica:{label:'Logística',minimum:42}},TRAINING_SEATS=6,TRAINING_MONTHS=2,TRAINING_GAIN=18;

export async function createOfflineAdapter(){
  const response=await fetch('offline_seed.json',{cache:'no-store'});
  if(!response.ok)throw Error('No se pudo iniciar la ciudad offline. Recargá los archivos del juego.');
  const seed=await response.json();let state;
  try{state=JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch{state=null}
  if(!state)state=clone(seed);
  state.supply=state.supply||clone(seed.supply);
  if(!state.supply.market)state.supply.market=clone(seed.supply.market||{});
  state.supply.marketOrders=state.supply.marketOrders||[];
  for(const b of state.buildings||[])if(b.kind==='shop'&&b.business){const current=b.business,template=seed.buildings.find(x=>x.kind==='shop'&&x.x===b.x&&x.y===b.y)?.business||{};for(const [key,value] of Object.entries(template))if(current[key]===undefined)current[key]=value}
  state.finance=state.finance||clone(seed.finance||{businessBank:{name:'Banco Cooperativo',liquidity:42000,maxLiquidity:42000,annualRate:.24}});state.finance.businessBank=state.finance.businessBank||{name:'Banco Cooperativo',liquidity:42000,maxLiquidity:42000,annualRate:.24};
  state.trainingPrograms=state.trainingPrograms||[];
  for(const b of state.buildings||[])if(b.kind==='shop'&&b.business){const f=b.business;f.creditDebt=f.creditDebt||0;f.creditLimit=f.creditLimit||Math.max(1000,(f.jobSlots||12)*200);f.creditRate=f.creditRate||.02;f.creditDelinquencyMonths=f.creditDelinquencyMonths||0;f.lastCreditDraw=f.lastCreditDraw||0;f.lastInterest=f.lastInterest||0;f.lastRepayment=f.lastRepayment||0}
  for(const home of state.buildings||[])if(home.kind==='home')for(const person of home.residents||[]){person.previousEmployer=person.previousEmployer||null;person.previousEmployerId=person.previousEmployerId||null;person.unemploymentEpisodes=person.unemploymentEpisodes||0;person.lastUnemploymentDurationDays=person.lastUnemploymentDurationDays??null;if(person.workerEligible){ensureWorkProfile(person);if(person.unemployedSinceDay===undefined)person.unemployedSinceDay=person.status==='empleado'?null:(state.day||1);if(person.unemploymentReason===undefined)person.unemploymentReason=person.status==='empleado'?null:'búsqueda general'}}
  state.version=Math.max(20,state.version||1);
  state.players={};state.host='offline';state.paused=Boolean(state.paused);let last=Date.now(),debtDays=0;

  function view(){
    const s=clone(state),bank=s.finance?.businessBank;if(bank){const open=(s.buildings||[]).filter(b=>b.kind==='shop'&&b.business?.status==='abierto').map(b=>b.business);bank.openLoans=open.reduce((n,f)=>n+(f.creditDebt||0),0);bank.borrowers=open.filter(f=>(f.creditDebt||0)>0).length}const eligible=(s.buildings||[]).filter(b=>b.kind==='home').flatMap(b=>b.residents||[]).filter(r=>r.workerEligible),seekers=eligible.filter(r=>r.status==='buscando'),ages=seekers.map(r=>Math.max(0,s.day-(r.unemployedSinceDay??s.day)));s.laborMarket={workingAge:eligible.length,employed:eligible.filter(r=>r.status==='empleado').length,jobSeekers:seekers.length,outsideLaborForce:eligible.filter(r=>r.status==='inactivo').length,seekersWithoutQualification:seekers.filter(r=>r.unemploymentReason==='sin cualificación para las vacantes alcanzables').length,seekersBelowExpectedWage:seekers.filter(r=>r.unemploymentReason==='salario ofrecido inferior al esperado').length,seekersWithoutRoadAccess:seekers.filter(r=>r.unemploymentReason==='sin acceso vial').length,reachableVacancies:(s.workplaces||[]).reduce((n,w)=>n+Math.max(0,(w.jobSlots||0)-(w.workersAssigned||0)),0),averageSearchDays:+(ages.reduce((a,n)=>a+n,0)/Math.max(1,ages.length)).toFixed(1),longestSearchDays:Math.max(0,...ages),previouslyEmployed:seekers.filter(r=>r.previousEmployer).length,completedSearches30Days:(s.laborHistory||[]).filter(x=>s.day-30<x.day&&x.day<=s.day).length};s.trainingCatalog=trainingCatalog();s.online=1;s.isHost=true;s.available=Math.max(0,s.money-(s.projects||[]).reduce((a,p)=>a+Math.max(0,p.cost-(p.paid||0)),0));
    s.reserved=(s.projects||[]).reduce((a,p)=>a+Math.max(0,p.cost-(p.paid||0)),0);s.effectiveMonthlyExpenses=s.monthlyExpenses+(s.publicPayroll||0);
    return s;
  }
  function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state))}catch{}}
  function event(title,detail){state.events=state.events||[];state.events.unshift({day:state.day,title,detail});state.events=state.events.slice(0,30)}
  function trainingRoadDistance(home,center){const roads=state.roads||[],starts=roads.filter(([x,y])=>Math.abs(home.x-x)+Math.abs(home.y-y)<=1).map(([x,y])=>`${x},${y}`),goals=new Set(roads.filter(([x,y])=>Math.abs(center.x-x)+Math.abs(center.y-y)<=1).map(([x,y])=>`${x},${y}`));if(!starts.length||!goals.size)return null;const queue=starts.map(key=>[key,0]),seen=new Set(starts);for(let i=0;i<queue.length;i++){const [key,distance]=queue[i];if(goals.has(key))return distance+2;const [x,y]=key.split(',').map(Number);for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const next=`${nx},${ny}`;if(!seen.has(next)&&roads.some(r=>r[0]===nx&&r[1]===ny)){seen.add(next);queue.push([next,distance+1])}}}return null}
  function offlineRoadRoute(start,end){const roads=new Set((state.roads||[]).map(([x,y])=>`${x},${y}`)),adj=(x,y)=>[[x+1,y],[x-1,y],[x,y+1],[x,y-1]],starts=roads.has(`${start.x},${start.y}`)?[[start.x,start.y]]:adj(start.x,start.y).filter(([x,y])=>roads.has(`${x},${y}`)),goals=new Set(roads.has(`${end.x},${end.y}`)?[`${end.x},${end.y}`]:adj(end.x,end.y).filter(([x,y])=>roads.has(`${x},${y}`)).map(([x,y])=>`${x},${y}`));if(!starts.length||!goals.size)return null;const queue=starts.map(([x,y])=>[x,y]),prev=new Map(queue.map(([x,y])=>[`${x},${y}`,null]));let target=null;for(let i=0;i<queue.length;i++){const [x,y]=queue[i],key=`${x},${y}`;if(goals.has(key)){target=key;break}for(const [nx,ny] of adj(x,y)){const next=`${nx},${ny}`;if(roads.has(next)&&!prev.has(next)){prev.set(next,key);queue.push([nx,ny])}}}if(!target)return null;const path=[];for(let key=target;key;key=prev.get(key))path.push(key.split(',').map(Number));path.reverse();if(!roads.has(`${start.x},${start.y}`))path.unshift([start.x,start.y]);if(!roads.has(`${end.x},${end.y}`))path.push([end.x,end.y]);return path}
  function trainingCandidates(category,center,excluded=new Set()){const config=TRAINING[category];if(!config||!center)return [];const rows=[];for(const home of state.buildings.filter(b=>b.kind==='home'&&b.occupants>0)){const distance=trainingRoadDistance(home,center);if(distance===null)continue;for(const person of home.residents||[]){if(!person.workerEligible||!['buscando','empleado'].includes(person.status)||excluded.has(person.id))continue;ensureWorkProfile(person);const skill=person.skills[category]||0;if(skill>=config.minimum)continue;rows.push({home,person,skill,distance,searchDays:Math.max(0,state.day-(person.unemployedSinceDay||state.day))})}}return rows.sort((a,b)=>(a.person.status==='buscando'?0:1)-(b.person.status==='buscando'?0:1)||b.searchDays-a.searchDays||a.skill-b.skill||a.distance-b.distance||String(a.person.id).localeCompare(String(b.person.id)))}
  function trainingCatalog(){const centers=state.buildings.filter(b=>b.kind==='civic'&&b.status!=='cerrado'),programs=state.trainingPrograms||[],occupied=new Set(programs.filter(p=>['active','paused'].includes(p.status)).map(p=>p.centerId)),excluded=new Set(programs.filter(p=>['active','paused'].includes(p.status)).flatMap(p=>p.traineeIds||[])),reserved=(state.projects||[]).filter(p=>!p.privatePaid).reduce((sum,p)=>sum+Math.max(0,p.cost-(p.paid||0)),0),available=Math.max(0,state.money-reserved);return Object.entries(TRAINING).map(([category,config])=>{const center=centers.find(b=>!occupied.has(`civic-${b.x}-${b.y}`))||centers[0]||null,centerId=center?`civic-${center.x}-${center.y}`:null,candidates=center?trainingCandidates(category,center,excluded):[],seats=Math.min(TRAINING_SEATS,candidates.length),monthlyCost=180+40*seats,totalCost=monthlyCost*TRAINING_MONTHS,busy=center&&occupied.has(centerId),reason=!center?'Sin aula municipal':busy?'Aula ocupada':!seats?'Sin residentes accesibles que necesiten esta formación':available<totalCost?'Fondos municipales comprometidos':'';return {category,label:config.label,minimumSkill:config.minimum,centerId,centerName:center?.name||'Sin aula',availableCandidates:candidates.length,seats,durationMonths:TRAINING_MONTHS,monthlyCost,totalCost,skillGainPerMonth:TRAINING_GAIN,canStart:!reason,reason}})}
  function processOfflineTraining(){for(const program of state.trainingPrograms||[]){if(program.status!=='active')continue;const center=state.buildings.find(b=>b.kind==='civic'&&`civic-${b.x}-${b.y}`===program.centerId&&b.status!=='cerrado'),students=[];for(const home of state.buildings.filter(b=>b.kind==='home'))for(const person of home.residents||[])if((program.traineeIds||[]).includes(person.id)&&center&&trainingRoadDistance(home,center)!==null)students.push(person);if(!center||!students.length){program.status='paused';program.pauseReason=center?'La cohorte perdió acceso vial al aula':'El aula municipal no está operativa';event('Curso pausado',`${program.label}: ${program.pauseReason.toLowerCase()}; el saldo reservado se conserva.`);continue}for(const person of students){ensureWorkProfile(person);person.skills[program.category]=Math.min(100,(person.skills[program.category]||0)+TRAINING_GAIN)}const installment=Math.min(program.monthlyCost,program.remainingBudget);program.remainingBudget-=installment;program.spent+=installment;program.monthsCompleted++;program.lastTrainingDay=state.day;program.traineeProgress=Object.fromEntries(students.map(p=>[p.id,p.skills[program.category]]));if(program.monthsCompleted>=program.durationMonths){program.status='completed';program.completedDay=state.day;event('Curso municipal completado',`${program.label}: ${students.length} residentes terminaron tras ${program.durationMonths} ciclos; aumentaron su habilidad ${program.category}.`)}else event('Ciclo de formación',`${program.label}: ciclo ${program.monthsCompleted}/${program.durationMonths}; ${students.length} participantes mejoraron ${TRAINING_GAIN} puntos. Saldo reservado $${program.remainingBudget}.`)}}
  function updateOfflineLabor(){
    const homes=state.buildings.filter(b=>b.kind==='home'),people=homes.flatMap(home=>(home.residents||[]).filter(person=>person.workerEligible).map(person=>({home,person}))),sites=state.buildings.filter(b=>b.kind==='civic'||b.kind==='depot'||(b.kind==='shop'&&b.business?.status==='abierto')).map(building=>{const firm=building.business,old=(state.workplaces||[]).find(w=>w.x===building.x&&w.y===building.y),id=firm?.id||`public-${building.kind}-${building.x}-${building.y}`,profile=jobProfile(building);return {building,id,name:building.name||old?.name||building.kind,kind:building.kind,slots:Math.max(0,Math.floor(firm?.jobSlots??old?.jobSlots??0)),...profile,workers:[]}}),byId=new Map(sites.map(site=>[site.id,site])),target=Math.min(Math.round(people.length*Math.max(0,Math.min(100,state.employment||0))/100),sites.reduce((n,x)=>n+x.slots,0));
    for(const {person} of people){ensureWorkProfile(person);if(person.status==='buscando'&&person.unemployedSinceDay==null){person.unemployedSinceDay=state.day;person.unemploymentReason=person.previousEmployer?'cierre o pérdida de puesto':'búsqueda general'}}
    for(const {home,person} of people)if(person.status==='empleado'){const site=byId.get(person.employerId),qualified=site&&(person.skills?.[site.category]||0)>=site.minimum,paid=site&&site.wage>=(person.expectedMonthlyWage||0),atTarget=sites.reduce((n,x)=>n+x.workers.length,0)>=target;if(site&&qualified&&paid&&offlineRoadRoute(home,site.building)&&site.workers.length<site.slots&&!atTarget){site.workers.push({home,person});continue}person.previousEmployer=person.employerName||site?.name||person.previousEmployer||null;person.previousEmployerId=person.employerId||null;person.unemployedSinceDay=state.day;person.unemploymentReason=!site?'cierre por insolvencia':!qualified?'sin cualificación para las vacantes alcanzables':!paid?'salario ofrecido inferior al esperado':site&&!offlineRoadRoute(home,site.building)?'sin acceso vial':atTarget?'sin vacante alcanzable':'vacante eliminada';Object.assign(person,{status:'buscando',employerId:null,employerName:null,monthlyWage:0,attendance:0})}
    const applicants=people.filter(({person})=>person.status==='buscando').sort((a,b)=>a.person.unemployedSinceDay-b.person.unemployedSinceDay||a.home.x-b.home.x||a.home.y-b.home.y);
    for(const applicant of applicants){const {home,person}=applicant,allOpen=sites.filter(site=>site.workers.length<site.slots),open=allOpen.filter(site=>offlineRoadRoute(home,site.building)),qualified=open.filter(site=>(person.skills?.[site.category]||0)>=site.minimum),acceptable=qualified.filter(site=>site.wage>=(person.expectedMonthlyWage||0));if(!open.length&&allOpen.length){person.unemploymentReason='sin acceso vial';continue}if(!qualified.length){person.unemploymentReason='sin cualificación para las vacantes alcanzables';continue}if(!acceptable.length){person.unemploymentReason='salario ofrecido inferior al esperado';continue}if(sites.reduce((n,x)=>n+x.workers.length,0)>=target){person.unemploymentReason='sin vacante alcanzable';continue}const site=acceptable.sort((a,b)=>(Math.abs(home.x-a.building.x)+Math.abs(home.y-a.building.y))-(Math.abs(home.x-b.building.x)+Math.abs(home.y-b.building.y))||a.id.localeCompare(b.id))[0],duration=Math.max(0,state.day-(person.unemployedSinceDay??state.day));person.status='empleado';person.employerId=site.id;person.employerName=site.name;person.monthlyWage=site.wage;person.attendance=1;person.lastHireDay=state.day;person.lastEmployerBeforeHire=person.previousEmployer||null;if(person.unemployedSinceDay!=null){person.lastUnemploymentDurationDays=duration;if(duration>0){person.unemploymentEpisodes=(person.unemploymentEpisodes||0)+1;state.laborHistory=state.laborHistory||[];state.laborHistory.push({day:state.day,personId:person.id,fromEmployer:person.previousEmployer||null,toEmployer:site.name,searchDays:duration});state.laborHistory=state.laborHistory.slice(-500)}}person.unemployedSinceDay=null;person.unemploymentReason=null;site.workers.push(applicant)}
    const grouped=new Map(),commutes=[];let walkingCommuters=0,autoCommuters=0,vehicles=0,dailyEmissionsKg=0,minutesTotal=0,distanceTotal=0;
    for(const site of sites)for(const worker of site.workers){const route=offlineRoadRoute(worker.home,site.building);if(!route)continue;const roads=new Set((state.roads||[]).map(([x,y])=>`${x},${y}`)),distance=route.slice(1).reduce((n,[x,y],i)=>n+(roads.has(`${x},${y}`)&&roads.has(`${route[i][0]},${route[i][1]}`)?1:0),0),mode=distance<=3?'walk':'auto',key=[worker.home.x,worker.home.y,site.building.x,site.building.y,mode].join(':'),trip=grouped.get(key)||{from:[worker.home.x,worker.home.y],to:[site.building.x,site.building.y],route,mode,reason:'trabajo',departureWindow:'07:00–09:00',distance,workers:0,vehicles:0};trip.workers++;worker.person.commuteMode=mode;grouped.set(key,trip)}
    for(const trip of grouped.values()){const walkAccess=2,waiting=trip.mode==='walk'?0:3,parking=trip.mode==='walk'?0:2,ride=Math.round(trip.distance*(trip.mode==='walk'?4:2.5)),count=trip.mode==='walk'?0:Math.ceil(trip.workers/1.4),attendance=Math.max(.25,1-Math.max(0,walkAccess+waiting+ride+parking-15)/240),emissions=+(2*count*trip.distance*.18).toFixed(2);Object.assign(trip,{walkAccessMinutes:walkAccess,waitingMinutes:waiting,rideMinutes:ride,parkingMinutes:parking,transferMinutes:0,estimatedMinutes:walkAccess+waiting+ride+parking,vehicles:count,dailyEmissionsKg:emissions,trafficFactor:1,attendance});commutes.push(trip);walkingCommuters+=trip.mode==='walk'?trip.workers:0;autoCommuters+=trip.mode==='auto'?trip.workers:0;vehicles+=count;dailyEmissionsKg+=emissions;minutesTotal+=trip.workers*trip.estimatedMinutes;distanceTotal+=trip.workers*trip.distance;const site=sites.find(s=>s.building.x===trip.to[0]&&s.building.y===trip.to[1]);for(const w of site?.workers||[])if(w.home.x===trip.from[0]&&w.home.y===trip.from[1]&&w.person.commuteMode===trip.mode){w.person.attendance=attendance;w.person.commuteTime=trip.estimatedMinutes}}
    state.commutes=commutes;const effectiveStaffed=sites.reduce((n,site)=>n+site.workers.reduce((a,w)=>a+(w.person.attendance||0),0),0),privateStaffed=sites.filter(site=>site.kind==='shop').reduce((n,site)=>n+site.workers.reduce((a,w)=>a+(w.person.attendance||0),0),0);state.traffic={...(state.traffic||{}),commuters:walkingCommuters+autoCommuters,walkingCommuters,autoCommuters,vehicles,dailyEmissionsKg:+dailyEmissionsKg.toFixed(2),meanDistance:+(distanceTotal/Math.max(1,walkingCommuters+autoCommuters)).toFixed(1),meanMinutes:Math.round(minutesTotal/Math.max(1,walkingCommuters+autoCommuters)),workersWithoutRoadAccess:people.filter(x=>x.person.status==='buscando'&&x.person.unemploymentReason==='sin acceso vial').length,effectiveWorkers:Math.round(effectiveStaffed),staffedJobs:Math.round(effectiveStaffed),privateStaffedJobs:Math.round(privateStaffed),effectiveEmployment:Math.round(effectiveStaffed/Math.max(1,(state.population||0)*.42)*100)};
    state.workplaces=sites.map(site=>{const workers=site.workers,staffed=workers.reduce((n,x)=>n+(x.person.attendance||0),0),minutes=workers.reduce((n,x)=>n+(x.person.commuteTime||0),0);return {name:site.name,kind:site.kind,x:site.building.x,y:site.building.y,jobSlots:site.slots,workersAssigned:workers.length,staffedJobs:Math.round(staffed),payroll:workers.reduce((n,x)=>n+Math.round((x.person.monthlyWage||0)*(x.person.attendance||0)),0),attendance:workers.length?staffed/workers.length:0,meanMinutes:workers.length?Math.round(minutes/workers.length):null,jobCategory:site.category,jobCategoryLabel:site.label,minimumSkill:site.minimum,offeredWage:site.wage}});
  }
  function receiveMarketDeliveries(){
    for(const order of state.supply.marketOrders||[]){
      if(order.status!=='en tránsito'||state.day<order.arrivalDay)continue;
      const firm=state.buildings.find(b=>b.kind==='shop'&&b.business?.id===order.businessId)?.business;
      if(firm?.status==='abierto'){firm.inputInventory=(firm.inputInventory||0)+order.quantity;order.status='entregado';order.deliveredDay=state.day}
      else{order.status='cancelado';order.statusCause='Empresa cerrada antes de recibir la carga'}
    }
  }
  function simulateOfflineMarket(){
    const shops=state.buildings.filter(b=>b.kind==='shop'&&b.business?.status==='abierto');
    const homes=state.buildings.filter(b=>b.kind==='home'&&b.occupants>0),allocations=new Map(shops.map(b=>[b.business.id,0])),buyers=new Map(shops.map(b=>[b.business.id,[]]));
    for(const h of homes){
      const choices=shops.map(b=>({b,weight:(1/(1+Math.abs(h.x-b.x)+Math.abs(h.y-b.y)))**1.4*(18/Math.max(1,b.business.price||18))**2})).sort((a,b)=>b.weight-a.weight);
      if(!choices.length)continue;const budget=homes.reduce((s,x)=>s+(x.householdCash||0),0);const cheapest=Math.min(...choices.map(x=>Math.max(1,x.b.business.price||18)));
      let units=Math.min(Math.round(h.occupants*.12),Math.floor((h.householdCash||0)/cheapest));const total=choices.reduce((s,x)=>s+x.weight,0);
      const shares=choices.map(x=>units*x.weight/total),counts=shares.map(Math.floor);let rem=units-counts.reduce((s,x)=>s+x,0);
      for(const i of shares.map((v,i)=>({i,r:v-counts[i]})).sort((a,b)=>b.r-a.r)){if(rem--<=0)break;counts[i.i]++}
      choices.forEach(({b},i)=>{if(counts[i]>0){allocations.set(b.business.id,allocations.get(b.business.id)+counts[i]);buyers.get(b.business.id).push({home:h,units:counts[i]})}});
    }
    let salesIncome=0,orders=state.supply.marketOrders||(state.supply.marketOrders=[]),suppliers=state.supply.market||{};
    for(const shop of shops){
      const f=shop.business,key=f.id,localDemand=allocations.get(key)||0,regional=Math.round(f.jobSlots*.35),inv=f.inventory||0,raw=f.inputInventory||0;
      if(f.lastLocalDemand>0){const rate=(f.lastLocalSales||0)/Math.max(1,f.lastLocalDemand),other=shops.filter(x=>x!==shop).map(x=>x.business.price||18);if(rate<.72&&inv>12)f.price=Math.max(8,Math.min((f.price||18)-1,other.length?Math.min(...other):18));else if(rate>1.05&&inv<8)f.price=Math.min(32,(f.price||18)+1)}
      const workplace=(state.workplaces||[]).find(w=>w.x===shop.x&&w.y===shop.y),staffed=workplace?.staffedJobs||0;
      f.lastCreditDraw=0;f.lastInterest=0;f.lastRepayment=0;
      const planned=Math.min(Math.max(0,200-inv),Math.max(0,Math.ceil(localDemand+regional-inv)),Math.round(staffed*(f.productivity||.06)*30));
      const produced=Math.min(planned,raw);let localLeft=Math.min(inv+produced,localDemand),localSold=0;
      for(const item of buyers.get(key)||[]){if(localLeft<=0)break;const q=Math.min(item.units,localLeft,Math.floor((item.home.householdCash||0)/Math.max(1,f.price||18)));item.home.householdCash-=q*(f.price||18);localSold+=q;localLeft-=q}
      const exportSold=Math.min(Math.max(0,inv+produced-localSold),regional),sales=localSold+exportSold,revenue=localSold*(f.price||18)+exportSold*Math.round((f.price||18)*.78),payroll=workplace?.payroll||0,overhead=f.fixedCost||40;
      f.inputInventory=raw-produced;const pending=orders.filter(o=>o.businessId===key&&o.status==='en tránsito').reduce((a,o)=>a+o.quantity,0),target=Math.min(110,Math.max(12,Math.round(staffed*(f.productivity||.06)*30*1.15)));let need=Math.max(0,target-f.inputInventory-pending),cash=(f.cash||0)+revenue-payroll-overhead,purchased=0,costs=0,used=[];const bank=state.finance.businessBank,draw=amount=>{const n=Math.min(Math.ceil(Math.max(0,amount)),Math.max(0,(f.creditLimit||0)-(f.creditDebt||0)),Math.max(0,bank.liquidity||0));if(n){f.creditDebt=(f.creditDebt||0)+n;f.lastCreditDraw+=n;bank.liquidity-=n;cash+=n}return n};if(cash<0)draw(-cash);
      const providers=Object.entries(suppliers).map(([name,s])=>({name,s,landed:s.unitCost+Math.abs(shop.x-4)*.055+Math.abs(shop.y-10)*.055+s.leadDays*.035})).sort((a,b)=>a.landed-b.landed);
      for(const {name,s,landed} of providers){if(!need||!s.stock||cash<=0)continue;const available=cash+Math.min(Math.max(0,(f.creditLimit||0)-(f.creditDebt||0)),Math.max(0,bank.liquidity||0)),q=Math.min(need,s.stock,Math.floor(available/landed));if(!q)continue;const cost=Math.round(q*landed);if(cash<cost)draw(cost-cash);s.stock-=q;s.cash=(s.cash||0)+cost;s.lastSales=(s.lastSales||0)+q;cash-=cost;need-=q;purchased+=q;costs+=cost;used.push(name);orders.push({id:`offline-market-${state.day}-${key}-${name}`,businessId:key,businessName:f.name,supplier:name,quantity:q,unitCost:+landed.toFixed(2),cost,orderedDay:state.day,supplierReadyDay:state.day+s.leadDays,arrivalDay:state.day+s.leadDays+Math.max(1,Math.ceil((Math.abs(shop.x-4)+Math.abs(shop.y-10))/6)),travelDistance:Math.abs(shop.x-4)+Math.abs(shop.y-10),x:shop.x,y:shop.y,status:'en tránsito'})}
      if(cash<0){f.cash=Math.round(cash);f.status='cerrado';shop.status='cerrado';state.jobs=Math.max(0,state.jobs-f.jobSlots);for(const h of state.buildings.filter(b=>b.kind==='home'))for(const person of h.residents||[])if(person.employerId===f.id){person.previousEmployer=f.name;person.previousEmployerId=f.id;person.unemployedSinceDay=state.day;person.unemploymentReason='cierre por insolvencia';Object.assign(person,{status:'buscando',employerId:null,employerName:null,monthlyWage:0,attendance:0})}event('Empresa insolvente',`${f.name} agotó su caja y crédito antes de cubrir sus costos operativos; sus trabajadores vuelven a buscar empleo.`);continue}
      const interest=Math.round((f.creditDebt||0)*(f.creditRate||.02));f.lastInterest=interest;if(cash<interest)draw(interest-cash);if(cash>=interest){cash-=interest;bank.liquidity+=interest;f.creditDelinquencyMonths=0}else{bank.liquidity+=Math.max(0,cash);f.creditDebt+=interest-Math.max(0,cash);f.creditDelinquencyMonths=(f.creditDelinquencyMonths||0)+1;cash=0}const repayment=Math.min(f.creditDebt||0,Math.max(0,Math.floor(cash-500)));cash-=repayment;f.creditDebt-=repayment;f.lastRepayment=repayment;bank.liquidity+=repayment;
      f.cash=Math.round(cash);f.inventory=inv+produced-sales;f.lastProduction=produced;f.lastSales=sales;f.lastLocalSales=localSold;f.lastRegionalSales=exportSold;f.lastLocalDemand=localDemand;f.lastDemand=localDemand+regional;f.lastRevenue=revenue;f.lastPayroll=payroll;f.lastInputs=costs;f.lastInputUnits=purchased;f.lastInputSupplier=used.join(' · ')||'Sin stock o fondos';f.lastInputShortage=need;f.lastProfit=revenue-payroll-overhead-costs-interest;f.lastWorkers=workplace?.workersAssigned||0;f.creditAvailable=Math.max(0,Math.min(f.creditLimit-f.creditDebt,bank.liquidity));f.creditStatus=f.creditDelinquencyMonths?'mora':f.creditDebt?'utilizada':'disponible';salesIncome+=revenue;
      if(f.cash<0||f.creditDelinquencyMonths>=2){f.status='cerrado';shop.status='cerrado';state.jobs=Math.max(0,state.jobs-f.jobSlots);for(const h of state.buildings.filter(b=>b.kind==='home'))for(const person of h.residents||[])if(person.employerId===f.id){person.previousEmployer=f.name;person.previousEmployerId=f.id;person.unemployedSinceDay=state.day;person.unemploymentReason='cierre por insolvencia';Object.assign(person,{status:'buscando',employerId:null,employerName:null,monthlyWage:0,attendance:0})}event('Empresa insolvente',`${f.name} cerró tras agotar crédito o incumplir dos vencimientos; sus trabajadores vuelven a buscar empleo.`)}
    }
    state.lastMarketRevenue=salesIncome;
  }
  function complete(p){
    const q={x:p.x,y:p.y,status:'habilitado',level:1,quality:82};
    if(p.kind==='road'){
      if(!state.roads.some(r=>r[0]===p.x&&r[1]===p.y))state.roads.push([p.x,p.y]);
      state.roadAssets.push({x:p.x,y:p.y,quality:82,monthlyCost:15});state.monthlyExpenses+=15;
    }else if(p.kind==='home'){
      const occupants=Math.min(24,Math.max(0,Math.floor((state.jobs-state.population*.42)/3)));
      const residents=Array.from({length:occupants},(_,i)=>({id:`off-${p.id}-${i}`,workerEligible:i<Math.round(occupants*.42),status:'buscando',employerId:null,employerName:null,monthlyWage:0,attendance:0}));
      state.buildings.push({...q,kind:'home',name:'Viviendas nuevas',occupants,capacity:28,residents,householdCash:0,monthlyWageIncome:0});state.population+=occupants;state.monthlyIncome+=occupants*3;
    }else if(p.kind==='shop'){
      const b={...q,kind:'shop',name:'Comercio nuevo',occupants:0};b.business={id:`firm-${p.x}-${p.y}`,name:b.name,status:'abierto',cash:1200,jobSlots:12,inventory:0,price:18,inputCost:5,inputInventory:18,wage:10,productivity:.06,fixedCost:40,lastSales:0,lastLocalSales:0,lastRegionalSales:0,lastLocalDemand:0,lastRevenue:0,lastInputs:0,lastInputUnits:0,lastInputSupplier:'Sin compras',lastInputShortage:0,lastProduction:0,lastPayroll:0,lastProfit:0,lastWorkers:0,lastDemand:0};state.buildings.push(b);state.jobs+=12;state.privateCapital=Math.max(0,state.privateCapital-1200);
      state.buildings.push(b);state.jobs+=12;state.privateCapital=Math.max(0,state.privateCapital-1200);
    }else if(p.kind==='civic'){
      q.monthlyCost=650;state.buildings.push({...q,kind:'civic',name:'Centro de salud',occupants:0});state.monthlyExpenses+=650;state.services=Math.min(100,state.services+8);
    }else if(p.kind==='depot'){
      state.buildings.push({...q,kind:'depot',name:'Depósito municipal',occupants:0,capacityAdded:500});state.monthlyExpenses+=180;state.supply.storageCapacity+=500;state.supply.depots.push({id:`depot-${p.x}-${p.y}`,x:p.x,y:p.y,capacity:500,label:'Depósito municipal',stocks:Object.fromEntries(Object.keys(state.supply.contractors).map(n=>[n,{aggregate:0,steel:0,timber:0,components:0}]))});
    }
    updateOfflineLabor();event(`${p.label} habilitado`,'La obra terminó su inspección y entra en servicio.');
  }
  function advance(){
    const now=Date.now(),elapsed=Math.min(6,(now-last)/1000);last=now;
    if(!state.paused){debtDays+=elapsed*Math.max(1,state.speed||1);const days=Math.floor(debtDays);debtDays-=days;
      for(let d=0;d<days;d++){
        state.day++;
        for(const p of [...(state.projects||[])]){
          if(p.status==='pausada')continue;p.elapsed++;p.progress=Math.min(1,p.elapsed/Math.max(1,p.duration));p.stageIndex=Math.min(p.stages.length-1,Math.floor(p.progress*p.stages.length));
          if(!p.privatePaid&&p.elapsed>1){const installment=Math.min(p.cost-p.paid,Math.ceil(p.cost*.8/Math.max(1,p.duration)));if(state.money>=installment){state.money-=installment;p.paid+=installment;state.supply.contractorCash[p.contractor]+=installment}else{p.status='suspendida';p.cause='Tesorería sin fondos para el certificado';continue}}
          if(p.elapsed>=p.duration){complete(p);state.projects=state.projects.filter(x=>x.id!==p.id)}
        }
        const month=Math.floor((state.day-1)/30);
        receiveMarketDeliveries();
        if(month>(state.lastMonth||0)){
          processOfflineTraining();
          updateOfflineLabor();
          for(const supplier of Object.values(state.supply.market||{}))supplier.stock=Math.min(supplier.maxStock||0,(supplier.stock||0)+(supplier.monthlyOutput||0));
          let wages=0,publicPayroll=0;const payrollByEmployer={};
          for(const h of state.buildings.filter(b=>b.kind==='home')){
            const credits=(h.residents||[]).filter(r=>r.status==='empleado').reduce((sum,r)=>sum+Math.round((r.monthlyWage||0)*(r.attendance??1)),0);
            h.monthlyWageIncome=credits;h.householdCash=(h.householdCash||0)+credits;wages+=credits;
            for(const r of h.residents||[])if(r.status==='empleado')payrollByEmployer[r.employerId]=(payrollByEmployer[r.employerId]||0)+Math.round((r.monthlyWage||0)*(r.attendance??1));
          }
          for(const b of state.buildings){
            if(b.business?.id&&payrollByEmployer[b.business.id]!=null)b.business.lastPayroll=payrollByEmployer[b.business.id];
            if(b.kind==='civic'||b.kind==='depot')publicPayroll+=payrollByEmployer[`public-${b.kind}-${b.x}-${b.y}`]||0;
          }
          for(const w of state.workplaces||[]){const b=state.buildings.find(x=>x.x===w.x&&x.y===w.y);const id=b?.business?.id||`public-${w.kind}-${w.x}-${w.y}`;w.payroll=payrollByEmployer[id]||0}
          state.publicPayroll=publicPayroll;state.effectiveMonthlyExpenses=state.monthlyExpenses+publicPayroll;
          simulateOfflineMarket();updateOfflineLabor();
          state.money=Math.max(0,state.money+(state.grossMonthlyIncome||state.monthlyIncome)-(state.effectiveMonthlyExpenses||state.monthlyExpenses));
          state.lastMonth=month;event('Balance mensual',`La tesorería cerró el mes. Nómina de referencia $ ${wages.toLocaleString('es-AR')}.`);
        }
      }
    }
    save();
  }
  function action(d){
    const a=d.action;
    if(a==='speed'){state.speed=Math.max(1,Math.min(4,+d.value||1));return}
    if(a==='pause'){state.paused=!state.paused;return}
    if(a==='startTrainingProgram'){
      const category=String(d.category||'');if(!TRAINING[category])throw Error('Perfil de formación inválido.');const offer=trainingCatalog().find(x=>x.category===category);if(!offer?.canStart)throw Error(offer?.reason||'El programa no está disponible.');const center=state.buildings.find(b=>b.kind==='civic'&&`civic-${b.x}-${b.y}`===offer.centerId),excluded=new Set((state.trainingPrograms||[]).filter(p=>['active','paused'].includes(p.status)).flatMap(p=>p.traineeIds||[])),cohort=trainingCandidates(category,center,excluded).slice(0,TRAINING_SEATS);if(!cohort.length)throw Error('No hay residentes con esa necesidad de formación y acceso al aula.');const monthlyCost=180+40*cohort.length,totalCost=monthlyCost*TRAINING_MONTHS,reserved=(state.projects||[]).filter(p=>!p.privatePaid).reduce((sum,p)=>sum+Math.max(0,p.cost-(p.paid||0)),0);if(state.money-reserved<totalCost)throw Error(`El curso cuesta $${totalCost.toLocaleString('es-AR')} y los fondos están comprometidos.`);const label=TRAINING[category].label,traineeIds=cohort.map(x=>x.person.id),program={id:`training-${Date.now()}-${category}`,category,label,centerId:offer.centerId,centerName:offer.centerName,status:'active',createdDay:state.day,durationMonths:TRAINING_MONTHS,monthsCompleted:0,seats:cohort.length,traineeIds,traineeProgress:Object.fromEntries(cohort.map(x=>[x.person.id,x.skill])),skillGainPerMonth:TRAINING_GAIN,monthlyCost,cost:totalCost,paid:totalCost,spent:0,remainingBudget:totalCost};state.money-=totalCost;state.trainingPrograms=state.trainingPrograms||[];state.trainingPrograms.push(program);state.trainingPrograms=state.trainingPrograms.slice(-30);event('Programa de formación adjudicado',`Aula municipal · ${label} · ${cohort.length} participantes · ${TRAINING_MONTHS} ciclos · $${totalCost.toLocaleString('es-AR')} prepagados. Empieza en el próximo cierre mensual.`);return;
    }
    if(['pauseTrainingProgram','resumeTrainingProgram','cancelTrainingProgram'].includes(a)){
      const program=(state.trainingPrograms||[]).find(p=>p.id===String(d.id));if(!program)throw Error('El curso ya no está disponible.');
      if(a==='pauseTrainingProgram'){if(program.status!=='active')throw Error('Solo se puede pausar un curso en marcha.');program.status='paused';program.pauseReason='Pausa decidida por el gobierno';event('Curso pausado',`${program.label}: el saldo de $${program.remainingBudget.toLocaleString('es-AR')} queda reservado.`)}
      else if(a==='resumeTrainingProgram'){if(program.status!=='paused')throw Error('El curso no está pausado.');const center=state.buildings.find(b=>b.kind==='civic'&&`civic-${b.x}-${b.y}`===program.centerId),reachable=(state.buildings||[]).some(home=>home.kind==='home'&&(home.residents||[]).some(p=>program.traineeIds.includes(p.id))&&center&&trainingRoadDistance(home,center)!==null);if(!reachable)throw Error('La cohorte todavía no tiene acceso vial al aula.');program.status='active';program.pauseReason=null;event('Curso reanudado',`${program.label} retoma la formación en el próximo cierre mensual.`)}
      else{const refund=Math.max(0,program.remainingBudget||0);state.money+=refund;program.status='cancelled';program.remainingBudget=0;program.cancelledDay=state.day;event('Curso cancelado',`${program.label}: se devolvieron $${refund.toLocaleString('es-AR')} de presupuesto no utilizado.`)}return;
    }
    if(a==='new'){state=clone(seed);state.players={};state.host='offline';event('Nueva partida','Comenzó una ciudad local en este navegador.');save();return}
    if(a==='zone'){
      const {x,y,kind}=d;if(!['home','shop'].includes(kind))throw Error('Uso de suelo inválido.');
      if(!state.roads.some(r=>Math.abs(r[0]-x)+Math.abs(r[1]-y)===1))throw Error('La parcela necesita una calle terminada al lado.');
      if(state.buildings.some(b=>b.x===x&&b.y===y)||state.projects.some(p=>p.x===x&&p.y===y))throw Error('La parcela ya está ocupada.');
      state.zones=state.zones.filter(z=>z.x!==x||z.y!==y);state.zones.push({x,y,kind,owner:'municipal',status:'disponible'});event('Uso de suelo asignado',`Parcela ${x+1},${y+1}: zona ${kind==='home'?'residencial':'comercial'}.`);return;
    }
    if(a==='place'){
      const spec=SPECS[d.kind],c=state.contractors[d.contractor];if(!spec||!c)throw Error('Proyecto o constructora inválidos.');const {x,y}=d;
      if(x<0||y<0||x>=28||y>=20||x>=24||(y<3&&x>18))throw Error('Parcela fuera del terreno edificable.');
      if(state.buildings.some(b=>b.x===x&&b.y===y)||state.projects.some(p=>p.x===x&&p.y===y)||state.roads.some(r=>r[0]===x&&r[1]===y))throw Error('La parcela está ocupada.');
      if(!state.roads.some(r=>Math.abs(r[0]-x)+Math.abs(r[1]-y)===1))throw Error('La parcela necesita acceso a una calle terminada.');
      if(['home','shop'].includes(d.kind)&&!state.zones.some(z=>z.x===x&&z.y===y&&z.kind===d.kind))throw Error('Primero asigná el uso de suelo compatible.');
      const active=state.projects.filter(q=>q.contractor===d.contractor&&q.status!=='pausada'),used=active.reduce((n,q)=>n+q.workersAssigned,0);if(active.length>=c.capacity||used+NEEDS[d.kind]>c.workers)throw Error('La constructora no tiene cuadrilla libre para esta obra.');
      const total=Math.round(spec.cost*c.price),privatePaid=['home','shop'].includes(d.kind),permit=privatePaid?Math.max(50,Math.round(spec.cost*.12)):0,cost=total-permit;
      if(state.money<permit+(privatePaid?0:total*.2))throw Error('No alcanza la tesorería para permisos y anticipo.');
      if(privatePaid&&state.privateCapital<cost)throw Error('Los promotores no tienen capital suficiente.');
      const advance=Math.round(cost*.2),p={id:`off-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,kind:d.kind,label:spec.label,x,y,contractor:d.contractor,cost,duration:Math.round(spec.days*c.days/30),elapsed:0,progress:0,paid:advance,stages:spec.stages,stageIndex:0,status:'contratada',cause:c.profile,workersAssigned:NEEDS[d.kind],materialsRequired:{aggregate:0,steel:0,timber:0,components:0},materialsUsed:{aggregate:0,steel:0,timber:0,components:0},privatePaid,municipalPermitPaid:permit};
      state.money-=permit+(privatePaid?0:advance);if(privatePaid)state.privateCapital-=cost;state.supply.contractorCash[d.contractor]+=advance;state.projects.push(p);event('Contrato adjudicado',`${spec.label} · ${d.contractor} · plazo estimado ${p.duration} días.`);return;
    }
    if(['pauseProject','resumeProject','cancelProject'].includes(a)){
      const p=state.projects.find(x=>x.id===d.id);if(!p)throw Error('La obra ya no está activa.');
      if(a==='pauseProject'){p.status='pausada';p.workersAssigned=0;p.cause='Pausa decidida en modo offline'}
      else if(a==='resumeProject'){p.status='contratada';p.workersAssigned=NEEDS[p.kind];p.cause='Obra reanudada'}
      else{state.projects=state.projects.filter(x=>x.id!==p.id);if(p.progress>0)state.abandoned.push({id:p.id,x:p.x,y:p.y,kind:p.kind,label:p.label,progress:p.progress,spent:p.paid,contractor:p.contractor,stage:p.stages[p.stageIndex],status:'obra inconclusa'});else if(!p.privatePaid)state.money+=p.paid}
      return;
    }
    if(a==='orderMaterials')throw Error('Los pedidos con proveedores y rutas requieren una sala Online con servidor.');
    if(a==='rescue')throw Error('El rescate de obras requiere una sala Online.');
    throw Error(`La acción “${a}” todavía requiere una sala Online.`);
  }
  updateOfflineLabor();save();
  return {async request(path,body){
    if(path==='/api/info')return {ips:[],port:8765};
    if(path==='/api/state'){advance();return view()}
    if(path==='/api/save'){save();return {ok:true,file:'guardado local del navegador'}}
    if(path==='/api/load'){try{state=JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch{state=null}if(!state)throw Error('Todavía no hay una ciudad guardada en este navegador.');return view()}
    if(path==='/api/action'){action(body||{});save();return view()}
    throw Error('Acción no disponible en modo offline.');
  }};
}
