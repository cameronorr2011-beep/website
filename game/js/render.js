/* Canvas renderer: micro view (camera-follow) + reactor view + scale transition.
   Simulation state is read-only here — no gameplay decisions. */
import { CFG } from "./config.js";

const RES_COLORS = Object.fromEntries(CFG.resources.map((r) => [r.kind, r.color]));

export function createRenderer(canvas, S, sim, reactor) {
  const ctx = canvas.getContext("2d");
  let dpr = 1;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    sim.view.w = innerWidth; sim.view.h = innerHeight;
  }
  addEventListener("resize", resize); resize();

  function draw(alpha, tNow) {
    const v = sim.view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (v.mode === "micro") drawMicro(v, tNow);
    else drawReactor(tNow);
  }

  /* ============ MICRO VIEW ============ */
  function drawMicro(v, tNow) {
    const P = S.player;
    const lowQ = v.quality === "low";
    // camera follows player smoothly
    const k = 0.08;
    v.x += (P.x - v.x) * k;
    v.y += (P.y - v.y) * k;

    // water background with light shafts
    const g = ctx.createLinearGradient(0, 0, 0, v.h);
    g.addColorStop(0, "#071710"); g.addColorStop(1, "#040a08");
    ctx.fillStyle = g; ctx.fillRect(0, 0, v.w, v.h);

    ctx.save();
    ctx.translate(v.w / 2, v.h / 2);
    ctx.scale(v.zoom, v.zoom);
    ctx.translate(-v.x, -v.y);

    // light shafts (skipped in low quality mode)
    if (!lowQ) {
      ctx.globalAlpha = 0.05 + Math.sin(tNow / 2400) * 0.02;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = "#cfe8b8";
        ctx.save();
        ctx.translate((i * 700 + ((tNow / 60) % 700)) % CFG.world.w, 0);
        ctx.rotate(0.3);
        ctx.fillRect(0, -400, 90 + i * 30, CFG.world.h * 1.6);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    // zone auras
    for (const z of sim.zones) {
      const col = z.kind === "dark" ? "rgba(6,10,14,.55)" :
        z.kind === "lightridge" ? "rgba(255,233,163,.05)" :
        z.kind === "bacterial" ? "rgba(224,122,122,.06)" :
        z.kind === "bubbly" ? "rgba(180,220,255,.04)" :
        z.kind === "waste" ? "rgba(120,110,70,.07)" : "rgba(140,200,160,.04)";
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.fill();
    }

    // buildings
    for (const b of S.buildings) drawBuilding(b);

    // nutrients
    for (const n of sim.pool.live) {
      ctx.fillStyle = RES_COLORS[n.kind] ?? "#fff";
      ctx.globalAlpha = n.kind === "light" ? 0.85 : 0.7;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.kind === "light" ? 2.4 : 2, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // algae cells
    for (const c of sim.algae) drawCell(c.x, c.y, c.r, c.hue, 0.9, tNow + c.id * 300, 1);

    // bacteria
    for (const b of sim.bact) {
      const col = CFG.bacteria[b.kind].color;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.r * 1.7, b.r * 0.8, Math.atan2(b.vy, b.vx), 0, 7);
      ctx.fill();
      if (b.kind === "beneficial") { ctx.strokeStyle = "rgba(122,208,224,.35)"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.6, 0, 7); ctx.stroke(); }
    }

    // player (bigger, glowing)
    const P2 = S.player;
    ctx.shadowColor = `hsla(${P2.hue},80%,65%,.8)`; ctx.shadowBlur = 26;
    drawCell(P2.x, P2.y, P2.r * P2.size, P2.hue, 1, tNow, P2.flagella);
    ctx.shadowBlur = 0;

    // bubbles rising (fewer on low quality)
    ctx.strokeStyle = "rgba(210,235,215,.25)";
    const nBub = lowQ ? 8 : 18;
    for (let i = 0; i < nBub; i++) {
      const bx = ((i * 467 + tNow / 14) % CFG.world.w);
      const by = CFG.world.h - ((tNow / 6 + i * 313) % CFG.world.h);
      ctx.beginPath(); ctx.arc(bx, by, 2 + (i % 4), 0, 7); ctx.stroke();
    }

    ctx.restore();

    // vignette
    const vg = ctx.createRadialGradient(v.w / 2, v.h / 2, v.h * 0.42, v.w / 2, v.h / 2, v.h);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(2,6,4,.75)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, v.w, v.h);
  }

  function drawCell(x, y, r, hue, alpha, t, flag) {
    ctx.globalAlpha = alpha;
    // flagella tails
    if (flag > 1.02) {
      ctx.strokeStyle = `hsla(${hue},70%,72%,.5)`;
      ctx.lineWidth = 1.4;
      for (let f = 0; f < 3; f++) {
        ctx.beginPath();
        const a = t / 130 + f * 2.1;
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
          x + Math.cos(a) * r * 2.2, y + Math.sin(a) * r * 2.2,
          x + Math.cos(a + 0.9) * r * 3.4 * flag * 0.6, y + Math.sin(a + 0.9) * r * 3.4 * flag * 0.6
        );
        ctx.stroke();
      }
    }
    // body
    const bodyGrad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.15, x, y, r);
    bodyGrad.addColorStop(0, `hsla(${hue},85%,78%,.95)`);
    bodyGrad.addColorStop(0.65, `hsl(${hue},62%,44%)`);
    bodyGrad.addColorStop(1, `hsl(${hue},58%,24%)`);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.12, r * 0.86, t / 900 % 3.14, 0, 7);
    ctx.fill();
    // chloroplast specks
    ctx.fillStyle = `hsla(${hue},90%,86%,.8)`;
    for (let i = 0; i < 3; i++) {
      const a = t / 500 + i * 2.2;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.35, r * 0.16, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawBuilding(b) {
    const col = { cluster: "#5ad07a", biofilm: "#7ad0e0", lightfarm: "#ffe9a3", hub: "#e8b8ff", nursery: "#f5b8c8" }[b.kind];
    ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(b.x, b.y, 34, 0, 7); ctx.stroke();
    ctx.globalAlpha = 0.16; ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(b.x, b.y, 34, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(b.x, b.y, 4.5, 0, 7); ctx.fill();
  }

  /* ============ REACTOR VIEW ============ */
  function drawReactor(tNow) {
    const R = reactor.readouts();
    const w = sim.view.w, h = sim.view.h;
    ctx.fillStyle = "#04080a"; ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 + 20;
    const vw = Math.min(w * 0.52, 340), vh = Math.min(h * 0.6, 480);

    // vessel
    roundRect(cx - vw / 2, cy - vh / 2, vw, vh, 60);
    ctx.fillStyle = "#071310"; ctx.fill();
    ctx.strokeStyle = "rgba(150,190,170,.35)"; ctx.lineWidth = 3; ctx.stroke();

    // culture column (density → green fill level & opacity)
    const fillH = vh * (0.25 + R.density * 0.68);
    ctx.save();
    roundRect(cx - vw / 2, cy - vh / 2, vw, vh, 60); ctx.clip();
    const cg = ctx.createLinearGradient(0, cy + vh / 2 - fillH, 0, cy + vh / 2);
    const dens = 0.25 + R.density * 0.75;
    cg.addColorStop(0, `hsla(${120 - R.contamination * 80},64%,${28 + R.growth * 12}%,${dens})`);
    cg.addColorStop(1, `hsla(${115 - R.contamination * 90},70%,${14 + R.growth * 8}%,${Math.min(1, dens + 0.2)})`);
    ctx.fillStyle = cg;
    ctx.fillRect(cx - vw / 2, cy + vh / 2 - fillH, vw, fillH);

    // bubbles
    ctx.strokeStyle = "rgba(220,245,225,.4)";
    for (let i = 0; i < 16; i++) {
      const bx = cx - vw / 2 + ((i * 97 + tNow / 40) % vw);
      const by = cy + vh / 2 - ((tNow / 3 + i * 151) % (fillH || vh));
      ctx.beginPath(); ctx.arc(bx, by, 1.6 + (i % 3), 0, 7); ctx.stroke();
    }
    ctx.restore();

    // light bars on side (intensity)
    const bars = Math.round((S.reactor.light / 100) * 8);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i < bars ? "rgba(255,233,163,.85)" : "rgba(255,233,163,.12)";
      ctx.fillRect(cx + vw / 2 + 16, cy - vh / 2 + 14 + i * ((vh - 20) / 8), 26, (vh - 28) / 8 - 8);
    }
    ctx.fillStyle = "rgba(232,240,232,.55)";
    ctx.font = "10px 'IBM Plex Mono', monospace";
    ctx.fillText("LIGHT", cx + vw / 2 + 16, cy - vh / 2 + 6);

    // readout strip
    ctx.fillStyle = "rgba(232,240,232,.8)";
    ctx.font = "12px 'IBM Plex Mono', monospace";
    const lines = [
      `AP-01 · ${CFG.stages[S.stage].name}`,
      `growth ${R.growth.toFixed(2)} · O₂ ${R.oxygen.toFixed(2)}`,
      `contamination ${(R.contamination * 100).toFixed(0)}% · health ${(R.health * 100).toFixed(0)}%`,
    ];
    lines.forEach((s, i) => ctx.fillText(s, cx - vw / 2, cy - vh / 2 - 40 + i * 17));

    // warning glow if contamination high
    if (R.contamination > 0.4) {
      ctx.fillStyle = `rgba(224,122,122,${(R.contamination - 0.4) * 0.25})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return { draw, resize };
}
