import { ENGINE_VERSION, FINDING_STATUSES, SEVERITIES, stableHash } from "./constants.mjs";

function evidence(id, kind, label, source, payload, limitations = []) {
  return { id, kind, label, source: { ...source, engineVersion: ENGINE_VERSION }, payload, limitations };
}

function addFinding(findings, finding) {
  if (findings.length < 500) findings.push({ ...finding, severity: SEVERITIES.includes(finding.severity) ? finding.severity : "review", status: FINDING_STATUSES.includes(finding.status) ? finding.status : "unresolved", provenance: finding.provenance ?? { origin: "deterministic", engineVersion: ENGINE_VERSION } });
}

export function buildFindings({ observations, series, diagnostics, mapping, sourceId, policy }) {
  const findings = [];
  const evidenceRecords = [];
  const issueGroups = new Map();
  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.code}|${diagnostic.field ?? ""}`;
    if (!issueGroups.has(key)) issueGroups.set(key, []);
    issueGroups.get(key).push(diagnostic);
  }
  for (const [key, issues] of issueGroups) {
    const [code, field] = key.split("|");
    const evidenceId = `evidence-validation-${stableHash(key)}`;
    evidenceRecords.push(evidence(evidenceId, "validation", `Validation rule: ${code}`, { origin: "deterministic", rule: code }, { code, field: field || null, rowNumbers: issues.map((issue) => issue.rowNumber).filter(Boolean), count: issues.length }));
    const severity = issues.some((issue) => issue.severity === "error") ? "error" : issues.some((issue) => issue.severity === "warning") ? "warning" : "review";
    addFinding(findings, { id: `finding-validation-${stableHash(key)}`, kind: "data-quality", severity, title: `${code.replaceAll("-", " ")}${field ? `: ${field}` : ""}`, description: `${issues.length} observation${issues.length === 1 ? "" : "s"} matched this validation rule. Review the cited rows before interpreting the series.`, affectedColumns: field ? [field] : [], affectedRows: issues.map((issue) => issue.rowNumber).filter(Boolean), evidenceIds: [evidenceId], limitations: ["A validation flag is not a biological diagnosis."] });
  }
  for (const summary of series) {
    const observationIds = summary.pointsUsed;
    const statId = `evidence-stat-${stableHash(summary.seriesId + summary.measure)}`;
    evidenceRecords.push(evidence(statId, "statistic", `${summary.seriesId} descriptive summary`, { origin: "deterministic", algorithm: "descriptive-and-ordinary-least-squares" }, { seriesId: summary.seriesId, measure: summary.measure, unit: summary.unit, counts: summary.counts, descriptive: summary.descriptive, regression: summary.regression, observationIds }));
    if (summary.counts.missing) {
      const missingId = `evidence-missing-${stableHash(summary.seriesId)}`;
      evidenceRecords.push(evidence(missingId, "observation-set", "Missing measurement observations", { origin: "deterministic" }, { seriesId: summary.seriesId, missingCount: summary.counts.missing, totalCount: summary.counts.total }));
      addFinding(findings, { id: `finding-missing-${stableHash(summary.seriesId)}`, kind: "missing-values", severity: "review", title: "Measurements are missing", description: `${summary.counts.missing} of ${summary.counts.total} observations do not contain a usable ${summary.measure} value.`, affectedColumns: [mapping.measurements[summary.measure]?.column ?? summary.measure], evidenceIds: [missingId], limitations: ["Missingness may reflect an unavailable sensor, an intentional omission, or an import issue."] });
    }
    if (summary.time.outOfOrder || summary.time.duplicateTimestamps) {
      addFinding(findings, { id: `finding-time-order-${stableHash(summary.seriesId)}`, kind: "timestamp-quality", severity: "warning", title: summary.time.outOfOrder ? "Timestamps are out of order" : "Duplicate timestamps are present", description: summary.time.outOfOrder ? "Source row order does not match timestamp order; calculations sort by timestamp and preserve source row references." : "More than one observation shares a timestamp. No rows were silently removed.", affectedColumns: [mapping.timestamp ?? "timestamp"], evidenceIds: [statId], limitations: ["Equal or reordered timestamps can be valid, but they should be checked against the collection protocol."] });
    }
    if (summary.time.maxGapHours !== null && summary.time.maxGapHours > (policy.maxGapHours ?? 48)) {
      addFinding(findings, { id: `finding-gap-${stableHash(summary.seriesId)}`, kind: "time-gap", severity: "review", title: "An observation interval is unusually large", description: `The largest interval in this series is ${summary.time.maxGapHours.toFixed(1)} hours, above the configured ${policy.maxGapHours}-hour review threshold.`, affectedColumns: [mapping.timestamp ?? "timestamp"], evidenceIds: [statId], limitations: ["A gap is a data-collection property, not evidence of a biological event."] });
    }
    if (summary.outlierIds.length) {
      const outlierId = `evidence-outliers-${stableHash(summary.seriesId)}`;
      evidenceRecords.push(evidence(outlierId, "statistic", "Robust outlier screen", { origin: "deterministic", algorithm: "median-absolute-deviation-or-IQR" }, { seriesId: summary.seriesId, method: policy.outlierMethod, threshold: policy.outlierThreshold, observationIds: summary.outlierIds }));
      addFinding(findings, { id: `finding-outlier-${stableHash(summary.seriesId)}`, kind: "outlier", severity: "review", title: "Some measurements are statistically unusual", description: `${summary.outlierIds.length} observation${summary.outlierIds.length === 1 ? " is" : "s are"} unusual under the configured ${policy.outlierMethod.toUpperCase()} screen.`, affectedRows: summary.outlierIds, evidenceIds: [outlierId], limitations: ["An outlier is not automatically an error and was not deleted or changed."] });
    }
    if (summary.descriptive.min !== null && summary.descriptive.min === summary.descriptive.max && summary.counts.valid > 1) {
      addFinding(findings, { id: `finding-constant-${stableHash(summary.seriesId)}`, kind: "sensor-quality", severity: "warning", title: "The measurement series is constant", description: `All usable ${summary.measure} values in this series are ${summary.descriptive.min}. A stuck sensor, rounded display, or genuinely stable measurement are possible explanations.`, evidenceIds: [statId], limitations: ["Constant values alone do not establish sensor failure or biological stasis."] });
    }
    if (summary.regression.logLinearSpecificGrowthRatePerDay !== null) {
      addFinding(findings, { id: `finding-growth-${stableHash(summary.seriesId)}`, kind: "growth-summary", severity: "info", status: "derived", title: "A descriptive log-linear rate is available", description: `The positive-only ${summary.measure} series has an estimated specific rate of ${summary.regression.logLinearSpecificGrowthRatePerDay.toFixed(4)} per day.`, affectedRows: observationIds, evidenceIds: [statId], limitations: ["This is a descriptive fit, not a causal claim or a calibrated biomass interpretation.", "Only positive measurements entered the log-linear calculation."] });
    } else {
      addFinding(findings, { id: `finding-growth-unresolved-${stableHash(summary.seriesId)}`, kind: "growth-summary", severity: "review", status: "unresolved", title: "Growth-rate estimation is unavailable", description: "The series does not have enough suitable positive, time-ordered measurements for the configured log-linear calculation.", affectedRows: observationIds, evidenceIds: [statId], limitations: ["Add sufficient positive measurements and time metadata, or choose a different analysis for this variable."] });
    }
  }
  const replicateGroups = new Map();
  for (const summary of series) {
    const key = `${summary.cultureId}|${summary.conditionId}`;
    if (!replicateGroups.has(key)) replicateGroups.set(key, []);
    replicateGroups.get(key).push(summary);
  }
  for (const [groupId, replicates] of replicateGroups) {
    if (replicates.length < 2) continue;
    const latest = replicates.map((item) => item.descriptive.last).filter((value) => Number.isFinite(value));
    const average = latest.reduce((sum, value) => sum + value, 0) / latest.length;
    const deviation = latest.length > 1 ? Math.sqrt(latest.reduce((sum, value) => sum + (value - average) ** 2, 0) / (latest.length - 1)) : null;
    const cv = average ? deviation / Math.abs(average) : null;
    const evidenceId = `evidence-replicates-${stableHash(groupId)}`;
    evidenceRecords.push(evidence(evidenceId, "replicate-summary", `Replicate comparison for ${groupId}`, { origin: "deterministic", algorithm: "latest-observation-descriptive-comparison" }, { groupId, replicateSeries: replicates.map((item) => item.seriesId), latestValues: latest, mean: average, sampleStdDev: deviation, coefficientOfVariation: cv }));
    addFinding(findings, { id: `finding-replicates-${stableHash(groupId)}`, kind: "replicate-consistency", severity: cv !== null && cv > 0.25 ? "review" : "info", status: "derived", title: "Replicate consistency summary is available", description: `${replicates.length} replicate series were compared for ${groupId}; the latest-value coefficient of variation is ${cv === null ? "not meaningful" : cv.toFixed(3)}.`, evidenceIds: [evidenceId], limitations: ["A replicate difference is a reason to investigate, not proof of experimental failure.", "This first comparison uses each series' latest valid observation."] });
  }
  if (!findings.length) {
    const id = "evidence-no-findings";
    evidenceRecords.push(evidence(id, "analysis-status", "No rule triggered", { origin: "deterministic" }, { observationCount: observations.length }));
    addFinding(findings, { id: "finding-no-findings", kind: "analysis-status", severity: "info", title: "No review flags were generated", description: "The configured checks did not identify a data-quality issue. This is not proof that the experiment is error-free.", evidenceIds: [id], limitations: ["Checks are limited to the implemented rules and available metadata."] });
  }
  return { findings, evidence: evidenceRecords };
}

export function validateEvidenceReferences(findings, evidence) {
  const ids = new Set(evidence.map((record) => record.id));
  return findings.every((finding) => finding.evidenceIds?.length && finding.evidenceIds.every((id) => ids.has(id)));
}
