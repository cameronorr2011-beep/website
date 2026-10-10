# Orr Biologicals application audit

Audit date: 2026-10-09
Repository: `cameronorr2011-beep/website`
Working tree baseline: `4137c4d`

## Actual architecture

This repository is a static Apache-hosted website. `package.json` provides
lab tests and an esbuild/Three.js static bundle; Node is not required on the
hosting server. There is no database or Electron shell. The public application
entry point is `game/index.html`, and simulation state stays in the browser.
An optional, separately installed Python service in `hardware/pi-sensors/`
provides read-only Raspberry Pi telemetry; it does not run on the website host.

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
7. **Hardware/AI boundary is read-only and opt-in** — the lab exposes a
   versioned Pi provider with contract, calibration, freshness, and provenance
   validation. A separate Python service reads DS18B20 and MCP3008 interfaces
   only. Mock telemetry remains explicitly synthetic; failed or stale readings
   are not usable measurements. There is no actuator route or AI API client.

## Prioritized implementation checklist

### P0 — coherent working vertical slice (implemented in the working tree)

- [x] Replace the game entry experience with an interactive research lab shell.
- [x] Add a deterministic, fixed-step synthetic simulation engine with explicit
      units, assumptions, seed, scenarios, and event states.
- [x] Implement Algaephyte growth state and environmental controls.
- [x] Implement Cyanoflow sample processing, cell identity, synthetic analysis,
      isolation, and candidate transfer into cultivation.
- [x] Add local persistence, reset, import/export, and reproducibility checks.
- [x] Add a self-hosted Three.js laboratory renderer with a Canvas fallback path,
      camera modes, object selection, and a microscope-inspired cell view.

### P1 — product completion within the static architecture

- [x] Add accessible metrics, timelines, alerts, empty states, and contextual
      explanation panels.
- [x] Add scenario comparison and an exportable experiment report.
- [x] Add visible synthetic/observed/inferred/unknown data provenance labels.
- [x] Add browser and static-contract tests for the end-to-end workflow.

### P2 — physical integration boundary

- [x] Implement and document the versioned, read-only Pi sensor service,
      including ADC requirements and invalid-reading handling.
- [x] Add explicit browser connection/disconnection and separate telemetry export.
- [x] Keep actuator control disabled, simulation state separate, and hardware/AI
      unavailability honest.
- [ ] Verify acquisition, calibration, permissions, and systemd on a physical Pi.

## Scope boundary

The implementation in this static repository can provide a fully functional
browser simulation and local experiment record. It cannot truthfully provide a
verified physical Pi acquisition, validated biological measurements, CFD accuracy, cloud
synchronization, or AI conclusions without external hardware, credentials, and
validated data. Synthetic results remain labeled in the UI and exported data.

## Verification recorded during this audit

- `python -m unittest discover -s tools -p 'test_*.py'` — 25 tests passing.
- `python -W error::ResourceWarning -m unittest discover -s hardware/pi-sensors
  -p 'test_*.py'` — 9 tests passing, including ADC/calibration, sampling failure,
  stale readings, CORS/preflight, and all advertised rejected write methods.
- `npm run test:lab` — engine plus provider contract, calibration, provenance,
  freshness, HTTP failure, timeout, and disconnect regression checks passing.
- `npm run build:lab` — content-hashed, self-hosted bundle built and its HTML
  entry reference verified. No TypeScript typecheck is configured.
- Browser device QA `tools/qa_lab_device.mjs` — actual mock-service opt-in,
  unchanged simulation state, downloaded snapshot schema, mobile layout,
  stale-value hiding, malformed-response rejection, disconnect/reset behavior,
  and zero console/request errors. No physical Pi or production TLS was tested.
- `node tools/test_lab_engine.mjs` — deterministic workflow, fixed-step
  reproducibility, mass balance, loss modes, and schema validation passing.
- Browser smoke test `tools/qa_lab.mjs` — app boot, complete synthetic workflow,
  candidate inspection, transfer path, fixed-step clock, comparison registry,
  and zero console/request errors on the local preview.
