import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  ClaimSchema,
  EvidencePassageSchema,
  ReportSchema,
  ResearchOptionsSchema,
  SessionRequestSchema,
  SourceRecordSchema,
} from "./schemas.mjs";

/** Keep the default runtime database outside the static site tree. */
export const DEFAULT_DB_PATH = path.join(os.homedir(), ".orr-biologicals", "papertrail.sqlite");

const MIGRATIONS = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        options_json TEXT NOT NULL,
        model TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        cancel_requested INTEGER NOT NULL DEFAULT 0 CHECK (cancel_requested IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sources (
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        source_id TEXT NOT NULL,
        title TEXT NOT NULL,
        authors_json TEXT NOT NULL,
        date TEXT,
        abstract TEXT,
        doi TEXT,
        pmid TEXT,
        provider TEXT NOT NULL,
        source_url TEXT,
        retrieved_at TEXT NOT NULL,
        full_text_available INTEGER NOT NULL DEFAULT 0 CHECK (full_text_available IN (0, 1)),
        provider_record_id TEXT NOT NULL,
        metadata_origin TEXT NOT NULL DEFAULT 'provider' CHECK (metadata_origin = 'provider'),
        providers_json TEXT NOT NULL,
        source_urls_json TEXT NOT NULL,
        provider_provenance_json TEXT NOT NULL,
        provider_metadata_json TEXT,
        provider_metadata_by_provider_json TEXT,
        source_json TEXT NOT NULL,
        PRIMARY KEY (session_id, source_id),
        UNIQUE (session_id, doi),
        UNIQUE (session_id, pmid),
        UNIQUE (session_id, provider, provider_record_id)
      );

      CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        model TEXT,
        input_json TEXT,
        output_json TEXT,
        error TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        finished_at TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS claims (
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        claim_id TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (session_id, claim_id)
      );

      CREATE TABLE IF NOT EXISTS evidence (
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        evidence_id TEXT NOT NULL,
        source_id TEXT,
        text TEXT,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (session_id, evidence_id)
      );

      CREATE TABLE IF NOT EXISTS claim_evidence (
        session_id TEXT NOT NULL,
        claim_id TEXT NOT NULL,
        evidence_id TEXT NOT NULL,
        source_id TEXT NOT NULL DEFAULT '',
        relationship TEXT,
        data_json TEXT NOT NULL,
        PRIMARY KEY (session_id, claim_id, evidence_id, source_id),
        FOREIGN KEY (session_id, claim_id) REFERENCES claims(session_id, claim_id) ON DELETE CASCADE,
        FOREIGN KEY (session_id, evidence_id) REFERENCES evidence(session_id, evidence_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS debates (
        session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reports (
        session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
        report_json TEXT NOT NULL,
        audit_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS events_session_id_id_idx ON events(session_id, id);
      CREATE INDEX IF NOT EXISTS sources_session_id_provider_idx ON sources(session_id, provider);
      CREATE INDEX IF NOT EXISTS sources_session_id_doi_idx ON sources(session_id, doi);
      CREATE INDEX IF NOT EXISTS sources_session_id_pmid_idx ON sources(session_id, pmid);
      CREATE INDEX IF NOT EXISTS agent_runs_session_id_created_idx ON agent_runs(session_id, created_at, id);
      CREATE INDEX IF NOT EXISTS claims_session_id_updated_idx ON claims(session_id, updated_at, claim_id);
      CREATE INDEX IF NOT EXISTS evidence_session_id_source_idx ON evidence(session_id, source_id);
      CREATE INDEX IF NOT EXISTS claim_evidence_session_id_claim_idx ON claim_evidence(session_id, claim_id);
    `,
  },
];

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function serialize(value) {
  return JSON.stringify(value === undefined ? null : value);
}

function parseJson(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function timestamp(now) {
  const value = now();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value === "string" && value.length > 0) return value;
  return new Date().toISOString();
}

function ensureDatabaseParent(dbPath) {
  if (dbPath === ":memory:" || dbPath.startsWith("file:")) return;
  mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
}

function runMigrations(db, now) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
  const hasMigration = db.prepare("SELECT 1 AS present FROM schema_migrations WHERE version = ?");
  const recordMigration = db.prepare("INSERT INTO schema_migrations(version, applied_at) VALUES (?, ?)");
  for (const migration of MIGRATIONS) {
    if (hasMigration.get(migration.version)) continue;
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(migration.sql);
      recordMigration.run(migration.version, timestamp(now));
      db.exec("COMMIT");
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // Preserve the migration error.
      }
      throw error;
    }
  }
}

function rowToSession(row) {
  if (!row) return null;
  return {
    id: row.id,
    question: row.question,
    options: parseJson(row.options_json, {}),
    model: row.model ?? null,
    status: row.status,
    cancelRequested: Boolean(row.cancel_requested),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToEvent(row) {
  return {
    id: Number(row.id),
    sessionId: row.session_id,
    type: row.type,
    payload: parseJson(row.payload_json, null),
    createdAt: row.created_at,
  };
}

function rowToSource(row) {
  const source = parseJson(row.source_json, {});
  const providerMetadata = row.provider_metadata_json === null ? undefined : parseJson(row.provider_metadata_json);
  const providerMetadataByProvider = row.provider_metadata_by_provider_json === null ? undefined : parseJson(row.provider_metadata_by_provider_json);
  return {
    ...source,
    id: row.source_id,
    title: row.title,
    authors: parseJson(row.authors_json, []),
    date: row.date ?? null,
    abstract: row.abstract ?? null,
    doi: row.doi ?? null,
    pmid: row.pmid ?? null,
    provider: row.provider,
    sourceUrl: row.source_url ?? null,
    retrievedAt: row.retrieved_at,
    fullTextAvailable: Boolean(row.full_text_available),
    providerRecordId: row.provider_record_id,
    metadataOrigin: row.metadata_origin,
    providers: parseJson(row.providers_json, []),
    sourceUrls: parseJson(row.source_urls_json, []),
    providerProvenance: parseJson(row.provider_provenance_json, []),
    ...(providerMetadata !== undefined ? { providerMetadata } : {}),
    ...(providerMetadataByProvider !== undefined ? { providerMetadataByProvider } : {}),
  };
}

function rowToAgentRun(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    status: row.status,
    model: row.model ?? null,
    input: parseJson(row.input_json, null),
    output: parseJson(row.output_json, null),
    error: row.error ?? null,
    createdAt: row.created_at,
    startedAt: row.started_at ?? null,
    finishedAt: row.finished_at ?? null,
    updatedAt: row.updated_at,
  };
}

function rowToClaim(row) {
  return parseJson(row.data_json, { id: row.claim_id });
}

function rowToEvidence(row) {
  return {
    ...parseJson(row.data_json, {}),
    id: row.evidence_id,
    sourceId: row.source_id ?? null,
    text: row.text ?? null,
  };
}

function rowToClaimEvidence(row) {
  return {
    sessionId: row.session_id,
    claimId: row.claim_id,
    evidenceId: row.evidence_id,
    sourceId: row.source_id || null,
    relationship: row.relationship ?? null,
    ...parseJson(row.data_json, {}),
  };
}

function normalizeSourceForStorage(source) {
  const parsed = SourceRecordSchema.parse(source);
  const sourceJson = { ...parsed };
  delete sourceJson.providerMetadata;
  delete sourceJson.providerMetadataByProvider;
  return { parsed, sourceJson };
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))];
}

function mergeSources(existing, incoming) {
  if (!existing) return incoming;
  const providerProvenance = [];
  const seenProvenance = new Set();
  for (const item of [...(existing.providerProvenance ?? []), ...(incoming.providerProvenance ?? [])]) {
    const key = `${item.provider}\u0000${item.providerRecordId}`;
    if (seenProvenance.has(key)) continue;
    seenProvenance.add(key);
    providerProvenance.push(item);
  }
  const metadataByProvider = {
    ...(existing.providerMetadataByProvider ?? {}),
    ...(incoming.providerMetadataByProvider ?? {}),
  };
  if (existing.providerMetadata !== undefined) metadataByProvider[existing.provider] ??= existing.providerMetadata;
  if (incoming.providerMetadata !== undefined) metadataByProvider[incoming.provider] = incoming.providerMetadata;
  const primaryMetadata = incoming.providerMetadata ?? existing.providerMetadata;

  const merged = {
    ...existing,
    ...incoming,
    id: existing.id,
    title: incoming.title || existing.title,
    authors: uniqueStrings([...(existing.authors ?? []), ...(incoming.authors ?? [])]),
    abstract: (incoming.abstract && incoming.abstract.length >= (existing.abstract?.length ?? 0)) ? incoming.abstract : existing.abstract,
    doi: existing.doi ?? incoming.doi ?? null,
    pmid: existing.pmid ?? incoming.pmid ?? null,
    sourceUrl: existing.sourceUrl ?? incoming.sourceUrl ?? null,
    fullTextAvailable: Boolean(existing.fullTextAvailable || incoming.fullTextAvailable),
    providers: uniqueStrings([...(existing.providers ?? []), ...(incoming.providers ?? []), existing.provider, incoming.provider]),
    sourceUrls: uniqueStrings([...(existing.sourceUrls ?? []), ...(incoming.sourceUrls ?? []), existing.sourceUrl, incoming.sourceUrl]),
    providerProvenance,
  };
  if (primaryMetadata !== undefined) merged.providerMetadata = primaryMetadata;
  if (Object.keys(metadataByProvider).length > 0) merged.providerMetadataByProvider = metadataByProvider;
  else delete merged.providerMetadataByProvider;
  return merged;
}

function requireSession(db, sessionId) {
  const row = db.prepare("SELECT id FROM sessions WHERE id = ?").get(sessionId);
  if (!row) throw new Error(`PaperTrail session not found: ${sessionId}`);
}

function transaction(db, operation) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = operation();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Preserve the original operation error.
    }
    throw error;
  }
}

export function createPaperTrailStore(config = {}) {
  const dbPath = config.dbPath ?? DEFAULT_DB_PATH;
  const now = typeof config.now === "function" ? config.now : () => new Date().toISOString();
  if (typeof dbPath !== "string" || dbPath.length === 0) throw new TypeError("dbPath must be a non-empty string");

  ensureDatabaseParent(dbPath);
  const db = new DatabaseSync(dbPath);
  let closed = false;
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  runMigrations(db, now);

  function assertOpen() {
    if (closed) throw new Error("PaperTrail store is closed");
  }

  function getSession(id) {
    assertOpen();
    return rowToSession(db.prepare("SELECT * FROM sessions WHERE id = ?").get(id));
  }

  function createSession(input) {
    assertOpen();
    const requested = input ?? {};
    const parsed = SessionRequestSchema.parse({
      ...requested,
      id: requested.id ?? randomUUID(),
      options: requested.options ?? {},
    });
    const createdAt = timestamp(now);
    db.prepare(`
      INSERT INTO sessions(id, question, options_json, model, status, cancel_requested, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'new', 0, ?, ?)
    `).run(parsed.id, parsed.question, serialize(parsed.options), parsed.model ?? null, createdAt, createdAt);
    return getSession(parsed.id);
  }

  function listSessions(limit = 50) {
    assertOpen();
    const boundedLimit = Math.max(1, Math.min(100, Number.isFinite(Number(limit)) ? Math.trunc(Number(limit)) : 50));
    return db.prepare("SELECT * FROM sessions ORDER BY updated_at DESC, id DESC LIMIT ?").all(boundedLimit).map(rowToSession);
  }

  function updateSession(id, patch = {}) {
    assertOpen();
    requireSession(db, id);
    const updates = [];
    const values = [];
    if (patch.question !== undefined) {
      if (typeof patch.question !== "string" || patch.question.trim().length === 0) throw new TypeError("question must be non-empty");
      updates.push("question = ?");
      values.push(patch.question.trim());
    }
    if (patch.options !== undefined) {
      const options = ResearchOptionsSchema.parse(patch.options);
      updates.push("options_json = ?");
      values.push(serialize(options));
    }
    if (patch.model !== undefined) {
      if (patch.model !== null && (typeof patch.model !== "string" || patch.model.trim().length === 0)) throw new TypeError("model must be a non-empty string or null");
      updates.push("model = ?");
      values.push(patch.model === null ? null : patch.model.trim());
    }
    if (patch.status !== undefined) {
      if (typeof patch.status !== "string" || patch.status.trim().length === 0) throw new TypeError("status must be a non-empty string");
      updates.push("status = ?");
      values.push(patch.status.trim());
    }
    if (patch.cancelRequested !== undefined) {
      updates.push("cancel_requested = ?");
      values.push(patch.cancelRequested ? 1 : 0);
    }
    updates.push("updated_at = ?");
    values.push(timestamp(now));
    values.push(id);
    db.prepare(`UPDATE sessions SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    return getSession(id);
  }

  function addEvent(sessionId, type, payload = null) {
    assertOpen();
    requireSession(db, sessionId);
    if (typeof type !== "string" || type.trim().length === 0) throw new TypeError("event type must be non-empty");
    const createdAt = timestamp(now);
    const result = db.prepare("INSERT INTO events(session_id, type, payload_json, created_at) VALUES (?, ?, ?, ?)").run(sessionId, type.trim(), serialize(payload), createdAt);
    const row = db.prepare("SELECT * FROM events WHERE id = ?").get(result.lastInsertRowid);
    db.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").run(createdAt, sessionId);
    return rowToEvent(row);
  }

  function listEvents(sessionId, afterId = 0) {
    assertOpen();
    requireSession(db, sessionId);
    const after = Number.isFinite(Number(afterId)) ? Math.max(0, Math.trunc(Number(afterId))) : 0;
    return db.prepare("SELECT * FROM events WHERE session_id = ? AND id > ? ORDER BY id ASC").all(sessionId, after).map(rowToEvent);
  }

  function getStoredSource(sessionId, sourceId) {
    const row = db.prepare("SELECT * FROM sources WHERE session_id = ? AND source_id = ?").get(sessionId, sourceId);
    return row ? rowToSource(row) : null;
  }

  function findExistingSourceId(sessionId, source) {
    const row = db.prepare(`
      SELECT source_id FROM sources
      WHERE session_id = ?
        AND (
          source_id = ?
          OR (? IS NOT NULL AND doi = ?)
          OR (? IS NOT NULL AND pmid = ?)
          OR (provider = ? AND provider_record_id = ?)
        )
      ORDER BY CASE WHEN source_id = ? THEN 0 ELSE 1 END, source_id
      LIMIT 1
    `).get(
      sessionId,
      source.id,
      source.doi ?? null,
      source.doi ?? null,
      source.pmid ?? null,
      source.pmid ?? null,
      source.provider,
      source.providerRecordId,
      source.id,
    );
    return row?.source_id ?? null;
  }

  function writeSource(sessionId, source) {
    const existingId = findExistingSourceId(sessionId, source);
    const existing = existingId ? getStoredSource(sessionId, existingId) : null;
    const merged = mergeSources(existing, existing ? { ...source, id: existing.id } : source);
    const { parsed, sourceJson } = normalizeSourceForStorage(merged);
    const providerMetadataJson = parsed.providerMetadata === undefined ? null : serialize(parsed.providerMetadata);
    const providerMetadataByProviderJson = parsed.providerMetadataByProvider === undefined ? null : serialize(parsed.providerMetadataByProvider);
    const values = [
      sessionId,
      parsed.id,
      parsed.title,
      serialize(parsed.authors),
      parsed.date,
      parsed.abstract,
      parsed.doi,
      parsed.pmid,
      parsed.provider,
      parsed.sourceUrl,
      parsed.retrievedAt,
      parsed.fullTextAvailable ? 1 : 0,
      parsed.providerRecordId,
      parsed.metadataOrigin,
      serialize(parsed.providers),
      serialize(parsed.sourceUrls),
      serialize(parsed.providerProvenance),
      providerMetadataJson,
      providerMetadataByProviderJson,
      serialize(sourceJson),
    ];
    db.prepare(`
      INSERT INTO sources(
        session_id, source_id, title, authors_json, date, abstract, doi, pmid, provider, source_url,
        retrieved_at, full_text_available, provider_record_id, metadata_origin, providers_json,
        source_urls_json, provider_provenance_json, provider_metadata_json, provider_metadata_by_provider_json,
        source_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id, source_id) DO UPDATE SET
        title = excluded.title,
        authors_json = excluded.authors_json,
        date = excluded.date,
        abstract = excluded.abstract,
        doi = excluded.doi,
        pmid = excluded.pmid,
        provider = excluded.provider,
        source_url = excluded.source_url,
        full_text_available = excluded.full_text_available,
        provider_record_id = excluded.provider_record_id,
        metadata_origin = excluded.metadata_origin,
        providers_json = excluded.providers_json,
        source_urls_json = excluded.source_urls_json,
        provider_provenance_json = excluded.provider_provenance_json,
        provider_metadata_json = excluded.provider_metadata_json,
        provider_metadata_by_provider_json = excluded.provider_metadata_by_provider_json,
        source_json = excluded.source_json
    `).run(...values);
    return getStoredSource(sessionId, parsed.id);
  }

  function upsertSources(sessionId, sources = []) {
    assertOpen();
    requireSession(db, sessionId);
    if (!Array.isArray(sources)) throw new TypeError("sources must be an array");
    return transaction(db, () => sources.map((source) => writeSource(sessionId, source)));
  }

  function getSessionBundle(sessionId) {
    assertOpen();
    if (!getSession(sessionId)) return null;
    const sources = db.prepare("SELECT * FROM sources WHERE session_id = ? ORDER BY source_id").all(sessionId).map(rowToSource);
    const events = listEvents(sessionId);
    const agentRuns = db.prepare("SELECT * FROM agent_runs WHERE session_id = ? ORDER BY created_at ASC, id ASC").all(sessionId).map(rowToAgentRun);
    const claimRows = db.prepare("SELECT * FROM claims WHERE session_id = ? ORDER BY claim_id").all(sessionId);
    const claims = claimRows.map(rowToClaim);
    const evidence = db.prepare("SELECT * FROM evidence WHERE session_id = ? ORDER BY evidence_id").all(sessionId).map(rowToEvidence);
    const evidenceLinks = db.prepare("SELECT * FROM claim_evidence WHERE session_id = ? ORDER BY claim_id, evidence_id, source_id").all(sessionId).map(rowToClaimEvidence);
    const debateRow = db.prepare("SELECT data_json FROM debates WHERE session_id = ?").get(sessionId);
    const reportRow = db.prepare("SELECT report_json, audit_json FROM reports WHERE session_id = ?").get(sessionId);
    return {
      session: getSession(sessionId),
      events,
      sources,
      agentRuns,
      claims,
      evidence,
      evidenceLinks,
      debate: debateRow ? parseJson(debateRow.data_json, null) : null,
      report: reportRow ? parseJson(reportRow.report_json, null) : null,
      audit: reportRow ? parseJson(reportRow.audit_json, null) : null,
    };
  }

  function createAgentRun(input = {}) {
    assertOpen();
    const sessionId = input.sessionId;
    if (typeof sessionId !== "string" || sessionId.length === 0) throw new TypeError("createAgentRun requires sessionId");
    requireSession(db, sessionId);
    const id = input.id ?? randomUUID();
    const createdAt = timestamp(now);
    const startedAt = input.startedAt ?? createdAt;
    db.prepare(`
      INSERT INTO agent_runs(id, session_id, role, status, model, input_json, output_json, error, created_at, started_at, finished_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, NULL, ?)
    `).run(
      id,
      sessionId,
      String(input.role ?? "agent"),
      String(input.status ?? "running"),
      input.model ?? null,
      input.input === undefined ? null : serialize(input.input),
      createdAt,
      startedAt,
      createdAt,
    );
    return rowToAgentRun(db.prepare("SELECT * FROM agent_runs WHERE id = ?").get(id));
  }

  function finishAgentRun(id, patch = {}) {
    assertOpen();
    const current = db.prepare("SELECT * FROM agent_runs WHERE id = ?").get(id);
    if (!current) throw new Error(`PaperTrail agent run not found: ${id}`);
    const finishedAt = patch.finishedAt ?? timestamp(now);
    const updates = ["status = ?", "finished_at = ?", "updated_at = ?"];
    const values = [String(patch.status ?? "completed"), finishedAt, timestamp(now)];
    if (patch.output !== undefined) {
      updates.push("output_json = ?");
      values.push(serialize(patch.output));
    }
    if (patch.error !== undefined) {
      updates.push("error = ?");
      values.push(patch.error === null ? null : String(patch.error));
    }
    if (patch.model !== undefined) {
      updates.push("model = ?");
      values.push(patch.model);
    }
    values.push(id);
    db.prepare(`UPDATE agent_runs SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    return rowToAgentRun(db.prepare("SELECT * FROM agent_runs WHERE id = ?").get(id));
  }

  function saveClaims(sessionId, claims = []) {
    assertOpen();
    requireSession(db, sessionId);
    if (!Array.isArray(claims)) throw new TypeError("claims must be an array");
    return transaction(db, () => {
      const saved = [];
      for (const rawClaim of claims) {
        const candidate = {
          ...rawClaim,
          id: rawClaim?.id ?? rawClaim?.claimId,
          statement: rawClaim?.statement ?? rawClaim?.text,
        };
        const claim = ClaimSchema.parse(candidate);
        const nowValue = timestamp(now);
        db.prepare(`
          INSERT INTO claims(session_id, claim_id, data_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(session_id, claim_id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
        `).run(sessionId, claim.id, serialize(claim), nowValue, nowValue);
        db.prepare("DELETE FROM claim_evidence WHERE session_id = ? AND claim_id = ?").run(sessionId, claim.id);

        const passages = [];
        for (const rawPassage of [
          ...(Array.isArray(rawClaim?.evidencePassages) ? rawClaim.evidencePassages : []),
          ...(Array.isArray(rawClaim?.evidence) ? rawClaim.evidence : []),
        ]) {
          const passageCandidate = {
            ...rawPassage,
            id: rawPassage?.id ?? rawPassage?.evidenceId,
            sourceId: rawPassage?.sourceId ?? rawPassage?.sourceIds?.[0] ?? claim.sourceIds?.[0],
            text: rawPassage?.text ?? rawPassage?.passage ?? rawPassage?.quote,
          };
          const passage = EvidencePassageSchema.parse(passageCandidate);
          passages.push(passage);
          db.prepare(`
            INSERT INTO evidence(session_id, evidence_id, source_id, text, data_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(session_id, evidence_id) DO UPDATE SET source_id = excluded.source_id, text = excluded.text, data_json = excluded.data_json, updated_at = excluded.updated_at
          `).run(sessionId, passage.id, passage.sourceId, passage.text, serialize(passage), nowValue, nowValue);
        }

        const passageById = new Map(passages.map((passage) => [passage.id, passage]));
        const evidenceIds = [...new Set([...(claim.evidenceIds ?? []), ...passages.map((passage) => passage.id)])];
        for (const evidenceId of evidenceIds) {
          if (!passageById.has(evidenceId)) {
            db.prepare(`
              INSERT INTO evidence(session_id, evidence_id, source_id, text, data_json, created_at, updated_at)
              VALUES (?, ?, NULL, NULL, ?, ?, ?)
              ON CONFLICT(session_id, evidence_id) DO NOTHING
            `).run(sessionId, evidenceId, serialize({ id: evidenceId }), nowValue, nowValue);
          }
          const passage = passageById.get(evidenceId);
          const sourceId = passage?.sourceId ?? claim.sourceIds?.[0] ?? "";
          const linkData = (rawClaim?.evidenceLinks ?? []).find((link) => link?.evidenceId === evidenceId) ?? {};
          db.prepare(`
            INSERT INTO claim_evidence(session_id, claim_id, evidence_id, source_id, relationship, data_json)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(session_id, claim_id, evidence_id, source_id) DO UPDATE SET relationship = excluded.relationship, data_json = excluded.data_json
          `).run(sessionId, claim.id, evidenceId, sourceId, linkData.relationship ?? null, serialize(linkData));
        }
        saved.push(claim);
      }
      db.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").run(timestamp(now), sessionId);
      return saved;
    });
  }

  function saveDebate(sessionId, debate) {
    assertOpen();
    requireSession(db, sessionId);
    const value = cloneJson(debate);
    const nowValue = timestamp(now);
    db.prepare(`
      INSERT INTO debates(session_id, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
    `).run(sessionId, serialize(value), nowValue, nowValue);
    db.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").run(nowValue, sessionId);
    return value;
  }

  function saveReport(sessionId, report, audit = null) {
    assertOpen();
    requireSession(db, sessionId);
    const parsedReport = ReportSchema.parse(report);
    const nowValue = timestamp(now);
    db.prepare(`
      INSERT INTO reports(session_id, report_json, audit_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET report_json = excluded.report_json, audit_json = excluded.audit_json, updated_at = excluded.updated_at
    `).run(sessionId, serialize(parsedReport), audit === undefined ? null : serialize(audit), nowValue, nowValue);
    db.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").run(nowValue, sessionId);
    return { report: parsedReport, audit: cloneJson(audit) };
  }

  function requestCancel(sessionId) {
    assertOpen();
    requireSession(db, sessionId);
    const current = getSession(sessionId);
    if (!current.cancelRequested) {
      const nowValue = timestamp(now);
      db.prepare("UPDATE sessions SET cancel_requested = 1, updated_at = ? WHERE id = ?").run(nowValue, sessionId);
      db.prepare("INSERT INTO events(session_id, type, payload_json, created_at) VALUES (?, ?, ?, ?)").run(sessionId, "cancel_requested", serialize({}), nowValue);
    }
    return getSession(sessionId);
  }

  function isCancelRequested(sessionId) {
    assertOpen();
    const row = db.prepare("SELECT cancel_requested FROM sessions WHERE id = ?").get(sessionId);
    return Boolean(row?.cancel_requested);
  }

  function close() {
    if (closed) return;
    db.close();
    closed = true;
  }

  return {
    createSession,
    getSession,
    listSessions,
    updateSession,
    addEvent,
    listEvents,
    upsertSources,
    getSessionBundle,
    createAgentRun,
    finishAgentRun,
    saveClaims,
    saveDebate,
    saveReport,
    requestCancel,
    isCancelRequested,
    close,
  };
}
