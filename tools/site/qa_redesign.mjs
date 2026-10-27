import assert from 'node:assert/strict';

export default async function run(page) {
  const base = new URL(page.url()).origin;
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));

  const routes = [
    '/', '/algaephyte/', '/cyanoflow', '/research/', '/blog/', '/glossary',
     '/privacy', '/terms', '/disclaimer', '/downloads/', '/Simulation/', '/game/', '/demo/',
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
       await page.locator('h1').first().waitFor();
       if (route === '/Simulation/') await page.locator('#simApp[data-sim-boot="ready"]').waitFor();
       if (route === '/game/') await page.locator('#gameView .view-heading').waitFor();
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
          .filter((href) => href === '/culturetrace/' || href === '/papertrail/'),
      }));

      assert.equal(state.overflow, false, `${width} ${route} overflows`);
      assert.equal(state.nav, 1);
      assert.equal(state.menus, 1);
      assert.equal(state.footer, 1);
       assert.ok(route === '/game/' ? state.h1 === 2 : state.h1 >= 1, `${width} ${route} missing heading`);
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
        hero: document.querySelector('.cinema-hero')?.textContent.includes('Making living systems legible'),
        field: Boolean(document.querySelector('.cinema-reactor')),
        cultureCanvas: Boolean(document.querySelector('#volvoxCanvas')),
        chipCanvas: Boolean(document.querySelector('#reactorCanvas')),
        systems: document.querySelectorAll('.cinema-system').length,
        method: document.querySelectorAll('.cinema-method-grid article').length,
    contact: Boolean(document.querySelector('#deployForm')),
    papertrail: document.body.textContent.toLowerCase().includes('papertrail'),
    legacyGame: document.body.textContent.toLowerCase().includes('biorealm'),
  }));
  assert.equal(home.hero, true);
  assert.equal(home.field, true);
  assert.equal(home.cultureCanvas, true);
  assert.equal(home.chipCanvas, true);
  assert.equal(home.systems, 2);
  assert.equal(home.method, 3);
  assert.equal(home.contact, true);
  assert.equal(home.papertrail, false);
  assert.equal(home.legacyGame, false);

  assert.equal(await page.locator('#volvoxCanvas').count(), 1);
  assert.equal(await page.locator('#reactorCanvas').count(), 1);

  await page.goto(base + '/algaephyte/', { waitUntil: 'domcontentloaded' });
  await page.locator('#algaephyteInstrumentCanvas').waitFor();
  assert.equal(await page.locator('a[href="/blog/digital-twin-droop-steele-model"]').count() > 0, true);
  await page.locator('#pulseModel').click();
  assert.match(await page.locator('[data-model-clock]').textContent(), /T\+24 h/);
  await page.locator('#resetModel').click();
  assert.match(await page.locator('[data-model-clock]').textContent(), /T\+00 h/);

   await page.goto(base + '/Simulation/#laboratory', { waitUntil: 'domcontentloaded' });
   await page.locator('#simApp[data-sim-boot="ready"]').waitFor();
   assert.equal(await page.locator('#labCanvas').count(), 1);

   await page.goto(base + '/game/', { waitUntil: 'domcontentloaded' });
   await page.locator('#gameView').waitFor();
   assert.equal(await page.locator('#biorealmApp').count(), 1);

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
   controls: 'responsive menu, procedural scenes, Algaephyte pulse/reset, Digital Lab boot, and Cyanoflow game boot',
    errors,
    failedRequests,
  };
}
