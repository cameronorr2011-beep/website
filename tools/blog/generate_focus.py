#!/usr/bin/env python3
"""
Cyanoflow "Focus of the Day" generator — Orr Biologicals
========================================================

Once a day (GitHub Actions cron, or run locally) this script:

  1. Searches PubMed's live E-utilities API for recent peer-reviewed
     algae / cyanobacteria / microalgae research (last 7 days).
  2. Pulls real abstracts for the most relevant hits.
  3. Feeds them to GPT-OSS-120B served by Groq, which picks the most
     interesting paper and writes the day's "Focus of the Day" post as
     structured JSON (grounded in the abstract — no invented findings).
  4. Writes website/data/focus/<date>.json, updates website/data/focus/index.json,
     and regenerates website/data/focus/search-index.json for the Blog tab's
     search bar.

Idempotent: re-running on the same date overwrites that date's file.
Fail-closed: if the API fails, nothing is written and the script exits 1.

Env:
  groq_api_key (or GROQ_API_KEY)  — Groq API key
  GROQ_MODEL (optional)           — default: openai/gpt-oss-120b

Usage:
  python tools/blog/generate_focus.py                  # today's focus
  python tools/blog/generate_focus.py --date 2026-09-20  # backfill a past date
  python tools/blog/generate_focus.py --backfill 14    # widen search window to 14 days
"""

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "blog" / "data" / "focus"
MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")

# PubMed E-utilities — free, no key required (polite-pool UA attached).
EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
SEARCH_TERMS = [
    'microalgae[Title/Abstract] AND microalga*[Title/Abstract]',
    'Chlorella[Title/Abstract] AND (growth[Title/Abstract] OR lipid[Title/Abstract])',
    'Spirulina[Title/Abstract] OR Arthrospira[Title/Abstract]',
    'cyanobacteria[Title/Abstract] AND (pheno*[Title/Abstract] OR imaging[Title/Abstract])',
    'microalga*[Title/Abstract] AND (bioreactor[Title/Abstract] OR photobioreactor[Title/Abstract])',
]

UA = "OrrBiologicals-FocusBot/1.0 (educational website; contact: service@orrbiologicals.com)"
# Groq sits behind Cloudflare, which blocks non-browser client signatures
# (error 1010). A plain browser-style UA is required for API calls.
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def log(msg: str) -> None:
    # ASCII-safe: Windows cp1252 consoles choke on typographic characters.
    safe = ("[focus] " + msg).encode("ascii", "replace").decode("ascii")
    print(safe, flush=True)


def load_env_file() -> None:
    """Load KEY=VALUE pairs from the workspace .env (never overrides real env vars)."""
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k and v and k not in os.environ:
            os.environ[k] = v


def http_json(url: str, params: dict, timeout: int = 30):
    qs = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{url}?{qs}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def http_text(url: str, params: dict, timeout: int = 30) -> str:
    qs = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{url}?{qs}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8")


# ---------------------------------------------------------------- PubMed ---

def pubmed_search(days: int, limit: int = 12) -> list[str]:
    """Return recent PubMed PMIDs matching the algae queries (last `days` days)."""
    start = (date.today() - timedelta(days=days)).strftime("%Y/%m/%d")
    end = date.today().strftime("%Y/%m/%d")
    return pubmed_search_window(start, end, limit)


def pubmed_search_window(start: str, end: str, limit: int = 12) -> list[str]:
    """Same, but with an explicit YYYY/MM/DD date window (for backfills)."""
    pmids: list[str] = []
    for term in SEARCH_TERMS:
        try:
            data = http_json(f"{EUTILS}/esearch.fcgi", {
                "db": "pubmed",
                "term": term,
                "mindate": start,
                "maxdate": end,
                "datetype": "pdat",
                "retmax": limit,
                "sort": "relevance",
                "retmode": "json",
            })
            ids = data.get("esearchresult", {}).get("idlist", [])
            log(f"pubmed: '{term[:44]}...' -> {len(ids)} hits")
            time.sleep(0.45)  # E-utilities rate limit courtesy
            for pid in ids:
                if pid not in pmids:
                    pmids.append(pid)
        except Exception as e:  # keep going — one failed query is fine
            log(f"pubmed: query failed ({e}); continuing")
    return pmids


def pubmed_fetch(pmids: list[str]) -> list[dict]:
    """Fetch title + abstract + metadata for the given PMIDs."""
    if not pmids:
        return []
    xml = http_text(f"{EUTILS}/efetch.fcgi", {
        "db": "pubmed", "id": ",".join(pmids[:20]), "retmode": "xml",
    })
    articles = []
    for chunk in re.findall(r"<PubmedArticle>.*?</PubmedArticle>", xml, re.S):
        def grab(pattern: str, default: str = "") -> str:
            m = re.search(pattern, chunk, re.S)
            return re.sub(r"\s+", " ", m.group(1)).strip() if m else default
        pmid = grab(r"<PMID[^>]*>(\d+)</PMID>")
        title = grab(r"<ArticleTitle>(.*?)</ArticleTitle>")
        abstract = " ".join(grab(p) for p in (
            r"<AbstractText[^>]*>(.*?)</AbstractText>",))
        journal = grab(r"<Title>(.*?)</Title>")
        year = grab(r"<PubDate>.*?<Year>(\d{4})</Year>.*?</PubDate>")
        doi = grab(r"<ArticleId IdType=\"doi\">(.*?)</ArticleId>")
        authors = re.findall(r"<Author[^>]*>.*?<LastName>(.*?)</LastName>", chunk, re.S)
        if pmid and title and len(abstract) > 200:
            articles.append({
                "pmid": pmid,
                "title": title,
                "abstract": abstract,
                "journal": journal,
                "year": year,
                "doi": doi,
                "authors": ", ".join(authors[:3]) + (" et al." if len(authors) > 3 else ""),
            })
    log(f"pubmed: fetched {len(articles)} usable abstracts")
    return articles


# ------------------------------------------------------------------ Groq ---

GROQ_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "slug": {"type": "string",
                 "description": "kebab-case url slug, 3-6 words, no dates"},
        "title": {"type": "string",
                  "description": "plain-language headline, max 12 words"},
        "dek": {"type": "string",
                "description": "one-sentence summary, max 240 chars"},
        "body": {"type": "string",
                 "description": "3-4 short markdown paragraphs explaining the finding for a curious non-specialist, strictly grounded in the abstract; no invented numbers or claims; plain paragraphs separated by \\n\\n; no headings, no markdown syntax beyond plain text"},
        "takeaways": {"type": "array", "items": {"type": "string"},
                      "description": "2-3 bullet points, each max 110 chars"},
        "tags": {"type": "array", "items": {"type": "string"},
                 "description": "2-4 short uppercase tags like GROWTH, PIGMENTS, BIOFUELS"},
        "why_it_matters": {"type": "string",
                           "description": "one sentence connecting the finding to microalgae biotech, max 180 chars"},
    },
    "required": ["slug", "title", "dek", "body", "takeaways", "tags",
                 "why_it_matters"],
}


def groq_focus(article: dict, today: str) -> dict:
    """Call GPT-OSS-120B on Groq to write the day's focus post."""
    api_key = os.environ.get("groq_api_key") or os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("groq_api_key / GROQ_API_KEY not set")

    system = (
        "You write the daily research brief for Cyanoflow, an AI single-cell "
        "microalgae discovery platform by Orr Biologicals. You receive ONE real "
        "peer-reviewed abstract. Summarize it for curious non-specialists. "
        "STRICT GROUNDING RULES: use only facts present in the abstract; never "
        "invent numbers, results, or claims; if the abstract does not say "
        "something, do not say it. Tone: precise, warm, plain language, no hype. "
        "Return ONLY JSON matching the provided schema."
    )
    user = (
        f"Date: {today}\n"
        f"Journal: {article['journal']} ({article['year']})\n"
        f"Authors: {article['authors']}\n"
        f"Title: {article['title']}\n\n"
        f"Abstract:\n{article['abstract']}\n"
    )

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "focus_post",
                "schema": GROQ_SCHEMA,
                "strict": True,
            },
        },
        "temperature": 0.5,
        "max_completion_tokens": 2048,
        "reasoning_effort": "low",
    }
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": BROWSER_UA,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        data = json.loads(r.read().decode("utf-8"))
    content = data["choices"][0]["message"]["content"]
    post = json.loads(content)
    log(f"groq: model={data.get('model', MODEL)} usage={data.get('usage', {}).get('total_tokens', '?')} tokens")
    return post


# ------------------------------------------------------------- assembly ---

def existing_pmids() -> set:
    """PMIDs already used by past posts, so the same paper never repeats."""
    seen: set = set()
    if not DATA_DIR.exists():
        return seen
    for f in DATA_DIR.glob("????-??-??.json"):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
            pid = str(d.get("source", {}).get("pmid", ""))
            if pid:
                seen.add(pid)
        except Exception:
            pass
    return seen


def build_post(article: dict, post: dict, today: str) -> dict:
    slug = re.sub(r"[^a-z0-9]+", "-", post.get("slug", "focus")).strip("-")[:60] or "focus"
    tags = [str(t).upper()[:18] for t in post.get("tags", [])][:4]
    return {
        "date": today,
        "slug": slug,
        "title": post.get("title", "Focus of the Day")[:140],
        "dek": post.get("dek", "")[:280],
        "body": post.get("body", "").strip(),
        "takeaways": [str(t)[:130] for t in post.get("takeaways", [])][:3],
        "tags": tags,
        "why_it_matters": post.get("why_it_matters", "")[:220],
        "source": {
            "pmid": article["pmid"],
            "title": article["title"],
            "journal": article["journal"],
            "year": article["year"],
            "authors": article["authors"],
            "doi": article["doi"],
            "url": (f"https://doi.org/{article['doi']}" if article["doi"]
                    else f"https://pubmed.ncbi.nlm.nih.gov/{article['pmid']}/"),
        },
        "model": MODEL,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def write_index_and_search() -> None:
    """Regenerate index.json (newest first) + search-index.json for the Blog tab."""
    posts = []
    for f in sorted(DATA_DIR.glob("????-??-??.json")):
        try:
            posts.append(json.loads(f.read_text(encoding="utf-8")))
        except Exception as e:
            log(f"warn: skipping unreadable {f.name}: {e}")
    posts.sort(key=lambda p: p.get("date", ""), reverse=True)

    index = [{
        "date": p["date"], "slug": p["slug"], "title": p["title"],
        "dek": p["dek"], "tags": p["tags"],
        "pmid": p["source"]["pmid"], "url": p["source"]["url"],
        "journal": p["source"]["journal"],
    } for p in posts]
    (DATA_DIR / "index.json").write_text(
        json.dumps({"updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "count": len(index), "posts": index}, ensure_ascii=False, indent=2),
        encoding="utf-8")

    search = [{"date": p["date"], "title": p["title"], "dek": p["dek"],
               "body": re.sub(r"\s+", " ", p["body"]),
               "tags": p["tags"], "why": p["why_it_matters"],
               "journal": p["source"]["journal"]}
              for p in posts]
    (DATA_DIR / "search-index.json").write_text(
        json.dumps(search, ensure_ascii=False), encoding="utf-8")
    log(f"index: {len(index)} posts indexed")


def main() -> int:
    ap_days = 7
    if "--backfill" in sys.argv:
        try:
            ap_days = int(sys.argv[sys.argv.index("--backfill") + 1])
        except (IndexError, ValueError):
            pass

    # --date YYYY-MM-DD generates the post for a past day (backfill mode);
    # its PubMed window ends on that date, so each day reflects its own news.
    target = date.today()
    if "--date" in sys.argv:
        try:
            target = date.fromisoformat(sys.argv[sys.argv.index("--date") + 1])
        except (IndexError, ValueError):
            log("ERROR: --date expects YYYY-MM-DD")
            return 2
    today = target.strftime("%Y-%m-%d")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    load_env_file()

    # Fast path: already generated for this date.
    if (DATA_DIR / f"{today}.json").exists():
        log(f"{today}: focus already exists — nothing to do")
        write_index_and_search()
        return 0

    end = target.strftime("%Y/%m/%d")
    start = (target - timedelta(days=ap_days)).strftime("%Y/%m/%d")
    pmids = pubmed_search_window(start, end)
    articles = pubmed_fetch(pmids)
    seen = existing_pmids()
    fresh = [a for a in articles if str(a["pmid"]) not in seen]
    if seen:
        log(f"dedup: skipping {len(articles) - len(fresh)} already-used paper(s)")
    articles = fresh
    if not articles:
        log("FAIL: no usable recent articles -- nothing written (fail-closed)")
        return 1

    # Try candidates in relevance order until one produces a valid post.
    written = None
    for article in articles[:5]:
        try:
            post = groq_focus(article, today)
            if not post.get("title") or len(post.get("body", "")) < 200:
                log("groq: post too thin, trying next candidate")
                continue
            written = build_post(article, post, today)
            break
        except Exception as e:
            log(f"groq: attempt failed ({e}); trying next candidate")

    if not written:
        log("FAIL: all generation attempts failed -- nothing written (fail-closed)")
        return 1

    out = DATA_DIR / f"{written['date']}.json"
    out.write_text(json.dumps(written, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"wrote {out.relative_to(ROOT)}  “{written['title']}”")
    write_index_and_search()
    return 0


if __name__ == "__main__":
    sys.exit(main())
