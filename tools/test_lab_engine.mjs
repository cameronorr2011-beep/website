import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../game/js/lab-engine.js", import.meta.url), "utf8");
const engine = await import(`data:text/javascript,${encodeURIComponent(source)}`);

const { createLabState, metrics, parseState, runCompleteWorkflow, runSelfTest, serializeState, step } = engine;
const selfTest = runSelfTest();
assert.deepEqual(selfTest, {
  sameSeedMatches: true,
  differentSeedDiffers: true,
  massConsistent: true,
  workflowTransferred: true,
});

const first = createLabState("TEST-REPRO");
const second = createLabState("TEST-REPRO");
runCompleteWorkflow(first);
runCompleteWorkflow(second);
step(first, 24 * 60 * 60);
step(second, 24 * 60 * 60);
assert.deepEqual(metrics(first), metrics(second), "fixed-step results must be seed-reproducible");
assert.equal(first.cyano.stage, "transferred");
assert.ok(first.cyano.cells.some((cell) => cell.state === "transferred"));
assert.ok(first.cyano.stats.filteredOut > 0, "filtration loss should be represented");
assert.ok(first.cyano.stats.emptyDroplets > 0, "empty droplets should be represented");
assert.ok(first.cyano.stats.multipletDroplets > 0, "multiplet droplets should be represented");
assert.ok(Math.abs(metrics(first).biomassConcG_L - first.algae.biomassG / first.algae.volumeL) < 1e-4);
assert.equal(parseState(serializeState(first)).format, "orr-biologicals-lab");
assert.throws(() => parseState(JSON.stringify({ format: "orr-biologicals-lab", version: 999 })), /Unsupported/);

console.log("lab engine: deterministic workflow, mass balance, loss modes, and schema validation passed");
