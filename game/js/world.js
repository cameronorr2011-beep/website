export class Grid {
  constructor(cell = 110) { this.c = cell; this.map = new Map(); this.out = []; }
  clear() { this.map.clear(); }
  insert(o) {
    const k = ((o.x / this.c) | 0) * 4096 + ((o.y / this.c) | 0);
    let a = this.map.get(k); if (!a) { a = []; this.map.set(k, a); } a.push(o);
  }
  near(x, y, r) {
    const out = this.out; out.length = 0;
    const c = this.c, x0 = ((x - r) / c) | 0, x1 = ((x + r) / c) | 0, y0 = ((y - r) / c) | 0, y1 = ((y + r) / c) | 0;
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
      const a = this.map.get(gx * 4096 + gy);
      if (a) for (let i = 0; i < a.length; i++) out.push(a[i]);
    }
    return out;
  }
}

const KINDS = ["lightridge", "nutrientpoor", "dark", "bacterial", "bubbly", "waste"];
export function makeZones(n = 9) {
  let seed = 20260826;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: n }, () => ({
    kind: KINDS[(rnd() * KINDS.length) | 0],
    x: rnd(), y: rnd(), r: .13 + rnd() * .16,   // normalized coords
  }));
}
export function zoneAt(zones, W, H, x, y) {
  for (const z of zones) {
    const dx = (x / W) - z.x, dy = (y / H) - z.y;
    if (dx * dx + dy * dy < z.r * z.r) return z.kind;
  }
  return null;
}
export const zoneLightMod = (k) => k === "dark" ? .35 : k === "lightridge" ? 1.8 : 1;
export const zoneNutMod  = (k) => k === "nutrientpoor" ? .3 : k === "waste" ? .5 : k === "bacterial" ? .7 : 1;
