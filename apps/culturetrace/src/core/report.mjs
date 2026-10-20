import { REPORT_FORMAT, stableHash } from "./constants.mjs";

function csvCell(value) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function serializeReport(report, { pretty = true } = {}) {
  return JSON.stringify(report, null, pretty ? 2 : 0) + "\n";
}

export function exportFindingsCsv(report) {
  const rows = [["finding_id", "severity", "status", "kind", "title", "description", "evidence_ids", "affected_rows"]];
  for (const finding of report.findings ?? []) rows.push([finding.id, finding.severity, finding.status, finding.kind, finding.title, finding.description, (finding.evidenceIds ?? []).join(" "), (finding.affectedRows ?? []).join(" ")]);
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function exportObservationsCsv(report) {
  const measures = Object.keys(report.dataset?.mapping?.measurements ?? {});
  const rows = [["observation_id", "culture_id", "condition", "replicate", "timestamp", "elapsed_hours", ...measures]];
  for (const observation of report.observations ?? []) rows.push([observation.id, observation.cultureId, observation.conditionId, observation.replicateId, observation.timestamp, observation.elapsedHours, ...measures.map((measure) => observation.measurements[measure])]);
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function exportReportMarkdown(report) {
  const lines = ["# CultureTrace report", "", "Deterministic analysis of supplied experiment observations. AI suggestions, when present, are unverified hypotheses.", "", "## Dataset", `- Source: ${report.source?.filename ?? "unknown"}`, `- Source digest: ${report.source?.digest ?? "unknown"}`, `- Analysis ID: ${report.analysisId ?? "unknown"}`, `- Rows: ${report.dataset?.rows ?? 0}`, `- Columns: ${report.dataset?.columns ?? 0}`, `- Engine: ${report.engineVersion ?? "unknown"}`, "", "## Analysis stages"];
  for (const stage of report.stages ?? []) lines.push(`- **${stage.name}** — ${stage.status}: ${stage.reason}`);
  lines.push("", "## Series summaries", "", "| Series | Measure | Valid | Missing | Mean | Last | Rate / day |", "| --- | --- | ---: | ---: | ---: | ---: | ---: |");
  for (const series of report.series ?? []) lines.push(`| ${series.seriesId} | ${series.measure} (${series.unit}) | ${series.counts.valid} | ${series.counts.missing} | ${series.descriptive.mean ?? "—"} | ${series.descriptive.last ?? "—"} | ${series.regression.logLinearSpecificGrowthRatePerDay ?? "—"} |`);
  lines.push("", "## Findings");
  for (const finding of report.findings ?? []) lines.push(`- **${finding.severity.toUpperCase()} · ${finding.title}** — ${finding.description} _(evidence: ${(finding.evidenceIds ?? []).join(", ")})_`);
  lines.push("", "## Limitations", ...(report.limitations ?? []).map((value) => `- ${value}`), "", "## Evidence index");
  for (const item of report.evidence ?? []) lines.push(`- **${item.id}** — ${item.label} (${item.source?.origin ?? "unknown"})`);
  return lines.join("\n") + "\n";
}

export function exportReportHtml(report) {
  const markdown = exportReportMarkdown(report);
  const content = markdown.split("\n").map((line) => {
    if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
    if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
    if (line.startsWith("- ")) return `<p class="bullet">${escapeHtml(line.slice(2))}</p>`;
    if (line.startsWith("| ")) return `<pre>${escapeHtml(line)}</pre>`;
    return line ? `<p>${escapeHtml(line)}</p>` : "";
  }).join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><title>CultureTrace report</title><style>body{font-family:Arial,sans-serif;color:#18332b;max-width:860px;margin:48px auto;line-height:1.55}h1{font-size:32px}h2{margin-top:30px;border-bottom:1px solid #c7d7ce;padding-bottom:6px}.bullet{margin:5px 0 5px 18px}pre{background:#f1f5f1;padding:8px;overflow:auto}</style></head><body>${content}</body></html>`;
}

export function reportBundle(report) {
  return { json: serializeReport(report), markdown: exportReportMarkdown(report), html: exportReportHtml(report), findingsCsv: exportFindingsCsv(report), observationsCsv: exportObservationsCsv(report), digest: stableHash(serializeReport(report, { pretty: false })) };
}

export function validateReportShape(report) {
  return Boolean(report && report.format === REPORT_FORMAT && Array.isArray(report.findings) && Array.isArray(report.evidence) && report.findings.every((finding) => finding.evidenceIds?.every((id) => report.evidence.some((item) => item.id === id))));
}
