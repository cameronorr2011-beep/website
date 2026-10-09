/*
 * Hardware boundary for the browser laboratory.
 *
 * The mock provider is the only provider enabled by the static app. It maps
 * model state to unit-labelled synthetic readings. The real-device provider is
 * deliberately explicit about being unavailable: a future Raspberry Pi
 * service can implement this contract without making the simulation depend on
 * GPIO, an ADC, or a connected instrument.
 */

import { SENSOR_CONTRACT_VERSION, syntheticSensorSnapshot } from "./lab-engine.js";

export const SENSOR_DEFINITIONS = Object.freeze([
  { key: "temperatureC", label: "DS18B20 temperature", unit: "°C", interface: "1-wire" },
  { key: "ph", label: "pH", unit: "pH", interface: "ADC via MCP3008 or validated interface" },
  { key: "turbidityAU", label: "Turbidity / optical density proxy", unit: "AU", interface: "ADC via MCP3008" },
  { key: "dissolvedOxygenPct", label: "Dissolved oxygen", unit: "% saturation", interface: "optional validated sensor" },
  { key: "lightPpfd", label: "Incident light", unit: "µmol m⁻² s⁻¹", interface: "external calibration or light sensor" },
  { key: "carbonG_L", label: "Available carbon", unit: "g/L", interface: "modelled unless chemically measured" },
]);

const VALID_RANGES = Object.freeze({
  temperatureC: [-10, 70],
  ph: [0, 14],
  turbidityAU: [0, 20],
  dissolvedOxygenPct: [0, 300],
  lightPpfd: [0, 3000],
  carbonG_L: [0, 100],
});

export function validateReading(reading) {
  const range = VALID_RANGES[reading?.key];
  const value = Number(reading?.value);
  if (!range || !Number.isFinite(value) || value < range[0] || value > range[1]) {
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

export function createRealDeviceProvider() {
  return {
    id: "raspberry-pi-device",
    label: "Raspberry Pi sensor service",
    status: "unavailable",
    hardwareConnected: false,
    contractVersion: SENSOR_CONTRACT_VERSION,
    reason: "No device service is exposed by this static browser app. DS18B20 and analog channels require a Pi service and a compatible ADC such as MCP3008.",
    read() {
      return { status: "unavailable", readings: [], reason: this.reason };
    },
    calibrate() {
      return { status: "unavailable", readings: [], reason: this.reason };
    },
  };
}
