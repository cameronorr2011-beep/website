# Orr Biologicals design system — 2026 rebrand

Status: **neuroscience removal**, 2026-11-08. The editorial system is live
on the local `/`, `/algae/`, `/cyanoflow` and `/algaephyte/` pages. The
neuroscience and NeuroML surfaces were removed entirely: no pages, data,
styles, imagery or links remain, and the homepage hero now leads with algae.
The build emits 45 public pages and applies the shared header/footer to the
editable shell; `/game/` and `/algae-growth/` intentionally keep their
immersive shells. This document records what exists; it does not claim a
completed site-wide migration.

## Direction

The visual target is minimal biotechnology editorial, not a dark SaaS
dashboard: obsidian and near-black fields, warm paper ink, restrained
chlorophyll green and cyan, real biological evidence, and large serif/sans
contrasts. The page should look composed before it looks animated.

The reference is the restraint and editorial product framing of Neoplants, not
its layout, identity or assets.

## Tokens

The rebrand is scoped with `.home-rebrand` and `body.product-rebrand` in
`css/home-rebrand.css`. Shared palette and type tokens remain in
`css/global.css`; this layer does not create a second global token system.

The product pages keep their own layouts, canvases and inline instrument
scripts. They are migrated by remapping the shared variables they already
consume (`--void`, `--paper`, `--ink`, `--leaf`, `--ivory`) onto the `--hr-*`
tokens, plus explicit fixes for three legacy light surfaces that used those
variables as backgrounds. No markup contract changed, so the Cyanoflow
simulation and the Algaephyte console keep working.

| Token | Value | Use |
|---|---|---|
| `--hr-bg` | `#070a08` | Page field |
| `--hr-panel` | `#0c120d` | Specimen and proof panels |
| `--hr-ink` | `#f3f0e5` | Primary warm-white text |
| `--hr-soft` | `#b8c3b6` | Secondary copy |
| `--hr-mute` | `#839184` | Technical labels, limits |
| `--hr-line` | `rgba(222, 232, 215, .18)` | Structural rules |
| `--hr-green` | `#c6d9b0` | Editorial accent and live state |
| `--hr-cyan` | `#9fd8cc` | Verified / connected state |
| `--hr-gold` | `#e7be76` | Outgoing synapse mark |
| `--hr-coral` | `#dca08a` | Axon mark |

Type: Avenir Next / Segoe UI sans for display and interface, Iowan Old Style /
Baskerville serif for the italic display interruption and long-form voice, and
IBM Plex Mono / Cascadia Mono for source identifiers and technical labels.
Mono labels are used sparingly; body copy remains in the sans.

## Composition

- Hero: asymmetric editorial split. Algae culture scene on the right, large
  display type and a compact focus ledger on the left. The specimen panel is
  a framed record, not a decorative floating object.
- Homepage: two scales (cultivation, single cells), a proof section on
  provenance, a method chain of custody, selected journal notes, an
  open-by-design developer strip, voluntary support and a correspondence form.
- Division hubs: `/algae/` uses two product-scale cards.
- Shared rhythm: `clamp()` section padding, a 1360 px maximum measure, 1 px
  hairline rules, high contrast at display sizes and quieter technical labels.
- Mobile: the hero top padding is at least 96 px so the fixed header cannot
  cover the eyebrow; tables and two-column compositions collapse before text
  becomes crowded.

## Evidence as visual material

The hero specimen image is an illustrative algae culture scene. It carries no
measured claims: it is not microscopy of a studied sample, not a deployed
instrument and not a procedural scientific visualization. The caption says so
in the
page, not only in a hidden caption.

Copy follows the same separation as the data:

- measured records are called measured;
- dataset classifier labels are called annotations;
- missing values render as `DATA UNAVAILABLE`, never as an estimate;
- predictions, when they exist, remain a separate layer;
- the fly connectome is described as an integration still pending, with no fly
  totals quoted.

## Implementation

| File | Role |
|---|---|
| `sections/head.html` | Broad research metadata and organisation schema |
| `sections/header.html` | Algae, Research, Journal, Literature, Developers, About, Contact |
| `sections/footer.html` | Research, records, support and legal links |
| `sections/home-body.html` | Homepage source partial |
| `algae/index.html` | Algae division hub |
| `css/home-rebrand.css` | Scoped tokens, components and responsive rules |
| `tools/site/design_system.py` | Shared shell/CSS injection, rebrand stylesheet routing and ambient-script suppression |
| `tools/site/build_seo.py` | Rebuilds homepage, shared shell and sitemap |
| `tools/site/build_research.py` | Emits the Algaephyte surface and its `product-rebrand` body class |
| `docs/rebrand/product-shot.mjs` | Product-page preview capture and 900/390 px layout facts |

`design_system.py` skips the decorative cell cursor and ambient
`biological-cinema.js` field on `.home-rebrand` pages. The ambient canvas remains
available on the legacy pages where it already existed.

## Verified

On 2026-11-05, against base commit `96008ac` with the rebrand uncommitted:

- `py -3.12 tools/site/build_seo.py`: 47 public pages, 42 canonical indexable
  sitemap URLs.
- `npm test`: 27 Python tests and the simulation, game and CultureTrace suites
  passed.
- `npm run qa`: 47 pages, 45 indexable, 42 sitemap URLs; no missing
  descriptions, orphan pages or duplicate titles.
- `docs/rebrand/qa-final.mjs`: 12/12 route × viewport checks returned HTTP 200,
  with no horizontal overflow, broken images, console errors or failed
  requests. Header clearance was positive at every tested page, including
  +25 px on the 390 px homepage and +13 px on the 768 px homepage.
- `docs/rebrand/qa-rebrand.mjs`: the full-page screenshot run completed the same
  12/12 combinations with 0 console errors and 0 failed requests.
- Screenshots: full-page captures for home, Algae, Neuroscience and NeuroML at
  1440×900, 768×1024 and 390×844, plus targeted top-of-page captures in
  `docs/rebrand/final/`.
- Second increment, 2026-11-07: `/cyanoflow` and `/algaephyte/` render on
  `rgb(7, 10, 8)` with `rgb(243, 240, 229)` ink, no console errors, no failed
  requests and no horizontal overflow at 900 px or 390 px. Both pages keep one
  header and one `main`, and their interactive canvases still mount
  (`algaephyteInstrumentCanvas`, `cyanoflowChipCanvas`).

## Known gaps

- The corporate rebrand is not site-wide. `/neuroML/`, `/blog/` and the
  remaining legacy pages still carry the earlier interface.
- No commit, push or deployment was performed. Production remains the verified
  `96008ac` site.
- The public NeuroML API is not implemented. `/neuroML/data/neuron.json` is a
  static published record, not a `/api/v1` service.
- The fruit-fly graph is not integrated and no fly totals are quoted.
- No ML experiment has been trained or validated; the synthetic arbor remains
  outside the neuron count and outside the verified-connectome layer.
