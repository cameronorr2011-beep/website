# Orr Biologicals application audit

Audit date: 2026-10-09
Repository: `cameronorr2011-beep/website`
Working tree baseline: `4137c4d`

## Actual architecture

This repository is a static Apache-hosted website. It has no package manifest,
backend service, database schema, Electron shell, or Python runtime service.
The public application entry point is `game/index.html`; JavaScript is served as
browser ES modules and state is currently stored only in the browser.

The existing `/game/` experience is the Algae Living canvas game. Its engine
tracks a player cell, motes, bacteria, upgrades, and reactor-economy progress.
The landing page also contains several scroll-story canvas scenes. The game
does not currently model cultivation measurements, microfluidic processing,
single-cell provenance, experiments, or a cross-platform workflow.

## Findings

1. **Working site baseline** — the SEO build and existing 19 Python regression
   tests pass at the audit baseline. The public homepage, `/game/`, and live
   game entry point load without console errors.
2. **Game rendering defect** — the game renderer sizes its canvas while the
   `#stage` element is hidden, leaving a 1×1 backing canvas after entering from
   the landing page unless another resize event occurs.
3. **Non-reproducible simulation** — the game engine uses ambient
   `Math.random()` for world generation and runtime behavior; it has no seed,
   fixed-step scientific clock, scenario model, or replay contract.
4. **Insufficient persistence** — the current save is an economy/game-state
   object gated by site cookie consent. There are no persistent sample,
   candidate-cell, sensor, calibration, event, or experiment records.
5. **No integrated research workflow** — Algae Living is the primary play
   experience; Algaephyte and Cyanoflow are presented elsewhere as static
   research concepts. There is no sample-to-isolation-to-cultivation transfer.
6. **No 3D layer** — the existing visualization is Canvas 2D and CSS. There is
   no WebGL scene, camera system, object selection, or non-WebGL fallback for a
   laboratory workspace.
7. **Hardware/AI boundary is intentionally local and unavailable** — the website
   repository has no sensor acquisition service or AI API client. The lab now
   exposes a versioned mock-provider contract, invalid-reading validation, and
   an explicit unavailable Raspberry Pi provider rather than fabricating
   hardware/cloud success.

## Prioritized implementation checklist

### P0 — coherent working vertical slice (implemented in the working tree)

- [x] Replace the game entry experience with an interactive research lab shell.
- [x] Add a deterministic, fixed-step synthetic simulation engine with explicit
      units, assumptions, seed, scenarios, and event states.
- [x] Implement Algaephyte growth state and environmental controls.
- [x] Implement Cyanoflow sample processing, cell identity, synthetic analysis,
      isolation, and candidate transfer into cultivation.
- [x] Add local persistence, reset, import/export, and reproducibility checks.
- [x] Add an interactive software-3D laboratory renderer with a Canvas fallback
      path, camera modes, object selection, and a microscope-inspired cell view.

### P1 — product completion within the static architecture

- [x] Add accessible metrics, timelines, alerts, empty states, and contextual
      explanation panels.
- [x] Add scenario comparison and an exportable experiment report.
- [x] Add visible synthetic/observed/inferred/unknown data provenance labels.
- [x] Add browser and static-contract tests for the end-to-end workflow.

### P2 — physical integration boundary

- [x] Document and expose a versioned sensor-provider contract for a future Pi service,
      including ADC requirements and invalid-reading handling.
- [x] Keep actuator control disabled and provide an honest unavailable state for
      future real hardware and AI integrations.

## Scope boundary

The implementation in this static repository can provide a fully functional
browser simulation and local experiment record. It cannot truthfully provide a
real Pi sensor service, validated biological measurements, CFD accuracy, cloud
synchronization, or AI conclusions without external hardware, credentials, and
validated data. Synthetic results remain labeled in the UI and exported data.

## Verification recorded during this audit

- `python -m unittest discover -s tools -p 'test_*.py'` — 23 tests passing.
- `node tools/test_lab_engine.mjs` — deterministic workflow, fixed-step
  reproducibility, mass balance, loss modes, and schema validation passing.
- Browser smoke test `tools/qa_lab.mjs` — app boot, complete synthetic workflow,
  candidate inspection, transfer path, fixed-step clock, comparison registry,
  and zero console/request errors on the local preview.
