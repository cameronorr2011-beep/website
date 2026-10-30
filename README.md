# Orr Biologicals

Orr Biologicals is a static, local-first research site about algae cultivation,
single-cell observation, and computational biology. **Algaephyte** and
**Cyanoflow** are concept builds in development; the site does not claim
validated hardware performance, species identification, food safety, or a
finished product for sale.

The public experience pairs forest green and sage with warm ivory reading
surfaces, plain-language introductions, and sculptural biological studies.
The homepage is assembled
from authoritative partials and combines self-hosted illustrative imagery with
a procedural Three.js Volvox, photobioreactor, cultivation-apparatus, and
microfluidic scenes. These scenes are scientific visualizations, not microscope
observations or measured telemetry. Procedural studio reflections make the
instrument materials visible; motion pauses offscreen and in hidden tabs.
Reduced-motion visitors get static scenes, and product models support arrow-key
inspection (Home resets the view). The Journal (`/blog/`) is the active source
of truth for research notes. The former `/applications/`, `/papertrail/`, and
`/culturetrace/` public surfaces have been retired. `/Simulation/` is the
canonical Algal Digital Lab workspace; `/game/` remains a separate no-index
Cyanoflow field-study experiment.

## Requirements

- Node.js 24.x, pinned by `.nvmrc` and `package.json`
- npm 11.x (the repository records `npm@11.16.0`)
- Python 3.12+ for the deterministic static/SEO build
- Docker 24+ if you prefer the container workflow

No API key, database, cloud account, or hardware is required for the static
site, the Digital Lab, the Cyanoflow game, or the research pages. Journal automation can use
`GROQ_API_KEY` in CI, but it is not needed for a local static build.

The historical CultureTrace Electron/React source remains under
`apps/culturetrace/` for archival/private development purposes only. It is not
built into the static site, has no public route, and is not linked from the
portfolio.

## Clean checkout: install, build, run

```bash
git clone https://github.com/cameronorr2011-beep/website.git
cd website
cp .env.example .env
npm ci
npm run build
npm run server:static
```

Run the static metadata/inventory QA with `npm run qa`. Browser-level route
checks use the repository's Playwright runner and `tools/site/qa_redesign.mjs`.

Open <http://127.0.0.1:8080/>. The static server is implemented with Node
built-ins in `tools/static-server.mjs`; it serves directory indexes and clean
`.html` routes without installing a web framework.

If Python is exposed as `python` rather than `python3`, run the equivalent
build steps directly. On Windows with multiple interpreters, use
`py -3.12 tools/site/build_seo.py` for the first step:

```bash
python tools/site/build_seo.py
npm run build:simulation
npm run build:game
node tools/static-server.mjs
```

## One test command

```bash
npm test
```

This runs the standard-library public-site regression suite. The suite checks
generated metadata, internal links, retired application routes, shared
navigation, and scientific disclosures.

Useful focused checks:

```bash
npm run test:simulation
npm run test:game
npm run test:culturetrace
npm run build:culturetrace
# Windows installer, when Electron packaging dependencies are available:
npm run package:culturetrace
py -3.12 -m unittest tools.test_design_system tools.test_seo
```

The public long-form routes use `css/site-redesign.css` as a shared dark
research-dossier layer. Platform workspaces keep their own instrument palettes,
while journal, methodology, education, legal and archive pages share the same
navigation, typography, evidence-status treatment and responsive reading
surface.

## Docker

Build and run the same reproducible static site in a container:

```bash
docker build -t orr-biologicals .
docker run --rm -p 8080:8080 orr-biologicals
```

Open <http://127.0.0.1:8080/>. The `Dockerfile` installs the locked npm
dependencies, regenerates the SEO/static outputs, rebuilds the Digital Lab and
Cyanoflow bundles, and then runs the built site on port 8080. No secrets are copied into
the image.

## Project map

```text
sections/                 authoritative homepage and shared shell partials
css/                      shared editorial interface and motion tokens
css/home-premium.css      retained homepage editorial layer
css/biological-cinema.css homepage biological-cinema layer
css/site-redesign.css     dark research-dossier layer for public reading routes
js/                       shared navigation, disclosure, cursor, and scene behaviors
algaephyte/               Algaephyte product brief and research notes
cyanoflow.html            Cyanoflow product brief and chip visualization
blog/                     Journal source of truth and generated article index
research/                 methodology hub
Simulation/              Algal Digital Lab and preserved deterministic engine
game/                     Cyanoflow local-first pixel-art research game
algae-growth/             standalone pixel-art algae growth field guide
apps/culturetrace/        archived private React/Electron experiment source
js/biological-cinema.mjs  procedural Three.js scene source and asset fallback
tools/build_cinema.mjs    reproducible scene bundle build
tools/build_simulation.mjs reproducible Digital Lab bundle build
tools/site/               deterministic static/SEO assembly
tools/static-server.mjs   dependency-free local production-like server
tools/export_algae_growth.mjs  standalone HTML + MP4 export helper
Dockerfile                clean Linux build and run path
```

The interactive algae growth field guide runs at `/algae-growth/` and can be
exported to the Windows Downloads folder with `node
tools/export_algae_growth.mjs`. See `algae-growth/README.md` for the scientific
accuracy note and offline export details.
