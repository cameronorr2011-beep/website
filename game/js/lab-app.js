import {
  MODEL_ASSUMPTIONS,
  SCENARIOS,
  STEP_SECONDS,
  advanceWorkflow,
  applyScenario,
  calibrateSensors,
  createLabState,
  explain,
  metrics,
  parseState,
  recordExperiment,
  report,
  runCompleteWorkflow,
  runSelfTest,
  selectCell,
  serializeState,
  setCyanoflowParameter,
  setSelectionCriteria,
  setParameter,
  startCultivation,
  step,
  transferSelected,
} from "./lab-engine.js";
import { downloadState, downloadText, loadState, saveState, storageAvailable } from "./lab-store.js";
import { createLabRenderer } from "./lab3d.js";
import { SENSOR_DEFINITIONS, createMockSensorProvider } from "./lab-providers.js";
import { createDevicePanel } from "./lab-device.js";
import { createLabAudio } from "./lab-audio.js";
import {
  ENVIRONMENTS,
  advanceAutonomy,
  advanceTime,
  cleanProbe,
  collectSample,
  createExpeditionState,
  deployExpedition,
  findNearestHotspot,
  getExpeditionSummary,
  getHotspot,
  moveProbe,
  recoverProbe,
  scan,
  serializeState as serializeExpeditionState,
  setAutonomy,
} from "./expedition-engine.js";
import { backendStatus, checkBackend, saveBackendState } from "./game-backend.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
const format = (value, digits = 2) => Number(value || 0).toFixed(digits);
const titleCase = (value) => String(value || "").replace(/(^|[-_ ])([a-z])/g, (_, start, char) => start + char.toUpperCase());

const stageOrder = ["sample", "prepared", "flowing", "analyzed", "isolated", "transferred"];
const stageLabels = { sample: "Collected", prepared: "Prepared", flowing: "In chip", analyzed: "Analyzed", isolated: "Isolated", transferred: "Transferred", complete: "Complete" };
const parameterDefinitions = [
  ["lightPpfd", "Wall light", 0, 900, 1, "µmol m⁻² s⁻¹", 0],
  ["photoperiodHours", "Photoperiod", 2, 24, 1, "h light / day", 0],
  ["temperatureC", "Temperature", 10, 45, .1, "°C", 1],
  ["ph", "pH", 6, 12, .1, "pH", 1],
  ["dissolvedOxygenPct", "Dissolved oxygen", 20, 220, 1, "% saturation", 0],
  ["carbonG_L", "Available carbon", .05, 12, .05, "g/L", 2],
  ["nitrogenMgL", "Available nitrogen", 0, 900, 1, "mg/L", 0],
  ["mixingPct", "Mixing", 0, 100, 1, "%", 0],
  ["aerationPct", "Aeration", 0, 100, 1, "%", 0],
];
const chipDefinitions = [
  ["flowRateUlMin", "Flow rate", 5, 180, 1, "µL/min"],
  ["channelWidthUm", "Channel width", 50, 600, 1, "µm"],
  ["channelLengthMm", "Channel length", 3, 40, 1, "mm"],
  ["dropletDiameterUm", "Droplet diameter", 35, 180, 1, "µm"],
  ["inputConcentrationCellsMl", "Input concentration", 1000, 250000, 1000, "cells/mL"],
];
const criteriaDefinitions = [
  ["minScore", "Minimum proxy score", 0, 1, .01, "score", 2],
  ["minViability", "Minimum viability", 0, 1, .01, "fraction", 2],
];

let state = loadState() || createLabState("ORR-ALGAE-001");
let hasSavedExpedition = Boolean(state.expedition?.format === "orr-biologicals-expedition");
if (!hasSavedExpedition) state.expedition = createExpeditionState("ORR-EXPEDITION-001", "freshwater");
let renderer = null;
let mode = hasSavedExpedition ? (state.sim.mode || "overview") : "expedition";
state.sim.mode = mode;
if (mode === "expedition") state.sim.camera = "expedition";
let lastUiPaint = 0;
let lastFrame = performance.now();
let simAccumulator = 0;
let toastTimer = null;
let lastQuality = "high";
const mockSensorProvider = createMockSensorProvider();
const devicePanel = createDevicePanel($("#workspaceContent"));
const audio = createLabAudio();

const refs = {
  canvas: $("#labCanvas"),
  content: $("#workspaceContent"),
  sceneLoading: $("#sceneLoading"),
  sceneStatus: $("#sceneStatus"),
  sceneHint: $("#sceneHint"),
  runToggle: $("#runToggle"),
  stepRun: $("#stepRun"),
  resetRun: $("#resetRun"),
  newSeed: $("#newSeed"),
  applySeed: $("#applySeed"),
  seedInput: $("#seedInput"),
  seedLabel: $("#seedLabel"),
  speedSelect: $("#speedSelect"),
  scenarioSelect: $("#scenarioSelect"),
  saveLocal: $("#saveLocal"),
  exportState: $("#exportState"),
  exportReport: $("#exportReport"),
  importState: $("#importState"),
  importFile: $("#importFile"),
  saveState: $("#saveState"),
  clockState: $("#clockState"),
  clockReadout: $("#clockReadout"),
  viewEyebrow: $("#viewEyebrow"),
  viewTitle: $("#viewTitle"),
  toast: $("#toast"),
  soundToggle: $("#soundToggle"),
  metricHealth: $("#metricHealth"),
  metricHealthNote: $("#metricHealthNote"),
  metricBiomass: $("#metricBiomass"),
  metricBiomassNote: $("#metricBiomassNote"),
  metricGrowth: $("#metricGrowth"),
  metricGrowthNote: $("#metricGrowthNote"),
  metricPipeline: $("#metricPipeline"),
  metricPipelineNote: $("#metricPipelineNote"),
  metricHealthLabel: $("#metricHealthLabel"),
  metricBiomassLabel: $("#metricBiomassLabel"),
  metricGrowthLabel: $("#metricGrowthLabel"),
  metricPipelineLabel: $("#metricPipelineLabel"),
  backendStatus: $("#backendStatus"),
  legendPrimaryDot: $("#legendPrimaryDot"),
  legendSecondaryDot: $("#legendSecondaryDot"),
  legendPrimary: $("#legendPrimary"),
  legendSecondary: $("#legendSecondary"),
  legendAccent: $("#legendAccent"),
};

function clockLabel(seconds) {
  const day = Math.floor(seconds / 86400);
  const remainder = Math.floor(seconds % 86400);
  const hours = Math.floor(remainder / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((remainder % 3600) / 60).toString().padStart(2, "0");
  return `Day ${day} · ${hours}:${minutes}`;
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => refs.toast.classList.remove("is-visible"), 3000);
}

function currentCell() {
  return state.cyano.cells.find((cell) => cell.id === state.cyano.selectedCellId) || null;
}

function expeditionState() {
  if (state.expedition?.format !== "orr-biologicals-expedition") {
    state.expedition = createExpeditionState("ORR-EXPEDITION-001", "freshwater");
  }
  return state.expedition;
}

function selectedHotspot() {
  const expedition = expeditionState();
  return getHotspot(expedition, expedition.selectedHotspotId) || findNearestHotspot(expedition);
}

function selectedExpeditionSample() {
  const expedition = expeditionState();
  return expedition.samples.find((sample) => sample.id === expedition.activeSampleId) || expedition.samples.at(-1) || null;
}

function expeditionTelemetryMarkup(hotspot) {
  if (!hotspot?.telemetry?.observed) return `<div class="empty-state">Move within scan range to expose an environmental telemetry record.</div>`;
  const readings = hotspot.telemetry.observed;
  const values = [
    ["Temperature", readings.temperatureC, "°C"],
    ["pH", readings.ph, "pH"],
    ["Light", readings.lightUmolM2S, "µmol m⁻² s⁻¹"],
    ["Salinity", readings.salinityPsu, "PSU"],
    ["O₂", readings.dissolvedOxygenPct, "% sat."],
    ["Turbidity", readings.turbidityNTU, "NTU"],
  ];
  return `<div class="sensor-grid expedition-sensor-grid">${values.map(([label, value, unit]) => `<div class="sensor-item"><span>${label}</span><strong>${value === null ? "—" : format(value, label === "Light" ? 0 : 1)}</strong><small>${unit} · observed in synthetic model</small></div>`).join("")}</div>`;
}

function expeditionActionLabel(expedition) {
  if (expedition.status === "recovered") return "Probe recovered";
  if (expedition.status === "depleted") return "Energy depleted";
  return titleCase(expedition.autonomy.mode || "manual");
}

function expeditionDistanceToHotspot(expedition, hotspot) {
  if (!hotspot) return null;
  return Math.hypot(
    expedition.probe.position.x - hotspot.position.x,
    expedition.probe.position.y - hotspot.position.y,
    expedition.probe.position.z - hotspot.position.z,
  );
}

function stageMarkup() {
  const activeIndex = state.cyano.stage === "complete" ? stageOrder.length - 1 : Math.max(0, stageOrder.indexOf(state.cyano.stage));
  return `<div class="stage-row">${stageOrder.map((stage, index) => `<div class="stage-node ${index < activeIndex ? "is-done" : ""} ${index === activeIndex ? "is-current" : ""}"><b>${String(index + 1).padStart(2, "0")}</b><small>${stageLabels[stage]}</small></div>`).join("")}</div>`;
}

function metricBar(value, max = 1) {
  return `<i><b style="width:${Math.round(Math.max(0, Math.min(1, value / max)) * 100)}%"></b></i>`;
}

function chartMarkup() {
  const values = state.algae.measurements.slice(-32);
  const max = Math.max(...values.map((item) => item.biomassG), state.algae.initialBiomassG, 1e-6);
  return `<div class="bar-chart" aria-label="Synthetic biomass history">${values.map((item) => `<span title="Day ${format(item.timeHours / 24, 2)} · ${format(item.biomassG, 3)} g" style="height:${Math.max(3, Math.round(item.biomassG / max * 100))}%"></span>`).join("")}</div><div class="chart-axis"><span>start</span><span>${format(state.sim.clock / 3600, 1)} h synthetic time</span><span>now</span></div>`;
}

function sensorMarkup() {
  const readings = mockSensorProvider.read(state);
  const definitionByKey = Object.fromEntries(SENSOR_DEFINITIONS.map((item) => [item.key, item]));
  return `<div class="sensor-grid">${readings.map((reading) => {
    const definition = definitionByKey[reading.key] || reading;
    return `<div class="sensor-item"><span>${escapeHtml(definition.label)}</span><strong>${format(reading.value, reading.key === "turbidityAU" || reading.key === "carbonG_L" ? 3 : 1)}</strong><small>${escapeHtml(reading.unit)} · ${escapeHtml(reading.provenance)}</small></div>`;
  }).join("")}</div>`;
}

function comparisonMarkup() {
  if (!state.experiments.length) return `<div class="empty-state">Capture two or more runs to compare final biomass and health. All values remain synthetic.</div>`;
  const max = Math.max(...state.experiments.map((item) => item.results.finalBiomassG), 1e-6);
  return `<div class="comparison-list">${state.experiments.slice(-6).map((item) => `<div class="comparison-row"><div><b>${escapeHtml(item.label || item.id)}</b><small>${escapeHtml(item.scenario)} · ${escapeHtml(item.candidateId || "baseline")}</small></div><i><b style="width:${Math.round(item.results.finalBiomassG / max * 100)}%"></b></i><strong>${format(item.results.finalBiomassG, 3)} g</strong></div>`).join("")}</div>`;
}

function analysisMarkup() {
  const insight = explain(state);
  return `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Model readout</span><h3>What the current state suggests.</h3></div><span class="badge">LOCAL</span></div><p>${escapeHtml(insight.summary)}</p><div class="analysis-grid"><div><span class="mini-label">Supporting factors</span><ul class="support-list">${insight.supportingMeasurements.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div><div><span class="mini-label">Suggested comparisons</span><ul class="support-list">${insight.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div></div></div>`;
}

function renderMetrics() {
  const expedition = expeditionState();
  if (mode === "expedition") {
    const summary = getExpeditionSummary(expedition);
    const statusLabel = expeditionActionLabel(expedition);
    refs.metricHealthLabel.textContent = "Probe state";
    refs.metricBiomassLabel.textContent = "Energy reserve";
    refs.metricGrowthLabel.textContent = "Depth";
    refs.metricPipelineLabel.textContent = "Samples";
    refs.metricHealth.textContent = statusLabel;
    refs.metricHealth.className = expedition.status === "depleted" ? "health-critical" : expedition.probe.condition < .55 ? "health-stressed" : "health-healthy";
    refs.metricHealthNote.textContent = `${Math.round(expedition.probe.condition * 100)}% condition · ${Math.round(expedition.probe.fouling * 100)}% fouling`;
    refs.metricBiomass.textContent = `${Math.round(summary.probe.energy)}%`;
    refs.metricBiomassNote.textContent = `${format(summary.probe.energy, 1)} energy units · ${expedition.environment.label}`;
    refs.metricGrowth.textContent = `${format(summary.probe.depthM, 1)} m`;
    refs.metricGrowthNote.textContent = `${expedition.environment.type} · ${expedition.world.dimensions.maxDepthM} m limit`;
    refs.metricPipeline.textContent = `${summary.probe.samples}/${summary.probe.sampleCapacity}`;
    refs.metricPipelineNote.textContent = `${summary.counts.scans} scans · ${summary.counts.detections} detections`;
  } else {
    refs.metricHealthLabel.textContent = "Culture health";
    refs.metricBiomassLabel.textContent = "Biomass";
    refs.metricGrowthLabel.textContent = "Growth rate";
    refs.metricPipelineLabel.textContent = "Pipeline";
    const m = metrics(state);
    refs.metricHealth.textContent = titleCase(m.health);
    refs.metricHealth.className = m.health === "critical" ? "health-critical" : m.health === "stressed" ? "health-stressed" : "health-healthy";
    refs.metricHealthNote.textContent = `${Math.round((1 - m.stressIndex) * 100)}% productive model state`;
    refs.metricBiomass.textContent = `${format(m.biomassG, 2)} g`;
    refs.metricBiomassNote.textContent = `${format(m.biomassConcG_L, 4)} g/L · ${m.timeHours} h`;
    refs.metricGrowth.textContent = `${format(m.growthRatePerDay, 3)} / day`;
    refs.metricGrowthNote.textContent = `${titleCase(m.health)} · synthetic model`;
    refs.metricPipeline.textContent = stageLabels[m.stage] || titleCase(m.stage);
    refs.metricPipelineNote.textContent = `${m.cellsIsolated || 0} isolated · ${m.cellsEligible || 0} eligible · ${m.modeledLosses || 0} losses`;
  }
  refs.clockReadout.textContent = clockLabel(state.sim.clock);
  refs.clockState.textContent = state.sim.running ? "RUNNING" : "PAUSED";
  refs.clockState.classList.toggle("is-running", state.sim.running);
  refs.runToggle.textContent = state.sim.running ? "Pause run" : "Start run";
  refs.runToggle.classList.toggle("primary", !state.sim.running);
  refs.speedSelect.value = String(state.sim.speed);
  refs.seedInput.value = state.seed;
  refs.seedLabel.textContent = state.seed;
  refs.scenarioSelect.value = state.algae.scenario;
  refs.saveState.textContent = state.savedAt ? "SAVED" : "NOT SAVED";
  refs.backendStatus.textContent = backendStatus().configured ? "dev backend configured" : "local browser record";
}

function renderExpedition() {
  const expedition = expeditionState();
  const summary = getExpeditionSummary(expedition);
  const hotspot = selectedHotspot();
  const config = ENVIRONMENTS[expedition.environmentType];
  const recentEvents = expedition.events.slice(-7).reverse();
  const recentSamples = expedition.samples.slice(-5).reverse();
  const scanResult = expedition.scans.at(-1);
  const detectedTarget = expedition.detections.find((detection) => detection.id === expedition.selectedDetectionId) || scanResult?.detections?.[0];
  const environmentOptions = Object.entries(ENVIRONMENTS).map(([key, value]) => `<option value="${key}" ${key === expedition.environmentType ? "selected" : ""}>${escapeHtml(value.label)} · ${value.maxDepthM} m</option>`).join("");
  const hotspots = expedition.world.hotspots.map((item) => {
    const distance = expeditionDistanceToHotspot(expedition, item);
    const selected = item.id === expedition.selectedHotspotId;
    const stateLabel = item.visited ? "scanned" : distance <= config.scanRangeM ? "in range" : "unvisited";
    return `<button class="hotspot-row ${selected ? "is-selected" : ""}" data-expedition-action="select-hotspot" data-hotspot-id="${item.id}" type="button"><span class="hotspot-signal"><i></i><b>${escapeHtml(item.name)}</b><small>${escapeHtml(stateLabel)} · ${format(distance, 0)} m</small></span><span class="hotspot-depth">${format(item.position.z, 1)} m<br><small>${escapeHtml(item.telemetry.inferred.depthBand)}</small></span><span class="hotspot-go" aria-hidden="true">↗</span></button>`;
  }).join("");
  return `<div class="workspace-card expedition-hero-card"><div class="card-heading"><div><span class="eyebrow">PHYCOFRONTIER · deterministic expedition</span><h3>Go where the signal is.</h3><p>Deploy a scientific probe into a reproducible ${escapeHtml(config.label.toLowerCase())} world. Read the environment, choose the next hotspot, and bring uncertain biological candidates back to Cyanoflow.</p></div><span class="badge cyan">${escapeHtml(expedition.environment.label)} · ${escapeHtml(expedition.seed)}</span></div><div class="expedition-config"><div><label class="field-label" for="expeditionEnvironment">Environment</label><select class="field" id="expeditionEnvironment">${environmentOptions}</select></div><div><label class="field-label" for="expeditionSeed">Expedition seed</label><input class="field" id="expeditionSeed" value="${escapeHtml(expedition.seed)}" maxlength="64" spellcheck="false"></div><div class="expedition-config-actions"><button class="action-btn cyan" data-expedition-action="new-expedition" type="button">Deploy new probe</button><button class="action-btn secondary" data-expedition-action="recover" type="button" ${expedition.status === "recovered" ? "disabled" : ""}>Recover now</button></div></div><div class="action-row expedition-actions"><button class="action-btn" data-expedition-action="scan" type="button" ${expedition.status === "recovered" ? "disabled" : ""}>Scan selected hotspot</button><button class="action-btn" data-expedition-action="collect" type="button" ${detectedTarget ? "" : "disabled"}>Collect detected sample</button><button class="action-btn secondary" data-expedition-action="clean" type="button" ${expedition.status === "recovered" ? "disabled" : ""}>Run 12 s clean cycle</button><button class="action-btn secondary" data-expedition-action="autonomy" type="button" ${expedition.status === "recovered" ? "disabled" : ""}>${expedition.autonomy.enabled ? "Pause autonomy" : "Enable autonomy"}</button><button class="action-btn secondary" data-expedition-action="advance" data-seconds="900" type="button">Advance 15 min</button></div><div class="workflow-copy"><span>${escapeHtml(expeditionActionLabel(expedition))} · ${summary.timeSeconds.toFixed(0)} s simulated</span><span>${summary.counts.candidates} persistent candidates · ${summary.counts.samples} samples</span></div></div>
    <div class="two-col expedition-columns"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Spatial field</span><h3>Choose a biological hotspot.</h3><p>The 3D markers are generated from the same seed as this list. Click a marker in the scene or select a row to steer the probe.</p></div><span class="badge">${summary.counts.hotspots} locations</span></div><div class="hotspot-list">${hotspots}</div></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Probe systems</span><h3>${escapeHtml(expedition.probe.id)}</h3></div><span class="badge ${expedition.probe.condition < .55 ? "amber" : ""}">${Math.round(expedition.probe.condition * 100)}% condition</span></div><div class="probe-readouts"><div class="mini-card"><span class="mini-label">Position</span><strong>${format(expedition.probe.position.x, 0)} / ${format(expedition.probe.position.y, 0)}</strong><small>${format(expedition.probe.depthM, 1)} m depth · synthetic world coordinates</small></div><div class="mini-card"><span class="mini-label">Energy</span><strong>${format(expedition.probe.energy, 1)} / ${format(expedition.probe.maxEnergy, 0)}</strong><small>battery reserve · depth and fouling affect cost</small></div><div class="mini-card"><span class="mini-label">Fouling</span><strong>${Math.round(expedition.probe.fouling * 100)}%</strong><small>cleaning consumes energy and restores condition</small></div><div class="mini-card"><span class="mini-label">Autonomy</span><strong>${escapeHtml(titleCase(expedition.autonomy.mode))}</strong><small>${expedition.autonomy.enabled ? "decision loop enabled" : "manual control"}</small></div></div><div class="note warning"><b>Decision boundary.</b> The model can navigate, scan, sample, clean, and recover the fictional probe. It cannot control hardware or infer a real biological identity.</div></div></div>
    <div class="two-col expedition-columns"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Environmental telemetry</span><h3>${hotspot ? escapeHtml(hotspot.name) : "No hotspot selected"}</h3></div><span class="badge amber">OBSERVED / INFERRED</span></div>${expeditionTelemetryMarkup(hotspot)}${hotspot ? `<div class="workflow-copy"><span>${escapeHtml(hotspot.telemetry.inferred.habitat)} · ${escapeHtml(hotspot.telemetry.inferred.depthBand)}</span><span>Suitability ${Math.round(hotspot.telemetry.inferred.samplingSuitability * 100)}% · contamination risk ${Math.round(hotspot.telemetry.inferred.contaminationRisk * 100)}%</span></div>` : ""}</div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Detection queue</span><h3>Unknowns stay uncertain.</h3></div><span class="badge cyan">${expedition.detections.length} detections</span></div>${detectedTarget ? `<div class="detection-card"><div><strong>${escapeHtml(detectedTarget.label)}</strong><span>${escapeHtml(detectedTarget.classification)} · ${escapeHtml(detectedTarget.observed.signalBand)}</span></div><b>${Math.round(detectedTarget.inferred.confidence * 100)}%</b><small>confidence range ${Math.round(detectedTarget.inferred.uncertainty.lower * 100)}–${Math.round(detectedTarget.inferred.uncertainty.upper * 100)}% · scan quality is a model estimate</small></div>` : `<div class="empty-state">No selected detection. Scan a hotspot in range to populate the queue.</div>`}</div></div>
    <div class="two-col expedition-columns"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Sample custody</span><h3>Collected records</h3></div><span class="badge">${summary.probe.samples}/${summary.probe.sampleCapacity}</span></div>${recentSamples.length ? `<div class="sample-list">${recentSamples.map((sample) => `<div class="sample-row"><div><b>${escapeHtml(sample.id)}</b><small>${escapeHtml(sample.label)} · ${escapeHtml(sample.classification)}</small></div><span>${format(sample.observed.sampleVolumeMl, 2)} mL</span><button class="text-btn" data-expedition-action="link-sample" data-sample-id="${sample.id}" type="button">Open Cyanoflow</button></div>`).join("")}</div>` : `<div class="empty-state">No samples collected yet. Scan and sample a hotspot to create the first custody record.</div>`}</div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Operational log</span><h3>Why the probe acted</h3></div><span class="mono">${expedition.events.length} events</span></div><div class="event-list">${recentEvents.length ? recentEvents.map((item) => `<div class="event-row"><time>${item.timeSeconds.toFixed(0)} s</time><p>${escapeHtml(item.message)}<small>${escapeHtml(item.type)}</small></p></div>`).join("") : `<div class="empty-state">No expedition events recorded.</div>`}</div></div></div>
    <div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Research network bridge</span><h3>Keep this expedition reproducible.</h3><p>The browser save is the source of truth for this static deployment. Add <code>?api=http://127.0.0.1:8787</code> to explicitly sync the full record with the optional local JSON backend.</p></div><span class="badge ${backendStatus().configured ? "cyan" : "amber"}">${backendStatus().configured ? "BACKEND CONFIGURED" : "LOCAL ONLY"}</span></div><div class="action-row"><button class="action-btn secondary" data-expedition-action="backend-health" type="button">Check backend</button><button class="action-btn" data-expedition-action="backend-save" type="button">Sync full record</button><button class="action-btn cyan" data-expedition-action="export-expedition" type="button">Export expedition JSON</button></div><p class="unit-note">No network request is made unless an API URL is explicitly configured. The endpoint has no production authentication and is for local development only.</p></div>`;
}

function renderOverview() {
  const scenario = SCENARIOS[state.algae.scenario] || SCENARIOS.baseline;
  const recentEvents = state.events.slice(-8).reverse();
  return `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">End-to-end trace</span><h3>One sample, two research questions.</h3><p>The synthetic sample carries cell identities from collection to microfluidic isolation and, when selected, into an Algaephyte cultivation run.</p></div><span class="badge">${escapeHtml(state.sample.id)}</span></div>${stageMarkup()}<div class="progress-track"><i style="width:${Math.round(stageOrder.indexOf(state.cyano.stage) / (stageOrder.length - 1) * 100)}%"></i></div><div class="workflow-copy"><span>${escapeHtml(stageLabels[state.cyano.stage])}</span><span>${state.cyano.stats.isolated} candidate cells · ${state.cyano.stats.lost} modeled losses</span></div><div class="action-row"><button class="action-btn cyan" data-action="demo-run">Run complete synthetic workflow · 24 h</button><button class="action-btn secondary" data-action="next-stage">Advance one stage</button></div></div>
  <div class="two-col"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Algaephyte · growth trajectory</span><h3>Biomass over synthetic time</h3></div><span class="badge ${state.algae.derived.health === "healthy" ? "" : "amber"}">${titleCase(state.algae.derived.health)}</span></div>${chartMarkup()}<div class="three-col" style="margin-top:14px"><div class="mini-card"><span class="mini-label">pH</span><strong>${format(state.algae.parameters.ph, 2)}</strong><small>alkaline medium</small></div><div class="mini-card"><span class="mini-label">O₂</span><strong>${format(state.algae.parameters.dissolvedOxygenPct, 0)}%</strong><small>synthetic saturation</small></div><div class="mini-card"><span class="mini-label">carbon</span><strong>${format(state.algae.parameters.carbonG_L, 2)}</strong><small>g/L remaining</small></div></div></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Current conditions</span><h3>${escapeHtml(scenario.label)}</h3></div><span class="badge amber">MODEL</span></div><p>${escapeHtml(scenario.description)}</p><div class="factor-list" style="margin-top:16px">${[["Light response", state.algae.derived.lightFactor], ["Temperature", state.algae.derived.temperatureFactor], ["pH response", state.algae.derived.phFactor], ["Nutrient", state.algae.derived.nutrientFactor], ["Carbon", state.algae.derived.carbonFactor], ["Oxygen", state.algae.derived.oxygenFactor]].map(([label, value]) => `<div class="factor-line"><span>${label}</span>${metricBar(value)}<output>${Math.round(value * 100)}%</output></div>`).join("")}</div></div></div>
   <div class="two-col"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Event log</span><h3>What the model has done</h3></div><span class="mono">${state.events.length} events</span></div><div class="event-list">${recentEvents.length ? recentEvents.map((item) => `<div class="event-row"><time>${clockLabel(item.timeSeconds)}</time><p>${escapeHtml(item.message)}<small>${escapeHtml(item.type)}</small></p></div>`).join("") : `<div class="empty-state">No events recorded.</div>`}</div></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Run telemetry</span><h3>Inputs driving the view</h3></div></div><div class="three-col"><div class="mini-card"><span class="mini-label">Temperature</span><strong>${format(state.algae.parameters.temperatureC, 1)}°</strong><small>culture setpoint</small></div><div class="mini-card"><span class="mini-label">Light</span><strong>${format(state.algae.parameters.lightPpfd, 0)}</strong><small>µmol m⁻² s⁻¹</small></div><div class="mini-card"><span class="mini-label">Carbon</span><strong>${format(state.algae.parameters.carbonG_L, 2)}</strong><small>g/L available</small></div></div></div></div>`;
}

function renderAlgaephyte() {
  const a = state.algae;
  return `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Algaephyte · controllable cultivation model</span><h3>Change the environment. Advance the culture.</h3><p>Adjust one or more supported conditions, then start the fixed-step clock or take a 15-minute measurement step. Values are synthetic and bounded by model input ranges.</p></div><span class="badge">${escapeHtml(a.experimentId || "BASELINE")}</span></div><div class="range-grid">${parameterDefinitions.map(([key, label, min, max, stepSize, unit, digits]) => `<div class="range-item"><div class="range-top"><label for="param-${key}">${label}</label><output id="out-${key}">${format(a.parameters[key], digits)} ${unit}</output></div><input id="param-${key}" data-param="${key}" type="range" min="${min}" max="${max}" step="${stepSize}" value="${a.parameters[key]}" aria-label="${label}"></div>`).join("")}</div><p class="unit-note">Candidate: ${escapeHtml(a.candidateId || "baseline synthetic inoculum")} · volume ${a.volumeL} L · model version synthetic-algae-lab-1.0</p></div>
   <div class="two-col"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Model output</span><h3>Growth factors and stress</h3></div><span class="badge ${a.derived.health === "critical" ? "red" : a.derived.health === "stressed" ? "amber" : ""}">${titleCase(a.derived.health)}</span></div><div class="factor-list">${[["Light response", a.derived.lightFactor], ["Temperature", a.derived.temperatureFactor], ["pH response", a.derived.phFactor], ["Nutrient", a.derived.nutrientFactor], ["Carbon", a.derived.carbonFactor], ["Oxygen", a.derived.oxygenFactor]].map(([label, value]) => `<div class="factor-line"><span>${label}</span>${metricBar(value)}<output>${Math.round(value * 100)}%</output></div>`).join("")}</div></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Synthetic history</span><h3>${state.algae.measurements.length} recorded points</h3></div></div>${chartMarkup()}<div class="action-row"><button class="action-btn" data-action="record">Capture comparison</button><button class="action-btn secondary" data-action="start-baseline">Reset to baseline inoculum</button></div></div></div>
   <div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Mass balance</span><h3>What the bookkeeping tracks</h3></div></div><div class="three-col"><div class="mini-card"><span class="mini-label">Biomass</span><strong>${format(a.biomassG, 3)} g</strong><small>${format(a.biomassG / a.volumeL, 4)} g/L concentration</small></div><div class="mini-card"><span class="mini-label">Carbon consumed</span><strong>${format(a.derived.carbonConsumedG, 3)} g</strong><small>derived from biomass gain</small></div><div class="mini-card"><span class="mini-label">Nitrogen consumed</span><strong>${format(a.derived.nitrogenConsumedMg, 1)}</strong><small>mg equivalent · synthetic</small></div></div></div>
   <div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Synthetic sensor panel</span><h3>Instrument-like readouts</h3></div><span class="badge amber">SYNTHETIC</span></div>${sensorMarkup()}<div class="action-row"><button class="action-btn secondary" data-action="calibrate">Capture synthetic calibration</button></div><p class="unit-note">These values and calibration records belong to the model. Physical sensor telemetry is shown below.</p></div>${devicePanel.markup()}`;
}

function renderCyanoflow() {
  const c = state.cyano;
  const sourceSample = selectedExpeditionSample();
  const cells = [...c.cells].filter((cell) => cell.state !== "lost").sort((a, b) => (b.candidateScore || 0) - (a.candidateScore || 0)).slice(0, 12);
  return `${sourceSample ? `<div class="workspace-card source-bridge"><div class="card-heading"><div><span class="eyebrow">Expedition → Cyanoflow</span><h3>${escapeHtml(sourceSample.id)} is in custody.</h3><p>This sample retains a link to ${escapeHtml(sourceSample.label)} from the ${escapeHtml(state.expedition.environment.label.toLowerCase())} expedition. The downstream cell pipeline remains explicitly synthetic and does not claim an identification.</p></div><span class="badge cyan">LINKED SOURCE</span></div><div class="three-col"><div class="mini-card"><span class="mini-label">Source location</span><strong>${format(sourceSample.observed.position.x, 0)} / ${format(sourceSample.observed.position.y, 0)}</strong><small>${format(sourceSample.observed.depthM, 1)} m depth</small></div><div class="mini-card"><span class="mini-label">Collected volume</span><strong>${format(sourceSample.observed.sampleVolumeMl, 2)} mL</strong><small>environmental sample</small></div><div class="mini-card"><span class="mini-label">Signal class</span><strong>${escapeHtml(sourceSample.classification)}</strong><small>confidence ${Math.round(sourceSample.inferred.confidence * 100)}% · inferred</small></div></div></div>` : ""}<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Cyanoflow · sample processing</span><h3>Prepare, transport, analyze, isolate.</h3><p>The chip view shows a residence-time approximation for cell transport. Empty droplets, multiplets, cell loss, and uncertain candidate ranking are modeled explicitly.</p></div><span class="badge cyan">${escapeHtml(stageLabels[c.stage])}</span></div>${stageMarkup()}<div class="progress-track"><i style="width:${Math.round(c.processingProgress * 100)}%"></i></div><div class="workflow-copy"><span>${Math.round(c.processingProgress * 100)}% transport progress</span><span>${c.stats.inChip} in chip · ${c.stats.isolated} isolated</span></div><div class="action-row"><button class="action-btn cyan" data-action="run-all">${c.stage === "transferred" ? "Workflow complete" : "Advance workflow"}</button><button class="action-btn secondary" data-action="demo-run">Run full synthetic path · 24 h</button><button class="action-btn secondary" data-mode="expedition">Return to expedition</button></div></div>
  <div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Microfluidic parameters</span><h3>Change the processing assumptions</h3></div><span class="badge amber">NOT CFD</span></div><div class="range-grid">${chipDefinitions.map(([key, label, min, max, stepSize, unit]) => `<div class="range-item"><div class="range-top"><label for="chip-${key}">${label}</label><output id="chipout-${key}">${format(c[key], stepSize < 1 ? 2 : 0)} ${unit}</output></div><input id="chip-${key}" data-chip-param="${key}" type="range" min="${min}" max="${max}" step="${stepSize}" value="${c[key]}" aria-label="${label}"></div>`).join("")}</div><p class="unit-note">These controls alter a simplified transport/residence-time model. They do not claim validated channel hydrodynamics.</p></div>
   <div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Selection criteria</span><h3>Rank candidates transparently.</h3><p>Isolation and ranking are separate. The score is an inferred synthetic proxy; these thresholds decide which isolated cells may be transferred.</p></div><span class="badge amber">${c.stats.eligible} eligible</span></div><div class="range-grid">${criteriaDefinitions.map(([key, label, min, max, stepSize, unit, digits]) => `<div class="range-item"><div class="range-top"><label for="criteria-${key}">${label}</label><output id="criteriaout-${key}">${format(c.criteria[key], digits)} ${unit}</output></div><input id="criteria-${key}" data-criteria-param="${key}" type="range" min="${min}" max="${max}" step="${stepSize}" value="${c.criteria[key]}" aria-label="${label}"></div>`).join("")}</div></div>
   <div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Synthetic candidate table</span><h3>Inspect individual identities</h3></div><span class="mono">${c.cells.length} cells generated from seed</span></div><div class="table-scroll"><table class="cell-table"><thead><tr><th>Cell</th><th>Morphology</th><th>Size</th><th>Viability</th><th>Proxy score</th><th>Selection</th><th>State</th></tr></thead><tbody>${cells.map((cell) => `<tr class="${cell.id === c.selectedCellId ? "is-selected" : ""}" data-cell-id="${cell.id}"><td class="cell-id">${cell.id}</td><td>${cell.morphology}</td><td>${format(cell.sizeUm, 2)} µm</td><td>${Math.round(cell.viability * 100)}%</td><td>${cell.candidateScore === null ? "—" : format(cell.candidateScore, 3)}</td><td>${cell.eligibleCandidate ? "eligible" : cell.candidateScore === null ? "pending" : "below threshold"}</td><td><span class="badge ${cell.state === "isolated" ? "cyan" : cell.state === "transferred" ? "" : "amber"}">${cell.state}</span></td></tr>`).join("")}</tbody></table></div></div>`;
}

function renderCell() {
  const cell = currentCell();
  if (!cell) return `<div class="workspace-card"><div class="empty-state">Select a cell from the Cyanoflow table or click a cell in the laboratory view.</div></div>`;
   const eligible = cell.state === "isolated" && cell.eligibleCandidate;
    return `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Single-cell inspection</span><h3>${cell.id}</h3><p>Identity remains linked to ${state.sample.id} through every modeled processing event.</p></div><span class="badge ${cell.state === "transferred" ? "" : "cyan"}">${cell.state}</span></div><div class="three-col"><div class="mini-card"><span class="mini-label">Morphology</span><strong>${cell.morphology}</strong><small>${format(cell.sizeUm, 2)} µm characteristic size</small></div><div class="mini-card"><span class="mini-label">Optical fluorescence</span><strong>${format(cell.optical.fluorescenceAU, 2)}</strong><small>synthetic arbitrary units</small></div><div class="mini-card"><span class="mini-label">Lipid proxy</span><strong>${format(cell.lipidProxyPct, 1)}%</strong><small>inferred synthetic hypothesis</small></div></div><p class="unit-note">Candidate status: ${escapeHtml(cell.selectionReason || "not yet analyzed")} · ${cell.candidateScore === null ? "score pending" : `score ${format(cell.candidateScore, 3)}`}</p><div class="action-row"><button class="action-btn" data-action="transfer" ${eligible ? "" : "disabled"}>${cell.state === "transferred" ? "Already transferred" : "Transfer to Algaephyte"}</button><button class="action-btn secondary" data-action="camera-cell">Focus 3D cell view</button></div></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Traceability record</span><h3>Provenance events</h3></div></div><div class="event-list">${cell.provenance.events.map((item, index) => `<div class="event-row"><time>${String(index + 1).padStart(2, "0")}</time><p>${escapeHtml(item)}<small>${escapeHtml(cell.provenance.sampleId)}</small></p></div>`).join("")}</div></div>`;
}

function renderHistory() {
  const experiments = state.experiments;
  return `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Experiment registry</span><h3>Compare synthetic cultivation runs.</h3><p>Captured records retain seed, scenario, candidate identity, parameters, measurements, and the synthetic-data limitation.</p></div><span class="badge">${experiments.length} records</span></div>${experiments.length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Experiment</th><th>Scenario</th><th>Candidate</th><th>Biomass</th><th>Health</th><th>Seed</th></tr></thead><tbody>${experiments.map((item) => `<tr><td class="cell-id">${escapeHtml(item.id)}</td><td>${escapeHtml(item.scenario)}</td><td>${escapeHtml(item.candidateId || "baseline")}</td><td>${format(item.results.finalBiomassG, 3)} g</td><td>${escapeHtml(item.results.finalHealth)}</td><td>${escapeHtml(item.seed)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No comparison records yet. Run the synthetic workflow or capture an Algaephyte run.</div>`}<div class="action-row"><button class="action-btn" data-action="record">Capture current experiment</button><button class="action-btn cyan" data-action="export-report">Export reproducible report</button></div></div><div class="two-col"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Report contract</span><h3>Portable and inspectable</h3></div></div><div class="report-code">${escapeHtml(JSON.stringify({ format: "orr-biologicals-experiment-report", version: 1, synthetic: true, seed: state.seed, sample: state.sample.id, candidate: state.algae.candidateId, measurements: state.algae.measurements.length }, null, 2))}</div></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Storage boundary</span><h3>Local browser only</h3></div></div><p>Save and export actions write a versioned JSON record on this device. No cloud sync, API credentials, pump, heater, or dosing action exists in this static lab. Optional read-only Pi telemetry stays outside simulation saves and reports.</p><div class="note" style="margin-top:15px"><b>Import validation:</b> files must identify the Orr Biologicals lab format and version before replacing the current state.</div></div></div>`;
}

const viewCopy = {
  expedition: ["PHYCOFRONTIER / environmental discovery", "Go where the signal is."],
  overview: ["Digital lab / research trace", "One sample, two research questions."],
  algaephyte: ["Algaephyte / cultivation", "Observe the culture respond."],
  cyanoflow: ["Cyanoflow / single-cell pipeline", "Follow cells through the chip."],
  cell: ["Cyanoflow / inspection", "Trace one synthetic candidate."],
  history: ["Records / comparison", "Keep the run reproducible."],
};

function renderWorkspace() {
  refs.content.innerHTML = mode === "expedition" ? renderExpedition() : mode === "overview" ? renderOverview() : mode === "algaephyte" ? renderAlgaephyte() : mode === "cyanoflow" ? renderCyanoflow() : mode === "cell" ? renderCell() : renderHistory();
  if (mode === "overview") refs.content.insertAdjacentHTML("beforeend", analysisMarkup());
  if (mode === "history") refs.content.insertAdjacentHTML("afterbegin", `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Comparison view</span><h3>Final biomass by run</h3></div><span class="badge amber">SYNTHETIC</span></div>${comparisonMarkup()}</div>`);
  refs.viewEyebrow.textContent = viewCopy[mode][0];
  refs.viewTitle.textContent = viewCopy[mode][1];
  $$(".lab-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === mode));
}

function render() {
  renderMetrics();
  renderWorkspace();
  const expeditionLegend = mode === "expedition";
  refs.legendPrimary.textContent = expeditionLegend ? "Probe body" : "Algaephyte vessel";
  refs.legendSecondary.textContent = expeditionLegend ? "Biological hotspot" : "Cyanoflow chip";
  refs.legendAccent.textContent = expeditionLegend ? "Selected hotspot" : "Selected cell";
  refs.sceneHint.textContent = expeditionLegend ? "WASD / arrows to move · drag to orbit · click a hotspot" : "Drag to orbit · scroll to zoom · click a cell to inspect";
  refs.legendPrimaryDot.className = `legend-dot ${expeditionLegend ? "cyan" : "green"}`;
  refs.legendSecondaryDot.className = `legend-dot ${expeditionLegend ? "green" : "cyan"}`;
  $$(".camera-btn").forEach((button) => button.classList.toggle("is-active", button.dataset.camera === state.sim.camera));
  if (renderer) { renderer.setMode(mode); renderer.setState(state); renderer.setCamera(state.sim.camera); }
}

function setMode(next) {
  mode = next;
  state.sim.mode = next;
  if (next === "expedition") state.sim.camera = "expedition";
  if (next === "algaephyte") state.sim.camera = "algaephyte";
  if (next === "cyanoflow") state.sim.camera = "cyanoflow";
  if (next === "cell") state.sim.camera = "cell";
  if (next === "overview" || next === "history") state.sim.camera = "laboratory";
  render();
}

function moveExpeditionToHotspot(expedition, hotspot) {
  if (!hotspot) return false;
  if (expedition.status === "recovered") deployExpedition(expedition);
  const dx = hotspot.position.x - expedition.probe.position.x;
  const dy = hotspot.position.y - expedition.probe.position.y;
  const dz = hotspot.position.z - expedition.probe.position.z;
  const horizontal = Math.hypot(dx, dy);
  if (horizontal > 0.5) moveProbe(expedition, { x: dx, y: dy }, Math.max(1, Math.ceil(horizontal / expedition.probe.horizontalSpeedMps)));
  if (Math.abs(dz) > 0.5) moveProbe(expedition, { depth: dz }, Math.max(1, Math.ceil(Math.abs(dz) / expedition.probe.verticalSpeedMps)));
  return true;
}

function handleExpeditionAction(action, target) {
  const expedition = expeditionState();
  const hotspot = target?.dataset.hotspotId ? getHotspot(expedition, target.dataset.hotspotId) : selectedHotspot();
  if (action === "select-hotspot") {
    expedition.selectedHotspotId = target.dataset.hotspotId;
    const selected = getHotspot(expedition, expedition.selectedHotspotId);
    if (selected) expedition.selectedDetectionId = selected.lastDetectionId || null;
    if (selected && expedition.status !== "recovered") moveExpeditionToHotspot(expedition, selected);
    render();
    return;
  }
  if (action === "new-expedition") {
    const seed = $("#expeditionSeed")?.value || "ORR-EXPEDITION-001";
    const environment = $("#expeditionEnvironment")?.value || "freshwater";
    state.expedition = createExpeditionState(seed, environment);
    state.sim.running = false;
    showToast(`Deployed a new ${ENVIRONMENTS[environment].label.toLowerCase()} expedition.`);
  } else if (action === "navigate") {
    if (moveExpeditionToHotspot(expedition, hotspot)) showToast(`Probe navigated toward ${hotspot.name}.`);
  } else if (action === "scan") {
    const result = scan(expedition, hotspot?.id || null);
    if (result.ok) {
      expedition.selectedHotspotId = result.hotspotId;
      expedition.selectedDetectionId = result.detectionIds[0] || null;
      showToast(`${result.detectionIds.length} signal${result.detectionIds.length === 1 ? "" : "s"} detected; uncertainty retained.`);
    } else showToast(`Scan rejected: ${result.reason}.`);
  } else if (action === "collect") {
    const result = collectSample(expedition, expedition.selectedDetectionId || null);
    if (result.ok) {
      expedition.activeSampleId = result.sampleId;
      showToast(`${result.sampleId} collected and held in probe storage.`);
    } else showToast(`Collection rejected: ${result.reason}.`);
  } else if (action === "clean") {
    const result = cleanProbe(expedition, 12);
    showToast(result.ok ? `Cleaning removed ${Math.round(result.foulingRemoved * 100)}% fouling.` : `Cleaning rejected: ${result.reason}.`);
  } else if (action === "autonomy") {
    const result = setAutonomy(expedition, !expedition.autonomy.enabled);
    showToast(result.enabled ? "Autonomous sampling enabled; the operational log will record decisions." : "Autonomous sampling paused.");
  } else if (action === "advance") {
    advanceTime(expedition, Number(target?.dataset.seconds || 900));
    showToast("Advanced the expedition clock by 15 minutes.");
  } else if (action === "recover") {
    const result = recoverProbe(expedition);
    showToast(result.ok ? "Probe recovered; samples remain in custody." : `Recovery rejected: ${result.reason}.`);
  } else if (action === "link-sample") {
    expedition.activeSampleId = target.dataset.sampleId;
    setMode("cyanoflow");
    showToast(`${target.dataset.sampleId} is now the linked Cyanoflow source record.`);
    return;
  } else if (action === "export-expedition") {
    downloadText(`orr-expedition-${expedition.seed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`, serializeExpeditionState(expedition));
    showToast("Expedition JSON exported with observed/inferred provenance.");
  } else if (action === "backend-health") {
    checkBackend().then((result) => showToast(result.connected ? "Optional backend is reachable." : "No optional backend is configured.")).catch((error) => showToast(`Backend unavailable: ${error.message}`));
    return;
  } else if (action === "backend-save") {
    const playerId = `orr-local-${state.seed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    saveBackendState(playerId, { lab: JSON.parse(serializeState(state)), expedition: JSON.parse(serializeExpeditionState(expedition)) })
      .then(() => showToast("Full synthetic record synced to the optional development backend."))
      .catch((error) => showToast(`Sync not completed: ${error.message}`));
    return;
  }
  render();
}

function handleAction(action) {
  if (action === "next-stage") { advanceWorkflow(state); showToast(`Advanced to ${stageLabels[state.cyano.stage]}.`); }
  if (action === "run-all") { if (state.cyano.stage !== "transferred") advanceWorkflow(state); else showToast("Cyanoflow workflow is already complete."); }
  if (action === "demo-run") {
    runCompleteWorkflow(state);
    for (let i = 0; i < 24; i++) step(state, 3600);
    recordExperiment(state, "Cyanoflow candidate · 24 h synthetic cultivation");
    showToast("Complete synthetic sample-to-culture run recorded.");
  }
  if (action === "transfer") { if (transferSelected(state)) { showToast(`${state.cyano.selectedCellId} transferred into Algaephyte.`); setMode("algaephyte"); } }
  if (action === "record") { recordExperiment(state); showToast("Current synthetic experiment captured."); }
  if (action === "calibrate") { const record = calibrateSensors(state); showToast(`${record.id} captured as a synthetic calibration record.`); }
  if (action === "start-baseline") { startCultivation(state, null); showToast("Started a fresh baseline inoculum."); }
  if (action === "camera-cell") { state.sim.camera = "cell"; mode = "cell"; }
  if (action === "export-report") exportReport();
  render();
}

function exportReport() {
  downloadText(`orr-research-report-${state.seed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`, JSON.stringify({ ...report(state), expedition: JSON.parse(serializeExpeditionState(expeditionState())) }, null, 2));
  showToast("Reproducible synthetic report downloaded.");
}

function handleWorkspaceClick(event) {
  const tab = event.target.closest("[data-mode]");
  if (tab) { setMode(tab.dataset.mode); return; }
  const expeditionAction = event.target.closest("[data-expedition-action]");
  if (expeditionAction) { handleExpeditionAction(expeditionAction.dataset.expeditionAction, expeditionAction); return; }
  const row = event.target.closest("[data-cell-id]");
  if (row) { selectCell(state, row.dataset.cellId); mode = "cell"; state.sim.camera = "cell"; render(); return; }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action) handleAction(action);
}

function handleWorkspaceInput(event) {
  const param = event.target.dataset.param;
  if (param) {
    setParameter(state, param, event.target.value);
    const definition = parameterDefinitions.find((item) => item[0] === param);
    const output = $(`#out-${param}`);
    if (output) output.textContent = `${format(state.algae.parameters[param], definition[6])} ${definition[5]}`;
    renderMetrics();
    return;
  }
  const chipParam = event.target.dataset.chipParam;
  if (chipParam) {
    setCyanoflowParameter(state, chipParam, event.target.value);
    const definition = chipDefinitions.find((item) => item[0] === chipParam);
    const output = $(`#chipout-${chipParam}`);
    if (output) output.textContent = `${format(state.cyano[chipParam], definition[4] < 1 ? 2 : 0)} ${definition[5]}`;
    return;
  }
  const criteriaParam = event.target.dataset.criteriaParam;
  if (criteriaParam) {
    setSelectionCriteria(state, criteriaParam, event.target.value);
    const definition = criteriaDefinitions.find((item) => item[0] === criteriaParam);
    const output = $(`#criteriaout-${criteriaParam}`);
    if (output) output.textContent = `${format(state.cyano.criteria[criteriaParam], definition[6])} ${definition[5]}`;
  }
}

function resetState(seed = state.seed) {
  const next = createLabState(seed);
  next.expedition = createExpeditionState(`${seed}-EXP`, state.expedition?.environmentType || "freshwater");
  next.sim.mode = mode;
  next.sim.camera = state.sim.camera;
  state = next;
  render();
}

function bindControls() {
  $$(".lab-tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
  $$(".camera-btn").forEach((button) => button.addEventListener("click", () => { state.sim.camera = button.dataset.camera; $$(".camera-btn").forEach((item) => item.classList.toggle("is-active", item === button)); if (renderer) renderer.setCamera(state.sim.camera); }));
  refs.content.addEventListener("click", handleWorkspaceClick);
  refs.content.addEventListener("input", handleWorkspaceInput);
  refs.runToggle.addEventListener("click", () => { state.sim.running = !state.sim.running; showToast(state.sim.running ? "Simulation clock running." : "Simulation clock paused."); renderMetrics(); });
   refs.stepRun.addEventListener("click", () => { if (mode === "expedition") advanceTime(expeditionState(), 900); else step(state, 900); showToast("Advanced synthetic time by 15 minutes."); render(); });
  refs.resetRun.addEventListener("click", () => { resetState(); showToast("Scenario reset to the current seed."); });
  refs.newSeed.addEventListener("click", () => { const bytes = new Uint32Array(2); if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes); else { bytes[0] = Date.now() >>> 0; bytes[1] = (Date.now() / 1000) >>> 0; } const seed = `ORR-${bytes[0].toString(36).toUpperCase()}-${bytes[1].toString(36).toUpperCase()}`; refs.seedInput.value = seed; resetState(seed); showToast("New reproducible seed created."); });
  refs.applySeed.addEventListener("click", () => { resetState(refs.seedInput.value); showToast(`Applied seed ${refs.seedInput.value}.`); });
  refs.seedInput.addEventListener("keydown", (event) => { if (event.key === "Enter") refs.applySeed.click(); });
  refs.speedSelect.addEventListener("change", () => { state.sim.speed = Number(refs.speedSelect.value); renderMetrics(); });
  refs.scenarioSelect.addEventListener("change", () => { applyScenario(state, refs.scenarioSelect.value); showToast(`Applied ${SCENARIOS[refs.scenarioSelect.value].label}.`); render(); });
  refs.saveLocal.addEventListener("click", () => { const saved = saveState(state); renderMetrics(); showToast(saved ? "Saved a local browser record." : "Local storage is unavailable; use Export JSON."); });
  refs.exportState.addEventListener("click", () => { downloadState(state); showToast("State JSON downloaded."); });
  refs.exportReport.addEventListener("click", exportReport);
  refs.importState.addEventListener("click", () => refs.importFile.click());
   refs.importFile.addEventListener("change", async () => { const file = refs.importFile.files?.[0]; if (!file) return; try { const next = parseState(await file.text()); if (next.expedition?.format !== "orr-biologicals-expedition") next.expedition = createExpeditionState(`${next.seed}-EXP`, "freshwater"); state = next; mode = state.sim.mode || "expedition"; showToast("Validated lab and expedition state imported."); render(); if (renderer) renderer.setState(state); } catch (error) { showToast(`Import rejected: ${error.message}`); } refs.importFile.value = ""; });
  refs.soundToggle.addEventListener("click", () => { const playing = audio.toggle(); refs.soundToggle.textContent = playing ? "♫ Ambient on" : "♫ Ambient off"; refs.soundToggle.setAttribute("aria-pressed", String(playing)); });
  document.addEventListener("pointerdown", () => { if (state.sim.running && !audio.isRunning()) audio.start(); }, { once: true, passive: true });
}

async function boot() {
  // Expose the deterministic test surface before the optional WebGL loader so
  // offline/CDN-blocked browsers still have a usable application API.
  globalThis.__orrLab = window.__orrLab = {
    getState: () => state,
    metrics: () => metrics(state),
    expedition: () => getExpeditionSummary(expeditionState()),
    runWorkflow: () => { runCompleteWorkflow(state); render(); return metrics(state); },
    step: (seconds = STEP_SECONDS) => { if (mode === "expedition") advanceTime(expeditionState(), seconds); else step(state, seconds); render(); return mode === "expedition" ? getExpeditionSummary(expeditionState()) : metrics(state); },
    selfTest: runSelfTest,
    exportState: () => serializeState(state),
    reset: () => { resetState(); return metrics(state); },
  };
  document.body.dataset.labBoot = "started";
  bindControls();
  render();
  renderer = await createLabRenderer(refs.canvas, {
    onSelect: (cellId) => { if (selectCell(state, cellId)) { mode = "cell"; state.sim.camera = "cell"; render(); } },
    onHotspot: (hotspotId) => { expeditionState().selectedHotspotId = hotspotId; mode = "expedition"; state.sim.mode = "expedition"; state.sim.camera = "expedition"; render(); },
    onMove: (direction) => { if (mode === "expedition") { moveProbe(expeditionState(), direction, 1); renderMetrics(); } },
    onFocus: (nextCamera) => { state.sim.camera = nextCamera; if (nextCamera === "cell") mode = "cell"; if (nextCamera === "expedition") mode = "expedition"; render(); },
    onFallback: (message) => { refs.sceneStatus.textContent = message; refs.sceneStatus.classList.add("is-warning"); },
  });
  renderer.setState(state);
  renderer.setMode(mode);
  renderer.setCamera(state.sim.camera);
  refs.sceneStatus.textContent = renderer.canvas?.dataset?.renderer === "webgl"
     ? "WebGL research world · synthetic state linked"
     : "2D accessibility fallback · synthetic state linked";
  refs.sceneLoading.classList.add("is-ready");
  if (!storageAvailable()) showToast("Local storage unavailable. Export JSON to keep this run.");
  document.body.dataset.labBoot = "ready";
}

function loop(now) {
  const frameSeconds = Math.min(.25, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  const quality = frameSeconds > .045 ? "low" : "high";
  if (renderer && quality !== lastQuality) { lastQuality = quality; renderer.setQuality?.(quality); }
  if (state.sim.running) {
    simAccumulator += frameSeconds * state.sim.speed * 60;
    while (simAccumulator >= STEP_SECONDS) { if (mode === "expedition") advanceTime(expeditionState(), STEP_SECONDS); else step(state, STEP_SECONDS); simAccumulator -= STEP_SECONDS; }
    if (now - lastUiPaint > 450) { lastUiPaint = now; renderMetrics(); if (["overview", "history", "expedition"].includes(mode)) renderWorkspace(); }
  }
  requestAnimationFrame(loop);
}

boot();
requestAnimationFrame(loop);
