/* Orr Biologicals — diagrams.js · particles, layers, PBR zones, dashboard */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- hero particle field (cells / data) ---------- */
  var cvs = document.getElementById("cells");
  if (cvs && !reduced) {
    var ctx = cvs.getContext("2d");
    var parts = [], W, H;
    function size() {
      var r = cvs.parentElement.getBoundingClientRect();
      W = cvs.width = r.width;
      H = cvs.height = r.height;
      parts = [];
      var n = Math.min(90, Math.floor((W * H) / 16000));
      for (var i = 0; i < n; i++) parts.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
        r: Math.random() * 1.6 + .5, a: Math.random() * .3 + .08
      });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var i, j;
      for (i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(126, 224, 176, " + p.a + ")";
        ctx.fill();
        for (j = i + 1; j < parts.length; j++) {
          var q = parts[j], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
          if (d2 < 90 * 90) {
            ctx.strokeStyle = "rgba(126, 224, 176, " + ((1 - Math.sqrt(d2) / 90) * .05) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    window.addEventListener("resize", size);
    size();
    requestAnimationFrame(draw);
  }

  /* ---------- platform layers ---------- */
  var layers = document.querySelectorAll(".layer");
  var detail = document.querySelector(".layer-detail");
  var LAYER_INFO = {
    biology:   { t: "Biology",             d: "The living system itself — the microalgae culture, its physiology, and the environment it needs to thrive." },
    sensors:   { t: "Sensors",             d: "Optical density, pH, temperature, light, and CO₂ probes convert culture state into continuous measurements." },
    data:      { t: "Data",                d: "Telemetry is normalized, validated, and stored locally as a structured experiment history." },
    models:    { t: "Models",              d: "Digital twin models — growth kinetics, light response, and nutrient dynamics — turn data into forecasts." },
    automation:{ t: "Automation",          d: "Approved actions reach pumps, lighting, and gas control through a two-layer safety gate." },
    optimization:{ t: "Optimization",      d: "The control loop closes: outcomes are measured against predictions and the next decision is informed." }
  };
  if (layers.length && detail) {
    function show(key) {
      var info = LAYER_INFO[key];
      if (!info) return;
      layers.forEach(function (l) { l.classList.toggle("active", l.getAttribute("data-layer") === key); });
      detail.querySelector("h4").textContent = info.t;
      detail.querySelector("p").textContent = info.d;
    }
    layers.forEach(function (l) {
      l.addEventListener("click", function () { show(l.getAttribute("data-layer")); });
      l.addEventListener("mouseenter", function () { show(l.getAttribute("data-layer")); });
    });
    var first = layers[0].getAttribute("data-layer");
    show(first);
  }

  /* ---------- PBR diagram zones ---------- */
  var zones = document.querySelectorAll(".pbr-zone");
  var items = document.querySelectorAll(".pbr-item");
  if (zones.length && items.length) {
    function activate(id) {
      zones.forEach(function (z) { z.classList.toggle("active", z.id === id); });
      items.forEach(function (it) { it.classList.toggle("active", it.getAttribute("data-zone") === id); });
    }
    zones.forEach(function (z) {
      z.addEventListener("mouseenter", function () { activate(z.id); });
      z.addEventListener("click", function () { activate(z.id); });
    });
    items.forEach(function (it) {
      it.addEventListener("mouseenter", function () { activate(it.getAttribute("data-zone")); });
      it.addEventListener("click", function () { activate(it.getAttribute("data-zone")); });
    });
    activate(items[0].getAttribute("data-zone"));
  }

  /* ---------- dashboard: main chart ---------- */
  var chart = document.getElementById("growth-chart");
  if (chart && !reduced) {
    var cctx = chart.getContext("2d");
    var W2, H2, series = [], running = true;
    function fit() {
      var r = chart.parentElement.getBoundingClientRect();
      W2 = chart.width = Math.floor(r.width);
      H2 = chart.height = 280;
      chart.style.width = W2 + "px";
      chart.style.height = H2 + "px";
    }
    function seed() {
      series = [];
      var v = .35;
      for (var i = 0; i < 48; i++) {
        v = Math.min(.95, Math.max(.08, v + (Math.random() - .48) * .05));
        series.push(v);
      }
    }
    function drawChart() {
      cctx.clearRect(0, 0, W2, H2);
      var pad = 12, n = series.length;
      var x = function (i) { return pad + (i / (n - 1)) * (W2 - pad * 2); };
      var y = function (v) { return H2 - pad - v * (H2 - pad * 2); };
      // grid
      cctx.strokeStyle = "rgba(231,239,235,.07)";
      cctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var gy = pad + (g / 4) * (H2 - pad * 2);
        cctx.beginPath(); cctx.moveTo(pad, gy); cctx.lineTo(W2 - pad, gy); cctx.stroke();
      }
      // area + line
      var grad = cctx.createLinearGradient(0, 0, 0, H2);
      grad.addColorStop(0, "rgba(62,207,142,.22)");
      grad.addColorStop(1, "rgba(62,207,142,0)");
      cctx.beginPath();
      for (var i2 = 0; i2 < n; i2++) { var px = x(i2), py = y(series[i2]); i2 === 0 ? cctx.moveTo(px, py) : cctx.lineTo(px, py); }
      cctx.lineTo(x(n - 1), H2 - pad); cctx.lineTo(x(0), H2 - pad); cctx.closePath();
      cctx.fillStyle = grad; cctx.fill();
      cctx.beginPath();
      for (var i3 = 0; i3 < n; i3++) { var px3 = x(i3), py3 = y(series[i3]); i3 === 0 ? cctx.moveTo(px3, py3) : cctx.lineTo(px3, py3); }
      cctx.strokeStyle = "#3ECF8E"; cctx.lineWidth = 2; cctx.stroke();
      cctx.beginPath(); cctx.arc(x(n - 1), y(series[n - 1]), 3, 0, Math.PI * 2);
      cctx.fillStyle = "#8CE8BC"; cctx.fill();
    }
    fit();
    seed();
    drawChart();
    setInterval(function () {
      if (!running) return;
      series.push(Math.min(.95, Math.max(.08, series[series.length - 1] + (Math.random() - .5) * .05)));
      series.shift();
      drawChart();
    }, 1600);
    var pause = document.getElementById("dash-pause");
    if (pause) pause.addEventListener("click", function () {
      running = !running;
      pause.textContent = running ? "Pause" : "Resume";
    });
    window.addEventListener("resize", function () { fit(); drawChart(); });
  }

  /* ---------- dashboard: metric values + sparklines ---------- */
  var cells = document.querySelectorAll("[data-live]");
  if (cells.length) {
    var base = {}, unit = {};
    cells.forEach(function (c) {
      var k = c.getAttribute("data-live");
      base[k] = parseFloat(c.textContent) || 0;
      var sm = c.querySelector("small");
      unit[k] = sm ? " " + sm.textContent : "";
    });
    setInterval(function () {
      cells.forEach(function (c) {
        var k = c.getAttribute("data-live");
        var j = parseFloat(c.getAttribute("data-jitter")) || .02;
        var v = base[k] * (1 + (Math.random() - .5) * j);
        var dec = parseInt(c.getAttribute("data-dec") || "1", 10);
        c.textContent = v.toFixed(dec) + unit[k];
      });
    }, 1800);
  }
  document.querySelectorAll(".spark").forEach(function (sp) {
    var sctx = sp.getContext("2d");
    var w = 64, h = 26;
    var vals = [];
    var v0 = .4 + Math.random() * .4;
    for (var i = 0; i < 24; i++) { v0 = Math.min(.95, Math.max(.1, v0 + (Math.random() - .48) * .18)); vals.push(v0); }
    function drawSpark() {
      sctx.clearRect(0, 0, w, h);
      sctx.strokeStyle = "rgba(62,207,142,.7)";
      sctx.lineWidth = 1.2;
      sctx.beginPath();
      for (var i2 = 0; i2 < vals.length; i2++) {
        var px = (i2 / (vals.length - 1)) * (w - 2) + 1;
        var py = h - 2 - vals[i2] * (h - 4);
        i2 === 0 ? sctx.moveTo(px, py) : sctx.lineTo(px, py);
      }
      sctx.stroke();
    }
    drawSpark();
  });
})();
