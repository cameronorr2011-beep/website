#!/usr/bin/env python3
"""
Cyanoflow / Blog daily AI article rotation — Orr Biologicals
============================================================

Once a day this script:

  1. Searches PubMed's live E-utilities API for recent algae-related
     research across several topic families (biotech, biofuels, health,
     climate, cultivation, single-cell methods...).
  2. Sends the candidate list (titles + abstracts, truncated) to
     GPT-OSS-120B on Groq, which SELECTS the four most interesting and
     relevant articles, then writes a separate short article for each
     pick (strictly grounded in its abstract).
  3. Writes website/data/picks/<date>.json and regenerates
     website/data/picks/index.json (newest first) for the Blog tab.

The picks rotate every day: each day gets a fresh selection from that
day's search, and papers already picked in the last few days are
excluded so the digest never leads with a repeat (unless the search is
thin -- a repeated paper still beats a missing day). Fail-closed: if
search or selection fails, nothing is written and the script exits 1.

Env:
  groq_api_key (or GROQ_API_KEY) — Groq API key
  GROQ_MODEL (optional)          — default: openai/gpt-oss-120b

Usage:
  python tools/blog/pick_articles.py                  # today
  python tools/blog/pick_articles.py --date 2026-09-20
  python tools/blog/pick_articles.py --seed-days 30   # wider search
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "blog" / "data" / "picks"
MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
MAX_PICKS = 4

# A paper must not lead the digest day after day: candidates already
# picked in the last REPEAT_WINDOW_DAYS days are excluded before the AI
# selection (saves tokens too). If exclusion would starve the day
# (< 5 candidates), repeats are kept -- a digest with one repeated
# paper beats a missing day.
REPEAT_WINDOW_DAYS = 3


def recent_picked_pmids(target: date, days: int = REPEAT_WINDOW_DAYS) -> set[str]:
    """PMIDs picked on the `days` calendar days before `target`."""
    picked: set[str] = set()
    for offset in range(1, days + 1):
        f = DATA_DIR / f"{(target - timedelta(days=offset)).isoformat()}.json"
        if not f.exists():
            continue
        try:
            for p in json.loads(f.read_text(encoding="utf-8")).get("picks", []):
                pmid = str(p.get("pmid", "")).strip()
                if pmid:
                    picked.add(pmid)
        except Exception as e:
            log(f"warn: cannot read {f.name} for dedupe: {e}")
    return picked

# Topic families the AI chooses from — broad by design so the daily
# rotation moves across biotech, fuels, health, climate and methods.
SEARCH_TERMS = [
    'microalga*[Title/Abstract] AND (biotech*[Title/Abstract] OR industrial[Title/Abstract])',
    'microalga*[Title/Abstract] AND (biofuel*[Title/Abstract] OR lipid[Title/Abstract] OR biodiesel[Title/Abstract])',
    '(Spirulina[Title/Abstract] OR Arthrospira[Title/Abstract] OR Chlorella[Title/Abstract]) AND (health[Title/Abstract] OR nutrition[Title/Abstract] OR nutraceutical[Title/Abstract])',
    'microalga*[Title/Abstract] AND (carbon[Title/Abstract] OR CO2[Title/Abstract] OR climate[Title/Abstract])',
    'alga*[Title/Abstract] AND (photobioreactor[Title/Abstract] OR cultivation[Title/Abstract] OR bioreactor[Title/Abstract])',
    '(cyanobacteri*[Title/Abstract] OR microalga*[Title/Abstract]) AND (single-cell[Title/Abstract] OR microfluidic[Title/Abstract] OR phenotyp*[Title/Abstract] OR imaging[Title/Abstract])',
    'algal[Title/Abstract] AND (wastewater[Title/Abstract] OR bioremediation[Title/Abstract])',
    'microalga*[Title/Abstract] AND (genetic[Title/Abstract] OR synthetic biology[Title/Abstract] OR engineering[Title/Abstract])',
    # reviews, books and news-style coverage - keeps the rotation varied
    'alga*[Title/Abstract] AND (review[Title/Abstract] OR perspective[Title/Abstract] OR advances[Title/Abstract])',
    'microalgae[Title/Abstract] AND (industry[Title/Abstract] OR market[Title/Abstract] OR commercial[Title/Abstract] OR policy[Title/Abstract])',
    'Spirulina[Title/Abstract] AND (food[Title/Abstract] OR feed[Title/Abstract] OR supplement[Title/Abstract] OR safety[Title/Abstract])',
    'algal[Title/Abstract] AND (pigment[Title/Abstract] OR phycocyanin[Title/Abstract] OR astaxanthin[Title/Abstract] OR omega-3[Title/Abstract])',
    '(algal[Title/Abstract] OR phytoplankton[Title/Abstract] OR cyanobacteri*[Title/Abstract]) AND (bloom*[Title/Abstract] OR eutrophication[Title/Abstract] OR harmful[Title/Abstract])',
]

UA = "OrrBiologicals-PickBot/1.0 (educational website; contact: service@orrbiologicals.com)"
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def log(msg: str) -> None:
    safe = ("[picks] " + msg).encode("ascii", "replace").decode("ascii")
    print(safe, flush=True)


def load_env_file() -> None:
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
    req = urllib.request.Request(f"{url}?{urllib.parse.urlencode(params)}",
                                 headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def http_text(url: str, params: dict, timeout: int = 30) -> str:
    req = urllib.request.Request(f"{url}?{urllib.parse.urlencode(params)}",
                                 headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8")


# ---------------------------------------------------------------- PubMed ---

def pubmed_window(start: str, end: str, limit: int = 14) -> list[dict]:
    """Search each topic family, fetch abstracts, tag them with the family."""
    pmids: list[str] = []
    for term in SEARCH_TERMS:
        try:
            data = http_json(f"{EUTILS}/esearch.fcgi", {
                "db": "pubmed", "term": term, "mindate": start, "maxdate": end,
                "datetype": "pdat", "retmax": limit, "sort": "relevance",
                "retmode": "json",
            })
            ids = data.get("esearchresult", {}).get("idlist", [])
            log(f"search: {len(ids):2d} hits -- {term[:52]}...")
            for pid in ids:
                if pid not in pmids:
                    pmids.append(pid)
            time.sleep(0.45)
        except Exception as e:
            log(f"search: failed ({e}); continuing")
    return pmids


def fetch_articles(pmids: list[str]) -> list[dict]:
    if not pmids:
        return []
    xml = http_text(f"{EUTILS}/efetch.fcgi", {
        "db": "pubmed", "id": ",".join(pmids[:40]), "retmode": "xml"})
    articles = []
    for chunk in re.findall(r"<PubmedArticle>.*?</PubmedArticle>", xml, re.S):
        def grab(p, d=""):
            m = re.search(p, chunk, re.S)
            return re.sub(r"\s+", " ", m.group(1)).strip() if m else d
        pmid = grab(r"<PMID[^>]*>(\d+)</PMID>")
        title = grab(r"<ArticleTitle>(.*?)</ArticleTitle>")
        abstract = " ".join(grab(r"<AbstractText[^>]*>(.*?)</AbstractText>"))
        journal = grab(r"<Title>(.*?)</Title>")
        year = grab(r"<PubDate>.*?<Year>(\d{4})</Year>.*?</PubDate>")
        doi = grab(r"<ArticleId IdType=\"doi\">(.*?)</ArticleId>")
        # True online-first publication date (journals often assign
        # articles to future-dated print issues, which reads as a weird
        # year; epub date is the honest "published" date).
        epub = grab(r'<ArticleDate DateType="Electronic">(.*?)</ArticleDate>')
        ey, em, ed = (re.search(r"<Year>(\d{4})", epub),
                      re.search(r"<Month>(\d{1,2})", epub),
                      re.search(r"<Day>(\d{1,2})", epub))
        pub_date = (f"{ey.group(1)}-{int(em.group(1)):02d}-{int(ed.group(1)):02d}"
                    if ey and em and ed else "")
        if pmid and title:
            articles.append({
                "pmid": pmid, "title": title, "journal": journal, "year": year,
                "pub_date": pub_date, "doi": doi,
                "url": (f"https://doi.org/{doi}" if doi
                        else f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"),
                "abstract": abstract[:900],
            })
    log(f"fetch: {len(articles)} candidate articles")
    return articles


# ------------------------------------------------------------------ Groq ---

PICKS_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "picks": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "pmid": {"type": "string"},
                    "topic": {"type": "string",
                              "description": "2-4 word topic label, e.g. Biotech, Biofuels, Health, Climate, Blooms, Ecology, Cultivation, Single-cell, Environment, Engineering"},
                    "hook": {"type": "string",
                             "description": "one sentence, max 150 chars, why a curious reader should open this one"},
                },
                "required": ["pmid", "topic", "hook"],
            },
        },
    },
    "required": ["picks"],
}

ARTICLE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "article": {"type": "string",
                    "description": "3-5 short plain-text paragraphs for a curious non-specialist explaining what the study did, what it found and why it is interesting -- strictly grounded in the abstract; never invent numbers, results or claims; plain paragraphs separated by \\n\\n; no headings, no markdown"},
        "why": {"type": "string",
                "description": "one sentence connecting the finding to algae biotechnology or everyday life, max 180 chars"},
    },
    "required": ["article", "why"],
}


def ai_select(articles: list[dict], today: str) -> dict:
    api_key = os.environ.get("groq_api_key") or os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("groq_api_key / GROQ_API_KEY not set")

    # Free-tier Groq caps gpt-oss-120b at 8k tokens/min AND rejects large
    # request payloads outright (HTTP 413) — keep the brief small: title +
    # abstract head per candidate, under a hard character budget.
    MAX_BRIEF_CHARS = 24000
    lines: list[str] = []
    total = 0
    for i, a in enumerate(articles):
        line = (
            f"PMID {a['pmid']} | {a['journal']} {a['year']}"
            f"{(' | online ' + a['pub_date']) if a.get('pub_date') else ''}\n"
            f"    {a['title'][:180]}\n    {a['abstract'][:220]}"
        )
        if total + len(line) > MAX_BRIEF_CHARS:
            log(f"brief: stopping at {i} candidates (payload budget)")
            break
        lines.append(line)
        total += len(line)
    brief = "\n".join(lines)
    system = (
        "You are the editor of the Cyanoflow daily algae digest by Orr "
        "Biologicals (orrbiologicals.com). From the numbered candidate list, "
        "select exactly 4 papers.\n"
        "Selection rules:\n"
        "1. Every pick must be about algae, cyanobacteria, or phytoplankton "
        "(biotech, biofuels, health/nutrition, climate/carbon, cultivation/"
        "photobioreactors, single-cell methods, ecology/harmful blooms, "
        "genetic engineering, pigments).\n"
        "2. Topical variety: no more than two picks from the same topic "
        "family.\n"
        "3. Freshness: prefer the most recently published candidates (each "
        "line shows its online-publication date).\n"
        "4. Reader value: prefer concrete findings, novel methods, or "
        "striking applications a curious non-specialist would want to read.\n"
        "5. Only pick from the list, by PMID. Never invent PMIDs, titles, "
        "dates, or facts.\n"
        "For each pick give a 2-4 word topic label and a one-sentence hook "
        "(max 150 chars) grounded in the abstract. Return ONLY JSON matching "
        "the schema."
    )
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": f"Date: {today}\n\nCandidates:\n{brief}"},
        ],
        "response_format": {"type": "json_schema", "json_schema": {
            "name": "daily_picks", "schema": PICKS_SCHEMA, "strict": True}},
        "temperature": 0.4,
        "max_completion_tokens": 1600,
        "reasoning_effort": "low",
    }
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}",
                 "Content-Type": "application/json",
                 "User-Agent": BROWSER_UA},
        method="POST")
    # Free tier allows ~8k tokens/min; the focus generator may run just
    # before this script (CI), so a 429 here is expected now and then.
    # Wait out the window and retry instead of failing the day.
    data = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.loads(r.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                wait = 60 + 10 * (attempt + 1)
                log(f"groq: rate limited -- retrying in {wait}s (attempt {attempt + 1}/3)")
                time.sleep(wait)
                continue
            raise
    if data is None:
        raise RuntimeError("groq: no response after retries")
    log(f"groq: {data.get('usage', {}).get('total_tokens', '?')} tokens")
    return json.loads(data["choices"][0]["message"]["content"])


def write_article(article: dict, today: str) -> dict:
    """Write one short grounded article for a single picked paper.

    One Groq call per pick, paced so consecutive calls stay under the
    free tier's per-minute token budget (429s are retried once).
    """
    api_key = os.environ.get("groq_api_key") or os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("groq_api_key / GROQ_API_KEY not set")

    system = (
        "You write for the Cyanoflow daily algae digest by Orr Biologicals "
        "(orrbiologicals.com). You receive ONE real peer-reviewed abstract. "
        "Write a short article for curious non-specialists.\n"
        "Structure, in this order:\n"
        "1. Opening: 1-2 sentences stating what the study set out to do, in "
        "plain language.\n"
        "2. Method: 1-3 sentences on how they did it (organism, technique, "
        "scale) -- only what the abstract says.\n"
        "3. Findings: what the study actually found; include a number only "
        "if the abstract states it, and then exactly as stated.\n"
        "4. Close: one sentence on why it is interesting or useful.\n"
        "Style rules:\n"
        "- 3-5 short paragraphs separated by blank lines; no headings, no "
        "markdown, no bullet lists.\n"
        "- Grounding: use ONLY facts present in the abstract. Never invent "
        "numbers, results, claims, author names, or applications.\n"
        "- Dates: never state a publication year, volume, or issue -- journal "
        "issue years can differ from the true online date and often read as "
        "a year in the future. Refer to the work as 'a recent study' or "
        "'a new study', nothing more specific.\n"
        "- Tone: precise, warm, plain language, no hype, no exclamation "
        "marks; briefly explain jargon on first use.\n"
        "Return ONLY JSON matching the provided schema."
    )
    user = (
        f"Today's digest date: {today}\n"
        f"Journal: {article['journal']}\n"
        f"Online publication date: {article.get('pub_date') or 'not stated'}\n"
        f"Title: {article['title']}\n\n"
        f"Abstract:\n{article['abstract']}\n"
    )
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "response_format": {"type": "json_schema", "json_schema": {
            "name": "pick_article", "schema": ARTICLE_SCHEMA, "strict": True}},
        "temperature": 0.5,
        "max_completion_tokens": 1200,
        "reasoning_effort": "low",
    }
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}",
                 "Content-Type": "application/json",
                 "User-Agent": BROWSER_UA},
        method="POST")
    data = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.loads(r.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                wait = 60 + 10 * (attempt + 1)
                log(f"groq: rate limited on article -- retrying in {wait}s")
                time.sleep(wait)
                continue
            raise
    if data is None:
        raise RuntimeError("groq: no response after retries")
    log(f"groq: article PMID {article['pmid']} -- "
        f"{data.get('usage', {}).get('total_tokens', '?')} tokens")
    return json.loads(data["choices"][0]["message"]["content"])


# ------------------------------------------------------------- assembly ---

def write_index() -> None:
    days = []
    for f in sorted(DATA_DIR.glob("????-??-??.json"), reverse=True):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
            days.append({"date": d["date"], "count": len(d["picks"]),
                         "picks": d["picks"]})
        except Exception as e:
            log(f"warn: skipping {f.name}: {e}")
    (DATA_DIR / "index.json").write_text(json.dumps({
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "days": days}, ensure_ascii=False), encoding="utf-8")
    log(f"index: {len(days)} day(s)")


def main() -> int:
    seed_days = 10
    if "--seed-days" in sys.argv:
        try:
            seed_days = int(sys.argv[sys.argv.index("--seed-days") + 1])
        except (IndexError, ValueError):
            pass

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

    if (DATA_DIR / f"{today}.json").exists():
        log(f"{today}: picks already exist -- nothing to do")
        write_index()
        return 0

    end = target.strftime("%Y/%m/%d")
    start = (target - timedelta(days=seed_days)).strftime("%Y/%m/%d")
    pmids = pubmed_window(start, end)
    articles = fetch_articles(pmids)
    recent = recent_picked_pmids(target)
    fresh = [a for a in articles if a["pmid"] not in recent]
    if len(fresh) >= 5:
        if len(fresh) != len(articles):
            log(f"dedupe: excluding {len(articles) - len(fresh)} candidate(s) "
                f"already picked in the last {REPEAT_WINDOW_DAYS} days")
        articles = fresh
    else:
        log(f"dedupe: only {len(fresh)} fresh candidate(s) -- keeping recent "
            "repeats so the day still publishes")
    if len(articles) < 5:
        log("FAIL: too few candidates -- nothing written (fail-closed)")
        return 1

    try:
        result = ai_select(articles, today)
    except Exception as e:
        log(f"FAIL: AI selection failed ({e}) -- nothing written (fail-closed)")
        return 1

    by_pmid = {a["pmid"]: a for a in articles}
    picks = []
    for p in result.get("picks", [])[:MAX_PICKS]:
        a = by_pmid.get(str(p.get("pmid", "")))
        if not a:
            continue
        picks.append({
            "pmid": a["pmid"], "title": a["title"], "journal": a["journal"],
            "year": a["year"], "pub_date": a.get("pub_date", ""), "url": a["url"],
            "topic": str(p.get("topic", "Research"))[:40],
            "hook": str(p.get("hook", ""))[:180],
        })
    if not picks:
        log("FAIL: selection produced no valid picks -- nothing written")
        return 1

    # A separate short article per pick. One thin article must not sink
    # the day: keep the pick with a fail-closed placeholder, not a quote.
    ok = True
    for p in picks:
        a = by_pmid[p["pmid"]]
        try:
            art = write_article(a, today)
            body = str(art.get("article", "")).strip()
            if len(body) < 200:
                raise ValueError("article too thin")
            p["article"] = body[:2400]
            p["why"] = str(art.get("why", ""))[:180]
        except Exception as e:
            ok = False
            log(f"warn: article for PMID {p['pmid']} failed ({e}) -- pick kept without body")
        time.sleep(20)  # pace calls: stay inside the free tier's TPM window
    if not ok:
        log("note: some picks have no article body (hooks still shown)")

    out = {"date": today, "model": MODEL,
           "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "picks": picks}
    (DATA_DIR / f"{today}.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"wrote {today}.json with {len(picks)} picks")
    write_index()
    return 0


if __name__ == "__main__":
    sys.exit(main())
