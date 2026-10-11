# Orr Biologicals application audit

Audit date: 2026-10-10
Repository: `cameronorr2011-beep/website`
Working tree baseline: `f7b9060` (`main`); the current continuation is local and uncommitted.

## Actual architecture

This repository is a static Apache-hosted website. `package.json` provides
lab tests and an esbuild/Three.js static bundle; Node is not required on the
hosting server. There is no database or Electron shell. The public application
entry point is `game/index.html`, and simulation state stays in the browser.
An optional, separately installed Python service in `hardware/pi-sensors/`
provides read-only Raspberry Pi telemetry; it does not run on the website host.

The `/game/` experience is an interactive synthetic research lab with a
PHYCOFRONTIER expedition mode. Its browser engine links a deterministic probe
world (movement, environmental gradients, uncertain scans, sample custody,
fouling/cleaning, recovery, and autonomous decisions) to the seeded Cyanoflow
sample-processing workflow and the Algaephyte cultivation model. Local
experiment records and an optional read-only Pi telemetry panel remain
separate from the simulation. The visual layer is a self-hosted Three.js WebGL
scene with a procedural laboratory, cultivation vessel, sample-preparation
station, microfluidic chip, microscope, and a separate 3D exploration field
with terrain, depth volume, probe model, and hotspot markers. A dependency-free
Canvas projection remains available when WebGL cannot initialize.

## Findings

1. **Working site baseline** — the SEO build, 25 site regression tests, and
   9 Pi-provider tests pass. The local `/game/` entry point loads without
   browser console or request errors; the live `/game/` route remains HTTP 200.
2. **3D environment continuation** — the local WebGL scene now includes room
   context (rear service shelf, reagent bottles, status console, overhead light
   panels, conduits, floor safety markers, and indicator lamps) rather than only
   isolated device meshes. The lighting and flow markers respond to synthetic
   model state. The current local smoke measured 742 WebGL draw calls at the
   desktop test viewport; low-quality mode and the Canvas fallback remain
   available for constrained devices.
3. **Reproducible simulation** — the seeded engine uses a fixed-step scientific
   clock, bounded scenarios, explicit units, and a report contract. Animation
   time is visual-only and does not alter model reproducibility.
4. **Local persistence boundary** — saves, imports, exports, calibration
   records, expedition provenance, candidate-cell provenance, events, and
   experiment reports are versioned browser-local records. An optional,
   loopback-only Node JSON service provides a tested development persistence
   boundary; it is not production authentication or cloud storage.
5. **Integrated research workflow** — Cyanoflow moves a sample through modeled
   preparation, transport, analysis, isolation, and candidate transfer into
   Algaephyte cultivation. Camera buttons and workspace tabs stay synchronized
   with the 3D scene.
6. **3D limitations** — the scene is procedural visualization, not CFD,
   validated microscopy, or a physical digital twin. No external art assets or
   network service are required. WebGL context loss and low-memory conditions
   must continue to degrade to the accessible Canvas projection.
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
- [x] Add a deterministic 3D exploration mode with four environment types,
      hotspot generation, keyboard movement, scan/sample/recovery controls,
      fouling and cleaning, autonomous state transitions, and sample custody.
- [x] Link expedition sample records into the Cyanoflow source view and include
      expedition state in local saves and research report exports.
- [x] Dress the 3D scene as a procedural laboratory environment: workbench,
      rear service wall, overhead lights, reagent shelf, monitor, conduits,
      status indicators, animated culture bubbles, and chip-flow markers.
- [x] Keep workspace tabs, camera buttons, object selection, and the Canvas
      fallback synchronized with the synthetic state.

### P1 — product completion within the static architecture

- [x] Add accessible metrics, timelines, alerts, empty states, and contextual
      explanation panels.
- [x] Add scenario comparison and an exportable experiment report.
- [x] Add visible synthetic/observed/inferred/unknown data provenance labels.
- [x] Add browser and static-contract tests for the end-to-end workflow.
- [x] Add deterministic expedition tests, browser expedition smoke QA, and an
      optional local backend with round-trip/idempotency tests.

### P2 — physical integration boundary

- [x] Implement and document the versioned, read-only Pi sensor service,
      including ADC requirements and invalid-reading handling.
- [x] Add explicit browser connection/disconnection and separate telemetry export.
- [x] Keep actuator control disabled, simulation state separate, and hardware/AI
      unavailability honest.
- [ ] Verify acquisition, calibration, permissions, and systemd on a physical Pi.

## Scope boundary

The implementation in this static repository can provide a fully functional
browser simulation, procedural 3D visualization, and local experiment record.
The optional Node service is a development backend only: it has no
authentication, authorization, rate limiting, durable database, or production
deployment configuration. The site cannot truthfully provide a verified
physical Pi acquisition, validated biological measurements, CFD accuracy,
cloud synchronization, or AI conclusions without external hardware,
credentials, and validated data. Synthetic results remain labeled in the UI
and exported data.

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
- Local WebGL browser QA `tools/qa_lab.mjs` — WebGL renderer/draw-call check,
  mobile fit, camera synchronization for Algaephyte and cell inspection, full
  synthetic workflow, and zero console/request errors. A separate `?render=2d`
  smoke confirmed the Canvas fallback remains usable.
- Production browser smoke `https://orrbiologicals.com/game/` — HTTP 200, lab
  boot, complete synthetic workflow, mobile fit, and zero console/request errors.
- `node tools/test_lab_engine.mjs` — deterministic workflow, fixed-step
  reproducibility, mass balance, loss modes, and schema validation passing.
- `npm run test:expedition` — deterministic world generation, movement, scan
  uncertainty, sample limits, cleaning, autonomous recovery, serialization,
  and malformed-state rejection passing.
- `npm run test:server` — optional backend health, file-backed state round-trip,
  payload limits, and idempotent event handling passing.
- `tools/qa_expedition.mjs` — local WebGL and `?render=2d` browser flows passed:
  expedition boot, hotspot selection, scan, sample custody, Cyanoflow linking,
  cultivation workflow, local save, mobile fit, and zero console/request
  errors.
- `tools/qa_backend_bridge.mjs` — with the loopback service running, explicit
  health and full-record sync passed without exposing the bridge in local-only
  mode.
