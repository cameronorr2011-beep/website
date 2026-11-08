# Rebrand visual QA

`qa-rebrand.mjs` renders the homepage, Algae hub, Neuroscience hub and the
existing NeuroML page at 1440×900, 768×1024 and 390×844. It records the title, H1, navigation count,
horizontal overflow, broken images and the presence of the real-neuron specimen
before writing full-page screenshots into this directory.

```bash
cd website-repo
node tools/static-server.mjs
node C:/Users/Cameron/.claude/skills/browser-automation/browser.mjs \
  http://127.0.0.1:8080/ --script docs/rebrand/qa-rebrand.mjs
```

The screenshots are review artifacts, not evidence of scientific results.

## Final route check

`qa-final.mjs` checks home, Algae, Neuroscience and NeuroML at all three
viewports. It records status, H1 count, overflow, broken images, header
clearance and console/network failures, then writes targeted top-of-page
screenshots into `final/`.

```bash
cd website-repo
node tools/static-server.mjs
node C:/Users/Cameron/.claude/skills/browser-automation/browser.mjs \
  http://127.0.0.1:8080/ --script docs/rebrand/qa-final.mjs --timeout 180000
```

Last complete run on 2026-11-05: 12/12 combinations passed with no overflow,
broken images, console errors or failed requests. The full-page screenshot
runner (`qa-rebrand.mjs`) also completed 12/12 with no console or network
errors. `docs/DESIGN_SYSTEM.md` records the exact result and the remaining
legacy-page gaps.
