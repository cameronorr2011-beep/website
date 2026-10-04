# SEO validation — 2026-10-04

## Delivered artifacts

- `AUDIT.md`: executive diagnosis, reconnaissance, severity/evidence/fix table, topic architecture, scientific safeguards, authority strategy and 30/60/90-day measurement plan.
- `PAGE-REVIEW.md`: individual review of all 51 baseline indexable pages.
- `ROADMAP.csv`: 40 prioritized topics with intent, stable target URL, competition uncertainty, links and authority basis.
- `baseline/pages.csv`, `baseline/pages.json`: all 53 original public documents and their metadata, headings, links, schemas, image attributes, intent and decisions.
- `baseline/live.json`: 67 real public HTTP checks, including all baseline indexable routes and key aliases/errors.
- `current/pages.csv`, `current/pages.json`: all 56 final public documents (54 indexable, game/404 retained noindex).
- `local-browser.json`, `live-browser.json`: repeatable desktop/mobile rendering, JSON-LD parsing, resource payload observations, simulations, no-JS discovery and production redirects.

## Final checks

```bash
python tools/site/build_seo.py
python -m unittest discover -s tools -p 'test_*.py'
python -m compileall -q tools/site tools/blog/build_kb_index.py
for file in js/*.js; do node --check "$file"; done
node --check tools/site/qa_seo.mjs
python tools/site/seo_audit.py --out docs/seo/current
git diff --check
```

- Static build: **23 knowledge notes, 54 canonical indexable sitemap entries**. It does not overwrite homepage design and is byte-deterministic on repeat execution.
- Unit/regression suite: **15 tests passed**, including original 7 site-copy tests.
- Full public-page checks: unique nonempty titles/descriptions/H1/canonicals; one H1 per indexable page; JSON-LD parses; no duplicate IDs; all static local href/src references and cross-page fragment targets resolve; required social metadata; source inbound links for every indexable page; local meaningful images have alt/dimensions; Article dates align with visible publication/update dates; honest CreativeWork status with no fabricated offers.
- Sitemap: UTF-8 valid XML; exact canonical/indexable coverage; no duplicates, staging URLs, 404/game/noindex URLs; lastmod uses only explicit editorial modification dates, not build time.
- Existing robots remains valid with root sitemap directive. Direct partial/tool/docs protection is in Apache rules, not robots. Existing game remains functional and noindex.
- CSV roadmap verified: **40 rows, 12 columns**, no malformed extra fields.
- Python compile and JavaScript syntax checks passed; no TypeScript/package-manager typecheck exists in this static repository.

## Browser interface validation

Ran Chrome using the installed `browser-automation` skill and `tools/site/qa_seo.mjs`.

**Updated local website:**
- 54/54 canonical indexable pages navigated with HTTP 200; titles/H1/canonical and all JSON-LD parsed in the actual browser.
- Six representative mobile routes at 390 × 844: homepage, Cyanoflow, blog, research hub, glossary, single-cell guide. All had document width 390 (no horizontal overflow) and working expandable mobile menus.
- Culture slider changed simulated biomass display from `2.14` to `0.97`; this is an interface regression test, NOT a biological result.
- Cyanoflow pause control changed to `RUN` when activated through its accessible keyboard interface. Pointer QA initially timed out because the existing card continuously floats; switching to keyboard tests the real accessible input, not a forced DOM event.
- JavaScript-disabled blog directory: **23 note links visible**, versus **0** on real production.
- Final browser console errors: **0**; failed network requests: **0**.

**Real https://orrbiologicals.com:**
- Baseline HTTP crawl: **51/51 indexable canonical pages 200**. 67 requests total: 63 successful final responses and four 404s (three stale/alias paths plus deliberate missing route).
- Browser test on homepage, Cyanoflow, blog, applications and Spirulina taxonomy article; mobile homepage/Cyanoflow/blog had no horizontal overflow and menus worked.
- Both simulation interfaces responded on production too.
- Confirmed bad font requests: unsupported Source Serif weight range starts at 0; Google endpoint responds HTTP 400, browser blocks HTML response as a stylesheet. Corrected range `200..560` returns HTTP 200 CSS. Final local browser has no such failures. Production still has nine repeated font request failures across the QA navigations.
- Confirmed `/index.html` -> `/index`; `/blog/index.html` -> `/blog/index`; `/control-loop-architecture` -> homepage `#system`; `/pavlova-lutheri` and `/cyanoflow/` 404. The deliberate unknown route returns genuine 404. Browser report records actual redirect chains.
- Production console records the deliberate/stale 404 probes; these are audit findings, not an all-green production test.

## Performance observations (not field CWV)

One buffered desktop lab observation in final browser run:

| Page | Real production LCP / CLS | Updated local LCP / CLS |
|---|---|---|
| Homepage | 528 ms / 0.00059 | 788 ms / 0.00124 |
| Other pages | See `live-browser.json` | Blog 356 ms / 0.05898; Cyanoflow 1168 ms / 0.00046 |

**Do not compare these as a speedup.** Local uncompressed Python server and production compressed hosting, font/cache states and network conditions differ; observations are not controlled field measurements. Final homepage local resource transfer was ~392 KB, with ~269 KB image transfers at capture. First live baseline transferred ~625 KB of subresources, mostly images; exact payloads and long tasks are saved in reports. Eager below-fold images were made lazy, actual intrinsic sizes added, and the hero prioritized, but no causal CWV improvement is claimed. Font failure was measured and fixed directly.

Long animation/simulation tasks remain visible; preserve simulations and schedule performance profiling separately before changing render cadence. INP, mobile field percentiles and CrUX/Search Console CWV are **unverified**. Google's hosted Rich Results Test was not run against undeployed markup; local JSON-LD parsing and semantic regressions are not equivalent to Google eligibility approval.

## Deployment and remaining limits

- Work occurred in separate worktree `website-seo`, branch `seo/scientific-discoverability-20261004`, based on fetched `origin/main`; existing uncommitted `website-repo` homepage/backend changes were left untouched.
- GitHub repository has no Pages hosting and only a daily content-refresh workflow. A branch push/PR is not a production deploy.
- Apache isn't installed locally. `.htaccess` rule invariants pass tests, but the Python preview deliberately does not emulate Apache. **New redirects and access rules require an actual Apache/production test after merge/deploy**; never call them production-verified already.
- Search Console, analytics, keyword volumes, backlink counts and sitemap submission remain unverified. No credentials or analytics ID was fabricated, no key altered, no outreach sent.
- PhenoChip and biomass primary sources were read. eLife citation title/DOI was discovered in real search results, but full article fetch hit a client challenge; no unobserved detailed findings from it were asserted.
- Existing scientific articles were retained with status/context/source reading and navigation. Many historical numerical/safety assertions still warrant claim-by-claim scientific review; adding background sources does not certify those claims.

## After merge/deploy

1. Run the read-only live crawl again and compare final URLs/canonicals to the current sitemap.
2. Verify 301 destinations for Pavlova, old control-loop, index aliases and known leaf slash variants; confirm arbitrary missing routes remain 404 and partials are denied.
3. Confirm static directory with JavaScript disabled, corrected font response, preserved simulations and mobile layout on production.
4. Submit sitemap in the existing verified Search Console property, inspect representative canonical URLs and begin the audit's measurement schedule.
