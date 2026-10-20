(() => {
  const root = document.querySelector(".algaephyte-page");
  if (!root) return;
  const controls = ["light", "mixing", "carbon"].map((name) => ({
    name,
    input: root.querySelector(`[data-control="${name}"]`),
    output: root.querySelector(`#${name}Output`),
  }));
  const fill = root.querySelector("#cultureFill");
  const announcement = root.querySelector("#chamberAnnounce");
  const clock = root.querySelector("[data-model-clock]");
  const state = root.querySelector("[data-chamber-state]");
  const readings = Object.fromEntries([...root.querySelectorAll("[data-reading]")].map((node) => [node.dataset.reading, node]));
  let hours = 0;
  const base = { light: 58, mixing: 66, carbon: 44 };
  const update = (announce = false) => {
    const values = Object.fromEntries(controls.map(({ name, input, output }) => {
      const value = Number(input?.value || base[name]);
      if (output) output.value = `${value}%`;
      if (output) output.textContent = `${value}%`;
      return [name, value];
    }));
    const signal = (values.light * .34 + values.mixing * .24 + values.carbon * .18) / 100;
    if (fill) {
      const height = 150 + signal * 105;
      fill.setAttribute("y", String(421 - height));
      fill.setAttribute("height", String(height));
    }
    root.style.setProperty("--ap-light-opacity", String(.3 + values.light / 180));
    root.style.setProperty("--ap-flow-speed", `${Math.max(1.1, 3 - values.mixing / 55)}s`);
    if (clock) clock.textContent = `T+${String(hours).padStart(2, "0")} h`;
    if (readings.temperature) readings.temperature.textContent = `${(23.1 + values.light * .017 + hours * .03).toFixed(1)} °C`;
    if (readings.ph) readings.ph.textContent = (8.95 + values.carbon * .004 - values.mixing * .001 + hours * .006).toFixed(2);
    if (readings.oxygen) readings.oxygen.textContent = `${Math.round(58 + values.mixing * .24 + values.light * .08)}%`;
    if (readings.density) readings.density.textContent = (0.34 + signal * .34 + hours * .004).toFixed(2);
    if (state) state.textContent = hours ? "PULSE REVIEW" : "OBSERVING";
    if (announce && announcement) announcement.textContent = hours ? `Synthetic pulse advanced to T+${hours} h · no live system connected.` : "Ready · showing the initial synthetic state.";
  };
  controls.forEach(({ input }) => input?.addEventListener("input", () => update(false)));
  root.querySelector("#pulseModel")?.addEventListener("click", () => { hours = (hours + 24) % 240; update(true); });
  root.querySelector("#resetModel")?.addEventListener("click", () => { hours = 0; controls.forEach(({ name, input }) => { if (input) input.value = base[name]; }); update(true); });
  update();
})();
