import { CFG } from "./config.js";
import { fx } from "./save.js";

const RES_COLORS = Object.fromEntries(CFG.resources.map((r) => [r.kind, r.color]));

export function createRenderer(canvas, S, sim, fxsys) {
  const ctx = canvas.getContext("2d");
  const far = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.4, v: .000008 + Math.random() * .00002 }));
  const mid = Array.from({ length: 20 }, () => ({ x: Math.random(), y: Math.random(), r: 3 + Math.random() * 7, ph: Math.random() * 7 }));
  let dpr = 1, W = 0, H = 0;
  function resize() {
    dpr = Math.min(1.75, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
  }
  addEventListener("resize", resize); resize();

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (sim.mode === "micro") drawMicro(t); else drawReactor(t);
  }

  /* ================= MICRO ================= */
  function drawMicro(t) {
    const P = S.player, v = sim.view;
    // camera: lerp + speed-based look-ahead
    const k = .07;
    v.x += (P.x + P.vx * .18 - v.x) * k;
    v.y += (P.y + P.vy * .18 - v.y) * k;

    // water
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#081711"); g.addColorStop(1, "#04090b");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // caustic shimmer (two roaming glows)
    for (let i = 0; i < 2; i++) {
      const cx = W * (.5 + .38 * Math.sin(t / 5200 + i * 2.4));
      const cy = H * (.45 + .35 * Math.cos(t / 6100 + i * 1.7));
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * .55);
      cg.addColorStop(0, "rgba(140,220,170,.05)"); cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
    }

    const q = sim.quality === "low";

    // FAR layer (screen-space parallax)
    ctx.fillStyle = "rgba(159,232,180,.14)";
    for (const f of far) {
      f.y -= f.v; if (f.y < -.02) { f.y = 1.02; f.x = Math.random(); }
      ctx.beginPath(); ctx.arc(f.x * W, f.y * H, f.r, 0, 7); ctx.fill();
    }

    ctx.save();
    // MID layer: half-parallax
    ctx.translate(W / 2 - (v.x * .5) % W, H / 2 - (v.y * .5) % H);
    ctx.fillStyle = "rgba(120,200,150,.06)";
    for (const m of mid) {
      const mx = ((m.x * W + Math.sin(t / 4000 + m.ph) * 30) % W + W) % W;
      const my = ((m.y * H + Math.cos(t / 5200 + m.ph) * 24) % H + H) % H;
      ctx.beginPath(); ctx.arc(mx, my, m.r, 0, 7); ctx.fill();
    }
    ctx.restore();

    // WORLD layer
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(v.zoom, v.zoom); ctx.translate(-v.x, -v.y);

    // zones
    if (!q) for (const z of S.zones) {
      const zx = z.x * CFG.world.w, zy = z.y * CFG.world.h, zr = z.r * CFG.world.w;
      const col = z.kind === "dark" ? "rgba(4,8,12,.5)" : z.kind === "lightridge" ? "rgba(255,233,163,.05)" :
        z.kind === "bacterial" ? "rgba(224,122,122,.05)" : z.kind === "waste" ? "rgba(130,120,80,.06)" : "rgba(140,210,160,.04)";
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(zx, zy, zr, 0, 7); ctx.fill();
    }

    // buildings
    for (const b of S.buildings) {
      const col = { cluster:"#5ad07a", biofilm:"#7ad0e0", lightfarm:"#ffe9a3", hub:"#e8b8ff", nursery:"#f5b8c8" }[b.kind];
      ctx.strokeStyle = col; ctx.globalAlpha = .16; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(b.x, b.y, 36, 0, 7); ctx.stroke();
      ctx.globalAlpha = .85; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(b.x, b.y, 4.5, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // nutrients (glow dots)
    for (const n of sim.pool.live) {
      ctx.fillStyle = RES_COLORS[n.kind] || "#fff";
      ctx.globalAlpha = n.kind === "light" ? .95 : .75;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.kind === "light" ? 2.6 : 2.2, 0, 7); ctx.fill();
      if (!q && n.kind === "phos") { ctx.strokeStyle = "rgba(232,184,255,.4)"; ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, 7); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;

    // colony cells as spiral filaments
    for (const c of sim.algae) trichome(c.x, c.y, c.r, c.hue, t * c.spin + c.phase, .8);

    // bacteria
    for (const b of sim.bact) {
      const B = CFG.bacteria[b.kind];
      ctx.fillStyle = B.color;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      const wob = Math.sin(b.wobble) * b.r * .25;
      ctx.beginPath();
      ctx.moveTo(-b.r * 1.9, wob);
      ctx.quadraticCurveTo(0, -wob, b.r * 1.9, wob * .6);
      ctx.lineTo(b.r * 1.6, wob * .6 + b.r * .9);
      ctx.quadraticCurveTo(-b.r, wob - b.r * .7, -b.r * 1.9, wob);
      ctx.fill();
      if (b.kind === "grazer" || b.kind === "pathogen") {
        // threat ping ring when near player
        const dp = Math.hypot(b.x - S.player.x, b.y - S.player.y);
        if (dp < 150) {
          ctx.globalAlpha = .35 * (1 - dp / 150);
          ctx.strokeStyle = "#ff9a9a"; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(0, 0, b.r * 2.8 + Math.sin(t / 120) * 2, 0, 7); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    }

    // PLAYER: big glowing trichome + nucleus
    ctx.shadowColor = `hsla(${P.hue},85%,65%,.9)`; ctx.shadowBlur = 24;
    trichome(P.x, P.y, P.r * P.size * 1.15, P.hue, t / 700, P.flagella);
    ctx.shadowBlur = 0;
    if (P.hp < 100) {
      // hp arc around player
      ctx.strokeStyle = P.hp > 40 ? "rgba(159,232,180,.8)" : "rgba(224,122,122,.9)";
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(P.x, P.y, P.r * 2, -Math.PI / 2, -Math.PI / 2 + (P.hp / 100) * Math.PI * 2); ctx.stroke();
    }
    // hurt vignette handled globally below

    // rising ambient bubbles
    ctx.strokeStyle = "rgba(215,240,220,.22)";
    const nB = q ? 7 : 16;
    for (let i = 0; i < nB; i++) {
      const bx = (i * 493 + t / 12) % CFG.world.w;
      const by = CFG.world.h - ((t / 5 + i * 331) % CFG.world.h);
      ctx.beginPath(); ctx.arc(bx, by, 1.6 + (i % 3), 0, 7); ctx.stroke();
    }

    fxsys.draw(ctx);
    ctx.restore();

    // vignette + low-hp pulse
    const vg = ctx.createRadialGradient(W/2, H/2, H*.42, W/2, H/2, H);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(2,6,4,.78)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (S.player.hp < 35 && !reduced()) {
      ctx.fillStyle = `rgba(160,50,50,${(.12 + Math.sin(t/180)*.06) * (1 - S.player.hp/35)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* Arthrospira-style spiral filament */
  function trichome(x, y, r, hue, rot, energy) {
    const segs = 16, len = r * 3.4, amp = r * (.42 + energy * .12);
    let px = 0, py = 0;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot * .3);
    // glow pass
    ctx.strokeStyle = `hsla(${hue},80%,60%,.25)`;
    ctx.lineWidth = r * 1.5; ctx.lineCap = "round";
    spiralPath(len, amp, rot); ctx.stroke();
    // body pass with tapering width
    const grad = ctx.createLinearGradient(-len/2, 0, len/2, 0);
    grad.addColorStop(0, `hsl(${hue},58%,26%)`);
    grad.addColorStop(.5, `hsl(${hue},66%,52%)`);
    grad.addColorStop(1, `hsl(${hue},70%,68%)`);
    ctx.strokeStyle = grad;
    for (let i = 0; i <= segs; i++) {
      const f0 = i / segs, f1 = Math.min(1, (i + 1) / segs);
      ctx.lineWidth = r * (.34 + Math.sin(Math.PI * f0) * .5);
      ctx.beginPath();
      pt(f0, len, amp, rot); ctx.lineTo(...lastPt());
      pt(f1, len, amp, rot); ctx.lineTo(...lastPt());
      ctx.stroke();
    }
    // highlight speck
    ctx.fillStyle = `hsla(${hue},90%,86%,.9)`;
    ctx.beginPath(); ctx.arc(Math.sin(rot*2)*len*.2, Math.cos(rot*2.3)*amp*.8, r*.16, 0, 7); ctx.fill();
    ctx.restore();

    function pt(f, L, A, rr) { px = -L/2 + f*L; py = Math.sin(f*Math.PI*3 + rr) * A; return [px, py]; }
    function lastPt() { return [px, py]; }
    function spiralPath(L, A, rr) { ctx.beginPath(); for (let i=0;i<=segs;i++){const [a,b]=pt(i/segs,L,A,rr); i?ctx.lineTo(a,b):ctx.moveTo(a,b);} }
  }

  /* ================= REACTOR ================= */
  function drawReactor(t) {
    const R = reactorReadouts();
    const w = W, h = H;
    ctx.fillStyle = "#04080a"; ctx.fillRect(0, 0, w, h);
    const cx = w/2, cy = h/2 + 14;
    const vw = Math.min(w*.5, 330), vh = Math.min(h*.62, 470);

    roundRect(cx-vw/2, cy-vh/2, vw, vh, 56);
    ctx.fillStyle = "#071310"; ctx.fill();
    ctx.strokeStyle = "rgba(170,205,185,.4)"; ctx.lineWidth = 3; ctx.stroke();

    const fillH = vh*(.28 + R.density*.64);
    ctx.save(); roundRect(cx-vw/2, cy-vh/2, vw, vh, 56); ctx.clip();
    const dens = .3 + R.density*.7;
    const cg = ctx.createLinearGradient(0, cy+vh/2-fillH, 0, cy+vh/2);
    cg.addColorStop(0, `hsla(${118-R.contamination*70},62%,${30+R.growth*10}%,${dens})`);
    cg.addColorStop(1, `hsla(${112-R.contamination*80},68%,${15+R.growth*7}%,${Math.min(1,dens+.2)})`);
    ctx.fillStyle = cg; ctx.fillRect(cx-vw/2, cy+vh/2-fillH, vw, fillH);
    ctx.strokeStyle = "rgba(225,245,230,.4)";
    for (let i=0;i<14;i++){
      const bx = cx-vw/2 + ((i*83 + t/38) % vw), by = cy+vh/2 - ((t/3 + i*137) % (fillH||vh));
      ctx.beginPath(); ctx.arc(bx,by,1.5+(i%3),0,7); ctx.stroke();
    }
    ctx.restore();
    // glare
    const gl = ctx.createLinearGradient(cx-vw/2, 0, cx-vw/2+vw*.4, 0);
    gl.addColorStop(0,"rgba(255,255,255,0)"); gl.addColorStop(.5,"rgba(255,255,255,.08)"); gl.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle = gl; ctx.fillRect(cx-vw/2, cy-vh/2, vw*.4, vh);

    const bars = Math.round((S.reactor.light/100)*8);
    for (let i=0;i<8;i++){
      ctx.fillStyle = i<bars ? "rgba(255,233,163,.9)" : "rgba(255,233,163,.12)";
      ctx.fillRect(cx+vw/2+14, cy-vh/2+12+i*((vh-18)/8), 24, (vh-26)/8-8);
    }
    ctx.fillStyle="rgba(232,240,232,.55)"; ctx.font="10px 'IBM Plex Mono',monospace";
    ctx.fillText("LIGHT", cx+vw/2+14, cy-vh/2+4);

    ctx.fillStyle="rgba(232,240,232,.85)"; ctx.font="12px 'IBM Plex Mono',monospace";
    [`AP-01 Â· ${CFG.stages[S.stage].name}`,
     `growth Ã—${R.growth.toFixed(2)} Â· Oâ‚‚ ${(R.oxygen*100)|0}%`,
     `contamination ${(R.contamination*100)|0}% Â· health ${(R.health*100)|0}%`]
     .forEach((s,i)=>ctx.fillText(s, cx-vw/2, cy-vh/2-38+i*17));

    if (R.contamination>.4){ ctx.fillStyle=`rgba(224,122,122,${(R.contamination-.4)*.28})`; ctx.fillRect(0,0,w,h); }
  }
  function reactorReadouts(){
    const r=S.reactor;
    const M=fx(S);
    const lightEff=(r.light/100)*M.lightUpgrade;
    const tf = r.temp<20||r.temp>38 ? .35 : 1-Math.abs(r.temp-34)/40;
    const pf = r.ph<8||r.ph>11 ? .3 : 1-Math.abs(r.ph-10)/12;
    const growth=Math.max(0,Math.min(2.4, lightEff*(0.5+(r.co2/100)*.6)*tf*pf));
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    return {
      density:clamp(S.biomass/120,0,1), growth,
      oxygen:clamp(growth*.8,0,1),
      contamination:clamp((r.ph<9?.5:.08)+(r.temp>37?.3:0)+(r.light>85?.15:0),0,1),
      health:clamp(1-Math.abs(r.temp-33)/25-Math.abs(r.ph-10)/8,0,1),
    };
  }
  function roundRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  }
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  return { draw, resize };
}
