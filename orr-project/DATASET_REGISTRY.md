# DATASET_REGISTRY.md — Source-by-source truth table

Legend: ✅ ingested+verified · 🔶 surveyed, not ingested · ❌ not started.
Counts shown only from verified manifests or official pages cited inline.

## Fly (Drosophila melanogaster)

### FLY-001 FlyWire FAFB v783 proofread connectome ✅ (in game-website repo)

- Release: v783.0, Oct 2023 snapshot, publ. 2024. DOI 10.5281/zenodo.10676866.
- Citation: Dorkenwald et al., Nature 634, 124–138 (2024).
  doi:10.1038/s41586-024-07558-y
- Verified asset: `public/data/flywire-v783.npz`, 48,560,472 bytes,
  SHA-256 `ddf717f5c53883da1a131e7a2d71fbde3f900a2202ab087e796bcd2059632e5b`.
- Verified counts: 139,255 neuron IDs · 15,091,983 directed pairs ·
  54,492,922 synapses · 0 self-connections. Validation: 0 duplicate IDs,
  0 dangling endpoints (manifest `validation` block).
- Scope: adult female central brain + optic lobes. NOT ventral nerve cord.
- Missing in this asset: cell types, morphology, per-neuron neuropil, receptor
  signs, delays, physiology (manifest `annotation_coverage`: not imported).
- License: **CC BY-NC 4.0 treatment pending clarification** (D-005).
- Location: game-website `neuro-ml` branch (this repo holds no copy).

## Mouse (Mus musculus) — all 🔶/❌, nothing ingested

### MOUSE-001 MICrONS cortical mm3 (CAVE `minnie65_public`) 🔶 surveyed

- Explorer: https://www.microns-explorer.org/cortical-mm3
- Paper: MICrONS Consortium et al., Nature 640, 435–447 (2025).
  doi:10.1038/s41586-025-08790-w
- Published description (to re-verify at runtime): ~200,000 cells, ~523M
  automated synapse detections, ~75,902 neurons w/ functional imaging; VISp,
  VISlm, VISal, VISrl; P87 mouse; 1.4×0.87×0.84 mm.
- Access: CAVEclient; materialization versions dynamic (tutorial noted v1926
  public as of 9/28/2026 — re-discover, never hardcode).
- Live queries blocked in sandbox (B-001). Adapter: `tools/neuroml/cave_adapter.py`.

### MOUSE-002 MICrONS functional data (NDA) 🔶 surveyed

- Repo: https://github.com/cajal/microns-nda-access (v8) — GitHub-reachable,
  inspection possible in sandbox. Not yet cloned.

### MOUSE-003 Allen Brain Cell Atlas (abc_atlas_access) ❌

- https://github.com/AllenInstitute/abc_atlas_access — reachable; T-020 surveys
  releases. No counts claimed until verified.

### MOUSE-004 Allen Mouse Brain Connectivity Atlas ❌

- Projection-level evidence only; never to be converted to synapses (§6.3).

### MOUSE-005 Allen Cell Types / neuronal models ❌ — not started.

### MOUSE-006 DANDI / NWB ❌ — not started.

## Rules

1. No dataset row without source URL + version + access route.
2. No counts without a manifest, query result, or cited official page.
3. Ingestion manifests live in `orr-project/data/` (git-ignored if large; small
   JSON manifests committed).
