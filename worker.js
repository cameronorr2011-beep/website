// Orr Biologicals — static site Worker.
//
// Workers Assets rewrites "/hatcheries.html" to "/hatcheries" with a 307, which
// would make every canonical URL a redirect. This Worker keeps the .html URL as
// the canonical response (200), redirects only extensionless aliases that
// actually exist, and serves the styled 404 page for everything else.

const HTML_CACHE = "public, max-age=300, must-revalidate";
const ASSET_CACHE = "public, max-age=31536000, immutable";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

function secureHeaders(source, extra = {}) {
  const headers = new Headers(source);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return headers;
}

function withHeaders(response, url) {
  const headers = secureHeaders(response.headers);

  if (/\.(?:css|svg|png|jpg|jpeg|webp|woff2?)$/i.test(url.pathname)) {
    headers.set("Cache-Control", ASSET_CACHE);
  } else if (headers.get("content-type")?.includes("text/html")) {
    headers.set("Cache-Control", HTML_CACHE);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Fetch a path through ASSETS without letting the platform redirect it.
async function asset(request, env, path) {
  const url = new URL(request.url);
  url.pathname = path;
  return env.ASSETS.fetch(new Request(url.toString(), request));
}

async function notFound(request, env) {
  const page = await asset(request, env, "/404");
  return new Response(page.body, {
    status: 404,
    headers: secureHeaders(page.headers, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    }),
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/internal" || pathname.startsWith("/internal/")) {
      return new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    // Canonical home is "/".
    if (pathname === "/index.html") {
      return Response.redirect(new URL("/", url).toString(), 301);
    }

    // Extensionless alias -> canonical .html URL, but only if the page exists.
    if (pathname !== "/" && !/\.[a-z0-9]+$/i.test(pathname)) {
      const probe = await asset(request, env, pathname.replace(/\/$/, ""));
      if (probe.status !== 200) return notFound(request, env);
      url.pathname = `${pathname.replace(/\/$/, "")}.html`;
      return Response.redirect(url.toString(), 301);
    }

    let response;
    if (pathname.endsWith(".html")) {
      // Ask ASSETS for the extensionless path, which it serves, and answer at
      // the .html URL so the canonical URL is not a redirect.
      response = await asset(request, env, pathname.slice(0, -5) || "/");
    } else {
      response = await env.ASSETS.fetch(request);
    }

    if (response.status === 404) return notFound(request, env);

    return withHeaders(response, url);
  },
};
