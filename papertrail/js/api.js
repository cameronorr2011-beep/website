function normalizeBase(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function createApiTransport(options = {}) {
  const baseUrl = normalizeBase(options.baseUrl);
  const configured = Boolean(baseUrl);

  async function request(pathname, init = {}) {
    if (!configured) {
      return {
        ok: false,
        status: "not-configured",
        message: "Live mode is unavailable until a backend is configured.",
      };
    }

    try {
      const response = await fetch(`${baseUrl}${pathname}`, {
        method: init.method || "GET",
        headers: {
          Accept: "application/json",
          ...(init.body ? { "Content-Type": "application/json" } : {}),
        },
        body: init.body ? JSON.stringify(init.body) : undefined,
        credentials: "omit",
      });
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { text };
      }
      return {
        ok: response.ok,
        status: response.status,
        data,
        message: response.ok ? "Backend responded." : `Backend returned HTTP ${response.status}.`,
      };
    } catch (error) {
      return {
        ok: false,
        status: "unavailable",
        message: error instanceof Error ? error.message : "Configured backend could not be reached.",
      };
    }
  }

  return {
    configured,
    baseUrl,
    checkHealth: () => request("/health"),
    sendSession: (session) => request("/papertrail/session", { method: "POST", body: session }),
  };
}
