#!/usr/bin/env python3
"""
Cyanoflow / Blog daily AI article rotation — Orr Biologicals
============================================================

Once a day this script:

  1. Searches PubMed's live E-utilities API for recent algae-related
     research across several topic families (biotech, biofuels, health,
     climate, cultivation, single-cell methods...).
  2. Sends the candidate list (titles + abstracts, truncated) to
     GPT-OSS-120B on Groq, which SELECTS the most interesting and
     relevant articles (up to 10) and writes a one-line reason for each.
  3. Writes website/data/picks/<date>.json and regenerates
     website/data/picks/index.json (newest first) for the Blog tab.

The picks rotate every day: each day gets a fresh selection from that
day's search. Fail-closed: if search or selection fails, nothing is
written and the script exits 1.

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
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "blog" / "data" / "picks"
MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
MAX_PICKS = 4

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
        if pmid and title:
            articles.append({
                "pmid": pmid, "title": title, "journal": journal, "year": year,
                "doi": doi,
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
                              "description": "2-4 word topic label, e.g. Biotech, Biofuels, Health, Climate, Cultivation, Single-cell, Environment, Engineering"},
                    "hook": {"type": "string",
                             "description": "one sentence, max 150 chars, why a curious reader should open this one"},
                },
                "required": ["pmid", "topic", "hook"],
            },
        },
    },
    "required": ["picks"],
}


def ai_select(articles: list[dict], today: str) -> dict:
    api_key = os.environ.get("groq_api_key") or os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("groq_api_key / GROQ_API_KEY not set")

    brief = "\n".join(
        f"[{i}] PMID {a['pmid']} | {a['journal']} {a['year']}\n"
        f"    {a['title']}\n    {a['abstract']}"
        for i, a in enumerate(articles)
    )
    system = (
        "You are the editor of the Cyanoflow daily algae digest by Orr "
        "Biologicals. From the candidate list, select exactly the 4 most "
        "interesting and relevant recent articles about algae for readers "
        "interested in algae biotechnology. Aim for topical variety across "
        "the four (biotech, biofuels, health, climate, cultivation, "
        "single-cell methods, environment, engineering). Only pick articles "
        "from the list, by PMID. For each pick give a short topic label and "
        "a one-sentence hook grounded in the abstract. Never invent facts. "
        "Return ONLY JSON matching the schema."
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
        "max_completion_tokens": 2400,
        "reasoning_effort": "low",
    }
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}",
                 "Content-Type": "application/json",
                 "User-Agent": BROWSER_UA},
        method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read().decode("utf-8"))
    log(f"groq: {data.get('usage', {}).get('total_tokens', '?')} tokens")
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
            "year": a["year"], "url": a["url"],
            "topic": str(p.get("topic", "Research"))[:40],
            "hook": str(p.get("hook", ""))[:180],
        })
    if not picks:
        log("FAIL: selection produced no valid picks -- nothing written")
        return 1

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
