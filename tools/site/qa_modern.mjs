import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

export default async function run(page) {
  const base = new URL(page.url()).origin;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('ob-cookie-consent', JSON.stringify({v:'1', choice:'essential'})));
  await mkdir('docs/modern', {recursive:true});
  const routes = ['/', '/algaephyte/', '/cyanoflow', '/research/', '/blog/', '/glossary', '/downloads/', '/privacy', '/terms', '/disclaimer', '/demo/', '/Simulation/', '/Simulation/#laboratory', '/game/'];
  const layouts = [];
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({width, height:900});
    for (const route of routes) {
      const response = await page.goto(base + route);
      assert.equal(response.status(), 200, route);
      await page.locator('h1').waitFor();
      if (route.startsWith('/Simulation/')) await page.locator('[data-sim-boot="ready"]').waitFor();
      if (route === '/game/') await page.locator('#gameView .view-heading').waitFor();
      const state = await page.evaluate(() => ({overflow:document.documentElement.scrollWidth > innerWidth + 1, h1:document.querySelectorAll('h1').length, bodyWidth:document.body.scrollWidth}));
      assert.equal(state.overflow, false, `${width} ${route}: ${JSON.stringify(state)}`);
      assert.equal(state.h1, 1, `${width} ${route} heading count`);
      layouts.push({width, route});
      if ([360,1440].includes(width) && ['/', '/algaephyte/', '/cyanoflow', '/blog/', '/downloads/', '/Simulation/#laboratory', '/game/'].includes(route)) {
        const name = route === '/' ? 'home' : route.replace(/[\/#]/g, '-').replace(/^-|-$/g, '');
        await page.screenshot({path:`docs/modern/${name}-${width}.jpg`, type:'jpeg', quality:80, fullPage:false});
      }
    }
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base + '/');
  const platforms = page.locator('.nav-platforms');
  await platforms.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await platforms.getAttribute('open'), '');
  assert.equal(await platforms.getByRole('link', {name:'Algaephyte', exact:false}).isVisible(), true);
  const labs = page.locator('.nav-labs').last();
  await labs.locator('summary').click();
  await page.waitForFunction(() => !document.querySelector('.nav-platforms').open);
  assert.equal(await labs.getByRole('link', {name:'Algal Digital Lab', exact:false}).isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await labs.getAttribute('open'), null);
  assert.equal(await labs.locator('summary').evaluate(el => el === document.activeElement), true);
  await page.goto(base + '/algaephyte/');
  const sidebar = await page.locator('.callout').boundingBox();
  const prose = await page.locator('.prose').boundingBox();
  assert.ok(sidebar.x >= prose.x + prose.width, 'Disclosure should sit beside the reading column');
  await page.setViewportSize({width:360,height:900});
  await page.goto(base + '/');
  await page.getByRole('button', {name:'Menu',exact:true}).click();
  assert.equal(await page.locator('#mobileMenu').isVisible(), true);
  assert.equal(await page.locator('#mobileMenu a').count(), 8);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#mobileMenu').isVisible(), false);
  assert.deepEqual(errors, []);
  return {passed:true, layouts:layouts.length, dropdowns:'keyboard, mutual exclusion, Escape and focus', disclosures:'desktop sidebar; mobile reading flow', errors};
}
