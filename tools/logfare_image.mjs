// Logfare image agent: renders a batch of prompts through Logfare's
// OpenAI-compatible image endpoint and writes the images to disk.
//
//   node tools/logfare_image.mjs --jobs tools/algae-news-images.json
//
// Jobs file: [{ "prompt": "...", "out": "assets/algae-news/name.jpg" }]
// Env: LOGFARE_API_KEY (shell or .env.local), LOGFARE_IMAGE_MODEL
//      (default flux-2-dev), LOGFARE_IMAGE_SIZE (default 1024x768),
//      LOGFARE_CONCURRENCY (default 4)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "https://logfare.ai/v1/images/generations";
const MODEL = process.env.LOGFARE_IMAGE_MODEL || "flux-2-dev";
const SIZE = process.env.LOGFARE_IMAGE_SIZE || "1024x768";
const CONCURRENCY = Number(process.env.LOGFARE_CONCURRENCY || 4);

const args = process.argv.slice(2);
const jobsIndex = args.indexOf("--jobs");
if (jobsIndex === -1 || !args[jobsIndex + 1]) {
  console.error("Usage: node tools/logfare_image.mjs --jobs <jobs.json>");
  process.exit(2);
}

async function loadEnvFile(file) {
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match || process.env[match[1]] !== undefined) continue;
    const raw = match[2].trim();
    const value = /^(['"`]).*\1$/.test(raw) ? raw.slice(1, -1) : raw.replace(/\s+#.*$/, "");
    if (value) process.env[match[1]] = value;
  }
}

await loadEnvFile(path.join(ROOT, ".env.local"));
await loadEnvFile(path.join(ROOT, ".env"));

const apiKey = process.env.LOGFARE_API_KEY || process.env.logfare_api_key || process.env.lOGFAREAPIKEY;
if (!apiKey) {
  console.error("LOGFARE_API_KEY is not set (shell or .env.local).");
  process.exit(1);
}

const jobs = JSON.parse(await readFile(path.resolve(ROOT, args[jobsIndex + 1]), "utf8"));

async function render(job) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, prompt: job.prompt, size: SIZE, n: 1, response_format: "b64_json" }),
    signal: AbortSignal.timeout(180_000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
  const encoded = JSON.parse(body)?.data?.[0]?.b64_json;
  if (!encoded) throw new Error("no image data returned");
  const out = path.resolve(ROOT, job.out);
  if (!out.startsWith(`${ROOT}${path.sep}`)) throw new Error(`refusing to write outside the repository: ${job.out}`);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(encoded, "base64"));
  return job.out;
}

let cursor = 0;
let failures = 0;
const results = [];
await Promise.all(
  Array.from({ length: Math.min(Math.max(CONCURRENCY, 1), jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor];
      cursor += 1;
      try {
        const out = await render(job);
        results.push(`ok   ${out}`);
        console.log(`ok   ${out}`);
      } catch (error) {
        failures += 1;
        results.push(`fail ${job.out}: ${error.message}`);
        console.error(`fail ${job.out}: ${error.message}`);
      }
    }
  }),
);
console.log(`${jobs.length - failures}/${jobs.length} images written with ${MODEL} at ${SIZE}`);
process.exitCode = failures ? 1 : 0;
