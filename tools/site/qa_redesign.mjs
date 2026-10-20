import assert from 'node:assert/strict';

export default async function run(page) {
  const base = new URL(page.url()).origin;
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));

  const routes = [
    '/', '/algaephyte/', '/cyanoflow', '/research/', '/blog/', '/glossary',
    '/privacy', '/terms', '/disclaimer', '/downloads/', '/Simulation/', '/demo/',
  ];
  const layouts = [];

  await page.addInitScript(() => {
    localStorage.setItem('ob-cookie-consent', JSON.stringify({ v: '1', choice: 'essential' }));
  });

  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      assert.equal(response?.status(), 200, route);
      await page.locator('h1').waitFor();
      await page.waitForFunction(() => [...document.images]
        .filter((image) => image.loading !== 'lazy')
        .every((image) => image.complete));

      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        h1: document.querySelectorAll('h1').length,
        nav: document.querySelectorAll('#nav').length,
        menus: document.querySelectorAll('#mobileMenu').length,
        footer: document.querySelectorAll('.science-footer').length,
        broken: [...document.images]
          .filter((image) => image.complete && image.loading !== 'lazy' && !image.naturalWidth)
          .map((image) => image.src),
        removedRoutes: [...document.querySelectorAll('a[href]')]
          .map((anchor) => anchor.getAttribute('href'))
          .filter((href) => href === '/game/' || href === '/papertrail/'),
      }));

      assert.equal(state.overflow, false, `${width} ${route} overflows`);
      assert.equal(state.nav, 1);
      assert.equal(state.menus, 1);
      assert.equal(state.footer, 1);
      assert.equal(state.h1, 1);
      assert.deepEqual(state.broken, []);
      assert.deepEqual(state.removedRoutes, []);
      layouts.push({ width, route, ...state });
    }
  }

  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  assert.equal(await page.locator('#mobileMenu').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#mobileMenu').isVisible(), false);

  const home = await page.evaluate(() => ({
    title: document.title,
    hero: document.querySelector('.premium-hero')?.textContent.includes('Make living systems'),
    systems: document.querySelectorAll('.premium-system-card').length,
    method: document.querySelectorAll('.premium-method-grid article').length,
    contact: Boolean(document.querySelector('#deployForm')),
    papertrail: document.body.textContent.toLowerCase().includes('papertrail'),
    game: document.body.textContent.toLowerCase().includes('biorealm'),
  }));
  assert.equal(home.hero, true);
  assert.equal(home.systems, 2);
  assert.equal(home.method, 3);
  assert.equal(home.contact, true);
  assert.equal(home.papertrail, false);
  assert.equal(home.game, false);

  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 75));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  const loadedImages = await page.evaluate(() => [...document.images]
    .filter((image) => !image.naturalWidth)
    .map((image) => image.src));
  assert.deepEqual(loadedImages, []);
  assert.deepEqual(errors, []);
  assert.deepEqual(failedRequests, []);

  return {
    passed: true,
    layouts: layouts.length,
    routes,
    controls: 'responsive menu and premium homepage section checks',
    errors,
    failedRequests,
  };
}
