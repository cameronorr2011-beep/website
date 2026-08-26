const KEY = "algaeliving_save";
const VER = 2;

export function freshState() {
  return {
    v: VER, t: 0, ep: 0, biomass: 0, energy: 14,
    stage: 0, evo: [], buildings: [], upgrades: {},
    achievements: [], discoveries: {}, deaths: 0,
    reactor: { temp: 33, ph: 10, light: 60, co2: 40, mixing: 50 },
    player: { x: 1600, y: 1600, vx: 0, vy: 0, hp: 100, r: 10, hue: 132, size: 1, flagella: 1 },
    muted: false,
  };
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d.v === VER) return Object.assign(freshState(), d);
    if (d.v === 1) {
      // migrate old save: carry progression, reset world-specific bits
      const s = freshState();
      s.ep = d.ep || 0; s.biomass = d.biomass || 0; s.evo = d.evo || [];
      s.upgrades = d.upgrades || {}; s.achievements = d.achievements || [];
      s.deaths = d.deaths || 0;
      if (d.player) { s.player.hue = d.player.hue ?? s.player.hue; }
      return s;
    }
    return null;
  } catch { return null; }
}

export function saveGame(S) {
  try { S.v = VER; localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
}
export function wipeSave() { try { localStorage.removeItem(KEY); } catch {} }

export function fx(S) {
  const m = { lightGain:1, nutrientGain:1, carbonGain:1, epGain:1, dmgTaken:1, speed:1,
              divideCost:1, drain:1, buildDiscount:1, magnet:1, grazerFlee:0,
              sharedEnergy:0, tempResist:0, phStable:0 };
  for (const id of S.evo) {
    const t = CFG_EVO[id]; if (!t) continue;
    for (const k in t.fx) m[k] = (k === "grazerFlee") ? 1 : m[k] * t.fx[k];
  }
  const up = (id) => S.upgrades[id] || 0;
  m.lightUpgrade   = 1 + [.0,.25,.5,.85][Math.min(up("led"),3)];
  m.carbonUpgrade  = 1 + [.0,.25,.5,.8][Math.min(up("co2"),3)];
  m.mixUpgrade     = 1 + [.0,.12,.28,.5][Math.min(up("mix"),3)];
  m.sensorUpgrade  = 1 + [.0,.15,.35,.6][Math.min(up("sensor"),3)];
  m.harvestRate      = [.0,.03,.07,.13][Math.min(up("harvest"),3)];
  return m;
}
import { CFG } from "./config.js";
const CFG_EVO = Object.fromEntries(CFG.evo.map((e) => [e.id, e]));

export function stageFor(pop) {
  let s = 0;
  for (let i = 0; i < CFG.stages.length; i++) if (pop >= CFG.stages[i].pop) s = i;
  return s;
}
