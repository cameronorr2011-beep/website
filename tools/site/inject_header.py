#!/usr/bin/env python3
"""Inject the uniform site header onto every page that lacks one.

The homepage (index.html) and cyanoflow.html already carry the fixed
nav; every other page (articles, hub, blog, legal, 404, game) used to
show only a breadcrumb. This script adds the standard header markup
(with the Cyanoflow link), its stylesheet and navigation.js, and drops
the now-redundant breadcrumb on the applications hub.

Idempotent: pages that already contain id="nav" are left untouched.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

HEADER = """<header class="nav" id="nav">
  <div class="nav-in">
    <a class="mark" href="/" aria-label="Orr Biologicals home">
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r="13" fill="none" stroke="currentColor" stroke-opacity="0.35"/>
        <path d="M7 20c2.6-2.2 2.6-9.8 7-9.8S16.4 20 21 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" class="dash-flow"/>
        <path d="M6 12c2.6-2.2 2.6-6 7-6s4.4 3.8 7 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-opacity="0.55" class="dash-flow"/>
      </svg>
      <span><b>Orr Biologicals</b><small>ALGAEPHYTE &middot; CYANOFLOW</small></span>
    </a>
    <nav class="nav-links" aria-label="Primary">
      <a href="/#inside">System</a>
      <a href="/#products">Products</a>
      <a href="/applications/">Applications</a>
      <a href="/blog/">Blog</a>
      <a href="/game/">Game</a>
      <a class="btn-white" href="/#deploy">Pilot access</a>
    </nav>
    <button class="nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-label="Menu">Menu</button>
  </div>
</header>
<div class="mobile-menu" id="mobileMenu" hidden>
  <a href="/#inside">System</a>
  <a href="/#products">Products</a>
  <a href="/applications/">Applications</a>
  <a href="/blog/">Blog</a>
  <a href="/game/">Game</a>
  <a href="/#deploy">Pilot access</a>
</div>
"""

HEADER_CSS = '<link rel="stylesheet" href="/css/header.css?v=20260926a">'
NAV_JS = '<script src="/js/navigation.js?v=20260926a" defer></script>'
HUB_BREADCRUMB = re.compile(
    r'  <nav class="art-top" aria-label="Breadcrumb">\n'
    r'    <a href="/">&#8592; Orr Biologicals</a>\n'
    r'    <span style="color:#57705f">applications</span>\n'
    r'  </nav>\n'
)


D_NAV_OLD = '      <a href="/applications/">Applications</a>\n      <a href="/blog/">Blog</a>'
D_NAV_NEW = '      <a href="/applications/">Applications</a>\n      <a href="/cyanoflow">Cyanoflow</a>\n      <a href="/blog/">Blog</a>'
M_NAV_OLD = '  <a href="/applications/">Applications</a>\n  <a href="/blog/">Blog</a>'
M_NAV_NEW = '  <a href="/applications/">Applications</a>\n  <a href="/cyanoflow">Cyanoflow</a>\n  <a href="/blog/">Blog</a>'
SMALL_OLD = '<small>ALGAEPHYTE</small>'
SMALL_NEW = '<small>ALGAEPHYTE &middot; CYANOFLOW</small>'


def upgrade_nav(html: str) -> str:
    """Ensure an existing header carries the Cyanoflow link + wordmark."""
    def add_link(block: str) -> str:
        if 'href="/cyanoflow"' in block:
            return block
        return re.sub(
            r'(\n([ \t]*)<a href="/applications/">Applications</a>)',
            r'\1\n\2<a href="/cyanoflow">Cyanoflow</a>',
            block, count=1)

    html = re.sub(r'<nav class="nav-links"[^>]*>.*?</nav>',
                  lambda m: add_link(m.group(0)), html, flags=re.S)
    html = re.sub(r'<div class="mobile-menu"[^>]*>.*?</div>',
                  lambda m: add_link(m.group(0)), html, flags=re.S)
    html = html.replace(SMALL_OLD, SMALL_NEW)
    return html


def inject(path: Path) -> str:
    html = path.read_text(encoding="utf-8")
    if 'id="nav"' in html:
        fixed = upgrade_nav(html)
        if fixed != html:
            path.write_text(fixed, encoding="utf-8")
            return "nav upgraded (Cyanoflow link)"
        return "skip (has header)"

    # drop the hub breadcrumb — the real header replaces it
    html = HUB_BREADCRUMB.sub("", html)

    # header markup right after <body ...>
    html, n = re.subn(r"(<body[^>]*>\n)", r"\1" + HEADER, html, count=1)
    if n != 1:
        return "FAIL: no <body> anchor"

    # stylesheet: after the last existing local stylesheet link
    if 'href="/css/header.css' not in html:
        css_links = list(re.finditer(r'<link rel="stylesheet" href="/css/[^"]+">', html))
        if css_links:
            last = css_links[-1]
            html = html[:last.end()] + "\n" + HEADER_CSS + html[last.end():]
        else:
            html = html.replace("</head>", HEADER_CSS + "\n</head>", 1)

    # nav script before consent.js / </body>
    if "/js/navigation.js" not in html:
        html = html.replace("</body>", NAV_JS + "\n</body>", 1)

    path.write_text(html, encoding="utf-8")
    return "injected"


def main() -> None:
    # everything except the homepage, partials and config (both homepage
    # and cyanoflow.html get their nav updated separately)
    targets = sorted(
        p for p in ROOT.rglob("*.html")
        if ".git" not in p.parts and p != ROOT / "index.html"
        and "sections" not in p.parts and "config" not in p.parts
    )
    for p in targets:
        rel = p.relative_to(ROOT).as_posix()
        print(f"{rel:55s} {inject(p)}")


if __name__ == "__main__":
    main()
