export const MINUTES_PER_DAY=1440;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const smoothstep=value=>{const t=clamp(value,0,1);return t*t*(3-2*t)};

export function formatGameTime(minutes){
  const value=((Math.floor(Number(minutes)||0)%MINUTES_PER_DAY)+MINUTES_PER_DAY)%MINUTES_PER_DAY;
  return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
}

export function isNight(minutes){const value=((Number(minutes)||0)%MINUTES_PER_DAY+MINUTES_PER_DAY)%MINUTES_PER_DAY;return value<330||value>=1200}

export function daylightIntensity(minutes){
  const value=((Number(minutes)||0)%MINUTES_PER_DAY+MINUTES_PER_DAY)%MINUTES_PER_DAY;
  const dawn=smoothstep((value-300)/120),dusk=1-smoothstep((value-1080)/120);
  return Math.min(dawn,dusk);
}

export function trafficWindowAt(minutes){
  const hour=(((Number(minutes)||0)%MINUTES_PER_DAY+MINUTES_PER_DAY)%MINUTES_PER_DAY)/60;
  if(hour>=5&&hour<7)return 'early';if(hour>=7&&hour<9)return 'morningPeak';if(hour>=9&&hour<11)return 'dayMorning';if(hour>=11&&hour<13)return 'dayNoon';if(hour>=13&&hour<15)return 'midday';if(hour>=15&&hour<17)return 'afternoon';if(hour>=17&&hour<19)return 'eveningPeak';if(hour>=19&&hour<21)return 'evening';if(hour>=21&&hour<23)return 'late';return 'night';
}

export function trafficWindowLabel(key){return({early:'Mañana temprana',morningPeak:'Pico de mañana',dayMorning:'Mañana',dayNoon:'Mediodía',midday:'Primera tarde',afternoon:'Tarde',eveningPeak:'Pico de tarde',evening:'Noche',late:'Noche tardía',night:'Madrugada'})[key]||'—'}
