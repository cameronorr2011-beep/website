/* ============================================================
   Cyanoflow — Orr Biologicals · js/cyanoflow.js
   Canvas scenes + interactions for the Cyanoflow page.
   1. Hero: microfluidic droplet train through a serpentine chip,
      imaging zone with tracking brackets, AI candidate highlights.
   2. Growth-trajectory canvas (section 05).
   3. Candidate phenotype map (section 06).
   4. Reveal-on-scroll + observation-card bar fill.
   Perf-guarded: DPR clamp, IntersectionObserver pause, prefers-
   reduced-motion renders static frames. No dependencies.
   ============================================================ */
(function () {
  "use strict";
  var reduce =
    (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ||
    (navigator.connection && navigator.connection.saveData);

  function rnd(i, s) { var x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); }

  function fitCanvas(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var w = cv.clientWidth || cv.parentElement.clientWidth;
    var h = cv.clientHeight || cv.parentElement.clientHeight || 300;
    cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr);
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* Shared run/pause-on-scroll helper */
  function loopWhenVisible(cv, draw) {
    if (reduce) { draw(1.2, true); return; }
    var run = false, last = 0;
    function frame(now) {
      if (!run) return;
      requestAnimationFrame(frame);
      if (document.hidden) return;
      if (now - last < 33) return;
      last = now;
      draw(now / 1000, false);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting && !run) { run = true; last = 0; requestAnimationFrame(frame); }
          else if (!en.isIntersecting) { run = false; }
        });
      }, { threshold: 0.04 }).observe(cv);
    } else { run = true; requestAnimationFrame(frame); }
  }

  /* ============================================================
     1 · HERO — the chip
     ============================================================ */
  (function () {
    var canvas = document.getElementById("cyHeroCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var WPTS = [
      [-0.06, 0.34],
      [0.10, 0.34], [0.16, 0.31], [0.24, 0.31], [0.30, 0.35], [0.38, 0.35],
      [0.46, 0.31], [0.54, 0.31], [0.60, 0.35], [0.68, 0.35], [0.74, 0.31],
      [0.82, 0.31], [0.88, 0.34],
      [0.93, 0.38], [0.95, 0.45], [0.93, 0.52], [0.88, 0.56],
      [0.80, 0.56], [0.72, 0.53], [0.64, 0.53], [0.56, 0.57], [0.48, 0.57],
      [0.40, 0.53], [0.32, 0.53], [0.24, 0.57], [0.16, 0.57], [0.10, 0.56],
      [0.05, 0.52], [0.04, 0.66], [0.06, 0.72], [0.10, 0.74],
      [0.16, 0.74], [0.24, 0.71], [0.32, 0.71], [0.40, 0.75], [0.48, 0.75],
      [0.56, 0.71], [0.64, 0.71], [0.72, 0.75], [0.80, 0.75], [0.88, 0.74],
      [1.06, 0.74]
    ];

    var W = 0, H = 0, S = 1, P = null, count = 0, offset = 0;
    var zone = { x1: 0, x2: 0, y1: 0, y2: 0 };
    var vignette = null;

    function buildPath(w, h) {
      var pts = WPTS.map(function (p) { return { x: p[0] * w, y: p[1] * h }; });
      var out = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        var seg = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        var steps = Math.max(4, Math.ceil(seg / 6));
        for (var s = 0; s < steps; s++) {
          var t = s / steps, t2 = t * t, t3 = t2 * t;
          out.push({
            x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
          });
        }
      }
      out.push(pts[pts.length - 1]);
      var cum = [0];
      for (var k = 1; k < out.length; k++) cum.push(cum[k - 1] + Math.hypot(out[k].x - out[k - 1].x, out[k].y - out[k - 1].y));
      return { pts: out, cum: cum, len: cum[cum.length - 1] };
    }

    function sampleAt(d) {
      var pts = P.pts, cum = P.cum;
      if (d <= 0) return { x: pts[0].x, y: pts[0].y, a: 0 };
      var n = pts.length - 1;
      if (d >= P.len) return { x: pts[n].x, y: pts[n].y, a: 0 };
      var lo = 0, hi = cum.length - 1;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid; }
      var t = (d - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo]);
      var a = pts[lo], b = pts[hi];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, a: Math.atan2(b.y - a.y, b.x - a.x) };
    }

    var px = 0.5, py = 0.5, tx = 0.5, ty = 0.5;
    if (!reduce && window.matchMedia && matchMedia("(pointer:fine)").matches) {
      addEventListener("pointermove", function (e) {
        tx = e.clientX / Math.max(1, window.innerWidth);
        ty = e.clientY / Math.max(1, window.innerHeight);
      }, { passive: true });
    }

    function resize() {
      var f = fitCanvas(canvas);
      ctx = f.ctx; W = f.w; H = f.h;
      S = Math.min(Math.max(Math.min(W, 1500) / 1200, 0.55), 1.3);
      P = buildPath(W, H);
      var spacing = Math.min(Math.max(W * 0.09, 64), 130);
      count = Math.max(8, Math.floor(P.len / spacing));
      zone.x1 = 0.56 * W; zone.x2 = 0.74 * W;
      zone.y1 = 0.20 * H; zone.y2 = 0.88 * H;
      vignette = ctx.createRadialGradient(W / 2, H * 0.44, Math.min(W, H) * 0.22, W / 2, H * 0.44, Math.max(W, H) * 0.75);
      vignette.addColorStop(0, "rgba(4,10,8,0)");
      vignette.addColorStop(1, "rgba(4,10,8,0.9)");
      if (reduce) {
        /* park one candidate inside the imaging zone for the static frame */
        var target = zone.x1 + (zone.x2 - zone.x1) * 0.5, d = 0;
        for (var k = 1; k < P.pts.length; k++) { if (P.pts[k].x >= target) { d = P.cum[k]; break; } }
        offset = ((d / P.len) - 3 / count + 1) % 1;
      }
    }

    function strokePath(w, style) {
      ctx.beginPath();
      var pts = P.pts;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.lineWidth = w; ctx.strokeStyle = style; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();
    }

    function bracket(x, y, dx, dy, len, style, w) {
      ctx.beginPath();
      ctx.moveTo(x + dx * len, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * len);
      ctx.lineWidth = w || 1.4;
      ctx.strokeStyle = style;
      ctx.stroke();
    }

    function draw(t, still) {
      ctx.clearRect(0, 0, W, H);
      var ox = still ? 0 : (px - 0.5) * 14, oy = still ? 0 : (py - 0.5) * 10;
      ctx.save();
      ctx.translate(ox, oy);

      /* substrate dot grid */
      ctx.fillStyle = "rgba(90,208,122,0.05)";
      var g = Math.max(40, 48 * S);
      for (var gy = g; gy < H; gy += g) for (var gx = g; gx < W; gx += g) ctx.fillRect(gx, gy, 1, 1);

      /* channel */
      var chW = Math.min(Math.max(30 * S, 18), 34);
      strokePath(chW + 2, "rgba(90,208,122,0.16)");
      strokePath(chW, "#07231b");
      strokePath(chW - 7, "rgba(99,227,210,0.05)");
      ctx.setLineDash([5, 9]);
      strokePath(1, "rgba(99,227,210,0.14)");
      ctx.setLineDash([]);

      /* ports */
      var start = sampleAt(0), end = sampleAt(P.len - 1);
      ctx.font = (10 * S | 0) + "px 'IBM Plex Mono',monospace";
      [start, end].forEach(function (pt) {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, chW * 0.62, 0, 6.283);
        ctx.fillStyle = "#05130e"; ctx.fill();
        ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(99,227,210,0.4)"; ctx.stroke();
      });
      ctx.fillStyle = "rgba(143,168,157,0.85)";
      ctx.fillText("SAMPLE IN", start.x + 14, start.y - chW * 0.7);
      ctx.fillText("OUT", end.x - 46, end.y - chW * 0.7);

      /* droplet train */
      var inZone = 0;
      for (var i = 0; i < count; i++) {
        var frac = ((i / count + offset) % 1 + 1) % 1;
        var pos = sampleAt(frac * P.len);
        if (pos.x < -30 || pos.x > W + 30) continue;
        var isCand = (i % 9) === 3;
        var r = (7 + rnd(i, 2) * 3.2) * S;
        var wob = still ? 0 : Math.sin(t * 1.3 + i * 2.1) * 2.2 * S;
        var nx = Math.cos(pos.a + Math.PI / 2), ny = Math.sin(pos.a + Math.PI / 2);
        var cx = pos.x + nx * wob, cy = pos.y + ny * wob;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(pos.a);
        var grd = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 1.5);
        grd.addColorStop(0, "rgba(166,240,231,0.20)");
        grd.addColorStop(1, "rgba(28,113,75,0.08)");
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.45, r, 0, 0, 6.283);
        ctx.fillStyle = grd; ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = isCand ? "rgba(99,227,210,0.55)" : "rgba(166,240,231,0.30)";
        ctx.stroke();

        var nCells = rnd(i, 5) < 0.22 ? 0 : (rnd(i, 5) < 0.82 ? 1 : 2);
        for (var c = 0; c < nCells; c++) {
          var cox = (rnd(i * 7 + c, 9) - 0.5) * r * 1.1;
          var coy = (rnd(i * 11 + c, 13) - 0.5) * r * 0.9;
          var cr = (2.1 + rnd(i * 5 + c, 15) * 1.4) * S;
          var cwob = still ? 0 : Math.sin(t * 2 + i * 3 + c * 5) * 1.1;
          var cellX = cox, cellY = coy + cwob;
          ctx.beginPath();
          ctx.ellipse(cellX, cellY, cr * 1.25, cr, 0.3 + rnd(i + c, 17) * 0.6, 0, 6.283);
          ctx.fillStyle = isCand ? "rgba(99,227,210,0.92)" : "rgba(90,208,122,0.88)";
          ctx.fill();
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = "rgba(4,16,12,0.9)";
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cellX - cr * 0.3, cellY - cr * 0.3, cr * 0.28, 0, 6.283);
          ctx.fillStyle = "rgba(233,244,238,0.72)";
          ctx.fill();

          if (pos.x > zone.x1 + 8 && pos.x < zone.x2 - 8) {
            inZone++;
            var bw = cr * 4.4, bh = cr * 3.6;
            var bc = isCand ? "rgba(99,227,210,0.95)" : "rgba(90,208,122,0.75)";
            var bl = Math.min(6, bw * 0.3);
            bracket(cellX - bw, cellY - bh, 1, 1, bl, bc, 1.1);
            bracket(cellX + bw, cellY - bh, -1, 1, bl, bc, 1.1);
            bracket(cellX - bw, cellY + bh, 1, -1, bl, bc, 1.1);
            bracket(cellX + bw, cellY + bh, -1, -1, bl, bc, 1.1);
            if (isCand) {
              ctx.font = (9 * S | 0) + "px 'IBM Plex Mono',monospace";
              ctx.fillStyle = "rgba(166,240,231,0.95)";
              ctx.fillText("CF-00" + (120 + i) + "  CANDIDATE", cellX - bw - 14, cellY - bh - 8);
            }
          }
        }
        ctx.restore();
      }

      /* imaging zone frame */
      var zx = zone.x1, zw = zone.x2 - zone.x1, zy = zone.y1, zh = zone.y2 - zone.y1;
      ctx.fillStyle = "rgba(99,227,210,0.04)";
      ctx.fillRect(zx, zy, zw, zh);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(99,227,210,0.22)";
      ctx.strokeRect(zx, zy, zw, zh);
      var bl2 = 16;
      bracket(zx, zy, 1, 1, bl2, "rgba(99,227,210,0.6)");
      bracket(zx + zw, zy, -1, 1, bl2, "rgba(99,227,210,0.6)");
      bracket(zx, zy + zh, 1, -1, bl2, "rgba(99,227,210,0.6)");
      bracket(zx + zw, zy + zh, -1, -1, bl2, "rgba(99,227,210,0.6)");

      /* scanline */
      var sf = still ? 0.42 : (t * 0.22) % 1;
      var sx = zx + sf * zw;
      var trail = ctx.createLinearGradient(sx - 46, 0, sx, 0);
      trail.addColorStop(0, "rgba(99,227,210,0)");
      trail.addColorStop(1, "rgba(99,227,210,0.10)");
      ctx.fillStyle = trail;
      ctx.fillRect(sx - 46, zy, 46, zh);
      ctx.fillStyle = "rgba(166,240,231,0.35)";
      ctx.fillRect(sx, zy, 1, zh);

      /* AI HUD */
      ctx.font = (10 * S | 0) + "px 'IBM Plex Mono',monospace";
      ctx.fillStyle = "rgba(143,168,157,0.9)";
      ctx.fillText("IMAGING ZONE", zx + 10, zy + 20);
      ctx.fillStyle = "rgba(90,208,122,0.9)";
      ctx.fillText("AI ANALYSIS", zx + 10, zy + 38);
      var prog = still ? 0.68 : 0.35 + 0.3 * Math.sin(t * 0.8) + (inZone > 0 ? 0.25 : 0);
      prog = Math.min(1, Math.max(0.12, prog));
      ctx.fillStyle = "rgba(99,227,210,0.18)";
      ctx.fillRect(zx + 10, zy + 46, 90, 3);
      ctx.fillStyle = "rgba(90,208,122,0.85)";
      ctx.fillRect(zx + 10, zy + 46, 90 * prog, 3);
      ctx.fillStyle = "rgba(143,168,157,0.8)";
      ctx.fillText("CELLS TRACKED " + inZone, zx + 10, zy + zh - 12);

      ctx.restore();
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
    }

    function frame(now) {
      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;
      offset = (offset + 0.0016) % 1;
      draw(now / 1000, false);
    }

    var rT = 0;
    addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(resize, 120); }, { passive: true });
    resize();
    loopWhenVisible(canvas, frame);
  })();

  /* ============================================================
     2 · Growth trajectories (section 05)
     ============================================================ */
  (function () {
    var cv = document.getElementById("cyTrack");
    if (!cv) return;
    var c = fitCanvas(cv), ctx = c.ctx, W = c.w, H = c.h;
    var rT;
    addEventListener("resize", function () {
      clearTimeout(rT);
      rT = setTimeout(function () { c = fitCanvas(cv); ctx = c.ctx; W = c.w; H = c.h; if (reduce) draw(1.2, true); }, 150);
    }, { passive: true });

    function draw(t, still) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(90,208,122,.08)"; ctx.lineWidth = 1;
      for (var gx = 0; gx < W; gx += Math.max(40, W / 10)) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (var gy = 0; gy < H; gy += Math.max(30, H / 5)) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      var N = 7;
      for (var i = 0; i < N; i++) {
        var cand = i === 2;
        var base = H - 26 - rnd(i, 3) * 40;
        var slope = 14 + rnd(i, 5) * 26;
        ctx.beginPath();
        for (var x = 14; x <= W - 14; x += 6) {
          var p = (x - 14) / (W - 28);
          var y = base - slope * p * (W / 200) * (1 + 0.14 * Math.sin(t * 0.7 + i)) - 4 * Math.sin(x * 0.05 + i * 2 + t * (cand ? 1.1 : 0.5));
          if (x === 14) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = cand ? "rgba(99,227,210,.95)" : "rgba(90,208,122," + (0.22 + rnd(i, 8) * 0.2) + ")";
        ctx.lineWidth = cand ? 1.8 : 1.1;
        ctx.stroke();
        if (cand) {
          var ye = base - (14 + rnd(i, 5) * 26) * (W / 200) * (1 + 0.14 * Math.sin(t * 0.7 + i)) - 4 * Math.sin((W - 14) * 0.05 + i * 2 + t);
          ctx.fillStyle = "#63e3d2";
          ctx.beginPath(); ctx.arc(W - 14, ye, 3.2, 0, 6.283); ctx.fill();
          ctx.font = "9px 'IBM Plex Mono',monospace";
          ctx.fillText("CF-00184", W - 78, ye - 8);
        }
      }
      ctx.font = "9px 'IBM Plex Mono',monospace";
      ctx.fillStyle = "rgba(143,168,157,.8)";
      ctx.fillText("TIME →", 14, H - 8);
    }
    loopWhenVisible(cv, draw);
  })();

  /* ============================================================
     3 · Candidate phenotype map (section 06)
     ============================================================ */
  (function () {
    var cv = document.getElementById("cyMap");
    if (!cv) return;
    var c = fitCanvas(cv), ctx = c.ctx, W = c.w, H = c.h;
    var N = W < 640 ? 160 : 420, pts = [], cands = [];
    var ccx = 0.78, ccy = 0.3;
    function seed() {
      pts = []; cands = [];
      N = W < 640 ? 160 : 420;
      for (var i = 0; i < N; i++) pts.push({ x: 0.05 + rnd(i, 1) * 0.9, y: 0.08 + rnd(i, 2) * 0.84, r: 1 + rnd(i, 3) * 1.6, ph: rnd(i, 4) * 6.283 });
      for (var j = 0; j < 7; j++) cands.push({ x: ccx + (rnd(j, 9) - 0.5) * 0.09, y: ccy + (rnd(j, 11) - 0.5) * 0.11, r: 2.2 + rnd(j, 13) * 1.4, ph: rnd(j, 15) * 6.283 });
      var el = document.getElementById("cyCandCount");
      if (el) el.textContent = String(cands.length).padStart(2, "0");
    }
    seed();
    var rT;
    addEventListener("resize", function () {
      clearTimeout(rT);
      rT = setTimeout(function () { c = fitCanvas(cv); ctx = c.ctx; W = c.w; H = c.h; seed(); if (reduce) draw(0, true); }, 150);
    }, { passive: true });

    function draw(t, still) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(90,208,122,.07)"; ctx.lineWidth = 1;
      for (var gx = 0; gx < W; gx += Math.max(50, W / 12)) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (var gy = 0; gy < H; gy += Math.max(40, H / 8)) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var tw = still ? 0.5 : 0.35 + 0.25 * Math.sin(t * 0.9 + p.ph);
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, 6.283);
        ctx.fillStyle = "rgba(90,208,122," + (0.18 + tw * 0.3) + ")";
        ctx.fill();
      }
      for (var j = 0; j < cands.length; j++) {
        var q = cands[j];
        var pulse = still ? 1 : 1 + 0.25 * Math.sin(t * 2 + q.ph);
        ctx.beginPath();
        ctx.arc(q.x * W, q.y * H, q.r * pulse, 0, 6.283);
        ctx.fillStyle = "rgba(99,227,210,.95)";
        ctx.shadowColor = "rgba(99,227,210,.9)"; ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.strokeStyle = "rgba(99,227,210,.5)";
      ctx.setLineDash([4, 6]);
      ctx.strokeRect(ccx * W - 40, ccy * H - 46, 84, 78);
      ctx.setLineDash([]);
      ctx.font = "9px 'IBM Plex Mono',monospace";
      ctx.fillStyle = "rgba(166,240,231,.9)";
      ctx.fillText("CANDIDATE CLUSTER", ccx * W - 8, ccy * H - 56);
    }
    loopWhenVisible(cv, draw);
  })();

  /* ============================================================
     4 · Reveal on scroll + observation bars
     ============================================================ */
  (function () {
    var els = document.querySelectorAll(".cy-rv");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("in"); });
      var card0 = document.querySelector(".cy-cellcard");
      if (card0) card0.classList.add("cy-inview");
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          if (en.target.classList.contains("cy-cellcard")) en.target.classList.add("cy-inview");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
    /* failsafe */
    setTimeout(function () {
      document.querySelectorAll(".cy-rv:not(.in)").forEach(function (e) { e.classList.add("in"); });
    }, 2600);
  })();
})();
