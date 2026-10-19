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
site, the simulation, BioRealm, or PaperTrail's deterministic offline demo.
PaperTrail's optional live mode is a separate server process and does require
server-side Groq configuration plus network access to PubMed/Crossref.

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

Open <http://127.0.0.1:8080/papertrail/> for the PaperTrail offline demo. It
works with the API process stopped, stores only a versioned browser snapshot,
and labels every source, finding, debate turn, and report as synthetic
demonstration data. Use **Configure API** inside PaperTrail only when a
separately started API process is available.

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

## PaperTrail architecture and live mode

PaperTrail deliberately has two deployment boundaries:

```text
browser / Hostinger public_html
  └─ /papertrail/  static HTML + scoped CSS + browser-local demo state
                    │ explicit CORS origin only
                    ▼
separate Node process (local or separately provisioned API host)
  └─ /api/papertrail/v1
       ├─ PubMed + Crossref retrieval
       ├─ server-side Groq inference and model verification
       ├─ bounded orchestration, retries, debate rounds, and citation audit
       └─ SQLite outside the public static root
```

The current Orr Biologicals Hostinger deployment is Git-to-static
`public_html`. It can serve `/papertrail/`, but it does **not** start Node
processes and cannot execute Route Handlers, SSE, SQLite, or request-time Groq
calls. Do not copy `server/papertrail/` into public hosting and assume it is
running. The existing `Dockerfile` is intentionally still the static-site
container.

### Start the optional local API

Run the static site and API as separate processes. The API defaults to
loopback-only `127.0.0.1:8788`, refuses a non-loopback bind without an explicit
`PAPERTRAIL_API_TOKEN`, and never accepts a Groq key from the browser.

PowerShell example:

```powershell
# Terminal 1
npm run server:static

# Terminal 2 — set only in the server process
$env:PAPERTRAIL_HOST = "127.0.0.1"
$env:PAPERTRAIL_PORT = "8788"
$env:PAPERTRAIL_ORIGIN = "http://127.0.0.1:8080"
$env:PAPERTRAIL_DB_PATH = "$HOME\.orr-biologicals\papertrail.sqlite"
$env:GROQ_API_KEY = "<server-side-key-not-committed>"
$env:GROQ_MODEL = "openai/gpt-oss-120b"
npm run server:papertrail
```

Then open `/papertrail/`, choose **Configure API**, and save
`http://127.0.0.1:8788`. The browser sends no credentials and stores only the
API URL plus a sanitized live-session snapshot. The API's `/health` and
`/models` routes expose safe status classifications, not keys.

The API process does not load `.env` automatically; set environment variables
in the process manager or shell. `.env.example` is a placeholder template only.
The default SQLite location is outside this repository. If a custom database
path is used, keep it outside `public_html`, add it to backups, and never commit
the file.

Each live worker owns a short SQLite lease and renews it while running. At API
startup, an expired `RUNNING` session is reconciled as an interrupted run
because its in-memory worker no longer exists; a fresh lease is left alone so a
second API process cannot interrupt an active worker. A cancellation-requested
session becomes `CANCELLED`; otherwise it becomes `PARTIAL`. The API appends a
`run_interrupted` event, marks unfinished agent rows interrupted/cancelled, and
preserves all sources, agent runs, events, claims, and reports already stored.
Terminal sessions cannot be rerun in place; start a new live investigation so
historical evidence and events are not mixed. The browser displays recovered
state as interrupted and does not present it as a completed report.

### Groq model configuration

PaperTrail does not assume that an OmniRush or Astra model is hosted by Groq.
The server defaults to the currently documented Groq identifier
`openai/gpt-oss-120b`, with `openai/gpt-oss-20b` as a lower-cost alternative.
The API verifies the configured identifier against Groq's authenticated
`GET /models` response before inference. A missing key, unavailable model,
rate limit, timeout, or provider error is surfaced as an honest unavailable or
partial state; it never becomes synthetic live evidence. Structured output
uses Groq JSON Schema where the verified model supports it, with a bounded
JSON-object/Zod fallback.

The exact model catalogue is account- and date-sensitive. Check the provider's
official documentation and the running API's `/api/papertrail/v1/models` result
before a live run:

- <https://console.groq.com/docs/models>
- <https://console.groq.com/docs/structured-outputs>
- <https://console.groq.com/docs/api-reference#models-list>

### Deployment boundary and limitations

The public static deployment is verified for the offline demo only. A real live
deployment requires a separately provisioned Node runtime such as Hostinger's
Managed Node/Web Apps product, a VPS, or another private API host. Put the API
behind an authenticated gateway, use a managed database or explicitly managed
persistent volume, configure the exact static-site origin, and do not expose a
loopback-development API directly to the internet. The current browser client
is intentionally a local API client; it has no remote-user authentication
flow. No production live backend deployment is claimed by this repository.

## PaperTrail verification commands

The deterministic test command is network-free:

```bash
npm test
npm run test:papertrail
python tools/test_papertrail.py
```

The focused PaperTrail checks cover provider normalization and deduplication,
empty/malformed/timeout/provider failures, SQLite persistence and reload,
citation auditing, Groq error boundaries through mocks, API body limits,
session locking, cancellation, restart reconciliation, CORS, SSE replay, and
the static UI contract.
No live provider or Groq request is part of the offline test command.

For the browser-level offline flow, start `npm run server:static` and use the
workspace-local browser QA runner described in the engineering notes. It checks
the four-role demo, evidence/debate/report views, export, reload recovery,
responsive overflow, console errors, and failed static requests.

## PaperTrail rollback

The pre-build rollback point is the local tag
`papertrail-prebuild-20261014` at the last pre-PaperTrail site commit. Review
`git status` before changing branches. For a disposable recovery worktree:

```bash
git worktree add ../orr-biologicals-papertrail-rollback papertrail-prebuild-20261014
```

For a shared branch, prefer a reviewed `git revert` of the PaperTrail milestone
commits rather than resetting a branch that others may have pulled. No
production deployment or destructive rollback is performed by the build.

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
