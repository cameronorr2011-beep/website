import http from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createPaperTrailStore, DEFAULT_DB_PATH } from "./db.mjs";
import { createGroqClient, DEFAULT_GROQ_MODEL } from "./groq.mjs";
import { createLiteratureProviders } from "./literature.mjs";
import { runInvestigation } from "./orchestrator.mjs";
import { ResearchOptionsSchema, SessionRequestSchema } from "./schemas.mjs";

export const API_PREFIX = "/api/papertrail/v1";
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 8788;
export const DEFAULT_MAX_BODY_BYTES = 256 * 1024;
export const DEFAULT_SSE_POLL_MS = 350;
export const DEFAULT_SSE_MAX_LIFETIME_MS = 5 * 60 * 1000;
export const DEFAULT_RUN_LEASE_MS = 30_000;
export const DEFAULT_RUN_HEARTBEAT_MS = 5_000;

const TERMINAL_STATUSES = new Set(["COMPLETED", "PARTIAL", "CANCELLED", "FAILED"]);
const MODEL_STATUS_VALUES = new Set([
  "missing_key",
  "unavailable_model",
  "rate_limited",
  "timeout",
  "provider_http_error",
  "available",
]);
const RESEARCH_OPTION_KEYS = Object.freeze([
  "providers",
  "maxResults",
  "maxQueries",
  "perProviderMaxResults",
  "includeAbstract",
  "dateFrom",
  "dateTo",
  "language",
  "queryVariants",
  "additionalQueries",
  "email",
  "userAgent",
]);
const SENSITIVE_KEY_PATTERN = /^(?:groq[_-]?api[_-]?key|api[_-]?key|access[_-]?token|authorization|token|secret|password)$/i;
const API_KEY_PATTERN = /(?:groq[_-]?api[_-]?key|api[_-]?key|access[_-]?token|authorization|token|secret|password)\s*[:=]\s*[^\s,;]+/gi;
const BEARER_PATTERN = /bearer\s+[a-z0-9._~-]+/gi;
const SESSION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~-]{0,511}$/;
const CONTEXT_MARKER = Symbol("papertrail-api-context");

class HttpError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeOrigin(origin) {
  if (origin === undefined || origin === null || origin === "") return null;
  if (typeof origin !== "string" || origin.trim() === "" || origin.trim() === "*") {
    throw new TypeError("origin must be an explicit http(s) origin or be omitted");
  }
  const value = origin.trim();
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError("origin must be an explicit http(s) origin or be omitted");
  }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== value) {
    throw new TypeError("origin must be an explicit http(s) origin without a path or wildcard");
  }
  return parsed.origin;
}

function positiveInteger(value, name) {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (!Number.isInteger(number) || number < 1) throw new TypeError(`${name} must be a positive integer`);
  return number;
}

function portValue(value) {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (!Number.isInteger(number) || number < 0 || number > 65535) {
    throw new TypeError("port must be an integer from 0 through 65535");
  }
  return number;
}

function isLoopbackHost(host) {
  const value = String(host ?? "").toLowerCase();
  return value === "localhost"
    || value === "127.0.0.1"
    || value === "::1"
    || value === "[::1]"
    || value.startsWith("127.");
}

function isTerminalStatus(status) {
  return TERMINAL_STATUSES.has(String(status ?? "").toUpperCase());
}

function formatZodIssues(error) {
  return Array.isArray(error?.issues)
    ? error.issues.slice(0, 20).map((issue) => ({
      path: Array.isArray(issue.path) ? issue.path : [],
      message: String(issue.message ?? "Invalid value").slice(0, 300),
    }))
    : [];
}

function redactText(value, context) {
  let text = String(value ?? "");
  const secrets = [...context.secretValues]
    .filter((secret) => typeof secret === "string" && secret.length > 0)
    .sort((left, right) => right.length - left.length);
  for (const secret of secrets) text = text.split(secret).join("[REDACTED]");
  return text.replace(BEARER_PATTERN, "Bearer [REDACTED]").replace(API_KEY_PATTERN, (match) => {
    const separator = match.match(/\s*[:=]\s*/)?.[0] ?? "=";
    return `${match.slice(0, match.indexOf(separator))}${separator}[REDACTED]`;
  }).slice(0, 4_000);
}

function redactValue(value, context, depth = 0) {
  if (depth > 12) return "[depth limited]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactText(value, context);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 1_024).map((item) => redactValue(item, context, depth + 1));
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) continue;
    output[key] = redactValue(child, context, depth + 1);
  }
  return output;
}

function rejectClientSecrets(value, pathName = "body", depth = 0) {
  if (depth > 12 || value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((child, index) => rejectClientSecrets(child, `${pathName}[${index}]`, depth + 1));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      throw new HttpError(400, "server_secret_not_allowed", "Provider credentials are server-side configuration and cannot be supplied in a request.");
    }
    rejectClientSecrets(child, `${pathName}.${key}`, depth + 1);
  }
}

function safeResearchOptions(options, context) {
  const result = {};
  if (!isObject(options)) return result;
  for (const key of RESEARCH_OPTION_KEYS) {
    if (hasOwn(options, key)) result[key] = redactValue(options[key], context);
  }
  return result;
}

function safeSession(session, context) {
  if (!session || typeof session !== "object") return null;
  return {
    id: redactText(session.id, context),
    question: redactText(session.question, context),
    options: safeResearchOptions(session.options, context),
    model: session.model === null || session.model === undefined ? null : redactText(session.model, context),
    status: String(session.status ?? ""),
    cancelRequested: Boolean(session.cancelRequested),
    createdAt: session.createdAt ?? null,
    updatedAt: session.updatedAt ?? null,
    runStartedAt: session.runStartedAt ?? null,
  };
}

function safeBundle(bundle, context) {
  const safe = redactValue(bundle, context);
  if (safe && typeof safe === "object" && safe.session) safe.session = safeSession(bundle.session, context);
  return safe;
}

function collectSecretValues(options) {
  const values = new Set();
  const candidates = [
    process.env?.GROQ_API_KEY,
    options?.groq?.apiKey,
    options?.groq?.groqApiKey,
    options?.groqConfig?.apiKey,
    options?.groqConfig?.groqApiKey,
    options?.apiToken,
    process.env?.PAPERTRAIL_API_TOKEN,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.length > 0) values.add(value);
  }
  return values;
}

function tokenMatches(supplied, expected) {
  if (typeof supplied !== "string" || typeof expected !== "string" || supplied.length === 0 || expected.length === 0) return false;
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function groqClientLike(value) {
  return typeof value === "function"
    || typeof value?.verifyModelAvailability === "function"
    || typeof value?.checkAvailability === "function"
    || typeof value?.generateStructured === "function"
    || typeof value?.complete === "function";
}

function modelName(value, fallback = DEFAULT_GROQ_MODEL) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.slice(0, 256) || fallback;
}

function safeModelName(value, fallback, context) {
  return redactText(modelName(value, fallback), context);
}

function classifyModelStatus(result) {
  const status = String(result?.status ?? result?.code ?? "").toLowerCase();
  if (status === "missing_key" || status === "missing_api_key" || status === "missing-key") return "missing_key";
  if (status === "unavailable_model" || status === "model_unavailable" || status === "unavailable-model") return "unavailable_model";
  if (status === "rate_limited" || status === "rate-limit" || status === "ratelimited") return "rate_limited";
  if (status === "timeout" || status === "timed_out" || status === "etimedout") return "timeout";
  if (status === "available" || result?.available === true || (result?.ok === true && result?.available !== false)) return "available";
  return "provider_http_error";
}

function modelStatusFromError(error) {
  if (error?.status === "missing_key" || error?.code === "missing_api_key") return "missing_key";
  if (error?.status === "unavailable_model" || error?.code === "model_unavailable") return "unavailable_model";
  if (error?.status === "rate_limited" || error?.statusCode === 429) return "rate_limited";
  if (error?.status === "timeout" || error?.name === "TimeoutError" || error?.code === "ETIMEDOUT") return "timeout";
  return "provider_http_error";
}

function writeJson(response, status, payload, headers = {}) {
  if (response.headersSent) {
    response.destroy();
    return;
  }
  const body = `${JSON.stringify(payload)}\n`;
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  response.end(body);
}

function writeError(response, error, context) {
  if (response.headersSent) {
    response.destroy();
    return;
  }
  if (error instanceof HttpError) {
    const payload = {
      error: error.code,
      message: redactText(error.message, context),
      ...(error.details === undefined ? {} : { details: redactValue(error.details, context) }),
    };
    writeJson(response, error.status, payload, error.status === 405 ? { Allow: error.details?.allow ?? "" } : {});
    return;
  }
  writeJson(response, 500, {
    error: "internal_error",
    message: "The PaperTrail API could not complete the request.",
  });
}

function applyCors(response, request, context) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (!context.origin) return;
  response.setHeader("Vary", "Origin");
  const requestOrigin = request.headers.origin;
  if (!requestOrigin || requestOrigin === context.origin) {
    response.setHeader("Access-Control-Allow-Origin", context.origin);
  }
}

function corsAllowed(request, context) {
  if (!context.origin) return false;
  const requestOrigin = request.headers.origin;
  return !requestOrigin || requestOrigin === context.origin;
}

function authorizeRequest(request, context) {
  if (!context.apiToken) return;
  const header = request.headers.authorization;
  const match = typeof header === "string" ? /^Bearer\s+(.+)$/i.exec(header.trim()) : null;
  if (!match || !tokenMatches(match[1], context.apiToken)) {
    throw new HttpError(401, "unauthorized", "A valid PaperTrail API bearer token is required.");
  }
}

function readRequestBody(request, maxBodyBytes) {
  const declaredLength = Number(request.headers["content-length"]);
  if (Number.isFinite(declaredLength) && declaredLength < 0) {
    request.resume();
    return Promise.reject(new HttpError(400, "invalid_content_length", "Content-Length must not be negative."));
  }
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
    request.resume();
    return Promise.reject(new HttpError(413, "payload_too_large", `Request bodies must not exceed ${maxBodyBytes} bytes.`));
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let tooLarge = false;
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    request.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBodyBytes) tooLarge = true;
      else chunks.push(chunk);
    });
    request.on("end", () => {
      if (tooLarge) {
        fail(new HttpError(413, "payload_too_large", `Request bodies must not exceed ${maxBodyBytes} bytes.`));
        return;
      }
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks).toString("utf8"));
      }
    });
    request.on("aborted", () => fail(new HttpError(400, "request_aborted", "The request body was interrupted.")));
    request.on("error", (error) => fail(error));
  });
}

async function readJsonBody(request, context, { optional = false, invalidCode = "invalid_json" } = {}) {
  const raw = await readRequestBody(request, context.maxBodyBytes);
  if (raw.trim() === "" && optional) return {};
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "invalid_json", "The request body must be valid JSON.");
  }
  if (!isObject(value)) {
    throw new HttpError(400, invalidCode, "The request body must be a JSON object.");
  }
  rejectClientSecrets(value);
  return value;
}

function decodeSessionId(rawValue) {
  let value;
  try {
    value = decodeURIComponent(rawValue);
  } catch {
    throw new HttpError(400, "invalid_session_id", "The session ID path segment is not valid URL encoding.");
  }
  if (!SESSION_ID_PATTERN.test(value) || value.includes("/") || value.includes("\\")) {
    throw new HttpError(400, "invalid_session_id", "The session ID path segment is invalid.");
  }
  return value;
}

function queryInteger(url, name, { minimum, maximum, defaultValue }) {
  const values = url.searchParams.getAll(name);
  if (values.length > 1) throw new HttpError(400, `duplicate_${name}`, `Query parameter ${name} may only be supplied once.`);
  if (values.length === 0) return defaultValue;
  const raw = values[0];
  if (!/^(?:0|[1-9]\d*)$/.test(raw)) {
    throw new HttpError(400, `invalid_${name}`, `Query parameter ${name} must be an integer.`);
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new HttpError(400, `invalid_${name}`, `Query parameter ${name} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

function allowMethod(methods) {
  return new HttpError(405, "method_not_allowed", `Use ${methods.join(" or ")} for this route.`, { allow: methods.join(", ") });
}

function sessionOr404(context, sessionId) {
  const session = context.store.getSession(sessionId);
  if (!session) throw new HttpError(404, "session_not_found", `No PaperTrail session exists for ${sessionId}.`);
  return session;
}

function validateSessionRequest(body) {
  const parsed = SessionRequestSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, "invalid_session", "The session request did not satisfy the PaperTrail session schema.", formatZodIssues(parsed.error));
  if (parsed.data.id !== undefined && !SESSION_ID_PATTERN.test(parsed.data.id)) {
    throw new HttpError(400, "invalid_session_id", "A supplied session id must contain only URL-safe characters.");
  }
  return parsed.data;
}

function pickRunOptions(body) {
  const candidate = hasOwn(body, "options") ? body.options : body;
  if (!isObject(candidate)) throw new HttpError(400, "invalid_run_options", "Run options must be a JSON object.");
  const parsed = ResearchOptionsSchema.safeParse(candidate);
  if (!parsed.success) throw new HttpError(400, "invalid_run_options", "The run options did not satisfy the PaperTrail research options schema.", formatZodIssues(parsed.error));

  const options = {};
  for (const key of RESEARCH_OPTION_KEYS) {
    if (hasOwn(candidate, key)) options[key] = parsed.data[key];
  }
  const model = body.model ?? candidate.model;
  if (model !== undefined) {
    if (typeof model !== "string" || model.trim().length === 0 || model.trim().length > 256) {
      throw new HttpError(400, "invalid_run_options", "model must be a non-empty string of at most 256 characters.");
    }
    options.model = model.trim();
  }
  const debateRounds = body.debateRounds ?? candidate.debateRounds;
  if (debateRounds !== undefined) {
    if (!Number.isInteger(debateRounds) || debateRounds < 1 || debateRounds > 2) {
      throw new HttpError(400, "invalid_run_options", "debateRounds must be an integer from 1 through 2.");
    }
    options.debateRounds = debateRounds;
  }
  return options;
}

function currentAddress(context) {
  const address = context.server?.address?.();
  if (address && typeof address === "object") return address;
  return { address: context.host, port: context.port };
}

async function handleHealth(_request, response, context) {
  const address = currentAddress(context);
  writeJson(response, 200, {
    service: "papertrail-api",
    status: "ok",
    apiBoundary: {
      prefix: API_PREFIX,
      host: address.address ?? context.host,
      port: address.port ?? context.port,
      separatelyStarted: true,
      authentication: context.apiToken ? "bearer_token" : "none",
      loopbackOnly: isLoopbackHost(address.address ?? context.host),
    },
    persistence: {
      type: "sqlite",
      status: "ready",
      runtimeLocation: "outside_public_root",
    },
    groqConfigured: context.groqConfigured(),
    model: safeModelName(context.groqModel(), DEFAULT_GROQ_MODEL, context),
  });
}

async function handleModels(_request, response, context) {
  let result;
  try {
    const groq = context.getGroq();
    if (typeof groq?.verifyModelAvailability === "function") {
      result = await groq.verifyModelAvailability({ force: true });
    } else if (typeof groq?.checkAvailability === "function") {
      result = await groq.checkAvailability({ force: true });
    } else if (typeof groq === "function") {
      result = await groq({ force: true });
    } else {
      throw new Error("No Groq model verification client is configured");
    }
  } catch (error) {
    const status = modelStatusFromError(error);
    writeJson(response, 200, {
      status,
      available: status === "available",
      model: safeModelName(context.groqModel(), DEFAULT_GROQ_MODEL, context),
    });
    return;
  }
  const status = MODEL_STATUS_VALUES.has(classifyModelStatus(result)) ? classifyModelStatus(result) : "provider_http_error";
  writeJson(response, 200, {
    status,
    available: status === "available",
    model: safeModelName(result?.model, context.groqModel(), context),
  });
}

async function handleSessionsCollection(request, response, context, url) {
  if (request.method === "GET") {
    context.store.reconcileInterruptedRuns?.();
    const limit = queryInteger(url, "limit", { minimum: 1, maximum: 100, defaultValue: 50 });
    writeJson(response, 200, { sessions: context.store.listSessions(limit).map((session) => safeSession(session, context)) });
    return;
  }
  if (request.method !== "POST") throw allowMethod(["GET", "POST"]);
  const body = await readJsonBody(request, context, { invalidCode: "invalid_session" });
  const parsed = validateSessionRequest(body);
  let session;
  try {
    session = context.store.createSession(parsed);
  } catch (error) {
    if (/unique|constraint/i.test(String(error?.message ?? ""))) {
      throw new HttpError(409, "session_exists", "A PaperTrail session with that id already exists.");
    }
    throw error;
  }
  writeJson(response, 201, safeSession(session, context));
}

async function handleSession(request, response, context, sessionId) {
  if (request.method !== "GET") throw allowMethod(["GET"]);
  context.store.reconcileInterruptedRuns?.();
  const bundle = context.store.getSessionBundle(sessionId);
  if (!bundle) throw new HttpError(404, "session_not_found", `No PaperTrail session exists for ${sessionId}.`);
  writeJson(response, 200, safeBundle(bundle, context));
}

async function runInBackground(context, sessionId, session, options, controller, owner) {
  try {
    await context.runInvestigationImpl({
      store: context.store,
      sessionId,
      question: session.question,
      options,
      providers: context.providers,
      groq: context.getGroq(),
      signal: controller.signal,
      now: context.now,
      runOwner: owner,
    });
  } catch (error) {
    const current = context.store.getSession(sessionId);
    let ownsRun = true;
    if (typeof context.store.assertRunOwner === "function") {
      try {
        ownsRun = context.store.assertRunOwner(sessionId, owner) === true;
      } catch {
        ownsRun = false;
      }
    }
    if (current && !isTerminalStatus(current.status) && ownsRun) {
      const status = current.cancelRequested || controller.signal.aborted ? "CANCELLED" : "FAILED";
      const errorPayload = {
        stage: "api_run",
        code: String(error?.code ?? error?.status ?? "RUN_FAILED").slice(0, 100),
        status: String(error?.status ?? "error").slice(0, 100),
        message: redactText(error?.message ?? "The investigation failed.", context),
      };
      try {
        const ownedOptions = owner === undefined ? {} : { runOwner: owner };
        context.store.addEvent(sessionId, "error", errorPayload, ownedOptions);
        if (typeof context.store.finalizeSession === "function") {
          context.store.finalizeSession(sessionId, status, { stage: "finished" }, ownedOptions);
        } else {
          context.store.updateSession(sessionId, { status }, ownedOptions);
          context.store.addEvent(sessionId, "stage_change", { stage: "finished", status }, ownedOptions);
        }
      } catch {
        // The orchestrator owns normal persistence; this is only a safe rejection fallback.
      }
    }
  } finally {
    const entry = context.runningSessions.get(sessionId);
    if (entry?.heartbeatTimer) clearInterval(entry.heartbeatTimer);
    try {
      context.store.releaseRun?.(sessionId, owner);
    } catch {
      // Preserve the completed or failed session if lease cleanup is unavailable.
    }
    context.runningSessions.delete(sessionId);
  }
}

async function handleRun(request, response, context, sessionId) {
  if (request.method !== "POST") throw allowMethod(["POST"]);
  context.store.reconcileInterruptedRuns?.();
  const session = sessionOr404(context, sessionId);
  const body = await readJsonBody(request, context, { optional: true, invalidCode: "invalid_run_options" });
  const options = pickRunOptions(body);
  if (context.runningSessions.has(sessionId) || String(session.status).toUpperCase() === "RUNNING") {
    throw new HttpError(409, "run_already_running", "A PaperTrail investigation is already running for this session.");
  }
  if (session.cancelRequested) {
    throw new HttpError(409, "cancellation_requested", "This session has already requested cancellation and cannot be started again.");
  }
  if (isTerminalStatus(session.status)) {
    throw new HttpError(409, "session_terminal", "This PaperTrail session is terminal. Start a new live investigation instead of mixing runs in the same evidence bundle.");
  }

  const controller = new AbortController();
  const owner = context.runOwner;
  const entry = { controller, owner, startedAt: context.now(), completion: null, heartbeatTimer: null };
  context.runningSessions.set(sessionId, entry);
  let runningSession;
  try {
    runningSession = typeof context.store.claimRun === "function"
      ? context.store.claimRun(sessionId, owner, context.runLeaseMs)
      : context.store.updateSession(sessionId, { status: "RUNNING" });
    if (!runningSession) {
      const current = sessionOr404(context, sessionId);
      if (String(current.status).toUpperCase() === "RUNNING") throw new HttpError(409, "run_already_running", "A PaperTrail investigation is already running for this session.");
      if (current.cancelRequested) throw new HttpError(409, "cancellation_requested", "This session has already requested cancellation and cannot be started again.");
      if (isTerminalStatus(current.status)) throw new HttpError(409, "session_terminal", "This PaperTrail session is terminal. Start a new live investigation instead of mixing runs in the same evidence bundle.");
      throw new HttpError(409, "run_claim_failed", "The PaperTrail API could not claim this session for a new run.");
    }
  } catch (error) {
    context.runningSessions.delete(sessionId);
    throw error;
  }
  if (typeof context.store.heartbeatRun === "function") {
    entry.heartbeatTimer = setInterval(() => {
      try {
        if (!context.store.heartbeatRun(sessionId, owner, context.runLeaseMs)) controller.abort();
      } catch {
        controller.abort();
      }
    }, context.runHeartbeatMs);
    entry.heartbeatTimer.unref?.();
  }
  entry.completion = runInBackground(context, sessionId, runningSession, options, controller, owner);
  writeJson(response, 202, safeSession(runningSession, context));
}

async function handleEvents(request, response, context, sessionId, url) {
  if (request.method !== "GET") throw allowMethod(["GET"]);
  context.store.reconcileInterruptedRuns?.();
  const session = sessionOr404(context, sessionId);
  const after = queryInteger(url, "after", { minimum: 0, maximum: Number.MAX_SAFE_INTEGER, defaultValue: 0 });
  const pollMs = context.ssePollMs;
  const lifetimeMs = context.sseMaxLifetimeMs;
  let lastEventId = after;
  let closed = false;
  let polling = false;
  let interval;
  let lifetimeTimer;

  const cleanup = () => {
    if (interval) clearInterval(interval);
    if (lifetimeTimer) clearTimeout(lifetimeTimer);
    interval = undefined;
    lifetimeTimer = undefined;
  };
  const close = () => {
    if (closed) return;
    closed = true;
    cleanup();
    if (!response.writableEnded && !response.destroyed) response.end();
  };
  const sendEvent = (event) => {
    if (closed || !event) return;
    const id = Number(event.id);
    if (Number.isSafeInteger(id)) lastEventId = Math.max(lastEventId, id);
    const type = String(event.type ?? "message").replace(/[\r\n]/g, "_");
    const payload = JSON.stringify(safeBundle(event, context));
    try {
      if (Number.isSafeInteger(id)) response.write(`id: ${id}\n`);
      response.write(`event: ${type}\ndata: ${payload}\n\n`);
    } catch {
      close();
    }
  };
  const poll = async () => {
    if (closed || polling) return;
    polling = true;
    try {
      context.store.reconcileInterruptedRuns?.();
      const current = context.store.getSession(sessionId);
      if (!current) {
        close();
        return;
      }
      for (const event of context.store.listEvents(sessionId, lastEventId)) sendEvent(event);
      if (isTerminalStatus(current.status)) close();
    } catch {
      close();
    } finally {
      polling = false;
    }
  };

  applyCors(response, request, context);
  response.statusCode = 200;
  response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  if (typeof response.flushHeaders === "function") response.flushHeaders();
  response.once("close", () => {
    closed = true;
    cleanup();
  });
  request.once("aborted", close);

  for (const event of context.store.listEvents(sessionId, lastEventId)) sendEvent(event);
  if (isTerminalStatus(session.status)) {
    close();
    return;
  }
  interval = setInterval(() => void poll(), pollMs);
  lifetimeTimer = setTimeout(close, lifetimeMs);
}

function routePattern() {
  const escapedPrefix = API_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapedPrefix}/sessions/([^/]+)(?:/(run|events|cancel))?$`);
}

const SESSION_ROUTE_PATTERN = routePattern();

async function routeRequest(request, response, context) {
  let url;
  try {
    url = new URL(request.url ?? "/", "http://127.0.0.1");
  } catch {
    throw new HttpError(400, "invalid_request_url", "The request URL is invalid.");
  }

  if (request.method === "OPTIONS") {
    if (!context.origin) throw new HttpError(404, "not_found", "The requested PaperTrail API route does not exist.");
    if (!corsAllowed(request, context)) throw new HttpError(403, "cors_origin_not_allowed", "The request Origin is not configured for this local API.");
    response.statusCode = 204;
    response.setHeader("Access-Control-Allow-Origin", context.origin);
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type");
    response.setHeader("Access-Control-Max-Age", "300");
    response.setHeader("Vary", "Origin");
    response.end();
    return;
  }

  if (context.origin && request.headers.origin && request.headers.origin !== context.origin) {
    throw new HttpError(403, "cors_origin_not_allowed", "The request Origin is not configured for this local API.");
  }
  authorizeRequest(request, context);
  applyCors(response, request, context);
  if (url.pathname === `${API_PREFIX}/health`) {
    if (request.method !== "GET") throw allowMethod(["GET"]);
    await handleHealth(request, response, context);
    return;
  }
  if (url.pathname === `${API_PREFIX}/models`) {
    if (request.method !== "GET") throw allowMethod(["GET"]);
    await handleModels(request, response, context);
    return;
  }
  if (url.pathname === `${API_PREFIX}/sessions`) {
    await handleSessionsCollection(request, response, context, url);
    return;
  }

  const match = SESSION_ROUTE_PATTERN.exec(url.pathname);
  if (!match) throw new HttpError(404, "not_found", "The requested PaperTrail API route does not exist.");
  const sessionId = decodeSessionId(match[1]);
  const action = match[2];
  if (!action) {
    await handleSession(request, response, context, sessionId);
    return;
  }
  if (action === "run") {
    await handleRun(request, response, context, sessionId);
    return;
  }
  if (action === "events") {
    await handleEvents(request, response, context, sessionId, url);
    return;
  }
  if (action === "cancel") {
    if (request.method !== "POST") throw allowMethod(["POST"]);
    const current = sessionOr404(context, sessionId);
    if (String(current.status).toUpperCase() !== "RUNNING") {
      throw new HttpError(409, "session_not_running", "Cancellation can only be requested while a PaperTrail investigation is running.");
    }
    const updated = context.store.requestCancel(sessionId);
    if (String(updated?.status).toUpperCase() !== "RUNNING") {
      throw new HttpError(409, "session_not_running", "Cancellation can only be requested while a PaperTrail investigation is running.");
    }
    context.runningSessions.get(sessionId)?.controller.abort();
    writeJson(response, 202, safeSession(updated, context));
    return;
  }
  throw new HttpError(404, "not_found", "The requested PaperTrail API route does not exist.");
}

/** Handle one request with an injectable runtime context for network-free tests. */
export async function handleRequest(request, response, context) {
  const runtime = context?.[CONTEXT_MARKER] ? context : createContext(context ?? {});
  applyCors(response, request, runtime);
  try {
    await routeRequest(request, response, runtime);
  } catch (error) {
    writeError(response, error, runtime);
  }
}

function createContext(options = {}) {
  const now = typeof options.now === "function" ? options.now : () => new Date().toISOString();
  const dbPath = options.dbPath ?? DEFAULT_DB_PATH;
  const ownsStore = !options.store;
  const store = options.store ?? createPaperTrailStore({ dbPath, now });
  const host = options.host ?? DEFAULT_HOST;
  const port = portValue(options.port ?? DEFAULT_PORT);
  const origin = normalizeOrigin(options.origin);
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const ssePollMs = options.ssePollMs ?? DEFAULT_SSE_POLL_MS;
  const sseMaxLifetimeMs = options.sseMaxLifetimeMs ?? DEFAULT_SSE_MAX_LIFETIME_MS;
  const runLeaseMs = options.runLeaseMs ?? DEFAULT_RUN_LEASE_MS;
  const runHeartbeatMs = options.runHeartbeatMs ?? DEFAULT_RUN_HEARTBEAT_MS;
  const runOwner = options.runOwner === undefined ? randomUUID() : String(options.runOwner).trim();
  positiveInteger(maxBodyBytes, "maxBodyBytes");
  positiveInteger(ssePollMs, "ssePollMs");
  positiveInteger(sseMaxLifetimeMs, "sseMaxLifetimeMs");
  if (!Number.isInteger(runLeaseMs) || runLeaseMs < 1_000 || runLeaseMs > 24 * 60 * 60 * 1_000) throw new TypeError("runLeaseMs must be an integer from 1000 through 86400000");
  if (!Number.isInteger(runHeartbeatMs) || runHeartbeatMs < 250 || runHeartbeatMs >= runLeaseMs) throw new TypeError("runHeartbeatMs must be an integer from 250 through runLeaseMs - 1");
  if (!runOwner || runOwner.length > 256) throw new TypeError("runOwner must be a non-empty string of at most 256 characters");
  if (typeof host !== "string" || host.trim().length === 0) throw new TypeError("host must be a non-empty string");
  const apiToken = typeof (options.apiToken ?? process.env?.PAPERTRAIL_API_TOKEN) === "string"
    ? String(options.apiToken ?? process.env.PAPERTRAIL_API_TOKEN).trim()
    : "";
  if (!isLoopbackHost(host) && !apiToken) {
    throw new TypeError("PaperTrail API refuses non-loopback binding without PAPERTRAIL_API_TOKEN or apiToken.");
  }
  if (typeof store?.getSession !== "function" || typeof store?.createSession !== "function") {
    throw new TypeError("store must be a PaperTrail store");
  }
  const runInvestigationImpl = options.runInvestigationImpl ?? runInvestigation;
  if (typeof runInvestigationImpl !== "function") throw new TypeError("runInvestigationImpl must be a function");
  const providers = options.providers ?? createLiteratureProviders();
  const groqInput = options.groq;
  const groqFactory = options.groqFactory ?? createGroqClient;
  if (typeof groqFactory !== "function") throw new TypeError("groqFactory must be a function");
  const runningSessions = new Map();
  const context = {
    [CONTEXT_MARKER]: true,
    store,
    ownsStore,
    dbPath,
    host,
    port,
    origin,
    maxBodyBytes,
    ssePollMs,
    sseMaxLifetimeMs,
    runLeaseMs,
    runHeartbeatMs,
    runOwner,
    now,
    providers,
    runInvestigationImpl,
    runningSessions,
    secretValues: collectSecretValues(options),
    apiToken,
    server: null,
    groqInput,
    groqFactory,
    groqClient: null,
    groqInitError: null,
    getGroq() {
      if (context.groqClient || context.groqInitError) return context.groqClient;
      try {
        context.groqClient = groqClientLike(groqInput) ? groqInput : groqFactory(isObject(groqInput) ? groqInput : {});
      } catch (error) {
        context.groqInitError = error;
      }
      return context.groqClient;
    },
    groqConfigured() {
      const direct = groqInput;
      const client = context.groqClient;
      if (typeof client?.configured === "boolean") return client.configured;
      if (typeof direct?.configured === "boolean") return direct.configured;
      if (typeof direct?.apiKey === "string") return direct.apiKey.length > 0;
      if (typeof direct?.groqApiKey === "string") return direct.groqApiKey.length > 0;
      return typeof process.env?.GROQ_API_KEY === "string" && process.env.GROQ_API_KEY.length > 0;
    },
    groqModel() {
      const client = context.groqClient;
      const direct = groqInput;
      return modelName(client?.model ?? direct?.model ?? process.env?.GROQ_MODEL, DEFAULT_GROQ_MODEL);
    },
  };
  return context;
}

function createListeningPromise(server, port, host) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const onError = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    server.once("error", onError);
    server.listen(port, host, () => {
      if (settled) return;
      settled = true;
      server.off("error", onError);
      resolve();
    });
  });
}

export function createPaperTrailApiServer(options = {}) {
  const context = createContext(options);
  const server = http.createServer((request, response) => {
    void handleRequest(request, response, context);
  });
  context.server = server;
  let closePromise;
  const api = {
    server,
    address: () => server.address(),
    runningSessions: context.runningSessions,
    reconcileInterruptedRuns: () => context.store.reconcileInterruptedRuns?.() ?? [],
    async close() {
      if (closePromise) return closePromise;
      for (const entry of context.runningSessions.values()) entry.controller.abort();
      const completions = [...context.runningSessions.values()]
        .map((entry) => entry.completion)
        .filter((completion) => completion && typeof completion.then === "function");
      closePromise = (async () => {
        if (completions.length > 0) {
          await Promise.race([
            Promise.allSettled(completions),
            new Promise((resolve) => setTimeout(resolve, 5_000)),
          ]);
        }
        await new Promise((resolve, reject) => {
        const finish = () => {
          try {
            if (context.ownsStore) context.store.close();
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        if (!server.listening) {
          finish();
          return;
          }
          server.close((error) => {
          if (error && error.code !== "ERR_SERVER_NOT_RUNNING") {
            reject(error);
            return;
          }
          finish();
        });
        });
      })();
      return closePromise;
    },
  };
  return api;
}

export async function startPaperTrailApiServer(options = {}) {
  const api = createPaperTrailApiServer(options);
  const host = options.host ?? DEFAULT_HOST;
  const port = portValue(options.port ?? DEFAULT_PORT);
  try {
    await createListeningPromise(api.server, port, host);
    api.reconcileInterruptedRuns();
    return api;
  } catch (error) {
    await api.close().catch(() => {});
    throw error;
  }
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  const host = process.env.PAPERTRAIL_HOST || process.env.HOST || DEFAULT_HOST;
  let port;
  try {
    port = portValue(process.env.PAPERTRAIL_PORT ?? process.env.PORT ?? DEFAULT_PORT);
  } catch {
    console.error("[papertrail] PORT must be an integer from 0 through 65535.");
    process.exitCode = 1;
  }
  if (port !== undefined) {
    startPaperTrailApiServer({
      host,
      port,
      origin: process.env.PAPERTRAIL_ORIGIN || undefined,
      dbPath: process.env.PAPERTRAIL_DB_PATH || DEFAULT_DB_PATH,
      apiToken: process.env.PAPERTRAIL_API_TOKEN || undefined,
    }).then((api) => {
      const address = api.address();
      const printableHost = typeof address === "object" && address ? address.address : host;
      const printablePort = typeof address === "object" && address ? address.port : port;
      console.log(`[papertrail] API listening on http://${printableHost}:${printablePort}${API_PREFIX}`);
      let shuttingDown = false;
      const shutdown = () => {
        if (shuttingDown) return;
        shuttingDown = true;
        void api.close().then(() => process.exit(0), () => process.exit(1));
      };
      process.once("SIGINT", shutdown);
      process.once("SIGTERM", shutdown);
    }).catch(() => {
      console.error("[papertrail] API could not start.");
      process.exitCode = 1;
    });
  }
}
