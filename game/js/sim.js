import { CFG } from "./config.js";
import { createBlob, stepBlob, deformMetric } from "./softbody.js";

const rnd = (a, b) => a + Math.random() * (b - a);
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

export function createSim(S, audio) {
  const sim = {
    S,
    blob: null,
    npcs: [],
    motes: [],
    bacteria: [],
    fx: [],
    joy: { x: 0, y: 0 },
    hitFlash: 0,
    quality: "high",
    _d: null,

    reset() {
      this.blob = createBlob(CFG.world.w / 2, CFG.world.h / 2, CFG.cell.r, CFG.cell.points);
      this.npcs = [];
      this.bacteria = [];
      this.fx = [];
      this.spawnMotes();
      for (let i = 0; i < CFG.bacteria.count; i++) {
        const a = rnd(0, Math.PI * 2);
        this.bacteria.push({
          x: rnd(200, CFG.world.w - 200), y: rnd(200, CFG.world.h - 200),
          vx: Math.cos(a) * CFG.bacteria.speed, vy: Math.sin(a) * CFG.bacteria.speed,
          seed: rnd(0, 9), cool: 0,
        });
      }
    },

    spawnMotes() {
      this.motes.length = 0;
      for (let i = 0; i < CFG.motes.count; i++) this.motes.push(this.newMote(true));
    },

    newMote(nearStart) {
      let x, y;
      if (nearStart && Math.random() < 0.6 && this.blob) {
        const a = rnd(0, Math.PI * 2), d = rnd(140, 620);
        x = this.blob.cx + Math.cos(a) * d;
        y = this.blob.cy + Math.sin(a) * d;
      } else {
        x = rnd(80, CFG.world.w - 80); y = rnd(80, CFG.world.h - 80);
      }
      x = Math.max(60, Math.min(CFG.world.w - 60, x));
      y = Math.max(60, Math.min(CFG.world.h - 60, y));
      return { x, y, big: Math.random() < CFG.motes.bigChance, phase: rnd(0, 9), respawn: 0 };
    },

    derived() {
      if (this._d) return this._d;
      const lvl = (id) => S.cellUps[id] || 0;
      const blvl = (id) => S.boosts[id] || 0;
      const prod = (fxArr, n) => { let m = 1; for (let i = 0; i < n; i++) m *= fxArr[i]; return m; };
      this._d = {
        speed: prod(CFG.cellUps.fins.fx, lvl("fins")),
        magnet: CFG.eat.magnet * prod(CFG.cellUps.magnet.fx, lvl("magnet")),
        photo: prod(CFG.cellUps.photo.fx, lvl("photo")) * CFG.stages[S.stageIdx].mult * (CFG.boosts.co2.fx[blvl("co2") - 1] || 1),
        mito: prod(CFG.cellUps.mitosis.fx, lvl("mitosis")),
        membrane: prod(CFG.cellUps.membrane.fx, lvl("membrane")),
        leds: CFG.boosts.leds.fx[blvl("leds") - 1] || 1,
        offlineCapH: CFG.boosts.harvest.fx[blvl("harvest") - 1] || 0,
      };
      return this._d;
    },

    income() {
      let r = 0;
      for (const re of S.reactors) r += CFG.reactors[re.t].rate * re.lvl;
      return r * this.derived().leds;
    },

    addFx(f) { if (this.fx.length < 90) this.fx.push(f); },

    grantEnergy(v, wx, wy) {
      S.energy += v;
      S.evoProg += v;
      if (wx !== undefined) this.addFx({ kind: "txt", x: wx, y: wy, txt: "+" + Math.round(v), life: 0.9, max: 0.9, color: "#d6ffe4" });
      while (S.stageIdx + 1 < CFG.stages.length && S.evoProg >= CFG.stages[S.stageIdx + 1].need) {
        S.stageIdx++;
        this._d = null;
        this.addFx({ kind: "burst", x: this.blob.cx, y: this.blob.cy, life: 1.2, max: 1.2, color: "#aef2c3" });
      }
    },

    step(dt, t) {
      const D = this.derived();
      const b = this.blob;

      let jx = this.joy.x, jy = this.joy.y;
      const jl = Math.hypot(jx, jy);
      if (jl > 1) { jx /= jl; jy /= jl; }
      stepBlob(b, dt, {
        fx: jx, fy: jy, accel: CFG.cell.accel * D.speed,
        damp: CFG.cell.damp, t, W: CFG.world.w, H: CFG.world.h,
      });

      const magR = D.magnet;
      for (const m of this.motes) {
        if (m.respawn > 0) {
          m.respawn -= dt;
          if (m.respawn <= 0) Object.assign(m, this.newMote(false));
          continue;
        }
        const d = dist(m.x, m.y, b.cx, b.cy);
        if (d < magR) {
          const k = CFG.eat.pull * dt / Math.max(d, 12);
          m.x += (b.cx - m.x) * k; m.y += (b.cy - m.y) * k;
        }
        if (d < CFG.eat.radius + b.r * 0.5) {
          const v = (m.big ? CFG.motes.bigValue : CFG.motes.value) * D.photo;
          this.grantEnergy(v, m.x, m.y);
          b.pulse = 1;
          m.respawn = CFG.motes.respawnDelay;
          m.x = -9999; m.y = -9999;
          if (audio) audio.eat();
        }
      }

      while (S.energy >= S.divNeed * D.mito) {
        S.energy -= S.divNeed * D.mito;
        S.divNeed *= CFG.divide.growth;
        this.divideCell();
      }

      if (this.npcs.length && S.pop < CFG.divide.popCap) {
        if (Math.random() < CFG.divide.npcRate * dt * this.npcs.length) this.divideCell(true);
      }

      for (const n of this.npcs) {
        n.grow = Math.min(1, n.grow + dt * 0.25);
        n.heading += Math.sin(t * 0.7 + n.seed) * 0.9 * dt + rnd(-0.25, 0.25) * dt;
        const sp = 34 * (0.6 + n.grow * 0.4);
        n.x += Math.cos(n.heading) * sp * dt;
        n.y += Math.sin(n.heading) * sp * dt;
        if (n.x < 120 || n.x > CFG.world.w - 120) n.heading = Math.PI - n.heading;
        if (n.y < 120 || n.y > CFG.world.h - 120) n.heading = -n.heading;
        n.x = Math.max(100, Math.min(CFG.world.w - 100, n.x));
        n.y = Math.max(100, Math.min(CFG.world.h - 100, n.y));
      }

      this.hitFlash = Math.max(0, this.hitFlash - dt);
      for (const ba of this.bacteria) {
        ba.cool = Math.max(0, ba.cool - dt);
        const dp = dist(ba.x, ba.y, b.cx, b.cy);
        if (dp < CFG.bacteria.sense) {
          const k = 60 * dt / Math.max(dp, 20);
          ba.vx += (b.cx - ba.x) * k; ba.vy += (b.cy - ba.y) * k;
          const sp = Math.hypot(ba.vx, ba.vy), maxS = CFG.bacteria.speed * 1.35;
          if (sp > maxS) { ba.vx *= maxS / sp; ba.vy *= maxS / sp; }
        } else {
          ba.vx += Math.sin(t * 0.4 + ba.seed) * 30 * dt;
          ba.vy += Math.cos(t * 0.33 + ba.seed * 2) * 30 * dt;
        }
        ba.x += ba.vx * dt; ba.y += ba.vy * dt;
        if (ba.x < 60 || ba.x > CFG.world.w - 60) ba.vx *= -1;
        if (ba.y < 60 || ba.y > CFG.world.h - 60) ba.vy *= -1;
        ba.x = Math.max(60, Math.min(CFG.world.w - 60, ba.x));
        ba.y = Math.max(60, Math.min(CFG.world.h - 60, ba.y));

        if (dp < b.r + 14 && ba.cool <= 0) {
          ba.cool = CFG.bacteria.iframes;
          this.hitFlash = 0.5;
          const drain = CFG.bacteria.drain * D.membrane;
          S.energy = Math.max(0, S.energy - drain);
          const kx = b.cx - ba.x, ky = b.cy - ba.y, kl = Math.hypot(kx, ky) || 1;
          b.cpx = b.cx + (kx / kl) * 26; b.cpy = b.cy + (ky / kl) * 26;
          this.addFx({ kind: "ring", x: b.cx, y: b.cy, life: 0.6, max: 0.6, color: "#ff9c9c" });
          if (audio) audio.hurt();
        }
      }

      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i];
        f.life -= dt;
        if (f.kind === "txt") f.y -= 26 * dt;
        if (f.life <= 0) this.fx.splice(i, 1);
      }

      S.t += dt;
      S.money += this.income() * dt;
      S.earnedTotal += this.income() * dt;
      S.pop = 1 + this.npcs.length;
    },

    divideCell(fromNpc) {
      const b = this.blob;
      const a = rnd(0, Math.PI * 2);
      const n = {
        x: b.cx + Math.cos(a) * (b.r + 22),
        y: b.cy + Math.sin(a) * (b.r + 22),
        r: fromNpc ? rnd(10, 15) : 11,
        grow: fromNpc ? 0.55 : 0.3,
        heading: a + Math.PI, seed: rnd(0, 9),
      };
      this.npcs.push(n);
      b.pulse = 1;
      this.addFx({ kind: "ring", x: b.cx, y: b.cy, life: 0.7, max: 0.7, color: "#b8ffd4" });
      if (!fromNpc && audio) audio.divide();
    },

    squish() { return deformMetric(this.blob); },
    offline() {
      const secs = Math.min((Date.now() - S.savedAt) / 1000, this.derived().offlineCapH * 3600);
      if (secs < 60) return 0;
      const earned = this.income() * secs * CFG.offlineEfficiency;
      S.money += earned; S.earnedTotal += earned;
      return earned;
    },
  };
  sim.reset();
  return sim;
}
