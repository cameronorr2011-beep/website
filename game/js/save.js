import { CFG } from "./config.js";

export function freshState() {
  return {
    v: 1,
    t: 0,
    ep: 0,
    biomass: 0,
    energy: 12,
    stage: 0,
    evo: [],
    buildings: [],            // {kind,x,y}
    upgrades: {},             // id -> level
    discoveries: {},
    achievements: [],
    reactor: { temp: 33, ph: 10, light: 60, co2: 40, mixing: 50 },
    player: { x: CFG.world.w / 2, y: CFG.world.h / 2, hp: 100, r: CFG.player.r, flagella: 1, hue: 130, size: 1 },
    deaths: 0,
    muted: false,
  };
}

const KEY = "algaeliving_save";
const VER = 1;

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.v !== VER) return null;
    return Object.assign(freshState(), data);
  } catch { return null; }
}

export function saveGame(S) {
  try {
    S.v = VER;
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch {}
}

export function wipeSave() {
  try { localStorage.removeItem(KEY); } catch {}
}
