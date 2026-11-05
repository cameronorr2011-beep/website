# RESEARCH_LOG.md — Dated scientific findings (evidence-linked)

## 2026-11-04

### R-001 FlyWire v783 asset integrity CONFIRMED ( ingest-quality evidence)

- Method: shallow-cloned game-website `neuro-ml`; `sha256sum` of
  `public/data/flywire-v783.npz` == manifest `asset.sha256`
  (`ddf717f5…9632e5b`); inspected CSR arrays with numpy (ids/out_indices/
  out_indptr/out_data/shape; 139,255 × uint64 IDs; 15,091,983 pairs).
- Conclusion: fly graph is real imported research data, not placeholder.
- Caveat: annotations/morphology absent in this asset; license caution D-005.

### R-002 Prior fly reconciliation cross-check exists (literature-of-record)

- `arena/e676bd12-game-website` commit `9f93b1fb` reconciled the same asset
  against Shiu parquet + Codex mirror + annotation TSV with 128-bit row
  fingerprints (`e013c235…` match). Independent corroboration of pair counts.
- Action: T-030 must align rather than duplicate this backend.

### R-003 MICrONS access facts (proxy-sourced, runtime re-verification required)

- Datastack `minnie65_public`; synapse table discovered via
  `client.info.get_datastack_info()["synapse_table"]`; tutorial-reported
  public version v1926 (9/28/2026). Sources: tutorial.microns-explorer.org
  quickstart notebooks (via web_search), microns-explorer.org/cortical-mm3
  (via fetch_page).
- Functional route: `cajal/microns-nda-access` v8; 115,372 ROIs / 75,902
  neurons per explorer page. Correspondence subset only — no 1:1 assumption.

### R-004 Sleep-model scrutiny items pre-addressed upstream

- Hypnogram scheduler retired as principal mode; circuit-based regimes with
  measured classifier disagreement documented; N3/REM failures disclosed.
  Directive §3.1 concerns are already handled in `docs/research/SLEEP_MODEL.md`
  + `KNOWN_LIMITATIONS.md`. No correction needed from this repo.
