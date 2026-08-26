/* ============================================================
   Orr Biologicals — MycoSim
   Interactive grow-chamber simulation for Mycophyte.
   Illustrative model: humidity/temp/CO2 dynamics + growth index
   forecast + experimental vision-flag module (prompts review;
   it does NOT diagnose). Clearly labeled as a simulation.
   Mounts into the #myco-sim skeleton on /mycophyte.
   ============================================================ */
(function () {
  "use strict";
  var S = window.OrrSim;
  if (!S) return;
  var clamp = S.clamp, lerp = S.lerp, smoothstep = S.smoothstep, fmt = S.fmt;

  var AMB_T = 21.0, AMB_H = 45, AMB_CO2 = 450;

  function bell(x, center, width) {
    return Math.exp(-Math.pow((x - center) / width, 2) * 1.4);
  }

  /* growth rate per sim-day, fraction of max, under conditions */
  function growthRate(temp, hum, co2, moist, bio) {
    var tempFit = bell(temp, 22.5, 4.2);
    var rhFit = bell(hum, 92, 6.5);
    var co2Fit = clamp(1 - Math.max(0, co2 - 1000) / 3500, 0, 1);
    var moistFit = bell(moist, 0.75, 0.35);
    var rate = 0.34 * tempFit * rhFit * co2Fit * moistFit;
    var logistic = clamp((100 - bio) / 100, 0.05, 1);
    return rate * logistic;
  }

  function MycoSim(ui) {
    var self = this;
    this.ui = ui || {};
    this.state = {
      temp: 23.0, hum: 84, co2: 620, moist: 0.62,
      bio: 4, pins: 0, airflow: 0, paused: false
    };
    this.setpoints = { temp: 22.5, hum: 92, co2: 900 };
    this.actuators = { heater: false, humidifier: false, exhaust: false, intake: false, mist: false, led: true };
    this.auto = true;
    this.hist = { temp: [], hum: [], co2: [], bio: [] };
    this.log = [];
    this.tMin = 0;                      // simulated minutes
    this.visionTimer = 55;
    this.visionFlag = false;
    this.visionRisk = 0;
    this._seed = 7;
    this.forecast = null;               // { rate, line: [..] }
    this.onState = null;

    this.trend = null;
    this.co2Trend = null;
    this._frameId = 0;

    /* ---- hooks into the page skeleton ---- */
    this.el = {
      stage: ui.stage,
      tempVal: ui.tempVal, humVal: ui.humVal, co2Val: ui.co2Val,
      bioVal: ui.bioVal, flowVal: ui.flowVal, forecastVal: ui.forecastVal,
      harvestVal: ui.harvestVal, riskVal: ui.riskVal,
      log: ui.logEl, fan: ui.fan, heater: ui.heaterGlow, mist: ui.mist,
      led: ui.led, lamp: ui.lamp, mushrooms: ui.mushrooms || [],
      camera: ui.camera, camNote: ui.camNote
    };
    /* chart canvases */
    if (ui.trend) this.trend = new S.Trend(ui.trend, { height: 210 });
    if (ui.co2) this.co2Trend = new S.Trend(ui.co2, { height: 76, legend: false });
    if (this.trend) {
      this.trend.set("TEMP °C", this.hist.temp, { color: "rgba(240,168,58,1)", width: 2 });
      this.trend.set("RH %", this.hist.hum, { color: "rgba(143,216,192,1)", width: 2, area: true, fill: "0.10)" });
      this.trend.set("GROWTH INDEX (fcast)", [], { color: "rgba(240,200,140,1)", width: 1.6, dash: true });
    }
    if (this.co2Trend) this.co2Trend.set("CO2", this.hist.co2, { color: "rgba(255,170,90,1)", width: 2 });

    /* prime history so the chart has context */
    for (var i = 0; i < 60; i++) {
      this.hist.temp.push(this.state.temp + (Math.sin(i * 0.7) * 0.3));
      this.hist.hum.push(this.state.hum + (Math.cos(i * 0.5) * 1.4));
      this.hist.co2.push(this.state.co2 + (Math.sin(i * 1.3) * 25));
      this.hist.bio.push(Math.max(4, this.state.bio * (1 - 0.004 * (60 - i))));
    }

    this.logEvent("MycoSim model online — chamber at " + this.state.temp.toFixed(1) + "°C / " + this.state.hum.toFixed(0) + " %RH");
    this.logEvent("Twin forecast initializing…");
  }

  MycoSim.prototype.rand = function () {
    this._seed = (this._seed * 16807) % 2147483647;
    return (this._seed - 1) / 2147483646;
  };

  MycoSim.prototype.logEvent = function (msg, cls) {
    this.log.push({ t: this.tMin, msg: msg, cls: cls || "" });
    if (this.log.length > 120) this.log.shift();
    if (this.el.log) {
      var line = document.createElement("div");
      var stamp = Math.floor(this.tMin / 60) + "h" + ("0" + (this.tMin % 60)).slice(-2);
      line.innerHTML = "<b>" + stamp + "</b> " + msg;
      if (cls) line.className = cls;
      this.el.log.prepend(line);
      while (this.el.log.childNodes.length > 40) this.el.log.removeChild(this.el.log.lastChild);
    }
  };

  MycoSim.prototype.setSetpoint = function (k, v) { this.setpoints[k] = v; };
  MycoSim.prototype.toggleAuto = function (on) { this.auto = on; };
  MycoSim.prototype.setActuator = function (name, on) { this.actuators[name] = !!on; };

  MycoSim.prototype.scan = function () {
    /* experimental vision module — flags anomalies for human review */
    var s = this.state;
    var humidRisk = smoothstep(93, 99, s.hum);
    var staleRisk = smoothstep(0.15, 0.0, s.airflow);
    var hotRisk = smoothstep(26, 30, s.temp);
    var moistRisk = smoothstep(0.75, 0.95, s.moist);
    var risk = clamp(0.22 * humidRisk + 0.3 * staleRisk + 0.25 * hotRisk + 0.18 * moistRisk + (this.rand() * 0.12), 0, 1);
    this.visionRisk = risk;
    if (this.el.riskVal) this.el.riskVal.textContent = Math.round(risk * 100) + "%";
    if (risk > 0.62) {
      if (!this.visionFlag) {
        this.visionFlag = true;
        this.logEvent("Vision module: possible anomaly flagged in camera view — review manually (experimental detection, not a diagnosis)", "warn");
      }
      if (this.el.camera) this.el.camera.classList.add("flag");
      if (this.el.camNote) this.el.camNote.textContent = "Possible anomaly flagged — inspect the culture by eye";
    } else {
      if (this.visionFlag) {
        this.visionFlag = false;
        this.logEvent("Vision module: no anomaly in current scan — conditions normalized");
      }
      if (this.el.camera) this.el.camera.classList.remove("flag");
      if (this.el.camNote) this.el.camNote.textContent = "Scan clean — no anomalies detected in this simulated frame";
    }
  };

  MycoSim.prototype.control = function () {
    var s = this.state, sp = this.setpoints, a = this.actuators;
    if (this.auto) {
      /* hysteresis control toward setpoints */
      a.heater = s.temp < sp.temp - 0.3 ? true : (s.temp > sp.temp + 0.3 ? false : a.heater);
      a.humidifier = s.hum < sp.hum - 1.2 ? true : (s.hum > sp.hum + 1.2 ? false : a.humidifier);
      var needAir = s.co2 > sp.co2 + 90 || s.hum > sp.hum + 3.5;
      a.exhaust = needAir ? true : (s.co2 < sp.co2 - 60 && s.hum < sp.hum - 1.5 ? false : a.exhaust);
      a.intake = a.exhaust;
      a.mist = s.moist < 0.62 ? true : (s.moist > 0.72 ? false : a.mist);
      a.led = true;
    }
    s.airflow = (a.exhaust || a.intake) ? 1 : 0;
  };

  MycoSim.prototype.step = function (dtMin) {
    if (this.state.paused) { if (this.onState) this.onState(); return; }
    var s = this.state, a = this.actuators;
    this.tMin += dtMin;

    /* --- temperature: heater pulls toward 27.5 °C, venting pulls to room air --- */
    if (a.heater) s.temp += (27.5 - s.temp) * dtMin / 40;
    else s.temp += (AMB_T - s.temp) * dtMin / 70;
    if (s.airflow) s.temp += (AMB_T - s.temp) * dtMin / 22;

    /* --- humidity: fogger adds, dry air and venting strip it --- */
    var dry = (s.hum - AMB_H) * 0.012 * (1 + s.airflow * 2.6);
    s.hum += ((a.humidifier ? 0.55 : 0) - dry) * dtMin;
    s.hum = clamp(s.hum, 25, 99.5);

    /* --- CO2: respiration makes it, airflow flushes it --- */
    var resp = (4 + s.bio * 0.14) * (1 + (32 - s.temp) * 0.02);
    var vent = s.airflow ? (s.co2 - AMB_CO2) * 0.06 : 0;
    s.co2 += (resp - vent) * dtMin;
    s.co2 = clamp(s.co2, AMB_CO2, 5000);

    /* --- substrate moisture --- */
    s.moist += ((a.mist ? 0.06 : -0.012) + (s.airflow ? -0.004 : 0)) * dtMin;
    s.moist = clamp(s.moist, 0.2, 0.99);

    /* --- growth (sim-day = 1440 min) --- */
    var ratePerDay = growthRate(s.temp, s.hum, s.co2, s.moist, s.bio);
    if (this.visionFlag && ratePerDay > 0.05) ratePerDay *= 0.82; // flagged culture slows
    s.bio += (ratePerDay / 1440) * dtMin;
    s.bio = clamp(s.bio, 0, 100);
    s.pins = Math.min(100, s.bio * 1.15);

    /* --- periodic vision scan --- */
    this.visionTimer -= dtMin;
    if (this.visionTimer <= 0) {
      this.visionTimer = 30 + this.rand() * 60;
      this.scan();
    }
    if (this.visionFlag) { this.visionRisk = clamp(this.visionRisk + 0.02, 0, 1); }

    /* --- forecast: hold current conditions steady, project 72 h --- */
    var fc = [];
    var b = s.bio;
    for (var h = 0; h <= 72; h += 3) {
      var r = growthRate(s.temp, s.hum, s.co2, s.moist, b);
      if (this.visionFlag) r *= 0.82;
      b += (r / 24) * 3;
      fc.push(clamp(b, 0, 100));
    }
    this.forecast = fc;
    var daysToHarvest = Math.max(0, (55 - s.bio) / Math.max(0.001, ratePerDay));
    this.daysToHarvest = daysToHarvest;

    /* --- history --- */
    this.hist.temp.push(s.temp); this.hist.hum.push(s.hum);
    this.hist.co2.push(s.co2); this.hist.bio.push(s.bio);
    while (this.hist.temp.length > 150) { this.hist.temp.shift(); this.hist.hum.shift(); this.hist.co2.shift(); this.hist.bio.shift(); }

    if (this.onState) this.onState();
  };

  MycoSim.prototype.render = function () {
    var s = this.state, el = this.el;
    if (el.tempVal) el.tempVal.textContent = fmt(s.temp, 1);
    if (el.humVal) el.humVal.textContent = fmt(s.hum, 0);
    if (el.co2Val) el.co2Val.textContent = fmt(s.co2, 0);
    if (el.bioVal) el.bioVal.textContent = fmt(s.bio, 1);
    if (el.flowVal) el.flowVal.textContent = s.airflow ? "VENT" : "SEALED";
    if (el.forecastVal) el.forecastVal.textContent = fmt(this.forecast ? this.forecast[this.forecast.length - 1] : s.bio, 1) + " / 100";
    if (el.harvestVal) el.harvestVal.textContent = this.daysToHarvest > 99 ? "—" : fmt(this.daysToHarvest, 0) + " d";

    /* chamber visuals */
    if (el.heater) el.heater.style.opacity = this.actuators.heater ? "1" : "0.14";
    if (el.led) el.led.style.opacity = this.actuators.led ? "0.9" : "0.2";
    if (el.fan) {
      el.fan.style.animationPlayState = (this.actuators.exhaust || this.actuators.intake) ? "running" : "paused";
      el.fan.style.opacity = this.actuators.exhaust ? "1" : "0.25";
    }
    if (el.mist) {
      el.mist.classList.toggle("on", this.actuators.humidifier || this.actuators.mist);
    }
    if (el.lamp) {
      el.lamp.classList.toggle("flag", this.visionFlag);
      el.lamp.setAttribute("data-risk", this.visionRisk.toFixed(2));
    }
    /* mushrooms scale with growth */
    for (var i = 0; i < el.mushrooms.length; i++) {
      var m = el.mushrooms[i];
      if (!m) continue;
      var g = clamp((s.bio * (1.6 - i * 0.12)) / 100, 0.08, 1);
      m.style.transform = "scale(" + (0.35 + g * 1.05).toFixed(2) + ")";
      m.style.opacity = clamp(g * 2, 0, 1).toFixed(2);
    }
    /* camera frame flicker */
    if (el.camera && el.camNote && !el.camera.dataset.noise) {
      el.camera.dataset.noise = "1";
    }
    if (this.trend) {
      this.trend.set("TEMP °C", this.hist.temp, { color: "rgba(240,168,58,1)" });
      this.trend.set("RH %", this.hist.hum, { color: "rgba(143,216,192,1)", area: true });
      /* forecast (dashed) rides the same x-axis as a projection beyond history */
      var d = this.hist.temp;
      var padArr = new Array(Math.max(0, d.length - 1)).fill(null);
      this.trend.set("GROWTH INDEX (fcast)", padArr.concat(this.forecast || []), { color: "rgba(240,200,140,1)", dash: true });
      this.trend.render();
    }
    if (this.co2Trend) { this.co2Trend.set("CO2", this.hist.co2); this.co2Trend.render(); }
  };

  MycoSim.prototype.destroy = function () {
    if (this.trend) this.trend.destroy();
    if (this.co2Trend) this.co2Trend.destroy();
  };

  window.MycoSim = MycoSim;
})();
