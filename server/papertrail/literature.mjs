import { createHash } from "node:crypto";

import { ResearchOptionsSchema, SourceRecordSchema } from "./schemas.mjs";

const PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const PUBMED_SUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
const PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
const CROSSREF_WORKS_URL = "https://api.crossref.org/works";
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_USER_AGENT = "PaperTrail/1.0 (research evidence retrieval; contact unavailable)";

function cleanText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : null;
}

function normalizeUrl(value) {
  const text = cleanText(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeDoi(value) {
  const text = cleanText(value);
  if (!text) return null;
  return text.replace(/^https?:\/\/doi\.org\//i, "").replace(/^doi:\s*/i, "").replace(/[\s.]+$/, "").toLowerCase() || null;
}

function normalizePmid(value) {
  const text = cleanText(value);
  if (!text) return null;
  const match = /(?:pubmed\s*id|pmid)?\s*:?\s*(\d+)/i.exec(text);
  return match ? match[1] : null;
}

function normalizeAuthors(value) {
  if (!Array.isArray(value)) {
    const text = cleanText(value);
    return text ? [text] : [];
  }
  const authors = [];
  for (const author of value) {
    const name = typeof author === "string"
      ? cleanText(author)
      : cleanText(author?.name ?? author?.literal ?? [author?.given, author?.family].filter(Boolean).join(" "));
    if (name && !authors.includes(name)) authors.push(name);
  }
  return authors;
}

function monthNumber(value) {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const index = months.indexOf(String(value).slice(0, 3).toLowerCase());
  return index >= 0 ? index + 1 : null;
}

function normalizeDate(value) {
  if (Array.isArray(value)) {
    const [year, month, day] = value.map(Number);
    if (Number.isInteger(year) && year >= 1000) {
      if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) return null;
      if (day !== undefined && (!Number.isInteger(day) || day < 1 || day > 31)) return null;
      const mm = Number.isInteger(month) ? month : 1;
      const dd = Number.isInteger(day) ? day : 1;
      return `${String(year).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    }
    return null;
  }
  const text = cleanText(value);
  if (!text) return null;
  let match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(text);
  if (match) {
    const month = Number(match[2]);
    const day = Number(match[3]);
    return month >= 1 && month <= 12 && day >= 1 && day <= 31
      ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
      : null;
  }
  match = /^(\d{4})[-/](\d{1,2})/.exec(text);
  if (match) {
    const month = Number(match[2]);
    return month >= 1 && month <= 12 ? `${match[1]}-${match[2].padStart(2, "0")}-01` : null;
  }
  match = /^(\d{4})\s+([A-Za-z]{3,})\s+(\d{1,2})/.exec(text);
  if (match) {
    const month = monthNumber(match[2]);
    if (month) return `${match[1]}-${String(month).padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  }
  match = /^(\d{4})\s+([A-Za-z]{3,})/.exec(text);
  if (match) {
    const month = monthNumber(match[2]);
    if (month) return `${match[1]}-${String(month).padStart(2, "0")}-01`;
  }
  match = /\b(\d{4})\b/.exec(text);
  return match ? `${match[1]}-01-01` : null;
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return ["true", "yes", "1"].includes(value.trim().toLowerCase());
  return false;
}

function dateParts(value) {
  if (!value || typeof value !== "object") return null;
  const parts = value["date-parts"]?.[0] ?? value.dateParts?.[0];
  return Array.isArray(parts) ? normalizeDate(parts) : normalizeDate(value["date-time"] ?? value.dateTime);
}

function retrievedAt(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.length > 0) return value;
  return new Date().toISOString();
}

function hashTitle(title) {
  return createHash("sha256").update(title).digest("hex").slice(0, 20);
}

function sourceIdFor(provider, { doi, pmid, providerRecordId, title }) {
  if (doi) return `doi:${doi}`;
  if (pmid) return `pmid:${pmid}`;
  if (providerRecordId) return `${provider}:${providerRecordId}`;
  return `${provider}:title-${hashTitle(normalizeTitle(title))}`;
}

function providerProvenance(provider, record, normalized) {
  const supplied = record?.providerProvenance?.[0];
  return [{
    provider,
    providerRecordId: normalized.providerRecordId,
    sourceUrl: normalized.sourceUrl,
    doi: normalized.doi,
    pmid: normalized.pmid,
    metadataOrigin: "provider",
    ...(supplied && typeof supplied === "object" ? {
      provider: cleanText(supplied.provider) ?? provider,
      providerRecordId: cleanText(supplied.providerRecordId) ?? normalized.providerRecordId,
      sourceUrl: normalizeUrl(supplied.sourceUrl) ?? normalized.sourceUrl,
      doi: normalizeDoi(supplied.doi) ?? normalized.doi,
      pmid: normalizePmid(supplied.pmid) ?? normalized.pmid,
    } : {}),
  }];
}

function normalizedSource({ provider, title, authors, date, abstract, doi, pmid, sourceUrl, retrieved, fullTextAvailable, providerRecordId, raw }) {
  const cleanTitle = cleanText(title);
  const recordId = cleanText(providerRecordId) ?? (pmid || doi || null);
  if (!cleanTitle || !recordId) return null;
  const normalized = {
    id: sourceIdFor(provider, { doi, pmid, providerRecordId: recordId, title: cleanTitle }),
    title: cleanTitle,
    authors: normalizeAuthors(authors),
    date: normalizeDate(date),
    abstract: cleanText(abstract),
    doi: normalizeDoi(doi),
    pmid: normalizePmid(pmid),
    provider,
    sourceUrl: normalizeUrl(sourceUrl),
    retrievedAt: retrievedAt(retrieved),
    fullTextAvailable: normalizeBoolean(fullTextAvailable),
    providerRecordId: recordId,
    metadataOrigin: "provider",
    providers: [provider],
    sourceUrls: normalizeUrl(sourceUrl) ? [normalizeUrl(sourceUrl)] : [],
    providerProvenance: [],
    providerMetadata: raw,
  };
  normalized.providerProvenance = providerProvenance(provider, raw, normalized);
  return SourceRecordSchema.parse(normalized);
}

function pubmedArticleId(record) {
  if (Array.isArray(record?.articleids)) {
    const doi = record.articleids.find((item) => String(item?.idtype).toLowerCase() === "doi");
    if (doi?.value) return { doi: normalizeDoi(doi.value) };
  }
  return {};
}

/** Normalize a PubMed esummary/efetch-compatible record without inventing metadata. */
export function normalizePubMedRecord(record, options = {}) {
  if (!record || typeof record !== "object") return null;
  const normalizedOptions = typeof options === "string" ? { retrievedAt: options } : (options && typeof options === "object" ? options : {});
  const ids = pubmedArticleId(record);
  const pmid = normalizePmid(record.pmid ?? record.uid ?? record.id ?? record.PMID);
  const doi = normalizeDoi(record.doi ?? record.DOI ?? ids.doi);
  const sourceUrl = record.sourceUrl ?? record.url ?? (pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null);
  const abstract = record.abstract ?? record.abstractText ?? record.AbstractText;
  const fullTextAvailable = record.fullTextAvailable ?? Boolean(record.pmcid ?? record.pmc ?? record.pmcids ?? record.fullTextUrlList);
  return normalizedSource({
    provider: "pubmed",
    title: record.title ?? record.articleTitle,
    authors: record.authors ?? record.authorlist ?? record.authorList,
    date: record.date ?? record.pubdate ?? record.pubDate ?? record.epubdate ?? record.epubDate,
    abstract,
    doi,
    pmid,
    sourceUrl,
    retrieved: normalizedOptions.retrievedAt,
    fullTextAvailable,
    providerRecordId: record.providerRecordId ?? record.uid ?? record.pmid ?? record.id,
    raw: record,
  });
}

function crossrefDoi(record) {
  return normalizeDoi(record?.DOI ?? record?.doi ?? record?.URL?.match?.(/doi\.org\/(.+)$/i)?.[1]);
}

/** Normalize a Crossref works item while retaining its original provider record. */
export function normalizeCrossrefRecord(record, options = {}) {
  if (!record || typeof record !== "object") return null;
  const normalizedOptions = typeof options === "string" ? { retrievedAt: options } : (options && typeof options === "object" ? options : {});
  const doi = crossrefDoi(record);
  const sourceUrl = normalizeUrl(record.URL) ?? (doi ? `https://doi.org/${doi}` : null);
  const links = Array.isArray(record.link) ? record.link : [];
  const fullTextAvailable = record.fullTextAvailable ?? links.some((link) => /pdf|html|xml/i.test(`${link?.["content-type"] ?? ""} ${link?.URL ?? ""}`));
  const date = dateParts(record.issued) ?? dateParts(record.published) ?? dateParts(record["published-online"]) ?? dateParts(record["published-print"]) ?? dateParts(record.created);
  const providerRecordId = record.providerRecordId ?? record.id ?? doi;
  return normalizedSource({
    provider: "crossref",
    title: Array.isArray(record.title) ? record.title[0] : record.title,
    authors: record.author,
    date,
    abstract: record.abstract,
    doi,
    pmid: record.pmid ?? record.PMID,
    sourceUrl,
    retrieved: normalizedOptions.retrievedAt,
    fullTextAvailable,
    providerRecordId,
    raw: record,
  });
}

export function normalizeTitle(value) {
  return cleanText(value)?.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

function sourceKeys(source) {
  const keys = [];
  const doi = normalizeDoi(source.doi);
  const pmid = normalizePmid(source.pmid);
  const title = normalizeTitle(source.title);
  if (doi) keys.push(`doi:${doi}`);
  if (pmid) keys.push(`pmid:${pmid}`);
  if (title) keys.push(`title:${title}`);
  return keys;
}

function mergeSourceRecords(existing, incoming) {
  const provenance = [];
  const seenProvenance = new Set();
  for (const item of [...(existing.providerProvenance ?? []), ...(incoming.providerProvenance ?? [])]) {
    const key = `${item.provider}\u0000${item.providerRecordId}`;
    if (seenProvenance.has(key)) continue;
    seenProvenance.add(key);
    provenance.push(item);
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
    title: existing.title || incoming.title,
    authors: [...new Set([...(existing.authors ?? []), ...(incoming.authors ?? [])])],
    date: existing.date ?? incoming.date ?? null,
    abstract: (incoming.abstract?.length ?? 0) > (existing.abstract?.length ?? 0) ? incoming.abstract : existing.abstract,
    doi: existing.doi ?? incoming.doi ?? null,
    pmid: existing.pmid ?? incoming.pmid ?? null,
    sourceUrl: existing.sourceUrl ?? incoming.sourceUrl ?? null,
    fullTextAvailable: Boolean(existing.fullTextAvailable || incoming.fullTextAvailable),
    providers: [...new Set([...(existing.providers ?? []), ...(incoming.providers ?? []), existing.provider, incoming.provider])],
    sourceUrls: [...new Set([...(existing.sourceUrls ?? []), ...(incoming.sourceUrls ?? []), existing.sourceUrl, incoming.sourceUrl].filter(Boolean))],
    providerProvenance: provenance,
  };
  if (primaryMetadata !== undefined) merged.providerMetadata = primaryMetadata;
  if (Object.keys(metadataByProvider).length > 0) merged.providerMetadataByProvider = metadataByProvider;
  return SourceRecordSchema.parse(merged);
}

/** Deduplicate by DOI, PMID, then normalized title, retaining all provider provenance. */
export function dedupeSources(sources = []) {
  if (!Array.isArray(sources)) return [];
  const output = [];
  const keyToIndex = new Map();
  for (const candidate of sources) {
    const result = SourceRecordSchema.safeParse(candidate);
    if (!result.success) continue;
    const source = result.data;
    const keys = sourceKeys(source);
    const matchingIndexes = [...new Set(keys.map((key) => keyToIndex.get(key)).filter((index) => index !== undefined))];
    if (matchingIndexes.length === 0) {
      const index = output.push(source) - 1;
      keys.forEach((key) => keyToIndex.set(key, index));
      continue;
    }
    const index = Math.min(...matchingIndexes);
    let merged = output[index];
    for (const otherIndex of matchingIndexes.slice(1).sort((a, b) => b - a)) {
      merged = mergeSourceRecords(merged, output[otherIndex]);
      output.splice(otherIndex, 1);
      for (const [key, mappedIndex] of keyToIndex.entries()) {
        if (mappedIndex === otherIndex) keyToIndex.set(key, index);
        else if (mappedIndex > otherIndex) keyToIndex.set(key, mappedIndex - 1);
      }
    }
    merged = mergeSourceRecords(merged, source);
    output[index] = merged;
    sourceKeys(merged).forEach((key) => keyToIndex.set(key, index));
  }
  return output;
}

class ProviderHttpError extends Error {
  constructor(provider, status, url) {
    super(`${provider} returned HTTP ${status}`);
    this.name = "ProviderHttpError";
    this.provider = provider;
    this.status = status;
    this.url = url;
  }
}

function timeoutError(provider) {
  const error = new Error(`${provider} request timed out`);
  error.name = "TimeoutError";
  error.code = "ETIMEDOUT";
  error.provider = provider;
  return error;
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs, provider) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(String(url), { ...init, signal: controller.signal });
    const status = Number(response?.status);
    if (response?.ok === false || (Number.isFinite(status) && (status === 429 || status >= 400))) {
      throw new ProviderHttpError(provider, Number.isFinite(status) ? status : 500, url);
    }
    return response;
  } catch (error) {
    if (controller.signal.aborted) throw timeoutError(provider);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function readWithTimeout(reader, timeoutMs, provider) {
  let timer;
  try {
    return await Promise.race([
      reader(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(timeoutError(provider)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function responseJson(response, timeoutMs, provider) {
  if (typeof response?.json === "function") return readWithTimeout(() => response.json(), timeoutMs, provider);
  if (typeof response?.text === "function") return readWithTimeout(async () => JSON.parse(await response.text()), timeoutMs, provider);
  throw new Error("Provider response had no JSON reader");
}

async function responseText(response, timeoutMs, provider) {
  if (typeof response?.text === "function") return readWithTimeout(() => response.text(), timeoutMs, provider);
  if (typeof response?.json === "function") return readWithTimeout(async () => JSON.stringify(await response.json()), timeoutMs, provider);
  throw new Error("Provider response had no text reader");
}

function statusForError(error) {
  if (error?.code === "ETIMEDOUT" || error?.name === "TimeoutError" || error?.name === "AbortError") return "timeout";
  if (error instanceof ProviderHttpError) {
    if (error.status === 429) return "rate_limited";
    if (error.status >= 500) return "unavailable";
    return "http_error";
  }
  return "error";
}

function warningForError(provider, error) {
  const status = statusForError(error);
  return `[${provider}] ${status}: ${error instanceof Error ? error.message : String(error)}`;
}

function parseXmlTag(block, tagName) {
  const expression = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return cleanText(block.match(expression)?.[1]);
}

function parsePubmedFetchXml(xml) {
  const records = [];
  const blocks = String(xml ?? "").match(/<PubmedArticle[\s\S]*?<\/PubmedArticle>/gi) ?? [];
  for (const block of blocks) {
    const pmid = parseXmlTag(block, "PMID");
    const title = parseXmlTag(block, "ArticleTitle");
    const abstractParts = [...block.matchAll(/<AbstractText(?:\s[^>]*)?>([\s\S]*?)<\/AbstractText>/gi)]
      .map((match) => cleanText(match[1]))
      .filter(Boolean);
    const pmc = block.match(/<ArticleId IdType=["']pmc["']>([^<]+)<\/ArticleId>/i)?.[1];
    const doi = block.match(/<ArticleId IdType=["']doi["']>([^<]+)<\/ArticleId>/i)?.[1];
    const authorBlocks = [...block.matchAll(/<Author(?:\s[^>]*)?>([\s\S]*?)<\/Author>/gi)];
    const authors = authorBlocks.map((match) => {
      const inner = match[1];
      return cleanText(parseXmlTag(inner, "CollectiveName") ?? [parseXmlTag(inner, "ForeName"), parseXmlTag(inner, "LastName")].filter(Boolean).join(" "));
    }).filter(Boolean);
    const date = parseXmlTag(block, "ArticleDate") ?? parseXmlTag(block, "PubDate");
    if (pmid || title || abstractParts.length > 0) {
      records.push({
        uid: pmid,
        pmid,
        doi,
        title,
        authors,
        abstract: abstractParts.join(" ") || null,
        pubdate: date,
        pmcid: pmc,
        fullTextAvailable: Boolean(pmc),
      });
    }
  }
  return records;
}

function pubmedDateFromSummary(record) {
  return record.pubdate ?? record.epubdate ?? record.sortpubdate ?? null;
}

function createPubMedProvider({ fetchImpl, timeoutMs, userAgent, baseUrl = PUBMED_SEARCH_URL, summaryUrl = PUBMED_SUMMARY_URL, fetchUrl = PUBMED_FETCH_URL }) {
  return {
    name: "pubmed",
    async search(query, context = {}) {
      const maxResults = Math.max(1, Math.min(100, Math.trunc(context.maxResults ?? 25)));
      const headers = { Accept: "application/json", "User-Agent": userAgent };
      const searchUrl = new URL(baseUrl);
      searchUrl.search = new URLSearchParams({
        db: "pubmed",
        term: query,
        retmode: "json",
        retmax: String(maxResults),
        sort: "relevance",
        ...(context.dateFrom ? { mindate: context.dateFrom } : {}),
        ...(context.dateTo ? { maxdate: context.dateTo } : {}),
        ...(context.email ? { email: context.email } : {}),
      }).toString();
      const warnings = [];
      let searchData;
      try {
        searchData = await responseJson(await fetchWithTimeout(fetchImpl, searchUrl, { headers }, timeoutMs, "pubmed"), timeoutMs, "pubmed");
      } catch (error) {
        return { records: [], warnings: [warningForError("pubmed", error)], status: statusForError(error) };
      }
      const ids = searchData?.esearchresult?.idlist;
      if (!Array.isArray(ids)) return { records: [], warnings: ["[pubmed] malformed esearch response: idlist is missing"], status: "malformed" };
      if (ids.length === 0) return { records: [], warnings, status: "empty" };

      const summaryEndpoint = new URL(summaryUrl);
      summaryEndpoint.search = new URLSearchParams({
        db: "pubmed",
        id: ids.slice(0, maxResults).join(","),
        retmode: "json",
        ...(context.email ? { email: context.email } : {}),
      }).toString();
      let summaryData;
      try {
        summaryData = await responseJson(await fetchWithTimeout(fetchImpl, summaryEndpoint, { headers }, timeoutMs, "pubmed"), timeoutMs, "pubmed");
      } catch (error) {
        return { records: [], warnings: [...warnings, warningForError("pubmed", error)], status: statusForError(error) };
      }
      const summaryResult = summaryData?.result;
      if (!summaryResult || typeof summaryResult !== "object") {
        return { records: [], warnings: [...warnings, "[pubmed] malformed esummary response: result is missing"], status: "malformed" };
      }

      const rawRecords = ids.slice(0, maxResults).map((id) => summaryResult[id] ?? { uid: id }).filter((record) => record && typeof record === "object");
      let abstractRecords = [];
      if (context.includeAbstract !== false) {
        const fetchEndpoint = new URL(fetchUrl);
        fetchEndpoint.search = new URLSearchParams({
          db: "pubmed",
          id: ids.slice(0, maxResults).join(","),
          rettype: "full",
          retmode: "xml",
          ...(context.email ? { email: context.email } : {}),
        }).toString();
        try {
          const xml = await responseText(await fetchWithTimeout(fetchImpl, fetchEndpoint, { headers: { ...headers, Accept: "application/xml" } }, timeoutMs, "pubmed"), timeoutMs, "pubmed");
          abstractRecords = parsePubmedFetchXml(xml);
        } catch (error) {
          warnings.push(warningForError("pubmed", error));
        }
      }
      const abstractByPmid = new Map(abstractRecords.map((record) => [normalizePmid(record.pmid ?? record.uid), record]));
      const records = rawRecords.map((record) => {
        const id = normalizePmid(record.uid ?? record.pmid);
        const detail = abstractByPmid.get(id);
        return normalizePubMedRecord({
          ...record,
          ...(detail ?? {}),
          uid: record.uid ?? id,
          pubdate: pubmedDateFromSummary(record) ?? detail?.pubdate,
          abstract: detail?.abstract ?? record.abstract,
        }, { retrievedAt: context.retrievedAt });
      }).filter(Boolean);
      if (records.length === 0) {
        warnings.push("[pubmed] response contained no records with usable title and provider ID");
        return { records, warnings, status: "malformed" };
      }
      return { records, warnings, status: warnings.length > 0 ? "partial" : "ok" };
    },
  };
}

function createCrossrefProvider({ fetchImpl, timeoutMs, userAgent, baseUrl = CROSSREF_WORKS_URL }) {
  return {
    name: "crossref",
    async search(query, context = {}) {
      const maxResults = Math.max(1, Math.min(100, Math.trunc(context.maxResults ?? 25)));
      const endpoint = new URL(baseUrl);
      endpoint.search = new URLSearchParams({
        "query.bibliographic": query,
        rows: String(maxResults),
        select: "DOI,title,author,issued,published,published-online,published-print,created,abstract,URL,link,subtype",
        ...(context.email ? { mailto: context.email } : {}),
      }).toString();
      try {
        const response = await fetchWithTimeout(fetchImpl, endpoint, { headers: { Accept: "application/json", "User-Agent": userAgent } }, timeoutMs, "crossref");
        const data = await responseJson(response, timeoutMs, "crossref");
        const items = data?.message?.items;
        if (!Array.isArray(items)) return { records: [], warnings: ["[crossref] malformed works response: message.items is missing"], status: "malformed" };
        if (items.length === 0) return { records: [], warnings: [], status: "empty" };
        const records = items.slice(0, maxResults).map((item) => normalizeCrossrefRecord(item, { retrievedAt: context.retrievedAt })).filter(Boolean);
        if (records.length === 0) return { records, warnings: ["[crossref] response contained no records with usable title and provider ID"], status: "malformed" };
        return { records, warnings: [], status: "ok" };
      } catch (error) {
        return { records: [], warnings: [warningForError("crossref", error)], status: statusForError(error) };
      }
    },
  };
}

/** Create real, fetch-backed literature providers. */
export function createLiteratureProviders({ fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS, userAgent = DEFAULT_USER_AGENT, ...config } = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl must be a function");
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new TypeError("timeoutMs must be positive");
  return {
    pubmed: createPubMedProvider({ fetchImpl, timeoutMs, userAgent, ...config }),
    crossref: createCrossrefProvider({ fetchImpl, timeoutMs, userAgent, ...config }),
  };
}

export function buildSearchQueries(question, options = {}) {
  const parsedOptions = ResearchOptionsSchema.parse(options);
  const baseQuestion = cleanText(question);
  if (!baseQuestion) return [];
  const candidates = [
    baseQuestion,
    ...parsedOptions.queryVariants,
    ...parsedOptions.additionalQueries,
  ];
  const queries = [];
  for (const candidate of candidates) {
    const query = cleanText(candidate);
    if (!query) continue;
    if (!queries.some((existing) => existing.toLocaleLowerCase() === query.toLocaleLowerCase())) queries.push(query);
    if (queries.length >= parsedOptions.maxQueries) break;
  }
  return queries;
}

function providerFor(providers, name) {
  if (!providers) return null;
  const candidate = providers[name];
  if (typeof candidate === "function") return { search: candidate };
  if (candidate && typeof candidate.search === "function") return candidate;
  if (candidate && typeof candidate.retrieve === "function") return { search: candidate.retrieve.bind(candidate) };
  return null;
}

/**
 * Run bounded provider searches. A failed provider contributes a warning and
 * status only; no placeholder or fabricated source is returned.
 */
export async function retrieveSources({ question, options = {}, providers } = {}) {
  const parsedOptions = ResearchOptionsSchema.parse(options);
  const queries = buildSearchQueries(question, parsedOptions);
  const warnings = [];
  const allSources = [];
  const providerStatuses = {};
  const retrieved = new Date().toISOString();
  const maxPerProvider = parsedOptions.perProviderMaxResults ?? parsedOptions.maxResults;

  for (const providerName of parsedOptions.providers) {
    const provider = providerFor(providers, providerName);
    const providerWarnings = [];
    let providerCount = 0;
    let status = "empty";
    let queryCount = 0;
    if (!provider) {
      const warning = `[${providerName}] provider is not configured`;
      warnings.push(warning);
      providerStatuses[providerName] = { status: "unavailable", records: 0, queries: 0, warnings: [warning] };
      continue;
    }

    for (const query of queries) {
      if (providerCount >= maxPerProvider) break;
      queryCount += 1;
      try {
        const result = await provider.search(query, {
          ...parsedOptions,
          maxResults: Math.min(maxPerProvider - providerCount, parsedOptions.maxResults),
          retrievedAt: retrieved,
        });
        const resultWarnings = Array.isArray(result?.warnings) ? result.warnings.map(String) : [];
        providerWarnings.push(...resultWarnings);
        warnings.push(...resultWarnings);
        const rawRecords = Array.isArray(result) ? result : (Array.isArray(result?.records) ? result.records : result?.sources);
        if (!Array.isArray(rawRecords)) {
          const warning = `[${providerName}] provider returned no records array`;
          providerWarnings.push(warning);
          warnings.push(warning);
          status = "malformed";
          continue;
        }
        const normalized = rawRecords.map((record) => {
          const alreadyNormalized = SourceRecordSchema.safeParse(record);
          if (alreadyNormalized.success) return alreadyNormalized.data;
          if (providerName === "pubmed") return normalizePubMedRecord(record, { retrievedAt: retrieved });
          if (providerName === "crossref") return normalizeCrossrefRecord(record, { retrievedAt: retrieved });
          const source = SourceRecordSchema.safeParse(record);
          return source.success ? source.data : null;
        }).filter(Boolean);
        allSources.push(...normalized);
        providerCount += normalized.length;
        if (normalized.length > 0) status = providerWarnings.length > 0 ? "partial" : "ok";
        else if (result?.status) status = String(result.status);
      } catch (error) {
        const warning = warningForError(providerName, error);
        providerWarnings.push(warning);
        warnings.push(warning);
        status = statusForError(error);
      }
    }
    if (providerCount === 0 && providerWarnings.length === 0) status = "empty";
    if (providerCount > 0 && providerWarnings.length > 0 && status === "ok") status = "partial";
    providerStatuses[providerName] = { status, records: providerCount, queries: queryCount, warnings: providerWarnings };
  }

  const sources = dedupeSources(allSources).slice(0, parsedOptions.maxResults);
  return { sources, queries, warnings, providerStatuses };
}

export { DEFAULT_TIMEOUT_MS, DEFAULT_USER_AGENT };
