/* Accessibility audit with axe-core.
   Serves the static site, then checks the three main pages at phone, tablet
   and desktop widths. Serious and critical violations exit non-zero. */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import process from "node:process";
import puppeteer from "puppeteer-core";
import { AxePuppeteer } from "@axe-core/puppeteer";

const PAGES = ["/", "/algae", "/culturekits"];
const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];

function chromePath() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [
    process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) || null;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`static server did not answer at ${url}`);
}

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["tools/static-server.mjs"], {
  env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
  stdio: "ignore",
});

let browser;
const results = [];
let failed = false;

try {
  await waitForServer(base + "/");
  // audit the calm state, not mid-reveal

  const executablePath = chromePath();
  if (!executablePath) {
    throw new Error("Chrome not found. Set CHROME_PATH or install Chrome.");
  }
  browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  for (const pagePath of PAGES) {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
      await page.goto(base + pagePath, { waitUntil: "networkidle0", timeout: 30000 });
      const { violations } = await new AxePuppeteer(page)
        .withTags(TAGS)
        .analyze();
      const counts = violations.reduce((acc, v) => {
        acc[v.impact || "unknown"] = (acc[v.impact || "unknown"] || 0) + v.nodes.length;
        return acc;
      }, {});
      results.push({ page: pagePath, viewport: vp.name, violations, counts });
      if (counts.serious || counts.critical) failed = true;
    }
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}

for (const r of results) {
  const total = Object.values(r.counts).reduce((a, b) => a + b, 0);
  console.log(`\n${r.page} @ ${r.viewport}: ${total} node${total === 1 ? "" : "s"}`);
  if (!total) {
    console.log("  clean");
    continue;
  }
  for (const v of r.violations) {
    console.log(`  [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length})`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`      ${node.target.join(" ")}`);
    }
  }
}

const sentence = results.some((r) => r.counts.critical)
  ? "critical"
  : results.some((r) => r.counts.serious)
    ? "serious"
    : "none";
console.log(`\nHighest impact: ${sentence}`);
process.exit(failed ? 1 : 0);
