'use strict';

// Dependency-free Node server for the static site.
//
// It serves dist/ with the same URL contract as worker.js: clean URLs,
// permanent redirects from .html and legacy paths, a real 404, gzip for text,
// conservative cache headers and security headers. Keeping it dependency-free
// means `npm start` works without installing the site build toolchain.

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, process.env.SERVE_ROOT || 'dist');
const port = Number(process.env.PORT || 3000);

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

const LEGACY = {
  '/hatcheries': '/algae',
  '/kits': '/culturekits'
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function headers(extra) {
  return Object.assign({}, SECURITY, extra || {});
}

function redirect(res, location) {
  const body = `Moved Permanently: ${location}\n`;
  res.writeHead(301, headers({
    Location: location,
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  }));
  res.end(body);
}

function text(res, status, body, extra) {
  res.writeHead(status, headers(Object.assign({
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  }, extra || {})));
  res.end(body);
}

function cacheFor(ext) {
  if (ext === '.html') return 'public, max-age=300, must-revalidate';
  if (ext === '.css' || ext === '.js') return 'public, max-age=3600, must-revalidate';
  if (ext === '.woff' || ext === '.woff2') return 'public, max-age=31536000, immutable';
  if (['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'].includes(ext)) return 'public, max-age=86400';
  return 'public, max-age=3600';
}

async function serveFile(req, res, file) {
  let stat;
  try {
    stat = await fsp.stat(file);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;

  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const compressible = /^(text\/|application\/(?:javascript|json|xml)|image\/svg\+xml)/.test(type);
  const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  const useGzip = compressible && acceptsGzip && stat.size > 1024;

  const responseHeaders = headers({
    'Content-Type': type,
    'Cache-Control': cacheFor(ext),
    'Last-Modified': stat.mtime.toUTCString(),
    'Vary': 'Accept-Encoding'
  });

  if (req.method === 'HEAD') {
    if (useGzip) responseHeaders['Content-Encoding'] = 'gzip';
    else responseHeaders['Content-Length'] = stat.size;
    res.writeHead(200, responseHeaders);
    res.end();
    return true;
  }

  if (useGzip) {
    responseHeaders['Content-Encoding'] = 'gzip';
    res.writeHead(200, responseHeaders);
    fs.createReadStream(file)
      .on('error', () => res.destroy())
      .pipe(zlib.createGzip({ level: 6 }))
      .on('error', () => res.destroy())
      .pipe(res);
  } else {
    responseHeaders['Content-Length'] = stat.size;
    res.writeHead(200, responseHeaders);
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  }
  return true;
}

async function notFound(req, res) {
  let body;
  try {
    body = await fsp.readFile(path.join(root, '404.html'));
  } catch {
    body = Buffer.from('Not found\n');
  }
  res.writeHead(404, headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
    'Content-Length': body.length
  }));
  if (req.method === 'HEAD') res.end();
  else res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return text(res, 405, 'Method Not Allowed\n', { Allow: 'GET, HEAD' });
    }

    const url = new URL(req.url, 'http://localhost');
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return text(res, 400, 'Bad Request\n');
    }

    if (pathname.includes('\0')) return text(res, 400, 'Bad Request\n');

    if (pathname === '/internal' || pathname.startsWith('/internal/')) {
      return notFound(req, res);
    }

    if (pathname === '/index.html' || pathname === '/index') {
      return redirect(res, '/');
    }

    if (pathname === '/articles') {
      return redirect(res, '/articles/' + url.search);
    }

    if (pathname === '/404') {
      return notFound(req, res);
    }

    const clean = pathname.replace(/\/$/, '') || '/';
    if (LEGACY[clean]) {
      return redirect(res, LEGACY[clean]);
    }

    if (pathname.endsWith('/index.html')) {
      return redirect(res, pathname.slice(0, -'index.html'.length) + url.search);
    }

    if (pathname.endsWith('.html')) {
      return redirect(res, pathname.slice(0, -5) + url.search);
    }

    let relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    if (relative.endsWith('/')) relative += 'index.html';

    const file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(root + path.sep)) {
      return notFound(req, res);
    }

    if (await serveFile(req, res, file)) return;

    if (!path.extname(relative) && await serveFile(req, res, file + '.html')) return;

    if (await serveFile(req, res, path.join(file, 'index.html'))) return;

    return notFound(req, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) text(res, 500, 'Internal Server Error\n');
    else res.destroy();
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Orr Biologicals listening on http://0.0.0.0:${port} (${root})`);
});
