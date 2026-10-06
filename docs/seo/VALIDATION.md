# SEO validation — 2026-10-04

## Second-pass validation (supersedes original output counts below)

- Actual modular source: `sections/head.html` + `sections/home-body.html` ->
  `index.html`; both `build.ps1` and `rebuild.ps1` executed successfully through
  Windows PowerShell, invoking the same deterministic Python build.
- Four distinct pillar resources generated at `/algae-biotechnology/`,
  `/microalgae-cultivation/`, `/photobioreactors/`, `/algaephyte/`.
- **17 tests pass** after final source repairs: full metadata/schema/links,
  deterministic rebuilds, source/output equality, explicit legal exclusions,
  connected species/pillars and evergreen-before-daily blog order.
- **60 public documents; 58 indexable; 55 sitemap URLs.** Legal pages are
  crawlable, self-canonical and linked but deliberately absent from sitemap.
- All 58 indexable pages are included in browser navigation, not merely sitemap
  pages. Updated browser report covers 12 mobile routes, including all new
  pillars, applications and a species profile; both simulations and no-JS
  reading directory remain part of the interface test.
- Initial mobile QA caught a 430px-wide cultivation table on a 390px viewport.
  Fixed the cause in the shared resource renderer using the existing responsive
  table wrapper and genuine table semantics; no assertion was weakened.
- Live homepage and `/algaephyte` rechecked: production still has the old title
  and Algaephyte redirects to home. No second-pass deployment is implied.
- See `EXECUTION.md` for source contracts, exact 90-day priorities and new
  literature/SERP evidence. Original records below describe the first pass.


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

## Post-deploy verification (2026-10-05, performed)

- PR #1 merged (81dffb2); the production host pulls from `main` automatically and served the merge within about a minute (robots.txt `last-modified` matched the merge time).
- Full live re-crawl (`docs/seo/postdeploy/`): 73 of 74 checks 200; the only 404 is the intentional canary. Verified live: `/pavlova-lutheri` 301 → species page, `/control-loop-architecture` 301 → blog article, `/algaephyte` 301 → `/algaephyte/`, `/index` and `/blog/index` 301 to canonical directories, `/cyanoflow/` 301, `/sections/*` and `/tools/*` 403, corrected font URL 200, 55-URL sitemap without legal/`/game/` URLs.
- A follow-up defect found and fixed in PR #2 (f3a3ab4): the legacy prefix `Redirect 301 /docs` ran before the per-directory 403 rule and soft-200'd `/docs/*` to the homepage. Now exact-match; `/docs/seo/AUDIT.md` returns 403 live, `/docs` still redirects.
- Browser QA on production (`live-browser.json`): 5 routes with new titles, LCP 340–980 ms, CLS ≤ 0.16 (lab metrics; field CWV still unverified), mobile 390 px without overflow, both simulations respond, all redirect chains correct, zero console errors and zero failed requests except the intentional canary.
- Limitation discovered: the host's bot challenge returns 403 "Checking your browser…" to JavaScript-disabled browsers, so a no-JS crawler cannot see the blog directory even though the served HTML contains the static links (confirmed by fetch: `id="kb"` with 25 static `/blog/` links). `qa_seo.mjs` now reports this interception instead of a false zero. Whether search crawlers are exempt is a hosting-panel setting outside this repository; not verified.
- Steps 1–3 above are done; step 4 (Search Console submission) still requires the operator's authenticated property.

## UI consistency pass (2026-10-05)

- Prose links no longer underlined: `.prose a` keeps the leaf colour but drops `text-decoration` (the site-wide `a { text-decoration: none }` rules are unchanged).
- Header navigation unified on every subpage: System, Applications, Algaephyte, Cyanoflow, Blog, Game plus a single `Contact` CTA. The `Products` item and `Pilot access` label are gone; the homepage dropdown and the `/#products` anchor remain as valid targets. `sections/header.html` and the `inject_header.py` template match the shipped pages, so future `build_research.py` output stays consistent.
- `/blog/` now leads with the four daily AI picks (`#picks`) above the evergreen directory (`#kb`); pick cards still render client-side from `/blog/data/picks/index.json`.
- Regression coverage: 19 tests pass, including two new invariants (header link set on every subpage header; the `.prose a` rule may not set `text-decoration`) and the flipped picks-before-KB order assertion. Local browser QA clean: 23 static KB links, both simulations, no overflow at 390 px, zero console errors (`docs/seo/postdeploy-fix-local/`).

## Daily-picks ops notes (2026-10-05/06)

- The 1 PM Pacific scheduled run never fired (both cron slots dropped by GitHub's scheduler); the workflow was run manually via `workflow_dispatch` (run 37390860337) and the day published at 23:54 UTC.
- PR #5 added a 3-day dedupe in `pick_articles.py` and an "Updated <date>" stamp in the picks header. Because the day's file predated the fix, PR #6 removed `2026-10-05.json` and the workflow regenerated it with the dedupe active (run 37395309479: `dedupe: excluding 8 candidate(s)`; new picks 42805418, 42831353, 42766750, 42269881).
- Hosting sync anomaly: merges (PR #1/#4/#5/#6) reached the production host in roughly a minute, but the bot's direct push to `main` (468946b, 00:43 UTC) did not trigger a sync — the docroot stayed at the 00:41:33 state for 20+ minutes. A merge was used to nudge the sync; if bot pushes routinely fail to deploy, the hosting-panel trigger needs attention (operator-side setting).
