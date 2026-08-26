/* Input: pointer drag (touch/mouse), wheel & pinch zoom, WASD, tap = set target */
export function createInput(canvas, getSim) {
  const keys = {};
  let pinchDist = 0;
  let dragging = false;

  addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
  });
  addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

  canvas.addEventListener("pointerdown", (e) => { dragging = true; moveTarget(e); });
  canvas.addEventListener("pointermove", (e) => { if (dragging) moveTarget(e); });
  addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const sim = getSim(); if (!sim) return;
    sim.view.zoom = clamp(sim.view.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.35, 2.2);
  }, { passive: false });

  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) pinchDist = tdist(e);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    const sim = getSim(); if (!sim) return;
    if (e.touches.length === 2) {
      const d = tdist(e);
      if (pinchDist) sim.view.zoom = clamp(sim.view.zoom * (d / pinchDist), 0.35, 2.2);
      pinchDist = d;
    }
  }, { passive: true });
  canvas.addEventListener("touchend", () => { pinchDist = 0; }, { passive: true });

  function tdist(e) { return Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }

  function moveTarget(e) {
    const sim = getSim(); if (!sim || sim.mode !== "micro") return;
    const v = sim.view;
    const wx = (e.clientX - v.w / 2) / v.zoom + v.x;
    const wy = (e.clientY - v.h / 2) / v.zoom + v.y;
    sim.setTarget(wx, wy);
  }

  function keyDir() {
    let dx = 0, dy = 0;
    if (keys["w"] || keys["arrowup"]) dy -= 1;
    if (keys["s"] || keys["arrowdown"]) dy += 1;
    if (keys["a"] || keys["arrowleft"]) dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;
    return { dx, dy };
  }

  function updateKeyboard(sim, dt) {
    const { dx, dy } = keyDir();
    if ((dx || dy) && sim && sim.mode === "micro") {
      const P = sim.state.player;
      sim.setTarget(P.x + dx * 200, P.y + dy * 200);
    }
  }
  function isDragging() { return dragging; }
  return { updateKeyboard, isDragging };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
