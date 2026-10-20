import { DEFAULT_POLICY, ENGINE_VERSION, REPORT_FORMAT, SCHEMA_VERSION, stableHash } from "./constants.mjs";
import { parseCsv } from "./csv.mjs";
import { mapRows, measurementUnit, suggestMapping, validateMapping } from "./mapping.mjs";
import { groupBySeries, summarizeSeries } from "./statistics.mjs";
import { buildFindings, validateEvidenceReferences } from "./findings.mjs";

function nowStage(id, status, reason, inputCount = null, outputCount = null) {
  return { id, name: id.replaceAll("-", " "), status, reason, inputCount, outputCount };
}

function chooseMeasure(mapping) {
  return ["biomass", "od600", "pH", "temperature", "dissolvedOxygen", "light"].find((key) => mapping.measurements?.[key]) ?? Object.keys(mapping.measurements ?? {})[0];
}

export function runAnalysis({ csv, source = {}, mapping: requestedMapping = null, policy: requestedPolicy = {} } = {}) {
  const policy = { ...DEFAULT_POLICY, ...requestedPolicy, growth: { ...DEFAULT_POLICY.growth, ...(requestedPolicy.growth ?? {}) } };
  const stages = [nowStage("parse", "running", "Reading the delimited file")];
  const table = parseCsv(csv, { sourceId: source.sourceId, filename: source.filename, limits: source.limits });
  stages[0] = nowStage("parse", "completed", `${table.rows.length} rows and ${table.headers.length} columns detected`, 0, table.rows.length);
  const mapping = requestedMapping ?? suggestMapping(table);
  const mapValidation = validateMapping(table, mapping);
  stages.push(nowStage("mapping", mapValidation.valid ? "completed" : "failed", mapValidation.valid ? "Column roles are defined" : "Column mapping needs attention", table.headers.length, Object.keys(mapping.measurements ?? {}).length));
  if (!mapValidation.valid) {
    return { format: REPORT_FORMAT, schemaVersion: SCHEMA_VERSION, engineVersion: ENGINE_VERSION, status: "mapping-required", source: table.source, table, mapping, policy, stages, observations: [], series: [], findings: [], evidence: [], diagnostics: mapValidation.errors, limitations: ["Analysis is waiting for a valid culture identifier, time field, and measurement mapping."], analysisId: `analysis-${stableHash(JSON.stringify({ source: table.source.digest, mapping }))}`, ai: { status: "not-requested" } };
  }
  const mapped = mapRows(table, mapping, { rowPolicy: requestedPolicy.rowPolicy ?? "quarantine" });
  stages.push(nowStage("validation", "completed", `${mapped.diagnostics.length} diagnostics recorded`, table.rows.length, mapped.observations.length));
  const measure = chooseMeasure(mapping);
  const groups = groupBySeries(mapped.observations);
  const series = groups.map((group) => summarizeSeries(group.observations, measure, { unit: measurementUnit(mapping, measure), outlierThreshold: policy.outlierThreshold }));
  stages.push(nowStage("statistics", "completed", `${series.length} series summarized using ${measure}`, mapped.observations.length, series.length));
  const built = buildFindings({ observations: mapped.observations, series, diagnostics: mapped.diagnostics, mapping, sourceId: table.source.sourceId, policy });
  stages.push(nowStage("findings", "completed", `${built.findings.length} evidence-linked findings created`, series.length, built.findings.length));
  const report = {
    format: REPORT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    status: "completed",
    analysisId: `analysis-${stableHash(JSON.stringify({ digest: table.source.digest, mapping, policy }))}`,
    source: table.source,
    dataset: { rows: table.rows.length, columns: table.headers.length, headers: table.headers, primaryMeasure: measure, mapping: mapped.mappingSnapshot },
    policy,
    observations: mapped.observations,
    series,
    diagnostics: mapped.diagnostics,
    rejectedRows: mapped.rejectedRows,
    stages,
    findings: built.findings,
    evidence: built.evidence,
    limitations: ["CultureTrace performs deterministic descriptive analysis; it does not establish causation, contamination, species identity, or experimental success.", "Optical density is retained as an optical measurement and is not converted to biomass without a supplied calibration.", "Thresholds are configurable review rules and require context from the experimenter."],
    ai: { status: "not-requested" },
  };
  if (!validateEvidenceReferences(report.findings, report.evidence)) throw new Error("Internal evidence reference validation failed.");
  return report;
}
