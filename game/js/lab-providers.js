/*
 * Hardware boundary for the browser laboratory.
 *
 * Synthetic model values and opt-in Pi telemetry have separate lifecycles.
 * The HTTP provider reads only; it never writes model state or device settings.
 */

import { SENSOR_CONTRACT_VERSION, syntheticSensorSnapshot } from "./lab-engine.js";

export const SENSOR_DEFINITIONS = Object.freeze([
  { key: "temperatureC", label: "DS18B20 temperature", unit: "°C", interface: "1-wire" },
  { key: "ph", label: "pH", unit: "pH", interface: "ADC via MCP3008 or validated interface" },
  { key: "turbidityAU", label: "Turbidity / optical density proxy", unit: "AU", interface: "ADC via MCP3008" },
  { key: "dissolvedOxygenPct", label: "Dissolved oxygen", unit: "% saturation", interface: "optional validated sensor" },
  { key: "dissolvedOxygenMgL", label: "Dissolved oxygen (probe)", unit: "mg/L", interface: "optional MCP3008 CH3" },
  { key: "lightPpfd", label: "Incident light", unit: "µmol m⁻² s⁻¹", interface: "external calibration or light sensor" },
  { key: "carbonG_L", label: "Available carbon", unit: "g/L", interface: "modelled unless chemically measured" },
]);

const VALID_RANGES = Object.freeze({
  temperatureC: [-10, 70],
  ph: [0, 14],
  turbidityAU: [0, 20],
  dissolvedOxygenPct: [0, 300],
  dissolvedOxygenMgL: [0, 30],
  lightPpfd: [0, 3000],
  carbonG_L: [0, 100],
});

export function validateReading(reading) {
  const range = VALID_RANGES[reading?.key];
  const value = reading?.value;
  if (!range || typeof value !== "number" || !Number.isFinite(value) || value < range[0] || value > range[1]) {
    return { ...reading, value: null, quality: "invalid", reason: "non-finite or out-of-range reading" };
  }
  return { ...reading, value, quality: reading.quality || "unclassified" };
}

export function createMockSensorProvider() {
  return {
    id: "synthetic-mock",
    label: "Synthetic sensor provider",
    status: "synthetic",
    hardwareConnected: false,
    contractVersion: SENSOR_CONTRACT_VERSION,
    read(state) {
      return syntheticSensorSnapshot(state).map((reading) => validateReading({
        ...reading,
        provider: "synthetic-mock",
        hardware: false,
      }));
    },
    calibrate(state) {
      return {
        status: "simulated calibration only",
        reference: "No physical reference standard is connected.",
        readings: this.read(state),
      };
    },
  };
}

export const DEVICE_KEYS = Object.freeze(["temperatureC", "ph", "turbidityAU", "dissolvedOxygenMgL"]);
export const MAX_READING_AGE_MS = 15000;

export function deviceEndpoint(value, pageProtocol = globalThis.location?.protocol) {
  let url;
  try { url = new URL(value); } catch { throw new Error("Enter a complete Pi service URL, including http:// or https://."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("Use an HTTP(S) base URL without credentials, query parameters, or a fragment.");
  }
  if (pageProtocol === "https:" && url.protocol !== "https:") {
    throw new Error("This HTTPS lab needs an HTTPS Pi endpoint with a trusted certificate. For HTTP development, serve the lab locally over HTTP.");
  }
  return url.href.replace(/\/+$/, "");
}

function validCalibration(key, calibration, validDate, now) {
  if (!calibration || typeof calibration.reference !== "string" || !calibration.reference.trim()) return false;
  if (key === "temperatureC") return calibration.status === "factory";
  if (calibration.status !== "configured" || !validDate(calibration.calibratedAt) ||
      Date.parse(calibration.calibratedAt) > now || !Array.isArray(calibration.points) || calibration.points.length !== 2) return false;
  const range = VALID_RANGES[key];
  const points = calibration.points;
  return points.every((point) => point && typeof point.voltage === "number" && Number.isFinite(point.voltage) &&
    point.voltage > 0 && point.voltage < 3.3 && typeof point.value === "number" && Number.isFinite(point.value) &&
    point.value >= range[0] && point.value <= range[1]) &&
    Math.abs(points[1].voltage - points[0].voltage) >= .001 && points[0].value !== points[1].value;
}

export function validateDeviceSnapshot(payload, now = Date.now()) {
  if (!payload || payload.contractVersion !== SENSOR_CONTRACT_VERSION || payload.provider !== "raspberry-pi-sensors" ||
      !["real", "mock"].includes(payload.mode) || typeof payload.deviceId !== "string" || !payload.deviceId || payload.deviceId.length > 80 ||
      !Array.isArray(payload.readings) || payload.readings.length !== DEVICE_KEYS.length) {
    throw new Error("Unsupported Pi sensor response or contract version.");
  }
  const definitions = Object.fromEntries(SENSOR_DEFINITIONS.map((item) => [item.key, item]));
  const seen = new Set();
  const validDate = (value) => typeof value === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
  if (!validDate(payload.sampledAt)) throw new Error("Invalid snapshot timestamp.");
  const readings = payload.readings.map((item) => {
    if (!item || !DEVICE_KEYS.includes(item.key) || seen.has(item.key) || item.unit !== definitions[item.key].unit ||
        !validDate(item.sampledAt) || typeof item.hardware !== "boolean" ||
        !["ok", "simulated", "unavailable", "invalid", "uncalibrated", "stale"].includes(item.quality)) {
      throw new Error("Malformed Pi reading: check keys, units, timestamps, and quality.");
    }
    seen.add(item.key);
    const expectedSource = payload.mode === "real" ? "real sensor" : "synthetic service mock";
    if (item.provenance !== expectedSource || (payload.mode === "mock" && (item.hardware || item.quality === "ok")) ||
        (payload.mode === "real" && (item.quality === "simulated" || (item.quality === "ok" && !item.hardware)))) {
      throw new Error("Conflicting real/synthetic provenance in Pi response.");
    }
    let result = { ...item };
    if (["ok", "simulated"].includes(item.quality)) {
      result = validateReading(item);
      if (item.quality === "ok" && !validCalibration(item.key, item.calibration, validDate, now)) {
        result = { ...result, value: null, quality: "uncalibrated", reason: "Physical calibration metadata missing" };
      }
    } else {
      result.value = null;
    }
    const age = now - Date.parse(item.sampledAt);
    const snapshotAge = now - Date.parse(payload.sampledAt);
    if (age > MAX_READING_AGE_MS || snapshotAge > MAX_READING_AGE_MS || age < -5000 || snapshotAge < -5000) {
      result = { ...result, value: null, quality: "stale", reason: "Reading expired or device clock is incorrect" };
    }
    return result;
  });
  return { contractVersion: SENSOR_CONTRACT_VERSION, provider: payload.provider, mode: payload.mode,
    deviceId: payload.deviceId, sampledAt: payload.sampledAt, readings };
}

export function createRealDeviceProvider({ fetchImpl = globalThis.fetch, timeoutMs = 6000 } = {}) {
  let controller = null;
  let generation = 0;
  return {
    id: "raspberry-pi-device",
    label: "Raspberry Pi sensor service",
    status: "unavailable",
    hardwareConnected: false,
    contractVersion: SENSOR_CONTRACT_VERSION,
    reason: "Enter your Pi service endpoint and connect to read DS18B20 and MCP3008 channels.",
    snapshot: null,
    async read(endpoint) {
      this.disconnect();
      const request = ++generation;
      const abort = controller = new AbortController();
      const timeout = setTimeout(() => abort.abort(), timeoutMs);
      this.status = "connecting";
      try {
        const base = deviceEndpoint(endpoint);
        const response = await fetchImpl(`${base}/api/v1/readings`, {
          method: "GET", mode: "cors", credentials: "omit", cache: "no-store", redirect: "error",
          referrerPolicy: "no-referrer", signal: abort.signal,
        });
        if (!response.ok) throw new Error(`Pi service returned HTTP ${response.status}.`);
        const text = await response.text();
        if (text.length > 65536) throw new Error("Pi response exceeds the sensor contract size limit.");
        const snapshot = validateDeviceSnapshot(JSON.parse(text));
        if (request !== generation) return null;
        this.snapshot = snapshot;
        this.hardwareConnected = snapshot.mode === "real" && snapshot.readings.some((item) => item.hardware && item.quality === "ok");
        this.status = snapshot.mode === "mock" ? "mock" : this.hardwareConnected ? "connected" : "unavailable";
        this.reason = snapshot.mode === "mock" ? "Connected to a synthetic service mock. No physical measurements."
          : this.hardwareConnected ? "Receiving real sensor telemetry. Each channel reports its own quality."
            : "Service reached; no usable physical readings. Check channel status and calibration.";
        return snapshot;
      } catch (error) {
        if (request !== generation) return null;
        this.status = "error";
        this.reason = error.name === "AbortError" ? "Pi request timed out. Check power, address, and LAN connectivity."
          : error instanceof TypeError ? "Pi request failed. Check LAN access, CORS allow-origin, HTTPS certificate, and browser local-network permission."
            : error.message;
        this.snapshot = null;
        this.hardwareConnected = false;
        return null;
      } finally {
        clearTimeout(timeout);
        if (request === generation) controller = null;
      }
    },
    disconnect() {
      generation++;
      controller?.abort();
      controller = null;
      this.snapshot = null;
      this.hardwareConnected = false;
      this.status = "unavailable";
      this.reason = "Disconnected. Enter your Pi service endpoint and connect.";
    },
  };
}
