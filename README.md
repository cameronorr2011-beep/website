# Orr Biologicals

Orr Biologicals is a static, local-first research site about algae cultivation,
single-cell observation, and citizen-science tools. **Algaephyte** and
**Cyanoflow** are concept builds in development; the site does not claim
validated hardware performance, species identification, food safety, or a
finished product for sale.

The public experience is intentionally dark, quiet, and readable. The homepage
uses a self-hosted looping culture-flow render; it does not depend on a video
CDN, AI image service, or external runtime. The Journal (`/blog/`) is the
active source of truth for research notes. The former `/applications/` silo has
been retired; old application URLs redirect to the Journal through `.htaccess`.

## Requirements

- Node.js 24.x, pinned by `.nvmrc` and `package.json`
- npm 11.x (the repository records `npm@11.16.0`)
- Python 3.12+ for the deterministic static/SEO build
- Docker 24+ if you prefer the container workflow

No API key, database, cloud account, or hardware is required for the static
site, the simulation, or BioRealm.

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
build steps directly:

```bash
python tools/site/build_seo.py
npm run build:lab
npm run build:simulation
node tools/static-server.mjs
```

## One test command

```bash
npm test
```

This runs the standard-library public-site regression suite and the deterministic
BioRealm engine test. The suite checks generated metadata, internal links,
retired application routes, shared navigation, scientific disclosures, and
the local game persistence boundary.

Useful focused checks:

```bash
npm run test:lab
npm run test:simulation
npm run test:expedition
npm run test:server
node tools/test_biorealm_atmosphere.mjs
```

## Docker

Build and run the same reproducible static site in a container:

```bash
docker build -t orr-biologicals .
docker run --rm -p 8080:8080 orr-biologicals
```

Open <http://127.0.0.1:8080/>. The `Dockerfile` installs the locked npm
dependencies, regenerates the SEO/static outputs, rebuilds the lab bundles, and
then runs the built site on port 8080. No secrets are copied into the image.

## Project map

```text
sections/                 authoritative homepage and shared shell partials
css/                      shared dark editorial interface and motion tokens
js/culture-cascade.js     deterministic looping hero culture-flow render
algaephyte/               Algaephyte product brief and research notes
cyanoflow.html            Cyanoflow product brief and chip visualization
blog/                     Journal source of truth and generated article index
research/                 methodology hub
Simulation/               simplified Algal Digital Lab workspace
game/                     two-primary-screen BioRealm cultivation game
tools/site/               deterministic static/SEO assembly
tools/static-server.mjs   dependency-free local production-like server
server/                   optional loopback development persistence API
Dockerfile                clean Linux build and run path
```
