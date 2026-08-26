/* HUD bindings, panels (evolve/build/lab/reactor), toasts */
import { CFG } from "./config.js";
import { fx } from "./evolution.js";

const $ = (id) => document.getElementById(id);

export function createUI(S, sim, reactor, actions) {
  const toastEl = $("toast");
  let toastT = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 3400);
  }

  function hud() {
    const P = S.player;
    $("sBio").textContent = S.biomass.toFixed(1);
    $("sEn").textContent = S.energy.toFixed(0);
    $("sPop").textContent = sim.algae.length + 1;
    $("sEP").textContent = S.ep.toFixed(0);
    $("sHp").textContent = Math.max(0, P.hp).toFixed(0) + "%";
    $("sStage").textContent = CFG.stages[S.stage].name;
    $("bBio").style.transform = `scaleX(${Math.min(1, S.biomass / 120)})`;
    $("bEn").style.transform = `scaleX(${Math.min(1, S.energy / 120)})`;
    $("bHp").style.transform = `scaleX(${Math.max(0, P.hp / 100)})`;
    const canBuild = S.stage >= 1, canLab = S.stage >= 3;
    $("btnBuild").disabled = !canBuild;
    $("btnLab").disabled = !canLab;
    $("epEcho").textContent = S.ep.toFixed(0);
  }

  /* ---------- panels ---------- */
  function open(id) {
    for (const p of document.querySelectorAll(".panel")) p.classList.remove("open");
    if (id) { renderPanel(id); $(id).classList.add("open"); }
  }
  function closeAll() { open(null); }
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeAll));

  function renderPanel(id) {
    if (id === "pEvolve") {
      const M = fx(S);
      $("evoList").innerHTML = CFG.evo.map((t) => {
        const owned = S.evo.includes(t.id);
        const locked = t.req && !S.evo.includes(t.req);
        const afford = S.ep >= t.cost;
        return `<div class="evo-item"><div><b>${t.name}</b> <small>${t.branch}${t.fx && t.id === "def2" ? " · grazers slow near biofilm" : ""}</small></div>
        ${owned ? '<span class="cost">EVOLVED</span>' :
          `<button class="buy" data-evo="${t.id}" ${locked || !afford ? "disabled" : ""}>${locked ? "needs previous" : t.cost + " EP"}</button>`}
        </div>`;
      }).join("");
      $("evoList").querySelectorAll("[data-evo]").forEach((b) =>
        b.addEventListener("click", () => actions.evolve(b.dataset.evo)));
    }
    if (id === "pBuild") {
      $("bldList").innerHTML = Object.entries(CFG.buildings).map(([k, b]) => {
        const cost = Math.round(b.cost.energy * fx(S).buildingDiscount);
        return `<div class="bld-item evo-item"><div><b>${b.name}</b><small>${b.desc}</small></div>
        <button class="buy" data-bld="${k}" data-cost="${cost}" ${S.energy < cost ? "disabled" : ""}><span class="cost">${cost} ⚡</span></button></div>`;
      }).join("") + `<small style="color:#57705f">Placing: tap the water after choosing.</small>`;
      $("bldList").querySelectorAll("[data-bld]").forEach((b) =>
        b.addEventListener("click", () => { actions.armBuild(b.dataset.bld, +b.dataset.cost); closeAll(); }));
    }
    if (id === "pLab") {
      const r = S.reactor;
      $("labList").innerHTML = [
        slider("Light", "light", r.light), slider("Temperature", "temp", r.temp, 18, 40, "°C"),
        slider("pH", "ph", r.ph, 7, 11.5), slider("CO₂", "co2", r.co2), slider("Mixing", "mixing", r.mixing),
      ].join("");
      $("labList").querySelectorAll("input[type=range]").forEach((inp) =>
        inp.addEventListener("input", () => {
          S.reactor[inp.dataset.k] = parseFloat(inp.value);
          inp.nextElementSibling.textContent = inp.value + (inp.dataset.unit || "");
          actions.labNote();
        }));
    }
    if (id === "pReactor") {
      const R = reactor.readouts();
      $("reactStats").innerHTML =
        `growth ×${R.growth.toFixed(2)} &nbsp; O₂ ${(R.oxygen * 100).toFixed(0)}%<br>` +
        `contamination ${(R.contamination * 100).toFixed(0)}% &nbsp; culture health ${(R.health * 100).toFixed(0)}%`;
      $("upList").innerHTML = Object.entries(CFG.upgrades).map(([id2, u]) => {
        const lvl = reactor.level(id2);
        const maxed = lvl >= u.costs.length;
        const cost = maxed ? 0 : u.costs[lvl];
        return `<div class="up-item evo-item"><div><b>${u.name} <span style="color:var(--dim);font-size:11px">Lv ${lvl}/3</span></b><small>${u.desc}</small></div>
        <button class="buy" data-up="${id2}" ${maxed || S.biomass < cost ? "disabled" : ""}><span class="cost">${maxed ? "MAX" : cost + " bio"}</span></button></div>`;
      }).join("");
      $("upList").querySelectorAll("[data-up]").forEach((b) =>
        b.addEventListener("click", () => actions.buyUpgrade(b.dataset.up)));
    }
  }
  function slider(label, k, v, min = 0, max = 100, unit = "") {
    return `<div class="evo-item"><div style="flex:1"><b>${label}</b>
      <input type="range" data-k="${k}" data-unit="${unit}" min="${min}" max="${max}" step="0.5" value="${v}" style="width:100%">
    </div><span class="cost">${v}${unit}</span></div>`;
  }

  return { hud, toast, open, closeAll };
}
