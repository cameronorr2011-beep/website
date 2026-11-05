# PROJECT_STATE.md — Orr Biologicals: Biological Intelligence Initiative

Last updated: 2026-11-04 (America/Los_Angeles) · Session 1 · Branch `arena/bfcb8601-website`

## Current sprint

**SPRINT 0: Environment, backup and project recovery — IN PROGRESS (nearly complete)**

Exit condition: the system can identify its own project state and safely resume work.

- [x] Repositories discovered and audited (website + game-website incl. neuro-ml + arena branches)
- [x] Environment capabilities discovered (CPU/RAM/GPU/network/tools)
- [x] Baseline established: website tests green, all routes 200, FlyWire asset hash-verified
- [x] Existing work preserved (no deletions; additive changes only)
- [x] Execution registry created (this directory)
- [ ] Sprint 0 checkpoint committed and pushed (in progress this session)

## Repositories

| Repo | Role | Default branch | Session branch | Status |
|---|---|---|---|---|
| `cameronorr2011-beep/website` | Corporate site (this checkout) | `main` @ `a780ab7` | `arena/bfcb8601-website` | Active work here |
| `cameronorr2011-beep/game-website` | NeuroML app + game bot | `main` | none (read-only audit via gh API + shallow clone) | Audited, not modified |

Read-only audit clone: `/home/user/game-website-audit` (branch `neuro-ml`, depth 1).
NOT part of this repo. Re-clone per `RESUME_INSTRUCTIONS.md` if missing.

## What exists and works (verified this session, not assumed)

1. **Corporate static site**: 27 Python unittest + simulation engine/persistence + biorealm
   engine/atmosphere tests all pass. 14/14 probed routes return 200 locally.
2. **FlyWire v783 connectome (game-website `neuro-ml`)**: `public/data/flywire-v783.npz`
   SHA-256 `ddf717f5…9632e5b` matches its manifest. 139,255 uint64 IDs,
   15,091,983 directed pairs (CSR), 54,492,922 synapses. REAL data.
3. **Sleep circuit (game-website `neuro-ml`)**: 483-neuron spiking model, documented
   honestly; N3 not produced, REM labeling unstable, EEG uncalibrated. No false claims found.
4. **Literature engine (`/literature/`)**: client-side live Crossref/OpenAlex queries.
   Real implementation; works in user browsers (sandbox egress blocks server-side use).
5. **Prior Arena fly work (`arena/e676bd12-game-website`, merged activity Nov 3–4)**:
   portable connectome API with row-fingerprint reconciliation. License caution recorded:
   treat FlyWire data as **CC BY-NC 4.0 pending clarification**.

## What does NOT exist yet (honest gaps)

- No mouse data ingested anywhere. No CAVE queries executed (sandbox egress blocks
  microns-explorer.org; adapter must run on open network).
- No ML models trained on neural data. No activity forecaster, no link predictor.
- No live API endpoints (`/api/v1/*` extensionless → 404; static `.json` files added
  this session, see `DECISION_LOG.md` D-002).
- No `/neuroscience`, `/algae`, `/journal` division pages (only `/neuroML/`, `/blog/` exist).
- No database, no backend runtime, no job queue (static Apache/LiteSpeed hosting).
- No Groq key configured; nothing currently requires one.

## Active blockers

See `BLOCKERS.md`. Top blocker: **B-001 sandbox egress** — only github/npm/pypi
reachable from bash; all science APIs (CAVE, Allen, DANDI, Crossref, OpenAlex,
Zenodo) unreachable except via Arena `fetch_page`/`web_search` proxy.

## Next tasks (priority order)

1. T-010: run CAVE adapter discovery step on open network (needs user machine or open egress)
2. T-011: MICrONS first-neuron milestone (1 real neuron + provenance + connectivity)
3. T-020: Allen abc_atlas_access release survey (GitHub-accessible parts in sandbox)
4. T-030: fly portable-API alignment check vs game-website (avoid duplicate backends)
5. T-040: static API extensionless routing decision + `/developers/` status update
6. T-050: corporate redesign tokens + `/neuroscience` stub (Sprint 8, after data slice)

Full registry: `TASK_REGISTRY.json`. Checkpoint: `CURRENT_CHECKPOINT.json`.
