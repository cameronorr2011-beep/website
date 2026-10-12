/*
 * Orr Biologicals Algal Digital Lab simulation engine.
 *
 * This module is deliberately pure: it has no DOM, rendering, timers, I/O,
 * network access, or ambient randomness. A caller supplies a versioned input
 * snapshot and receives a versioned output snapshot. The model is an
 * illustrative biomass bookkeeping model, not a species-identification,
 * calibration, CFD, or production-performance claim.
 */

export const INPUT_FORMAT = "orr-biologicals-algal-simulation-input";
export const OUTPUT_FORMAT = "orr-biologicals-algal-simulation-output";
export const COMPARISON_FORMAT = "orr-biologicals-algal-simulation-comparison";
export const SWEEP_FORMAT = "orr-biologicals-algal-simulation-sweep";
export const SENSITIVITY_FORMAT = "orr-biologicals-algal-simulation-sensitivity";

export const INPUT_SCHEMA_VERSION = 1;
export const OUTPUT_SCHEMA_VERSION = 1;
export const INPUT_VERSION = INPUT_SCHEMA_VERSION;
export const OUTPUT_VERSION = OUTPUT_SCHEMA_VERSION;
export const MODEL_VERSION = "algal-biomass-logistic-1.0.0";
export const ENGINE_VERSION = "algal-digital-lab-engine-1.0.0";

export const DEFAULT_SCENARIO_ID = "baseline";
export const DEFAULT_DURATION_HOURS = 72;
export const DEFAULT_STEP_HOURS = 1;

export const WORKLOAD_LIMITS = Object.freeze({
  maxDurationHours: 24 * 365,
  maxIntegrationSteps: 100_000,
  maxSweepCases: 64,
  maxSweepSteps: 250_000,
  maxSensitivityDimensions: 8,
});

export const EQUATIONS = Object.freeze({
  biomass: "dX/dt = mu_eff * X * (1 - X/K)",
  euler: "X_next = X + dt_days * dX/dt",
  effectiveGrowth: "mu_eff = mu_max * f_light * f_temperature * f_pH * f_nutrient",
  lightSaturation: "f_light = lightPpfd / (lightPpfd + halfSaturationPpfd)",
  temperatureResponse: "f_temperature = exp(-0.5 * ((temperatureC - optimumC) / widthC)^2)",
  pHResponse: "f_pH = exp(-0.5 * ((pH - optimum) / width)^2)",
  nutrientResponse: "f_nutrient = nutrientMgL / (nutrientMgL + halfSaturationMgL)",
});

export const MODEL_ASSUMPTIONS = Object.freeze([
  "X is biomass concentration in g/L; K is the illustrative carrying capacity in g/L.",
  "The state equation is logistic growth: dX/dt = mu_eff * X * (1 - X/K).",
  "Integration uses fixed-step forward Euler with dt expressed in days.",
  "mu_eff is mu_max multiplied by the enabled light, temperature, pH, and nutrient response factors; a disabled factor equals 1.",
  "Light saturation is Monod-like; temperature and pH responses are Gaussian-shaped; nutrient response is Monod-like.",
  "endpointGrowthRatePerDay is the net specific endpoint rate (dX/dt)/X; a zero-biomass endpoint reports 0.",
  "Relative change uses delta divided by the absolute initial biomass; a zero-to-zero baseline is reported as 0 with an explicit status.",
  "Organism names are reference labels only. Profile parameters are illustrative placeholders for exploring the interface, not measured species claims.",
  "No measurement, calibration, species identification, process guarantee, or hardware control is implied by a simulation result.",
]);

const RESPONSE_FACTOR_KEYS = Object.freeze(["light", "temperature", "pH", "nutrient"]);
const MODEL_PATHS = Object.freeze([
  "model.muMaxPerDay",
  "model.carryingCapacityG_L",
  "model.volumeL",
  "model.environment.lightPpfd",
  "model.environment.temperatureC",
  "model.environment.pH",
  "model.environment.nutrientMgL",
  "model.responseFactors.light.enabled",
  "model.responseFactors.light.halfSaturationPpfd",
  "model.responseFactors.temperature.enabled",
  "model.responseFactors.temperature.optimumC",
  "model.responseFactors.temperature.widthC",
  "model.responseFactors.pH.enabled",
  "model.responseFactors.pH.optimum",
  "model.responseFactors.pH.width",
  "model.responseFactors.nutrient.enabled",
  "model.responseFactors.nutrient.halfSaturationMgL",
  "initialConditions.biomassG_L",
  "initialConditions.timeHours",
  "integration.durationHours",
  "integration.stepHours",
  "organism.profileId",
]);

export const PARAMETER_PATHS = MODEL_PATHS;

const DEFAULT_MODEL_CONFIGURATION = {
  muMaxPerDay: 0.28,
  carryingCapacityG_L: 2,
  volumeL: 1,
  environment: {
    lightPpfd: 220,
    temperatureC: 30,
    pH: 9.5,
    nutrientMgL: 250,
  },
  responseFactors: {
    light: { enabled: true, kind: "saturation", halfSaturationPpfd: 120 },
    temperature: { enabled: true, kind: "gaussian", optimumC: 30, widthC: 8 },
    pH: { enabled: true, kind: "gaussian", optimum: 9.5, width: 1.4 },
    nutrient: { enabled: true, kind: "monod", halfSaturationMgL: 45 },
  },
};

const ORGANISM_PROFILE_DATA = {
  arthrospira: {
    profileId: "arthrospira",
    label: "Arthrospira",
    scientificName: "Arthrospira spp.",
    classification: "reference / illustrative",
    parameterBasis: "illustrative placeholders; not species measurements",
    provenance: {
      kind: "reference-label",
      label: "real organism reference label",
      note: "The label is a reference for UI exploration; the simulation does not identify a culture or assert performance.",
    },
    illustrativeDefaults: {
      muMaxPerDay: 0.28,
      carryingCapacityG_L: 2,
      environment: { temperatureC: 30, pH: 9.5 },
    },
  },
  "chlorella-vulgaris": {
    profileId: "chlorella-vulgaris",
    label: "Chlorella vulgaris",
    scientificName: "Chlorella vulgaris",
    classification: "reference / illustrative",
    parameterBasis: "illustrative placeholders; not species measurements",
    provenance: {
      kind: "reference-label",
      label: "real organism reference label",
      note: "The label is a reference for UI exploration; the simulation does not identify a culture or assert performance.",
    },
    illustrativeDefaults: {
      muMaxPerDay: 0.28,
      carryingCapacityG_L: 2,
      environment: { temperatureC: 25, pH: 7.2 },
    },
  },
  "nannochloropsis-oceanica": {
    profileId: "nannochloropsis-oceanica",
    label: "Nannochloropsis oceanica",
    scientificName: "Nannochloropsis oceanica",
    classification: "reference / illustrative",
    parameterBasis: "illustrative placeholders; not species measurements",
    provenance: {
      kind: "reference-label",
      label: "real organism reference label",
      note: "The label is a reference for UI exploration; the simulation does not identify a culture or assert performance.",
    },
    illustrativeDefaults: {
      muMaxPerDay: 0.28,
      carryingCapacityG_L: 2,
      environment: { temperatureC: 22, pH: 8.1 },
    },
  },
  tetraselmis: {
    profileId: "tetraselmis",
    label: "Tetraselmis",
    scientificName: "Tetraselmis spp.",
    classification: "reference / illustrative",
    parameterBasis: "illustrative placeholders; not species measurements",
    provenance: {
      kind: "reference-label",
      label: "real organism reference label",
      note: "The label is a reference for UI exploration; the simulation does not identify a culture or assert performance.",
    },
    illustrativeDefaults: {
      muMaxPerDay: 0.28,
      carryingCapacityG_L: 2,
      environment: { temperatureC: 21, pH: 8.1 },
    },
  },
  pavlova: {
    profileId: "pavlova",
    label: "Pavlova",
    scientificName: "Pavlova spp.",
    classification: "reference / illustrative",
    parameterBasis: "illustrative placeholders; not species measurements",
    provenance: {
      kind: "reference-label",
      label: "real organism reference label",
      note: "The label is a reference for UI exploration; the simulation does not identify a culture or assert performance.",
    },
    illustrativeDefaults: {
      muMaxPerDay: 0.28,
      carryingCapacityG_L: 2,
      environment: { temperatureC: 20, pH: 8.1 },
    },
  },
  isochrysis: {
    profileId: "isochrysis",
    label: "Isochrysis",
    scientificName: "Isochrysis spp.",
    classification: "reference / illustrative",
    parameterBasis: "illustrative placeholders; not species measurements",
    provenance: {
      kind: "reference-label",
      label: "real organism reference label",
      note: "The label is a reference for UI exploration; the simulation does not identify a culture or assert performance.",
    },
    illustrativeDefaults: {
      muMaxPerDay: 0.28,
      carryingCapacityG_L: 2,
      environment: { temperatureC: 20, pH: 8.1 },
    },
  },
};

const PROFILE_ALIASES = Object.freeze({
  "arthrospira-spp": "arthrospira",
  "arthrospira-platensis": "arthrospira",
  "chlorella": "chlorella-vulgaris",
  "nannochloropsis": "nannochloropsis-oceanica",
  "nannochloropsis-oceanica": "nannochloropsis-oceanica",
  "tetraselmis-spp": "tetraselmis",
  "pavlova-spp": "pavlova",
  "isochrysis-spp": "isochrysis",
});

function deepCopy(value) {
  if (value === undefined || value === null || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value, digits = 10) {
  if (!isFiniteNumber(value)) return value;
  const rounded = Number(value.toFixed(digits));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function deepMerge(base, override) {
  if (!isPlainObject(override)) return deepCopy(base);
  const result = isPlainObject(base) ? deepCopy(base) : {};
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(result[key])) result[key] = deepMerge(result[key], value);
    else result[key] = deepCopy(value);
  }
  return result;
}

function error(path, message, code = "invalid") {
  return { path, message, code };
}

export class SimulationValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "SimulationValidationError";
    this.errors = errors;
  }
}

function failValidation(errors, context) {
  if (errors.length > 0) {
    throw new SimulationValidationError(`${context} validation failed`, errors);
  }
}

function normalizeProfileId(value) {
  const raw = isPlainObject(value) ? (value.profileId ?? value.id ?? value.key) : value;
  if (typeof raw !== "string") return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "-");
  if (Object.hasOwn(ORGANISM_PROFILE_DATA, key)) return key;
  return PROFILE_ALIASES[key] || null;
}

function profileSnapshot(profileId) {
  const profile = ORGANISM_PROFILE_DATA[profileId];
  return deepCopy({
    profileId: profile.profileId,
    label: profile.label,
    scientificName: profile.scientificName,
    classification: profile.classification,
    parameterBasis: profile.parameterBasis,
    provenance: profile.provenance,
  });
}

function assertObjectKeys(value, allowed, path, errors) {
  if (!isPlainObject(value)) {
    errors.push(error(path, "must be an object", "type"));
    return;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(error(`${path}.${key}`, "unsupported value or field", "unsupported"));
  }
}

function requireFiniteNumber(value, path, errors, { minimum = -Infinity, maximum = Infinity, exclusiveMinimum = false, exclusiveMaximum = false } = {}) {
  if (!isFiniteNumber(value)) {
    errors.push(error(path, "must be a finite number", "finite-number"));
    return;
  }
  const below = exclusiveMinimum ? value <= minimum : value < minimum;
  const above = exclusiveMaximum ? value >= maximum : value > maximum;
  if (below || above) errors.push(error(path, `must be ${exclusiveMinimum ? ">" : ">="} ${minimum} and ${exclusiveMaximum ? "<" : "<="} ${maximum}`, "range"));
}

function requireBoolean(value, path, errors) {
  if (typeof value !== "boolean") errors.push(error(path, "must be a boolean", "boolean"));
}

function validateResponseFactors(factors, errors, path = "model.responseFactors") {
  assertObjectKeys(factors, RESPONSE_FACTOR_KEYS, path, errors);
  if (!isPlainObject(factors)) return;

  const light = factors.light;
  assertObjectKeys(light, ["enabled", "kind", "halfSaturationPpfd"], `${path}.light`, errors);
  if (isPlainObject(light)) {
    requireBoolean(light.enabled, `${path}.light.enabled`, errors);
    if (light.kind !== "saturation") errors.push(error(`${path}.light.kind`, "only saturation is supported", "unsupported"));
    requireFiniteNumber(light.halfSaturationPpfd, `${path}.light.halfSaturationPpfd`, errors, { minimum: 0, exclusiveMinimum: true });
  }

  const temperature = factors.temperature;
  assertObjectKeys(temperature, ["enabled", "kind", "optimumC", "widthC"], `${path}.temperature`, errors);
  if (isPlainObject(temperature)) {
    requireBoolean(temperature.enabled, `${path}.temperature.enabled`, errors);
    if (temperature.kind !== "gaussian") errors.push(error(`${path}.temperature.kind`, "only gaussian is supported", "unsupported"));
    requireFiniteNumber(temperature.optimumC, `${path}.temperature.optimumC`, errors, { minimum: -20, maximum: 80 });
    requireFiniteNumber(temperature.widthC, `${path}.temperature.widthC`, errors, { minimum: 0, exclusiveMinimum: true });
  }

  const ph = factors.pH;
  assertObjectKeys(ph, ["enabled", "kind", "optimum", "width"], `${path}.pH`, errors);
  if (isPlainObject(ph)) {
    requireBoolean(ph.enabled, `${path}.pH.enabled`, errors);
    if (ph.kind !== "gaussian") errors.push(error(`${path}.pH.kind`, "only gaussian is supported", "unsupported"));
    requireFiniteNumber(ph.optimum, `${path}.pH.optimum`, errors, { minimum: 0, maximum: 14 });
    requireFiniteNumber(ph.width, `${path}.pH.width`, errors, { minimum: 0, exclusiveMinimum: true });
  }

  const nutrient = factors.nutrient;
  assertObjectKeys(nutrient, ["enabled", "kind", "halfSaturationMgL"], `${path}.nutrient`, errors);
  if (isPlainObject(nutrient)) {
    requireBoolean(nutrient.enabled, `${path}.nutrient.enabled`, errors);
    if (nutrient.kind !== "monod") errors.push(error(`${path}.nutrient.kind`, "only monod is supported", "unsupported"));
    requireFiniteNumber(nutrient.halfSaturationMgL, `${path}.nutrient.halfSaturationMgL`, errors, { minimum: 0, exclusiveMinimum: true });
  }
}

function validateModelConfiguration(model, errors, path = "model") {
  const allowed = ["muMaxPerDay", "carryingCapacityG_L", "volumeL", "environment", "responseFactors"];
  assertObjectKeys(model, allowed, path, errors);
  if (!isPlainObject(model)) return;
  requireFiniteNumber(model.muMaxPerDay, `${path}.muMaxPerDay`, errors, { minimum: 0, maximum: 10 });
  requireFiniteNumber(model.carryingCapacityG_L, `${path}.carryingCapacityG_L`, errors, { minimum: 0, exclusiveMinimum: true, maximum: 1_000_000 });
  requireFiniteNumber(model.volumeL, `${path}.volumeL`, errors, { minimum: 0, exclusiveMinimum: true, maximum: 1_000_000 });

  const environment = model.environment;
  assertObjectKeys(environment, ["lightPpfd", "temperatureC", "pH", "nutrientMgL"], `${path}.environment`, errors);
  if (isPlainObject(environment)) {
    requireFiniteNumber(environment.lightPpfd, `${path}.environment.lightPpfd`, errors, { minimum: 0, maximum: 10_000 });
    requireFiniteNumber(environment.temperatureC, `${path}.environment.temperatureC`, errors, { minimum: -20, maximum: 80 });
    requireFiniteNumber(environment.pH, `${path}.environment.pH`, errors, { minimum: 0, maximum: 14 });
    requireFiniteNumber(environment.nutrientMgL, `${path}.environment.nutrientMgL`, errors, { minimum: 0, maximum: 1_000_000 });
  }
  validateResponseFactors(model.responseFactors, errors);
}

function validateScenario(scenario, errors) {
  assertObjectKeys(scenario, ["id", "label"], "scenario", errors);
  if (!isPlainObject(scenario)) return;
  if (typeof scenario.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(scenario.id)) {
    errors.push(error("scenario.id", "must be a short identifier using letters, numbers, dot, underscore, or hyphen", "identifier"));
  }
  if (typeof scenario.label !== "string" || scenario.label.trim().length === 0 || scenario.label.length > 160) {
    errors.push(error("scenario.label", "must be a non-empty label of at most 160 characters", "text"));
  }
}

function validateOrganism(organism, errors) {
  assertObjectKeys(organism, ["profileId", "label", "scientificName", "classification", "parameterBasis", "provenance"], "organism", errors);
  if (!isPlainObject(organism)) return;
  if (!normalizeProfileId(organism.profileId) || normalizeProfileId(organism.profileId) !== organism.profileId) {
    errors.push(error("organism.profileId", "must be one of the supported reference/illustrative profiles", "unsupported"));
  }
  const expected = ORGANISM_PROFILE_DATA[organism.profileId];
  if (expected && organism.label !== expected.label) errors.push(error("organism.label", "does not match the selected profile", "mismatch"));
  if (organism.classification !== "reference / illustrative") errors.push(error("organism.classification", "must remain clearly labeled reference / illustrative", "provenance"));
  if (!isPlainObject(organism.provenance)) errors.push(error("organism.provenance", "must include provenance", "provenance"));
}

function validateIntegration(integration, errors) {
  assertObjectKeys(integration, ["method", "durationHours", "stepHours"], "integration", errors);
  if (!isPlainObject(integration)) return;
  if (integration.method !== "fixed-step-euler") errors.push(error("integration.method", "only fixed-step-euler is supported", "unsupported"));
  requireFiniteNumber(integration.durationHours, "integration.durationHours", errors, { minimum: 0, exclusiveMinimum: true, maximum: WORKLOAD_LIMITS.maxDurationHours });
  requireFiniteNumber(integration.stepHours, "integration.stepHours", errors, { minimum: 0, exclusiveMinimum: true, maximum: 24 });
  if (isFiniteNumber(integration.durationHours) && isFiniteNumber(integration.stepHours)) {
    const steps = integration.durationHours / integration.stepHours;
    if (!Number.isInteger(steps)) errors.push(error("integration", "durationHours must be evenly divisible by stepHours for fixed-step integration", "divisibility"));
    if (steps > WORKLOAD_LIMITS.maxIntegrationSteps) errors.push(error("integration", `step count exceeds ${WORKLOAD_LIMITS.maxIntegrationSteps}`, "workload-limit"));
  }
}

function validateInitialConditions(initialConditions, errors) {
  assertObjectKeys(initialConditions, ["timeHours", "biomassG_L"], "initialConditions", errors);
  if (!isPlainObject(initialConditions)) return;
  requireFiniteNumber(initialConditions.timeHours, "initialConditions.timeHours", errors, { minimum: 0, maximum: 1_000_000 });
  requireFiniteNumber(initialConditions.biomassG_L, "initialConditions.biomassG_L", errors, { minimum: 0, maximum: 1_000_000 });
}

export function validateSimulationInput(input) {
  const errors = [];
  if (!isPlainObject(input)) {
    return { valid: false, errors: [error("input", "must be an object", "type")] };
  }
  assertObjectKeys(input, ["format", "version", "schemaVersion", "modelVersion", "engineVersion", "scenario", "organism", "model", "initialConditions", "integration", "assumptions"], "input", errors);
  if (input.format !== INPUT_FORMAT) errors.push(error("format", `must be ${INPUT_FORMAT}`, "version"));
  if (input.version !== INPUT_VERSION) errors.push(error("version", `must be ${INPUT_VERSION}`, "version"));
  if (input.schemaVersion !== INPUT_SCHEMA_VERSION) errors.push(error("schemaVersion", `must be ${INPUT_SCHEMA_VERSION}`, "version"));
  if (input.modelVersion !== MODEL_VERSION) errors.push(error("modelVersion", `must be ${MODEL_VERSION}`, "version"));
  if (input.engineVersion !== ENGINE_VERSION) errors.push(error("engineVersion", `must be ${ENGINE_VERSION}`, "version"));
  validateScenario(input.scenario, errors);
  validateOrganism(input.organism, errors);
  validateModelConfiguration(input.model, errors);
  validateInitialConditions(input.initialConditions, errors);
  validateIntegration(input.integration, errors);
  if (!Array.isArray(input.assumptions) || input.assumptions.length === 0 || input.assumptions.some((assumption) => typeof assumption !== "string")) {
    errors.push(error("assumptions", "must be a non-empty array of text assumptions", "type"));
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidSimulationInput(input) {
  const result = validateSimulationInput(input);
  if (!result.valid) throw new SimulationValidationError("Simulation input validation failed", result.errors);
  return input;
}

function normalizedConfigOverrides(source) {
  if (!isPlainObject(source)) return {};
  const aliases = {
    muMax: "muMaxPerDay",
    K: "carryingCapacityG_L",
    carryingCapacity: "carryingCapacityG_L",
    lightPpfd: "environment.lightPpfd",
    temperatureC: "environment.temperatureC",
    pH: "environment.pH",
    ph: "environment.pH",
    nutrientMgL: "environment.nutrientMgL",
    nutrient: "environment.nutrientMgL",
  };
  const result = {};
  for (const [key, value] of Object.entries(source)) {
    const target = aliases[key] || key;
    if (target.includes(".")) {
      const [parent, child] = target.split(".");
      result[parent] ||= {};
      result[parent][child] = value;
    } else if (key === "responses") {
      result.responseFactors = value;
    } else result[target] = value;
  }
  return result;
}

function normalizeModelConfiguration(source, profileId) {
  const profileDefaults = profileId ? ORGANISM_PROFILE_DATA[profileId].illustrativeDefaults : {};
  const input = isPlainObject(source) ? source : {};
  const merged = deepMerge(DEFAULT_MODEL_CONFIGURATION, profileDefaults);
  const aliases = normalizedConfigOverrides(input);
  const responseSource = aliases.responseFactors || input.responseFactors;
  const result = deepMerge(merged, aliases);
  if (responseSource) result.responseFactors = deepMerge(merged.responseFactors, responseSource);
  return result;
}

export function createModelConfiguration(overrides = {}, organism = "arthrospira") {
  const profileId = normalizeProfileId(organism);
  if (!profileId) throw new SimulationValidationError("Unsupported organism profile", [error("organism", "must be supported", "unsupported")]);
  if (!isPlainObject(overrides)) throw new SimulationValidationError("Model configuration options must be an object", [error("model", "must be an object", "type")]);
  const source = isPlainObject(overrides.configuration) && overrides.snapshotVersion !== undefined ? overrides.configuration : overrides;
  const model = normalizeModelConfiguration(source, profileId);
  const errors = [];
  validateModelConfiguration(model, errors);
  failValidation(errors, "Model configuration");
  return model;
}

export const createModelConfig = createModelConfiguration;

function normalizeScenario(source) {
  const scenario = isPlainObject(source) ? source : {};
  const id = scenario.id ?? DEFAULT_SCENARIO_ID;
  const label = scenario.label ?? (id === DEFAULT_SCENARIO_ID ? "Baseline illustrative culture" : String(id));
  return { id: String(id), label: String(label) };
}

function normalizeInputSource(options) {
  if (!isPlainObject(options)) throw new SimulationValidationError("Simulation input options must be an object", [error("input", "must be an object", "type")]);

  const allowedOptionKeys = [
    "organism", "organismId", "scenario", "scenarioId", "scenarioLabel", "model", "configuration", "modelConfiguration", "modelConfigurationSnapshot",
    "initialConditions", "initialBiomassG_L", "initialBiomassGPerL", "initialBiomass", "initialTimeHours",
    "durationHours", "hours", "stepHours", "integration", "simulation",
  ];
  const unsupportedOptions = Object.keys(options).filter((key) => !allowedOptionKeys.includes(key));
  if (unsupportedOptions.length > 0) {
    throw new SimulationValidationError("Unsupported simulation input option", unsupportedOptions.map((key) => error(key, "unsupported value or field", "unsupported")));
  }
  for (const key of ["scenario", "model", "configuration", "modelConfiguration", "modelConfigurationSnapshot", "initialConditions", "integration", "simulation"]) {
    if (options[key] !== undefined && !isPlainObject(options[key])) {
      throw new SimulationValidationError("Invalid simulation input option", [error(key, "must be an object", "type")]);
    }
  }
  const optionObjectRules = [
    ["scenario", ["id", "label"]],
    ["initialConditions", ["timeHours", "biomassG_L", "biomassGPerL", "biomass", "X"]],
    ["integration", ["method", "durationHours", "stepHours"]],
    ["simulation", ["method", "durationHours", "stepHours"]],
  ];
  for (const [key, allowedKeys] of optionObjectRules) {
    if (options[key] === undefined) continue;
    const unsupported = Object.keys(options[key]).filter((nestedKey) => !allowedKeys.includes(nestedKey));
    if (unsupported.length > 0) {
      throw new SimulationValidationError("Unsupported simulation input option", unsupported.map((nestedKey) => error(`${key}.${nestedKey}`, "unsupported value or field", "unsupported")));
    }
  }

  const profileId = normalizeProfileId(options.organism ?? options.organismId ?? "arthrospira");
  if (!profileId) throw new SimulationValidationError("Unsupported organism profile", [error("organism", "must be one of the supported reference/illustrative profiles", "unsupported")]);

  const profile = ORGANISM_PROFILE_DATA[profileId];
  const rawSourceModel = options.model ?? options.configuration ?? options.modelConfiguration ?? options.modelConfigurationSnapshot ?? {};
  const sourceModel = isPlainObject(rawSourceModel?.configuration) && rawSourceModel.snapshotVersion !== undefined
    ? rawSourceModel.configuration
    : rawSourceModel;
  const model = normalizeModelConfiguration(sourceModel, profileId);
  const initialSource = options.initialConditions ?? {};
  const initialBiomass = initialSource.biomassG_L
    ?? initialSource.biomassGPerL
    ?? initialSource.biomass
    ?? initialSource.X
    ?? options.initialBiomassG_L
    ?? options.initialBiomassGPerL
    ?? options.initialBiomass
    ?? 0.1;
  const initialTime = initialSource.timeHours ?? options.initialTimeHours ?? 0;
  const integrationSource = options.integration ?? options.simulation ?? {};
  const durationHours = integrationSource.durationHours ?? options.durationHours ?? options.hours ?? DEFAULT_DURATION_HOURS;
  const stepHours = integrationSource.stepHours ?? options.stepHours ?? DEFAULT_STEP_HOURS;
  const method = integrationSource.method === "euler" ? "fixed-step-euler" : (integrationSource.method ?? "fixed-step-euler");
  const scenario = normalizeScenario(options.scenario ?? {
    id: options.scenarioId,
    label: options.scenarioLabel,
  });

  return {
    format: INPUT_FORMAT,
    version: INPUT_VERSION,
    schemaVersion: INPUT_SCHEMA_VERSION,
    modelVersion: MODEL_VERSION,
    engineVersion: ENGINE_VERSION,
    scenario,
    organism: profileSnapshot(profileId),
    model,
    initialConditions: {
      timeHours: initialTime,
      biomassG_L: initialBiomass,
    },
    integration: {
      method,
      durationHours,
      stepHours,
    },
    assumptions: deepCopy(MODEL_ASSUMPTIONS),
  };
}

export function createSimulationInput(options = {}) {
  if (isPlainObject(options) && options.format === INPUT_FORMAT) {
    const snapshot = deepCopy(options);
    assertValidSimulationInput(snapshot);
    return snapshot;
  }
  const input = normalizeInputSource(options);
  assertValidSimulationInput(input);
  return input;
}

export const createInput = createSimulationInput;

export function getOrganismProfiles() {
  return deepCopy(Object.values(ORGANISM_PROFILE_DATA));
}

export const ORGANISM_PROFILES = deepFreeze(deepCopy(ORGANISM_PROFILE_DATA));
export const ORGANISMS = ORGANISM_PROFILES;
export const DEFAULT_MODEL = deepFreeze(deepCopy(DEFAULT_MODEL_CONFIGURATION));

function ensureInput(input) {
  if (isPlainObject(input) && input.format === INPUT_FORMAT) return createSimulationInput(input);
  return createSimulationInput(input);
}

function responseFactors(model) {
  const environment = model.environment;
  const configured = model.responseFactors;
  const light = configured.light.enabled
    ? environment.lightPpfd / (environment.lightPpfd + configured.light.halfSaturationPpfd)
    : 1;
  const temperature = configured.temperature.enabled
    ? Math.exp(-0.5 * ((environment.temperatureC - configured.temperature.optimumC) / configured.temperature.widthC) ** 2)
    : 1;
  const pH = configured.pH.enabled
    ? Math.exp(-0.5 * ((environment.pH - configured.pH.optimum) / configured.pH.width) ** 2)
    : 1;
  const nutrient = configured.nutrient.enabled
    ? environment.nutrientMgL / (environment.nutrientMgL + configured.nutrient.halfSaturationMgL)
    : 1;
  return {
    light: clamp(light, 0, 1),
    temperature: clamp(temperature, 0, 1),
    pH: clamp(pH, 0, 1),
    nutrient: clamp(nutrient, 0, 1),
  };
}

export function computeResponseFactors(modelOrInput) {
  const model = isPlainObject(modelOrInput) && isPlainObject(modelOrInput.model)
    ? modelOrInput.model
    : modelOrInput;
  const errors = [];
  validateModelConfiguration(model, errors);
  failValidation(errors, "Model configuration");
  return deepCopy(responseFactors(model));
}

function modelStateAt(x, model) {
  const factors = responseFactors(model);
  const muEffPerDay = model.muMaxPerDay * factors.light * factors.temperature * factors.pH * factors.nutrient;
  const derivativeG_LPerDay = muEffPerDay * x * (1 - x / model.carryingCapacityG_L);
  return {
    factors,
    muEffPerDay,
    derivativeG_LPerDay,
  };
}

export function computeEffectiveGrowthRate(modelOrInput) {
  const model = isPlainObject(modelOrInput) && isPlainObject(modelOrInput.model)
    ? modelOrInput.model
    : modelOrInput;
  const state = modelStateAt(1, model);
  return state.muEffPerDay;
}

function relativeChange(initial, final) {
  if (initial === 0) {
    return final === 0 ? 0 : null;
  }
  return (final - initial) / Math.abs(initial);
}

function relativeChangeStatus(initial, final) {
  if (initial !== 0) return { defined: true, reason: "non-zero-baseline" };
  if (final === 0) return { defined: true, reason: "zero-baseline-no-change" };
  return { defined: false, reason: "zero-baseline-undefined" };
}

function timePoint({ step, timeHours, biomassG_L, initialBiomassG_L, model }) {
  const state = modelStateAt(biomassG_L, model);
  const delta = biomassG_L - initialBiomassG_L;
  return {
    step,
    timeHours: round(timeHours),
    biomassG_L: round(biomassG_L),
    biomassG: round(biomassG_L * model.volumeL),
    deltaFromInitialG_L: round(delta),
    deltaFromInitialG: round(delta * model.volumeL),
    relativeChangeFromInitial: relativeChange(initialBiomassG_L, biomassG_L),
    dXdtG_LPerDay: round(state.derivativeG_LPerDay),
    muEffPerDay: round(state.muEffPerDay),
    carryingCapacityG_L: round(model.carryingCapacityG_L),
    lightFactor: round(state.factors.light),
    temperatureFactor: round(state.factors.temperature),
    pHFactor: round(state.factors.pH),
    nutrientFactor: round(state.factors.nutrient),
  };
}

function outputModelSnapshot(model) {
  return {
    snapshotVersion: 1,
    modelVersion: MODEL_VERSION,
    equation: EQUATIONS.biomass,
    configuration: deepCopy(model),
    ...deepCopy(model),
  };
}

function normalizeOutputMetricNumbers(metrics) {
  const result = {};
  for (const [key, value] of Object.entries(metrics)) result[key] = isFiniteNumber(value) ? round(value) : value;
  return result;
}

export function runSimulation(input) {
  const normalized = ensureInput(input);
  assertValidSimulationInput(normalized);
  const model = normalized.model;
  const initial = normalized.initialConditions.biomassG_L;
  const { durationHours, stepHours } = normalized.integration;
  const stepCount = durationHours / stepHours;
  const dtDays = stepHours / 24;
  const timeSeries = [];
  let biomassG_L = initial;
  timeSeries.push(timePoint({ step: 0, timeHours: normalized.initialConditions.timeHours, biomassG_L, initialBiomassG_L: initial, model }));

  for (let step = 1; step <= stepCount; step += 1) {
    const current = modelStateAt(biomassG_L, model);
    const next = biomassG_L + dtDays * current.derivativeG_LPerDay;
    biomassG_L = Math.max(0, round(next));
    timeSeries.push(timePoint({
      step,
      timeHours: normalized.initialConditions.timeHours + step * stepHours,
      biomassG_L,
      initialBiomassG_L: initial,
      model,
    }));
  }

  const first = timeSeries[0];
  const last = timeSeries[timeSeries.length - 1];
  const relative = relativeChange(first.biomassG_L, last.biomassG_L);
  const relativeStatus = relativeChangeStatus(first.biomassG_L, last.biomassG_L);
  const endpointGrowthRatePerDay = first.biomassG_L === 0 && last.biomassG_L === 0
    ? 0
    : (last.biomassG_L === 0 ? 0 : last.dXdtG_LPerDay / last.biomassG_L);
  const derivedMetrics = normalizeOutputMetricNumbers({
    initialBiomassG_L: first.biomassG_L,
    finalBiomassG_L: last.biomassG_L,
    deltaBiomassG_L: last.biomassG_L - first.biomassG_L,
    relativeChange: relative,
    relativeChangePercent: relative === null ? null : relative * 100,
    relativeChangeDefined: relativeStatus.defined,
    relativeChangeReason: relativeStatus.reason,
    initialBiomassG: first.biomassG,
    finalBiomassG: last.biomassG,
    deltaBiomassG: last.biomassG - first.biomassG,
    endpointGrowthRatePerDay,
    endpointMuEffectivePerDay: last.muEffPerDay,
    endpointDerivativeG_LPerDay: last.dXdtG_LPerDay,
    endpointLogisticFactor: 1 - last.biomassG_L / model.carryingCapacityG_L,
    durationHours,
    stepHours,
    stepCount,
  });

  const snapshot = outputModelSnapshot(model);
  const output = {
    format: OUTPUT_FORMAT,
    version: OUTPUT_VERSION,
    schemaVersion: OUTPUT_SCHEMA_VERSION,
    modelVersion: MODEL_VERSION,
    engineVersion: ENGINE_VERSION,
    scenario: deepCopy(normalized.scenario),
    organism: deepCopy(normalized.organism),
    inputSnapshot: deepCopy(normalized),
    initialConditions: deepCopy(normalized.initialConditions),
    modelConfigurationSnapshot: deepCopy(snapshot),
    configurationSnapshot: deepCopy(snapshot),
    modelVersionSnapshot: {
      version: OUTPUT_VERSION,
      modelVersion: MODEL_VERSION,
      engineVersion: ENGINE_VERSION,
      equations: deepCopy(EQUATIONS),
      assumptions: deepCopy(MODEL_ASSUMPTIONS),
    },
    equations: deepCopy(EQUATIONS),
    assumptions: deepCopy(MODEL_ASSUMPTIONS),
    integration: deepCopy(normalized.integration),
    timeSeries,
    derivedMetrics,
  };
  assertValidSimulationOutput(output);
  return output;
}

export const simulate = runSimulation;

function walkFiniteNumbers(value, path, errors) {
  if (typeof value === "number" && !Number.isFinite(value)) errors.push(error(path, "must be finite", "finite-number"));
  else if (Array.isArray(value)) value.forEach((entry, index) => walkFiniteNumbers(entry, `${path}[${index}]`, errors));
  else if (isPlainObject(value)) Object.entries(value).forEach(([key, entry]) => walkFiniteNumbers(entry, `${path}.${key}`, errors));
}

export function validateSimulationOutput(output) {
  const errors = [];
  if (!isPlainObject(output)) return { valid: false, errors: [error("output", "must be an object", "type")] };
  assertObjectKeys(output, [
    "format", "version", "schemaVersion", "modelVersion", "engineVersion", "scenario", "organism", "inputSnapshot",
    "initialConditions", "modelConfigurationSnapshot", "configurationSnapshot", "modelVersionSnapshot",
    "equations", "assumptions", "integration", "timeSeries", "derivedMetrics",
  ], "output", errors);
  if (output.format !== OUTPUT_FORMAT) errors.push(error("format", `must be ${OUTPUT_FORMAT}`, "version"));
  if (output.version !== OUTPUT_VERSION) errors.push(error("version", `must be ${OUTPUT_VERSION}`, "version"));
  if (output.schemaVersion !== OUTPUT_SCHEMA_VERSION) errors.push(error("schemaVersion", `must be ${OUTPUT_SCHEMA_VERSION}`, "version"));
  if (output.modelVersion !== MODEL_VERSION) errors.push(error("modelVersion", `must be ${MODEL_VERSION}`, "version"));
  if (output.engineVersion !== ENGINE_VERSION) errors.push(error("engineVersion", `must be ${ENGINE_VERSION}`, "version"));
  validateScenario(output.scenario, errors);
  validateOrganism(output.organism, errors);
  if (!isPlainObject(output.inputSnapshot)) errors.push(error("inputSnapshot", "must be a versioned input snapshot", "type"));
  else {
    const inputResult = validateSimulationInput(output.inputSnapshot);
    if (!inputResult.valid) errors.push(...inputResult.errors.map((entry) => ({ ...entry, path: `inputSnapshot.${entry.path}` })));
  }
  if (!isPlainObject(output.initialConditions)) errors.push(error("initialConditions", "must be an object", "type"));
  else validateInitialConditions(output.initialConditions, errors);
  validateIntegration(output.integration, errors);
  for (const snapshotKey of ["modelConfigurationSnapshot", "configurationSnapshot"]) {
    const snapshot = output[snapshotKey];
    if (!isPlainObject(snapshot)) {
      errors.push(error(snapshotKey, "must be a model configuration snapshot", "type"));
      continue;
    }
    if (snapshot.snapshotVersion !== 1) errors.push(error(`${snapshotKey}.snapshotVersion`, "must be 1", "version"));
    if (snapshot.modelVersion !== MODEL_VERSION) errors.push(error(`${snapshotKey}.modelVersion`, `must be ${MODEL_VERSION}`, "version"));
    if (!isPlainObject(snapshot.configuration)) errors.push(error(`${snapshotKey}.configuration`, "must contain the captured model configuration", "type"));
    else {
      validateModelConfiguration(snapshot.configuration, errors, `${snapshotKey}.configuration`);
      for (const key of ["muMaxPerDay", "carryingCapacityG_L", "volumeL", "environment", "responseFactors"]) {
        if (stableStringify(snapshot[key]) !== stableStringify(snapshot.configuration[key])) {
          errors.push(error(`${snapshotKey}.${key}`, "must match the captured configuration", "mismatch"));
        }
      }
    }
  }
  if (!isPlainObject(output.modelVersionSnapshot)) errors.push(error("modelVersionSnapshot", "must be a version snapshot", "type"));
  else {
    if (output.modelVersionSnapshot.version !== OUTPUT_VERSION) errors.push(error("modelVersionSnapshot.version", `must be ${OUTPUT_VERSION}`, "version"));
    if (output.modelVersionSnapshot.modelVersion !== MODEL_VERSION) errors.push(error("modelVersionSnapshot.modelVersion", `must be ${MODEL_VERSION}`, "version"));
    if (output.modelVersionSnapshot.engineVersion !== ENGINE_VERSION) errors.push(error("modelVersionSnapshot.engineVersion", `must be ${ENGINE_VERSION}`, "version"));
    if (!isPlainObject(output.modelVersionSnapshot.equations)) errors.push(error("modelVersionSnapshot.equations", "must contain equation documentation", "type"));
    if (!Array.isArray(output.modelVersionSnapshot.assumptions)) errors.push(error("modelVersionSnapshot.assumptions", "must contain assumptions", "type"));
  }
  if (!Array.isArray(output.assumptions) || output.assumptions.length === 0) errors.push(error("assumptions", "must be a non-empty array", "type"));
  if (!Array.isArray(output.timeSeries) || output.timeSeries.length < 1) errors.push(error("timeSeries", "must contain at least the initial point", "type"));
  else {
    let previousTime = -Infinity;
    output.timeSeries.forEach((point, index) => {
      if (!isPlainObject(point)) {
        errors.push(error(`timeSeries[${index}]`, "must be an object", "type"));
        return;
      }
      for (const field of ["step", "timeHours", "biomassG_L", "biomassG", "dXdtG_LPerDay", "muEffPerDay"]) {
        requireFiniteNumber(point[field], `timeSeries[${index}].${field}`, errors);
      }
      if (point.timeHours < previousTime) errors.push(error(`timeSeries[${index}].timeHours`, "must be monotonic", "ordering"));
      previousTime = point.timeHours;
      if (point.biomassG_L < 0) errors.push(error(`timeSeries[${index}].biomassG_L`, "must not be negative", "range"));
    });
  }
  if (!isPlainObject(output.derivedMetrics)) errors.push(error("derivedMetrics", "must be an object", "type"));
  walkFiniteNumbers(output, "output", errors);
  return { valid: errors.length === 0, errors };
}

export function assertValidSimulationOutput(output) {
  const result = validateSimulationOutput(output);
  if (!result.valid) throw new SimulationValidationError("Simulation output validation failed", result.errors);
  return output;
}

export function deriveMetrics(output) {
  assertValidSimulationOutput(output);
  return deepCopy(output.derivedMetrics);
}

export const metrics = deriveMetrics;

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function serializeSimulationInput(input) {
  return stableStringify(createSimulationInput(input));
}

export function parseSimulationInput(serialized) {
  let value;
  try {
    value = typeof serialized === "string" ? JSON.parse(serialized) : deepCopy(serialized);
  } catch (parseError) {
    throw new SimulationValidationError(`Malformed simulation input: ${parseError.message}`, [error("input", "must be valid JSON", "malformed")]);
  }
  return createSimulationInput(value);
}

export function serializeSimulationOutput(output) {
  assertValidSimulationOutput(output);
  return stableStringify(output);
}

export function parseSimulationOutput(serialized) {
  let value;
  try {
    value = typeof serialized === "string" ? JSON.parse(serialized) : deepCopy(serialized);
  } catch (parseError) {
    throw new SimulationValidationError(`Malformed simulation output: ${parseError.message}`, [error("output", "must be valid JSON", "malformed")]);
  }
  assertValidSimulationOutput(value);
  return value;
}

const CSV_COLUMNS = Object.freeze([
  "step",
  "time_hours",
  "biomass_g_l",
  "biomass_g",
  "delta_from_initial_g_l",
  "delta_from_initial_g",
  "relative_change_from_initial",
  "dXdt_g_l_per_day",
  "mu_eff_per_day",
  "carrying_capacity_g_l",
  "light_factor",
  "temperature_factor",
  "pH_factor",
  "nutrient_factor",
]);

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function timeSeriesToRows(output) {
  assertValidSimulationOutput(output);
  return output.timeSeries.map((point) => ({
    step: point.step,
    time_hours: point.timeHours,
    biomass_g_l: point.biomassG_L,
    biomass_g: point.biomassG,
    delta_from_initial_g_l: point.deltaFromInitialG_L,
    delta_from_initial_g: point.deltaFromInitialG,
    relative_change_from_initial: point.relativeChangeFromInitial,
    dXdt_g_l_per_day: point.dXdtG_LPerDay,
    mu_eff_per_day: point.muEffPerDay,
    carrying_capacity_g_l: point.carryingCapacityG_L,
    light_factor: point.lightFactor,
    temperature_factor: point.temperatureFactor,
    pH_factor: point.pHFactor,
    nutrient_factor: point.nutrientFactor,
  }));
}

export function exportTimeSeriesCsv(output) {
  const rows = timeSeriesToRows(output);
  return [CSV_COLUMNS.join(","), ...rows.map((row) => CSV_COLUMNS.map((column) => csvCell(row[column])).join(","))].join("\n") + "\n";
}

export const timeSeriesToCsv = exportTimeSeriesCsv;
export const toCsv = exportTimeSeriesCsv;

function canonicalParameterPath(path) {
  if (typeof path !== "string") return null;
  const raw = path.trim();
  if (MODEL_PATHS.includes(raw)) return raw;
  if (raw.startsWith("configuration.")) {
    const candidate = `model.${raw.slice("configuration.".length)}`;
    if (MODEL_PATHS.includes(candidate)) return candidate;
  }
  if (raw.startsWith("modelConfiguration.")) {
    const candidate = `model.${raw.slice("modelConfiguration.".length)}`;
    if (MODEL_PATHS.includes(candidate)) return candidate;
  }
  const candidate = `model.${raw}`;
  return MODEL_PATHS.includes(candidate) ? candidate : null;
}

function getAtPath(value, path) {
  return path.split(".").reduce((current, key) => current?.[key], value);
}

function setAtPath(value, path, next) {
  const keys = path.split(".");
  const result = deepCopy(value);
  let current = result;
  for (let index = 0; index < keys.length - 1; index += 1) current = current[keys[index]];
  current[keys.at(-1)] = deepCopy(next);
  return result;
}

function scenarioIdForCopy(id, suffix = "copy") {
  const next = `${id}-${suffix}`.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 64);
  return next || "scenario-copy";
}

export function duplicateScenario(source, overrides = {}) {
  const base = source?.format === OUTPUT_FORMAT ? source.inputSnapshot : ensureInput(source);
  const patch = isPlainObject(overrides) ? overrides : {};
  let next = deepCopy(base);
  if (patch.parameterPath !== undefined || patch.path !== undefined) {
    const path = canonicalParameterPath(patch.parameterPath ?? patch.path);
    if (!path) throw new SimulationValidationError("Unsupported scenario parameter path", [error("parameterPath", "is not sweepable", "unsupported")]);
    next = setAtPath(next, path, patch.value);
    if (path === "organism.profileId") {
      const profileId = normalizeProfileId(patch.value);
      if (!profileId) throw new SimulationValidationError("Unsupported organism profile", [error("value", "must be supported", "unsupported")]);
      next.organism = profileSnapshot(profileId);
    }
  }
  const directModel = {};
  for (const key of ["muMaxPerDay", "muMax", "K", "carryingCapacityG_L", "carryingCapacity", "volumeL", "environment", "responseFactors", "responses", "lightPpfd", "temperatureC", "pH", "ph", "nutrientMgL", "nutrient"]) {
    if (Object.hasOwn(patch, key)) directModel[key] = patch[key];
  }
  if (Object.keys(directModel).length > 0) next.model = normalizeModelConfiguration(deepMerge(next.model, directModel), next.organism.profileId);
  if (isPlainObject(patch.model)) next.model = normalizeModelConfiguration(deepMerge(next.model, patch.model), next.organism.profileId);
  if (isPlainObject(patch.configuration)) next.model = normalizeModelConfiguration(deepMerge(next.model, patch.configuration), next.organism.profileId);
  if (isPlainObject(patch.initialConditions)) next.initialConditions = deepMerge(next.initialConditions, patch.initialConditions);
  if (isPlainObject(patch.integration)) next.integration = deepMerge(next.integration, patch.integration);
  if (patch.organism !== undefined || patch.organismId !== undefined) {
    const nextProfileId = normalizeProfileId(patch.organism ?? patch.organismId);
    if (!nextProfileId) throw new SimulationValidationError("Unsupported organism profile", [error("organism", "must be supported", "unsupported")]);
    next.organism = profileSnapshot(nextProfileId);
    next.model = normalizeModelConfiguration(next.model, nextProfileId);
  }
  const scenarioPatch = isPlainObject(patch.scenario) ? patch.scenario : {};
  const scenarioId = patch.scenarioId ?? scenarioPatch.id ?? scenarioIdForCopy(base.scenario.id);
  const scenarioLabel = patch.scenarioLabel ?? scenarioPatch.label ?? `${base.scenario.label} copy`;
  next.scenario = { id: scenarioId, label: scenarioLabel };
  return createSimulationInput(next);
}

function comparisonParameters(input) {
  const paths = MODEL_PATHS;
  return Object.fromEntries(paths.map((path) => [path, getAtPath(input, path)]));
}

function metricSnapshot(output) {
  const metrics = output.derivedMetrics;
  return {
    initialBiomassG_L: metrics.initialBiomassG_L,
    finalBiomassG_L: metrics.finalBiomassG_L,
    deltaBiomassG_L: metrics.deltaBiomassG_L,
    relativeChange: metrics.relativeChange,
    endpointGrowthRatePerDay: metrics.endpointGrowthRatePerDay,
  };
}

export function compareScenarios(left, right) {
  const leftInput = left?.format === OUTPUT_FORMAT ? left.inputSnapshot : ensureInput(left);
  const rightInput = right?.format === OUTPUT_FORMAT ? right.inputSnapshot : ensureInput(right);
  const leftOutput = left?.format === OUTPUT_FORMAT ? parseSimulationOutput(left) : runSimulation(leftInput);
  const rightOutput = right?.format === OUTPUT_FORMAT ? parseSimulationOutput(right) : runSimulation(rightInput);
  const leftParameters = comparisonParameters(leftInput);
  const rightParameters = comparisonParameters(rightInput);
  const changedParameters = [];
  for (const path of MODEL_PATHS) {
    const before = leftParameters[path];
    const after = rightParameters[path];
    if (stableStringify(before) !== stableStringify(after)) changedParameters.push({ path, before: deepCopy(before), after: deepCopy(after) });
  }
  const changedParameterPaths = changedParameters.map((entry) => entry.path);
  const metricLeft = metricSnapshot(leftOutput);
  const metricRight = metricSnapshot(rightOutput);
  return {
    format: COMPARISON_FORMAT,
    version: OUTPUT_VERSION,
    schemaVersion: OUTPUT_SCHEMA_VERSION,
    modelVersion: MODEL_VERSION,
    leftScenario: deepCopy(leftInput.scenario),
    rightScenario: deepCopy(rightInput.scenario),
    changedParameters,
    changedParameterPaths,
    changedParametersCount: changedParameters.length,
    identicalParameters: changedParameters.length === 0,
    metrics: {
      left: metricLeft,
      right: metricRight,
      difference: {
        finalBiomassG_L: metricRight.finalBiomassG_L - metricLeft.finalBiomassG_L,
        deltaBiomassG_L: metricRight.deltaBiomassG_L - metricLeft.deltaBiomassG_L,
        relativeChange: metricLeft.relativeChange === null || metricRight.relativeChange === null
          ? null
          : metricRight.relativeChange - metricLeft.relativeChange,
        endpointGrowthRatePerDay: metricRight.endpointGrowthRatePerDay - metricLeft.endpointGrowthRatePerDay,
      },
    },
    leftOutput,
    rightOutput,
  };
}

function parseSweepArguments(parameterOrSpec, valuesMaybe, optionsMaybe) {
  if (isPlainObject(parameterOrSpec)) {
    return {
      path: parameterOrSpec.path ?? parameterOrSpec.parameterPath ?? parameterOrSpec.parameter,
      values: parameterOrSpec.values,
      options: deepMerge(parameterOrSpec.options ?? {}, optionsMaybe ?? (isPlainObject(valuesMaybe) ? valuesMaybe : {})),
    };
  }
  return { path: parameterOrSpec, values: valuesMaybe, options: optionsMaybe ?? {} };
}

function validateSweepValues(values, path) {
  const errors = [];
  if (!Array.isArray(values) || values.length === 0) errors.push(error("values", "must be a non-empty array", "type"));
  else values.forEach((value, index) => {
    const supportedString = path === "organism.profileId" && typeof value === "string" && Boolean(normalizeProfileId(value));
    if (!(isFiniteNumber(value) || typeof value === "boolean" || supportedString)) errors.push(error(`values[${index}]`, "must be a finite number, boolean, or supported organism profile", "finite-number"));
  });
  failValidation(errors, `Parameter sweep ${path}`);
}

export function estimateWorkload(input) {
  const normalized = ensureInput(input);
  const steps = normalized.integration.durationHours / normalized.integration.stepHours;
  return {
    durationHours: normalized.integration.durationHours,
    stepHours: normalized.integration.stepHours,
    steps,
  };
}

export function runParameterSweep(input, parameterOrSpec, valuesMaybe, optionsMaybe) {
  const base = ensureInput(input);
  const { path: rawPath, values, options } = parseSweepArguments(parameterOrSpec, valuesMaybe, optionsMaybe);
  const path = canonicalParameterPath(rawPath);
  if (!path) throw new SimulationValidationError("Unsupported parameter sweep path", [error("parameterPath", "is not an exposed model parameter", "unsupported")]);
  validateSweepValues(values, path);
  const limits = {
    maxCases: options.maxCases ?? WORKLOAD_LIMITS.maxSweepCases,
    maxSteps: options.maxSteps ?? options.maxSweepSteps ?? WORKLOAD_LIMITS.maxSweepSteps,
  };
  if (!isFiniteNumber(limits.maxCases) || limits.maxCases < 1) throw new SimulationValidationError("Invalid sweep case limit", [error("maxCases", "must be a positive finite number", "range")]);
  if (!isFiniteNumber(limits.maxSteps) || limits.maxSteps < 1) throw new SimulationValidationError("Invalid sweep workload limit", [error("maxSteps", "must be a positive finite number", "range")]);
  if (values.length > limits.maxCases) throw new SimulationValidationError("Parameter sweep exceeds case limit", [error("values", `at most ${limits.maxCases} cases are allowed`, "workload-limit")]);
  const workload = estimateWorkload(base);
  const totalSteps = values.length * workload.steps;
  if (totalSteps > limits.maxSteps) throw new SimulationValidationError("Parameter sweep exceeds workload limit", [error("values", `at most ${limits.maxSteps} integrated steps are allowed`, "workload-limit")]);

  const cases = values.map((value, index) => {
    const scenario = duplicateScenario(base, {
      parameterPath: path,
      value,
      scenarioId: scenarioIdForCopy(base.scenario.id.slice(0, 48), `sweep-${index + 1}`),
      scenarioLabel: `${base.scenario.label} · ${path}=${String(value)}`,
    });
    const output = runSimulation(scenario);
    return {
      index,
      value,
      scenario: deepCopy(scenario.scenario),
      metrics: metricSnapshot(output),
      output,
    };
  });
  return {
    format: SWEEP_FORMAT,
    version: OUTPUT_VERSION,
    schemaVersion: OUTPUT_SCHEMA_VERSION,
    modelVersion: MODEL_VERSION,
    parameterPath: path,
    values: deepCopy(values),
    cases,
    workload: {
      caseCount: cases.length,
      stepsPerCase: workload.steps,
      totalSteps,
    },
    limits,
  };
}

export const parameterSweep = runParameterSweep;

function normalizeSensitivitySpecs(specs) {
  if (Array.isArray(specs)) return specs;
  if (isPlainObject(specs)) return Object.entries(specs).map(([path, values]) => ({ path, values }));
  return [];
}

export function runSensitivityAnalysis(input, specs, options = {}) {
  const normalizedSpecs = normalizeSensitivitySpecs(specs);
  if (normalizedSpecs.length === 0) throw new SimulationValidationError("Sensitivity analysis requires at least one sweep", [error("specs", "must be a non-empty array or object", "type")]);
  const maxDimensions = options.maxDimensions ?? WORKLOAD_LIMITS.maxSensitivityDimensions;
  if (!isFiniteNumber(maxDimensions) || maxDimensions < 1) throw new SimulationValidationError("Invalid sensitivity dimension limit", [error("maxDimensions", "must be a positive finite number", "range")]);
  if (normalizedSpecs.length > maxDimensions) throw new SimulationValidationError("Sensitivity analysis exceeds dimension limit", [error("specs", `at most ${maxDimensions} dimensions are allowed`, "workload-limit")]);
  const workload = estimateWorkload(input);
  const maxTotalSteps = options.maxTotalSteps ?? WORKLOAD_LIMITS.maxSweepSteps;
  if (!isFiniteNumber(maxTotalSteps) || maxTotalSteps < 1) throw new SimulationValidationError("Invalid sensitivity workload limit", [error("maxTotalSteps", "must be a positive finite number", "range")]);
  const estimatedSteps = normalizedSpecs.reduce((sum, spec) => sum + (Array.isArray(spec?.values) ? spec.values.length : 0) * workload.steps, 0);
  if (estimatedSteps > maxTotalSteps) throw new SimulationValidationError("Sensitivity analysis exceeds total workload limit", [error("specs", `at most ${maxTotalSteps} integrated steps are allowed`, "workload-limit")]);
  const runs = normalizedSpecs.map((spec) => runParameterSweep(input, spec, undefined, options));
  const totalSteps = runs.reduce((sum, run) => sum + run.workload.totalSteps, 0);
  if (totalSteps > maxTotalSteps) throw new SimulationValidationError("Sensitivity analysis exceeds total workload limit", [error("specs", `at most ${maxTotalSteps} integrated steps are allowed`, "workload-limit")]);
  return {
    format: SENSITIVITY_FORMAT,
    version: OUTPUT_VERSION,
    schemaVersion: OUTPUT_SCHEMA_VERSION,
    modelVersion: MODEL_VERSION,
    sweeps: runs,
    workload: { dimensions: runs.length, totalSteps },
  };
}

export const sensitivityAnalysis = runSensitivityAnalysis;
export const runSensitivity = runSensitivityAnalysis;

export function validateFiniteOutput(value) {
  const errors = [];
  walkFiniteNumbers(value, "value", errors);
  return { valid: errors.length === 0, errors };
}
