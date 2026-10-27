/* Static deployment build for the Cyanoflow game. */
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await rm(path.join(root, 'game/dist'), { recursive: true, force: true });
await mkdir(path.join(root, 'game/dist'), { recursive: true });
const result = await build({
  absWorkingDir: root,
  entryPoints: ['game/js/biorealm-app.js'],
  outdir: 'game/dist',
  bundle: true,
  splitting: true,
  format: 'esm',
  target: ['es2022'],
  minify: true,
  metafile: true,
  entryNames: 'cyanoflow-[hash]',
  chunkNames: 'chunk-[hash]',
  legalComments: 'linked',
});
const entry = Object.entries(result.metafile.outputs)
  .find(([, value]) => value.entryPoint === 'game/js/biorealm-app.js')?.[0];
if (!entry) throw new Error('Cyanoflow game entry bundle was not produced');
const indexPath = path.join(root, 'game/index.html');
const html = await readFile(indexPath, 'utf8');
const marker = /<script type="module" src="[^"]+"><\/script>/;
if (!marker.test(html)) throw new Error('game/index.html bundle marker was not found');
const updated = html.replace(marker,
  `<script type="module" src="${entry.replace('game/', '')}"></script>`);
await writeFile(indexPath, updated);
console.log(`Built ${entry}; ${Object.keys(result.metafile.outputs).length} self-hosted assets.`);
