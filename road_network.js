export const ROAD_TYPES={
  local:{label:'Calle local',cost:1200,maintenance:15,capacity:1.2,speed:1,parking:2,access:true,lanes:1},
  avenue:{label:'Avenida',cost:3200,maintenance:36,capacity:2.7,speed:1.28,parking:0,access:true,lanes:2},
  route:{label:'Ruta regional',cost:2500,maintenance:28,capacity:2.2,speed:1.58,parking:0,access:false,lanes:1},
  highway:{label:'Autopista',cost:4800,maintenance:52,capacity:4.6,speed:2.12,parking:0,access:false,lanes:2}
};
export const roadTypeInfo=type=>ROAD_TYPES[type]||ROAD_TYPES.local;
export const roadAssetMap=assets=>new Map((assets||[]).map(asset=>[`${asset.x},${asset.y}`,asset]));
export const roadParkingSpaces=(asset,degree=2)=>roadTypeInfo(asset?.roadType).parking*(degree>=3?0:1);

export function assignParking(state,trips){
  const assets=roadAssetMap(state.roadAssets),roads=state.roads||[],garages=(state.buildings||[]).filter(building=>building.serviceModel==='parkingGarage'&&['habilitado','operativo'].includes(building.status));
  const destinations=new Map(),groups=new Map();
  for(const trip of trips||[]){
    if(trip.mode!=='auto'||!Number(trip.vehicles)||!Array.isArray(trip.to)||trip.reason==='regreso')continue;
    const x=Number(trip.to[0]),y=Number(trip.to[1]),window=trip.departureWindowKey||'midday',destination=x+','+y,id=destination+':'+window;
    const row=groups.get(id)||{id,destination,x,y,window,demand:0,trips:[]};
    row.demand+=Math.max(0,Math.ceil(Number(trip.vehicles)||0));row.trips.push(trip);groups.set(id,row);destinations.set(destination,{x,y});
  }
  const rows=[...groups.values()],roadPools=[],roadPoolByKey=new Map(),roadSet=new Set(roads.map(([x,y])=>x+','+y));
  for(const [x,y] of roads){
    const degree=[[1,0],[-1,0],[0,1],[0,-1]].reduce((n,[dx,dy])=>n+Number(roadSet.has((x+dx)+','+(y+dy))),0),spaces=roadParkingSpaces(assets.get(x+','+y),degree);
    if(spaces>0){const pool={x,y,spaces};roadPools.push(pool);roadPoolByKey.set(x+','+y,pool)}
  }
  for(const garage of garages){
    const candidates=[...destinations.entries()].map(([id,point])=>({id,...point,distance:Math.abs(point.x-garage.x)+Math.abs(point.y-garage.y)})).filter(row=>row.distance<=4).sort((a,b)=>a.distance-b.distance||a.y-b.y||a.x-b.x||a.id.localeCompare(b.id));
    garage.parkingDestination=candidates[0]?.id||null;
  }
  const windows=[...new Set(rows.map(row=>row.window))],garagePeaks=new Map(garages.map(garage=>[garage,0]));let peakDemand=0,peakOccupied=0,peakShortfall=0;
  for(const window of windows){
    const streetRemaining=new Map(roadPools.map(pool=>[pool.x+','+pool.y,pool.spaces])),garageRemaining=new Map(garages.map(garage=>[garage,Math.max(0,Math.trunc(garage.parkingSpaces||24))]));
    const windowRows=rows.filter(row=>row.window===window).sort((a,b)=>a.y-b.y||a.x-b.x),stats={demand:0,occupied:0,shortfall:0};
    for(const row of windowRows){
      let remaining=row.demand,streetUsed=0,garageUsed=0;
      const streetCandidates=[[row.x,row.y],[row.x+1,row.y],[row.x-1,row.y],[row.x,row.y+1],[row.x,row.y-1]].map(([x,y])=>roadPoolByKey.get(x+','+y)).filter(pool=>pool&&(streetRemaining.get(pool.x+','+pool.y)||0)>0).map(pool=>({...pool,distance:Math.abs(pool.x-row.x)+Math.abs(pool.y-row.y)})).sort((a,b)=>a.distance-b.distance||a.y-b.y||a.x-b.x);
      for(const pool of streetCandidates){if(!remaining)break;const key=pool.x+','+pool.y,used=Math.min(remaining,streetRemaining.get(key)||0);streetRemaining.set(key,(streetRemaining.get(key)||0)-used);streetUsed+=used;remaining-=used}
      const garageCandidates=garages.filter(garage=>garage.parkingDestination===row.destination&&Math.abs(garage.x-row.x)+Math.abs(garage.y-row.y)<=4).sort((a,b)=>Math.abs(a.x-row.x)+Math.abs(a.y-row.y)-Math.abs(b.x-row.x)-Math.abs(b.y-row.y)||a.y-b.y||a.x-b.x);
      for(const garage of garageCandidates){if(!remaining)break;const used=Math.min(remaining,garageRemaining.get(garage)||0);garageRemaining.set(garage,(garageRemaining.get(garage)||0)-used);garageUsed+=used;remaining-=used}
      const occupied=streetUsed+garageUsed,shortfall=Math.max(0,row.demand-occupied),potential=[[row.x,row.y],[row.x+1,row.y],[row.x-1,row.y],[row.x,row.y+1],[row.x,row.y-1]].reduce((n,[x,y])=>n+(roadPoolByKey.get(x+','+y)?.spaces||0),0)+garageCandidates.reduce((n,garage)=>n+Math.max(0,Math.trunc(garage.parkingSpaces||24)),0),search=Math.min(18,shortfall?2+Math.ceil(shortfall/Math.max(1,potential)*8):0);
      let tripSpaces=occupied;
      for(const trip of row.trips){const used=Math.min(Math.ceil(Number(trip.vehicles)||0),tripSpaces);tripSpaces-=used;Object.assign(trip,{parkingCapacity:potential,parkingSpacesUsed:used,parkingShortfall:shortfall,parkingMinutes:2+search,estimatedMinutes:(Number(trip.estimatedMinutes)||0)+search,trafficFactor:(Number(trip.trafficFactor)||1)+search/10})}
      for(const garage of garageCandidates){const used=Math.max(0,Math.trunc(garage.parkingSpaces||24))-(garageRemaining.get(garage)||0);garagePeaks.set(garage,Math.max(garagePeaks.get(garage)||0,used))}
      stats.demand+=row.demand;stats.occupied+=occupied;stats.shortfall+=shortfall;
    }
    peakDemand=Math.max(peakDemand,stats.demand);peakOccupied=Math.max(peakOccupied,stats.occupied);peakShortfall=Math.max(peakShortfall,stats.shortfall);
  }
  let municipalOccupied=0,monthlyFee=0;
  for(const garage of garages){const occupied=garagePeaks.get(garage)||0,fee=Math.max(0,Number(garage.dailyFee)||5);municipalOccupied+=occupied;monthlyFee+=occupied*fee*30;garage.parkingOccupied=occupied;garage.parkingRevenue=occupied*fee*30}
  const report={demand:peakDemand,capacity:roadPools.reduce((n,pool)=>n+pool.spaces,0)+garages.reduce((n,garage)=>n+Math.max(0,Math.trunc(garage.parkingSpaces||24)),0),occupied:peakOccupied,shortfall:peakShortfall,municipalCapacity:garages.reduce((n,garage)=>n+Math.max(0,Math.trunc(garage.parkingSpaces||24)),0),municipalOccupied,monthlyFee,garages:garages.map(garage=>({x:garage.x,y:garage.y,capacity:garage.parkingSpaces||24,occupied:garage.parkingOccupied||0,feePerDay:garage.dailyFee||5}))};
  state.traffic=state.traffic||{};state.traffic.parking=report;return report;
}
