// Mobile overflow check at 390px (iPhone-ish) and tablet 768px.
export default async function run(page, ui) {
  const results = {};
  for (const [name, w, h] of [['mobile', 390, 844], ['tablet', 768, 1024]]) {
    await page.setViewportSize({ width: w, height: h });
    results[name] = {};
    for (const path of ['/', '/literature/', '/support/']) {
      await page.goto('http://127.0.0.1:8080' + path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => {
        const doc = document.scrollingElement;
        return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth,
          horizontalOverflow: doc.scrollWidth > doc.clientWidth + 1 };
      });
      results[name][path] = overflow;
    }
  }
  return results;
}
