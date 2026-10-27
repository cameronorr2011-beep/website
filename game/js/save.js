import { CFG } from "./config.js";

const KEY = "algae-living-v3";
const OLD_KEY = "algae-living-v2";

/* Storage consent (see site /js/consent.js): the game save is a preference,
   not strictly necessary storage. Without a consent record the game runs
   normally but nothing is written to localStorage. */
function storageAllowed() {
  try {
    const c = localStorage.getItem("ob-cookie-consent");
    if (!c) return false;
    const v = JSON.parse(c);
    return v && v.choice === "all";
  } catch { return false; }
}
export function freshState() {
  return {
    v: 3,
    money: 0,
    earnedTotal: 0,
    energy: 0,
    evoProg: 0,
    divNeed: CFG.divide.baseNeed,
    stageIdx: 0,
    pop: 1,
    t: 0,
    savedAt: Date.now(),
    music: true,
    sfx: true,
    cellUps: {},
    boosts: {},
    reactors: [{ t: 0, lvl: 1 }],
    zonesFound: [],
  };
}

export function loadGame() {
  if (!storageAllowed()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 3) return Object.assign(freshState(), s);
    }
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const o = JSON.parse(old);
      const s = freshState();
      if (o) {
        s.money = Math.min(50000, Math.round((o.biomass || 0) / 3));
        s.earnedTotal = s.money;
        if (typeof o.muted === "boolean") s.sfx = !o.muted;
      }
      return s;
    }
  } catch {}
  return null;
}

export function saveGame(S) {
  if (!storageAllowed()) return;
  try {
    S.savedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch {}
}

export function wipeSave() {
  try { localStorage.removeItem(KEY); } catch {}
}
