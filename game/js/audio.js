const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

const CHORDS = [
  { root: 41, pad: [65, 69, 72, 76], scale: [65, 67, 69, 72, 74] },
  { root: 48, pad: [64, 67, 71, 74], scale: [64, 67, 69, 71, 74] },
  { root: 45, pad: [69, 72, 76, 79], scale: [69, 72, 74, 76, 79] },
  { root: 43, pad: [67, 71, 74, 78], scale: [67, 69, 71, 74, 76] },
];
const BAR = 7.5;

export function createAudio() {
  let ctx = null, master = null, musicBus = null, sfxBus = null;
  let musicOn = true, sfxOn = true, timer = null, nextBar = 0, chordIdx = 0;

  function ensure() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 6;
      comp.connect(ctx.destination);
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(comp);
      musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.5 : 0;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2100; lp.Q.value = 0.4;
      musicBus.connect(lp);
      const dly = ctx.createDelay(2); dly.delayTime.value = 0.52;
      const fb = ctx.createGain(); fb.gain.value = 0.36;
      const dlp = ctx.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = 1500;
      lp.connect(dly); dly.connect(dlp); dlp.connect(fb); fb.connect(dly);
      const wet = ctx.createGain(); wet.gain.value = 0.4; dly.connect(wet); wet.connect(master);
      lp.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 0.8 : 0; sfxBus.connect(master);
      startTexture();
      nextBar = ctx.currentTime + 0.1;
      timer = setInterval(schedule, 250);
      return true;
    } catch { return false; }
  }

  let noiseSrc = null;
  function startTexture() {
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3;
    }
    noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buf; noiseSrc.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = "lowpass"; nf.frequency.value = 320;
    const ng = ctx.createGain(); ng.gain.value = 0.05;
    noiseSrc.connect(nf); nf.connect(ng); ng.connect(musicBus);
    noiseSrc.start();
  }

  function schedule() {
    if (!ctx) return;
    while (nextBar < ctx.currentTime + 1.2) {
      playBar(nextBar, CHORDS[chordIdx % CHORDS.length]);
      chordIdx++;
      nextBar += BAR;
    }
  }

  function playBar(t0, ch) {
    for (const note of ch.pad) padVoice(t0, midiHz(note), BAR);
    bassVoice(t0, midiHz(ch.root - 12));
    const notes = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < notes; i++) {
      if (Math.random() < 0.45) continue;
      const when = t0 + Math.random() * BAR * 0.75;
      const n = ch.scale[Math.floor(Math.random() * ch.scale.length)] + (Math.random() < 0.3 ? 12 : 0);
      pluck(when, midiHz(n));
    }
  }

  function padVoice(t, hz, dur) {
    for (const det of [-4, 3]) {
      const o = ctx.createOscillator(); o.type = "triangle";
      o.frequency.value = hz; o.detune.value = det;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.028, t + dur * 0.35);
      g.gain.setValueAtTime(0.028, t + dur * 0.6);
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(musicBus);
      o.start(t); o.stop(t + dur + 0.1);
    }
  }

  function bassVoice(t, hz) {
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = hz;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.6);
    g.gain.setValueAtTime(0.09, t + BAR * 0.55);
    g.gain.linearRampToValueAtTime(0, t + BAR * 0.9);
    o.connect(g); g.connect(musicBus);
    o.start(t); o.stop(t + BAR);
  }

  function pluck(t, hz) {
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = hz;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    o.connect(g); g.connect(musicBus);
    o.start(t); o.stop(t + 3);
  }

  function tone(freq, dur, type, gain, sweepTo) {
    if (!ctx || !sfxOn) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.15, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  let combo = 0, comboT = 0;
  return {
    ensure,
    get ready() { return !!ctx; },
    get musicOn() { return musicOn; },
    setMusic(on) { musicOn = on; if (musicBus && ctx) musicBus.gain.linearRampToValueAtTime(on ? 0.5 : 0, ctx.currentTime + 0.4); },
    setSfx(on) { sfxOn = on; if (sfxBus) sfxBus.gain.value = on ? 0.8 : 0; },
    eat() {
      if (!ctx) return;
      const now = performance.now();
      combo = now - comboT < 900 ? Math.min(combo + 1, 14) : 0;
      comboT = now;
      tone(430 + combo * 46, 0.16, "triangle", 0.11);
    },
    divide() { tone(300, 0.3, "sine", 0.16, 190); tone(520, 0.22, "triangle", 0.08); },
    evolve() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.5, "sine", 0.13), i * 110)); },
    buy() { tone(700, 0.07, "square", 0.05); tone(1050, 0.1, "sine", 0.08); },
    deny() { tone(160, 0.14, "sawtooth", 0.05); },
    hurt() { tone(200, 0.25, "sawtooth", 0.1, 90); },
  };
}
