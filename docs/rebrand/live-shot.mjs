// Captures a live route for visual review at desktop and mobile widths.
// Usage: node <browser-automation>/browser.mjs <url> --script docs/rebrand/live-shot.mjs
export default async function run(page) {
  const name = new URL(page.url()).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home';
  const out = {};
  for (const [label, width, height] of [['desk', 1440, 1000], ['mob', 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(1500);
    out[label] = await page.evaluate(() => ({
      title: document.title,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      h1: document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').slice(0, 80),
      h1Size: document.querySelector('h1') ? getComputedStyle(document.querySelector('h1')).fontSize : null,
      fonts: [...new Set([...document.querySelectorAll('h1,h2,p')].map((e) => getComputedStyle(e).fontFamily.split(',')[0]))],
      sections: [...document.querySelectorAll('main > *')].slice(0, 8).map((e) => `${e.tagName}.${e.className}`.slice(0, 60)),
    }));
    await page.screenshot({
      path: `docs/rebrand/live-${name}-${label}.jpg`,
      clip: { x: 0, y: 0, width, height: Math.min(height, 1400) },
      type: 'jpeg',
      quality: 62,
    });
  }
  return out;
}
