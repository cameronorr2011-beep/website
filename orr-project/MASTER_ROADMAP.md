# MASTER_ROADMAP.md — Sprint plan with real exit conditions

Companion to the directive §21. Each sprint lists its exit condition and the
evidence required. A sprint is done only when its evidence exists in-repo.

## SPRINT 0 — Environment, backup, recovery [IN PROGRESS]

Evidence: `docs/INITIAL_SYSTEM_AUDIT.md` + this registry + green test baseline.
Exit: system can identify its own state and resume. → `RESUME_INSTRUCTIONS.md` must work.

## SPRINT 1 — Scientific data foundation [NOT STARTED]

- Dataset registry (static JSON + docs) for MICrONS / Allen ABC / Allen
  Connectivity / Allen Cell Types / DANDI scope entries.
- CAVE adapter executes discovery + first-neuron retrieval on open network.
- Source schemas + pinned materialization versions + ingestion manifests.
- Evidence-state taxonomy implemented in schema (9 states, §7.4).
Exit: **one real mouse neuron retrievable, inspectable, traceable to source.**

## SPRINT 2 — Mouse first vertical slice [NOT STARTED]

- Static anatomical reference page (real atlas metadata, no fake geometry).
- Region exploration + neuron search + inspector + connectivity + evidence panel.
- Coverage display distinguishing observed vs missing.
Exit: **user inspects a real mouse neuron + verified connectivity in browser.**

## SPRINT 3 — Functional data [NOT STARTED]

- MICrONS-NDA functional correspondence mapping (GitHub-accessible repo first).
- Stimulus timeline + activity rendering + time-series storage format.
Exit: **one recorded response inspectable with experimental context.**

## SPRINT 4 — ML baselines [NOT STARTED]

- Leakage-safe splits; mean/persistence/AR baselines; first temporal model.
- Graph baseline on fly (data exists) before mouse link prediction.
- Model cards + held-out metrics + failure documentation.
Exit: **one reproducible ML experiment with real evaluation.**

## SPRINT 5 — Autonomous research infrastructure [NOT STARTED]

- File-backed task registry driver (this JSON becomes executable), job manifests,
  checkpoint/recovery helpers, literature adapters (server-side), claim→source map.
Exit: **a research task created → assigned → executed → checked → resumed.**

## SPRINT 6 — Public API [NOT STARTED]

- Static read-only endpoints first (`/api/v1/*.json`), then dynamic where hosting
  allows. OpenAPI spec, SDK examples, integration tests.
Exit: **third party retrieves a real mouse-neuron record via public API.**

## SPRINT 7 — Fly + NeuroML integration [NOT STARTED]

- Preserve game-website fly platform; align (not duplicate) portable API;
  version transparency; independent verification of both environments.
Exit: **both environments work without confusing biological records.**

## SPRINT 8 — Corporate website [NOT STARTED]

- Obsidian redesign, `/algae`, `/neuroscience`, Journal elevation, funding links,
  SEO, responsive verification.
Exit: **coherent platform, all routes tested.**

## SPRINT 9 — Hardening and release [NOT STARTED]

- Security review, scientific review, e2e (§28.6), perf, mobile, docs.
Exit: **no critical defects, no unsupported public science claims.**

## Sequencing rule

Sprints 1–4 are data-ordered and mostly sequential. Sprint 8 (website) may
proceed in parallel once Sprint 1 evidence exists, but must not jump ahead of
data reality: pages describe only implemented capabilities.
