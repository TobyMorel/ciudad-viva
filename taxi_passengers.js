// Asigna viajes existentes de compras/servicios a taxis; no duplica demanda ni autos.
export const TAXI_DAILY_CAPACITY = 8;
export function assignTaxiPassengers(state,trips){
  const roads=new Set((state.roads||[]).map(p=>p.join(','))),depots=new Set((state.buildings||[]).filter(b=>b.kind==='depot'&&b.serviceModel==='taxiYard'&&['habilitado','operativo'].includes(b.status)).map(b=>[b.x,b.y].join(','))),day=Math.max(1,Math.trunc(state.day||1)),month=Math.floor((day-1)/30);
  for(const trip of trips){delete trip.taxiRiders;delete trip.taxiRouteIds}
  let activeVehicles=0,vehicleEmissionsKg=0,dailyRiders=0;const activeRoutes=[];
  for(const taxi of [...(state.taxiRoutes||[])].sort((a,b)=>String(a.id||'').localeCompare(String(b.id||'')))){
    if(taxi.fareMonth!==month){taxi.fareMonth=month;taxi.fareByDay={}}
    const history=taxi.fareByDay||(taxi.fareByDay={}),path=taxi.route||[],stops=(taxi.stops||[]).map(s=>s.at);
    const connected=path.length>=2&&depots.has([taxi.depotX,taxi.depotY].join(','))&&path.every(p=>Array.isArray(p)&&p.length===2&&roads.has(p.join(',')))&&path.slice(1).every((p,i)=>Math.abs(p[0]-path[i][0])+Math.abs(p[1]-path[i][1])===1)&&stops.length>=2&&stops.every(p=>Array.isArray(p)&&p.length===2&&roads.has(p.join(','))&&path.some(q=>q[0]===p[0]&&q[1]===p[1]));
    const serving=taxi.status==='active'&&taxi.operational&&connected;let riders=0;
    if(serving){
      activeVehicles++;vehicleEmissionsKg+=(path.length-1)*.18*2;activeRoutes.push(path);
      for(const trip of trips){
        if(riders>=TAXI_DAILY_CAPACITY)break;
        if(!['compras','servicios'].includes(trip.reason)||trip.mode!=='auto'||(trip.distance||0)<4||(trip.workers||0)<=(trip.taxiRiders||0))continue;
        const origin=trip.from||[],destination=trip.to||[];
        const matched=stops.some((a,i)=>Math.abs(a[0]-origin[0])+Math.abs(a[1]-origin[1])<=1&&stops.some((b,j)=>i!==j&&Math.abs(b[0]-destination[0])+Math.abs(b[1]-destination[1])<=1));
        if(!matched)continue;
        const count=Math.min(TAXI_DAILY_CAPACITY-riders,trip.workers-(trip.taxiRiders||0));
        if(count<=0)continue;
        riders+=count;trip.taxiRiders=(trip.taxiRiders||0)+count;(trip.taxiRouteIds||(trip.taxiRouteIds=[])).push(taxi.id);
        const other=Math.max(0,trip.workers-trip.taxiRiders);trip.vehicles=Math.ceil(other/1.4);trip.dailyEmissionsKg=Math.round(trip.vehicles*trip.distance*.18*2*100)/100;
      }
    }
    history[String(day)]=riders;taxi.dailyRiders=riders;dailyRiders+=riders;
    const fare=Math.max(0,Math.min(3,Number(taxi.fare??.45)||0));
    taxi.monthlyFareRevenue=Math.floor(Object.values(history).reduce((n,v)=>n+v,0)*fare+.5);
    taxi.forecastMonthlyFareRevenue=Math.floor(riders*30*fare+.5);
    taxi.pauseReason=taxi.status==='active'&&taxi.operational&&!connected?'El circuito no conecta las paradas con el depósito.':null;
  }
  return{activeVehicles,vehicleEmissionsKg:Math.round(vehicleEmissionsKg*100)/100,activeRoutes,dailyRiders};
}
