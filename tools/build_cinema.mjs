import { build } from "esbuild";

await build({
  entryPoints: ["js/biological-cinema.mjs"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  minify: true,
  outfile: "js/biological-cinema.js",
  legalComments: "external",
});
console.log("Built js/biological-cinema.js from the local Three.js dependency");
