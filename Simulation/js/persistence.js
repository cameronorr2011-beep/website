/*
 * Local-first persistence for the Algal Digital Lab.
 *
 * This module deliberately has no DOM or Node dependencies.  In a browser it
 * uses localStorage when that storage is usable.  Consumers and tests can
 * supply a localStorage-shaped object, or the module will use an isolated
 * in-memory store when browser storage is unavailable.
 *
 * Records are laboratory notes about synthetic, computational experiments.
 * They are not a hardware telemetry store and the optional backend bridge is
 * never contacted unless a base URL is explicitly supplied.
 *
 * Usage (serve this ES module over HTTP):
 *   const db = createLabPersistence({ playerId: "digital-lab-local" });
 *   const project = db.createProject({ name: "Light sweep" });
 *   const experiment = db.createExperiment({ title: "Sweep", projectId: project.id });
 *   const run = db.createRun({ experimentId: experiment.id, timeSeries: computedPoints });
 *   const csv = db.exportRunCSV(run.id); // only points actually stored in the run
 *   const json = db.exportJSON();
 *   db.importJSON(json); // atomic replace; { mode: "merge" } upserts by stable id
 *
 * Deleting a record does not cascade to its linked records. Use route-specific
 * player IDs for the development backend: its PUT replaces that player's whole
 * state, has a 64 KiB limit, and provides no authentication. Namespace ownership
 * is local data separation, not an authenticated account. No sync is automatic.
 */

export const STORAGE_FORMAT = "orr-algal-digital-lab";
export const STORAGE_NAMESPACE = "orr-algal-digital-lab";
export const STORAGE_VERSION = 1;
export const DEFAULT_PLAYER_ID = "local-player";
export const SYNTHETIC_DATA_ORIGIN = "synthetic-computational";
export const BACKEND_MAX_BODY_BYTES = 64 * 1024;

const SCHEMA_ROOT = "orr.algal-digital-lab";

const TYPE_DEFINITIONS = Object.freeze({
  projects: Object.freeze({
    collection: "projects",
    singular: "project",
    idPrefix: "project",
    schema: `${SCHEMA_ROOT}/project`,
    version: 1,
  }),
  experiments: Object.freeze({
    collection: "experiments",
    singular: "experiment",
    idPrefix: "experiment",
    schema: `${SCHEMA_ROOT}/experiment`,
    version: 1,
  }),
  runs: Object.freeze({
    collection: "runs",
    singular: "run",
    idPrefix: "run",
    schema: `${SCHEMA_ROOT}/run`,
    version: 1,
  }),
  notebookEntries: Object.freeze({
    collection: "notebookEntries",
    singular: "notebook-entry",
    idPrefix: "notebook_entry",
    schema: `${SCHEMA_ROOT}/notebook-entry`,
    version: 1,
  }),
  uiSettings: Object.freeze({
    collection: "uiSettings",
    singular: "ui-settings",
    idPrefix: "ui_settings",
    schema: `${SCHEMA_ROOT}/ui-settings`,
    version: 1,
  }),
});

const TYPE_ALIASES = Object.freeze({
  project: "projects",
  projects: "projects",
  experiment: "experiments",
  experiments: "experiments",
  run: "runs",
  runs: "runs",
  notebook: "notebookEntries",
  notebookEntry: "notebookEntries",
  notebookEntries: "notebookEntries",
  notebook_entry: "notebookEntries",
  notebook_entries: "notebookEntries",
  "notebook-entry": "notebookEntries",
  uiSetting: "uiSettings",
  uiSettings: "uiSettings",
  ui_setting: "uiSettings",
  ui_settings: "uiSettings",
  "ui-settings": "uiSettings",
  settings: "uiSettings",
});

export const ENTITY_TYPES = Object.freeze(Object.keys(TYPE_DEFINITIONS));

/* Public schema metadata is intentionally data-only so a route can use it to
   render a schema/version label without depending on implementation details. */
export const SCHEMAS = Object.freeze({
  projects: Object.freeze({
    collection: "projects",
    schema: TYPE_DEFINITIONS.projects.schema,
    version: 1,
    required: Object.freeze(["id", "playerId", "name", "provenance"]),
  }),
  experiments: Object.freeze({
    collection: "experiments",
    schema: TYPE_DEFINITIONS.experiments.schema,
    version: 1,
    required: Object.freeze(["id", "playerId", "title", "provenance"]),
  }),
  runs: Object.freeze({
    collection: "runs",
    schema: TYPE_DEFINITIONS.runs.schema,
    version: 1,
    required: Object.freeze(["id", "playerId", "experimentId", "timeSeries", "provenance"]),
  }),
  notebookEntries: Object.freeze({
    collection: "notebookEntries",
    schema: TYPE_DEFINITIONS.notebookEntries.schema,
    version: 1,
    required: Object.freeze(["id", "playerId", "title", "content", "provenance"]),
  }),
  uiSettings: Object.freeze({
    collection: "uiSettings",
    schema: TYPE_DEFINITIONS.uiSettings.schema,
    version: 1,
    required: Object.freeze(["id", "playerId", "scope", "settings", "provenance"]),
  }),
});

const RESERVED_RECORD_FIELDS = new Set([
  "schema",
  "version",
  "schemaVersion",
  "entityType",
  "id",
  "playerId",
  "ownerId",
  "createdAt",
  "updatedAt",
  "provenance",
  "dataOrigin",
]);

const IMMUTABLE_UPDATE_FIELDS = new Set([
  "schema",
  "version",
  "schemaVersion",
  "entityType",
  "id",
  "playerId",
  "ownerId",
  "createdAt",
  "updatedAt",
  "dataOrigin",
]);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const PLAYER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~-]{0,127}$/;
const RECORD_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~-]{0,191}$/;
const STATUS_VALUES = new Set(["draft", "planned", "running", "completed", "archived", "failed"]);
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
let fallbackIdCounter = 0;

export class PersistenceError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "PersistenceError";
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

export class StorageQuotaError extends PersistenceError {
  constructor(message, cause) {
    super("QUOTA_EXCEEDED", message, cause);
    this.name = "StorageQuotaError";
  }
}

export class StorageError extends PersistenceError {
  constructor(code, message, cause) {
    super(code, message, cause);
    this.name = "StorageError";
  }
}

export class ValidationError extends PersistenceError {
  constructor(message, cause) {
    super("VALIDATION_ERROR", message, cause);
    this.name = "ValidationError";
  }
}

function fail(message, cause) {
  throw new ValidationError(message, cause);
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertPlainObject(value, label) {
  if (!isPlainObject(value)) fail(`${label} must be a JSON object.`);
  return value;
}

function assertJsonValue(value, path = "$", seen = new Set(), depth = 0) {
  if (depth > 64) fail(`${path} exceeds the supported JSON nesting depth.`);
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${path} must not contain a non-finite number.`);
    return;
  }
  if (typeof value !== "object") fail(`${path} must contain JSON-compatible values.`);
  if (seen.has(value)) fail(`${path} must not contain cyclic data.`);
  seen.add(value);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      assertJsonValue(value[index], `${path}[${index}]`, seen, depth + 1);
    }
  } else {
    assertPlainObject(value, path);
    for (const [key, item] of Object.entries(value)) {
      if (UNSAFE_KEYS.has(key)) fail(`${path} contains an unsafe JSON key.`);
      if (item === undefined) fail(`${path}.${key} must not be undefined.`);
      assertJsonValue(item, `${path}.${key}`, seen, depth + 1);
    }
  }
  seen.delete(value);
}

function cloneJson(value, label = "value") {
  assertJsonValue(value, label);
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    throw new ValidationError(`${label} could not be serialized as JSON.`, error);
  }
}

export function safeParseJSON(raw, label = "JSON") {
  if (typeof raw !== "string") {
    throw new PersistenceError("INVALID_JSON", `${label} must be a JSON string.`);
  }
  try {
    const value = JSON.parse(raw);
    assertJsonValue(value, label);
    return value;
  } catch (error) {
    throw new PersistenceError("INVALID_JSON", `${label} is not valid JSON.`, error);
  }
}

export const parseJSON = safeParseJSON;

function normalizePlayerId(value = DEFAULT_PLAYER_ID) {
  const playerId = String(value).trim();
  if (!PLAYER_ID_PATTERN.test(playerId)) {
    throw new ValidationError("playerId must be 1-128 URL-safe letters, numbers, or . _ ~ - characters.");
  }
  return playerId;
}

export { normalizePlayerId };

export function storageKeyFor(playerId = DEFAULT_PLAYER_ID) {
  return `${STORAGE_NAMESPACE}:v${STORAGE_VERSION}:${encodeURIComponent(normalizePlayerId(playerId))}`;
}

function normalizeEntityType(type) {
  const canonical = Object.prototype.hasOwnProperty.call(TYPE_ALIASES, type) ? TYPE_ALIASES[type] : null;
  if (!canonical) throw new ValidationError(`Unknown persistence entity type: ${String(type)}.`);
  return canonical;
}

function byteLength(value) {
  const text = String(value);
  try {
    if (typeof TextEncoder === "function") return new TextEncoder().encode(text).byteLength;
  } catch {
    // Fall through to the browser-compatible approximation below.
  }
  return encodeURIComponent(text).replace(/%[0-9A-F]{2}|./g, "x").length;
}

function quotaException(message = "The in-memory storage quota was exceeded.") {
  const error = new Error(message);
  error.name = "QuotaExceededError";
  error.code = 22;
  return error;
}

/* A small localStorage-shaped store is useful in tests and in embeddings that
   intentionally do not expose browser globals.  quotaBytes applies to the
   UTF-8 size of all stored keys and values. */
export function createMemoryStorage(options = {}) {
  const quotaBytes = options.quotaBytes === undefined ? Infinity : options.quotaBytes;
  if (!(quotaBytes === Infinity || (Number.isInteger(quotaBytes) && quotaBytes >= 0))) {
    throw new TypeError("quotaBytes must be a non-negative integer or Infinity.");
  }

  const values = new Map();
  const initial = options.initial;
  if (initial !== undefined) {
    if (!isPlainObject(initial)) throw new TypeError("initial storage values must be an object.");
    for (const [key, value] of Object.entries(initial)) values.set(String(key), String(value));
  }

  function totalBytes() {
    let total = 0;
    for (const [key, value] of values) total += byteLength(key) + byteLength(value);
    return total;
  }

  if (totalBytes() > quotaBytes) throw quotaException();

  return {
    __orrStorageKind: "memory",
    get length() {
      return values.size;
    },
    key(index) {
      if (!Number.isInteger(index) || index < 0 || index >= values.size) return null;
      return Array.from(values.keys())[index] ?? null;
    },
    getItem(key) {
      const normalized = String(key);
      return values.has(normalized) ? values.get(normalized) : null;
    },
    setItem(key, value) {
      const normalizedKey = String(key);
      const normalizedValue = String(value);
      const oldValue = values.get(normalizedKey);
      const oldBytes = oldValue === undefined ? 0 : byteLength(normalizedKey) + byteLength(oldValue);
      const nextBytes = totalBytes() - oldBytes + byteLength(normalizedKey) + byteLength(normalizedValue);
      if (nextBytes > quotaBytes) throw quotaException();
      values.set(normalizedKey, normalizedValue);
    },
    removeItem(key) {
      values.delete(String(key));
    },
    clear() {
      values.clear();
    },
    get quotaBytes() {
      return quotaBytes;
    },
  };
}

function isStorageLike(value) {
  return value !== null && typeof value === "object"
    && typeof value.getItem === "function"
    && typeof value.setItem === "function"
    && typeof value.removeItem === "function";
}

function resolveDefaultStorage() {
  try {
    const candidate = globalThis.localStorage;
    if (isStorageLike(candidate)) {
      // Probe only reading: a full but readable store must keep its saved
      // records available and report a quota error on a later attempted write.
      candidate.getItem(`${STORAGE_NAMESPACE}:availability`);
      return { storage: candidate, kind: "localStorage" };
    }
  } catch {
    // Missing or inaccessible storage uses an isolated in-memory store.
  }
  return { storage: createMemoryStorage(), kind: "memory" };
}

function isQuotaError(error) {
  return error?.name === "QuotaExceededError"
    || error?.code === 22
    || error?.code === 1014
    || /quota|storage\s+full/i.test(String(error?.message || ""));
}

function readStorageValue(storage, key) {
  try {
    return storage.getItem(key);
  } catch (error) {
    throw new StorageError("STORAGE_READ_FAILED", "The local persistence store could not be read.", error);
  }
}

function writeStorageValue(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch (error) {
    if (isQuotaError(error)) {
      throw new StorageQuotaError("The local persistence store quota is full; no changes were saved.", error);
    }
    throw new StorageError("STORAGE_WRITE_FAILED", "The local persistence store could not be written.", error);
  }
}

function isoFromClock(clock) {
  const value = typeof clock === "function" ? clock() : new Date();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new ValidationError("The persistence clock must return a valid date.");
  return date.toISOString();
}

function normalizeTimestamp(value, label, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)
    || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new ValidationError(`${label} must be an ISO-8601 UTC timestamp.`);
  }
  return value;
}

function normalizeString(value, label, options = {}) {
  const { required = false, fallback = "" } = options;
  if (value === undefined || value === null) {
    if (required && !fallback) throw new ValidationError(`${label} is required.`);
    return fallback;
  }
  if (typeof value !== "string") throw new ValidationError(`${label} must be a string.`);
  const normalized = value.trim();
  if (required && normalized.length === 0) throw new ValidationError(`${label} must not be empty.`);
  return normalized;
}

function normalizeOptionalString(value, label) {
  if (value === undefined || value === null) return "";
  return normalizeString(value, label);
}

function normalizeStringArray(value, label) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new ValidationError(`${label} must be an array of strings.`);
  return value.map((item, index) => normalizeString(item, `${label}[${index}]`, { required: true }));
}

function normalizeObject(value, label, fallback = {}) {
  if (value === undefined || value === null) return cloneJson(fallback, label);
  assertPlainObject(value, label);
  return cloneJson(value, label);
}

function normalizeStatus(value, label, fallback) {
  const status = normalizeString(value, label, { fallback });
  if (!STATUS_VALUES.has(status)) {
    throw new ValidationError(`${label} must be one of: ${Array.from(STATUS_VALUES).join(", ")}.`);
  }
  return status;
}

function normalizeId(value, definition) {
  let id = value;
  if (id === undefined || id === null || String(id).trim() === "") {
    throw new ValidationError(`${definition.singular} id is required.`);
  }
  id = String(id).trim();
  if (!RECORD_ID_PATTERN.test(id)) throw new ValidationError("Record id contains unsupported characters.");
  return id;
}

function normalizeReferenceId(value, label) {
  if (value === undefined || value === null || value === "") return null;
  const id = String(value).trim();
  if (!RECORD_ID_PATTERN.test(id)) throw new ValidationError(`${label} must be a stable record id.`);
  return id;
}

function normalizeProvenance(value) {
  const source = value === undefined || value === null ? {} : value;
  assertPlainObject(source, "provenance");
  if (source.kind !== undefined && source.kind !== "synthetic-computational") {
    throw new ValidationError("provenance.kind must be synthetic-computational.");
  }
  if (source.origin !== undefined && source.origin !== "synthetic") {
    throw new ValidationError("provenance.origin must be synthetic; measured records must remain separate.");
  }
  if (source.synthetic !== undefined && source.synthetic !== true) {
    throw new ValidationError("provenance.synthetic must be true for Algal Digital Lab records.");
  }
  if (source.computational !== undefined && source.computational !== true) {
    throw new ValidationError("provenance.computational must be true for Algal Digital Lab records.");
  }
  const normalized = {
    ...cloneJson(source, "provenance"),
    kind: "synthetic-computational",
    origin: "synthetic",
    source: normalizeString(source.source, "provenance.source", { fallback: "algal-digital-lab" }),
    method: normalizeString(source.method, "provenance.method", { fallback: "local computational model" }),
    synthetic: true,
    computational: true,
  };
  if (source.sourceRefs !== undefined) normalized.sourceRefs = normalizeStringArray(source.sourceRefs, "provenance.sourceRefs");
  if (source.derivedFrom !== undefined) normalized.derivedFrom = normalizeStringArray(source.derivedFrom, "provenance.derivedFrom");
  return normalized;
}

function normalizeDataOrigin(value) {
  const origin = value === undefined || value === null ? SYNTHETIC_DATA_ORIGIN : String(value).trim();
  if (origin !== SYNTHETIC_DATA_ORIGIN) {
    throw new ValidationError("dataOrigin must be synthetic-computational.");
  }
  return origin;
}

function copyPayload(source) {
  assertJsonValue(source, "record");
  const payload = {};
  for (const [key, value] of Object.entries(source)) {
    if (!RESERVED_RECORD_FIELDS.has(key)) payload[key] = cloneJson(value, `record.${key}`);
  }
  return payload;
}

function normalizeTimeSeries(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new ValidationError("timeSeries must be an array of data points.");
  return value.map((point, index) => {
    assertPlainObject(point, `timeSeries[${index}]`);
    const copy = cloneJson(point, `timeSeries[${index}]`);
    const elapsed = copy.elapsedSeconds ?? copy.t ?? copy.time;
    if (elapsed !== undefined && (typeof elapsed !== "number" || !Number.isFinite(elapsed))) {
      throw new ValidationError(`timeSeries[${index}] elapsed time must be a finite number.`);
    }
    if (copy.timeHours !== undefined && (typeof copy.timeHours !== "number" || !Number.isFinite(copy.timeHours))) {
      throw new ValidationError(`timeSeries[${index}] timeHours must be a finite number.`);
    }
    if (copy.timestamp !== undefined) copy.timestamp = normalizeTimestamp(copy.timestamp, `timeSeries[${index}].timestamp`, null);
    if (copy.provenance !== undefined) copy.provenance = normalizeProvenance(copy.provenance);
    if (copy.dataOrigin !== undefined) copy.dataOrigin = normalizeDataOrigin(copy.dataOrigin);
    return copy;
  });
}

function normalizeEntityRecord(type, input, options) {
  const definition = TYPE_DEFINITIONS[type];
  const source = assertPlainObject(input, `${definition.singular} record`);
  const playerId = options.playerId;
  const now = options.now;

  if (source.playerId !== undefined && normalizePlayerId(source.playerId) !== playerId) {
    throw new ValidationError(`${definition.singular} playerId does not belong to this player namespace.`);
  }
  if (source.ownerId !== undefined && normalizePlayerId(source.ownerId) !== playerId) {
    throw new ValidationError(`${definition.singular} ownerId does not belong to this player namespace.`);
  }
  if (source.schema !== undefined && source.schema !== definition.schema) {
    throw new ValidationError(`${definition.singular} schema is not supported.`);
  }
  if (source.entityType !== undefined && source.entityType !== definition.singular) {
    throw new ValidationError(`${definition.singular} entityType is not supported.`);
  }
  if (source.version !== undefined && source.version !== definition.version) {
    throw new ValidationError(`${definition.singular} version is not supported.`);
  }
  if (source.schemaVersion !== undefined && source.schemaVersion !== definition.version) {
    throw new ValidationError(`${definition.singular} schemaVersion is not supported.`);
  }

  const requestedId = options.requestedId ?? source.id ?? options.existing?.id;
  const id = normalizeId(requestedId, definition);
  const createdAt = options.preserveTimestamps
    ? normalizeTimestamp(source.createdAt, `${definition.singular}.createdAt`, now)
    : options.existing?.createdAt ?? now;
  const updatedAt = options.preserveTimestamps
    ? normalizeTimestamp(source.updatedAt, `${definition.singular}.updatedAt`, createdAt)
    : now;
  const payload = copyPayload(source);
  const common = {
    schema: definition.schema,
    version: definition.version,
    schemaVersion: definition.version,
    entityType: definition.singular,
    id,
    playerId,
    ownerId: playerId,
    createdAt,
    updatedAt,
    dataOrigin: normalizeDataOrigin(source.dataOrigin),
    provenance: normalizeProvenance(source.provenance),
  };

  if (type === "projects") {
    const name = normalizeString(source.name ?? source.title, "project.name", { required: true });
    return {
      ...payload,
      ...common,
      name,
      description: normalizeOptionalString(source.description, "project.description"),
      organism: normalizeOptionalString(source.organism, "project.organism"),
      model: normalizeOptionalString(source.model, "project.model"),
      tags: normalizeStringArray(source.tags, "project.tags"),
    };
  }

  if (type === "experiments") {
    const title = normalizeString(source.title ?? source.name, "experiment.title", { required: true });
    return {
      ...payload,
      ...common,
      title,
      projectId: normalizeReferenceId(source.projectId, "experiment.projectId"),
      hypothesis: normalizeOptionalString(source.hypothesis, "experiment.hypothesis"),
      protocol: normalizeOptionalString(source.protocol, "experiment.protocol"),
      parameters: normalizeObject(source.parameters, "experiment.parameters"),
      status: normalizeStatus(source.status, "experiment.status", "draft"),
      tags: normalizeStringArray(source.tags, "experiment.tags"),
    };
  }

  if (type === "runs") {
    const runLabel = normalizeOptionalString(source.label ?? source.title, "run.label");
    return {
      ...payload,
      ...common,
      label: runLabel,
      experimentId: normalizeReferenceId(source.experimentId, "run.experimentId"),
      status: normalizeStatus(source.status, "run.status", "planned"),
      parameters: normalizeObject(source.parameters, "run.parameters"),
      summary: normalizeObject(source.summary, "run.summary"),
      metrics: normalizeObject(source.metrics, "run.metrics"),
      timeSeries: normalizeTimeSeries(source.timeSeries),
      startedAt: normalizeTimestamp(source.startedAt, "run.startedAt", null),
      endedAt: normalizeTimestamp(source.endedAt, "run.endedAt", null),
    };
  }

  if (type === "notebookEntries") {
    const title = normalizeString(source.title ?? source.name, "notebookEntry.title", { fallback: "Untitled entry" });
    return {
      ...payload,
      ...common,
      title,
      content: normalizeOptionalString(source.content ?? source.body ?? source.markdown, "notebookEntry.content"),
      projectId: normalizeReferenceId(source.projectId, "notebookEntry.projectId"),
      experimentId: normalizeReferenceId(source.experimentId, "notebookEntry.experimentId"),
      runId: normalizeReferenceId(source.runId, "notebookEntry.runId"),
      tags: normalizeStringArray(source.tags, "notebookEntry.tags"),
    };
  }

  const scope = normalizeString(source.scope, "uiSettings.scope", { fallback: "lab", required: true });
  return {
    ...payload,
    ...common,
    scope,
    settings: normalizeObject(source.settings, "uiSettings.settings"),
  };
}

function emptyCollections() {
  return {
    projects: [],
    experiments: [],
    runs: [],
    notebookEntries: [],
    uiSettings: [],
  };
}

export function createEmptyState(playerId = DEFAULT_PLAYER_ID, now = new Date().toISOString()) {
  const normalizedPlayerId = normalizePlayerId(playerId);
  const timestamp = normalizeTimestamp(now, "state.updatedAt", new Date().toISOString());
  return {
    format: STORAGE_FORMAT,
    schema: STORAGE_FORMAT,
    version: STORAGE_VERSION,
    schemaVersion: STORAGE_VERSION,
    playerId: normalizedPlayerId,
    ownerId: normalizedPlayerId,
    revision: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    collections: emptyCollections(),
  };
}

function assertEnvelopeIdentity(input, playerId) {
  if (input.format !== undefined && input.format !== STORAGE_FORMAT) {
    throw new PersistenceError("UNSUPPORTED_FORMAT", "The persistence export format is not supported.");
  }
  if (input.schema !== undefined && input.schema !== STORAGE_FORMAT) {
    throw new PersistenceError("UNSUPPORTED_FORMAT", "The persistence state schema is not supported.");
  }
  const version = input.version ?? input.schemaVersion;
  if (input.version !== undefined && input.schemaVersion !== undefined && input.version !== input.schemaVersion) {
    throw new PersistenceError("UNSUPPORTED_VERSION", "The persistence version fields do not agree.");
  }
  if (version !== STORAGE_VERSION) {
    if (Number.isInteger(version) && version > STORAGE_VERSION) {
      throw new PersistenceError("UNSUPPORTED_VERSION", `The persistence state version ${version} is newer than version ${STORAGE_VERSION}.`);
    }
    throw new PersistenceError("UNSUPPORTED_VERSION", "The persistence state version is not supported.");
  }
  if (input.playerId === undefined || normalizePlayerId(input.playerId) !== playerId
    || (input.ownerId !== undefined && normalizePlayerId(input.ownerId) !== playerId)) {
    throw new ValidationError("Imported state belongs to a different player namespace.");
  }
}

function normalizeEnvelopeV1(input, playerId, options = {}) {
  assertPlainObject(input, "state");
  assertJsonValue(input, "state");
  assertEnvelopeIdentity(input, playerId);
  const now = options.now ?? new Date().toISOString();
  const collectionsInput = input.collections;
  assertPlainObject(collectionsInput, "state.collections");
  const state = createEmptyState(playerId, normalizeTimestamp(input.createdAt, "state.createdAt", now));
  state.updatedAt = normalizeTimestamp(input.updatedAt, "state.updatedAt", state.createdAt);
  state.revision = Number.isInteger(input.revision) && input.revision >= 0 ? input.revision : 0;

  for (const type of ENTITY_TYPES) {
    const values = collectionsInput[type];
    if (values === undefined) {
      state.collections[type] = [];
      continue;
    }
    if (!Array.isArray(values)) throw new PersistenceError("INVALID_STATE", `state.collections.${type} must be an array.`);
    const seen = new Set();
    state.collections[type] = values.map((record) => {
      const normalized = normalizeEntityRecord(type, record, {
        playerId,
        now,
        preserveTimestamps: true,
      });
      if (seen.has(normalized.id)) throw new PersistenceError("INVALID_STATE", `Duplicate ${type} id ${normalized.id}.`);
      seen.add(normalized.id);
      return normalized;
    });
  }
  return state;
}

function legacyCollections(input) {
  const source = isPlainObject(input.collections) ? input.collections : input;
  return Object.fromEntries(ENTITY_TYPES.map((type) => [type, source[type]]));
}

/* Version zero was never persisted by this route, but accepting an unversioned
   collection object makes a hand-created/empty fixture safe to upgrade. */
export function migrateState(input, options = {}) {
  const normalizedOptions = typeof options === "string" ? { playerId: options } : options;
  const playerId = normalizePlayerId(normalizedOptions.playerId ?? DEFAULT_PLAYER_ID);
  const now = normalizedOptions.now ?? isoFromClock(normalizedOptions.clock);
  if (input === undefined || input === null) return createEmptyState(playerId, now);
  assertPlainObject(input, "state");
  assertJsonValue(input, "state");

  if (Object.keys(input).length === 0) return createEmptyState(playerId, now);
  if (input.format !== undefined && input.format !== STORAGE_FORMAT) {
    throw new PersistenceError("UNSUPPORTED_FORMAT", "The persistence export format is not supported.");
  }
  if (input.schema !== undefined && input.schema !== STORAGE_FORMAT) {
    throw new PersistenceError("UNSUPPORTED_FORMAT", "The persistence state schema is not supported.");
  }
  if ((input.playerId !== undefined && normalizePlayerId(input.playerId) !== playerId)
    || (input.ownerId !== undefined && normalizePlayerId(input.ownerId) !== playerId)) {
    throw new ValidationError("Imported state belongs to a different player namespace.");
  }

  const version = input.version ?? input.schemaVersion;
  if (version === STORAGE_VERSION) {
    return normalizeEnvelopeV1(input, playerId, { now });
  }
  if (version !== undefined && version !== 0) {
    if (Number.isInteger(version) && version > STORAGE_VERSION) {
      throw new PersistenceError("UNSUPPORTED_VERSION", `The persistence state version ${version} is newer than version ${STORAGE_VERSION}.`);
    }
    throw new PersistenceError("UNSUPPORTED_VERSION", "The persistence state version is not supported.");
  }

  const collections = legacyCollections(input);
  const hasLegacyCollection = ENTITY_TYPES.some((type) => collections[type] !== undefined);
  const emptyVersionZero = version === 0 && Object.keys(input).every((key) => ["version", "schemaVersion", "playerId", "ownerId", "format", "schema"].includes(key));
  if (!hasLegacyCollection && !emptyVersionZero) throw new PersistenceError("INVALID_STATE", "The persistence state has no recognized collections.");

  const migrated = createEmptyState(playerId, now);
  for (const type of ENTITY_TYPES) {
    const records = collections[type];
    if (records === undefined) continue;
    if (!Array.isArray(records)) throw new PersistenceError("INVALID_STATE", `Legacy ${type} must be an array.`);
    const seen = new Set();
    migrated.collections[type] = records.map((record, index) => {
      assertPlainObject(record, `legacy ${type}[${index}]`);
      const legacyRecord = { ...record };
      // Version-zero records did not have the current per-entity schema
      // markers. Remove those markers before normalizing into schema v1.
      delete legacyRecord.schema;
      delete legacyRecord.version;
      delete legacyRecord.schemaVersion;
      delete legacyRecord.entityType;
      if (type === "projects" && legacyRecord.name === undefined) legacyRecord.name = legacyRecord.title ?? `Imported project ${index + 1}`;
      if (type === "experiments" && legacyRecord.title === undefined) legacyRecord.title = legacyRecord.name ?? `Imported experiment ${index + 1}`;
      if (legacyRecord.id === undefined) legacyRecord.id = `${TYPE_DEFINITIONS[type].idPrefix}_imported_${index + 1}`;
      const normalized = normalizeEntityRecord(type, legacyRecord, {
        playerId,
        now,
        preserveTimestamps: true,
      });
      if (seen.has(normalized.id)) throw new PersistenceError("INVALID_STATE", `Duplicate ${type} id ${normalized.id}.`);
      seen.add(normalized.id);
      return normalized;
    });
  }
  return migrated;
}

function normalizeIdFactory(factory) {
  if (factory !== undefined && typeof factory !== "function") throw new TypeError("idFactory must be a function.");
  return factory ?? ((type) => {
    const cryptoObject = globalThis.crypto;
    if (cryptoObject && typeof cryptoObject.randomUUID === "function") return `${type}_${cryptoObject.randomUUID()}`;
    if (cryptoObject && typeof cryptoObject.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      cryptoObject.getRandomValues(bytes);
      return `${type}_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    }
    fallbackIdCounter += 1;
    return `${type}_${Date.now().toString(36)}_${fallbackIdCounter.toString(36)}`;
  });
}

function slugForId(value) {
  const slug = String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return slug || "lab";
}

function equalValues(left, right) {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

function escapeCsvCell(value) {
  if (value === undefined || value === null) return "";
  let text = String(value);
  if (typeof value === "string" && /^\s*[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function flattenMetrics(value, prefix = "", output = {}) {
  if (value === null || value === undefined) return output;
  if (typeof value !== "object" || Array.isArray(value)) {
    if (prefix) output[prefix] = value;
    return output;
  }
  for (const key of Object.keys(value).sort()) {
    const next = prefix ? `${prefix}.${key}` : key;
    flattenMetrics(value[key], next, output);
  }
  return output;
}

function metricsFromPoint(point) {
  const values = {};
  const containers = [point.values, point.metrics, point.measurements];
  for (const container of containers) {
    if (container !== undefined) flattenMetrics(container, "", values);
  }
  const reserved = new Set(["t", "time", "elapsedSeconds", "timeHours", "timestamp", "values", "metrics", "measurements", "provenance", "dataOrigin"]);
  for (const [key, value] of Object.entries(point)) {
    if (!reserved.has(key) && (value === null || typeof value !== "object")) values[key] = value;
  }
  return values;
}

export function timeSeriesToCSV(timeSeries, options = {}) {
  const points = normalizeTimeSeries(timeSeries);
  const metricRows = points.map((point) => metricsFromPoint(point));
  const metricKeys = Array.from(new Set(metricRows.flatMap((row) => Object.keys(row)))).sort();
  const includeRunId = options.includeRunId !== false && options.runId !== undefined;
  const header = [];
  if (includeRunId) header.push("runId");
  header.push("sampleIndex", "elapsedSeconds", "timestamp", ...metricKeys);
  const lines = [header.map(escapeCsvCell).join(",")];
  points.forEach((point, index) => {
    const metrics = metricRows[index];
    const elapsed = point.elapsedSeconds
      ?? point.t
      ?? point.time
      ?? (point.timeHours === undefined ? "" : point.timeHours * 3600);
    const row = [];
    if (includeRunId) row.push(options.runId);
    row.push(index, elapsed, point.timestamp ?? "");
    row.push(...metricKeys.map((key) => metrics[key] ?? ""));
    lines.push(row.map(escapeCsvCell).join(","));
  });
  return `${lines.join("\n")}\n`;
}

export function runToCSV(run, options = {}) {
  assertPlainObject(run, "run");
  normalizeProvenance(run.provenance);
  normalizeDataOrigin(run.dataOrigin);
  return timeSeriesToCSV(run.timeSeries ?? [], { ...options, runId: options.runId ?? run.id });
}

export function createBackendAdapter(options = {}) {
  const rawBaseUrl = options.baseUrl ?? options.apiBaseUrl;
  const rawBaseText = rawBaseUrl === undefined || rawBaseUrl === null ? "" : String(rawBaseUrl).trim();
  const explicitSameOrigin = rawBaseUrl !== undefined && rawBaseText.length === 0 || rawBaseText === "/";
  const baseUrl = explicitSameOrigin ? "" : rawBaseText.replace(/\/$/, "");
  const configured = (baseUrl.length > 0 || explicitSameOrigin) && options.enabled !== false;
  const fetchImpl = options.fetchImpl;
  if (configured && baseUrl.length > 0) {
    let url;
    try {
      url = new URL(baseUrl);
    } catch (error) {
      throw new PersistenceError("BACKEND_CONFIG_INVALID", "baseUrl must be an explicit HTTP(S) API origin.", error);
    }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password
      || url.search || url.hash || url.pathname !== "/") {
      throw new PersistenceError("BACKEND_CONFIG_INVALID", "baseUrl must be an HTTP(S) origin without credentials, query, or path.");
    }
  }

  function status() {
    return {
      configured,
      baseUrl: configured ? baseUrl : null,
      label: configured ? "optional local backend" : "local browser only",
    };
  }

  function endpoint(playerId) {
    const path = `/api/state/${encodeURIComponent(normalizePlayerId(playerId))}`;
    return baseUrl ? new URL(path, `${baseUrl}/`).toString() : path;
  }

  async function request(playerId, requestOptions) {
    if (!configured) throw new PersistenceError("BACKEND_NOT_CONFIGURED", "No optional persistence backend is configured.");
    const requestFetch = fetchImpl ?? globalThis.fetch;
    if (typeof requestFetch !== "function") throw new PersistenceError("BACKEND_UNAVAILABLE", "The configured persistence backend needs a fetch implementation.");
    let response;
    try {
      response = await requestFetch(endpoint(playerId), {
        ...requestOptions,
        credentials: "omit",
        cache: "no-store",
        headers: { "Content-Type": "application/json", ...(options.headers ?? {}), ...(requestOptions.headers ?? {}) },
      });
    } catch (error) {
      throw new PersistenceError("BACKEND_REQUEST_FAILED", "The optional persistence backend could not be reached.", error);
    }
    if (response.status === 404 && requestOptions.method === "GET") return null;
    let body;
    try {
      body = await response.json();
    } catch (error) {
      throw new PersistenceError("BACKEND_INVALID_RESPONSE", "The optional persistence backend returned invalid JSON.", error);
    }
    if (!response.ok) {
      const detail = isPlainObject(body) ? body.message ?? body.error : null;
      throw new PersistenceError("BACKEND_REQUEST_FAILED", detail || `The optional persistence backend returned HTTP ${response.status}.`);
    }
    if (!isPlainObject(body) || body.ok !== true || body.playerId !== normalizePlayerId(playerId)
      || !isPlainObject(body.state)) {
      throw new PersistenceError("BACKEND_INVALID_RESPONSE", "The optional persistence backend returned an invalid state envelope.");
    }
    return body;
  }

  return Object.freeze({
    configured,
    baseUrl: configured ? baseUrl : null,
    status,
    async load(playerId) {
      const response = await request(playerId, { method: "GET" });
      if (response === null) return null;
      return cloneJson(response.state, "backend state");
    },
    async save(playerId, state) {
      const body = cloneJson(state, "backend state");
      const serialized = JSON.stringify(body);
      if (byteLength(serialized) > BACKEND_MAX_BODY_BYTES) {
        throw new PersistenceError("BACKEND_PAYLOAD_TOO_LARGE", "The local Node API accepts at most 64 KiB; the local save and JSON export are still available.");
      }
      return request(playerId, { method: "PUT", body: serialized });
    },
  });
}

export class LabPersistence {
  constructor(options = {}) {
    const resolved = options.storage === undefined
      ? resolveDefaultStorage()
      : (() => {
        if (!isStorageLike(options.storage)) throw new TypeError("storage must implement getItem, setItem, and removeItem.");
        return { storage: options.storage, kind: options.storage.__orrStorageKind ?? "custom" };
      })();

    this.playerId = normalizePlayerId(options.playerId ?? DEFAULT_PLAYER_ID);
    this.storage = resolved.storage;
    this.storageKind = resolved.kind;
    this.storageKey = options.storageKey === undefined ? storageKeyFor(this.playerId) : String(options.storageKey);
    this.clock = options.clock;
    this.idFactory = normalizeIdFactory(options.idFactory);
    this.backend = options.backend ?? createBackendAdapter({
      baseUrl: options.backendBaseUrl ?? options.apiBaseUrl,
      fetchImpl: options.fetchImpl,
      headers: options.backendHeaders,
    });

    const raw = readStorageValue(this.storage, this.storageKey);
    this.loadedFromEmpty = raw === null || raw === "";
    if (this.loadedFromEmpty) {
      this._state = createEmptyState(this.playerId, isoFromClock(this.clock));
    } else {
      let parsed;
      try {
        parsed = safeParseJSON(raw, "stored state");
      } catch (error) {
        throw new StorageError("CORRUPT_STORAGE", "The local persistence state contains invalid JSON.", error);
      }
      try {
        this._state = migrateState(parsed, { playerId: this.playerId, clock: this.clock });
      } catch (error) {
        if (error instanceof PersistenceError) throw error;
        throw new StorageError("CORRUPT_STORAGE", "The local persistence state could not be validated.", error);
      }
    }
  }

  state() {
    return cloneJson(this._state, "state");
  }

  getState() {
    return this.state();
  }

  initialize() {
    this._write(this._state);
    this.loadedFromEmpty = false;
    return this.state();
  }

  _write(state) {
    let serialized;
    try {
      serialized = JSON.stringify(state);
    } catch (error) {
      throw new StorageError("SERIALIZATION_FAILED", "The persistence state could not be serialized.", error);
    }
    writeStorageValue(this.storage, this.storageKey, serialized);
  }

  _commit(collections) {
    const now = isoFromClock(this.clock);
    const next = {
      ...this._state,
      revision: this._state.revision + 1,
      updatedAt: now,
      collections: cloneJson(collections, "state.collections"),
    };
    this._write(next);
    this._state = next;
    this.loadedFromEmpty = false;
    return this.state();
  }

  _newId(type, data) {
    const definition = TYPE_DEFINITIONS[type];
    if (data.id !== undefined && data.id !== null && String(data.id).trim() !== "") return data.id;
    if (type === "uiSettings") {
      const scope = normalizeString(data.scope, "uiSettings.scope", { fallback: "lab", required: true });
      return `${definition.idPrefix}_${slugForId(scope)}`;
    }
    const candidate = this.idFactory(definition.idPrefix, this.playerId);
    if (candidate === undefined || candidate === null || String(candidate).trim() === "") {
      throw new ValidationError("idFactory must return a stable id.");
    }
    return candidate;
  }

  create(type, data = {}) {
    const canonical = normalizeEntityType(type);
    assertPlainObject(data, `${canonical} input`);
    const now = isoFromClock(this.clock);
    const candidate = normalizeEntityRecord(canonical, data, {
      playerId: this.playerId,
      now,
      requestedId: this._newId(canonical, data),
      preserveTimestamps: false,
    });
    const collection = this._state.collections[canonical];
    if (collection.some((record) => record.id === candidate.id)) {
      throw new PersistenceError("ID_CONFLICT", `${canonical} id ${candidate.id} already exists for this player.`);
    }
    const nextCollection = [...collection, candidate];
    const nextCollections = { ...this._state.collections, [canonical]: nextCollection };
    return this._commit(nextCollections).collections[canonical].find((record) => record.id === candidate.id);
  }

  get(type, id) {
    const canonical = normalizeEntityType(type);
    const normalizedId = String(id);
    const record = this._state.collections[canonical].find((item) => item.id === normalizedId);
    return record ? cloneJson(record, `${canonical} record`) : null;
  }

  require(type, id) {
    const record = this.get(type, id);
    if (!record) throw new PersistenceError("NOT_FOUND", `No ${normalizeEntityType(type)} record exists with id ${String(id)}.`);
    return record;
  }

  list(type, filter = {}) {
    const canonical = normalizeEntityType(type);
    const options = typeof filter === "function" ? { predicate: filter } : filter ?? {};
    const predicate = options.predicate
      ?? options.where
      ?? (isPlainObject(options) ? options : undefined);
    const entries = this._state.collections[canonical].filter((record) => {
      if (typeof predicate === "function" && !predicate(cloneJson(record, "record"))) return false;
      if (isPlainObject(predicate)) {
        for (const [key, expected] of Object.entries(predicate)) {
          if (!equalValues(record[key], expected)) return false;
        }
      }
      return true;
    });
    entries.sort((left, right) => {
      const created = left.createdAt.localeCompare(right.createdAt);
      return created || left.id.localeCompare(right.id);
    });
    return cloneJson(entries, `${canonical} records`);
  }

  update(type, id, patch = {}) {
    const canonical = normalizeEntityType(type);
    assertPlainObject(patch, `${canonical} patch`);
    const collection = this._state.collections[canonical];
    const index = collection.findIndex((record) => record.id === String(id));
    if (index < 0) throw new PersistenceError("NOT_FOUND", `No ${canonical} record exists with id ${String(id)}.`);
    for (const field of IMMUTABLE_UPDATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(patch, field)) {
        throw new ValidationError(`${field} is managed by the persistence layer and cannot be changed.`);
      }
    }
    const now = isoFromClock(this.clock);
    const merged = { ...collection[index], ...cloneJson(patch, "patch") };
    const candidate = normalizeEntityRecord(canonical, merged, {
      playerId: this.playerId,
      now,
      existing: collection[index],
      requestedId: collection[index].id,
      preserveTimestamps: false,
    });
    const nextCollection = collection.slice();
    nextCollection[index] = candidate;
    const nextCollections = { ...this._state.collections, [canonical]: nextCollection };
    return this._commit(nextCollections).collections[canonical][index];
  }

  remove(type, id) {
    const canonical = normalizeEntityType(type);
    const collection = this._state.collections[canonical];
    const nextCollection = collection.filter((record) => record.id !== String(id));
    if (nextCollection.length === collection.length) return false;
    this._commit({ ...this._state.collections, [canonical]: nextCollection });
    return true;
  }

  deleteRecord(type, id) {
    return this.remove(type, id);
  }

  delete(type, id) {
    return this.remove(type, id);
  }

  count(type) {
    return this.list(type).length;
  }

  clear(type) {
    const canonical = normalizeEntityType(type);
    if (this._state.collections[canonical].length === 0) return false;
    this._commit({ ...this._state.collections, [canonical]: [] });
    return true;
  }

  exportState() {
    return this.state();
  }

  exportJSON(options = {}) {
    const pretty = options.pretty !== false;
    return `${JSON.stringify(this._state, null, pretty ? 2 : 0)}\n`;
  }

  importState(input, options = {}) {
    const imported = migrateState(input, { playerId: this.playerId, clock: this.clock });
    const mode = options.mode ?? (options.merge ? "merge" : "replace");
    if (mode !== "replace" && mode !== "merge") throw new ValidationError("import mode must be replace or merge.");
    if (mode === "replace") return this._commit(imported.collections);

    const mergedCollections = {};
    for (const type of ENTITY_TYPES) {
      const byId = new Map(this._state.collections[type].map((record) => [record.id, record]));
      for (const record of imported.collections[type]) byId.set(record.id, record);
      mergedCollections[type] = Array.from(byId.values());
    }
    return this._commit(mergedCollections);
  }

  importJSON(raw, options = {}) {
    const parsed = typeof raw === "string" ? safeParseJSON(raw, "imported state") : cloneJson(raw, "imported state");
    return this.importState(parsed, options);
  }

  exportRunCSV(runId, options = {}) {
    return runToCSV(this.require("runs", runId), { ...options, runId: options.runId ?? String(runId) });
  }

  backendStatus() {
    if (this.backend && typeof this.backend.status === "function") return this.backend.status();
    return { configured: Boolean(this.backend?.configured), baseUrl: this.backend?.baseUrl ?? null };
  }

  async saveToBackend() {
    if (!this.backend || this.backend.configured !== true) {
      throw new PersistenceError("BACKEND_NOT_CONFIGURED", "No optional persistence backend is configured.");
    }
    return this.backend.save(this.playerId, this.exportState());
  }

  async loadFromBackend(options = {}) {
    if (!this.backend || this.backend.configured !== true) {
      throw new PersistenceError("BACKEND_NOT_CONFIGURED", "No optional persistence backend is configured.");
    }
    const remote = await this.backend.load(this.playerId);
    if (remote === null || remote === undefined) return null;
    return this.importState(remote, { mode: options.mode ?? "replace" });
  }

  async syncToBackend() {
    return this.saveToBackend();
  }

  /* Convenience methods make route code self-documenting while generic CRUD
     remains available for schema-driven views. */
  createProject(data) { return this.create("projects", data); }
  getProject(id) { return this.get("projects", id); }
  listProjects(filter) { return this.list("projects", filter); }
  updateProject(id, patch) { return this.update("projects", id, patch); }
  deleteProject(id) { return this.remove("projects", id); }

  createExperiment(data) { return this.create("experiments", data); }
  getExperiment(id) { return this.get("experiments", id); }
  listExperiments(filter) { return this.list("experiments", filter); }
  updateExperiment(id, patch) { return this.update("experiments", id, patch); }
  deleteExperiment(id) { return this.remove("experiments", id); }

  createRun(data) { return this.create("runs", data); }
  getRun(id) { return this.get("runs", id); }
  listRuns(filter) { return this.list("runs", filter); }
  updateRun(id, patch) { return this.update("runs", id, patch); }
  deleteRun(id) { return this.remove("runs", id); }

  createNotebookEntry(data) { return this.create("notebookEntries", data); }
  getNotebookEntry(id) { return this.get("notebookEntries", id); }
  listNotebookEntries(filter) { return this.list("notebookEntries", filter); }
  updateNotebookEntry(id, patch) { return this.update("notebookEntries", id, patch); }
  deleteNotebookEntry(id) { return this.remove("notebookEntries", id); }

  createUISettings(data) { return this.create("uiSettings", data); }
  getUISettings(id) { return this.get("uiSettings", id); }
  listUISettings(filter) { return this.list("uiSettings", filter); }
  updateUISettings(id, patch) { return this.update("uiSettings", id, patch); }
  deleteUISettings(id) { return this.remove("uiSettings", id); }

  createUiSettings(data) { return this.createUISettings(data); }
  getUiSettings(id) { return this.getUISettings(id); }
  listUiSettings(filter) { return this.listUISettings(filter); }
  updateUiSettings(id, patch) { return this.updateUISettings(id, patch); }
  deleteUiSettings(id) { return this.deleteUISettings(id); }
}

export function createLabPersistence(options = {}) {
  return new LabPersistence(options);
}

export const createPersistence = createLabPersistence;
