/* ============================================================
   Orr Biologicals — sim core
   Shared framework for the AlgaePhyte + Mycophyte simulations.
   Pure vanilla JS. No dependencies. Reduced-motion aware.

   Public API: window.OrrSim = { clamp, lerp, smoothstep, css,
     fmt, Trend, Engine }
   ============================================================ */
(function () {
  "use strict";

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(a, b, x) {
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function fmt(n, d) {
    var f = Number(n);
    if (isNaN(f)) return "—";
    return f.toFixed(d === undefined ? 1 : d);
  }
  var reduce = (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------------- Trend: canvas time-series chart ---------------- */
  function Trend(canvas, opts) {
    this.cv = canvas;
    this.o = opts || {};
    this.series = [];      // { label, color, data:[], dash, area, fill }
    this.ctx = canvas.getContext("2d");
    this.W = 0; this.H = 0; this.dpr = 1;
    var self = this;
    this._rs = function () { self.resize(); };
    window.addEventListener("resize", this._rs, { passive: true });
    this.resize();
  }
  Trend.prototype.add = function (s) { this.series.push(s); return this; };
  Trend.prototype.clear = function () { this.series = []; return this; };
  Trend.prototype.set = function (label, data, o) {
    for (var i = 0; i < this.series.length; i++) {
      if (this.series[i].label === label) { this.series[i].data = data; Object.assign(this.series[i], o || {}); return this; }
    }
    return this.add(Object.assign({ label: label, data: data, color: this.o.colors && this.o.colors[this.series.length % this.o.colors.length] || "#33e6ad" }, o || {}));
  };
  Trend.prototype.resize = function () {
    var w = this.cv.clientWidth || this.cv.parentNode.clientWidth || 600;
    var h = this.o.height || (this.cv.clientHeight || 220);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.max(1, Math.floor(w * this.dpr));
    this.cv.height = Math.max(1, Math.floor(h * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.W = w; this.H = h;
    if (this.onresize) this.onresize();
    this.render();
  };
  Trend.prototype.destroy = function () { window.removeEventListener("resize", this._rs); };
  Trend.prototype.render = function () {
    var ctx = this.ctx, W = this.W, H = this.H;
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    var padL = 34, padR = 10, padT = 10, padB = 18;
    var iw = W - padL - padR, ih = H - padT - padB;

    /* value domain */
    var ymin = Infinity, ymax = -Infinity;
    var seen = false;
    for (var s = 0; s < this.series.length; s++) {
      var d = this.series[s].data;
      for (var i = 0; i < d.length; i++) {
        if (d[i] === null || isNaN(d[i])) continue;
        seen = true;
        if (d[i] < ymin) ymin = d[i];
        if (d[i] > ymax) ymax = d[i];
      }
    }
    if (!seen) { ymin = 0; ymax = 1; }
    if (ymax - ymin < 1e-6) { ymax = ymin + 1; }
    var pad = (ymax - ymin) * 0.12;
    ymin -= pad; ymax += pad;
    var n = 0;
    for (var s2 = 0; s2 < this.series.length; s2++) n = Math.max(n, this.series[s2].data.length);

    var line = css("--line") || "rgba(128,128,128,.2)";
    var muted = css("--muted") || "#888";
    var ink = css("--ink2") || "#ccc";

    /* grid + y labels */
    ctx.strokeStyle = line; ctx.fillStyle = muted; ctx.lineWidth = 1;
    ctx.font = "9px 'IBM Plex Mono', monospace";
    var rows = 4;
    for (var r = 0; r <= rows; r++) {
      var y = padT + ih - (r / rows) * ih;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      var v = ymin + (r / rows) * (ymax - ymin);
      ctx.fillText(v.toFixed(1), 4, y + 3);
    }
    /* x labels */
    ctx.textAlign = "right";
    var xlabels = this.o.xlabels || 4;
    for (var x = 0; x <= xlabels; x++) {
      var px = padL + (x / xlabels) * iw;
      ctx.fillText(this.o.xfmt ? this.o.xfmt(x / xlabels) : ("-" + ((n / (xlabels || 1)) * (xlabels - x) * (this.o.step || 1)).toFixed(0) + "h"), px, H - 4);
    }
    ctx.textAlign = "left";

    /* series */
    for (var s3 = 0; s3 < this.series.length; s3++) {
      var sr = this.series[s3], arr = sr.data;
      if (arr.length < 2) continue;
      var maxN = n || arr.length;
      function X(i) { return padL + (i / (maxN - 1)) * iw; }
      function Y(v) { return padT + ih - ((v - ymin) / (ymax - ymin)) * ih; }
      ctx.beginPath();
      var started = false;
      for (var i2 = 0; i2 < arr.length; i2++) {
        if (arr[i2] === null || isNaN(arr[i2])) { started = false; continue; }
        if (!started) { ctx.moveTo(X(i2), Y(arr[i2])); started = true; }
        else ctx.lineTo(X(i2), Y(arr[i2]));
      }
      if (sr.area) {
        ctx.save();
        ctx.lineTo(X(arr.length - 1), padT + ih); ctx.lineTo(X(0), padT + ih); ctx.closePath();
        ctx.fillStyle = sr.color.replace("1)", sr.fill || "0.12)");
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        for (var i3 = 0; i3 < arr.length; i3++) {
          if (i3 === 0) ctx.moveTo(X(i3), Y(arr[i3])); else ctx.lineTo(X(i3), Y(arr[i3]));
        }
      }
      ctx.strokeStyle = sr.color; ctx.lineWidth = sr.width || 2;
      ctx.setLineDash(sr.dash ? [5, 4] : []);
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.stroke();
      ctx.setLineDash([]);
      /* end dot */
      var last = arr.length - 1;
      while (last >= 0 && (arr[last] === null || isNaN(arr[last]))) last--;
      if (last >= 0) {
        ctx.fillStyle = sr.color;
        ctx.beginPath(); ctx.arc(X(last), Y(arr[last]), 3.2, 0, 6.283); ctx.fill();
      }
      /* label */
      if (sr.label && this.o.legend !== false) {
        ctx.fillStyle = sr.color; ctx.font = "600 9px 'IBM Plex Mono', monospace";
        ctx.fillText(sr.label, padL + 2, padT + 9 + this.series.indexOf(sr) * 12);
      }
      void ink;
    }
    if (this.after) this.after(ctx, { padL: padL, padR: padR, padT: padT, padB: padB, iw: iw, ih: ih });
  };

  /* ---------------- Engine: state + actuator base ---------------- */
  function Engine(opts) {
    this.o = opts || {};
    this.t = 0;
    this.state = {};
    this.setpoints = {};
    this.actuators = {};
    this.history = {};      // label -> [values]
    this.maxHist = this.o.maxHist || 160;
    this.log = [];
    this.onLog = null;
    this.onChange = null;   // called every step
    this.auto = true;
    this.planted = false;
    this._seed = 12345;
  }
  Engine.prototype.rand = function () {
    this._seed = (this._seed * 16807) % 2147483647;
    return (this._seed - 1) / 2147483646;
  };
  Engine.prototype.track = function (label, getter) {
    if (!this.history[label]) this.history[label] = { data: [], getter: getter };
  };
  Engine.prototype.pushHist = function () {
    for (var k in this.history) {
      var h = this.history[k];
      h.data.push(h.getter());
      if (h.data.length > this.maxHist) h.data.shift();
    }
  };
  Engine.prototype.logEvent = function (msg, cls) {
    this.log.push({ t: this.t, msg: msg, cls: cls || "" });
    if (this.log.length > 200) this.log.shift();
    if (this.onLog) this.onLog(msg, cls);
  };
  Engine.prototype.act = function (name, on) {
    if (this.actuators[name] === on) return;
    this.actuators[name] = on;
    this.logEvent((on ? "ON  " : "OFF ") + name, on ? "" : "dim");
    if (this.onAct) this.onAct(name, on);
  };
  Engine.prototype.advance = function (dt) { this.t += dt; };
  Engine.prototype.step = function (dt) { this.advance(dt); this.pushHist(); if (this.onChange) this.onChange(); };
  Engine.prototype.control = function () {};

  window.OrrSim = { clamp: clamp, lerp: lerp, smoothstep: smoothstep, css: css, fmt: fmt, Trend: Trend, Engine: Engine, reduce: reduce };
})();
