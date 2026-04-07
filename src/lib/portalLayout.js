/** Random position for circle member bubbles (keeps center clear). */
export function randomBubblePosition(size) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const cx = w / 2;
  const cy = h / 2;
  const forbidden = Math.min(w, h) * 0.22;

  let x;
  let y;
  for (let i = 0; i < 120; i++) {
    const tx = Math.random() * (w - size);
    const ty = Math.random() * (h - size);
    const dx = tx + size / 2 - cx;
    const dy = ty + size / 2 - cy;
    if (Math.sqrt(dx * dx + dy * dy) > forbidden) {
      x = tx;
      y = ty;
      break;
    }
  }

  if (x === undefined) {
    const a = Math.random() * Math.PI * 2;
    x = cx + Math.cos(a) * (forbidden + 80) - size / 2;
    y = cy + Math.sin(a) * (forbidden + 80) - size / 2;
  }

  return { x, y };
}

/** Random position for a project node on the field. */
export function randomProjectNodePosition() {
  const size = 140;
  return {
    x: Math.random() * (window.innerWidth - size),
    y: Math.random() * (window.innerHeight - size),
  };
}

/** Fixed particle configs for portal backgrounds. */
export function createParticleField(count = 60) {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    speed: `${14 + Math.random() * 18}s`,
    size: `${2 + Math.random() * 2.5}px`,
  }));
}
