/*
 * Microflux Field Study
 * A small, deterministic, local-first 2D game layer for the Research Lab.
 * The values are game rules and synthetic interface state, not cultivation advice.
 */

const SAVE_KEY = "orr-microflux-field-study-v1";
const MAX_DEVICE_LEVEL = 5;

const STRAINS = [
  { id: "mossline-azure", name: "Mossline Azure", tier: 1, value: 34, yield: 0.16, color: "#67e8a5", zones: ["marsh", "tidal"], note: "A resilient starter culture with a cool blue signal." },
  { id: "reed-gold", name: "Reed Gold", tier: 1, value: 42, yield: 0.19, color: "#f2c66d", zones: ["marsh", "thermal"], note: "Warm gold filaments found along the reed shelf." },
  { id: "tide-coral", name: "Tide Coral", tier: 2, value: 86, yield: 0.24, color: "#ff8a78", zones: ["tidal", "night"], note: "A coral pulse that prefers moving water." },
  { id: "glass-kelp", name: "Glass Kelp", tier: 2, value: 104, yield: 0.27, color: "#6be3e8", zones: ["marsh", "tidal"], note: "Transparent blades refract the channel lights." },
  { id: "ember-cyan", name: "Ember Cyan", tier: 3, value: 188, yield: 0.33, color: "#ff9d4d", zones: ["thermal"], note: "A bright thermophile marker with a high-value signal." },
  { id: "violet-rift", name: "Violet Rift", tier: 3, value: 246, yield: 0.38, color: "#c59aff", zones: ["night", "thermal"], note: "A deep violet bloom glimpsed beyond the warm vents." },
  { id: "aurora-silk", name: "Aurora Silk", tier: 4, value: 430, yield: 0.48, color: "#9ff7e4", zones: ["night"], note: "A spectral thread that appears only in the dark channel." },
  { id: "prism-heart", name: "Prism Heart", tier: 5, value: 920, yield: 0.62, color: "#ffe8a4", zones: ["night"], note: "The five-star signal. Rare, luminous, and worth protecting." },
];

const ZONES = [
  { id: "marsh", name: "Mossline Marsh", short: "M-01", unlockCost: 0, requiredDevice: 1, color: "#5ad69a", description: "Shallow green channels · reliable starter finds", position: { x: 34, y: 70, w: 178, h: 112 }, strains: ["mossline-azure", "reed-gold", "glass-kelp"] },
  { id: "tidal", name: "Tidal Relay", short: "T-02", unlockCost: 150, requiredDevice: 2, color: "#54d9e8", description: "Moving channels · denser two-star signals", position: { x: 250, y: 38, w: 170, h: 116 }, strains: ["mossline-azure", "tide-coral", "glass-kelp"] },
  { id: "thermal", name: "Thermal Shelf", short: "V-03", unlockCost: 360, requiredDevice: 3, color: "#ff9c58", description: "Warm vents · the first three-star threshold", position: { x: 454, y: 76, w: 150, h: 114 }, strains: ["reed-gold", "ember-cyan", "violet-rift"] },
  { id: "night", name: "Nocturne Trench", short: "N-04", unlockCost: 780, requiredDevice: 4, color: "#c9a0ff", description: "Blackwater trench · four and five-star possibilities", position: { x: 200, y: 220, w: 230, h: 105 }, strains: ["tide-coral", "violet-rift", "aurora-silk", "prism-heart"] },
];

const REACTORS = [
  { id: "starter", name: "Petri Loop", subtitle: "Field starter", cost: 0, capacity: 1, speed: 1, color: "#68e8a8", description: "A dependable single-slot loop for your first recovered strain." },
  { id: "prism", name: "Prism Rack", subtitle: "Two-channel rig", cost: 260, capacity: 2, speed: 1.35, color: "#6be3e8", description: "More headroom and brighter growth telemetry." },
  { id: "halo", name: "Halo Array", subtitle: "Research-grade bay", cost: 720, capacity: 3, speed: 1.8, color: "#c89aff", description: "A high-capacity array built for valuable late-game strains." },
];

const $ = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const number = (value, digits = 0) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: digits });
const stars = (tier) => "★".repeat(tier) + "☆".repeat(5 - tier);
const strainById = (id) => STRAINS.find((strain) => strain.id === id);
const zoneById = (id) => ZONES.find((zone) => zone.id === id);
const reactorById = (id) => REACTORS.find((reactor) => reactor.id === id);

function defaultState() {
  return {
    credits: 220,
    samples: 0,
    biomass: 0,
    day: 1,
    device: { level: 1 },
    unlockedZones: ["marsh"],
    activeZone: "marsh",
    discovered: [],
    activeScreen: "world",
    activeReactor: "starter",
    selectedStrain: null,
    player: { x: 123, y: 126 },
    reactors: { starter: { owned: true, level: 1, progress: 0, biomass: 0, strainId: null } },
    log: ["Field kit online. Mossline Marsh is ready for your first scan."],
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!saved) return defaultState();
    const fresh = defaultState();
    return {
      ...fresh,
      ...saved,
      device: { ...fresh.device, ...(saved.device || {}) },
      player: { ...fresh.player, ...(saved.player || {}) },
      unlockedZones: Array.isArray(saved.unlockedZones) ? saved.unlockedZones : fresh.unlockedZones,
      discovered: Array.isArray(saved.discovered) ? saved.discovered : [],
      reactors: { ...fresh.reactors, ...(saved.reactors || {}) },
      log: Array.isArray(saved.log) ? saved.log.slice(0, 8) : fresh.log,
    };
  } catch {
    return defaultState();
  }
}

const state = loadState();
let toastTimer;
let frame = 0;

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* private browsing can deny storage */ }
}

function announce(message, tone = "normal") {
  state.log.unshift(message);
  state.log = state.log.slice(0, 8);
  const toast = $("#pixelToast");
  if (toast) {
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }
  save();
}

function activeReactor() {
  return state.reactors[state.activeReactor] || state.reactors.starter;
}

function rarityOdds() {
  const odds = [58, 25, 11, 5, 1];
  for (let level = 1; level < state.device.level; level += 1) {
    odds[0] -= 3;
    odds[1] -= 1;
    odds[2] += 1;
    odds[3] += 2;
    odds[4] += 1;
  }
  return odds;
}

function weightedTier() {
  const roll = Math.random() * 100;
  let cursor = 0;
  for (const [index, chance] of rarityOdds().entries()) {
    cursor += chance;
    if (roll <= cursor) return index + 1;
  }
  return 5;
}

function currentObjective() {
  if (!state.discovered.length) return { label: "Recover your first strain", detail: "Travel to Mossline Marsh and scan a microfluidic sample." };
  if (state.device.level < 2) return { label: "Tune the microfluidic device", detail: "Upgrade your scanner to improve two-star and above odds." };
  if (!state.unlockedZones.includes("tidal")) return { label: "Open the Tidal Relay", detail: "Save 150 credits, then unlock a denser discovery zone." };
  if (!state.selectedStrain) return { label: "Choose a strain to grow", detail: "Open Collection and assign one recovered strain to the Petri Loop." };
  const reactor = activeReactor();
  if (reactor.progress >= 100) return { label: "Harvest a valuable culture", detail: "Your reactor is ready. Harvest it from the Reactor Bay." };
  if (reactor.progress > 0) return { label: "Keep the culture moving", detail: "Advance the active reactor until the culture reaches 100%." };
  return { label: "Start your first culture", detail: "Advance the active reactor to grow the selected strain." };
}

function travel(zoneId) {
  const zone = zoneById(zoneId);
  if (!zone) return;
  if (!state.unlockedZones.includes(zoneId)) {
    if (state.device.level < zone.requiredDevice) { announce(`${zone.name} needs a level ${zone.requiredDevice} device.`, "warn"); return; }
    if (state.credits < zone.unlockCost) { announce(`${zone.name} needs ${number(zone.unlockCost)} credits to open.`, "warn"); return; }
    state.credits -= zone.unlockCost;
    state.unlockedZones.push(zoneId);
    announce(`${zone.name} unlocked. New channel data is available.`);
  }
  state.activeZone = zoneId;
  state.player.x = zone.position.x + zone.position.w / 2;
  state.player.y = zone.position.y + zone.position.h / 2;
  state.activeScreen = "world";
  announce(`Travelled to ${zone.name}. Scan the channel for a signal.`);
  render();
}

function scan() {
  const zone = zoneById(state.activeZone);
  if (!zone || !state.unlockedZones.includes(zone.id)) return;
  const tier = weightedTier();
  const candidates = zone.strains.map(strainById).filter(Boolean);
  const tierCandidates = candidates.filter((strain) => strain.tier === tier);
  const pool = tierCandidates.length ? tierCandidates : candidates.filter((strain) => strain.tier <= tier).length ? candidates.filter((strain) => strain.tier <= tier) : candidates;
  const strain = pool[Math.floor(Math.random() * pool.length)];
  state.samples += 1;
  const isNew = !state.discovered.includes(strain.id);
  if (isNew) state.discovered.push(strain.id);
  const creditFind = 8 + strain.tier * 7;
  state.credits += creditFind;
  announce(`${isNew ? "Recovered" : "Reconfirmed"} ${strain.name} · ${stars(strain.tier)} · +${creditFind} credits.`, isNew ? "success" : "normal");
  if (isNew && !state.selectedStrain) state.selectedStrain = strain.id;
  render();
}

function upgradeDevice() {
  if (state.device.level >= MAX_DEVICE_LEVEL) { announce("Microfluidic device is at maximum tuning.", "warn"); return; }
  const cost = 95 * state.device.level;
  if (state.credits < cost) { announce(`Need ${number(cost)} credits to tune the device.`, "warn"); return; }
  state.credits -= cost;
  state.device.level += 1;
  announce(`Device tuned to level ${state.device.level}. Rare-signal odds improved.`, "success");
  render();
}

function selectStrain(strainId) {
  if (!state.discovered.includes(strainId)) return;
  state.selectedStrain = strainId;
  const reactor = activeReactor();
  if (reactor && reactor.progress === 0) reactor.strainId = strainId;
  announce(`${strainById(strainId).name} assigned to ${reactorById(state.activeReactor).name}.`);
  render();
}

function selectReactor(reactorId) {
  const reactor = state.reactors[reactorId];
  if (!reactor?.owned) return;
  state.activeReactor = reactorId;
  if (reactor.strainId) state.selectedStrain = reactor.strainId;
  announce(`${reactorById(reactorId).name} is now the active culture bay.`);
  render();
}

function buyReactor(reactorId) {
  const blueprint = reactorById(reactorId);
  if (!blueprint || state.reactors[reactorId]?.owned) return;
  if (state.credits < blueprint.cost) { announce(`Need ${number(blueprint.cost)} credits to build ${blueprint.name}.`, "warn"); return; }
  state.credits -= blueprint.cost;
  state.reactors[reactorId] = { owned: true, level: 1, progress: 0, biomass: 0, strainId: null };
  state.activeReactor = reactorId;
  announce(`${blueprint.name} built. Select a recovered strain to begin.`, "success");
  render();
}

function upgradeReactor() {
  const reactor = activeReactor();
  const blueprint = reactorById(state.activeReactor);
  if (reactor.level >= 5) { announce(`${blueprint.name} is fully upgraded.`, "warn"); return; }
  const cost = Math.round(80 * blueprint.cost / 100 + reactor.level * 70 + blueprint.capacity * 45);
  if (state.credits < cost) { announce(`Need ${number(cost)} credits to upgrade ${blueprint.name}.`, "warn"); return; }
  state.credits -= cost;
  reactor.level += 1;
  announce(`${blueprint.name} upgraded to Mk ${reactor.level}. Growth output increased.`, "success");
  render();
}

function advanceCulture() {
  const reactor = activeReactor();
  const blueprint = reactorById(state.activeReactor);
  const strain = strainById(reactor.strainId || state.selectedStrain);
  if (!strain || !state.discovered.includes(strain.id)) { announce("Assign a recovered strain before advancing the culture.", "warn"); state.activeScreen = "collection"; render(); return; }
  reactor.strainId = strain.id;
  if (reactor.progress >= 100) { announce("Culture is ready to harvest.", "warn"); return; }
  const progressGain = Math.round((18 + reactor.level * 5) * blueprint.speed);
  const biomassGain = strain.yield * (1 + reactor.level * 0.16) * blueprint.capacity;
  reactor.progress = clamp(reactor.progress + progressGain, 0, 100);
  reactor.biomass += biomassGain;
  state.day += 1;
  announce(`${strain.name} advanced +${progressGain}% · +${number(biomassGain, 2)} biomass units.`);
  render();
}

function harvest() {
  const reactor = activeReactor();
  const strain = strainById(reactor.strainId);
  if (!strain || reactor.progress < 100) { announce("The culture needs to reach 100% before harvest.", "warn"); return; }
  const value = Math.round(reactor.biomass * strain.value * (1 + reactor.level * 0.08));
  state.credits += value;
  state.biomass += reactor.biomass;
  announce(`Harvested ${number(reactor.biomass, 2)} units of ${strain.name} · +${number(value)} credits.`, "success");
  reactor.progress = 0;
  reactor.biomass = 0;
  reactor.strainId = null;
  render();
}

function updateScreen(screen) {
  state.activeScreen = screen;
  render();
}

function renderWorldPanel() {
  const zone = zoneById(state.activeZone);
  return `<div class="panel-kicker">Field map / ${zone.short}</div><h2>${zone.name}</h2><p class="panel-lede">${zone.description}. Walk the channels with <kbd>WASD</kbd> or arrow keys, then recover a signal at the active scan point.</p><div class="world-actions"><button class="pixel-button primary" data-action="scan">⌁ Scan microfluidic sample</button><button class="pixel-button" data-screen="device">Tune device →</button></div><div class="zone-grid">${ZONES.map((item) => { const unlocked = state.unlockedZones.includes(item.id); const active = state.activeZone === item.id; return `<button class="zone-card ${active ? "is-active" : ""} ${unlocked ? "" : "is-locked"}" data-action="travel" data-zone-id="${item.id}"><span class="zone-color" style="--zone:${item.color}"></span><span class="zone-card-copy"><b>${item.short} · ${item.name}</b><small>${unlocked ? item.description : `Unlock · ${number(item.unlockCost)} cr · device ${item.requiredDevice}`}</small></span><span class="zone-state">${active ? "HERE" : unlocked ? "GO" : "LOCKED"}</span></button>`; }).join("")}</div><div class="map-tip"><span class="tip-icon">✦</span><span><b>Field objective</b>${currentObjective().detail}</span></div>`;
}

function renderDevicePanel() {
  const nextCost = state.device.level < MAX_DEVICE_LEVEL ? 95 * state.device.level : 0;
  return `<div class="panel-kicker">Microfluidic device / tuning bay</div><h2>Make rare signals more likely.</h2><p class="panel-lede">Every scan rolls across five rarity bands. Device tuning shifts probability toward the valuable upper tiers; it never guarantees a result.</p><div class="device-level"><div><span>Current tuning</span><strong>LEVEL ${state.device.level} <i>${"▰".repeat(state.device.level)}${"▱".repeat(MAX_DEVICE_LEVEL - state.device.level)}</i></strong></div><button class="pixel-button primary" data-action="upgrade-device" ${state.device.level >= MAX_DEVICE_LEVEL ? "disabled" : ""}>${state.device.level >= MAX_DEVICE_LEVEL ? "Max tuning" : `Tune · ${number(nextCost)} cr`}</button></div><div class="rarity-table"><div class="rarity-row header"><span>Rarity</span><span>Signal class</span><span>Chance</span></div>${rarityOdds().map((chance, index) => `<div class="rarity-row"><span class="star-score tier-${index + 1}">${stars(index + 1)}</span><b>${["Common", "Uncommon", "Rare", "Ultra", "Mythic"][index]}</b><strong>${chance}%</strong></div>`).join("")}</div><div class="map-tip"><span class="tip-icon">i</span><span><b>Why upgrade?</b>At level 1, five-star signals are a 1% roll. At level 5, that roll becomes 5% and four-star signals become 11%.</span></div>`;
}

function renderReactorsPanel() {
  const active = activeReactor();
  const blueprint = reactorById(state.activeReactor);
  const strain = strainById(active.strainId);
  const upgradeCost = active.level < 5 ? Math.round(80 * blueprint.cost / 100 + active.level * 70 + blueprint.capacity * 45) : 0;
  return `<div class="panel-kicker">Reactor bay / growth economy</div><h2>Turn a recovered signal into value.</h2><p class="panel-lede">Assign a strain, advance the synthetic culture one day at a time, then harvest its game value when the bay reaches 100%.</p><div class="reactor-grid">${REACTORS.map((item) => { const unit = state.reactors[item.id]; const owned = unit?.owned; const activeClass = state.activeReactor === item.id; return `<article class="reactor-card ${activeClass ? "is-active" : ""} ${owned ? "" : "is-locked"}"><div class="reactor-card-top"><span class="reactor-glyph" style="--reactor:${item.color}">◉</span><span><b>${item.name}</b><small>${item.subtitle}</small></span><em>${owned ? `MK ${unit.level}` : `${number(item.cost)} CR`}</em></div><p>${item.description}</p>${owned ? `<button class="pixel-button ${activeClass ? "primary" : ""}" data-action="select-reactor" data-reactor-id="${item.id}">${activeClass ? "Active bay" : "Select bay"}</button>` : `<button class="pixel-button" data-action="buy-reactor" data-reactor-id="${item.id}">Build reactor · ${number(item.cost)} cr</button>`}</article>`; }).join("")}</div><section class="culture-console"><div class="culture-console-head"><div><span class="panel-kicker">Active culture</span><h3>${strain ? strain.name : "Awaiting a recovered strain"}</h3></div><span class="star-score tier-${strain?.tier || 1}">${strain ? stars(strain.tier) : "—"}</span></div><div class="culture-bar"><span style="width:${active.progress}%"></span></div><div class="culture-stats"><span><small>Progress</small><b>${active.progress}%</b></span><span><small>Biomass</small><b>${number(active.biomass, 2)}</b></span><span><small>Output</small><b>${strain ? `${number(strain.value)} cr/u` : "—"}</b></span></div><div class="world-actions"><button class="pixel-button primary" data-action="advance-culture">＋ Advance one day</button><button class="pixel-button" data-action="harvest" ${active.progress < 100 ? "disabled" : ""}>Harvest culture</button><button class="text-button" data-action="upgrade-reactor" ${active.level >= 5 ? "disabled" : ""}>Upgrade bay · ${active.level >= 5 ? "MAX" : `${number(upgradeCost)} cr`}</button></div></section>`;
}

function renderCollectionPanel() {
  const recovered = STRAINS.filter((strain) => state.discovered.includes(strain.id));
  return `<div class="panel-kicker">Strain archive / recovered signals</div><h2>Build a collection worth growing.</h2><p class="panel-lede">Recovered strains stay in your local archive. Pick one to assign to the active reactor; higher tiers carry more value and longer-term upgrade goals.</p><div class="collection-grid">${STRAINS.map((strain) => { const found = state.discovered.includes(strain.id); const selected = state.selectedStrain === strain.id; return `<button class="strain-card ${found ? "is-found" : "is-hidden"} ${selected ? "is-selected" : ""}" data-action="select-strain" data-strain-id="${strain.id}" ${found ? "" : "disabled"}><span class="strain-orb" style="--strain:${strain.color}">${found ? "✦" : "?"}</span><span class="strain-card-main"><b>${found ? strain.name : "Unknown signal"}</b><small>${found ? strain.note : `Recover from ${strain.zones.map((id) => zoneById(id).short).join(" / ")}`}</small></span><span class="strain-card-meta"><em>${found ? stars(strain.tier) : "?????"}</em><strong>${found ? `${number(strain.value)} cr/u` : "LOCKED"}</strong></span></button>`; }).join("")}</div><div class="archive-footer"><span>${recovered.length}/${STRAINS.length} signals catalogued</span><span>Samples recovered: ${number(state.samples)}</span></div>`;
}

function renderPanel() {
  const screen = state.activeScreen;
  if (screen === "device") return renderDevicePanel();
  if (screen === "reactors") return renderReactorsPanel();
  if (screen === "collection") return renderCollectionPanel();
  return renderWorldPanel();
}

function render() {
  $("#creditReadout").textContent = number(state.credits);
  $("#sampleReadout").textContent = number(state.samples);
  $("#biomassReadout").textContent = number(state.biomass, 2);
  $("#dayReadout").textContent = `DAY ${String(state.day).padStart(2, "0")}`;
  $("#objectiveTitle").textContent = currentObjective().label;
  $("#objectiveDetail").textContent = currentObjective().detail;
  $("#worldPanel").innerHTML = renderPanel();
  $("#fieldLog").innerHTML = state.log.slice(0, 4).map((entry) => `<li>${entry}</li>`).join("");
  document.querySelectorAll("[data-screen]").forEach((button) => button.classList.toggle("is-active", button.dataset.screen === state.activeScreen));
  save();
  drawWorld();
}

function pixelText(ctx, text, x, y, color = "#e9f7e8", size = 10) {
  ctx.fillStyle = color;
  ctx.font = `${size}px monospace`;
  ctx.fillText(text, Math.round(x), Math.round(y));
}

function drawWorld() {
  const canvas = $("#worldCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#07151a";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0a2228";
  for (let x = 0; x < W; x += 16) for (let y = 0; y < H; y += 16) ctx.fillRect(x, y, 1, 1);
  ctx.strokeStyle = "rgba(87, 214, 173, .14)";
  ctx.setLineDash([3, 8]);
  ctx.beginPath(); ctx.moveTo(123, 127); ctx.lineTo(335, 95); ctx.lineTo(528, 133); ctx.moveTo(335, 95); ctx.lineTo(315, 272); ctx.stroke(); ctx.setLineDash([]);
  for (const zone of ZONES) {
    const { x, y, w, h } = zone.position;
    const unlocked = state.unlockedZones.includes(zone.id);
    const active = state.activeZone === zone.id;
    ctx.fillStyle = unlocked ? "#12343a" : "#101b24";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = unlocked ? `${zone.color}18` : "#121a22";
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    ctx.strokeStyle = active ? zone.color : unlocked ? `${zone.color}88` : "#35414c";
    ctx.lineWidth = active ? 3 : 1;
    ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    for (let i = 0; i < 7; i += 1) {
      const px = x + 12 + ((i * 37) % Math.max(20, w - 24));
      const py = y + h - 15 - ((i * 19) % Math.max(15, h - 30));
      ctx.fillStyle = `${zone.color}99`;
      ctx.fillRect(px, py, 3, 8);
      ctx.fillRect(px - 2, py + 3, 7, 2);
    }
    pixelText(ctx, zone.short, x + 10, y + 18, zone.color, 11);
    pixelText(ctx, unlocked ? zone.name : "LOCKED CHANNEL", x + 10, y + 34, unlocked ? "#d4ece0" : "#677580", 9);
    if (!unlocked) pixelText(ctx, `DEVICE ${zone.requiredDevice}`, x + 10, y + h - 12, "#677580", 8);
  }
  ctx.fillStyle = "#d6c77f";
  ctx.fillRect(292, 155, 85, 43);
  ctx.fillStyle = "#25333b";
  ctx.fillRect(299, 162, 71, 28);
  ctx.fillStyle = "#68e8a8";
  ctx.fillRect(304, 168, 18, 15);
  ctx.fillStyle = "#ffcf77";
  ctx.fillRect(344, 168, 18, 15);
  pixelText(ctx, "FIELD LAB", 298, 213, "#d6c77f", 8);
  const player = state.player;
  ctx.fillStyle = "#050c10";
  ctx.fillRect(player.x - 8, player.y - 2, 16, 13);
  ctx.fillStyle = "#f5db91";
  ctx.fillRect(player.x - 5, player.y - 10, 10, 9);
  ctx.fillStyle = "#69e8ac";
  ctx.fillRect(player.x - 7, player.y - 12, 14, 3);
  ctx.fillStyle = "#eaf9eb";
  ctx.fillRect(player.x - 3, player.y - 7, 2, 2);
  ctx.fillRect(player.x + 2, player.y - 7, 2, 2);
  const pulse = Math.floor(frame / 15) % 2;
  ctx.strokeStyle = pulse ? "#f2c66d" : "#ffffff88";
  ctx.strokeRect(player.x - 12, player.y - 16, 24, 31);
  pixelText(ctx, "YOU", player.x - 11, player.y + 28, "#f2c66d", 8);
  pixelText(ctx, "MICROFLUX FIELD STUDY // SYNTHETIC MAP", 16, H - 14, "#71918e", 9);
}

function animateWorld() {
  frame += 1;
  drawWorld();
  window.requestAnimationFrame(animateWorld);
}

function movePlayer(dx, dy) {
  state.player.x = clamp(state.player.x + dx, 18, 622);
  state.player.y = clamp(state.player.y + dy, 20, 330);
  drawWorld();
}

function handleClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  const screenTarget = event.target.closest("[data-screen]");
  if (screenTarget) { updateScreen(screenTarget.dataset.screen); return; }
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  if (action === "scan") scan();
  if (action === "upgrade-device") upgradeDevice();
  if (action === "travel") travel(actionTarget.dataset.zoneId);
  if (action === "select-strain") selectStrain(actionTarget.dataset.strainId);
  if (action === "select-reactor") selectReactor(actionTarget.dataset.reactorId);
  if (action === "buy-reactor") buyReactor(actionTarget.dataset.reactorId);
  if (action === "upgrade-reactor") upgradeReactor();
  if (action === "advance-culture") advanceCulture();
  if (action === "harvest") harvest();
}

function handleKeydown(event) {
  if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName)) return;
  const moves = { ArrowUp: [0, -7], w: [0, -7], W: [0, -7], ArrowDown: [0, 7], s: [0, 7], S: [0, 7], ArrowLeft: [-7, 0], a: [-7, 0], A: [-7, 0], ArrowRight: [7, 0], d: [7, 0], D: [7, 0] };
  if (!moves[event.key]) return;
  event.preventDefault();
  movePlayer(...moves[event.key]);
}

function handleCanvasClick(event) {
  const canvas = $("#worldCanvas");
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;
  const zone = ZONES.find((item) => x >= item.position.x && x <= item.position.x + item.position.w && y >= item.position.y && y <= item.position.y + item.position.h);
  if (zone) travel(zone.id);
}

$("#worldPanel").addEventListener("click", handleClick);
$(".pixel-sidebar").addEventListener("click", handleClick);
document.addEventListener("keydown", handleKeydown);
$("#worldCanvas").addEventListener("click", handleCanvasClick);
$("#resetStudy").addEventListener("click", () => { if (window.confirm("Reset your local field study and lose its discoveries?")) { Object.assign(state, defaultState()); announce("Field study reset. Start with Mossline Marsh."); render(); } });
render();
animateWorld();
