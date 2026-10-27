/*
 * Orr Biologicals research-lab simulation engine.
 *
 * This module deliberately contains no DOM, WebGL, timers, or ambient random source.
 * The browser UI advances it with a fixed simulation step, which makes a run
 * reproducible from its seed and configuration. Every value emitted by this
 * model is synthetic or inferred; it is not a measurement from hardware.
 */

export const LAB_FORMAT = "orr-biologicals-lab";
export const LAB_VERSION = 1;
export const MODEL_VERSION = "synthetic-algae-lab-1.0";
export const STEP_SECONDS = 60;
export const DAY_SECONDS = 86400;
export const SENSOR_CONTRACT_VERSION = "sensor-provider-1.0";

export const SCENARIOS = Object.freeze({
  baseline: {
    label: "Baseline culture",
    description: "Moderate light, warm alkaline medium, and adequate carbon.",
    params: { lightPpfd: 220, photoperiodHours: 14, temperatureC: 30, ph: 9.6, dissolvedOxygenPct: 104, carbonG_L: 6.8, nitrogenMgL: 420, mixingPct: 68, aerationPct: 58 },
  },
  lightStress: {
    label: "High-light stress",
    description: "Photoinhibition and oxygen accumulation challenge the culture.",
    params: { lightPpfd: 720, photoperiodHours: 18, temperatureC: 31, ph: 9.8, dissolvedOxygenPct: 138, carbonG_L: 6.8, nitrogenMgL: 420, mixingPct: 54, aerationPct: 34 },
  },
  carbonLimited: {
    label: "Carbon limitation",
    description: "Light is available, but inorganic carbon is deliberately scarce.",
    params: { lightPpfd: 220, photoperiodHours: 14, temperatureC: 30, ph: 9.8, dissolvedOxygenPct: 112, carbonG_L: 1.3, nitrogenMgL: 420, mixingPct: 68, aerationPct: 46 },
  },
  oxygenStress: {
    label: "Low gas exchange",
    description: "Aeration and mixing are reduced, increasing dissolved-oxygen stress.",
    params: { lightPpfd: 300, photoperiodHours: 16, temperatureC: 32, ph: 9.7, dissolvedOxygenPct: 148, carbonG_L: 6.2, nitrogenMgL: 380, mixingPct: 34, aerationPct: 18 },
  },
});

export const MODEL_ASSUMPTIONS = Object.freeze([
  "Growth is a bounded exponential approximation using Monod nutrient and carbon limitation, a Steele-shaped light response, temperature and pH response curves, and dissolved-oxygen inhibition.",
  "Biomass is tracked as dry-mass grams and concentration is biomass divided by culture volume; this is a synthetic bookkeeping model, not a calibration.",
  "Mixing and aeration are represented as scalar mass-transfer factors. The model is not CFD and does not resolve vessel geometry.",
  "Cyanoflow transport uses a residence-time approximation. It is not a validated microfluidic solver.",
  "Lipid values, fluorescence, morphology, viability, and candidate scores are synthetic/inferred fields until validated measurements are imported.",
]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round = (v, digits = 4) => Number(v.toFixed(digits));
const deepCopy = (value) => JSON.parse(JSON.stringify(value));

export function hashSeed(input) {
  let h = 2166136261 >>> 0;
  for (const char of String(input)) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0 || 1;
}

class SeededRng {
  constructor(seed) { this.state = hashSeed(seed); }
  fromState(state) { this.state = (state >>> 0) || 1; return this; }
  next() {
    let x = this.state + 0x6D2B79F5;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    this.state = (x ^ (x >>> 14)) >>> 0;
    return this.state / 4294967296;
  }
  range(lo, hi) { return lo + this.next() * (hi - lo); }
  normal(mean = 0, deviation = 1) {
    const a = Math.max(this.next(), 1e-9);
    const b = Math.max(this.next(), 1e-9);
    return mean + Math.sqrt(-2 * Math.log(a)) * Math.cos(Math.PI * 2 * b) * deviation;
  }
  pick(values) { return values[Math.floor(this.next() * values.length)]; }
}

function shortId(prefix, seed) {
  return `${prefix}-${hashSeed(seed).toString(16).toUpperCase().padStart(8, "0")}`;
}

function event(state, type, message, detail = {}) {
  const next = state.events.length + 1;
  state.events.push({ id: `EVT-${String(next).padStart(4, "0")}`, timeSeconds: round(state.sim.clock, 3), type, message, ...detail });
  if (state.events.length > 500) state.events.splice(0, state.events.length - 500);
}

function addMeasurement(state, force = false) {
  const a = state.algae;
  if (!force && a.lastMeasurementAt !== null && state.sim.clock - a.lastMeasurementAt < a.measurementIntervalSeconds) return;
  a.lastMeasurementAt = state.sim.clock;
  a.measurements.push({
    timeHours: round(state.sim.clock / 3600, 3),
    biomassG: round(a.biomassG, 6),
    biomassConcG_L: round(a.biomassG / a.volumeL, 6),
    growthRatePerDay: round(a.derived.growthRatePerDay, 6),
    lightPpfd: round(a.parameters.lightPpfd, 3),
    temperatureC: round(a.parameters.temperatureC, 3),
    ph: round(a.parameters.ph, 3),
    dissolvedOxygenPct: round(a.derived.dissolvedOxygenPct, 3),
    turbidityAU: round(a.derived.turbidityAU, 5),
    carbonG_L: round(a.parameters.carbonG_L, 5),
    nitrogenMgL: round(a.parameters.nitrogenMgL, 4),
    health: a.derived.health,
    provenance: "synthetic simulation",
  });
  if (a.measurements.length > 480) a.measurements.shift();
}

function makeCell(rng, index) {
  const morphology = rng.pick(["spiral", "spiral", "rod", "oval", "coccus"]);
  const sizeUm = clamp(rng.normal(morphology === "spiral" ? 4.8 : 2.8, 0.75), 1.2, 7.2);
  const fluorescenceAU = clamp(rng.normal(0.67, 0.14), 0.16, 0.98);
  const lipidProxyPct = clamp(rng.normal(morphology === "spiral" ? 31 : 38, 8), 9, 62);
  const viability = clamp(rng.normal(0.87, 0.09), 0.35, 0.99);
  return {
    id: `CELL-${String(index + 1).padStart(3, "0")}`,
    state: "unprocessed",
    morphology,
    sizeUm: round(sizeUm, 3),
    optical: { fluorescenceAU: round(fluorescenceAU, 4), scatteringAU: round(clamp(rng.normal(0.5, 0.16), 0.08, 0.96), 4) },
    lipidProxyPct: round(lipidProxyPct, 3),
    viability: round(viability, 4),
    candidateScore: null,
    eligibleCandidate: false,
    selectionReason: "pending synthetic analysis",
    inferred: "synthetic fluorescence/lipid proxy; not a validated biochemical measurement",
    trajectory: { channelProgress: 0, chamber: null, droplet: null, x: 0.02, y: round(rng.range(0.3, 0.7), 4) },
    provenance: { sampleId: null, events: [] },
  };
}

function recordCell(cell, label) {
  cell.provenance.events.push(label);
}

function createSensorState() {
  return {
    provider: {
      id: "synthetic-mock",
      label: "Synthetic sensor provider",
      status: "synthetic",
      hardwareConnected: false,
      contractVersion: SENSOR_CONTRACT_VERSION,
    },
    latest: [],
    calibrationRecords: [],
  };
}

function createAlgaeState(params) {
  return {
    active: true,
    experimentId: null,
    candidateId: null,
    candidate: null,
    scenario: "baseline",
    volumeL: 18,
    initialBiomassG: 0.8,
    biomassG: 0.8,
    measurementIntervalSeconds: 900,
    lastMeasurementAt: null,
    parameters: deepCopy(params),
    derived: {
      health: "healthy",
      growthRatePerDay: 0,
      lightFactor: 0,
      temperatureFactor: 0,
      phFactor: 0,
      nutrientFactor: 0,
      carbonFactor: 0,
      oxygenFactor: 0,
      dissolvedOxygenPct: params.dissolvedOxygenPct,
      turbidityAU: 0.08,
      stressIndex: 0,
      carbonConsumedG: 0,
      nitrogenConsumedMg: 0,
    },
    measurements: [],
  };
}

export function createLabState(seed = "ORR-ALGAE-001") {
  const normalizedSeed = String(seed || "ORR-ALGAE-001").trim().slice(0, 64) || "ORR-ALGAE-001";
  const rng = new SeededRng(normalizedSeed);
  const cells = Array.from({ length: 36 }, (_, index) => makeCell(rng, index));
  const sampleId = shortId("SMP", normalizedSeed);
  for (const cell of cells) cell.provenance.sampleId = sampleId;
  const state = {
    format: LAB_FORMAT,
    version: LAB_VERSION,
    modelVersion: MODEL_VERSION,
    seed: normalizedSeed,
    synthetic: true,
    createdAt: new Date().toISOString(),
    savedAt: null,
    rngState: hashSeed(`${normalizedSeed}:pipeline`),
    sim: { clock: 0, running: false, speed: 1, mode: "overview", camera: "laboratory", accumulator: 0, visualTime: 0 },
    sample: {
      id: sampleId,
      status: "collected",
      provenance: { type: "synthetic", label: "Synthetic environmental sample", location: "simulated brackish collection site", collectedAt: "simulation day 0", observed: false },
      volumeMl: 100,
      preparedVolumeMl: null,
      cellCount: cells.length,
    },
    cyano: {
      stage: "sample",
      flowRateUlMin: 38,
      channelWidthUm: 180,
      channelLengthMm: 12,
      dropletDiameterUm: 85,
      inputConcentrationCellsMl: 52000,
      criteria: { minScore: 0.62, minViability: 0.7 },
      filterRecovery: null,
      processingProgress: 0,
      cells,
      droplets: [],
      isolations: [],
      selectedCellId: null,
      stats: { input: cells.length, prepared: 0, inChip: 0, analyzed: 0, isolated: 0, eligible: 0, lost: 0, filteredOut: 0, dropletLoss: 0, emptyDroplets: 0, multipletDroplets: 0 },
    },
    algae: createAlgaeState(SCENARIOS.baseline.params),
    sensors: createSensorState(),
    experiments: [],
    events: [],
    errors: [],
  };
  event(state, "sample.created", "Synthetic environmental sample created", { sampleId, cellCount: cells.length });
  recalculateAlgae(state, true);
  state.sensors.latest = syntheticSensorSnapshot(state);
  addMeasurement(state, true);
  return state;
}

function lightResponse(ppfd, isLit) {
  if (!isLit) return 0;
  const optimum = 280;
  const ratio = Math.max(0.001, ppfd / optimum);
  return clamp(ratio * Math.exp(1 - ratio), 0, 1);
}

function gaussianResponse(value, optimum, width) {
  return clamp(Math.exp(-((value - optimum) ** 2) / (2 * width ** 2)), 0, 1);
}

function recalculateAlgae(state, initializing = false) {
  const a = state.algae;
  const p = a.parameters;
  const hour = (state.sim.clock / 3600) % 24;
  const isLit = hour < clamp(p.photoperiodHours, 2, 24);
  const lightFactor = lightResponse(p.lightPpfd, isLit);
  const temperatureFactor = gaussianResponse(p.temperatureC, 30, 8);
  const phFactor = gaussianResponse(p.ph, 9.6, 1.15);
  const nutrientFactor = clamp(p.nitrogenMgL / (p.nitrogenMgL + 120), 0, 1);
  const carbonFactor = clamp(p.carbonG_L / (p.carbonG_L + 1.8), 0, 1);
  const oxygenStress = clamp(Math.max(0, p.dissolvedOxygenPct - 108) / 82, 0, 0.92);
  const oxygenFactor = clamp(1 - oxygenStress * (1.05 - p.aerationPct / 240), 0.05, 1);
  const mixingFactor = clamp(0.68 + p.mixingPct / 300, 0.68, 1);
  const factors = [lightFactor, temperatureFactor, phFactor, nutrientFactor, carbonFactor, oxygenFactor, mixingFactor];
  const productive = factors.reduce((product, factor) => product * factor, 1);
  const muMax = a.candidate?.morphology === "spiral" ? 0.31 : 0.27;
  const growthRatePerDay = clamp(muMax * productive, 0, muMax);
  const stressIndex = clamp(1 - productive, 0, 1);
  const health = stressIndex < 0.48 ? "healthy" : stressIndex < 0.72 ? "stressed" : "critical";
  const candidateBias = a.candidate ? clamp((a.candidate.lipidProxyPct - 30) / 150, -0.12, 0.18) : 0;
  const turbidityAU = clamp(0.08 + (a.biomassG / a.volumeL) * 0.14, 0.01, 2.4);
  a.derived = {
    health,
    growthRatePerDay: round(growthRatePerDay, 7),
    lightFactor: round(lightFactor, 5),
    temperatureFactor: round(temperatureFactor, 5),
    phFactor: round(phFactor, 5),
    nutrientFactor: round(nutrientFactor, 5),
    carbonFactor: round(carbonFactor, 5),
    oxygenFactor: round(oxygenFactor, 5),
    dissolvedOxygenPct: round(clamp(p.dissolvedOxygenPct, 0, 250), 4),
    turbidityAU: round(turbidityAU, 5),
    stressIndex: round(stressIndex, 5),
    carbonConsumedG: round(Math.max(0, a.biomassG - a.initialBiomassG) * (1.78 + candidateBias), 6),
    nitrogenConsumedMg: round(Math.max(0, a.biomassG - a.initialBiomassG) * (92 + candidateBias * 100), 5),
  };
  if (initializing) return;
  if (health === "critical" && (!state.events.length || state.events.at(-1).type !== "algae.warning")) {
    event(state, "algae.warning", "Synthetic model indicates critical culture stress", { health, stressIndex: a.derived.stressIndex });
  }
}

export function syntheticSensorSnapshot(state) {
  const a = state.algae;
  return [
    { key: "temperatureC", label: "Temperature", value: round(a.parameters.temperatureC, 3), unit: "°C", quality: "simulated", provenance: "synthetic simulation" },
    { key: "ph", label: "pH", value: round(a.parameters.ph, 3), unit: "pH", quality: "simulated", provenance: "synthetic simulation" },
    { key: "dissolvedOxygenPct", label: "Dissolved oxygen", value: round(a.parameters.dissolvedOxygenPct, 2), unit: "% saturation", quality: "simulated", provenance: "synthetic simulation" },
    { key: "turbidityAU", label: "Turbidity / OD proxy", value: round(a.derived.turbidityAU, 5), unit: "AU", quality: "simulated", provenance: "synthetic simulation" },
    { key: "lightPpfd", label: "Incident light", value: round(a.parameters.lightPpfd, 2), unit: "µmol m⁻² s⁻¹", quality: "simulated", provenance: "synthetic simulation" },
    { key: "carbonG_L", label: "Available carbon", value: round(a.parameters.carbonG_L, 4), unit: "g/L", quality: "simulated", provenance: "synthetic simulation" },
  ];
}

export function calibrateSensors(state) {
  const record = {
    id: `CAL-${String(state.sensors.calibrationRecords.length + 1).padStart(3, "0")}`,
    providerId: state.sensors.provider.id,
    timeSeconds: round(state.sim.clock, 3),
    status: "simulated calibration record",
    reference: "Synthetic reference values; no instrument or reference standard was connected.",
    channels: syntheticSensorSnapshot(state).map((reading) => ({ key: reading.key, unit: reading.unit, value: reading.value })),
    provenance: "synthetic simulation",
  };
  state.sensors.calibrationRecords.push(record);
  state.sensors.latest = syntheticSensorSnapshot(state);
  event(state, "sensors.calibrated", "Captured a synthetic sensor calibration record", { calibrationId: record.id });
  return record;
}

function processFlow(state, dt) {
  if (state.cyano.stage !== "flowing") return;
  const c = state.cyano;
  const residenceSeconds = clamp((c.channelLengthMm * 1000 * c.channelWidthUm) / Math.max(1, c.flowRateUlMin * 16), 12, 180);
  c.processingProgress = clamp(c.processingProgress + dt / residenceSeconds, 0, 1);
  for (const cell of c.cells) {
    if (cell.state !== "in-chip") continue;
    cell.trajectory.channelProgress = c.processingProgress;
    cell.trajectory.x = 0.04 + 0.88 * c.processingProgress;
    if (c.processingProgress >= 1) {
      cell.state = "analyzed";
      recordCell(cell, "entered analysis window");
    }
  }
  if (c.processingProgress >= 1) finishAnalysis(state);
}

function finishAnalysis(state) {
  const c = state.cyano;
  if (c.stage !== "flowing") return;
  c.stage = "analyzed";
  for (const cell of c.cells) {
    if (cell.state !== "analyzed") continue;
    const morphologyFactor = { spiral: 0.86, oval: 0.7, rod: 0.62, coccus: 0.56 }[cell.morphology] || 0.6;
    const sizeFactor = clamp(1 - Math.abs(cell.sizeUm - 4.2) / 6, 0.35, 1);
    cell.candidateScore = round(clamp(cell.lipidProxyPct / 75 * 0.36 + cell.optical.fluorescenceAU * 0.2 + cell.viability * 0.22 + morphologyFactor * 0.14 + sizeFactor * 0.08, 0, 1), 4);
    cell.eligibleCandidate = false;
    cell.selectionReason = "awaiting configured selection criteria";
    recordCell(cell, "synthetic optical analysis completed");
  }
  c.stats.analyzed = c.cells.filter((cell) => cell.state === "analyzed").length;
  event(state, "cyanoflow.analysis", "Synthetic optical and fluorescence analysis completed", { analyzed: c.stats.analyzed, note: "candidate scores are inferred proxies" });
}

function prepareSample(state) {
  const c = state.cyano;
  const rng = new SeededRng().fromState(state.rngState || hashSeed(`${state.seed}:pipeline`));
  const recovery = clamp(0.76 + rng.normal(0, 0.035), 0.6, 0.9);
  c.filterRecovery = round(recovery, 4);
  state.sample.preparedVolumeMl = round(state.sample.volumeMl * recovery, 3);
  state.sample.status = "prepared";
  c.stage = "prepared";
  let prepared = 0;
  for (const cell of c.cells) {
    if (rng.next() <= recovery) {
      prepared += 1;
      continue;
    }
    cell.state = "filtered-out";
    recordCell(cell, "lost during synthetic filtration and concentration");
  }
  c.stats.prepared = prepared;
  c.stats.filteredOut = c.cells.filter((cell) => cell.state === "filtered-out").length;
  c.stats.lost = c.stats.filteredOut;
  state.rngState = rng.state;
  event(state, "cyanoflow.prepared", "Sample filtered and concentrated", { recovery: c.filterRecovery, preparedVolumeMl: state.sample.preparedVolumeMl, preparedCells: prepared, filteredOut: c.stats.filteredOut });
}

function loadChip(state) {
  const c = state.cyano;
  c.stage = "flowing";
  c.processingProgress = 0;
  for (const cell of c.cells) {
    if (cell.state !== "unprocessed") continue;
    cell.state = "in-chip";
    cell.trajectory.channelProgress = 0;
    recordCell(cell, "entered microfluidic chip");
  }
  c.stats.inChip = c.cells.filter((cell) => cell.state === "in-chip").length;
  event(state, "cyanoflow.chip.loaded", "Prepared sample introduced into synthetic microfluidic chip", { inChip: c.stats.inChip, flowRateUlMin: c.flowRateUlMin });
}

function isolateCells(state) {
  const c = state.cyano;
  if (c.stage !== "analyzed") return;
  const rng = new SeededRng().fromState(state.rngState || hashSeed(`${state.seed}:pipeline`));
  const analyzable = c.cells.filter((cell) => cell.state === "analyzed");
  const dropletCount = Math.max(1, Math.round(analyzable.length / 0.72));
  const droplets = [];
  for (let i = 0; i < dropletCount; i++) {
    const roll = rng.next();
    const type = roll < 0.16 ? "empty" : roll < 0.25 ? "multiplet" : "single-cell";
    droplets.push({ id: `DROP-${String(i + 1).padStart(3, "0")}`, type, diameterUm: c.dropletDiameterUm, cellId: null, cellIds: [] });
  }
  let cellIndex = 0;
  for (const droplet of droplets) {
    if (droplet.type === "empty") continue;
    const occupancy = droplet.type === "multiplet" ? 2 : 1;
    for (let slot = 0; slot < occupancy && cellIndex < analyzable.length; slot += 1) {
      const cell = analyzable[cellIndex++];
      droplet.cellIds.push(cell.id);
      droplet.cellId ||= cell.id;
      cell.trajectory.droplet = droplet.id;
      if (droplet.type === "multiplet") {
        cell.state = "multiplet";
        recordCell(cell, "co-encapsulated with another cell");
        continue;
      }
      cell.state = "isolated";
      recordCell(cell, "isolated in single-cell droplet");
      c.isolations.push({ id: `ISO-${String(c.isolations.length + 1).padStart(3, "0")}`, cellId: cell.id, dropletId: droplet.id, score: cell.candidateScore, viability: cell.viability, status: "available", provenance: "synthetic isolation event" });
    }
  }
  while (cellIndex < analyzable.length) {
    const cell = analyzable[cellIndex++];
    cell.state = "lost";
    recordCell(cell, "not recovered in droplet generation");
  }
  state.rngState = rng.state;
  c.droplets = droplets;
  c.stage = "isolated";
  c.stats.isolated = c.cells.filter((cell) => cell.state === "isolated").length;
  c.stats.eligible = 0;
  for (const cell of c.cells) {
    if (cell.state !== "isolated") continue;
    cell.eligibleCandidate = cell.candidateScore >= c.criteria.minScore && cell.viability >= c.criteria.minViability;
    cell.selectionReason = cell.eligibleCandidate
      ? "meets configured synthetic selection criteria"
      : "below configured score or viability threshold";
    if (cell.eligibleCandidate) c.stats.eligible += 1;
  }
  c.stats.dropletLoss = c.cells.filter((cell) => cell.state === "lost").length;
  c.stats.lost = c.stats.filteredOut + c.stats.dropletLoss;
  c.stats.emptyDroplets = droplets.filter((drop) => drop.type === "empty").length;
  c.stats.multipletDroplets = droplets.filter((drop) => drop.type === "multiplet").length;
  const best = [...c.cells].filter((cell) => cell.state === "isolated" && cell.eligibleCandidate).sort((a, b) => b.candidateScore - a.candidateScore)[0];
  c.selectedCellId = best?.id || null;
  event(state, "cyanoflow.isolation", "Synthetic droplet isolation completed", { isolated: c.stats.isolated, eligible: c.stats.eligible, lost: c.stats.lost, emptyDroplets: c.stats.emptyDroplets, multipletDroplets: c.stats.multipletDroplets });
}

export function advanceWorkflow(state) {
  const stage = state.cyano.stage;
  if (stage === "sample") prepareSample(state);
  else if (stage === "prepared") loadChip(state);
  else if (stage === "flowing") { state.cyano.processingProgress = 1; processFlow(state, 0); }
  else if (stage === "analyzed") isolateCells(state);
  else if (stage === "isolated") {
    if (!transferSelected(state)) {
      state.cyano.stage = "complete";
      event(state, "cyanoflow.no-candidate", "No isolated cell met the configured synthetic selection criteria", { minScore: state.cyano.criteria.minScore, minViability: state.cyano.criteria.minViability });
    }
  }
  else event(state, "cyanoflow.complete", "Cyanoflow workflow is complete; candidate is available for comparison");
  return state;
}

export function runCompleteWorkflow(state) {
  let guard = 0;
  while (state.cyano.stage !== "transferred" && state.cyano.stage !== "complete" && guard++ < 12) advanceWorkflow(state);
  return state;
}

export function selectCell(state, cellId) {
  const cell = state.cyano.cells.find((item) => item.id === cellId);
  if (!cell) return false;
  state.cyano.selectedCellId = cellId;
  event(state, "cyanoflow.selection", `Selected ${cellId} for inspection`, { cellId });
  return true;
}

export function transferSelected(state) {
  if (!state.cyano.selectedCellId) {
    const best = [...state.cyano.cells].filter((cell) => cell.state === "isolated").sort((a, b) => b.candidateScore - a.candidateScore)[0];
    if (best) state.cyano.selectedCellId = best.id;
  }
  const cell = state.cyano.cells.find((item) => item.id === state.cyano.selectedCellId);
  if (!cell || cell.state !== "isolated" || !cell.eligibleCandidate) return false;
  cell.state = "transferred";
  recordCell(cell, "transferred to Algaephyte culture");
  const isolation = state.cyano.isolations.find((item) => item.cellId === cell.id);
  if (isolation) isolation.status = "transferred";
  startCultivation(state, cell.id);
  state.cyano.stage = "transferred";
  event(state, "cyanoflow.transfer", `Transferred ${cell.id} into Algaephyte culture`, { cellId: cell.id, score: cell.candidateScore });
  return true;
}

export function setSelectionCriteria(state, key, value) {
  const limits = { minScore: [0, 1], minViability: [0, 1] };
  if (!(key in limits)) return false;
  const [lo, hi] = limits[key];
  state.cyano.criteria[key] = round(clamp(Number(value), lo, hi), 4);
  if (state.cyano.stage === "isolated" || state.cyano.stage === "transferred") {
    for (const cell of state.cyano.cells) {
      if (cell.candidateScore === null) continue;
      cell.eligibleCandidate = cell.state === "isolated" && cell.candidateScore >= state.cyano.criteria.minScore && cell.viability >= state.cyano.criteria.minViability;
      cell.selectionReason = cell.eligibleCandidate ? "meets configured synthetic selection criteria" : "below configured score or viability threshold";
    }
    state.cyano.stats.eligible = state.cyano.cells.filter((cell) => cell.eligibleCandidate).length;
    const selected = state.cyano.cells.find((cell) => cell.id === state.cyano.selectedCellId);
    if (!selected?.eligibleCandidate) {
      state.cyano.selectedCellId = [...state.cyano.cells].filter((cell) => cell.eligibleCandidate).sort((a, b) => b.candidateScore - a.candidateScore)[0]?.id || null;
    }
  }
  event(state, "cyanoflow.criteria", `Updated ${key} selection threshold`, { key, value: state.cyano.criteria[key] });
  return true;
}

export function startCultivation(state, cellId = null) {
  const cell = cellId ? state.cyano.cells.find((item) => item.id === cellId) : null;
  state.algae.active = true;
  state.algae.candidateId = cell?.id || null;
  state.algae.candidate = cell ? deepCopy(cell) : null;
  state.algae.experimentId = `EXP-${String(state.experiments.length + 1).padStart(3, "0")}-${hashSeed(state.seed + state.experiments.length).toString(16).toUpperCase()}`;
  state.algae.initialBiomassG = cell ? 0.24 : 0.8;
  state.algae.biomassG = state.algae.initialBiomassG;
  state.algae.measurements = [];
  state.algae.lastMeasurementAt = null;
  recalculateAlgae(state, true);
  state.sensors.latest = syntheticSensorSnapshot(state);
  addMeasurement(state, true);
  event(state, "algae.experiment.started", cell ? `Started synthetic Algaephyte experiment with ${cell.id}` : "Started synthetic baseline Algaephyte experiment", { experimentId: state.algae.experimentId, candidateId: state.algae.candidateId });
}

export function applyScenario(state, scenarioId) {
  const scenario = SCENARIOS[scenarioId] || SCENARIOS.baseline;
  state.algae.scenario = SCENARIOS[scenarioId] ? scenarioId : "baseline";
  state.algae.parameters = deepCopy(scenario.params);
  recalculateAlgae(state, true);
  state.sensors.latest = syntheticSensorSnapshot(state);
  event(state, "algae.scenario", `Applied scenario: ${scenario.label}`, { scenario: state.algae.scenario });
  return state;
}

export function setParameter(state, key, value) {
  if (!(key in state.algae.parameters)) return false;
  const limits = { lightPpfd: [0, 1200], photoperiodHours: [2, 24], temperatureC: [10, 45], ph: [6, 12], dissolvedOxygenPct: [20, 220], carbonG_L: [0.05, 12], nitrogenMgL: [0, 900], mixingPct: [0, 100], aerationPct: [0, 100] };
  const [lo, hi] = limits[key];
  state.algae.parameters[key] = round(clamp(Number(value), lo, hi), 4);
  recalculateAlgae(state, true);
  state.sensors.latest = syntheticSensorSnapshot(state);
  return true;
}

export function setCyanoflowParameter(state, key, value) {
  const limits = { flowRateUlMin: [5, 180], channelWidthUm: [50, 600], channelLengthMm: [3, 40], dropletDiameterUm: [35, 180], inputConcentrationCellsMl: [1000, 250000] };
  if (!(key in limits)) return false;
  const [lo, hi] = limits[key];
  state.cyano[key] = round(clamp(Number(value), lo, hi), 4);
  return true;
}

function advanceFixedStep(state, dt) {
  state.sim.clock += dt;
  state.sim.visualTime += dt;
  processFlow(state, dt);
  const a = state.algae;
  if (a.active) {
    recalculateAlgae(state);
    const growth = a.biomassG * (Math.exp(a.derived.growthRatePerDay * dt / DAY_SECONDS) - 1);
    a.biomassG = clamp(a.biomassG + growth, 0, 100000);
    const lightOn = ((state.sim.clock / 3600) % 24) < a.parameters.photoperiodHours;
    const oxygenProduction = lightOn ? a.derived.lightFactor * (1.1 + a.biomassG / a.volumeL) : -0.3;
    const gasTransfer = (a.parameters.aerationPct / 100) * (a.parameters.mixingPct / 100) * 0.6;
    a.parameters.dissolvedOxygenPct = clamp(a.parameters.dissolvedOxygenPct + (oxygenProduction - gasTransfer) * dt / 120, 20, 220);
    a.parameters.carbonG_L = clamp(a.parameters.carbonG_L - growth * 1.78 / a.volumeL, 0.05, 12);
    a.parameters.nitrogenMgL = clamp(a.parameters.nitrogenMgL - growth * 92 / a.volumeL, 0, 900);
    recalculateAlgae(state);
    addMeasurement(state);
  }
  state.sensors.latest = syntheticSensorSnapshot(state);
}

export function step(state, dtSeconds = STEP_SECONDS) {
  let remaining = clamp(Number(dtSeconds) || STEP_SECONDS, 0, 86400);
  while (remaining > 0) {
    const dt = Math.min(STEP_SECONDS, remaining);
    advanceFixedStep(state, dt);
    remaining -= dt;
  }
  return state;
}

export function metrics(state) {
  const a = state.algae;
  const c = state.cyano;
  return {
    timeHours: round(state.sim.clock / 3600, 2),
    biomassG: round(a.biomassG, 4),
    biomassConcG_L: round(a.biomassG / a.volumeL, 4),
    growthRatePerDay: round(a.derived.growthRatePerDay, 4),
    health: a.derived.health,
    stressIndex: a.derived.stressIndex,
    ph: round(a.parameters.ph, 2),
    temperatureC: round(a.parameters.temperatureC, 2),
    dissolvedOxygenPct: round(a.parameters.dissolvedOxygenPct, 1),
    carbonG_L: round(a.parameters.carbonG_L, 2),
    cellsAnalyzed: c.stats.analyzed,
    cellsIsolated: c.stats.isolated,
    cellsEligible: c.stats.eligible,
    modeledLosses: c.stats.lost,
    selectedCellId: c.selectedCellId,
    stage: c.stage,
    sensorProvider: state.sensors?.provider?.status || "synthetic",
  };
}

export function explain(state) {
  const a = state.algae;
  const recommendations = [];
  if (a.derived.lightFactor < 0.65) recommendations.push("Review light intensity and photoperiod; the synthetic light response is limiting productivity.");
  if (a.derived.carbonFactor < 0.65) recommendations.push("Consider a carbon-availability scenario; the model is carbon-limited at the current g/L value.");
  if (a.derived.oxygenFactor < 0.65) recommendations.push("Review aeration and mixing assumptions; dissolved-oxygen inhibition is reducing the modeled rate.");
  if (a.derived.temperatureFactor < 0.75 || a.derived.phFactor < 0.75) recommendations.push("Compare a temperature or pH scenario before interpreting the growth trajectory.");
  if (!recommendations.length) recommendations.push("Baseline factors are within the configured productive band; capture a comparison before changing more than one condition.");
  return {
    mode: "offline rule-based explanation",
    confidence: "model-dependent; not an AI conclusion or biological diagnosis",
    summary: `${titleForHealth(a.derived.health)} synthetic state at ${round(a.biomassG / a.volumeL, 4)} g/L, with modeled growth of ${round(a.derived.growthRatePerDay, 4)} / day.`,
    recommendations,
    supportingMeasurements: [
      `Light factor ${round(a.derived.lightFactor * 100, 1)}%`,
      `Carbon factor ${round(a.derived.carbonFactor * 100, 1)}%`,
      `Oxygen factor ${round(a.derived.oxygenFactor * 100, 1)}%`,
      `Stress index ${round(a.derived.stressIndex * 100, 1)}%`,
    ],
    limitations: "Generated from the simplified synthetic model and its parameters. It does not infer real culture health, contamination, lipid content, or a validated intervention.",
  };
}

function titleForHealth(value) {
  return String(value || "unknown").replace(/^./, (char) => char.toUpperCase());
}

export function recordExperiment(state, label = "Captured synthetic run") {
  const a = state.algae;
  const snapshot = {
    id: a.experimentId || `EXP-${String(state.experiments.length + 1).padStart(3, "0")}`,
    label,
    seed: state.seed,
    scenario: a.scenario,
    candidateId: a.candidateId,
    createdAt: new Date().toISOString(),
    synthetic: true,
    parameters: deepCopy(a.parameters),
    selectionCriteria: deepCopy(state.cyano.criteria),
    sensorProvider: deepCopy(state.sensors.provider),
    results: { ...metrics(state), finalBiomassG: round(a.biomassG, 6), finalHealth: a.derived.health },
    measurements: deepCopy(a.measurements),
    note: "Synthetic simulation output; not an experimental observation.",
  };
  const existing = state.experiments.findIndex((item) => item.id === snapshot.id);
  if (existing >= 0) state.experiments[existing] = snapshot;
  else state.experiments.push(snapshot);
  event(state, "experiment.recorded", `Recorded ${snapshot.label}`, { experimentId: snapshot.id });
  return snapshot;
}

export function report(state) {
  return {
    format: "orr-biologicals-experiment-report",
    version: LAB_VERSION,
    generatedAt: new Date().toISOString(),
    synthetic: true,
    modelVersion: MODEL_VERSION,
    seed: state.seed,
    limitations: MODEL_ASSUMPTIONS,
    provenance: { sample: state.sample.provenance, measurements: "synthetic simulation", inferredTraits: "synthetic proxy fields; not validated lipid or strain measurements" },
    sample: deepCopy(state.sample),
    cyanoflow: { stage: state.cyano.stage, parameters: { flowRateUlMin: state.cyano.flowRateUlMin, channelWidthUm: state.cyano.channelWidthUm, channelLengthMm: state.cyano.channelLengthMm, dropletDiameterUm: state.cyano.dropletDiameterUm, inputConcentrationCellsMl: state.cyano.inputConcentrationCellsMl }, criteria: deepCopy(state.cyano.criteria), stats: deepCopy(state.cyano.stats), cells: deepCopy(state.cyano.cells), isolations: deepCopy(state.cyano.isolations) },
    algaephyte: { experimentId: state.algae.experimentId, scenario: state.algae.scenario, candidateId: state.algae.candidateId, parameters: deepCopy(state.algae.parameters), metrics: metrics(state), measurements: deepCopy(state.algae.measurements) },
    analysis: explain(state),
    experiments: deepCopy(state.experiments),
    sensors: { provider: deepCopy(state.sensors.provider), latest: deepCopy(state.sensors.latest), calibrationRecords: deepCopy(state.sensors.calibrationRecords) },
    events: deepCopy(state.events),
  };
}

export function serializeState(state) {
  return JSON.stringify({ format: LAB_FORMAT, version: LAB_VERSION, exportedAt: new Date().toISOString(), state }, null, 2);
}

export function parseState(text) {
  const payload = typeof text === "string" ? JSON.parse(text) : text;
  const state = payload?.state || payload;
  if (!state || state.format !== LAB_FORMAT || state.version !== LAB_VERSION) throw new Error("Unsupported Orr Biologicals lab file version");
  if (!state.seed || !state.sample?.id || !Array.isArray(state.cyano?.cells) || !state.algae?.parameters) throw new Error("Lab file is missing required experiment records");
  if (!state.sim || !state.cyano.stats || !Array.isArray(state.events) || !Array.isArray(state.experiments)) throw new Error("Lab file is missing simulation, event, or experiment records");
  if (!state.sensors) state.sensors = createSensorState();
  if (!state.sensors.provider) state.sensors.provider = createSensorState().provider;
  if (!Array.isArray(state.sensors.latest)) state.sensors.latest = [];
  if (!Array.isArray(state.sensors.calibrationRecords)) state.sensors.calibrationRecords = [];
  if (!state.rngState) state.rngState = hashSeed(`${state.seed}:pipeline`);
  if (!state.cyano.criteria) state.cyano.criteria = { minScore: 0.62, minViability: 0.7 };
  state.sim.running = false;
  state.sim.accumulator = 0;
  return state;
}

function deterministicSignature(state) {
  return JSON.stringify({
    seed: state.seed,
    clock: round(state.sim.clock, 4),
    stage: state.cyano.stage,
    stats: state.cyano.stats,
    selected: state.cyano.selectedCellId,
    cells: state.cyano.cells.map((cell) => [cell.id, cell.state, cell.candidateScore, cell.trajectory.droplet]),
    algae: { biomassG: round(state.algae.biomassG, 7), health: state.algae.derived.health, measurements: state.algae.measurements },
  });
}

export function runSelfTest() {
  const a = createLabState("SELF-TEST-42");
  const b = createLabState("SELF-TEST-42");
  runCompleteWorkflow(a); runCompleteWorkflow(b);
  for (let i = 0; i < 24; i++) { step(a, STEP_SECONDS * 60); step(b, STEP_SECONDS * 60); }
  const different = createLabState("SELF-TEST-43");
  runCompleteWorkflow(different);
  for (let i = 0; i < 24; i++) step(different, STEP_SECONDS * 60);
  return { sameSeedMatches: deterministicSignature(a) === deterministicSignature(b), differentSeedDiffers: deterministicSignature(a) !== deterministicSignature(different), massConsistent: Math.abs(metrics(a).biomassConcG_L - a.algae.biomassG / a.algae.volumeL) < 1e-4, workflowTransferred: a.cyano.stage === "transferred" && Boolean(a.algae.candidateId) };
}
