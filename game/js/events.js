/* Random events — every event asks for a decision, none just subtract numbers blindly. */
const EVENTS = [
  { id: "bloom",   w: 3, msg: "⚠ Bacterial bloom — grazers incoming", run: (sim) => sim.addBacteriaBloom(10) },
  { id: "crash",   w: 2, msg: "⚠ Nutrient crash in your sector",      run: (sim) => sim.drainEnergy(18) },
  { id: "spike",   w: 2, msg: "☀ Light spike — photosynthesis surge", run: () => {} , note: "energy flows faster for a while" },
  { id: "temp",    w: 2, msg: "🌡 Temperature drift in the vessel",   run: () => {} , note: "check the Laboratory" },
  { id: "contam",  w: 1, msg: "☣ Contamination warning — pH drifting",run: () => {}, note: "raise alkalinity in the Lab" },
  { id: "algaebloom", w: 2, msg: "🧫 Rapid bloom — free carbon nearby", run: (sim) => sim.sprinkle("carbon", 70) },
  { id: "oxygen",  w: 2, msg: "💨 Oxygen surge — cells feel great",   run: (sim) => sim.healAll(30) },
  { id: "mutant",  w: 2, msg: "🧬 Mutation! Your lineage shifts hue (+EP)", run: (sim, S) => { sim.mutateHue(); S.ep += 4; } },
  { id: "newbug",  w: 2, msg: "🔬 New bacterial species detected",    run: (sim) => sim.addBacteriaBloom(4) },
  { id: "friends", w: 2, msg: "🤝 Beneficial microbes arrive",        run: (sim) => sim.addBeneficial(6) },
];

export function createEvents(S, sim, toastFn, nextIn = 40) {
  let timer = nextIn;
  let spikeT = 0;
  function update(dt) {
    timer -= dt;
    if (spikeT > 0) { spikeT -= dt; S.energy += dt * 3; }
    if (timer <= 0) {
      timer = 35 + Math.random() * 35;
      fire();
    }
  }
  function fire() {
    const total = EVENTS.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * total;
    let ev = EVENTS[0];
    for (const e of EVENTS) { r -= e.w; if (r <= 0) { ev = e; break; } }
    ev.run(sim, S);
    if (ev.id === "spike") spikeT = 14;
    toastFn(ev.msg);
  }
  return { update };
}
