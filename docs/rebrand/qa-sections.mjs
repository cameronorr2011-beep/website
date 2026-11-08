import { mkdir } from 'node:fs/promises';

const shots = [
  ['home-desktop-hero', 1440, 900, null],
  ['home-desktop-projects', 1440, 900, '#systems'],
  ['home-desktop-proof', 1440, 900, '#field-station'],
  ['home-mobile-hero', 390, 844, null],
  ['home-mobile-projects', 390, 844, '#systems'],
  ['home-mobile-proof', 390, 844, '#field-station'],
  ['home-mobile-journal', 390, 844, '#journal'],
  ['home-mobile-contact', 390, 844, '#deploy'],
];

export default async function run(page) {
  await mkdir('docs/rebrand/sections', { recursive: true });
  const results = [];
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle' });
  await page.waitForSelector('h1');
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

  for (const [name, width, height, selector] of shots) {
    await page.setViewportSize({ width, height });
    await page.evaluate((anchor) => {
      window.scrollTo(0, 0);
      if (anchor) {
        const target = document.querySelector(anchor);
        window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.scrollY - 92));
      }
    }, selector);
    await page.waitForTimeout(250);
    await page.evaluate((anchor) => {
      if (anchor) {
        const target = document.querySelector(anchor);
        window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.scrollY - 92));
      } else {
        window.scrollTo(0, 0);
      }
    }, selector);
    await page.waitForTimeout(250);
    await page.waitForFunction(() =>
      [...document.images].filter((image) => !image.loading || image.loading !== 'lazy').every((image) => image.complete),
    );
    const state = await page.evaluate(() => ({
      scrollY: Math.round(window.scrollY),
      viewport: [innerWidth, innerHeight],
      bodyWidth: document.documentElement.scrollWidth,
    }));
    await page.screenshot({ path: `docs/rebrand/sections/${name}.png`, fullPage: false });
    results.push({ name, selector, ...state });
  }

  return { results };
}
