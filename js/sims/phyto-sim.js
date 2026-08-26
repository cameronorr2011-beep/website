/* ============================================================
   Orr Biologicals — PhytoSim
   Interactive photobioreactor simulation for AlgaePhyte.
   Illustrative model: Steele light response + photoinhibition,
   Beer-Lambert self-shading, bell-shaped temperature/pH,
   bicarbonate carbon supply, dissolved-oxygen inhibition.
   Clearly labeled as a simulation, not validated data.
   Mounts into the #phyto-sim skeleton.
   ============================================================ */
(function () {
  "use strict";
  var S = window.OrrSim;
  if (!S) return;
  var clamp = S.clamp, smoothstep = S.smoothstep, fmt = S.fmt;

  function bell(x, center, width) {
    return Math.exp(-Math.pow((x - center) / width, 2));
  }
  /* Steele curve: light response with photoinhibition */
  function steele(I, Iopt) {
    if (I <= 0) return 0;
    return (I / Iopt) * Math.exp(1 - I / Iopt);
  }
  /* Beer-Lambert: mean light inside a dense culture */
  function avgLight(I0, k, od) {
    var a = k * od;
    if (a < 1e-4) return I0;
    return I0 * (1 - Math.exp(-a)) / a;
  }

  function PhytoSim(ui) {
    var self = this;
    this.ui = ui || {};
    this.state = {
      temp: 30, pH: 10.1, light: 520, co2: 0.72, od: 0.42,
      doSat: 118, growth: 0, paused: false
    };
    this.setpoints = { temp: 33.5, pH: 10.0, light: 600, co2: 0.8 };
    this.actuators = { heater: false, air: false, doser: false };
    this.auto = true;
    this.tMin = 0;
    this.hist = { od: [], growth: [], doSat: [] };
    this.log = [];
    this.forecast = null;
    this._seed = 99;
    this.onState = null;

    this.trend = null;
    this.steeleCanvas = null;
    this.el = {
      odVal: ui.odVal, growthVal: ui.growthVal, doVal: ui.doVal,
      phVal: ui.phVal, tempVal: ui.tempVal, lightVal: ui.lightVal,
      log: ui.logEl, heater: ui.heater, air: ui.air, doser: ui.doser,
      bubbles: ui.bubbles
    };
    if (ui.trend) this.trend = new S.Trend(ui.trend, { height: 200 });
    if (ui.steele) {
      this.steeleCanvas = ui.steele;
      this.sctx = ui.steele.getContext("2d");
      var r = function () { self.drawSteele(); };
      window.addEventListener("resize", r, { passive: true });
      this._steeleResize = r;
    }
    if (this.trend) {
      this.trend.set("BIOMASS OD", this.hist.od, { color: "rgba(51,230,173,1)", width: 2, area: true, fill: "0.10)" });
      this.trend.set("GROWTH RATE /day", this.hist.growth, { color: "rgba(87,240,214,1)", width: 1.6, dash: true });
    }
    for (var i = 0; i < 60; i++) {
      this.hist.od.push(Math.max(0.3, this.state.od - (60 - i) * 0.004 + Math.sin(i * 0.8) * 0.01));
      this.hist.growth.push(0.6 + Math.sin(i * 0.4) * 0.2);
      this.hist.doSat.push(110 + Math.sin(i * 0.5) * 10);
    }
    this.logEvent("PhytoSim model online — PBR at OD " + this.state.od.toFixed(2) + ", pH " + this.state.pH.toFixed(1));
    this.logEvent("Steele + Beer-Lambert twin estimating light field…");
  }

  PhytoSim.prototype.rand = function () {
    this._seed = (this._seed * 16807) % 2147483647;
    return (this._seed - 1) / 2147483646;
  };

  PhytoSim.prototype.logEvent = function (msg, cls) {
    this.log.push({ t: this.tMin, msg: msg, cls: cls || "" });
    if (this.log.length > 120) this.log.shift();
    if (this.el.log) {
      var line = document.createElement("div");
      var stamp = "T+" + Math.floor(this.tMin / 60) + "h";
      line.innerHTML = "<b>" + stamp + "</b> " + msg;
      if (cls) line.className = cls;
      this.el.log.prepend(line);
      while (this.el.log.childNodes.length > 40) this.el.log.removeChild(this.el.log.lastChild);
    }
  };

  PhytoSim.prototype.setSetpoint = function (k, v) { this.setpoints[k] = v; };
  PhytoSim.prototype.toggleAuto = function (on) { this.auto = on; };

  PhytoSim.prototype.control = function () {
    var s = this.state, sp = this.setpoints, a = this.actuators;
    if (this.auto) {
      a.heater = s.temp < sp.temp - 0.4 ? true : (s.temp > sp.temp + 0.4 ? false : a.heater);
      /* bicarbonate doser keeps pH from climbing too far */
      a.doser = s.pH > sp.pH + 0.08;
      /* aerate when photosynthetic oxygen supersaturates */
      a.air = s.doSat > 128;
    }
  };

  PhytoSim.prototype.step = function (dtMin) {
    if (this.state.paused) { if (this.onState) this.onState(); return; }
    var s = this.state, a = this.actuators;
    this.tMin += dtMin;

    /* --- temperature: approach setpoint --- */
    var tTarget = a.heater ? Math.max(this.setpoints.temp, s.temp) : 24;
    s.temp += (tTarget - s.temp) * dtMin / 30;

    /* --- light field --- */
    var I0 = s.light;
    var k = 0.9;                       // attenuation coefficient (illustrative)
    var Iavg = avgLight(I0, k, s.od);
    var Iopt = 620;                    // illustrative optimum for the strain
    var photo = steele(Iavg, Iopt);    // 0..1, photoinhibition above optimum

    /* --- growth rate (per day) --- */
    var tempFit = bell(s.temp, 33.5, 7.5);
    var phFit = bell(s.pH, 10.0, 1.1);
    var co2Fit = s.co2 / (s.co2 + 0.25);
    var doInh = 1 / (1 + Math.exp((s.doSat - 150) / 26));
    var muMax = 1.35;                  // illustrative maximum specific growth rate
    var mu = muMax * photo * tempFit * phFit * co2Fit * doInh;
    s.growth = mu;

    /* --- OD accumulates logistically --- */
    s.od += (mu / 1440) * dtMin * (1 - s.od / 2.1);
    s.od = clamp(s.od, 0, 2.1);

    /* --- dissolved oxygen: photosynthesis makes it, aeration vents it --- */
    var photoO2 = 2.2 * photo * (0.3 + s.od);
    var vent = a.air ? 1.6 : 0.22;
    s.doSat += (photoO2 - vent) * dtMin / 3;
    s.doSat = clamp(s.doSat, 60, 320);

    /* --- pH: photosynthesis raises, bicarbonate dosing lowers --- */
    s.pH += (0.012 * photo - (a.doser ? 0.05 : 0) - 0.003) * dtMin / 3;
    s.pH = clamp(s.pH, 7.5, 11.5);

    /* --- CO2 (bicarbonate) pool --- */
    s.co2 += ((a.doser ? 0.01 : 0) - 0.006 * co2Fit) * dtMin / 3;
    s.co2 = clamp(s.co2, 0.1, 1);

    /* --- forecast: hold conditions, project OD 72 h --- */
    var fc = [], b = s.od;
    for (var h = 0; h <= 72; h += 3) {
      var r2 = muMax * photo * tempFit * phFit * co2Fit * doInh;
      b += (r2 / 24) * 3 * (1 - b / 2.1);
      fc.push(clamp(b, 0, 2.1));
    }
    this.forecast = fc;

    /* --- history --- */
    this.hist.od.push(s.od); this.hist.growth.push(mu); this.hist.doSat.push(s.doSat);
    while (this.hist.od.length > 150) { this.hist.od.shift(); this.hist.growth.shift(); this.hist.doSat.shift(); }

    /* --- opportunistic log events (throttled by state changes) --- */
    if (photo < 0.45 && Iavg > Iopt * 1.15) this.logEvent("Light above optimum — photoinhibition cutting growth (simulated Steele response)");
    if (s.doSat > 150 && !this.el.doWarn) {
      this.el.doWarn = 1;
      this.logEvent("Dissolved oxygen supersaturated — air pump engaged", "warn");
    }
    if (s.doSat < 130) this.el.doWarn = 0;

    if (this.onState) this.onState();
  };

  PhytoSim.prototype.drawSteele = function () {
    var cv = this.steeleCanvas, ctx = this.sctx;
    if (!cv || !ctx) return;
    var W = cv.clientWidth, H = 150, dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!W) return;
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var padL = 8, padR = 8, padT = 10, padB = 16;
    var iw = W - padL - padR, ih = H - padT - padB;
    var Iopt = 620, Imax = 1500;
    var X = function (I) { return padL + (I / Imax) * iw; };
    var Y = function (v) { return padT + ih - (v / 1.05) * ih; };
    var line = S.css("--line") || "rgba(128,128,128,.2)";
    var muted = S.css("--muted") || "#888";
    var teal = S.css("--teal") || "#33e6ad";
    var cyan = S.css("--cyan") || "#57f0d6";

    /* photoinhibition zone shading */
    ctx.fillStyle = teal;
    ctx.globalAlpha = 0.06;
    ctx.fillRect(X(Iopt), padT, X(Imax) - X(Iopt), ih);
    ctx.globalAlpha = 1;
    ctx.fillStyle = muted;
    ctx.font = "9px 'IBM Plex Mono', monospace";
    ctx.fillText("PHOTOINHIBITION ZONE", X(Iopt) + 6, padT + 12);

    /* grid */
    ctx.strokeStyle = line;
    for (var g = 0; g <= 3; g++) {
      var gy = padT + ih - (g / 3) * ih;
      ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
    }
    ctx.fillStyle = muted;
    ctx.fillText("Iopt", X(Iopt), H - 3);
    ctx.fillText("0", padL, H - 3);

    /* Steele curve */
    ctx.strokeStyle = teal; ctx.lineWidth = 2; ctx.lineJoin = "round";
    ctx.beginPath();
    for (var I = 0; I <= Imax; I += 6) {
      var v = steele(I, Iopt);
      if (I === 0) ctx.moveTo(X(I), Y(v)); else ctx.lineTo(X(I), Y(v));
    }
    ctx.stroke();

    /* operating point */
    var cur = avgLight(this.state.light, 0.9, this.state.od);
    var curV = steele(cur, Iopt);
    ctx.strokeStyle = cyan; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(X(cur), padT); ctx.lineTo(X(cur), Y(curV)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = cyan;
    ctx.beginPath(); ctx.arc(X(cur), Y(curV), 4.5, 0, 6.283); ctx.fill();
    ctx.fillStyle = muted;
    ctx.fillText("OPERATING POINT  I=" + Math.round(cur), padL + 2, padT + 24);
  };

  PhytoSim.prototype.render = function () {
    var s = this.state, el = this.el;
    if (el.odVal) el.odVal.textContent = fmt(s.od, 2);
    if (el.growthVal) el.growthVal.textContent = fmt(s.growth, 2);
    if (el.doVal) el.doVal.textContent = fmt(s.doSat, 0);
    if (el.phVal) el.phVal.textContent = fmt(s.pH, 2);
    if (el.tempVal) el.tempVal.textContent = fmt(s.temp, 1);
    if (el.lightVal) el.lightVal.textContent = fmt(s.light, 0);
    if (el.heater) el.heater.style.opacity = this.actuators.heater ? "1" : "0.15";
    if (el.air) el.air.style.opacity = this.actuators.air ? "1" : "0.15";
    if (el.doser) el.doser.style.opacity = this.actuators.doser ? "1" : "0.15";
    if (el.bubbles) el.bubbles.style.animationPlayState = this.actuators.air ? "running" : "paused";
    if (this.trend) {
      this.trend.set("BIOMASS OD", this.hist.od, { color: "rgba(51,230,173,1)", area: true });
      var d = this.hist.od;
      var padArr = new Array(Math.max(0, d.length - 1)).fill(null);
      this.trend.set("GROWTH RATE /day", this.hist.growth, { color: "rgba(87,240,214,1)", dash: true });
      this.trend.set("OD FORECAST 72h", padArr.concat(this.forecast || []), { color: "rgba(87,240,214,1)", dash: true });
      this.trend.render();
    }
    this.drawSteele();
  };

  PhytoSim.prototype.destroy = function () {
    if (this.trend) this.trend.destroy();
    if (this._steeleResize) window.removeEventListener("resize", this._steeleResize);
  };

  window.PhytoSim = PhytoSim;
})();
