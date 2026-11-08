// Captures product-page previews and reports layout facts at two widths.
// Usage: node <browser-automation>/browser.mjs http://127.0.0.1:8080/<route> \
//          --script docs/rebrand/product-shot.mjs
export default async function run(page) {
  const route = new URL(page.url()).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home';
  const facts = async () =>
    page.evaluate(() => ({
      bg: getComputedStyle(document.body).backgroundColor,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      headerClearance: (() => {
        const h = document.querySelector('.nav');
        const main = document.querySelector('main');
        if (!h || !main) return null;
        return Math.round(main.getBoundingClientRect().top - h.getBoundingClientRect().bottom);
      })(),
      lightSurfaces: [...document.querySelectorAll('main *')]
        .filter((el) => {
          const m = getComputedStyle(el).backgroundColor.match(/rgba?\((\d+), (\d+), (\d+)/);
          if (!m) return false;
          const [r, g, b] = [m[1], m[2], m[3]].map(Number);
          return r > 200 && g > 200 && b > 190;
        })
        .slice(0, 5)
        .map((el) => el.className || el.tagName),
    }));

  await page.setViewportSize({ width: 900, height: 1200 });
  await page.waitForTimeout(1200);
  const desktop = await facts();
  // JPEG at reduced width keeps the full-page capture attachable.
  await page.screenshot({ path: `docs/rebrand/product-${route}-preview.jpg`, fullPage: true, type: 'jpeg', quality: 45 });
  await page.screenshot({
    path: `docs/rebrand/product-${route}-top.jpg`,
    clip: { x: 0, y: 0, width: 900, height: 1200 },
    type: 'jpeg',
    quality: 72,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  const mobile = await facts();
  await page.screenshot({ path: `docs/rebrand/product-${route}-mobile.jpg`, type: 'jpeg', quality: 60 });

  return { bodyClass: await page.evaluate(() => document.body.className), desktop, mobile };
}
