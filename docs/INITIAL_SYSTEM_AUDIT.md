# INITIAL_SYSTEM_AUDIT.md — Baseline before implementation (2026-11-04)

Auditor: Director (single-agent session). Every claim below cites the check
performed. Prior conversation is not evidence; re-verify via `RESUME_INSTRUCTIONS.md`.

## 1. Environment (measured)

- Debian 12, Linux 6.1, 2 CPU, 3.8 GiB RAM, 20 GB disk free, **no GPU**
  (`nvidia-smi` absent, no `/dev/dri`).
- Python 3.11.2, Node v22.22.3 (repo prefers Node 24; full suite passes on 22),
  npm 10.9.8, `gh` authenticated as cameronorr2011-beep.
- Egress from bash/Python: github.com, codeload, api.github, registry.npmjs,
  pypi, files.pythonhosted ONLY. `curl` to api.crossref.org, api.openalex.org,
  microns-explorer.org → `000` (blocked). `pip install` and `npm install` work.
  Arena `fetch_page`/`web_search` proxy reaches science sites (used for research).
- No AI-provider keys, no database, no MCP integrations, no GPU, no cloud
  credentials in scope. Background OS processes supported (`start_process`).

## 2. Corporate website repo (`cameronorr2011-beep/website`)

- Static HTML/CSS/JS + Three.js (pin `three@0.180.0`) + esbuild bundles.
- Build: `npm run build` (cinema + SEO py + simulation + game). Test:
  `npm test` = `test_all.mjs` (27 Python unittests) + simulation + biorealm +
  culturetrace suites.
- **Baseline: GREEN.** 27/27 py tests pass; simulation engine/persistence pass;
  biorealm engine/atmosphere pass after `npm install` (initial failure was
  missing `esbuild`, i.e. deps not installed — not a code defect).
- Routes: 14/14 probed return **200** locally (`/`, `/neuroML/`,
  `/literature/`, `/developers/`, `/blog/`, `/research/`, `/algaephyte/`,
  `/cyanoflow`, `/Simulation/`, `/game/`, `/algae-growth/`, sitemap, robots).
- `.htaccess`: canonical https/non-www, clean `.html` routes, blocks dotfiles +
  `sections|tools|docs`, `apps`, `server|node_modules|.git`, legacy redirects.
  Deployment: GitHub → Hostinger Apache/LiteSpeed static. No backend runtime.
- Existing honest skeleton pages: `/neuroML/` (dataset registry table, zero
  counts declared as true state), `/developers/` (endpoint contract marked
  "nothing responds yet"), `/literature/` (**live** client-side
  Crossref/OpenAlex search — real, working implementation).
- No `/algae`, `/neuroscience`, `/journal` division pages. No `/api/*` routes.
- Gaps noted, not yet fixed: mobile/responsive re-verification pending for any
  new work; Lighthouse not run (no browser tooling in sandbox — record as gap).

## 3. NeuroML repo (`cameronorr2011-beep/game-website`, read-only audit)

- `main`: game bot (pixel-vision DQN + spiking nucleus) + `/sleep` page.
- `neuro-ml` branch (shallow-cloned, inspected):
  - **FlyWire v783: REAL DATA.** `public/data/flywire-v783.npz`
    (48,560,472 bytes) SHA-256 `ddf717f5…9632e5b` **matches manifest**.
    CSR graph: 139,255 uint64 IDs, 15,091,983 directed pairs, 54,492,922
    synapses. Manifest validation: 0 duplicate IDs, 0 dangling endpoints,
    0 self-connections. Annotations/morphology explicitly not imported.
  - Sleep: 483-neuron spiking circuit; scheduler retired as principal mode;
    N3 absent, REM labels unstable (2/9 windows), EEG uncalibrated model
    output, no PSG data — all disclosed in `SLEEP_MODEL.md` /
    `KNOWN_LIMITATIONS.md`. Directive §3.1 scrutiny items pre-addressed.
  - 24 focused tests reported passing upstream (not re-run here; out of scope
    for this repo's baseline).
- Prior Arena branches `aa31f806` / `e676bd12` (Nov 3–4, completed sessions):
  Sleep Lab explorer; portable fly API with 128-bit row-fingerprint
  reconciliation. License finding adopted: **treat FlyWire as CC BY-NC 4.0
  pending clarification** (Zenodo says BY, flywire.ai guidelines say BY-NC).
- No mouse data, no trained neural ML models, no live mouse API anywhere yet.

## 4. Deployment / SEO baseline

- Sitemap + robots + canonical/OG/JSON-LD present on probed pages.
- Production deploys from `main`; session branch `arena/bfcb8601-website`
  must merge via PR, never push to `main` directly.

## 5. Top risks / blockers

- B-001 sandbox egress: no live CAVE/Allen/DANDI/literature-server calls here.
- B-004 static hosting: dynamic API needs a runtime strategy (Vercel NeuroML
  app or client-side indexed assets).
- B-002 no GPU: CPU-scale ML only.

## 6. Preservation commitments

No existing working functionality deleted or replaced this session; all
changes additive. Fly environment untouched (separate repo, read-only audit).
