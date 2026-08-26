import { CFG } from "./config.js";
import { freshState, loadGame, saveGame } from "./save.js";
import { fx } from "./evolution.js";
import { createSim } from "./sim.js";
import { createReactor } from "./reactor.js";
import { createEvents } from "./events.js";
import { createRenderer } from "./render.js";
import { createInput } from "./input.js";
import { createUI } from "./ui.js";
import { createAudio } from "./audio.js";

const S = loadGame() || freshState();
const sim = createSim(S);
sim.zones = (await import("./world.js")).makeZones();
sim.view = { x: S.player.x, y: S.player.y, zoom: 1, w: innerWidth, h: innerHeight, mode: "micro" };
Object.defineProperty(sim, "mode", { get() { return this.view.mode; }, set(m) { this.view.mode = m; } });
sim.state = S;

const reactor = createReactor(S);
const canvas = document.getElementById("view");
const renderer = createRenderer(canvas, S, sim, reactor);
const audio = createAudio();
if (S.muted) audio.toggleMute();

let armedBuild = null;
const ui = createUI(S, sim, reactor, {
  evolve(id) {
    const t = CFG.evo.find((e) => e.id === id);
    if (!t || S.evo.includes(id) || S.ep < t.cost) return;
    S.ep -= t.cost; S.evo.push(id); audio.blip(880, .16);
    if (id === "def3") S.player.flagella = 1.6;
    ui.toast("Evolved: " + t.name);
    ui.open("pEvolve");
  },
  armBuild(kind, cost) {
    if (S.energy < cost) return;
    armedBuild = { kind, cost };
    ui.toast("Tap the water to place " + CFG.buildings[kind].name);
    ui.closeAll();
  },
  buyUpgrade(id) {
    if (reactor.buyUpgrade(id)) { audio.blip(520, .14); ui.toast("Installed: " + CFG.upgrades[id].name); ui.open("pReactor"); }
  },
  labNote() { /* values apply instantly to sim via S.reactor */ },
});

/* events */
const events = createEvents(S, sim, (m) => { ui.toast(m); audio.blip(300, .2, .05); });

/* input */
canvas.addEventListener("pointerdown", (ev) => {
  audio.ensure();
  if (armedBuild && sim.mode === "micro") {
    const v = sim.view;
    const wx = v.x - v.w / 2 / v.zoom + ev.clientX / v.zoom;
    const wy = v.y - v.h / 2 / v.zoom + ev.clientY / v.zoom;
    place(wx, wy);
  }
});
function place(wx, wy) {
  const cost = Math.round(armedBuild.cost * fx(S).buildingDiscount);
  if (S.energy < cost) return;
  S.energy -= cost;
  S.buildings.push({ kind: armedBuild.kind, x: wx, y: wy });
  ui.toast(CFG.buildings[armedBuild.kind].name + " established");
  armedBuild = null; audio.blip(440, .18);
}
const input = createInput(canvas, () => sim);

/* buttons */
const $ = (id) => document.getElementById(id);
$("btnStart").addEventListener("click", startGame);
function startGame() {
  audio.ensure();
  $("startOverlay").classList.add("hidden");
  for (const id of ["hud", "actions", "viewTag"]) $(id).hidden = false;
  const hadSave = S.t > 5;
  if (hadSave) ui.toast("Welcome back — culture age " + fmtAge(S.t));
  else ui.toast("Drag anywhere. Eat glowing particles.");
}
$("btnRespawn").addEventListener("click", () => {
  $("deadOverlay").classList.add("hidden");
  sim.respawn(); sim.view.x = S.player.x; sim.view.y = S.player.y;
});
$("btnEvolve").addEventListener("click", () => ui.open($("pEvolve").classList.contains("open") ? null : "pEvolve"));
$("btnBuild").addEventListener("click", () => { if (!$("btnBuild").disabled) ui.open($("pBuild").classList.contains("open") ? null : "pBuild"); });
$("btnLab").addEventListener("click", () => { if (!$("btnLab").disabled) ui.open($("pLab").classList.contains("open") ? null : "pLab"); });
$("btnReactor").addEventListener("click", toggleView);
$("btnMute").addEventListener("click", () => {
  const m = audio.toggleMute(); S.muted = m; $("btnMute").textContent = m ? "✕" : "♪";
});
addEventListener("keydown", (e) => { if (e.key.toLowerCase() === "m") $("btnMute").click(); });

function toggleView() {
  sim.mode = sim.mode === "micro" ? "reactor" : "micro";
  $("btnReactor").textContent = sim.mode === "micro" ? "Reactor" : "Micro";
  $("viewTag").textContent = sim.mode === "micro" ? "microscopic view · drag to swim" : "reactor view · operations panel open";
  if (sim.mode === "reactor") ui.open("pReactor"); else ui.closeAll();
  audio.bubble();
}

/* death */
sim.on("death", () => {
  audio.blip(140, .5, .09);
  $("deadOverlay").classList.remove("hidden");
});
sim.on("discover", (m) => { ui.toast("🔬 " + m); audio.blip(760, .2); });

/* main loop — fixed-step sim @30Hz, rAF render */
let last = performance.now(), acc = 0, kbAcc = 0;
function loop(tNow) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.1, (tNow - last) / 1000);
  last = tNow;
  acc += dt; kbAcc += dt;
  while (acc >= 1 / 30) {
    acc -= 1 / 30;
    input.updateKeyboard(sim, dt);
    sim.step(1 / 30, { zones: sim.zones });
    events.update(1 / 30);
  }
  renderer.draw(0, tNow);
  if ((kbAcc += dt) > 0.15) { kbAcc = 0; ui.hud(); }
}
requestAnimationFrame(loop);

/* autosave */
setInterval(() => { if (S.t > 2) saveGame(S); }, 4000);
addEventListener("beforeunload", () => saveGame(S));
document.addEventListener("visibilitychange", () => { if (document.hidden) saveGame(S); });

function fmtAge(t) {
  const h = Math.floor(t / 60), s = Math.floor(t % 60);
  return h ? `${h}m ${s}s` : `${s}s`;
}
