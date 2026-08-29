import { CFG } from "./config.js";

const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export function createBay(S, sim, audio) {
  let root = null, cards = [], nextCard = null, animT = 0;

  const lvlCostOf = (re) => CFG.lvlCost(Math.max(CFG.reactors[re.t].cost, 90), re.lvl);

  function incomeOf(re) {
    return CFG.reactors[re.t].rate * re.lvl * sim.derived().leds;
  }

  function mount(el) {
    root = el;
    root.innerHTML = "";
    root.innerHTML = `<h2 class="bayTitle">Reactor bay</h2>
      <p class="baySub">Your photobioreactors culture algae around the clock. Income flows even while you swim.</p>`;
    const grid = document.createElement("div");
    grid.className = "rbay";
    root.appendChild(grid);
    rebuild(grid);
    const boosts = document.createElement("div");
    boosts.className = "boostRow";
    boosts.innerHTML = "<h3>Facility systems</h3>";
    for (const id of Object.keys(CFG.boosts)) {
      const b = CFG.boosts[id];
      const card = document.createElement("div");
      card.className = "bcard";
      card.innerHTML = `<div><b>${b.name}</b><small>${b.desc}</small></div>
        <button class="buy" data-b="${id}"></button>`;
      card.querySelector("button").addEventListener("click", () => {
        const lvl = S.boosts[id] || 0;
        if (lvl >= b.costs.length) return audio.deny();
        const c = b.costs[lvl];
        if (S.money < c) return audio.deny();
        S.money -= c; S.boosts[id] = lvl + 1; sim._d = null;
        audio.buy(); refresh();
      });
      boosts.appendChild(card);
    }
    root.appendChild(boosts);
    refresh();
  }

  function rebuild(grid) {
    grid.innerHTML = "";
    cards = [];
    S.reactors.forEach((re, i) => {
      const def = CFG.reactors[re.t];
      const card = document.createElement("div");
      card.className = "rcard";
      card.innerHTML = `
        <canvas width="56" height="100" aria-hidden="true"></canvas>
        <div class="rinfo">
          <b>${def.name}</b>
          <span class="pips"></span>
          <span class="rate"></span>
          <button class="buy"></button>
        </div>`;
      card.querySelector("button").addEventListener("click", () => {
        if (re.lvl >= CFG.reactorMaxLvl) return audio.deny();
        const c = lvlCostOf(re);
        if (S.money < c) return audio.deny();
        S.money -= c; re.lvl++; sim._d = null;
        audio.buy(); refresh();
      });
      grid.appendChild(card);
      cards.push({ re, cv: card.querySelector("canvas"), pips: card.querySelector(".pips"), rate: card.querySelector(".rate"), btn: card.querySelector("button") });
    });
    if (S.reactors.length < CFG.reactors.length) {
      const nt = S.reactors.length, def = CFG.reactors[nt];
      const card = document.createElement("div");
      card.className = "rcard next";
      card.innerHTML = `
        <canvas width="56" height="100" aria-hidden="true"></canvas>
        <div class="rinfo">
          <b>${def.name}</b>
          <small>$${fmt(def.rate)}/s base output</small>
          <span class="rate">New unit</span>
          <button class="buy">Build $${fmt(def.cost)}</button>
        </div>`;
      card.querySelector("button").addEventListener("click", () => {
        if (S.money < def.cost) return audio.deny();
        S.money -= def.cost;
        S.reactors.push({ t: nt, lvl: 1 }); sim._d = null;
        audio.buy();
        mount(root);
      });
      grid.appendChild(card);
      drawSilhouette(card.querySelector("canvas"), nt);
      nextCard = card;
    } else nextCard = null;
  }

  function refresh() {
    for (const c of cards) {
      const re = c.re;
      const maxed = re.lvl >= CFG.reactorMaxLvl;
      const cost = maxed ? 0 : lvlCostOf(re);
      c.pips.textContent = "▮".repeat(re.lvl) + "▯".repeat(CFG.reactorMaxLvl - re.lvl);
      c.rate.textContent = "$" + fmt(incomeOf(re)) + "/s";
      if (maxed) { c.btn.textContent = "MAX"; c.btn.disabled = true; }
      else { c.btn.textContent = "Upgrade $" + fmt(cost); c.btn.disabled = S.money < cost; }
    }
    if (nextCard) {
      const def = CFG.reactors[S.reactors.length];
      const btn = nextCard.querySelector("button");
      btn.disabled = S.money < def.cost;
    }
    root.querySelectorAll(".bcard").forEach((card) => {
      const id = card.querySelector("button").dataset.b;
      const b = CFG.boosts[id], lvl = S.boosts[id] || 0;
      const btn = card.querySelector("button");
      if (lvl >= b.costs.length) { btn.textContent = "MAX"; btn.disabled = true; }
      else { btn.textContent = "$" + fmt(b.costs[lvl]); btn.disabled = S.money < b.costs[lvl]; }
    });
  }

  function tick(dt) {
    animT += dt;
    if (!root || !document.body.classList.contains("tab-home")) return;
    for (const c of cards) drawReactor(c.cv, c.re, animT);
  }

  function drawReactor(cv, re, t) {
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 56, 100);
    const def = CFG.reactors[re.t];
    const led = ["#ffe08a", "#a3ffcf", "#8ad4ff", "#d4a3ff", "#ffb38a", "#ff8ab5"][re.t % 6];

    ctx.fillStyle = "#16241e";
    ctx.fillRect(6, 92, 44, 6);
    ctx.fillRect(10, 86, 36, 6);
    ctx.fillStyle = "#0f1a15";
    ctx.fillRect(8, 97, 6, 3); ctx.fillRect(42, 97, 6, 3);

    let x0 = 16, x1 = 40, y0 = 12, y1 = 86;
    if (re.t === 0) { x0 = 23; x1 = 33; }
    if (re.t === 2) { x0 = 9; x1 = 47; }
    if (re.t === 4) { x0 = 12; x1 = 44; }

    const dens = 0.45 + Math.min(0.4, re.lvl * 0.04);
    ctx.fillStyle = `rgba(74,160,110,${dens})`;
    ctx.fillRect(x0, y0 + 6, x1 - x0, y1 - y0 - 6);
    ctx.fillStyle = "rgba(180,255,210,0.25)";
    ctx.fillRect(x0 + 2, y0 + 6, 2, y1 - y0 - 6);

    const nb = Math.min(2 + re.lvl, 7);
    const spd = 14 + re.lvl * 4 + re.t * 6;
    for (let i = 0; i < nb; i++) {
      const h1 = hash(i * 3 + re.t * 7 + 1), h2 = hash(i * 5 + re.t * 11 + 2);
      const yy = ((t * spd * (0.6 + h1 * 0.6) + h1 * 100) % (y1 - y0 - 12));
      const bx = Math.round(x0 + 3 + h2 * (x1 - x0 - 8) + Math.sin(t * 2 + i * 2.1) * 1.5);
      const by = Math.round(y1 - 4 - yy);
      ctx.fillStyle = "rgba(220,255,235,0.75)";
      ctx.fillRect(bx, by, 2, 2);
    }

    if (re.t === 3) {
      ctx.strokeStyle = "rgba(190,255,215,0.5)";
      for (let k = 0; k < 4; k++) {
        const off = ((t * 26 + k * 9) % 30);
        ctx.strokeRect(x0 + 2.5, y0 + 8 + off, x1 - x0 - 5, 3);
      }
    }
    if (re.t === 4) {
      ctx.fillStyle = "rgba(20,35,28,0.9)";
      for (let k = 1; k < 3; k++) ctx.fillRect(x0 + ((x1 - x0) / 3) * k, y0 + 6, 1, y1 - y0 - 6);
    }
    if (re.t === 5) {
      const ang = t * (1.5 + re.lvl * 0.2);
      ctx.strokeStyle = "rgba(200,255,225,0.65)";
      ctx.beginPath();
      ctx.moveTo(28, y0 + 8); ctx.lineTo(28 + Math.cos(ang) * 10, y0 + 24 + Math.sin(ang) * 4);
      ctx.moveTo(28, y0 + 16); ctx.lineTo(28 - Math.cos(ang) * 10, y0 + 32 - Math.sin(ang) * 4);
      ctx.stroke();
    }

    if (re.lvl >= 3 || re.t >= 1) {
      const ang2 = t * (2 + re.lvl * 0.3);
      ctx.strokeStyle = "rgba(200,255,225,0.5)";
      ctx.beginPath(); ctx.moveTo(28, y1 - 4); ctx.lineTo(28 + Math.cos(ang2) * 9, y1 - 4 + Math.sin(ang2) * 3); ctx.stroke();
    }

    ctx.fillStyle = led;
    ctx.fillRect(x0 - 4, y0 + 2, 2, y1 - y0 - 2);
    const glow = 0.5 + Math.sin(t * 2.2) * 0.2 + re.lvl * 0.03;
    ctx.fillStyle = led; ctx.globalAlpha = Math.min(1, glow) * 0.5;
    ctx.fillRect(x0 - 5, y0, 4, 3);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "#0c1712";
    ctx.lineWidth = 2;
    if (re.t === 0) {
      ctx.strokeRect(x0 - 1, y0, x1 - x0 + 2, y1 - y0 + 4);
      ctx.fillStyle = "#0c1712"; ctx.fillRect(x0 - 2, y0 - 3, x1 - x0 + 4, 3);
    } else {
      roundFrame(ctx, x0 - 1, y0 - 2, x1 - x0 + 2, y1 - y0 + 6);
    }

    if (re.lvl >= 5) {
      ctx.fillStyle = "#39584a";
      ctx.fillRect(x1 + 3, y1 - 22, 5, 14);
      ctx.fillStyle = "#8ad4ff";
      ctx.fillRect(x1 + 4, y1 - 20 + ((t * 8) % 8), 3, 2);
    }
    if (re.lvl >= 8) {
      ctx.fillStyle = led;
      ctx.fillRect(x1 + 1, y0 + 2, 2, y1 - y0 - 2);
    }

    for (let p = 0; p < Math.min(re.lvl, 5); p++) {
      ctx.fillStyle = led;
      ctx.fillRect(8 + p * 3, 4, 2, 2);
    }
  }

  function drawSilhouette(cv, t) {
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 56, 100);
    ctx.strokeStyle = "rgba(140,190,160,0.35)";
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(14.5, 12.5, 27, 76);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(140,190,160,0.18)";
    ctx.font = "8px monospace";
    ctx.fillText("?", 25, 55);
  }

  function roundFrame(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x + 3, y); ctx.lineTo(x + w - 3, y);
    ctx.arcTo(x + w, y, x + w, y + 3, 3);
    ctx.lineTo(x + w, y + h - 3);
    ctx.arcTo(x + w, y + h, x + w - 3, y + h, 3);
    ctx.lineTo(x + 3, y + h);
    ctx.arcTo(x, y + h, x, y + h - 3, 3);
    ctx.lineTo(x, y + 3);
    ctx.arcTo(x, y, x + 3, y, 3);
    ctx.stroke();
  }

  return { mount, refresh, tick, incomeOf };
}

export function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e4) return (n / 1e3).toFixed(1) + "k";
  if (n >= 100) return Math.round(n).toString();
  return n.toFixed(n < 10 ? 1 : 0);
}
