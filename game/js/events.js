const EVENTS = [
  { w: 3, msg: "⚠ Bacterial bloom — grazers incoming",        run: (s) => s.bloom(8) },
  { w: 2, msg: "⚠ Nutrient crash in your sector",             run: (s) => s.drain(16) },
  { w: 2, msg: "☀ Light spike — photosynthesis surge",        run: (s, S) => { S.energy += 25; } },
  { w: 2, msg: "🧫 Rapid bloom — free carbon nearby",          run: (s) => s.sprinkle("carbon", 60) },
  { w: 2, msg: "💨 Oxygen surge — the culture feels great",   run: (s) => s.heal(30) },
  { w: 2, msg: "🧬 Mutation! Your lineage shifts (+EP)",       run: (s, S) => { s.mutate(); S.ep += 4; } },
  { w: 2, msg: "🤝 Beneficial microbes arrive",                run: (s) => { for (let i=0;i<5;i++) {} s.beneficialWave(); } },
  { w: 1, msg: "☣ Contamination warning — check the Lab",      run: () => {} },
];

export function createEvents(S, sim, toastFn, firstIn = 35) {
  let timer = firstIn;
  function update(dt) {
    timer -= dt;
    if (timer <= 0) { timer = 32 + Math.random() * 34; fire(); }
  }
  function fire() {
    const total = EVENTS.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * total, ev = EVENTS[0];
    for (const e of EVENTS) { r -= e.w; if (r <= 0) { ev = e; break; } }
    ev.run(sim, S);
    toastFn(ev.msg);
  }
  return { update };
}
