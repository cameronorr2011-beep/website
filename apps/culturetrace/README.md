# CultureTrace

CultureTrace is a local-first Electron and React workspace for inspecting
experiment datasets. It is designed for citizen scientists, hobbyists, and
laboratories working with culture measurements such as optical density, pH,
temperature, dissolved oxygen, light, and biomass.

## Implemented vertical slice

- RFC-4180-style CSV/TSV/semicolon parsing with quoted fields, BOM handling,
  row/column limits, source-row preservation, and safe diagnostics.
- Conservative column suggestions with explicit mapping and unit declarations.
- Deterministic validation for missing/invalid values, timestamp order and gaps,
  duplicate timestamps, constant series, negative values, robust outliers, and
  insufficient growth data.
- Descriptive statistics, ordinary least-squares trend summaries, and
  positive-only log-linear rate/doubling-time estimates.
- Versioned findings and evidence records. Findings point to stable observation
  IDs and source rows; outliers are never deleted.
- Bounded workflow stages, local project persistence, an accessible React UI,
  SVG time-series charts, and HTML/Markdown/JSON/CSV/PDF report exports.
- Optional Groq explanations through the Electron main process. Only a bounded
  deterministic summary is sent after the user explicitly requests an
  explanation. AI responses are schema-checked and cannot create deterministic
  findings or cite unknown evidence.
- A synthetic demonstration dataset that works offline.

This first release does **not** identify species, diagnose contamination,
prove causation, calibrate OD to biomass, or make claims about culture health.
The statistical thresholds are review rules and should be interpreted with
experimental context.

## Development

Requirements: Node.js 24.x and npm 11.x. From this directory:

```bash
npm install
npm test
npm run lint
npm run build:web
npm run dev
```

`npm run dev` starts the browser-compatible renderer at the Vite development
URL. The repository-level public-site build does not include this archival app or a
public `/culturetrace/` route. To
launch the packaged-style Electron shell locally:

```bash
npm run dev:electron
```

The shell loads the locally built renderer; it does not load remote application
content. `npm run build:web` writes a private browser build to the app's own
development output when needed. Electron packaging uses a separate `dist/`
build and the app is not linked from the public website.

## Packaging

```bash
npm run build:electron     # unpacked Electron directory
npm run package:win        # Windows NSIS installer and portable artifact
```

Packaging is platform-specific. macOS signing/notarization and Linux release
verification require their respective build environments and credentials. No
signing credentials are stored in this repository.

## Groq configuration

The Electron app uses `https://api.groq.com/openai/v1/chat/completions` from the
main process. The model defaults to `openai/gpt-oss-20b` and can be changed in
the main-process configuration later without exposing it to the renderer. A
user may enter their own key in desktop Settings. It is encrypted with
Electron `safeStorage`; if secure OS storage is unavailable, the key is not
stored. Browser mode intentionally does not accept keys.

The app does not make background AI requests. Provider errors, timeouts, rate
limits, invalid JSON, and invalid evidence references leave the deterministic
report intact.

## Storage and privacy

Desktop projects are stored under Electron's normal `userData` directory in an
atomic JSON state file. The original source file is never overwritten. Browser
preview state uses the current browser profile's local storage. There is no
telemetry in this release. The packaged app allows only a narrow typed preload
API, disables renderer Node integration, enables context isolation and sandbox
mode, blocks untrusted navigation, and restricts external links.

## Project map

```text
src/core/       CSV, mapping, deterministic analysis, findings, exports, AI schema
src/App.jsx     React workspace and user workflow
src/styles.css  CultureTrace visual system and responsive layout
electron/       secure main process and preload bridge
tests/          deterministic scientific and AI-boundary tests
assets/icons/   generated PNG, ICO, ICNS, and reproducible source artwork
scripts/        icon generation and syntax checks
```

## License and support

CultureTrace is part of the MIT-licensed Orr Biologicals website repository.
Report defects through the repository issue tracker or the support path linked
from <https://orrbiologicals.com/>. Do not include private datasets or API keys
in an issue.
