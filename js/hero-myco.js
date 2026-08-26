/* ============================================================
   Orr Biologicals — hero-myco.js
   Premium mycelium-network hero for /mycophyte.
   Procedural canvas: hyphae grow, branch, and glow; nodes pulse;
   spores drift in warm amber light. Perf-guarded (DPR clamp,
   pause when hidden/off-screen, reduced-motion static frame).
   Public API: window.MycoHero = { pause, resume }
   ============================================================ */
(function () {
  "use strict";
  var canvas = document.getElementById("myco-hero");
  if (!canvas) return;

  var reduce =
    (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ||
    (navigator.connection && navigator.connection.saveData);
  var mobile = window.matchMedia && matchMedia("(max-width: 720px)").matches;

  var ctx = canvas.getContext("2d");
  if (!ctx) { canvas.classList.add("no-canvas"); return; }

  var DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
  var W = 0, H = 0;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, Math.floor(W * DPR));
    canvas.height = Math.max(1, Math.floor(H * DPR));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  function rnd(i, s) { var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }

  /* ---------- hyphae ---------- */
  var NH = mobile ? 26 : 46;
  var hyphae = [];
  function newHypha() {
    var spawnX = W * (0.15 + rnd(hyphae.length, 1) * 0.7);
    var spawnY = H * (0.3 + rnd(hyphae.length, 2) * 0.6);
    return {
      pts: [{ x: spawnX, y: spawnY }],
      dir: rnd(hyphae.length, 3) * 6.283,
      len: 0, maxLen: 140 + rnd(hyphae.length, 4) * 220,
      segs: 44, width: 2.6 + rnd(hyphae.length, 5) * 3.4,
      branchTimer: 30 + rnd(hyphae.length, 6) * 90,
      hue: 0.95 + rnd(hyphae.length, 7) * 0.1,   // warm amber
      a: 0.16 + rnd(hyphae.length, 8) * 0.2,
      nodes: [],
      dead: false
    };
  }
  for (var i = 0; i < NH; i++) hyphae.push(newHypha());

  function growHypha(h, dt) {
    var steps = Math.max(1, Math.round(dt * 14));
    for (var s = 0; s < steps && h.len < h.maxLen; s++) {
      h.dir += (rnd(h.len + s, 11) - 0.5) * 0.9;
      var last = h.pts[h.pts.length - 1];
      var stepL = 2.4;
      var nx = last.x + Math.cos(h.dir) * stepL;
      var ny = last.y + Math.sin(h.dir) * stepL;
      h.pts.push({ x: nx, y: ny });
      h.len += stepL;
      h.branchTimer -= 1;
      if (h.branchTimer <= 0 && h.pts.length > 8 && h.len < h.maxLen * 0.8) {
        h.branchTimer = 60 + rnd(h.pts.length, 12) * 140;
        h.nodes.push({ x: nx, y: ny, r: 2.2 + rnd(h.pts.length, 13) * 2.4, born: 0 });
        hyphae.push(branchOf(h, h.dir + (rnd(h.pts.length, 14) - 0.5) * 1.5, nx, ny));
      }
      if (h.pts.length > h.segs) h.pts.shift();
    }
    if (h.len >= h.maxLen) h.dead = true;
    for (var n = 0; n < h.nodes.length; n++) h.nodes[n].born += dt;
  }

  function branchOf(parent, dir, x, y) {
    var b = {
      pts: [{ x: x, y: y }], dir: dir,
      len: 0, maxLen: 60 + rnd(x, 21) * 110,
      segs: 30, width: parent.width * 0.55,
      branchTimer: 999, hue: parent.hue, a: parent.a * 0.9,
      nodes: [], dead: false
    };
    b.pts.push({ x: x + Math.cos(dir) * 4, y: y + Math.sin(dir) * 4 });
    b.len = 4;
    return b;
  }

  function drawHypha(h) {
    var pts = h.pts;
    if (pts.length < 2) return;
    ctx.lineCap = "round";
    /* tapered body: draw short strokes, width falls off toward the tip */
    var n = pts.length;
    for (var k = 0; k < n - 1; k++) {
      var w = h.width * (1 - (k / n) * 0.92);
      ctx.strokeStyle = "rgba(240,168,58," + (h.a * (1 - (k / n) * 0.6)).toFixed(3) + ")";
      ctx.lineWidth = Math.max(0.4, w);
      ctx.beginPath();
      ctx.moveTo(pts[k].x, pts[k].y);
      ctx.lineTo(pts[k + 1].x, pts[k + 1].y);
      ctx.stroke();
    }
    /* glow tip */
    var tip = pts[n - 1];
    var gg = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 9);
    gg.addColorStop(0, "rgba(240,200,130," + (h.a * 0.8) + ")");
    gg.addColorStop(1, "rgba(240,200,130,0)");
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(tip.x, tip.y, 9, 0, 6.283); ctx.fill();
    /* nodes */
    for (var i = 0; i < h.nodes.length; i++) {
      var nd = h.nodes[i];
      var pulse = 0.5 + 0.5 * Math.sin(nd.born * 0.9 + i);
      var rr = nd.r * (0.7 + 0.3 * pulse);
      ctx.fillStyle = "rgba(240,190,110," + (0.5 * (0.5 + 0.5 * pulse)) + ")";
      ctx.beginPath(); ctx.arc(nd.x, nd.y, rr, 0, 6.283); ctx.fill();
    }
  }

  /* ---------- spores ---------- */
  var NS = mobile ? 26 : 60;
  var spores = [];
  for (var j = 0; j < NS; j++) {
    spores.push({
      x: rnd(j, 31) * W, y: rnd(j, 32) * H,
      r: 0.8 + rnd(j, 33) * 1.8,
      vy: -(0.12 + rnd(j, 34) * 0.3),
      vx: (rnd(j, 35) - 0.5) * 0.16,
      sway: rnd(j, 36) * 6.283, swayF: 0.4 + rnd(j, 37) * 0.8,
      a: 0.05 + rnd(j, 38) * 0.16
    });
  }

  /* ---------- loop ---------- */
  var running = true, hidden = false, inView = true, rafId = 0;
  function schedule() {
    if (!running || hidden || !inView || rafId) return;
    rafId = requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    if (hidden && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    else schedule();
  });
  if ("IntersectionObserver" in window) {
    var ob = new IntersectionObserver(function (es) {
      inView = es[0] ? es[0].isIntersecting : true;
      if (!inView && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      else schedule();
    }, { rootMargin: "10%" });
    ob.observe(canvas);
  }

  var last = 0;
  function frame(now) {
    rafId = 0;
    if (!running || hidden || !inView) return;
    var dt = Math.min(0.05, ((now || 0) - last) / 1000 || 0.016);
    last = now || 0;

    ctx.clearRect(0, 0, W, H);

    /* deep earth gradient */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0b0805");
    bg.addColorStop(0.55, "#0d0a06");
    bg.addColorStop(1, "#120c07");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* central warm bloom behind the product */
    var bloom = ctx.createRadialGradient(W * 0.5, H * 0.52, 10, W * 0.5, H * 0.52, H * 0.5);
    bloom.addColorStop(0, "rgba(240,150,60,0.10)");
    bloom.addColorStop(1, "rgba(240,150,60,0)");
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);

    /* spores (additive) */
    ctx.globalCompositeOperation = "lighter";
    for (var s = 0; s < spores.length; s++) {
      var sp = spores[s];
      sp.y += sp.vy; sp.x += sp.vx + Math.sin(sp.sway) * 0.05; sp.sway += sp.swayF * 0.05;
      if (sp.y < -20) { sp.y = H + 20; sp.x = rnd(s, 41) * W; }
      if (sp.x < -20) sp.x = W + 20; if (sp.x > W + 20) sp.x = -20;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, 6.283);
      ctx.fillStyle = "rgba(240,196,120," + sp.a + ")";
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    /* hyphae */
    for (var h = 0; h < hyphae.length; h++) {
      var hy = hyphae[h];
      if (hy.dead) { hyphae.splice(h, 1); h--; continue; }
      growHypha(hy, dt);
      drawHypha(hy);
    }
    if (hyphae.length < NH * 0.6) for (var r = 0; r < 4; r++) hyphae.push(newHypha());

    /* vignette */
    var vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    if (!reduce) schedule();
  }

  /* reduced motion: one static frame */
  if (reduce) {
    for (var i = 0; i < hyphae.length; i++) {
      var h0 = hyphae[i];
      for (var g = 0; g < h0.maxLen / 2.4; g++) growHypha(h0, 0.15);
      drawHypha(h0);
    }
    ctx.globalCompositeOperation = "lighter";
    for (var k = 0; k < spores.length; k++) {
      ctx.beginPath();
      ctx.arc(spores[k].x, spores[k].y, spores[k].r, 0, 6.283);
      ctx.fillStyle = "rgba(240,196,120," + spores[k].a + ")";
      ctx.fill();
    }
  } else {
    schedule();
  }

  window.MycoHero = {
    pause: function () { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } },
    resume: function () { if (!running) { running = true; schedule(); } }
  };
})();
