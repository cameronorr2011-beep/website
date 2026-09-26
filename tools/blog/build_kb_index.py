#!/usr/bin/env python3
"""Build blog/data/kb.json — the static knowledge-base index.

Classifies every static article (Algaephyte field notes, Cyanoflow
research notes) so hub pages and the blog page can render "all
articles" grids without hand-maintained lists. Plain stdlib, no
network: reads titles/descriptions straight from the HTML heads.
Fail-closed: exits 1 without writing on any read/classify error.
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "blog" / "data" / "kb.json"

# Cyanoflow = research/engineering notes about the single-cell platform.
CYANOFLOW = {
    "vision-contamination-detection",
    "edge-ai-biological-systems",
    "federated-learning-network",
    "bounded-autonomy-safe-ai-proposals",
    "digital-twins-biological-cultivation",
    "digital-twin-droop-steele-model",
    "control-loop-architecture",
    "photobioreactor-ai-optimization",
    "six-culture-signals-main-senses",
    "how-main-keeps-culture-safe",
    "what-is-main-plain-language",
    "dissolved-oxygen-stress-signal",
}

# Everything else in blog/ is a cultivation field note -> Algaephyte.
ALGAEPHYTE_FALLBACK = "Algaephyte field note"


def parse_articles() -> list[dict]:
    arts = []
    for f in sorted(ROOT.glob("blog/*.html")):
        slug = f.stem
        if slug == "index":
            continue
        try:
            html = f.read_text(encoding="utf-8")
        except Exception as e:
            print(f"[kb] FAIL: cannot read {f.name}: {e}", file=sys.stderr)
            sys.exit(1)
        title_m = re.search(r"<title>(.*?)</title>", html, re.S)
        desc_m = re.search(r'<meta name="description" content="(.*?)"', html, re.S)
        date_m = re.search(r'article:published_time" content="(\d{4}-\d{2}-\d{2})', html)
        if not title_m:
            print(f"[kb] FAIL: no <title> in {f.name}", file=sys.stderr)
            sys.exit(1)
        title = re.sub(r"\s*[\|\u2014]\s*Orr Biologicals\s*$", "", title_m.group(1)).strip()
        product = "Cyanoflow" if slug in CYANOFLOW else ALGAEPHYTE_FALLBACK
        arts.append({
            "slug": slug,
            "url": f"/blog/{slug}",
            "title": title,
            "dek": (desc_m.group(1) if desc_m else "")[:220],
            "date": date_m.group(1) if date_m else "",
            "product": product,
        })
    if not arts:
        print("[kb] FAIL: no articles found", file=sys.stderr)
        sys.exit(1)
    arts.sort(key=lambda a: a["date"], reverse=True)
    return arts


def main() -> int:
    articles = parse_articles()
    cy = [a for a in articles if a["product"] == "Cyanoflow"]
    al = [a for a in articles if a["product"] != "Cyanoflow"]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "counts": {"algaephyte": len(al), "cyanoflow": len(cy), "total": len(articles)},
        "algaephyte": al,
        "cyanoflow": cy,
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"[kb] wrote kb.json: {len(al)} algaephyte, {len(cy)} cyanoflow")
    return 0


if __name__ == "__main__":
    sys.exit(main())
