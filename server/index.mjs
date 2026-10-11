import crypto from "node:crypto";
import http from "node:http";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = path.join(SERVER_DIR, "data");
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 8787;
export const MAX_BODY_BYTES = 64 * 1024;

const MAX_PLAYER_ID_LENGTH = 128;
const MAX_IDEMPOTENCY_KEY_LENGTH = 128;
const PLAYER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~-]{0,127}$/;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

function createStore(dataDir, maxBodyBytes) {
  const root = path.resolve(dataDir);
  return {
    dataDir: root,
    statesDir: path.join(root, "states"),
    eventsDir: path.join(root, "events"),
    maxBodyBytes,
    ready: null,
    locks: new Map(),
  };
}

function ensureDataDirectories(store) {
  if (!store.ready) {
    store.ready = Promise.all([
      mkdir(store.statesDir, { recursive: true }),
      mkdir(store.eventsDir, { recursive: true }),
    ]);
  }
  return store.ready;
}

async function readJsonFile(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeJsonFile(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  try {
    await rename(temporaryPath, filePath);
  } finally {
    await unlink(temporaryPath).catch(() => {});
  }
}

async function withLock(store, key, operation) {
  const previous = store.locks.get(key) ?? Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  store.locks.set(key, current);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (store.locks.get(key) === current) store.locks.delete(key);
  }
}

function sendJson(response, status, payload, extraHeaders = {}) {
  const body = `${JSON.stringify(payload)}\n`;
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  for (const [name, value] of Object.entries(extraHeaders)) response.setHeader(name, value);
  response.end(body);
}

function sendError(response, error) {
  if (response.headersSent) {
    response.destroy();
    return;
  }
  const status = error instanceof HttpError ? error.status : 500;
  const code = error instanceof HttpError ? error.code : "internal_error";
  const message = error instanceof HttpError ? error.message : "The local backend could not complete the request.";
  if (!(error instanceof HttpError)) console.error("[local backend] request failed", error);
  sendJson(response, status, { error: code, message });
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key");
  response.setHeader("Vary", "Origin");
  response.setHeader("X-Content-Type-Options", "nosniff");
}

function readRequestBody(request, maxBytes) {
  const declaredLength = Number(request.headers["content-length"]);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    request.resume();
    return Promise.reject(new HttpError(413, "payload_too_large", `Request bodies must not exceed ${maxBytes} bytes.`));
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let tooLarge = false;

    request.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        tooLarge = true;
      } else {
        chunks.push(chunk);
      }
    });
    request.on("end", () => {
      if (tooLarge) {
        reject(new HttpError(413, "payload_too_large", `Request bodies must not exceed ${maxBytes} bytes.`));
        return;
      }
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    request.on("aborted", () => reject(new HttpError(400, "request_aborted", "The request body was interrupted.")));
    request.on("error", (error) => reject(error));
  });
}

async function readJsonObject(request, store, invalidCode) {
  const rawBody = await readRequestBody(request, store.maxBodyBytes);
  let value;
  try {
    value = JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "invalid_json", "The request body must be valid JSON.");
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, invalidCode, "The request body must be a JSON object.");
  }
  return value;
}

function decodePlayerId(rawPlayerId) {
  let playerId;
  try {
    playerId = decodeURIComponent(rawPlayerId);
  } catch {
    throw new HttpError(400, "invalid_player_id", "The playerId path segment is not valid URL encoding.");
  }
  if (playerId.length === 0 || playerId.length > MAX_PLAYER_ID_LENGTH || !PLAYER_ID_PATTERN.test(playerId)) {
    throw new HttpError(400, "invalid_player_id", "playerId must be 1-128 URL-safe letters, numbers, or . _ ~ - characters.");
  }
  return playerId;
}

function statePath(store, playerId) {
  return path.join(store.statesDir, `${encodeURIComponent(playerId)}.json`);
}

function eventPath(store, idempotencyKey) {
  const digest = crypto.createHash("sha256").update(idempotencyKey).digest("hex");
  return path.join(store.eventsDir, `${digest}.json`);
}

function readIdempotencyKey(request) {
  const value = request.headers["idempotency-key"];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, "missing_idempotency_key", "POST /api/events requires an Idempotency-Key header.");
  }
  const key = value.trim();
  if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    throw new HttpError(400, "invalid_idempotency_key", `Idempotency-Key must not exceed ${MAX_IDEMPOTENCY_KEY_LENGTH} characters.`);
  }
  return key;
}

async function handleHealth(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "method_not_allowed", message: "Use GET for /health." }, { Allow: "GET" });
    return;
  }
  sendJson(response, 200, { ok: true, service: "orr-biologicals-local-game-backend" });
}

async function handleState(request, response, store, rawPlayerId) {
  const playerId = decodePlayerId(rawPlayerId);
  const filePath = statePath(store, playerId);

  if (request.method === "GET") {
    const record = await readJsonFile(filePath);
    if (!record) {
      sendJson(response, 404, { error: "state_not_found", message: `No saved state exists for playerId ${playerId}.` });
      return;
    }
    sendJson(response, 200, { ok: true, ...record });
    return;
  }

  if (request.method !== "PUT") {
    sendJson(response, 405, { error: "method_not_allowed", message: "Use GET or PUT for a player state." }, { Allow: "GET, PUT" });
    return;
  }

  const state = await readJsonObject(request, store, "invalid_state");
  const record = {
    playerId,
    state,
    updatedAt: new Date().toISOString(),
  };
  await withLock(store, filePath, () => writeJsonFile(filePath, record));
  sendJson(response, 200, { ok: true, ...record });
}

async function handleEvent(request, response, store) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "method_not_allowed", message: "Use POST for /api/events." }, { Allow: "POST" });
    return;
  }

  const idempotencyKey = readIdempotencyKey(request);
  const event = await readJsonObject(request, store, "invalid_event");
  const fingerprint = crypto.createHash("sha256").update(JSON.stringify(event)).digest("hex");
  const filePath = eventPath(store, idempotencyKey);

  const result = await withLock(store, filePath, async () => {
    const existing = await readJsonFile(filePath);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new HttpError(409, "idempotency_key_reused", "This Idempotency-Key was already used with a different event body.");
      }
      return {
        status: 200,
        payload: { ...existing.response, duplicate: true },
      };
    }

    const responsePayload = {
      ok: true,
      duplicate: false,
      eventId: crypto.randomUUID(),
      event,
      receivedAt: new Date().toISOString(),
    };
    await writeJsonFile(filePath, {
      version: 1,
      idempotencyKey,
      fingerprint,
      response: responsePayload,
    });
    return { status: 201, payload: responsePayload };
  });

  sendJson(response, result.status, result.payload);
}

export async function handleRequest(request, response, store) {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  try {
    await ensureDataDirectories(store);
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/health") {
      await handleHealth(request, response);
      return;
    }
    const stateMatch = /^\/api\/state\/([^/]+)$/.exec(url.pathname);
    if (stateMatch) {
      await handleState(request, response, store, stateMatch[1]);
      return;
    }
    if (url.pathname === "/api/events") {
      await handleEvent(request, response, store);
      return;
    }
    sendJson(response, 404, { error: "not_found", message: "The requested local backend route does not exist." });
  } catch (error) {
    sendError(response, error);
  }
}

const serverStores = new WeakMap();

export function createServer(options = {}) {
  const dataDir = options.dataDir ?? DATA_DIR;
  const maxBodyBytes = options.maxBodyBytes ?? MAX_BODY_BYTES;
  if (!Number.isInteger(maxBodyBytes) || maxBodyBytes < 1) {
    throw new TypeError("maxBodyBytes must be a positive integer");
  }
  const store = createStore(dataDir, maxBodyBytes);
  const server = http.createServer((request, response) => {
    void handleRequest(request, response, store);
  });
  serverStores.set(server, store);
  return server;
}

export function startServer(options = {}) {
  const server = createServer(options);
  const store = serverStores.get(server);
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  return new Promise((resolve, reject) => {
    let settled = false;
    const onError = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    server.once("error", onError);
    server.listen(port, host, async () => {
      try {
        await ensureDataDirectories(store);
        if (settled) return;
        settled = true;
        server.off("error", onError);
        resolve(server);
      } catch (error) {
        settled = true;
        server.off("error", onError);
        server.close(() => reject(error));
      }
    });
  });
}

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer from 0 through 65535.");
  }
  return port;
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  const host = process.env.HOST || DEFAULT_HOST;
  let port;
  try {
    port = parsePort(process.env.PORT ?? DEFAULT_PORT);
  } catch (error) {
    console.error(`[local backend] ${error.message}`);
    process.exitCode = 1;
  }

  if (port !== undefined) {
    startServer({ host, port }).then((server) => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      console.log(`[local backend] listening on http://${host}:${actualPort}`);
      const shutdown = () => server.close(() => process.exit(0));
      process.once("SIGINT", shutdown);
      process.once("SIGTERM", shutdown);
    }).catch((error) => {
      console.error(`[local backend] could not start: ${error.message}`);
      process.exitCode = 1;
    });
  }
}
