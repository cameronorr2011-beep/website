# Orr Biologicals: SEO audit and search strategy

Audit date: 2026-10-04. Repository: https://github.com/cameronorr2011-beep/website.
Baseline commit: `1ca9f44`; isolated branch `seo/scientific-discoverability-20261004`.

## A. Executive diagnosis

**Organic traffic is reported low by the operator, not independently measured.** We cannot attribute a traffic decline, quantify lost clicks, or claim rankings without authenticated Search Console/analytics exports.

Verified impediments: an indexed legacy species URL returns 404; a restored control-loop article's old URL resolves to the homepage; three articles lack source-HTML inbound links; knowledge-base discovery depends on fetching JSON and client rendering; the sitemap includes a noindex game; `/index` aliases remain crawlable; the daily rebuild does not reproduce the current homepage and restores inaccurate Product/PreOrder claims; cultivation articles are incorrectly classified as Cyanoflow; the blog articles lack H2 structure and claim-level bibliography; author-visible dates disagree with machine dates. Existing strengths: static HTML, unique titles and descriptions on all 51 indexable pages, self canonicals, HTTPS, working species illustrations with captions, substantial technical material, explicit concept/simulation disclosures, real literature sources for the daily briefs.

Likely constraints: narrow specialist demand, shallow explanatory articles competing with primary literature and established cultivation resources, diffuse homepage intent, weak source attribution, little dedicated single-cell supporting content, and insufficient independent references/backlinks. **These are hypotheses, not measured causes.** No backlink database, crawl logs, Search Console, or conversion records were accessible.

Unknown: actual indexed count, Google-selected canonicals, sitemap submission, impressions/clicks/CTR/positions, manual actions, countries/devices, organic entrances, referring domains, field CWV, and whether DNS-based verification or external analytics exists. A `site:` query is a sampled diagnostic, not an indexing census.

## B. Reconnaissance

- Plain static HTML/CSS/classic JavaScript on an Apache-style host. No Next.js, bundler, package manifest, or TypeScript typecheck. Root `.htaccess`: extensionless `.html` rewrites, non-www HTTPS redirects, legacy migration, real error document, gzip and asset expiry.
- 53 public HTML documents: homepage, Cyanoflow, blog hub + 22 articles, applications hub + 12 application explainers + 10 species guides, three legal pages, game, 404. Another 19 `sections/*.html` are partials, not landing pages. Full mapping: `baseline/pages.csv` and `pages.json`.
- `build.ps1`: destructive legacy source splitter, requires an old external `NEW 67.html`; not the daily build and must not run on the modern site. `rebuild.ps1`: legacy assembly from partials, currently out of sync with editorial homepage. `index.html` is the real current layout.
- Blog static articles are hand-maintained. `tools/blog/build_kb_index.py` reads heads into `blog/data/kb.json`. `blog/index.html` fetches this to build grids; daily PubMed/Groq picks appear on that same URL from JSON, not independent indexable article routes. No pagination or archive URLs to audit. Do not mass-publish daily abstracts as doorway pages.
- `.github/workflows/focus-of-the-day.yml`: scheduled daily JSON refresh only; no production deployment workflow or GitHub Pages configured. No hosting/analytics account added; no secret values read or changed.
- Images: small JPEG collection (~3 MB aggregate) plus SVG scientific illustrations; fonts from Google Fonts; main pages include simulations and DOM-rendered diagrams. Source text already contains key scientific context. Important empty knowledge grids need static content, not hidden noscript-only substitutes.
- Organization/WebSite/CreativeWork on homepage; Article/FAQ/Breadcrumb on applications; Article on blog; Product on Cyanoflow despite concept status; no schema on several legal pages (not a defect). Organization authors are acceptable: do not fabricate a credentialed Person.
- No GA4, Search Console HTML verification, or other analytics script found in public tracked source. DNS verification or server-side analytics remains unverified. Consent/local storage is not evidence of analytics. No tracking installed without a real measurement ID and privacy decision.
- Robots permits public crawling and excludes partials. Root sitemap is hand-maintained, with blanket dates, ignored `priority`/`changefreq` values, and noindex `/game/` incorrectly included.

## Technical findings: severity, evidence, fix

| Severity | Finding and evidence | Fix / acceptance |
|---|---|---|
| CRITICAL | No verified sitewide crawl block, outage, or deindexing found. 51/51 canonical indexable routes return 200 in baseline. | Do not invent a critical traffic diagnosis. |
| HIGH | Search result `/pavlova-lutheri` -> real 404; source lacks migration. | Exact permanent redirect to `/applications/species/pavlova`; verify after deployment. |
| HIGH | `/control-loop-architecture` -> `/#system`, despite restored `/blog/control-loop-architecture`; conflicting Redirect rules. | One exact article redirect, no homepage substitution. |
| HIGH | `rebuild.ps1` assembles old sections; `sections/head.html` advertises Product/PreOrder; current homepage explicitly disallows purchases. | Freeze legacy builder, make modern index authoritative, sync head and add deterministic SEO build. Never restore unvalidated offers. |
| HIGH | Blog grids empty in source; three source orphans (`edge-ai-biological-systems`, `vision-contamination-detection`, `what-is-main-plain-language`). | Build visible static directory of all notes; static pillar/support links; no duplicate JS grid rendering. |
| HIGH | 22 blog notes have no H2 and no external bibliography in HTML. Some categorical health/safety/performance assertions lack citations. | Add navigation/status sections and relevant source-linked reading; prioritize claim-level editorial review. Bibliography is not proof every older claim is supported. |
| MEDIUM | `/game/` has noindex but sitemap lists it. | Keep game working/noindex, exclude from generated sitemap. |
| MEDIUM | `/index.html` -> `/index`; `/blog/index.html` -> `/blog/index`; both 200 duplicates with canonical to other URL. | Normalize index aliases before generic `.html` rule; preserve directory canonical slash. |
| MEDIUM | `/cyanoflow/` and article trailing-slash aliases 404; extensionless leaf canonicals have no slash. | Conditional leaf-slash normalization only when a real `.html` file exists. Never rewrite unknown URLs to homepage. |
| MEDIUM | KB classifies oxygen/sensors/control/twins as Cyanoflow, not cultivation/Algaephyte. | Correct explicit topic map. Cross-link shared vision topics without misrepresenting research provenance. |
| MEDIUM | Cyanoflow Product schema describes research concept; main H1 brand-only. | CreativeWork/WebPage/Breadcrumb, descriptive H1 preserving brand and visual classes. |
| MEDIUM | Blog displayed dates disagree with `article:published_time`; no reliable update mechanism. | Preserve original publication metadata, align visible date, add honest modification dates on actual edits. |
| MEDIUM | Homepage topic chips all point to `/blog/`, not promised topics. | Point chips to existing relevant articles/hubs. |
| HIGH | Live browser requests to Google Fonts fail: `Source Serif 4` requests include unsupported weight 0; original endpoint returns HTTP 400. | Correct range to `200..560`; corrected endpoint returns 200 CSS; add regression test. |
| MEDIUM | Main JPEG images omit intrinsic sizes; daily thumbs described falsely as journal figures. | Actual dimensions, lazy loading offscreen, eager/fetchpriority hero, honest illustrative alt text. No claimed CWV gain without timing. |
| MEDIUM | Sensitive partials publicly servable as HTML though blocked in robots; fragments contain legacy copy. | Deny direct partial/tool/docs access using server rules; robots is not a security control or noindex substitute. |
| LOW | Long branded titles and incomplete Twitter metadata, standalone Cyanoflow favicon. | Intent-first key titles; populate social metadata from each page's actual title/description/image; shared favicon. |
| LOW | Blanket sitemap lastmod, ignored changefreq/priority. | Canonical/noindex-aware generator; only include explicit, honest modification dates, omit uncertain dates. |
| OPPORTUNITY | No dedicated conceptual glossary or microfluidics guide. | One substantive glossary and one literature-backed single-cell guide, not many thin dictionary URLs. |
| OPPORTUNITY | Relevant comparison/species pages already exist. | Retain URLs, expand evidence, link to hub and deep next-step reading. Do not mass-delete or blindly migrate. |

## Remaining technical checks and boundaries

Baseline `live.json` contains 67 read-only public requests, response status, final URL, elapsed network time, cache/content headers, raw metadata, schema types, headings, images and links. HTTP redirects are followed; final URL evidence does not alone count hops. Browser QA adds redirect-chain evidence on key aliases and mobile behavior. Unknown URL correctly returns 404 (no soft-404 fallback). HTTPS/www converge to HTTPS non-www; query-tagged homepage remains self-canonical. No multilingual/hreflang need observed; no paginated routes. Leaf `.html` aliases are duplicates handled by permanent redirects, not additional sitemap entries. No staging URLs found. Schema checks establish parseability/semantic consistency, not Google rich-result eligibility. Existing FAQ schema is no promise of FAQ rich results.

Image bytes and JS/CSS payloads must be measured in browser. LCP/CLS are lab observations, INP is a field metric requiring user data; browser interactions can measure response and long tasks, not establish passing INP. Do not claim field CWV or a score of 100. Check server compression and caching using actual HTTP headers; avoid content changes justified solely by a synthetic score.

## C. Page-by-page inventory and decisions

`baseline/pages.json` and `.csv` record every route (including excluded game/404), current and recommended title/description, H1/H2, intent/topic/stage, word count (not quality), HTML inbound/outbound links, canonical/schema, images/alts, sources, indexability, importance and action. `PAGE-REVIEW.md` supplies individual editorial findings and topic mapping; baseline must remain unchanged after implementation. `current/` is the final artifact inventory. All 22 existing articles: IMPROVE, not delete. Applications/species: KEEP and strengthen references; no merger until Search Console shows real cannibalization. Game/404: retain NOINDEX. Legal pages remain indexable and linked, without commercial query targeting.

## D/E. Search-intent architecture and knowledge graph

Stable existing routes win over a speculative migration. Add one research hub and substantive support pages; do not replace `/algaephyte` -> home yet, because a dedicated canonical platform migration requires its own content and redirect plan.

```
/ (Orr Biologicals: algae biotechnology education + research concepts)
  /research/ (research methods and topic directory)
    /#inside (Algaephyte cultivation architecture)
      /blog/how-to-start-home-spirulina-culture (practical beginner intent)
      /blog/six-culture-signals-main-senses (sensor interpretation)
      /blog/digital-twin-droop-steele-model (model assumptions)
      /blog/bounded-autonomy-safe-ai-proposals (bounded control)
    /cyanoflow (single-cell microalgal research concept)
      /blog/single-cell-microalgae-microfluidics (methods, literature and limits)
      /blog/vision-contamination-detection (shared vision caveats)
    /applications/ (cultivation, food webs, pigments/lipids)
      /applications/species/* (organism-specific authority/support)
    /glossary (14 linked definitions, not 14 thin URLs)
    /blog/ (static field/design-note directory + clearly AI-labeled daily briefs)
```

Hubs link down; notes link up to relevant hub/platform, to references and related next reading. Generic homepage cultivation/digital twin/contamination/harvest/vision chips become descriptive deep links. No new near-duplicate keyword pages. Algaephyte controls culture-level variables; Cyanoflow measures individual-cell variation. Do not conflate microscopy proxies with validated biochemical phenotypes.

## Search evidence and uncertainty

Google search samples taken 2026-10-04:
- `site:orrbiologicals.com`: homepage, legal pages, old FAQ, old Pavlova, old control-loop/culture URLs, and canonical applications content; confirms legacy search visibility but not indexed page counts or ranking distribution.
- `single cell microalgae microfluidics phenotyping imaging`: primary PhenoChip research, eLife motility, droplet methods and newer phenotyping papers. Real literature/query match; competition is specialist primary research. Opportunity is accessible, properly cited explanations, not pretending Orr has equivalent experimental results.
- `spirulina cultivation optical density dissolved oxygen photobioreactor digital twin`: cultivation suppliers, peer-reviewed twin literature, oxygen studies, photobioreactor resources. Qualitative relevance validated; no search volumes or keyword difficulty metrics obtained.
- `algae optical density biomass calibration Beer Lambert photobioreactor`: measurement roadmap, attenuation studies, modeling papers, calibration questions. Strong fit for existing modeling/sensor notes.

`ROADMAP.csv` ranks 40 topics, maps intent to stable target URLs and required links. Competition labels are editorial estimates based on sampled SERPs or **unvalidated** for unsampled topics. Current rankings are unknown unless an exact result is recorded. No invented monthly volumes, ranking positions, or numeric difficulty.

## F. Publishing rules and authority strategy

Start with existing notes: direct answer -> definition -> mechanisms -> table/diagram where helpful -> sources -> limitations -> next reading. Preserve original text unless a concrete error is corrected; older claims need scientific review, especially food safety, oxygen toxicity, temperature optima, and edge inference claims. Do not imply adding a general citation validates a specific numerical claim.

Publish under the existing organizational byline, linked to research methods. The operator's origin story says coursework/microbiology; do not extrapolate degrees, laboratory certification, or publications. Methodology should distinguish literature synthesis, proposed architecture, educational simulation, prototype test, and experimentally validated result. No validated Orr hardware performance found.

Link-worthy assets: annotated optical-density calibration workflow, glossary/model assumptions, reusable species comparison illustrations, simulator with equations and reproducible inputs, eventual measured datasets only with provenance/approval. Outreach after quality review: algae teaching communities, relevant open-source instrumentation repositories, student science communities, educational/resource maintainers, researchers whose papers are explained accurately. Offer useful assets and invite correction; do not buy links, send automated spam, or imply relationships/endorsements. No outreach sent in this task.

## I. Exact 30/60/90-day measurement plan

**Day 0 (owner-authenticated baseline):** Search Console domain property, preferably DNS verification; confirm existing property before creating another. Submit `https://orrbiologicals.com/sitemap.xml`. Export last 90 days and prior comparable period: Search results (Web) by query, page, country and device; Pages indexing reasons; Sitemaps last read/errors; Links referring sites; CWV field status. Inspect homepage, Cyanoflow, research hub, one species, one cultivation and one model article: declared vs Google canonical, last crawl, rendered HTML. Preserve CSV exports with dates, not secrets. No verified access means baseline values stay null, not zero.

**Day 30:** compare same-length periods, account for deployment date and seasonal/daily changes. Track valid sitemap URLs, indexed useful canonical URLs, unexpected noindex/404/redirect exclusions, crawler errors and canonical mismatches. Group impressions/clicks/CTR/position by cultivation, single-cell, species/applications, models/control; separate branded regex `orr|algaephyte|cyanoflow` from non-branded. Note new pages with impressions, not just total site clicks. Validate redirected Pavlova and old control-loop in URL Inspection. Update titles only when query evidence supports the change.

**Day 60:** evaluate topic-cluster impression growth, non-branded ranking pages, page-level CTR at comparable positions, pages gaining/losing impressions, related-reading journeys and qualified inquiries if actual analytics exists. Expand the topics getting impressions; fix discovered intent gaps. Do not noindex low-traffic scientific pages merely because they are niche. Review citations and corrections with subject-matter readers.

**Day 90:** compare to baseline and prior comparable 90-day window: non-branded clicks/impressions, useful indexed pages, returning topic journeys, independently earned citations/referring domains, Algaephyte/Cyanoflow discoverability. Record deploy/content/outreach changes alongside outcomes; no guarantee of improvement or causal attribution from before/after alone.

Optional analytics requires a real existing ID/provider choice and updated privacy disclosure. Track organic landing page entrances and events `simulation_start`, `related_reading`, `research_contact` without names/emails in telemetry. Do not install empty GA tags or claim instrumentation is working when it is not. Search Console remains the primary visibility measure.

## References consulted

- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap (canonical URLs, root location, honest lastmod; priority/changefreq ignored).
- Structured data guidance: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- PhenoChip (Behrendt et al., 2020), primary single-cell study: https://pmc.ncbi.nlm.nih.gov/articles/PMC7467707/
- Biomass monitoring roadmap (Schagerl et al., 2022): https://pmc.ncbi.nlm.nih.gov/articles/PMC9368473/
- Single-cell motility (Bentley et al., 2022): https://elifesciences.org/articles/76519

## Deliverables and validation

Baseline files are saved before implementation. Follow-up `VALIDATION.md` records exact commands, local test/build results, current inventory, browser/live findings, redirect limitations and push/PR outcome. Pushing a branch is not proof of deployment: production changes need merge/hosting release and a fresh real-site crawl. Existing working-tree changes in `website-repo` are not included.
