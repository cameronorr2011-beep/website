export default async function run(page) {
  const result = {};
  await page.waitForSelector('[data-lab-boot="ready"]');
  result.boot = await page.locator('body').getAttribute('data-lab-boot');
  result.renderer = await page.locator('#labCanvas').getAttribute('data-renderer');
  result.camera = await page.locator('#labCanvas').getAttribute('data-camera');
  result.drawCalls = Number(await page.locator('#labCanvas').getAttribute('data-draw-calls') || 0);
  if (!['webgl', 'canvas'].includes(result.renderer)) throw new Error(`Unknown renderer: ${result.renderer}`);
  if (result.renderer === 'webgl' && result.drawCalls < 1) throw new Error('Exploration renderer produced no draw calls');

  result.expeditionHeading = await page.locator('#viewTitle').innerText();
  if (result.expeditionHeading !== 'Go where the signal is.') throw new Error('Expedition view was not the initial workspace');
  await page.locator('.hotspot-row').first().click();
  result.selectedHotspot = await page.locator('.hotspot-row').first().evaluate((node) => node.classList.contains('is-selected'));
  await page.getByRole('button', { name: 'Scan selected hotspot' }).click();
  result.detections = await page.locator('.detection-card').count();
  if (result.detections < 1) throw new Error('The launch hotspot did not produce a detection card');
  await page.getByRole('button', { name: 'Collect detected sample' }).click();
  result.sampleCount = await page.locator('.sample-row').count();
  if (result.sampleCount < 1) throw new Error('Detected sample was not added to custody records');
  await page.getByRole('button', { name: /Open Cyanoflow/ }).first().click();
  result.linkedSource = await page.locator('.source-bridge').count();
  if (result.linkedSource !== 1) throw new Error('Expedition sample did not open as a Cyanoflow source record');
  await page.getByRole('button', { name: 'Run full synthetic path · 24 h' }).click();
  result.pipeline = await page.locator('#metricPipeline').innerText();
  await page.getByRole('button', { name: 'Save locally' }).click();
  result.saved = await page.locator('#saveState').innerText();
  await page.reload();
  await page.waitForSelector('[data-lab-boot="ready"]');
  result.reloadSource = await page.locator('.source-bridge').count();
  result.reloadPipeline = await page.locator('#metricPipeline').innerText();
  await page.setViewportSize({ width: 390, height: 844 });
  result.mobileNoOverflow = await page.evaluate(() => { window.scrollTo(0, 0); return document.documentElement.scrollWidth <= window.innerWidth + 1; });
  if (result.saved !== 'SAVED') throw new Error('Combined local record did not save');
  if (result.reloadSource !== 1 || result.reloadPipeline !== 'Transferred') throw new Error('Saved expedition/lab lineage did not survive reload');
  if (!result.mobileNoOverflow) throw new Error('Expedition layout overflows horizontally');
  return result;
}
