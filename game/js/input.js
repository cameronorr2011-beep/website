export function createInput(canvas, sim) {
  const keys = {};
  const R = 56, DEAD = 5;
  let joyId = null, joyOx = 0, joyOy = 0;

  addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
  });
  addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

  /* Stuck-key guard: alt-tab or losing focus must not leave the cell swimming. */
  addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
    sim.joy.x = 0; sim.joy.y = 0;
  });

  canvas.addEventListener("pointerdown", (e) => {
    if (joyId !== null) return;
    joyId = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    joyOx = e.clientX; joyOy = e.clientY;
    applyJoy(e.clientX - joyOx, e.clientY - joyOy);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerId !== joyId) return;
    let dx = e.clientX - joyOx, dy = e.clientY - joyOy;
    const len = Math.hypot(dx, dy);
    /* Floating joystick: once the drag passes the ring, the anchor follows
       the finger so direction never saturates or flips. */
    if (len > R) {
      joyOx += dx * (1 - R / len);
      joyOy += dy * (1 - R / len);
      dx = e.clientX - joyOx; dy = e.clientY - joyOy;
    }
    applyJoy(dx, dy);
  });
  const end = (e) => {
    if (e.pointerId !== joyId) return;
    joyId = null; sim.joy.x = 0; sim.joy.y = 0;
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);

  function applyJoy(dx, dy) {
    const len = Math.hypot(dx, dy) || 1;
    if (len < DEAD) { sim.joy.x = 0; sim.joy.y = 0; return; }
    const k = Math.min(1, (len - DEAD) / (R - DEAD));
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
