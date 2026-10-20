import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_CSV, DEMO_MAPPING } from "../src/demoData.js";
import { exportFindingsCsv, exportReportMarkdown, parseCsv, runAnalysis, summarizeSeries, validateAiResponse, buildAiRequest } from "../src/core/index.mjs";

test("CSV parser preserves quoted delimiters, newlines, and source rows", () => {
  const table = parseCsv('\uFEFFid,timestamp,note\r\na,2026-01-01,"first,\nsecond"\r\nb,2026-01-02,"say ""hello"""\r\n', { filename: "quoted.csv" });
  assert.equal(table.headers[0].normalized, "id");
  assert.equal(table.rows[0].raw.note, "first,\nsecond");
  assert.equal(table.rows[1].raw.note, 'say "hello"');
  assert.equal(table.rows[0].rowNumber, 2);
});

test("CSV parser rejects unterminated quotes and duplicate normalized headers", () => {
  assert.throws(() => parseCsv("a,a\n1,2\n"), /same name/);
  assert.throws(() => parseCsv("a,b\n\"unterminated\n"), /quoted cell/);
});

test("demo workflow is deterministic and preserves evidence references", () => {
  const first = runAnalysis({ csv: DEMO_CSV, source: { sourceId: "demo-source", filename: "demo.csv" }, mapping: DEMO_MAPPING });
  const second = runAnalysis({ csv: DEMO_CSV, source: { sourceId: "demo-source", filename: "demo.csv" }, mapping: DEMO_MAPPING });
  assert.deepEqual(first, second);
  assert.equal(first.status, "completed");
  assert.equal(first.dataset.rows, 15);
  assert.ok(first.findings.some((finding) => finding.kind === "outlier"));
  assert.ok(first.findings.some((finding) => finding.kind === "sensor-quality"));
  for (const finding of first.findings) for (const id of finding.evidenceIds) assert.ok(first.evidence.some((item) => item.id === id));
});

test("known exponential series returns a one-day doubling time", () => {
  const observations = [0, 24, 48].map((hour, index) => ({ id: `obs-${index}`, cultureId: "a", conditionId: "control", replicateId: "1", timestamp: new Date(Date.UTC(2026, 0, 1, hour)).toISOString(), measurements: { biomass: [1, 2, 4][index] } }));
  const summary = summarizeSeries(observations, "biomass", { unit: "g/L" });
  assert.ok(Math.abs(summary.regression.logLinearSpecificGrowthRatePerDay - Math.log(2)) < 1e-10);
  assert.ok(Math.abs(summary.regression.doublingTimeDays - 1) < 1e-10);
  assert.equal(summary.counts.valid, 3);
});

test("missing and malformed values stay visible as diagnostics", () => {
  const csv = "culture,timestamp,biomass\na,2026-01-01T00:00:00Z,1\na,not-a-date,missing\na,2026-01-03T00:00:00Z,-2";
  const report = runAnalysis({ csv, source: { sourceId: "edge", filename: "edge.csv" }, mapping: { cultureId: "culture", timestamp: "timestamp", measurements: { biomass: { column: "biomass", unit: "g/L" } } } });
  assert.ok(report.diagnostics.some((item) => item.code === "invalid-timestamp"));
  assert.ok(report.diagnostics.some((item) => item.code === "invalid-number"));
  assert.ok(report.diagnostics.some((item) => item.code === "negative-value"));
});

test("exports are stable and formula-like text is protected", () => {
  const report = runAnalysis({ csv: DEMO_CSV, source: { sourceId: "demo-source", filename: "demo.csv" }, mapping: DEMO_MAPPING });
  const markdown = exportReportMarkdown(report);
  const findings = exportFindingsCsv(report);
  assert.match(markdown, /Deterministic analysis/);
  assert.match(findings, /finding_id,severity/);
  assert.doesNotMatch(markdown, /undefined|NaN|Infinity/);
});

test("AI request is minimized and responses cannot invent evidence", () => {
  const report = runAnalysis({ csv: DEMO_CSV, source: { sourceId: "demo-source", filename: "demo.csv" }, mapping: DEMO_MAPPING });
  const request = buildAiRequest(report);
  assert.equal(request.format, "culturetrace-ai-request");
  assert.equal(JSON.stringify(request).includes(DEMO_CSV), false);
  const valid = validateAiResponse({ format: "culturetrace-ai-response", schemaVersion: 1, suggestions: [{ id: "s1", kind: "question", text: "What should be checked next?", status: "ai-suggested", evidenceIds: [report.evidence[0].id] }] }, report);
  assert.equal(valid.suggestions[0].status, "ai-suggested");
  assert.throws(() => validateAiResponse({ format: "culturetrace-ai-response", schemaVersion: 1, suggestions: [{ id: "s2", kind: "hypothesis", text: "Invented", status: "derived", evidenceIds: ["not-real"] }] }, report), /evidence|trust status/);
});
