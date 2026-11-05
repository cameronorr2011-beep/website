# BLOCKERS.md

## B-001 — Sandbox egress blocks all live science APIs [OPEN, structural]

- Only github.com, codeload.github.com, api.github.com, registry.npmjs.org,
  pypi.org, files.pythonhosted.org reachable from bash/Python.
- Blocked: microns-explorer.org, CAVE APIs (global.daf-apis.com), Allen APIs,
  DANDI, Crossref/OpenAlex (server-side), Zenodo, NCBI/Europe PMC.
- Impact: T-010, T-011 (MICrONS live retrieval), server-side literature jobs,
  Allen/DANDI ingestion cannot execute here.
- Workarounds in use: (1) Arena fetch_page/web_search proxy for research;
  (2) GitHub-hosted science repos/clones (fly asset, microns-nda-access,
  abc_atlas_access) ARE reachable; (3) mocked adapter tests in sandbox.
- Resolution path: run `tools/neuroml/cave_adapter.py` on an open-network
  machine (user's Windows box) or anpa egress-expanded environment. Needs no
  purchase; needs network only. CAVE token requirements to confirm at runtime
  (public datastack reads may need free registration).

## B-002 — No GPU [OPEN, informational]

- No CUDA/nvidia device. ML work must start CPU-appropriate (baselines,
  small temporal models, fly-subgraph GNN). No large-transformer plans.

## B-003 — No Groq key [NOT BLOCKING]

- Nothing in Sprints 0–4 requires Groq. Journal automation mentions
  `GROQ_API_KEY` in CI only. Will prompt explicitly if a component genuinely
  needs it (directive §23). Not requested.

## B-004 — Static hosting limits dynamic API [OPEN, architectural]

- Production is Apache/LiteSpeed static (.htaccess). No Python/Node runtime,
  no database. Dynamic endpoints (POST predictions, neuron search over 15M
  edges) need either Vercel/serverless (NeuroML repo) or client-side indexed
  assets. Static JSON is the honest first step (D-002).

## Resolved

- (none yet)
