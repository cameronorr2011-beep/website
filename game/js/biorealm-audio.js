/*
 * BioRealm's small generative score.
 *
 * There are no audio files to load and no context is created until start() is
 * called from a user gesture.  The compositions are intentionally modest:
 * two or three voices, a filtered environmental bed, and a single look-ahead
 * scheduler keep the room alive without turning a tab into a synthesizer farm.
 */

const TAU = Math.PI * 2;
const DEFAULT_BIOME = "lab";
const BIOME_IDS = new Set([
  "lab", "freshwater", "lakes", "moist-sand", "coastal", "soil",
  "forest-soil", "wetlands", "thermal", "night-tide",
]);

const profiles = {
  lab: {
    tempo: 58, wave: "triangle", bass: "sine", filter: "lowpass", cutoff: 860,
    noise: "lowpass", noiseCutoff: 280, noiseQ: .35, texture: .024,
    scale: [0, 2, 3, 7, 9], chords: [[0, 3, 7, 10], [5, 9, 12, 16], [3, 7, 10, 14], [7, 10, 14, 17]],
    roots: [41, 46, 48, 43], motif: [0, 2, 4, 1, 3], sway: .14,
  },
  freshwater: {
    tempo: 64, wave: "sine", bass: "triangle", filter: "lowpass", cutoff: 1240,
    noise: "bandpass", noiseCutoff: 490, noiseQ: .6, texture: .026,
    scale: [0, 2, 4, 7, 9, 11], chords: [[0, 4, 7, 11], [2, 5, 9, 12], [4, 7, 11, 14], [0, 3, 7, 10]],
    roots: [38, 43, 45, 40], motif: [0, 3, 5, 2, 4, 1], sway: .2,
  },
  lakes: {
    tempo: 52, wave: "triangle", bass: "sine", filter: "lowpass", cutoff: 680,
    noise: "lowpass", noiseCutoff: 170, noiseQ: .4, texture: .03,
    scale: [0, 2, 5, 7, 9], chords: [[0, 5, 9], [2, 7, 12], [5, 9, 14], [0, 4, 9]],
    roots: [36, 41, 43, 38], motif: [0, 1, 3, 2], sway: .1,
  },
  "moist-sand": {
    tempo: 76, wave: "sine", bass: "triangle", filter: "bandpass", cutoff: 1750,
    noise: "highpass", noiseCutoff: 780, noiseQ: .25, texture: .017,
    scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [2, 5, 9], [4, 7, 11], [7, 9, 14]],
    roots: [43, 48, 50, 45], motif: [0, 2, 4, 2, 1, 3, 4], sway: .24,
  },
  coastal: {
    tempo: 60, wave: "sine", bass: "sine", filter: "lowpass", cutoff: 1120,
    noise: "bandpass", noiseCutoff: 360, noiseQ: .8, texture: .035,
    scale: [0, 2, 5, 7, 10], chords: [[0, 5, 7, 12], [2, 7, 10, 14], [5, 10, 12, 17], [0, 4, 7, 11]],
    roots: [40, 45, 47, 42], motif: [0, 1, 4, 3, 2], sway: .3,
  },
  soil: {
    tempo: 48, wave: "triangle", bass: "sine", filter: "lowpass", cutoff: 520,
    noise: "lowpass", noiseCutoff: 110, noiseQ: .3, texture: .034,
    scale: [0, 3, 5, 7, 10], chords: [[0, 3, 7], [3, 7, 10], [5, 10, 12], [0, 5, 7]],
    roots: [34, 39, 41, 36], motif: [0, 2, 1, 3], sway: .08,
  },
  "forest-soil": {
    tempo: 57, wave: "sine", bass: "triangle", filter: "lowpass", cutoff: 980,
    noise: "bandpass", noiseCutoff: 250, noiseQ: .45, texture: .025,
    scale: [0, 2, 4, 7, 9], chords: [[0, 4, 9], [2, 7, 11], [4, 9, 14], [7, 11, 16]],
    roots: [39, 44, 46, 41], motif: [0, 3, 1, 4, 2], sway: .18,
  },
  wetlands: {
    tempo: 66, wave: "triangle", bass: "sine", filter: "lowpass", cutoff: 1460,
    noise: "bandpass", noiseCutoff: 410, noiseQ: .7, texture: .031,
    scale: [0, 2, 3, 7, 8, 10], chords: [[0, 3, 7], [2, 7, 10], [3, 8, 12], [0, 5, 10]],
    roots: [37, 42, 44, 39], motif: [1, 4, 2, 3, 0], sway: .26,
  },
  thermal: {
    tempo: 82, wave: "sawtooth", bass: "triangle", filter: "lowpass", cutoff: 1860,
    noise: "bandpass", noiseCutoff: 690, noiseQ: 1.2, texture: .021,
    scale: [0, 1, 4, 6, 8, 11], chords: [[0, 1, 6, 8], [4, 6, 11, 13], [1, 6, 8, 12], [0, 4, 8, 11]],
    roots: [40, 42, 45, 38], motif: [0, 3, 1, 4, 2, 5], sway: .35,
  },
  "night-tide": {
    tempo: 44, wave: "sine", bass: "sine", filter: "lowpass", cutoff: 740,
    noise: "bandpass", noiseCutoff: 190, noiseQ: .55, texture: .027,
    scale: [0, 2, 4, 7, 11], chords: [[0, 4, 11], [2, 7, 14], [4, 9, 16], [0, 7, 12]],
    roots: [35, 40, 42, 37], motif: [4, 2, 0, 3, 1], sway: .12,
  },
};

const midiHz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const safeBiome = (id) => BIOME_IDS.has(id) ? id : DEFAULT_BIOME;

function seeded(text) {
  let value = 2166136261;
  for (const char of String(text)) { value ^= char.charCodeAt(0); value = Math.imul(value, 16777619); }
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function setParam(param, value, time, duration = 0) {
  if (!param) return;
  try {
    if (duration > 0 && param.setTargetAtTime) param.setTargetAtTime(value, time, duration / 3);
    else if (param.setValueAtTime) param.setValueAtTime(value, time);
    else param.value = value;
  } catch { try { param.value = value; } catch { /* unsupported fake AudioParam */ } }
}

function rampParam(param, value, time, duration) {
  if (!param) return;
  try {
    if (param.cancelScheduledValues) param.cancelScheduledValues(time);
    if (param.setValueAtTime) param.setValueAtTime(param.value || 0, time);
    if (param.linearRampToValueAtTime) param.linearRampToValueAtTime(value, time + duration);
    else param.value = value;
  } catch { try { param.value = value; } catch { /* unsupported fake AudioParam */ } }
}

function disconnect(nodes) {
  for (const node of nodes) { try { node.disconnect?.(); } catch { /* already disconnected */ } }
}

function createAmbientAudio() {
  let context = null;
  let master = null;
  let musicBus = null;
  let musicLayers = new Map();
  let activeMusicLayer = null;
  let sfxBus = null;
  let compressor = null;
  let scheduler = null;
  let environment = null;
  let environments = new Set();
  let activeBiome = DEFAULT_BIOME;
  let nextBar = 0;
  let barIndex = 0;
  let running = false;
  let destroyed = false;
  let musicEnabled = true;
  let sfxEnabled = true;
  let musicVolume = .42;
  let sfxVolume = .72;
  let muted = false;
  let voices = new Set();
  let peakVoices = 0;
  let scheduledBars = 0;
  let transitions = 0;
  let sfxCount = 0;
  let requestSerial = 0;

  function resolveAudioContext() {
    if (typeof window !== "undefined") return window.AudioContext || window.webkitAudioContext;
    return globalThis.AudioContext || globalThis.webkitAudioContext;
  }

  function makeNoiseBuffer(id) {
    const length = Math.max(1, Math.floor(context.sampleRate * 4));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    const random = seeded(`texture:${id}`);
    let slow = 0;
    for (let index = 0; index < length; index += 1) {
      const white = random() * 2 - 1;
      slow = slow * .985 + white * .015;
      const ripple = Math.sin(index / context.sampleRate * (2.1 + random() * 3.2) * TAU) * .08;
      data[index] = (white * .32 + slow * .8 + ripple) * .32;
    }
    return buffer;
  }

  function makeEnvironment(id, targetTime) {
    const profile = profiles[id];
    const source = context.createBufferSource();
    source.buffer = makeNoiseBuffer(id); source.loop = true;
    const filter = context.createBiquadFilter(); filter.type = profile.noise; filter.frequency.value = profile.noiseCutoff; filter.Q.value = profile.noiseQ;
    const gain = context.createGain(); gain.gain.value = .0001;
    source.connect(filter); filter.connect(gain); gain.connect(musicBus);
    const serial = ++requestSerial;
    const layer = { id, source, filter, gain, serial };
    environments.add(layer);
    source.onended = () => {
      environments.delete(layer);
      disconnect([source, filter, gain]);
    };
    source.start(targetTime);
    rampParam(gain.gain, profile.texture, targetTime, 3.2);
    return layer;
  }

  function crossfadeEnvironment(id, immediate = false) {
    if (!context || !musicBus || id === environment?.id) return;
    const now = context.currentTime;
    const duration = immediate ? .02 : 3.1;
    const old = environment;
    const next = makeEnvironment(id, now);
    environment = next;
    if (old) {
      rampParam(old.gain.gain, .0001, now, duration);
      try { old.source.stop(now + duration + .08); } catch { /* already ending */ }
    }
  }

  function startScheduler() {
    if (scheduler || !context) return;
    nextBar = context.currentTime + .12;
    scheduler = setInterval(schedule, 220);
    schedule();
  }

  function stopScheduler() {
    if (!scheduler) return;
    clearInterval(scheduler);
    scheduler = null;
  }

  function createContext() {
    const AudioContextClass = resolveAudioContext();
    if (!AudioContextClass || destroyed) return false;
    try {
      context = new AudioContextClass();
      compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -22; compressor.knee.value = 18; compressor.ratio.value = 5; compressor.attack.value = .02; compressor.release.value = .4;
      master = context.createGain(); master.gain.value = muted ? 0 : 1; master.connect(compressor); compressor.connect(context.destination);
      musicBus = context.createGain(); musicBus.gain.value = musicEnabled ? musicVolume : 0; musicBus.connect(master);
      sfxBus = context.createGain(); sfxBus.gain.value = sfxEnabled ? sfxVolume : 0; sfxBus.connect(master);
      activeMusicLayer = getMusicLayer(activeBiome, true);
      environment = makeEnvironment(activeBiome, context.currentTime + .03);
      return true;
    } catch {
      destroyContext();
      return false;
    }
  }

  function destroyContext() {
    stopScheduler();
    for (const voice of [...voices]) endVoice(voice, true);
    for (const item of environments) {
      try { item.source.stop(); } catch { /* already stopped */ }
      disconnect([item.source, item.filter, item.gain]);
    }
    environments.clear(); environment = null;
    disconnect([...musicLayers.values(), musicBus, sfxBus, master, compressor]);
    musicLayers.clear(); activeMusicLayer = null;
    try { context?.close?.(); } catch { /* browser may already have closed it */ }
    context = null; master = null; musicBus = null; sfxBus = null; compressor = null; running = false;
  }

  function start() {
    if (destroyed) return false;
    if (running) return true;
    if (!context && !createContext()) return false;
    try { if (context.state === "suspended") context.resume(); } catch { /* resume can reject outside a gesture */ }
    if (environment?.id !== activeBiome) {
      crossfadeMusic(activeBiome, true);
      crossfadeEnvironment(activeBiome, true);
    }
    nextBar = context.currentTime + .12;
    running = true;
    startScheduler();
    if (musicBus) rampParam(musicBus.gain, musicEnabled ? musicVolume : 0, context.currentTime, .35);
    return true;
  }

  function schedule() {
    if (!context || !running || !musicBus) return;
    const now = context.currentTime;
    /* A throttled or resumed tab must not dump every missed bar into the
     * destination at once. Start from the next clean beat instead. */
    if (nextBar < now - .45) nextBar = now + .08;
    const lookAhead = 1.6;
    while (nextBar < now + lookAhead) {
      scheduleBar(nextBar, activeBiome, barIndex++);
      const beats = 4;
      nextBar += (60 / profiles[activeBiome].tempo) * beats;
      scheduledBars += 1;
    }
  }

  function getMusicLayer(id, immediate = false) {
    if (!context || !musicBus) return musicBus;
    let layer = musicLayers.get(id);
    if (!layer) {
      layer = context.createGain(); layer.gain.value = immediate ? 1 : .0001; layer.connect(musicBus); musicLayers.set(id, layer);
    }
    return layer;
  }

  function crossfadeMusic(id, immediate = false) {
    if (!context || !musicBus) return;
    const now = context.currentTime;
    const duration = immediate ? .02 : 3.2;
    const previous = activeMusicLayer;
    const next = getMusicLayer(id, false);
    activeMusicLayer = next;
    rampParam(next.gain, 1, now, duration);
    if (previous) rampParam(previous.gain, .0001, now, duration);
    transitions += 1;
  }

  function trackVoice(nodes, stopAt, oscillator = null) {
    const voice = { nodes, oscillator, stopAt };
    voices.add(voice);
    peakVoices = Math.max(peakVoices, voices.size);
    if (oscillator) oscillator.onended = () => endVoice(voice, false);
    return voice;
  }

  function endVoice(voice, forced) {
    if (!voices.has(voice)) return;
    voices.delete(voice);
    if (forced) { try { voice.oscillator?.stop?.(); } catch { /* already stopped */ } }
    disconnect(voice.nodes);
  }

  function voiceOscillator(time, duration, frequency, options = {}) {
    if (!context || voices.size >= 54) return;
    const oscillator = context.createOscillator();
    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), time);
    if (options.detune) oscillator.detune.value = options.detune;
    if (options.sweep) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, options.sweep), time + duration);
    const gain = context.createGain();
    const amount = Math.max(.0001, options.gain || .02);
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.linearRampToValueAtTime(amount, time + Math.min(.35, duration * .26));
    if (options.hold) gain.gain.setValueAtTime(amount, time + duration * .55);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    const filter = options.filter ? context.createBiquadFilter() : null;
    if (filter) { filter.type = options.filter; filter.frequency.value = options.cutoff || 1200; filter.Q.value = options.q || .4; }
    const destination = options.destination || musicBus;
    oscillator.connect(gain); if (filter) { gain.connect(filter); filter.connect(destination); } else gain.connect(destination);
    const voice = trackVoice([oscillator, gain, filter].filter(Boolean), time + duration + .1, oscillator);
    oscillator.start(time); oscillator.stop(time + duration + .12);
    return voice;
  }

  function scheduleBar(time, id, index) {
    const profile = profiles[id];
    const random = seeded(`${id}:bar:${index}`);
    const beat = 60 / profile.tempo;
    const bar = beat * 4;
    const chord = profile.chords[index % profile.chords.length];
    const root = profile.roots[index % profile.roots.length];
    const destination = getMusicLayer(id);
    const busGain = musicEnabled ? 1 : 0;
    if (!busGain) return;
    chord.slice(0, id === "thermal" ? 4 : 3).forEach((interval, voiceIndex) => {
      voiceOscillator(time + voiceIndex * .018, bar * .96, midiHz(root + interval), {
        type: profile.wave, gain: id === "thermal" ? .012 : .017, detune: (voiceIndex - 1) * 3,
        filter: profile.filter, cutoff: profile.cutoff, q: id === "thermal" ? 1.3 : .35, hold: true, destination,
      });
    });
    voiceOscillator(time, bar * .82, midiHz(root - 12), { type: profile.bass, gain: .04, filter: "lowpass", cutoff: 330, hold: true, destination });
    const notes = 2 + Math.floor(random() * 3);
    for (let noteIndex = 0; noteIndex < notes; noteIndex += 1) {
      if (random() < (id === "night-tide" ? .26 : .13)) continue;
      const step = profile.motif[(index + noteIndex) % profile.motif.length];
      const scale = profile.scale[step % profile.scale.length];
      const octave = id === "thermal" || id === "moist-sand" ? 12 : random() < .3 ? 12 : 0;
      const when = time + (noteIndex + 1) * beat * (0.55 + random() * .7);
      const duration = id === "night-tide" ? 2.8 : 1.1 + random() * 1.4;
      voiceOscillator(when, duration, midiHz(root + 12 + scale + octave), {
        type: id === "thermal" ? "square" : "sine", gain: id === "thermal" ? .018 : .025,
        filter: "lowpass", cutoff: profile.cutoff * 1.15, q: profile.sway * 1.5, sweep: id === "coastal" ? midiHz(root + 12 + scale + octave + 1) : 0, destination,
      });
    }
    if (id === "moist-sand" || id === "coastal" || id === "thermal") {
      const tick = time + beat * (1.5 + random());
      voiceOscillator(tick, .18, midiHz(root + 24 + profile.scale[index % profile.scale.length]), { type: "triangle", gain: .012, filter: "highpass", cutoff: 1200, destination });
    }
  }

  function sfxTone(time, frequency, duration, options = {}) {
    if (!context || !sfxBus || voices.size >= 54) return;
    const oscillator = context.createOscillator();
    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(frequency, time);
    if (options.sweep) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, options.sweep), time + duration);
    const gain = context.createGain();
    const amount = Math.max(.0001, options.gain || .08);
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.exponentialRampToValueAtTime(amount, time + Math.min(.018, duration * .2));
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.connect(gain); gain.connect(sfxBus);
    const voice = trackVoice([oscillator, gain], time + duration + .06, oscillator);
    oscillator.start(time); oscillator.stop(time + duration + .07);
    return voice;
  }

  function sfxNoise(time, duration, amount = .025) {
    if (!context || !sfxBus || voices.size >= 54) return;
    const source = context.createBufferSource();
    source.buffer = makeNoiseBuffer(`sfx:${sfxCount}`);
    const filter = context.createBiquadFilter(); filter.type = "bandpass"; filter.frequency.value = 850; filter.Q.value = .7;
    const gain = context.createGain(); gain.gain.setValueAtTime(.0001, time); gain.gain.linearRampToValueAtTime(amount, time + .015); gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    source.connect(filter); filter.connect(gain); gain.connect(sfxBus);
    const voice = trackVoice([source, filter, gain], time + duration + .06, source);
    source.start(time); source.stop(time + duration + .07);
    return voice;
  }

  function setBiome(id) {
    const next = safeBiome(id);
    if (next === activeBiome) return next;
    const previous = activeBiome;
    activeBiome = next;
    if (context && running) {
      crossfadeMusic(next);
      crossfadeEnvironment(next);
    }
    return { from: previous, to: next };
  }

  function setSettings(next = {}) {
    if (Object.prototype.hasOwnProperty.call(next, "music")) musicEnabled = Boolean(next.music);
    if (Object.prototype.hasOwnProperty.call(next, "sfx")) sfxEnabled = Boolean(next.sfx);
    if (Object.prototype.hasOwnProperty.call(next, "musicVolume")) musicVolume = clamp(next.musicVolume, 0, 1);
    if (Object.prototype.hasOwnProperty.call(next, "sfxVolume")) sfxVolume = clamp(next.sfxVolume, 0, 1);
    if (Object.prototype.hasOwnProperty.call(next, "muted")) muted = Boolean(next.muted);
    if (context) {
      const now = context.currentTime;
      rampParam(musicBus?.gain, musicEnabled ? musicVolume : 0, now, .28);
      setParam(sfxBus?.gain, sfxEnabled ? sfxVolume : 0, now, .08);
      rampParam(master?.gain, muted ? 0 : 1, now, .18);
    }
    return { music: musicEnabled, sfx: sfxEnabled, musicVolume, sfxVolume, muted };
  }

  function sfx(kind = "select") {
    if (!context || !running || !sfxEnabled || muted || !sfxBus) return false;
    const time = context.currentTime + .005;
    const patterns = {
      select: () => sfxTone(time, 480, .09, { type: "sine", gain: .055, sweep: 610 }),
      start: () => { sfxTone(time, 260, .18, { type: "triangle", gain: .07, sweep: 420 }); sfxTone(time + .07, 590, .16, { type: "sine", gain: .045, sweep: 760 }); },
      collect: () => { sfxTone(time, 430, .16, { type: "triangle", gain: .07, sweep: 620 }); sfxTone(time + .09, 650, .23, { type: "sine", gain: .05, sweep: 900 }); },
      discovery: () => { [392, 494, 587, 784].forEach((frequency, index) => sfxTone(time + index * .075, frequency, .3, { type: "sine", gain: .055 })); sfxNoise(time, .45, .018); },
      harvest: () => { sfxTone(time, 180, .24, { type: "triangle", gain: .08, sweep: 110 }); sfxTone(time + .08, 360, .2, { type: "sine", gain: .045, sweep: 240 }); },
      buy: () => { sfxTone(time, 520, .08, { type: "square", gain: .035, sweep: 720 }); sfxTone(time + .08, 780, .12, { type: "triangle", gain: .04, sweep: 930 }); },
      upgrade: () => { sfxTone(time, 320, .19, { type: "triangle", gain: .06, sweep: 540 }); sfxTone(time + .08, 640, .28, { type: "sine", gain: .04, sweep: 890 }); },
      deny: () => sfxTone(time, 180, .16, { type: "sawtooth", gain: .04, sweep: 120 }),
    };
    (patterns[kind] || patterns.select)();
    sfxCount += 1;
    return true;
  }

  function suspend() {
    if (!context) return false;
    running = false;
    stopScheduler();
    for (const voice of [...voices]) endVoice(voice, true);
    try { context.suspend(); } catch { /* unsupported or already suspended */ }
    return true;
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    destroyContext();
  }

  function metrics() {
    return {
      supported: Boolean(resolveAudioContext()), started: Boolean(context), running,
      state: context?.state || "unavailable", biome: activeBiome, voices: voices.size,
      peakVoices, scheduledBars, transitions, sfxCount,
      settings: { music: musicEnabled, sfx: sfxEnabled, musicVolume, sfxVolume, muted },
    };
  }

  return { start, setBiome, setSettings, sfx, suspend, destroy, metrics };
}

export { createAmbientAudio };
