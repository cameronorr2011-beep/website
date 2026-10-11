// Rendering is independent from simulation time: no model values are interpolated.
export function scheduleRenderer(canvas, render, isRunning) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, dirty = true, id = 0, last = 0;
  function request() { dirty = true; if (visible && !document.hidden && !id) id = requestAnimationFrame(frame); }
  function frame(now) {
    id = 0;
    if (!visible || document.hidden) return;
    const continuous = !reduced.matches && isRunning();
    if (dirty || (continuous && now - last >= 33)) {
      dirty = false; last = now; render(now);
      canvas.dataset.renderFrames = String(Number(canvas.dataset.renderFrames || 0) + 1);
    }
    canvas.dataset.motionState = continuous ? 'running' : 'idle';
    if (continuous) id = requestAnimationFrame(frame);
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) request(); else { cancelAnimationFrame(id); id = 0; canvas.dataset.motionState = 'offscreen'; }
  }, {threshold: .01});
  observer.observe(canvas);
  const controller = new AbortController();
  const options = {signal: controller.signal};
  ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown'].forEach(event => canvas.addEventListener(event, request, options));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(id); id = 0; } else request(); }, options);
  reduced.addEventListener('change', request, options);
  return {request, destroy() { cancelAnimationFrame(id); observer.disconnect(); controller.abort(); }};
}
