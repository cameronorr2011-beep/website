# Executed SEO overhaul — second pass

Date: 2026-10-04. Continues PR #1, not an unimplemented checklist.

## What was implemented and why

1. **Real modular homepage source:** `sections/head.html` is the complete authoritative head; `sections/home-body.html` is the current editorial body and scripts. `tools/site/build_home.py` assembles `index.html`. Both PowerShell entrypoints invoke the same daily Python build; the old destructive splitter and unreachable old assembler were replaced. Actual Windows PowerShell execution of both entrypoints succeeded.
2. **Clear homepage search semantics:** H1 now identifies algae biotechnology research, cultivation and single cells. The access slogan remains visibly below it. Metadata describes the actual topics and concept status. Links lead to substantive pillars and the distinct platforms.
3. **Four implemented pillars:** `/algae-biotechnology/`, `/microalgae-cultivation/`, `/photobioreactors/`, `/algaephyte/`. Each answers a distinct question, includes explanatory sections and decision tables or test requirements, cites real literature, links to supporting pages and describes limitations. They are not four near-duplicate keyword pages.
4. **Two-way content graph:** applications and all ten species profiles link to cultivation/reactor/platform background; existing notes link to relevant pillars. Hubs link down into the older content. Species content is retained, not replaced by SEO filler.
5. **Evergreen-first blog:** static knowledge directory is before daily literature briefs. Topic navigation separates cultivation, reactor/model research and single-cell methods. The daily briefs remain explicitly AI-assisted, source-linked and dynamically updated.
6. **Intentional sitemap policy:** legal pages stay accessible and self-canonical but privacy, terms and disclaimer are excluded as requested. Game/404 remain noindex and excluded. Sitemap now contains 55 canonical public knowledge URLs; total public HTML is 60, with 58 intentionally indexable documents.
7. **Crawl policy:** public blog, applications, Cyanoflow and assets remain allowed. Source/tool/audit/backend/admin/API areas are excluded; blog JSON stays allowed because public briefs depend on it. Robots is not authentication.
8. **Honest application copy:** removed applications-hub claims implying an already effective cultivation system and replaced them with proposed research status. Context update dates are distinct from original publication dates.

## Source and generated-file contract

| Artifact | Source of truth | Daily output |
|---|---|---|
| Homepage | `sections/head.html`, `sections/home-body.html` | `index.html` |
| Research hub, glossary, single-cell guide | `tools/site/build_research.py` | `research/index.html`, `glossary.html`, `blog/single-cell-microalgae-microfluidics.html` |
| Four new pillars | `tools/site/topics.py` plus renderer in `build_research.py` | each pillar's `index.html` |
| Article/application/species copy | existing individual HTML files | same stable HTML routes |
| Shared topic links | `tools/site/link_topics.py` | marked contextual sections in those files |
| Static directories and sitemap | `tools/site/build_seo.py`, article heads, explicit exclusions | `blog/index.html`, `cyanoflow.html`, `blog/data/kb.json`, `sitemap.xml` |

Do not reverse-copy generated homepage markup into source. Historical unused partials are not inputs and direct HTTP access is denied by the PR's Apache rules. CI rebuilds all generated HTML and rejects drift. The rebuild test verifies byte determinism and exact homepage/source equivalence.

## New search evidence

Real Google SERPs sampled for:
- `microalgae cultivation light nutrients temperature monitoring photobioreactor guide`: reactor review papers, laboratory cultivation resources and university extension material. Supports a cultivation input/measurement explainer; commercial cost intent is separate.
- `microalgae photobioreactor design light mixing gas exchange review`: reviews, university design guidance, reactor comparisons. People-also-ask includes what a photobioreactor is/does and its disadvantages. Supports a mechanism-and-tradeoffs landing page, not a made-up product catalog.

Sources fetched and read:
- Benner et al. (2022), **Lab-scale photobioreactor systems: principles, applications, and scalability**. DOI 10.1007/s00449-022-02711-1. https://pmc.ncbi.nlm.nih.gov/articles/PMC9033726/
- Chanquia et al. (2021 online; 2022 issue), **Photobioreactors for cultivation and synthesis: specifications, challenges, and perspectives**. DOI 10.1002/elsc.202100070. https://pmc.ncbi.nlm.nih.gov/articles/PMC9731602/
- Dunford (2015), Oklahoma State University Extension **Photobioreactor design for algal biomass production**, FAPC-192. https://extension.okstate.edu/fact-sheets/photobioreactor-design-for-algal-biomass-production
- Existing PhenoChip and biomass-monitoring references retained.

Competition is qualitatively specialist/established educational content. Exact keyword volumes, query rankings and click forecasts remain UNKNOWN without the corresponding data. Existing roadmap estimates are not numerical keyword-tool difficulty scores.

## Traffic diagnosis: evidence levels

**VERIFIED:** live legacy redirects/404s; JS-only evergreen directory; invalid font range; sitemap noindex conflict; old source/build conflicts; misclassified cultivation material. Local changes remedy the corresponding repository causes.

**LIKELY:** weak topic destinations, diffuse homepage intent, thin source-supported explanations and insufficient independent references constrain qualified discovery. Pillars, semantic H1 and two-way links address these plausible gaps without claiming attribution.

**UNKNOWN:** measured organic entrances, Search Console queries/impressions/clicks/CTR/positions, Google-selected canonical/indexed totals, backlinks, field INP/CWV and actual traffic change. No Search Console access or analytics property was available; do not invent a baseline or promise a material increase today.

## Concrete 90-day execution priorities

### Days 0–30: ship and establish evidence
- Merge/release PR #1 through the real hosting workflow; do not confuse GitHub push with deployment.
- On Apache verify `/algaephyte` -> `/algaephyte/`, index aliases, old Pavlova/control-loop paths, known leaf slashes, source access denial and arbitrary 404 behavior. Re-crawl all sitemap URLs and inspect generated canonicals.
- Verify homepage H1, all four new pillars, evergreen-first blog, corrected fonts and preserved simulations on the actual deployed host.
- With authenticated Search Console access: export previous 90 days; submit the root sitemap; inspect homepage, Cyanoflow, Algaephyte and two representative evergreen guides. Missing access remains a blocker, not zero traffic.
- Review unsourced numeric/safety claims in `/blog/reading-your-culture`, `/blog/troubleshooting-contamination-crashes`, `/blog/dissolved-oxygen-stress-signal` and `/blog/edge-ai-biological-systems`. Add claim-specific primary references or qualify/remove unsupported certainty, not just a generic bibliography.

### Days 30–60: deepen existing clusters based on real queries
- Expand `/blog/six-culture-signals-main-senses` with a source-backed optical-density calibration comparison and link from `/microalgae-cultivation/` and `/photobioreactors/`.
- Expand `/blog/digital-twin-droop-steele-model` with equations, units, parameter assumptions and holdout evaluation; connect to glossary definitions.
- Expand `/blog/single-cell-microalgae-microfluidics` with a documented image-analysis validation workflow and a diagram, not fabricated datasets.
- Add claim-level literature to `/applications/pavlova-vs-isochrysis` and the corresponding two species profiles; retain strain-dependent caveats.
- Use cluster-filtered Search Console query/page trends to choose expansions; don't create new URLs for synonyms already answered.

### Days 60–90: reference-worthy assets and legitimate authority
- Publish an annotated educational optical-density worksheet and documented model-assumption diagram after source review.
- Publish simulator input/output examples labeled as model outputs, with equations and version; no biological measurements implied.
- Identify educational resource maintainers, open-source scientific instrumentation communities and relevant algae teaching groups for manual, source-specific outreach. University/primary-paper authors cited here are not assumed partners or endorsements.
- Review non-branded impressions/clicks, useful indexed pages, query-specific CTR at comparable positions, pages gaining/lossing visibility and independently earned references. If analytics is actually available, add organic landing journeys and qualified research-contact events without personal details.

## Still blocked, not delegated as ordinary code work

Deployment/merge and hosting credentials were not supplied or requested in this task. Authenticated Search Console/analytics metrics, sitemap submission, field CWV and external backlink evidence are unavailable. New Apache rule behavior cannot be certified by the Python preview; post-release live verification remains necessary. Historical scientific claims need deeper source-specific editorial review. No results, relationships, credentials or ranking improvements were fabricated.
