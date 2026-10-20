import { MEASUREMENT_DEFINITIONS, normalizeHeader } from "./constants.mjs";
import { CultureTraceValidationError } from "./errors.mjs";

const aliases = {
  cultureId: ["culture_id", "culture", "sample_id", "sample", "experiment_id", "experiment"],
  condition: ["condition", "treatment", "group", "medium"],
  replicate: ["replicate", "biological_replicate", "technical_replicate", "rep"],
  timestamp: ["timestamp", "time", "datetime", "date_time", "measured_at", "recorded_at"],
  elapsedHours: ["elapsed_hours", "elapsed_time", "hours", "time_hours", "hour"],
};

function findHeader(headers, candidates) {
  const normalized = new Map(headers.map((header) => [header.normalized, header.name]));
  for (const candidate of candidates) if (normalized.has(candidate)) return normalized.get(candidate);
  return null;
}

export function suggestMapping(table) {
  const headers = table.headers;
  const mapping = {
    cultureId: findHeader(headers, aliases.cultureId),
    condition: findHeader(headers, aliases.condition),
    replicate: findHeader(headers, aliases.replicate),
    timestamp: findHeader(headers, aliases.timestamp),
    elapsedHours: findHeader(headers, aliases.elapsedHours),
    measurements: {},
  };
  for (const [key, definition] of Object.entries(MEASUREMENT_DEFINITIONS)) {
    const candidates = definition.aliases.map(normalizeHeader);
    const column = findHeader(headers, candidates);
    if (column) mapping.measurements[key] = { column, unit: definition.unit };
  }
  return mapping;
}

export function validateMapping(table, mapping) {
  const columns = new Set(table.headers.map((header) => header.name));
  const errors = [];
  const requireColumn = (field, value, required = false) => {
    if (value && !columns.has(value)) errors.push({ code: "unknown-column", field, column: value });
    if (required && !value) errors.push({ code: "missing-mapping", field });
  };
  requireColumn("cultureId", mapping?.cultureId, true);
  if (!mapping?.timestamp && !mapping?.elapsedHours) errors.push({ code: "missing-time-mapping", field: "timestamp-or-elapsedHours" });
  requireColumn("timestamp", mapping?.timestamp);
  requireColumn("elapsedHours", mapping?.elapsedHours);
  requireColumn("condition", mapping?.condition);
  requireColumn("replicate", mapping?.replicate);
  if (!mapping?.measurements || Object.keys(mapping.measurements).length === 0) errors.push({ code: "missing-measurement-mapping" });
  for (const [key, value] of Object.entries(mapping?.measurements ?? {})) {
    if (!MEASUREMENT_DEFINITIONS[key]) errors.push({ code: "unknown-measurement", field: key });
    requireColumn(`measurements.${key}`, value?.column, true);
    if (!value?.unit) errors.push({ code: "missing-unit", field: key });
  }
  return { valid: errors.length === 0, errors };
}

const unitConversions = {
  biomass: { "g/L": (value) => value, "mg/L": (value) => value / 1000, "mg/mL": (value) => value },
  od600: { AU: (value) => value, OD600: (value) => value },
  pH: { pH: (value) => value },
  temperature: { "°C": (value) => value, degC: (value) => value, "°F": (value) => (value - 32) * 5 / 9, degF: (value) => (value - 32) * 5 / 9 },
  dissolvedOxygen: { "%": (value) => value, "mg/L": (value) => value },
  light: { "µmol/m²/s": (value) => value, "umol/m2/s": (value) => value, lux: (value) => value },
};

function parseNumeric(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return { value: null, reason: "missing" };
  const parsed = Number(value);
  return Number.isFinite(parsed) ? { value: parsed, reason: null } : { value: null, reason: "invalid-number" };
}

function parseTimestamp(raw) {
  if (!String(raw ?? "").trim()) return { value: null, reason: "missing" };
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? { value: null, reason: "invalid-timestamp" } : { value: parsed.toISOString(), reason: null };
}

export function mapRows(table, mapping, options = {}) {
  const validation = validateMapping(table, mapping);
  if (!validation.valid) throw new CultureTraceValidationError("Column mapping needs attention before analysis.", validation.errors);
  const observations = [];
  const diagnostics = [...table.diagnostics];
  const rejectedRows = [];
  for (const row of table.rows) {
    const get = (column) => column ? row.raw[column] ?? "" : "";
    const cultureId = String(get(mapping.cultureId)).trim();
    const observationId = `obs-${String(row.rowNumber).padStart(6, "0")}`;
    if (!cultureId) {
      const issue = { code: "missing-culture-id", severity: "error", rowNumber: row.rowNumber, observationId };
      diagnostics.push(issue);
      rejectedRows.push({ rowNumber: row.rowNumber, reason: issue.code, raw: row.raw });
      continue;
    }
    const timestamp = mapping.timestamp ? parseTimestamp(get(mapping.timestamp)) : { value: null, reason: null };
    const elapsed = mapping.elapsedHours ? parseNumeric(get(mapping.elapsedHours)) : { value: null, reason: null };
    const rowIssues = [];
    if (timestamp.reason) rowIssues.push({ code: timestamp.reason, severity: timestamp.reason === "missing" ? "warning" : "error", column: mapping.timestamp, rowNumber: row.rowNumber, observationId });
    if (mapping.elapsedHours && elapsed.reason === "invalid-number") rowIssues.push({ code: elapsed.reason, severity: "error", column: mapping.elapsedHours, rowNumber: row.rowNumber, observationId });
    const measurements = {};
    const rawMeasurements = {};
    for (const [key, config] of Object.entries(mapping.measurements)) {
      const raw = get(config.column);
      const parsed = parseNumeric(raw);
      rawMeasurements[key] = raw;
      if (parsed.reason === "invalid-number") rowIssues.push({ code: "invalid-number", severity: "warning", column: config.column, field: key, rowNumber: row.rowNumber, observationId, rawValue: raw });
      if (parsed.value !== null && !unitConversions[key]?.[config.unit]) rowIssues.push({ code: "unsupported-unit", severity: "error", field: key, unit: config.unit, rowNumber: row.rowNumber, observationId });
      measurements[key] = parsed.value === null ? null : unitConversions[key][config.unit](parsed.value);
      if (measurements[key] !== null && ["biomass", "od600", "temperature", "dissolvedOxygen", "light"].includes(key) && measurements[key] < 0) rowIssues.push({ code: "negative-value", severity: "warning", field: key, rowNumber: row.rowNumber, observationId });
    }
    for (const issue of rowIssues) diagnostics.push(issue);
    const fatal = rowIssues.some((issue) => issue.severity === "error" && ["invalid-timestamp", "unsupported-unit"].includes(issue.code));
    if (fatal && options.rowPolicy === "strict") throw new CultureTraceValidationError("A mapped row contains a structural error.", rowIssues);
    observations.push({
      id: observationId,
      cultureId,
      conditionId: String(get(mapping.condition)).trim() || "Unspecified",
      replicateId: String(get(mapping.replicate)).trim() || "Unspecified",
      timestamp: timestamp.value,
      elapsedHours: elapsed.value,
      measurements,
      rawMeasurements,
      quality: { flags: rowIssues.map((issue) => issue.code) },
      sourceRef: { sourceId: table.source.sourceId, rowNumber: row.rowNumber, raw: row.raw, columns: Object.fromEntries(Object.entries(mapping.measurements).map(([key, config]) => [key, config.column])) },
    });
  }
  return { observations, diagnostics, rejectedRows, mappingSnapshot: structuredClone(mapping) };
}

export function measurementUnit(mapping, key) {
  return mapping?.measurements?.[key]?.unit ?? MEASUREMENT_DEFINITIONS[key]?.unit ?? "";
}
