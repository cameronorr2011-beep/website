import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createPaperTrailStore } from "../server/papertrail/db.mjs";
import { runInvestigation } from "../server/papertrail/orchestrator.mjs";
import { normalizeCrossrefRecord } from "../server/papertrail/literature.mjs";

const SOURCE = normalizeCrossrefRecord({
  DOI: "10.5555/papertrail-test",
  title: ["Provider-backed test source"],
  author: [{ family: "Researcher" }],
  issued: { "date-parts": [[2025, 4, 5]] },
  abstract: "A provider abstract used only by the network-free orchestration test.",
  URL: "https://doi.org/10.5555/papertrail-test",
}, { retrievedAt: "2026-10-14T00:00:00.000Z" });

function trace(text, status = "ai_interpretation") {
  return { text, sourceIds: [SOURCE.id], epistemicStatus: status };
}

function outputFor(role) {
  if (role === "investigator") {
    return { role, headline: "Initial source read", summary: "The source reports a bounded comparison.", sourceIds: [SOURCE.id], findings: [trace("The provider abstract reports a comparison under defined conditions.", "reported_finding")] };
  }
  if (role === "skeptic") {
    return { role, headline: "Challenge", summary: "The abstract does not establish universal causality.", sourceIds: [SOURCE.id], challenges: [trace("The result should not be generalized beyond the reported conditions.")] };
  }
  if (role === "experimentalist") {
    return { role, headline: "Methods review", summary: "Additional controls are needed to isolate the proposed effect.", sourceIds: [SOURCE.id], proposedTests: [trace("A replicated design with controlled temperature and density would test the alternative explanation.", "hypothesis")] };
  }
  if (role === "rebuttal") {
    return { role, headline: "Bounded response", summary: "The original interpretation is narrowed.", sourceIds: [SOURCE.id], rebuttals: [trace("The source supports only a qualified, condition-specific statement.")] };
  }
  return {
    role: "adjudicator",
    headline: "Adjudicated synthesis",
    summary: "The evidence supports a qualified interpretation and leaves transfer unresolved.",
    sourceIds: [SOURCE.id],
    decision: trace("Adopt the qualified interpretation; the broader claim remains unresolved."),
    report: {
      id: "report-orchestration-test",
      title: "Network-free orchestration report",
      executiveSummary: "A qualified source-grounded test report.",
      summarySourceIds: [SOURCE.id],
      sourceIds: [SOURCE.id],
      epistemicStatus: "ai_interpretation",
      sections: [{ heading: "Assessment", text: "The source supports a qualified interpretation.", sourceIds: [SOURCE.id], epistemicStatus: "ai_interpretation" }],
      findings: [{ title: "Bounded finding", text: "The source reports a condition-specific comparison.", sourceIds: [SOURCE.id], epistemicStatus: "reported_finding" }],
      limitations: ["Transfer to another organism remains unresolved."],
    },
  };
}

function makeProviders(records = [SOURCE]) {
  return { pubmed: { search: async () => ({ records, warnings: [], status: records.length ? "ok" : "empty" }) } };
}

async function withStore(test) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "papertrail-orchestrator-"));
  const store = createPaperTrailStore({ dbPath: path.join(directory, "papertrail.sqlite") });
  try {
    await test(store);
  } finally {
    store.close();
    await rm(directory, { recursive: true, force: true });
  }
}

async function testCompleteBoundedFlow() {
  await withStore(async (store) => {
    store.createSession({ id: "orchestration-complete", question: "Does this evidence support the claim?" });
    const groq = { model: "test/mock-model", async generateStructured({ agentId }) { return outputFor(agentId); } };
    const bundle = await runInvestigation({
      store,
      sessionId: "orchestration-complete",
      providers: makeProviders(),
      groq,
      options: { providers: ["pubmed"], maxResults: 3, maxQueries: 1, debateRounds: 2 },
    });
    assert.equal(bundle.session.status, "COMPLETED");
    assert.equal(bundle.sources.length, 1);
    assert.ok(bundle.agentRuns.some((run) => run.role === "investigator"));
    assert.ok(bundle.agentRuns.some((run) => run.role === "skeptic"));
    assert.ok(bundle.agentRuns.some((run) => run.role === "experimentalist"));
    assert.ok(bundle.agentRuns.some((run) => run.role === "adjudicator"));
    assert.equal(bundle.agentRuns.find((run) => run.role === "investigator").input.promptVersion, "papertrail-agents-v1");
    assert.ok(bundle.agentRuns.filter((run) => run.role === "rebuttal").length <= 2);
    assert.ok(bundle.claims.length > 0);
    assert.equal(bundle.audit.valid, true);
    assert.ok(bundle.events.some((event) => event.type === "source_retrieval"));
    assert.ok(bundle.events.some((event) => event.type === "audit"));
    assert.ok(bundle.events.some((event) => event.type === "report"));
    assert.equal(bundle.events.at(-1).payload.stage, "finished");
    assert.equal(bundle.report.sections[0].sourceIds[0], SOURCE.id);
  });
}

async function testEmptySourcesAndMalformedAgent() {
  await withStore(async (store) => {
    store.createSession({ id: "orchestration-empty", question: "No sources?" });
    let called = false;
    const empty = await runInvestigation({
      store,
      sessionId: "orchestration-empty",
      providers: makeProviders([]),
      groq: { async generateStructured() { called = true; return outputFor("investigator"); } },
      options: { providers: ["pubmed"], maxQueries: 1 },
    });
    assert.equal(empty.session.status, "PARTIAL");
    assert.equal(called, false, "agents must not run without verified sources");
    assert.equal(empty.agentRuns.length, 0);
    assert.equal(empty.report.epistemicStatus, "unresolved");

    store.createSession({ id: "orchestration-malformed", question: "Malformed agent?" });
    const malformed = await runInvestigation({
      store,
      sessionId: "orchestration-malformed",
      providers: makeProviders(),
      groq: { model: "test/mock-model", async generateStructured({ agentId }) { return agentId === "skeptic" ? null : outputFor(agentId); } },
      options: { providers: ["pubmed"], maxQueries: 1, debateRounds: 1 },
    });
    assert.equal(malformed.session.status, "PARTIAL");
    assert.ok(malformed.agentRuns.some((run) => run.role === "skeptic" && run.status === "failed"));
    assert.ok(malformed.events.some((event) => event.type === "agent_error"));
    assert.ok(malformed.report, "a malformed agent must produce an honest partial report");

    store.createSession({ id: "orchestration-invalid-citation", question: "Invalid citation?" });
    const invalidCitation = await runInvestigation({
      store,
      sessionId: "orchestration-invalid-citation",
      providers: makeProviders(),
      groq: {
        model: "test/mock-model",
        async generateStructured({ agentId }) {
          const output = outputFor(agentId);
          if (agentId === "investigator") {
            output.sourceIds = ["missing-source"];
            output.findings[0].sourceIds = ["missing-source"];
          }
          return output;
        },
      },
      options: { providers: ["pubmed"], maxQueries: 1, debateRounds: 1 },
    });
    assert.equal(invalidCitation.session.status, "PARTIAL");
    assert.equal(invalidCitation.audit.valid, false);
    assert.ok(invalidCitation.audit.unknownSourceIds.includes("missing-source"));

    store.createSession({ id: "orchestration-cancelled", question: "Cancelled before retrieval?" });
    const controller = new AbortController();
    controller.abort();
    const cancelled = await runInvestigation({
      store,
      sessionId: "orchestration-cancelled",
      signal: controller.signal,
      providers: makeProviders(),
      options: { providers: ["pubmed"], maxQueries: 1 },
    });
    assert.equal(cancelled.session.status, "CANCELLED");
    assert.equal(cancelled.debate.status, "cancelled");
    assert.ok(cancelled.report, "a cancelled run must preserve a partial report");
    assert.equal(cancelled.events.at(-1).payload.stage, "finished");
  });
}

async function testRunOwnershipFence() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "papertrail-ownership-"));
  const dbPath = path.join(directory, "papertrail.sqlite");
  let clock = new Date("2026-10-15T00:00:00.000Z");
  let recoveryStore;
  let releaseSearch;
  let searchStarted;
  const searchReady = new Promise((resolve) => { searchStarted = resolve; });
  const store = createPaperTrailStore({ dbPath, now: () => clock });
  try {
    store.createSession({ id: "ownership-fence", question: "Can a stale worker write after recovery?" });
    assert.equal(store.claimRun("ownership-fence", "owner-a", 1_000).status, "RUNNING");
    const running = runInvestigation({
      store,
      sessionId: "ownership-fence",
      runOwner: "owner-a",
      providers: {
        pubmed: {
          search: async () => {
            searchStarted();
            await new Promise((resolve) => { releaseSearch = resolve; });
            return { records: [SOURCE], warnings: [], status: "ok" };
          },
        },
      },
      options: { providers: ["pubmed"], maxQueries: 1 },
      groq: { model: "test/mock-model" },
    });
    await searchReady;

    clock = new Date("2026-10-15T00:00:02.000Z");
    recoveryStore = createPaperTrailStore({ dbPath, now: () => clock });
    const recovered = recoveryStore.reconcileInterruptedRuns();
    assert.equal(recovered.length, 1);
    assert.equal(recovered[0].status, "PARTIAL");
    releaseSearch();

    const bundle = await running;
    assert.equal(bundle.session.status, "PARTIAL");
    assert.equal(bundle.sources.length, 0, "the stale worker must not persist sources after recovery");
    assert.equal(bundle.events.at(-1).type, "run_interrupted");
    assert.equal(bundle.events.some((event) => event.type === "report"), false);
  } finally {
    recoveryStore?.close();
    store.close();
    await rm(directory, { recursive: true, force: true });
  }
}

await testCompleteBoundedFlow();
await testEmptySourcesAndMalformedAgent();
await testRunOwnershipFence();
console.log("PaperTrail orchestrator tests passed: bounded multi-agent flow, citation audit, empty sources, malformed agent handling, and stale-worker ownership fencing.");
