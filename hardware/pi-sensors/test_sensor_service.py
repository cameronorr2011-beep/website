import copy
import json
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from sensor_service import (
    CONTRACT,
    MockSensors,
    RealSensors,
    Sampler,
    make_handler,
    parse_temperature,
    validate_config,
)


ROOT = Path(__file__).parent


class FakeSpi:
    def __init__(self):
        self.calls = []
        self.max_speed_hz = None
        self.mode = None

    def open(self, bus, device):
        self.calls.append(("open", bus, device))

    def xfer2(self, frame):
        self.calls.append(("xfer2", frame))
        return [1, 2, 128]

    def close(self):
        self.calls.append(("close",))


class SensorServiceTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((ROOT / "config.example.json").read_text())

    def test_example_config_is_valid_and_rejects_bad_adc_channel(self):
        self.assertEqual(validate_config(self.config)["deviceId"], "algaephyte-pi3")
        bad = copy.deepcopy(self.config)
        bad["analog"]["ph"]["channel"] = 8
        with self.assertRaises(ValueError):
            validate_config(bad)

    def test_calibration_requires_two_named_historical_points(self):
        bad = copy.deepcopy(self.config)
        bad["analog"]["ph"]["calibration"] = {
            "reference": "pH 7 buffer", "calibratedAt": "2026-01-01T00:00:00Z",
            "points": [{"voltage": 1.6, "value": 7}],
        }
        with self.assertRaises(ValueError):
            validate_config(bad)

    def test_temperature_parser_rejects_crc_and_sentinel(self):
        self.assertAlmostEqual(parse_temperature("aa bb : crc=aa YES\naa t=28500\n"), 28.5)
        with self.assertRaises(ValueError):
            parse_temperature("aa : crc=aa NO\naa t=28500\n")
        with self.assertRaises(ValueError):
            parse_temperature("aa : crc=aa YES\naa t=85000\n")

    def test_real_provider_reads_only_configured_sensor_interfaces(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            sensor = root / "28-000000000001"
            sensor.mkdir()
            (sensor / "w1_slave").write_text("aa bb : crc=aa YES\naa t=28500\n")
            config = copy.deepcopy(self.config)
            config["temperatureSensorId"] = "28-000000000001"
            config["analog"]["ph"]["enabled"] = False
            config["analog"]["turbidityAU"]["enabled"] = False
            provider = RealSensors(config, w1_root=root, spi_factory=FakeSpi)
            values = provider.read()
            self.assertEqual(values[0]["quality"], "ok")
            self.assertEqual(values[0]["value"], 28.5)
            self.assertEqual(values[1]["quality"], "unavailable")
            self.assertFalse(any(value["hardware"] for value in values[1:]))
            provider.close()

    def test_malformed_config_is_rejected_cleanly(self):
        changes = [
            lambda c: c.update(adc=[]),
            lambda c: c.update(temperatureSensorId=123),
            lambda c: c["analog"]["ph"].update(calibration=[]),
            lambda c: c["analog"]["ph"].update(calibration={"points": None}),
            lambda c: c["analog"]["ph"].update(calibration={"points": [None, {}]}),
        ]
        for change in changes:
            with self.subTest(change=change):
                config = copy.deepcopy(self.config)
                change(config)
                with self.assertRaises(ValueError):
                    validate_config(config)

    def test_analog_requires_calibration_and_rejects_rails(self):
        config = copy.deepcopy(self.config)
        config["analog"]["ph"]["enabled"] = True
        spi = FakeSpi()
        provider = RealSensors(config, spi_factory=lambda: spi)
        self.addCleanup(provider.close)
        value = provider.analog("ph")
        self.assertEqual(value["quality"], "uncalibrated")
        self.assertIsNone(value["value"])
        self.assertEqual(value["raw"]["adcCount"], 640)
        self.assertIn(("xfer2", [1, 128, 0]), spi.calls)
        config["analog"]["ph"]["calibration"] = {
            "reference": "Measured pH buffers", "calibratedAt": "2026-01-01T00:00:00Z",
            "points": [{"voltage": 1, "value": 7}, {"voltage": 3, "value": 10}],
            "status": "simulated",
        }
        validate_config(config)
        value = provider.analog("ph")
        self.assertEqual(value["quality"], "ok")
        self.assertEqual(value["calibration"]["status"], "configured")
        self.assertAlmostEqual(value["value"], 7 + (640 * 3.3 / 1023 - 1) * 1.5, places=4)
        for reply in ([0, 0, 0], [0, 3, 255], [0, 256, 0]):
            spi.xfer2 = lambda frame, reply=reply: reply
            value = provider.analog("ph")
            self.assertNotEqual(value["quality"], "ok")
            self.assertIsNone(value["value"])

    def test_sampler_failure_and_staleness_are_fail_closed(self):
        sampler = Sampler(MockSensors(), "mock", "test-pi")
        sampler.sample_once()
        for item in sampler.latest["readings"]:
            item["sampledAt"] = "2020-01-01T00:00:00Z"
        self.assertTrue(all(item["quality"] == "stale" and item["value"] is None for item in sampler.snapshot()["readings"]))
        self.assertEqual(sampler.latest["readings"][0]["quality"], "simulated")
        def fail():
            raise OSError("test failure")
        sampler.provider.read = fail
        sampler.sample_once()
        self.assertTrue(all(item["quality"] == "unavailable" and item["value"] is None for item in sampler.snapshot()["readings"]))

    def test_mock_mode_is_unambiguously_synthetic(self):
        values = MockSensors().read()
        self.assertTrue(all(value["quality"] == "simulated" for value in values))
        self.assertTrue(all(value["provenance"] == "synthetic service mock" for value in values))
        self.assertTrue(all(not value["hardware"] for value in values))

    def test_http_contract_and_origin_allowlist(self):
        sampler = Sampler(MockSensors(), "mock", "test-pi", interval=2)
        sampler.sample_once()
        from http.server import ThreadingHTTPServer
        server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(sampler, {"http://lab.test"}))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(thread.join, 2)
        self.addCleanup(server.shutdown)
        url = f"http://127.0.0.1:{server.server_port}/api/v1/readings"
        request = Request(url, headers={"Origin": "http://lab.test"})
        with urlopen(request) as response:
            payload = json.load(response)
            self.assertEqual(payload["contractVersion"], CONTRACT)
            self.assertEqual(payload["mode"], "mock")
            self.assertEqual(response.headers["Access-Control-Allow-Origin"], "http://lab.test")
        with self.assertRaises(HTTPError) as error:
            urlopen(Request(url, headers={"Origin": "http://other.test"}))
        self.assertEqual(error.exception.code, 403)
        error.exception.close()
        for method in ("POST", "PUT", "PATCH", "DELETE"):
            with self.assertRaises(HTTPError) as error:
                urlopen(Request(url, method=method))
            self.assertEqual(error.exception.code, 405)
            error.exception.close()
        with urlopen(Request(url, method="OPTIONS", headers={
            "Origin": "http://lab.test", "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Private-Network": "true",
        })) as response:
            self.assertEqual(response.headers["Access-Control-Allow-Private-Network"], "true")
        with self.assertRaises(HTTPError) as error:
            urlopen(Request(url, method="OPTIONS", headers={"Access-Control-Request-Method": "POST"}))
        self.assertEqual(error.exception.code, 405)
        error.exception.close()


if __name__ == "__main__":
    unittest.main()
