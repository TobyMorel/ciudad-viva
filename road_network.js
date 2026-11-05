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
  const from=[Number(origin[0]),Number(origin[1])],target=slot.road,queue=[],previous=new Map(),goals=new Set([`${target[0]},${target[1]}`]);
  for(const [x,y] of [[from[0]+1,from[1]],[from[0]-1,from[1]],[from[0],from[1]+1],[from[0],from[1]-1]]){const id=`${x},${y}`;if(roadSet.has(id)&&!previous.has(id)){previous.set(id,null);queue.push([x,y])}}
  if(roadSet.has(`${from[0]},${from[1]}`)&&!previous.has(`${from[0]},${from[1]}`)){previous.set(`${from[0]},${from[1]}`,null);queue.push(from)}
  if(!queue.length)return [from,[...target]];
  let end=null;
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i],id=`${x},${y}`;if(goals.has(id)){end=id;break}for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const next=`${nx},${ny}`;if(!roadSet.has(next)||previous.has(next))continue;previous.set(next,id);queue.push([nx,ny])}}
  if(!end)return [from,[...target]];const path=[];for(let at=end;at;at=previous.get(at)){const [x,y]=at.split(',').map(Number);path.push([x,y])}path.reverse();if(path[0][0]!==from[0]||path[0][1]!==from[1])path.unshift(from);return path;
}

export function assignParking(state,trips){
  const assets=roadAssetMap(state.roadAssets),roads=state.roads||[],roadSet=new Set(roads.map(([x,y])=>`${x},${y}`)),roadSlots=[];
  for(const [x,y] of roads){const degree=[[1,0],[-1,0],[0,1],[0,-1]].reduce((n,[dx,dy])=>n+Number(roadSet.has(`${x+dx},${y+dy}`)),0),count=roadParkingSpaces(assets.get(`${x},${y}`),degree);for(let index=0;index<count;index++)roadSlots.push({id:`street:${x},${y}:${index}`,kind:'street',road:[x,y],index,x,y})}
  const garages=(state.buildings||[]).filter(b=>b.serviceModel==='parkingGarage'&&['habilitado','operativo'].includes(b.status)),garageSlots=[];
  for(const garage of garages){const adjacent=roads.filter(([x,y])=>Math.abs(x-garage.x)+Math.abs(y-garage.y)===1).sort((a,b)=>Math.abs(a[0]-garage.x)+Math.abs(a[1]-garage.y)-Math.abs(b[0]-garage.x)-Math.abs(b[1]-garage.y)||a[1]-b[1]||a[0]-b[0]),road=adjacent[0];if(!road)continue;for(let index=0;index<Math.max(0,Math.trunc(garage.parkingSpaces||24));index++)garageSlots.push({id:`garage:${garage.x},${garage.y}:${index}`,kind:'garage',road:[...road],index,x:garage.x,y:garage.y,garage})}
  const allSlots=[...roadSlots,...garageSlots],slotsByRoad=new Map(),occupancy=new Map(),garagePeaks=new Map(garages.map(g=>[g,0])),reservations=[];
  for(const slot of allSlots){const id=`${slot.road[0]},${slot.road[1]}`,rows=slotsByRoad.get(id)||[];rows.push(slot);slotsByRoad.set(id,rows)}
  let totalDemand=0,totalAllocated=0,weightedSearch=0,weightedWalk=0,weightedStay=0,weightedCars=0;
  const nearestAvailable=(start,used,count)=>{
    if(!count||used.size>=allSlots.length)return[];
    let frontier=[],distance=1;const visited=new Set(),found=[];
    for(const [x,y] of [[start[0]+1,start[1]],[start[0]-1,start[1]],[start[0],start[1]+1],[start[0],start[1]-1]]){const id=`${x},${y}`;if(roadSet.has(id)&&!visited.has(id)){visited.add(id);frontier.push([x,y])}}
    while(frontier.length&&found.length<count){
      for(const [x,y] of frontier)for(const slot of slotsByRoad.get(`${x},${y}`)||[])if(!used.has(slot.id))found.push({slot,distance});
      if(found.length>=count)break;
      const next=[];for(const [x,y] of frontier)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const id=`${x+dx},${y+dy}`;if(roadSet.has(id)&&!visited.has(id)){visited.add(id);next.push([x+dx,y+dy])}}
      frontier=next;distance++;
    }
    return found.sort((a,b)=>a.distance-b.distance||a.slot.y-b.slot.y||a.slot.x-b.slot.x||a.slot.index-b.slot.index).slice(0,count);
  };
  const allocate=(destination,period,count,trip)=>{
    const used=occupancy.get(period)||new Set(),assigned=nearestAvailable(destination,used,Math.max(0,count));for(const {slot} of assigned){used.add(slot.id);reservations.push({slotId:slot.id,tripKey:`${trip.reason}:${trip.from.join(',')}>${trip.to.join(',')}`,x:slot.x,y:slot.y,index:slot.index,kind:slot.kind,period,status:'reservada'})}occupancy.set(period,used);return assigned.map(({slot,distance})=>({...slot,distance,walkDistance:Math.max(0,distance-1)}));
  };
  const ordered=(trips||[]).filter(t=>t.mode==='auto'&&Math.ceil(Number(t.vehicles)||0)>0&&Array.isArray(t.to)&&Array.isArray(t.from));
  const usedReturns=new Set();
  for(const trip of ordered){
    if(trip.reason==='regreso'&&usedReturns.has(trip))continue;
    const demand=Math.max(1,Math.ceil(Number(trip.vehicles)||0)),window=trip.departureWindowKey||'midday',isWork=trip.reason==='trabajo';
    const back=isWork?ordered.find(t=>t.reason==='regreso'&&!usedReturns.has(t)&&t.from?.[0]===trip.to?.[0]&&t.from?.[1]===trip.to?.[1]&&t.to?.[0]===trip.from?.[0]&&t.to?.[1]===trip.from?.[1]):null;
    const endWindow=trip.returnWindowKey||back?.departureWindowKey||'eveningPeak',destinationPeriod=isWork?'workday':`visit:${window}`,homePeriod=`home:${endWindow}`;
    const destinations=allocate(trip.to.map(Number),destinationPeriod,demand,trip),first=destinations[0]||null,origins=first?allocate(trip.from.map(Number),homePeriod,destinations.length,trip):[],origin=origins[0]||null;
    const allocated=destinations.length,shortfall=Math.max(0,demand-allocated),searchMinutes=shortfall?Math.min(30,5+Math.ceil(shortfall/Math.max(1,demand)*20)):first?Math.round(first.distance*.35):0,walk=first?.walkDistance||0,stay=isWork?600:Math.max(60,Number(trip.parkingStayMinutes)||150);
    let driveRoute=[];if(first){driveRoute=pathToRoad(origin?.road||trip.from,first,roads,roadSet);if(back){const returnShortfall=Math.max(0,destinations.length-origins.length);usedReturns.add(back);back.parkingSlot=origin;back.parkingSlots=origins.slice(0,12);back.parkingOriginSlot=first;back.parkingWalkDistance=origin?.walkDistance||0;back.parkingRoute=[...driveRoute].reverse();back.parkingSearching=returnShortfall>0;back.parkingSearchMinutes=returnShortfall?Math.min(30,5+Math.ceil(returnShortfall/Math.max(1,destinations.length)*20)):0;back.parkingSpacesUsed=origins.length;back.parkingAssignedVehicles=origins.length;back.parkingShortfall=returnShortfall;back.parkingStayMinutes=stay;back.parkingCapacity=allSlots.length}}
    else if(back){back.parkingSlot=null;back.parkingSlots=[];back.parkingOriginSlot=null;back.parkingRoute=[];back.parkingWalkDistance=0;back.parkingAssignedVehicles=0;back.parkingSearching=true;back.parkingSearchMinutes=searchMinutes;back.parkingSpacesUsed=0;back.parkingShortfall=demand;back.parkingStayMinutes=stay;back.parkingCapacity=allSlots.length}
    Object.assign(trip,{parkingSlot:first,parkingSlots:destinations.slice(0,12),parkingOriginSlot:origin,parkingOriginSlots:origins.slice(0,12),parkingRoute:driveRoute,parkingWalkDistance:walk,parkingAssignedVehicles:allocated,parkingSearchMinutes:searchMinutes,parkingSearching:shortfall>0,parkingSpacesUsed:allocated,parkingShortfall:shortfall,parkingMinutes:2+searchMinutes,parkingStayMinutes:stay,parkingCapacity:allSlots.length});
    trip.estimatedMinutes=(Number(trip.estimatedMinutes)||0)+searchMinutes;trip.trafficFactor=(Number(trip.trafficFactor)||1)+searchMinutes/10;
    totalDemand+=demand;totalAllocated+=allocated;weightedSearch+=searchMinutes*demand;weightedWalk+=walk*demand;weightedStay+=stay*demand;weightedCars+=demand;
    if(back)usedReturns.add(back);
  }
  const periods=[...occupancy.values()],peakOccupied=Math.max(0,...periods.map(set=>set.size));let municipalOccupied=0,monthlyFee=0;
  for(const garage of garages){const occupied=Math.min(Math.trunc(garage.parkingSpaces||24),Math.max(0,...periods.map(set=>[...set].filter(id=>id.startsWith(`garage:${garage.x},${garage.y}:`)).length))),fee=Math.max(0,Number(garage.dailyFee)||5);garagePeaks.set(garage,occupied);municipalOccupied+=occupied;monthlyFee+=occupied*fee*30;garage.parkingOccupied=occupied;garage.parkingRevenue=occupied*fee*30}
  const report={demand:totalDemand,capacity:allSlots.length,occupied:Math.min(allSlots.length,peakOccupied),free:Math.max(0,allSlots.length-peakOccupied),shortfall:Math.max(0,totalDemand-totalAllocated),averageSearchMinutes:weightedCars?+(weightedSearch/weightedCars).toFixed(1):0,averageWalkDistance:weightedCars?+(weightedWalk/weightedCars).toFixed(1):0,averageStayMinutes:weightedCars?+(weightedStay/weightedCars).toFixed(0):0,municipalCapacity:garageSlots.length,municipalOccupied,monthlyFee,garages:garages.map(g=>({x:g.x,y:g.y,capacity:g.parkingSpaces||24,occupied:g.parkingOccupied||0,feePerDay:g.dailyFee||5})),reservations};state.traffic=state.traffic||{};state.traffic.parking=report;return report;
}
