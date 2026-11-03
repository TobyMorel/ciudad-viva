// Capacidades relativas por tramo. Los corredores estructurales soportan el doble
// de flujo; el deterioro de la calzada reduce la capacidad disponible.
export const TRAFFIC_TIME_WINDOWS=['early','morningPeak','dayMorning','dayNoon','midday','afternoon','eveningPeak','evening','late'];
export const trafficEdgeKey=(a,b)=>[`${a[0]},${a[1]}`,`${b[0]},${b[1]}`].sort().join('|');

export function trafficQueueStep(queue,demand,capacity){
  const cap=Math.max(.1,Number(capacity)||.1),waiting=Math.max(0,Number(queue)||0),arrivals=Math.max(0,Number(demand)||0);
  const delay=Math.min(120,waiting/cap*120+Math.max(0,arrivals/cap-.82)*35);
  return {queue:Math.max(0,waiting+arrivals-cap),delayMinutes:Math.round(delay*10)/10};
}

export function trafficQueueDelay(route,report,window){
  let total=0;for(let i=0;i<(route||[]).length-1;i++){const segment=report?.segments?.[trafficEdgeKey(route[i],route[i+1])];total+=Number(segment?.windows?.[window]?.delayMinutes)||0}return Math.round(total*10)/10;
}

export function roadCapacity(a,b,roadAssets=[]){
  const arterial=a[1]===10||b[1]===10||a[0]===12||b[0]===12;
  const assets=roadAssets instanceof Map?roadAssets:new Map((roadAssets||[]).map(x=>[`${x.x},${x.y}`,x.quality??82]));
  const quality=Math.min(assets.get(`${a[0]},${a[1]}`)??82,assets.get(`${b[0]},${b[1]}`)??82);
  return (arterial?2.4:1.2)*Math.max(.35,Math.min(1,quality/82));
}

export function applyTrafficQueue(cursors,gap=.5){
  const lanes=new Map();
  for(const cursor of cursors){
    if(!cursor.vehicle||!cursor.laneKey)continue;
    if(!lanes.has(cursor.laneKey))lanes.set(cursor.laneKey,[]);
    lanes.get(cursor.laneKey).push(cursor);
  }
  for(const lane of lanes.values()){
    lane.sort((a,b)=>b.progress-a.progress);
    for(let i=1;i<lane.length;i++){
      const leader=lane[i-1],follower=lane[i];
      follower.progress=Math.min(follower.progress,leader.progress-gap);
      if(follower.progress<0&&(follower.index-follower.direction<0||follower.index-follower.direction>=follower.count))follower.progress=0;
    }
  }
  // Conserva el espacio de seguridad al pasar de un tramo al siguiente del mismo recorrido.
  const routes=new Map();
  for(const cursor of cursors){
    if(!cursor.vehicle||!cursor.routeQueueKey)continue;
    cursor.queueProgress=cursor.direction===1?cursor.index+cursor.progress:cursor.count-cursor.index-1+cursor.progress;
    if(!routes.has(cursor.routeQueueKey))routes.set(cursor.routeQueueKey,[]);
    routes.get(cursor.routeQueueKey).push(cursor);
  }
  for(const route of routes.values()){
    route.sort((a,b)=>b.queueProgress-a.queueProgress);
    for(let i=1;i<route.length;i++){
      const leader=route[i-1],follower=route[i],allowed=leader.queueProgress-gap;
      if(follower.queueProgress>allowed){
        const retreat=follower.queueProgress-allowed;
        follower.progress-=retreat;
        follower.queueProgress=allowed;
        if(follower.progress<0&&(follower.index-follower.direction<0||follower.index-follower.direction>=follower.count)){
          follower.queueProgress-=follower.progress;
          follower.progress=0;
        }
      }
    }
  }
  return cursors;
}
export function trafficFactorForRoute(route,segmentFlow,roads,roadAssets=[]){
  if(!route||route.length<2)return 1;
  const roadSet=roads instanceof Set?roads:new Set((roads||[]).map(([x,y])=>`${x},${y}`));
  const assets=roadAssets instanceof Map?roadAssets:new Map((roadAssets||[]).map(x=>[`${x.x},${x.y}`,x.quality??82]));
  const factors=[];
  for(let i=0;i<route.length-1;i++){
    const a=route[i],b=route[i+1];
    if(!roadSet.has(`${a[0]},${a[1]}`)||!roadSet.has(`${b[0]},${b[1]}`))continue;
    const edge=[`${a[0]},${a[1]}`,`${b[0]},${b[1]}`].sort().join('|');
    const capacity=roadCapacity(a,b,assets),ratio=(segmentFlow.get(edge)||0)/capacity;
    factors.push(1+.35*ratio*ratio+2.4*Math.max(0,ratio-1)**2);
  }
  return factors.length?factors.reduce((n,x)=>n+x,0)/factors.length:1;
}
