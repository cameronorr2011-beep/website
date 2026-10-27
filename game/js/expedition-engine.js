/*
 * Orr Biologicals deterministic exploration simulation.
 *
 * This file is deliberately independent from the browser, the DOM, rendering,
 * timers, and ambient randomness. A UI can keep the returned state object and
 * call the exported operations in response to input. Every generated value is
 * synthetic unless it is explicitly marked as a reference organism. A
 * reference label is not an identification claim.
 */

export const EXPEDITION_FORMAT = "orr-biologicals-expedition";
export const EXPEDITION_VERSION = 1;
export const MODEL_VERSION = "deterministic-expedition-1.0";
export const DEFAULT_SEED = "ORR-EXPEDITION-001";
export const STEP_SECONDS = 1;
export const ENVIRONMENT_TYPES = Object.freeze(["freshwater", "marine", "sediment", "terrestrial"]);

const clamp = (value, lower, upper) => Math.max(lower, Math.min(upper, value));
const round = (value, digits = 4) => Number(Number(value).toFixed(digits));
const finiteOr = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const deepCopy = (value) => JSON.parse(JSON.stringify(value));
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function hashSeed(input) {
  let hash = 2166136261 >>> 0;
  for (const character of String(input)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

class SeededRng {
  constructor(seed) {
    this.state = hashSeed(seed);
  }

  fromState(state) {
    this.state = (Number(state) >>> 0) || 1;
    return this;
  }

  next() {
    let value = this.state + 0x6D2B79F5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    this.state = (value ^ (value >>> 14)) >>> 0 || 1;
    return this.state / 4294967296;
  }

  range(lower, upper) {
    return lower + this.next() * (upper - lower);
  }

  normal(mean = 0, deviation = 1) {
    const first = Math.max(this.next(), 1e-9);
    const second = Math.max(this.next(), 1e-9);
    return mean + Math.sqrt(-2 * Math.log(first)) * Math.cos(Math.PI * 2 * second) * deviation;
  }

  pick(values) {
    return values[Math.floor(this.next() * values.length)];
  }
}

function normalizeSeed(seed) {
  const normalized = String(seed ?? DEFAULT_SEED).trim().slice(0, 64);
  return normalized || DEFAULT_SEED;
}

function stableId(prefix, ...parts) {
  const digest = hashSeed(parts.map((part) => String(part)).join("|"));
  return `${prefix}-${digest.toString(16).toUpperCase().padStart(8, "0")}`;
}

function normalizedEnvironment(environmentType) {
  const value = String(environmentType || "freshwater").trim().toLowerCase();
  return ENVIRONMENT_TYPES.includes(value) ? value : "freshwater";
}

const REGION_NAMES = Object.freeze({
  freshwater: ["Littoral Shelf", "Clearwater Basin", "Reedline Channel", "Deep Spring Edge"],
  marine: ["Sunlit Shelf", "Tidal Shelfbreak", "Pelagic Blue", "Twilight Dropoff"],
  sediment: ["Oxic Surface", "Fine Silt Terrace", "Mineral Seep", "Anoxic Boundary"],
  terrestrial: ["Canopy Margin", "Moist Soil Pocket", "Rocky Exposure", "Rootline Hollow"],
});

const REGION_LAYOUT = Object.freeze([
  { x: 0.50, y: 0.50, depth: 0.08 },
  { x: 0.22, y: 0.28, depth: 0.26 },
  { x: 0.77, y: 0.28, depth: 0.48 },
  { x: 0.74, y: 0.76, depth: 0.72 },
]);

const ENVIRONMENT_CONFIG = Object.freeze({
  freshwater: {
    label: "Freshwater",
    depthLabel: "water depth",
    maxDepthM: 80,
    horizontalSpeedMps: 13,
    verticalSpeedMps: 5,
    energyPerMeter: 0.028,
    depthEnergyPerMeter: 0.055,
    scanEnergy: 3.6,
    sampleEnergy: 6.4,
    cleanEnergyPerSecond: 0.52,
    cleanFoulingPerSecond: 0.075,
    cleanConditionPerSecond: 0.012,
    foulingMovementPerMeter: 0.00018,
    foulingSample: 0.15,
    scanRangeM: 180,
    sampleRangeM: 72,
    telemetryBase: {
      temperatureC: 21.5,
      ph: 7.7,
      dissolvedOxygenPct: 93,
      lightUmolM2S: 180,
      salinityPsu: 0.2,
      turbidityNTU: 3.2,
      moisturePct: null,
      conductivityMsCm: 0.54,
      redoxMv: 220,
    },
  },
  marine: {
    label: "Marine",
    depthLabel: "water depth",
    maxDepthM: 240,
    horizontalSpeedMps: 15,
    verticalSpeedMps: 6,
    energyPerMeter: 0.032,
    depthEnergyPerMeter: 0.078,
    scanEnergy: 4.3,
    sampleEnergy: 7.2,
    cleanEnergyPerSecond: 0.62,
    cleanFoulingPerSecond: 0.068,
    cleanConditionPerSecond: 0.010,
    foulingMovementPerMeter: 0.00024,
    foulingSample: 0.19,
    scanRangeM: 195,
    sampleRangeM: 78,
    telemetryBase: {
      temperatureC: 17.8,
      ph: 8.1,
      dissolvedOxygenPct: 91,
      lightUmolM2S: 260,
      salinityPsu: 35.1,
      turbidityNTU: 1.8,
      moisturePct: null,
      conductivityMsCm: 52,
      redoxMv: 190,
    },
  },
  sediment: {
    label: "Sediment",
    depthLabel: "sediment depth",
    maxDepthM: 90,
    horizontalSpeedMps: 5.5,
    verticalSpeedMps: 2.2,
    energyPerMeter: 0.043,
    depthEnergyPerMeter: 0.092,
    scanEnergy: 4.8,
    sampleEnergy: 8.4,
    cleanEnergyPerSecond: 0.75,
    cleanFoulingPerSecond: 0.085,
    cleanConditionPerSecond: 0.008,
    foulingMovementPerMeter: 0.00052,
    foulingSample: 0.26,
    scanRangeM: 125,
    sampleRangeM: 52,
    telemetryBase: {
      temperatureC: 18.7,
      ph: 7.2,
      dissolvedOxygenPct: 38,
      lightUmolM2S: 5,
      salinityPsu: 9.5,
      turbidityNTU: 68,
      moisturePct: 76,
      conductivityMsCm: 7.4,
      redoxMv: -40,
    },
  },
  terrestrial: {
    label: "Terrestrial",
    depthLabel: "soil depth",
    maxDepthM: 12,
    horizontalSpeedMps: 4.8,
    verticalSpeedMps: 1.6,
    energyPerMeter: 0.035,
    depthEnergyPerMeter: 0.075,
    scanEnergy: 3.1,
    sampleEnergy: 5.4,
    cleanEnergyPerSecond: 0.46,
    cleanFoulingPerSecond: 0.056,
    cleanConditionPerSecond: 0.014,
    foulingMovementPerMeter: 0.00031,
    foulingSample: 0.16,
    scanRangeM: 110,
    sampleRangeM: 46,
    telemetryBase: {
      temperatureC: 19.8,
      ph: 6.8,
      dissolvedOxygenPct: 20.9,
      lightUmolM2S: 90,
      salinityPsu: 0.3,
      turbidityNTU: 12,
      moisturePct: 61,
      conductivityMsCm: 1.2,
      redoxMv: 150,
    },
  },
});

export const ENVIRONMENTS = ENVIRONMENT_CONFIG;

const reference = (id, label, scientificName, sourceNote) => ({
  id,
  label,
  scientificName,
  classification: "reference",
  isRealReference: true,
  isFictional: false,
  provenance: {
    kind: "reference",
    label: "real reference organism",
    source: sourceNote,
    note: "Reference label only; a simulated scan is not a species identification.",
  },
});

export const REFERENCE_ORGANISMS = Object.freeze({
  freshwater: Object.freeze([
    reference("REF-ARTHROSPIRA-PLATENSIS", "Arthrospira platensis", "Arthrospira platensis", "taxonomic reference label"),
    reference("REF-CHLORELLA-VULGARIS", "Chlorella vulgaris", "Chlorella vulgaris", "taxonomic reference label"),
  ]),
  marine: Object.freeze([
    reference("REF-DUNALIELLA-SALINA", "Dunaliella salina", "Dunaliella salina", "taxonomic reference label"),
    reference("REF-NANNOCHLOROPSIS-OCEANICA", "Nannochloropsis oceanica", "Nannochloropsis oceanica", "taxonomic reference label"),
  ]),
  sediment: Object.freeze([
    reference("REF-GEOBACTER-SULFURREDUCENS", "Geobacter sulfurreducens", "Geobacter sulfurreducens", "taxonomic reference label"),
    reference("REF-BACILLUS-SUBTILIS", "Bacillus subtilis", "Bacillus subtilis", "taxonomic reference label"),
  ]),
  terrestrial: Object.freeze([
    reference("REF-NOSTOC-COMMUNE", "Nostoc commune", "Nostoc commune", "taxonomic reference label"),
    reference("REF-BACILLUS-SUBTILIS", "Bacillus subtilis", "Bacillus subtilis", "taxonomic reference label"),
  ]),
});

const SIMULATED_WORDS = Object.freeze(["Lumen", "Tidal", "Mica", "Ochre", "Drift", "Root", "Quartz", "Veil"]);

function makeSimulatedOrganism(seed, environmentType, regionIndex, hotspotIndex, rng) {
  const word = SIMULATED_WORDS[Math.floor(rng.next() * SIMULATED_WORDS.length)];
  const organismId = stableId("SIMORG", seed, environmentType, regionIndex, hotspotIndex);
  const label = `Simulated candidate ${word}-${organismId.slice(-4)}`;
  return {
    id: organismId,
    label,
    scientificName: null,
    classification: "simulated",
    isRealReference: false,
    isFictional: true,
    provenance: {
      kind: "simulated",
      label: "fictional candidate labeled simulated",
      source: "deterministic expedition model",
      note: "This candidate is fictional and must not be read as an observed organism.",
    },
  };
}

function makeSignal(seed, environmentType, regionIndex, hotspotIndex, signalIndex, organism, rng, primary = false) {
  const targetId = stableId("SIG", seed, environmentType, regionIndex, hotspotIndex, signalIndex);
  const prevalence = primary
    ? 0.92
    : clamp(0.38 + rng.range(-0.12, 0.16), 0.18, 0.88);
  return {
    id: targetId,
    classification: organism.classification,
    label: organism.label,
    organism: deepCopy(organism),
    prevalence: round(prevalence, 4),
    detectability: round(clamp(0.72 + rng.normal(0, 0.08), 0.42, 0.96), 4),
    sampleYieldMl: round(rng.range(1.6, 4.8), 3),
    signalProfile: {
      band: signalIndex === 0 ? "broad optical signal" : "low-amplitude morphology signal",
      persistence: round(clamp(rng.range(0.55, 0.94), 0, 1), 4),
    },
  };
}

function makeTelemetry(config, environmentType, rng, depthM, regionIndex, hotspotIndex) {
  const base = config.telemetryBase;
  const observed = {
    temperatureC: round(base.temperatureC + rng.normal(0, 1.15), 3),
    ph: round(clamp(base.ph + rng.normal(0, 0.14), 3.8, 10.8), 3),
    dissolvedOxygenPct: round(clamp(base.dissolvedOxygenPct + rng.normal(0, 8), 0, 160), 3),
    lightUmolM2S: round(clamp(base.lightUmolM2S * Math.exp(-depthM / Math.max(config.maxDepthM * 0.42, 1)) + rng.normal(0, Math.max(2, base.lightUmolM2S * 0.03)), 0, 1600), 3),
    salinityPsu: round(clamp(base.salinityPsu + rng.normal(0, environmentType === "marine" ? 0.55 : 0.18), 0, 45), 3),
    turbidityNTU: round(clamp(base.turbidityNTU * (1 + rng.normal(0, 0.13)), 0, 280), 3),
    moisturePct: base.moisturePct === null ? null : round(clamp(base.moisturePct + rng.normal(0, 5), 0, 100), 3),
    conductivityMsCm: round(clamp(base.conductivityMsCm * (1 + rng.normal(0, 0.08)), 0, 70), 4),
    redoxMv: round(clamp(base.redoxMv + rng.normal(0, 38) - depthM * 0.25, -600, 600), 3),
    pressureKPa: round(101.325 + depthM * (environmentType === "marine" ? 0.101 : 0.009), 3),
  };
  const productivity = clamp(
    (observed.lightUmolM2S / 320) *
      (1 - Math.abs(observed.temperatureC - 20) / 32) *
      (observed.dissolvedOxygenPct / 100) *
      (1 - observed.turbidityNTU / 360),
    0,
    1,
  );
  const inferred = {
    habitat: environmentType,
    depthBand: depthM < config.maxDepthM * 0.28 ? "shallow" : depthM < config.maxDepthM * 0.65 ? "midwater" : "deep",
    productivityIndex: round(productivity, 4),
    samplingSuitability: round(clamp(0.78 - observed.turbidityNTU / 500 - depthM / (config.maxDepthM * 5), 0.05, 0.98), 4),
    contaminationRisk: round(clamp(0.18 + observed.turbidityNTU / 380 + Math.max(0, 55 - observed.dissolvedOxygenPct) / 250, 0.03, 0.95), 4),
    regionIndex,
    hotspotIndex,
  };
  return {
    observed,
    inferred,
    provenance: {
      observed: "synthetic deterministic telemetry; not a field measurement",
      inferred: "deterministic model inference from synthetic telemetry",
    },
  };
}

function createWorld(seed, environmentType, rng) {
  const config = ENVIRONMENT_CONFIG[environmentType];
  const widthM = 1000;
  const heightM = 760;
  const startPosition = { x: widthM / 2, y: heightM / 2, z: 0 };
  const world = {
    id: stableId("WORLD", seed, environmentType),
    environmentType,
    dimensions: { widthM, heightM, maxDepthM: config.maxDepthM },
    axes: { x: "east-west", y: "north-south", z: `${config.depthLabel}; positive downward` },
    startPosition,
    regions: [],
    hotspots: [],
  };

  for (let regionIndex = 0; regionIndex < REGION_LAYOUT.length; regionIndex += 1) {
    const layout = REGION_LAYOUT[regionIndex];
    const regionId = stableId("REG", seed, environmentType, regionIndex);
    const center = {
      x: round(widthM * layout.x + rng.range(-52, 52), 3),
      y: round(heightM * layout.y + rng.range(-42, 42), 3),
      z: round(config.maxDepthM * layout.depth + rng.range(-config.maxDepthM * 0.055, config.maxDepthM * 0.055), 3),
    };
    const depthHalfRange = config.maxDepthM * (0.08 + rng.range(0.02, 0.08));
    const depthBand = {
      minM: round(clamp(center.z - depthHalfRange, 0, config.maxDepthM), 3),
      maxM: round(clamp(center.z + depthHalfRange, 0, config.maxDepthM), 3),
    };
    const region = {
      id: regionId,
      name: REGION_NAMES[environmentType][regionIndex],
      position: center,
      depthBand,
      telemetry: makeTelemetry(config, environmentType, rng, center.z, regionIndex, -1),
      hotspotIds: [],
    };
    world.regions.push(region);

    for (let hotspotIndex = 0; hotspotIndex < 2; hotspotIndex += 1) {
      const isLaunchHotspot = regionIndex === 0 && hotspotIndex === 0;
      const position = isLaunchHotspot
        ? {
            x: round(startPosition.x + rng.range(-62, 62), 3),
            y: round(startPosition.y + rng.range(-48, 48), 3),
            z: round(clamp(config.maxDepthM * 0.04 + rng.range(-2, 2), 0, config.maxDepthM), 3),
          }
        : {
            x: round(clamp(center.x + rng.range(-105, 105), 36, widthM - 36), 3),
            y: round(clamp(center.y + rng.range(-84, 84), 36, heightM - 36), 3),
            z: round(clamp(center.z + rng.range(-depthHalfRange, depthHalfRange), 0, config.maxDepthM), 3),
          };
      const hotspotId = stableId("HOT", seed, environmentType, regionIndex, hotspotIndex);
      const referenceOrganism = REFERENCE_ORGANISMS[environmentType][(regionIndex + hotspotIndex) % REFERENCE_ORGANISMS[environmentType].length];
      const simulatedOrganism = makeSimulatedOrganism(seed, environmentType, regionIndex, hotspotIndex, rng);
      const signals = [
        makeSignal(seed, environmentType, regionIndex, hotspotIndex, 0, referenceOrganism, rng, isLaunchHotspot),
        makeSignal(seed, environmentType, regionIndex, hotspotIndex, 1, simulatedOrganism, rng, isLaunchHotspot),
      ];
      const hotspot = {
        id: hotspotId,
        index: world.hotspots.length,
        regionId,
        name: `${region.name} / hotspot ${hotspotIndex + 1}`,
        position,
        radiusM: hotspotIndex === 0 ? 48 : 42,
        telemetry: makeTelemetry(config, environmentType, rng, position.z, regionIndex, hotspotIndex),
        signals,
        visited: false,
        scanCount: 0,
        lastScannedAtSeconds: null,
      };
      world.hotspots.push(hotspot);
      region.hotspotIds.push(hotspotId);
    }
  }
  return world;
}

function event(state, type, message, detail = {}) {
  const sequence = state.counters.event;
  state.counters.event += 1;
  state.events.push({
    id: `EVT-${String(sequence).padStart(4, "0")}`,
    timeSeconds: round(state.timeSeconds, 3),
    type,
    message,
    ...deepCopy(detail),
  });
  if (state.events.length > 500) state.events.splice(0, state.events.length - 500);
}

function setAction(state, action) {
  state.lastAction = {
    timeSeconds: round(state.timeSeconds, 3),
    ...deepCopy(action),
  };
  return state;
}

function failAction(state, type, reason, detail = {}) {
  event(state, "action.rejected", `${type} rejected: ${reason}`, { action: type, reason });
  return setAction(state, { type, ok: false, reason, ...detail });
}

function setClock(state, seconds) {
  state.timeSeconds = round(Math.max(0, seconds), 3);
  state.sim.clock = state.timeSeconds;
  state.sim.clockSeconds = state.timeSeconds;
}

function distance3(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);
}

function horizontalDistance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function clonePosition(position) {
  return { x: round(position.x, 3), y: round(position.y, 3), z: round(position.z, 3) };
}

function readyForProbeAction(state) {
  return state?.status === "deployed" && state?.probe?.status === "deployed";
}

function getHotspotInternal(state, hotspotId) {
  return state.world.hotspots.find((hotspot) => hotspot.id === hotspotId) || null;
}

function findNearestHotspotInternal(state, predicate = () => true) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const hotspot of state.world.hotspots) {
    if (!predicate(hotspot)) continue;
    const distance = distance3(state.probe.position, hotspot.position);
    if (distance < nearestDistance || (distance === nearestDistance && hotspot.id < nearest?.id)) {
      nearest = hotspot;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function getHotspot(state, hotspotId) {
  return getHotspotInternal(state, hotspotId);
}

export function findNearestHotspot(state, options = {}) {
  const predicate = options.unvisitedOnly ? (hotspot) => !hotspot.visited : () => true;
  return findNearestHotspotInternal(state, predicate);
}

export function hotspotDistance(state, hotspotId) {
  const hotspot = getHotspotInternal(state, hotspotId);
  return hotspot ? round(distance3(state.probe.position, hotspot.position), 3) : null;
}

function normalizeCreateArguments(seed, environmentType, options) {
  if (isObject(seed)) {
    const object = seed;
    return {
      seed: normalizeSeed(object.seed),
      environmentType: normalizedEnvironment(object.environmentType || object.environment || "freshwater"),
      options: object,
    };
  }
  if (isObject(environmentType)) {
    return {
      seed: normalizeSeed(seed),
      environmentType: normalizedEnvironment(environmentType.environmentType || environmentType.environment || "freshwater"),
      options: environmentType,
    };
  }
  return {
    seed: normalizeSeed(seed),
    environmentType: normalizedEnvironment(environmentType),
    options: isObject(options) ? options : {},
  };
}

export function createExpeditionState(seed = DEFAULT_SEED, environmentType = "freshwater", options = {}) {
  const normalized = normalizeCreateArguments(seed, environmentType, options);
  const normalizedSeed = normalized.seed;
  const environment = normalized.environmentType;
  const config = ENVIRONMENT_CONFIG[environment];
  const rng = new SeededRng(`${normalizedSeed}|${environment}|world`);
  const world = createWorld(normalizedSeed, environment, rng);
  const maxEnergy = round(clamp(finiteOr(normalized.options.maxEnergy, 100), 20, 1000), 3);
  const sampleCapacity = Math.floor(clamp(finiteOr(normalized.options.sampleCapacity, 3), 1, 24));
  const homePosition = clonePosition(world.startPosition);
  const state = {
    format: EXPEDITION_FORMAT,
    version: EXPEDITION_VERSION,
    modelVersion: MODEL_VERSION,
    seed: normalizedSeed,
    synthetic: true,
    environmentType: environment,
    environment: { type: environment, label: config.label },
    status: "deployed",
    timeSeconds: 0,
    sim: { clock: 0, clockSeconds: 0, running: false },
    world,
    probe: {
      id: stableId("PROBE", normalizedSeed, environment),
      status: "deployed",
      position: homePosition,
      homePosition: deepCopy(homePosition),
      depthM: 0,
      energy: maxEnergy,
      maxEnergy,
      condition: 1,
      fouling: 0,
      sampleCapacity,
      sampleCount: 0,
      samplesCollected: 0,
      horizontalSpeedMps: config.horizontalSpeedMps,
      verticalSpeedMps: config.verticalSpeedMps,
    },
    autonomy: {
      enabled: false,
      mode: "manual",
      targetHotspotId: null,
      cleanThreshold: 0.28,
      transitionCount: 0,
      transitions: [],
    },
    scans: [],
    detections: [],
    candidates: [],
    samples: [],
    recoveries: [],
    events: [],
    counters: { event: 1, scan: 1, detection: 1, sample: 1, recovery: 1, autonomy: 1 },
    rngState: rng.state,
    lastAction: null,
  };
  event(state, "expedition.deployed", `Deployed deterministic probe into ${config.label.toLowerCase()} environment`, {
    environmentType: environment,
    worldId: world.id,
    probeId: state.probe.id,
  });
  return state;
}

export function resetExpeditionState(stateOrSeed = DEFAULT_SEED, environmentType = "freshwater", options = {}) {
  if (isObject(stateOrSeed) && stateOrSeed.format === EXPEDITION_FORMAT) {
    const resetOptions = isObject(environmentType) ? environmentType : isObject(options) ? options : {};
    const stringArgumentIsEnvironment = typeof environmentType === "string" && ENVIRONMENT_TYPES.includes(environmentType.toLowerCase());
    const seed = resetOptions.seed ?? (!stringArgumentIsEnvironment && typeof environmentType === "string" ? environmentType : stateOrSeed.seed);
    const environment = resetOptions.environmentType ?? resetOptions.environment ?? (stringArgumentIsEnvironment ? environmentType : stateOrSeed.environmentType);
    const fresh = createExpeditionState(seed, environment, resetOptions);
    for (const key of Object.keys(stateOrSeed)) delete stateOrSeed[key];
    Object.assign(stateOrSeed, fresh);
    return stateOrSeed;
  }
  return createExpeditionState(stateOrSeed, environmentType, options);
}

export const createState = createExpeditionState;
export const resetState = resetExpeditionState;

export function deployExpedition(state) {
  if (!state || state.format !== EXPEDITION_FORMAT) throw new Error("Cannot deploy an unknown expedition state");
  if (state.status === "deployed" && state.probe.status === "deployed") return setAction(state, { type: "deploy", ok: true, noop: true });
  state.status = "deployed";
  state.probe.status = "deployed";
  state.probe.position = deepCopy(state.probe.homePosition);
  state.probe.depthM = 0;
  state.probe.energy = state.probe.maxEnergy;
  state.autonomy.enabled = false;
  state.autonomy.mode = "manual";
  state.autonomy.targetHotspotId = null;
  event(state, "expedition.redeployed", "Redeployed recovered probe from the home position", { probeId: state.probe.id });
  return setAction(state, { type: "deploy", ok: true, position: clonePosition(state.probe.position) });
}

export function moveProbe(state, direction = {}, durationSeconds = 1) {
  const type = "move";
  if (!readyForProbeAction(state)) return failAction(state, type, state?.status === "recovered" ? "probe-recovered" : "probe-unavailable");
  const duration = clamp(finiteOr(durationSeconds, 0), 0, 3600);
  if (duration <= 0) return setAction(state, { type, ok: true, noop: true });
  const config = ENVIRONMENT_CONFIG[state.environmentType];
  const rawX = finiteOr(direction?.x ?? direction?.dx, 0);
  const rawY = finiteOr(direction?.y ?? direction?.dy, 0);
  const rawDepth = finiteOr(direction?.depth ?? direction?.z ?? direction?.dz ?? direction?.vertical, 0);
  const horizontalMagnitude = Math.hypot(rawX, rawY);
  const scale = horizontalMagnitude > 1 ? 1 / horizontalMagnitude : 1;
  const xDirection = rawX * scale;
  const yDirection = rawY * scale;
  const depthDirection = clamp(rawDepth, -1, 1);
  const start = clonePosition(state.probe.position);
  const requested = {
    x: clamp(start.x + xDirection * state.probe.horizontalSpeedMps * duration, 0, state.world.dimensions.widthM),
    y: clamp(start.y + yDirection * state.probe.horizontalSpeedMps * duration, 0, state.world.dimensions.heightM),
    z: clamp(start.z + depthDirection * state.probe.verticalSpeedMps * duration, 0, state.world.dimensions.maxDepthM),
  };
  const requestedHorizontal = horizontalDistance(start, requested);
  const requestedDepth = Math.abs(requested.z - start.z);
  const requestedCost = (requestedHorizontal * config.energyPerMeter + requestedDepth * config.depthEnergyPerMeter) *
    (1 + state.probe.fouling * 0.62 + (1 - state.probe.condition) * 0.32);
  if (requestedHorizontal <= 0 && requestedDepth <= 0) return setAction(state, { type, ok: true, noop: true, position: start });
  const travelFraction = requestedCost > 0 ? clamp(state.probe.energy / requestedCost, 0, 1) : 1;
  const actual = {
    x: round(start.x + (requested.x - start.x) * travelFraction, 3),
    y: round(start.y + (requested.y - start.y) * travelFraction, 3),
    z: round(start.z + (requested.z - start.z) * travelFraction, 3),
  };
  const actualHorizontal = horizontalDistance(start, actual);
  const actualDepth = Math.abs(actual.z - start.z);
  const spent = (actualHorizontal * config.energyPerMeter + actualDepth * config.depthEnergyPerMeter) *
    (1 + state.probe.fouling * 0.62 + (1 - state.probe.condition) * 0.32);
  state.probe.position = actual;
  state.probe.depthM = actual.z;
  state.probe.energy = round(clamp(state.probe.energy - spent, 0, state.probe.maxEnergy), 4);
  state.probe.condition = round(clamp(state.probe.condition - (actualHorizontal * 0.00012 + actualDepth * 0.00026), 0, 1), 5);
  state.probe.fouling = round(clamp(state.probe.fouling + (actualHorizontal + actualDepth) * config.foulingMovementPerMeter, 0, 1), 5);
  if (state.probe.energy <= 0.0001) {
    state.probe.energy = 0;
    state.probe.status = "depleted";
    state.status = "depleted";
  }
  event(state, "probe.moved", "Probe moved through the synthetic world", {
    observed: { from: start, to: actual, horizontalDistanceM: round(actualHorizontal, 3), depthChangeM: round(actual.z - start.z, 3) },
    inferred: { energySpent: round(spent, 4), depthEnergySpent: round(actualDepth * config.depthEnergyPerMeter, 4) },
  });
  return setAction(state, {
    type,
    ok: true,
    position: actual,
    distanceM: round(actualHorizontal, 3),
    depthChangeM: round(actual.z - start.z, 3),
    energySpent: round(spent, 4),
    partial: travelFraction < 1,
  });
}

export const move = moveProbe;

export function scan(state, hotspotId = null) {
  const type = "scan";
  if (!readyForProbeAction(state)) return failAction(state, type, state?.status === "recovered" ? "probe-recovered" : "probe-unavailable");
  const config = ENVIRONMENT_CONFIG[state.environmentType];
  const requestedHotspotId = typeof hotspotId === "string" ? hotspotId : hotspotId?.id || null;
  const hotspot = requestedHotspotId ? getHotspotInternal(state, requestedHotspotId) : findNearestHotspotInternal(state);
  if (!hotspot) return failAction(state, type, "hotspot-not-found");
  const distance = distance3(state.probe.position, hotspot.position);
  if (distance > config.scanRangeM) return failAction(state, type, "out-of-range", { hotspotId: hotspot.id, distanceM: round(distance, 3), rangeM: config.scanRangeM });
  const energyBefore = state.probe.energy;
  const cost = config.scanEnergy * (1 + state.probe.fouling * 0.48 + (1 - state.probe.condition) * 0.25);
  if (state.probe.energy < cost) return failAction(state, type, "insufficient-energy", { requiredEnergy: round(cost, 4), energy: state.probe.energy });
  state.probe.energy = round(state.probe.energy - cost, 4);
  state.probe.condition = round(clamp(state.probe.condition - 0.0018, 0, 1), 5);
  state.probe.fouling = round(clamp(state.probe.fouling + 0.008, 0, 1), 5);
  const proximity = clamp(1 - distance / config.scanRangeM, 0, 1);
  const quality = clamp(0.52 + proximity * 0.43 - state.probe.fouling * 0.28 - (1 - state.probe.condition) * 0.2, 0.06, 0.98);
  const rng = new SeededRng().fromState(state.rngState);
  const attempts = [];
  const detections = [];
  for (let signalIndex = 0; signalIndex < hotspot.signals.length; signalIndex += 1) {
    const signal = hotspot.signals[signalIndex];
    const signalStrength = clamp(signal.detectability * (0.46 + proximity * 0.54) * (1 - state.probe.fouling * 0.3) + rng.normal(0, 0.035), 0, 1);
    const probability = clamp(signal.prevalence * signal.detectability * quality + 0.08, 0.02, 0.98);
    const guaranteedLaunchSignal = hotspot.index === 0 && quality >= 0.7;
    const detected = guaranteedLaunchSignal || rng.next() <= probability;
    const confidence = clamp(signalStrength * 0.56 + quality * 0.32 + signal.prevalence * 0.12 + rng.normal(0, 0.028), 0.04, 0.98);
    const uncertaintyWidth = clamp(0.46 - quality * 0.31 + state.probe.fouling * 0.14, 0.06, 0.46);
    const detectionId = `DET-${String(state.counters.detection).padStart(4, "0")}`;
    state.counters.detection += 1;
    const attempt = {
      id: detectionId,
      scanId: null,
      timeSeconds: round(state.timeSeconds, 3),
      hotspotId: hotspot.id,
      targetId: signal.id,
      classification: signal.classification,
      label: signal.label,
      detected,
      observed: {
        signalStrength: round(signalStrength, 4),
        signalBand: signal.signalProfile.band,
        position: clonePosition(state.probe.position),
        depthM: round(state.probe.depthM, 3),
        telemetry: deepCopy(hotspot.telemetry.observed),
      },
      inferred: {
        confidence: round(confidence, 4),
        uncertainty: {
          lower: round(clamp(confidence - uncertaintyWidth, 0, 1), 4),
          upper: round(clamp(confidence + uncertaintyWidth, 0, 1), 4),
        },
        interpretation: signal.classification === "reference"
          ? "reference signal only; not a confirmed species identification"
          : "fictional candidate signal; simulated and not an observed organism",
      },
      provenance: deepCopy(signal.organism.provenance),
    };
    attempts.push(attempt);
    if (detected) detections.push(attempt);
  }
  const scanId = `SCAN-${String(state.counters.scan).padStart(4, "0")}`;
  state.counters.scan += 1;
  for (const attempt of attempts) attempt.scanId = scanId;
  const scanRecord = {
    id: scanId,
    hotspotId: hotspot.id,
    regionId: hotspot.regionId,
    timeSeconds: round(state.timeSeconds, 3),
    observed: {
      position: clonePosition(state.probe.position),
      depthM: round(state.probe.depthM, 3),
      distanceM: round(distance, 3),
      telemetry: deepCopy(hotspot.telemetry.observed),
      energyBefore: round(energyBefore, 4),
      energyAfter: round(state.probe.energy, 4),
      signalAttempts: attempts.map((attempt) => ({ id: attempt.id, targetId: attempt.targetId, detected: attempt.detected, signalStrength: attempt.observed.signalStrength })),
    },
    inferred: {
      scanQuality: round(quality, 4),
      detectionCount: detections.length,
      uncertaintyRange: {
        lower: detections.length ? round(Math.min(...detections.map((item) => item.inferred.uncertainty.lower)), 4) : null,
        upper: detections.length ? round(Math.max(...detections.map((item) => item.inferred.uncertainty.upper)), 4) : null,
      },
      interpretation: "deterministic detection estimate with explicit uncertainty; not a biological identification",
    },
    detectionIds: detections.map((detection) => detection.id),
    detections: deepCopy(detections),
    provenance: "synthetic expedition scan",
  };
  state.scans.push(scanRecord);
  state.detections.push(...deepCopy(detections));
  state.rngState = rng.state;
  hotspot.visited = true;
  hotspot.scanCount += 1;
  hotspot.lastScannedAtSeconds = state.timeSeconds;
  event(state, "probe.scanned", `Scanned ${hotspot.name}`, {
    scanId,
    hotspotId: hotspot.id,
    observed: { distanceM: round(distance, 3), detectionCount: detections.length },
    inferred: { scanQuality: round(quality, 4), uncertainty: scanRecord.inferred.uncertaintyRange },
  });
  return setAction(state, {
    type,
    ok: true,
    scanId,
    hotspotId: hotspot.id,
    detectionIds: detections.map((detection) => detection.id),
    detections: deepCopy(detections),
    energySpent: round(cost, 4),
  });
}

export const scanArea = scan;

function targetIdFromArgument(targetOrOptions) {
  if (typeof targetOrOptions === "string") return targetOrOptions;
  if (isObject(targetOrOptions)) return targetOrOptions.targetId || targetOrOptions.signalId || targetOrOptions.id || null;
  return null;
}

function sampleAlreadyExists(state, targetId) {
  return state.samples.some((sample) => sample.targetId === targetId);
}

function createCandidateRecord(state, signal, detection) {
  const candidateId = stableId("CAND", state.seed, signal.id);
  return {
    id: candidateId,
    targetId: signal.id,
    label: signal.label,
    classification: signal.classification,
    organism: deepCopy(signal.organism),
    observed: {
      firstDetectionId: detection.id,
      firstDetectedAtSeconds: detection.timeSeconds ?? state.timeSeconds,
      hotspotId: detection.hotspotId,
      sampleIds: [],
    },
    inferred: {
      identity: signal.classification === "reference" ? signal.label : "fictional candidate; simulated",
      status: signal.classification === "reference" ? "reference label, not confirmed identification" : "simulated candidate",
      confidence: detection.inferred.confidence,
      uncertainty: deepCopy(detection.inferred.uncertainty),
      traits: {
        signalBand: signal.signalProfile.band,
        persistence: signal.signalProfile.persistence,
      },
    },
    provenance: deepCopy(signal.organism.provenance),
  };
}

export function collectSample(state, targetOrOptions = null) {
  const type = "collect";
  if (!readyForProbeAction(state)) return failAction(state, type, state?.status === "recovered" ? "probe-recovered" : "probe-unavailable");
  if (state.probe.sampleCount >= state.probe.sampleCapacity) return failAction(state, type, "sample-capacity-reached", { sampleCapacity: state.probe.sampleCapacity });
  const requestedReferenceId = targetIdFromArgument(targetOrOptions);
  const referencedDetection = state.detections.find((detection) => detection.id === requestedReferenceId);
  const requestedTargetId = referencedDetection?.targetId || requestedReferenceId;
  const requestedHotspotId = isObject(targetOrOptions) ? targetOrOptions.hotspotId : null;
  const config = ENVIRONMENT_CONFIG[state.environmentType];
  const candidateHotspots = requestedHotspotId ? [getHotspotInternal(state, requestedHotspotId)] : state.world.hotspots;
  const nearby = candidateHotspots
    .filter(Boolean)
    .map((hotspot) => ({ hotspot, distance: distance3(state.probe.position, hotspot.position) }))
    .filter((item) => item.distance <= config.sampleRangeM)
    .sort((first, second) => first.distance - second.distance || first.hotspot.id.localeCompare(second.hotspot.id));
  const located = nearby[0];
  if (!located) return failAction(state, type, "no-hotspot-in-sample-range", { rangeM: config.sampleRangeM });
  const eligibleDetections = state.detections
    .filter((detection) => detection.hotspotId === located.hotspot.id && (!requestedTargetId || detection.targetId === requestedTargetId))
    .filter((detection) => !sampleAlreadyExists(state, detection.targetId))
    .sort((first, second) => second.inferred.confidence - first.inferred.confidence || first.id.localeCompare(second.id));
  const detection = eligibleDetections[0];
  if (!detection) return failAction(state, type, requestedTargetId ? "target-not-detected-or-already-sampled" : "no-unsampled-detection", { hotspotId: located.hotspot.id });
  const signal = located.hotspot.signals.find((item) => item.id === detection.targetId);
  if (!signal) return failAction(state, type, "signal-not-found", { targetId: detection.targetId });
  const energyBefore = state.probe.energy;
  const cost = config.sampleEnergy * (1 + state.probe.fouling * 0.62 + (1 - state.probe.condition) * 0.25);
  if (state.probe.energy < cost) return failAction(state, type, "insufficient-energy", { requiredEnergy: round(cost, 4), energy: state.probe.energy });
  const rng = new SeededRng().fromState(state.rngState);
  const sampleId = `SMP-${String(state.counters.sample).padStart(4, "0")}`;
  state.counters.sample += 1;
  const candidateId = stableId("CAND", state.seed, signal.id);
  const sampleVolumeMl = round(clamp(signal.sampleYieldMl + rng.normal(0, 0.24), 0.4, 6), 3);
  const candidateRecord = state.candidates.find((candidate) => candidate.id === candidateId) || createCandidateRecord(state, signal, detection);
  const sample = {
    id: sampleId,
    candidateId,
    targetId: signal.id,
    hotspotId: located.hotspot.id,
    regionId: located.hotspot.regionId,
    classification: signal.classification,
    label: signal.label,
    observed: {
      collectedAtSeconds: round(state.timeSeconds, 3),
      position: clonePosition(state.probe.position),
      depthM: round(state.probe.depthM, 3),
      telemetry: deepCopy(located.hotspot.telemetry.observed),
      sampleVolumeMl,
      detectionId: detection.id,
      energyBefore: round(energyBefore, 4),
    },
    inferred: {
      identity: signal.classification === "reference" ? signal.label : "fictional candidate; simulated",
      classification: signal.classification,
      confidence: detection.inferred.confidence,
      uncertainty: deepCopy(detection.inferred.uncertainty),
      viabilityEstimate: round(clamp(0.72 + rng.normal(0, 0.09) - state.probe.fouling * 0.14, 0.18, 0.99), 4),
      traits: {
        signalBand: signal.signalProfile.band,
        persistence: signal.signalProfile.persistence,
      },
    },
    provenance: deepCopy(signal.organism.provenance),
  };
  state.probe.energy = round(clamp(state.probe.energy - cost, 0, state.probe.maxEnergy), 4);
  state.probe.condition = round(clamp(state.probe.condition - 0.012, 0, 1), 5);
  state.probe.fouling = round(clamp(state.probe.fouling + config.foulingSample, 0, 1), 5);
  state.probe.sampleCount += 1;
  state.probe.samplesCollected = state.probe.sampleCount;
  state.rngState = rng.state;
  state.samples.push(sample);
  if (!state.candidates.some((candidate) => candidate.id === candidateId)) state.candidates.push(candidateRecord);
  const savedCandidate = state.candidates.find((candidate) => candidate.id === candidateId);
  savedCandidate.observed.sampleIds.push(sampleId);
  savedCandidate.inferred.latestViabilityEstimate = sample.inferred.viabilityEstimate;
  event(state, "sample.collected", `Collected ${signal.classification === "reference" ? "reference" : "simulated"} sample ${sampleId}`, {
    sampleId,
    candidateId,
    classification: signal.classification,
    hotspotId: located.hotspot.id,
    observed: { volumeMl: sampleVolumeMl, depthM: sample.observed.depthM },
    inferred: { confidence: sample.inferred.confidence, uncertainty: sample.inferred.uncertainty },
  });
  return setAction(state, {
    type,
    ok: true,
    sampleId,
    candidateId,
    classification: signal.classification,
    label: signal.label,
    energySpent: round(cost, 4),
    fouling: state.probe.fouling,
  });
}

export const collect = collectSample;

function cleanProbeInternal(state, requestedSeconds) {
  const config = ENVIRONMENT_CONFIG[state.environmentType];
  const duration = clamp(finiteOr(requestedSeconds, 0), 0, 3600);
  if (duration <= 0 || state.probe.energy <= 0 || state.probe.fouling <= 0) return { seconds: 0, energySpent: 0, foulingRemoved: 0 };
  const possibleSeconds = Math.min(duration, state.probe.energy / config.cleanEnergyPerSecond);
  const energySpent = possibleSeconds * config.cleanEnergyPerSecond;
  const before = state.probe.fouling;
  state.probe.energy = round(clamp(state.probe.energy - energySpent, 0, state.probe.maxEnergy), 4);
  state.probe.fouling = round(clamp(state.probe.fouling - config.cleanFoulingPerSecond * possibleSeconds, 0, 1), 5);
  state.probe.condition = round(clamp(state.probe.condition + config.cleanConditionPerSecond * possibleSeconds, 0, 1), 5);
  return {
    seconds: round(possibleSeconds, 3),
    energySpent: round(energySpent, 4),
    foulingRemoved: round(before - state.probe.fouling, 5),
  };
}

export function cleanProbe(state, durationSeconds = 10) {
  const type = "clean";
  if (!readyForProbeAction(state)) return failAction(state, type, state?.status === "recovered" ? "probe-recovered" : "probe-unavailable");
  const result = cleanProbeInternal(state, durationSeconds);
  if (result.seconds <= 0) return failAction(state, type, state.probe.energy <= 0 ? "insufficient-energy" : "probe-already-clean", result);
  event(state, "probe.cleaned", "Probe cleaning cycle completed", { observed: result, inferred: { condition: state.probe.condition, fouling: state.probe.fouling } });
  return setAction(state, { type, ok: true, ...result, fouling: state.probe.fouling, condition: state.probe.condition });
}

export const clean = cleanProbe;

export function recoverProbe(state) {
  const type = "recover";
  if (!state || state.format !== EXPEDITION_FORMAT) throw new Error("Cannot recover an unknown expedition state");
  if (state.status === "recovered" && state.probe.status === "recovered") return setAction(state, { type, ok: true, noop: true });
  if (state.status !== "deployed" && state.status !== "depleted") return failAction(state, type, "probe-unavailable");
  const config = ENVIRONMENT_CONFIG[state.environmentType];
  const fromPosition = clonePosition(state.probe.position);
  const fromDepth = round(state.probe.depthM, 3);
  const distanceHome = distance3(state.probe.position, state.probe.homePosition);
  const recoveryCost = distanceHome * config.energyPerMeter * 0.45 + state.probe.depthM * config.depthEnergyPerMeter * 0.35;
  const energyBefore = state.probe.energy;
  const energySpent = Math.min(energyBefore, recoveryCost);
  state.probe.energy = round(Math.max(0, energyBefore - energySpent), 4);
  state.probe.position = deepCopy(state.probe.homePosition);
  state.probe.depthM = 0;
  state.probe.status = "recovered";
  state.status = "recovered";
  state.autonomy.enabled = false;
  state.autonomy.mode = "recovered";
  state.autonomy.targetHotspotId = null;
  const recovery = {
    id: `RCV-${String(state.counters.recovery).padStart(4, "0")}`,
    timeSeconds: round(state.timeSeconds, 3),
    observed: { fromPosition, depthM: fromDepth, energyBefore: round(energyBefore, 4) },
    inferred: { distanceHomeM: round(distanceHome, 3), energySpent: round(energySpent, 4), energyShortfall: round(Math.max(0, recoveryCost - energyBefore), 4) },
  };
  state.counters.recovery += 1;
  state.recoveries.push(recovery);
  event(state, "probe.recovered", "Probe recovered to the deployment position", { recoveryId: recovery.id, energySpent: recovery.inferred.energySpent });
  return setAction(state, { type, ok: true, recoveryId: recovery.id, energySpent: recovery.inferred.energySpent, position: clonePosition(state.probe.position) });
}

export const recover = recoverProbe;

function setAutonomyMode(state, mode, detail = {}) {
  if (state.autonomy.mode === mode) return;
  const previous = state.autonomy.mode;
  const transition = {
    id: `AUTO-${String(state.counters.autonomy).padStart(4, "0")}`,
    timeSeconds: round(state.timeSeconds, 3),
    from: previous,
    to: mode,
    ...deepCopy(detail),
  };
  state.counters.autonomy += 1;
  state.autonomy.mode = mode;
  state.autonomy.transitionCount += 1;
  state.autonomy.transitions.push(transition);
  event(state, "autonomy.transition", `Autonomy changed from ${previous} to ${mode}`, transition);
}

function chooseAutonomyTarget(state) {
  const unsampledHotspot = (hotspot) => hotspot.signals.some((signal) => !sampleAlreadyExists(state, signal.id));
  const candidates = state.world.hotspots
    .filter((hotspot) => unsampledHotspot(hotspot))
    .sort((first, second) => distance3(state.probe.position, first.position) - distance3(state.probe.position, second.position) || first.id.localeCompare(second.id));
  return candidates[0] || null;
}

function autonomyTick(state, seconds) {
  if (!state.autonomy.enabled || state.status === "recovered") return;
  if (state.status !== "deployed" && state.status !== "depleted") return;
  if (state.probe.status === "depleted" && state.autonomy.mode !== "returning") setAutonomyMode(state, "returning", { reason: "energy-depleted" });
  if (state.autonomy.mode === "manual") setAutonomyMode(state, "idle");

  if (state.autonomy.mode === "idle") {
    if (state.probe.fouling >= state.autonomy.cleanThreshold && state.probe.energy > 0) {
      setAutonomyMode(state, "cleaning", { reason: "fouling-threshold" });
    } else if (state.probe.sampleCount >= state.probe.sampleCapacity || state.probe.energy <= 8) {
      setAutonomyMode(state, "returning", { reason: state.probe.sampleCount >= state.probe.sampleCapacity ? "sample-capacity" : "low-energy" });
    } else {
      const target = chooseAutonomyTarget(state);
      if (!target) setAutonomyMode(state, "returning", { reason: "no-unsampled-hotspots" });
      else {
        state.autonomy.targetHotspotId = target.id;
        setAutonomyMode(state, "navigating", { targetHotspotId: target.id });
      }
    }
  }

  if (state.autonomy.mode === "cleaning") {
    const cleaned = cleanProbeInternal(state, seconds);
    if (cleaned.seconds > 0) {
      event(state, "autonomy.cleaning", "Autonomy ran a probe cleaning interval", { observed: cleaned, inferred: { fouling: state.probe.fouling, condition: state.probe.condition } });
    }
    if (state.probe.fouling <= state.autonomy.cleanThreshold || state.probe.energy <= 0) {
      if (state.probe.energy <= 0) setAutonomyMode(state, "returning", { reason: "energy-depleted-during-cleaning" });
      else setAutonomyMode(state, "idle", { reason: "fouling-cleared" });
    }
    return;
  }

  if (state.autonomy.mode === "navigating") {
    const target = getHotspotInternal(state, state.autonomy.targetHotspotId);
    if (!target) {
      state.autonomy.targetHotspotId = null;
      setAutonomyMode(state, "idle", { reason: "target-missing" });
      return;
    }
    const difference = {
      x: target.position.x - state.probe.position.x,
      y: target.position.y - state.probe.position.y,
      depth: target.position.z - state.probe.position.z,
    };
    moveProbe(state, difference, seconds);
    if (state.probe.status === "depleted") {
      setAutonomyMode(state, "returning", { reason: "energy-depleted" });
      return;
    }
    if (distance3(state.probe.position, target.position) <= ENVIRONMENT_CONFIG[state.environmentType].scanRangeM * 0.55) {
      setAutonomyMode(state, "scanning", { targetHotspotId: target.id });
    }
    return;
  }

  if (state.autonomy.mode === "scanning") {
    const target = getHotspotInternal(state, state.autonomy.targetHotspotId);
    if (!target) {
      setAutonomyMode(state, "idle", { reason: "target-missing" });
      return;
    }
    scan(state, target.id);
    const detections = state.detections.filter((detection) => detection.hotspotId === target.id && !sampleAlreadyExists(state, detection.targetId));
    if (detections.length) setAutonomyMode(state, "sampling", { targetHotspotId: target.id });
    else setAutonomyMode(state, "idle", { reason: "no-detection", targetHotspotId: target.id });
    return;
  }

  if (state.autonomy.mode === "sampling") {
    const target = getHotspotInternal(state, state.autonomy.targetHotspotId);
    if (!target) {
      setAutonomyMode(state, "idle", { reason: "target-missing" });
      return;
    }
    const detections = state.detections
      .filter((detection) => detection.hotspotId === target.id && !sampleAlreadyExists(state, detection.targetId))
      .sort((first, second) => second.inferred.confidence - first.inferred.confidence || first.id.localeCompare(second.id));
    const targetId = detections[0]?.targetId;
    const before = state.samples.length;
    if (targetId) collectSample(state, targetId);
    if (state.samples.length === before) {
      if (state.probe.sampleCount >= state.probe.sampleCapacity) setAutonomyMode(state, "returning", { reason: "sample-capacity" });
      else setAutonomyMode(state, "idle", { reason: "sampling-failed" });
    } else if (state.probe.fouling >= state.autonomy.cleanThreshold) {
      setAutonomyMode(state, "cleaning", { reason: "fouling-threshold" });
    } else {
      setAutonomyMode(state, "idle", { reason: "sample-collected" });
    }
    return;
  }

  if (state.autonomy.mode === "returning") {
    const difference = {
      x: state.probe.homePosition.x - state.probe.position.x,
      y: state.probe.homePosition.y - state.probe.position.y,
      depth: -state.probe.position.z,
    };
    if (distance3(state.probe.position, state.probe.homePosition) <= Math.max(8, ENVIRONMENT_CONFIG[state.environmentType].sampleRangeM * 0.25) || state.probe.status === "depleted") {
      recoverProbe(state);
      return;
    }
    moveProbe(state, difference, seconds);
    if (distance3(state.probe.position, state.probe.homePosition) <= Math.max(8, ENVIRONMENT_CONFIG[state.environmentType].sampleRangeM * 0.25)) recoverProbe(state);
  }
}

function advanceClock(state, seconds) {
  setClock(state, state.timeSeconds + seconds);
  if (state.autonomy.enabled) autonomyTick(state, seconds);
}

export function advanceTime(state, seconds = STEP_SECONDS) {
  if (!state || state.format !== EXPEDITION_FORMAT) throw new Error("Cannot advance an unknown expedition state");
  let remaining = clamp(finiteOr(seconds, 0), 0, 86400);
  while (remaining > 0) {
    const delta = Math.min(STEP_SECONDS, remaining);
    advanceClock(state, delta);
    remaining = round(remaining - delta, 6);
  }
  return setAction(state, { type: "advance-time", ok: true, seconds: finiteOr(seconds, 0), timeSeconds: state.timeSeconds });
}

export function advanceAutonomy(state, seconds = STEP_SECONDS) {
  if (!state || state.format !== EXPEDITION_FORMAT) throw new Error("Cannot advance an unknown expedition state");
  if (!state.autonomy.enabled && ["deployed", "depleted"].includes(state.status)) {
    state.autonomy.enabled = true;
    if (state.autonomy.mode === "manual") setAutonomyMode(state, "idle", { reason: "autonomy-enabled" });
  }
  return advanceTime(state, seconds);
}

export function setAutonomy(state, enabled = true) {
  if (!state || state.format !== EXPEDITION_FORMAT) throw new Error("Cannot configure an unknown expedition state");
  state.autonomy.enabled = Boolean(enabled);
  if (state.autonomy.enabled && state.status === "deployed" && state.autonomy.mode === "manual") setAutonomyMode(state, "idle", { reason: "autonomy-enabled" });
  if (!state.autonomy.enabled && state.status === "deployed" && !["recovered", "returning"].includes(state.autonomy.mode)) setAutonomyMode(state, "manual", { reason: "autonomy-disabled" });
  return setAction(state, { type: "set-autonomy", ok: true, enabled: state.autonomy.enabled, mode: state.autonomy.mode });
}

export const toggleAutonomy = setAutonomy;

export function getExpeditionSummary(state) {
  return {
    format: EXPEDITION_FORMAT,
    seed: state.seed,
    environmentType: state.environmentType,
    status: state.status,
    timeSeconds: round(state.timeSeconds, 3),
    probe: {
      position: clonePosition(state.probe.position),
      depthM: round(state.probe.depthM, 3),
      energy: round(state.probe.energy, 4),
      condition: round(state.probe.condition, 4),
      fouling: round(state.probe.fouling, 4),
      samples: state.probe.sampleCount,
      sampleCapacity: state.probe.sampleCapacity,
    },
    counts: {
      regions: state.world.regions.length,
      hotspots: state.world.hotspots.length,
      scans: state.scans.length,
      detections: state.detections.length,
      candidates: state.candidates.length,
      samples: state.samples.length,
    },
    autonomy: { enabled: state.autonomy.enabled, mode: state.autonomy.mode },
  };
}

export const metrics = getExpeditionSummary;

function uniqueIds(values, label, errors) {
  const seen = new Set();
  for (const value of values) {
    if (!value || typeof value.id !== "string" || !value.id) errors.push(`${label} contains a record without an id`);
    else if (seen.has(value.id)) errors.push(`${label} contains duplicate id ${value.id}`);
    else seen.add(value.id);
  }
}

function validateFiniteField(object, field, label, errors, lower = -Infinity, upper = Infinity) {
  if (!Number.isFinite(Number(object?.[field]))) errors.push(`${label}.${field} must be finite`);
  else if (Number(object[field]) < lower || Number(object[field]) > upper) errors.push(`${label}.${field} is outside bounds`);
}

export function validateExpeditionState(value) {
  const errors = [];
  if (!isObject(value)) return { valid: false, errors: ["state must be an object"] };
  if (value.format !== EXPEDITION_FORMAT) errors.push("unsupported expedition format");
  if (value.version !== EXPEDITION_VERSION) errors.push("unsupported expedition version");
  if (typeof value.seed !== "string" || !value.seed) errors.push("seed is required");
  if (!ENVIRONMENT_TYPES.includes(value.environmentType)) errors.push("environmentType is invalid");
  if (!["deployed", "depleted", "recovered"].includes(value.status)) errors.push("status is invalid");
  if (!Number.isFinite(Number(value.timeSeconds)) || Number(value.timeSeconds) < 0) errors.push("timeSeconds must be a non-negative number");
  if (!isObject(value.sim)) errors.push("sim record is required");
  else if (Math.abs(Number(value.sim.clock) - Number(value.timeSeconds)) > 0.01 || Math.abs(Number(value.sim.clockSeconds) - Number(value.timeSeconds)) > 0.01) errors.push("sim clock must match timeSeconds");
  if (!isObject(value.world)) errors.push("world record is required");
  if (!isObject(value.probe)) errors.push("probe record is required");
  if (!isObject(value.autonomy)) errors.push("autonomy record is required");
  if (!Array.isArray(value.events)) errors.push("events array is required");
  if (!Array.isArray(value.scans)) errors.push("scans array is required");
  if (!Array.isArray(value.detections)) errors.push("detections array is required");
  if (!Array.isArray(value.candidates)) errors.push("candidates array is required");
  if (!Array.isArray(value.samples)) errors.push("samples array is required");
  if (!Array.isArray(value.recoveries)) errors.push("recoveries array is required");
  if (!isObject(value.counters)) errors.push("counters record is required");
  if (!Number.isInteger(Number(value.rngState)) || Number(value.rngState) <= 0) errors.push("rngState must be a positive integer");

  if (isObject(value.world)) {
    if (value.world.environmentType !== value.environmentType) errors.push("world.environmentType must match environmentType");
    if (!isObject(value.world.dimensions)) errors.push("world dimensions are required");
    else {
      validateFiniteField(value.world.dimensions, "widthM", "world.dimensions", errors, 1, 1000000);
      validateFiniteField(value.world.dimensions, "heightM", "world.dimensions", errors, 1, 1000000);
      validateFiniteField(value.world.dimensions, "maxDepthM", "world.dimensions", errors, 0.1, 1000000);
    }
    if (!Array.isArray(value.world.regions)) errors.push("world.regions array is required");
    if (!Array.isArray(value.world.hotspots)) errors.push("world.hotspots array is required");
    if (Array.isArray(value.world.regions)) uniqueIds(value.world.regions, "world.regions", errors);
    if (Array.isArray(value.world.hotspots)) uniqueIds(value.world.hotspots, "world.hotspots", errors);
    if (Array.isArray(value.world.regions)) {
      for (const region of value.world.regions) {
        if (!isObject(region)) errors.push("world.regions contains a non-object record");
        else if (!isObject(region.telemetry) || !isObject(region.telemetry.observed) || !isObject(region.telemetry.inferred)) errors.push(`region ${region.id} telemetry must include observed and inferred fields`);
      }
    }
    if (Array.isArray(value.world.hotspots)) {
      for (const hotspot of value.world.hotspots) {
        if (!isObject(hotspot)) {
          errors.push("world.hotspots contains a non-object record");
          continue;
        }
        if (!isObject(hotspot.position)) errors.push(`hotspot ${hotspot.id} position is required`);
        else {
          validateFiniteField(hotspot.position, "x", `hotspot ${hotspot.id}.position`, errors, 0, Number(value.world.dimensions?.widthM ?? Infinity));
          validateFiniteField(hotspot.position, "y", `hotspot ${hotspot.id}.position`, errors, 0, Number(value.world.dimensions?.heightM ?? Infinity));
          validateFiniteField(hotspot.position, "z", `hotspot ${hotspot.id}.position`, errors, 0, Number(value.world.dimensions?.maxDepthM ?? Infinity));
        }
        if (!isObject(hotspot.telemetry) || !isObject(hotspot.telemetry.observed) || !isObject(hotspot.telemetry.inferred)) errors.push(`hotspot ${hotspot.id} telemetry must include observed and inferred fields`);
        if (!Array.isArray(hotspot.signals) || hotspot.signals.length < 1) errors.push(`hotspot ${hotspot.id} signals are required`);
        else {
          uniqueIds(hotspot.signals, `hotspot ${hotspot.id}.signals`, errors);
          for (const signal of hotspot.signals) {
            if (!isObject(signal)) {
              errors.push(`hotspot ${hotspot.id} contains a non-object signal`);
              continue;
            }
            if (!["reference", "simulated"].includes(signal.classification)) errors.push(`signal ${signal.id} classification is invalid`);
            if (!isObject(signal.organism) || !isObject(signal.organism.provenance)) errors.push(`signal ${signal.id} provenance is required`);
          }
        }
      }
    }
  }

  if (isObject(value.probe)) {
    if (!["deployed", "depleted", "recovered"].includes(value.probe.status)) errors.push("probe.status is invalid");
    if (!isObject(value.probe.position)) errors.push("probe.position is required");
    else {
      validateFiniteField(value.probe.position, "x", "probe.position", errors, 0, Number(value.world?.dimensions?.widthM ?? Infinity));
      validateFiniteField(value.probe.position, "y", "probe.position", errors, 0, Number(value.world?.dimensions?.heightM ?? Infinity));
      validateFiniteField(value.probe.position, "z", "probe.position", errors, 0, Number(value.world?.dimensions?.maxDepthM ?? Infinity));
    }
    validateFiniteField(value.probe, "depthM", "probe", errors, 0, Number(value.world?.dimensions?.maxDepthM ?? Infinity));
    validateFiniteField(value.probe, "energy", "probe", errors, 0, Number(value.probe.maxEnergy ?? Infinity));
    validateFiniteField(value.probe, "maxEnergy", "probe", errors, 0.1, 1000000);
    validateFiniteField(value.probe, "condition", "probe", errors, 0, 1);
    validateFiniteField(value.probe, "fouling", "probe", errors, 0, 1);
    validateFiniteField(value.probe, "sampleCapacity", "probe", errors, 1, 1000);
    validateFiniteField(value.probe, "sampleCount", "probe", errors, 0, Number(value.probe.sampleCapacity ?? Infinity));
    if (!Number.isInteger(Number(value.probe.sampleCapacity))) errors.push("probe.sampleCapacity must be an integer");
    if (Number.isFinite(Number(value.probe.samplesCollected)) && Number(value.probe.samplesCollected) !== Number(value.probe.sampleCount)) errors.push("probe.samplesCollected must match sampleCount");
    if (isObject(value.probe.position) && Math.abs(Number(value.probe.position.z) - Number(value.probe.depthM)) > 0.01) errors.push("probe.depthM must match probe.position.z");
  }

  for (const [key, values] of [["events", value.events], ["scans", value.scans], ["detections", value.detections], ["candidates", value.candidates], ["samples", value.samples], ["recoveries", value.recoveries]]) {
    if (Array.isArray(values)) uniqueIds(values, key, errors);
  }
  if (Array.isArray(value.scans)) {
    for (const scanRecord of value.scans) if (!isObject(scanRecord?.observed) || !isObject(scanRecord?.inferred)) errors.push(`scan ${scanRecord?.id || "unknown"} must include observed and inferred fields`);
  }
  if (Array.isArray(value.detections)) {
    for (const detection of value.detections) {
      if (!isObject(detection?.observed) || !isObject(detection?.inferred)) errors.push(`detection ${detection?.id || "unknown"} must include observed and inferred fields`);
      if (!['reference', 'simulated'].includes(detection?.classification)) errors.push(`detection ${detection?.id || "unknown"} classification is invalid`);
    }
  }
  if (Array.isArray(value.candidates)) {
    for (const candidate of value.candidates) {
      if (!isObject(candidate?.observed) || !isObject(candidate?.inferred) || !isObject(candidate?.provenance)) errors.push(`candidate ${candidate?.id || "unknown"} must include observed, inferred, and provenance fields`);
      if (!['reference', 'simulated'].includes(candidate?.classification)) errors.push(`candidate ${candidate?.id || "unknown"} classification is invalid`);
    }
  }
  if (Array.isArray(value.samples)) {
    for (const sample of value.samples) {
      if (!isObject(sample?.observed) || !isObject(sample?.inferred) || !isObject(sample?.provenance)) errors.push(`sample ${sample?.id || "unknown"} must include observed, inferred, and provenance fields`);
      if (!['reference', 'simulated'].includes(sample?.classification)) errors.push(`sample ${sample?.id || "unknown"} classification is invalid`);
    }
  }
  if (Array.isArray(value.samples) && isObject(value.probe) && Number(value.probe.sampleCount) !== value.samples.length) errors.push("probe.sampleCount must match samples length");
  if (Array.isArray(value.candidates) && Array.isArray(value.samples)) {
    const candidates = new Set(value.candidates.map((candidate) => candidate?.id));
    for (const sample of value.samples) if (!candidates.has(sample?.candidateId)) errors.push(`sample ${sample?.id || "unknown"} references a missing candidate`);
  }
  if (Array.isArray(value.detections)) {
    const signals = new Set((value.world?.hotspots || []).flatMap((hotspot) => (hotspot.signals || []).map((signal) => signal.id)));
    for (const detection of value.detections) if (!signals.has(detection?.targetId)) errors.push(`detection ${detection?.id || "unknown"} references a missing signal`);
  }
  return { valid: errors.length === 0, errors };
}

export const validateState = validateExpeditionState;

function assertValidState(state) {
  const result = validateExpeditionState(state);
  if (!result.valid) throw new Error(`Invalid Orr Biologicals expedition state: ${result.errors.join("; ")}`);
}

export function serializeState(state) {
  assertValidState(state);
  return JSON.stringify({
    format: EXPEDITION_FORMAT,
    version: EXPEDITION_VERSION,
    modelVersion: MODEL_VERSION,
    exportedAtSeconds: round(state.timeSeconds, 3),
    state,
  }, null, 2);
}

export function parseState(text) {
  let payload;
  try {
    payload = typeof text === "string" ? JSON.parse(text) : deepCopy(text);
  } catch (error) {
    throw new Error(`Malformed Orr Biologicals expedition JSON: ${error.message}`);
  }
  const state = payload?.state || payload;
  const result = validateExpeditionState(state);
  if (!result.valid) throw new Error(`Invalid Orr Biologicals expedition state: ${result.errors.join("; ")}`);
  return state;
}

export const serialize = serializeState;
export const parse = parseState;
