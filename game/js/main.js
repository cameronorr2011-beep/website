import { CFG, ACH } from "./config.js";
import { freshState, loadGame, saveGame, fx } from "./save.js";
import { createSim } from "./sim.js";
import { createFx } from "./fx.js";
import { createRenderer } from "./render.js";
import { createInput } from "./input.js";
import { createHud } from "./hud.js";
import { createEvents } from "./events.js";
import { createAudio } from "./audio.js";

const S = loadGame() || freshState();
const fxsys = createFx();
const sim = createSim(S);
S.zones = sim.zones = (await import("./world.js")).makeZones();
sim.view = { x: S.player.x, y: S.player.y, zoom: 1, w: innerWidth, h: innerHeight, mode: "micro", quality: "high" };
Object.defineProperties(sim, {
  mode: { get() { return this.view.mode; }, set(m) { this.view.mode = m; } },
});
const reactor = {
  level: (id) => S.upgrades[id] || 0,
  readouts: () => sim.readouts(),
};
const audio = createAudio();
if (S.muted) audio.toggleMute();

let armedBuild = null;
function unlock(id) {
  if (S.achievements.includes(id)) return;
  S.achievements.push(id);
  const a = ACH.find((x) => x.id === id);
  if (a) ui.toast("🏅 " + a.name);
  audio.blip(980, .18);
}
const ui = createHud(S, sim, reactor, {
  evolve(id) {
    const t = CFG.evo.find((e) => e.id === id);
    if (!t || S.evo.includes(id) || S.ep < t.cost) return;
    S.ep -= t.cost; S.evo.push(id); audio.blip(880, .16); unlock("evolved");
    ui.toast("Evolved — " + t.name);
    ui.open("pEvolve");
  },
  armBuild(kind, cost) {
    if (S.energy < cost) return;
    armedBuild = { kind, cost };
    ui.toast("Tap the water to place " + CFG.buildings[kind].name);
    ui.open(null);
  },
  buyUpgrade(id) {
    const u = CFG.upgrades[id], lvl = reactor.level(id);
    if (lvl >= u.costs.length || S.biomass < u.costs[lvl]) return;
    S.biomass -= u.costs[lvl]; S.upgrades[id] = lvl + 1;
    audio.blip(520, .14);
    ui.toast("Installed — " + u.name);
    ui.open("pReactor");
  },
});

/* canvas pointer routing: joystick vs build placement */
const canvas = document.getElementById("view");
canvas.addEventListener("pointerdown", (ev) => {
  audio.ensure();
  if (armedBuild && sim.mode === "micro") {
    const v = sim.view;
    place(v.x - v.w / 2 / v.zoom + ev.clientX / v.zoom, v.y - v.h / 2 / v.zoom + ev.clientY / v.zoom);
  }
}, true); // capture so build placement wins before joystick
function place(wx, wy) {
  const cost = Math.round(armedBuild.cost * fx(S).buildDiscount);
  if (S.energy < cost) return;
  S.energy -= cost;
  S.buildings.push({ kind: armedBuild.kind, x: wx, y: wy });
  unlock("builder");
  ui.toast(CFG.buildings[armedBuild.kind].name + " established");
  armedBuild = null; audio.blip(440, .18);
}
const input = createInput(canvas, () => sim);

/* buttons */
const $ = (sel) => document.getElementById(sel.replace(/^#/, ""));
console.log("MAIN EVAL", document.readyState, "btnStart=", !!$("btnStart"));
$("#btnStart").addEventListener("click", () => {
  audio.ensure();
  $("#startOverlay").classList.add("hidden");
  for (const id of ["hud", "actions", "viewTag"]) $(id).hidden = false;
  if (S.t > 10) ui.toast("Welcome back — culture age " + fmtAge(S.t));
});
$("#btnRespawn").addEventListener("click", () => {
  $("#deadOverlay").classList.add("hidden");
  sim.respawn(); sim.view.x = S.player.x; sim.view.y = S.player.y;
  unlock("survivor");
});
$("#btnEvolve").addEventListener("click", () => ui.open($("#pEvolve").classList.contains("open") ? null : "pEvolve"));
$("#btnBuild").addEventListener("click", () => { if (!$("#btnBuild").disabled) ui.open($("#pBuild").classList.contains("open") ? null : "pBuild"); });
$("#btnLab").addEventListener("click", () => { if (!$("#btnLab").disabled) ui.open($("#pLab").classList.contains("open") ? null : "pLab"); });
$("#btnReactor").addEventListener("click", toggleView);
$("#btnMute").addEventListener("click", () => { const m = audio.toggleMute(); S.muted = m; $("#btnMute").textContent = m ? "✕" : "♪"; });
addEventListener("keydown", (e) => { if (e.key.toLowerCase() === "m") $("#btnMute").click(); });

function toggleView() {
  sim.mode = sim.mode === "micro" ? "reactor" : "micro";
  if (sim.mode === "reactor") unlock("operator");
  $("#btnReactor").textContent = sim.mode === "micro" ? "Reactor" : "Micro";
  $("#viewTag").textContent = sim.mode === "micro" ? "drag to swim · pinch to zoom" : "reactor operations";
  if (sim.mode === "reactor") ui.open("pReactor"); else ui.open(null);
}

sim.on("death", () => { audio.blip(140, .5, .09); $("#deadOverlay").classList.remove("hidden"); });
sim.on("toast", (m) => { ui.toast(m); audio.blip(760, .2); });

/* eat sound hook: watch energy jumps */
let lastE = S.energy;
setInterval(() => {
  if (S.energy - lastE > 1.5) audio.eat();
  lastE = S.energy;
}, 250);

/* main loop */
let last = performance.now(), acc = 0, emaDt = 1 / 60, hudT = 0;
function loop(tNow) {
  requestAnimationFrame(loop);
  let dt = Math.min(.1, (tNow - last) / 1000); last = tNow;
  emaDt = emaDt * .95 + dt * .05;
  const q = emaDt > .026 ? "low" : "high";
  if (q !== sim.view.quality) { sim.view.quality = q; sim.setQuality(q); }
  input.pollKeys(sim);
  acc += dt;
  while (acc >= CFG.tick) {
    acc -= CFG.tick;
    sim.step(CFG.tick, fxsys);
    events.update(CFG.tick);
  }
  fxsys.step(dt);
  renderer.draw(tNow);
  if ((hudT += dt) > .15) { hudT = 0; ui.hud(); }
}
const renderer = createRenderer(canvas, S, sim, fxsys);
const events = createEvents(S, sim, (m) => { ui.toast(m); }, 40);

/* colony/ecosystem achievements poll */
setInterval(() => {
  const pop = sim.algae.length + 1;
  if (pop >= 6) unlock("colony");
  if (pop >= 16) unlock("ecosystem");
}, 800);

/* autosave */
setInterval(() => { if (S.t > 2) saveGame(S); }, 4000);
document.addEventListener("visibilitychange", () => { if (document.hidden) saveGame(S); });
addEventListener("beforeunload", () => saveGame(S));

/* debug/test handle */
window.__algae = { S, sim,
  api: {
    grantEnergy: (v) => sim.grantEnergy(v),
    player: () => ({ x: S.player.x, y: S.player.y }),
    pop: () => sim.algae.length + 1,
    forceDivide: () => { S.energy = 999; },
  },
};

function fmtAge(t) { const h = Math.floor(t / 60), s = Math.floor(t % 60); return h ? `${h}m ${s}s` : `${s}s`; }
requestAnimationFrame(loop);
