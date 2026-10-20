(() => {
  const cultureCanvas = document.querySelector("#homeCultureCanvas");
  const chipCanvas = document.querySelector("#homeChipCanvas");
  if (!cultureCanvas && !chipCanvas) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const palette = {
    leaf: "#c8e89b",
    mint: "#8ed7bf",
    cyan: "#8bded4",
    ink: "#07120e",
    line: "rgba(201, 233, 177, .20)",
  };
  const fit = (canvas) => {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
  };
  const resize = () => {
    fit(cultureCanvas);
    fit(chipCanvas);
  };
  const drawGrid = (ctx, width, height, spacing = 34) => {
    ctx.strokeStyle = palette.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += spacing) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = 0; y <= height; y += spacing) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();
  };
  const curve = (ctx, points, color, width = 1.2, dash = []) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
    ctx.restore();
  };
  const drawCulture = (time = 0) => {
    const view = fit(cultureCanvas);
    if (!view) return;
    const { ctx, width, height } = view;
    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx, width, height, 34);
    const cx = width * .5;
    const cy = height * .56;
    const rx = Math.min(width * .28, 156);
    const ry = Math.min(height * .32, 142);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = "rgba(210, 240, 188, .72)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(142, 215, 191, .30)";
    ctx.beginPath(); ctx.ellipse(0, 0, rx * .7, ry * .86, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    const wave = [];
    for (let x = -30; x <= width + 30; x += 8) wave.push([x, height * .53 + Math.sin(x * .025 + time * .0012) * 13 + Math.sin(x * .067) * 5]);
    curve(ctx, wave, "rgba(200, 232, 155, .54)", 1.5, [3, 12]);
    const bubbles = 16;
    for (let i = 0; i < bubbles; i += 1) {
      const x = width * (.28 + ((i * 37) % 50) / 100);
      const y = height * (.28 + ((i * 17) % 50) / 100);
      const r = 2 + (i % 3);
      ctx.beginPath(); ctx.arc(x, y - ((time * .012 + i * 13) % 42), r, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 ? "rgba(200, 232, 155, .66)" : "rgba(142, 215, 191, .72)"; ctx.fill();
    }
    ctx.fillStyle = "rgba(237, 248, 219, .82)";
    ctx.font = "600 9px ui-monospace, SFMono-Regular, Consolas, monospace";
    ctx.fillText("CULTURE / A–01", 18, 24);
    ctx.fillStyle = "rgba(173, 207, 164, .72)";
    ctx.fillText("OPTICAL FIELD / SYNTHETIC", 18, height - 18);
  };
  const chipStages = {
    load: { label: "STAGE / LOADING", value: "One cell · one compartment", note: "Keeping identity visible before a candidate becomes a conclusion." },
    track: { label: "STAGE / TRACKING", value: "Frames · same cell", note: "A trajectory is useful only when identity survives each observation." },
    recover: { label: "STAGE / RECOVERY", value: "Candidate · still unvalidated", note: "Recovery and an independent assay remain separate questions." },
  };
  let chipStage = "load";
  const drawChip = (time = 0) => {
    const view = fit(chipCanvas);
    if (!view) return;
    const { ctx, width, height } = view;
    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx, width, height, 32);
    const left = width * .13;
    const right = width * .87;
    const y = height * .5;
    const lanes = [y - 74, y, y + 74];
    lanes.forEach((lane, index) => {
      curve(ctx, [[left, lane], [width * .33, lane], [width * .44, y], [width * .61, y], [width * .72, lane], [right, lane]], index === 1 ? "rgba(139, 222, 212, .82)" : "rgba(139, 222, 212, .34)", index === 1 ? 2 : 1, [4, 11]);
    });
    ctx.strokeStyle = "rgba(139, 222, 212, .55)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i += 1) {
      const x = width * (.18 + i * .105);
      ctx.beginPath(); ctx.roundRect(x, y - 18, 42, 36, 8); ctx.stroke();
    }
    const count = chipStage === "load" ? 4 : chipStage === "track" ? 7 : 3;
    for (let i = 0; i < count; i += 1) {
      const x = width * (.2 + ((i * 19) % 59) / 100);
      const lane = lanes[i % lanes.length];
      const drift = chipStage === "track" ? Math.sin(time * .001 + i) * 7 : 0;
      ctx.beginPath(); ctx.arc(x, lane + drift, chipStage === "recover" ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 && chipStage === "recover" ? palette.leaf : palette.cyan; ctx.fill();
    }
    ctx.fillStyle = "rgba(237, 248, 219, .82)";
    ctx.font = "600 9px ui-monospace, SFMono-Regular, Consolas, monospace";
    ctx.fillText("CHIP / C–02", 18, 24);
    ctx.fillStyle = "rgba(173, 207, 164, .72)";
    ctx.fillText("IDENTITY + TIME / SYNTHETIC", 18, height - 18);
  };
  const setChipStage = (stage) => {
    if (!chipStages[stage]) return;
    chipStage = stage;
    document.querySelectorAll("[data-home-chip]").forEach((button) => button.classList.toggle("is-active", button.dataset.homeChip === stage));
    const copy = chipStages[stage];
    const label = document.querySelector("[data-home-chip-label]");
    const value = document.querySelector("[data-home-chip-value]");
    const note = document.querySelector("[data-home-chip-note]");
    if (label) label.textContent = copy.label;
    if (value) value.textContent = copy.value;
    if (note) note.textContent = copy.note;
    drawChip(performance.now());
  };
  document.querySelectorAll("[data-home-chip]").forEach((button) => button.addEventListener("click", () => setChipStage(button.dataset.homeChip)));
  document.querySelector("[data-home-culture-inspect]")?.addEventListener("click", (event) => {
    event.currentTarget.textContent = event.currentTarget.dataset.inspected ? "Inspect field ↗" : "Field sampled · synthetic ↗";
    event.currentTarget.dataset.inspected = event.currentTarget.dataset.inspected ? "" : "true";
  });
  window.addEventListener("resize", resize, { passive: true });
  resize();
  setChipStage(chipStage);
  let frame = 0;
  const animate = (time) => {
    drawCulture(time); drawChip(time);
    if (!reduceMotion) frame = window.requestAnimationFrame(animate);
  };
  frame = window.requestAnimationFrame(animate);
  if (reduceMotion) window.cancelAnimationFrame(frame);
})();
