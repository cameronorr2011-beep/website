import { CFG } from "./config.js";
import { freshState, loadGame, saveGame } from "./save.js";
import { createSim } from "./sim.js";
import { createRenderer } from "./render.js";
import { createBay } from "./reactors.js";
import { createHud } from "./hud.js";
import { createInput } from "./input.js";
import { createAudio } from "./audio.js";

const S = loadGame() || freshState();
const canvas = document.getElementById("view");
const audio = createAudio();
const sim = createSim(S, audio);
const renderer = createRenderer(canvas, sim);
const bay = createBay(S, sim, audio);
const ui = createHud(S, sim, bay, audio);

bay.mount(document.getElementById("homeTab"));
ui.init();
audio.setMusic(S.music);
audio.setSfx(S.sfx);
document.getElementById("btnMusic").classList.toggle("off", !S.music);
document.getElementById("btnSfx").classList.toggle("off", !S.sfx);

const input = createInput(canvas, sim);
const wakeAudio = () => { if (started) audio.ensure(); };
addEventListener("pointerdown", wakeAudio);
addEventListener("keydown", wakeAudio);

let started = false;
document.getElementById("btnStart").addEventListener("click", () => {
  started = true;
  audio.ensure();
  document.getElementById("startOverlay").classList.add("hidden");
  document.body.classList.add("tab-cell");
  document.body.classList.remove("tab-home");
  ui.setTab("cell");
  for (const id of ["hudTop", "dock"]) document.getElementById(id).hidden = false;
  const earned = sim.offline();
  if (earned > 1) ui.toast("Harvesters banked $" + fmtMoney(earned) + " while away");
  else if (S.t > 30) ui.toast("Welcome back — culture age " + fmtAge(S.t));
});

function fmtAge(t) { const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60); return h ? `${h}h ${m}m` : m ? `${m}m` : `${Math.floor(t)}s`; }
function fmtMoney(n) { return n >= 1000 ? (n / 1000).toFixed(1) + "k" : Math.round(n).toString(); }

let lastStage = S.stageIdx;
sim.onEvolve = () => {};

const hooks = {
  evolve(newIdx) {
    audio.evolve();
    ui.banner("EVOLVED · " + CFG.stages[newIdx].name, "Your lineage grows stronger");
    ui.toast("Evolved into " + CFG.stages[newIdx].name);
  },
};

setInterval(() => {
  if (!started) return;
  if (S.stageIdx !== lastStage) {
    for (let i = lastStage + 1; i <= S.stageIdx; i++) hooks.evolve(i);
    lastStage = S.stageIdx;
  }
}, 200);

let last = performance.now(), acc = 0, emaDt = 1 / 60, hudT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!started || !document.body.classList.contains("playing")) return;
  emaDt = emaDt * 0.95 + dt * 0.05;
  sim.quality = emaDt > 0.03 ? "low" : "high";

  input.poll();
  acc += dt;
  let steps = 0;
  while (acc >= CFG.tick && steps < 4) {
    acc -= CFG.tick; steps++;
    sim.step(CFG.tick, now / 1000);
  }
  bay.tick(dt);
  if (document.body.classList.contains("tab-cell")) renderer.draw(dt);
  if ((hudT += dt) > 0.15) { hudT = 0; ui.hudTick(); }
}
requestAnimationFrame(loop);

setInterval(() => { if (started && S.t > 2) saveGame(S); }, 5000);
document.addEventListener("visibilitychange", () => { if (document.hidden && started) saveGame(S); });
addEventListener("beforeunload", () => { if (started) saveGame(S); });

window.__algae = {
  S, sim, audio, bay,
  api: {
    squish: () => sim.squish(),
    income: () => sim.income(),
    money: () => S.money,
    pop: () => S.pop,
    stage: () => S.stageIdx,
    evoProg: () => S.evoProg,
    energy: () => S.energy,
    grantEnergy: (v) => sim.grantEnergy(v),
    setTab: (t) => ui.setTab(t),
    save: () => saveGame(S),
  },
};
