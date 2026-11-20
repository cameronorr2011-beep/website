#!/usr/bin/env python3
"""
Algae news daily digest — Orr Biologicals
=========================================

Once a day this script assembles the ten freshest microalgae papers it
can find and writes them to ``articles/algae-news/data/`` for the desk
page to render:

  1. Five PubMed searches (cultivation, feed/food, carbon/water,
     pigments/materials, methods/ecology) restricted to the last two
     weeks and sorted by publication date.
  2. Five scout subagents on Groq (``openai/gpt-oss-20b`` by default)
     run in parallel, one per beat. Each reads its own candidate list
     and returns up to four picks with a topic label and a one-sentence
     hook grounded in the abstract.
  3. One editor call (``openai/gpt-oss-120b``) merges the scout picks,
     drops duplicates, enforces topical variety and freshness, and
     returns exactly ten.
  4. Writes ``<date>.json``, ``latest.json`` and ``index.json``.

Fail-closed: if search, selection or the ten-item floor fails, nothing
is written and the script exits 1, so the page keeps yesterday's digest
instead of publishing a thin one.

Only real PubMed records are ever published: the models choose from a
list of real PMIDs and may not invent titles, dates or links. Hooks are
editorial sentences written from the abstract, never presented as the
paper's own words.

Env:
  GROQ_API_KEY (or groq_api_key)  — Groq API key
  GROQ_MODEL                      — editor model, default openai/gpt-oss-120b
  GROQ_SCOUT_MODEL                — scout model, default openai/gpt-oss-20b

Usage:
  python tools/algae_news/daily.py                 # today, Pacific date
  python tools/algae_news/daily.py --date 2026-11-20
  python tools/algae_news/daily.py --no-ai --dry-run   # pipeline check
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "articles" / "algae-news" / "data"
PACIFIC = ZoneInfo("America/Los_Angeles")
MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
SCOUT_MODEL = os.environ.get("GROQ_SCOUT_MODEL", "openai/gpt-oss-20b")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

TARGET_COUNT = 10
WINDOW_DAYS = 14
PER_BEAT = 12
REPEAT_WINDOW_DAYS = 7

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
UA = "OrrBiologicals-AlgaeDesk/1.0 (educational website; service@orrbiologicals.com)"
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

# One subagent per beat. Broad enough to cover the desk's briefs, narrow
# enough that each scout gets a list it can actually read.
BEATS = [
    {
        "key": "cultivation",
        "label": "Cultivation",
        "query": ("(microalga*[Title/Abstract] OR phytoplankton[Title/Abstract]) "
                  "AND (photobioreactor[Title/Abstract] OR cultivation[Title/Abstract] "
                  "OR raceway[Title/Abstract] OR bioreactor[Title/Abstract] "
                  "OR harvesting[Title/Abstract])"),
    },
    {
        "key": "feed",
        "label": "Feed & food",
        "query": ("(microalga*[Title/Abstract] OR Spirulina[Title/Abstract] "
                  "OR Chlorella[Title/Abstract] OR Arthrospira[Title/Abstract]) "
                  "AND (feed[Title/Abstract] OR aquaculture[Title/Abstract] "
                  "OR nutrition[Title/Abstract] OR food[Title/Abstract] "
                  "OR protein[Title/Abstract])"),
    },
    {
        "key": "water",
        "label": "Carbon & water",
        "query": ("(microalga*[Title/Abstract] OR algal[Title/Abstract]) "
                  "AND (wastewater[Title/Abstract] OR CO2[Title/Abstract] "
                  "OR carbon[Title/Abstract] OR flue[Title/Abstract] "
                  "OR eutrophication[Title/Abstract])"),
    },
    {
        "key": "materials",
        "label": "Pigments & materials",
        "query": ("(microalga*[Title/Abstract] OR algal[Title/Abstract]) "
                  "AND (astaxanthin[Title/Abstract] OR phycocyanin[Title/Abstract] "
                  "OR pigment[Title/Abstract] OR lipid[Title/Abstract] "
                  "OR biofuel[Title/Abstract] OR bioplastic[Title/Abstract])"),
    },
    {
        "key": "methods",
        "label": "Methods & ecology",
        "query": ("(microalga*[Title/Abstract] OR cyanobacteri*[Title/Abstract] "
                  "OR phytoplankton[Title/Abstract]) "
                  "AND (genom*[Title/Abstract] OR transcriptom*[Title/Abstract] "
                  "OR single-cell[Title/Abstract] OR microfluidic[Title/Abstract] "
                  "OR bloom*[Title/Abstract] OR strain[Title/Abstract])"),
    },
]


def log(msg: str) -> None:
    safe = ("[algae-daily] " + msg).encode("ascii", "replace").decode("ascii")
    print(safe, flush=True)


def load_env_file() -> None:
    for name in (".env", ".env.local"):
        env = ROOT / name
        if not env.exists():
            continue
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and v and k not in os.environ:
                os.environ[k] = v


def http_open(req: urllib.request.Request, timeout: int = 30, tries: int = 4):
    """Open a request, waiting out NCBI's unauthenticated rate limit."""
    for attempt in range(tries):
        try:
            return urllib.request.urlopen(req, timeout=timeout)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and attempt < tries - 1:
                wait = 2 * (attempt + 1)
                log(f"eutils: HTTP {e.code} -- retrying in {wait}s")
                time.sleep(wait)
                continue
            raise
    raise RuntimeError("eutils: no response after retries")


def http_json(url: str, params: dict, timeout: int = 30):
    req = urllib.request.Request(f"{url}?{urllib.parse.urlencode(params)}",
                                 headers={"User-Agent": UA})
    with http_open(req, timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def http_text(url: str, params: dict, timeout: int = 30) -> str:
    req = urllib.request.Request(f"{url}?{urllib.parse.urlencode(params)}",
                                 headers={"User-Agent": UA})
    with http_open(req, timeout) as r:
        return r.read().decode("utf-8")


# ---------------------------------------------------------------- PubMed ---

def search_beat(beat: dict, start: date, end: date) -> list[dict]:
    """Return this beat's candidates, newest first."""
    try:
        data = http_json(f"{EUTILS}/esearch.fcgi", {
            "db": "pubmed", "term": beat["query"],
            "mindate": start.strftime("%Y/%m/%d"),
            "maxdate": end.strftime("%Y/%m/%d"),
            "datetype": "pdat", "retmax": PER_BEAT, "sort": "pub date",
            "retmode": "json",
        })
    except Exception as e:
        log(f"search {beat['key']}: failed ({e})")
        return []
    ids = data.get("esearchresult", {}).get("idlist", [])
    log(f"search {beat['key']}: {len(ids)} hits")
    return ids


def fetch_records(pmids: list[str]) -> dict[str, dict]:
    """Fetch titles, journals, dates and abstract heads for a PMID list."""
    if not pmids:
        return {}
    try:
        xml = http_text(f"{EUTILS}/efetch.fcgi", {
            "db": "pubmed", "id": ",".join(pmids[:120]), "retmode": "xml"})
    except Exception as e:
        log(f"fetch: failed ({e})")
        return {}

    records: dict[str, dict] = {}
    for chunk in re.findall(r"<PubmedArticle>.*?</PubmedArticle>", xml, re.S):
        def grab(pattern: str, default: str = "") -> str:
            m = re.search(pattern, chunk, re.S)
            return re.sub(r"\s+", " ", m.group(1)).strip() if m else default

        pmid = grab(r"<PMID[^>]*>(\d+)</PMID>")
        title = re.sub(r"<[^>]+>", "", grab(r"<ArticleTitle>(.*?)</ArticleTitle>"))
        title = (title.replace("&lt;", "<").replace("&gt;", ">")
                 .replace("&amp;", "&").replace("&#x27;", "'").strip())
        if not pmid or not title:
            continue
        epub = grab(r'<ArticleDate DateType="Electronic">(.*?)</ArticleDate>')
        ey = re.search(r"<Year>(\d{4})", epub)
        em = re.search(r"<Month>(\d{1,2})", epub)
        ed = re.search(r"<Day>(\d{1,2})", epub)
        pub_date = (f"{ey.group(1)}-{int(em.group(1)):02d}-{int(ed.group(1)):02d}"
                    if ey and em and ed else "")
        if not pub_date:
            entry = re.search(r'<PubMedPubDate PubStatus="pubmed">(.*?)</PubMedPubDate>',
                              chunk, re.S)
            block = entry.group(1) if entry else ""
            py = re.search(r"<Year>(\d{4})", block)
            pm = re.search(r"<Month>(\d{1,2})", block)
            pd = re.search(r"<Day>(\d{1,2})", block)
            if py and pm and pd:
                pub_date = f"{py.group(1)}-{int(pm.group(1)):02d}-{int(pd.group(1)):02d}"
        doi = grab(r'<ArticleId IdType="doi">(.*?)</ArticleId>')
        abstract = " ".join(re.findall(r"<AbstractText[^>]*>(.*?)</AbstractText>", chunk, re.S))
        abstract = re.sub(r"<[^>]+>", "", abstract)
        abstract = re.sub(r"\s+", " ", abstract).strip()
        records[pmid] = {
            "pmid": pmid,
            "title": title,
            "journal": grab(r"<Title>(.*?)</Title>"),
            "pub_date": pub_date,
            "url": (f"https://doi.org/{doi}" if doi
                    else f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"),
            "abstract": abstract[:900],
        }
    log(f"fetch: {len(records)} records")
    return records


def recent_pmids(target: date, days: int = REPEAT_WINDOW_DAYS) -> set[str]:
    seen: set[str] = set()
    for offset in range(1, days + 1):
        f = DATA_DIR / f"{(target - timedelta(days=offset)).isoformat()}.json"
        if not f.exists():
            continue
        try:
            for item in json.loads(f.read_text(encoding="utf-8")).get("items", []):
                pmids = str(item.get("pmid", "")).strip()
                if pmids:
                    seen.add(pmids)
        except Exception:
            continue
    return seen


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
                    "topic": {
                        "type": "string",
                        "description": "2-3 word topic label, e.g. Cultivation, Feed, Carbon, Pigments, Methods",
                    },
                    "hook": {
                        "type": "string",
                        "description": "one sentence, max 180 chars, saying what the paper found or did, grounded only in its abstract",
                    },
                },
                "required": ["pmid", "topic", "hook"],
            },
        },
    },
    "required": ["picks"],
}


def groq(messages: list[dict], schema_name: str, model: str,
         max_tokens: int = 1600) -> dict:
    api_key = os.environ.get("groq_api_key") or os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")
    payload = {
        "model": model,
        "messages": messages,
        "response_format": {"type": "json_schema", "json_schema": {
            "name": schema_name, "schema": PICKS_SCHEMA, "strict": True}},
        "temperature": 0.3,
        "max_completion_tokens": max_tokens,
        "reasoning_effort": "low",
    }
    req = urllib.request.Request(
        GROQ_URL, data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}",
                 "Content-Type": "application/json",
                 "User-Agent": BROWSER_UA},
        method="POST")
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=150) as r:
                data = json.loads(r.read().decode("utf-8"))
            usage = data.get("usage", {}).get("total_tokens", "?")
            log(f"groq {model}: {usage} tokens")
            return json.loads(data["choices"][0]["message"]["content"])
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and attempt < 3:
                wait = 20 * (attempt + 1)
                log(f"groq {model}: HTTP {e.code} -- retrying in {wait}s")
                time.sleep(wait)
                continue
            raise
    raise RuntimeError("groq: no response after retries")


def scout(beat: dict, records: list[dict], quiet: bool = False) -> list[dict]:
    """One subagent: read its beat's candidates and pick up to four."""
    if not records:
        return []
    lines = []
    for r in records:
        lines.append(
            f"PMID {r['pmid']} | {r['pub_date'] or 'date not stated'} | {r['journal'][:70]}\n"
            f"    {r['title']}\n"
            f"    {r['abstract'][:260]}"
        )
    system = (
        "You are a scout on the Algae news desk at Orr Biologicals "
        "(orrbiologicals.com). You cover one beat: " + beat["label"] + ".\n"
        "From the candidate list, choose at most four papers that a person "
        "working with microalgae would actually want to read: concrete "
        "results, new methods, or a finding that changes practice.\n"
        "Rules:\n"
        "1. Only choose PMIDs that appear in the list. Never invent a PMID, "
        "title, date or finding.\n"
        "2. Prefer the most recently published candidates; the date is on "
        "each line.\n"
        "3. Prefer papers about algae, cyanobacteria or phytoplankton. A "
        "paper that only mentions them in passing is a weak pick.\n"
        "4. The hook is one plain sentence, max 180 characters, saying what "
        "the paper did or found. Use only what the abstract states. No "
        "numbers unless the abstract gives them exactly. No hype, no "
        "exclamation marks, no 'revolutionary'.\n"
        "5. Return only JSON matching the schema."
    )
    user = f"Candidates for the {beat['label']} beat:\n\n" + "\n".join(lines)
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
    try:
        try:
            result = groq(messages, "beat_picks", SCOUT_MODEL, max_tokens=1400)
        except Exception as e:
            # The scout model is an optimisation, not a dependency: if it is
            # unavailable or rejects the schema, the editor model scouts too.
            log(f"scout {beat['key']}: {SCOUT_MODEL} failed ({e}); retrying on {MODEL}")
            result = groq(messages, "beat_picks", MODEL, max_tokens=1400)
    except Exception as e:
        log(f"scout {beat['key']}: failed ({e})")
        return []
    picks = []
    by_pmid = {r["pmid"]: r for r in records}
    for p in result.get("picks", [])[:4]:
        pmid = str(p.get("pmid", "")).strip()
        if pmid not in by_pmid:
            continue
        picks.append({
            "pmid": pmid,
            "beat": beat["key"],
            "topic": str(p.get("topic", beat["label"]))[:32],
            "hook": str(p.get("hook", ""))[:200],
        })
    log(f"scout {beat['key']}: {len(picks)} pick(s)")
    return picks


def edit(picks: list[dict], records: dict[str, dict], today: str) -> list[dict]:
    """Merge the scouts' picks into the day's ten."""
    if not picks:
        return []
    lines = []
    for p in picks:
        r = records.get(p["pmid"], {})
        lines.append(
            f"PMID {p['pmid']} | {p.get('beat', '')} | {r.get('pub_date', '')} | "
            f"{r.get('journal', '')[:60]}\n"
            f"    {r.get('title', '')}\n"
            f"    hook: {p.get('hook', '')}"
        )
    system = (
        "You are the editor of the Algae news desk at Orr Biologicals. Your "
        "scouts have each returned picks from their beat. Choose exactly "
        f"{TARGET_COUNT} papers for today's digest.\n"
        "Rules:\n"
        "1. Only choose PMIDs from the list. Never invent or rename a paper.\n"
        "2. Topical variety: no more than three picks from one beat.\n"
        "3. Freshness: prefer the most recent publication dates.\n"
        "4. Reader value: prefer concrete findings and methods over reviews "
        "and protocols that report nothing.\n"
        "5. Keep each hook faithful to the paper; you may tighten it, but "
        "never add a number or claim that is not in the source hook.\n"
        f"6. If the list has fewer than {TARGET_COUNT} usable papers, return "
        "every usable one and no invented filler.\n"
        "Return only JSON matching the schema."
    )
    user = f"Digest date: {today}\n\nScout picks:\n\n" + "\n".join(lines)
    result = groq([
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ], "daily_digest", MODEL, max_tokens=2800)
    out = []
    seen = set()
    for p in result.get("picks", []):
        pmid = str(p.get("pmid", "")).strip()
        if pmid in seen or pmid not in records:
            continue
        seen.add(pmid)
        out.append({
            "pmid": pmid,
            "topic": str(p.get("topic", "Research"))[:32],
            "hook": str(p.get("hook", ""))[:200],
        })
    return out


# ------------------------------------------------------------- assembly ---

def first_sentence(text: str, limit: int = 180) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return ""
    m = re.search(r"^(.{40,}?[.!?])\s", text + " ")
    sentence = m.group(1) if m else text
    return sentence[:limit].strip()


def build_items(chosen: list[dict], records: dict[str, dict],
                candidates: list[dict]) -> list[dict]:
    items = []
    used = set()
    for p in chosen:
        r = records.get(p["pmid"])
        if not r or r["pmid"] in used:
            continue
        used.add(r["pmid"])
        items.append({
            "pmid": r["pmid"],
            "title": r["title"],
            "journal": r["journal"],
            "pub_date": r["pub_date"],
            "url": r["url"],
            "topic": p.get("topic") or "Research",
            "hook": p.get("hook") or first_sentence(r["abstract"]),
        })
    # Backfill by recency if the editor came up short; a missing slot must
    # never turn into an invented paper.
    for r in candidates:
        if len(items) >= TARGET_COUNT:
            break
        if r["pmid"] in used:
            continue
        used.add(r["pmid"])
        items.append({
            "pmid": r["pmid"],
            "title": r["title"],
            "journal": r["journal"],
            "pub_date": r["pub_date"],
            "url": r["url"],
            "topic": "Research",
            "hook": first_sentence(r["abstract"]),
        })
    return items


def recency_key(item: dict) -> str:
    return item.get("pub_date") or "0000-00-00"


def write_outputs(payload: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / f"{payload['date']}.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "latest.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    days = []
    for f in sorted(DATA_DIR.glob("????-??-??.json"), reverse=True)[:30]:
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
            days.append({"date": d["date"], "count": len(d.get("items", []))})
        except Exception:
            continue
    (DATA_DIR / "index.json").write_text(json.dumps({
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "days": days,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"wrote {payload['date']}.json + latest.json ({len(payload['items'])} items), "
        f"index has {len(days)} day(s)")


def main() -> int:
    today = datetime.now(PACIFIC).date()
    if "--date" in sys.argv:
        try:
            today = date.fromisoformat(sys.argv[sys.argv.index("--date") + 1])
        except (IndexError, ValueError):
            log("ERROR: --date expects YYYY-MM-DD")
            return 2
    no_ai = "--no-ai" in sys.argv
    dry_run = "--dry-run" in sys.argv
    load_env_file()
    iso = today.isoformat()

    if not dry_run and (DATA_DIR / f"{iso}.json").exists():
        log(f"{iso}: digest already exists -- nothing to do")
        return 0

    start = today - timedelta(days=WINDOW_DAYS)
    log(f"{iso}: window {start} .. {today}")

    # NCBI rate-limits unauthenticated clients, so these five searches run
    # one at a time; the parallelism lives in the scout calls below.
    beat_pmids: dict[str, list[str]] = {}
    for i, beat in enumerate(BEATS):
        if i:
            time.sleep(0.6)
        beat_pmids[beat["key"]] = search_beat(beat, start, today)

    all_pmids = []
    for ids in beat_pmids.values():
        for pid in ids:
            if pid not in all_pmids:
                all_pmids.append(pid)
    records = fetch_records(all_pmids)
    if len(records) < TARGET_COUNT:
        log(f"FAIL: only {len(records)} candidate records -- nothing written")
        return 1

    seen = recent_pmids(today)
    fresh = {pid: r for pid, r in records.items() if pid not in seen}
    if len(fresh) >= TARGET_COUNT:
        log(f"dedupe: dropped {len(records) - len(fresh)} paper(s) from the last "
            f"{REPEAT_WINDOW_DAYS} days")
        records = fresh
    else:
        log(f"dedupe: only {len(fresh)} fresh -- keeping recent repeats")

    # Newest first, and each beat keeps its own order for the scouts.
    candidates = sorted(records.values(), key=recency_key, reverse=True)
    by_beat = {b["key"]: [r for r in candidates if r["pmid"] in set(beat_pmids[b["key"]])]
               for b in BEATS}

    chosen: list[dict] = []
    if no_ai:
        log("--no-ai: selecting by recency only (pipeline check)")
        chosen = [{"pmid": r["pmid"], "topic": "Research",
                   "hook": first_sentence(r["abstract"])} for r in candidates[:TARGET_COUNT]]
    else:
        scout_picks: list[dict] = []
        with ThreadPoolExecutor(max_workers=len(BEATS)) as pool:
            futures = [pool.submit(scout, b, by_beat[b["key"]]) for b in BEATS]
            for fut in futures:
                scout_picks.extend(fut.result())
        log(f"scouts: {len(scout_picks)} pick(s) total")
        if not scout_picks:
            log("FAIL: no scout picks -- nothing written (fail-closed)")
            return 1
        try:
            chosen = edit(scout_picks, records, iso)
        except Exception as e:
            log(f"FAIL: editor call failed ({e}) -- nothing written")
            return 1
        log(f"editor: {len(chosen)} pick(s)")
        if len(chosen) < TARGET_COUNT:
            # Let the editor's shortlist be topped up from the scouts' picks,
            # then from recency, rather than failing the whole day.
            extra = [p for p in scout_picks if p["pmid"] not in {c["pmid"] for c in chosen}]
            chosen.extend(extra[:TARGET_COUNT - len(chosen)])

    items = build_items(chosen, records, candidates)
    if len(items) < TARGET_COUNT:
        log(f"FAIL: only {len(items)} usable items -- nothing written (fail-closed)")
        return 1

    payload = {
        "date": iso,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "editor": "recency-only" if no_ai else MODEL,
        "scouts": [] if no_ai else [SCOUT_MODEL] * len(BEATS),
        "count": len(items),
        "items": items,
    }
    if dry_run:
        fixture = Path("/tmp/algae-latest.json")
        fixture.write_text(json.dumps(payload, ensure_ascii=False, indent=2),
                           encoding="utf-8")
        log(f"dry run: not writing site files; sample at {fixture}")
        print(json.dumps({k: v for k, v in payload.items() if k != "items"},
                         ensure_ascii=False))
        for item in items[:3]:
            print(f"  - {item['pub_date']} | {item['journal'][:40]} | {item['title'][:90]}")
        return 0
    write_outputs(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
