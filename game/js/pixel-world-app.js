/*
 * Microflux / Rack Run
 *
 * An active, local-first clicker about catching synthetic algae pulses as they
 * arrive at a microfluidic collection gate. Every organism, reward, map rule,
 * and device effect is fictional game logic, not a cultivation protocol.
 */

const SAVE_KEY = "orr-microflux-rack-v2";
const OLD_SAVE_KEY = "orr-microflux-rack-v1";
const MAX_DEVICE_LEVEL = 5;

const MAPS = [
  { id: "water", name: "Azure Basin", short: "water", unlockCost: 0, requiredLevel: 1, color: "#68bdb6", multiplier: 1, lanes: 3, speed: .92, spawn: .96, rule: "steady", description: "three clear lanes · steady pulses", note: "The starter basin is honest. Follow the green pulse to the gate." },
  { id: "sand", name: "Amber Sandline", short: "sand", unlockCost: 280, requiredLevel: 2, color: "#e0ad56", multiplier: 1.35, lanes: 3, speed: 1.12, spawn: .88, rule: "branch", description: "split channels · quick gold pulses", note: "The sandline branches. Watch the gold pulse choose a side." },
  { id: "soil", name: "Moss Soil", short: "soil", unlockCost: 900, requiredLevel: 3, color: "#86a472", multiplier: 1.85, lanes: 4, speed: .78, spawn: .8, rule: "rooted", description: "four offset lanes · patient high value", note: "Root-dark channels move slowly, but a perfect catch is worth the wait." },
  { id: "peat", name: "Moonlit Peat", short: "peat", unlockCost: 2200, requiredLevel: 4, color: "#ac8bc0", multiplier: 2.6, lanes: 3, speed: 1.3, spawn: .72, rule: "eclipse", description: "dark phases · rare luminous blooms", note: "The peat rack dims between pulses. Keep your eyes on the little light." },
];

const SPECIES = [
  { id: "mint-comet", name: "Mint Comet", map: "water", color: "#91d39a", value: 6, note: "a bright, friendly starter culture" },
  { id: "glass-thread", name: "Glass Thread", map: "water", color: "#79c7cf", value: 10, note: "catches a blue edge in the flow" },
  { id: "gold-dust", name: "Gold Dust", map: "sand", color: "#efbd5d", value: 18, note: "warm flecks that split at the branch" },
  { id: "coral-ribbon", name: "Coral Ribbon", map: "sand", color: "#e58b73", value: 27, note: "a slow ribbon with a bright pulse" },
  { id: "moss-lantern", name: "Moss Lantern", map: "soil", color: "#9fbc78", value: 43, note: "green light threaded through root-dark soil" },
  { id: "velvet-spore", name: "Velvet Spore", map: "soil", color: "#b27f9b", value: 59, note: "soft violet motes under the surface" },
  { id: "night-pearl", name: "Night Pearl", map: "peat", color: "#c4a7e5", value: 96, note: "a small moon for patient keepers" },
];

const UPGRADES = [
  { id: "gate", name: "Optical Gate", glyph: "◌", max: 4, baseCost: 110, description: "wider perfect window", effect: (level) => `gate radius +${level * 5}px` },
  { id: "regulator", name: "Pressure Regulator", glyph: "≈", max: 4, baseCost: 135, description: "slows culture pulses", effect: (level) => `pulse speed −${level * 9}%` },
  { id: "splitter", name: "Channel Splitter", glyph: "Y", max: 2, baseCost: 300, description: "adds a live channel", effect: (level) => `${level + 3} lanes in water` },
  { id: "inoculum", name: "Dense Inoculum", glyph: "✦", max: 4, baseCost: 190, description: "raises every clean catch", effect: (level) => `catch value +${level * 18}%` },
  { id: "stabilizer", name: "Combo Stabilizer", glyph: "⌁", max: 3, baseCost: 225, description: "holds your streak longer", effect: (level) => `combo window +${(level * .35).toFixed(2)}s` },
  { id: "pipette", name: "Auto Pipette", glyph: "↓", max: 4, baseCost: 360, description: "small away-time support", effect: (level) => `${(level * .22).toFixed(2)} credits / second` },
];

const $ = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const money = (value) => Math.floor(Number(value || 0)).toLocaleString();
const decimal = (value, digits = 1) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: digits });
const mapById = (id) => MAPS.find((map) => map.id === id) || MAPS[0];
const speciesById = (id) => SPECIES.find((species) => species.id === id) || SPECIES[0];
const upgradeById = (id) => UPGRADES.find((upgrade) => upgrade.id === id);

function defaultState() {
  return {
    credits: 120,
    biomass: 0,
    cells: 0,
    day: 1,
    run: 1,
    deviceLevel: 1,
    activeMap: "water",
    unlockedMaps: ["water"],
    discovered: ["mint-comet"],
    activeSpecies: "mint-comet",
    upgrades: { gate: 0, regulator: 0, splitter: 0, inoculum: 0, stabilizer: 0, pipette: 0 },
    combo: 0,
    bestCombo: 0,
    comboTimer: 0,
    batchProgress: 0,
    totalBatches: 0,
    hits: 0,
    perfects: 0,
    misses: 0,
    totalTargets: 0,
    lastSavedAt: Date.now(),
    log: ["Rack online. The first Mint Comet is moving toward the collection gate."],
  };
}

function migrateOldSave() {
  try {
    const old = JSON.parse(localStorage.getItem(OLD_SAVE_KEY) || "null");
    if (!old) return null;
    const fresh = defaultState();
    fresh.credits = Number(old.credits) || fresh.credits;
    fresh.biomass = Number(old.biomass) || 0;
    fresh.cells = Number(old.cells) || 0;
    fresh.discovered = Array.isArray(old.discovered) && old.discovered.length ? ["mint-comet", ...old.discovered.filter((id) => SPECIES.some((species) => species.id === id))] : fresh.discovered;
    fresh.log = ["Your old culture notes were moved into Rack Run.", ...(Array.isArray(old.log) ? old.log.slice(0, 4) : [])].slice(0, 6);
    return fresh;
  } catch { return null; }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null") || migrateOldSave();
    if (!saved) return defaultState();
    const fresh = defaultState();
    const merged = { ...fresh, ...saved, upgrades: { ...fresh.upgrades, ...(saved.upgrades || {}) } };
    merged.unlockedMaps = Array.isArray(saved.unlockedMaps) && saved.unlockedMaps.length ? saved.unlockedMaps : fresh.unlockedMaps;
    merged.discovered = Array.isArray(saved.discovered) && saved.discovered.length ? [...new Set(saved.discovered)] : fresh.discovered;
    merged.log = Array.isArray(saved.log) && saved.log.length ? saved.log.slice(0, 6) : fresh.log;
    merged.deviceLevel = clamp(Number(merged.deviceLevel) || 1, 1, MAX_DEVICE_LEVEL);
    merged.activeMap = merged.unlockedMaps.includes(merged.activeMap) ? merged.activeMap : merged.unlockedMaps[0];
    merged.activeSpecies = merged.discovered.includes(merged.activeSpecies) ? merged.activeSpecies : merged.discovered[0];
    return merged;
  } catch { return defaultState(); }
}

const state = loadState();
const targets = [];
const effects = [];
let runActive = true;
let spawnTimer = .15;
let targetId = 0;
let frame = 0;
let lastFrameTime = performance.now();
let toastTimer;
let audioContext;

function currentMap() { return mapById(state.activeMap); }
function currentSpecies() { return speciesById(state.activeSpecies); }
function upgradeLevel(id) { return Number(state.upgrades?.[id] || 0); }
function upgradeCost(id) { const upgrade = upgradeById(id); const level = upgradeLevel(id); return Math.round(upgrade.baseCost * Math.pow(1.65, level)); }
function laneCount() { return Math.min(currentMap().lanes + upgradeLevel("splitter"), 5); }
function gateRadius() { return 27 + upgradeLevel("gate") * 5; }
function comboWindow() { return 2.05 + upgradeLevel("stabilizer") * .35; }
function targetSpeed() { return currentMap().speed * (1 - upgradeLevel("regulator") * .09); }
function batchGoal() { return 12 + upgradeLevel("inoculum") * 2; }
function multiplier() {
  if (state.combo >= 20) return 3;
  if (state.combo >= 10) return 2;
  if (state.combo >= 5) return 1.5;
  return 1;
}
function passiveRate() { return upgradeLevel("pipette") * .22 * currentMap().multiplier; }
function accuracy() { return state.hits + state.misses ? state.hits / (state.hits + state.misses) * 100 : 0; }
function baseReward(type = "bloom") {
  const typeMultiplier = type === "gold" ? 3 : type === "debris" ? 0 : 1;
  return Math.max(1, Math.round((currentSpecies().value + 6 + currentMap().multiplier * 4) * (1 + upgradeLevel("inoculum") * .18) * typeMultiplier));
}
function targetReward(type, grade) {
  const gradeMultiplier = grade === "perfect" ? 1.35 : grade === "good" ? 1 : .65;
  return Math.max(1, Math.round(baseReward(type) * gradeMultiplier * multiplier()));
}

function save() {
  try {
    state.lastSavedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch { /* local storage is optional */ }
}

function announce(message, tone = "normal") {
  state.log.unshift(message);
  state.log = state.log.slice(0, 6);
  const toast = $("#pixelToast");
  if (toast) {
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }
  save();
}

function applyAwaytime() {
  const elapsed = clamp((Date.now() - Number(state.lastSavedAt || Date.now())) / 1000, 0, 60 * 60 * 8);
  if (elapsed < 8 || !passiveRate()) return;
  const support = passiveRate() * elapsed;
  state.credits += support;
  state.biomass += support / 14;
  state.log.unshift(`While you were away, the Auto Pipette added ${money(support)} credits.`);
  state.log = state.log.slice(0, 6);
  save();
}

function beep(kind = "good") {
  try {
    audioContext ||= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const frequencies = { good: 420, perfect: 620, gold: 760, bad: 150, batch: 880 };
    oscillator.frequency.value = frequencies[kind] || frequencies.good;
    oscillator.type = kind === "bad" ? "sine" : "triangle";
    gain.gain.setValueAtTime(.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(kind === "bad" ? .035 : .055, audioContext.currentTime + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + (kind === "batch" ? .35 : .16));
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + .4);
  } catch { /* audio is an optional reward layer */ }
}

function randomTargetType() {
  const roll = Math.random();
  if (roll < .08 && currentMap().rule !== "eclipse") return "gold";
  if (roll > .93) return "debris";
  return "bloom";
}

function spawnTarget(forceType = null) {
  const target = {
    id: targetId += 1,
    type: forceType || randomTargetType(),
    lane: Math.floor(Math.random() * laneCount()),
    progress: 0,
    wobble: Math.random() * Math.PI * 2,
    age: 0,
  };
  targets.push(target);
  state.totalTargets += 1;
}

function resetRun() {
  targets.length = 0;
  effects.length = 0;
  spawnTimer = .1;
  state.combo = 0;
  state.comboTimer = 0;
  state.batchProgress = 0;
  runActive = true;
  spawnTarget("bloom");
  spawnTarget("bloom");
  render();
}

function targetPoint(target) {
  const map = currentMap();
  const x = 124 + target.progress * 660;
  const baseY = 145 + target.lane * 75;
  let y = baseY;
  if (map.rule === "branch") y += Math.sin(target.progress * Math.PI) * (target.lane % 2 ? -34 : 34);
  if (map.rule === "rooted") y += Math.sin(target.progress * Math.PI * 2 + target.wobble) * 8;
  if (map.rule === "eclipse") y += Math.sin(target.progress * Math.PI) * (target.lane === 1 ? 22 : -18);
  return { x, y };
}

function gateRange() {
  const gateX = 785;
  const width = 36 + upgradeLevel("gate") * 7;
  return { min: gateX - width, max: gateX + width, center: gateX };
}

function isAtGate(target) {
  const point = targetPoint(target);
  const range = gateRange();
  return point.x >= range.min - 17 && point.x <= range.max + 17;
}

function addEffect(x, y, text, color, kind = "burst") {
  effects.push({ x, y, text, color, kind, life: 1, particles: [] });
  const count = kind === "batch" ? 30 : kind === "bad" ? 9 : 16;
  for (let index = 0; index < count; index += 1) {
    effects[effects.length - 1].particles.push({
      angle: Math.PI * 2 * index / count + Math.random() * .2,
      distance: 4 + Math.random() * 13,
      speed: kind === "batch" ? 1.5 : 1,
      size: 1.5 + Math.random() * 3,
      color: kind === "bad" ? "#f0a08b" : ["#fff2b8", "#f0c56b", "#d3e9b7", color][index % 4],
    });
  }
}

function resetCombo(reason = "") {
  if (state.combo > 0 && reason) announce(reason, "warn");
  state.combo = 0;
  state.comboTimer = 0;
}

function finishBatch() {
  const bonus = Math.round((95 + currentSpecies().value * 2) * currentMap().multiplier * (1 + upgradeLevel("inoculum") * .15));
  state.credits += bonus;
  state.biomass += 5 + currentMap().multiplier;
  state.cells += 2;
    state.totalBatches += 1;
  state.deviceLevel = clamp(Math.max(state.deviceLevel || 1, Math.min(MAX_DEVICE_LEVEL, 1 + state.totalBatches)), 1, MAX_DEVICE_LEVEL);
  state.day += 1;
  state.run += 1;
  state.batchProgress = 0;
  state.combo = Math.max(state.combo, 3);
  addEffect(785, 285, `BATCH +${money(bonus)}`, "#f0c56b", "batch");
  announce(`Batch complete. +${money(bonus)} credits and a fresh run is ready.`, "success");
  beep("batch");
}

function registerCatch(target, grade) {
  const point = targetPoint(target);
  const reward = targetReward(target.type, grade);
  state.hits += 1;
  state.cells += target.type === "gold" ? 2 : 1;
  state.biomass += (target.type === "gold" ? 2.2 : 1) * currentMap().multiplier;
  state.credits += reward;
  state.combo += target.type === "gold" ? 2 : 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.comboTimer = comboWindow();
  state.batchProgress += target.type === "gold" ? 2 : 1;
  addEffect(point.x, point.y, `${grade === "perfect" ? "PERFECT" : "GOOD"}  +${money(reward)}`, target.type === "gold" ? "#f0c56b" : currentSpecies().color, target.type === "gold" ? "batch" : "burst");
  beep(target.type === "gold" ? "gold" : grade);
  if (state.batchProgress >= batchGoal()) finishBatch();
  else if (state.combo === 5 || state.combo === 10 || state.combo === 20) announce(`${state.combo} hit combo · ×${multiplier()} payout`, "success");
  render();
}

function registerDebris(target) {
  const point = targetPoint(target);
  state.misses += 1;
  state.credits = Math.max(0, state.credits - 4);
  addEffect(point.x, point.y, "FLOW DISTURBED", "#e58b73", "bad");
  resetCombo("A contaminant slipped through. Combo reset.");
  beep("bad");
  render();
}

function missTarget(target, late = false) {
  if (target.type === "debris") return;
  state.misses += 1;
  if (state.combo > 0) resetCombo(late ? "A bloom passed the gate. Combo reset." : "The pulse faded. Keep watching the lane.");
  addEffect(targetPoint(target).x, targetPoint(target).y, "MISSED", "#efb3a0", "bad");
  render();
}

function removeTarget(target) {
  const index = targets.indexOf(target);
  if (index >= 0) targets.splice(index, 1);
}

function tendAtPoint(x, y, keyboard = false) {
  const candidates = targets
    .map((target) => ({ target, point: targetPoint(target) }))
    .filter(({ target, point }) => {
      const range = gateRange();
      return isAtGate(target) && Math.hypot(point.x - x, point.y - y) <= gateRadius() + (target.type === "gold" ? 7 : 0) && point.x >= range.min - 25 && point.x <= range.max + 25;
    })
    .sort((a, b) => Math.abs(a.point.x - gateRange().center) - Math.abs(b.point.x - gateRange().center));
  const candidate = candidates[0];
  if (!candidate && keyboard) {
    const gateTarget = targets.find((target) => isAtGate(target));
    if (gateTarget) return tendAtPoint(...Object.values(targetPoint(gateTarget)), false);
    addEffect(gateRange().center, 280, "WAIT FOR THE PULSE", "#e9c879", "bad");
    beep("bad");
    render();
    return;
  }
  if (candidate) {
    const distance = Math.abs(candidate.point.x - gateRange().center);
    const perfect = distance <= Math.max(10, 18 + upgradeLevel("gate") * 2);
    const grade = perfect ? "perfect" : "good";
    const target = candidate.target;
    removeTarget(target);
    if (target.type === "debris") registerDebris(target);
    else registerCatch(target, grade);
    return;
  }
  const nearby = targets.find((target) => {
    const point = targetPoint(target);
    return Math.hypot(point.x - x, point.y - y) <= gateRadius() + 12;
  });
  if (nearby && !isAtGate(nearby)) {
    addEffect(x, y, "TOO EARLY", "#e9c879", "bad");
    render();
    return;
  }
  if (x > gateRange().min - 25 && x < gateRange().max + 25) {
    state.misses += 1;
    resetCombo("Empty gate. Combo reset.");
    addEffect(x, y, "MISSED", "#efb3a0", "bad");
    beep("bad");
    render();
  }
}

function tendCurrent() {
  const gateTarget = targets
    .filter((target) => isAtGate(target))
    .sort((a, b) => Math.abs(targetPoint(a).x - gateRange().center) - Math.abs(targetPoint(b).x - gateRange().center))[0];
  if (!gateTarget) {
    addEffect(gateRange().center, 280, "WAIT FOR THE PULSE", "#e9c879", "bad");
    beep("bad");
    render();
    return;
  }
  const point = targetPoint(gateTarget);
  tendAtPoint(point.x, point.y, true);
}

function discoverForMap(mapId) {
  const first = SPECIES.find((species) => species.map === mapId && !state.discovered.includes(species.id));
  if (first) {
    state.discovered.push(first.id);
    state.activeSpecies = first.id;
    announce(`${first.name} entered the culture archive.`, "success");
  }
}

function travel(mapId) {
  const map = mapById(mapId);
  if (!state.unlockedMaps.includes(mapId)) {
    if (state.deviceLevel && state.deviceLevel < map.requiredLevel) {
      announce(`${map.name} opens after device level ${map.requiredLevel}.`, "warn");
      return;
    }
    if (state.credits < map.unlockCost) {
      announce(`${map.name} needs ${money(map.unlockCost)} credits from active runs.`, "warn");
      return;
    }
    state.credits -= map.unlockCost;
    state.unlockedMaps.push(mapId);
    announce(`${map.name} unlocked. New lanes are ready.`, "success");
  }
  state.activeMap = mapId;
  if (!SPECIES.some((species) => species.id === state.activeSpecies && species.map === mapId)) discoverForMap(mapId);
  resetRun();
}

function buyUpgrade(upgradeId) {
  const upgrade = upgradeById(upgradeId);
  const level = upgradeLevel(upgradeId);
  if (!upgrade || level >= upgrade.max) return;
  const cost = upgradeCost(upgradeId);
  if (state.credits < cost) {
    announce(`${upgrade.name} needs ${money(cost)} credits.`, "warn");
    return;
  }
  state.credits -= cost;
  state.upgrades[upgradeId] = level + 1;
  announce(`${upgrade.name} is now level ${level + 1}. ${upgrade.effect(level + 1)}.`, "success");
  addEffect(785, 280, upgrade.name.toUpperCase(), currentMap().color, "batch");
  beep("perfect");
  render();
}

function objective() {
  if (!state.hits) return ["Catch your first pulse", "Click a green culture pulse when it reaches the gold collection gate."];
  if (state.bestCombo < 5) return ["Build a five-hit combo", "Clean catches keep the multiplier alive. The gate forgives a little, but not everything."];
  if (state.totalBatches < 1) return ["Fill the batch meter", `Catch ${batchGoal()} culture units to complete this run and earn a bonus payout.`];
  const nextLocked = MAPS.find((map) => !state.unlockedMaps.includes(map.id));
  if (nextLocked) return [`Open ${nextLocked.name}`, `Your next rack map costs ${money(nextLocked.unlockCost)} credits and needs device level ${nextLocked.requiredLevel}.`];
  return ["Keep the streak alive", "Perfect catches, module upgrades, and new maps are waiting in the flow."];
}

function renderMapDeck() {
  const deck = $("#mapDeck");
  if (!deck) return;
  deck.innerHTML = MAPS.map((map) => {
    const unlocked = state.unlockedMaps.includes(map.id);
    const active = state.activeMap === map.id;
    const lockText = state.deviceLevel && state.deviceLevel < map.requiredLevel ? `device ${map.requiredLevel} needed` : `${money(map.unlockCost)} credits`;
    return `<button class="map-card ${active ? "is-active" : ""} ${unlocked ? "" : "is-locked"}" style="--map-color:${map.color}" data-action="travel" data-map-id="${map.id}" type="button" aria-label="${unlocked ? `Play ${map.name}` : `Unlock ${map.name}`}\"><b>${map.name}</b><small>${map.description}</small><em>${active ? "CURRENT MAP" : unlocked ? "play map →" : lockText}</em></button>`;
  }).join("");
}

function renderUpgradeDeck() {
  return UPGRADES.map((upgrade) => {
    const level = upgradeLevel(upgrade.id);
    const maxed = level >= upgrade.max;
    const cost = upgradeCost(upgrade.id);
    return `<div class="module-card ${maxed ? "is-max" : ""}"><span class="module-glyph">${upgrade.glyph}</span><span><b>${upgrade.name} · ${level}/${upgrade.max}</b><small>${upgrade.description} · ${upgrade.effect(level || 1)}</small></span><button class="pixel-button" data-action="buy-upgrade" data-upgrade-id="${upgrade.id}" type="button" ${maxed || state.credits < cost ? "disabled" : ""}>${maxed ? "MAX" : money(cost)}</button></div>`;
  }).join("");
}

function renderPanel() {
  const map = currentMap();
  const species = currentSpecies();
  const nearGate = targets.find((target) => isAtGate(target));
  const targetText = nearGate ? (nearGate.type === "gold" ? "GOLDEN PULSE" : nearGate.type === "debris" ? "CONTAMINANT" : "CULTURE PULSE") : "WATCHING LANES";
  const nextMap = MAPS.find((item) => !state.unlockedMaps.includes(item.id));
  return `<div class="panel-heading"><div><span class="panel-kicker">Rack controls / ${map.short}</span><h2>Make the catch.</h2><p class="panel-lede">Pulses only pay when they reach the collection gate. Build a streak, fill a batch, then reinvest the profit.</p></div><span class="species-orb" style="--species:${species.color}" aria-hidden="true">✦</span></div><div class="run-summary"><div><span>current culture</span><strong>${species.name}</strong></div><div><span>at the gate</span><strong>${targetText}</strong></div><div><span>best combo</span><strong>${state.bestCombo} hits</strong></div><div><span>batch bonus</span><strong>${state.totalBatches}</strong></div></div><div class="module-heading"><span>Rack modules</span><strong>${nextMap ? `next map · ${nextMap.name}` : "all maps open"}</strong></div><div class="module-grid">${renderUpgradeDeck()}</div>`;
}

function updateHud() {
  const objectivePair = objective();
  const current = targets.find((target) => isAtGate(target));
  const targetValue = current ? targetReward(current.type, "good") : 0;
  const canvas = $("#worldCanvas");
  if (canvas) canvas.dataset.targets = JSON.stringify(targets.map((target) => ({ type: target.type, x: targetPoint(target).x, y: targetPoint(target).y, atGate: isAtGate(target) })));
  if ($("#creditReadout")) $("#creditReadout").textContent = money(state.credits);
  if ($("#biomassReadout")) $("#biomassReadout").textContent = decimal(state.biomass, 1);
  if ($("#sampleReadout")) $("#sampleReadout").textContent = money(state.cells);
  if ($("#flowReadout")) $("#flowReadout").textContent = `${decimal(passiveRate())}/s`;
  if ($("#dayReadout")) $("#dayReadout").textContent = String(Math.max(1, Math.floor(state.day))).padStart(2, "0");
  if ($("#runReadout")) $("#runReadout").textContent = String(state.run).padStart(2, "0");
  if ($("#zoneName")) $("#zoneName").textContent = currentMap().name;
  if ($("#headerStatus")) $("#headerStatus").textContent = runActive ? "watching the gate" : "rack paused";
  if ($("#runStatus")) $("#runStatus").textContent = runActive ? "RUNNING" : "PAUSED";
  $(".run-state")?.classList.toggle("is-paused", !runActive);
  if ($("#startRun")) $("#startRun").textContent = runActive ? "pause rack" : "resume rack";
  if ($("#comboReadout")) $("#comboReadout").textContent = state.combo;
  if ($("#multiplierReadout")) $("#multiplierReadout").textContent = `×${multiplier()}`;
  if ($("#accuracyReadout")) $("#accuracyReadout").textContent = state.hits + state.misses ? `${Math.round(accuracy())}%` : "—";
  if ($("#streakReadout")) $("#streakReadout").textContent = state.bestCombo ? `best ${state.bestCombo} · ${state.perfects} perfect` : "start catching";
  if ($("#batchReadout")) $("#batchReadout").textContent = `${state.batchProgress}/${batchGoal()}`;
  if ($("#batchProgress")) $("#batchProgress").style.width = `${clamp(state.batchProgress / batchGoal() * 100, 0, 100)}%`;
  if ($("#comboTimer")) $("#comboTimer").style.width = `${clamp(state.comboTimer / comboWindow() * 100, 0, 100)}%`;
  if ($("#objectiveTitle")) $("#objectiveTitle").textContent = objectivePair[0];
  if ($("#objectiveDetail")) $("#objectiveDetail").textContent = objectivePair[1];
  if ($("#harvestHint")) $("#harvestHint").textContent = current ? (current.type === "debris" ? "do not catch this one" : "inside the collection ring") : "click a pulse when it enters the ring";
  if ($("#harvestValue")) $("#harvestValue").textContent = current ? `+${money(targetValue)}` : "+0";
}

function render() {
  updateHud();
  if ($("#worldPanel")) $("#worldPanel").innerHTML = renderPanel();
  if ($("#fieldLog")) $("#fieldLog").innerHTML = state.log.slice(0, 4).map((entry) => `<li>${entry}</li>`).join("");
  renderMapDeck();
  save();
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, radiusX, radiusY, fill, stroke = null) {
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function drawGround(ctx, map, width, height, now) {
  if (map.id === "water") {
    ctx.fillStyle = "#8fc3b8"; ctx.fillRect(0, 0, width, height);
    for (let row = 0; row < 13; row += 1) {
      ctx.beginPath(); ctx.moveTo(0, 42 + row * 43);
      for (let x = 0; x <= width; x += 32) ctx.quadraticCurveTo(x + 16, 32 + row * 43 + Math.sin(x * .03 + row) * 6, x + 32, 42 + row * 43);
      ctx.strokeStyle = `rgba(250, 255, 229, ${.14 + (row % 3) * .035})`; ctx.lineWidth = row % 3 === 0 ? 2 : 1; ctx.stroke();
    }
  } else if (map.id === "sand") {
    const gradient = ctx.createLinearGradient(0, 0, 0, height); gradient.addColorStop(0, "#e7c889"); gradient.addColorStop(1, "#bd8e55");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    for (let row = 0; row < 7; row += 1) {
      ctx.beginPath(); ctx.moveTo(0, 76 + row * 76);
      for (let x = 0; x <= width; x += 46) ctx.quadraticCurveTo(x + 23, 60 + row * 76 + Math.sin(x * .025 + row) * 14, x + 46, 76 + row * 76);
      ctx.strokeStyle = "rgba(255, 245, 194, .22)"; ctx.lineWidth = 3; ctx.stroke();
    }
  } else if (map.id === "soil") {
    const gradient = ctx.createLinearGradient(0, 0, 0, height); gradient.addColorStop(0, "#b7c397"); gradient.addColorStop(.28, "#7f966f"); gradient.addColorStop(1, "#4c443b");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(229, 239, 177, .35)"; ctx.lineWidth = 2;
    for (let index = 0; index < 14; index += 1) { ctx.beginPath(); ctx.moveTo(20 + index * 74, 14); ctx.bezierCurveTo(5 + index * 74, 160, 48 + index * 74, 230, 15 + index * 74, 520); ctx.stroke(); }
    for (let row = 0; row < 5; row += 1) { ctx.fillStyle = `rgba(47, 48, 38, ${.1 + row * .035})`; ctx.fillRect(0, 112 + row * 75, width, 3); }
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, height); gradient.addColorStop(0, "#62727a"); gradient.addColorStop(.5, "#3b4b54"); gradient.addColorStop(1, "#202c35");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    for (let index = 0; index < 38; index += 1) ellipse(ctx, (index * 71) % width, 35 + (index * 37) % height, 2 + index % 4, 1 + index % 2, `rgba(199, 171, 223, ${.12 + (index % 3) * .035})`);
    ctx.strokeStyle = "rgba(230, 220, 175, .27)"; ctx.lineWidth = 2;
    for (let index = 0; index < 12; index += 1) { ctx.beginPath(); ctx.moveTo(40 + index * 84, 520); ctx.quadraticCurveTo(55 + index * 84, 390, 45 + index * 84, 260); ctx.stroke(); }
  }
  const sun = ctx.createRadialGradient(width * .14, height * .12, 4, width * .14, height * .12, 280);
  sun.addColorStop(0, map.id === "peat" ? "rgba(206, 184, 247, .17)" : "rgba(255, 250, 211, .33)"); sun.addColorStop(1, "rgba(255, 250, 211, 0)");
  ctx.fillStyle = sun; ctx.fillRect(0, 0, width, height);
  if (map.rule === "eclipse" && Math.sin(now * .00045) < -.15) { ctx.fillStyle = "rgba(22, 30, 42, .23)"; ctx.fillRect(0, 0, width, height); }
}

function drawAlgae(ctx, x, y, color, scale = 1, now = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.lineCap = "round";
  for (let strand = 0; strand < 7; strand += 1) {
    const lean = Math.sin(now * .0016 + strand * 1.7) * (5 + strand);
    ctx.beginPath(); ctx.moveTo((strand - 3) * 4, 12); ctx.bezierCurveTo((strand - 3) * 5 + lean, -4, (strand - 3) * 8 - lean, -18, (strand - 3) * 3 + lean, -28 - strand * 2);
    ctx.strokeStyle = strand % 2 ? color : "rgba(245, 247, 194, .72)"; ctx.lineWidth = strand % 3 === 0 ? 3.1 : 1.6; ctx.stroke();
  }
  ctx.restore();
}

function drawChannel(ctx, lane, map, now) {
  const y = 145 + lane * 75;
  const branch = map.rule === "branch" ? (lane % 2 ? -34 : 34) : 0;
  const left = 124; const right = 784;
  ctx.beginPath(); ctx.moveTo(left, y); ctx.bezierCurveTo(left + 100, y - 28, left + 130, y + branch, left + 238, y + branch / 2); ctx.bezierCurveTo(left + 340, y - branch / 2, right - 132, y - branch, right, y);
  ctx.strokeStyle = "rgba(31, 87, 83, .27)"; ctx.lineWidth = 20; ctx.stroke();
  ctx.strokeStyle = "rgba(247, 254, 229, .76)"; ctx.lineWidth = 12; ctx.stroke();
  ctx.strokeStyle = `${map.color}b8`; ctx.lineWidth = 5; ctx.stroke();
  for (let dash = 0; dash < 5; dash += 1) {
    const dashX = left + ((now * .08 + dash * 137 + lane * 31) % (right - left));
    ellipse(ctx, dashX, y + Math.sin((dashX + lane) * .03) * 3, 3, 3, `${map.color}cc`);
  }
}

function drawRack(ctx, map, width, height, now) {
  const x = 74; const y = 78; const rackWidth = 820; const rackHeight = 360;
  ellipse(ctx, width / 2 + 8, y + rackHeight + 31, 355, 26, "rgba(14, 53, 54, .25)");
  roundRect(ctx, x + 10, y + 12, rackWidth, rackHeight, 28); ctx.fillStyle = "rgba(15, 61, 62, .24)"; ctx.fill();
  roundRect(ctx, x, y, rackWidth, rackHeight, 28);
  const glass = ctx.createLinearGradient(x, y, x + rackWidth, y + rackHeight); glass.addColorStop(0, "rgba(248, 255, 234, .55)"); glass.addColorStop(.45, "rgba(190, 239, 218, .2)"); glass.addColorStop(1, "rgba(91, 166, 165, .3)");
  ctx.fillStyle = glass; ctx.fill(); ctx.strokeStyle = "rgba(248, 255, 232, .78)"; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = `${map.color}99`; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = "rgba(28, 78, 74, .64)"; ctx.font = "10px IBM Plex Mono, monospace"; ctx.fillText("MICROFLUX / RACK RUN", x + 25, y + 27); ctx.fillText(`LANES ${laneCount()} · ${map.rule.toUpperCase()}`, x + rackWidth - 170, y + 27);
  for (let lane = 0; lane < laneCount(); lane += 1) drawChannel(ctx, lane, map, now);
  for (let valve = 0; valve < 5; valve += 1) { const valveX = x + 54 + valve * 178; ellipse(ctx, valveX, y + rackHeight - 29, 7, 7, "#f7f1d8", "rgba(38, 89, 82, .55)"); }
  for (let lane = 0; lane < laneCount(); lane += 1) { const yLane = 145 + lane * 75; ellipse(ctx, x + 38, yLane, 11, 11, `${currentSpecies().color}74`, "rgba(252, 255, 229, .75)"); ellipse(ctx, x + 38, yLane, 4, 4, currentSpecies().color); }
  const gate = gateRange();
  const gateGlow = ctx.createLinearGradient(gate.center - 22, 0, gate.center + 22, 0); gateGlow.addColorStop(0, "rgba(255, 235, 160, 0)"); gateGlow.addColorStop(.5, "rgba(255, 235, 160, .22)"); gateGlow.addColorStop(1, "rgba(255, 235, 160, 0)");
  ctx.fillStyle = gateGlow; ctx.fillRect(gate.center - 30, y + 36, 60, rackHeight - 70);
  ctx.strokeStyle = "#fff0b0"; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(gate.center, y + 35); ctx.lineTo(gate.center, y + rackHeight - 28); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "#fff1b3"; ctx.font = "9px IBM Plex Mono, monospace"; ctx.textAlign = "center"; ctx.fillText("COLLECTION GATE", gate.center, y + rackHeight + 19); ctx.textAlign = "left";
  roundRect(ctx, x + rackWidth - 51, y + 49, 30, 74, 9); ctx.fillStyle = "rgba(246, 253, 225, .35)"; ctx.fill(); ctx.strokeStyle = "rgba(255, 255, 224, .65)"; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = `${currentSpecies().color}b0`; ctx.fillRect(x + rackWidth - 45, y + 83, 18, 33); ctx.fillStyle = "rgba(28, 78, 74, .72)"; ctx.font = "7px IBM Plex Mono, monospace"; ctx.fillText("SEED", x + rackWidth - 47, y + 74);
}

function drawTarget(ctx, target, now) {
  const { x, y } = targetPoint(target);
  const pulse = 1 + Math.sin(now * .008 + target.wobble) * .08;
  if (target.type === "debris") {
    ctx.save(); ctx.translate(x, y); ctx.rotate(now * .002 + target.wobble); ctx.fillStyle = "#d77e72"; ctx.strokeStyle = "#ffe1b4"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, -6); ctx.lineTo(8, 12); ctx.lineTo(-11, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    return;
  }
  const color = target.type === "gold" ? "#f0c56b" : currentSpecies().color;
  const radius = target.type === "gold" ? 19 : 16;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, radius * 3); glow.addColorStop(0, `${color}b8`); glow.addColorStop(1, `${color}00`); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, radius * 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `${color}cc`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, radius * pulse, 0, Math.PI * 2); ctx.stroke();
  if (target.type === "gold") { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); roundRect(ctx, -12, -12, 24, 24, 5); ctx.fillStyle = color; ctx.fill(); ctx.restore(); }
  else { ellipse(ctx, x, y, radius * .82, radius * .7, color); drawAlgae(ctx, x, y + 4, color, .48 * pulse, now); }
  ellipse(ctx, x - 4, y - 5, 3, 3, "rgba(255, 255, 227, .9)");
}

function drawEffects(ctx, now) {
  effects.forEach((effect) => {
    const rise = (1 - effect.life) * 34;
    ctx.globalAlpha = clamp(effect.life, 0, 1);
    ctx.fillStyle = effect.color;
    ctx.font = `${effect.kind === "batch" ? "bold 14px" : "bold 11px"} IBM Plex Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(effect.text, effect.x, effect.y - rise - 14);
    effect.particles.forEach((particle) => {
      const distance = particle.distance + (1 - effect.life) * 48 * particle.speed;
      ellipse(ctx, effect.x + Math.cos(particle.angle) * distance, effect.y + Math.sin(particle.angle) * distance, particle.size, particle.size, particle.color);
    });
  });
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;
}

function drawWorld(now) {
  const canvas = $("#worldCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width; const height = canvas.height;
  const map = currentMap();
  ctx.clearRect(0, 0, width, height);
  drawGround(ctx, map, width, height, now);
  drawRack(ctx, map, width, height, now);
  targets.forEach((target) => drawTarget(ctx, target, now));
  drawEffects(ctx, now);
  ctx.fillStyle = "rgba(19, 59, 59, .68)"; ctx.font = "10px IBM Plex Mono, monospace"; ctx.fillText(`${map.name.toUpperCase()}  /  ${currentSpecies().name.toUpperCase()}`, 23, height - 23);
  ctx.textAlign = "right"; ctx.fillStyle = "rgba(255, 246, 210, .82)"; ctx.font = "11px DM Sans, sans-serif"; ctx.fillText(runActive ? "click at the gate" : "rack paused", width - 23, height - 23); ctx.textAlign = "left";
}

function advanceGame(seconds) {
  if (!runActive) return;
  state.day += seconds / 85;
  state.credits += passiveRate() * seconds;
  state.biomass += passiveRate() * seconds / 20;
  state.comboTimer = Math.max(0, state.comboTimer - seconds);
  if (state.combo > 0 && state.comboTimer <= 0) resetCombo();
  spawnTimer -= seconds;
  if (spawnTimer <= 0) {
    spawnTarget();
    spawnTimer = currentMap().spawn * (0.78 + Math.random() * .45);
  }
  const expired = [];
  targets.forEach((target) => {
    target.age += seconds;
    target.progress += seconds * targetSpeed() / 5.4;
    if (target.progress >= 1) expired.push(target);
  });
  expired.forEach((target) => { removeTarget(target); missTarget(target, true); });
  effects.forEach((effect) => { effect.life -= seconds * 1.7; });
  while (effects.length && effects[0].life <= 0) effects.shift();
}

function animate(now) {
  const seconds = Math.min(.12, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;
  frame += 1;
  advanceGame(seconds);
  if (frame % 6 === 0) updateHud();
  if (frame % 60 === 0) { save(); render(); }
  drawWorld(now);
  window.requestAnimationFrame(animate);
}

function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "tend-current") tendCurrent();
  if (action === "toggle-run") { runActive = !runActive; updateHud(); beep(runActive ? "good" : "bad"); }
  if (action === "travel") travel(target.dataset.mapId);
  if (action === "buy-upgrade") buyUpgrade(target.dataset.upgradeId);
}

function handleCanvasClick(event) {
  const canvas = $("#worldCanvas");
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;
  tendAtPoint(x, y);
}

function resetStudy() {
  if (!window.confirm("Reset Rack Run and lose this local study?")) return;
  Object.assign(state, defaultState());
  resetRun();
  announce("Fresh rack online. Catch the first pulse at the gate.", "success");
  render();
}

document.addEventListener("click", handleClick);
document.addEventListener("keydown", (event) => {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
  if (event.key === " " || event.key.toLowerCase() === "e") { event.preventDefault(); tendCurrent(); }
});
$("#worldCanvas")?.addEventListener("click", handleCanvasClick);
$("#resetStudy")?.addEventListener("click", resetStudy);

applyAwaytime();
resetRun();
render();
window.requestAnimationFrame(animate);
