import { createHash } from "node:crypto";

import { createGroqClient } from "./groq.mjs";
import {
  runAdjudicator,
  runExperimentalist,
  runInvestigator,
  runRebuttal,
  runSkeptic,
} from "./agents.mjs";
import { createLiteratureProviders, retrieveSources } from "./literature.mjs";
import {
  ClaimSchema,
  EPISTEMIC_STATUS_VALUES,
  EPISTEMIC_STATUSES,
  ReportSchema,
  ResearchOptionsSchema,
  SourceRecordSchema,
  sanitizeReportCitations,
  validateCitationAudit,
} from "./schemas.mjs";

export const MAX_DEBATE_ROUNDS = 2;

const EVENT_TYPES = Object.freeze({
  STAGE: "stage_change",
  AGENT_START: "agent_start",
  AGENT_COMPLETION: "agent_completion",
  AGENT_ERROR: "agent_error",
  RETRY: "retry",
  SOURCE_RETRIEVAL: "source_retrieval",
  AUDIT: "audit",
  REPORT: "report",
  ERROR: "error",
});

class CancellationError extends Error {
  constructor(stage) {
    super(`PaperTrail investigation cancelled during ${stage}`);
    this.name = "CancellationError";
    this.code = "CANCELLED";
    this.status = "cancelled";
    this.stage = stage;
  }
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function textValue(value) {
  if (!value || typeof value !== "object") return "";
  for (const key of ["text", "content", "statement", "claim", "detail", "observation", "summary", "headline", "executiveSummary"]) {
    if (typeof value[key] === "string" && value[key].trim()) return value[key].trim();
  }
  return "";
}

function truncate(value, limit = 4_000) {
  const text = String(value ?? "");
  return text.length <= limit ? text : `${text.slice(0, limit)}\n[truncated]`;
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim()))];
}

function sourceIdsOf(sources) {
  return new Set((Array.isArray(sources) ? sources : [])
    .map((source) => typeof source === "string" ? source : source?.id)
    .filter((id) => typeof id === "string" && id.length > 0));
}

function hashId(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 20);
}

function scrubSecretText(value) {
  return String(value ?? "")
    .replace(/bearer\s+[a-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/(groq[_-]?api[_-]?key|api[_-]?key|authorization|token|secret|password)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .slice(0, 1_500);
}

function errorInfo(error) {
  const status = error?.status ?? (error?.name === "TimeoutError" ? "timeout" : undefined);
  return {
    code: String(error?.code ?? status ?? "ERROR"),
    status: status ? String(status) : "error",
    httpStatus: Number.isFinite(error?.httpStatus) ? error.httpStatus : Number.isFinite(error?.statusCode) ? error.statusCode : undefined,
    name: String(error?.name ?? "Error"),
    message: scrubSecretText(error?.message ?? error),
  };
}

function isCancelledError(error) {
  return error instanceof CancellationError
    || error?.status === "cancelled"
    || error?.code === "CANCELLED"
    || error?.name === "AbortError";
}

function safeEventPayload(value) {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === "string") return scrubSecretText(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 512).map(safeEventPayload);
  if (typeof value === "object") {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      if (/^(?:groq[_-]?api[_-]?key|groqApiKey|api[_-]?key|authorization|token|secret|password)$/i.test(key)) continue;
      result[key] = safeEventPayload(child);
    }
    return result;
  }
  return String(value);
}

function redactBundle(value, depth = 0) {
  if (depth > 10 || value === null || value === undefined) return value;
  if (typeof value === "string") return scrubSecretText(value);
  if (Array.isArray(value)) return value.map((item) => redactBundle(item, depth + 1));
  if (typeof value !== "object") return value;
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (/^(?:groq[_-]?api[_-]?key|groqApiKey|api[_-]?key|authorization|token|secret|password)$/i.test(key)) continue;
    output[key] = redactBundle(child, depth + 1);
  }
  return output;
}

function compactTraceable(item, knownIds) {
  if (!item || typeof item !== "object") return null;
  const text = textValue(item);
  if (!text) return null;
  return {
    id: item.id ?? null,
    text: truncate(text, 2_000),
    sourceIds: uniqueStrings(item.sourceIds).filter((id) => knownIds.has(id)),
    epistemicStatus: EPISTEMIC_STATUS_VALUES.includes(item.epistemicStatus) ? item.epistemicStatus : undefined,
  };
}

function compactOutput(output, sources) {
  if (!output || typeof output !== "object") return null;
  const knownIds = sourceIdsOf(sources);
  const result = {
    role: output.role ?? null,
    headline: truncate(output.headline, 1_000),
    summary: truncate(output.summary, 3_000),
    sourceIds: uniqueStrings(output.sourceIds).filter((id) => knownIds.has(id)),
    epistemicStatus: EPISTEMIC_STATUS_VALUES.includes(output.epistemicStatus) ? output.epistemicStatus : undefined,
  };
  for (const key of ["findings", "interpretations", "hypotheses", "unresolved", "challenges", "proposedTests", "rebuttals"]) {
    result[key] = (Array.isArray(output[key]) ? output[key] : [])
      .slice(0, 64)
      .map((item) => compactTraceable(item, knownIds))
      .filter(Boolean);
  }
  if (output.decision) result.decision = compactTraceable(output.decision, knownIds);
  if (output.report && typeof output.report === "object") {
    result.report = {
      title: truncate(output.report.title, 500),
      executiveSummary: truncate(output.report.executiveSummary ?? output.report.summary, 2_000),
      sourceIds: uniqueStrings(output.report.sourceIds).filter((id) => knownIds.has(id)),
      sections: (Array.isArray(output.report.sections) ? output.report.sections : []).slice(0, 64).map((item) => compactTraceable(item, knownIds)).filter(Boolean),
      findings: (Array.isArray(output.report.findings) ? output.report.findings : []).slice(0, 64).map((item) => compactTraceable(item, knownIds)).filter(Boolean),
    };
  }
  return safeEventPayload(result);
}

function pickResearchOptions(sessionOptions, suppliedOptions) {
  const merged = { ...(sessionOptions && typeof sessionOptions === "object" ? sessionOptions : {}), ...(suppliedOptions && typeof suppliedOptions === "object" ? suppliedOptions : {}) };
  return ResearchOptionsSchema.parse({
    providers: merged.providers,
    maxResults: merged.maxResults,
    maxQueries: merged.maxQueries,
    perProviderMaxResults: merged.perProviderMaxResults,
    includeAbstract: merged.includeAbstract,
    dateFrom: merged.dateFrom,
    dateTo: merged.dateTo,
    language: merged.language,
    queryVariants: merged.queryVariants,
    additionalQueries: merged.additionalQueries,
    email: merged.email,
    userAgent: merged.userAgent,
  });
}

function resolveGroqClient(groq, options = {}) {
  const directConfig = groq && typeof groq === "object" ? groq : {};
  if (groq && (typeof groq === "object" || typeof groq === "function")) {
    if (typeof groq === "function" || typeof groq.generateStructured === "function" || typeof groq.complete === "function") return groq;
  }
  const supplied = options.groqClient ?? options.groq ?? directConfig;
  if (supplied && (typeof supplied === "function" || typeof supplied.generateStructured === "function" || typeof supplied.complete === "function")) return supplied;
  const config = supplied && typeof supplied === "object" ? supplied : {};
  return createGroqClient({
    apiKey: options.groqApiKey ?? options.apiKey ?? config.apiKey,
    baseUrl: options.groqBaseUrl ?? options.baseUrl ?? config.baseUrl,
    model: options.groqModel ?? options.model ?? config.model,
    fetchImpl: options.groqFetchImpl ?? options.fetchImpl ?? config.fetchImpl,
    timeoutMs: options.groqTimeoutMs ?? options.timeoutMs ?? config.timeoutMs,
    maxTokens: options.groqMaxTokens ?? options.maxTokens ?? config.maxTokens,
    retryLimit: options.groqRetryLimit ?? options.retryLimit ?? config.retryLimit,
  });
}

function modelOf(groq) {
  return typeof groq?.model === "string" && groq.model ? groq.model : null;
}

function validatedSources(records) {
  if (!Array.isArray(records)) return [];
  return records.map((record) => SourceRecordSchema.safeParse(record)).filter((result) => result.success).map((result) => result.data);
}

function reportTraceable(item, knownIds, fallbackStatus = EPISTEMIC_STATUSES.UNRESOLVED) {
  if (!item || typeof item !== "object") return null;
  const output = { ...item };
  const ids = uniqueStrings([
    ...(Array.isArray(output.sourceIds) ? output.sourceIds : []),
    ...(typeof output.sourceId === "string" ? [output.sourceId] : []),
  ]).filter((id) => knownIds.has(id));
  output.sourceIds = ids;
  delete output.sourceId;
  if (!textValue(output)) return null;
  if (ids.length === 0 && (!EPISTEMIC_STATUS_VALUES.includes(output.epistemicStatus) || output.epistemicStatus === EPISTEMIC_STATUSES.REPORTED_FINDING)) {
    output.epistemicStatus = fallbackStatus;
  }
  return output;
}

function partialReport({ sessionId, question, reason, sourceCount = 0, warnings = [] }) {
  const safeReason = truncate(reason, 1_000);
  const title = sourceCount > 0 ? "PaperTrail partial report" : "PaperTrail report: no verified sources";
  const summary = sourceCount > 0
    ? `No source-grounded synthesis is reported because ${safeReason}.`
    : "No source-grounded claims are reported because no verified literature records were retrieved.";
  const limitationValues = [safeReason, ...warnings].filter(Boolean).map((item) => truncate(item, 1_500));
  return {
    id: `report-${sessionId}`,
    title,
    executiveSummary: summary,
    summarySourceIds: [],
    sourceIds: [],
    epistemicStatus: EPISTEMIC_STATUSES.UNRESOLVED,
    generatedBy: "orchestrator_partial",
    sections: [{
      heading: "Evidence status",
      text: sourceCount > 0
        ? `The session retained ${sourceCount} verified source record${sourceCount === 1 ? "" : "s"}, but the requested synthesis is unresolved.`
        : "The retrieval stage returned no verified source records.",
      sourceIds: [],
      epistemicStatus: EPISTEMIC_STATUSES.UNRESOLVED,
    }],
    findings: [],
    limitations: limitationValues.length > 0 ? limitationValues : ["The evidence state is unresolved."],
    claimIds: [],
    question: truncate(question, 1_000),
  };
}

function sourceEvidence(sources) {
  return (Array.isArray(sources) ? sources : [])
    .filter((source) => source?.id && typeof source.abstract === "string" && source.abstract.trim())
    .map((source) => ({
      id: `evidence-${hashId(source.id)}`,
      evidenceId: `evidence-${hashId(source.id)}`,
      sourceId: source.id,
      sourceIds: [source.id],
      text: truncate(source.abstract, 20_000),
      locator: "provider abstract",
      epistemicStatus: EPISTEMIC_STATUSES.REPORTED_FINDING,
    }));
}

function claimCandidates(outputs, sources) {
  const knownIds = sourceIdsOf(sources);
  const candidates = [];
  const addOutput = (role, output) => {
    if (!output || typeof output !== "object") return;
    for (const key of ["findings", "interpretations", "hypotheses", "unresolved", "challenges", "proposedTests", "rebuttals"]) {
      for (const item of Array.isArray(output[key]) ? output[key] : []) candidates.push({ role, kind: key, item });
    }
    if (output.decision) candidates.push({ role, kind: "decision", item: output.decision });
    if (output.report && typeof output.report === "object") {
      for (const item of [...(Array.isArray(output.report.findings) ? output.report.findings : []), ...(Array.isArray(output.report.sections) ? output.report.sections : [])]) {
        candidates.push({ role, kind: "report", item });
      }
    }
  };
  for (const entry of outputs ?? []) {
    if (entry?.output) addOutput(entry.role, entry.output);
  }

  const evidenceBySource = new Map(sourceEvidence(sources).map((item) => [item.sourceId, item]));
  const claims = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const item = candidate.item;
    const statement = textValue(item);
    if (!statement) continue;
    const sourceIds = uniqueStrings(item.sourceIds).filter((id) => knownIds.has(id));
    let epistemicStatus = EPISTEMIC_STATUS_VALUES.includes(item.epistemicStatus) ? item.epistemicStatus : undefined;
    if (sourceIds.length === 0 && (!epistemicStatus || epistemicStatus === EPISTEMIC_STATUSES.REPORTED_FINDING)) epistemicStatus = EPISTEMIC_STATUSES.UNRESOLVED;
    const key = `${candidate.kind}\u0000${statement}\u0000${sourceIds.join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const evidencePassages = sourceIds.map((sourceId) => evidenceBySource.get(sourceId)).filter(Boolean);
    const evidenceIds = evidencePassages.map((passage) => passage.id);
    claims.push({
      id: `claim-${hashId(`${candidate.role}:${key}`)}`,
      statement: truncate(statement, 8_000),
      sourceIds,
      ...(epistemicStatus ? { epistemicStatus } : {}),
      evidenceIds,
      evidencePassages,
      evidenceLinks: evidencePassages.map((passage) => ({
        evidenceId: passage.id,
        sourceId: passage.sourceId,
        relationship: candidate.kind === "challenges" || candidate.kind === "unresolved" ? "context" : "supports",
      })),
      role: candidate.role,
      kind: candidate.kind,
    });
    if (claims.length >= 512) break;
  }
  return claims;
}

function normalizeReportCandidate(rawReport, adjudication, { sessionId, question, sources, claims }) {
  const knownIds = sourceIdsOf(sources);
  const candidate = rawReport && typeof rawReport === "object" ? cloneJson(rawReport) : {};
  const adjudicator = adjudication?.output;
  const report = {
    ...candidate,
    id: candidate.id ?? `report-${sessionId}`,
    title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : "PaperTrail source-grounded synthesis",
    executiveSummary: candidate.executiveSummary ?? candidate.summary ?? adjudicator?.summary ?? null,
    summarySourceIds: uniqueStrings(candidate.summarySourceIds ?? adjudicator?.sourceIds).filter((id) => knownIds.has(id)),
    sourceIds: uniqueStrings(candidate.sourceIds).filter((id) => knownIds.has(id)),
    generatedBy: candidate.generatedBy ?? (adjudication ? "adjudicator" : "orchestrator_partial"),
    sections: [],
    findings: [],
    limitations: [],
    claimIds: uniqueStrings(candidate.claimIds).filter((id) => claims.some((claim) => claim.id === id)),
    question: truncate(question, 1_000),
  };

  const rawSections = Array.isArray(candidate.sections) ? candidate.sections : [];
  const rawFindings = Array.isArray(candidate.findings) ? candidate.findings : [];
  report.sections = rawSections.map((item) => reportTraceable(item, knownIds)).filter((item) => item && typeof item.heading === "string" && item.heading.trim());
  report.findings = rawFindings.map((item) => reportTraceable(item, knownIds)).filter(Boolean);

  if (report.sections.length === 0 && adjudicator) {
    const summary = textValue(adjudicator);
    if (summary) report.sections.push(reportTraceable({
      heading: "Adjudicator synthesis",
      text: summary,
      sourceIds: uniqueStrings(adjudicator.sourceIds).filter((id) => knownIds.has(id)),
      epistemicStatus: adjudicator.epistemicStatus,
    }, knownIds));
  }
  if (report.findings.length === 0 && adjudicator?.findings) {
    report.findings = adjudicator.findings.map((item) => reportTraceable(item, knownIds)).filter(Boolean);
  }
  if (report.claimIds.length === 0 && claims.length > 0) report.claimIds = claims.map((claim) => claim.id);

  const rawLimitations = Array.isArray(candidate.limitations) ? candidate.limitations : [];
  report.limitations = rawLimitations.map((item) => typeof item === "string" ? truncate(item, 4_000) : reportTraceable(item, knownIds)).filter(Boolean);
  if (report.sections.length === 0 && report.findings.length === 0 && !report.executiveSummary) {
    return null;
  }
  if (!report.executiveSummary) report.executiveSummary = report.sections[0]?.text ?? report.findings[0]?.text ?? null;
  if (!report.executiveSummary) return null;
  if (!report.epistemicStatus && report.sourceIds.length === 0) report.epistemicStatus = EPISTEMIC_STATUSES.UNRESOLVED;
  const parsed = ReportSchema.safeParse(report);
  return parsed.success ? parsed.data : null;
}

function finalAudit(report, claims, sources) {
  const knownIds = sourceIdsOf(sources);
  const sanitized = sanitizeReportCitations(report, [...knownIds]);
  const knownClaimIds = new Set((Array.isArray(claims) ? claims : []).map((claim) => claim?.id).filter(Boolean));
  if (sanitized && Array.isArray(sanitized.claimIds)) sanitized.claimIds = sanitized.claimIds.filter((id) => knownClaimIds.has(id));
  const parsed = ReportSchema.safeParse(sanitized);
  const reportForAudit = parsed.success ? parsed.data : sanitized;
  return {
    report: reportForAudit,
    audit: validateCitationAudit(reportForAudit, claims, sources),
  };
}

function assertStore(store) {
  const required = ["getSession", "createSession", "updateSession", "addEvent", "upsertSources", "createAgentRun", "finishAgentRun", "saveClaims", "saveDebate", "saveReport", "getSessionBundle"];
  for (const method of required) {
    if (typeof store?.[method] !== "function") throw new TypeError(`PaperTrail store is missing ${method}()`);
  }
}

/**
 * Execute one bounded, persisted PaperTrail investigation.  All provider,
 * model, and store dependencies are injected so importing this module never
 * starts a server or performs network I/O.
 */
export async function runInvestigation({
  store,
  sessionId,
  question,
  options = {},
  providers,
  groq,
  signal,
  onEvent,
} = {}) {
  assertStore(store);
  if (typeof sessionId !== "string" || !sessionId.trim()) throw new TypeError("runInvestigation requires sessionId");

  let session = await store.getSession(sessionId);
  if (!session && typeof store.createSession === "function" && typeof question === "string" && question.trim()) {
    session = await store.createSession({ id: sessionId, question: question.trim(), options: pickResearchOptions({}, options) });
  }
  if (!session) throw new Error(`PaperTrail session not found: ${sessionId}`);
  const effectiveQuestion = typeof question === "string" && question.trim() ? question.trim() : session.question;
  if (!effectiveQuestion) throw new TypeError("runInvestigation requires a non-empty question");
  const researchOptions = pickResearchOptions(session.options, options);
  const groqClient = resolveGroqClient(groq, { ...options, model: options.model ?? session.model });
  const maxRounds = Math.min(MAX_DEBATE_ROUNDS, Math.max(1, Number.isFinite(Number(options.debateRounds)) ? Math.trunc(Number(options.debateRounds)) : MAX_DEBATE_ROUNDS));
  const state = {
    sources: [],
    retrieval: { sources: [], queries: [], warnings: [], providerStatuses: {} },
    debate: null,
    claims: [],
    audit: null,
    report: null,
    reportSaved: false,
    finalStatus: null,
    cancellationMarked: false,
    criticalErrors: [],
  };

  async function emit(type, payload = {}) {
    const safePayload = safeEventPayload(payload);
    const persisted = await store.addEvent(sessionId, type, safePayload);
    const event = {
      id: persisted?.id,
      sessionId,
      type,
      payload: safePayload,
      createdAt: persisted?.createdAt ?? new Date().toISOString(),
    };
    if (typeof onEvent === "function") {
      try {
        await onEvent(event);
      } catch {
        // A streaming/UI observer cannot invalidate persisted research state.
      }
    }
    return event;
  }

  async function checkCancellation(stage) {
    const requested = Boolean(signal?.aborted) || Boolean(await store.isCancelRequested?.(sessionId));
    if (requested) throw new CancellationError(stage);
  }

  async function markCancelled(stage) {
    if (state.cancellationMarked) return;
    state.cancellationMarked = true;
    await store.updateSession(sessionId, { status: "CANCELLED" });
    await emit(EVENT_TYPES.STAGE, { stage, status: "CANCELLED" });
  }

  async function runAgent(role, runner, input) {
    await checkCancellation(`agent:${role}`);
    const run = await store.createAgentRun({
      sessionId,
      role,
      model: modelOf(groqClient),
      input: {
        question: truncate(effectiveQuestion, 2_000),
        sourceIds: state.sources.map((source) => source.id),
        round: input.round ?? null,
        contextRoles: input.context && typeof input.context === "object" ? Object.keys(input.context) : [],
      },
    });
    await emit(EVENT_TYPES.AGENT_START, { agentRunId: run.id, role, round: input.round ?? null, model: modelOf(groqClient) });
    try {
      const output = await runner({
        ...input,
        question: effectiveQuestion,
        sources: state.sources,
        groq: groqClient,
        signal,
        onEvent: async (event) => {
          if (event?.type === EVENT_TYPES.RETRY) {
            await emit(EVENT_TYPES.RETRY, { agentRunId: run.id, role, ...event });
          }
        },
      });
      await store.finishAgentRun(run.id, { status: "completed", output, model: modelOf(groqClient) });
      await emit(EVENT_TYPES.AGENT_COMPLETION, { agentRunId: run.id, role, round: input.round ?? null, sourceIds: output?.sourceIds ?? [] });
      return { output, run, error: null };
    } catch (error) {
      const details = errorInfo(error);
      const status = isCancelledError(error) ? "cancelled" : "failed";
      await store.finishAgentRun(run.id, { status, error: details.message, model: modelOf(groqClient) });
      await emit(EVENT_TYPES.AGENT_ERROR, { agentRunId: run.id, role, round: input.round ?? null, ...details });
      return { output: null, run, error: details };
    }
  }

  async function persistDebate(debate) {
    state.debate = cloneJson(debate);
    await store.saveDebate(sessionId, state.debate);
  }

  async function finishReport(rawReport, claims, status, statusReasons = []) {
    let report = rawReport;
    let audit;
    const warnings = [...state.retrieval.warnings, ...statusReasons];
    const normalized = normalizeReportCandidate(report, state.adjudication, {
      sessionId,
      question: effectiveQuestion,
      sources: state.sources,
      claims,
    });
    if (normalized) report = normalized;
    else report = partialReport({
      sessionId,
      question: effectiveQuestion,
      reason: statusReasons[0] ?? "the adjudicator did not return a schema-valid synthesis",
      sourceCount: state.sources.length,
      warnings,
    });

    const audited = finalAudit(report, claims, state.sources);
    if (!audited.audit.valid || !ReportSchema.safeParse(audited.report).success) {
      report = partialReport({
        sessionId,
        question: effectiveQuestion,
        reason: "the independent citation audit found an invalid or unresolved report structure",
        sourceCount: state.sources.length,
        warnings: audited.audit.errors.map((error) => error.message),
      });
      const fallback = finalAudit(report, [], state.sources);
      report = fallback.report;
      audit = fallback.audit;
      status = status === "CANCELLED" ? status : "PARTIAL";
    } else {
      report = audited.report;
      audit = audited.audit;
    }
    state.report = report;
    state.audit = audit;
    await emit(EVENT_TYPES.AUDIT, {
      valid: audit.valid,
      errors: audit.errors,
      warnings: audit.warnings,
      citedSourceIds: audit.citedSourceIds,
      unknownSourceIds: audit.unknownSourceIds,
    });
    try {
      await store.saveReport(sessionId, report, audit);
      state.reportSaved = true;
    } catch (error) {
      state.criticalErrors.push(errorInfo(error));
      await emit(EVENT_TYPES.ERROR, { stage: "report_persistence", ...errorInfo(error) });
      status = status === "CANCELLED" ? status : "PARTIAL";
    }
    await emit(EVENT_TYPES.REPORT, {
      status,
      reportId: report.id,
      sourceCount: state.sources.length,
      claimCount: claims.length,
      auditValid: audit.valid,
    });
    await store.updateSession(sessionId, { status });
    state.finalStatus = status;
    await emit(EVENT_TYPES.STAGE, { stage: "finished", status });
    return redactBundle(await store.getSessionBundle(sessionId));
  }

  try {
    await store.updateSession(sessionId, { status: "RUNNING" });
    await emit(EVENT_TYPES.STAGE, { stage: "retrieval", status: "RUNNING" });
    await checkCancellation("retrieval");

    const literatureProviders = providers ?? createLiteratureProviders({
      fetchImpl: options.literatureFetchImpl,
      timeoutMs: options.literatureTimeoutMs,
      userAgent: researchOptions.userAgent,
    });
    state.retrieval = await retrieveSources({
      question: effectiveQuestion,
      options: researchOptions,
      providers: literatureProviders,
    });
    const retrievedSources = validatedSources(state.retrieval.sources);
    if (retrievedSources.length !== (Array.isArray(state.retrieval.sources) ? state.retrieval.sources.length : 0)) {
      state.retrieval.warnings = [...(state.retrieval.warnings ?? []), "Some provider records failed source-schema validation and were excluded."];
    }
    state.sources = validatedSources(await store.upsertSources(sessionId, retrievedSources));
    if (state.sources.length === 0 && retrievedSources.length > 0) state.sources = retrievedSources;
    await emit(EVENT_TYPES.SOURCE_RETRIEVAL, {
      queries: state.retrieval.queries,
      sourceCount: state.sources.length,
      providerStatuses: state.retrieval.providerStatuses,
      warnings: state.retrieval.warnings,
    });
    await checkCancellation("post_retrieval");

    if (state.sources.length === 0) {
      await emit(EVENT_TYPES.STAGE, { stage: "partial_no_sources", status: "PARTIAL" });
      await persistDebate({
        status: "not_run",
        maxRounds,
        rounds: [],
        sourceIds: [],
        reason: "No verified sources were retrieved; agents were not run.",
      });
      return await finishReport(partialReport({
        sessionId,
        question: effectiveQuestion,
        reason: "no verified literature records were retrieved",
        sourceCount: 0,
        warnings: state.retrieval.warnings,
      }), [], "PARTIAL", ["no verified sources"]);
    }

    await emit(EVENT_TYPES.STAGE, { stage: "investigator", status: "RUNNING" });
    await checkCancellation("investigator");
    const investigatorRun = await runAgent("investigator", runInvestigator, {
      evidence: sourceEvidence(state.sources),
      context: { stage: "initial_investigation" },
    });
    state.investigator = investigatorRun.output;

    const debateRounds = [];
    let currentInvestigator = investigatorRun.output;
    for (let round = 1; round <= maxRounds; round += 1) {
      await checkCancellation(`debate_round_${round}`);
      await emit(EVENT_TYPES.STAGE, { stage: "debate", round, status: "RUNNING" });
      const sharedContext = {
        round,
        investigator: compactOutput(currentInvestigator, state.sources),
        priorRounds: debateRounds.map((item) => ({
          round: item.round,
          objections: item.objections,
          rebuttal: item.rebuttal,
          errors: item.errors,
        })),
      };
      const verifiedEvidence = sourceEvidence(state.sources);
      const [skepticRun, experimentalistRun] = await Promise.all([
        runAgent("skeptic", runSkeptic, {
          round,
          evidence: verifiedEvidence,
          context: sharedContext,
        }),
        runAgent("experimentalist", runExperimentalist, {
          round,
          evidence: verifiedEvidence,
          context: sharedContext,
        }),
      ]);
      const objections = [
        ...(skepticRun.output?.challenges ?? []).map((item) => ({ role: "skeptic", ...compactTraceable(item, sourceIdsOf(state.sources)) })),
        ...(experimentalistRun.output?.proposedTests ?? []).map((item) => ({ role: "experimentalist", ...compactTraceable(item, sourceIdsOf(state.sources)) })),
      ].filter((item) => item && item.text);
      let rebuttalRun = { output: null, error: null };
      if (objections.length > 0 && currentInvestigator) {
        await checkCancellation(`rebuttal_round_${round}`);
        rebuttalRun = await runAgent("rebuttal", runRebuttal, {
          round,
          evidence: sourceEvidence(state.sources),
          context: {
            round,
            investigator: compactOutput(currentInvestigator, state.sources),
            objections: objections.slice(0, 128),
            skeptic: compactOutput(skepticRun.output, state.sources),
            experimentalist: compactOutput(experimentalistRun.output, state.sources),
          },
        });
        if (rebuttalRun.output) currentInvestigator = {
          ...currentInvestigator,
          rebuttals: [...(currentInvestigator.rebuttals ?? []), ...(rebuttalRun.output.rebuttals ?? [])],
        };
      }
      const roundRecord = {
        round,
        skeptic: compactOutput(skepticRun.output, state.sources),
        experimentalist: compactOutput(experimentalistRun.output, state.sources),
        objections: safeEventPayload(objections.slice(0, 256)),
        rebuttal: compactOutput(rebuttalRun.output, state.sources),
        errors: [skepticRun.error, experimentalistRun.error, rebuttalRun.error].filter(Boolean),
      };
      debateRounds.push(roundRecord);
      await persistDebate({
        status: "in_progress",
        maxRounds,
        rounds: debateRounds,
        sourceIds: state.sources.map((source) => source.id),
      });
      if (round >= maxRounds || objections.length === 0) break;
    }
    await persistDebate({
      status: "completed",
      maxRounds,
      rounds: debateRounds,
      sourceIds: state.sources.map((source) => source.id),
    });
    await checkCancellation("post_debate");

    await emit(EVENT_TYPES.STAGE, { stage: "adjudication", status: "RUNNING" });
    const adjudicationRun = await runAgent("adjudicator", runAdjudicator, {
      evidence: sourceEvidence(state.sources),
      context: {
        investigator: compactOutput(investigatorRun.output, state.sources),
        currentInvestigator: compactOutput(currentInvestigator, state.sources),
        debate: debateRounds,
      },
    });
    state.adjudication = adjudicationRun;
    await checkCancellation("post_adjudication");

    const outputsForClaims = [
      { role: "investigator", output: investigatorRun.output },
      ...debateRounds.flatMap((round) => [
        { role: "skeptic", output: round.skeptic },
        { role: "experimentalist", output: round.experimentalist },
        { role: "rebuttal", output: round.rebuttal },
      ]),
      { role: "adjudicator", output: adjudicationRun.output },
    ];
    const claimInputs = claimCandidates(outputsForClaims, state.sources);
    try {
      const savedClaims = await store.saveClaims(sessionId, claimInputs);
      state.claims = Array.isArray(savedClaims) ? savedClaims.filter((claim) => ClaimSchema.safeParse(claim).success) : claimInputs;
    } catch (error) {
      state.claims = [];
      state.criticalErrors.push(errorInfo(error));
      await emit(EVENT_TYPES.ERROR, { stage: "claims_persistence", ...errorInfo(error) });
    }

    await emit(EVENT_TYPES.STAGE, { stage: "audit", status: "RUNNING" });
    await checkCancellation("audit");
    const reasons = [];
    if (state.retrieval.warnings.length > 0) reasons.push("retrieval returned warnings");
    if (investigatorRun.error) reasons.push("Investigator was incomplete");
    for (const round of debateRounds) if (round.errors.length > 0) reasons.push("one or more debate agents were incomplete");
    if (adjudicationRun.error) reasons.push("Adjudicator was unavailable or malformed");
    if (state.criticalErrors.length > 0) reasons.push("a persistence operation failed");
    const status = reasons.length === 0 && state.audit?.valid !== false ? "COMPLETED" : "PARTIAL";
    return await finishReport(adjudicationRun.output?.report ?? null, state.claims, status, reasons);
  } catch (error) {
    if (isCancelledError(error)) {
      await markCancelled(error.stage ?? "pipeline");
      try {
        await persistDebate({
          ...(state.debate ?? {}),
          status: "cancelled",
          maxRounds,
          rounds: state.debate?.rounds ?? [],
          sourceIds: state.sources.map((source) => source.id),
          reason: error.message,
        });
      } catch (persistenceError) {
        state.criticalErrors.push(errorInfo(persistenceError));
      }
      return finishReport(partialReport({
        sessionId,
        question: effectiveQuestion,
        reason: error.message,
        sourceCount: state.sources.length,
        warnings: state.retrieval.warnings,
      }), [], "CANCELLED", [error.message]);
    }

    const details = errorInfo(error);
    state.criticalErrors.push(details);
    try {
      await emit(EVENT_TYPES.ERROR, { stage: "pipeline", ...details });
    } catch {
      // Preserve the original pipeline failure if event persistence is also unavailable.
    }
    if (!state.debate) {
      try {
        await persistDebate({ status: "failed", maxRounds, rounds: [], sourceIds: state.sources.map((source) => source.id), reason: details.message });
      } catch {
        // The final report still records the persistence failure.
      }
    }
    return finishReport(partialReport({
      sessionId,
      question: effectiveQuestion,
      reason: details.message || "the live investigation failed",
      sourceCount: state.sources.length,
      warnings: state.retrieval.warnings,
    }), [], "PARTIAL", [details.message]);
  }
}
