const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function elevationAt(x,y){
  return 18+4.5*Math.sin((x+3)*.12)+3.2*Math.cos((y-4)*.11)+1.5*Math.sin((x+y)*.09);
}

function soilSignal(x,y){
  return (Math.sin(x*.47+y*.19)+Math.cos(y*.42-x*.17)+Math.sin((x+y)*.31))/3;
}

export function geotechnicalSurvey(x,y){
  const elevation=elevationAt(x,y),slope=Math.hypot(elevationAt(x+1,y)-elevationAt(x-1,y),elevationAt(x,y+1)-elevationAt(x,y-1))/2;
  const signal=soilSignal(x,y),soil=signal>.48?'compacto':signal<-.48?'aluvial húmedo':'firme';
  const base=soil==='compacto'?245:soil==='aluvial húmedo'?92:168;
  const bearing=Math.max(55,Math.round(base-slope*18));
  const permeability=soil==='compacto'?8:soil==='aluvial húmedo'?31:17;
  const bankDistance=Math.max(0,Math.abs(x-24.5)-1.5);
  const floodRisk=clamp(Math.round(68-bankDistance*5.3-Math.max(0,elevation-15)*1.2),4,92);
  const slopePct=Math.round(slope/12*10000)/100;
  const settlementRisk=clamp(Math.round((180-bearing)*.42+slope*2.4),2,85);
  const difficulty=clamp((160-bearing)/500+slope/80+(floodRisk>55?(floodRisk-55)/350:0),0,.38);
  return {elevationM:+elevation.toFixed(1),slopePct,soil,foundationBearingKpa:bearing,permeabilityMmHour:permeability,floodRiskPct:floodRisk,settlementRiskPct:settlementRisk,foundationCostFactor:+(1+difficulty).toFixed(3),foundationDaysFactor:+(1+difficulty*.75).toFixed(3),basis:'Modelo geotécnico determinista del terreno de Puerto Claro; la cota se expresa respecto al nivel local del río.'};
}

export function geotechnicalEstimate(x,y){
  const result=geotechnicalSurvey(x,y),uncertainty=Math.max(18,Math.round(result.foundationBearingKpa*.22));
  return {elevationM:{min:+(result.elevationM-1.5).toFixed(1),max:+(result.elevationM+1.5).toFixed(1)},foundationBearingKpa:{min:Math.max(45,result.foundationBearingKpa-uncertainty),max:result.foundationBearingKpa+uncertainty},floodRiskPct:{min:Math.max(0,result.floodRiskPct-18),max:Math.min(100,result.floodRiskPct+18)},confidencePct:52};
}

export function applyFoundationAdjustment(baseCost,baseDays,profile){
  const factor=Number(profile?.foundationCostFactor)||1,days=Number(profile?.foundationDaysFactor)||1;
  return {cost:Math.max(0,Math.round(Math.max(0,Number(baseCost)||0)*factor)),days:Math.max(1,Math.round(Math.max(1,Number(baseDays)||1)*days)),costFactor:factor,daysFactor:days};
}

export function applySurveyHydrology(baseRunoffCoefficient,baseElevationClass,profile){
  const baseline=clamp(Number(baseRunoffCoefficient)||0.78,.65,.99);
  if(!profile)return {runoffCoefficient:baseline,elevationClass:baseElevationClass||'firme',surveyed:false};
  const permeability=clamp(Number(profile.permeabilityMmHour)||17,0,60);
  const floodRisk=clamp(Number(profile.floodRiskPct)||0,0,100);
  const runoffCoefficient=clamp(baseline+(20-permeability)*.004,.65,.99);
  const elevationClass=floodRisk>=65?'bajo':floodRisk>=42?'firme':(baseElevationClass||'firme');
  return {runoffCoefficient:+runoffCoefficient.toFixed(3),elevationClass,surveyed:true,floodRiskPct:floodRisk,permeabilityMmHour:permeability};
}
