# Orr Biologicals Cyanoflow

`/game/` is a local-first pixel-art single-cell discovery game. Explore distinct
synthetic field biomes, purchase and install microfluidic discovery devices, reveal
five-tier specimen records, tune a classifier over a synthetic cell population,
recover candidates, and assign useful fictional strains to culture chambers.

## Loop

1. Claim the field-study grant and install a Screening Chip.
2. Select a biome in the Field Atlas and run a pixel-art survey.
3. Reveal a deterministic specimen record and add it to the Cell Archive.
4. Open the Single-cell Scanner, tune growth/pigment thresholds, and recover a
   candidate from the synthetic dataset.
5. Reinvest in better devices, culture chambers, research, and new field sites.

The game includes Freshwater, Lake Shelf, Moist Sand, Saltwater Coast, Garden Soil,
Forest Soil, Wetlands, Thermal Springs, and Night Tide. Their pools, costs, durations,
environmental preferences, and rarity weighting are materially different. Species use
real genus names where useful (including Arthrospira, Chlorella, Nannochloropsis,
Tetraselmis, Pavlova, and Isochrysis), alongside explicitly fictional game strains.

## Persistence and simulation boundary

Progress is stored locally under the versioned `orr-cyanoflow-v1` key. Saves include a
world seed, equipment, discoveries, reactor timestamps, settings, and event state.
Offline production is timestamp-based, capped at eight hours, and settled before a
save so reloading cannot duplicate a return batch. Invalid saves are rejected without
overwriting the raw record; v1/v2 Rack Run saves can be migrated into a fresh Cyanoflow
laboratory.

All species values, rarity odds, growth traits, device behavior, reactor economics,
events, illustrations, and audio are fictional game mechanics. The experience does
not identify organisms, control hardware, or provide a real cultivation protocol.

## Local run

From the repository root:

```powershell
npm run build:game
node tools/static-server.mjs
```

Open <http://127.0.0.1:8876/game/>. The deployment is static and self-contained; it
does not require a database, API key, backend, CDN, external image, or audio request.
The build writes a content-hashed ESM bundle to `game/dist/` and updates
`game/index.html`.

## Checks

```powershell
node tools/test_biorealm_engine.mjs
npm run test:game
py -3.12 -m unittest tools.test_design_system tools.test_seo
```

With the preview server running, the active route smoke test is:

```powershell
node C:/Users/Cameron/.claude/skills/browser-automation/browser.mjs http://127.0.0.1:8876/game/ --script tools/qa_cyanoflow.mjs
```

The browser check covers a fresh grant, device purchase and installation, a
Freshwater expedition, a deterministic reveal, archive persistence, classifier
thresholds, candidate recovery, reactor rendering, zero essential
request/console failures, and 390px overflow.
The optional `?qa=1` URL only exposes an in-memory test clock button to avoid a
30-second browser wait; it is not shown during normal play.
