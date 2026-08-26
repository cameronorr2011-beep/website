/* Direct-control input: virtual joystick on pointer, WASD/arrows, pinch zoom */
export function createInput(canvas, getSim) {
  const keys = {};
  let joyId = null, joyOx = 0, joyOy = 0, pinch = 0;

  addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
  });
  addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

  canvas.addEventListener("pointerdown", (e) => {
    if (joyId !== null) return;
    joyId = e.pointerId; joyOx = e.clientX; joyOy = e.clientY;
  });
  canvas.addEventListener("pointermove", (e) => { if (e.pointerId === joyId) applyJoy(e.clientX - joyOx, e.clientY - joyOy); });
  const end = (e) => { if (e.pointerId === joyId) { joyId = null; getSim()?.setJoy(0, 0); } };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);

  canvas.addEventListener("touchstart", (e) => { if (e.touches.length === 2) pinch = td(e); }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    const sim = getSim(); if (!sim) return;
    if (e.touches.length === 2) {
      const d = td(e);
      if (pinch) sim.view.zoom = clamp(sim.view.zoom * (d / pinch), .4, 2.1);
      pinch = d;
    }
  }, { passive: true });
  canvas.addEventListener("touchend", () => { pinch = 0; }, { passive: true });

  function applyJoy(dx, dy) {
    const sim = getSim(); if (!sim) return;
    const R = 52, len = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, len / R);
    sim.setJoy((dx / len) * k, (dy / len) * k);
  }  function td(e) { return Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }

  function pollKeys(sim) {
    let dx = 0, dy = 0;
    if (keys.w || keys.arrowup) dy -= 1;
    if (keys.s || keys.arrowdown) dy += 1;
    if (keys.a || keys.arrowleft) dx -= 1;
    if (keys.d || keys.arrowright) dx += 1;
    if ((dx || dy) && !joyActive()) sim.setJoy(dx, dy);
    else if (!dx && !dy && !joyActive()) sim.setJoy(0, 0);
  }
  function joyActive() { return joyId !== null; }
  return { pollKeys };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
