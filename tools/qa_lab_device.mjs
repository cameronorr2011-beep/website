import assert from 'node:assert/strict';

export default async function run(page) {
  const endpoint = process.env.PI_QA_ENDPOINT || 'http://127.0.0.1:8765';
  let requests = 0;
  page.on('request', (request) => { if (request.url().startsWith(endpoint)) requests++; });
  await page.waitForSelector('[data-lab-boot="ready"]');
  await page.getByRole('button', { name: 'Algaephyte Cultivation model' }).click();
  assert.equal(requests, 0, 'device requests must require explicit opt-in');
  assert.equal(await page.locator('#deviceStatus').innerText(), 'UNAVAILABLE');
  await page.getByLabel('Pi service base URL').fill(endpoint);
  async function readDownload(button) {
    const pending = page.waitForEvent('download');
    await button.click();
    const download = await pending;
    const stream = await download.createReadStream();
    let content = '';
    for await (const chunk of stream) content += chunk.toString();
    return { filename: download.suggestedFilename(), content };
  }
  const stateBefore = JSON.parse((await readDownload(page.getByRole('button', { name: 'Export JSON', exact: true }))).content).state;
  await page.getByRole('button', { name: 'Connect / test Pi' }).click();
  await page.waitForFunction(() => document.querySelector('#deviceStatus')?.textContent.includes('SERVICE MOCK'));
  assert.equal(await page.locator('[data-device-key="temperatureC"] strong').innerText(), '28.00');
  assert.match(await page.locator('[data-device-key="temperatureC"] small').first().innerText(), /simulated.*synthetic service mock/);
  assert.deepEqual(JSON.parse((await readDownload(page.getByRole('button', { name: 'Export JSON', exact: true }))).content).state, stateBefore, 'telemetry must not mutate simulation state');
  assert.ok(!(await page.locator('#devicePanel button').allInnerTexts()).some((text) => /pump|heater|dose/i.test(text)));
  const download = await readDownload(page.getByRole('button', { name: 'Export sensor snapshot' }));
  assert.equal(download.filename, 'orr-device-snapshot.json');
  const exported = JSON.parse(download.content);
  assert.equal(exported.format, 'orr-device-snapshot');
  assert.equal(exported.version, 1);
  assert.equal(exported.snapshot.mode, 'mock');
  assert.ok(exported.snapshot.readings.every((item) => !item.hardware && item.quality === 'simulated'));
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'device panel must fit mobile');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: 'docs/lab-device-panel.png' });
  await page.getByRole('button', { name: 'Disconnect Pi' }).click();
  assert.equal(await page.locator('#deviceStatus').innerText(), 'UNAVAILABLE');
  assert.ok(await page.getByRole('button', { name: 'Export sensor snapshot' }).isDisabled());

  // Browser-only fault fixture, explicitly synthetic; no physical claim.
  await page.route(`${endpoint}/api/v1/readings`, async (route) => {
    const snapshot = structuredClone(exported.snapshot);
    const sampledAt = new Date(Date.now() - 60000).toISOString();
    snapshot.sampledAt = sampledAt;
    for (const item of snapshot.readings) item.sampledAt = sampledAt;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snapshot),
      headers: { 'Access-Control-Allow-Origin': new URL(page.url()).origin } });
  });
  await page.getByRole('button', { name: 'Connect / test Pi' }).click();
  await page.waitForFunction(() => document.querySelector('[data-device-key="temperatureC"]')?.dataset.quality === 'stale');
  assert.equal(await page.locator('[data-device-key="temperatureC"] strong').innerText(), '—');
  assert.equal(await page.locator('#deviceStatus').innerText(), 'NO USABLE READINGS');
  await page.getByRole('button', { name: 'Disconnect Pi' }).click();
  await page.unroute(`${endpoint}/api/v1/readings`);
  await page.route(`${endpoint}/api/v1/readings`, (route) => route.fulfill({ status: 200,
    contentType: 'application/json', body: '{"contractVersion":"unknown"}',
    headers: { 'Access-Control-Allow-Origin': new URL(page.url()).origin } }));
  await page.getByRole('button', { name: 'Connect / test Pi' }).click();
  await page.waitForFunction(() => document.querySelector('#deviceStatus')?.textContent === 'ERROR');
  assert.ok(await page.getByRole('button', { name: 'Export sensor snapshot' }).isDisabled());
  assert.equal(await page.locator('[data-device-key]').count(), 0);
  await page.getByRole('button', { name: 'Disconnect Pi' }).click();
  await page.unroute(`${endpoint}/api/v1/readings`);
  const count = requests;
  await page.getByRole('button', { name: 'Reset scenario' }).click();
  await page.getByRole('button', { name: 'Overview Research trace' }).click();
  await page.getByRole('button', { name: 'Algaephyte Cultivation model' }).click();
  assert.equal(requests, count, 'reset/navigation must not reconnect');
  assert.equal(await page.locator('#deviceStatus').innerText(), 'UNAVAILABLE');
  return { optIn: true, mockClearlyLabeled: true, simulationUnchanged: true, exportValidated: true,
    mobileNoOverflow: true, staleHidden: true, malformedFailClosed: true, disconnectAndResetSafe: true };
}
