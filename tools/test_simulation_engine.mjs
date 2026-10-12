import assert from "node:assert/strict";
import {
  INPUT_FORMAT,
  MODEL_VERSION,
  ORGANISM_PROFILES,
  OUTPUT_FORMAT,
  WORKLOAD_LIMITS,
  compareScenarios,
  createSimulationInput,
  duplicateScenario,
  exportTimeSeriesCsv,
  parseSimulationOutput,
  runParameterSweep,
  runSensitivityAnalysis,
  runSimulation,
  serializeSimulationOutput,
  validateFiniteOutput,
  validateSimulationInput,
} from "../Simulation/engine/index.mjs";

const baselineInput = createSimulationInput({
  scenarioId: "baseline-test",
  scenarioLabel: "Baseline test culture",
  organism: "Arthrospira",
  durationHours: 24,
  stepHours: 1,
  initialBiomassG_L: 0.1,
  model: {
    muMaxPerDay: 0.24,
    carryingCapacityG_L: 1.5,
    volumeL: 18,
    environment: { lightPpfd: 220, temperatureC: 30, pH: 9.5, nutrientMgL: 250 },
  },
});

assert.equal(baselineInput.format, INPUT_FORMAT);
assert.equal(baselineInput.modelVersion, MODEL_VERSION);
assert.equal(baselineInput.integration.method, "fixed-step-euler");
assert.equal(baselineInput.organism.classification, "reference / illustrative");
assert.deepEqual(Object.keys(ORGANISM_PROFILES).sort(), [
  "arthrospira",
  "chlorella-vulgaris",
  "isochrysis",
  "nannochloropsis-oceanica",
  "pavlova",
  "tetraselmis",
]);

const baselineOutput = runSimulation(baselineInput);
assert.equal(baselineOutput.format, OUTPUT_FORMAT);
assert.equal(baselineOutput.modelVersion, MODEL_VERSION);
assert.equal(baselineOutput.timeSeries.length, 25, "the initial point plus 24 fixed Euler steps should be exported");
assert.ok(baselineOutput.derivedMetrics.finalBiomassG_L > baselineOutput.derivedMetrics.initialBiomassG_L);
assert.ok(baselineOutput.derivedMetrics.deltaBiomassG_L > 0);
assert.ok(Number.isFinite(baselineOutput.derivedMetrics.relativeChange));
assert.ok(Number.isFinite(baselineOutput.derivedMetrics.endpointGrowthRatePerDay));
assert.equal(baselineOutput.modelConfigurationSnapshot.modelVersion, MODEL_VERSION);
assert.equal(baselineOutput.modelConfigurationSnapshot.configuration.muMaxPerDay, 0.24);
assert.equal(baselineOutput.modelVersionSnapshot.modelVersion, MODEL_VERSION);
assert.equal(validateFiniteOutput(baselineOutput).valid, true);
const firstPoint = baselineOutput.timeSeries[0];
const expectedDerivative = firstPoint.muEffPerDay * firstPoint.biomassG_L * (1 - firstPoint.biomassG_L / firstPoint.carryingCapacityG_L);
const expectedEulerPoint = firstPoint.biomassG_L + (baselineInput.integration.stepHours / 24) * expectedDerivative;
assert.ok(Math.abs(baselineOutput.timeSeries[1].biomassG_L - expectedEulerPoint) < 1e-9, "the first point must use the documented forward Euler equation");

for (const profile of Object.values(ORGANISM_PROFILES)) {
  assert.equal(profile.classification, "reference / illustrative");
  assert.match(profile.parameterBasis, /illustrative/i);
  assert.match(profile.provenance.note, /does not identify|not a species/i);
}

const invalidNegative = { ...baselineInput, initialConditions: { ...baselineInput.initialConditions, biomassG_L: -0.1 } };
assert.equal(validateSimulationInput(invalidNegative).valid, false);
assert.throws(() => runSimulation(invalidNegative), /validation failed/i);
assert.throws(() => createSimulationInput({ model: { unsupportedFactor: 1 } }), /validation failed|unsupported/i);
assert.throws(() => createSimulationInput({ integration: { method: "rk4", durationHours: 24, stepHours: 1 } }), /validation failed|fixed-step-euler/i);

const zeroInput = createSimulationInput({ durationHours: 12, stepHours: 1, initialBiomassG_L: 0 });
const zeroOutput = runSimulation(zeroInput);
assert.equal(zeroOutput.derivedMetrics.initialBiomassG_L, 0);
assert.equal(zeroOutput.derivedMetrics.finalBiomassG_L, 0);
assert.equal(zeroOutput.derivedMetrics.deltaBiomassG_L, 0);
assert.equal(zeroOutput.derivedMetrics.relativeChange, 0, "zero-to-zero relative change is explicitly handled as no change");
assert.equal(zeroOutput.derivedMetrics.relativeChangeReason, "zero-baseline-no-change");
assert.equal(zeroOutput.derivedMetrics.endpointGrowthRatePerDay, 0);

const reproducibleA = runSimulation(baselineInput);
const reproducibleB = runSimulation(createSimulationInput(JSON.parse(JSON.stringify(baselineInput))));
assert.deepEqual(reproducibleA, reproducibleB, "same versioned input must reproduce the complete output");
assert.deepEqual(parseSimulationOutput(serializeSimulationOutput(reproducibleA)), reproducibleA);

const changed = duplicateScenario(baselineInput, { model: { muMaxPerDay: 0.31 }, scenarioId: "higher-rate" });
const comparison = compareScenarios(baselineInput, changed);
assert.equal(comparison.format, "orr-biologicals-algal-simulation-comparison");
assert.equal(comparison.identicalParameters, false);
assert.ok(comparison.changedParameterPaths.includes("model.muMaxPerDay"));
assert.equal(comparison.changedParameters.find((entry) => entry.path === "model.muMaxPerDay").before, 0.24);
assert.equal(comparison.changedParameters.find((entry) => entry.path === "model.muMaxPerDay").after, 0.31);
assert.ok(comparison.metrics.difference.finalBiomassG_L > 0);

const csv = exportTimeSeriesCsv(baselineOutput);
const csvLines = csv.trimEnd().split("\n");
assert.match(csvLines[0], /^step,time_hours,biomass_g_l/);
assert.equal(csvLines.length, baselineOutput.timeSeries.length + 1);
assert.ok(csvLines.every((line) => !line.includes("undefined")));

const sweep = runParameterSweep(baselineInput, "model.muMaxPerDay", [0.18, 0.24, 0.30]);
assert.equal(sweep.cases.length, 3);
assert.equal(sweep.parameterPath, "model.muMaxPerDay");
assert.ok(sweep.cases[2].metrics.finalBiomassG_L > sweep.cases[0].metrics.finalBiomassG_L);
assert.equal(sweep.workload.totalSteps, 72);
assert.throws(
  () => runParameterSweep(baselineInput, "model.muMaxPerDay", Array.from({ length: WORKLOAD_LIMITS.maxSweepCases + 1 }, (_, index) => 0.1 + index / 1000)),
  /limit/i,
);
assert.throws(
  () => runParameterSweep(baselineInput, { path: "model.muMaxPerDay", values: [0.2, 0.3], options: { maxSteps: 10 } }),
  /limit/i,
);
const sensitivity = runSensitivityAnalysis(baselineInput, [
  { path: "model.muMaxPerDay", values: [0.20, 0.24] },
  { path: "model.environment.lightPpfd", values: [120, 220] },
]);
assert.equal(sensitivity.sweeps.length, 2);
assert.equal(sensitivity.workload.totalSteps, 96);

console.log("simulation engine: baseline, validation, zero handling, reproducibility, version snapshots, comparison, CSV export, finite outputs, and sweep limits passed");
