// Capacidades relativas por tramo. Los corredores estructurales soportan el doble
// de flujo; el deterioro de la calzada reduce la capacidad disponible.
export function roadCapacity(a,b,roadAssets=[]){
  const arterial=a[1]===10||b[1]===10||a[0]===12||b[0]===12;
  const assets=roadAssets instanceof Map?roadAssets:new Map((roadAssets||[]).map(x=>[`${x.x},${x.y}`,x.quality??82]));
  const quality=Math.min(assets.get(`${a[0]},${a[1]}`)??82,assets.get(`${b[0]},${b[1]}`)??82);
  return (arterial?2.4:1.2)*Math.max(.35,Math.min(1,quality/82));
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
