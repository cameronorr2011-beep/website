import { mkdir } from 'node:fs/promises';

const pages = [
  ['home', '/'],
  ['algae', '/algae/'],
  ['neuroscience', '/neuroscience/'],
  ['neuroml', '/neuroML/'],
];
const viewports = [
  ['desktop', 1440, 900],
  ['tablet', 768, 1024],
  ['mobile', 390, 844],
];

export default async function run(page) {
  await mkdir('docs/rebrand', { recursive: true });
  const results = [];

  for (const [viewport, width, height] of viewports) {
    await page.setViewportSize({ width, height });
    for (const [name, path] of pages) {
      const response = await page.goto(`http://127.0.0.1:8080${path}`, {
        waitUntil: 'networkidle',
      });
      await page.waitForSelector('h1');
      await page.waitForFunction(() =>
        [...document.images].filter((image) => !image.loading || image.loading !== 'lazy').every((image) => image.complete),
      );
      const state = await page.evaluate(() => ({
        title: document.title,
        h1: document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').trim(),
        h1Count: document.querySelectorAll('h1').length,
        navCount: document.querySelectorAll('#nav').length,
        menuCount: document.querySelectorAll('#mobileMenu').length,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth,
        brokenImages: [...document.images]
          .filter((image) => image.complete && !image.naturalWidth)
          .map((image) => image.src),
        domainCount: document.querySelectorAll('.hr-domain').length,
        specimen: Boolean(document.querySelector('.hr-specimen img, .nr-specimen-figure img')),
      }));
      await page.screenshot({
        path: `docs/rebrand/${name}-${viewport}.png`,
        fullPage: true,
      });
      results.push({
        viewport,
        width,
        height,
        name,
        path,
        status: response?.status(),
        ...state,
      });
    }
  }

  return { results };
}
