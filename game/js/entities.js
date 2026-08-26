let nid = 1;
export const uid = () => nid++;

export function makeCell(x, y, hue) {
  return { id: uid(), kind: "algae", x, y, vx: 0, vy: 0,
    r: 5 + Math.random() * 3, hp: 20, phase: Math.random() * Math.PI * 2,
    spin: .2 + Math.random() * .3, hue, e: 4, hurtT: 9 };
}
export function makeBacteria(kind, x, y) {
  return { id: uid(), kind, x, y, vx: 0, vy: 0, r: 3 + Math.random() * 1.8,
    wobble: Math.random() * 7, biteT: 0 };
}
/* pooled nutrients */
export function makePool(n) {
  const live = new Set(), free = [];
  for (let i = 0; i < n; i++) free.push({ x: 0, y: 0, kind: "light", dead: true });
  const spawn = (kind, x, y) => {
    const o = free.pop() || {};
    Object.assign(o, { kind, x, y, dead: false });
    live.add(o); return o;
  };
  const kill = (o) => { o.dead = true; live.delete(o); free.push(o); };
  return { live, free, spawn, kill };
}
