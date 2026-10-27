import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 8080);
const TYPES = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"], [".svg", "image/svg+xml"],
  [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".png", "image/png"],
  [".webp", "image/webp"], [".txt", "text/plain; charset=utf-8"],
]);

function safePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl || "/", "http://localhost").pathname);
  const blocked = /^(?:\/(?:server|tools|docs|sections|apps|node_modules|\.git|culturetrace)(?:\/|$)|\/(?:\.env|\.gitignore|\.gitattributes)(?:$|\/))/i;
  if (blocked.test(pathname)) return null;
  const relative = pathname.replace(/^\/+/, "");
  const candidate = path.resolve(ROOT, relative);
  if (candidate !== ROOT && !candidate.startsWith(`${ROOT}${path.sep}`)) return null;
  return candidate;
}

async function resolveFile(candidate) {
  if (!candidate) return null;
  try {
    const info = await stat(candidate);
    if (info.isFile()) return candidate;
    if (info.isDirectory()) return resolveFile(path.join(candidate, "index.html"));
  } catch {}
  return path.extname(candidate) ? null : resolveFile(`${candidate}.html`);
}

const server = http.createServer(async (request, response) => {
  try {
    const file = await resolveFile(safePath(request.url));
    if (!file) { response.writeHead(404); response.end("Not found\n"); return; }
    const contentType = TYPES.get(path.extname(file).toLowerCase()) || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType, "X-Content-Type-Options": "nosniff" });
    createReadStream(file).on("error", () => response.destroy()).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
  }
});

server.listen(PORT, HOST, () => console.log(`Orr Biologicals static site at http://${HOST}:${PORT}`));
