import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../Simulation/js/persistence.js", import.meta.url), "utf8");
const persistence = await import(`data:text/javascript,${encodeURIComponent(source)}`);

const {
  StorageError,
  StorageQuotaError,
  createBackendAdapter,
  createEmptyState,
  createLabPersistence,
  createMemoryStorage,
  safeParseJSON,
  storageKeyFor,
} = persistence;

const fixedClock = (() => {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 9, 10, 12, 0, tick++)).toISOString();
})();

assert.equal(typeof globalThis.localStorage, "undefined", "the test must not need browser globals");
assert.equal(createEmptyState("memory-player").version, 1);
assert.equal(createLabPersistence().storageKind, "memory", "no browser globals should select the memory fallback");
assert.equal(persistence.migrateState({}, { playerId: "memory-player" }).version, 1);
assert.equal(persistence.migrateState({ version: 0 }, { playerId: "memory-player" }).version, 1);
assert.equal(
  persistence.migrateState({ version: 0, projects: [{ id: "legacy-project", version: 0, name: "Legacy synthetic project" }] }, { playerId: "memory-player" }).collections.projects[0].version,
  1,
);

const storage = createMemoryStorage();
const store = createLabPersistence({
  playerId: "memory-player",
  storage,
  clock: fixedClock,
  idFactory: (type) => `${type}_stable_1`,
});

assert.equal(store.storageKind, "memory");
assert.equal(store.loadedFromEmpty, true, "empty storage should migrate to a versioned empty state");
assert.deepEqual(store.state().collections, {
  projects: [],
  experiments: [],
  runs: [],
  notebookEntries: [],
  uiSettings: [],
});

const project = store.createProject({
  name: "Synthetic cyanobacteria trial",
  description: "A computational project used by the local lab route.",
  tags: ["synthetic", "computational"],
});
assert.equal(project.id, "project_stable_1");
assert.equal(project.playerId, "memory-player");
assert.equal(project.ownerId, "memory-player");
assert.equal(project.provenance.synthetic, true);
assert.equal(project.provenance.computational, true);
assert.throws(() => store.createProject({ name: "Measured", provenance: { origin: "measured" } }), (error) => error.code === "VALIDATION_ERROR");
assert.throws(() => store.createProject({ name: "Measured", dataOrigin: "device" }), (error) => error.code === "VALIDATION_ERROR");

const experiment = store.createExperiment({
  projectId: project.id,
  title: "Light-response model",
  hypothesis: "The synthetic culture responds to a stepped computational light curve.",
  parameters: { photons: [80, 120], durationHours: 24 },
});
const run = store.createRun({
  experimentId: experiment.id,
  status: "completed",
  parameters: { seed: "memory-test" },
  timeSeries: [
    { t: 0, timestamp: "2026-10-10T12:00:00.000Z", values: { biomass_g_l: 0.4, ph: 7.1 } },
    { t: 60, timestamp: "2026-10-10T12:01:00.000Z", values: { biomass_g_l: 0.42, ph: 7.11 } },
  ],
});
const note = store.createNotebookEntry({
  projectId: project.id,
  experimentId: experiment.id,
  runId: run.id,
  title: "Model note",
  content: "Only deterministic synthetic values are recorded.",
});
const settings = store.createUISettings({
  scope: "lab",
  settings: { units: "metric", selectedPanel: "notebook" },
});

assert.equal(store.listProjects().length, 1);
assert.equal(store.listExperiments({ where: { projectId: project.id } }).length, 1);
assert.equal(store.listExperiments({ projectId: project.id }).length, 1);
assert.equal(store.listExperiments({ projectId: "another-project" }).length, 0);
assert.equal(store.listRuns((item) => item.status === "completed").length, 1);
assert.equal(store.listNotebookEntries()[0].id, note.id);
assert.equal(store.listUISettings()[0].id, settings.id);

const updated = store.updateProject(project.id, { description: "Updated local computational notes." });
assert.equal(updated.description, "Updated local computational notes.");
assert.equal(updated.id, project.id, "updates must retain stable IDs");
assert.equal(store.updateProject(project.id, { provenance: { method: "deterministic light-response model" } }).provenance.method, "deterministic light-response model");
assert.throws(() => store.updateProject(project.id, { provenance: { origin: "measured" } }), (error) => error.code === "VALIDATION_ERROR");
assert.throws(() => store.updateProject(project.id, { playerId: "other-player" }), (error) => error instanceof persistence.ValidationError);
assert.equal(store.deleteNotebookEntry(note.id), true);
assert.equal(store.deleteNotebookEntry(note.id), false);

const csv = store.exportRunCSV(run.id);
assert.match(csv, /^runId,sampleIndex,elapsedSeconds,timestamp,biomass_g_l,ph\n/);
assert.match(csv, /run_stable_1,1,60,2026-10-10T12:01:00\.000Z,0\.42,7\.11/);
assert.match(persistence.timeSeriesToCSV([{ t: 1, delta: -0.12 }]), /1,,-0\.12/);
assert.match(persistence.timeSeriesToCSV([{ timeHours: 1, biomassG_L: 0.7 }]), /0,3600,,0\.7/);
assert.match(persistence.timeSeriesToCSV([{ t: 0, note: '=SUM(1,2)' }]), /"'=SUM\(1,2\)"/);
assert.throws(() => persistence.timeSeriesToCSV([{ t: 0, values: { value: Infinity } }]), (error) => error.code === "VALIDATION_ERROR");
assert.throws(() => store.createRun({ experimentId: experiment.id, timeSeries: [{ t: 0, provenance: { kind: "device" } }] }), (error) => error.code === "VALIDATION_ERROR");

const reopened = createLabPersistence({ playerId: "memory-player", storage });
assert.deepEqual(reopened.state(), store.state(), "a new store instance must round-trip saved memory storage");
const isolated = createLabPersistence({ playerId: "second-player", storage });
assert.equal(isolated.listProjects().length, 0, "players must have separate keys even with shared storage");

const exported = store.exportJSON({ pretty: true });
const importedStorage = createMemoryStorage();
const imported = createLabPersistence({
  playerId: "memory-player",
  storage: importedStorage,
  clock: fixedClock,
  idFactory: (type) => `${type}_other`,
});
imported.importJSON(exported);
assert.deepEqual(imported.exportState().collections, store.exportState().collections, "JSON export/import must round-trip records");
assert.equal(imported.get("projects", project.id).playerId, "memory-player");
assert.throws(() => imported.importJSON("{broken json"), (error) => error.code === "INVALID_JSON");
assert.throws(() => safeParseJSON("not json", "fixture"), (error) => error.code === "INVALID_JSON");
assert.throws(() => safeParseJSON('{"__proto__":{"polluted":true}}'), (error) => error.code === "INVALID_JSON");
assert.equal({}.polluted, undefined);
const beforeInvalidImport = imported.exportJSON();
assert.throws(() => imported.importJSON(JSON.stringify({ ...store.exportState(), version: 100, schemaVersion: 100 })), (error) => error.code === "UNSUPPORTED_VERSION");
assert.equal(imported.exportJSON(), beforeInvalidImport, "invalid imports must leave existing data intact");

const corruptStorage = createMemoryStorage({
  initial: { [storageKeyFor("corrupt-player")]: "{this is not JSON" },
});
assert.throws(
  () => createLabPersistence({ playerId: "corrupt-player", storage: corruptStorage }),
  (error) => error instanceof StorageError && error.code === "CORRUPT_STORAGE",
);

const foreign = createLabPersistence({ playerId: "other-player", storage: createMemoryStorage() });
assert.throws(() => foreign.importJSON(exported), (error) => error.code === "VALIDATION_ERROR");

const tinyStorage = createMemoryStorage({ quotaBytes: 300 });
const quotaStore = createLabPersistence({ playerId: "quota-player", storage: tinyStorage });
assert.throws(
  () => quotaStore.createProject({ name: "x".repeat(2000) }),
  (error) => error instanceof StorageQuotaError && error.code === "QUOTA_EXCEEDED",
);
assert.equal(quotaStore.listProjects().length, 0, "a quota failure must roll back the mutation");

const originalPersisted = storage.getItem(store.storageKey);
const fullStorage = createMemoryStorage({
  quotaBytes: Buffer.byteLength(store.storageKey) + Buffer.byteLength(originalPersisted),
  initial: { [store.storageKey]: originalPersisted },
});
const fullStore = createLabPersistence({ playerId: "memory-player", storage: fullStorage });
assert.throws(() => fullStore.updateProject(project.id, { description: "x".repeat(10000) }), (error) => error.code === "QUOTA_EXCEEDED");
assert.equal(fullStorage.getItem(store.storageKey), originalPersisted, "quota failures must retain the last saved data");
assert.equal(fullStore.getProject(project.id).description, updated.description);

const brokenWriteStorage = {
  getItem() { return null; },
  setItem() { throw new Error("storage unavailable"); },
  removeItem() {},
};
const brokenWriteStore = createLabPersistence({ storage: brokenWriteStorage });
assert.throws(() => brokenWriteStore.createProject({ name: "Local project" }), (error) => error.code === "STORAGE_WRITE_FAILED");
assert.equal(brokenWriteStore.listProjects().length, 0);

let backendCalls = 0;
const localOnlyBackend = createBackendAdapter({
  fetchImpl: async () => {
    backendCalls += 1;
    throw new Error("should not be called");
  },
});
assert.equal(localOnlyBackend.configured, false);
assert.equal(localOnlyBackend.status().label, "local browser only");
assert.equal(backendCalls, 0, "an unconfigured adapter must not make requests");
await assert.rejects(() => localOnlyBackend.load("memory-player"), (error) => error.code === "BACKEND_NOT_CONFIGURED");
assert.equal(backendCalls, 0);
const sameOriginBackend = createBackendAdapter({ baseUrl: "/", fetchImpl: async () => ({ ok: false, status: 404 }) });
assert.equal(sameOriginBackend.configured, true, "same-origin backend use must be explicit");
assert.equal(await sameOriginBackend.load("memory-player"), null);

const backendState = store.exportState();
const requests = [];
const configuredBackend = createBackendAdapter({
  baseUrl: "http://127.0.0.1:8787",
  fetchImpl: async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true, playerId: "memory-player", state: backendState };
      },
    };
  },
});
assert.equal(requests.length, 0, "configured backend construction must also be side-effect free");
const backendStore = createLabPersistence({
  playerId: "memory-player",
  storage: createMemoryStorage(),
  backend: configuredBackend,
});
await backendStore.saveToBackend();
assert.equal(requests.length, 1);
assert.equal(requests[0].url, `http://127.0.0.1:8787/api/state/${encodeURIComponent("memory-player")}`);
assert.equal(requests[0].options.method, "PUT");
await backendStore.loadFromBackend();
assert.equal(requests.length, 2);
assert.equal(requests[1].options.method, "GET");
assert.deepEqual(backendStore.listProjects(), store.listProjects());

await assert.rejects(
  () => configuredBackend.save("memory-player", { payload: "x".repeat(65536) }),
  (error) => error.code === "BACKEND_PAYLOAD_TOO_LARGE",
);
assert.equal(requests.length, 2, "oversized Node API bodies must fail before making a request");

const invalidBackend = createBackendAdapter({
  baseUrl: "http://127.0.0.1:8787",
  fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("broken JSON"); } }),
});
await assert.rejects(() => invalidBackend.load("memory-player"), (error) => error.code === "BACKEND_INVALID_RESPONSE");

const missingBackend = createBackendAdapter({
  baseUrl: "http://127.0.0.1:8787",
  fetchImpl: async () => ({ ok: false, status: 404 }),
});
assert.equal(await missingBackend.load("memory-player"), null);

console.log("simulation persistence: memory fallback, versioned CRUD, namespaces, JSON/CSV round-trips, corruption rejection, quota rollback, and opt-in backend adapter passed");
