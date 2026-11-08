// Captures successive desktop viewports down a page so the whole layout can be
// reviewed, not just the hero.
// Usage: node <browser-automation>/browser.mjs <url> --script docs/rebrand/live-scroll.mjs
export default async function run(page) {
  const name = new URL(page.url()).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home';
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(1200);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const frames = [];
  for (let y = 0, i = 1; y < height && i <= 6; y += 950, i += 1) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(500);
    const file = `docs/rebrand/scroll-${name}-${i}.jpg`;
    await page.screenshot({ path: file, type: 'jpeg', quality: 55 });
    frames.push(file);
  }
  return { height, frames };
}
