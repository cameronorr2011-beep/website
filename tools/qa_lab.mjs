export default async function run(page) {
  const result = {};
  await page.waitForSelector('[data-lab-boot="ready"]');
  result.boot = await page.locator('body').getAttribute('data-lab-boot');
  if (result.boot !== 'ready') throw new Error(`Lab boot failed: ${result.boot}`);
  await page.setViewportSize({ width: 390, height: 844 });
  result.mobileNoOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  await page.setViewportSize({ width: 1280, height: 900 });
  if (!result.mobileNoOverflow) throw new Error('Mobile laboratory layout overflows horizontally');
  result.initialStage = await page.locator('#metricPipeline').innerText();
  await page.getByRole('button', { name: 'Algaephyte Cultivation model' }).click();
  await page.getByRole('button', { name: 'Capture synthetic calibration' }).click();
  result.calibration = await page.locator('#workspaceContent').innerText();
  await page.getByRole('combobox', { name: 'Algaephyte conditions' }).selectOption('carbonLimited');
  result.scenario = await page.getByRole('combobox', { name: 'Algaephyte conditions' }).inputValue();
  await page.getByRole('button', { name: 'Overview Research trace' }).click();
  await page.getByRole('button', { name: 'Run complete synthetic workflow · 24 h' }).click();
  await page.waitForTimeout(100);
  result.afterWorkflow = await page.locator('#metricPipeline').innerText();
  await page.getByRole('button', { name: 'Cyanoflow Single-cell pipeline' }).click();
  result.isolated = await page.locator('.cell-table tbody tr').filter({ hasText: 'isolated' }).count();
  await page.locator('.cell-table tbody tr').filter({ hasText: 'eligible' }).filter({ hasText: 'isolated' }).first().click();
  result.cellHeading = await page.locator('#workspaceContent h3').first().innerText();
  await page.screenshot({ path: 'docs/lab-cell-inspection.png' });
  await page.getByRole('button', { name: 'Focus 3D cell view' }).click();
  await page.locator('#sceneFrame').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/lab-cell-camera.png' });
  const transfer = page.getByRole('button', { name: 'Transfer to Algaephyte' });
  result.transferEnabled = await transfer.isEnabled().catch(() => false);
  if (result.transferEnabled) {
    await transfer.click();
    result.afterTransferMode = await page.locator('#viewTitle').innerText();
  }
  await page.getByRole('button', { name: '+15 min' }).click();
  result.clockAfterStep = await page.locator('#clockReadout').innerText();
  await page.getByRole('button', { name: 'Save locally' }).click();
  result.saved = await page.locator('#saveState').innerText();
  await page.getByRole('button', { name: 'Experiments Compare and report' }).click();
  result.historyText = await page.locator('#workspaceContent').innerText();
  return result;
}
