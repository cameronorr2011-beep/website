# Orr Biologicals BioRealm

`/game/` is a calm, local-first discovery and cultivation game with two primary
screens: **Cultivate** and **Discover**. Explore synthetic field biomes, reveal
species records, and assign discovered strains to photobioreactors. Archive,
research, and save settings remain quiet utility views rather than competing with
the main loop.

## Loop

1. Start on **Cultivate** and claim the one-time field-study grant.
2. Move to **Discover**, choose a field site, and run a survey.
3. Reveal the deterministic result when the sample is ready.
4. Return to **Cultivate**, place the record in glass, and harvest patient growth.

The game includes Freshwater, Lake Shelf, Moist Sand, Saltwater Coast, Garden Soil,
Forest Soil, Wetlands, Thermal Springs, and Night Tide. Their pools, costs, durations,
environmental preferences, and rarity weighting are materially different. Species use
real genus names where useful (including Arthrospira, Chlorella, Nannochloropsis,
Tetraselmis, Pavlova, and Isochrysis), alongside explicitly fictional game strains.

## Persistence and simulation boundary

Progress is stored locally under the versioned `orr-biorealm-v1` key. Saves include a
world seed, equipment, discoveries, reactor timestamps, settings, and event state.
Offline production is timestamp-based, capped at eight hours, and settled before a
save so reloading cannot duplicate a return batch. Invalid saves are rejected without
overwriting the raw record; v1/v2 Rack Run saves can be migrated into a fresh BioRealm
laboratory.

All species values, rarity odds, growth traits, device behavior, reactor economics,
events, illustrations, and audio are fictional game mechanics. The experience does
not identify organisms, control hardware, or provide a real cultivation protocol.

## Local run

From the repository root:

```bash
npm run build:lab
python3 tools/site/serve_preview.py
```

Open <http://127.0.0.1:8876/game/>. The deployment is static and self-contained; it
does not require a database, API key, backend, CDN, external image, or audio request.
The build writes a content-hashed ESM bundle to `game/dist/` and updates
`game/index.html`.

## Checks

```bash
node tools/test_biorealm_engine.mjs
python -m unittest tools.test_lab
npm run test:lab
npm run test:simulation
npm run test:expedition
npm run test:server
```

With the preview server running, the active route smoke test is:

```bash
# Use any Playwright-compatible browser runner available in your environment.
# The repository QA script is: tools/qa_biorealm.mjs
```

The browser check covers a fresh grant, device purchase and installation, a
Freshwater expedition, a deterministic completed reveal, archive persistence,
reactor rendering, zero essential request/console failures, and 390px overflow.
The optional `?qa=1` URL only exposes an in-memory test clock button to avoid a
30-second browser wait; it is not shown during normal play.
