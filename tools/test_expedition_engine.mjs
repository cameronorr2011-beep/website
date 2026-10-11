import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../game/js/expedition-engine.js", import.meta.url), "utf8");
const engine = await import(`data:text/javascript,${encodeURIComponent(source)}`);

const {
  ENVIRONMENT_TYPES,
  advanceAutonomy,
  cleanProbe,
  collectSample,
  createExpeditionState,
  getExpeditionSummary,
  moveProbe,
  parseState,
  recoverProbe,
  scan,
  serializeState,
  setAutonomy,
  validateExpeditionState,
} = engine;

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);
}

function moveTo(state, point) {
  const before = state.probe.position;
  const delta = { x: point.x - before.x, y: point.y - before.y, depth: point.z - before.z };
  const horizontal = Math.hypot(point.x - before.x, point.y - before.y);
  const seconds = Math.max(1, Math.ceil(horizontal / state.probe.horizontalSpeedMps));
  moveProbe(state, delta, seconds);
  assert.ok(distance(state.probe.position, point) <= 80, "probe should reach selected hotspot scan range");
}

assert.deepEqual(ENVIRONMENT_TYPES, ["freshwater", "marine", "sediment", "terrestrial"]);

const manual = createExpeditionState("EXPEDITION-LOOP", "freshwater", { sampleCapacity: 2 });
assert.equal(manual.status, "deployed");
assert.equal(manual.environmentType, "freshwater");
assert.equal(manual.world.regions.length, 4);
assert.equal(manual.world.hotspots.length, 8);
assert.ok(manual.world.hotspots.every((hotspot) => hotspot.telemetry.observed && hotspot.telemetry.inferred));
assert.ok(manual.world.hotspots[0].signals.some((signal) => signal.classification === "reference" && signal.organism.provenance.label === "real reference organism"));
assert.ok(manual.world.hotspots[0].signals.some((signal) => signal.classification === "simulated" && signal.organism.provenance.label.includes("simulated")));

const launchHotspot = manual.world.hotspots[0];
moveTo(manual, launchHotspot.position);
const energyBeforeScan = manual.probe.energy;
scan(manual, launchHotspot.id);
assert.equal(manual.lastAction.ok, true);
assert.equal(manual.scans.length, 1);
assert.ok(manual.detections.length >= 2, "launch hotspot should provide a deterministic scan path");
assert.ok(manual.detections.every((detection) => detection.inferred.uncertainty.lower <= detection.inferred.confidence));
assert.ok(manual.probe.energy < energyBeforeScan, "scanning must spend energy");

const referenceDetection = manual.detections.find((detection) => detection.classification === "reference");
const simulatedDetection = manual.detections.find((detection) => detection.classification === "simulated");
collectSample(manual, referenceDetection.targetId);
assert.equal(manual.lastAction.ok, true);
assert.equal(manual.samples.length, 1);
assert.equal(manual.candidates.length, 1);
assert.equal(manual.samples[0].classification, "reference");
assert.equal(manual.samples[0].provenance.label, "real reference organism");
assert.ok(manual.samples[0].observed.telemetry);
assert.ok(manual.samples[0].inferred.uncertainty);

const foulingAfterSample = manual.probe.fouling;
cleanProbe(manual, 4);
assert.ok(manual.probe.fouling < foulingAfterSample, "cleaning should reduce fouling");
assert.ok(manual.lastAction.ok);
collectSample(manual, simulatedDetection.targetId);
assert.equal(manual.samples.length, 2);
assert.equal(manual.samples[1].classification, "simulated");
assert.equal(manual.samples[1].provenance.label, "fictional candidate labeled simulated");

const sampleLimit = createExpeditionState("SAMPLE-LIMIT", "freshwater", { sampleCapacity: 1 });
moveTo(sampleLimit, sampleLimit.world.hotspots[0].position);
scan(sampleLimit, sampleLimit.world.hotspots[0].id);
const limitTarget = sampleLimit.detections[0].targetId;
collectSample(sampleLimit, limitTarget);
assert.equal(sampleLimit.samples.length, 1);
collectSample(sampleLimit, sampleLimit.detections[1]?.targetId || limitTarget);
assert.equal(sampleLimit.lastAction.reason, "sample-capacity-reached");
assert.equal(sampleLimit.probe.energy >= 0, true);

const energyLimit = createExpeditionState("ENERGY-LIMIT", "marine", { maxEnergy: 20 });
energyLimit.probe.energy = 0.2;
moveProbe(energyLimit, { x: 1, depth: 1 }, 60);
assert.equal(energyLimit.probe.energy, 0);
assert.equal(energyLimit.probe.status, "depleted");
assert.equal(energyLimit.status, "depleted");
assert.equal(energyLimit.probe.energy >= 0, true);
recoverProbe(energyLimit);
assert.equal(energyLimit.status, "recovered");
assert.equal(energyLimit.probe.depthM, 0);

const cleaning = createExpeditionState("CLEANING-STATE", "sediment");
cleaning.probe.fouling = 0.86;
setAutonomy(cleaning, true);
advanceAutonomy(cleaning, 3);
assert.ok(cleaning.autonomy.transitions.some((transition) => transition.to === "cleaning"), "autonomy should enter cleaning state");
const foulingAfterAutonomy = cleaning.probe.fouling;
advanceAutonomy(cleaning, 20);
assert.ok(cleaning.probe.fouling < foulingAfterAutonomy, "autonomy cleaning should reduce fouling");
assert.ok(cleaning.autonomy.transitions.some((transition) => transition.to === "idle" || transition.to === "navigating"), "autonomy should leave cleaning state");

const loopA = createExpeditionState("REPRODUCIBLE-EXPEDITION", "marine", { sampleCapacity: 2 });
const loopB = createExpeditionState("REPRODUCIBLE-EXPEDITION", "marine", { sampleCapacity: 2 });
advanceAutonomy(loopA, 180);
advanceAutonomy(loopB, 180);
assert.deepEqual(loopA, loopB, "same seed and actions must reproduce complete expedition state");
assert.ok(loopA.samples.length > 0, "autonomy should collect samples");
assert.ok(loopA.candidates.every((candidate) => ["reference", "simulated"].includes(candidate.classification)));
assert.ok(loopA.recoveries.length > 0, "autonomy should recover after sample capacity is reached");

const encoded = serializeState(loopA);
const decoded = parseState(encoded);
assert.deepEqual(decoded, loopA, "serialization round-trip must preserve validated state");
assert.equal(validateExpeditionState(decoded).valid, true);
assert.throws(() => parseState("{"), /Malformed/);
assert.throws(() => parseState(JSON.stringify({ format: "orr-biologicals-expedition", version: 999 })), /Invalid/);
const malformed = JSON.parse(encoded);
malformed.state.probe.energy = -1;
assert.throws(() => parseState(malformed), /Invalid/);
const dangling = JSON.parse(encoded);
dangling.state.samples[0].candidateId = "CAND-MISSING";
assert.throws(() => parseState(dangling), /missing candidate/);

const summary = getExpeditionSummary(loopA);
assert.equal(summary.counts.samples, loopA.samples.length);
assert.equal(summary.probe.sampleCapacity, 2);

console.log("expedition engine: deterministic deployment, movement, uncertain scans, persistent samples, limits, cleaning, recovery, autonomy, and schema validation passed");
