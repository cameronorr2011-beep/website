import { CFG } from "./config.js";

let nid = 1;

export function spawnAlgae(S, arr, x, y, hue) {
  arr.push({ id: nid++, x, y, vx: 0, vy: 0, r: 4.5 + Math.random() * 2, hp: 20, age: 0, e: 4, hue: hue ?? S.player.hue, wobble: Math.random() * 7 });
}
export function spawnBacteria(arr, kind, x, y) {
  const b = CFG.bacteria[kind];
  arr.push({ id: nid++, kind, x, y, vx: 0, vy: 0, r: 2.6 + Math.random() * 1.6, tx: x, ty: y, cool: 0 });
}
export function spawnNutrient(pool, kind, x, y) {
  if (pool.free.length) {
    const n = pool.free.pop();
    n.x = x; n.y = y; n.kind = kind; n.dead = false; n.vx = 0; n.vy = 0;
    pool.live.add(n);
    return n;
  }
  const n = { id: nid++, x, y, kind, vx: 0, vy: 0, dead: false };
  pool.live.add(n);
  return n;
}
export function killNutrient(pool, n) { n.dead = true; pool.live.delete(n); pool.free.push(n); }

export function seedWorld(S, algaeArr, bactArr, nutrientPool, zonesHelpers) {
  const W = CFG.world.w, H = CFG.world.h;
  spawnAlgae(S, algaeArr, S.player.x + 30, S.player.y, S.player.hue);
  spawnAlgae(S, algaeArr, S.player.x - 26, S.player.y + 18, S.player.hue);
  for (let i = 0; i < 26; i++)
    spawnBacteria(bactArr, pickKind(), Math.random() * W, Math.random() * H);
  refillNutrients(nutrientPool, CFG.counts.nutrients, zonesHelpers);
}
export function pickKind() {
  const r = Math.random();
  if (r < 0.34) return "grazer";
  if (r < 0.62) return "competitor";
  if (r < 0.84) return "decomposer";
  return "beneficial";
}
export function refillNutrients(pool, target, { zoneAt, makeKind } = {}) {
  let liveCount = pool.live.size;
  while (liveCount < target) {
    const x = Math.random() * CFG.world.w, y = Math.random() * CFG.world.h;
    const kind = makeKind ? makeKind(x, y) : weightedKind();
    spawnNutrient(pool, kind, x, y);
    liveCount++;
  }
}
function weightedKind() {
  let r = Math.random(), acc = 0;
  for (const k of CFG.resources) { acc += k.weight; if (r <= acc) return k.kind; }
  return "light";
}
export function makeKindWeighted(zoneMods) { return () => weightedKind(); }
