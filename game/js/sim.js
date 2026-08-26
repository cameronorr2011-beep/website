import { CFG } from "./config.js";
import { fx, stageFor } from "./evolution.js";
import { Grid, zoneAt, zoneLightMod, zoneNutrientMod } from "./world.js";
import { spawnAlgae, spawnBacteria, spawnNutrient, killNutrient, refillNutrients, pickKind } from "./entities.js";

export function createSim(S) {
  const algae = [], bact = [];
  const pool = { live: new Set(), free: [] };
  const grid = new Grid(120);
  const near = [];
  let target = { x: S.player.x, y: S.player.y };
  const listeners = { toast: [], death: [], discover: [] };

  seedInitial();

  function seedInitial() {
    spawnAlgae(S, algae, S.player.x + 30, S.player.y, S.player.hue);
    spawnAlgae(S, algae, S.player.x - 26, S.player.y + 18, S.player.hue);
    for (let i = 0; i < 24; i++) spawnBacteria(bact, pickKind(), Math.random() * CFG.world.w, Math.random() * CFG.world.h);
    refill(pool);
  }
  function refill(extra = 0) {
    refillNutrients(pool, CFG.counts.nutrients + extra);
  }
  function on(evt, fn) { listeners[evt].push(fn); }
  function emit(evt, arg) { for (const fn of listeners[evt]) fn(arg); }

  function setTarget(x, y) { target.x = x; target.y = y; }

  function step(dt, R) {
    const M = fx(S);
    const reactorLight = (S.reactor.light / 100) * M.lightUpgrade;
    S.t += dt;

    /* --- player --- */
    const P = S.player;
    const spd = CFG.player.speed * M.speed * (0.8 + (S.reactor.mixing / 100) * 0.5 * M.mixUpgrade);
    let dx = target.x - P.x, dy = target.y - P.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 4) {
      const k = Math.min(1, (spd * dt) / d);
      P.x += dx * k; P.y += dy * k;
      P.flagella = Math.min(2, P.flagella + dt * 2);
    } else P.flagella = Math.max(1, P.flagella - dt);
    P.x = Math.max(20, Math.min(CFG.world.w - 20, P.x));
    P.y = Math.max(20, Math.min(CFG.world.h - 20, P.y));

    const zone = zoneAt(R.zones, P.x, P.y);
    const zl = zoneLightMod(zone), zn = zoneNutrientMod(zone);

    /* --- energy economy (photosynthesis-ish) --- */
    const gain = reactorLight * zl * M.lightGain * 2.1;
    S.energy = Math.min(999, S.energy + gain * dt * M.sensorUpgrade * 0.5);
    S.energy -= dt * 0.9 * M.drain; // basal metabolism
    S.biomass += dt * gain * 0.02;
    if (M.harvestRate) S.biomass += M.harvestRate * dt;

    /* --- spatial index of nutrients --- */
    grid.clear();
    for (const n of pool.live) grid.insert(n);

    /* --- player & colony eat --- */
    const eatR = 16 + P.r;
    for (const cell of algae) {
      grid.near(cell.x, cell.y, 18, near);
      for (const n of near) {
        if (n.dead) continue;
        const dd = Math.hypot(n.x - cell.x, n.y - cell.y);
        if (dd < eatR) {
          consume(n, M, zn);
          if (cell !== undefined) break; // one per cell per tick keeps it fair
        }
      }
    }

    /* --- division --- */
    const divCost = CFG.divisionCost.energy * M.divideCost;
    const nurseryNear = hasBuildingNear("nursery", P.x, P.y, 260);
    if (algae.length < 140 && S.energy > divCost * (nurseryNear ? 0.7 : 1)) {
      S.energy -= divCost;
      const parent = algae[(Math.random() * algae.length) | 0] || P;
      spawnAlgae(S, algae, parent.x + rnd(14), parent.y + rnd(14), P.hue);
      S.ep += 0.5 * M.epGain;
    }

    /* --- bacteria behaviour --- */
    stepBacteria(dt, M);

    /* --- buildings passives --- */
    if (hasBuildingNear("lightfarm", P.x, P.y, 240)) S.energy += dt * 1.6 * M.lightGain;
    if (hasBuildingNear("cluster", P.x, P.y, 240) && Math.random() < dt * 2)
      spawnNutrient(pool, weightedKind(), P.x + rnd(160), P.y + rnd(160));
    if (hasBuildingNear("hub", P.x, P.y, 220)) S.energy = Math.min(999, S.energy + dt * 0.6);

    /* --- population & stages --- */
    const pop = algae.length + 1;
    const st = stageFor(pop);
    if (st > S.stage) { S.stage = st; emit("discover", "Stage reached: " + CFG.stages[st].name); }
    if (pop < 3 && Math.random() < dt * 0.25) { // culture never fully dies while reactor lives
      spawnAlgae(S, algae, P.x + rnd(40), P.y + rnd(40), P.hue);
    }
    refill();
  }

  function consume(n, M, zn) {
    killNutrient(pool, n);
    const res = CFG.resources.find((r) => r.kind === n.kind);
    const mult = n.kind === "carbon" ? M.carbonGain * M.carbonUpgrade : n.kind === "light" ? M.lightGain : M.nutrientGain;
    S.energy = Math.min(999, S.energy + (res?.energy ?? 1) * mult * zn);
    S.ep += (res?.ep ?? 0.1) * M.epGain * M.sensorUpgrade;
    S.biomass += 0.05;
  }

  function stepBacteria(dt, M) {
    const P = S.player;
    for (let i = bact.length - 1; i >= 0; i--) {
      const b = bact[i];
      const cfgB = CFG.bacteria[b.kind];
      b.cool -= dt;
      let ax = 0, ay = 0;

      if (b.kind === "grazer") {
        // chase nearest algae/player unless chemically deterred nearby biofilm
        let best = null, bd = cfgB.sense;
        if (dist(b, P) < bd && !fleeing(P, M)) best = P, bd = dist(b, P);
        for (const c of algae) { const dd = dist(b, c); if (dd < bd && !fleeing(c, M)) { best = c; bd = dd; } }
        if (best) { ax = best.x - b.x; ay = best.y - b.y; if (bd < 10 && b.cool <= 0) { bite(best, cfgB.dps, M); b.cool = 0.9; } }
      } else if (b.kind === "competitor") {
        // steal nearest nutrient
        grid.near(b.x, b.y, cfgB.sense, near);
        let bestN = null, bd = 1e9;
        for (const n of near) { const dd = dist(b, n); if (dd < bd) { bestN = n; bd = dd; } }
        if (bestN) { ax = bestN.x - b.x; ay = bestN.y - b.y; if (bd < 8) { killNutrient(pool, bestN); } }
      } else if (b.kind === "decomposer") {
        // drifts; cleans waste — tiny EP gift when near player
        ax = Math.sin((S.t + b.id) * 0.7) * 12; ay = Math.cos((S.t + b.id * 1.3) * 0.6) * 12;
        if (dist(b, P) < 60) S.ep += dt * 0.05 * M.epGain;
      } else { // beneficial
        // seeks hurt cells, heals them
        let best = null, bd = cfgB.sense;
        for (const c of algae) if (c.hp < 20) { const dd = dist(b, c); if (dd < bd) { best = c; bd = dd; } }
        if (!best && P.hp < 100) best = P;
        if (best) { ax = best.x - b.x; ay = best.y - b.y; if (bd < 12) { best.hp = Math.min(P.hp, (best.hp ?? P.hp) + 6); } }
      }
      const al = Math.hypot(ax, ay) || 1;
      b.vx += ((ax / al) * cfgB.speed - b.vx) * dt * 2.2;
      b.vy += ((ay / al) * cfgB.speed - b.vy) * dt * 2.2;
      b.x = Math.max(10, Math.min(CFG.world.w - 10, b.x + b.vx * dt));
      b.y = Math.max(10, Math.min(CFG.world.h - 10, b.y + b.vy * dt));
    }
    // slow ecosystem turnover
    if (bact.length < 30 && Math.random() < dt * 0.35) spawnBacteria(bact, pickKind(), Math.random() * CFG.world.w, Math.random() * CFG.world.h);
    if (bact.length > 70 && Math.random() < dt * 2) bact.pop();
  }

  function fleeing(target, M) {
    return M.grazerFlee && hasBuildingNear("biofilm", target.x, target.y, 200);
  }
  function bite(t, dps, M) {
    const isPlayer = t === S.player;
    if (isPlayer) {
      S.player.hp -= dps * M.dmgTaken * dtScale();
      if (S.player.hp <= 0) emit("death");
    } else {
      t.hp -= dps * 1.4;
      if (t.hp <= 0) {
        const idx = algae.indexOf(t);
        if (idx >= 0) algae.splice(idx, 1);
        S.ep += 0.15; // scavenging lesson
      }
    }
  }
  function dtScale() { return 1; }

  function hasBuildingNear(kind, x, y, r) {
    for (const b of S.buildings) if (b.kind === kind && Math.hypot(b.x - x, b.y - y) < r) return true;
    return false;
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function rnd(m) { return (Math.random() - 0.5) * m * 2; }
  function weightedKind() {
    let r = Math.random(), acc = 0;
    for (const k of CFG.resources) { acc += k.weight; if (r <= acc) return k.kind; }
    return "light";
  }

  /* ---------- public actions ---------- */
  return {
    algae, bact, pool, zones: null,
    step,
    setTarget,
    on,
    get target() { return target; },
    respawn() {
      S.deaths++; S.player.hp = 100;
      algae.length = 0;
      spawnAlgae(S, algae, S.player.x, S.player.y, S.player.hue);
    },
    addBacteriaBloom(n = 10) {
      const kinds = ["grazer", "grazer", "competitor"];
      for (let i = 0; i < n; i++) spawnBacteria(bact, kinds[(Math.random() * kinds.length) | 0], S.player.x + rnd(500), S.player.y + rnd(500));
    },
    addBeneficial(n = 6) { for (let i = 0; i < n; i++) spawnBacteria(bact, "beneficial", S.player.x + rnd(400), S.player.y + rnd(400)); },
    sprinkle(kind, n = 60) { for (let i = 0; i < n; i++) spawnNutrient(pool, kind, S.player.x + rnd(420), S.player.y + rnd(420)); },
    drainEnergy(v) { S.energy = Math.max(0, S.energy - v); },
    healAll(v) { S.player.hp = Math.min(100, S.player.hp + v); },
    mutateHue() { S.player.hue = (S.player.hue + 40 + Math.random() * 60) % 360; },
  };
}
