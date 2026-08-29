export function createInput(canvas, sim) {
  const keys = {};
  let joyId = null, joyOx = 0, joyOy = 0;

  addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
  });
  addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

  canvas.addEventListener("pointerdown", (e) => {
    if (joyId !== null) return;
    joyId = e.pointerId; joyOx = e.clientX; joyOy = e.clientY;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerId !== joyId) return;
    applyJoy(e.clientX - joyOx, e.clientY - joyOy);
  });
  const end = (e) => {
    if (e.pointerId !== joyId) return;
    joyId = null; sim.joy.x = 0; sim.joy.y = 0;
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);

  function applyJoy(dx, dy) {
    const R = 52, len = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, len / R);
    sim.joy.x = (dx / len) * k;
    sim.joy.y = (dy / len) * k;
  }

  function poll() {
    if (joyId !== null) return;
    let dx = 0, dy = 0;
    if (keys.w || keys.arrowup) dy -= 1;
    if (keys.s || keys.arrowdown) dy += 1;
    if (keys.a || keys.arrowleft) dx -= 1;
    if (keys.d || keys.arrowright) dx += 1;
    if (dx || dy) {
      const l = Math.hypot(dx, dy);
      sim.joy.x = dx / l; sim.joy.y = dy / l;
    } else { sim.joy.x = 0; sim.joy.y = 0; }
  }

  return { poll };
}
