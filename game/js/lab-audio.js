/* Small opt-in ambient bed. It uses Web Audio primitives so /game/ has no
 * external audio asset, autoplay violation, or third-party media dependency. */
export function createLabAudio() {
  let context = null;
  let master = null;
  let running = false;
  let nodes = [];

  function start() {
    if (!context) {
      context = new AudioContext();
      master = context.createGain(); master.gain.value = .035; master.connect(context.destination);
      const compressor = context.createDynamicsCompressor(); compressor.threshold.value = -28; compressor.ratio.value = 5; compressor.connect(master);
      const tones = [55, 82.41, 110, 146.83];
      tones.forEach((frequency, index) => {
        const oscillator = context.createOscillator(); const gain = context.createGain();
        oscillator.type = index % 2 ? "sine" : "triangle"; oscillator.frequency.value = frequency;
        gain.gain.value = index === 0 ? .18 : .055; oscillator.connect(gain); gain.connect(compressor); oscillator.start(); nodes.push(oscillator, gain);
      });
      const lfo = context.createOscillator(); const lfoGain = context.createGain(); lfo.frequency.value = .035; lfoGain.gain.value = .018;
      lfo.connect(lfoGain); lfoGain.connect(master.gain); lfo.start(); nodes.push(lfo, lfoGain);
    }
    if (context.state === "suspended") context.resume();
    running = true; master.gain.setTargetAtTime(.035, context.currentTime, .45);
    return running;
  }
  function stop() {
    if (!context) return false;
    running = false; master.gain.setTargetAtTime(0, context.currentTime, .25); return running;
  }
  function toggle() { return running ? stop() : start(); }
  function isRunning() { return running; }
  function destroy() { nodes.forEach((node) => node.stop?.()); context?.close(); nodes = []; context = null; master = null; running = false; }
  return { start, stop, toggle, isRunning, destroy };
}
