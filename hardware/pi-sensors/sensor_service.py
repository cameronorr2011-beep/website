"""Read-only Pi 3 B+ sensor bridge. Python 3.9+, stdlib + optional spidev.

Does not import Algaephyte's HardwareDriver: its constructor starts aeration.
Only SPI ADC transactions and Linux 1-Wire reads are performed here.
"""

import argparse
import copy
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import math
from pathlib import Path
import re
import threading
import time
from urllib.parse import urlsplit

CONTRACT = "sensor-provider-1.0"
CHANNELS = {
    "temperatureC": ("°C", -10, 70),
    "ph": ("pH", 0, 14),
    "turbidityAU": ("AU", 0, 20),
    "dissolvedOxygenMgL": ("mg/L", 0, 30),
}


def timestamp():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def finite(value):
    return type(value) in (int, float) and math.isfinite(value)


def validate_config(config):
    if not isinstance(config, dict):
        raise ValueError("Config must be an object")
    if not isinstance(config.get("deviceId"), str) or not 1 <= len(config["deviceId"]) <= 80:
        raise ValueError("deviceId must contain 1-80 characters")
    sensor_id = config.get("temperatureSensorId")
    if sensor_id is not None and (not isinstance(sensor_id, str) or not re.fullmatch(r"28-[0-9a-fA-F]{12}", sensor_id)):
        raise ValueError("temperatureSensorId must be a DS18B20 ID (28-xxxxxxxxxxxx)")
    adc = config.get("adc", {})
    if not isinstance(adc, dict):
        raise ValueError("adc must be an object")
    vref = adc.get("referenceVoltage", 3.3)
    if not finite(vref) or not 0 < vref <= 3.3:
        raise ValueError("ADC referenceVoltage must be > 0 and <= 3.3 V")
    for field in ("bus", "device"):
        if type(adc.get(field, 0)) is not int or not 0 <= adc.get(field, 0) <= 1:
            raise ValueError("ADC bus/device must be 0 or 1")
    analog = config.get("analog", {})
    if not isinstance(analog, dict) or set(analog) - (set(CHANNELS) - {"temperatureC"}):
        raise ValueError("Unknown analog sensor key")
    used = set()
    for key, channel in analog.items():
        if not isinstance(channel, dict) or type(channel.get("enabled")) is not bool:
            raise ValueError(f"{key}: enabled must be a boolean")
        pin = channel.get("channel")
        if type(pin) is not int or not 0 <= pin <= 7:
            raise ValueError(f"{key}: channel must be 0-7")
        if channel["enabled"]:
            if pin in used:
                raise ValueError("Enabled ADC channels must be unique")
            used.add(pin)
        calibration = channel.get("calibration")
        if calibration is None:
            continue
        if not isinstance(calibration, dict):
            raise ValueError(f"{key}: calibration must be an object")
        points = calibration.get("points", [])
        if not isinstance(points, list) or len(points) != 2:
            raise ValueError(f"{key}: two measured calibration points required")
        _, low, high = CHANNELS[key]
        for point in points:
            if not isinstance(point, dict) or not finite(point.get("voltage")) or not 0 < point["voltage"] < vref:
                raise ValueError(f"{key}: calibration voltage must be inside ADC rails")
            if not finite(point.get("value")) or not low <= point["value"] <= high:
                raise ValueError(f"{key}: calibration value out of range")
        if abs(points[1]["voltage"] - points[0]["voltage"]) < .001 or points[0]["value"] == points[1]["value"]:
            raise ValueError(f"{key}: calibration points must have distinct voltages and values")
        if not isinstance(calibration.get("reference"), str) or not calibration["reference"].strip():
            raise ValueError(f"{key}: calibration reference required")
        try:
            date_text = calibration["calibratedAt"]
            if not isinstance(date_text, str):
                raise ValueError()
            date = datetime.fromisoformat(date_text.replace("Z", "+00:00"))
            if date.utcoffset() is None or date > datetime.now(timezone.utc):
                raise ValueError()
        except (KeyError, TypeError, ValueError):
            raise ValueError(f"{key}: calibratedAt must be a past timezone-aware ISO date") from None
    return config


def reading(key, value=None, quality="unavailable", reason="", hardware=False,
            calibration=None, raw=None, mode="real"):
    unit, low, high = CHANNELS[key]
    if value is not None and (not finite(value) or not low <= value <= high):
        value, quality, reason = None, "invalid", "Non-finite or out-of-range reading"
    return {
        "key": key, "unit": unit, "value": value, "quality": quality,
        "reason": reason, "hardware": hardware, "sampledAt": timestamp(),
        "provenance": "real sensor" if mode == "real" else "synthetic service mock",
        "calibration": calibration or {"status": "unavailable"}, "raw": raw,
    }


def parse_temperature(text):
    lines = text.strip().splitlines()
    if len(lines) != 2 or not lines[0].endswith("YES"):
        raise ValueError("DS18B20 CRC failed or incomplete read")
    match = re.search(r"\bt=(-?\d+)\s*$", lines[1])
    if not match:
        raise ValueError("DS18B20 temperature missing")
    value = int(match.group(1)) / 1000
    if value in (85, -127):
        raise ValueError("DS18B20 startup/disconnection sentinel")
    return value


class RealSensors:
    def __init__(self, config, w1_root=Path("/sys/bus/w1/devices"), spi_factory=None):
        self.config = config
        self.w1_root = w1_root
        self.spi = None
        self.spi_factory = spi_factory

    def temperature(self):
        try:
            sensor_id = self.config.get("temperatureSensorId")
            paths = [self.w1_root / sensor_id / "w1_slave"] if sensor_id else sorted(self.w1_root.glob("28-*/w1_slave"))
            if len(paths) != 1:
                raise ValueError("Configure one temperatureSensorId; expected exactly one DS18B20")
            value = parse_temperature(paths[0].read_text(encoding="ascii"))
            return reading("temperatureC", value, "ok", hardware=True,
                           calibration={"status": "factory", "reference": "DS18B20 factory conversion"})
        except (OSError, ValueError) as exc:
            return reading("temperatureC", reason=str(exc))

    def read_adc(self, channel):
        if self.spi is None:
            if self.spi_factory is None:
                import spidev
                self.spi_factory = spidev.SpiDev
            spi = self.spi_factory()
            try:
                adc = self.config.get("adc", {})
                spi.open(adc.get("bus", 0), adc.get("device", 0))
                spi.max_speed_hz = 1_000_000
                spi.mode = 0
            except Exception:
                spi.close()
                raise
            self.spi = spi
        # Same MCP3008 frame and channel convention as Algaephyte. One sampler
        # thread owns SPI; HTTP requests never access it concurrently.
        reply = self.spi.xfer2([1, (8 + channel) << 4, 0])
        if len(reply) != 3 or any(type(v) is not int or not 0 <= v <= 255 for v in reply):
            raise ValueError("Invalid MCP3008 reply")
        return ((reply[1] & 3) << 8) | reply[2]

    def analog(self, key):
        channel = self.config.get("analog", {}).get(key, {})
        if not channel.get("enabled", False):
            return reading(key, reason="Channel disabled / not configured")
        calibration = channel.get("calibration")
        cal = {**calibration, "status": "configured"} if calibration else {"status": "uncalibrated"}
        try:
            count = self.read_adc(channel["channel"])
            voltage = count * self.config.get("adc", {}).get("referenceVoltage", 3.3) / 1023
            raw = {"adcCount": count, "voltage": round(voltage, 6), "channel": channel["channel"]}
            if count in (0, 1023):
                return reading(key, quality="invalid", reason="ADC at rail: check wiring, range and sensor power",
                               hardware=True, calibration=cal, raw=raw)
            if not calibration:
                return reading(key, quality="uncalibrated", reason="Two-point physical calibration required",
                               hardware=True, calibration=cal, raw=raw)
            a, b = calibration["points"]
            value = a["value"] + (voltage - a["voltage"]) * (b["value"] - a["value"]) / (b["voltage"] - a["voltage"])
            return reading(key, round(value, 4), "ok", hardware=True, calibration=cal, raw=raw)
        except (ImportError, OSError, ValueError) as exc:
            self.close()
            return reading(key, reason=f"MCP3008 unavailable: {exc}", calibration=cal)

    def read(self):
        return [self.temperature()] + [self.analog(key) for key in CHANNELS if key != "temperatureC"]

    def close(self):
        if self.spi is not None:
            self.spi.close()
            self.spi = None


class MockSensors:
    def read(self):
        values = (28.0, 9.0, .3, 8.0)
        return [reading(key, value, "simulated", mode="mock",
                        calibration={"status": "simulated", "reference": "No physical reference"})
                for key, value in zip(CHANNELS, values)]

    def close(self):
        pass


class Sampler:
    def __init__(self, provider, mode, device_id, interval=2):
        self.provider, self.mode, self.device_id = provider, mode, device_id
        self.interval = interval
        self.lock = threading.Lock()
        self.stop = threading.Event()
        self.latest = self.envelope([reading(key, reason="Waiting for first sample", mode=mode) for key in CHANNELS])
        self.thread = threading.Thread(target=self.run, daemon=True)

    def envelope(self, readings):
        return {"contractVersion": CONTRACT, "provider": "raspberry-pi-sensors", "mode": self.mode,
                "deviceId": self.device_id, "sampledAt": timestamp(), "readings": readings}

    def sample_once(self):
        try:
            readings = self.provider.read()
        except Exception as exc:
            readings = [reading(key, reason=f"Sampling failed: {type(exc).__name__}", mode=self.mode) for key in CHANNELS]
        with self.lock:
            self.latest = self.envelope(readings)

    def run(self):
        try:
            while not self.stop.is_set():
                start = time.monotonic()
                self.sample_once()
                self.stop.wait(max(.1, self.interval - (time.monotonic() - start)))
        finally:
            self.provider.close()

    def snapshot(self):
        with self.lock:
            result = copy.deepcopy(self.latest)
        now = datetime.now(timezone.utc)
        for item in result["readings"]:
            age = (now - datetime.fromisoformat(item["sampledAt"].replace("Z", "+00:00"))).total_seconds()
            if age > 15:
                item.update(value=None, quality="stale", reason="Sampler has not delivered a fresh reading")
        return result


def make_handler(sampler, allowed_origins):
    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            super().setup()
            self.connection.settimeout(5)

        def log_message(self, *_args):
            pass

        def reply(self, code, payload):
            data = json.dumps(payload, allow_nan=False).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Vary", "Origin")
            origin = self.headers.get("Origin")
            if origin in allowed_origins:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
                # Older Chromium private-network preflights. Newer browsers
                # may also request local-network permission from the user.
                self.send_header("Access-Control-Allow-Private-Network", "true")
            self.end_headers()
            self.wfile.write(data)

        def origin_allowed(self):
            origin = self.headers.get("Origin")
            if origin is not None and origin not in allowed_origins:
                self.reply(403, {"error": "Origin is not allowed"})
                return False
            return True

        def do_GET(self):
            if not self.origin_allowed():
                return
            path = urlsplit(self.path).path
            if path == "/api/v1/readings":
                self.reply(200, sampler.snapshot())
            elif path == "/api/v1/health":
                payload = sampler.snapshot()
                payload.pop("readings")
                self.reply(200, payload)
            else:
                self.reply(404, {"error": "Unknown read-only endpoint"})

        def do_OPTIONS(self):
            if not self.origin_allowed():
                return
            if self.headers.get("Access-Control-Request-Method", "GET") != "GET":
                self.reply(405, {"error": "Only GET is supported"})
            else:
                self.reply(200, {})

        def do_POST(self):
            self.reply(405, {"error": "Read-only service"})

        do_PUT = do_PATCH = do_DELETE = do_POST

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=Path(__file__).with_name("config.example.json"))
    parser.add_argument("--mode", choices=("mock", "real"), default="mock")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--interval", type=float, default=2)
    parser.add_argument("--allow-origin", action="append", default=[])
    args = parser.parse_args()
    if not finite(args.interval) or not 1 <= args.interval <= 10:
        parser.error("interval must be 1-10 seconds")
    for origin in args.allow_origin:
        parts = urlsplit(origin)
        if parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password or parts.path or parts.query or parts.fragment:
            parser.error("allow-origin must be an exact HTTP(S) origin without a trailing slash")
    config = validate_config(json.loads(args.config.read_text(encoding="utf-8")))
    provider = MockSensors() if args.mode == "mock" else RealSensors(config)
    sampler = Sampler(provider, args.mode, config["deviceId"], args.interval)
    server = ThreadingHTTPServer((args.host, args.port), make_handler(sampler, set(args.allow_origin)))
    sampler.thread.start()
    print(f"Sensor service ({args.mode}): http://{args.host}:{args.port}/api/v1/readings", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        sampler.stop.set()
        sampler.thread.join(timeout=5)


if __name__ == "__main__":
    main()
