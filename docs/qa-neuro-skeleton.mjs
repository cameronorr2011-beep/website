// QA drive of the NeuroML and developer skeleton layouts.
// Default export: async (page, ui) => result
export default async function run(page) {
  const base = 'http://127.0.0.1:8080';
  const out = { errors: [], pages: {} };

  for (const route of ['/neuroML/', '/developers/']) {
    await page.goto(base + route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    out.pages[route] = await page.evaluate(() => ({
      h1: document.querySelector('h1')?.innerText.trim() ?? null,
      h2: [...document.querySelectorAll('h2')].map((n) => n.innerText.trim()),
      tableRows: document.querySelectorAll('.nml-table tbody tr').length,
      badges: [...document.querySelectorAll('.nml-badge')].map((n) => n.innerText.trim()),
      counts: [...document.querySelectorAll('.nml-count')].map((n) => n.innerText.replace(/\s+/g, ' ').trim()),
      hasBreadcrumb: !!document.querySelector('.art-top'),
      navLinks: [...document.querySelectorAll('header .nav-links a')].map((a) => a.getAttribute('href')),
      footerNeuro: !!document.querySelector('footer a[href="/neuroML/"]'),
      footerDev: !!document.querySelector('footer a[href="/developers/"]'),
    }));
    out.pages[route].responsive = {};
    for (const width of [390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
      out.pages[route].responsive[width] = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      }));
    }
    await page.setViewportSize({ width: 1280, height: 900 });
  }

  // The added nav entries must not wrap or collide on desktop.
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  out.homeNav = {};
  for (const width of [1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    out.homeNav[width] = await page.evaluate(() => {
      const header = document.querySelector('header#nav');
      const links = [...document.querySelectorAll('header .nav-links a')];
      const rows = new Set(links.map((a) => Math.round(a.getBoundingClientRect().top)));
      return {
        headerHeight: Math.round(header.getBoundingClientRect().height),
        linkRows: rows.size,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });
  }
  return out;
}
