import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// The site itself is plain HTML. React is built as one small, un-hashed ES
// module so site.js can import it only after the page is idle, and only on
// wide screens where the parallax treatment is actually shown.
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    outDir: resolve(here, '../assets'),
    emptyOutDir: false,
    target: 'es2020',
    minify: 'oxc',
    sourcemap: false,
    manifest: false,
    lib: {
      entry: resolve(here, 'src/parallax.jsx'),
      formats: ['es'],
      fileName: () => 'parallax.js'
    }
  }
});
