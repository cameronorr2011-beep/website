import { safeNumber } from "./constants.mjs";

const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function regression(points) {
  if (points.length < 2) return { slope: null, intercept: null, rSquared: null };
  const xMean = mean(points.map((point) => point.x));
  const yMean = mean(points.map((point) => point.y));
  const denominator = points.reduce((sum, point) => sum + (point.x - xMean) ** 2, 0);
  if (!denominator) return { slope: null, intercept: null, rSquared: null };
  const slope = points.reduce((sum, point) => sum + (point.x - xMean) * (point.y - yMean), 0) / denominator;
  const intercept = yMean - slope * xMean;
  const total = points.reduce((sum, point) => sum + (point.y - yMean) ** 2, 0);
  const residual = points.reduce((sum, point) => sum + (point.y - (slope * point.x + intercept)) ** 2, 0);
  return { slope, intercept, rSquared: total ? Math.max(0, 1 - residual / total) : null };
}

export function summarizeSeries(observations, measure, options = {}) {
  const sourceOrder = [...observations];
  const valid = sourceOrder.filter((observation) => Number.isFinite(observation.measurements?.[measure]));
  const timed = valid.filter((observation) => observation.timestamp);
  const sorted = [...timed].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const values = valid.map((observation) => observation.measurements[measure]);
  const firstTime = sorted[0]?.timestamp ?? null;
  const lastTime = sorted.at(-1)?.timestamp ?? null;
  const spanHours = firstTime && lastTime ? (new Date(lastTime) - new Date(firstTime)) / 3_600_000 : null;
  const gaps = sorted.slice(1).map((observation, index) => (new Date(observation.timestamp) - new Date(sorted[index].timestamp)) / 3_600_000);
  const points = sorted.map((observation) => ({ x: (new Date(observation.timestamp) - new Date(firstTime)) / 86_400_000, y: observation.measurements[measure], id: observation.id }));
  const linear = regression(points);
  const logPoints = points.filter((point) => point.y > 0);
  const logRegression = regression(logPoints.map((point) => ({ ...point, y: Math.log(point.y) })));
  const logRate = safeNumber(logRegression.slope);
  const sortedValues = [...values].sort((a, b) => a - b);
  const q1 = median(sortedValues.slice(0, Math.floor(sortedValues.length / 2)));
  const q3 = median(sortedValues.slice(Math.ceil(sortedValues.length / 2)));
  const iqr = q1 !== null && q3 !== null ? q3 - q1 : null;
  const med = median(values);
  const deviations = med === null ? [] : values.map((value) => Math.abs(value - med));
  const mad = median(deviations);
  const outlierThreshold = options.outlierThreshold ?? 3.5;
  const outlierIds = mad && mad > 0 ? valid.filter((observation) => Math.abs(0.6745 * (observation.measurements[measure] - med) / mad) > outlierThreshold).map((observation) => observation.id) : (iqr && iqr > 0 ? valid.filter((observation) => observation.measurements[measure] < q1 - 1.5 * iqr || observation.measurements[measure] > q3 + 1.5 * iqr).map((observation) => observation.id) : []);
  const sampleStdDev = values.length > 1 ? Math.sqrt(values.reduce((sum, value) => sum + (value - mean(values)) ** 2, 0) / (values.length - 1)) : null;
  const average = mean(values);
  return {
    seriesId: `${observations[0]?.cultureId ?? "unknown"}|${observations[0]?.conditionId ?? "Unspecified"}|${observations[0]?.replicateId ?? "Unspecified"}`,
    cultureId: observations[0]?.cultureId ?? "unknown",
    conditionId: observations[0]?.conditionId ?? "Unspecified",
    replicateId: observations[0]?.replicateId ?? "Unspecified",
    measure,
    unit: options.unit ?? "",
    counts: { total: observations.length, valid: valid.length, missing: observations.length - valid.length, distinctTimestamps: new Set(timed.map((observation) => observation.timestamp)).size },
    time: { firstTimestamp: firstTime, lastTimestamp: lastTime, spanHours: safeNumber(spanHours), maxGapHours: gaps.length ? Math.max(...gaps) : null, outOfOrder: sourceOrder.some((observation, index) => index > 0 && observation.timestamp && sourceOrder[index - 1].timestamp && new Date(observation.timestamp) < new Date(sourceOrder[index - 1].timestamp)), duplicateTimestamps: timed.length !== new Set(timed.map((observation) => observation.timestamp)).size },
    descriptive: { first: sorted[0] ? sorted[0].measurements[measure] : null, last: sorted.at(-1)?.measurements[measure] ?? null, min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null, mean: average, median: med, sampleStdDev, coefficientOfVariation: average && sampleStdDev !== null ? Math.abs(sampleStdDev / average) : null, delta: sorted.length > 1 ? sorted.at(-1).measurements[measure] - sorted[0].measurements[measure] : null, relativeChange: sorted.length > 1 && sorted[0].measurements[measure] !== 0 ? (sorted.at(-1).measurements[measure] - sorted[0].measurements[measure]) / Math.abs(sorted[0].measurements[measure]) : null },
    regression: { linearSlopePerDay: safeNumber(linear.slope), rSquaredLinear: safeNumber(linear.rSquared), logLinearSpecificGrowthRatePerDay: logRate, doublingTimeDays: logRate && logRate > 0 ? Math.log(2) / logRate : null, rSquaredLogLinear: safeNumber(logRegression.rSquared) },
    pointsUsed: sorted.map((observation) => observation.id),
    excludedFromLog: points.filter((point) => point.y <= 0).map((point) => point.id),
    outlierIds,
  };
}

export function groupBySeries(observations) {
  const groups = new Map();
  for (const observation of observations) {
    const key = `${observation.cultureId}|${observation.conditionId}|${observation.replicateId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(observation);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([seriesId, items]) => ({ seriesId, observations: items }));
}
