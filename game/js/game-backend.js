/*
 * Optional persistence bridge for the local Node development service.
 *
 * The public game remains local-first: no request is made unless the player
 * explicitly supplies an API base URL in ?api=... or localStorage. Keeping
 * this boundary explicit prevents a static deployment from pretending that a
 * server-backed account or cloud database exists.
 */

const CONFIG_KEY = "orr-biologicals-game-api";
const API_KEY_STORAGE = "orr-biologicals-game-api-key";

function configuredBaseUrl() {
  try {
    const queryValue = new URLSearchParams(globalThis.location?.search || "").get("api");
    const queryKey = new URLSearchParams(globalThis.location?.search || "").get("apiKey");
    const storedValue = globalThis.localStorage?.getItem(CONFIG_KEY);
    const storedKey = globalThis.sessionStorage?.getItem(API_KEY_STORAGE);
    const value = String(queryValue || storedValue || "").trim();
    return { url: value ? value.replace(/\/$/, "") : "", key: String(queryKey || storedKey || "").trim() };
  } catch {
    return { url: "", key: "" };
  }
}

async function request(baseUrl, path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const { key } = configuredBaseUrl();
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
    ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(key ? { "X-API-Key": key } : {}), ...(options.headers || {}) },
    });
  } catch (error) {
    throw new Error(error?.name === "AbortError" ? "Backend request timed out after 8 seconds." : `Backend could not be reached: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.error || `Backend request failed (${response.status})`);
  return body;
}

export function backendStatus() {
  const { url, key } = configuredBaseUrl();
  return { configured: Boolean(url), baseUrl: url || null, keyConfigured: Boolean(key), label: url ? "optional dev backend" : "local browser only" };
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

export function rememberBackendKey(value) {
  const normalized = String(value || "").trim();
  try {
    if (normalized) globalThis.sessionStorage?.setItem(API_KEY_STORAGE, normalized);
    else globalThis.sessionStorage?.removeItem(API_KEY_STORAGE);
  } catch {
    // Session storage is optional; the endpoint can still be public/local.
  }
  return backendStatus();
}
