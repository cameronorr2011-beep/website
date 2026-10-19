const STORE_KEY = "papertrail.session.v1";
const SCHEMA_VERSION = 1;
const LIVE_STORE_KEY = "papertrail.live-session.v1";
const LIVE_SCHEMA_VERSION = 1;
const API_BASE_KEY = "papertrail.api-base.v1";
const API_BASE_SCHEMA_VERSION = 1;
const memorySession = { value: null };
const memoryLiveSession = { value: null };
const memoryApiBase = { value: "" };

const SECRET_KEY_PATTERN = /^(?:groq[_-]?api[_-]?key|api[_-]?key|access[_-]?token|authorization|token|secret|password|cookie)$/i;

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function getStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function probeLocalStorage() {
  const storage = getStorage();
  if (!storage) return { available: false, error: "Browser storage is not exposed." };
  try {
    const probeKey = `${STORE_KEY}.probe`;
    storage.setItem(probeKey, "ok");
    storage.removeItem(probeKey);
    return { available: true, error: "" };
  } catch (error) {
    return { available: false, error: error instanceof Error ? error.message : "Browser storage is unavailable." };
  }
}

function sanitize(value, depth = 0) {
  if (depth > 12 || value === undefined) return undefined;
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 512).map((item) => sanitize(item, depth + 1));
  if (typeof value !== "object") return String(value);
  const result = {};
  for (const [key, child] of Object.entries(value).slice(0, 512)) {
    if (SECRET_KEY_PATTERN.test(key)) continue;
    const safeChild = sanitize(child, depth + 1);
    if (safeChild !== undefined) result[key] = safeChild;
  }
  return result;
}

function normalizeApiBase(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return { ok: true, value: "" };
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, value: "", error: "Enter a complete http(s) API base URL." };
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, value: "", error: "The API base must use http:// or https://." };
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    return { ok: false, value: "", error: "The API base may not contain credentials, query parameters, or fragments." };
  }
  const pathname = parsed.pathname.replace(/\/+$/, "");
  return { ok: true, value: `${parsed.origin}${pathname}` };
}

function isSession(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    value.kind === "papertrail-session" &&
    value.schemaVersion === SCHEMA_VERSION &&
    typeof value.question === "string" &&
    ["new", "running", "completed"].includes(value.status) &&
    Array.isArray(value.agents) &&
    value.evidence &&
    Array.isArray(value.evidence.sources) &&
    Array.isArray(value.evidence.records) &&
    value.analysis &&
    typeof value.analysis === "object" &&
    value.analysis.agentOutputs &&
    Array.isArray(value.analysis.findings) &&
    Array.isArray(value.analysis.claims) &&
    value.workflow &&
    typeof value.workflow === "object" &&
    Array.isArray(value.workflow.completedAgentIds) &&
    Array.isArray(value.workflow.events) &&
    value.selection &&
    typeof value.selection === "object"
  );
}

function sessionMetadata(session) {
  if (!session || typeof session !== "object") return null;
  if (typeof session.id !== "string" || !session.id.trim()) return null;
  return sanitize({
    id: session.id,
    question: typeof session.question === "string" ? session.question : "",
    options: session.options && typeof session.options === "object" ? session.options : {},
    model: session.model ?? null,
    status: session.status ?? "new",
    cancelRequested: Boolean(session.cancelRequested),
    createdAt: session.createdAt ?? null,
    updatedAt: session.updatedAt ?? null,
    runStartedAt: session.runStartedAt ?? null,
  });
}

function liveSnapshotFromBundle(bundle) {
  const session = sessionMetadata(bundle?.session);
  if (!session) return null;
  const events = Array.isArray(bundle.events)
    ? bundle.events.map((event) => sanitize({
      id: Number(event?.id),
      sessionId: event?.sessionId ?? session.id,
      type: event?.type ?? "message",
      payload: event?.payload ?? null,
      createdAt: event?.createdAt ?? null,
    })).filter((event) => Number.isSafeInteger(event.id) && event.id >= 0)
    : [];
  const lastEventId = events.reduce((highest, event) => Math.max(highest, event.id), 0);
  return {
    kind: "papertrail-live-session",
    schemaVersion: LIVE_SCHEMA_VERSION,
    session,
    events,
    sources: sanitize(Array.isArray(bundle.sources) ? bundle.sources : []),
    agentRuns: sanitize(Array.isArray(bundle.agentRuns) ? bundle.agentRuns.map((run) => ({
      id: run?.id,
      sessionId: run?.sessionId ?? session.id,
      role: run?.role ?? "agent",
      status: run?.status ?? "unknown",
      model: run?.model ?? null,
      input: run?.input ?? null,
      output: run?.output ?? null,
      error: run?.error ?? null,
      createdAt: run?.createdAt ?? null,
      startedAt: run?.startedAt ?? null,
      finishedAt: run?.finishedAt ?? null,
      updatedAt: run?.updatedAt ?? null,
    })) : []),
    claims: sanitize(Array.isArray(bundle.claims) ? bundle.claims : []),
    evidence: sanitize(Array.isArray(bundle.evidence) ? bundle.evidence : []),
    evidenceLinks: sanitize(Array.isArray(bundle.evidenceLinks) ? bundle.evidenceLinks : []),
    debate: sanitize(bundle.debate ?? null),
    report: sanitize(bundle.report ?? null),
    audit: sanitize(bundle.audit ?? null),
    lastEventId,
  };
}

function isLiveSnapshot(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    value.kind === "papertrail-live-session" &&
    value.schemaVersion === LIVE_SCHEMA_VERSION &&
    value.session &&
    typeof value.session.id === "string" &&
    Array.isArray(value.events) &&
    Array.isArray(value.sources) &&
    Array.isArray(value.agentRuns) &&
    Array.isArray(value.claims) &&
    Array.isArray(value.evidence) &&
    Array.isArray(value.evidenceLinks)
  );
}

function readJson(storage, key) {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function createSession(config = {}) {
  return {
    kind: "papertrail-session",
    schemaVersion: SCHEMA_VERSION,
    sessionId: "PT-DEMO-SESSION-001",
    question: config.question || "",
    status: "new",
    createdAt: "SYNTHETIC-DEMO-SESSION",
    updatedAt: null,
    runStartedAt: null,
    completedAt: null,
    workflow: {
      currentStep: 0,
      totalSteps: Array.isArray(config.agentRoles) ? config.agentRoles.length : 0,
      completedAgentIds: [],
      events: [],
    },
    agents: clone(config.agentRoles || []),
    evidence: {
      sources: clone(config.sources || []),
      records: clone(config.records || []),
    },
    analysis: {
      agentOutputs: {},
      findings: [],
      claims: [],
      debate: null,
      graph: null,
      report: null,
    },
    selection: {
      claimId: config.defaultClaimId || null,
      view: "overview",
    },
  };
}

export function loadSession(createFallback) {
  const probe = probeLocalStorage();
  let recovered = false;
  let storageError = probe.error;
  const storage = getStorage();

  if (!probe.available && isSession(memorySession.value)) {
    return { state: clone(memorySession.value), storageMode: "memory", recovered: true, storageError };
  }

  if (probe.available && storage) {
    try {
      const parsed = readJson(storage, STORE_KEY);
      if (isSession(parsed)) {
        memorySession.value = clone(parsed);
        recovered = true;
        return { state: clone(parsed), storageMode: "local", recovered, storageError: "" };
      }
      if (parsed) storageError = "Stored PaperTrail data used an unknown schema.";
    } catch (error) {
      storageError = error instanceof Error ? error.message : "Stored PaperTrail data could not be read.";
    }
  }

  const fallback = typeof createFallback === "function" ? createFallback() : createSession();
  memorySession.value = clone(fallback);
  return {
    state: clone(fallback),
    storageMode: probe.available ? "local" : "memory",
    recovered,
    storageError,
  };
}

export function saveSession(state) {
  const snapshot = clone(state);
  memorySession.value = snapshot;
  try {
    const storage = getStorage();
    if (!storage) throw new Error("Browser storage is not exposed.");
    storage.setItem(STORE_KEY, JSON.stringify(snapshot));
    return { ok: true, storageMode: "local", error: "" };
  } catch (error) {
    return {
      ok: true,
      storageMode: "memory",
      error: error instanceof Error ? error.message : "Browser storage is unavailable.",
    };
  }
}

export function loadLiveSession() {
  const probe = probeLocalStorage();
  const storage = getStorage();
  let storageError = probe.error;
  if (!probe.available && isLiveSnapshot(memoryLiveSession.value)) {
    return { snapshot: clone(memoryLiveSession.value), storageMode: "memory", recovered: true, storageError };
  }
  if (probe.available && storage) {
    try {
      const parsed = readJson(storage, LIVE_STORE_KEY);
      if (isLiveSnapshot(parsed)) {
        memoryLiveSession.value = clone(parsed);
        return { snapshot: clone(parsed), storageMode: "local", recovered: true, storageError: "" };
      }
      if (parsed) storageError = "Stored live PaperTrail data used an unknown schema.";
    } catch (error) {
      storageError = error instanceof Error ? error.message : "Stored live PaperTrail data could not be read.";
    }
  }
  return {
    snapshot: null,
    storageMode: probe.available ? "local" : "memory",
    recovered: false,
    storageError,
  };
}

export function saveLiveSession(bundle) {
  const snapshot = liveSnapshotFromBundle(bundle);
  if (!snapshot) {
    return { ok: false, storageMode: "memory", error: "The live session did not contain a valid session identifier.", snapshot: null };
  }
  memoryLiveSession.value = clone(snapshot);
  try {
    const storage = getStorage();
    if (!storage) throw new Error("Browser storage is not exposed.");
    storage.setItem(LIVE_STORE_KEY, JSON.stringify(snapshot));
    return { ok: true, storageMode: "local", error: "", snapshot: clone(snapshot) };
  } catch (error) {
    return {
      ok: true,
      storageMode: "memory",
      error: error instanceof Error ? error.message : "Browser storage is unavailable.",
      snapshot: clone(snapshot),
    };
  }
}

export function clearLiveSession() {
  memoryLiveSession.value = null;
  try {
    const storage = getStorage();
    if (storage) storage.removeItem(LIVE_STORE_KEY);
    return { storageMode: "local", error: "" };
  } catch (error) {
    return { storageMode: "memory", error: error instanceof Error ? error.message : "Browser storage is unavailable." };
  }
}

export function loadApiBase() {
  const probe = probeLocalStorage();
  const storage = getStorage();
  let storageError = probe.error;
  if (!probe.available) {
    return { value: memoryApiBase.value, storageMode: "memory", storageError };
  }
  try {
    const raw = storage?.getItem(API_BASE_KEY) || "";
    const normalized = normalizeApiBase(raw);
    if (!normalized.ok) {
      storageError = normalized.error;
      memoryApiBase.value = "";
      return { value: "", storageMode: "local", storageError };
    }
    memoryApiBase.value = normalized.value;
    return { value: normalized.value, storageMode: "local", storageError: "" };
  } catch (error) {
    storageError = error instanceof Error ? error.message : "The API base could not be read.";
    return { value: memoryApiBase.value, storageMode: "memory", storageError };
  }
}

export function saveApiBase(value) {
  const normalized = normalizeApiBase(value);
  if (!normalized.ok) return { ok: false, value: "", storageMode: "memory", error: normalized.error };
  memoryApiBase.value = normalized.value;
  try {
    const storage = getStorage();
    if (!storage) throw new Error("Browser storage is not exposed.");
    if (normalized.value) storage.setItem(API_BASE_KEY, normalized.value);
    else storage.removeItem(API_BASE_KEY);
    return { ok: true, value: normalized.value, storageMode: "local", error: "" };
  } catch (error) {
    return {
      ok: true,
      value: normalized.value,
      storageMode: "memory",
      error: error instanceof Error ? error.message : "Browser storage is unavailable; the URL will last until this tab closes.",
    };
  }
}

export function clearApiBase() {
  memoryApiBase.value = "";
  try {
    const storage = getStorage();
    if (storage) storage.removeItem(API_BASE_KEY);
    return { ok: true, storageMode: "local", error: "" };
  } catch (error) {
    return { ok: true, storageMode: "memory", error: error instanceof Error ? error.message : "Browser storage is unavailable." };
  }
}

export function clearSession() {
  memorySession.value = null;
  try {
    const storage = getStorage();
    if (storage) storage.removeItem(STORE_KEY);
    return { storageMode: "local", error: "" };
  } catch (error) {
    return { storageMode: "memory", error: error instanceof Error ? error.message : "Browser storage is unavailable." };
  }
}

export function exportSessionJson(state) {
  return JSON.stringify(clone(state), null, 2);
}

export {
  API_BASE_KEY,
  API_BASE_SCHEMA_VERSION,
  LIVE_SCHEMA_VERSION,
  LIVE_STORE_KEY,
  SCHEMA_VERSION,
  STORE_KEY,
};
