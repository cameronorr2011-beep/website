# Orr Biologicals Microflux

`/game/` is a quiet, local-first microfluidic algae clicker. It is built around
one illustrated rack rather than a submarine or a crowded management dashboard:

- tend the glowing culture bloom for an immediate, low-pressure payout;
- let the rack earn credits, biomass, and completed cells while the tab is closed;
- tune the device to increase flow and open new maps;
- move the rack between Azure Basin water, Amber Sandline sand, Moss Soil, and
  Moonlit Peat;
- discover fictional algae species and choose which one rests in the active loop;
- brace the rack for a larger passive flow rate; and
- keep the study in local browser storage with no account or network service.

The visual field is drawn locally on a Canvas 2D surface. Each map changes the
ground treatment, rack palette, flow multiplier, and available culture notes.
The HTML surface keeps the interaction intentionally small: one main rack,
one resource strip, one culture ledger, and a compact map shelf.

## Simulation boundary

Species, values, maps, credits, biomass, growth rates, and away-time progress are
fictional game mechanics. They are not organism identification, a cultivation
protocol, a device specification, or a claim about real performance. The page
is marked `SYNTHETIC MODE` and stores only game state in the browser.

## Run locally

From the repository root:

```powershell
npm run build:lab
python tools/site/serve_preview.py
```

Open <http://127.0.0.1:8876/game/>. The page uses the content-hashed bundle
generated at `game/dist/lab-*.js`; it does not require a database, API key, or
external runtime dependency.

## Controls and progression

- Click **tend the bloom** (or press `Space` / `E`) for a small burst of credits.
- The culture advances passively and pays out when its cycle completes.
- **Tune device** improves flow and makes the next map available.
- Click a locked map to spend credits once the required device level is ready.
- Select an unlocked culture in the archive to change the active loop.
- **Brace rack** increases passive flow and the value of a tend.
- **Start over** clears this page's local Microflux save after confirmation.

## Checks

The active route's static contract and legacy synthetic engines can be checked
without a browser:

```powershell
python -m unittest discover -s tools -p 'test_*.py'
npm run test:lab
npm run test:simulation
npm run test:expedition
npm run test:server
```

With the preview server running, the current clicker flow can be checked with:

```powershell
node C:/Users/Cameron/.claude/skills/browser-automation/browser.mjs http://127.0.0.1:8876/game/ --script tools/qa_rack_game.mjs
```

That smoke path clears the local save, verifies the rack boots without submarine
copy, tends a culture, tunes the device, unlocks Amber Sandline, confirms the
new species appears, checks the device/map state, and asserts no mobile
horizontal overflow or console/request failures.

## Retained research models

The repository still contains the independent deterministic lab, simulation,
provider, expedition, and optional local backend modules used by the broader
site. They are not loaded by the active `/game/` clicker entry point, but their
existing tests remain part of the repository checks and their synthetic/hardware
boundaries should not be weakened when the game changes.
