/* THE LAB: a simplified educational Spirulina photobioreactor simulation. */
(function () {
  "use strict";

  var STORAGE_KEY = "orr-biologicals-the-lab-v1";
  var HISTORY_LIMIT = 42;
  var researchCatalog = [
    { id: "sensing", code: "SEN", name: "SENSING", text: "Improve signal clarity and sensor history.", cost: 0 },
    { id: "cultivation", code: "CUL", name: "CULTIVATION", text: "Increase the culture growth ceiling.", cost: 5, requires: "sensing" },
    { id: "computation", code: "COM", name: "COMPUTATION", text: "Increase learning from each experiment.", cost: 8, requires: "cultivation" },
    { id: "ai", code: "AI", name: "AI", text: "Sharper weighted hypotheses from MAIN.", cost: 10, requires: "computation" },
    { id: "digital-twin", code: "TWN", name: "DIGITAL TWIN", text: "Unlock model prediction and error tracking.", cost: 10, requires: "ai" },
    { id: "computer-vision", code: "CV", name: "COMPUTER VISION", text: "Improve optical density estimation.", cost: 14, requires: "digital-twin" },
    { id: "phyconet", code: "NET", name: "PHYCONET", text: "Connect four conceptual reactors.", cost: 40, requires: "computer-vision" }
  ];
  var achievementCatalog = [
    { id: "first-culture", name: "FIRST CULTURE", text: "Start the simulation." },
    { id: "controlled-environment", name: "CONTROLLED ENVIRONMENT", text: "Hold the culture near its preferred window." },
    { id: "experimentalist", name: "EXPERIMENTALIST", text: "Run your first experiment." },
    { id: "signal-detective", name: "SIGNAL DETECTIVE", text: "Run three experiments." },
    { id: "model-builder", name: "MODEL BUILDER", text: "Unlock the Digital Twin." },
    { id: "network-effect", name: "NETWORK EFFECT", text: "Unlock PHYCONET." },
    { id: "model-convergence", name: "MODEL CONVERGENCE", text: "Bring prediction error below 8%." }
  ];
  var defaults = {
    time: 0, biomass: .38, growthRate: .12, temperature: 30, ph: 9.15, light: 58, carbon: 55, nutrients: 72, oxygen: 74, mixing: 62, aeration: 48, energy: 100,
    sensors: { ph: [], temperature: [], light: [], od: [], oxygen: [], tds: [] }, experiments: [], research: { points: 0, unlocked: ["sensing"] }, ai: { confidence: 61, error: 18.4 }, achievements: [], running: false, speed: 1, lastExperiment: null
  };
  var gameState = clone(defaults);
  var particles = [];
  var bubbles = [];
  var lastFrame = performance.now();
  var sensorClock = 0;
  var saveClock = 0;
  var initialized = false;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function response(value, optimum, width) { return Math.exp(-Math.pow((value - optimum) / width, 2)); }
  function pct(value) { return Math.round(value) + "%"; }
  function byId(id) { return document.getElementById(id); }
  function setText(id, value) { var el = byId(id); if (el) el.textContent = value; }

  function initializeGame() {
    loadGame();
    seedVisuals();
    if (!gameState.sensors.ph.length) {
      for (var i = 0; i < 12; i += 1) updateSensors();
    }
    bindControls();
    renderResearch();
    renderAchievements();
    renderNotebook();
    renderCanvas();
    updateAI();
    updateUI();
    initialized = true;
    requestAnimationFrame(gameLoop);
  }

  function seedVisuals() {
    particles = [];
    bubbles = [];
    for (var i = 0; i < 150; i += 1) particles.push({ x: 130 + Math.random() * 200, y: 205 + Math.random() * 215, r: 1 + Math.random() * 2.5, phase: Math.random() * Math.PI * 2, hue: Math.random() > .72 ? "cyan" : "green" });
    for (var j = 0; j < 24; j += 1) bubbles.push({ x: 145 + Math.random() * 170, y: 415 - Math.random() * 215, r: 1 + Math.random() * 3, speed: .2 + Math.random() * .6 });
  }

  function bindControls() {
    var controls = ["light", "mixing", "aeration", "temperature", "carbon", "nutrients"];
    controls.forEach(function (name) {
      var input = byId(name + "-control");
      if (!input) return;
      input.addEventListener("input", function () {
        gameState[name] = Number(input.value);
        updateControlOutput(name);
        updateSimulation(0);
        saveGame();
      });
      updateControlOutput(name);
    });
    byId("play-toggle").addEventListener("click", function () { gameState.running = !gameState.running; updateUI(); saveGame(); });
    document.querySelectorAll("[data-speed]").forEach(function (button) {
      button.addEventListener("click", function () {
        gameState.speed = Number(button.dataset.speed);
        document.querySelectorAll("[data-speed]").forEach(function (item) { item.classList.toggle("active", item === button); });
        saveGame();
      });
    });
    byId("save-game").addEventListener("click", function () { saveGame(); flashStatus("Simulation saved locally."); });
    byId("reset-game").addEventListener("click", function () { if (window.confirm("Reset THE LAB simulation and notebook?")) resetGame(); });
    byId("experiment-form").addEventListener("submit", function (event) { event.preventDefault(); runExperiment(); });
    byId("unlock-twin").addEventListener("click", function () { unlockResearch("digital-twin"); });
    byId("unlock-phyconet").addEventListener("click", function () { unlockResearch("phyconet"); });
  }

  function updateControlOutput(name) {
    var value = gameState[name];
    var output = byId(name + "-out");
    if (!output) return;
    output.textContent = name === "temperature" ? Number(value).toFixed(1) + "°C" : pct(value);
    var input = byId(name + "-control");
    if (input) {
      input.value = value;
      var range = Number(input.max) - Number(input.min);
      input.style.setProperty("--fill", ((Number(value) - Number(input.min)) / range * 100) + "%");
    }
  }

  function updateSimulation(dt) {
    if (!dt) { updateSensors(); updateAI(); updateUI(); return; }
    var scaledDt = dt * gameState.speed;
    gameState.time += scaledDt;
    updateBiology(scaledDt);
    sensorClock += scaledDt;
    saveClock += scaledDt;
    if (sensorClock >= 1) { sensorClock = 0; updateSensors(); updateAI(); updateAchievements(); }
    if (saveClock >= 12) { saveClock = 0; saveGame(); }
  }

  function updateBiology(dt) {
    var lightResponse = response(gameState.light, 70, 40);
    var temperatureResponse = response(gameState.temperature, 30, 5.5);
    var phResponse = response(gameState.ph, 9.3, .9);
    var carbonResponse = clamp(gameState.carbon / 72, 0, 1);
    var nutrientResponse = clamp(gameState.nutrients / 78, 0, 1);
    var oxygenResponse = response(gameState.oxygen, 72, 35);
    var mixingResponse = response(gameState.mixing, 66, 43);
    var maximumGrowth = gameState.research.unlocked.indexOf("cultivation") >= 0 ? .00025 : .00019;
    var factor = lightResponse * temperatureResponse * phResponse * carbonResponse * nutrientResponse * oxygenResponse * mixingResponse;
    var stress = (Math.abs(gameState.temperature - 30) / 20 + Math.abs(gameState.ph - 9.3) / 8) * .008;
    gameState.growthRate = clamp(factor * .42 - stress, -.15, .42);
    gameState.biomass = clamp(gameState.biomass + (gameState.growthRate * maximumGrowth * dt), .08, 1.65);
    var carbonEffect = (gameState.aeration - 50) * .012;
    var photosyntheticOxygen = (gameState.light / 100) * (gameState.mixing / 100) * .18;
    gameState.oxygen = clamp(gameState.oxygen + (photosyntheticOxygen + carbonEffect - (gameState.oxygen - 76) * .025) * dt, 8, 100);
    gameState.ph = clamp(gameState.ph + ((gameState.light - 62) * .0008 - (gameState.carbon - 55) * .00035 - (gameState.ph - 9.25) * .018) * dt, 7.5, 11.5);
    gameState.energy = clamp(gameState.energy - ((gameState.light * .00012 + gameState.mixing * .00006 + gameState.aeration * .00008) * dt), 0, 100);
    if (gameState.energy < 12) gameState.energy = clamp(gameState.energy + .03 * dt, 0, 100);
  }

  function updateSensors() {
    var noise = function (amount) { return (Math.random() - .5) * amount; };
    var tds = 430 + gameState.nutrients * 4 + gameState.carbon * 1.25 + noise(8);
    var readings = {
      ph: gameState.ph + noise(.025), temperature: gameState.temperature + noise(.08), light: gameState.light + noise(1.2), od: gameState.biomass + noise(.012), oxygen: gameState.oxygen + noise(1.4), tds: tds
    };
    Object.keys(readings).forEach(function (key) { gameState.sensors[key].push(readings[key]); if (gameState.sensors[key].length > HISTORY_LIMIT) gameState.sensors[key].shift(); });
  }

  function updateAI() {
    var lightScore = clamp((70 - gameState.light) / 70 * 100 + (gameState.biomass < .45 ? 14 : 0), 2, 92);
    var nutrientScore = clamp((78 - gameState.nutrients) / 78 * 100, 2, 86);
    var uncertainty = clamp(100 - lightScore - nutrientScore, 8, 55);
    var total = lightScore + nutrientScore + uncertainty;
    var values = [lightScore / total * 100, nutrientScore / total * 100, uncertainty / total * 100];
    var labels = ["Light limitation", "Nutrient limitation", "Sensor uncertainty"];
    var list = byId("hypothesis-list");
    if (!list) return;
    list.innerHTML = labels.map(function (label, index) { return "<div class=\"hypothesis\"><div class=\"hypothesis-head\"><span>" + label + "</span><span>" + Math.round(values[index]) + "%</span></div><div class=\"hypothesis-track\"><i style=\"width:" + values[index] + "%\"></i></div></div>"; }).join("");
    var strongest = values.indexOf(Math.max.apply(Math, values));
    var interpretation = strongest === 0 ? "MAIN sees a likely photon limitation. Test light or mixing before changing several variables." : strongest === 1 ? "MAIN sees a likely medium limitation. Test nutrients or carbon and compare the response." : "MAIN sees conflicting signals. Keep the next experiment narrow to reduce uncertainty.";
    setText("main-interpretation", interpretation);
  }

  function updateAchievements() {
    if (gameState.achievements.indexOf("first-culture") < 0) unlockAchievement("first-culture");
    if (gameState.running && Math.abs(gameState.temperature - 30) < 2 && Math.abs(gameState.ph - 9.3) < .45 && gameState.oxygen > 62) unlockAchievement("controlled-environment");
    if (gameState.experiments.length >= 1) unlockAchievement("experimentalist");
    if (gameState.experiments.length >= 3) unlockAchievement("signal-detective");
    if (gameState.research.unlocked.indexOf("digital-twin") >= 0) unlockAchievement("model-builder");
    if (gameState.research.unlocked.indexOf("phyconet") >= 0) unlockAchievement("network-effect");
    if (gameState.ai.error < 8) unlockAchievement("model-convergence");
    renderAchievements();
  }

  function unlockAchievement(id) {
    if (gameState.achievements.indexOf(id) < 0) { gameState.achievements.push(id); saveGame(); }
  }

  function updateUI() {
    var h = Math.floor(gameState.time / 3600); var m = Math.floor((gameState.time % 3600) / 60); var s = Math.floor(gameState.time % 60);
    setText("sim-time", [h, m, s].map(function (n) { return String(n).padStart(2, "0"); }).join(":"));
    var play = byId("play-toggle");
    if (play) { play.querySelector(".icon").textContent = gameState.running ? "Ⅱ" : "▶"; play.querySelector("span:last-child").textContent = gameState.running ? "PAUSE" : "PLAY"; }
    setText("ph-reading", gameState.ph.toFixed(2)); setText("temp-reading", gameState.temperature.toFixed(1) + "°C"); setText("light-reading", pct(gameState.light)); setText("od-reading", gameState.biomass.toFixed(2)); setText("oxygen-reading", pct(gameState.oxygen)); setText("tds-reading", Math.round(430 + gameState.nutrients * 4 + gameState.carbon * 1.25) + " ppm");
    setText("reactor-light-label", pct(gameState.light)); setText("reactor-od-label", gameState.biomass.toFixed(2)); setText("reactor-mix-label", pct(gameState.mixing)); setText("reactor-o2-label", pct(gameState.oxygen));
    setText("twin-error", gameState.ai.error.toFixed(1) + "%"); setText("twin-confidence", Math.round(gameState.ai.confidence) + "%");
    setText("research-points", Math.floor(gameState.research.points)); setText("experiment-count", gameState.experiments.length + " RUNS"); setText("achievement-count", gameState.achievements.length + " / " + achievementCatalog.length);
    updateControlOutput("light"); updateControlOutput("mixing"); updateControlOutput("aeration"); updateControlOutput("temperature"); updateControlOutput("carbon"); updateControlOutput("nutrients");
    setStatus("ph-status", gameState.ph > 8.5 && gameState.ph < 10.3 ? "STABLE" : "CHECK"); setStatus("temp-status", Math.abs(gameState.temperature - 30) < 3 ? "OPTIMAL" : "CHECK"); setStatus("light-status", gameState.light > 25 && gameState.light < 90 ? "NOMINAL" : "CHECK"); setStatus("od-status", gameState.growthRate > .04 ? "RISING" : "SLOW"); setStatus("oxygen-status", gameState.oxygen > 55 ? "HEALTHY" : "LOW"); setStatus("tds-status", gameState.nutrients > 30 ? "NOMINAL" : "LOW");
    drawSensorGraphs(); drawTwinGraph();
  }

  function setStatus(id, text) { var el = byId(id); if (el) { el.textContent = text; el.style.color = text === "CHECK" || text === "LOW" ? "var(--lab-amber)" : "var(--lab-green)"; } }

  function renderCanvas() {
    var svgLayer = byId("particle-layer"); var bubbleLayer = byId("bubble-layer");
    if (!svgLayer || !bubbleLayer) return;
    svgLayer.innerHTML = particles.map(function (p, i) { return "<circle class=\"bio-particle " + p.hue + "\" data-i=\"" + i + "\" cx=\"" + p.x + "\" cy=\"" + p.y + "\" r=\"" + p.r + "\"/>"; }).join("");
    bubbleLayer.innerHTML = bubbles.map(function (b, i) { return "<circle class=\"bio-bubble\" data-b=\"" + i + "\" cx=\"" + b.x + "\" cy=\"" + b.y + "\" r=\"" + b.r + "\"/>"; }).join("");
    var style = document.createElement("style"); style.textContent = ".bio-particle{fill:#8ce8bc;opacity:.62}.bio-particle.cyan{fill:#57b8d6;opacity:.58}.bio-bubble{fill:none;stroke:#d9a441;stroke-opacity:.45;stroke-width:1}"; document.head.appendChild(style);
  }

  function animateReactor(dt) {
    var density = clamp(gameState.biomass / .7, .35, 2.1);
    particles.forEach(function (p, index) {
      var node = document.querySelector(".bio-particle[data-i='" + index + "']"); if (!node) return;
      p.x += Math.sin(gameState.time * .7 + p.phase) * dt * (.8 + gameState.mixing / 60); p.y += Math.cos(gameState.time * .55 + p.phase) * dt * (.5 + gameState.mixing / 90);
      if (p.x < 124) p.x = 338; if (p.x > 338) p.x = 124; if (p.y < 205) p.y = 426; if (p.y > 426) p.y = 205;
      node.setAttribute("cx", p.x); node.setAttribute("cy", p.y); node.setAttribute("r", Math.max(.7, p.r * density));
    });
    bubbles.forEach(function (b, index) { var node = document.querySelector(".bio-bubble[data-b='" + index + "']"); if (!node) return; b.y -= b.speed * dt * (gameState.aeration / 35 + .3); if (b.y < 205) { b.y = 425; b.x = 145 + Math.random() * 170; } node.setAttribute("cy", b.y); node.setAttribute("cx", b.x); node.setAttribute("r", b.r * (.65 + gameState.aeration / 100)); });
    var fill = byId("culture-fill"); if (fill) fill.setAttribute("y", 432 - clamp(gameState.biomass / 1.65, .15, 1) * 234);
    var surface = byId("culture-surface"); if (surface) surface.setAttribute("d", "M116 " + (432 - clamp(gameState.biomass / 1.65, .15, 1) * 234) + " Q170 " + (420 - clamp(gameState.biomass / 1.65, .15, 1) * 234) + " 230 " + (432 - clamp(gameState.biomass / 1.65, .15, 1) * 234) + " T344 " + (432 - clamp(gameState.biomass / 1.65, .15, 1) * 234));
  }

  function drawLine(canvas, values, color, min, max) {
    if (!canvas) return; var rect = canvas.getBoundingClientRect(); var width = Math.max(100, Math.floor(rect.width || canvas.clientWidth || 160)); var height = 43; var dpr = window.devicePixelRatio || 1; canvas.width = width * dpr; canvas.height = height * dpr; var ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, width, height); ctx.strokeStyle = "rgba(183,231,213,.1)"; ctx.beginPath(); ctx.moveTo(0, height - 1); ctx.lineTo(width, height - 1); ctx.stroke(); if (!values || values.length < 2) return; ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); values.forEach(function (value, i) { var x = i / (values.length - 1) * width; var y = height - clamp((value - min) / (max - min), 0, 1) * (height - 5) - 2; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke();
  }
  function drawSensorGraphs() { drawLine(byId("ph-graph"), gameState.sensors.ph, "#3ECF8E", 7.5, 11); drawLine(byId("temp-graph"), gameState.sensors.temperature, "#57B8D6", 20, 38); drawLine(byId("light-graph"), gameState.sensors.light, "#D9A441", 0, 100); drawLine(byId("od-graph"), gameState.sensors.od, "#3ECF8E", .05, 1.7); drawLine(byId("oxygen-graph"), gameState.sensors.oxygen, "#57B8D6", 0, 100); drawLine(byId("tds-graph"), gameState.sensors.tds, "#D9A441", 400, 950); }
  function drawTwinGraph() {
    var canvas = byId("twin-graph");
    if (!canvas || !gameState.research.unlocked.includes("digital-twin")) return;
    var values = gameState.sensors.od; var rect = canvas.getBoundingClientRect(); var width = Math.max(100, Math.floor(rect.width || canvas.clientWidth || 300)); var height = 170; var dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    var ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(183,231,213,.1)"; ctx.beginPath(); ctx.moveTo(0, height - 1); ctx.lineTo(width, height - 1); ctx.stroke();
    [["#3ECF8E", false], ["#57B8D6", true]].forEach(function (series) {
      ctx.strokeStyle = series[0]; ctx.lineWidth = 1.5; ctx.setLineDash(series[1] ? [4, 4] : []); ctx.beginPath();
      values.forEach(function (value, i) { var x = i / Math.max(1, values.length - 1) * width; var prediction = series[1] ? value + Math.sin(i * .8) * gameState.ai.error / 140 : value; var y = height - clamp((prediction - .05) / 1.65, 0, 1) * (height - 9) - 3; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  function runExperiment() {
    var variable = byId("experiment-variable").value; var start = byId("experiment-start").value; var treatment = byId("experiment-treatment").value; var duration = Number(byId("experiment-duration").value); var before = gameState.biomass;
    var current = gameState[variable]; var multiplier = treatment === "increase" ? 1.15 : treatment === "decrease" ? .85 : 1 + (Math.random() > .5 ? .15 : -.15);
    if (start === "low") current = variable === "temperature" ? 23 : 24; if (start === "high") current = variable === "temperature" ? 36 : 88;
    var target = variable === "temperature" ? clamp(current * multiplier, 20, 38) : clamp(current * multiplier, 0, 100); var localFactor = variable === "light" ? response(target, 70, 40) : variable === "temperature" ? response(target, 30, 5.5) : variable === "carbon" ? clamp(target / 72, 0, 1) : variable === "nutrients" ? clamp(target / 78, 0, 1) : response(target, 66, 43);
    gameState[variable] = target;
    var result = clamp(localFactor * (duration / 24) * (.65 + Math.random() * .5), -.4, .8); var delta = result * .035; gameState.biomass = clamp(gameState.biomass + delta, .08, 1.65); gameState.research.points += Math.round(3 + duration / 12 + (gameState.research.unlocked.includes("computation") ? 2 : 0)); gameState.ai.error = clamp(gameState.ai.error - (gameState.research.unlocked.includes("computation") ? 1.8 : .9), 3, 24); gameState.ai.confidence = clamp(gameState.ai.confidence + 3, 0, 98);
    var note = { id: Date.now(), variable: variable, start: start, treatment: treatment, duration: duration, before: before, after: gameState.biomass, result: result >= .28 ? "positive response" : result >= .1 ? "weak response" : "ambiguous response", at: gameState.time };
    gameState.experiments.unshift(note); if (gameState.experiments.length > 12) gameState.experiments.pop(); gameState.lastExperiment = note; updateAchievements(); renderNotebook(); renderResearch(); updateUI(); saveGame(); flashStatus("Experiment recorded in the LAB NOTEBOOK.");
  }

  function flashStatus(message) { var el = byId("experiment-status"); if (!el) return; el.textContent = message; el.style.color = "var(--lab-green)"; window.setTimeout(function () { el.textContent = "Experiments alter the simulation and are stored in this browser."; el.style.color = ""; }, 3200); }

  function renderNotebook() { var list = byId("notebook-list"); if (!list) return; if (!gameState.experiments.length) { list.innerHTML = "<div class=\"empty-state\">No experiments recorded yet.<br><span>Design a test to start the notebook.</span></div>"; return; } list.innerHTML = gameState.experiments.map(function (note) { return "<article class=\"note-entry\"><header><span>" + note.variable + " / " + note.result + "</span><span>" + note.duration + "H</span></header><p>" + note.treatment + " · " + note.start + " condition · OD " + note.before.toFixed(2) + " → " + note.after.toFixed(2) + "</p><small>SIM TIME " + formatTime(note.at) + " · SIMULATED</small></article>"; }).join(""); }
  function formatTime(time) { var h = Math.floor(time / 3600); var m = Math.floor(time % 3600 / 60); return String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0"); }

  function renderResearch() { var grid = byId("research-grid"); if (!grid) return; grid.innerHTML = researchCatalog.map(function (node) { var unlocked = gameState.research.unlocked.includes(node.id); var available = !unlocked && (!node.requires || gameState.research.unlocked.includes(node.requires)) && gameState.research.points >= node.cost; return "<button class=\"research-node " + (unlocked ? "unlocked" : available ? "available" : "") + "\" data-research=\"" + node.id + "\"><span class=\"node-code\">" + node.code + " · " + (unlocked ? "UNLOCKED" : available ? "AVAILABLE" : "LOCKED") + "</span><strong>" + node.name + "</strong><p>" + node.text + "</p>" + (unlocked ? "" : "<span class=\"cost\">" + node.cost + " RP</span>") + "</button>"; }).join(""); grid.querySelectorAll("[data-research]").forEach(function (node) { node.addEventListener("click", function () { unlockResearch(node.dataset.research); }); }); updateUnlockPanels(); }
  function unlockResearch(id) { var item = researchCatalog.find(function (node) { return node.id === id; }); if (!item || gameState.research.unlocked.includes(id)) return; if (item.requires && !gameState.research.unlocked.includes(item.requires)) { flashStatus("Unlock the previous research node first."); return; } if (gameState.research.points < item.cost) { flashStatus("Not enough research points yet."); return; } gameState.research.points -= item.cost; gameState.research.unlocked.push(id); if (id === "digital-twin") { gameState.ai.error = 14.2; gameState.ai.confidence = 72; } renderResearch(); renderAchievements(); updateUI(); saveGame(); flashStatus(item.name + " unlocked."); }
  function updateUnlockPanels() { var twin = gameState.research.unlocked.includes("digital-twin"); var net = gameState.research.unlocked.includes("phyconet"); byId("twin-locked").classList.toggle("is-hidden", twin); byId("twin-content").classList.toggle("is-hidden", !twin); byId("twin-unlock").textContent = twin ? "ONLINE" : "LOCKED · 10 RP"; byId("network-locked").classList.toggle("is-hidden", net); byId("network-content").classList.toggle("is-hidden", !net); byId("phyconet-unlock").textContent = net ? "ONLINE" : "LOCKED · 40 RP"; if (net) setText("network-learning", Math.min(99, gameState.experiments.length * 9) + "%"); }

  function renderAchievements() { var grid = byId("achievement-grid"); if (!grid) return; grid.innerHTML = achievementCatalog.map(function (item) { var unlocked = gameState.achievements.includes(item.id); return "<article class=\"achievement " + (unlocked ? "unlocked" : "") + "\"><span class=\"mark\">" + (unlocked ? "✓" : "·") + "</span><strong>" + item.name + "</strong><p>" + item.text + "</p></article>"; }).join(""); }

  function saveGame() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)); } catch (error) { /* Static hosting may disable storage; the simulation still runs. */ } }
  function loadGame() { try { var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); if (saved) { gameState = Object.assign(clone(defaults), saved); gameState.sensors = Object.assign(clone(defaults.sensors), saved.sensors || {}); gameState.research = Object.assign(clone(defaults.research), saved.research || {}); gameState.ai = Object.assign(clone(defaults.ai), saved.ai || {}); } } catch (error) { gameState = clone(defaults); } }
  function resetGame() { gameState = clone(defaults); for (var i = 0; i < 12; i += 1) updateSensors(); saveGame(); seedVisuals(); renderCanvas(); renderResearch(); renderAchievements(); renderNotebook(); updateAI(); updateUI(); flashStatus("Simulation reset. A new culture is ready."); }

  function gameLoop(now) { var dt = Math.min(.25, (now - lastFrame) / 1000); lastFrame = now; if (gameState.running) updateSimulation(dt); animateReactor(dt); if (initialized) { renderCanvasIfNeeded(); updateUI(); } requestAnimationFrame(gameLoop); }
  function renderCanvasIfNeeded() { if (particles.length !== document.querySelectorAll(".bio-particle").length) renderCanvas(); }

  Object.defineProperty(window, "gameState", { configurable: true, get: function () { return gameState; } });
  window.initializeGame = initializeGame;
  window.updateSimulation = updateSimulation;
  window.updateBiology = updateBiology;
  window.updateSensors = updateSensors;
  window.updateAI = updateAI;
  window.renderCanvas = renderCanvas;
  window.updateUI = updateUI;
  window.saveGame = saveGame;
  window.loadGame = loadGame;
  window.resetGame = resetGame;
  window.addEventListener("beforeunload", saveGame);
  initializeGame();
})();
