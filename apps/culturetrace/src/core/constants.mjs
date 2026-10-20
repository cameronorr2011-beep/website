export const SCHEMA_VERSION = 1;
export const ENGINE_VERSION = "culturetrace-core-0.1.0";
export const REPORT_FORMAT = "culturetrace-report";
export const AI_REQUEST_FORMAT = "culturetrace-ai-request";
export const AI_RESPONSE_FORMAT = "culturetrace-ai-response";

export const LIMITS = Object.freeze({
  maxInputBytes: 50 * 1024 * 1024,
  maxRows: 100_000,
  maxColumns: 128,
  maxCellCharacters: 16_384,
  maxFindings: 500,
  maxEvidence: 2_000,
  maxAiInputCharacters: 40_000,
  maxAiOutputCharacters: 20_000,
});

export const SEVERITIES = Object.freeze(["info", "review", "warning", "error"]);
export const FINDING_STATUSES = Object.freeze(["observed", "derived", "hypothesis", "unresolved"]);

export const DEFAULT_POLICY = Object.freeze({
  outlierMethod: "mad",
  outlierThreshold: 3.5,
  maxGapHours: 48,
  growth: Object.freeze({
    minObservations: 3,
    minDistinctTimestamps: 3,
    minTimeSpanHours: 12,
    minPositivePoints: 3,
    maxMissingFraction: 0.25,
    growthTolerancePerDay: 1e-6,
  }),
});

export const MEASUREMENT_DEFINITIONS = Object.freeze({
  biomass: { label: "Biomass", unit: "g/L", aliases: ["biomass", "dry biomass", "biomass g/l", "mass"] },
  od600: { label: "Optical density", unit: "AU", aliases: ["od", "od600", "optical density", "optical density 600"] },
  pH: { label: "pH", unit: "pH", aliases: ["ph", "pH"] },
  temperature: { label: "Temperature", unit: "°C", aliases: ["temperature", "temp", "temperature c", "temperature f"] },
  dissolvedOxygen: { label: "Dissolved oxygen", unit: "%", aliases: ["do", "dissolved oxygen", "oxygen"] },
  light: { label: "Light intensity", unit: "µmol/m²/s", aliases: ["light", "light intensity", "par"] },
});

export function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function stableHash(value) {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(String(value))) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function safeNumber(value) {
  return Number.isFinite(value) ? value : null;
}
