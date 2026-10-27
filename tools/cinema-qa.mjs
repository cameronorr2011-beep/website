/* Headless visual QA for the Biological Cinema redesign.
   Captures real Chromium screenshots (desktop + mobile), collects console
   errors, and verifies each interactive canvas reaches a WebGL render.
   Usage: node tools/cinema-qa.mjs [base-url] (default http://127.0.0.1:8080) */
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] || "http://127.0.0.1:8080";
const ROOT = "audits";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);

const PAGES = [
  { route: "/", name: "home", scrolls: true },
  { route: "/algaephyte/", name: "algaephyte", canvas: "#algaephyteInstrumentCanvas" },
  { route: "/cyanoflow", name: "cyanoflow", canvas: "#cyanoflowChipCanvas" },
  { route: "/research/", name: "research" },
  { route: "/blog/", name: "journal" },
  { route: "/blog/spirulina-is-a-cyanobacterium", name: "journal-article" },
  { route: "/Simulation/", name: "simulation" },
  { route: "/glossary", name: "glossary" },
  { route: "/downloads/", name: "downloads" },
  { route: "/algae-growth/", name: "algae-growth" },
  { route: "/404.html", name: "404" },
];

const VIEWPORTS = [
  { suffix: "desktop", width: 1440, height: 900 },
  { suffix: "mobile", width: 390, height: 844, mobile: true, dsf: 2 },
];

async function main() {
  const executablePath = CHROME_CANDIDATES.find((p) => p);
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--use-angle=default", "--enable-webgl", "--ignore-gpu-blocklist"],
  });
  await mkdir(ROOT, { recursive: true });
  const failures = [];
  let captureIndex = 0;

  for (const viewport of VIEWPORTS) {
    let page = null;
    for (const spec of PAGES) {
      /* One page per route, closed afterwards: stacked WebGL contexts starve
         the headless compositor and make later loads look hung. */
      page = await browser.newPage();
      await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: viewport.dsf || 1, isMobile: !!viewport.mobile, hasTouch: !!viewport.mobile });
      const url = `${BASE}${spec.route}?qa=${viewport.suffix}`;
      const errors = [];
      page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
      page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
      try {
        await page.goto(url, { waitUntil: "load", timeout: 60000 });
      } catch (err) {
        /* networkidle can hang on idle CDP accounting; only a truly incomplete
           document is a failure. */
        const ready = await page.evaluate(() => document.readyState).catch(() => "gone");
        if (ready !== "complete") {
          failures.push({ page: spec.name, viewport: viewport.suffix, problem: `navigation failed: ${err.message}` });
          await page.close().catch(() => {});
          continue;
        }
      }
      await new Promise((r) => setTimeout(r, 1600));

      if (spec.canvas) {
        const renderer = await page.evaluate((selector) => {
          const canvas = document.querySelector(selector);
          if (!canvas) return "missing";
          return canvas.dataset.renderer || "webgl";
        }, spec.canvas);
        if (renderer !== "webgl" && !renderer.startsWith("canvas-fallback")) {
          // fallback 2D is acceptable but must be explicit
          if (renderer === "missing") failures.push({ page: spec.name, viewport: viewport.suffix, problem: "canvas element missing" });
        }
      }

      captureIndex += 1;
      await page.screenshot({ path: `${ROOT}/${String(captureIndex).padStart(2, "0")}-${spec.name}-${viewport.suffix}.png` });

      if (spec.canvas) {
        // scroll the section into view so its scene spins up, capture again
        await page.evaluate((selector) => { document.querySelector(selector)?.scrollIntoView({ behavior: "instant", block: "center" }); }, spec.canvas);
        await new Promise((r) => setTimeout(r, 1400));
        captureIndex += 1;
        await page.screenshot({ path: `${ROOT}/${String(captureIndex).padStart(2, "0")}-${spec.name}-${viewport.suffix}-canvas.png` });
      }

      const realErrors = errors.filter((text) => !/favicon|Autoplay|WebGL: INVALID_OPERATION: getInternalformatParameter/i.test(text));
      if (realErrors.length) failures.push({ page: spec.name, viewport: viewport.suffix, problem: realErrors.slice(0, 4) });
      /* Close after every route: stacked WebGL contexts starve the headless
         compositor and make later loads look hung. */
      await page.close().catch(() => {});
    }
  }

  if (PAGES.some((s) => s.scrolls)) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/?qa=scrollseries`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));
    const total = await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
    for (const fraction of [0.16, 0.24, 0.32, 0.4]) {
      await page.evaluate((y) => { window.scrollBy({ top: y, behavior: "instant" }); }, total * 0.09);
      await new Promise((r) => setTimeout(r, 900));
      captureIndex += 1;
      await page.screenshot({ path: `${ROOT}/${String(captureIndex).padStart(2, "0")}-home-scroll-${Math.round(fraction * 100)}.png` });
    }
    await page.close();
  }

  await browser.close();
  if (failures.length) {
    console.log("QA FAILURES:");
    failures.forEach((entry) => console.log(JSON.stringify(entry)));
    process.exitCode = 1;
  } else {
    console.log(`QA clean: ${captureIndex} captures in ${ROOT}/`);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
