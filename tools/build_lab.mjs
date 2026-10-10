// Static deployment: committed, content-hashed bundles; no Node runtime on Hostinger.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(path.join(root, 'game/dist'), { recursive: true });
const result = await build({
  absWorkingDir: root, entryPoints: ['game/js/lab-app.js'], outdir: 'game/dist',
  bundle: true, splitting: true, format: 'esm', target: ['es2022'],
  minify: true, metafile: true, entryNames: 'lab-[hash]', chunkNames: 'chunk-[hash]',
  legalComments: 'linked',
});
const entry = Object.entries(result.metafile.outputs).find(([, value]) => value.entryPoint === 'game/js/lab-app.js')[0];
const indexPath = path.join(root, 'game/index.html');
const html = await readFile(indexPath, 'utf8');
await writeFile(indexPath, html.replace(/<script type="module" src="(?:js\/lab-app\.js|dist\/lab-[^"]+\.js)"><\/script>/,
  `<script type="module" src="${entry.replace('game/', '')}"></script>`));
// Keep older hashed files for previously open tabs; no cache race during deployment.
console.log(`Built ${entry}; ${Object.keys(result.metafile.outputs).length} self-hosted assets.`);
