// Orr Biologicals — static site Worker.
//
// The canonical URLs are extension-less ("/algae", "/culturekits"), matching the
// .htaccess clean-URL rules on orrbiologicals.com. Workers Assets rewrites an
// .html request to the extension-less path with a 307, so this Worker keeps the
// clean URL at 200, sends .html to it with a permanent redirect, and serves the
// styled 404 page.

const HTML_CACHE = "public, max-age=300, must-revalidate";
const ASSET_CACHE = "public, max-age=31536000, immutable";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

// Pages that were renamed. A permanent redirect keeps old links, bookmarks and
// search results working after the move.
const LEGACY_PATHS = {
  "/hatcheries": "/algae",
  "/kits": "/culturekits",
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

    // Home is "/", never "/index.html".
    if (pathname === "/index.html" || pathname === "/index") {
      return Response.redirect(new URL("/", url).toString(), 301);
    }

    // Renamed pages keep their old URLs alive as permanent redirects.
    const legacyTarget = LEGACY_PATHS[pathname.replace(/\/$/, "")];
    if (legacyTarget) {
      return Response.redirect(new URL(legacyTarget, url).toString(), 301);
    }

    // A directory index is the trailing-slash URL: "/articles/", not
    // "/articles/index.html".
    if (pathname.endsWith("/index.html")) {
      url.pathname = pathname.slice(0, -"index.html".length);
      return Response.redirect(url.toString(), 301);
    }

    // ".html" is not the canonical form anywhere on the site.
    if (pathname.endsWith(".html")) {
      url.pathname = pathname.slice(0, -5);
      return Response.redirect(url.toString(), 301);
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      // Resolve clean URLs explicitly rather than relying on the asset layer's
      // single guess: "/articles/foo" is served by "articles/foo.html", and
      // "/articles/" by "articles/index.html".
      if (!/\.[a-z0-9]+$/i.test(pathname)) {
        const html = await asset(request, env, `${pathname}.html`);
        if (html.status === 200) return withHeaders(html, url);

        const dir = pathname.replace(/\/$/, "");
        const index = await asset(request, env, `${dir}/index.html`);
        if (index.status === 200) return withHeaders(index, url);
      }
      return notFound(request, env);
    }

    return withHeaders(response, url);
  },
};
