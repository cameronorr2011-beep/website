# Orr Biologicals Research Lab

`/game/` is now the interactive research-lab application rather than the
previous Algae Living arcade game. It is a static, local-first browser app with
an end-to-end PHYCOFRONTIER expedition loop and two connected synthetic lab
models:

- **PHYCOFRONTIER / Expedition** deploys a deterministic probe into freshwater,
  marine, sediment, or terrestrial 3D fields. The player navigates a bounded
  world, reads environmental telemetry, scans uncertain hotspots, collects
  samples, manages energy/condition/fouling, runs cleaning, recovers the probe,
  or enables an autonomous sampling state machine.

- **Cyanoflow** creates a seeded environmental sample, moves cell identities
  through simplified preparation and microfluidic residence-time stages,
  generates droplets, models empty/multiplet/lost cells, and ranks candidates
  with explicitly synthetic optical/lipid proxy fields.
- **Algaephyte** tracks a controllable 18 L culture using a bounded growth
  approximation with light, photoperiod, temperature, pH, nutrient, carbon,
  mixing, aeration, and dissolved-oxygen terms. Biomass and concentration are
  kept as separate, unit-labeled values.

The two workflows are linked: an isolated synthetic candidate can be inspected,
transferred into Algaephyte, cultivated under a scenario, compared with other
runs, and exported as a versioned JSON report. The simulation clock advances in
fixed 60-second model steps, independently of animation frame rate. Identical
seeds and parameters reproduce the same cell population, workflow outcomes,
and cultivation trajectory.

The expedition engine is render-independent and stores observed telemetry
separately from inferred habitat, suitability, confidence, and uncertainty.
Real reference labels (such as Arthrospira and Chlorella) are marked as
reference labels only; fictional organisms are marked simulated. A collected
expedition sample remains linked in the UI when opened in Cyanoflow, while the
downstream microscopy pipeline continues to label its generated fields as
synthetic.

## Model contract

Algaephyte uses an 18 L vessel and tracks dry biomass in **g**, concentration in
**g/L**, carbon in **g/L**, nitrogen in **mg/L**, temperature in **°C**, pH,
dissolved oxygen as **% saturation**, turbidity as a synthetic **AU** proxy,
light as **µmol m⁻² s⁻¹**, and time in **seconds/hours/days**. The supported
control ranges are bounded in the Algaephyte view and clamped at the engine
boundary. Growth is a fixed-step approximation combining a Monod-like nutrient
term, a carbon term, a Steele-shaped light response, bell-shaped temperature
and pH responses, mixing/aeration scalars, and dissolved-oxygen inhibition.

Cyanoflow exposes flow in **µL/min**, channel width in **µm**, channel length
in **mm**, droplet diameter in **µm**, and cell concentration in **cells/mL**.
Transport is a residence-time approximation; it is not CFD. Filtration loss,
empty droplets, multiplets, and unrecovered cells are explicit outcomes. Proxy
scores and selection thresholds are configurable, but they remain inferred
synthetic criteria.

## Run locally

From the repository root:

```powershell
python tools/site/serve_preview.py
```

Open <http://127.0.0.1:8876/game/>. The preview helper may be replaced with any
static HTTP server; `/game/index.html` uses relative assets and does not require
a package manager, database, API key, or network service.

The model checks can run without a browser:

```powershell
node tools/test_lab_engine.mjs
node tools/test_expedition_engine.mjs
npm run test:server
```

The optional local development backend can be started with `npm run server`.
It binds to `127.0.0.1:8787`, persists JSON state under `server/data/`, and
implements health, state, and idempotent event endpoints. The browser only
contacts it when an API URL is explicitly supplied, for example
`/game/?api=http://127.0.0.1:8787`; otherwise the deployment is local-browser
only. The backend has no authentication or production safeguards and must not
be exposed publicly.

## Controls

1. Start in **Expedition**, select a hotspot row or click a 3D marker, and use
   `WASD`/arrow keys, scan, collect, clean, autonomy, and recover controls.
2. Open a collected sample in **Cyanoflow**; use **Advance workflow** for one stage at a time,
   or run **Run full synthetic path · 24 h** for the complete demonstration.
3. Select a cell in the table or laboratory scene to inspect its trace.
4. Transfer an isolated candidate into Algaephyte.
5. Use the Algaephyte sliders, scenario selector, fixed-step button, or clock to
   change conditions and observe the synthetic cultivation trajectory.
6. Capture a comparison, export state JSON, export the expedition JSON, or
   export the complete research report.

The scene uses a self-hosted, content-hashed Three.js runtime with orbit, zoom,
cell selection, vessel/chip/cell camera modes, depth cues, transparent vessel
surfaces, channels, probes, droplets, bubbles, and synthetic cell motion. The
procedural room includes a rear service wall, reagent shelf, status console,
overhead luminaires, utility conduits, floor safety markers, and state-driven
indicator lights so the devices read as one laboratory environment. A Canvas
accessibility fallback keeps both the lab and expedition usable when WebGL is
unavailable. Expedition terrain, probe position, hotspot markers, and flow
indicators are rendered from the same saved state as the controls. The 3D
layer is intentionally a visualization over independent models, not CFD, a
validated microscope, or a physical digital twin.

## Data and safety boundary

All generated cells, fluorescence values, lipid proxies, viability values,
candidate scores, synthetic sensor-like values, and growth outputs are synthetic.
The UI and exported reports label them as synthetic or inferred. Microscopy is
not treated as proof of lipid content or strain identity. An opt-in read-only
Raspberry Pi provider can display separately validated DS18B20/MCP3008
telemetry, but physical readings never overwrite the model, saved state, or
experiment reports. There is no actuator path, cloud synchronization, or AI
credential in this static application; see `../hardware/pi-sensors/README.md`
for wiring, calibration, deployment, and HTTPS/CORS requirements.

## Browser QA

With the preview server running, the expedition and existing lab smoke paths
can be exercised with the repository's browser runner:

```powershell
node C:/Users/Cameron/.claude/skills/browser-automation/browser.mjs http://127.0.0.1:8876/game/ --script tools/qa_expedition.mjs
node C:/Users/Cameron/.claude/skills/browser-automation/browser.mjs "http://127.0.0.1:8876/game/?render=2d" --script tools/qa_expedition.mjs
node C:/Users/Cameron/.claude/skills/browser-automation/browser.mjs http://127.0.0.1:8876/game/ --script tools/qa_lab.mjs
# after `npm run server`, verify the explicit bridge:
node C:/Users/Cameron/.claude/skills/browser-automation/browser.mjs "http://127.0.0.1:8876/game/?api=http%3A%2F%2F127.0.0.1%3A8787" --script tools/qa_backend_bridge.mjs
```

These flows verify WebGL/Canvas boot, hotspot selection, scan and sample
custody, expedition-to-Cyanoflow linking, save/reload controls, mobile fit,
and zero console/request errors.
