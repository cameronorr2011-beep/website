/*
 * Microflux / Quiet Culture Co.
 *
 * A local-first, low-pressure clicker about tending illustrated microfluidic
 * racks. All currencies, species, maps, and growth rules are fictional game
 * systems. Nothing here is a cultivation protocol or a hardware claim.
 */

const SAVE_KEY = "orr-microflux-rack-v1";
const MAX_DEVICE_LEVEL = 5;

const MAPS = [
  { id: "water", name: "Azure Basin", short: "water", unlockCost: 0, requiredLevel: 1, color: "#68bdb6", multiplier: 1, description: "soft water and a dependable first loop", note: "The first tray likes a little attention, then it learns the rhythm." },
  { id: "sand", name: "Amber Sandline", short: "sand", unlockCost: 180, requiredLevel: 2, color: "#d9a956", multiplier: 1.35, description: "warm sand channels with brighter yields", note: "The sand map holds heat longer. Let the gold dust settle before you tend it." },
  { id: "soil", name: "Moss Soil", short: "soil", unlockCost: 520, requiredLevel: 3, color: "#76986d", multiplier: 1.8, description: "root-dark channels full of patient growth", note: "Nothing rushes in the soil map. That is why its cultures are worth waiting for." },
  { id: "peat", name: "Moonlit Peat", short: "peat", unlockCost: 1250, requiredLevel: 4, color: "#a888bc", multiplier: 2.45, description: "a dusk map for the rarest quiet blooms", note: "The peat loop only glows when the room is still." },
];

const SPECIES = [
  { id: "mint-comet", name: "Mint Comet", map: "water", color: "#8fcf9c", value: 5, note: "a kind little starter culture" },
  { id: "glass-thread", name: "Glass Thread", map: "water", color: "#75bfc6", value: 8, note: "catches the light at the edge of a channel" },
  { id: "gold-dust", name: "Gold Dust", map: "sand", color: "#e5b45a", value: 15, note: "warm flecks that settle into the sand" },
  { id: "coral-ribbon", name: "Coral Ribbon", map: "sand", color: "#df896d", value: 22, note: "a slow ribbon with a bright pulse" },
  { id: "moss-lantern", name: "Moss Lantern", map: "soil", color: "#8dae6f", value: 36, note: "green light threaded through root-dark soil" },
  { id: "velvet-spore", name: "Velvet Spore", map: "soil", color: "#aa7a91", value: 49, note: "soft violet motes under the surface" },
  { id: "night-pearl", name: "Night Pearl", map: "peat", color: "#baa0de", value: 86, note: "a small moon that prefers patient keepers" },
];

const $ = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const money = (value) => Math.floor(Number(value || 0)).toLocaleString();
const decimal = (value, digits = 1) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: digits });
const mapById = (id) => MAPS.find((map) => map.id === id) || MAPS[0];
const speciesById = (id) => SPECIES.find((species) => species.id === id) || SPECIES[0];

function defaultState() {
  return {
    credits: 80,
    cells: 0,
    biomass: 0,
    day: 1,
    deviceLevel: 1,
    rackLevel: 1,
    activeMap: "water",
    unlockedMaps: ["water"],
    discovered: ["mint-comet"],
    activeSpecies: "mint-comet",
    progress: 46,
    totalHarvests: 0,
    lastSavedAt: Date.now(),
    log: ["The starter loop is flowing. A mint comet is waiting in the first tray."],
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!saved) return defaultState();
    const fresh = defaultState();
    const merged = { ...fresh, ...saved };
    merged.unlockedMaps = Array.isArray(saved.unlockedMaps) && saved.unlockedMaps.length ? saved.unlockedMaps : fresh.unlockedMaps;
    merged.discovered = Array.isArray(saved.discovered) && saved.discovered.length ? saved.discovered : fresh.discovered;
    merged.log = Array.isArray(saved.log) && saved.log.length ? saved.log.slice(0, 6) : fresh.log;
    merged.deviceLevel = clamp(Number(merged.deviceLevel) || 1, 1, MAX_DEVICE_LEVEL);
    merged.rackLevel = clamp(Number(merged.rackLevel) || 1, 1, 8);
    merged.progress = clamp(Number(merged.progress) || 0, 0, 100);
    if (!merged.unlockedMaps.includes(merged.activeMap)) merged.activeMap = merged.unlockedMaps[0];
    if (!merged.discovered.includes(merged.activeSpecies)) merged.activeSpecies = merged.discovered[0];
    return merged;
  } catch {
    return defaultState();
  }
}

const state = loadState();
let toastTimer;
let frame = 0;
let lastFrameTime = performance.now();
const sparks = [];

function currentMap() { return mapById(state.activeMap); }
function currentSpecies() { return speciesById(state.activeSpecies); }
function deviceUpgradeCost() { return Math.round(90 * Math.pow(state.deviceLevel, 1.45)); }
function rackUpgradeCost() { return Math.round(110 + state.rackLevel * 95); }
function flowRate() {
  return 0.32 * state.rackLevel * currentMap().multiplier * (1 + (state.deviceLevel - 1) * 0.13);
}
function cycleDuration() {
  return Math.max(18, 44 - state.deviceLevel * 3 - state.rackLevel * 2);
}
function harvestValue() {
  return Math.round(4 + currentSpecies().value + state.deviceLevel * 2 + state.rackLevel * 3 + currentMap().multiplier * 4);
}
function biomassValue() {
  return .45 + currentMap().multiplier * .25 + state.rackLevel * .12;
}

function save() {
  try {
    state.lastSavedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch { /* private browsing can deny local storage */ }
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
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }
  save();
}

function applyAwaytime() {
  const elapsed = clamp((Date.now() - Number(state.lastSavedAt || Date.now())) / 1000, 0, 60 * 60 * 8);
  if (elapsed < 8) return;
  const passiveCredits = flowRate() * elapsed;
  state.credits += passiveCredits;
  state.biomass += biomassValue() * elapsed / 28;
  state.progress += 100 * elapsed / cycleDuration();
  let cycles = 0;
  while (state.progress >= 100) {
    state.progress -= 100;
    cycles += 1;
    state.cells += 1;
    state.totalHarvests += 1;
    state.credits += harvestValue() * 1.25;
  }
  if (cycles) state.log.unshift(`While you were away, ${cycles} quiet bloom${cycles === 1 ? "" : "s"} finished.`);
  save();
}

function addSparks(count = 10, burst = 1) {
  for (let index = 0; index < count; index += 1) {
    sparks.push({
      angle: Math.PI * 2 * index / count + Math.random() * .25,
      distance: 8 + Math.random() * 22,
      speed: (.25 + Math.random() * .45) * burst,
      life: 1,
      size: 2 + Math.random() * 3,
      color: ["#fff2b8", "#f2c66d", "#d6ecbb", "#f3a78d"][index % 4],
    });
  }
}

function harvest() {
  const payout = harvestValue();
  state.credits += payout;
  state.cells += 1;
  state.biomass += biomassValue();
  state.totalHarvests += 1;
  state.progress += 12 + state.deviceLevel * 1.5;
  let fullBloom = false;
  if (state.progress >= 100) {
    state.progress -= 100;
    const bloomBonus = Math.round(payout * 1.8);
    state.credits += bloomBonus;
    state.cells += 1;
    state.biomass += biomassValue() * 1.5;
    fullBloom = true;
    announce(`A full bloom opened. +${money(payout + bloomBonus)} credits and two cells.`, "success");
  } else {
    announce(`The ${currentSpecies().name} answered. +${money(payout)} credits.`, "success");
  }
  addSparks(fullBloom ? 22 : 11, fullBloom ? 1.5 : 1);
  render();
}

function advanceTime(seconds) {
  const secondsToUse = clamp(seconds, 0, 8);
  state.day += secondsToUse / 60;
  state.credits += flowRate() * secondsToUse;
  state.biomass += biomassValue() * secondsToUse / 28;
  state.progress += 100 * secondsToUse / cycleDuration();
  while (state.progress >= 100) {
    state.progress -= 100;
    state.cells += 1;
    state.totalHarvests += 1;
    state.credits += harvestValue() * 1.25;
    addSparks(5, .45);
  }
  if (secondsToUse >= 1) save();
}

function discoverForMap(mapId) {
  const first = SPECIES.find((species) => species.map === mapId && !state.discovered.includes(species.id));
  if (first) {
    state.discovered.push(first.id);
    state.activeSpecies = first.id;
    announce(`${first.name} found its way into the archive.`, "success");
  }
}

function travel(mapId) {
  const map = mapById(mapId);
  if (!state.unlockedMaps.includes(mapId)) {
    if (state.deviceLevel < map.requiredLevel) {
      announce(`${map.name} opens at device level ${map.requiredLevel}.`, "warn");
      return;
    }
    if (state.credits < map.unlockCost) {
      announce(`${map.name} needs ${money(map.unlockCost)} credits to open.`, "warn");
      return;
    }
    state.credits -= map.unlockCost;
    state.unlockedMaps.push(mapId);
    announce(`${map.name} opened. The rack is ready for a new kind of ground.`, "success");
  }
  state.activeMap = mapId;
  if (!SPECIES.some((species) => species.id === state.activeSpecies && species.map === mapId)) discoverForMap(mapId);
  state.progress = Math.max(state.progress, 18);
  render();
}

function upgradeDevice() {
  if (state.deviceLevel >= MAX_DEVICE_LEVEL) {
    announce("The device is tuned as far as this little bay can take it.", "warn");
    return;
  }
  const cost = deviceUpgradeCost();
  if (state.credits < cost) {
    announce(`The next device tune needs ${money(cost)} credits.`, "warn");
    return;
  }
  state.credits -= cost;
  state.deviceLevel += 1;
  announce(`Device tuned to level ${state.deviceLevel}. More maps are beginning to make sense.`, "success");
  addSparks(16, 1.1);
  render();
}

function upgradeRack() {
  const cost = rackUpgradeCost();
  if (state.credits < cost) {
    announce(`The next rack brace needs ${money(cost)} credits.`, "warn");
    return;
  }
  state.credits -= cost;
  state.rackLevel += 1;
  announce(`Rack brace fitted. Flow is now ${decimal(flowRate())} credits per second.`, "success");
  render();
}

function selectSpecies(speciesId) {
  const species = speciesById(speciesId);
  if (!state.discovered.includes(speciesId)) return;
  state.activeSpecies = species.id;
  announce(`${species.name} is now resting in the active loop.`);
  render();
}

function currentObjective() {
  if (state.totalHarvests < 1) return ["Wake the first culture", "Tap the glowing bloom once. Your rack will keep growing after that."];
  if (state.deviceLevel < 2) return ["Make the rack a little wider", `Save ${money(deviceUpgradeCost())} credits to tune the device and open the sand map.`];
  if (!state.unlockedMaps.includes("sand")) return ["Open the sand map", "A new tray is waiting in Amber Sandline. Choose it from the little maps below."];
  if (state.rackLevel < 2) return ["Give the rack another channel", `Fit the next brace for ${money(rackUpgradeCost())} credits and let the bay earn while you are away.`];
  return ["Keep a good rhythm", "Tend the bloom when you are here. The rack will do the quiet work when you are not."];
}

function renderMapDeck() {
  const deck = $("#mapDeck");
  if (!deck) return;
  deck.innerHTML = MAPS.map((map) => {
    const unlocked = state.unlockedMaps.includes(map.id);
    const active = state.activeMap === map.id;
    const lockedText = state.deviceLevel < map.requiredLevel
      ? `device ${map.requiredLevel} needed`
      : `${money(map.unlockCost)} credits`;
    return `<button class="map-card ${active ? "is-active" : ""} ${unlocked ? "" : "is-locked"}" style="--map-color:${map.color}" data-action="travel" data-map-id="${map.id}" type="button" aria-label="${unlocked ? `Visit ${map.name}` : `Unlock ${map.name}`}\"><b>${map.name}</b><small>${map.description}</small><em>${active ? "CURRENT MAP" : unlocked ? "visit map →" : lockedText}</em></button>`;
  }).join("");
}

function renderPanel() {
  const map = currentMap();
  const species = currentSpecies();
  const objective = currentObjective();
  const deviceCost = deviceUpgradeCost();
  const rackCost = rackUpgradeCost();
  const availableSpecies = SPECIES.filter((item) => state.discovered.includes(item.id));
  const deviceButton = state.deviceLevel >= MAX_DEVICE_LEVEL
    ? `<button class="pixel-button" type="button" disabled>device fully tuned</button>`
    : `<button class="pixel-button" data-action="upgrade-device" type="button" ${state.credits < deviceCost ? "disabled" : ""}>tune device · ${money(deviceCost)}</button>`;
  return `<div class="panel-heading"><div><span class="panel-kicker">Culture ledger / ${map.short}</span><h2>Let it be a little alive.</h2><p class="panel-lede">The rack is an idle culture farm. Tap for a small burst, or close the tab and come back to a finished bloom.</p></div><span class="species-orb" style="--species:${species.color}" aria-hidden="true">✦</span></div>
    <div class="culture-card"><div class="culture-row"><span>active culture</span><strong>LOOP ${String(state.rackLevel).padStart(2, "0")}</strong></div><div class="culture-intro"><div><b>${species.name}</b><small>${species.note}</small></div></div><div class="progress-track" aria-label="Culture progress"><span style="width:${state.progress}%"></span></div><div class="culture-stats"><span>growth<strong>${Math.round(state.progress)}%</strong></span><span>next tap<strong>+${money(harvestValue())}</strong></span><span>flow<strong>${decimal(flowRate())}/s</strong></span></div><div class="action-row"><button class="pixel-button primary" data-action="harvest" type="button">tend the bloom</button><button class="pixel-button" data-action="upgrade-rack" type="button" ${state.credits < rackCost ? "disabled" : ""}>brace rack · ${money(rackCost)}</button></div></div>
    <div class="upgrade-box"><div class="upgrade-row"><div><b>Device tuning · level ${state.deviceLevel}</b><small>improves flow and opens new maps</small></div>${deviceButton}</div><div class="upgrade-row"><div><b>Map multiplier · ×${decimal(map.multiplier, 2)}</b><small>${map.note}</small></div><span class="panel-kicker">${objective[0]}</span></div></div>
    <div class="species-list" aria-label="Culture archive">${availableSpecies.map((item) => `<button class="species-choice ${item.id === state.activeSpecies ? "is-selected" : ""}" data-action="select-species" data-species-id="${item.id}" type="button"><span class="mini-orb" style="--species:${item.color}"></span><span><b>${item.name}</b><small>${item.note}</small></span><strong>+${item.value}</strong></button>`).join("")}</div>`;
}

function render() {
  const map = currentMap();
  const objective = currentObjective();
  const species = currentSpecies();
  const creditReadout = $("#creditReadout");
  const sampleReadout = $("#sampleReadout");
  const biomassReadout = $("#biomassReadout");
  const flowReadout = $("#flowReadout");
  if (creditReadout) creditReadout.textContent = money(state.credits);
  if (sampleReadout) sampleReadout.textContent = money(state.cells);
  if (biomassReadout) biomassReadout.textContent = decimal(state.biomass, 1);
  if (flowReadout) flowReadout.textContent = `${decimal(flowRate())}/s`;
  if ($("#dayReadout")) $("#dayReadout").textContent = String(Math.max(1, Math.floor(state.day))).padStart(2, "0");
  if ($("#zoneName")) $("#zoneName").textContent = map.name;
  if ($("#zoneMeta")) $("#zoneMeta").textContent = `${map.short} map · ${species.name.toLowerCase()} loop`;
  if ($("#objectiveTitle")) $("#objectiveTitle").textContent = objective[0];
  if ($("#objectiveDetail")) $("#objectiveDetail").textContent = objective[1];
  if ($("#fieldNote")) $("#fieldNote").textContent = map.note;
  if ($("#harvestHint")) $("#harvestHint").textContent = state.progress > 86 ? "the bloom is almost open" : `${Math.round(state.progress)}% through this quiet cycle`;
  if ($("#harvestValue")) $("#harvestValue").textContent = `+${money(harvestValue())}`;
  if ($("#worldPanel")) $("#worldPanel").innerHTML = renderPanel();
  if ($("#fieldLog")) $("#fieldLog").innerHTML = state.log.slice(0, 4).map((entry) => `<li>${entry}</li>`).join("");
  renderMapDeck();
  save();
  drawWorld();
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

function drawMapGround(ctx, map, width, height) {
  if (map.id === "water") {
    ctx.fillStyle = "#a8cec0";
    ctx.fillRect(0, 0, width, height);
    for (let row = 0; row < 11; row += 1) {
      ctx.beginPath();
      ctx.moveTo(0, 56 + row * 47);
      for (let x = 0; x <= width; x += 30) ctx.quadraticCurveTo(x + 15, 48 + row * 47 + Math.sin(x * .03 + row) * 6, x + 30, 56 + row * 47);
      ctx.strokeStyle = `rgba(251, 255, 235, ${.16 + (row % 3) * .04})`;
      ctx.lineWidth = row % 3 === 0 ? 2 : 1;
      ctx.stroke();
    }
    for (let index = 0; index < 25; index += 1) {
      const x = (index * 97) % width;
      const y = 35 + (index * 53) % height;
      ellipse(ctx, x, y, 2 + index % 3, 1, "rgba(41, 108, 103, .17)");
    }
  } else if (map.id === "sand") {
    const sand = ctx.createLinearGradient(0, 0, 0, height);
    sand.addColorStop(0, "#e3c78e"); sand.addColorStop(1, "#c99e61");
    ctx.fillStyle = sand; ctx.fillRect(0, 0, width, height);
    for (let row = 0; row < 7; row += 1) {
      ctx.beginPath(); ctx.moveTo(0, 80 + row * 76);
      for (let x = 0; x <= width; x += 46) ctx.quadraticCurveTo(x + 23, 65 + row * 76 + Math.sin(x * .025 + row) * 15, x + 46, 80 + row * 76);
      ctx.strokeStyle = "rgba(255, 244, 198, .25)"; ctx.lineWidth = 3; ctx.stroke();
    }
    for (let index = 0; index < 35; index += 1) {
      ellipse(ctx, (index * 83) % width, 40 + (index * 41) % height, 2 + index % 4, 1 + index % 2, "rgba(120, 78, 38, .18)");
    }
  } else if (map.id === "soil") {
    const soil = ctx.createLinearGradient(0, 0, 0, height);
    soil.addColorStop(0, "#b7c096"); soil.addColorStop(.3, "#87966f"); soil.addColorStop(1, "#554d40");
    ctx.fillStyle = soil; ctx.fillRect(0, 0, width, height);
    for (let row = 0; row < 5; row += 1) {
      ctx.fillStyle = `rgba(53, 53, 40, ${.12 + row * .04})`;
      ctx.fillRect(0, 110 + row * 74, width, 2);
    }
    ctx.strokeStyle = "rgba(227, 235, 177, .42)"; ctx.lineWidth = 2;
    for (let index = 0; index < 14; index += 1) {
      const x = 35 + index * 74;
      ctx.beginPath(); ctx.moveTo(x, 30); ctx.bezierCurveTo(x - 15, 130, x + 20, 150, x - 8, 250); ctx.bezierCurveTo(x - 20, 330, x + 7, 400, x - 12, 520); ctx.stroke();
    }
  } else {
    const peat = ctx.createLinearGradient(0, 0, 0, height);
    peat.addColorStop(0, "#677582"); peat.addColorStop(.5, "#3d4c54"); peat.addColorStop(1, "#242f38");
    ctx.fillStyle = peat; ctx.fillRect(0, 0, width, height);
    for (let index = 0; index < 28; index += 1) {
      const x = (index * 71) % width; const y = 45 + (index * 37) % height;
      ellipse(ctx, x, y, 3 + index % 4, 1 + index % 2, `rgba(190, 164, 220, ${.14 + (index % 3) * .04})`);
    }
    ctx.strokeStyle = "rgba(224, 213, 167, .34)"; ctx.lineWidth = 2;
    for (let index = 0; index < 12; index += 1) { ctx.beginPath(); ctx.moveTo(40 + index * 84, 510); ctx.quadraticCurveTo(55 + index * 84, 390, 45 + index * 84, 260); ctx.stroke(); }
  }
}

function drawAlgae(ctx, x, y, color, scale = 1, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  for (let strand = 0; strand < 7; strand += 1) {
    const lean = Math.sin(time * .0016 + strand * 1.7) * (5 + strand);
    ctx.beginPath();
    ctx.moveTo((strand - 3) * 4, 12);
    ctx.bezierCurveTo((strand - 3) * 5 + lean, -4, (strand - 3) * 8 - lean, -18, (strand - 3) * 3 + lean, -28 - strand * 2);
    ctx.strokeStyle = strand % 2 ? color : "rgba(245, 247, 194, .78)";
    ctx.lineWidth = strand % 3 === 0 ? 3.2 : 1.7;
    ctx.stroke();
  }
  ellipse(ctx, 0, 13, 20, 5, `${color}45`);
  ctx.restore();
}

function drawRack(ctx, map, width, height, time) {
  const rackX = 132;
  const rackY = 86;
  const rackW = width - 264;
  const rackH = height - 172;
  const species = currentSpecies();
  const pulse = 1 + Math.sin(time * .002) * .035;

  ellipse(ctx, width / 2 + 8, rackY + rackH + 30, rackW * .48, 25, "rgba(21, 65, 61, .2)");

  ctx.save();
  ctx.translate(12, 9);
  roundRect(ctx, rackX, rackY, rackW, rackH, 27);
  ctx.fillStyle = "rgba(30, 75, 70, .22)"; ctx.fill();
  ctx.restore();

  roundRect(ctx, rackX, rackY, rackW, rackH, 27);
  const glass = ctx.createLinearGradient(rackX, rackY, rackX + rackW, rackY + rackH);
  glass.addColorStop(0, "rgba(247, 253, 232, .64)"); glass.addColorStop(.42, "rgba(212, 246, 219, .25)"); glass.addColorStop(1, "rgba(117, 189, 177, .32)");
  ctx.fillStyle = glass; ctx.fill();
  ctx.strokeStyle = "rgba(250, 255, 234, .8)"; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = `${map.color}70`; ctx.lineWidth = 1; ctx.stroke();

  // Four looping channels: a deliberately legible little device, not a sci-fi HUD.
  const left = rackX + 64;
  const right = rackX + rackW - 64;
  for (let row = 0; row < 4; row += 1) {
    const y = rackY + 70 + row * 63;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.bezierCurveTo(left + 74, y - 26, left + 116, y - 26, left + 153, y);
    ctx.bezierCurveTo(left + 207, y + 37, right - 165, y + 37, right - 104, y);
    ctx.bezierCurveTo(right - 61, y - 26, right - 31, y - 18, right, y);
    ctx.strokeStyle = "rgba(39, 103, 99, .25)"; ctx.lineWidth = 17; ctx.stroke();
    ctx.strokeStyle = "rgba(252, 255, 233, .84)"; ctx.lineWidth = 10; ctx.stroke();
    ctx.strokeStyle = `${map.color}90`; ctx.lineWidth = 4; ctx.stroke();
    const flowX = left + ((time * (.045 + row * .004) + row * 80) % (right - left));
    ellipse(ctx, flowX, y, 4, 4, map.color);
    ellipse(ctx, flowX - 10, y, 2, 2, `${map.color}99`);
  }

  // Valves, screws, and the small handmade-looking labels around the rack.
  for (let index = 0; index < 5; index += 1) {
    const x = rackX + 50 + index * ((rackW - 100) / 4);
    ellipse(ctx, x, rackY + rackH - 34, 7, 7, "#f7f1d8", "rgba(38, 89, 82, .5)");
    ctx.beginPath(); ctx.moveTo(x - 3, rackY + rackH - 34); ctx.lineTo(x + 3, rackY + rackH - 34); ctx.strokeStyle = "#557f76"; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.fillStyle = "rgba(25, 75, 71, .58)";
  ctx.font = "10px IBM Plex Mono, monospace";
  ctx.fillText("MICROFLUX / RACK 01", rackX + 27, rackY + 27);
  ctx.fillText(`MAP · ${map.short.toUpperCase()}`, rackX + rackW - 117, rackY + 27);

  const bloomX = width / 2;
  const bloomY = rackY + rackH / 2 + 14;
  const halo = 55 * pulse;
  const glow = ctx.createRadialGradient(bloomX, bloomY, 5, bloomX, bloomY, halo * 1.8);
  glow.addColorStop(0, `${species.color}65`); glow.addColorStop(.5, `${species.color}20`); glow.addColorStop(1, `${species.color}00`);
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(bloomX, bloomY, halo * 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `${species.color}85`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bloomX, bloomY, halo, 0, Math.PI * 2); ctx.stroke();
  drawAlgae(ctx, bloomX, bloomY + 13, species.color, 1.45 * pulse, time);
  for (let mote = 0; mote < 9; mote += 1) {
    const angle = time * .00035 + mote * .7;
    const orbit = 30 + (mote % 3) * 11;
    ellipse(ctx, bloomX + Math.cos(angle) * orbit, bloomY + Math.sin(angle) * orbit * .62, 2 + mote % 2, 2 + mote % 2, mote % 2 ? `${species.color}cc` : "#fff1bc");
  }
  ctx.fillStyle = "rgba(255, 253, 235, .72)";
  ctx.font = "10px IBM Plex Mono, monospace";
  ctx.textAlign = "center";
  ctx.fillText(`BLOOM ${Math.round(state.progress)}%`, bloomX, bloomY + 67);
  ctx.textAlign = "left";

  // A slim glass feed bottle makes the rack read as a real object in a place.
  const bottleX = rackX + rackW + 28;
  const bottleY = rackY + 50;
  roundRect(ctx, bottleX, bottleY, 54, 108, 13); ctx.fillStyle = "rgba(244, 252, 225, .45)"; ctx.fill(); ctx.strokeStyle = "rgba(255, 255, 226, .72)"; ctx.lineWidth = 2; ctx.stroke();
  roundRect(ctx, bottleX + 17, bottleY - 13, 20, 20, 6); ctx.fillStyle = "#e9dcae"; ctx.fill(); ctx.strokeStyle = "rgba(98, 103, 73, .5)"; ctx.stroke();
  ctx.fillStyle = `${species.color}95`; ctx.fillRect(bottleX + 7, bottleY + 54, 40, 45);
  ctx.fillStyle = "rgba(31, 77, 70, .7)"; ctx.font = "8px IBM Plex Mono, monospace"; ctx.fillText("SEED", bottleX + 11, bottleY + 45); ctx.fillText("MIX", bottleX + 14, bottleY + 113);
}

function drawWorld() {
  const canvas = $("#worldCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const map = currentMap();
  const time = performance.now();
  ctx.clearRect(0, 0, width, height);
  drawMapGround(ctx, map, width, height);

  // Soft sun patch and paper-like speckles stop the scene feeling like a flat gradient.
  const sun = ctx.createRadialGradient(width * .14, height * .14, 5, width * .14, height * .14, 270);
  sun.addColorStop(0, "rgba(255, 250, 211, .36)"); sun.addColorStop(1, "rgba(255, 250, 211, 0)");
  ctx.fillStyle = sun; ctx.fillRect(0, 0, width, height);
  drawRack(ctx, map, width, height, time);

  sparks.forEach((spark) => {
    const distance = spark.distance + (1 - spark.life) * 58 * spark.speed;
    const x = width / 2 + Math.cos(spark.angle) * distance;
    const y = height / 2 + 34 + Math.sin(spark.angle) * distance * .62;
    ctx.globalAlpha = clamp(spark.life, 0, 1);
    ellipse(ctx, x, y, spark.size, spark.size, spark.color);
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(25, 62, 60, .55)";
  ctx.font = "10px IBM Plex Mono, monospace";
  ctx.fillText(`${map.name.toUpperCase()}  ·  ${currentSpecies().name.toUpperCase()}`, 24, height - 24);
  ctx.fillStyle = "rgba(250, 247, 222, .7)";
  ctx.font = "11px DM Sans, sans-serif";
  ctx.fillText("leave it humming", width - 130, height - 24);
}

function animateWorld(now) {
  const elapsed = Math.min(8, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;
  frame += 1;
  if (elapsed > 0) advanceTime(elapsed);
  sparks.forEach((spark) => { spark.life -= elapsed * .95; spark.distance += elapsed * 7; });
  while (sparks.length && sparks[0].life <= 0) sparks.shift();
  if (frame % 60 === 0) render();
  drawWorld();
  window.requestAnimationFrame(animateWorld);
}

function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "harvest") harvest();
  if (action === "travel") travel(target.dataset.mapId);
  if (action === "upgrade-device") upgradeDevice();
  if (action === "upgrade-rack") upgradeRack();
  if (action === "select-species") selectSpecies(target.dataset.speciesId);
}

function resetStudy() {
  if (!window.confirm("Start a new quiet culture study and lose this local rack?")) return;
  Object.assign(state, defaultState());
  sparks.length = 0;
  announce("A fresh rack is flowing in the Azure Basin.", "success");
  render();
}

document.addEventListener("click", handleClick);
document.addEventListener("keydown", (event) => {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
  if (event.key === " " || event.key.toLowerCase() === "e") {
    event.preventDefault();
    harvest();
  }
});
$("#worldCanvas")?.addEventListener("click", harvest);
$("#resetStudy")?.addEventListener("click", resetStudy);

applyAwaytime();
render();
window.requestAnimationFrame(animateWorld);
