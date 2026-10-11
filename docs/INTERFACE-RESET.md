# Scientific interface reset — 2026-10-11

## Audit and decisions

Audited the live homepage and Cyanoflow in Chrome, the current origin/main repository, modular sources, styles, simulation code, canonical metadata, and hosting history. Existing homepage loaded 19 local stylesheets, competed with the article cream palette, placed the entire architecture essay in the primary narrative, and ran decorative canvases and numeric count-up animations. No motion dependency was installed; vanilla CSS, native details, IntersectionObserver and Web Animations suffice.

Shared identity: near-black forest instrument panels, pale neutral reading surfaces, dark green with restrained cyan for cell-level research. System sans fallback eliminates third-party font loading; serif is reserved for long reading. One token owner: `css/global.css`. Durations: 140 ms feedback, 240 ms state transition, 360 ms section reveal; movement 4–10 px. Content stays visible without JavaScript. Native cross-document view transitions progressively enhance route changes; unsupported browsers navigate normally. Reduced motion disables them.

`sections/header.html` and `sections/footer.html` are now active shared source components. `tools/site/design_system.py` applies them to all 62 public documents during the existing build. `css/orr-home.css` contains homepage, footer and shared editorial layouts, not a separate palette. Cyanoflow component styles were extracted from its inline style block to `css/cyanoflow.css`. Article duplicate token definitions were removed.

## Preserved content and behavior

- All existing public routes, canonical URLs, metadata, article prose, species content, research citations, daily literature data and SEO directories remain.
- Homepage: concise platform narrative, biological-scale SVG schematic explicitly labeled not measured microscopy, distinct platform discovery, original culture model, reading paths, origin statement, design notebook, research contact.
- The full architecture, diagrams, assumptions, safety qualifications, journal, calculator, faults and FAQ remain in the expandable notebook. All existing anchor URLs automatically open their containing details. Archival illustrative hardware images remain labeled as such.
- Culture model equations and output values are unchanged. Units are clearer, outputs are announced, assumptions are accessible, no scientific count-up is used. Canvas redraws briefly in response to actual inputs and pauses when idle/hidden/offscreen. Reduced motion retains a static illustration rather than hiding functionality.
- Tabs use click/keyboard selection, arrow/Home/End navigation, roving tabindex and linked tabpanel semantics; hover no longer changes scientific context.
- Calculator rejects invalid/empty/out-of-range inputs and calls its result an illustrative deficit, not a dosing instruction.
- Shared menu supports Escape, outside click, breakpoint reset, aria-expanded and aria-controls; active routes have aria-current.
- Existing contact mailto remains explicit: no message is sent by the website.
- Research lab maintains WebGL, Canvas fallback, optional device integration, expedition, synthetic workflows and saved state. Renderer scheduling is independent of model time, pauses offscreen/hidden, and redraws actual state under reduced motion. Static hashed build artifacts are committed as required by hosting.
- Standalone `/demo/` remains an immersive fictional expedition: its existing full-screen viewport/navigation contract is retained rather than crowding the game with a marketing header. Its shared shell is present but hidden in immersive mode.

## Actual verification

- Existing Python modular build succeeds and is byte-deterministic.
- 28 Python site/SEO/design tests pass. Navigation and H1 assertions were updated to the requested new information architecture; all content/metadata/preservation assertions retained.
- 9 Pi sensor tests pass.
- `npm run test:lab`, `test:expedition`, `test:server`, and `build:lab` pass. No TypeScript or lint command exists; browser source syntax checked with `node --check`.
- Browser all-route sweep: 62 public routes × 390/1280 px = 124 passing layouts; no horizontal overflow, missing script/style/image responses, or JS exceptions.
- Browser interaction suite: mobile menu/Escape, keyboard sliders, reset, calculator valid/invalid states, keyboard tabs, deep links, immediate model response, static reduced motion and stopped idle canvas pass.
- Both lab WebGL and Canvas renderers: reduced-motion frames stable, actual state changes redraw, offscreen frames stable.
- Full lab expedition workflow: hotspot scan → collection → Cyanoflow isolation → Algaephyte transfer → save/reload passes; lineage persists; no console/network errors.
- SEO inventory: 57 sitemap URLs, no missing descriptions, no HTML orphans, no duplicate titles or sitemap omissions.
- Existing article prose and JSON-LD compared against pre-redesign git version: unchanged.
- Desktop/mobile screenshots inspected. Field Core Web Vitals and real-device battery consumption are not measured; no numerical speedup claimed.

## Deployment

Repository hosting is Apache/Hostinger with a GitHub-linked sync described by earlier operations notes. GitHub Actions validates the site but does not itself deploy. Prior PR merges triggered hosting sync; branch pushes alone are not proof. Deployment must be checked on `https://orrbiologicals.com/` after merge, including the new H1, shared styles, platform routes, controls and zero browser errors. This document records local verification, not an unverified production success.
