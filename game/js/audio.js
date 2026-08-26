export function createAudio() {
  let ctx = null, master = null, started = false, muted = false, combo = 0, comboT = null;
  function ensure() {
    if (started || muted) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    master = ctx.createGain(); master.gain.value = .14; master.connect(ctx.destination);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 56; o.type = "sine"; g.gain.value = .05;
    o.connect(g).connect(master); o.start();
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * .25;
    n.buffer = buf; n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 200;
    const ng = ctx.createGain(); ng.gain.value = .05;
    n.connect(f).connect(ng).connect(master); n.start();
    setInterval(() => { if (!muted && Math.random() < .4) blip(340 + Math.random() * 300, .1, .028, "sine"); }, 1100);
    started = true;
  }
  function blip(freq = 620, dur = .12, vol = .05, type = "triangle") {
    if (!started || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + .02);
  }
  function eat() {
    combo++; clearTimeout(comboT); comboT = setTimeout(() => combo = 0, 900);
    blip(480 + Math.min(combo, 12) * 42, .09, .04);
  }
  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : .14;
    return muted;
  }
  return { ensure, blip, eat, toggleMute, get muted() { return muted; } };
}
