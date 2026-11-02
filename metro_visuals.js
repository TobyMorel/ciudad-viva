// Proyección visual del subte: no altera la simulación ni la disponibilidad de trenes.
const validPoint = p => Array.isArray(p) && p.length === 2 && p.every(Number.isInteger);
const samePoint = (a,b) => a[0] === b[0] && a[1] === b[1];

export function metroVisualPlan(line) {
  if (!line || line.mode==='elevated' || !['building','active','paused'].includes(line.status)) return null;
  if (!Array.isArray(line.route) || line.route.length < 2 || !line.route.every(validPoint)) return null;
  if (!Array.isArray(line.stations) || line.stations.length !== 2 || !line.stations.every(validPoint)) return null;
  if (!samePoint(line.route[0],line.stations[0]) || !samePoint(line.route.at(-1),line.stations[1])) return null;
  if (samePoint(line.stations[0],line.stations[1])) return null;
  if (line.route.some((p,i) => i > 0 && Math.abs(p[0]-line.route[i-1][0]) + Math.abs(p[1]-line.route[i-1][1]) !== 1)) return null;

  const completed = line.status !== 'building';
  const elapsed = Math.max(0,Number(line.elapsed) || 0);
  const duration = Math.max(1,Number(line.duration) || 1);
  const progress = Math.min(1,elapsed / duration);
  const totalSegments = line.route.length - 1;
  // Estudios no excavan; la excavación y el tendido aparecen gradualmente.
  const tunnelSegments = completed ? totalSegments :
    Math.max(0,Math.min(totalSegments,Math.floor(totalSegments * Math.max(0,(progress - .12) / .82))));
  // 'operational' lo determina el motor: energía, presupuesto y flota reales.
  const trains = completed && line.status === 'active' && line.operational === true ?
    Math.min(5,Math.max(0,Math.trunc(Number(line.trainCount) || 0))) : 0;
  return {route:line.route,stations:line.stations,completed,progress,tunnelSegments,trains};
}
