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
import { SENSOR_DEFINITIONS, createMockSensorProvider, createRealDeviceProvider } from "./lab-providers.js";

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
let renderer = null;
let mode = "overview";
let lastUiPaint = 0;
let lastFrame = performance.now();
let simAccumulator = 0;
let toastTimer = null;
const mockSensorProvider = createMockSensorProvider();
const realDeviceProvider = createRealDeviceProvider();

const refs = {
  canvas: $("#labCanvas"),
  content: $("#workspaceContent"),
  sceneLoading: $("#sceneLoading"),
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
  return `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Offline analysis</span><h3>Explain the current model state.</h3></div><span class="badge amber">NO API KEY</span></div><p>${escapeHtml(insight.summary)}</p><div class="analysis-grid"><div><span class="mini-label">Supporting factors</span><ul class="support-list">${insight.supportingMeasurements.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div><div><span class="mini-label">Suggested comparisons</span><ul class="support-list">${insight.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div></div><div class="note" style="margin-top:14px"><b>Uncertainty:</b> ${escapeHtml(insight.confidence)}. ${escapeHtml(insight.limitations)}</div></div>`;
}

function renderMetrics() {
  const m = metrics(state);
  $("#metricHealth").textContent = titleCase(m.health);
  $("#metricHealth").className = m.health === "critical" ? "health-critical" : m.health === "stressed" ? "health-stressed" : "health-healthy";
  $("#metricHealthNote").textContent = `${Math.round((1 - m.stressIndex) * 100)}% productive model state`;
  $("#metricBiomass").textContent = `${format(m.biomassG, 2)} g`;
  $("#metricBiomassNote").textContent = `${format(m.biomassConcG_L, 4)} g/L · ${m.timeHours} h`;
  $("#metricGrowth").textContent = `${format(m.growthRatePerDay, 3)} / day`;
  $("#metricGrowthNote").textContent = `${titleCase(m.health)} · synthetic model`;
  $("#metricPipeline").textContent = stageLabels[m.stage] || titleCase(m.stage);
  $("#metricPipelineNote").textContent = `${m.cellsIsolated || 0} isolated · ${m.cellsEligible || 0} eligible · ${m.modeledLosses || 0} losses`;
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
}

function renderOverview() {
  const scenario = SCENARIOS[state.algae.scenario] || SCENARIOS.baseline;
  const recentEvents = state.events.slice(-8).reverse();
  return `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">End-to-end trace</span><h3>One sample, two research questions.</h3><p>The synthetic sample carries cell identities from collection to microfluidic isolation and, when selected, into an Algaephyte cultivation run.</p></div><span class="badge">${escapeHtml(state.sample.id)}</span></div>${stageMarkup()}<div class="progress-track"><i style="width:${Math.round(stageOrder.indexOf(state.cyano.stage) / (stageOrder.length - 1) * 100)}%"></i></div><div class="workflow-copy"><span>${escapeHtml(stageLabels[state.cyano.stage])}</span><span>${state.cyano.stats.isolated} candidate cells · ${state.cyano.stats.lost} modeled losses</span></div><div class="action-row"><button class="action-btn cyan" data-action="demo-run">Run complete synthetic workflow · 24 h</button><button class="action-btn secondary" data-action="next-stage">Advance one stage</button></div></div>
  <div class="two-col"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Algaephyte · growth trajectory</span><h3>Biomass over synthetic time</h3></div><span class="badge ${state.algae.derived.health === "healthy" ? "" : "amber"}">${titleCase(state.algae.derived.health)}</span></div>${chartMarkup()}<div class="three-col" style="margin-top:14px"><div class="mini-card"><span class="mini-label">pH</span><strong>${format(state.algae.parameters.ph, 2)}</strong><small>alkaline medium</small></div><div class="mini-card"><span class="mini-label">O₂</span><strong>${format(state.algae.parameters.dissolvedOxygenPct, 0)}%</strong><small>synthetic saturation</small></div><div class="mini-card"><span class="mini-label">carbon</span><strong>${format(state.algae.parameters.carbonG_L, 2)}</strong><small>g/L remaining</small></div></div></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Current conditions</span><h3>${escapeHtml(scenario.label)}</h3></div><span class="badge amber">MODEL</span></div><p>${escapeHtml(scenario.description)}</p><div class="factor-list" style="margin-top:16px">${[["Light response", state.algae.derived.lightFactor], ["Temperature", state.algae.derived.temperatureFactor], ["pH response", state.algae.derived.phFactor], ["Nutrient", state.algae.derived.nutrientFactor], ["Carbon", state.algae.derived.carbonFactor], ["Oxygen", state.algae.derived.oxygenFactor]].map(([label, value]) => `<div class="factor-line"><span>${label}</span>${metricBar(value)}<output>${Math.round(value * 100)}%</output></div>`).join("")}</div></div></div>
  <div class="two-col"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Event log</span><h3>What the model has done</h3></div><span class="mono">${state.events.length} events</span></div><div class="event-list">${recentEvents.length ? recentEvents.map((item) => `<div class="event-row"><time>${clockLabel(item.timeSeconds)}</time><p>${escapeHtml(item.message)}<small>${escapeHtml(item.type)}</small></p></div>`).join("") : `<div class="empty-state">No events recorded.</div>`}</div></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Model contract</span><h3>Read the assumptions</h3></div></div><ul class="assumption-list">${MODEL_ASSUMPTIONS.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><div class="note" style="margin-top:14px"><b>Data provenance:</b> Synthetic inputs, inferred proxy traits, and model outputs are kept distinct in the exported report.</div></div></div>`;
}

function renderAlgaephyte() {
  const a = state.algae;
  return `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Algaephyte · controllable cultivation model</span><h3>Change the environment. Advance the culture.</h3><p>Adjust one or more supported conditions, then start the fixed-step clock or take a 15-minute measurement step. Values are synthetic and bounded by model input ranges.</p></div><span class="badge">${escapeHtml(a.experimentId || "BASELINE")}</span></div><div class="range-grid">${parameterDefinitions.map(([key, label, min, max, stepSize, unit, digits]) => `<div class="range-item"><div class="range-top"><label for="param-${key}">${label}</label><output id="out-${key}">${format(a.parameters[key], digits)} ${unit}</output></div><input id="param-${key}" data-param="${key}" type="range" min="${min}" max="${max}" step="${stepSize}" value="${a.parameters[key]}" aria-label="${label}"></div>`).join("")}</div><p class="unit-note">Candidate: ${escapeHtml(a.candidateId || "baseline synthetic inoculum")} · volume ${a.volumeL} L · model version synthetic-algae-lab-1.0</p></div>
  <div class="two-col"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Model output</span><h3>Growth factors and stress</h3></div><span class="badge ${a.derived.health === "critical" ? "red" : a.derived.health === "stressed" ? "amber" : ""}">${titleCase(a.derived.health)}</span></div><div class="factor-list">${[["Light response", a.derived.lightFactor], ["Temperature", a.derived.temperatureFactor], ["pH response", a.derived.phFactor], ["Nutrient", a.derived.nutrientFactor], ["Carbon", a.derived.carbonFactor], ["Oxygen", a.derived.oxygenFactor]].map(([label, value]) => `<div class="factor-line"><span>${label}</span>${metricBar(value)}<output>${Math.round(value * 100)}%</output></div>`).join("")}</div><div class="note ${a.derived.health === "critical" ? "warning" : ""}" style="margin-top:16px"><b>${titleCase(a.derived.health)} model state.</b> This is an explanatory output from simplified equations, not a diagnostic of a real culture.</div></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Synthetic history</span><h3>${state.algae.measurements.length} recorded points</h3></div></div>${chartMarkup()}<div class="action-row"><button class="action-btn" data-action="record">Capture comparison</button><button class="action-btn secondary" data-action="start-baseline">Reset to baseline inoculum</button></div></div></div>
   <div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Mass balance</span><h3>What the bookkeeping tracks</h3></div></div><div class="three-col"><div class="mini-card"><span class="mini-label">Biomass</span><strong>${format(a.biomassG, 3)} g</strong><small>${format(a.biomassG / a.volumeL, 4)} g/L concentration</small></div><div class="mini-card"><span class="mini-label">Carbon consumed</span><strong>${format(a.derived.carbonConsumedG, 3)} g</strong><small>derived from biomass gain</small></div><div class="mini-card"><span class="mini-label">Nitrogen consumed</span><strong>${format(a.derived.nitrogenConsumedMg, 1)}</strong><small>mg equivalent · synthetic</small></div></div></div>
   <div class="two-col"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Synthetic sensor panel</span><h3>Instrument-like readouts</h3></div><span class="badge amber">${escapeHtml(state.sensors.provider.status)}</span></div>${sensorMarkup()}<div class="action-row"><button class="action-btn secondary" data-action="calibrate">Capture synthetic calibration</button></div><p class="unit-note">A future Pi provider may expose DS18B20 temperature and ADC channels through a validated service. This browser app has no GPIO or actuator path.</p></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Hardware boundary</span><h3>${escapeHtml(realDeviceProvider.label)}</h3></div><span class="badge amber">UNAVAILABLE</span></div><p>${escapeHtml(realDeviceProvider.reason)}</p><div class="note warning" style="margin-top:14px"><b>Simulation safety:</b> recommendations and synthetic state never enable pumps, heaters, dosing, or other physical outputs.</div></div></div>`;
}

function renderCyanoflow() {
  const c = state.cyano;
  const cells = [...c.cells].filter((cell) => cell.state !== "lost").sort((a, b) => (b.candidateScore || 0) - (a.candidateScore || 0)).slice(0, 12);
  return `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Cyanoflow · sample processing</span><h3>Prepare, transport, analyze, isolate.</h3><p>The chip view shows a residence-time approximation for cell transport. Empty droplets, multiplets, cell loss, and uncertain candidate ranking are modeled explicitly.</p></div><span class="badge cyan">${escapeHtml(stageLabels[c.stage])}</span></div>${stageMarkup()}<div class="progress-track"><i style="width:${Math.round(c.processingProgress * 100)}%"></i></div><div class="workflow-copy"><span>${Math.round(c.processingProgress * 100)}% transport progress</span><span>${c.stats.inChip} in chip · ${c.stats.isolated} isolated</span></div><div class="action-row"><button class="action-btn cyan" data-action="run-all">${c.stage === "transferred" ? "Workflow complete" : "Advance workflow"}</button><button class="action-btn secondary" data-action="demo-run">Run full synthetic path · 24 h</button></div></div>
  <div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Microfluidic parameters</span><h3>Change the processing assumptions</h3></div><span class="badge amber">NOT CFD</span></div><div class="range-grid">${chipDefinitions.map(([key, label, min, max, stepSize, unit]) => `<div class="range-item"><div class="range-top"><label for="chip-${key}">${label}</label><output id="chipout-${key}">${format(c[key], stepSize < 1 ? 2 : 0)} ${unit}</output></div><input id="chip-${key}" data-chip-param="${key}" type="range" min="${min}" max="${max}" step="${stepSize}" value="${c[key]}" aria-label="${label}"></div>`).join("")}</div><p class="unit-note">These controls alter a simplified transport/residence-time model. They do not claim validated channel hydrodynamics.</p></div>
   <div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Selection criteria</span><h3>Rank candidates transparently.</h3><p>Isolation and ranking are separate. The score is an inferred synthetic proxy; these thresholds decide which isolated cells may be transferred.</p></div><span class="badge amber">${c.stats.eligible} eligible</span></div><div class="range-grid">${criteriaDefinitions.map(([key, label, min, max, stepSize, unit, digits]) => `<div class="range-item"><div class="range-top"><label for="criteria-${key}">${label}</label><output id="criteriaout-${key}">${format(c.criteria[key], digits)} ${unit}</output></div><input id="criteria-${key}" data-criteria-param="${key}" type="range" min="${min}" max="${max}" step="${stepSize}" value="${c.criteria[key]}" aria-label="${label}"></div>`).join("")}</div></div>
   <div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Synthetic candidate table</span><h3>Inspect individual identities</h3></div><span class="mono">${c.cells.length} cells generated from seed</span></div><div class="table-scroll"><table class="cell-table"><thead><tr><th>Cell</th><th>Morphology</th><th>Size</th><th>Viability</th><th>Proxy score</th><th>Selection</th><th>State</th></tr></thead><tbody>${cells.map((cell) => `<tr class="${cell.id === c.selectedCellId ? "is-selected" : ""}" data-cell-id="${cell.id}"><td class="cell-id">${cell.id}</td><td>${cell.morphology}</td><td>${format(cell.sizeUm, 2)} µm</td><td>${Math.round(cell.viability * 100)}%</td><td>${cell.candidateScore === null ? "—" : format(cell.candidateScore, 3)}</td><td>${cell.eligibleCandidate ? "eligible" : cell.candidateScore === null ? "pending" : "below threshold"}</td><td><span class="badge ${cell.state === "isolated" ? "cyan" : cell.state === "transferred" ? "" : "amber"}">${cell.state}</span></td></tr>`).join("")}</tbody></table></div></div>`;
}

function renderCell() {
  const cell = currentCell();
  if (!cell) return `<div class="workspace-card"><div class="empty-state">Select a cell from the Cyanoflow table or click a cell in the laboratory view.</div></div>`;
   const eligible = cell.state === "isolated" && cell.eligibleCandidate;
   return `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Single-cell inspection</span><h3>${cell.id}</h3><p>Identity remains linked to ${state.sample.id} through every modeled processing event.</p></div><span class="badge ${cell.state === "transferred" ? "" : "cyan"}">${cell.state}</span></div><div class="three-col"><div class="mini-card"><span class="mini-label">Morphology</span><strong>${cell.morphology}</strong><small>${format(cell.sizeUm, 2)} µm characteristic size</small></div><div class="mini-card"><span class="mini-label">Optical fluorescence</span><strong>${format(cell.optical.fluorescenceAU, 2)}</strong><small>synthetic arbitrary units</small></div><div class="mini-card"><span class="mini-label">Lipid proxy</span><strong>${format(cell.lipidProxyPct, 1)}%</strong><small>inferred synthetic hypothesis</small></div></div><div class="note warning" style="margin-top:15px"><b>Interpretation limit.</b> The proxy score and fluorescence do not prove lipid content, strain identity, or biological performance. A validated assay is required.</div><p class="unit-note">Candidate status: ${escapeHtml(cell.selectionReason || "not yet analyzed")} · ${cell.candidateScore === null ? "score pending" : `score ${format(cell.candidateScore, 3)}`}</p><div class="action-row"><button class="action-btn" data-action="transfer" ${eligible ? "" : "disabled"}>${cell.state === "transferred" ? "Already transferred" : "Transfer to Algaephyte"}</button><button class="action-btn secondary" data-action="camera-cell">Focus 3D cell view</button></div></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Traceability record</span><h3>Provenance events</h3></div></div><div class="event-list">${cell.provenance.events.map((item, index) => `<div class="event-row"><time>${String(index + 1).padStart(2, "0")}</time><p>${escapeHtml(item)}<small>${escapeHtml(cell.provenance.sampleId)}</small></p></div>`).join("")}</div></div>`;
}

function renderHistory() {
  const experiments = state.experiments;
  return `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Experiment registry</span><h3>Compare synthetic cultivation runs.</h3><p>Captured records retain seed, scenario, candidate identity, parameters, measurements, and the synthetic-data limitation.</p></div><span class="badge">${experiments.length} records</span></div>${experiments.length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Experiment</th><th>Scenario</th><th>Candidate</th><th>Biomass</th><th>Health</th><th>Seed</th></tr></thead><tbody>${experiments.map((item) => `<tr><td class="cell-id">${escapeHtml(item.id)}</td><td>${escapeHtml(item.scenario)}</td><td>${escapeHtml(item.candidateId || "baseline")}</td><td>${format(item.results.finalBiomassG, 3)} g</td><td>${escapeHtml(item.results.finalHealth)}</td><td>${escapeHtml(item.seed)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No comparison records yet. Run the synthetic workflow or capture an Algaephyte run.</div>`}<div class="action-row"><button class="action-btn" data-action="record">Capture current experiment</button><button class="action-btn cyan" data-action="export-report">Export reproducible report</button></div></div><div class="two-col"><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Report contract</span><h3>Portable and inspectable</h3></div></div><div class="report-code">${escapeHtml(JSON.stringify({ format: "orr-biologicals-experiment-report", version: 1, synthetic: true, seed: state.seed, sample: state.sample.id, candidate: state.algae.candidateId, measurements: state.algae.measurements.length }, null, 2))}</div></div><div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Storage boundary</span><h3>Local browser only</h3></div></div><p>Save and export actions write a versioned JSON record on this device. No cloud sync, API credentials, hardware connection, pump, heater, or dosing action exists in this static lab.</p><div class="note" style="margin-top:15px"><b>Import validation:</b> files must identify the Orr Biologicals lab format and version before replacing the current state.</div></div></div>`;
}

const viewCopy = {
  overview: ["Digital lab / research trace", "One sample, two research questions."],
  algaephyte: ["Algaephyte / cultivation", "Observe the culture respond."],
  cyanoflow: ["Cyanoflow / single-cell pipeline", "Follow cells through the chip."],
  cell: ["Cyanoflow / inspection", "Trace one synthetic candidate."],
  history: ["Records / comparison", "Keep the run reproducible."],
};

function renderWorkspace() {
  refs.content.innerHTML = mode === "overview" ? renderOverview() : mode === "algaephyte" ? renderAlgaephyte() : mode === "cyanoflow" ? renderCyanoflow() : mode === "cell" ? renderCell() : renderHistory();
  if (mode === "overview") refs.content.insertAdjacentHTML("beforeend", analysisMarkup());
  if (mode === "history") refs.content.insertAdjacentHTML("afterbegin", `<div class="workspace-card"><div class="card-heading"><div><span class="eyebrow">Comparison view</span><h3>Final biomass by run</h3></div><span class="badge amber">SYNTHETIC</span></div>${comparisonMarkup()}</div>`);
  refs.viewEyebrow.textContent = viewCopy[mode][0];
  refs.viewTitle.textContent = viewCopy[mode][1];
  $$(".lab-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === mode));
}

function render() {
  renderMetrics();
  renderWorkspace();
  if (renderer) { renderer.setMode(mode); renderer.setState(state); renderer.setCamera(state.sim.camera); }
}

function setMode(next) {
  mode = next;
  state.sim.mode = next;
  if (next === "algaephyte") state.sim.camera = "algaephyte";
  if (next === "cyanoflow") state.sim.camera = "cyanoflow";
  if (next === "cell") state.sim.camera = "cell";
  if (next === "overview" || next === "history") state.sim.camera = "laboratory";
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
  downloadText(`orr-experiment-report-${state.seed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`, JSON.stringify(report(state), null, 2));
  showToast("Reproducible synthetic report downloaded.");
}

function handleWorkspaceClick(event) {
  const tab = event.target.closest("[data-mode]");
  if (tab) { setMode(tab.dataset.mode); return; }
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
  refs.stepRun.addEventListener("click", () => { step(state, 900); showToast("Advanced synthetic time by 15 minutes."); render(); });
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
  refs.importFile.addEventListener("change", async () => { const file = refs.importFile.files?.[0]; if (!file) return; try { const next = parseState(await file.text()); state = next; mode = state.sim.mode || "overview"; showToast("Validated lab state imported."); render(); if (renderer) renderer.setState(state); } catch (error) { showToast(`Import rejected: ${error.message}`); } refs.importFile.value = ""; });
}

async function boot() {
  // Expose the deterministic test surface before the optional WebGL loader so
  // offline/CDN-blocked browsers still have a usable application API.
  globalThis.__orrLab = window.__orrLab = {
    getState: () => state,
    metrics: () => metrics(state),
    runWorkflow: () => { runCompleteWorkflow(state); render(); return metrics(state); },
    step: (seconds = STEP_SECONDS) => { step(state, seconds); render(); return metrics(state); },
    selfTest: runSelfTest,
    exportState: () => serializeState(state),
    reset: () => { resetState(); return metrics(state); },
  };
  document.body.dataset.labBoot = "started";
  bindControls();
  render();
  renderer = await createLabRenderer(refs.canvas, { onSelect: (cellId) => { if (selectCell(state, cellId)) { mode = "cell"; state.sim.camera = "cell"; render(); } } });
  renderer.setState(state);
  renderer.setMode(mode);
  renderer.setCamera(state.sim.camera);
  refs.sceneLoading.classList.add("is-ready");
  if (!storageAvailable()) showToast("Local storage unavailable. Export JSON to keep this run.");
  document.body.dataset.labBoot = "ready";
}

function loop(now) {
  const frameSeconds = Math.min(.25, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  if (state.sim.running) {
    simAccumulator += frameSeconds * state.sim.speed * 60;
    while (simAccumulator >= STEP_SECONDS) { step(state, STEP_SECONDS); simAccumulator -= STEP_SECONDS; }
    if (now - lastUiPaint > 450) { lastUiPaint = now; renderMetrics(); if (mode === "overview" || mode === "history") renderWorkspace(); }
  }
  requestAnimationFrame(loop);
}

boot();
requestAnimationFrame(loop);
