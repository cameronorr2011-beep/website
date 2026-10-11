import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

import { MAX_BODY_BYTES, startServer } from "../server/index.mjs";

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

function requestJson(baseUrl, pathname, options = {}) {
  const method = options.method ?? "GET";
  const body = options.body === undefined
    ? undefined
    : typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  const headers = { ...(options.headers ?? {}) };
  if (body !== undefined && !Object.keys(headers).some((name) => name.toLowerCase() === "content-length")) {
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  return new Promise((resolve, reject) => {
    const request = http.request(new URL(pathname, baseUrl), { method, headers }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const rawBody = Buffer.concat(chunks).toString("utf8");
        let parsedBody = null;
        try {
          parsedBody = rawBody ? JSON.parse(rawBody) : null;
        } catch {
          parsedBody = rawBody;
        }
        resolve({ status: response.statusCode, body: parsedBody });
      });
    });
    request.on("error", reject);
    if (body !== undefined) request.write(body);
    request.end();
  });
}

const dataDir = await mkdtemp(path.join(os.tmpdir(), "orr-biologicals-server-"));
let server;

try {
  server = await startServer({ host: "127.0.0.1", port: 0, dataDir });
  const firstAddress = server.address();
  assert.equal(typeof firstAddress, "object");
  const baseUrl = `http://127.0.0.1:${firstAddress.port}`;

  const health = await requestJson(baseUrl, "/health");
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);

  const playerId = "server-test-player";
  const state = {
    version: 1,
    score: 42,
    inventory: ["sample", "nutrient"],
    nested: { checkpoint: "cyanoflow" },
  };
  const put = await requestJson(baseUrl, `/api/state/${playerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: state,
  });
  assert.equal(put.status, 200);
  assert.deepEqual(put.body.state, state);
  assert.equal(put.body.playerId, playerId);

  const immediateGet = await requestJson(baseUrl, `/api/state/${playerId}`);
  assert.equal(immediateGet.status, 200);
  assert.deepEqual(immediateGet.body.state, state);

  await closeServer(server);
  server = await startServer({ host: "127.0.0.1", port: 0, dataDir });
  const secondAddress = server.address();
  assert.equal(typeof secondAddress, "object");
  const restartedBaseUrl = `http://127.0.0.1:${secondAddress.port}`;
  const persistedGet = await requestJson(restartedBaseUrl, `/api/state/${playerId}`);
  assert.equal(persistedGet.status, 200);
  assert.deepEqual(persistedGet.body.state, state, "state must survive a server restart");

  const malformed = await requestJson(restartedBaseUrl, `/api/state/${playerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: "{not valid json",
  });
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.error, "invalid_json");

  const oversized = await requestJson(restartedBaseUrl, `/api/state/${playerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: { payload: "x".repeat(MAX_BODY_BYTES) },
  });
  assert.equal(oversized.status, 413);
  assert.equal(oversized.body.error, "payload_too_large");

  const event = { type: "sample-collected", playerId, sampleId: "sample-1" };
  const eventHeaders = {
    "Content-Type": "application/json",
    "Idempotency-Key": "server-test-event-1",
  };
  const firstEvent = await requestJson(restartedBaseUrl, "/api/events", {
    method: "POST",
    headers: eventHeaders,
    body: event,
  });
  assert.equal(firstEvent.status, 201);
  assert.equal(firstEvent.body.duplicate, false);
  assert.ok(firstEvent.body.eventId);

  const duplicateEvent = await requestJson(restartedBaseUrl, "/api/events", {
    method: "POST",
    headers: eventHeaders,
    body: event,
  });
  assert.equal(duplicateEvent.status, 200);
  assert.equal(duplicateEvent.body.duplicate, true);
  assert.equal(duplicateEvent.body.eventId, firstEvent.body.eventId);

  const conflictingEvent = await requestJson(restartedBaseUrl, "/api/events", {
    method: "POST",
    headers: eventHeaders,
    body: { ...event, sampleId: "sample-2" },
  });
  assert.equal(conflictingEvent.status, 409);
  assert.equal(conflictingEvent.body.error, "idempotency_key_reused");

  const missingKey = await requestJson(restartedBaseUrl, "/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: event,
  });
  assert.equal(missingKey.status, 400);
  assert.equal(missingKey.body.error, "missing_idempotency_key");

  console.log("server: health, persistent state round-trip, validation limits, and idempotent events passed");
} finally {
  if (server) await closeServer(server);
  await rm(dataDir, { recursive: true, force: true });
}
