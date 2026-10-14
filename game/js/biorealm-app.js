import {
  BIOMES, DEVICES, EVENTS, RARITIES, REACTOR_ENVIRONMENTS, REACTOR_TIERS, SPECIES, UPGRADES, CONTRACTS,
  SAVE_KEY, BIOMASS_TO_CREDITS, byId, applyOffline, assignSpecies, biomeInfo, unlockedResearch,
  buyDevice, buyReactor, buyUpgrade, calculateTotalRate, clearReactorSlot,
  collectExpedition, collectReadyExpeditions, createInitialState, deviceUpgradeCost, claimGrant, setReactorEnvironment,
  eventFor, formatNumber, harvestAll, harvestReactor, installDevice, nextObjective,
  parseState, reactorCapacity, reactorInfo, reactorProduction, reactorUpgradeCost,
  safeLoad, saveState, settleProduction, speciesInfo, speciesRate, startExpedition, tick,
  tickExpeditions, unlockBiome, upgradeDevice, upgradeLevel, upgradeReactor,
} from "./biorealm-engine.js";
import { createScene, speciesPortrait } from "./biorealm-scene.js";
import { createAmbientAudio } from "./biorealm-audio.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const stars = (rarity) => "★".repeat(rarityInfo(rarity).stars) + "☆".repeat(5 - rarityInfo(rarity).stars);
const rarityInfo = (id) => RARITIES.find((item) => item.id === id) || RARITIES[0];
const now = () => Date.now();

let { state, migrated } = safeLoad(window.localStorage);
let activeView = "lab";
let selectedDevice = null;
let selectedBiome = state.activeBiome;
let toastTimer = null;
let modalTimer = null;
let scene = null;
const audio = createAmbientAudio();
let frameHandle = 0;

const refs = {
  app: $("#biorealmApp"), scene: $("#sceneCanvas"), view: $("#gameView"), nav: $("#gameNav"),
  credits: $("#creditsReadout"), rate: $("#incomeReadout"), biomass: $("#biomassReadout"),
  archive: $("#archiveReadout"), toast: $("#gameToast"), modal: $("#revealModal"), modalContent: $("#revealContent"),
  ambience: $("#ambienceLabel"), event: $("#eventReadout"), objective: $("#objectiveCard"),
};

function money(value) { return formatNumber(value, 1); }
function timeLabel(seconds) { const value = Math.max(0, Math.ceil(seconds)); return value < 60 ? `${value}s` : `${Math.floor(value / 60)}m ${value % 60}s`; }
function selectedReactor() { return state.reactors.find((item) => item.id === state.selectedReactor) || state.reactors[0]; }
function deviceDefinition(device) { return byId.device(device?.type) || DEVICES[0]; }
function availableDevices() { return state.devices.filter((device) => device.rackId); }
function currentEvent() { return eventFor(state, now()); }

function announce(message, tone = "normal") {
  state.log.unshift(message); state.log = state.log.slice(0, 12); saveState(window.localStorage, state, now());
  if (!refs.toast) return;
  refs.toast.textContent = message; refs.toast.dataset.tone = tone; refs.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => refs.toast.classList.remove("is-visible"), 3200);
}

function showReveal(result) {
  const species = speciesInfo(result.speciesId); const rarity = rarityInfo(species.rarity);
  refs.modalContent.innerHTML = `<div class="reveal-orbit" style="--species-color:${species.color};--rarity-color:${rarity.color}"><span class="reveal-ring"></span><span class="reveal-cell" aria-hidden="true"></span></div><p class="eyebrow">NEW ARCHIVE RECORD · ${result.variant ? "RARE VARIANT" : "SPECIMEN LOGGED"}</p><h2>${escapeHtml(species.name)}</h2><div class="star-line" style="color:${rarity.color}">${stars(species.rarity)} <span>${rarity.label}</span></div><p>${escapeHtml(species.lore)}</p><div class="reveal-stats"><span><b>${Math.round(result.quality * 100)}%</b> sample quality</span><span><b>${money(species.baseRate * BIOMASS_TO_CREDITS)}</b> base credits/min</span></div><button class="game-button primary" data-action="close-reveal" type="button">place in archive</button>`;
  refs.modal.hidden = false; window.clearTimeout(modalTimer); modalTimer = window.setTimeout(() => { refs.modal.hidden = true; }, 12000);
  audio.sfx("discovery");
}

function actionResult(result, successMessage, options = {}) {
  if (result?.ok) { announce(successMessage, "success"); audio.sfx(options.reveal ? "collect" : "select"); if (options.reveal && result.result) showReveal(result.result); return true; }
  const reasons = { funds: `You need ${money(result?.cost || 0)} credits.`, research: `The research index needs ${result?.required || 0} more points.`, biome: "This field site is still closed in the atlas.", device: "Install this device in a rack before starting a survey.", occupied: "That chamber is already occupied.", locked: "Research another chamber upgrade first.", incompatible: "This strain needs a more advanced reactor.", duplicate: "Use one copy of a strain per vessel to keep the culture comparison useful.", environment: "That cultivation environment is not available.", "not-ready": "The device is still processing its sample.", max: "This system is already at its current limit.", unavailable: "That module is already commissioned or unavailable.", missing: "That laboratory record is no longer available.", invalid: "That assignment is not compatible with this vessel." };
  announce(reasons[result?.reason] || "The lab could not complete that action.", "warn"); audio.sfx("deny"); return false;
}

function frameProgress(device) {
  if (!device?.expedition) return 0;
  return clamp((now() - device.expedition.startedAt) / (device.expedition.endsAt - device.expedition.startedAt), 0, 1);
}

function deviceStatus(device) {
  if (!device) return "empty chamber";
  if (device.status === "running") return `surveying · ${timeLabel((device.expedition.endsAt - now()) / 1000)}`;
  if (device.status === "ready") return "sample ready · collect";
  return "standby · ready to deploy";
}

function deviceCard(device, options = {}) {
  if (!device) return `<div class="device-slot empty-slot"><span class="slot-number">OPEN CHAMBER</span><strong>Install a discovery device</strong><small>Purchase a chip from the expedition desk, then seat it in this rack.</small></div>`;
  const def = deviceDefinition(device); const running = device.status === "running"; const ready = device.status === "ready";
  const selected = selectedDevice === device.id;
  return `<article class="device-card ${running ? "is-running" : ""} ${ready ? "is-ready" : ""} ${selected ? "is-selected" : ""}" style="--device-color:${def.color}" data-device-id="${device.id}"><div class="device-head"><span class="device-glyph">${def.glyph}</span><div><span class="eyebrow">${escapeHtml(def.subtitle)}</span><h3>${escapeHtml(def.name)}</h3></div><span class="device-led"></span></div><div class="microchip-art"><span></span><span></span><span></span><i></i></div><div class="device-progress"><i style="width:${running ? Math.round(frameProgress(device) * 100) : ready ? 100 : 0}%"></i></div><div class="device-meta"><span>LVL ${device.level}/${def.maxLevel}</span><span>${escapeHtml(deviceStatus(device))}</span></div><div class="device-actions"><button class="text-button" data-action="inspect-device" data-device-id="${device.id}" type="button">inspect</button><button class="text-button" data-action="upgrade-device" data-device-id="${device.id}" type="button" ${device.level >= def.maxLevel ? "disabled" : ""}>${device.level >= def.maxLevel ? "maxed" : `tune · ${money(deviceUpgradeCost(device))}`}</button></div>${ready ? `<button class="game-button small primary full" data-action="collect-expedition" data-device-id="${device.id}" type="button">reveal sample</button>` : ""}</article>`;
}

function rackMarkup() {
  return state.racks.map((rack) => `<section class="rack-unit"><div class="rack-header"><div><span class="eyebrow">laboratory rack</span><h2>${escapeHtml(rack.name)}</h2></div><span class="rack-code">${rack.id.toUpperCase()} · ${rack.slots.filter(Boolean).length}/${rack.slots.length} occupied</span></div><div class="rack-body"><div class="rack-rail"></div><div class="device-grid">${rack.slots.map((deviceId) => deviceCard(state.devices.find((device) => device.id === deviceId))).join("")}</div><div class="rack-feet"></div></div></section>`).join("");
}

function reactorMini(reactor) {
  const def = reactorInfo(reactor.tier); const rate = reactorProduction(reactor, state, now()); const cap = reactorCapacity(reactor, state);
  return `<article class="reactor-mini" data-reactor-id="${reactor.id}" style="--reactor-color:${def.id === "flask" ? "#81cdb5" : def.id === "industrial" ? "#e2b667" : "#83a8d5"}"><div class="reactor-orb">${def.icon}</div><div><span class="eyebrow">${escapeHtml(def.name)} · LVL ${reactor.level}</span><h3>${reactor.slots.filter(Boolean).length ? reactor.slots.filter(Boolean).map((id) => escapeHtml(speciesInfo(id).short)).join(" · ") : "awaiting an inoculum"}</h3><small>${money(rate)} biomass/s · ${money(reactor.stored)} / ${money(cap)} stored</small></div><button class="icon-button" data-action="select-reactor" data-reactor-id="${reactor.id}" type="button" aria-label="Open ${escapeHtml(def.name)}">↗</button></article>`;
}

function objectiveMarkup() {
  const objective = nextObjective(state); return `<div class="objective-icon">✦</div><div><span class="eyebrow">next research note</span><h2>${escapeHtml(objective.title)}</h2><p>${escapeHtml(objective.detail)}</p></div>${objective.reward ? `<b class="objective-reward">+${money(objective.reward)}</b>` : ""}`;
}

function labView() {
  const event = currentEvent(); const rate = calculateTotalRate(state, now());
  const grant = state.stats.grants ? "" : `<div class="grant-card"><div><span class="eyebrow">first field grant</span><h2>Begin with a little room to wonder.</h2><p>Claim the Orr field-study grant before your first survey. It is available once, and it keeps early choices thoughtful rather than frustrating.</p></div><button class="game-button primary" data-action="claim-grant" type="button">claim +100 credits</button></div>`;
  return `<section class="view-heading"><div><span class="eyebrow">quiet laboratory · day ${Math.max(1, Math.floor(state.stats.totalSeconds / 86400) + 1)}</span><h1>A living room for <em>small wonders.</em></h1><p>Run a careful field survey, bring a strain home, and let the photobioreactors do the patient work.</p></div><div class="heading-note"><span class="signal-dot"></span><span>LOCAL SAVE<br><b>${state.lastSavedAt ? "progress secured" : "starting lab"}</b></span></div></section><section class="scene-card"><canvas id="sceneCanvasInner" width="1200" height="520" aria-label="Atmospheric Orr Biologicals laboratory with animated discovery racks and photobioreactors"></canvas><div class="scene-overlay scene-caption"><span class="eyebrow">north window laboratory</span><strong>light through glass · cultures in motion</strong></div><div class="scene-overlay scene-legend"><span><i class="legend-fluid"></i>active flow</span><span><i class="legend-device"></i>discovery rack</span><span><i class="legend-growth"></i>cultivation</span></div></section>${grant}<div id="objectiveCard" class="objective-card">${objectiveMarkup()}</div><section class="lab-columns"><div><div class="section-title"><div><span class="eyebrow">microfluidic discovery</span><h2>Rack stations</h2></div><button class="text-button" data-action="go-view" data-view="expedition" type="button">open expedition desk ↗</button></div>${rackMarkup()}</div><aside class="lab-side"><div class="panel-card event-card" style="--event-color:${event.color}"><div class="card-top"><span class="eyebrow">ambient condition</span><span class="event-pip"></span></div><h2>${escapeHtml(event.name)}</h2><p>${escapeHtml(event.description)}</p><small>field rhythm refreshes in ${timeLabel((event.endsAt - now()) / 1000)}</small></div><div class="panel-card reactor-bank"><div class="section-title compact"><div><span class="eyebrow">passive cultivation</span><h2>Reactor bank</h2></div><button class="text-button" data-action="go-view" data-view="reactors" type="button">manage</button></div>${state.reactors.map(reactorMini).join("")}<button class="game-button primary full" data-action="harvest-all" type="button">harvest ${money(state.reactors.reduce((sum, item) => sum + item.stored, 0))} biomass · +${money(state.reactors.reduce((sum, item) => sum + item.stored, 0) * BIOMASS_TO_CREDITS)}</button></div><div class="panel-card journal-card"><div class="section-title compact"><div><span class="eyebrow">field journal</span><h2>Recent notes</h2></div></div><ul class="log-list">${state.log.slice(0, 4).map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul></div></aside></section>`;
}

function biomeCard(biome) {
  const unlocked = state.unlockedBiomes.includes(biome.id); const active = selectedBiome === biome.id; const enoughResearch = byId.biome(biome.id).requiredResearch <= (upgradeLevel(state, "rare-culture") + upgradeLevel(state, "wetland-mapping") + upgradeLevel(state, "mutation-analysis") + upgradeLevel(state, "optics"));
  return `<button class="biome-card ${active ? "is-active" : ""} ${unlocked ? "" : "is-locked"}" data-action="select-biome" data-biome-id="${biome.id}" style="--biome-color:${biome.color}" type="button"><span class="biome-swatch">${biome.icon}</span><span><b>${escapeHtml(biome.name)}</b><small>${escapeHtml(biome.subtitle)}</small></span><em>${unlocked ? (active ? "selected" : "choose site") : enoughResearch ? `${money(biome.unlockCost)} credits` : `research ${biome.requiredResearch}`}</em></button>`;
}

function devicePurchaseCard(def) {
  const owned = state.devices.filter((device) => device.type === def.id).length; const selected = state.devices.find((device) => device.type === def.id);
  return `<article class="purchase-card" style="--device-color:${def.color}"><div class="purchase-icon">${def.glyph}</div><div><span class="eyebrow">${escapeHtml(def.subtitle)}</span><h3>${escapeHtml(def.name)}</h3><p>${escapeHtml(def.description)}</p><div class="attribute-row"><span>speed <b>${def.speed.toFixed(2)}×</b></span><span>rare bias <b>+${def.rarity.toFixed(2)}</b></span><span>chambers <b>${def.chambers}</b></span></div></div><div class="purchase-action"><small>${owned} owned</small><button class="game-button ${state.credits >= def.cost ? "primary" : ""}" data-action="buy-device" data-device-type="${def.id}" type="button">${money(def.cost)} credits</button>${selected ? `<span>next: LVL ${selected.level + 1}</span>` : ""}</div></article>`;
}

function expeditionView() {
  const biome = biomeInfo(selectedBiome); const devices = availableDevices(); const chosen = selectedDevice && state.devices.find((item) => item.id === selectedDevice);
  const active = chosen?.status === "running" && chosen?.expedition?.biomeId === biome.id ? chosen : null; const ready = state.devices.filter((device) => device.status === "ready");
  const qaClock = new URLSearchParams(window.location.search).has("qa") ? `<button class="qa-clock" data-action="qa-fast-forward" type="button" hidden>advance test clock</button>` : "";
  return `<section class="view-heading split-heading"><div><span class="eyebrow">field atlas · synthetic expedition</span><h1>Go where the signal <em>changes.</em></h1><p>Each environment reshapes the species pool, survey cost, timing, and chances of an unusual find.</p></div><div class="seed-note"><span>WORLD SEED</span><b>${escapeHtml(state.seed)}</b><small>reproducible discovery outcomes</small></div></section><section class="atlas-grid">${BIOMES.map(biomeCard).join("")}</section><section class="expedition-grid"><div class="field-card"><div class="field-art"><canvas id="fieldCanvas" width="1200" height="520" aria-label="Atmospheric ${escapeHtml(biome.name)} field scene"></canvas><span class="field-label">${escapeHtml(biome.name)} · ${escapeHtml(biome.preference)} conditions</span></div><div class="field-copy"><div><span class="eyebrow">selected field site</span><h2>${escapeHtml(biome.name)}</h2><p>${escapeHtml(biome.description)}</p></div><div class="field-stats"><span><b>${biome.duration}s</b> base duration</span><span><b>+${biome.rarityBias.toFixed(1)}</b> rare pressure</span><span><b>${biome.expeditionCost}</b> credits / survey</span></div></div><div class="pool-preview"><span class="eyebrow">species likely in this pool</span><div>${biome.species.map((id) => { const s = speciesInfo(id); return `<span class="pool-species" style="--species-color:${s.color}"><i></i>${escapeHtml(s.short)}</span>`; }).join("")}</div></div></div><aside class="expedition-desk"><div class="section-title compact"><div><span class="eyebrow">instrument deck</span><h2>Choose a device</h2></div><span class="desk-count">${devices.length} installed</span></div>${devices.length ? `<div class="device-selector">${devices.map((device) => `<button class="selector-device ${selectedDevice === device.id ? "is-selected" : ""} ${device.status !== "idle" ? "is-busy" : ""}" data-action="select-device" data-device-id="${device.id}" type="button"><span class="selector-glyph" style="--device-color:${deviceDefinition(device).color}">${deviceDefinition(device).glyph}</span><span><b>${escapeHtml(deviceDefinition(device).name)}</b><small>LVL ${device.level} · ${escapeHtml(deviceStatus(device))}</small></span><i></i></button>`).join("")}</div>` : `<div class="empty-state">Buy a screening chip below, then install it in the North Window rack.</div>`}${chosen ? `<div class="launch-panel"><div class="launch-top"><div><span class="eyebrow">selected instrument</span><h3>${escapeHtml(deviceDefinition(chosen).name)}</h3></div><span class="status-chip ${chosen.status}">${escapeHtml(chosen.status)}</span></div>${active ? `<div class="expedition-progress"><div><span>survey in progress</span><b>${timeLabel((active.expedition.endsAt - now()) / 1000)}</b></div><i><b style="width:${Math.round(frameProgress(active) * 100)}%"></b></i><small>Results stay in the device until you choose to reveal them.</small></div>` : chosen.status === "ready" ? `<div class="ready-panel"><strong>Sample ready for reveal</strong><p>A result has stabilized in the archive window.</p><button class="game-button primary full" data-action="collect-expedition" data-device-id="${chosen.id}" type="button">open discovery</button></div>` : `<div class="launch-controls"><label for="biomeDuration">${escapeHtml(biome.name)} survey</label><span>${biome.duration}s base · ${biome.expeditionCost} credits</span><button class="game-button primary full" data-action="start-expedition" data-device-id="${chosen.id}" data-biome-id="${biome.id}" type="button">begin slow survey</button></div>`}</div>` : ""}</aside></section><section class="purchase-section"><div class="section-title"><div><span class="eyebrow">commission the next instrument</span><h2>Microfluidic device families</h2></div><span class="quiet-note">devices are investments, not income faucets</span></div><div class="purchase-grid">${DEVICES.map(devicePurchaseCard).join("")}</div></section>${ready.length ? `<div class="notice-strip"><span class="signal-dot"></span><b>${ready.length} completed survey${ready.length > 1 ? "s" : ""}</b><span>Open the archive window to collect each result.</span></div>` : ""}${qaClock}`;
}

function speciesSelectMarkup(reactor, slot, current) {
  const options = state.discovered.map((id) => { const species = speciesInfo(id); const compatible = reactor.slots[slot] === id || (species.reactors.includes("all") || species.reactors.includes(reactor.tier)); return `<button class="strain-option ${current === id ? "is-active" : ""} ${compatible ? "" : "is-incompatible"}" data-action="assign-species" data-reactor-id="${reactor.id}" data-slot="${slot}" data-species-id="${id}" type="button" ${compatible ? "" : "disabled"}><span class="strain-dot" style="--species-color:${species.color}"></span><span><b>${escapeHtml(species.short)}</b><small>${stars(species.rarity)} · ${compatible ? `${money(speciesRateForUi(id, reactor))}/s` : "needs higher vessel"}</small></span></button>`; }).join("");
  return `<div class="strain-picker ${current ? "has-current" : ""}">${current ? `<button class="current-strain" style="--species-color:${speciesInfo(current).color}" data-action="clear-slot" data-reactor-id="${reactor.id}" data-slot="${slot}" type="button"><i></i><span>${escapeHtml(speciesInfo(current).short)}<small>tap to rotate</small></span><b>×</b></button>` : `<span class="empty-strain">empty strain position</span>`}<div class="strain-options">${options}</div></div>`;
}

function speciesRateForUi(id, reactor) {
  return speciesRate(id, reactor, state, now());
}

function reactorCard(reactor) {
  const def = reactorInfo(reactor.tier); const stored = reactor.stored; const cap = reactorCapacity(reactor, state); const rate = reactorProduction(reactor, state, now()); const environment = byId.environment(reactor.environment) || REACTOR_ENVIRONMENTS[0];
  return `<article class="reactor-card" data-reactor-id="${reactor.id}"><div class="reactor-card-head"><div class="reactor-emblem" style="--reactor-color:${def.id === "industrial" ? "#e2b667" : def.id === "flask" ? "#81cdb5" : "#83a8d5"}">${def.icon}</div><div><span class="eyebrow">${escapeHtml(def.name)} · vessel ${reactor.level}</span><h2>${escapeHtml(reactor.id.replace("reactor-", "Cultivation room "))}</h2><p>${escapeHtml(def.description)}</p></div><span class="rate-badge">${money(rate)} / sec</span></div><div class="reactor-glass"><div class="reactor-fluid" style="height:${Math.round(clamp(stored / cap, 0, 1) * 100)}%"></div><div class="reactor-tubes"><i></i><i></i><i></i></div><span class="fluid-label">${money(stored)} / ${money(cap)} biomass</span></div><div class="reactor-environment"><label for="environment-${reactor.id}"><span>environment</span><small>${escapeHtml(environment.description)}</small></label><select id="environment-${reactor.id}" data-action="set-reactor-environment" data-reactor-id="${reactor.id}">${REACTOR_ENVIRONMENTS.map((item) => `<option value="${item.id}" ${item.id === reactor.environment ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></div><div class="reactor-slot-list">${reactor.slots.map((speciesId, slot) => speciesSelectMarkup(reactor, slot, speciesId)).join("")}</div><div class="reactor-card-actions"><button class="game-button primary" data-action="harvest-reactor" data-reactor-id="${reactor.id}" type="button">harvest · +${money(stored * BIOMASS_TO_CREDITS)}</button><button class="text-button" data-action="upgrade-reactor" data-reactor-id="${reactor.id}" type="button">upgrade · ${money(reactorUpgradeCost(reactor))}</button></div></article>`;
}

function reactorsView() {
  const totalRate = calculateTotalRate(state, now()); const totalStored = state.reactors.reduce((sum, reactor) => sum + reactor.stored, 0);
  const nextTier = REACTOR_TIERS.find((tier) => tier.cost > 0 && !state.reactors.some((reactor) => reactor.tier === tier.id));
  return `<section class="view-heading split-heading"><div><span class="eyebrow">photobioreactor hall · passive income</span><h1>Let patience become <em>production.</em></h1><p>Assign discovered strains to compatible vessels. The best reactor is the one whose growth rhythm fits the room.</p></div><div class="income-banner"><span>EST. LAB INCOME</span><b>${money(totalRate)} biomass / sec</b><small>≈ ${money(totalRate * BIOMASS_TO_CREDITS * 60)} credits / min</small></div></section><div class="reactor-summary"><div><span>stored biomass</span><b>${money(totalStored)}</b><small>+${money(totalStored * BIOMASS_TO_CREDITS)} ready to harvest</small></div><div><span>cultivation rooms</span><b>${state.reactors.length}</b><small>of ${REACTOR_TIERS.length} vessel tiers</small></div><div><span>lifetime harvested</span><b>${money(state.biomassHarvested)}</b><small>patience is the engine</small></div><button class="game-button primary" data-action="harvest-all" type="button">harvest all · +${money(totalStored * BIOMASS_TO_CREDITS)}</button></div><div class="reactor-grid">${state.reactors.map(reactorCard).join("")}</div><section class="purchase-section"><div class="section-title"><div><span class="eyebrow">expand the cultivation hall</span><h2>Vessel tiers</h2></div><span class="quiet-note">one of each tier · upgrade levels add nuance</span></div><div class="tier-grid">${REACTOR_TIERS.map((tier) => { const owned = state.reactors.find((reactor) => reactor.tier === tier.id); const locked = unlockedResearchForUi() < tier.unlockResearch; return `<article class="tier-card ${owned ? "is-owned" : ""}"><span class="tier-icon">${tier.icon}</span><div><span class="eyebrow">${tier.unlockResearch ? `research ${tier.unlockResearch}` : "starter vessel"}</span><h3>${escapeHtml(tier.name)}</h3><p>${escapeHtml(tier.description)}</p><small>${tier.slots} slots · ${tier.capacity.toLocaleString()} capacity · ${tier.rate.toFixed(2)}× flow</small></div><button class="game-button ${!owned && !locked ? "primary" : ""}" data-action="buy-reactor" data-tier-id="${tier.id}" type="button" ${owned || locked || tier.cost <= 0 ? "disabled" : ""}>${owned ? "commissioned" : locked ? `research ${tier.unlockResearch}` : `${money(tier.cost)} credits`}</button></article>`; }).join("")}</div>${nextTier ? `<p class="unit-note">Next milestone: ${escapeHtml(nextTier.name)} · ${money(nextTier.cost)} credits and research ${nextTier.unlockResearch}.</p>` : ""}</section>`;
}

function unlockedResearchForUi() { return unlockedResearch(state); }

function collectionView() {
  const discovered = state.discovered.length; const counts = Object.fromEntries(state.discovered.map((id) => [id, state.collection[id]?.count || 1]));
  return `<section class="view-heading"><div><span class="eyebrow">living archive · ${discovered}/${SPECIES.length} records</span><h1>Every discovery leaves a <em>trace.</em></h1><p>Real genera are labeled as reference organisms; fictional strains and all economic effects belong to this synthetic game.</p></div><div class="archive-stamp"><b>${discovered}</b><span>records<br>recovered</span></div></section><div class="rarity-guide">${RARITIES.map((rarity) => `<span style="--rarity-color:${rarity.color}"><i></i>${stars(rarity.id)} ${rarity.label}</span>`).join("")}</div><section class="species-grid">${SPECIES.map((species) => { const found = state.discovered.includes(species.id); const rarity = rarityInfo(species.rarity); const record = state.collection[species.id]; return `<article class="species-card ${found ? "is-found" : "is-hidden"}" style="--species-color:${species.color};--rarity-color:${rarity.color}"><div class="species-portrait"><span>${found ? species.short.slice(0, 1) : "?"}</span><i></i><b>${found ? stars(species.rarity) : "?????"}</b></div><div class="species-card-copy"><span class="eyebrow">${found ? (species.scientific ? "reference organism · synthetic model" : "fictional strain · game model") : "incomplete record"}</span><h2>${found ? escapeHtml(species.name) : "Undiscovered lineage"}</h2><p>${found ? escapeHtml(species.lore) : "The archive has a silhouette and a few quiet notes, but no verified entry yet."}</p><div class="species-facts"><span>${found ? `base ${money(species.baseRate * BIOMASS_TO_CREDITS)}/min` : "rate unknown"}</span><span>${found ? `${counts[species.id]} samples · ${record?.variants || 0} variants` : "survey a matching biome"}</span></div></div>${found ? `<span class="rarity-badge">${rarity.label}</span>` : `<span class="silhouette-badge">LOCKED</span>`}</article>`; }).join("")}</section>`;
}

function researchView() {
  const branches = ["discovery", "cultivation", "research", "automation", "infrastructure"];
  const names = { discovery: "Discovery craft", cultivation: "Cultivation craft", research: "Research craft", automation: "Quiet automation", infrastructure: "Laboratory infrastructure" };
  return `<section class="view-heading split-heading"><div><span class="eyebrow">research tree · meaningful choices</span><h1>Build the laboratory <em>you want to keep.</em></h1><p>Spend credits on capability, not an endless ladder of identical percentages. Your specialization changes the mood and cadence of the lab.</p></div><div class="research-meter"><span>RESEARCH INDEX</span><b>${unlockedResearchForUi()}</b><small>field notes, optics &amp; infrastructure</small></div></section>${branches.map((branch) => `<section class="research-branch"><div class="branch-heading"><div><span class="branch-mark">${branch.slice(0, 1).toUpperCase()}</span><div><span class="eyebrow">${branch}</span><h2>${names[branch]}</h2></div></div><small>${UPGRADES.filter((item) => item.branch === branch).reduce((sum, item) => sum + upgradeLevel(state, item.id), 0)} nodes active</small></div><div class="upgrade-grid">${UPGRADES.filter((item) => item.branch === branch).map((upgrade) => { const level = upgradeLevel(state, upgrade.id); const maxed = level >= upgrade.max; const cost = Math.round(upgrade.cost * 1.72 ** level); return `<article class="upgrade-card ${level ? "is-active" : ""}" data-upgrade-id="${upgrade.id}"><div class="upgrade-icon">${upgrade.icon}</div><div><span class="eyebrow">${branch} · ${level}/${upgrade.max}</span><h3>${escapeHtml(upgrade.name)}</h3><p>${escapeHtml(upgrade.description)}</p><small>${escapeHtml(upgrade.effect)}</small></div><button class="game-button ${!maxed && state.credits >= cost ? "primary" : ""}" data-action="buy-upgrade" data-upgrade-id="${upgrade.id}" type="button" ${maxed || state.credits < cost ? "disabled" : ""}>${maxed ? "complete" : `${money(cost)} credits`}</button></article>`; }).join("")}</div></section>`).join("")}<div class="note-strip"><span class="signal-dot"></span><p><b>Suggestion:</b> Discovery upgrades improve the odds of an unusual archive; cultivation upgrades make patient reactor assignments more rewarding. There is no single correct laboratory.</p></div>`;
}

function settingsView() {
  return `<section class="view-heading"><div><span class="eyebrow">lab settings · local first</span><h1>Make the room <em>yours.</em></h1><p>Progress stays in this browser. Export a copy before clearing the room, or restore a valid BioRealm save.</p></div></section><section class="settings-grid"><article class="settings-card"><div class="section-title compact"><div><span class="eyebrow">sensory controls</span><h2>Atmosphere</h2></div></div><label class="toggle-row"><span><b>Laboratory soundtrack</b><small>Procedural ambient music changes with each biome.</small></span><input type="checkbox" data-setting="music" ${state.settings.music ? "checked" : ""}><i></i></label><label class="toggle-row"><span><b>Research sound effects</b><small>Soft tones for catches, purchases and discoveries.</small></span><input type="checkbox" data-setting="sfx" ${state.settings.sfx ? "checked" : ""}><i></i></label><label class="toggle-row"><span><b>Reduced motion</b><small>Keep the laboratory calm and limit decorative movement.</small></span><input type="checkbox" data-setting="reducedMotion" ${state.settings.reducedMotion ? "checked" : ""}><i></i></label></article><article class="settings-card"><div class="section-title compact"><div><span class="eyebrow">save management</span><h2>Keep your research</h2></div><span class="save-status">${SAVE_KEY}</span></div><div class="settings-actions"><button class="game-button primary" data-action="export-save" type="button">export save</button><label class="file-button">import save<input id="importSave" type="file" accept="application/json,.json"></label><button class="game-button danger" data-action="reset-save" type="button">clear laboratory</button></div><p class="unit-note">The save includes a reproducible world seed, discovered species, device state, reactor timestamps and preferences. It never connects to a server.</p></article></section><section class="note-strip"><span class="signal-dot"></span><p><b>Synthetic boundary:</b> BioRealm uses reference organism names for atmosphere and context only. It does not measure, identify, control, or recommend real cultivation conditions.</p></section>`;
}

function renderView() {
  settleProduction(state, now()); tickExpeditions(state, now());
  const templates = { lab: labView, expedition: expeditionView, reactors: reactorsView, collection: collectionView, research: researchView, settings: settingsView };
  refs.view.innerHTML = templates[activeView](); refs.objective = $("#objectiveCard");
  if (activeView === "collection") $$(".species-portrait", refs.view).forEach((portrait, index) => { portrait.innerHTML = speciesPortrait(SPECIES[index], state.discovered.includes(SPECIES[index].id)); });
  if (activeView === "settings") {
    const card = refs.view.querySelector(".settings-card");
    card?.querySelector(".toggle-row")?.insertAdjacentHTML("afterend", `<label class="volume-row"><span>music volume</span><input type="range" min="0" max="1" step="0.01" value="${state.settings.musicVolume ?? .38}" data-setting="musicVolume"><output>${Math.round((state.settings.musicVolume ?? .38) * 100)}%</output></label>`);
    card?.querySelector("[data-setting='sfx']")?.closest(".toggle-row")?.insertAdjacentHTML("afterend", `<label class="volume-row"><span>sound effects</span><input type="range" min="0" max="1" step="0.01" value="${state.settings.sfxVolume ?? .55}" data-setting="sfxVolume"><output>${Math.round((state.settings.sfxVolume ?? .55) * 100)}%</output></label>`);
    card?.querySelector("[data-setting='reducedMotion']")?.closest(".toggle-row")?.insertAdjacentHTML("afterend", `<label class="toggle-row"><span><b>Mute all audio</b><small>Keep the visual room while silencing music and effects.</small></span><input type="checkbox" data-setting="muted" ${state.settings.muted ? "checked" : ""}><i></i></label><label class="toggle-row"><span><b>Ambient visual effects</b><small>Disable decorative particles without disabling the scene.</small></span><input type="checkbox" data-setting="effects" ${state.settings.effects !== false ? "checked" : ""}><i></i></label>`);
  }
  $$("[data-action='go-view']").forEach((item) => item.addEventListener("click", () => setView(item.dataset.view)));
}

function updateHeader() {
  const totalRate = calculateTotalRate(state, now()); const stored = state.reactors.reduce((sum, reactor) => sum + reactor.stored, 0);
  refs.credits.textContent = money(state.credits); refs.rate.textContent = `${money(totalRate * BIOMASS_TO_CREDITS * 60)} / min`; refs.biomass.textContent = money(stored); refs.archive.textContent = `${state.discovered.length}/${SPECIES.length}`;
  const event = currentEvent(); refs.event.textContent = event.name; refs.ambience.textContent = `${biomeInfo(state.activeBiome).name} · ${event.name}`;
  if (refs.objective) refs.objective.innerHTML = objectiveMarkup();
}

function setView(view) {
  if (!Object.prototype.hasOwnProperty.call({ lab: 1, expedition: 1, reactors: 1, collection: 1, research: 1, settings: 1 }, view)) return;
  activeView = view; selectedDevice = view === "expedition" ? selectedDevice : selectedDevice; $$(".side-nav-button").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  renderView(); renderScene();
  if (view === "expedition") audio.setBiome(selectedBiome);
}

function saveAndRefresh(message, tone = "normal") { saveState(window.localStorage, state, now()); renderView(); updateHeader(); renderScene(); if (message) announce(message, tone); }

function handleAction(action, element) {
  const id = element.dataset;
  if (action === "go-view") return setView(id.view);
  if (action === "qa-fast-forward") { tick(state, now() + 60_000); renderView(); updateHeader(); renderScene(); return; }
  if (action === "claim-grant") { const result = claimGrant(state); if (actionResult(result, "The field grant is in the account. Choose your first instrument when you are ready.", {})) { audio.sfx("buy"); saveAndRefresh(); } return; }
  if (action === "close-reveal") { refs.modal.hidden = true; return; }
  if (action === "select-device") { selectedDevice = id.deviceId; renderView(); return; }
  if (action === "inspect-device") { selectedDevice = id.deviceId; setView("expedition"); announce("Instrument selected. Choose a field site when the room is ready."); return; }
  if (action === "select-biome") { if (!state.unlockedBiomes.includes(id.biomeId)) { const result = unlockBiome(state, id.biomeId); if (!actionResult(result, `${biomeInfo(id.biomeId).name} opened in the field atlas.`, { })) return; } selectedBiome = id.biomeId; state.activeBiome = id.biomeId; audio.setBiome(id.biomeId); saveAndRefresh(); return; }
  if (action === "buy-device") { const result = buyDevice(state, id.deviceType); if (actionResult(result, `${byId.device(id.deviceType).name} is ready for rack installation.`, {})) { selectedDevice = result.device.id; saveAndRefresh(); } return; }
  if (action === "upgrade-device") { const result = upgradeDevice(state, id.deviceId); if (actionResult(result, "Discovery device tuned. Its next survey will be more discerning.", {})) saveAndRefresh(); return; }
  if (action === "start-expedition") { const result = startExpedition(state, id.deviceId, id.biomeId, now()); if (actionResult(result, `${byId.device(id.deviceId)?.name || "Device"} has begun a ${biomeInfo(id.biomeId).name} survey.`, {})) saveAndRefresh(); return; }
  if (action === "collect-expedition") { const result = collectExpedition(state, id.deviceId, now()); if (actionResult(result, "Discovery secured in the living archive.", { reveal: true })) saveAndRefresh(); return; }
  if (action === "harvest-all") { const credits = harvestAll(state, now()); if (credits > 0) { audio.sfx("harvest"); saveAndRefresh(`The cultivation hall yielded ${money(credits)} credits.`, "success"); } else announce("The reactors are still gathering a little more biomass.", "warn"); return; }
  if (action === "select-reactor") { state.selectedReactor = id.reactorId; setView("reactors"); return; }
  if (action === "harvest-reactor") { const result = harvestReactor(state, id.reactorId, now()); if (result.ok) { audio.sfx("harvest"); saveAndRefresh(`Harvested ${money(result.credits)} credits from the cultivation room.`, "success"); } else announce("That vessel has no stored biomass yet.", "warn"); return; }
  if (action === "upgrade-reactor") { const result = upgradeReactor(state, id.reactorId); if (actionResult(result, "Cultivation efficiency improved. The glass responds with a softer glow.", {})) saveAndRefresh(); return; }
  if (action === "assign-species") { const result = assignSpecies(state, id.reactorId, Number(id.slot), id.speciesId); if (actionResult(result, `${speciesInfo(id.speciesId).short} transferred into the selected vessel.`, {})) saveAndRefresh(); return; }
  if (action === "clear-slot") { const result = clearReactorSlot(state, id.reactorId, Number(id.slot)); if (result.ok) saveAndRefresh("The vessel is ready for a different strain."); return; }
  if (action === "set-reactor-environment") { const result = setReactorEnvironment(state, id.reactorId, element.value); if (actionResult(result, "Cultivation environment shifted; the next production estimate reflects the new room.", {})) saveAndRefresh(); return; }
  if (action === "buy-reactor") { const result = buyReactor(state, id.tierId); if (actionResult(result, `${reactorInfo(id.tierId).name} commissioned in the cultivation hall.`, {})) saveAndRefresh(); return; }
  if (action === "buy-upgrade") { const result = buyUpgrade(state, id.upgradeId); if (actionResult(result, `${byId.upgrade(id.upgradeId).name} is now part of the laboratory rhythm.`, {})) saveAndRefresh(); return; }
  if (action === "export-save") { exportSave(); return; }
  if (action === "reset-save") { if (window.confirm("Clear this local BioRealm laboratory and begin again?")) { state = createInitialState(); saveState(window.localStorage, state, now()); selectedDevice = null; selectedBiome = state.activeBiome; setView("lab"); announce("A new North Window laboratory is ready.", "success"); } return; }
}

function exportSave() {
  const payload = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(payload); link.download = `orr-biorealm-${state.seed}.json`; link.click(); URL.revokeObjectURL(link.href); announce("A portable copy of the laboratory was prepared.", "success");
}

async function importSave(file) {
  try {
    const restored = parseState(await file.text(), now());
    state = restored; selectedDevice = state.devices.find((device) => device.status === "ready")?.id || state.devices.find((device) => device.rackId)?.id || null; selectedBiome = state.activeBiome; saveState(window.localStorage, state, now()); setView("lab"); announce("The laboratory record was restored.", "success");
  } catch (error) { announce(error?.message || "That save could not be read safely.", "warn"); }
}

function renderScene() {
  scene?.destroy?.(); scene = null;
  const canvas = activeView === "lab" ? $("#sceneCanvasInner") : activeView === "expedition" ? $("#fieldCanvas") : null;
  if (!canvas) return;
  const sceneId = activeView === "lab" ? "lab" : selectedBiome;
  scene = createScene(canvas, { onSelect: (hit) => { if (hit.type === "device") { selectedDevice = hit.deviceId; setView("expedition"); } else if (hit.type === "reactor") setView("reactors"); } });
  scene.update(state, sceneId, state.settings);
  scene.draw(performance.now());
}

function drawLoop(time) {
  if (scene) scene.draw(time);
  frameHandle = window.requestAnimationFrame(drawLoop);
}

function initializeAudio() {
  audio.start(); audio.setSettings(state.settings); audio.setBiome(activeView === "expedition" ? selectedBiome : "lab");
}

function wire() {
  refs.nav.addEventListener("click", (event) => {
    const target = event.target.closest("[data-view]"); if (!target) return; event.preventDefault(); initializeAudio(); setView(target.dataset.view);
  });
  refs.app.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]"); if (!target) return; initializeAudio(); handleAction(target.dataset.action, target);
  });
  refs.app.addEventListener("change", (event) => {
    const action = event.target.dataset.action;
    if (action === "set-reactor-environment") { initializeAudio(); handleAction(action, event.target); return; }
    const setting = event.target.dataset.setting;
    if (setting) { state.settings[setting] = event.target.type === "range" ? clamp(Number(event.target.value), 0, 1) : event.target.checked; audio.setSettings(state.settings); saveState(window.localStorage, state, now()); renderView(); updateHeader(); renderScene(); announce(`${setting === "reducedMotion" ? "Motion" : setting === "music" ? "Music" : setting === "sfx" ? "Sound effects" : "Volume"} preference saved.`); return; }
    if (event.target.id === "importSave" && event.target.files?.[0]) importSave(event.target.files[0]);
  });
  refs.modal.addEventListener("click", (event) => { const button = event.target.closest("[data-action]"); if (button) handleAction(button.dataset.action, button); });
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && !refs.modal.hidden) refs.modal.hidden = true; if (event.key.toLowerCase() === "m") { state.settings.music = !state.settings.music; audio.setSettings(state.settings); saveState(window.localStorage, state, now()); } });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { saveState(window.localStorage, state, now()); audio.suspend(); } else { applyOffline(state, now()); saveState(window.localStorage, state, now()); audio.start(); renderView(); updateHeader(); renderScene(); } });
  if (!new URLSearchParams(window.location.search).has("qa")) window.addEventListener("beforeunload", () => { saveState(window.localStorage, state, now()); audio.destroy(); window.cancelAnimationFrame(frameHandle); });
}

function boot() {
  applyOffline(state, now());
  if (migrated) saveState(window.localStorage, state, now());
  renderView(); updateHeader(); renderScene(); wire();
  window.setInterval(() => { if (new URLSearchParams(window.location.search).has("qa")) return; tick(state, now()); saveState(window.localStorage, state, now()); updateHeader(); if (activeView === "lab" || activeView === "expedition") renderView(); renderScene(); }, 1000);
  frameHandle = window.requestAnimationFrame(drawLoop);
  window.__biorealm = { get state() { return state; }, setView, engine: { tick, calculateTotalRate }, scene: () => scene?.metrics?.(), audio: () => audio.metrics?.() };
  if (new URLSearchParams(window.location.search).has("qa")) window.__biorealmTestTick = (timestamp) => { tick(state, timestamp); renderView(); updateHeader(); renderScene(); };
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
