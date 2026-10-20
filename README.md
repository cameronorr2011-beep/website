# Orr Biologicals

Orr Biologicals is a static, local-first research site about algae cultivation,
single-cell observation, and citizen-science tools. **Algaephyte** and
**Cyanoflow** are concept builds in development; the site does not claim
validated hardware performance, species identification, food safety, or a
finished product for sale.

The public experience is intentionally spacious, quiet, and image-led. The
homepage is assembled from authoritative partials and uses self-hosted,
illustrative research imagery; it does not depend on a video CDN, AI image
service, or external runtime. The Journal (`/blog/`) is the active source of
truth for research notes. The former `/applications/`, `/game/`, and
`/papertrail/` surfaces have been retired; legacy application URLs redirect to
the Journal through `.htaccess`.

## Requirements

- Node.js 24.x, pinned by `.nvmrc` and `package.json`
- npm 11.x (the repository records `npm@11.16.0`)
- Python 3.12+ for the deterministic static/SEO build
- Docker 24+ if you prefer the container workflow

No API key, database, cloud account, or hardware is required for the static
site, the simulation, or the research pages. Journal automation can use
`GROQ_API_KEY` in CI, but it is not needed for a local static build.

## Clean checkout: install, build, run

```bash
git clone https://github.com/cameronorr2011-beep/website.git
cd website
cp .env.example .env
npm ci
npm run build
npm run server:static
```

Open <http://127.0.0.1:8080/>. The static server is implemented with Node
built-ins in `tools/static-server.mjs`; it serves directory indexes and clean
`.html` routes without installing a web framework.

If Python is exposed as `python` rather than `python3`, run the equivalent
build steps directly. On Windows with multiple interpreters, use
`py -3.12 tools/site/build_seo.py` for the first step:

```bash
python tools/site/build_seo.py
npm run build:simulation
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
python -m unittest tools.test_design_system
```

## Docker

Build and run the same reproducible static site in a container:

```bash
docker build -t orr-biologicals .
docker run --rm -p 8080:8080 orr-biologicals
```

Open <http://127.0.0.1:8080/>. The `Dockerfile` installs the locked npm
dependencies, regenerates the SEO/static outputs, rebuilds the simulation
bundle, and then runs the built site on port 8080. No secrets are copied into
the image.

## Project map

```text
sections/                 authoritative homepage and shared shell partials
css/                      shared editorial interface and motion tokens
css/home-premium.css      homepage editorial redesign layer
js/                       shared navigation, disclosure, and page behaviors
algaephyte/               Algaephyte product brief and research notes
cyanoflow.html            Cyanoflow product brief and chip visualization
blog/                     Journal source of truth and generated article index
research/                 methodology hub
Simulation/               simplified Algal Digital Lab workspace
tools/site/               deterministic static/SEO assembly
tools/static-server.mjs   dependency-free local production-like server
Dockerfile                clean Linux build and run path
```
