# Orr Biologicals Microflux: Rack Run

`/game/` is an active, local-first microfluidic algae clicker. Culture pulses
move through illustrated rack lanes and the player catches them as they enter a
collection gate.

## The game loop

1. Pick an unlocked rack map.
2. Watch the active lanes and click a culture pulse when it reaches the gate.
3. Catch several pulses in a row to build a combo multiplier.
4. Avoid red contaminants; a contaminant breaks the combo and costs credits.
5. Fill the batch meter for a large biomass/credit payout and a new device level.
6. Spend profit on modules that change how the active run feels.
7. Unlock new maps with different lane rules, target speeds, and target mixes.

The primary action is real Canvas hit testing: clicks outside the gate are early,
clicks on the gate can be good or perfect, missed blooms expire, and contaminants
are hazards. The keyboard-friendly **tend at the gate** button and `Space`/`E`
shortcut only catch a pulse that is currently inside the gate; they do not create
an unconditional payout.

## Maps and modules

- **Azure Basin** — three clear, steady lanes for learning the timing.
- **Amber Sandline** — branching channels and faster golden pulses.
- **Moss Soil** — four offset lanes with slower, more valuable blooms.
- **Moonlit Peat** — darker phases with rare luminous pulses.

The rack can be fitted with an Optical Gate, Pressure Regulator, Channel Splitter,
Dense Inoculum, Combo Stabilizer, and Auto Pipette. The first five alter active
play or active rewards; the Auto Pipette is intentionally small and only supports
away-time progress instead of replacing the clicker loop.

## Simulation boundary

Species, targets, maps, credits, biomass, combo rules, and device effects are
fictional game mechanics. They are not organism identification, a cultivation
protocol, a device specification, or a claim about real performance. The page is
marked `SYNTHETIC MODE` and stores only game state in browser storage.

## Run locally

From the repository root:

```powershell
npm run build:lab
python tools/site/serve_preview.py
```

Open <http://127.0.0.1:8876/game/>. The page uses the content-hashed bundle
generated at `game/dist/lab-*.js`; it does not require a database, API key, or
external runtime dependency.

## Checks

```powershell
python -m unittest discover -s tools -p 'test_*.py'
npm run test:lab
npm run test:simulation
npm run test:expedition
npm run test:server
```

With the preview server running, browser QA for the active route is:

```powershell
node C:/Users/Cameron/.claude/skills/browser-automation/browser.mjs http://127.0.0.1:8876/game/ --script tools/qa_rack_game.mjs
```

All generated targets and values remain synthetic. The independent deterministic
lab, simulation, provider, expedition, and optional backend modules are retained
for the broader site and continue to be checked separately.
