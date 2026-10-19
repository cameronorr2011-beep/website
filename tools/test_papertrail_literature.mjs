import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  ReportSchema,
  SourceRecordSchema,
  sanitizeReportCitations,
  validateCitationAudit,
} from "../server/papertrail/schemas.mjs";
import { createPaperTrailStore } from "../server/papertrail/db.mjs";
import {
  buildSearchQueries,
  createLiteratureProviders,
  dedupeSources,
  normalizeCrossrefRecord,
  normalizePubMedRecord,
  retrieveSources,
} from "../server/papertrail/literature.mjs";

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 400,
    status,
    async json() {
      return data;
    },
    async text() {
      return typeof data === "string" ? data : JSON.stringify(data);
    },
  };
}

async function testProviderNormalizationAndRetrieval() {
  const pubmed = normalizePubMedRecord({
    uid: "12345",
    title: "Light & algae response",
    authors: [{ name: "A. Researcher" }],
    pubdate: "2024 Jan 12",
    abstract: "A provider abstract.",
    articleids: [{ idtype: "doi", value: "doi:10.1000/ABC" }],
    pmc: "PMC123",
  }, { retrievedAt: "2026-10-14T00:00:00.000Z" });
  const crossref = normalizeCrossrefRecord({
    DOI: "10.1000/abc",
    title: ["Light & algae response"],
    author: [{ given: "A.", family: "Researcher" }],
    issued: { "date-parts": [[2024, 1, 12]] },
    abstract: "<jats:p>A Crossref abstract.</jats:p>",
    link: [{ URL: "https://example.test/article.pdf", "content-type": "application/pdf" }],
  }, { retrievedAt: "2026-10-14T00:00:00.000Z" });

  assert.equal(pubmed.metadataOrigin, "provider");
  assert.equal(pubmed.doi, "10.1000/abc");
  assert.equal(pubmed.pmid, "12345");
  assert.equal(pubmed.date, "2024-01-12");
  assert.equal(pubmed.fullTextAvailable, true);
  assert.equal(crossref.abstract, "A Crossref abstract.");
  assert.equal(crossref.fullTextAvailable, true);
  assert.equal(SourceRecordSchema.safeParse(pubmed).success, true);

  const merged = dedupeSources([pubmed, crossref]);
  assert.equal(merged.length, 1, "DOI duplicates should merge");
  assert.deepEqual(new Set(merged[0].providers), new Set(["pubmed", "crossref"]));
  assert.equal(merged[0].providerProvenance.length, 2);
  assert.equal(merged[0].providerMetadataByProvider.pubmed.uid, "12345");

  const calls = [];
  const fetchImpl = async (url) => {
    const text = String(url);
    calls.push(text);
    if (text.includes("esearch.fcgi")) return response({ esearchresult: { idlist: ["12345"] } });
    if (text.includes("esummary.fcgi")) return response({ result: {
      uids: ["12345"],
      "12345": {
        uid: "12345",
        title: "Light & algae response",
        authors: [{ name: "A. Researcher" }],
        pubdate: "2024 Jan 12",
        articleids: [{ idtype: "doi", value: "10.1000/abc" }],
      },
    } });
    if (text.includes("efetch.fcgi")) return response(`<?xml version="1.0"?><PubmedArticleSet><PubmedArticle><MedlineCitation><PMID>12345</PMID><Article><ArticleTitle>Light &amp; algae response</ArticleTitle><Abstract><AbstractText>Measured provider abstract.</AbstractText></Abstract><AuthorList><Author><ForeName>A.</ForeName><LastName>Researcher</LastName></Author></AuthorList><ArticleDate><Year>2024</Year><Month>01</Month><Day>12</Day></ArticleDate></Article></MedlineCitation><PubmedData><ArticleIdList><ArticleId IdType="doi">10.1000/abc</ArticleId><ArticleId IdType="pmc">PMC123</ArticleId></ArticleIdList></PubmedData></PubmedArticle></PubmedArticleSet>`);
    throw new Error(`unexpected URL ${text}`);
  };
  const providers = createLiteratureProviders({ fetchImpl, timeoutMs: 1000, userAgent: "test-agent" });
  const result = await retrieveSources({
    question: "microalgae light response",
    options: { providers: ["pubmed"], maxResults: 5 },
    providers,
  });
  assert.deepEqual(buildSearchQueries("  microalgae light response  ", { queryVariants: ["photobioreactor"] }), ["microalgae light response", "photobioreactor"]);
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].abstract, "Measured provider abstract.");
  assert.equal(result.providerStatuses.pubmed.status, "ok");
  assert.equal(calls.length, 3, "PubMed retrieval should use esearch, esummary, and efetch");
}

async function testEmptyAndMalformedProviders() {
  const emptyFetch = async (url) => String(url).includes("esearch.fcgi")
    ? response({ esearchresult: { idlist: [] } })
    : response({ message: { items: [] } });
  const emptyResult = await retrieveSources({
    question: "empty literature query",
    options: { providers: ["pubmed", "crossref"] },
    providers: createLiteratureProviders({ fetchImpl: emptyFetch, timeoutMs: 1000 }),
  });
  assert.deepEqual(emptyResult.sources, []);
  assert.equal(emptyResult.providerStatuses.pubmed.status, "empty");
  assert.equal(emptyResult.providerStatuses.crossref.status, "empty");

  const malformedFetch = async (url) => String(url).includes("esearch.fcgi")
    ? response({ nope: true })
    : response({ message: {} });
  const malformedResult = await retrieveSources({
    question: "malformed literature query",
    options: { providers: ["pubmed", "crossref"] },
    providers: createLiteratureProviders({ fetchImpl: malformedFetch, timeoutMs: 1000 }),
  });
  assert.deepEqual(malformedResult.sources, [], "malformed payloads must not become fabricated sources");
  assert.equal(malformedResult.providerStatuses.pubmed.status, "malformed");
  assert.equal(malformedResult.providerStatuses.crossref.status, "malformed");
  assert.ok(malformedResult.warnings.length >= 2);
}

async function testTimeoutAndProviderFailure() {
  const slowFetch = (_url, { signal }) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(response({})), 100);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      const error = new Error("aborted by test");
      error.name = "AbortError";
      reject(error);
    }, { once: true });
  });
  const builtIn = createLiteratureProviders({ fetchImpl: slowFetch, timeoutMs: 5 });
  const result = await retrieveSources({
    question: "timeout query",
    options: { providers: ["pubmed", "crossref"] },
    providers: {
      pubmed: builtIn.pubmed,
      crossref: { search: async () => { throw new Error("provider offline"); } },
    },
  });
  assert.deepEqual(result.sources, []);
  assert.equal(result.providerStatuses.pubmed.status, "timeout");
  assert.equal(result.providerStatuses.crossref.status, "error");
  assert.ok(result.warnings.some((warning) => warning.includes("timed out")));
  assert.ok(result.warnings.some((warning) => warning.includes("provider offline")));

  const controller = new AbortController();
  const cancellationFetch = async (_url, { signal }) => ({
    ok: true,
    status: 200,
    async json() {
      await new Promise((resolve, reject) => {
        if (signal.aborted) {
          const error = new Error("aborted by test");
          error.name = "AbortError";
          reject(error);
          return;
        }
        signal.addEventListener("abort", () => {
          const error = new Error("aborted by test");
          error.name = "AbortError";
          reject(error);
        }, { once: true });
      });
      return { esearchresult: { idlist: ["12345"] } };
    },
  });
  const cancellationProviders = createLiteratureProviders({ fetchImpl: cancellationFetch, timeoutMs: 1_000 });
  const cancelled = retrieveSources({
    question: "cancelled query",
    options: { providers: ["pubmed"], maxQueries: 1 },
    providers: cancellationProviders,
    signal: controller.signal,
  });
  await new Promise((resolve) => setTimeout(resolve, 5));
  controller.abort();
  await assert.rejects(cancelled, /cancelled|abort/i, "literature retrieval should propagate cancellation instead of returning a provider warning");
}

async function testCitationAudit() {
  const report = {
    id: "report-1",
    title: "Citation audit",
    sections: [{ heading: "Untraced section", text: "No source or status", sourceIds: [] }],
    findings: [{ id: "finding-1", text: "Unknown citation", sourceIds: ["missing-source"] }],
    claimIds: ["claim-1"],
  };
  const claims = [{ id: "claim-1", statement: "A claim", sourceIds: ["source-1"] }];
  const sources = [{ id: "source-1" }];
  const audit = validateCitationAudit(report, claims, sources);
  assert.equal(audit.valid, false);
  assert.ok(audit.errors.some((error) => error.code === "unknown_source_id"));
  assert.ok(audit.errors.some((error) => error.code === "missing_trace_or_epistemic_status"));

  const sanitized = sanitizeReportCitations(report, sources);
  assert.deepEqual(sanitized.findings[0].sourceIds, []);
  assert.equal(sanitized.findings[0].epistemicStatus, "unresolved");
  assert.equal(sanitized.sections[0].epistemicStatus, "unresolved");
  assert.equal(ReportSchema.safeParse(sanitized).success, true);
}

async function testSqlitePersistence() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "papertrail-literature-"));
  const dbPath = path.join(directory, "papertrail.sqlite");
  const now = () => "2026-10-14T00:00:00.000Z";
  const source = normalizeCrossrefRecord({
    DOI: "10.5555/persist",
    title: ["Persisted source"],
    author: [{ family: "Researcher" }],
    issued: { "date-parts": [[2025, 2, 3]] },
    URL: "https://doi.org/10.5555/persist",
  }, { retrievedAt: now() });

  try {
    const first = createPaperTrailStore({ dbPath, now });
    first.createSession({ id: "session-1", question: "Does persistence work?", options: { maxResults: 4 }, model: "test-model" });
    first.addEvent("session-1", "started", { source: "test" });
    first.upsertSources("session-1", [source]);
    first.createAgentRun({ id: "run-1", sessionId: "session-1", role: "investigator", input: { question: "q" } });
    first.finishAgentRun("run-1", { output: { findings: ["kept separate"] } });
    first.saveClaims("session-1", [{
      id: "claim-1",
      statement: "The source survives reload.",
      sourceIds: [source.id],
      evidenceIds: ["evidence-1"],
      evidencePassages: [{ id: "evidence-1", sourceId: source.id, text: "A persisted passage." }],
    }]);
    first.saveDebate("session-1", { disagreement: { text: "review" } });
    first.saveReport("session-1", {
      id: "report-1",
      title: "Persisted report",
      sections: [{ heading: "Finding", text: "The record reloads.", sourceIds: [source.id] }],
    }, { valid: true, errors: [] });
    first.requestCancel("session-1");
    assert.equal(first.isCancelRequested("session-1"), true);
    first.close();

    const second = createPaperTrailStore({ dbPath, now });
    const bundle = second.getSessionBundle("session-1");
    assert.equal(bundle.session.question, "Does persistence work?");
    assert.equal(bundle.sources.length, 1);
    assert.equal(bundle.sources[0].providerMetadata.DOI, "10.5555/persist");
    assert.equal(bundle.sources[0].metadataOrigin, "provider");
    assert.equal(bundle.agentRuns[0].output.findings[0], "kept separate");
    assert.equal(bundle.claims[0].id, "claim-1");
    assert.equal(bundle.evidence[0].text, "A persisted passage.");
    assert.equal(bundle.evidenceLinks[0].evidenceId, "evidence-1");
    assert.equal(bundle.debate.disagreement.text, "review");
    assert.equal(bundle.report.title, "Persisted report");
    assert.equal(bundle.audit.valid, true);
    assert.equal(bundle.session.cancelRequested, true);
    assert.equal(bundle.events.some((event) => event.type === "cancel_requested"), true);
    second.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

await testProviderNormalizationAndRetrieval();
await testEmptyAndMalformedProviders();
await testTimeoutAndProviderFailure();
await testCitationAudit();
await testSqlitePersistence();
console.log("PaperTrail literature tests passed.");
