import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "game", "js", "biorealm-engine.js");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "biorealm-engine-"));
const bundle = await build({ entryPoints: [source], bundle: true, format: "cjs", platform: "node", write: false, target: "es2022" });
const bundlePath = path.join(temp, "engine.cjs");
fs.writeFileSync(bundlePath, bundle.outputFiles[0].text);
const engine = await import(`file://${bundlePath.replaceAll("\\", "/")}`);

const {
  BIOMES, BIOMASS_TO_CREDITS, DEVICES, MAX_OFFLINE_SECONDS, RARITIES, REACTOR_TIERS, REACTOR_ENVIRONMENTS, SAVE_KEY,
  SPECIES, UPGRADES, applyOffline, assignSpecies, calculateTotalRate, claimGrant, collectExpedition,
  createInitialState, deviceUpgradeCost, discoveryOdds, eventFor, harvestAll, installDevice, migrateLegacySave,
  parseState, reactorCapacity, reactorProduction, reactorUpgradeCost, researchProgress, safeLoad,
  serializeState, setDeviceAutoRepeat, settleProduction, speciesRate, startExpedition, tick, tickExpeditions,
  unlockBiome, unlockedResearch, upgradeDevice, upgradeReactor, buyDevice, buyReactor, buyUpgrade,
  setReactorEnvironment, storageSummary, checkContracts, collectReadyExpeditions, clearReactorSlot,
} = engine;

const DAY = 86_400_000;
const storage = (entries = {}) => ({
  entries: { ...entries },
  getItem(key) { return this.entries[key] ?? null; },
  setItem(key, value) { this.entries[key] = String(value); },
});
const fresh = (seed = "TEST", now = 0) => createInitialState(seed, now);
const device = (state, type = "screening") => {
  state.credits = 10_000_000;
  const result = buyDevice(state, type, 0);
  assert.equal(result.ok, true);
  return result.device;
};
const assertNear = (actual, expected, tolerance, message) => assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} vs ${expected}`);

assert.equal(BIOMES.length, 9, "the atlas should contain the original seven plus lakes and soil");
assert.ok(BIOMES.some((biome) => biome.id === "lakes") && BIOMES.some((biome) => biome.id === "soil"));
assert.equal(SPECIES.length >= 25, true, "each late biome needs ordinary outcomes as well as rare ones");
assert.equal(DEVICES.find((item) => item.id === "screening").cost, 95);
assert.equal(REACTOR_TIERS[0].id, "flask");
assert.equal(BIOMASS_TO_CREDITS, 3);
assert.deepEqual(Object.keys(fresh("SETTINGS", 0).settings).sort(), ["effects", "music", "musicVolume", "muted", "reducedMotion", "sfx", "sfxVolume"]);
assert.equal(createInitialState(undefined, 0).seed !== createInitialState(undefined, 0).seed, true, "a new world must not reuse a day-based seed");
assert.deepEqual(REACTOR_ENVIRONMENTS.map((item) => item.id), ["balanced", "warm", "marine", "shade", "wetland", "extreme", "rare"]);

const initial = fresh("STARTER", 0);
assert.equal(initial.credits, 95);
assert.deepEqual(initial.discovered, ["arthrospira"]);
assert.equal(initial.reactors[0].slots[0], "arthrospira");
assert.ok(calculateTotalRate(initial, 0) > 0, "the existing starter culture should produce income immediately");
assert.equal(initial.stats.grants, 0);
assert.equal(claimGrant(initial).ok, true);
assert.equal(initial.credits, 195);
assert.equal(claimGrant(initial).ok, false, "the research grant must be one-time");
assert.equal(initial.stats.grants, 1);
const starterRate = reactorProduction(initial.reactors[0], initial, 0);
assert.ok(reactorCapacity(initial.reactors[0], initial) >= starterRate * MAX_OFFLINE_SECONDS * 0.9, "the first vessel should hold roughly an eight-hour return");
assert.equal(storageSummary(initial).reactors[0].capacity, reactorCapacity(initial.reactors[0], initial));
for (const tier of REACTOR_TIERS) assert.ok(tier.capacity >= tier.rate * tier.efficiency * tier.slots * MAX_OFFLINE_SECONDS * 0.5, `${tier.id} storage should remain useful across an eight-hour return`);

const loop = fresh("FULL-LOOP", 0);
claimGrant(loop);
const screening = device(loop);
assert.equal(screening.rackId, "rack-1", "a purchased device should auto-install in a free rack slot");
assert.equal(screening.slot, 0);
assert.equal(startExpedition(loop, screening.id, "freshwater", 0).ok, true);
assert.ok(loop.devices[0].expedition.endsAt >= 29_000 && loop.devices[0].expedition.endsAt <= 35_000, "starter freshwater survey should take about 32 seconds");
assert.equal(startExpedition(loop, screening.id, "freshwater", 1_000).reason, "device");
checkContracts(loop);
assert.equal(loop.stats.contracts, 0, "launching a survey must not pay the completion contract");
assert.equal(unlockedResearch(loop), 0, "launching is not a research milestone");
const ready = tickExpeditions(loop, 32_000);
assert.equal(ready.length, 1);
assert.equal(loop.devices[0].status, "ready");
const firstResult = collectExpedition(loop, screening.id, 32_000);
assert.equal(firstResult.ok, true);
assert.equal(firstResult.result.samples.length, 1, "the screening profile has one sample chamber");
assert.equal(loop.stats.completedExpeditions, 1);
assert.ok(loop.discovered.includes(firstResult.result.speciesId));
assert.equal(collectExpedition(loop, screening.id, 32_000).ok, false, "a collected reward is idempotent");
assert.ok(loop.stats.contracts >= 1 && loop.credits >= 200, "the first field-note contract should pay once");

const differentSeed = fresh("OTHER-SEED", 0);
const otherDevice = device(differentSeed);
startExpedition(differentSeed, otherDevice.id, "freshwater", 0);
tickExpeditions(differentSeed, 32_000);
const otherResult = collectExpedition(differentSeed, otherDevice.id, 32_000);
assert.notEqual(`${firstResult.result.speciesId}:${firstResult.result.sampleSeed}`, `${otherResult.result.speciesId}:${otherResult.result.sampleSeed}`, "different seeds should produce different deterministic records");

const fixed = fresh("FIXED-OUTCOME", 0);
const fixedDevice = device(fixed);
startExpedition(fixed, fixedDevice.id, "freshwater", 0);
fixed.upgrades.optics = 3;
fixed.devices[0].level = 5;
tickExpeditions(fixed, 32_000);
const fixedOutcome = fixed.devices[0].expedition.result;
const fixedEncoded = serializeState(fixed);
const fixedRestored = parseState(fixedEncoded, 32_000);
assert.deepEqual(fixedRestored.devices[0].expedition.result, fixedOutcome, "reload must not reroll a ready reward");
assert.equal(collectExpedition(fixedRestored, fixedDevice.id, 32_000).ok, true);
assert.equal(collectExpedition(fixedRestored, fixedDevice.id, 32_000).ok, false);

const compatibility = fresh("COMPAT", 0);
const compatibilityDevice = device(compatibility, "screening");
assert.equal(startExpedition(compatibility, compatibilityDevice.id, "lakes", 0).reason, "biome");
compatibility.unlockedBiomes.push("lakes");
assert.equal(startExpedition(compatibility, compatibilityDevice.id, "lakes", 0).reason, "incompatible", "profiles should gate unsuitable field sites");
const optical = device(compatibility, "optical");
assert.equal(startExpedition(compatibility, optical.id, "lakes", 0).ok, true);
assert.equal(compatibility.devices.find((item) => item.id === optical.id).expedition.snapshot.chambers, 2);

const oddsState = fresh("ODDS", 0);
const oddsDevice = { id: "odds", type: "archive", level: 8 };
const odds = discoveryOdds(oddsState, oddsDevice, "night-tide", 200_000);
assert.equal(Array.isArray(odds), true);
assertNear(odds.reduce((sum, item) => sum + item.probability, 0), 1, 1e-12, "weighted odds should normalize");
assert.ok(odds.some((item) => item.rarity === "common") && odds.some((item) => item.rarity === "legendary"), "late pools should have common and rare outcomes");
assert.ok(odds.byRarity.legendary > 0 && odds.byRarity.legendary < 1, "legendary should be possible but never guaranteed");
// Exercise the shipped purchase -> start -> resolve -> collect pipeline, not a
// second sampler built from the advertised odds. Expectations include the exact
// launch event, device profile, level and upgrades for each independent world.
let trials = 0;
const rarityReports = [];
for (const biome of BIOMES) {
  const profiles = DEVICES.filter((profile) => profile.compatibleBiomes.includes("all") || profile.compatibleBiomes.includes(biome.id));
  const expected = Object.fromEntries(SPECIES.map((species) => [species.id, { count: 0, variance: 0, observed: 0 }]));
  const rarities = Object.fromEntries(RARITIES.map((rarity) => [rarity.id, { count: 0, variance: 0, observed: 0 }]));
  let samples = 0;
  for (let index = 0; index < 1500; index += 1) {
    const launch = index * 197;
    const world = fresh(`ACTUAL-${biome.id}-${index}`, launch);
    const profile = profiles[index % profiles.length];
    const instrument = device(world, profile.id);
    instrument.level = 1 + index % profile.maxLevel;
    world.unlockedBiomes = BIOMES.map((item) => item.id);
    world.upgrades["rare-culture"] = index % 5;
    world.upgrades.optics = index % 4;
    world.upgrades["mutation-analysis"] = index % 3;
    const distribution = discoveryOdds(world, instrument, biome.id, launch);
    for (const entry of distribution) {
      expected[entry.speciesId].count += profile.chambers * entry.probability;
      expected[entry.speciesId].variance += profile.chambers * entry.probability * (1 - entry.probability);
    }
    for (const rarity of RARITIES) {
      const probability = distribution.byRarity[rarity.id];
      rarities[rarity.id].count += profile.chambers * probability;
      rarities[rarity.id].variance += profile.chambers * probability * (1 - probability);
    }
    assert.equal(startExpedition(world, instrument.id, biome.id, launch).ok, true);
    const end = instrument.expedition.endsAt;
    tickExpeditions(world, end);
    const reward = collectExpedition(world, instrument.id, end);
    assert.equal(reward.ok, true);
    assert.equal(reward.result.samples.length, profile.chambers);
    for (const sample of reward.result.samples) {
      assert.ok(biome.pool.some((entry) => entry.speciesId === sample.speciesId), "a result must belong to its biome pool");
      expected[sample.speciesId].observed += 1;
      rarities[sample.rarity].observed += 1;
      samples += 1;
      if (biome.id === "freshwater") assert.equal(assignSpecies(world, "reactor-1", 0, sample.speciesId, end).ok, true, "every first freshwater result is flask-compatible");
    }
    trials += 1;
  }
  for (const [id, count] of [...Object.entries(expected), ...Object.entries(rarities)]) {
    const tolerance = 6 * Math.sqrt(count.variance) + 2;
    assertNear(count.observed, count.count, tolerance, `${biome.id}/${id}: actual discovery frequency (six sigma + two samples)`);
    if (count.count === 0) assert.equal(count.observed, 0);
  }
  rarityReports.push({ biome: biome.id, samples, rarities });
}
assert.ok(trials >= 10_000);

const productionOne = fresh("PRODUCTION", 0);
const productionTwo = fresh("PRODUCTION", 0);
const one = settleProduction(productionOne, 200_000);
settleProduction(productionTwo, 100_000);
settleProduction(productionTwo, 200_000);
assertNear(one.produced, productionTwo.totalProduction, 1e-9, "production should be invariant to settlement splitting");
assertNear(productionOne.reactors[0].stored, productionTwo.reactors[0].stored, 1e-9, "stored biomass should be invariant to settlement splitting");
const capped = fresh("OFFLINE", 0);
const cappedResult = applyOffline(capped, (MAX_OFFLINE_SECONDS + 30) * 1000);
assert.equal(cappedResult.capped, true);
assert.equal(cappedResult.elapsed, MAX_OFFLINE_SECONDS);
const afterCap = capped.lastSettledAt;
assert.equal(settleProduction(capped, afterCap).elapsed, 0, "offline settlement must not duplicate a capped return");
const fullReturn = fresh("FULL-EIGHT-HOURS", 0);
const splitReturn = fresh("FULL-EIGHT-HOURS", 0);
applyOffline(fullReturn, MAX_OFFLINE_SECONDS * 1000);
for (let hour = 1; hour <= 8; hour += 1) settleProduction(splitReturn, hour * 3600_000);
assertNear(fullReturn.totalProduction, splitReturn.totalProduction, 1e-7, "an eight-hour return must simulate every event segment");
const eventState = fresh("EVENT", 0);
const activeEvent = eventFor(eventState, 0);
assert.ok(activeEvent.active && activeEvent.endsAt > activeEvent.startedAt, "events need a finite active duration");
assert.equal(eventFor(eventState, activeEvent.endsAt + 1).active, false, "expired events should resolve to settled air");
const boundaryA = fresh("EVENT-BOUNDARY", 0);
const boundaryB = fresh("EVENT-BOUNDARY", 0);
const boundary = eventFor(boundaryA, 0).endsAt + 180_000;
const boundaryWhole = settleProduction(boundaryA, boundary);
const boundaryEnd = eventFor(boundaryB, 0).endsAt;
settleProduction(boundaryB, boundaryEnd);
settleProduction(boundaryB, boundary);
assertNear(boundaryWhole.produced, boundaryB.totalProduction, 1e-9, "event boundaries should not change production totals");

const rateState = fresh("RATE", 0);
const qualitySpecies = rateState.discovered[0];
const lowQualityRate = speciesRate(qualitySpecies, rateState.reactors[0], rateState, 0);
rateState.collection[qualitySpecies].bestQuality = 1;
const highQualityRate = speciesRate(qualitySpecies, rateState.reactors[0], rateState, 0);
assert.ok(highQualityRate > lowQualityRate, "collection quality should affect reactor growth");
const growthReactor = { ...rateState.reactors[0], slots: ["arthrospira"] };
assert.ok(speciesRate("desmodesmus", growthReactor, rateState, 0) > 0 && speciesRate("isochrysis", growthReactor, rateState, 0) === 0, "starter freshwater strains fit the flask; advanced specialists remain gated");
const environmentState = fresh("ENVIRONMENTS", 0);
const balancedRate = speciesRate("arthrospira", environmentState.reactors[0], environmentState, 0);
assert.equal(environmentState.reactors[0].environment, "balanced");
assert.equal(setReactorEnvironment(environmentState, "reactor-1", "warm", 0).ok, true);
assert.ok(speciesRate("arthrospira", environmentState.reactors[0], environmentState, 0) < balancedRate, "a mismatched cultivation affinity should have a meaningful cost");
assert.equal(setReactorEnvironment(environmentState, "reactor-1", "not-an-environment", 0).reason, "environment");
settleProduction(environmentState, 1_000);
const beforeLateEnvironment = environmentState.totalProduction;
assert.equal(setReactorEnvironment(environmentState, "reactor-1", "marine", 500).ok, true);
assertNear(environmentState.totalProduction, beforeLateEnvironment, 1e-9, "changing affinity cannot apply its bonus to time already settled");
environmentState.credits = 100_000;
environmentState.upgrades.optics = 3;
environmentState.upgrades.chambers = 1;
const panelPurchase = buyReactor(environmentState, "panel", 0);
assert.equal(panelPurchase.ok, true);
assert.equal(panelPurchase.reactor.environment, "marine", "tier defaults should be sensible cultivation affinities");
assert.equal(setReactorEnvironment(environmentState, panelPurchase.reactor.id, "balanced", 0).ok, true);
assert.ok(speciesRate("arthrospira", panelPurchase.reactor, environmentState, 0) > 0, "freshwater starter strains must remain useful in higher vessels");
const yieldCheck = fresh("YIELD-RANKING", 0);
yieldCheck.discovered.push("night-common", "night-pear");
yieldCheck.collection["night-common"] = { count: 1, variants: 0, bestQuality: 1 };
yieldCheck.collection["night-pear"] = { count: 1, variants: 0, bestQuality: 1 };
const industrial = { ...yieldCheck.reactors[0], tier: "industrial", environment: "rare", slots: ["night-common", "night-pear", null, null] };
assert.ok(speciesRate("night-pear", industrial, yieldCheck, 0) > speciesRate("night-common", industrial, yieldCheck, 0), "legendary growth and rarity yield should beat a same-pool common");

const upgradeState = fresh("UPGRADES", 0);
upgradeState.credits = 50_000_000;
const upgradeDeviceRecord = device(upgradeState, "screening");
const baselineRun = startExpedition(upgradeState, upgradeDeviceRecord.id, "freshwater", 0);
assert.equal(baselineRun.ok, true);
upgradeState.devices[0].status = "idle";
upgradeState.devices[0].expedition = null;
upgradeState.credits = 50_000_000;
assert.equal(buyUpgrade(upgradeState, "flow-control", 0).ok, true);
const fasterRun = startExpedition(upgradeState, upgradeDeviceRecord.id, "freshwater", 0);
assert.ok(fasterRun.duration < baselineRun.duration, "flow control should speed up expeditions");
upgradeState.devices[0].status = "idle";
upgradeState.devices[0].expedition = null;
for (const id of ["chambers", "third-rack", "auto-collection", "lab-automation"]) assert.equal(buyUpgrade(upgradeState, id, 0).ok, true, `${id} should be purchasable`);
assert.equal(upgradeState.racks.length, 2);
assert.ok(upgradeState.racks.every((rack) => rack.slots.length === 3));
const repeatDevice = upgradeState.devices[0];
assert.equal(setDeviceAutoRepeat(upgradeState, repeatDevice.id, true).ok, true);
assert.equal(repeatDevice.autoRepeat, true);
const automated = fresh("AUTOMATION", 0);
automated.credits = 50_000;
const automatedDevice = device(automated);
assert.equal(buyUpgrade(automated, "auto-collection", 0).ok, true);
assert.equal(buyUpgrade(automated, "lab-automation", 0).ok, true);
setDeviceAutoRepeat(automated, automatedDevice.id, true);
startExpedition(automated, automatedDevice.id, "freshwater", 0);
const firstAutomationEnd = automated.devices[0].expedition.endsAt;
tickExpeditions(automated, firstAutomationEnd);
assert.equal(automated.stats.completedExpeditions, 1, "auto-collection should claim a ready expedition");
assert.equal(automated.devices[0].status, "running", "opt-in auto-repeat should start one bounded next expedition");
assert.equal(automated.devices[0].expedition.startedAt, firstAutomationEnd, "auto-repeat must not backfill earlier time");
assert.equal(automated.expeditionCounter, 2);

const allPurchaseState = fresh("PURCHASES", 0);
allPurchaseState.credits = 100_000_000;
allPurchaseState.stats.expeditions = 10; allPurchaseState.stats.discoveries = 10; allPurchaseState.stats.harvests = 10; allPurchaseState.stats.highestRarity = 5; allPurchaseState.stats.variants = 2;
for (const upgrade of UPGRADES) {
  for (let level = 0; level < upgrade.max; level += 1) assert.equal(buyUpgrade(allPurchaseState, upgrade.id, 0).ok, true, `${upgrade.id} level ${level + 1} should be purchasable`);
}
for (const upgrade of UPGRADES) assert.equal(allPurchaseState.upgrades[upgrade.id], upgrade.max);
assert.ok(researchProgress(allPurchaseState).points >= 9);
for (const tier of REACTOR_TIERS.slice(1)) {
  const result = buyReactor(allPurchaseState, tier.id, 0);
  assert.equal(result.ok, true, `${tier.id} should be purchasable after research`);
}
assert.equal(allPurchaseState.reactors.length, REACTOR_TIERS.length);
assert.equal(buyReactor(allPurchaseState, "bench", 0).reason, "unavailable", "duplicate reactor tiers cannot be bought twice");
for (const reactor of allPurchaseState.reactors) assert.equal(upgradeReactor(allPurchaseState, reactor.id, 0).ok, true);

const persistence = fresh("PERSIST", 0);
persistence.credits = 100_000;
const persistenceDevice = device(persistence);
startExpedition(persistence, persistenceDevice.id, "freshwater", 0);
const runningRoundTrip = parseState(serializeState(persistence), 0);
assert.equal(runningRoundTrip.devices[0].status, "running", "running expeditions should persist without resolving early");
tick(persistence, 32_000);
const roundTrip = parseState(serializeState(persistence), 32_000);
assert.deepEqual(roundTrip, persistence, "valid v3 saves should round-trip exactly");
assert.equal(JSON.parse(serializeState(persistence)).format, "orr-cyanoflow-save", "new saves use the Cyanoflow namespace");
assert.throws(() => parseState(JSON.stringify({ ...JSON.parse(serializeState(persistence)), credits: -1 }), 32_000), /Invalid credits/);
assert.throws(() => parseState(JSON.stringify({ ...JSON.parse(serializeState(persistence)), lastSettledAt: 32_000 + 10 * 60_000 }), 32_000), /future/);
assert.throws(() => parseState({ ...JSON.parse(serializeState(persistence)), settings: { ...persistence.settings, muted: "yes" } }, 32_000), /Invalid setting muted/);
assert.throws(() => parseState({ ...JSON.parse(serializeState(persistence)), reactors: [{ ...JSON.parse(serializeState(persistence)).reactors[0], stored: reactorCapacity(persistence.reactors[0], persistence) + 1 }] }, 32_000), /Invalid reactor structure|Invalid reactor storage/);
const duplicate = JSON.parse(serializeState(persistence));
duplicate.devices.push({ ...duplicate.devices[0], id: "device-duplicate", status: "idle", rackId: null, slot: null, expedition: null });
duplicate.devices[1].id = duplicate.devices[0].id;
assert.throws(() => parseState(duplicate, 32_000), /duplicate IDs/);
const duplicateSlot = JSON.parse(serializeState(persistence));
duplicateSlot.racks[0].slots[1] = duplicateSlot.racks[0].slots[0];
assert.throws(() => parseState(duplicateSlot, 32_000), /rack assignment/);
const lockedSlot = JSON.parse(serializeState(persistence));
lockedSlot.discovered.push("isochrysis");
lockedSlot.collection.isochrysis = { count: 1, variants: 0, bestQuality: 0.5 };
lockedSlot.reactors[0].slots[0] = "isochrysis";
assert.throws(() => parseState(lockedSlot, 32_000), /Locked or incompatible/);
const corruptStorage = storage({ [SAVE_KEY]: JSON.stringify({ ...JSON.parse(serializeState(persistence)), credits: -10 }) });
const invalidLoad = safeLoad(corruptStorage, 32_000);
assert.equal(invalidLoad.invalid, true);
assert.equal(corruptStorage.entries[SAVE_KEY], JSON.stringify({ ...JSON.parse(serializeState(persistence)), credits: -10 }));
assert.equal(engine.saveState(corruptStorage, invalidLoad.state, 32_000), false, "invalid loads must not overwrite raw saves");
const invalidLegacyStorage = storage({ "orr-microflux-rack-v2": "{bad" });
const invalidLegacyLoad = safeLoad(invalidLegacyStorage, 32_000);
assert.equal(invalidLegacyLoad.invalid, true);
assert.equal(invalidLegacyLoad.raw, "{bad", "invalid legacy raw data must remain available to the app");
const oldBioRealmStorage = storage({ "orr-biorealm-v1": serializeState(persistence) });
const oldBioRealmLoad = safeLoad(oldBioRealmStorage, 32_000);
assert.equal(oldBioRealmLoad.migrated, true, "the previous BioRealm namespace should migrate into Cyanoflow");
assert.equal(oldBioRealmLoad.state.format, "orr-cyanoflow-save");
const maliciousFunds = fresh("MALICIOUS-FUNDS", 0);
maliciousFunds.credits = Number.NaN;
assert.equal(buyDevice(maliciousFunds, "archive", 0).ok, false, "non-finite funds cannot buy equipment");

const pacing = fresh("PACING", 0);
assert.equal(buyDevice(pacing, "screening", 0).ok, true, "the starter screening device should be affordable at 95 credits");
assert.equal(pacing.credits, 0);
assert.equal(claimGrant(pacing).ok, true);
assert.equal(startExpedition(pacing, pacing.devices[0].id, "freshwater", 0).ok, true);
tick(pacing, 32_000);
assert.equal(collectExpedition(pacing, pacing.devices[0].id, 32_000).ok, true);
assert.ok(pacing.credits >= 120, "the first survey should create early purchasing momentum");
harvestAll(pacing, 6 * 60_000);
harvestAll(pacing, 12 * 60_000);
assert.ok(pacing.credits >= REACTOR_TIERS.find((tier) => tier.id === "bench").cost, "the starter loop should make a bench vessel affordable during a quiet session");

const oldSave = {
  format: "orr-biorealm-save", version: 2, seed: "OLD", credits: 44, discovered: ["arthrospira", "mint-comet"],
  collection: { arthrospira: { count: 2, bestQuality: 0.7 }, "mint-comet": { count: 1 } }, stats: { expeditions: 2 }, upgrades: {},
};
const migrated = parseState(oldSave, 100);
assert.equal(migrated.stats.migrationCredits, 100);
assert.equal(migrated.stats.grants, 1);
assert.equal(claimGrant(migrated).ok, false, "a migrated grant must not be claimable a second time");
assert.ok(migrated.credits >= 144 && migrated.discovered.includes("arthrospira"));
const legacy = migrateLegacySave({ credits: 12, biomass: 4, discovered: ["mint-comet"] }, 100);
assert.equal(legacy.stats.migrationCredits, 100);

const report = rarityReports.map(({ biome, samples, rarities }) => `${biome} ${samples} samples · ${RARITIES.map((rarity) => `${rarity.id}:${rarities[rarity.id].observed}/${rarities[rarity.id].count.toFixed(1)}`).join(" ")}`).join("\n  ");
console.log(`cyanoflow engine: ${trials} actual seeded expeditions across all pools; rarity observations stayed within six-sigma + two-sample tolerance:\n  ${report}\nfull loop, fixed outcomes, cultivation affinities, purchases/upgrades, production/offline caps, persistence, migration, and corruption checks passed`);
