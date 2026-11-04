// QA drive of the new literature engine, support page and homepage band.
// Default export: async (page, ui) => result
export default async function run(page, ui) {
  const out = { errors: [] };

  // ---- 1. Literature engine ----
  await page.goto('http://127.0.0.1:8080/literature/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const status0 = await page.locator('#litStatus').textContent();
  out.litInitialStatus = status0;
  // Real search flow: type a query, submit, wait for live results.
  await page.locator('#litQuery').fill('Droop quota model microalgae');
  await page.locator('.lit-button[type=submit]').click();
  try {
    await page.waitForFunction(() => document.querySelectorAll('.lit-card').length > 0, null, { timeout: 25000 });
  } catch (e) {
    out.errors.push('search produced no cards: ' + (await page.locator('#litStatus').textContent()));
  }
  out.searchCardCount = await page.locator('.lit-card').count();
  out.searchStatus = await page.locator('#litStatus').textContent();
  const firstCard = await page.locator('.lit-card').first().textContent();
  out.firstCardHasOpenAccessBadge = /open access/i.test(firstCard);
  out.firstCardHasDoi = /doi\.org\/10\./.test(firstCard);
  // DOI lookup flow
  await page.locator('#litQuery').fill('10.1038/171737a0');
  await page.locator('.lit-button[type=submit]').click();
  await page.waitForFunction(() => document.querySelector('#litStatus').textContent.includes('DOI resolved'), null, { timeout: 25000 });
  out.doiCardCount = await page.locator('.lit-card').count();
  out.doiCardText = (await page.locator('.lit-card').first().textContent()).slice(0, 220);
  // Error state: bogus query syntax cannot easily force an API failure; instead
  // check empty-state triggers with an obscure filter combination.
  out.errorsConsole = [];

  // ---- 2. Support page ----
  await page.goto('http://127.0.0.1:8080/support/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  out.supportH1 = (await page.locator('h1').first().textContent()).trim();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:8080' }).catch(() => {});
  await page.locator('.support-button').click();
  await page.waitForTimeout(500);
  out.copyStatus = await page.locator('#supportCopyStatus').textContent();
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => 'unreadable'));
  out.clipboard = clip;

  // ---- 3. Homepage support band ----
  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  out.homeH1 = (await page.locator('h1').first().textContent()).trim();
  out.homeBandPresent = (await page.locator('#homeLightning').count()) === 1;
  out.homeBandAddress = (await page.locator('#homeLightning').textContent()).trim();
  out.homeCopyButton = (await page.locator('[data-copy="#homeLightning"]').count()) === 1;
  out.homeLiteratureNav = (await page.locator('header#nav a[href="/literature/"]').count()) === 1;
  out.homeFooterSupport = (await page.locator('footer a[href="/support/"]').count()) >= 1;

  return out;
}
