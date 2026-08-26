import { CFG } from "./config.js";

/* ---------- spatial hash (uniform grid) ---------- */
export class Grid {
  constructor(cell = 120) { this.cell = cell; this.map = new Map(); }
  key(x, y) { return ((x / this.cell) | 0) * 4096 + ((y / this.cell) | 0); }
  clear() { this.map.clear(); }
  insert(o) {
    const k = this.key(o.x, o.y);
    let a = this.map.get(k);
    if (!a) { a = []; this.map.set(k, a); }
    a.push(o);
  }
  near(x, y, r, out) {
    out.length = 0;
    const c = this.cell;
    const x0 = ((x - r) / c) | 0, x1 = ((x + r) / c) | 0;
    const y0 = ((y - r) / c) | 0, y1 = ((y + r) / c) | 0;
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
      const a = this.map.get(gx * 4096 + gy);
      if (a) for (let i = 0; i < a.length; i++) out.push(a[i]);
    }
    return out;
  }
}

/* ---------- procedural zones ---------- */
export function makeZones() {
  const kinds = ["lightridge", "nutrientpoor", "dark", "bacterial", "bubbly", "waste"];
  const zones = [];
  let seed = 1337;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 9; i++) {
    zones.push({
      kind: kinds[(rnd() * kinds.length) | 0],
      x: rnd() * CFG.world.w,
      y: rnd() * CFG.world.h,
      r: 380 + rnd() * 520,
    });
  }
  return zones;
}
export function zoneAt(zones, x, y) {
  for (const z of zones) {
    const dx = x - z.x, dy = y - z.y;
    if (dx * dx + dy * dy < z.r * z.r) return z.kind;
  }
  return null;
}
export function zoneLightMod(kind) { return kind === "dark" ? 0.35 : kind === "lightridge" ? 1.8 : 1; }
export function zoneNutrientMod(kind) { return kind === "nutrientpoor" ? 0.3 : kind === "bacterial" ? 0.7 : kind === "waste" ? 0.5 : 1; }
