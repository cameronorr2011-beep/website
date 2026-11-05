# MODEL_REGISTRY.md — ML models and mechanistic simulators

No trained neural-data ML model exists yet. This file currently records the
mechanistic baselines found during audit so future ML work compares honestly.

## Mechanistic / simulation baselines (audited, not trained here)

### SIM-001 Sleep spiking circuit (game-website `neuro-ml`)

- 483 LIF neurons (cortex E/I, TC, RE, VLPO, orexin, LC, DR, ACh wake/REM),
  normalized neuromodulator kinetics, single-dipole EEG forward model.
- Measured (seed 7, 10 s, dt 1 ms): Wake 9×Wake; NREM 7×N1+2×N2; REM 7×N1+2×REM.
- Limitations: no N3, no theta generator, uncalibrated EEG, no PSG validation,
  weights assumed. Source: `docs/research/SLEEP_MODEL.md` (neuro-ml branch).
- Status: reference baseline only. Not a trained predictor.

### SIM-002 Fly LIF subset runs (game-website `neuro-ml`)

- 512-neuron induced subgraph, 0.5 s, ach-gaba-only policy; full 139k-neuron
  20 ms executability run. Parameters exploratory. Not a fitted model.

### SIM-003 Algal Digital Lab engine (`Simulation/`, this repo)

- Deterministic Droop/Steele-family culture model + versioned persistence.
- Tested (`test_simulation_engine`, `test_simulation_persistence` pass).
- Organism-specific; never transferred to neuroscience.

## ML models (future; Sprint 4+)

| ID | Task | Data | Status |
|---|---|---|---|
| ML-A | Activity forecaster | MICrONS-NDA | blocked on data (B-001→T-011) |
| ML-B | Connectivity inference | fly first, mouse later | pending |
| ML-C | Cell-type/property inference | Allen ABC | pending |
| ML-D | Multimodal representation | mixed | pending |
| ML-E | Mechanistic-vs-ML comparison | Allen Cell Types | pending |

Every future entry must record: task, dataset versions, splits, baselines,
held-out metrics, limitations, artifacts location, model card. No exceptions.
