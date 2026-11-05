export const ROAD_TYPES={
  local:{label:'Calle local',cost:1200,maintenance:15,capacity:1.2,speed:1,parking:2,access:true,lanes:1},
  avenue:{label:'Avenida',cost:3200,maintenance:36,capacity:2.7,speed:1.28,parking:0,access:true,lanes:2},
  route:{label:'Ruta regional',cost:2500,maintenance:28,capacity:2.2,speed:1.58,parking:0,access:false,lanes:1},
  highway:{label:'Autopista',cost:4800,maintenance:52,capacity:4.6,speed:2.12,parking:0,access:false,lanes:2}
};
export const roadTypeInfo=type=>ROAD_TYPES[type]||ROAD_TYPES.local;
export const roadAssetMap=assets=>new Map((assets||[]).map(asset=>[`${asset.x},${asset.y}`,asset]));
export const roadParkingSpaces=(asset,degree=2)=>roadTypeInfo(asset?.roadType).parking*(degree>=3?0:1);

function pathToRoad(origin,slot,roads,roadSet){
  const point=value=>Array.isArray(value)?value:value?.road;
  const from=point(origin),to=point(slot);if(!Array.isArray(from)||!Array.isArray(to))return[];
  const neighbors=([x,y])=>[[x,y],[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
  const starts=(origin?.road?[from]:neighbors(from)).filter(([x,y])=>roadSet.has(`${x},${y}`));
  const goals=new Set((slot?.road?[to]:neighbors(to)).filter(([x,y])=>roadSet.has(`${x},${y}`)).map(([x,y])=>`${x},${y}`));
  if(!starts.length||!goals.size)return[];
  const queue=[],previous=new Map();for(const [x,y] of starts){const id=`${x},${y}`;if(previous.has(id))continue;previous.set(id,null);queue.push([x,y])}
  let end=null;
  for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i],id=`${x},${y}`;if(goals.has(id)){end=id;break}
    for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const next=`${nx},${ny}`;if(!roadSet.has(next)||previous.has(next))continue;previous.set(next,id);queue.push([nx,ny])}
  }
  if(!end)return[];const path=[];for(let at=end;at;at=previous.get(at)){const [x,y]=at.split(',').map(Number);path.push([x,y])}return path.reverse();
}

export function assignParking(state,trips){
  const assets=roadAssetMap(state.roadAssets),roads=(state.roads||[]).filter(([x,y])=>{const asset=assets.get(`${x},${y}`);return (asset?.quality??82)>=25&&!asset?.accidentClosed}),roadSet=new Set(roads.map(([x,y])=>`${x},${y}`)),roadSlots=[];
  const componentByRoad=new Map();let componentId=0;
  for(const [x,y] of roads){const start=`${x},${y}`;if(componentByRoad.has(start))continue;const queue=[[x,y]];componentByRoad.set(start,componentId);for(let i=0;i<queue.length;i++){const [cx,cy]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy,id=`${nx},${ny}`;if(!roadSet.has(id)||componentByRoad.has(id))continue;componentByRoad.set(id,componentId);queue.push([nx,ny])}}componentId++}
  const connectedComponents=([x,y])=>new Set([[x,y],[x+1,y],[x-1,y],[x,y+1],[x,y-1]].map(([rx,ry])=>componentByRoad.get(`${rx},${ry}`)).filter(id=>id!==undefined));
  for(const [x,y] of roads){const n=roadSet.has(`${x},${y-1}`),s=roadSet.has(`${x},${y+1}`),e=roadSet.has(`${x+1},${y}`),w=roadSet.has(`${x-1},${y}`),degree=Number(n)+Number(s)+Number(e)+Number(w),straight=degree===2&&(n&&s||e&&w),count=straight?roadParkingSpaces(assets.get(`${x},${y}`),degree):0;for(let index=0;index<count;index++)roadSlots.push({id:`street:${x},${y}:${index}`,kind:'street',road:[x,y],index,x,y})}
  const garages=(state.buildings||[]).filter(b=>b.serviceModel==='parkingGarage'&&['habilitado','operativo'].includes(b.status)),garageSlots=[];
  for(const garage of garages){const adjacent=roads.filter(([x,y])=>Math.abs(x-garage.x)+Math.abs(y-garage.y)===1).sort((a,b)=>Math.abs(a[0]-garage.x)+Math.abs(a[1]-garage.y)-Math.abs(b[0]-garage.x)-Math.abs(b[1]-garage.y)||a[1]-b[1]||a[0]-b[0]),road=adjacent[0];if(!road)continue;for(let index=0;index<Math.max(0,Math.trunc(garage.parkingSpaces||24));index++)garageSlots.push({id:`garage:${garage.x},${garage.y}:${index}`,kind:'garage',road:[...road],index,x:garage.x,y:garage.y,garage})}
  const allSlots=[...roadSlots,...garageSlots],slotsByRoad=new Map(),occupancy=new Map(),garagePeaks=new Map(garages.map(g=>[g,0])),reservations=[];
  for(const slot of allSlots){const id=`${slot.road[0]},${slot.road[1]}`,rows=slotsByRoad.get(id)||[];rows.push(slot);slotsByRoad.set(id,rows)}
  let totalDemand=0,totalAllocated=0,weightedSearch=0,weightedWalk=0,weightedStay=0,weightedCars=0;
  const nearestAvailable=(start,used,count,allowedComponents)=>{
    if(!count||used.size>=allSlots.length||!allowedComponents.size)return[];
    let frontier=[],distance=1;const visited=new Set(),found=[];
    for(const [x,y] of [[start[0],start[1]],[start[0]+1,start[1]],[start[0]-1,start[1]],[start[0],start[1]+1],[start[0],start[1]-1]]){const id=`${x},${y}`;if(roadSet.has(id)&&allowedComponents.has(componentByRoad.get(id))&&!visited.has(id)){visited.add(id);frontier.push([x,y])}}
    while(frontier.length&&found.length<count){
      for(const [x,y] of frontier)for(const slot of slotsByRoad.get(`${x},${y}`)||[])if(!used.has(slot.id))found.push({slot,distance});
      if(found.length>=count)break;
      const next=[];for(const [x,y] of frontier)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const id=`${x+dx},${y+dy}`;if(roadSet.has(id)&&allowedComponents.has(componentByRoad.get(id))&&!visited.has(id)){visited.add(id);next.push([x+dx,y+dy])}}
      frontier=next;distance++;
    }
    return found.sort((a,b)=>a.distance-b.distance||a.slot.y-b.slot.y||a.slot.x-b.slot.x||a.slot.index-b.slot.index).slice(0,count);
  };
  const allocate=(destination,period,count,trip,allowedComponents)=>{
    const used=occupancy.get(period)||new Set(),assigned=nearestAvailable(destination,used,Math.max(0,count),allowedComponents);for(const {slot} of assigned){used.add(slot.id);reservations.push({slotId:slot.id,tripKey:`${trip.reason}:${trip.from.join(',')}>${trip.to.join(',')}`,x:slot.x,y:slot.y,index:slot.index,kind:slot.kind,period,status:'reservada'})}occupancy.set(period,used);return assigned.map(({slot,distance})=>({...slot,distance,walkDistance:Math.max(0,distance-1)}));
  };
  const ordered=(trips||[]).filter(t=>t.mode==='auto'&&Math.ceil(Number(t.vehicles)||0)>0&&Array.isArray(t.to)&&Array.isArray(t.from));
  const usedReturns=new Set();
  for(const trip of ordered){
    if(trip.reason==='regreso'&&usedReturns.has(trip))continue;
    const demand=Math.max(1,Math.ceil(Number(trip.vehicles)||0)),window=trip.departureWindowKey||'midday',isWork=trip.reason==='trabajo';
    const back=isWork?ordered.find(t=>t.reason==='regreso'&&!usedReturns.has(t)&&t.from?.[0]===trip.to?.[0]&&t.from?.[1]===trip.to?.[1]&&t.to?.[0]===trip.from?.[0]&&t.to?.[1]===trip.from?.[1]):null;
    const endWindow=trip.returnWindowKey||back?.departureWindowKey||'eveningPeak',destinationPeriod=isWork?'workday':`visit:${window}`,homePeriod=`home:${endWindow}`;
    const allowedComponents=connectedComponents(trip.from.map(Number)),destinations=allocate(trip.to.map(Number),destinationPeriod,demand,trip,allowedComponents),first=destinations[0]||null,origins=first?allocate(trip.from.map(Number),homePeriod,destinations.length,trip,allowedComponents):[],origin=origins[0]||null;
    const allocated=destinations.length,shortfall=Math.max(0,demand-allocated),searchMinutes=shortfall?Math.min(30,5+Math.ceil(shortfall/Math.max(1,demand)*20)):first?Math.round(first.distance*.35):0,walk=first?.walkDistance||0,stay=isWork?600:Math.max(60,Number(trip.parkingStayMinutes)||150);
    const visibleDestinations=destinations.slice(0,12),visibleOrigins=origins.slice(0,12),parkingRoutes=visibleDestinations.map((slot,index)=>pathToRoad(visibleOrigins[index]||trip.from,slot,roads,roadSet)),parkingWalkRoutes=visibleDestinations.map(slot=>pathToRoad(trip.to,slot,roads,roadSet));
    let searchRoute=pathToRoad(trip.from,trip.to,roads,roadSet);if(searchRoute.length===1){const [x,y]=searchRoute[0],neighbor=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].find(([nx,ny])=>roadSet.has(`${nx},${ny}`));if(neighbor)searchRoute=[searchRoute[0],neighbor,searchRoute[0]]}
    const driveRoute=parkingRoutes[0]||searchRoute;
    if(back){const returnShortfall=Math.max(0,demand-origins.length),returnRoutes=visibleOrigins.map((slot,index)=>parkingRoutes[index]?.slice().reverse()||pathToRoad(trip.to,slot,roads,roadSet));usedReturns.add(back);Object.assign(back,{parkingSlot:origin,parkingSlots:visibleOrigins,parkingOriginSlot:first,parkingOriginSlots:visibleDestinations,parkingRoute:returnRoutes[0]||searchRoute.slice().reverse(),parkingRoutes:returnRoutes,parkingSearchRoute:searchRoute.slice().reverse(),parkingWalkRoutes:visibleOrigins.map(slot=>pathToRoad(back.to,slot,roads,roadSet)),parkingWalkDistance:origin?.walkDistance||0,parkingSearching:returnShortfall>0,parkingSearchMinutes:returnShortfall?Math.min(30,5+Math.ceil(returnShortfall/Math.max(1,demand)*20)):0,parkingSpacesUsed:origins.length,parkingAssignedVehicles:origins.length,parkingShortfall:returnShortfall,parkingStayMinutes:stay,parkingCapacity:allSlots.length})}
    Object.assign(trip,{parkingSlot:first,parkingSlots:visibleDestinations,parkingOriginSlot:origin,parkingOriginSlots:visibleOrigins,parkingRoute:driveRoute,parkingRoutes,parkingSearchRoute:searchRoute,parkingWalkRoutes,parkingWalkDistance:walk,parkingAssignedVehicles:allocated,parkingSearchMinutes:searchMinutes,parkingSearching:shortfall>0,parkingSpacesUsed:allocated,parkingShortfall:shortfall,parkingMinutes:2+searchMinutes,parkingStayMinutes:stay,parkingCapacity:allSlots.length});
    trip.estimatedMinutes=(Number(trip.estimatedMinutes)||0)+searchMinutes;trip.trafficFactor=(Number(trip.trafficFactor)||1)+searchMinutes/10;
    totalDemand+=demand;totalAllocated+=allocated;weightedSearch+=destinations.reduce((sum,slot)=>sum+Math.round(slot.distance*.35),0)+shortfall*searchMinutes;weightedWalk+=destinations.reduce((sum,slot)=>sum+slot.walkDistance,0);weightedStay+=stay*allocated;weightedCars+=demand;
    if(back)usedReturns.add(back);
  }
  const periods=[...occupancy.values()],peakOccupied=Math.max(0,...periods.map(set=>set.size));let municipalOccupied=0,monthlyFee=0;
  for(const garage of garages){const occupied=Math.min(Math.trunc(garage.parkingSpaces||24),Math.max(0,...periods.map(set=>[...set].filter(id=>id.startsWith(`garage:${garage.x},${garage.y}:`)).length))),fee=Math.max(0,Number(garage.dailyFee)||5);garagePeaks.set(garage,occupied);municipalOccupied+=occupied;monthlyFee+=occupied*fee*30;garage.parkingOccupied=occupied;garage.parkingRevenue=occupied*fee*30}
  const report={demand:totalDemand,capacity:allSlots.length,occupied:Math.min(allSlots.length,peakOccupied),free:Math.max(0,allSlots.length-peakOccupied),shortfall:Math.max(0,totalDemand-totalAllocated),averageSearchMinutes:weightedCars?+(weightedSearch/weightedCars).toFixed(1):0,averageWalkDistance:totalAllocated?+(weightedWalk/totalAllocated).toFixed(1):0,averageStayMinutes:totalAllocated?+(weightedStay/totalAllocated).toFixed(0):0,municipalCapacity:garageSlots.length,municipalOccupied,monthlyFee,garages:garages.map(g=>({x:g.x,y:g.y,capacity:g.parkingSpaces||24,occupied:g.parkingOccupied||0,feePerDay:g.dailyFee||5})),reservations};state.traffic=state.traffic||{};state.traffic.parking=report;return report;
}
