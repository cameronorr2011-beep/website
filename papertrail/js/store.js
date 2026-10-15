const STORE_KEY = "papertrail.session.v1";
const SCHEMA_VERSION = 1;
const memorySession = { value: null };

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function probeLocalStorage() {
  try {
    if (!globalThis.localStorage) return { available: false, error: "Browser storage is not exposed." };
    const probeKey = `${STORE_KEY}.probe`;
    globalThis.localStorage.setItem(probeKey, "ok");
    globalThis.localStorage.removeItem(probeKey);
    return { available: true, error: "" };
  } catch (error) {
    return { available: false, error: error instanceof Error ? error.message : "Browser storage is unavailable." };
  }
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

  if (!probe.available && isSession(memorySession.value)) {
    return { state: clone(memorySession.value), storageMode: "memory", recovered: true, storageError };
  }

  if (probe.available) {
    try {
      const raw = globalThis.localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isSession(parsed)) {
          memorySession.value = clone(parsed);
          recovered = true;
          return { state: clone(parsed), storageMode: "local", recovered, storageError: "" };
        }
        storageError = "Stored PaperTrail data used an unknown schema.";
      }
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
    if (!globalThis.localStorage) throw new Error("Browser storage is not exposed.");
    globalThis.localStorage.setItem(STORE_KEY, JSON.stringify(snapshot));
    return { ok: true, storageMode: "local", error: "" };
  } catch (error) {
    return {
      ok: true,
      storageMode: "memory",
      error: error instanceof Error ? error.message : "Browser storage is unavailable.",
    };
  }
}

export function clearSession() {
  memorySession.value = null;
  try {
    if (globalThis.localStorage) globalThis.localStorage.removeItem(STORE_KEY);
    return { storageMode: "local", error: "" };
  } catch (error) {
    return { storageMode: "memory", error: error instanceof Error ? error.message : "Browser storage is unavailable." };
  }
}

export function exportSessionJson(state) {
  return JSON.stringify(clone(state), null, 2);
}

export { SCHEMA_VERSION, STORE_KEY };
