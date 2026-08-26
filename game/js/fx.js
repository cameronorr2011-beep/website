/* Pooled juice: eat pops, division bursts, damage flashes, floating +EP text */
export function createFx() {
  const pops = [], rings = [], texts = [];
  function pop(x, y, color, n = 8, spd = 90) {
    for (let i = 0; i < n && pops.length < 220; i++) {
      const a = Math.random() * Math.PI * 2, s = spd * (.4 + Math.random() * .8);
      pops.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5, t: 0, color });
    }
  }
  function ring(x, y, color, max = 34) { if (rings.length < 40) rings.push({ x, y, t: 0, life: .45, color, max }); }
  function text(x, y, str, color = "#ffe9a3") { if (texts.length < 30) texts.push({ x, y, str, color, t: 0, life: 1 }); }
  function step(dt) {
    for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; if (p.t > p.life) pops.splice(i, 1); }
    for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; if (r.t > r.life) rings.splice(i, 1); }
    for (let i = texts.length - 1; i >= 0; i--) { const x = texts[i]; x.t += dt; x.y -= 26 * dt; if (x.t > x.life) texts.splice(i, 1); }
  }
  function draw(ctx) {
    for (const p of pops) {
      ctx.globalAlpha = 1 - p.t / p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 7); ctx.fill();
    }
    for (const r of rings) {
      const k = r.t / r.life;
      ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = r.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(r.x, r.y, 6 + k * r.max, 0, 7); ctx.stroke();
    }
    ctx.font = "600 12px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
    for (const x of texts) { ctx.globalAlpha = 1 - x.t / x.life; ctx.fillStyle = x.color; ctx.fillText(x.str, x.x, x.y); }
    ctx.globalAlpha = 1; ctx.textAlign = "left";
  }
  return { pop, ring, text, step, draw };
}
