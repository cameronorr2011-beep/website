import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createPaperTrailStore } from "../server/papertrail/db.mjs";
import {
  API_PREFIX,
  startPaperTrailApiServer,
} from "../server/papertrail/index.mjs";

function request(baseUrl, pathname, options = {}) {
  const method = options.method ?? "GET";
  const body = options.body === undefined
    ? undefined
    : typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  const headers = { ...(options.headers ?? {}) };
  if (body !== undefined && !Object.keys(headers).some((name) => name.toLowerCase() === "content-length")) {
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  return new Promise((resolve, reject) => {
    const clientRequest = http.request(new URL(pathname, baseUrl), { method, headers }, (response) => {
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
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: parsedBody,
          rawBody,
        });
      });
    });
    clientRequest.on("error", reject);
    if (body !== undefined) clientRequest.write(body);
    clientRequest.end();
  });
}

function baseUrlFor(api) {
  const address = api.address();
  assert.equal(typeof address, "object");
  return `http://127.0.0.1:${address.port}`;
}

async function waitFor(predicate, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail("Timed out waiting for the PaperTrail API test condition.");
}

async function main() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "papertrail-api-test-"));
  const dbPath = path.join(tempDir, "papertrail.sqlite");
  const secret = "papertrail-test-secret-never-returned";
  let store;
  let api;
  let secondApi;
  let secondStore;
  let thirdApi;
  let thirdStore;

  const forceCalls = [];
  const groq = {
    apiKey: secret,
    configured: true,
    model: "test/model",
    async verifyModelAvailability(options) {
      forceCalls.push(options);
      return { status: "missing_key", model: "test/model", message: secret };
    },
  };

  const runWaiters = [];
  let runCalls = 0;
  const runInvestigationImpl = async ({ store: runStore, sessionId, signal }) => {
    runCalls += 1;
    let release;
    const waiting = new Promise((resolve) => {
      release = resolve;
    });
    runWaiters.push({ release: () => release(), signal });
    await waiting;
    const cancelled = signal.aborted || runStore.isCancelRequested(sessionId);
    runStore.addEvent(sessionId, "stage_change", { stage: "finished", status: cancelled ? "CANCELLED" : "COMPLETED" });
    runStore.updateSession(sessionId, { status: cancelled ? "CANCELLED" : "COMPLETED" });
    return runStore.getSessionBundle(sessionId);
  };

  try {
    store = createPaperTrailStore({ dbPath });
    await assert.rejects(
      () => startPaperTrailApiServer({ host: "0.0.0.0", port: 0, store, providers: {} }),
      /refuses non-loopback binding/i,
      "a non-loopback API must require an explicit server-side token",
    );
    api = await startPaperTrailApiServer({
      host: "127.0.0.1",
      port: 0,
      store,
      groq,
      providers: {},
      maxBodyBytes: 256,
      runInvestigationImpl,
    });
    const baseUrl = baseUrlFor(api);

    const health = await request(baseUrl, `${API_PREFIX}/health`);
    assert.equal(health.status, 200);
    assert.equal(health.body.service, "papertrail-api");
    assert.equal(health.body.status, "ok");
    assert.equal(health.body.groqConfigured, true);
    assert.equal(health.body.model, "test/model");
    assert.equal(health.body.apiBoundary.authentication, "none");
    assert.equal(health.body.apiBoundary.loopbackOnly, true);
    assert.equal(health.body.persistence.runtimeLocation, "outside_public_root");
    assert.equal(health.rawBody.includes(secret), false, "health must not expose GROQ_API_KEY");
    assert.equal(health.rawBody.includes("verifyModelAvailability"), false);

    const models = await request(baseUrl, `${API_PREFIX}/models`);
    assert.equal(models.status, 200);
    assert.equal(models.body.status, "missing_key");
    assert.equal(models.body.available, false);
    assert.equal(models.body.model, "test/model");
    assert.deepEqual(forceCalls, [{ force: true }]);
    assert.equal(models.rawBody.includes(secret), false, "model status must not expose GROQ_API_KEY");

    const malformed = await request(baseUrl, `${API_PREFIX}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not valid json",
    });
    assert.equal(malformed.status, 400);
    assert.equal(malformed.body.error, "invalid_json");

    const oversized = await request(baseUrl, `${API_PREFIX}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "x".repeat(257),
    });
    assert.equal(oversized.status, 413);
    assert.equal(oversized.body.error, "payload_too_large");

    const clientSecret = await request(baseUrl, `${API_PREFIX}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { question: "secret boundary", groqApiKey: secret },
    });
    assert.equal(clientSecret.status, 400);
    assert.equal(clientSecret.body.error, "server_secret_not_allowed");
    assert.equal(clientSecret.rawBody.includes(secret), false);

    const created = await request(baseUrl, `${API_PREFIX}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        id: "persistent-session",
        question: "How does light affect this culture?",
        options: { providers: ["pubmed"], maxResults: 1 },
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.id, "persistent-session");
    assert.equal(created.body.status, "new");
    assert.deepEqual(created.body.options.providers, ["pubmed"]);

    const listed = await request(baseUrl, `${API_PREFIX}/sessions?limit=1`);
    assert.equal(listed.status, 200);
    assert.equal(listed.body.sessions.length, 1);
    assert.equal(listed.body.sessions[0].id, "persistent-session");

    const invalidLimit = await request(baseUrl, `${API_PREFIX}/sessions?limit=0`);
    assert.equal(invalidLimit.status, 400);
    assert.equal(invalidLimit.body.error, "invalid_limit");

    const retrieved = await request(baseUrl, `${API_PREFIX}/sessions/persistent-session`);
    assert.equal(retrieved.status, 200);
    assert.equal(retrieved.body.session.id, "persistent-session");
    assert.deepEqual(retrieved.body.events, []);

    const missingRoute = await request(baseUrl, `${API_PREFIX}/does-not-exist`);
    assert.equal(missingRoute.status, 404);
    assert.equal(missingRoute.body.error, "not_found");

    const defaultCors = await request(baseUrl, `${API_PREFIX}/health`, {
      headers: { Origin: "http://127.0.0.1:8080" },
    });
    assert.equal(defaultCors.status, 200);
    assert.equal(defaultCors.headers["access-control-allow-origin"], undefined, "default API must not emit CORS");
    assert.equal(defaultCors.rawBody.includes("*") && defaultCors.headers["access-control-allow-origin"] === "*", false);

    const interruptedSession = await request(baseUrl, `${API_PREFIX}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { id: "interrupted-session", question: "Recover this interrupted question" },
    });
    assert.equal(interruptedSession.status, 201);
    store.updateSession("interrupted-session", { status: "RUNNING" });
    store.createAgentRun({ sessionId: "interrupted-session", role: "investigator" });
    store.addEvent("interrupted-session", "stage_change", { stage: "investigator", status: "RUNNING" });

    const cancelledInterruptedSession = await request(baseUrl, `${API_PREFIX}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { id: "cancelled-interrupted-session", question: "Recover this cancelled question" },
    });
    assert.equal(cancelledInterruptedSession.status, 201);
    store.updateSession("cancelled-interrupted-session", { status: "RUNNING" });
    store.createAgentRun({ sessionId: "cancelled-interrupted-session", role: "investigator" });
    store.requestCancel("cancelled-interrupted-session");

    const cancelledLeaseSession = await request(baseUrl, `${API_PREFIX}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { id: "cancelled-lease-session", question: "Stop renewing this cancelled lease" },
    });
    assert.equal(cancelledLeaseSession.status, 201);
    store.claimRun("cancelled-lease-session", "cancel-owner", 30_000);
    store.requestCancel("cancelled-lease-session");
    assert.equal(store.heartbeatRun("cancelled-lease-session", "cancel-owner", 30_000), false);
    store.releaseRun("cancelled-lease-session", "cancel-owner");

    await api.close();
    store.close();
    store = undefined;

    secondStore = createPaperTrailStore({ dbPath });
    secondApi = await startPaperTrailApiServer({
      host: "127.0.0.1",
      port: 0,
      store: secondStore,
      groq,
      providers: {},
      runInvestigationImpl,
      origin: "http://127.0.0.1:8080",
      ssePollMs: 20,
      sseMaxLifetimeMs: 1_000,
    });
    const secondBaseUrl = baseUrlFor(secondApi);

    const persisted = await request(secondBaseUrl, `${API_PREFIX}/sessions/persistent-session`);
    assert.equal(persisted.status, 200);
    assert.equal(persisted.body.session.question, "How does light affect this culture?");

    const recoveredInterrupted = await request(secondBaseUrl, `${API_PREFIX}/sessions/interrupted-session`);
    assert.equal(recoveredInterrupted.status, 200);
    assert.equal(recoveredInterrupted.body.session.status, "PARTIAL");
    assert.equal(recoveredInterrupted.body.events.some((event) => event.type === "stage_change"), true);
    const interruptedEvent = recoveredInterrupted.body.events.find((event) => event.type === "run_interrupted");
    assert.ok(interruptedEvent);
    assert.equal(interruptedEvent.payload.code, "RUN_INTERRUPTED");
    assert.equal(interruptedEvent.payload.status, "PARTIAL");
    assert.equal(recoveredInterrupted.body.agentRuns[0].status, "interrupted");
    assert.match(recoveredInterrupted.body.agentRuns[0].error, /restarted/i);
    assert.equal(secondStore.claimRun("interrupted-session", "should-not-reclaim"), null);

    const recoveredCancelled = await request(secondBaseUrl, `${API_PREFIX}/sessions/cancelled-interrupted-session`);
    assert.equal(recoveredCancelled.status, 200);
    assert.equal(recoveredCancelled.body.session.status, "CANCELLED");
    assert.equal(recoveredCancelled.body.session.cancelRequested, true);
    const cancelledEvent = recoveredCancelled.body.events.find((event) => event.type === "run_interrupted");
    assert.ok(cancelledEvent);
    assert.equal(cancelledEvent.payload.status, "CANCELLED");
    assert.equal(recoveredCancelled.body.agentRuns[0].status, "cancelled");

    const terminalRun = await request(secondBaseUrl, `${API_PREFIX}/sessions/interrupted-session/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {},
    });
    assert.equal(terminalRun.status, 409);
    assert.equal(terminalRun.body.error, "session_terminal");

    const preflight = await request(secondBaseUrl, `${API_PREFIX}/sessions`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://127.0.0.1:8080",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers["access-control-allow-origin"], "http://127.0.0.1:8080");
    assert.notEqual(preflight.headers["access-control-allow-origin"], "*");

    const forbiddenOrigin = await request(secondBaseUrl, `${API_PREFIX}/health`, {
      headers: { Origin: "https://untrusted.example" },
    });
    assert.equal(forbiddenOrigin.status, 403);
    assert.equal(forbiddenOrigin.body.error, "cors_origin_not_allowed");

    const runSession = await request(secondBaseUrl, `${API_PREFIX}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { id: "duplicate-run-session", question: "A bounded test question" },
    });
    assert.equal(runSession.status, 201);
    const firstRun = await request(secondBaseUrl, `${API_PREFIX}/sessions/duplicate-run-session/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { options: { maxResults: 1 } },
    });
    assert.equal(firstRun.status, 202);
    assert.equal(firstRun.body.status, "RUNNING");
    await waitFor(() => runWaiters.length === 1);
    assert.equal(secondApi.runningSessions.has("duplicate-run-session"), true);

    thirdStore = createPaperTrailStore({ dbPath });
    thirdApi = await startPaperTrailApiServer({
      host: "127.0.0.1",
      port: 0,
      store: thirdStore,
      providers: {},
      runInvestigationImpl,
    });
    const thirdBaseUrl = baseUrlFor(thirdApi);
    const activeAfterSecondStartup = await request(thirdBaseUrl, `${API_PREFIX}/sessions/duplicate-run-session`);
    assert.equal(activeAfterSecondStartup.status, 200);
    assert.equal(activeAfterSecondStartup.body.session.status, "RUNNING", "a fresh lease must not be recovered while another API worker is alive");
    const activeRetry = await request(thirdBaseUrl, `${API_PREFIX}/sessions/duplicate-run-session/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {},
    });
    assert.equal(activeRetry.status, 409);
    assert.equal(activeRetry.body.error, "run_already_running");
    await thirdApi.close();
    thirdApi = undefined;
    thirdStore.close();
    thirdStore = undefined;

    const duplicateRun = await request(secondBaseUrl, `${API_PREFIX}/sessions/duplicate-run-session/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {},
    });
    assert.equal(duplicateRun.status, 409);
    assert.equal(duplicateRun.body.error, "run_already_running");
    assert.equal(runCalls, 1);

    runWaiters[0].release();
    await waitFor(() => !secondApi.runningSessions.has("duplicate-run-session"));
    const completedRun = await request(secondBaseUrl, `${API_PREFIX}/sessions/duplicate-run-session`);
    assert.equal(completedRun.body.session.status, "COMPLETED");
    const cancelCompleted = await request(secondBaseUrl, `${API_PREFIX}/sessions/duplicate-run-session/cancel`, { method: "POST" });
    assert.equal(cancelCompleted.status, 409);
    assert.equal(cancelCompleted.body.error, "session_not_running");

    const cancelSession = await request(secondBaseUrl, `${API_PREFIX}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { id: "cancel-session", question: "A cancellable test question" },
    });
    assert.equal(cancelSession.status, 201);
    const startedCancel = await request(secondBaseUrl, `${API_PREFIX}/sessions/cancel-session/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    assert.equal(startedCancel.status, 202);
    await waitFor(() => runWaiters.length === 2);
    const cancelled = await request(secondBaseUrl, `${API_PREFIX}/sessions/cancel-session/cancel`, { method: "POST" });
    assert.equal(cancelled.status, 202);
    assert.equal(cancelled.body.cancelRequested, true);
    assert.equal(runWaiters[1].signal.aborted, true);
    runWaiters[1].release();
    await waitFor(() => !secondApi.runningSessions.has("cancel-session"));
    const cancelledBundle = await request(secondBaseUrl, `${API_PREFIX}/sessions/cancel-session`);
    assert.equal(cancelledBundle.body.session.status, "CANCELLED");
    assert.ok(cancelledBundle.body.events.some((event) => event.type === "cancel_requested"));

    const sseSession = await request(secondBaseUrl, `${API_PREFIX}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { id: "sse-session", question: "Replay this event" },
    });
    assert.equal(sseSession.status, 201);
    secondStore.addEvent("sse-session", "stage_change", { stage: "finished", status: "COMPLETED" });
    secondStore.updateSession("sse-session", { status: "COMPLETED" });
    const sse = await request(secondBaseUrl, `${API_PREFIX}/sessions/sse-session/events?after=0`);
    assert.equal(sse.status, 200);
    assert.equal(sse.headers["content-type"], "text/event-stream; charset=utf-8");
    assert.equal(sse.headers["x-accel-buffering"], "no");
    assert.match(sse.rawBody, /id: \d+\nevent: stage_change\ndata: /);
    const dataLine = sse.rawBody.split("\n").find((line) => line.startsWith("data: "));
    assert.ok(dataLine);
    assert.equal(JSON.parse(dataLine.slice("data: ".length)).type, "stage_change");

    console.log("papertrail API: health boundary, model classification, body limits, persistence, restart reconciliation, run locking, cancellation, 404s, CORS, and SSE replay passed");
  } finally {
    if (api) await api.close().catch(() => {});
    if (secondApi) await secondApi.close().catch(() => {});
    if (thirdApi) await thirdApi.close().catch(() => {});
    if (store) store.close();
    if (secondStore) secondStore.close();
    if (thirdStore) thirdStore.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

await main();
