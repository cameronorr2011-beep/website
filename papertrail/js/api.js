const API_PREFIX = "/api/papertrail/v1";
const DEFAULT_TIMEOUT_MS = 10_000;
const EVENT_TYPES = [
  "stage_change",
  "agent_start",
  "agent_completion",
  "agent_error",
  "retry",
  "source_retrieval",
  "audit",
  "report",
  "error",
  "cancel_requested",
  "run_interrupted",
];
const TERMINAL_STATUSES = new Set(["COMPLETED", "PARTIAL", "CANCELLED", "FAILED"]);

export function normalizeApiBase(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return { ok: true, value: "" };
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, value: "", error: "Enter a complete http(s) API base URL." };
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, value: "", error: "The API base must use http:// or https://." };
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    return { ok: false, value: "", error: "The API base may not contain credentials, query parameters, or fragments." };
  }
  return { ok: true, value: `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}` };
}

function isTerminal(status) {
  return TERMINAL_STATUSES.has(String(status ?? "").toUpperCase());
}

function sessionPath(sessionId, suffix = "") {
  return `${API_PREFIX}/sessions/${encodeURIComponent(String(sessionId))}${suffix}`;
}

function messageFrom(data, fallback) {
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
  if (typeof data?.error === "string" && data.error.trim()) return data.error.trim();
  return fallback;
}

function parseJsonText(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { text: String(text).slice(0, 2_000) };
  }
}

export function createApiTransport(options = {}) {
  const normalized = normalizeApiBase(options.baseUrl);
  const baseUrl = normalized.ok ? normalized.value : "";
  const configured = Boolean(baseUrl);
  const timeoutMs = Number.isFinite(Number(options.timeoutMs))
    ? Math.max(1_000, Math.min(60_000, Math.trunc(Number(options.timeoutMs))))
    : DEFAULT_TIMEOUT_MS;

  function unavailable() {
    return {
      ok: false,
      status: "not-configured",
      data: null,
      message: "Live mode is unavailable until a backend is configured.",
    };
  }

  async function request(pathname, init = {}) {
    if (!configured) return unavailable();
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = controller ? globalThis.setTimeout(() => controller.abort(), timeoutMs) : null;
    const url = `${baseUrl}${API_PREFIX}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
    try {
      const response = await fetch(url, {
        method: init.method || "GET",
        headers: {
          Accept: "application/json",
          ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        credentials: "omit",
        signal: controller?.signal,
      });
      const text = await response.text();
      const data = parseJsonText(text);
      return {
        ok: response.ok,
        status: response.status,
        data,
        message: response.ok ? "Backend responded." : messageFrom(data, `Backend returned HTTP ${response.status}.`),
      };
    } catch (error) {
      const message = error?.name === "AbortError"
        ? "The configured backend did not respond before the request timeout."
        : error instanceof Error ? error.message : "Configured backend could not be reached.";
      return { ok: false, status: "unavailable", data: null, message };
    } finally {
      if (timeout) globalThis.clearTimeout(timeout);
    }
  }

  function getHealth() {
    return request("/health");
  }

  function getModels() {
    return request("/models");
  }

  function createSession(input = {}) {
    const body = typeof input === "string" ? { question: input } : input;
    return request("/sessions", { method: "POST", body });
  }

  function getSession(sessionId) {
    return request(sessionPath(sessionId));
  }

  function startRun(sessionId, optionsOrBody = {}) {
    const body = optionsOrBody && optionsOrBody.options
      ? optionsOrBody
      : { options: optionsOrBody || {} };
    return request(sessionPath(sessionId, "/run"), { method: "POST", body });
  }

  function cancel(sessionId) {
    return request(sessionPath(sessionId, "/cancel"), { method: "POST" });
  }

  function subscribeEvents(sessionId, options = {}) {
    if (!configured) {
      options.onError?.({ message: unavailable().message, status: "not-configured" });
      return { close() {}, getLastEventId: () => Number(options.after) || 0, mode: "unavailable" };
    }

    let closed = false;
    let eventSource = null;
    let reconnectTimer = null;
    let pollTimer = null;
    let lastEventId = Number.isSafeInteger(Number(options.after)) ? Math.max(0, Number(options.after)) : 0;
    let reconnectAttempts = 0;
    let pollAttempts = 0;
    let pollFailures = 0;
    let polling = false;
    const maxReconnects = Math.min(3, Math.max(0, Number.isFinite(Number(options.maxReconnects)) ? Math.trunc(Number(options.maxReconnects)) : 3));
    const maxPolls = Math.max(1, Math.min(240, Number.isFinite(Number(options.maxPolls)) ? Math.trunc(Number(options.maxPolls)) : 120));
    const maxPollFailures = 3;
    const pollIntervalMs = Math.max(250, Math.min(10_000, Number.isFinite(Number(options.pollIntervalMs)) ? Math.trunc(Number(options.pollIntervalMs)) : 1_000));

    const close = () => {
      if (closed) return;
      closed = true;
      if (eventSource) eventSource.close();
      eventSource = null;
      if (reconnectTimer) globalThis.clearTimeout(reconnectTimer);
      if (pollTimer) globalThis.clearTimeout(pollTimer);
      reconnectTimer = null;
      pollTimer = null;
      options.onStatus?.({ mode: "closed", lastEventId });
    };

    const notifyEvent = (event) => {
      if (closed || !event || typeof event !== "object") return;
      const numericId = Number(event.id ?? event.lastEventId);
      if (Number.isSafeInteger(numericId) && numericId <= lastEventId) return;
      if (Number.isSafeInteger(numericId)) lastEventId = numericId;
      options.onEvent?.(event);
       const status = event.payload?.status ?? event.session?.status;
       if (event.type === "stage_change" && isTerminal(status)) {
        options.onTerminal?.(String(status).toUpperCase(), event);
        close();
      }
    };

    const parseSseEvent = (event) => {
      if (!event?.data) return null;
      try {
        const value = JSON.parse(event.data);
        if (value && typeof value === "object") {
          if (value.id === undefined && event.lastEventId) value.id = Number(event.lastEventId);
          return value;
        }
      } catch {
        options.onError?.({ message: "The live event stream returned malformed event data.", status: "malformed_event" });
      }
      return null;
    };

    const startPolling = (reason) => {
      if (closed || polling) return;
      polling = true;
      options.onStatus?.({ mode: "polling", reason, lastEventId });
      const poll = async () => {
        if (closed) return;
        pollAttempts += 1;
        if (pollAttempts > maxPolls) {
          options.onError?.({ message: "Live polling stopped after the bounded retry window.", status: "poll_limit" });
          close();
          return;
        }
        const result = await getSession(sessionId);
        if (!result.ok) {
          pollFailures += 1;
          options.onError?.({ message: result.message, status: result.status });
          if (pollFailures >= maxPollFailures) {
            close();
            return;
          }
        } else {
          pollFailures = 0;
          const bundle = result.data;
          for (const event of Array.isArray(bundle?.events) ? bundle.events : []) notifyEvent(event);
          options.onBundle?.(bundle);
          if (isTerminal(bundle?.session?.status)) {
            options.onTerminal?.(String(bundle.session.status).toUpperCase(), bundle);
            close();
            return;
          }
        }
        if (!closed) pollTimer = globalThis.setTimeout(poll, pollIntervalMs);
      };
      void poll();
    };

    const handleStreamFailure = (event) => {
      if (closed) return;
      if (event?.data) {
        const customEvent = parseSseEvent(event);
        if (customEvent) notifyEvent(customEvent);
        return;
      }
      if (eventSource) eventSource.close();
      eventSource = null;
      if (reconnectAttempts >= maxReconnects) {
        startPolling("sse_reconnect_limit");
        return;
      }
      const attempt = reconnectAttempts;
      reconnectAttempts += 1;
      const delay = Math.min(4_000, 500 * (2 ** attempt));
      options.onStatus?.({ mode: "reconnecting", attempt: reconnectAttempts, maxAttempts: maxReconnects, delay, lastEventId });
      reconnectTimer = globalThis.setTimeout(startEventSource, delay);
    };

    function startEventSource() {
      if (closed) return;
      if (typeof globalThis.EventSource !== "function") {
        startPolling("eventsource_unavailable");
        return;
      }
      const url = `${baseUrl}${API_PREFIX}/sessions/${encodeURIComponent(String(sessionId))}/events?after=${encodeURIComponent(String(lastEventId))}`;
      try {
        eventSource = new globalThis.EventSource(url, { withCredentials: false });
      } catch (error) {
        options.onError?.({ message: error instanceof Error ? error.message : "The live event stream could not start.", status: "eventsource_error" });
        startPolling("eventsource_error");
        return;
      }
      options.onStatus?.({ mode: "sse", reconnectAttempts, lastEventId });
      const handleNamedEvent = (event) => {
        const parsed = parseSseEvent(event);
        if (parsed) notifyEvent(parsed);
      };
      for (const eventType of EVENT_TYPES) eventSource.addEventListener(eventType, handleNamedEvent);
      eventSource.onopen = () => options.onStatus?.({ mode: "sse", reconnectAttempts, lastEventId });
      eventSource.onerror = handleStreamFailure;
    }

    startEventSource();
    return {
      close,
      getLastEventId: () => lastEventId,
      mode: typeof globalThis.EventSource === "function" ? "sse" : "polling",
    };
  }

  return {
    configured,
    baseUrl,
    error: normalized.ok ? "" : normalized.error,
    getHealth,
    getModels,
    createSession,
    getSession,
    startRun,
    cancel,
    subscribeEvents,
    checkHealth: getHealth,
  };
}

export { API_PREFIX };
