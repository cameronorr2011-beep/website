/*
 * Optional persistence bridge for the local Node development service.
 *
 * The public game remains local-first: no request is made unless the player
 * explicitly supplies an API base URL in ?api=... or localStorage. Keeping
 * this boundary explicit prevents a static deployment from pretending that a
 * server-backed account or cloud database exists.
 */

const CONFIG_KEY = "orr-biologicals-game-api";

function configuredBaseUrl() {
  try {
    const queryValue = new URLSearchParams(globalThis.location?.search || "").get("api");
    const storedValue = globalThis.localStorage?.getItem(CONFIG_KEY);
    const value = String(queryValue || storedValue || "").trim();
    return value ? value.replace(/\/$/, "") : "";
  } catch {
    return "";
  }
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.error || `Backend request failed (${response.status})`);
  return body;
}

export function backendStatus() {
  const baseUrl = configuredBaseUrl();
  return { configured: Boolean(baseUrl), baseUrl: baseUrl || null, label: baseUrl ? "optional dev backend" : "local browser only" };
}

export async function checkBackend() {
  const { baseUrl } = backendStatus();
  if (!baseUrl) return { configured: false, connected: false, label: "local browser only" };
  const health = await request(baseUrl, "/health");
  return { configured: true, connected: health.ok === true, label: "optional dev backend", health };
}

export async function saveBackendState(playerId, state) {
  const { baseUrl } = backendStatus();
  if (!baseUrl) throw new Error("No optional backend is configured. Add ?api=http://127.0.0.1:8787 to enable it.");
  return request(baseUrl, `/api/state/${encodeURIComponent(playerId)}`, { method: "PUT", body: JSON.stringify(state) });
}

export async function loadBackendState(playerId) {
  const { baseUrl } = backendStatus();
  if (!baseUrl) throw new Error("No optional backend is configured.");
  return request(baseUrl, `/api/state/${encodeURIComponent(playerId)}`);
}

export function rememberBackendUrl(value) {
  const normalized = String(value || "").trim().replace(/\/$/, "");
  try {
    if (normalized) globalThis.localStorage?.setItem(CONFIG_KEY, normalized);
    else globalThis.localStorage?.removeItem(CONFIG_KEY);
  } catch {
    // The game still works as a local-only application when storage is blocked.
  }
  return backendStatus();
}
