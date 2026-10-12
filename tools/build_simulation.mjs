// Static deployment bundle for /Simulation. The host serves committed assets;
// it does not need Node, a database, or a runtime build step.
import { build } from "esbuild";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outdir = path.join(root, "Simulation", "dist");
await mkdir(outdir, { recursive: true });

const result = await build({
  absWorkingDir: root,
  entryPoints: ["Simulation/js/simulation-app.js"],
  outdir: "Simulation/dist",
  bundle: true,
  splitting: true,
  format: "esm",
  target: ["es2022"],
  minify: true,
  metafile: true,
  entryNames: "simulation-[hash]",
  chunkNames: "chunk-[hash]",
  legalComments: "linked",
});

const entry = Object.entries(result.metafile.outputs).find(([, value]) => value.entryPoint === "Simulation/js/simulation-app.js")?.[0];
if (!entry) throw new Error("Simulation entry bundle was not produced.");
const produced = new Set(Object.keys(result.metafile.outputs).map((file) => path.basename(file)));
for (const filename of await readdir(outdir)) {
  if (/^(?:simulation|chunk)-/.test(filename) && !produced.has(filename)) await unlink(path.join(outdir, filename));
}
const indexPath = path.join(root, "Simulation", "index.html");
const html = await readFile(indexPath, "utf8");
const nextSrc = entry.replace("Simulation/", "");
const marker = 'src="dist/simulation-';
const markerStart = html.indexOf(marker);
let updated = html;
if (markerStart >= 0) {
  const sourceStart = markerStart + 5;
  const sourceEnd = html.indexOf('"', sourceStart);
  if (sourceEnd > sourceStart) updated = html.slice(0, sourceStart) + nextSrc + html.slice(sourceEnd);
} else {
  updated = html.replace("dist/simulation-PLACEHOLDER.js", nextSrc);
}
if (updated === html && !html.includes(`src="${nextSrc}"`)) throw new Error("Simulation HTML does not contain a replaceable bundle reference.");
await writeFile(indexPath, updated);
console.log(`Built ${entry}; ${Object.keys(result.metafile.outputs).length} self-hosted assets.`);
