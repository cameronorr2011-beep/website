import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "game", "js", "biorealm-audio.js");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "biorealm-atmosphere-"));
const bundle = await build({ entryPoints: [source], bundle: true, format: "cjs", platform: "node", write: false, target: "es2022" });
const bundlePath = path.join(temp, "audio.cjs");
fs.writeFileSync(bundlePath, bundle.outputFiles[0].text);

class FakeParam {
  constructor(value = 0) { this.value = value; this.events = []; }
  setValueAtTime(value, time) { this.value = value; this.events.push(["set", value, time]); }
  setTargetAtTime(value, time, constant) { this.value = value; this.events.push(["target", value, time, constant]); }
  linearRampToValueAtTime(value, time) { this.value = value; this.events.push(["ramp", value, time]); }
  exponentialRampToValueAtTime(value, time) { this.value = value; this.events.push(["exp", value, time]); }
  cancelScheduledValues(time) { this.events.push(["cancel", time]); }
}

class FakeNode {
  constructor() { this.connections = []; this.disconnected = false; }
  connect(destination) { this.connections.push(destination); return destination; }
  disconnect() { this.disconnected = true; this.connections.length = 0; }
}

class FakeOscillator extends FakeNode {
  constructor() { super(); this.frequency = new FakeParam(); this.detune = new FakeParam(); this.type = "sine"; this.onended = null; this.started = []; this.stopped = []; }
  start(time) { this.started.push(time); }
  stop(time) { this.stopped.push(time); }
}

class FakeBufferSource extends FakeNode {
  constructor() { super(); this.buffer = null; this.loop = false; this.onended = null; this.started = []; this.stopped = []; }
  start(time) { this.started.push(time); }
  stop(time) { this.stopped.push(time); }
}

class FakeAudioContext {
  static instances = [];
  constructor() {
    this.time = 0;
    this.sampleRate = 8000;
    this.state = "running";
    this.destination = new FakeNode();
    this.oscillators = [];
    this.sources = [];
    FakeAudioContext.instances.push(this);
  }
  get currentTime() { return this.time; }
  createGain() { const node = new FakeNode(); node.gain = new FakeParam(); return node; }
  createDynamicsCompressor() {
    const node = new FakeNode();
    for (const key of ["threshold", "knee", "ratio", "attack", "release"]) node[key] = new FakeParam();
    return node;
  }
  createBiquadFilter() { const node = new FakeNode(); node.frequency = new FakeParam(); node.Q = new FakeParam(); node.type = "lowpass"; return node; }
  createOscillator() { const oscillator = new FakeOscillator(); this.oscillators.push(oscillator); return oscillator; }
  createBufferSource() { const source = new FakeBufferSource(); this.sources.push(source); return source; }
  createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length), channels }; }
  resume() { this.state = "running"; return Promise.resolve(); }
  suspend() { this.state = "suspended"; return Promise.resolve(); }
  close() { this.state = "closed"; return Promise.resolve(); }
}

globalThis.AudioContext = FakeAudioContext;
const { createAmbientAudio } = await import(`file://${bundlePath.replaceAll("\\", "/")}`);
const audio = createAmbientAudio();

assert.equal(audio.metrics().started, false, "constructing the controller must not autoplay or allocate a context");
assert.equal(audio.sfx("select"), false, "SFX must remain inert before the user gesture start");
assert.equal(audio.start(), true, "a user-gesture start should create the context");
const context = FakeAudioContext.instances[0];
const first = audio.metrics();
assert.equal(first.running, true);
assert.ok(first.scheduledBars >= 1, "the initial scheduler should render one look-ahead window");
assert.equal(audio.start(), true, "start should be idempotent while already running");
assert.equal(FakeAudioContext.instances.length, 1, "idempotent start must not create a second context");
assert.equal(audio.metrics().transitions, first.transitions);

assert.equal(audio.setBiome("lab"), "lab", "setting the current biome should be a no-op");
assert.equal(audio.metrics().transitions, first.transitions);
const change = audio.setBiome("freshwater");
assert.deepEqual(change, { from: "lab", to: "freshwater" });
assert.equal(audio.metrics().transitions, first.transitions + 1);
assert.ok(context.sources.length >= 2, "a biome change should create a replacement environment bed");
assert.ok(context.sources.some((source) => source.stopped.length), "the old environment bed should be scheduled to stop");

audio.setSettings({ music: false, sfx: true, musicVolume: .2, sfxVolume: .8, muted: false });
assert.deepEqual(audio.metrics().settings, { music: false, sfx: true, musicVolume: .2, sfxVolume: .8, muted: false });
assert.equal(audio.sfx("select"), true, "SFX should use its independent bus when music is disabled");
audio.setSettings({ muted: true });
assert.equal(audio.sfx("select"), false, "the master mute should silence SFX without changing its preference");
audio.setSettings({ muted: false });

audio.suspend();
assert.equal(audio.metrics().running, false);
assert.equal(audio.metrics().voices, 0, "suspend should cancel scheduled voices instead of replaying stale notes");
const beforeResumeBars = audio.metrics().scheduledBars;
context.time = 1000;
assert.equal(audio.start(), true);
const afterResume = audio.metrics();
assert.ok(afterResume.scheduledBars <= beforeResumeBars + 2, "resume should schedule a clean window, not catch up every missed bar");

audio.destroy();
assert.equal(audio.metrics().started, false);
assert.equal(audio.metrics().running, false);
console.log("Cyanoflow atmosphere checks passed");
