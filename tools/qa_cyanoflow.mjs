import assert from 'node:assert/strict';

export default async function run(page) {
  const errors = [];
  const failures = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failures.push(`${request.method()} ${request.url()}`));
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('ob-cookie-consent', JSON.stringify({ v: '1', choice: 'essential' }));
  });
  await page.goto(new URL('/game/?qa=1', page.url()).toString(), { waitUntil: 'networkidle' });
  await page.locator('#gameView .view-heading').waitFor();
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#sceneCanvasInner');
    if (!canvas) return false;
    return canvas.getContext('2d')?.getImageData(20, 20, 1, 1).data[3] > 0;
  });

  const fresh = await page.evaluate(() => ({
    title: document.title,
    game: document.querySelector('#biorealmApp')?.textContent.includes('Cyanoflow'),
    credits: document.querySelector('#creditsReadout')?.textContent,
    grant: Boolean(document.querySelector('[data-action="claim-grant"]')),
    nav: document.querySelectorAll('.side-nav-button').length,
  }));
  assert.equal(fresh.game, true);
  assert.equal(fresh.credits, '95');
  assert.equal(fresh.grant, true);
  assert.equal(fresh.nav, 7);

  await page.locator('[data-action="claim-grant"]').click();
  await page.locator('.side-nav-button[data-view="expedition"]').click();
  await page.locator('[data-action="buy-device"][data-device-type="screening"]').click();
  await page.locator('[data-action="start-expedition"][data-biome-id="freshwater"]').click();
  await page.locator('[data-action="qa-fast-forward"]').evaluate((button) => button.click());
  await page.locator('[data-action="collect-expedition"]').click();
  await page.locator('#revealModal:not([hidden])').waitFor();
  assert.match(await page.locator('#revealContent').innerText(), /SPECIMEN LOGGED|RARE VARIANT/);
  const discovery = await page.evaluate(() => JSON.parse(localStorage.getItem('orr-cyanoflow-v1')));
  assert.equal(discovery.stats.completedExpeditions, 1);
  assert.ok(discovery.discovered.length >= 1);
  await page.locator('.modal-close[data-action="close-reveal"]').click();

  await page.locator('.side-nav-button[data-view="scanner"]').click();
  await page.locator('[data-action="run-scan"]').click();
  const before = await page.locator('.metric-grid').innerText();
  await page.locator('[data-scanner="growth"]').evaluate((input) => { input.value = '0.4'; input.dispatchEvent(new Event('change', { bubbles: true })); });
  const after = await page.locator('.metric-grid').innerText();
  assert.notEqual(before, after);
  const candidate = page.locator('.cell-record.is-candidate').first();
  await candidate.click();
  const recover = page.locator('[data-action="recover-cell"]');
  if (await recover.isEnabled()) await recover.click();
  assert.ok((await page.locator('.cell-detail').innerText()).includes('simulated'));

  await page.locator('.side-nav-button[data-view="settings"]').click();
  assert.equal(await page.locator('[data-action="export-save"]').count(), 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.side-nav-button[data-view="collection"]').click();
  await page.locator('.species-grid').waitFor();
  assert.equal(await page.locator('.species-card').count(), 27);
  await page.locator('[data-archive="query"]').fill('Arthrospira');
  assert.equal(await page.locator('.species-card').count(), 1);
  await page.locator('[data-archive="query"]').fill('');
  await page.locator('[data-archive="filter"]').selectOption('discovered');
  assert.ok(await page.locator('.species-card').count() >= 1);
  await page.locator('[data-action="toggle-archive-favorite"]').first().click();
  await page.locator('.side-nav-button[data-view="scanner"]').click();
  await page.locator('.scanner-layout').waitFor();
  const mobile = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.equal(mobile.scrollWidth, mobile.width);
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
  return { passed: true, fresh, discoveryCount: discovery.discovered.length, scanner: { before, after }, mobile, errors, failures };
}
