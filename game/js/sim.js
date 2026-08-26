import { CFG } from "./config.js";
import { fx, stageFor } from "./save.js";
import { Grid, makeZones, zoneAt, zoneLightMod, zoneNutMod } from "./world.js";
import { makeCell, makeBacteria, makePool, uid } from "./entities.js";

const W = CFG.world.w, H = CFG.world.h;
const RES_COLOR = Object.fromEntries(CFG.resources.map((r) => [r.kind, r.color]));
const resColor = (k) => RES_COLOR[k] || "#fff";
const weightedKind = () => {
  let r = Math.random(), acc = 0;
  for (const k of CFG.resources) { acc += k.weight; if (r <= acc) return k.kind; }
  return "light";
};

export function createSim(S) {
  const algae = [], bact = [];
  const pool = makePool(CFG.counts.nutrients);
  const grid = new Grid(110);
  let quality = "high", targetPop = CFG.counts.nutrients;
  const joy = { x: 0, y: 0 };           // normalized input direction
  let lastHurt = -9;
  const cb = { toast: [], death: [] };
  const on = (e, f) => cb[e].push(f);
  const emit = (e, a) => cb[e].forEach((f) => f(a));

  /* seed */
  for (let i = 0; i < 2; i++) algae.push(makeCell(S.player.x + rnd(40), S.player.y + rnd(40), S.player.hue));
  for (let i = 0; i < 22; i++) spawnFar();
  refillAll();
  function spawnFar() {
    const kinds = ["grazer", "grazer", "competitor", "competitor", "decomposer", "beneficial"];
    bact.push(makeBacteria(kinds[(Math.random() * kinds.length) | 0], Math.random() * W, Math.random() * H));
  }
  function refillAll() {
    while (pool.live.size < targetPop) pool.spawn(weightedKind(), Math.random() * W, Math.random() * H);
  }

  /* ---------- input ---------- */
  function setJoy(x, y) { joy.x = x; joy.y = y; }

  /* ---------- main step ---------- */
  function step(dt, fxq) {
    const M = fx(S);
    S.t += dt;
    const P = S.player;

    /* player physics: direct control */
    const acc = CFG.player.accel * M.speed * (P.hp > 0 ? 1 : 0);
    P.vx += joy.x * acc * dt; P.vy += joy.y * acc * dt;
    const damp = Math.pow(CFG.player.damp, dt * 60);
    P.vx *= damp; P.vy *= damp;
    const sp = Math.hypot(P.vx, P.vy), maxS = CFG.player.maxSpeed * M.speed;
    if (sp > maxS) { P.vx *= maxS / sp; P.vy *= maxS / sp; }
    P.x = Math.min(W - 24, Math.max(24, P.x + P.vx * dt));
    P.y = Math.min(H - 24, Math.max(24, P.y + P.vy * dt));
    P.flagella = Math.min(1.9, Math.hypot(P.vx, P.vy) / maxS * 2.2);

    const zone = zoneAt(S.zones, W, H, P.x, P.y);

    /* energy economy */
    const lightPower = (S.reactor.light / 100) * M.lightUpgrade * zoneLightMod(zone);
    const gain = lightPower * M.lightGain * CFG.energy.lightBase;
    S.energy = Math.min(999, S.energy + gain * dt);
    S.energy -= CFG.energy.basal * M.drain * dt;
    if (M.sharedEnergy && algae.length > 8) S.energy += dt * .4;
    S.biomass += dt * gain * .03 + M.harvestRate * dt;

    /* hp regen */
    if (S.t - lastHurt > CFG.player.regenDelay) P.hp = Math.min(100, P.hp + CFG.player.regenRate * dt);

    /* nutrients: index, magnet-eat around every colony cell */
    grid.clear();
    for (const n of pool.live) grid.insert(n);
    for (const c of allCells()) {
      const near = grid.near(c.x, c.y, CFG.eat.magnet * (c === P ? M.magnet : 1));
      for (const n of near) {
        if (n.dead) continue;
        const dx = c.x - n.x, dy = c.y - n.y, d = Math.hypot(dx, dy) || 1;
        if (d < CFG.eat.radius + (c === P ? P.r : 0)) {
          eat(n, M, zone); fxq.pop(n.x, n.y, resColor(n.kind), 5, 70);
          if (c === P && Math.random() < .3) fxq.ring(P.x, P.y, "#9fe8b4", 20);
        } else {
          const pull = (CFG.eat.pull * dt) / d;
          n.x += dx * pull; n.y += dy * pull;
        }
      }
    }

    /* division: automatic when affordable, staggered */
    const divCost = CFG.divide.cost * M.divideCost * (nearBuilding("nursery", P.x, P.y, 260) ? .7 : 1);
    if (algae.length < 130 && S.energy >= divCost) {
      S.energy -= divCost;
      const parent = algae[(Math.random() * algae.length) | 0];
      const nx = parent ? parent.x + rnd(18) : P.x + rnd(18);
      const ny = parent ? parent.y + rnd(18) : P.y + rnd(18);
      algae.push(makeCell(nx, ny, S.player.hue));
      S.ep += CFG.ep.perDivide * M.epGain;
      fxq.pop(nx, ny, "#b8f5c8", 10, 120); fxq.ring(nx, ny, "#5ad07a", 30);
    } else if (algae.length === 0 && S.energy >= divCost) {
      S.energy -= divCost;
      algae.push(makeCell(P.x, P.y, S.player.hue));
    }

    /* buildings passives */
    if (nearBuilding("lightfarm", P.x, P.y, 240)) S.energy += dt * 1.5 * M.lightGain;
    if (nearBuilding("hub", P.x, P.y, 220)) S.energy += dt * .5;
    if (nearBuilding("cluster", P.x, P.y, 240) && Math.random() < dt * 1.6)
      pool.spawn(weightedKind(), P.x + rnd(170), P.y + rnd(170));

    /* bacteria */
    stepBacteria(dt, M, fxq);

    /* stages */
    const st = stageFor(algae.length + 1);
    if (st > S.stage) { S.stage = st; emit("toast", "ðŸ”¬ Stage reached â€” " + CFG.stages[st].name); }

    targetPop = Math.round(CFG.counts.nutrients * (quality === "low" ? .55 : 1));
    refillAll();
  }

  function allCells() { return [S.player, ...algae]; }

  function eat(n, M, zone) {
    pool.kill(n);
    const res = CFG.resources.find((r) => r.kind === n.kind);
    const mult = (n.kind === "carbon" ? M.carbonGain * M.carbonUpgrade : n.kind === "light" ? M.lightGain : M.nutrientGain) * zoneNutMod(zone);
    S.energy = Math.min(999, S.energy + (res?.energy ?? 2) * mult);
    S.ep += (res?.ep ?? .12) * M.epGain * M.sensorUpgrade;
    S.biomass += .04;
  }

  function stepBacteria(dt, M, fxq) {
    const P = S.player;
    const predatorMode = algae.length >= CFG.predation.popNeeded;
    for (let i = bact.length - 1; i >= 0; i--) {
      const b = bact[i], B = CFG.bacteria[b.kind];
      b.biteT -= dt; b.wobble += dt * 6;
      let ax = 0, ay = 0;

      if (b.kind === "grazer" || b.kind === "pathogen") {
        // flee biofilm or chemically-defended player
        if (M.grazerFlee && nearBuilding("biofilm", b.x, b.y, 210)) {
          ax = b.x - P.x; ay = b.y - P.y;
        } else {
          let best = null, bd = B.sense;
          const dp = dist(b, P); if (dp < bd) { best = P; bd = dp; }
          for (const c of algae) { const dd = dist(b, c); if (dd < bd) { best = c; bd = dd; } }
          if (best) {
            ax = best.x - b.x; ay = best.y - b.y;
            if (bd < 11 && b.biteT <= 0) { bite(best, B.dps, M, fxq); b.biteT = B.biteCd; }
          }
        }
        // predation: big colony absorbs grazers/pathogens on contact
        if (predatorMode && dist(b, P) < P.r + 6) {
          bact.splice(i, 1);
          S.ep += CFG.ep.perPredation * M.epGain;
          S.biomass += .15;
          fxq.pop(b.x, b.y, B.color, 12, 130); fxq.text(b.x, b.y - 14, "+" + (CFG.ep.perPredation).toFixed(1) + " EP", "#e8b8ff");
          continue;
        }
      } else if (b.kind === "competitor") {
        if (predatorMode && dist(b, P) < P.r + 6) {
          bact.splice(i, 1); S.ep += .3 * M.epGain;
          fxq.pop(b.x, b.y, B.color, 10, 120);
          continue;
        }
        const near = grid.near(b.x, b.y, B.sense);
        let bestN = null, bd = 1e9;
        for (const n of near) if (!n.dead) { const dd = dist(b, n); if (dd < bd) { bestN = n; bd = dd; } }
        if (bestN) { ax = bestN.x - b.x; ay = bestN.y - b.y; if (bd < 8) pool.kill(bestN); }
      } else if (b.kind === "decomposer") {
        ax = Math.sin((S.t + b.id) * .7) * 14; ay = Math.cos((S.t + b.id) * .6) * 14;
      } else { // beneficial
        let best = null, bd = B.sense;
        for (const c of algae) if (c.hp < 20) { const dd = dist(b, c); if (dd < bd) { best = c; bd = dd; } }
        if ((!best || bd > 60) && P.hp < 100) { best = P; }
        if (best) {
          ax = best.x - b.x; ay = best.y - b.y;
          if (dist(b, best) < 14) {
            if (best === P) { P.hp = Math.min(100, P.hp + 6 * dt * 10); fxq.ring(P.x, P.y, "#7ad0e0", 16); }
            else best.hp = 20;
          }
        }
      }
      const al = Math.hypot(ax, ay) || 1;
      b.vx += ((ax / al) * B.speed - b.vx) * Math.min(1, dt * 3);
      b.vy += ((ay / al) * B.speed - b.vy) * Math.min(1, dt * 3);
      b.x = Math.min(W - 10, Math.max(10, b.x + b.vx * dt));
      b.y = Math.min(H - 10, Math.max(10, b.y + b.vy * dt));
    }
    if (bact.length < 26 && Math.random() < dt * .3) spawnFar();
    if (bact.length > 64 && Math.random() < dt * 2) bact.pop();
  }

  function bite(t, dps, M, fxq) {
    if (t === S.player) {
      S.player.hp -= dps * M.dmgTaken;
      lastHurt = S.t;
      fxq.pop(P().x, P().y, "#e07a7a", 6, 90);
      if (S.player.hp <= 0) emit("death");
    } else {
      t.hp -= dps * 1.5;
      if (t.hp <= 0) {
        const idx = algae.indexOf(t);
        if (idx >= 0) { algae.splice(idx, 1); fxq.pop(t.x, t.y, "#5ad07a", 8, 80); }
        S.ep += .15;
      }
    }
  }
  const P = () => S.player;
  function nearBuilding(kind, x, y, r) {
    for (const b of S.buildings) if (b.kind === kind && Math.hypot(b.x - x, b.y - y) < r) return true;
    return false;
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function rnd(m) { return (Math.random() - .5) * m * 2; }

  /* ---------- public ---------- */
  return {
    algae, bact, pool,
    zones: null, joy,
    setJoy, on, step,
    setQuality(q) { quality = q; },
    readouts() {
      const r = S.reactor, M = fx(S);
      const lightEff = (r.light / 100) * M.lightUpgrade;
      const tf = r.temp < 20 || r.temp > 38 ? .35 : 1 - Math.abs(r.temp - 34) / 40;
      const pf = r.ph < 8 || r.ph > 11 ? .3 : 1 - Math.abs(r.ph - 10) / 12;
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const growth = clamp(lightEff * (.5 + (r.co2 / 100) * .6) * tf * pf, 0, 2.4);
      return {
        density: clamp(S.biomass / 120, 0, 1), growth,
        oxygen: clamp(growth * .8, 0, 1),
        contamination: clamp((r.ph < 9 ? .5 : .08) + (r.temp > 37 ? .3 : 0) + (r.light > 85 ? .15 : 0), 0, 1),
        health: clamp(1 - Math.abs(r.temp - 33) / 25 - Math.abs(r.ph - 10) / 8, 0, 1),
      };
    },
    respawn() {
      S.deaths++; S.player.hp = 100; algae.length = 0;
      algae.push(makeCell(S.player.x, S.player.y, S.player.hue));
      emit("toast", "ðŸŒ± A daughter cell takes root.");
    },
    bloom(n = 8) { for (let i = 0; i < n; i++) { const nb = makeBacteria(Math.random() < .6 ? "grazer" : "pathogen", S.player.x + rnd(420), S.player.y + rnd(420)); bact.push(nb); } },
    sprinkle(kind = "carbon", n = 50) { for (let i = 0; i < n; i++) pool.spawn(kind, S.player.x + rnd(380), S.player.y + rnd(380)); },
    beneficialWave() { for (let i = 0; i < 5; i++) bact.push(makeBacteria("beneficial", S.player.x + rnd(360), S.player.y + rnd(360))); },
    drain(v) { S.energy = Math.max(0, S.energy - v); },
    heal(v) { S.player.hp = Math.min(100, S.player.hp + v); },
    mutate() { S.player.hue = (S.player.hue + 50 + Math.random() * 60) % 360; for (const c of algae) c.hue = S.player.hue; },
    grantEnergy(v) { S.energy = Math.min(999, S.energy + v); },
  };
}
