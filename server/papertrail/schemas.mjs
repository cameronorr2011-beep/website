import { z } from "zod";

/**
 * PaperTrail keeps the language used by a model separate from the strength of
 * the evidence behind that language.  These values are deliberately small and
 * explicit so callers cannot silently turn a hypothesis into a reported fact.
 */
export const EPISTEMIC_STATUSES = Object.freeze({
  REPORTED_FINDING: "reported_finding",
  AI_INTERPRETATION: "ai_interpretation",
  HYPOTHESIS: "hypothesis",
  UNRESOLVED: "unresolved",
});

export const EPISTEMIC_STATUS_VALUES = Object.freeze(Object.values(EPISTEMIC_STATUSES));
export const EpistemicStatusSchema = z.enum(EPISTEMIC_STATUS_VALUES);
export const MetadataOriginSchema = z.literal("provider");

const IdSchema = z.string().trim().min(1).max(512);
const NonEmptyTextSchema = z.string().trim().min(1);
const NullableTextSchema = z.string().trim().min(1).nullable().default(null);
const SourceIdsSchema = z.array(IdSchema).max(512).default([]);

export const ResearchOptionsSchema = z.object({
  providers: z.array(z.string().trim().min(1).max(64)).min(1).max(8).default(["pubmed", "crossref"]),
  maxResults: z.number().int().min(1).max(100).default(25),
  maxQueries: z.number().int().min(1).max(8).default(3),
  perProviderMaxResults: z.number().int().min(1).max(100).optional(),
  includeAbstract: z.boolean().default(true),
  dateFrom: z.string().trim().min(1).max(32).optional(),
  dateTo: z.string().trim().min(1).max(32).optional(),
  language: z.string().trim().min(1).max(32).optional(),
  queryVariants: z.array(NonEmptyTextSchema).max(8).default([]),
  additionalQueries: z.array(NonEmptyTextSchema).max(8).default([]),
  email: z.string().email().optional(),
  userAgent: z.string().trim().min(1).max(512).optional(),
}).passthrough();

const ProviderProvenanceSchema = z.object({
  provider: IdSchema,
  providerRecordId: IdSchema,
  sourceUrl: z.string().url().nullable().default(null),
  doi: NullableTextSchema,
  pmid: NullableTextSchema,
  metadataOrigin: MetadataOriginSchema.default("provider"),
}).passthrough();

/**
 * A source is provider data, not an agent statement.  `providerMetadata` is
 * intentionally part of the source boundary and is persisted separately from
 * generated agent output by db.mjs.
 */
export const SourceRecordSchema = z.object({
  id: IdSchema,
  title: NonEmptyTextSchema,
  authors: z.array(NonEmptyTextSchema).max(512).default([]),
  date: NullableTextSchema,
  abstract: NullableTextSchema,
  doi: NullableTextSchema,
  pmid: NullableTextSchema,
  provider: IdSchema,
  sourceUrl: z.string().url().nullable().default(null),
  retrievedAt: NonEmptyTextSchema,
  fullTextAvailable: z.boolean().default(false),
  providerRecordId: IdSchema,
  metadataOrigin: MetadataOriginSchema.default("provider"),
  providers: z.array(IdSchema).max(32).default([]),
  sourceUrls: z.array(z.string().url()).max(128).default([]),
  providerProvenance: z.array(ProviderProvenanceSchema).max(128).default([]),
  providerMetadata: z.unknown().optional(),
  providerMetadataByProvider: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

const TraceableTextShape = {
  id: IdSchema.optional(),
  heading: NonEmptyTextSchema.optional(),
  title: NonEmptyTextSchema.optional(),
  text: NonEmptyTextSchema.optional(),
  content: NonEmptyTextSchema.optional(),
  statement: NonEmptyTextSchema.optional(),
  claim: NonEmptyTextSchema.optional(),
  detail: NonEmptyTextSchema.optional(),
  observation: NonEmptyTextSchema.optional(),
  sourceIds: SourceIdsSchema,
  epistemicStatus: EpistemicStatusSchema.optional(),
  confidence: NonEmptyTextSchema.optional(),
  rationale: NonEmptyTextSchema.optional(),
};

function traceableTextSchema(label, extraShape = {}) {
  return z.object({ ...TraceableTextShape, ...extraShape }).passthrough().superRefine((value, context) => {
    if (!value.text && !value.content && !value.statement && !value.claim && !value.detail && !value.observation) {
      context.addIssue({
        code: "custom",
        path: ["text"],
        message: `${label} must contain text, content, statement, claim, observation, or detail`,
      });
    }
    if (value.sourceIds.length === 0 && !value.epistemicStatus) {
      context.addIssue({
        code: "custom",
        path: ["epistemicStatus"],
        message: `${label} needs sourceIds or an explicit epistemicStatus`,
      });
    }
    if (value.epistemicStatus === EPISTEMIC_STATUSES.REPORTED_FINDING && value.sourceIds.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["sourceIds"],
        message: `${label} marked reported_finding must cite at least one source`,
      });
    }
  });
}

export const TraceableTextSchema = traceableTextSchema("Traceable text");

export const EvidencePassageSchema = z.object({
  id: IdSchema.optional(),
  evidenceId: IdSchema.optional(),
  sourceId: IdSchema,
  sourceIds: SourceIdsSchema,
  text: NonEmptyTextSchema.optional(),
  passage: NonEmptyTextSchema.optional(),
  quote: NonEmptyTextSchema.optional(),
  locator: NonEmptyTextSchema.optional(),
  page: NonEmptyTextSchema.optional(),
  section: NonEmptyTextSchema.optional(),
  epistemicStatus: EpistemicStatusSchema.default(EPISTEMIC_STATUSES.REPORTED_FINDING),
}).passthrough().superRefine((value, context) => {
  if (!value.id && !value.evidenceId) {
    context.addIssue({ code: "custom", path: ["id"], message: "An evidence passage needs id or evidenceId" });
  }
  if (!value.text && !value.passage && !value.quote) {
    context.addIssue({ code: "custom", path: ["text"], message: "An evidence passage needs text, passage, or quote" });
  }
  if (value.sourceIds.length > 0 && !value.sourceIds.includes(value.sourceId)) {
    context.addIssue({
      code: "custom",
      path: ["sourceIds"],
      message: "sourceIds must include sourceId when sourceIds are provided",
    });
  }
});

export const ClaimSchema = z.object({
  id: IdSchema,
  statement: NonEmptyTextSchema.optional(),
  text: NonEmptyTextSchema.optional(),
  claim: NonEmptyTextSchema.optional(),
  detail: NonEmptyTextSchema.optional(),
  sourceIds: SourceIdsSchema,
  evidenceIds: z.array(IdSchema).max(512).default([]),
  epistemicStatus: EpistemicStatusSchema.optional(),
  confidence: NonEmptyTextSchema.optional(),
}).passthrough().superRefine((value, context) => {
  if (!value.statement && !value.text && !value.claim) {
    context.addIssue({ code: "custom", path: ["statement"], message: "A claim needs statement, claim, or text" });
  }
  if (value.sourceIds.length === 0 && !value.epistemicStatus) {
    context.addIssue({
      code: "custom",
      path: ["epistemicStatus"],
      message: "A claim needs sourceIds or an explicit epistemicStatus",
    });
  }
  if (value.epistemicStatus === EPISTEMIC_STATUSES.REPORTED_FINDING && value.sourceIds.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["sourceIds"],
      message: "A reported_finding claim must cite at least one source",
    });
  }
});

export const ReportSectionSchema = traceableTextSchema("Report section", {
  heading: NonEmptyTextSchema,
});

export const ReportFindingSchema = traceableTextSchema("Report finding", {
  title: NonEmptyTextSchema.optional(),
});

export const ReportSchema = z.object({
  id: IdSchema.optional(),
  title: NonEmptyTextSchema,
  executiveSummary: NonEmptyTextSchema.optional(),
  summary: NonEmptyTextSchema.optional(),
  summarySourceIds: SourceIdsSchema,
  sourceIds: SourceIdsSchema,
  epistemicStatus: EpistemicStatusSchema.optional(),
  generatedBy: IdSchema.optional(),
  createdAt: NonEmptyTextSchema.optional(),
  sections: z.array(ReportSectionSchema).max(256).default([]),
  findings: z.array(ReportFindingSchema).max(512).default([]),
  limitations: z.array(z.union([NonEmptyTextSchema, TraceableTextSchema])).max(256).default([]),
  claimIds: z.array(IdSchema).max(512).default([]),
}).passthrough().superRefine((value, context) => {
  if (!value.executiveSummary && !value.summary && value.sections.length === 0 && value.findings.length === 0) {
    context.addIssue({ code: "custom", path: ["sections"], message: "A report needs a summary, section, or finding" });
  }
});

const AgentOutputBaseShape = {
  id: IdSchema.optional(),
  agentId: IdSchema.optional(),
  agentRunId: IdSchema.optional(),
  role: NonEmptyTextSchema.optional(),
  headline: NonEmptyTextSchema.optional(),
  summary: NonEmptyTextSchema.optional(),
  sourceIds: SourceIdsSchema,
  epistemicStatus: EpistemicStatusSchema.optional(),
  findings: z.array(TraceableTextSchema).max(512).default([]),
  interpretations: z.array(TraceableTextSchema).max(512).default([]),
  hypotheses: z.array(TraceableTextSchema).max(512).default([]),
  unresolved: z.array(TraceableTextSchema).max(512).default([]),
  createdAt: NonEmptyTextSchema.optional(),
};

function agentOutputSchema(extraShape = {}) {
  return z.object({ ...AgentOutputBaseShape, ...extraShape }).passthrough();
}

export const InvestigatorOutputSchema = agentOutputSchema({
  role: NonEmptyTextSchema.default("investigator"),
});

export const SkepticOutputSchema = agentOutputSchema({
  challenges: z.array(TraceableTextSchema).max(512).default([]),
  role: NonEmptyTextSchema.default("skeptic"),
});

export const ExperimentalistOutputSchema = agentOutputSchema({
  proposedTests: z.array(TraceableTextSchema).max(512).default([]),
  role: NonEmptyTextSchema.default("experimentalist"),
});

export const RebuttalOutputSchema = agentOutputSchema({
  rebuttals: z.array(TraceableTextSchema).max(512).default([]),
  role: NonEmptyTextSchema.default("rebuttal"),
});

export const AdjudicatorOutputSchema = agentOutputSchema({
  decision: TraceableTextSchema.optional(),
  report: ReportSchema.optional(),
  role: NonEmptyTextSchema.default("adjudicator"),
});

export const SessionRequestSchema = z.object({
  id: IdSchema.optional(),
  question: NonEmptyTextSchema,
  options: ResearchOptionsSchema.default({}),
  model: NonEmptyTextSchema.optional(),
}).passthrough();

function sourceIdSet(sources) {
  const values = sources instanceof Set ? [...sources] : (Array.isArray(sources) ? sources : []);
  return new Set(values.map((source) => {
    if (typeof source === "string") return source;
    if (source && typeof source === "object") return source.id ?? source.sourceId;
    return null;
  }).filter(Boolean));
}

function claimIdSet(claims) {
  const values = Array.isArray(claims) ? claims : [];
  return new Set(values.map((claim) => claim && typeof claim === "object" ? claim.id ?? claim.claimId : null).filter(Boolean));
}

function collectCitationReferences(value, path = "report", result = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectCitationReferences(item, `${path}[${index}]`, result));
    return result;
  }
  if (!value || typeof value !== "object") return result;

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (key === "sourceIds" || key.toLocaleLowerCase().endsWith("sourceids")) {
      if (Array.isArray(child)) {
        child.forEach((sourceId, index) => result.push({ sourceId, path: `${childPath}[${index}]` }));
      } else {
        result.push({ sourceId: child, path: childPath });
      }
      continue;
    }
    collectCitationReferences(child, childPath, result);
  }
  return result;
}

function collectInvalidCitationReferences(value, path = "report", result = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectInvalidCitationReferences(item, `${path}[${index}]`, result));
    return result;
  }
  if (!value || typeof value !== "object") return result;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (key === "invalidSourceIds" || key.toLocaleLowerCase().endsWith("invalidsourceids")) {
      if (Array.isArray(child)) child.forEach((sourceId, index) => result.push({ sourceId, path: `${childPath}[${index}]` }));
      else result.push({ sourceId: child, path: childPath });
      continue;
    }
    collectInvalidCitationReferences(child, childPath, result);
  }
  return result;
}

function isExplicitStatus(value) {
  return typeof value === "string" && EPISTEMIC_STATUS_VALUES.includes(value);
}

function formatZodIssues(issues, prefix) {
  return issues.map((issue) => ({
    code: "schema_invalid",
    path: [prefix, ...issue.path],
    message: issue.message,
  }));
}

/**
 * Check report and claim citations without trusting citation IDs supplied by a
 * model.  The return value is deliberately data-shaped so it can be persisted
 * alongside the report and shown to a caller without serializing a Zod error.
 */
export function validateCitationAudit(report, claims = [], sources = []) {
  const errors = [];
  const warnings = [];
  const knownSourceIds = sourceIdSet(sources);
  const knownClaimIds = claimIdSet(claims);

  const reportResult = ReportSchema.safeParse(report);
  if (!reportResult.success) errors.push(...formatZodIssues(reportResult.error.issues, "report"));

  for (const [index, claim] of (Array.isArray(claims) ? claims : []).entries()) {
    const result = ClaimSchema.safeParse(claim);
    if (!result.success) errors.push(...formatZodIssues(result.error.issues, `claims[${index}]`));
  }

  const reportReferences = collectCitationReferences(report, "report");
  const claimReferences = collectCitationReferences(claims, "claims");
  const references = [...reportReferences, ...claimReferences];
  const invalidReferences = [
    ...collectInvalidCitationReferences(report, "report"),
    ...collectInvalidCitationReferences(claims, "claims"),
  ];
  const unknownSourceIds = [...new Set(references
    .filter((reference) => typeof reference.sourceId !== "string" || !knownSourceIds.has(reference.sourceId))
    .map((reference) => reference.sourceId)
    .filter((sourceId) => typeof sourceId === "string"))];

  for (const reference of references) {
    if (typeof reference.sourceId !== "string" || !knownSourceIds.has(reference.sourceId)) {
      errors.push({
        code: "unknown_source_id",
        path: reference.path.split(/[.[\]]/).filter(Boolean),
        message: `Citation does not resolve to a supplied source: ${String(reference.sourceId)}`,
      });
    }
  }

  for (const reference of invalidReferences) {
    errors.push({
      code: "unknown_source_id",
      path: reference.path.split(/[.[\]]/).filter(Boolean),
      message: `Model supplied a citation that was rejected during normalization: ${String(reference.sourceId)}`,
    });
  }

  const substantiveCollections = [
    ["sections", report?.sections],
    ["findings", report?.findings],
  ];
  for (const [collectionName, items] of substantiveCollections) {
    if (!Array.isArray(items)) continue;
    items.forEach((item, index) => {
      const cited = Array.isArray(item?.sourceIds) && item.sourceIds.length > 0;
      if (!cited && !isExplicitStatus(item?.epistemicStatus)) {
        errors.push({
          code: "missing_trace_or_epistemic_status",
          path: ["report", collectionName, index],
          message: "Every substantive report section or finding needs sourceIds or an explicit epistemicStatus",
        });
      }
    });
  }

  if (report && Array.isArray(report.claimIds)) {
    report.claimIds.forEach((claimId, index) => {
      if (knownClaimIds.size > 0 && !knownClaimIds.has(claimId)) {
        errors.push({
          code: "unknown_claim_id",
          path: ["report", "claimIds", index],
          message: `Report claim reference does not resolve to a supplied claim: ${claimId}`,
        });
      }
    });
  }

  if (knownSourceIds.size === 0 && references.length > 0) {
    warnings.push({ code: "no_sources_supplied", message: "The audit received citations but no source records." });
  }

  return {
    valid: errors.length === 0,
    ok: errors.length === 0,
    errors,
    warnings,
    knownSourceIds: [...knownSourceIds],
    unknownSourceIds,
    citedSourceIds: [...new Set(references.map((reference) => reference.sourceId).filter((id) => typeof id === "string"))],
  };
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function sanitizeCitationValue(value, allowedSourceIds) {
  if (Array.isArray(value)) return value.filter((item) => allowedSourceIds.has(item));
  if (typeof value === "string") return allowedSourceIds.has(value) ? value : null;
  return value;
}

/**
 * Remove provider/model-generated source IDs that are not in the source set.
 * Missing citations are conservatively marked unresolved so the sanitized
 * report remains honest and can still pass ReportSchema.
 */
export function sanitizeReportCitations(report, sourceIds = []) {
  const allowedSourceIds = sourceIdSet(sourceIds);
  const sanitized = cloneJson(report);
  if (!sanitized || typeof sanitized !== "object") return sanitized;

  function walk(value) {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "sourceIds" || key.toLocaleLowerCase().endsWith("sourceids")) {
        value[key] = sanitizeCitationValue(child, allowedSourceIds);
      } else if (key === "sourceId") {
        const sanitizedId = sanitizeCitationValue(child, allowedSourceIds);
        if (sanitizedId === null) delete value[key];
        else value[key] = sanitizedId;
      } else {
        walk(child);
      }
    }
  }

  walk(sanitized);
  for (const collectionName of ["sections", "findings"]) {
    if (!Array.isArray(sanitized[collectionName])) continue;
    for (const item of sanitized[collectionName]) {
      if (item && typeof item === "object" && (!Array.isArray(item.sourceIds) || item.sourceIds.length === 0) && !isExplicitStatus(item.epistemicStatus)) {
        item.epistemicStatus = EPISTEMIC_STATUSES.UNRESOLVED;
      }
    }
  }
  return sanitized;
}

export { IdSchema, SourceIdsSchema };
