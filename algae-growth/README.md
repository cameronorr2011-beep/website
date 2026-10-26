# Algae Growth — Pixel Field Guide

An interactive, local-first pixel-art lesson for Orr Biologicals. It follows a
small microalgal inoculum through photosynthesis, nutrient assimilation,
cellular growth, division, population growth, environmental limitation, and a
photobioreactor-scale culture view.

## Run locally

From the repository root:

```powershell
node tools/static-server.mjs
```

Open `http://127.0.0.1:8080/algae-growth/` in a browser. The animation is
implemented with the browser's native Canvas 2D API. No account, API key,
runtime service, or image CDN is required.

## Edit the experience

- `index.html` — semantic layout, accessible text, controls, and scene copy.
- `growth.css` — responsive dark scientific interface and pixel-art presentation.
- `growth.js` — scene system, procedural pixel rendering, illustrative population
  model, controls, condition response, graph, and browser-native narration.

The seven scenes are represented by the `scenes` array in `growth.js`. The
renderer is intentionally procedural so the project remains lightweight and
editable without a binary art pipeline. The `cellSeeds` and `particles` arrays
provide deterministic sprite placement and ambient motion.

## Export

The repository includes a dependency-light export script:

```powershell
node tools/export_algae_growth.mjs
```

The script resolves the real Windows Downloads folder through the Windows Shell
known-folder API, creates an offline standalone HTML file with CSS and
JavaScript inlined, and captures an MP4 preview when the installed Playwright
Chromium and FFmpeg tools are available. It also writes the source bundle to
`algae-growth/dist/`.

Expected deliverables:

- `Downloads/Orr-Biologicals-Algae-Growth.html`
- `Downloads/Orr-Biologicals-Algae-Growth.mp4` (when browser video capture is available)
- `Downloads/Orr-Biologicals-Algae-Growth-Voiceover.wav` (Windows Speech narration source)
- `Downloads/Orr-Biologicals-Algae-Growth/` (editable source bundle plus README)
- `algae-growth/dist/orr-biologicals-algae-growth.html`
- `algae-growth/dist/orr-biologicals-algae-growth.mp4` (when video capture is available)

## Dependencies and licenses

Core runtime: browser-native HTML, CSS, Canvas 2D, and JavaScript. The core
animation has no production runtime dependency. The optional export tool uses
the repository's existing `playwright` package and the locally installed
FFmpeg executable; neither is needed to run the interactive page. Existing
repository dependencies and their licenses remain governed by the repository
`package-lock.json` and package metadata. New source files are covered by the
project's MIT license.

## Scientific accuracy note

The experience distinguishes photosynthesis, nutrient assimilation, cellular
growth, and reproduction. It explains that light supplies energy while carbon,
water, and nutrients contribute to cellular material. It also shows why more
light or more nutrients are not automatically better: excessive irradiance,
temperature outside a suitable range, nutrient imbalance, and carbon limitation
can inhibit net growth.

The visual cell is a generalized illustrative microalgal cell. The division
sequence is not intended to represent every lineage; species such as
*Arthrospira*, *Chlorella*, *Pavlova*, and *Isochrysis* differ in morphology,
physiology, pigments, life cycle, and preferred conditions. Population counts,
growth curves, biomass labels, pH, and dissolved-oxygen readouts are
illustrative teaching signals, not experimentally validated predictions or
process guarantees. A calibrated species- and reactor-specific model would be
required for quantitative use.

## Voiceover

The **Voiceover** control uses the browser's native speech synthesis when it is
available. The exported MP4 includes a local Windows Speech narration track, so
the video itself has spoken narration without requiring an account, cloud API,
or network connection. Browser engines that do not expose speech synthesis show
an explicit unavailable state rather than failing silently.
