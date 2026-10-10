import assert from "node:assert/strict";
import fs from "node:fs";

// Browser ES modules live in a CommonJS-default static-site package.
const engineSource = fs.readFileSync(new URL("../game/js/lab-engine.js", import.meta.url), "utf8");
const engineUrl = `data:text/javascript,${encodeURIComponent(engineSource)}`;
const providerSource = fs.readFileSync(new URL("../game/js/lab-providers.js", import.meta.url), "utf8")
  .replace('"./lab-engine.js"', JSON.stringify(engineUrl));
const { createRealDeviceProvider, validateDeviceSnapshot, deviceEndpoint } = await import(`data:text/javascript,${encodeURIComponent(providerSource)}`);
const now = Date.now();
const sampledAt = new Date(now).toISOString();
const snapshot = {
  contractVersion: "sensor-provider-1.0", provider: "raspberry-pi-sensors", mode: "mock",
  deviceId: "test-pi", sampledAt,
  readings: [["temperatureC", "°C", 28], ["ph", "pH", 9], ["turbidityAU", "AU", .3], ["dissolvedOxygenMgL", "mg/L", 8]]
    .map(([key, unit, value]) => ({ key, unit, value, sampledAt, quality: "simulated", hardware: false,
      provenance: "synthetic service mock", calibration: { status: "simulated" } })),
};
const mutate = (change) => { const value = structuredClone(snapshot); change(value); return value; };
assert.equal(validateDeviceSnapshot(snapshot, now).readings[0].quality, "simulated");
for (const change of [
  (s) => s.contractVersion = "unknown",
  (s) => s.readings[0].unit = "F",
  (s) => s.readings[1].key = "temperatureC",
  (s) => s.readings[0].sampledAt = "not-a-date",
  (s) => s.readings[0].hardware = true,
  (s) => s.readings[0].quality = "ok",
  (s) => s.readings[0].provenance = "real sensor",
]) assert.throws(() => validateDeviceSnapshot(mutate(change), now));
for (const age of [16000, -6000]) {
  const stale = validateDeviceSnapshot(mutate((s) => s.sampledAt = new Date(now - age).toISOString()), now);
  assert.ok(stale.readings.every((item) => item.quality === "stale" && item.value === null));
}
assert.equal(validateDeviceSnapshot(mutate((s) => s.readings[0].value = 999), now).readings[0].quality, "invalid");
assert.equal(validateDeviceSnapshot(mutate((s) => s.readings[0].quality = "unavailable"), now).readings[0].value, null);
const real = mutate((s) => {
  s.mode = "real";
  for (const item of s.readings) {
    item.quality = "ok"; item.hardware = true; item.provenance = "real sensor";
    item.calibration = item.key === "temperatureC" ? { status: "factory", reference: "DS18B20 factory conversion" }
      : { status: "configured", reference: "measured reference standards", calibratedAt: new Date(now - 1000).toISOString(),
        points: [{ voltage: 1, value: 1 }, { voltage: 2, value: 2 }] };
  }
});
assert.ok(validateDeviceSnapshot(real, now).readings.every((item) => item.quality === "ok"));
for (const calibration of [null, { status: "configured" }, { status: "factory", reference: "not an analog calibration" },
  { ...real.readings[1].calibration, calibratedAt: new Date(now + 10000).toISOString() },
  { ...real.readings[1].calibration, points: [null, {}] },
  { ...real.readings[1].calibration, reference: " " }]) {
  const bad = structuredClone(real);
  bad.readings[1].calibration = calibration;
  const item = validateDeviceSnapshot(bad, now).readings[1];
  assert.equal(item.quality, "uncalibrated"); assert.equal(item.value, null);
}
assert.equal(deviceEndpoint("http://127.0.0.1:8765/", "http:"), "http://127.0.0.1:8765");
for (const url of ["ftp://pi.local", "http://user:pass@pi.local", "http://pi.local?x=1", "http://pi.local#x"]) {
  assert.throws(() => deviceEndpoint(url, "http:"));
}
assert.throws(() => deviceEndpoint("http://pi.local", "https:"), /HTTPS/);
const response = (payload) => ({ ok: true, text: async () => JSON.stringify(payload) });
let requested;
const provider = createRealDeviceProvider({ fetchImpl: async (url, options) => {
  requested = { url, options }; return response(snapshot);
} });
await provider.read("http://pi.local");
assert.equal(requested.url, "http://pi.local/api/v1/readings");
assert.equal(requested.options.method, "GET");
assert.equal(requested.options.credentials, "omit");
assert.equal(requested.options.redirect, "error");
assert.equal(provider.status, "mock"); assert.equal(provider.hardwareConnected, false);
provider.disconnect(); assert.equal(provider.snapshot, null);
const physical = createRealDeviceProvider({ fetchImpl: async () => response(real) });
await physical.read("http://pi.local"); assert.equal(physical.hardwareConnected, true);
for (const fetchImpl of [
  async () => ({ ok: false, status: 503 }),
  async () => ({ ok: true, text: async () => "not json" }),
  async () => ({ ok: true, text: async () => "x".repeat(65537) }),
  async () => { throw new TypeError("Network unavailable"); },
]) {
  const failed = createRealDeviceProvider({ fetchImpl });
  assert.equal(await failed.read("http://pi.local"), null);
  assert.equal(failed.status, "error"); assert.equal(failed.hardwareConnected, false); assert.equal(failed.snapshot, null);
}
const timed = createRealDeviceProvider({ timeoutMs: 5, fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
  signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
}) });
await timed.read("http://pi.local"); assert.match(timed.reason, /timed out/);
let complete;
const pending = createRealDeviceProvider({ fetchImpl: () => new Promise((resolve) => complete = resolve) });
const request = pending.read("http://pi.local");
pending.disconnect(); complete(response(snapshot));
assert.equal(await request, null); assert.equal(pending.snapshot, null); assert.equal(pending.status, "unavailable");
console.log("lab providers: contract, calibration, freshness, provenance, HTTP failures, timeout, and disconnect passed");
