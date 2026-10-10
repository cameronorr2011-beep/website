# Orr Biologicals Pi sensor service

This is a small **read-only** HTTP bridge for the Algaephyte research lab. It
supports a Raspberry Pi 3 B+ and deliberately does not import the existing
Algaephyte `HardwareDriver`: that driver owns pumps and starts aeration during
initialization. This service touches only the DS18B20 1-Wire filesystem and the
MCP3008 SPI ADC.

## Contract

The browser calls:

```text
GET /api/v1/readings
```

The response is versioned as `sensor-provider-1.0` and contains four channels:

| Key | Unit | Source |
|---|---|---|
| `temperatureC` | °C | DS18B20 on 1-Wire GPIO4 |
| `ph` | pH | MCP3008 channel 0, two-point calibration required |
| `turbidityAU` | AU | MCP3008 channel 1, two-point calibration required |
| `dissolvedOxygenMgL` | mg/L | Optional MCP3008 channel 3, disabled by default |

Every channel has a quality state. `ok` means a finite, in-range reading with
calibration metadata. `uncalibrated`, `unavailable`, `invalid`, `stale`, and
`simulated` are never displayed as a real usable measurement. The browser
rejects unknown versions, units, keys, provenance, and mixed real/synthetic
claims. Readings older than 15 seconds or over 5 seconds in the future are
marked stale and their values hidden. Analog calibration needs actual reference
metadata and two distinct measured points, not just a `configured` label.

`POST`, `PUT`, `PATCH`, and `DELETE` return 405. There are no actuator routes.

## Wiring

Use BCM numbering and a common ground. The Pi GPIO is **3.3 V only**.

| Device | Connection |
|---|---|
| DS18B20 data | GPIO4, with a 4.7 kΩ pull-up to 3.3 V |
| MCP3008 VDD/VREF | 3.3 V |
| MCP3008 AGND/DGND | GND |
| MCP3008 CLK | GPIO11 / physical pin 23 |
| MCP3008 DOUT | GPIO9 / physical pin 21 |
| MCP3008 DIN | GPIO10 / physical pin 19 |
| MCP3008 CS | GPIO8 / CE0 / physical pin 24 |
| pH output | MCP3008 CH0, never directly to Pi GPIO |
| turbidity/OD output | MCP3008 CH1, never directly to Pi GPIO |
| optional DO output | MCP3008 CH3, never directly to Pi GPIO |

Confirm that each analog board's output is within the ADC reference range before
connecting it. Do not power 5 V analog output boards into the ADC without a
proper level-safe signal stage.

Enable the interfaces on Raspberry Pi OS:

```sh
sudo raspi-config  # Interface Options: SPI and 1-Wire
sudo reboot
ls /dev/spidev0.0
ls /sys/bus/w1/devices/28-*/w1_slave
```

## Installation

Copy this directory to `/opt/orr-sensors`, create a service account, and use a
Python virtual environment if `spidev` is not already installed:

```sh
sudo useradd --system --home /opt/orr-sensors --shell /usr/sbin/nologin orr-sensors
sudo usermod -aG spi orr-sensors
sudo mkdir -p /etc/orr-sensors
sudo cp config.example.json /etc/orr-sensors/config.json
sudo python3 -m venv /opt/orr-sensors/.venv
sudo /opt/orr-sensors/.venv/bin/pip install spidev
```

Set one `temperatureSensorId` after checking the 1-Wire directory. Keep analog
channels disabled until calibrated (all analog channels start disabled in the
example config). Set each needed channel's `enabled` to `true` only after wiring
and calibration are ready. Restart the service after changing config.
Use the example service unit, changing
`ExecStart` to `/opt/orr-sensors/.venv/bin/python` if needed:

```sh
sudo cp orr-sensors.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now orr-sensors
curl http://127.0.0.1:8765/api/v1/health
```

For a laptop-only contract check, run the service in mock mode:

```sh
python3 sensor_service.py --mode mock --host 127.0.0.1 --allow-origin http://127.0.0.1:8876
```

## Calibration

The service refuses to call an analog channel `ok` unless `config.json` has two
measured voltage/value points, a reference description, and a past timezone-aware
`calibratedAt` timestamp. Record the real buffer/reference solution and voltage
in the config; do not use the site's synthetic values as calibration data.

Check the result at the browser panel. A rail reading (`0` or `1023`) is marked
invalid because it commonly indicates a wiring, power, or range fault.

## Browser/network requirements

- The live HTTPS lab needs a Pi endpoint served over HTTPS with a certificate
  trusted by the browser. An HTTP Pi URL will be blocked as mixed content.
- The Pi must allow the exact page origin with `--allow-origin
  https://orrbiologicals.com`; do not use `*`.
- The browser may ask for local-network permission. The Pi and client must be
  on the same reachable LAN/VPN; never expose this unauthenticated service to
  the public internet.
- The included HTTP server is intentionally a small LAN bridge, not an internet
  gateway. Put it behind a private network and a TLS reverse proxy when the
  live HTTPS page needs to connect to it. The systemd unit binds to loopback by
  default so a same-Pi TLS reverse proxy can forward to `127.0.0.1:8765`. For
  HTTP-only development on a trusted LAN, explicitly add `--host <Pi LAN IP>`;
  never bind or forward it onto the public internet.
- The synthetic provider remains the default. Connecting the Pi does not change
  simulation parameters, actuators, saved state, or experiment reports.
