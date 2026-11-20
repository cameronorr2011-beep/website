// Orr Biologicals — static site Worker.
//
// The canonical URLs are extension-less ("/algae", "/culturekits"), matching the
// .htaccess clean-URL rules on orrbiologicals.com. Workers Assets rewrites an
// .html request to the extension-less path with a 307, so this Worker keeps the
// clean URL at 200, sends .html to it with a permanent redirect, and serves the
// styled 404 page.

const HTML_CACHE = "public, max-age=300, must-revalidate";
const ASSET_CACHE = "public, max-age=31536000, immutable";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

// Pages that were renamed. A permanent redirect keeps old links, bookmarks and
// search results working after the move.
const LEGACY_PATHS = {
  "/hatcheries": "/algae",
  "/kits": "/culturekits",
};

// ---------------------------------------------------------------- algae desk ---
//
// /articles/algae-news/ is a static page, so the "Refresh the desk" button
// cannot run the digest itself. This route is the manual half: five PubMed
// beats, one Groq edit, ten records the reader has not seen yet. The noon
// edition is still built and committed by .github/workflows/algae-news-daily.yml;
// nothing here writes to the site.

const ALGAE_ORIGINS = new Set([
  "https://orrbiologicals.com",
  "https://www.orrbiologicals.com",
  "https://orr-biologicals-qfepvm.freebuff.page",
  "https://orr-biologicals-qfepvm-preview.freebuff.page",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8080",
]);

const ALGAE_EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const ALGAE_UA = "OrrBiologicals-AlgaeDesk/1.0 (educational website; service@orrbiologicals.com)";
const ALGAE_GROQ = "https://api.groq.com/openai/v1/chat/completions";
const ALGAE_MODEL = "openai/gpt-oss-120b";
const ALGAE_TARGET = 10;
const ALGAE_WINDOW_DAYS = 14;
const ALGAE_PER_BEAT = 12;
const ALGAE_PUBLIC_DIGEST = "https://orrbiologicals.com/articles/algae-news/data/latest.json";

const ALGAE_BEATS = [
  {
    key: "cultivation",
    query: "(microalga*[Title/Abstract] OR phytoplankton[Title/Abstract]) AND " +
      "(photobioreactor[Title/Abstract] OR cultivation[Title/Abstract] OR " +
      "raceway[Title/Abstract] OR bioreactor[Title/Abstract] OR harvesting[Title/Abstract])",
  },
  {
    key: "feed",
    query: "(microalga*[Title/Abstract] OR Spirulina[Title/Abstract] OR " +
      "Chlorella[Title/Abstract] OR Arthrospira[Title/Abstract]) AND " +
      "(feed[Title/Abstract] OR aquaculture[Title/Abstract] OR nutrition[Title/Abstract] OR " +
      "food[Title/Abstract] OR protein[Title/Abstract])",
  },
  {
    key: "water",
    query: "(microalga*[Title/Abstract] OR algal[Title/Abstract]) AND " +
      "(wastewater[Title/Abstract] OR CO2[Title/Abstract] OR carbon[Title/Abstract] OR " +
      "flue[Title/Abstract] OR eutrophication[Title/Abstract])",
  },
  {
    key: "materials",
    query: "(microalga*[Title/Abstract] OR algal[Title/Abstract]) AND " +
      "(astaxanthin[Title/Abstract] OR phycocyanin[Title/Abstract] OR pigment[Title/Abstract] OR " +
      "lipid[Title/Abstract] OR biofuel[Title/Abstract] OR bioplastic[Title/Abstract])",
  },
  {
    key: "methods",
    query: "(microalga*[Title/Abstract] OR cyanobacteri*[Title/Abstract] OR " +
      "phytoplankton[Title/Abstract]) AND (genom*[Title/Abstract] OR transcriptom*[Title/Abstract] OR " +
      "single-cell[Title/Abstract] OR microfluidic[Title/Abstract] OR bloom*[Title/Abstract] OR " +
      "strain[Title/Abstract])",
  },
];

// One press per isolate per few seconds. The page also disables the button
// while a request is in flight, so this is only a backstop against a loop.
let algaeLastRun = 0;

const ALGAE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["picks"],
  properties: {
    picks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["pmid", "topic", "hook"],
        properties: {
          pmid: { type: "string" },
          topic: {
            type: "string",
            description: "2-3 word topic label, e.g. Cultivation, Feed, Carbon, Pigments, Methods",
          },
          hook: {
            type: "string",
            description: "one sentence, max 180 characters, saying what the paper found or did, grounded only in its abstract",
          },
        },
      },
    },
  },
};

function algaeCors(origin) {
  return {
    "Access-Control-Allow-Origin": ALGAE_ORIGINS.has(origin) ? origin : "https://orrbiologicals.com",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}

function algaeJson(status, body, origin, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...algaeCors(origin),
      ...extra,
    },
  });
}

function algaeDay(offset = 0) {
  const when = new Date(Date.now() + offset * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(when);
}

function algaeText(xml) {
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function algaeYearMonthDay(block) {
  const y = block.match(/<Year>(\d{4})/);
  const m = block.match(/<Month>(\d{1,2})/);
  const d = block.match(/<Day>(\d{1,2})/);
  return y && m && d ? `${y[1]}-${m[1].padStart(2, "0")}-${d[1].padStart(2, "0")}` : "";
}

function algaeParse(xml) {
  const records = new Map();
  const chunks = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
  for (const chunk of chunks) {
    const pmid = chunk.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    if (!pmid) continue;
    const title = algaeText((chunk.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/) || [])[1] || "");
    if (!title) continue;
    let pubDate = "";
    const articleDate = chunk.match(/<ArticleDate DateType="Electronic">([\s\S]*?)<\/ArticleDate>/);
    if (articleDate) pubDate = algaeYearMonthDay(articleDate[1]);
    if (!pubDate) {
      const entry = chunk.match(/<PubMedPubDate PubStatus="pubmed">([\s\S]*?)<\/PubMedPubDate>/);
      if (entry) pubDate = algaeYearMonthDay(entry[1]);
    }
    const doi = ((chunk.match(/<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/) || [])[1] || "").trim();
    const abstract = (chunk.match(/<AbstractText[^>]*>[\s\S]*?<\/AbstractText>/g) || [])
      .map(algaeText).join(" ");
    records.set(pmid[1], {
      pmid: pmid[1],
      title,
      journal: algaeText((chunk.match(/<Title>([\s\S]*?)<\/Title>/) || [])[1] || ""),
      pub_date: pubDate,
      url: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${pmid[1]}/`,
      abstract: abstract.slice(0, 900),
    });
  }
  return records;
}

function algaeFirstSentence(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const match = clean.match(/^(.{40,}?[.!?])\s/);
  return (match ? match[1] : clean).slice(0, 180);
}

async function algaeSearch(beat, start, end) {
  const params = new URLSearchParams({
    db: "pubmed",
    term: beat.query,
    mindate: start.replace(/-/g, "/"),
    maxdate: end.replace(/-/g, "/"),
    datetype: "pdat",
    retmax: String(ALGAE_PER_BEAT),
    sort: "pub date",
    retmode: "json",
  });
  const response = await fetch(`${ALGAE_EUTILS}/esearch.fcgi?${params}`, {
    headers: { "User-Agent": ALGAE_UA },
  });
  if (!response.ok) throw new Error(`PubMed search ${beat.key}: HTTP ${response.status}`);
  const data = await response.json();
  return (data.esearchresult && data.esearchresult.idlist) || [];
}

async function algaeRecords(ids) {
  const params = new URLSearchParams({
    db: "pubmed",
    id: ids.slice(0, 120).join(","),
    retmode: "xml",
  });
  const response = await fetch(`${ALGAE_EUTILS}/efetch.fcgi?${params}`, {
    headers: { "User-Agent": ALGAE_UA },
  });
  if (!response.ok) throw new Error(`PubMed fetch: HTTP ${response.status}`);
  return algaeParse(await response.text());
}

async function algaeEdit(env, candidates) {
  if (!env.GROQ_API_KEY) {
    const error = new Error("The desk has no Groq key configured yet.");
    error.status = 503;
    throw error;
  }
  const lines = candidates.map((record) =>
    `PMID ${record.pmid} | ${record.beat} | ${record.pub_date || "date not stated"} | ` +
    `${record.journal.slice(0, 60)}\n    ${record.title}\n    ${record.abstract.slice(0, 200)}`
  );
  const system = [
    "You are the editor of the Algae news desk at Orr Biologicals (orrbiologicals.com).",
    `Choose exactly ${ALGAE_TARGET} papers for a manual refresh of today's digest.`,
    "Rules:",
    "1. Only choose PMIDs that appear in the list. Never invent or rename a paper.",
    "2. Topical variety: no more than three picks from one beat.",
    "3. Freshness: prefer the most recent publication dates.",
    "4. Reader value: concrete findings and methods over reviews that report nothing.",
    "5. The hook is one plain sentence, max 180 characters, saying what the paper did or " +
      "found, using only what the abstract states. No numbers unless the abstract gives " +
      "them exactly. No hype, no exclamation marks.",
    "Return only JSON matching the schema.",
  ].join("\n");

  const response = await fetch(ALGAE_GROQ, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": ALGAE_UA,
    },
    body: JSON.stringify({
      model: ALGAE_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: "Candidates:\n\n" + lines.join("\n") },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "desk_refresh", strict: true, schema: ALGAE_SCHEMA },
      },
      temperature: 0.3,
      max_completion_tokens: 2600,
      reasoning_effort: "low",
    }),
  });
  if (!response.ok) {
    console.warn("algae refresh: groq", response.status, (await response.text()).slice(0, 200));
    const error = new Error("The editor model is not answering right now.");
    error.status = 502;
    throw error;
  }
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

function algaeItem(record, topic, hook) {
  return {
    pmid: record.pmid,
    title: record.title,
    journal: record.journal,
    pub_date: record.pub_date,
    url: record.url,
    topic,
    hook,
  };
}

async function algaeRefresh(request, env) {
  const origin = request.headers.get("Origin") || "";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: algaeCors(origin) });
  }
  if (request.method === "GET") {
    return algaeJson(200, { ok: true, configured: Boolean(env.GROQ_API_KEY) }, origin);
  }
  if (request.method !== "POST") {
    return algaeJson(405, { error: "method_not_allowed" }, origin, { Allow: "GET, POST, OPTIONS" });
  }

  const wait = 8000 - (Date.now() - algaeLastRun);
  if (wait > 0) {
    return algaeJson(429, {
      error: "too_soon",
      message: "The desk just refreshed. Give it a few seconds.",
    }, origin, { "Retry-After": String(Math.ceil(wait / 1000)) });
  }

  const seen = new Set();
  try {
    const body = await request.json();
    if (Array.isArray(body.seen)) {
      for (const id of body.seen.slice(0, 200)) seen.add(String(id));
    }
  } catch (error) {
    // No body is fine: the published digest is still excluded below.
  }

  try {
    const latest = await fetch(`${ALGAE_PUBLIC_DIGEST}?ts=${Date.now()}`, {
      headers: { "User-Agent": ALGAE_UA },
    });
    if (latest.ok) {
      const digest = await latest.json();
      for (const item of digest.items || []) seen.add(String(item.pmid));
    }
  } catch (error) {
    // The published digest is a hint, not a dependency.
  }

  algaeLastRun = Date.now();
  try {
    const today = algaeDay(0);
    const start = algaeDay(-ALGAE_WINDOW_DAYS);
    const beatOf = new Map();
    const ids = [];
    for (const beat of ALGAE_BEATS) {
      let found = [];
      try {
        found = await algaeSearch(beat, start, today);
      } catch (error) {
        console.warn("algae refresh:", error.message);
      }
      for (const id of found) {
        if (!beatOf.has(id)) beatOf.set(id, beat.key);
        if (!ids.includes(id)) ids.push(id);
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    if (!ids.length) {
      return algaeJson(503, {
        error: "no_candidates",
        message: "PubMed is not answering the desk right now. Try again in a minute.",
      }, origin);
    }

    const records = await algaeRecords(ids);
    let candidates = [...records.values()]
      .filter((record) => !seen.has(record.pmid))
      .sort((a, b) => (b.pub_date || "").localeCompare(a.pub_date || ""))
      .slice(0, 45);
    if (candidates.length < ALGAE_TARGET) {
      return algaeJson(503, {
        error: "no_fresh_papers",
        message: "PubMed has no ten fresh papers for the desk right now.",
      }, origin);
    }
    candidates = candidates.map((record) => ({ ...record, beat: beatOf.get(record.pmid) || "research" }));

    const chosen = await algaeEdit(env, candidates);
    const byId = new Map(candidates.map((record) => [record.pmid, record]));
    const items = [];
    const used = new Set();
    for (const pick of chosen.picks || []) {
      const pmid = String(pick.pmid || "").trim();
      const record = byId.get(pmid);
      if (!record || used.has(pmid)) continue;
      used.add(pmid);
      items.push(algaeItem(record, String(pick.topic || "Research").slice(0, 32),
        String(pick.hook || "").slice(0, 200)));
    }
    // Never invent a slot: if the editor came up short, the freshest remaining
    // candidates fill the list.
    for (const record of candidates) {
      if (items.length >= ALGAE_TARGET) break;
      if (used.has(record.pmid)) continue;
      used.add(record.pmid);
      items.push(algaeItem(record, "Research", algaeFirstSentence(record.abstract)));
    }
    if (!items.length) {
      return algaeJson(503, {
        error: "no_items",
        message: "The desk came back empty. Try again in a minute.",
      }, origin);
    }

    return algaeJson(200, {
      date: today,
      generated_at: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
      source: "manual",
      count: items.length,
      items: items.slice(0, ALGAE_TARGET),
    }, origin);
  } catch (error) {
    console.warn("algae refresh failed:", error.message);
    return algaeJson(error.status || 500, {
      error: "refresh_failed",
      message: error.message || "The desk could not refresh.",
    }, origin);
  }
}

function secureHeaders(source, extra = {}) {
  const headers = new Headers(source);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return headers;
}

function withHeaders(response, url) {
  const headers = secureHeaders(response.headers);

  if (/\.(?:js|css)$/i.test(url.pathname)) {
    headers.set("Cache-Control", "public, max-age=3600, must-revalidate");
  } else if (/\.(?:svg|png|jpg|jpeg|webp|woff2?)$/i.test(url.pathname)) {
    headers.set("Cache-Control", ASSET_CACHE);
  } else if (headers.get("content-type")?.includes("text/html")) {
    headers.set("Cache-Control", HTML_CACHE);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function asset(request, env, path) {
  const url = new URL(request.url);
  url.pathname = path;
  return env.ASSETS.fetch(new Request(url.toString(), request));
}

async function notFound(request, env) {
  const page = await asset(request, env, "/404");
  return new Response(page.body, {
    status: 404,
    headers: secureHeaders(page.headers, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    }),
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // The algae desk's manual refresh: /articles/algae-news/ posts here.
    if (pathname === "/api/algae-refresh" || pathname === "/api/algae-refresh/") {
      return algaeRefresh(request, env);
    }

    if (pathname === "/internal" || pathname.startsWith("/internal/")) {
      return new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    // Home is "/", never "/index.html".
    if (pathname === "/index.html" || pathname === "/index") {
      return Response.redirect(new URL("/", url).toString(), 301);
    }

    // Renamed pages keep their old URLs alive as permanent redirects.
    const legacyTarget = LEGACY_PATHS[pathname.replace(/\/$/, "")];
    if (legacyTarget) {
      return Response.redirect(new URL(legacyTarget, url).toString(), 301);
    }

    // A directory is the trailing-slash URL: "/articles/", not "/articles".
    if (pathname === "/articles") {
      return Response.redirect(new URL("/articles/", url).toString(), 301);
    }

    // A directory index is the trailing-slash URL: "/articles/", not
    // "/articles/index.html".
    if (pathname.endsWith("/index.html")) {
      url.pathname = pathname.slice(0, -"index.html".length);
      return Response.redirect(url.toString(), 301);
    }

    // ".html" is not the canonical form anywhere on the site.
    if (pathname.endsWith(".html")) {
      url.pathname = pathname.slice(0, -5);
      return Response.redirect(url.toString(), 301);
    }

    // The error page lives at "/404"; requesting it directly must not become
    // a cacheable 200 through the asset layer's clean-URL rewrite.
    if (pathname === "/404") return notFound(request, env);

    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      // Resolve clean URLs explicitly rather than relying on the asset layer's
      // single guess: "/articles/foo" is served by "articles/foo.html", and
      // "/articles/" by "articles/index.html".
      if (!/\.[a-z0-9]+$/i.test(pathname)) {
        const html = await asset(request, env, `${pathname}.html`);
        if (html.status === 200) return withHeaders(html, url);

        const dir = pathname.replace(/\/$/, "");
        const index = await asset(request, env, `${dir}/index.html`);
        if (index.status === 200) return withHeaders(index, url);
      }
      return notFound(request, env);
    }

    return withHeaders(response, url);
  },
};
