# SESSION_LOG.md

## 2026-11-04 — Session 1 (Director, branch `arena/bfcb8601-website`)

### Environment discovery (real results)

- Repo: `/home/user/website`, clean tree on `arena/bfcb8601-website` from `a780ab7`.
- OS: Debian 12, Linux 6.1, 2 CPU, 3.8 GiB RAM (3.6 avail), 20G disk avail, **no GPU**.
- Python 3.11.2, Node v22.22.3 (repo prefers 24; tests pass on 22), npm 10.9.8.
- `gh` authenticated as cameronorr2011-beep. No AI provider keys in env.
- Egress: **github.com / codeload / api.github / registry.npmjs / pypi /
  files.pythonhosted ONLY**. Direct curl to crossref/openalex/microns → `000`
  (blocked). Arena `fetch_page`/`web_search` proxy CAN reach science sites.
- `pip install` works (numpy installed to /tmp for inspection; not committed).
- `npm install` works (esbuild binary fetched; biorealm suites now run).

### Website audit

- `tools/test_all.mjs`: 27/27 Python tests pass.
- Simulation engine + persistence suites pass.
- Biorealm engine/atmosphere initially failed (missing `esbuild`, node_modules
  absent) → fixed by `npm install` → pass. Root cause: deps not installed,
  not a code defect.
- Static server: `HOST`/`PORT` env supported; restarted on 0.0.0.0:8080 for preview.
- 14/14 routes probed → HTTP 200 (/, neuroML, literature, developers, blog,
  research, algaephyte, cyanoflow, Simulation, game, algae-growth, sitemap, robots).

### game-website audit (read-only: gh API + shallow clone of `neuro-ml`)

- `main`: game bot + sleep page. `neuro-ml`: FlyWire v783 import + sleep circuit.
- `public/data/flywire-v783.npz` (48,560,472 bytes): **SHA-256 matches manifest**
  `ddf717f5…9632e5b`. Contents: ids(139255,uint64), CSR out_indices/out_indptr/
  out_data (15,091,983 pairs), shape. REAL research data, verified locally.
- Sleep docs: 483-neuron circuit, honest limitations (no N3, unstable REM labels,
  uncalibrated EEG, no PSG data). No unsupported claims found; retired scheduler
  retained for comparison. Prior scrutiny items (§3.1) already addressed in docs.
- Prior Arena branches: `aa31f806` (Sleep Lab explorer), `e676bd12` (portable
  fly API w/ row-fingerprint reconciliation `e013c235…`, license caution
  CC BY-NC pending clarification). These are past sessions, not live agents.

### MICrONS facts established (via proxy tools, to verify at runtime)

- Public datastack: `minnie65_public`; synapse table via
  `client.info.get_datastack_info()["synapse_table"]`.
- Tutorial-reported current public materialization version: **1926 as of 9/28/2026**
  (must be re-discovered dynamically at runtime, never hardcoded as truth).
- Functional data route: `cajal/microns-nda-access` v8 (GitHub → sandbox-reachable).

### Decisions

- D-001: single-agent staffing recorded honestly; no fictitious delegation.
- D-002: first API ships as static `.json` (hosting is static); extensionless
  routing deferred to T-040 with explicit verification.
- D-003: `orr-project/` blocked from HTTP via .htaccess (internal tooling).
- D-004: CAVE adapter runs mocked in sandbox; live execution on open network only.

### Implementation (same session, continued)

- Wrote all 13 registry files under `orr-project/` (T-003 done).
- Wrote `docs/INITIAL_SYSTEM_AUDIT.md` (T-001/T-002 evidence).
- Shipped `api/v1/status.json`, `organisms.json`, `datasets.json` (T-005 done):
  6 dataset entries, only verified fly counts; mouse entries registered with
  `verified_counts: null`. Served 200 + `application/json` locally.
- Wrote `tools/neuroml/cave_adapter.py` + fixture + `tools/test_cave_adapter.py`
  (T-004 done): pinning enforced, chunked queries, retry, SHA-256 manifests,
  live-egress guard. 8/8 new tests pass. `--live` correctly refuses (exit 2,
  B-001 message); fixture discovery pins v1926 and writes a manifest.
- `.htaccess`: added separate `RewriteRule ^orr-project(?:/|$) - [F,L]` (D-003).
  First attempt (inline group edit) broke `test_redirect_rule_invariants`;
  fixed with a separate rule line, suite green again. Lesson: SEO tests pin
  .htaccess invariants — check `tools/test_seo.py` before touching it.
- Full green: 35/35 py tests + sim engine/persistence + biorealm engine/atmosphere.

### Next

Commit + push (this session). Then T-020 (Allen survey via GitHub), T-030
(fly backend alignment), T-040 (API routing), pending user/open-network for
T-010/T-011 (live MICrONS).
