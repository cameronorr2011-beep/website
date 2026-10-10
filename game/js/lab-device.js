import { createRealDeviceProvider, SENSOR_DEFINITIONS, validateDeviceSnapshot } from "./lab-providers.js";
import { downloadText } from "./lab-store.js";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
const labels = Object.fromEntries(SENSOR_DEFINITIONS.map((item) => [item.key, item.label]));

// Telemetry deliberately lives outside saved/imported simulation state. Neither
// a model reset nor JSON import can initiate a device connection.
export function createDevicePanel(container) {
  const provider = createRealDeviceProvider();
  let draft = "";
  let endpoint = "";
  let polling = false;
  let timer = null;
  let session = 0;

  function currentSnapshot() {
    return provider.snapshot ? validateDeviceSnapshot(provider.snapshot) : null;
  }

  function resultsMarkup() {
    const snapshot = currentSnapshot();
    const fresh = snapshot?.readings.some((item) => ["ok", "simulated"].includes(item.quality));
    const status = snapshot ? fresh ? snapshot.mode === "mock" ? "SERVICE MOCK · SYNTHETIC" : "REAL SENSOR TELEMETRY" : "NO USABLE READINGS" : provider.status.toUpperCase();
    return `<div class="card-heading"><span class="badge ${snapshot?.mode === "real" && fresh ? "cyan" : "amber"}" id="deviceStatus">${status}</span></div>
      <p class="unit-note" role="status">${escapeHtml(provider.reason)}</p>
      ${snapshot ? `<p class="unit-note">Device: ${escapeHtml(snapshot.deviceId)} · sampled ${escapeHtml(snapshot.sampledAt)} · ${escapeHtml(snapshot.contractVersion)}</p>
      <div class="sensor-grid device-grid">${snapshot.readings.map((item) => `<div class="sensor-item" data-device-key="${item.key}" data-quality="${item.quality}">
        <span>${escapeHtml(labels[item.key])}</span><strong>${item.value === null ? "—" : item.value.toFixed(item.key === "turbidityAU" ? 3 : 2)}</strong>
        <small>${escapeHtml(item.unit)} · ${escapeHtml(item.quality)} · ${escapeHtml(item.provenance)}</small>
        <small>Calibration: ${escapeHtml(item.calibration?.status || "unavailable")}${item.calibration?.calibratedAt ? ` · ${escapeHtml(item.calibration.calibratedAt)}` : ""}</small>
        ${item.calibration?.reference ? `<small>${escapeHtml(item.calibration.reference)}</small>` : ""}
        ${Number.isFinite(item.raw?.voltage) ? `<small>ADC ${escapeHtml(item.raw.adcCount)} · ${item.raw.voltage.toFixed(4)} V</small>` : ""}
        ${item.reason ? `<small>${escapeHtml(item.reason)}</small>` : ""}
      </div>`).join("")}</div>` : `<div class="empty-state">No device readings. Synthetic model values remain in their own panel.</div>`}`;
  }

  function paint() {
    const results = container.querySelector("#deviceResults");
    if (results) results.innerHTML = resultsMarkup();
    const connect = container.querySelector("#connectDevice");
    const disconnect = container.querySelector("#disconnectDevice");
    const exportButton = container.querySelector("#exportDevice");
    if (connect) connect.disabled = polling;
    if (disconnect) disconnect.disabled = !polling;
    if (exportButton) exportButton.disabled = !provider.snapshot;
  }

  async function poll(currentSession) {
    if (!polling || currentSession !== session) return;
    await provider.read(endpoint);
    if (!polling || currentSession !== session) return;
    paint();
    timer = setTimeout(() => poll(currentSession), 5000);
  }

  function disconnect() {
    polling = false;
    session++;
    clearTimeout(timer);
    provider.disconnect();
    paint();
  }

  container.addEventListener("input", (event) => {
    if (event.target.id === "deviceEndpoint") draft = event.target.value;
  });
  container.addEventListener("click", (event) => {
    const id = event.target.closest("button")?.id;
    if (id === "connectDevice") {
      disconnect();
      endpoint = draft.trim();
      polling = true;
      poll(session);
      paint();
    }
    if (id === "disconnectDevice") disconnect();
    if (id === "exportDevice" && provider.snapshot) {
      downloadText("orr-device-snapshot.json", JSON.stringify({
        format: "orr-device-snapshot", version: 1, exportedAt: new Date().toISOString(),
        provenance: "archived device telemetry; not a live connection or simulation state",
        snapshot: currentSnapshot(),
      }, null, 2));
    }
  });
  // Age readings even while a request is stalled; background-tab timers resume
  // with a fresh age check. Never keep an old measurement labelled live.
  setInterval(paint, 1000);
  document.addEventListener("visibilitychange", paint);
  window.addEventListener("pagehide", disconnect);

  return {
    markup() {
      return `<div class="workspace-card device-panel" id="devicePanel">
        <div class="card-heading"><div><span class="eyebrow">Raspberry Pi 3 B+ · read-only connection</span><h3>Physical sensor telemetry</h3></div><span class="badge">OPT-IN</span></div>
        <p>Connect a Pi running the sensor service. This panel shows instrument readings separately from the synthetic cultivation model and its controls.</p>
        <label class="field-label" for="deviceEndpoint">Pi service base URL</label>
        <input class="field" id="deviceEndpoint" type="url" autocomplete="off" spellcheck="false" placeholder="https://algaephyte-pi.local" value="${escapeHtml(draft)}" aria-describedby="deviceHelp">
        <div class="action-row"><button class="action-btn cyan" id="connectDevice" type="button" ${polling ? "disabled" : ""}>Connect / test Pi</button><button class="action-btn secondary" id="disconnectDevice" type="button" ${polling ? "" : "disabled"}>Disconnect Pi</button><button class="action-btn secondary" id="exportDevice" type="button" ${provider.snapshot ? "" : "disabled"}>Export sensor snapshot</button></div>
        <p class="unit-note" id="deviceHelp">Polls every 5 seconds. HTTPS pages require a trusted HTTPS endpoint. Configure the service’s exact CORS origin and allow local-network access if prompted. <a href="/hardware/pi-sensors/README.md" target="_blank" rel="noopener">Pi setup and wiring</a></p>
        <div id="deviceResults">${resultsMarkup()}</div>
        <p class="unit-note">Analog probes need measured calibration references. DO is reported in mg/L, independently of the model’s % saturation. No pumps, heaters, or dosing outputs are exposed.</p>
      </div>`;
    },
  };
}
