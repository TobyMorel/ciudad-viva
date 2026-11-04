/** Smooths remote cursor positions in map space, independent of display refresh rate. */
export function smoothRemoteCursor(current, target, elapsedMs, halfLifeMs = 45) {
  const alpha = 1 - Math.pow(0.5, Math.max(0, elapsedMs) / halfLifeMs);
  const x = current.x + (target.x - current.x) * alpha;
  const y = current.y + (target.y - current.y) * alpha;
  return {
    x: Math.abs(target.x - x) < 0.0005 ? target.x : x,
    y: Math.abs(target.y - y) < 0.0005 ? target.y : y,
  };
}
