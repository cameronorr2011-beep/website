/* ============================================================
   Orr Biologicals — cyano-app.js
   Cyanoflow page app: chip droplet simulation, synthetic
   single-cell dataset, interactive candidate explorer
   (thresholds -> precision/recall), database correlation view,
   and section dot-nav. Vanilla, dependency-free.
   All data is SIMULATED — illustrative, not instrument data.
   ============================================================ */
(function () {
  "use strict";
  var reduce =
    (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ||
    (navigator.connection && navigator.connection.saveData);

  /* ================= deterministic RNG + dataset ================= */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, lo, hi) { return Math.max(lo === undefined ? 0 : lo, Math.min(hi === undefined ? 1 : hi, v)); }

  var CONDITIONS = [
    "35 µmol·m⁻²·s⁻¹ / 25 °C",
    "120 µmol·m⁻²·s⁻¹ / 25 °C",
    "120 µmol·m⁻²·s⁻¹ / 30 °C",
    "N-limited / 25 °C",
    "High CO₂ / 28 °C"
  ];

  function buildDataset(count, seed) {
    var rnd = mulberry32(seed || 20260214), cells = [];
    for (var i = 0; i < count; i++) {
      var latent = Math.pow(rnd(), 2.1);
      var n = function () { return (rnd() - 0.5) * 2; };
      var growthRate = clamp(0.16 + latent * 0.72 + n() * 0.13, 0.01, 1);
      var pigmentIndex = clamp(0.3 + latent * 0.55 + n() * 0.14, 0.02, 1);
      var area = 18 + latent * 26 + n() * 9;
      var aspectRatio = clamp(1.05 + Math.abs(n()) * 0.9 + latent * 0.35, 1, 3.2);
      var perimeter = 2 * Math.PI * Math.sqrt(area / Math.PI) * (1 + (aspectRatio - 1) * 0.16);
      var circularity = clamp((4 * Math.PI * area) / (perimeter * perimeter), 0.2, 1);
      var brightness = clamp(0.35 + pigmentIndex * 0.45 + n() * 0.12, 0.05, 1);
      var motility = clamp(0.2 + rnd() * 1.6 + latent * 0.5, 0, 3);
      var divisions = growthRate > 0.55 ? (rnd() > 0.45 ? 2 : 1) : (rnd() > 0.78 ? 1 : 0);
      var trajectory = [], v = 1;
      for (var t = 0; t < 8; t++) { trajectory.push(Number(v.toFixed(3))); v *= 1 + growthRate * 0.08 + (rnd() - 0.5) * 0.02; }
      var idx = i + 1;
      cells.push({
        id: "CF-" + String(idx).padStart(6, "0"),
        index: idx, latent: latent,
        trueCandidate: latent > 0.74,
        area: Number(area.toFixed(1)),
        perimeter: Number(perimeter.toFixed(1)),
        aspectRatio: Number(aspectRatio.toFixed(2)),
        circularity: Number(circularity.toFixed(2)),
        growthRate: Number(growthRate.toFixed(3)),
        divisions: divisions,
        brightness: Number(brightness.toFixed(3)),
        pigmentIndex: Number(pigmentIndex.toFixed(3)),
        motility: Number(motility.toFixed(2)),
        trajectory: trajectory,
        condition: CONDITIONS[Math.floor(rnd() * CONDITIONS.length)],
        chip: "CHIP-0" + (1 + Math.floor(rnd() * 4)),
        validated: latent > 0.74 ? (rnd() > 0.28 ? "confirmed" : "pending") : (rnd() > 0.93 ? "rejected" : "pending")
      });
    }
    return cells;
  }

  function scoreThresholds(cells, gT, pT) {
    var tp = 0, fp = 0, fn = 0, tn = 0;
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i], pred = c.growthRate >= gT && c.pigmentIndex >= pT;
      if (pred && c.trueCandidate) tp++;
      else if (pred && !c.trueCandidate) fp++;
      else if (!pred && c.trueCandidate) fn++;
      else tn++;
    }
    var precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    var recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    return { tp: tp, fp: fp, fn: fn, tn: tn, precision: precision, recall: recall,
      accuracy: (tp + tn) / cells.length,
      f1: precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall),
      predicted: tp + fp };
  }
  function isPredicted(c, g, p) { return c.growthRate >= g && c.pigmentIndex >= p; }

  var DATA = buildDataset(260);

  /* ================= hero: chip droplet simulation ================= */
  (function () {
    var canvas = document.getElementById("chipSim");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var stats = { compartments: 0, occupied: 0, candidates: 0 };
    var comp = document.getElementById("stComp"), occ = document.getElementById("stOcc"), cand = document.getElementById("stCand");
    var running = true, raf = 0, last = performance.now(), nextId = 1, scan = 0;
    var droplets = [], W = 0, H = 300;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth || canvas.parentElement.clientWidth;
      H = canvas.clientHeight || 300;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    addEventListener("resize", function () { clearTimeout(canvas._rt); canvas._rt = setTimeout(resize, 120); }, { passive: true });
    resize();

    function roundRect(x, y, ww, hh, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + ww, y, x + ww, y + hh, r);
      ctx.arcTo(x + ww, y + hh, x, y + hh, r);
      ctx.arcTo(x, y + hh, x, y, r);
      ctx.arcTo(x, y, x + ww, y, r);
      ctx.closePath();
    }

    function updateStats() {
      if (comp) comp.textContent = String(stats.compartments);
      if (occ) occ.textContent = (stats.compartments ? (stats.occupied / stats.compartments) * 100 : 0).toFixed(0) + "%";
      if (cand) cand.textContent = String(stats.candidates);
    }

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { visible = en.isIntersecting; });
      }, { threshold: 0.02 }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () { visible = !document.hidden && visible; });

    var toggle = document.getElementById("simToggle");
    if (toggle) toggle.addEventListener("click", function () {
      running = !running;
      toggle.textContent = running ? "PAUSE" : "RUN";
    });

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (!visible || document.hidden) return;
      var speed = running ? 78 : 0;
      if (running && !reduce) scan += dt;

      var mainY = H * 0.38, recY = H * 0.78, chW = 42;
      var junction = W * 0.74, imgX = W * 0.42, imgW = Math.max(90, W * 0.14);

      /* spawn */
      var lastD = droplets[droplets.length - 1];
      if (running && (!lastD || lastD.x > 52)) {
        var hasCell = Math.random() < 0.42 ? 1 : 0;
        var isCand = hasCell === 1 && Math.random() < 0.16;
        droplets.push({ x: -24, lane: 0, t: 0, cell: hasCell, candidate: isCand, imaged: false, wobble: Math.random() * Math.PI * 2, id: nextId++ });
        stats.compartments++;
        if (hasCell) stats.occupied++;
        if (isCand) stats.candidates++;
        updateStats();
      }

      for (var i = droplets.length - 1; i >= 0; i--) {
        var d = droplets[i];
        d.x += speed * dt;
        d.wobble += dt * 2.2;
        if (!d.imaged && d.x > imgX + imgW * 0.5) d.imaged = true;
        if (d.candidate && d.x > junction) d.t = Math.min(1, d.t + dt * 1.5);
        if (d.x > W + 40) droplets.splice(i, 1);
      }

      /* background */
      ctx.clearRect(0, 0, W, H);
      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#050d14"); bg.addColorStop(1, "#03080d");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(45,212,191,0.16)"; ctx.lineWidth = 1;
      roundRect(10, 10, W - 20, H - 20, 14); ctx.stroke();

      function drawChannel(y, x0, x1) {
        var g = ctx.createLinearGradient(0, y - chW / 2, 0, y + chW / 2);
        g.addColorStop(0, "rgba(13,60,78,0.55)");
        g.addColorStop(0.5, "rgba(8,38,52,0.85)");
        g.addColorStop(1, "rgba(13,60,78,0.55)");
        ctx.fillStyle = g;
        roundRect(x0, y - chW / 2, x1 - x0, chW, chW / 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(94,234,212,0.22)"; ctx.stroke();
      }
      drawChannel(mainY, 24, W - 24);
      drawChannel(recY, junction - 30, W - 24);

      ctx.strokeStyle = "rgba(94,234,212,0.18)"; ctx.lineWidth = chW; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(junction + 6, mainY);
      ctx.bezierCurveTo(junction + 40, mainY, junction + 10, recY, junction + 54, recY);
      ctx.globalAlpha = 0.25; ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 1;

      var ig = ctx.createLinearGradient(imgX, 0, imgX + imgW, 0);
      ig.addColorStop(0, "rgba(34,211,238,0)"); ig.addColorStop(0.5, "rgba(34,211,238,0.14)"); ig.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = ig; ctx.fillRect(imgX, 18, imgW, H - 36);
      ctx.setLineDash([4, 5]); ctx.strokeStyle = "rgba(103,232,249,0.45)";
      ctx.beginPath();
      ctx.moveTo(imgX, 18); ctx.lineTo(imgX, H - 18);
      ctx.moveTo(imgX + imgW, 18); ctx.lineTo(imgX + imgW, H - 18);
      ctx.stroke(); ctx.setLineDash([]);

      var sx = imgX + ((reduce ? 0.4 : (Math.sin(scan * 1.6) + 1) / 2)) * imgW;
      ctx.strokeStyle = "rgba(165,243,252,0.75)";
      ctx.beginPath(); ctx.moveTo(sx, 20); ctx.lineTo(sx, H - 20); ctx.stroke();

      ctx.font = "500 10px 'IBM Plex Mono', monospace";
      ctx.fillStyle = "rgba(165,243,252,0.8)"; ctx.fillText("IMAGING REGION", imgX + 2, 30);
      ctx.fillStyle = "rgba(148,163,184,0.7)";
      ctx.fillText("SAMPLE IN", 26, mainY - chW / 2 - 8);
      ctx.fillText("WASTE / POOLED", W - 130, mainY - chW / 2 - 8);
      ctx.fillStyle = "rgba(190,242,100,0.85)";
      ctx.fillText("CANDIDATE RECOVERY", W - 160, recY - chW / 2 - 8);
      ctx.fillStyle = "rgba(148,163,184,0.7)";
      ctx.fillText("SORT GATE", junction - 26, H - 24);

      ctx.strokeStyle = "rgba(190,242,100,0.45)"; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(junction, mainY - 34); ctx.lineTo(junction, H - 34); ctx.stroke();
      ctx.setLineDash([]);

      for (var j = 0; j < droplets.length; j++) {
        var dp = droplets[j];
        var ease = dp.t * dp.t * (3 - 2 * dp.t);
        var y = mainY + (recY - mainY) * ease;
        var r = 14;
        ctx.beginPath(); ctx.arc(dp.x, y, r, 0, Math.PI * 2);
        var dg = ctx.createRadialGradient(dp.x - 4, y - 5, 1, dp.x, y, r);
        dg.addColorStop(0, "rgba(186,244,255,0.22)"); dg.addColorStop(1, "rgba(9,42,58,0.55)");
        ctx.fillStyle = dg; ctx.fill();
        ctx.strokeStyle = dp.candidate && dp.imaged ? "rgba(190,242,100,0.9)" : "rgba(125,211,252,0.42)";
        ctx.lineWidth = dp.candidate && dp.imaged ? 1.6 : 1;
        ctx.stroke(); ctx.lineWidth = 1;

        if (dp.cell) {
          var cx = dp.x + Math.cos(dp.wobble) * 2.4;
          var cy = y + Math.sin(dp.wobble * 1.3) * 2.4;
          var rad = 5.4;
          ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * 0.82, dp.wobble * 0.4, 0, Math.PI * 2);
          if (dp.candidate && dp.imaged) {
            ctx.fillStyle = "rgba(190,242,100,0.95)";
            ctx.shadowColor = "rgba(190,242,100,0.9)"; ctx.shadowBlur = 14;
          } else {
            ctx.fillStyle = "rgba(45,212,191,0.9)";
            ctx.shadowColor = "rgba(45,212,191,0.6)"; ctx.shadowBlur = 9;
          }
          ctx.fill(); ctx.shadowBlur = 0;
          if (dp.imaged) {
            ctx.font = "500 8px 'IBM Plex Mono', monospace";
            ctx.fillStyle = dp.candidate ? "rgba(190,242,100,0.9)" : "rgba(148,197,214,0.55)";
            ctx.fillText("CF-" + String(dp.id).padStart(5, "0"), dp.x - 18, y + r + 12);
          }
        }
      }
    }
    if (reduce) {
      /* one static frame */
      scan = 0.4; running = false;
      frame(performance.now()); cancelAnimationFrame(raf);
      running = true; if (toggle) toggle.textContent = "PAUSE";
    } else {
      raf = requestAnimationFrame(frame);
    }
  })();

  /* ================= stage 02: occupancy grid ================= */
  (function () {
    var grid = document.getElementById("occGrid");
    if (!grid) return;
    var occ = [0,1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,2,0,0,1,0,0];
    var html = "";
    for (var i = 0; i < occ.length; i++) {
      var cls = occ[i] === 0 ? "e" : occ[i] === 1 ? "s" : "d";
      var title = occ[i] === 0 ? "empty" : occ[i] === 1 ? "single cell" : "doublet (rejected)";
      html += '<i class="' + cls + '" title="' + title + '">' + (occ[i] === 1 ? "<b></b>" : occ[i] === 2 ? "<b></b>" : "") + "</i>";
    }
    grid.innerHTML = html;
  })();

  /* ================= stage 03: time-series frames ================= */
  (function () {
    var box = document.getElementById("tsFrames");
    if (!box) return;
    var frames = [1, 1.16, 1.34, 1.42, 1.75], html = "";
    for (var i = 0; i < frames.length; i++) {
      html += "<div><div class=\"ts-frame\">" +
        "<img src=\"../assets/cyano/cell-single.jpg\" alt=\"Cell CF-000184 at timepoint " + i + "\" loading=\"lazy\"" +
        " style=\"transform:scale(" + (0.95 * frames[i]).toFixed(2) + ");filter:brightness(" + (0.85 + i * 0.05).toFixed(2) + ") saturate(1.1)\">" +
        (i === 4 ? "<span class=\"tag\">DIV</span>" : "") +
        "</div><div class=\"ts-t\">t" + i + "</div></div>";
    }
    box.innerHTML = html;
  })();

  /* ================= 06: explorer ================= */
  (function () {
    var gT = document.getElementById("gT"), pT = document.getElementById("pT");
    if (!gT || !pT) return;
    var W = 420, H = 320, pad = 38;
    function sx(v) { return pad + v * (W - pad - 14); }
    function sy(v) { return H - pad - v * (H - pad - 14); }
    var showTruth = false, selected = DATA.filter(function (c) { return c.trueCandidate; })[0] || DATA[0];

    var svg = document.getElementById("scatter");
    var el = {
      gTv: document.getElementById("gTv"), pTv: document.getElementById("pTv"),
      ruleG: document.getElementById("ruleG"), ruleP: document.getElementById("ruleP"),
      mPrec: document.getElementById("mPrec"), mRec: document.getElementById("mRec"),
      mAcc: document.getElementById("mAcc"), mF1: document.getElementById("mF1"),
      bPrec: document.getElementById("bPrec"), bRec: document.getElementById("bRec"),
      bAcc: document.getElementById("bAcc"), bF1: document.getElementById("bF1"),
      cTP: document.getElementById("cTP"), cFP: document.getElementById("cFP"),
      cFN: document.getElementById("cFN"), cTN: document.getElementById("cTN"),
      flagN: document.getElementById("flagN"), flagD: document.getElementById("flagD"),
      flagP: document.getElementById("flagP"), legTruth: document.getElementById("legTruth"),
      card: document.getElementById("cellCard"),
      stream: document.getElementById("streamBody")
    };
    el.flagD.textContent = String(DATA.length);
    document.getElementById("nCells").textContent = String(DATA.length);

    /* build static plot scaffolding once */
    var NS = "http://www.w3.org/2000/svg";
    function mk(tag, attrs) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      return e;
    }
    var region = mk("rect", { fill: "rgba(190,242,100,0.07)", stroke: "rgba(190,242,100,0.35)", "stroke-dasharray": "4 4" });
    svg.appendChild(region);
    for (var gi = 0; gi <= 4; gi++) {
      var g = gi / 4;
      svg.appendChild(mk("line", { x1: sx(g), y1: sy(0), x2: sx(g), y2: sy(1), stroke: "rgba(148,163,184,0.08)" }));
      svg.appendChild(mk("line", { x1: sx(0), y1: sy(g), x2: sx(1), y2: sy(g), stroke: "rgba(148,163,184,0.08)" }));
      var tx = mk("text", { x: sx(g), y: H - 20, fill: "#475569", "font-size": "9", "font-family": "IBM Plex Mono", "text-anchor": "middle" });
      tx.textContent = String(g); svg.appendChild(tx);
      var ty = mk("text", { x: pad - 8, y: sy(g) + 3, fill: "#475569", "font-size": "9", "font-family": "IBM Plex Mono", "text-anchor": "end" });
      ty.textContent = String(g); svg.appendChild(ty);
    }
    var ax1 = mk("text", { x: W / 2, y: H - 6, fill: "#64748b", "font-size": "9", "font-family": "IBM Plex Mono", "text-anchor": "middle" });
    ax1.textContent = "GROWTH RATE"; svg.appendChild(ax1);
    var ax2 = mk("text", { x: 12, y: H / 2, fill: "#64748b", "font-size": "9", "font-family": "IBM Plex Mono", "text-anchor": "middle", transform: "rotate(-90 12 " + H / 2 + ")" });
    ax2.textContent = "PIGMENT INDEX"; svg.appendChild(ax2);

    var pts = [];
    DATA.forEach(function (c) {
      var g = mk("g", { "data-id": c.id });
      var circ = mk("circle", { class: "pt", r: 3 });
      var halo = mk("circle", { r: 11, fill: "none", stroke: "rgba(224,242,254,0.5)", "stroke-dasharray": "3 3", visibility: "hidden" });
      g.appendChild(circ); g.appendChild(halo);
      g.addEventListener("click", function () { selected = c; render(); });
      svg.appendChild(g);
      pts.push({ c: c, g: g, circ: circ, halo: halo });
    });

    function fmt(v) { return (v * 100).toFixed(1) + "%"; }
    function render() {
      var gv = parseFloat(gT.value), pv = parseFloat(pT.value);
      var m = scoreThresholds(DATA, gv, pv);
      el.gTv.textContent = gv.toFixed(2); el.pTv.textContent = pv.toFixed(2);
      el.ruleG.textContent = gv.toFixed(2); el.ruleP.textContent = pv.toFixed(2);
      el.mPrec.textContent = fmt(m.precision); el.mRec.textContent = fmt(m.recall);
      el.mAcc.textContent = fmt(m.accuracy); el.mF1.textContent = fmt(m.f1);
      el.bPrec.style.width = (m.precision * 100) + "%";
      el.bRec.style.width = (m.recall * 100) + "%";
      el.bAcc.style.width = (m.accuracy * 100) + "%";
      el.bF1.style.width = (m.f1 * 100) + "%";
      el.cTP.textContent = String(m.tp); el.cFP.textContent = String(m.fp);
      el.cFN.textContent = String(m.fn); el.cTN.textContent = String(m.tn);
      el.flagN.textContent = String(m.predicted);
      el.flagP.textContent = ((m.predicted / DATA.length) * 100).toFixed(1);
      el.legTruth.hidden = !showTruth;

      region.setAttribute("x", sx(gv)); region.setAttribute("y", sy(1));
      region.setAttribute("width", Math.max(0, sx(1) - sx(gv)));
      region.setAttribute("height", Math.max(0, sy(pv) - sy(1)));

      pts.forEach(function (p) {
        var pred = isPredicted(p.c, gv, pv), isSel = p.c.id === selected.id;
        p.circ.setAttribute("cx", sx(p.c.growthRate));
        p.circ.setAttribute("cy", sy(p.c.pigmentIndex));
        p.circ.setAttribute("r", isSel ? 6 : pred ? 4 : 3);
        p.circ.setAttribute("fill", pred ? "rgba(190,242,100,0.85)" : "rgba(148,163,184,0.45)");
        p.circ.setAttribute("stroke", isSel ? "#e0f2fe" : (showTruth && p.c.trueCandidate) ? "#e879f9" : "transparent");
        p.circ.setAttribute("stroke-width", isSel ? 2 : 1.4);
        p.halo.setAttribute("cx", sx(p.c.growthRate));
        p.halo.setAttribute("cy", sy(p.c.pigmentIndex));
        p.halo.setAttribute("visibility", isSel ? "visible" : "hidden");
      });
      renderCard();
      renderStream(gv, pv);
    }

    function trajPoints(traj) {
      var min = Math.min.apply(null, traj), max = Math.max.apply(null, traj);
      var out = [];
      for (var i = 0; i < traj.length; i++) {
        out.push(((i / (traj.length - 1)) * 100).toFixed(1) + "," + (34 - ((traj[i] - min) / (max - min || 1)) * 30).toFixed(1));
      }
      return out.join(" ");
    }

    function renderCard() {
      var c = selected, pred = isPredicted(c, parseFloat(gT.value), parseFloat(pT.value));
      var bars = [
        ["Area", c.area, "µm²", 60], ["Growth rate", c.growthRate, "", 1],
        ["Pigment index", c.pigmentIndex, "", 1], ["Brightness", c.brightness, "", 1],
        ["Aspect ratio", c.aspectRatio, "", 3.2], ["Circularity", c.circularity, "", 1]
      ].map(function (b) {
        var pct = Math.max(2, Math.min(100, (b[1] / b[3]) * 100));
        return '<div class="cbar"><div class="row"><span>' + b[0] + "</span><b>" + b[1] + (b[2] ? " " + b[2] : "") + "</b></div>" +
          '<div class="tr"><i style="width:' + pct + '%"></i></div></div>';
      }).join("");
      var size = 40 + c.area * 1.1;
      el.card.innerHTML =
        '<div class="head"><span class="cid">' + c.id + '</span>' +
        '<span class="badge ' + (pred ? "c" : "n") + '">' + (pred ? "CANDIDATE" : "NORMAL") + "</span></div>" +
        '<div class="ccell-wrap"><img class="bgimg" src="../assets/cyano/hero-field.jpg" alt="" aria-hidden="true">' +
        '<div class="ccell" style="width:' + size.toFixed(0) + "px;height:" + (size / c.aspectRatio).toFixed(0) + "px;" +
        "box-shadow:0 0 " + (14 + c.brightness * 30).toFixed(0) + "px rgba(45,212,191," + (0.25 + c.brightness * 0.5).toFixed(2) + ')">' +
        '<img src="../assets/cyano/cell-single.jpg" alt="Micrograph of cell ' + c.id + '"' +
        ' style="filter:brightness(' + (0.6 + c.brightness * 0.9).toFixed(2) + ") saturate(" + (0.7 + c.pigmentIndex * 1.1).toFixed(2) + ") hue-rotate(" + ((c.pigmentIndex - 0.5) * 40).toFixed(0) + 'deg)">' +
        "</div>" +
        '<span class="fld">field 0' + ((c.index % 4) + 1) + " · 63×</span></div>" +
        '<div class="cbars">' + bars + "</div>" +
        '<div class="traj"><div class="k">Growth trajectory · t0–t7</div>' +
        '<svg viewBox="0 0 100 38" preserveAspectRatio="none"><polyline points="' + trajPoints(c.trajectory) + '" fill="none" stroke="#5eead4" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg></div>' +
        '<dl class="cmeta">' +
        "<div><dt>divisions</dt><dd>" + c.divisions + "</dd></div>" +
        "<div><dt>motility</dt><dd>" + c.motility + " µm/s</dd></div>" +
        "<div><dt>chip</dt><dd>" + c.chip + "</dd></div>" +
        "<div><dt>condition</dt><dd>" + c.condition + "</dd></div>" +
        "<div><dt>validation</dt><dd>" + c.validated + "</dd></div>" +
        "</dl>";
    }

    function renderStream(gv, pv) {
      var rows = "";
      for (var i = 0; i < Math.min(60, DATA.length); i++) {
        var c = DATA[i], pred = isPredicted(c, gv, pv);
        rows += '<tr data-id="' + c.id + '"' + (c.id === selected.id ? ' class="sel"' : "") + ">" +
          "<td>" + c.id + "</td><td>" + c.area + "</td><td>" + c.growthRate.toFixed(2) + "</td><td>" + c.pigmentIndex.toFixed(2) + "</td>" +
          '<td class="hidesm">' + c.aspectRatio + '</td><td class="hidemd">' + c.condition + "</td>" +
          '<td class="' + (pred ? "cand" : "") + '">' + (pred ? "★ Candidate" : "Normal") + "</td></tr>";
      }
      el.stream.innerHTML = rows;
    }
    el.stream.addEventListener("click", function (e) {
      var tr = e.target && e.target.closest ? e.target.closest("tr") : null;
      if (!tr || !tr.dataset.id) return;
      var hit = DATA.filter(function (c) { return c.id === tr.dataset.id; })[0];
      if (hit) { selected = hit; render(); }
    });

    /* responsive column hiding */
    function applyColHiding() {
      var hideSm = innerWidth < 640, hideMd = innerWidth < 900;
      document.querySelectorAll(".hidesm").forEach(function (e) { e.style.display = hideSm ? "none" : ""; });
      document.querySelectorAll(".hidemd").forEach(function (e) { e.style.display = hideMd ? "none" : ""; });
    }
    addEventListener("resize", function () { clearTimeout(svg._rt); svg._rt = setTimeout(applyColHiding, 120); }, { passive: true });
    applyColHiding();

    var truthBtn = document.getElementById("truthBtn");
    truthBtn.addEventListener("click", function () {
      showTruth = !showTruth;
      truthBtn.classList.toggle("on", showTruth);
      truthBtn.textContent = (showTruth ? "hiding" : "show") + " validation labels";
      render();
    });

    gT.addEventListener("input", render);
    pT.addEventListener("input", render);
    render();
  })();

  /* ================= 08: database ================= */
  (function () {
    var chips = document.getElementById("idChips");
    if (!chips) return;
    var ids = ["CF-000001", "CF-000002", "CF-000003", "…", "CF-000184", "…", "CF-100000"];
    chips.innerHTML = ids.map(function (id) {
      return '<span' + (id === "CF-000184" ? ' class="hot"' : "") + ">" + id + "</span>";
    }).join("");

    var tp = document.getElementById("tpGrid");
    tp.innerHTML = [0, 1, 2, 3, 4, 5].map(function (i) {
      return '<div class="tp"><img src="../assets/cyano/cell-single.jpg" alt="CF-000184 frame ' + i + '" loading="lazy"' +
        ' style="transform:scale(' + (1 + i * 0.08).toFixed(2) + ") rotate(" + i * 7 + "deg);filter:brightness(" + (0.75 + i * 0.06).toFixed(2) + ')">' +
        '<span class="t">t' + i + "</span></div>";
    }).join("");

    var FEATURES = [
      { key: "growthRate", label: "growth rate", max: 1 },
      { key: "pigmentIndex", label: "pigment index", max: 1 },
      { key: "area", label: "area (µm²)", max: 60 },
      { key: "brightness", label: "brightness", max: 1 },
      { key: "aspectRatio", label: "aspect ratio", max: 3.2 },
      { key: "circularity", label: "circularity", max: 1 },
      { key: "motility", label: "motility (µm/s)", max: 3 }
    ];
    function corr(key) {
      var xs = DATA.map(function (c) { return Number(c[key]); });
      var ys = DATA.map(function (c) { return c.trueCandidate ? 1 : 0; });
      var mx = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;
      var my = ys.reduce(function (a, b) { return a + b; }, 0) / ys.length;
      var num = 0, dx = 0, dy = 0;
      for (var i = 0; i < xs.length; i++) {
        num += (xs[i] - mx) * (ys[i] - my);
        dx += (xs[i] - mx) * (xs[i] - mx);
        dy += (ys[i] - my) * (ys[i] - my);
      }
      return num / Math.sqrt(dx * dy || 1);
    }
    function histogram(key, max, candidates) {
      var bins = new Array(14).fill(0);
      DATA.filter(function (c) { return c.trueCandidate === candidates; }).forEach(function (c) {
        var v = Number(c[key]) / max;
        var i = Math.min(13, Math.max(0, Math.floor(v * 14)));
        bins[i]++;
      });
      var peak = Math.max.apply(null, bins.concat([1]));
      return bins.map(function (b) { return b / peak; });
    }
    var qBtns = document.getElementById("qBtns");
    qBtns.innerHTML = FEATURES.map(function (f, i) {
      return '<button class="qbtn' + (i === 0 ? " on" : "") + '" data-k="' + f.key + '" type="button">' + f.label + "</button>";
    }).join("");
    var rVal = document.getElementById("rVal"), rFill = document.getElementById("rFill");
    var hist = document.getElementById("hist"), histLabel = document.getElementById("histLabel");
    function setFeature(key) {
      var f = FEATURES.filter(function (x) { return x.key === key; })[0];
      var r = corr(f.key);
      rVal.textContent = (r >= 0 ? "+" : "") + r.toFixed(3);
      rVal.className = r > 0.3 ? "hi" : (r < -0.1 ? "lo" : "");
      rFill.className = "fill " + (r >= 0 ? "pos" : "neg");
      rFill.style.left = r >= 0 ? "50%" : (50 + r * 50) + "%";
      rFill.style.width = Math.abs(r) * 50 + "%";
      histLabel.textContent = f.label;
      var ch = histogram(f.key, f.max, true), nh = histogram(f.key, f.max, false);
      var html = "";
      for (var i = 0; i < 14; i++) {
        html += '<div class="col"><div class="c" style="height:' + (ch[i] * 52).toFixed(0) + 'px"></div>' +
          '<div class="n" style="height:' + (nh[i] * 52).toFixed(0) + 'px"></div></div>';
      }
      hist.innerHTML = html;
      qBtns.querySelectorAll(".qbtn").forEach(function (b) { b.classList.toggle("on", b.dataset.k === key); });
    }
    qBtns.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest(".qbtn") : null;
      if (b) setFeature(b.dataset.k);
    });
    setFeature("growthRate");
  })();

  /* ================= vision ring nodes ================= */
  (function () {
    var ring = document.getElementById("ringNodes");
    if (!ring) return;
    var LOOP = ["Discover", "Measure", "Learn", "Select", "Validate"];
    var html = "";
    LOOP.forEach(function (l, i) {
      var a = (i / LOOP.length) * Math.PI * 2 - Math.PI / 2;
      var x = 160 + Math.cos(a) * 108, y = 160 + Math.sin(a) * 108;
      html += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="26" fill="#061019" stroke="rgba(190,242,100,0.45)"/>' +
        '<text x="' + x.toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" fill="#d9f99d" font-size="9.5">' + l + "</text>";
    });
    ring.innerHTML = html;
  })();

  /* ================= dot-nav scroll-spy ================= */
  (function () {
    var links = Array.prototype.slice.call(document.querySelectorAll(".dotnav a"));
    if (!links.length) return;
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    var ticking = false;
    function update() {
      ticking = false;
      var mid = innerHeight * 0.38, best = -1, bd = Infinity;
      sections.forEach(function (sec, i) {
        if (!sec) return;
        var r = sec.getBoundingClientRect();
        var d = r.top > mid ? r.top - mid : Math.abs(r.top - mid);
        if (r.top <= mid + 40 && d < bd) { bd = d; best = i; }
      });
      links.forEach(function (a, i) { a.classList.toggle("on", i === best); });
    }
    addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();
})();

/* ================= reveal-on-scroll (page used to rely on site.js) ================= */
(function () {
  "use strict";
  var els = Array.prototype.slice.call(document.querySelectorAll(".rv"));
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (e) { e.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  els.forEach(function (e) { io.observe(e); });
  /* failsafe: nothing stays hidden (matches site.js behavior) */
  setTimeout(function () {
    document.querySelectorAll(".rv:not(.in)").forEach(function (e) { e.classList.add("in"); });
  }, 2200);
})();
