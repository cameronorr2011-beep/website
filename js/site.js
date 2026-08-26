/* ============================================================
   Orr Biologicals — site.js
   Shared interactions: veil, nav, progress, reveal, counters,
   live telemetry, ambient living background, cursor glow,
   YouTube lite-embeds. Vanilla, dependency-free, a11y-aware.
   ============================================================ */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduce =
    (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ||
    (navigator.connection && navigator.connection.saveData);
  function ready(fn) { document.readyState !== "loading" ? fn() : document.addEventListener("DOMContentLoaded", fn); }

  /* ---- switch-on veil ---- */
  (function () {
    var lit = false;
    function go() {
      if (lit) return; lit = true;
      var v = document.querySelector(".veil");
      if (v) setTimeout(function () { v.classList.add("done"); }, reduce ? 0 : 260);
    }
    if (document.readyState !== "loading") setTimeout(go, reduce ? 0 : 100);
    else document.addEventListener("DOMContentLoaded", function () { setTimeout(go, reduce ? 0 : 100); });
    addEventListener("load", go); setTimeout(go, 1600);
  })();

  ready(function () {
    /* ---- nav: solid + hide-on-scroll + progress ---- */
    var nav = document.querySelector(".nav"), pbar = document.querySelector(".pbar");
    var lastY = 0, ticking = false, docH = 1;
    function measure() { docH = Math.max(1, root.scrollHeight - innerHeight); }
    measure(); addEventListener("resize", measure, { passive: true });
    function onScroll() {
      var y = scrollY || root.scrollTop;
      if (pbar) pbar.style.width = (Math.min(y / docH, 1) * 100) + "%";
      if (nav) {
        if (y > 40) nav.classList.add("solid"); else nav.classList.remove("solid");
        if (y > 260 && y > lastY + 6) nav.classList.add("hide");
        else if (y < lastY - 6 || y < 260) nav.classList.remove("hide");
      }
      lastY = y; ticking = false;
    }
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    /* ---- mobile nav ---- */
    if (nav) {
      var tg = nav.querySelector(".nav-toggle");
      if (tg) tg.addEventListener("click", function () {
        var o = nav.classList.toggle("open");
        tg.setAttribute("aria-expanded", o);
      });
      nav.querySelectorAll(".nav-links a").forEach(function (a) {
        a.addEventListener("click", function () { nav.classList.remove("open"); });
      });
    }

    /* ---- reveal on scroll ---- */
    var io = "IntersectionObserver" in window
      ? new IntersectionObserver(function (es) {
          es.forEach(function (en) {
            if (en.isIntersecting) {
              if (en.target.hasAttribute("data-count")) settle(en.target);
              en.target.classList.add("in"); io.unobserve(en.target);
            }
          });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.16 })
      : null;
    function obs(el) { io ? io.observe(el) : (el.classList.add("in"), el.hasAttribute("data-count") && settle(el)); }
    document.querySelectorAll(".rv,.ebb,[data-count]").forEach(obs);

    /* ---- counter settle ---- */
    function settle(el) {
      if (el.dataset.settled) return; el.dataset.settled = "1";
      var target = parseFloat(el.getAttribute("data-count")), dec = (el.getAttribute("data-dec") | 0);
      var suffix = el.getAttribute("data-suffix") || "";
      if (isNaN(target)) return;
      if (reduce) { el.textContent = target.toFixed(dec) + suffix; return; }
      var t0 = null, dur = 1100;
      requestAnimationFrame(function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * e).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step); else el.textContent = target.toFixed(dec) + suffix;
      });
    }

    /* ---- live telemetry flicker ---- */
    if (!reduce) {
      document.querySelectorAll("[data-live]").forEach(function (el) {
        var base = parseFloat(el.getAttribute("data-live")), dec = (el.getAttribute("data-dec") | 0);
        var jitter = parseFloat(el.getAttribute("data-jit") || "0.01");
        setInterval(function () {
          if (document.hidden) return;
          var j = base * (1 + (Math.random() - 0.5) * 2 * jitter);
          el.firstChild ? (el.childNodes[0].nodeValue = j.toFixed(dec)) : (el.textContent = j.toFixed(dec));
        }, 1500 + Math.random() * 900);
      });
    }

    /* ---- YouTube lite-embeds ---- */
    document.querySelectorAll(".yt-lite").forEach(function (box) {
      box.addEventListener("click", function () {
        var id = box.getAttribute("data-yt"); if (!id || box.dataset.loaded) return;
        box.dataset.loaded = "1";
        var f = document.createElement("iframe");
        f.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
        f.setAttribute("allowfullscreen", "");
        f.setAttribute("title", "Orr Biologicals on YouTube");
        f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&modestbranding=1";
        box.appendChild(f);
      });
      box.setAttribute("role", "button");
      box.setAttribute("tabindex", "0");
      box.setAttribute("aria-label", box.getAttribute("aria-label") || "Play video");
      box.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); box.click(); } });
    });

    /* ---- cursor glow (fine pointers) ---- */
    var fine = matchMedia && matchMedia("(pointer:fine)").matches && innerWidth >= 900;
    if (fine && !reduce) {
      var cg = document.createElement("div"); cg.className = "cursor-glow"; document.body.appendChild(cg);
      addEventListener("pointermove", function (e) {
        document.body.classList.add("hascursor");
        cg.style.left = e.clientX + "px"; cg.style.top = e.clientY + "px";
      }, { passive: true });
    }

    /* ---- failsafe: nothing stays hidden ---- */
    setTimeout(function () {
      document.querySelectorAll(".rv:not(.in),.ebb:not(.in)").forEach(function (e) { e.classList.add("in"); });
    }, 2600);
  });

  /* ============================================================
     ambient living background — theme-aware
     body.myco  → slow-drifting mycelial strands + glowing nodes
     otherwise  → drifting filaments + soft cells (aquatic)
     ============================================================ */
  (function () {
    var c = document.getElementById("ambient");
    if (!c) return;
    var ctx = c.getContext("2d");
    if (!ctx) return;
    var myco = document.body.classList.contains("myco");
    var COL = myco ? [240, 168, 58] : [51, 230, 173];
    var COL2 = myco ? [143, 216, 192] : [40, 180, 150];

    var DPR = Math.min(window.devicePixelRatio || 1, 1.6);
    var W = 0, H = 0;
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 1.6);
      W = window.innerWidth; H = window.innerHeight;
      c.width = Math.floor(W * DPR); c.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    window.addEventListener("resize", resize, { passive: true });
    resize();

    function rnd(i, s) { var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }

    var N = W < 720 ? 10 : 20;
    var strands = [];
    for (var i = 0; i < N; i++) {
      strands.push({
        x: rnd(i, 1) * W, y: rnd(i, 2) * H,
        len: 140 + rnd(i, 3) * 300,
        amp: 9 + rnd(i, 4) * 24,
        freq: 0.03 + rnd(i, 5) * 0.05,
        phase: rnd(i, 6) * 6.28,
        vy: (rnd(i, 7) - 0.5) * 0.22, vx: (rnd(i, 8) - 0.5) * 0.12,
        rot: (rnd(i, 9) - 0.5) * 0.5,
        sp: 0.004 + rnd(i, 10) * 0.006,
        a: 0.1 + rnd(i, 11) * 0.22,
        sc: 0.8 + rnd(i, 12) * 1.0
      });
    }
    var CN = W < 720 ? 18 : 40;
    var cells = [];
    for (var j = 0; j < CN; j++) {
      cells.push({ x: rnd(j, 21) * W, y: rnd(j, 22) * H, r: 1.3 + rnd(j, 23) * 3.6,
        vy: (rnd(j, 24) - 0.5) * 0.18, vx: (rnd(j, 25) - 0.5) * 0.1, a: 0.07 + rnd(j, 26) * 0.18 });
    }

    function drawStrand(s, t) {
      var beads = Math.max(8, Math.floor(s.len / 12));
      ctx.save();
      ctx.translate(s.x, s.y); ctx.rotate(s.rot);
      ctx.beginPath();
      for (var k = 0; k <= beads; k++) {
        var px = (k / beads - 0.5) * s.len;
        var py = Math.sin(k * s.freq * 12 + s.phase + t * s.sp * 60) * s.amp;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = "rgba(" + COL[0] + "," + COL[1] + "," + COL[2] + "," + s.a + ")";
      ctx.lineWidth = 1.9 * s.sc; ctx.lineCap = "round"; ctx.stroke();
      for (var b = 0; b <= beads; b += 2) {
        var bx = (b / beads - 0.5) * s.len;
        var by = Math.sin(b * s.freq * 12 + s.phase + t * s.sp * 60) * s.amp;
        ctx.beginPath();
        ctx.arc(bx, by, 2 * s.sc, 0, 6.283);
        ctx.fillStyle = "rgba(" + COL2[0] + "," + COL2[1] + "," + COL2[2] + "," + (s.a * 1.5) + ")";
        ctx.fill();
      }
      ctx.restore();
    }

    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      if (hidden) return;
      var t = (now || 0) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < strands.length; i++) {
        var s = strands[i];
        s.y += s.vy; s.x += s.vx; s.phase += s.sp;
        if (s.y < -160) s.y = H + 160; if (s.y > H + 160) s.y = -160;
        if (s.x < -300) s.x = W + 300; if (s.x > W + 300) s.x = -300;
        drawStrand(s, t);
      }
      for (var j = 0; j < cells.length; j++) {
        var cc = cells[j];
        cc.y += cc.vy; cc.x += cc.vx;
        if (cc.y < -10) cc.y = H + 10; if (cc.y > H + 10) cc.y = -10;
        if (cc.x < -10) cc.x = W + 10; if (cc.x > W + 10) cc.x = -10;
        ctx.beginPath();
        var g = ctx.createRadialGradient(cc.x, cc.y, 0, cc.x, cc.y, cc.r * 4);
        g.addColorStop(0, "rgba(" + COL[0] + "," + COL[1] + "," + COL[2] + "," + cc.a + ")");
        g.addColorStop(1, "rgba(" + COL[0] + "," + COL[1] + "," + COL[2] + ",0)");
        ctx.fillStyle = g;
        ctx.arc(cc.x, cc.y, cc.r * 4, 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    var running = true, hidden = false;
    document.addEventListener("visibilitychange", function () { hidden = document.hidden; });
    if (reduce) {
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < strands.length; i++) drawStrand(strands[i], 0);
      ctx.globalCompositeOperation = "source-over";
    } else {
      requestAnimationFrame(frame);
    }
  })();
})();
