import { CFG } from "./config.js";
import { fmt } from "./reactors.js";

const $id = (i) => document.getElementById(i);

export function createHud(S, sim, bay, audio) {
  let panelOpen = false;

  function init() {
    $id("tabHome").addEventListener("click", () => setTab("home"));
    $id("tabCell").addEventListener("click", () => setTab("cell"));
    $id("btnUps").addEventListener("click", () => { panelOpen ? closePanel() : openCellPanel(); });
    $id("btnMusic").addEventListener("click", () => {
      const on = !S.music;
      S.music = on; audio.setMusic(on);
      $id("btnMusic").classList.toggle("off", !on);
    });
    $id("btnSfx").addEventListener("click", () => {
      const on = !S.sfx;
      S.sfx = on; audio.setSfx(on);
      $id("btnSfx").classList.toggle("off", !on);
    });
    document.querySelector("#panel .x").addEventListener("click", closePanel);
  }

  function setTab(name) {
    document.body.classList.toggle("tab-home", name === "home");
    document.body.classList.toggle("tab-cell", name === "cell");
    $id("homeTab").hidden = name !== "home";
    $id("tabHome").classList.toggle("on", name === "home");
    $id("tabCell").classList.toggle("on", name === "cell");
    $id("btnUps").style.display = name === "cell" ? "" : "none";
    if (name !== "cell") closePanel();
    if (name === "home") bay.refresh();
  }

  function openCellPanel() {
    panelOpen = true;
    const p = $id("panel");
    p.classList.add("open");
    renderCellPanel();
  }
  function closePanel() {
    panelOpen = false;
    $id("panel").classList.remove("open");
  }

  function renderCellPanel() {
    const body = $id("panelBody");
    body.innerHTML = "<h3>Cell lab · spend reactor income</h3>";
    for (const id of Object.keys(CFG.cellUps)) {
      const u = CFG.cellUps[id];
      const lvl = S.cellUps[id] || 0;
      const maxed = lvl >= u.costs.length;
      const row = document.createElement("div");
      row.className = "up-row";
      const dots = "●".repeat(lvl) + "○".repeat(u.costs.length - lvl);
      row.innerHTML = `<div><b>${u.name}</b> <span class="dots">${dots}</span>
        <small>${u.desc}</small></div>
        <button class="buy">${maxed ? "MAX" : "$" + fmt(u.costs[lvl])}</button>`;
      row.querySelector("button").addEventListener("click", () => {
        if (maxed || S.money < u.costs[lvl]) return audio.deny();
        S.money -= u.costs[lvl];
        S.cellUps[id] = lvl + 1;
        sim._d = null;
        audio.buy();
        renderCellPanel(); hudTick();
      });
      body.appendChild(row);
    }
    body.insertAdjacentHTML("beforeend",
      `<p class="hintline">Energy motes feed <b>evolution</b>. Divisions grow the colony. Reactor money buys power.</p>`);
  }

  function hudTick() {
    const inc = sim.income();
    $id("sMoney").textContent = "$" + fmt(S.money);
    $id("sRate").textContent = "+$" + fmt(inc) + "/s";
    const st = CFG.stages[S.stageIdx];
    const next = CFG.stages[S.stageIdx + 1];
    $id("sStage").textContent = st.name;
    const pct = next ? Math.min(1, S.evoProg / next.need) : 1;
    $id("bEnergy").style.transform = `scaleX(${pct})`;
    $id("sEvoTxt").textContent = next
      ? `${Math.floor(S.evoProg)} / ${next.need}`
      : "APEX FORM";
    $id("sPop").textContent = S.pop;
    if (document.body.classList.contains("tab-home")) bay.refresh();
    if (panelOpen && document.body.classList.contains("tab-cell")) renderCellPanel();
  }

  let toastT = null;
  function toast(msg) {
    const el = $id("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function banner(title, sub) {
    const el = $id("banner");
    el.innerHTML = `<b>${title}</b>${sub ? `<span>${sub}</span>` : ""}`;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2600);
  }

  return { init, setTab, hudTick, toast, banner, openCellPanel, closePanel };
}
