/* WebAudio: calm biological ambience synthesized — no assets needed.
   Starts on first user gesture; mute toggle persists in save. */
export function createAudio() {
  let ctx = null, master = null, started = false, muted = false;
  let bubbleTimer = null;

  function ensure() {
    if (started || muted) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
    // low drone
    const o1 = ctx.createOscillator(), g1 = ctx.createGain();
    o1.frequency.value = 58; o1.type = "sine"; g1.gain.value = 0.05;
    o1.connect(g1).connect(master); o1.start();
    // filtered noise "water"
    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.25;
    const noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass"; filt.frequency.value = 220; filt.Q.value = 0.6;
    const gN = ctx.createGain(); gN.gain.value = 0.05;
    noise.connect(filt).connect(gN).connect(master); noise.start();
    started = true;
    bubbleTimer = setInterval(() => { if (!muted && Math.random() < 0.5) bubble(); }, 900);
  }
  function bubble() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(320 + Math.random() * 380, t);
    o.frequency.exponentialRampToValueAtTime(720 + Math.random() * 500, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.16);
  }
  function blip(freq = 620, dur = 0.12, vol = 0.06) {
    if (!started || muted || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.16;
    return muted;
  }
  return { ensure, blip, bubble, toggleMute, get muted() { return muted; } };
}
