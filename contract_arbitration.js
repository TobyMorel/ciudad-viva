const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function evaluateContractClaim(claim,target,day){
  const cost=Math.max(0,Math.round(Number(target?.cost)||0)),progress=clamp(Number(target?.progress)||0,0,1),paid=Math.max(0,Math.round(Number(target?.paid)||0));
  if(claim==='delay'){
    const deadline=Math.max(0,Math.trunc(Number(target?.contractedDay)||0)+Math.max(1,Math.trunc(Number(target?.duration)||1)));
    const actual=target?.completedDay==null?Math.max(0,Math.trunc(day)):Math.trunc(Number(target.completedDay));
    const lateDays=Math.max(0,actual-deadline),upheld=lateDays>=8&&target?.status!=='cancelada'&&target?.status!=='cancelled';
    return {upheld,lateDays,deadlineDay:deadline,reason:upheld?`La obra excedió el plazo contractual por ${lateDays} días.`:lateDays?`El atraso acreditado fue de ${lateDays} días, por debajo del umbral de ocho.`:'El registro no acredita atraso respecto del plazo firmado.',penalty:upheld?Math.min(Math.round(cost*.12),Math.max(100,Math.round(cost*lateDays/3600))):0};
  }
  if(claim==='certification'){
    const earned=Math.round(cost*(.2+.8*progress)),overpaid=Math.max(0,paid-earned),upheld=overpaid>=Math.max(100,Math.round(cost*.08));
    return {upheld,overpaid,reason:upheld?`Los certificados superan en $${overpaid} el avance físico registrado.`:'Los pagos certificados son consistentes con el avance físico registrado.',penalty:upheld?overpaid:0};
  }
  if(claim==='quality'){
    const quality=Math.max(0,Math.min(100,Math.trunc(Number(target?.assetQuality??target?.quality??100)))),defect=Boolean(target?.warrantyClaim||target?.qualityPenalty>=20||quality<65),upheld=defect;
    return {upheld,assetQuality:quality,reason:upheld?'La inspección o garantía registra un defecto material atribuible a la obra.':'La inspección no acredita una falla estructural o contractual.',penalty:upheld?Math.max(100,Math.min(Math.round(cost*.1),Math.round(cost*(100-quality)/100))):0};
  }
  return {upheld:false,reason:'Tipo de reclamo no reconocido.',penalty:0};
}
