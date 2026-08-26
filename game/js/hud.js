import { CFG, ACH } from "./config.js";
import { fx } from "./save.js";

const $ = (id) => document.getElementById(id);
const $$ = (s) => [...document.querySelectorAll(s)];

export function createHud(S, sim, reactor, actions) {
  const toastEl = $("toast");
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }
  function hud() {
    const P = S.player, M = fx(S);
    $("sBio").textContent = S.biomass.toFixed(1);
    $("sEn").textContent = S.energy.toFixed(0);
    $("sPop").textContent = sim.algae.length + 1;
    $("sEP").textContent = S.ep.toFixed(0);
    $("sHp").textContent = Math.max(0, P.hp).toFixed(0) + "%";
    $("sStage").textContent = CFG.stages[S.stage].name;
    $("bBio").style.transform = `scaleX(${Math.min(1, S.biomass / 120)})`;
    $("bEn").style.transform = `scaleX(${Math.min(1, S.energy / 120)})`;
    $("bHp").style.transform = `scaleX(${Math.max(0, P.hp / 100)})`;
    $("btnBuild").disabled = S.stage < 1;
    $("btnLab").disabled = S.stage < 2;
    $("epEcho").textContent = S.ep.toFixed(0);
  }

  function open(id) {
    for (const p of document.querySelectorAll(".panel")) p.classList.remove("open");
    if (id) { renderPanel(id); $(id).classList.add("open"); }
  }

  function renderPanel(id) {
    if (id === "pEvolve") {
      let html = CFG.evo.map((t) => {
        const owned = S.evo.includes(t.id);
        const locked = t.req && !S.evo.includes(t.req);
        return `<div class="evo-item" style="${owned ? "border-color:var(--green)" : ""}">
          <div><b>${t.name}</b><small>${t.branch}</small></div>
          ${owned ? '<span class="cost">✓</span>' :
            `<button class="buy" data-evo="${t.id}" ${locked || S.ep < t.cost ? "disabled" : ""}>${locked ? "needs previous" : t.cost + " EP"}</button>`}
        </div>`;
      }).join("");
      const got = ACH.filter((a) => S.achievements.includes(a.id));
      html += `<h3 style="margin:14px 0 8px;font-size:13px;color:#8fb09a">Achievements · ${got.length}/${ACH.length}</h3>`;
      html += ACH.map((a) => {
        const has = S.achievements.includes(a.id);
        return `<div class="evo-item" style="opacity:${has ? 1 : .45}"><div><b>${has ? "🏅" : "🔒"} ${a.name}</b><small>${a.desc}</small></div></div>`;
      }).join("");
      $("evoList").innerHTML = html;
      $$("#evoList [data-evo]").forEach((b) => b.addEventListener("click", () => actions.evolve(b.dataset.evo)));
    }
    if (id === "pBuild") {
      $("bldList").innerHTML = Object.entries(CFG.buildings).map(([k, b]) => {
        const cost = Math.round(b.cost * fx(S).buildDiscount);
        return `<div class="bld-item evo-item"><div><b>${b.name}</b><small>${b.desc}</small></div>
          <button class="buy" data-bld="${k}" data-cost="${cost}" ${S.energy < cost ? "disabled" : ""}><span class="cost">${cost} ⚡</span></button></div>`;
      }).join("") + `<small style="color:#57705f;display:block;margin-top:6px">Then tap the water to place it.</small>`;
      $$("#bldList [data-bld]").forEach((b) => b.addEventListener("click", () => actions.armBuild(b.dataset.bld, +b.dataset.cost)));
    }
    if (id === "pLab") {
      const r = S.reactor;
      $("labList").innerHTML = [
        slider("Light", "light", r.light), slider("Temp", "temp", r.temp, 18, 40, "°C"),
        slider("pH", "ph", r.ph, 7, 11.5), slider("CO₂", "co2", r.co2), slider("Mixing", "mixing", r.mixing),
      ].join("");
      $$("#labList input[type=range]").forEach((inp) => inp.addEventListener("input", () => {
        S.reactor[inp.dataset.k] = parseFloat(inp.value);
        inp.closest(".evo-item").querySelector(".cost").textContent = inp.value + (inp.dataset.unit || "");
      }));
    }
    if (id === "pReactor") {
      const R = reactor.readouts();
      $("reactStats").innerHTML =
        `growth ×${R.growth.toFixed(2)} · O₂ ${(R.oxygen * 100) | 0}%<br>contamination ${(R.contamination * 100) | 0}% · health ${(R.health * 100) | 0}%`;
      $("upList").innerHTML = Object.entries(CFG.upgrades).map(([uid, u]) => {
        const lvl = reactor.level(uid);
        const maxed = lvl >= u.costs.length;
        const cost = maxed ? 0 : u.costs[lvl];
        return `<div class="up-item"><div><b>${u.name} <span style="color:var(--dim);font-size:11px">Lv ${lvl}/3</span></b><small>${u.desc}</small></div>
          <button class="buy" data-up="${uid}" ${maxed || S.biomass < cost ? "disabled" : ""}><span class="cost">${maxed ? "MAX" : cost + " bio"}</span></button></div>`;
      }).join("");
      $$("#upList [data-up]").forEach((b) => b.addEventListener("click", () => actions.buyUpgrade(b.dataset.up)));
    }
  }
  function slider(label, k, v, min = 0, max = 100, unit = "") {
    return `<div class="evo-item"><div style="flex:1"><b>${label}</b>
      <input type="range" data-k="${k}" data-unit="${unit}" min="${min}" max="${max}" step="0.5" value="${v}" style="width:100%">
    </div><span class="cost">${v}${unit}</span></div>`;
  }
  return { hud, toast, open };
}
