import { AI_REQUEST_FORMAT, AI_RESPONSE_FORMAT, LIMITS, SCHEMA_VERSION, stableHash } from "./constants.mjs";

export function buildAiRequest(report, question = null) {
  const request = {
    format: AI_REQUEST_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    reportDigest: stableHash(JSON.stringify(report.findings ?? [])),
    question,
    dataset: { rows: report.dataset?.rows, columns: report.dataset?.columns, primaryMeasure: report.dataset?.primaryMeasure },
    series: (report.series ?? []).map((series) => ({ seriesId: series.seriesId, measure: series.measure, unit: series.unit, counts: series.counts, descriptive: series.descriptive, regression: series.regression })),
    findings: (report.findings ?? []).map((finding) => ({ id: finding.id, severity: finding.severity, status: finding.status, kind: finding.kind, title: finding.title, description: finding.description, evidenceIds: finding.evidenceIds })),
    evidence: (report.evidence ?? []).map((item) => ({ id: item.id, kind: item.kind, label: item.label, payload: item.payload })),
    limitations: report.limitations ?? [],
  };
  const serialized = JSON.stringify(request);
  if (serialized.length > LIMITS.maxAiInputCharacters) throw new Error("The minimized AI summary exceeds the configured request limit.");
  return request;
}

export function validateAiResponse(payload, report) {
  if (!payload || payload.format !== AI_RESPONSE_FORMAT || payload.schemaVersion !== SCHEMA_VERSION || !Array.isArray(payload.suggestions)) throw new Error("The AI response did not match the CultureTrace schema.");
  const evidenceIds = new Set((report.evidence ?? []).map((item) => item.id));
  const suggestions = payload.suggestions.map((suggestion, index) => {
    if (!suggestion || !["hypothesis", "question", "follow-up"].includes(suggestion.kind)) throw new Error(`AI suggestion ${index + 1} has an unsupported kind.`);
    if (!String(suggestion.text ?? "").trim() || String(suggestion.text).length > 2_000) throw new Error(`AI suggestion ${index + 1} has invalid text.`);
    if (!Array.isArray(suggestion.evidenceIds) || suggestion.evidenceIds.some((id) => !evidenceIds.has(id))) throw new Error(`AI suggestion ${index + 1} references evidence that does not exist.`);
    if (suggestion.status !== "ai-suggested") throw new Error(`AI suggestion ${index + 1} attempted to change its trust status.`);
    return { id: String(suggestion.id || `ai-suggestion-${index + 1}`), kind: suggestion.kind, text: String(suggestion.text), status: "ai-suggested", evidenceIds: [...suggestion.evidenceIds] };
  });
  return { format: AI_RESPONSE_FORMAT, schemaVersion: SCHEMA_VERSION, suggestions };
}
