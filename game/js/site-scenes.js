/* Landing scene canvases: hero world, colony growth, bacteria vignette, ambient layers.
   All scenes share one pattern: IntersectionObserver-gated rAF, capped DPR,
   static single frame when user prefers reduced motion. */
const DPR = Math.min(1.5, devicePixelRatio || 1);

function fit(cv) {
  const r = cv.getBoundingClientRect();
  cv.width = Math.max(2, r.width * DPR);
  cv.height = Math.max(2, r.height * DPR);
  return { w: r.width, h: r.height };
}
function runner(cv, reduced, step) {
  const ctx = cv.getContext("2d");
  let visible = false, raf = 0, t = 0;
  function draw() { step(ctx, (cv.__dim ||= fit(cv)), t += 16, reduced); }
  if (reduced) {
    requestAnimationFrame(() => draw()); // single static frame
    return;
  }
  new IntersectionObserver((ens) => ens.forEach((en) => {
    visible = en.isIntersecting;
    if (visible && !raf) {
      const loop = () => { if (!visible) { raf = 0; return; } draw(); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
  }), { threshold: 0.02 }).observe(cv);
}

/* ---------- HERO: drifting algae + particles + bubbles ---------- */
export function initHero(cv, reduced) {
  const algae = Array.from({ length: 14 }, () => ({
    x: Math.random(), y: Math.random(), r: 8 + Math.random() * 20,
    vx: (Math.random() - .5) * .00012, vy: (Math.random() - .5) * .00009,
    hue: 120 + Math.random() * 40, ph: Math.random() * 7,
  }));
  const motes = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), s: .4 + Math.random() * 1.4, v: .00006 + Math.random() * .00018 }));
  const bubbles = Array.from({ length: 16 }, () => ({ x: Math.random(), y: Math.random(), s: 1 + Math.random() * 3, v: .0003 + Math.random() * .0005 }));
  runner(cv, reduced, (ctx, dim, t) => {
    const { w, h } = dim;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#071710"); g.addColorStop(1, "#040a08");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (const m of motes) {
      m.y -= m.v; if (m.y < -.02) { m.y = 1.02; m.x = Math.random(); }
      ctx.fillStyle = "rgba(207,232,184,.35)";
      ctx.fillRect(m.x * w, m.y * h, m.s, m.s);
    }
    for (const a of algae) {
      a.x += a.vx; a.y += a.vy;
      if (a.x < -.05 || a.x > 1.05) a.vx *= -1;
      if (a.y < -.05 || a.y > 1.05) a.vy *= -1;
      const px = a.x * w + Math.sin(t / 1600 + a.ph) * 10;
      const py = a.y * h + Math.cos(t / 2100 + a.ph) * 8;
      const rg = ctx.createRadialGradient(px - a.r * .3, py - a.r * .3, a.r * .1, px, py, a.r);
      rg.addColorStop(0, `hsla(${a.hue},80%,78%,.9)`);
      rg.addColorStop(.7, `hsla(${a.hue},60%,40%,.85)`);
      rg.addColorStop(1, `hsla(${a.hue},55%,22%,.6)`);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(px, py, a.r, a.r * .82, t / 3000 + a.ph, 0, 7);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(215,240,220,.28)";
    for (const b of bubbles) {
      b.y -= b.v; if (b.y < -.03) { b.y = 1.03; b.x = Math.random(); }
      ctx.beginPath(); ctx.arc(b.x * w, b.y * h, b.s, 0, 7); ctx.stroke();
    }
  });
}

/* ---------- COLONY: density driven by scroll ---------- */
export function initColony(cv, reduced) {
  const cells = [];
  function target() { return Math.round(1 + (window.__colonyDensity || .15) * 88); }
  runner(cv, reduced, (ctx, dim, t) => {
    const { w, h } = dim;
    ctx.clearRect(0, 0, w, h);
    while (cells.length < target()) {
      const ang = Math.random() * 7, rad = Math.pow(Math.random(), .6) * Math.min(w, h) * .42;
      cells.push({ x: w / 2 + Math.cos(ang) * rad, y: h / 2 + Math.sin(ang) * rad * .9, r: 3 + Math.random() * 5, ph: Math.random() * 7 });
    }
    if (cells.length > target()) cells.length = Math.max(target(), 30);
    for (const c of cells) {
      const jx = Math.sin(t / 900 + c.ph) * 1.6, jy = Math.cos(t / 1100 + c.ph) * 1.4;
      ctx.fillStyle = `hsla(${125 + c.ph * 4},65%,${38 + (c.ph % 1) * 18}%,.92)`;
      ctx.beginPath(); ctx.arc(c.x + jx, c.y + jy, c.r, 0, 7); ctx.fill();
    }
    // faint membrane
    ctx.strokeStyle = "rgba(90,208,122,.15)";
    ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.min(w, h) * .46, 0, 7); ctx.stroke();
  });
}

/* ---------- BACTERIA vignette loop ---------- */
export function initBacteria(cv, reduced, capEl) {
  const CAPS = [
    "A cell settles into a fresh nutrient patch…",
    "Motes drift in. Dinner time.",
    "…but a grazer caught the scent.",
    "Resources drop fast when mouths show up.",
    "Time to react — flee, wall up, or fight back.",
  ];
  let phase = 0, lastSwap = 0;
  const algae = { x: .25, y: .5 }, grazer = { x: .95, y: .2 };
  const patch = Array.from({ length: 26 }, () => ({ x: .62 + Math.random() * .22, y: .42 + Math.random() * .24, s: Math.random() }));
  runner(cv, reduced, (ctx, dim, t) => {
    const { w, h } = dim;
    ctx.fillStyle = "#081109"; ctx.fillRect(0, 0, w, h);
    phase = Math.floor((t / 2600) % 5);
    if (phase !== lastSwap) { lastSwap = phase; if (capEl) capEl.textContent = CAPS[phase]; }
    const ease = (t % 2600) / 2600;
    // nutrient patch shrinks as eaten
    const eat = phase >= 2 ? Math.max(.15, 1 - (phase - 1) * .32) : 1;
    ctx.fillStyle = "#a5e8b8";
    for (const p of patch) {
      if (p.s > eat) continue;
      ctx.globalAlpha = .8;
      ctx.beginPath(); ctx.arc(p.x * w, p.y * h, 2.2, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // algae eases toward patch
    algae.x += ((phase <= 1 ? .58 : phase === 4 ? .3 : .52) - algae.x) * .04;
    algae.y += (.52 - algae.y) * .04;
    const ag = ctx.createRadialGradient(algae.x * w, algae.y * h, 1, algae.x * w, algae.y * h, 13);
    ag.addColorStop(0, "#c2f7cf"); ag.addColorStop(1, "#1d7a44");
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.arc(algae.x * w, algae.y * h, 11, 0, 7); ctx.fill();
    // grazer appears from phase 2
    if (phase >= 2) {
      grazer.x += (algae.x - grazer.x) * .035;
      grazer.y += (algae.y - grazer.y) * .035;
      ctx.fillStyle = "#e07a7a";
      ctx.save();
      ctx.translate(grazer.x * w, grazer.y * h);
      ctx.rotate(Math.atan2((algae.y - .2), (algae.x - .95)));
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, 7); ctx.fill();
      ctx.restore();
    } else { grazer.x = .95; grazer.y = .2; }
    // caption progress bar
    ctx.fillStyle = "rgba(90,208,122,.5)";
    ctx.fillRect(0, h - 2, w * ((t % 2600) / 2600), 2);
  });
}

/* ---------- AMBIENT background layer for content sections ---------- */
export function initAmbient(cv, reduced) {
  const motes = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), s: .5 + Math.random() * 1.6, v: .00005 + Math.random() * .00012, d: Math.random() }));
  runner(cv, reduced, (ctx, dim, t) => {
    const { w, h } = dim;
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.y -= m.v * (m.d ? .5 : 1.6);
      if (m.y < -.02) { m.y = 1.02; m.x = Math.random(); }
      const depth = m.d ? .18 : .4;
      ctx.fillStyle = `rgba(159,232,180,${depth})`;
      const px = m.x * w + Math.sin(t / 3400 + m.s * 9) * 8;
      ctx.beginPath(); ctx.arc(px, m.y * h, m.s, 0, 7); ctx.fill();
    }
  });
}
