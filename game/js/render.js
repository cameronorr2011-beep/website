import { CFG } from "./config.js";

function moteSprite(big) {
  const s = big ? 44 : 26;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(s / 2, s / 2, 1, s / 2, s / 2, s / 2);
  if (big) { grad.addColorStop(0, "rgba(255,236,170,0.95)"); grad.addColorStop(0.35, "rgba(255,208,110,0.5)"); }
  else { grad.addColorStop(0, "rgba(214,255,228,0.9)"); grad.addColorStop(0.4, "rgba(120,230,160,0.45)"); }
  grad.addColorStop(1, "rgba(90,208,122,0)");
  g.fillStyle = grad;
  g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 1, 0, Math.PI * 2); g.fill();
  return c;
}

function bactSprite() {
  const s = 40;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d");
  g.strokeStyle = "rgba(224,122,122,0.9)";
  g.lineWidth = 2.5;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    g.beginPath();
    g.moveTo(s / 2 + Math.cos(a) * 6, s / 2 + Math.sin(a) * 6);
    g.lineTo(s / 2 + Math.cos(a) * 13, s / 2 + Math.sin(a) * 13);
    g.stroke();
  }
  g.fillStyle = "#e07a7a";
  g.beginPath(); g.arc(s / 2, s / 2, 8, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#ffd9d9";
  g.beginPath(); g.arc(s / 2 - 2, s / 2 - 3, 3, 0, Math.PI * 2); g.fill();
  return c;
}

export function createRenderer(canvas, sim) {
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  const spSmall = moteSprite(false), spBig = moteSprite(true), spBact = bactSprite();
  const dustFar = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.6, p: Math.random() * 9 }));
  const dustNear = Array.from({ length: 30 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 2.4 + 1, p: Math.random() * 9 }));
  const cam = { x: CFG.world.w / 2, y: CFG.world.h / 2 };
  let t = 0;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
  }
  resize();
  addEventListener("resize", resize);

  function draw(dt) {
    t += dt;
    if (canvas.clientWidth !== W || canvas.clientHeight !== H || canvas.width !== Math.round(W * dpr)) resize();
    const S = sim.S, b = sim.blob;

    const bvx = b.cx - b.cpx, bvy = b.cy - b.cpy;
    const tx = b.cx + bvx * 22, ty = b.cy + bvy * 22;
    cam.x += (tx - cam.x) * Math.min(1, dt * 6);
    cam.y += (ty - cam.y) * Math.min(1, dt * 6);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#06231a");
    bg.addColorStop(0.55, "#04160f");
    bg.addColorStop(1, "#020a07");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (sim.quality === "high") {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = "#baf7cd";
      for (let i = 0; i < 3; i++) {
        const sx = ((i * 620 - cam.x * 0.25) % (W + 500)) - 250;
        ctx.beginPath();
        ctx.moveTo(sx, 0); ctx.lineTo(sx + 130, 0);
        ctx.lineTo(sx + 260, H); ctx.lineTo(sx + 40, H);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    drawDust(dustFar, 0.35, 0.16);

    const ox = W / 2 - cam.x, oy = H / 2 - cam.y;

    for (const m of sim.motes) {
      if (m.respawn > 0) continue;
      const bob = Math.sin(t * 2 + m.phase) * 2;
      const spr = m.big ? spBig : spSmall;
      const sc = m.big ? 1 : 0.8 + Math.sin(t * 3 + m.phase) * 0.15;
      const sz = spr.width * sc;
      ctx.drawImage(spr, m.x + ox - sz / 2, m.y + oy + bob - sz / 2, sz, sz);
    }

    for (const n of sim.npcs) {
      const r = (n.r + n.grow * 12) ;
      const wob = 1 + Math.sin(t * 4 + n.seed) * 0.09;
      const cx = n.x + ox, cy = n.y + oy;
      if (cx < -60 || cx > W + 60 || cy < -60 || cy > H + 60) continue;
      ctx.fillStyle = "rgba(96,190,132,0.85)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * wob, r / wob, n.seed, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(210,255,225,0.5)";
      ctx.beginPath(); ctx.ellipse(cx - r * 0.25, cy - r * 0.3, r * 0.28, r * 0.2, n.seed, 0, Math.PI * 2); ctx.fill();
    }

    for (const ba of sim.bacteria) {
      const bx = ba.x + ox, by = ba.y + oy;
      if (bx < -60 || bx > W + 60 || by < -60 || by > H + 60) continue;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.atan2(ba.vy, ba.vx));
      ctx.drawImage(spBact, -20, -20);
      ctx.restore();
    }

    drawPlayer(b, ox, oy, S);

    drawDust(dustNear, 0.7, 0.22);

    for (const f of sim.fx) {
      const a = Math.max(0, f.life / f.max);
      if (f.kind === "txt") {
        ctx.globalAlpha = a;
        ctx.fillStyle = f.color;
        ctx.font = "600 13px 'IBM Plex Mono',monospace";
        ctx.fillText(f.txt, f.x + ox, f.y + oy);
      } else if (f.kind === "ring") {
        ctx.globalAlpha = a * 0.8;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(f.x + ox, f.y + oy, (1 - a) * 70 + 10, 0, Math.PI * 2);
        ctx.stroke();
      } else if (f.kind === "burst") {
        ctx.globalAlpha = a;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(f.x + ox, f.y + oy, (1 - a) * 180 + b.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (sim.hitFlash > 0) {
      ctx.fillStyle = `rgba(224,110,110,${sim.hitFlash * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawPlayer(b, ox, oy, S) {
    const pts = b.pts.map((p) => ({ x: p.x + ox, y: p.y + oy }));
    const path = new Path2D();
    const mid = (a, c) => ({ x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 });
    let m0 = mid(pts[b.n - 1], pts[0]);
    path.moveTo(m0.x, m0.y);
    for (let i = 0; i < b.n; i++) {
      const p = pts[i], nx = pts[(i + 1) % b.n];
      const m = mid(p, nx);
      path.quadraticCurveTo(p.x, p.y, m.x, m.y);
    }
    path.closePath();

    const px = b.cx + ox, py = b.cy + oy;
    const stageTint = ["#69e08e", "#7de89b", "#8fefab", "#a3f2ba", "#b7f5c9", "#cdf8db"][Math.min(S.stageIdx, 5)];
    const grad = ctx.createRadialGradient(px - b.r * 0.3, py - b.r * 0.4, b.r * 0.15, px, py, b.r * 1.6);
    grad.addColorStop(0, stageTint);
    grad.addColorStop(0.65, "rgba(64,168,108,0.92)");
    grad.addColorStop(1, "rgba(38,120,76,0.88)");
    ctx.fillStyle = grad;
    ctx.fill(path);
    ctx.strokeStyle = "rgba(220,255,235,0.75)";
    ctx.lineWidth = 2;
    ctx.stroke(path);

    ctx.fillStyle = "rgba(240,255,245,0.85)";
    ctx.beginPath();
    ctx.arc(b.nx + ox, b.ny + oy, b.r * 0.34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(30,90,58,0.5)";
    for (let i = 0; i < 3; i++) {
      const a = t * (0.5 + i * 0.21) + i * 2.1;
      const rr = b.r * (0.45 + 0.18 * Math.sin(t * 0.8 + i));
      ctx.beginPath();
      ctx.arc(px + Math.cos(a) * rr, py + Math.sin(a) * rr, 2.6 + i * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.14 + Math.sin(t * 2.6) * 0.05;
    ctx.fillStyle = stageTint;
    ctx.beginPath();
    ctx.arc(px, py, b.r * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawDust(arr, parallax, alpha) {
    ctx.fillStyle = `rgba(190,235,205,${alpha})`;
    for (const d of arr) {
      const x = ((d.x * CFG.world.w - cam.x * parallax) % W + W) % W;
      const y = ((d.y * CFG.world.h - cam.y * parallax) % H + H) % H;
      ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.sin(t * 1.3 + d.p));
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return { draw, cam };
}
