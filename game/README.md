# Orr Biologicals Research Lab

`/game/` is now the interactive research-lab application rather than the
previous Algae Living arcade game. It is a static, local-first browser app with
two connected synthetic models:

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
```

## Controls

1. Choose **Cyanoflow** and use **Advance workflow** for one stage at a time,
   or run **Run full synthetic path · 24 h** for the complete demonstration.
2. Select a cell in the table or laboratory scene to inspect its trace.
3. Transfer an isolated candidate into Algaephyte.
4. Use the Algaephyte sliders, scenario selector, fixed-step button, or clock to
   change conditions and observe the synthetic cultivation trajectory.
5. Capture a comparison, export state JSON, or export the complete report.

The scene uses a self-hosted, content-hashed Three.js runtime with orbit, zoom,
cell selection, vessel/chip/cell camera modes, depth cues, transparent vessel
surfaces, channels, probes, droplets, bubbles, and synthetic cell motion. A
Canvas accessibility fallback keeps the lab usable when WebGL is unavailable.
It is intentionally a visualization layer over the independent model, not a CFD
or validated biological renderer.

## Data and safety boundary

All generated cells, fluorescence values, lipid proxies, viability values,
candidate scores, sensor-like values, and growth outputs are synthetic. The UI
and exported reports label them as synthetic or inferred. Microscopy is not
treated as proof of lipid content or strain identity. There is no hardware
provider, actuator path, cloud synchronization, or AI credential in this static
application. A future Raspberry Pi service must integrate through a separate,
validated provider boundary and must never be enabled by simulation or model
recommendations.
