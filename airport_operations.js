const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function airportWeatherAdjustment(plannedPassengers,stormDays=0){
  const planned=Math.max(0,Math.trunc(Number(plannedPassengers)||0));
  const disruptions=clamp(Math.trunc(Number(stormDays)||0),0,30);
  const impactPct=Math.min(30,disruptions*6);
  const passengers=Math.max(0,Math.floor(planned*(1-impactPct/100)));
  return {plannedPassengers:planned,passengers,disruptedPassengers:planned-passengers,impactPct,delayHours:disruptions?Math.min(18,disruptions*2):0};
}

export function tourismSeason(day){
  const dayOfYear=((Math.max(1,Math.trunc(Number(day)||1))-1)%360)+1;
  const index=Math.floor((dayOfYear-1)/90),rows=[
    {name:'Verano',visitorFactor:1.2},
    {name:'Otoño',visitorFactor:1.02},
    {name:'Invierno',visitorFactor:.82},
    {name:'Primavera',visitorFactor:1.08}
  ];
  return {dayOfYear,...rows[index]};
}

export function airportNoiseSource(monthlyFlights){
  const flights=clamp(Math.trunc(Number(monthlyFlights)||0),0,1000);
  return {monthlyFlights:flights,air:flights*.045,noise:flights*.62};
}
