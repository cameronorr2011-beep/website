export default async function run(page) {
  const result = {};
  await page.waitForSelector('[data-lab-boot="ready"]');
  result.backendLabel = await page.locator('.workspace-card').filter({ hasText: 'Research network bridge' }).locator('.badge').innerText();
  await page.getByRole('button', { name: 'Check backend' }).click();
  await page.waitForTimeout(150);
  result.healthToast = await page.locator('#toast').innerText();
  await page.getByRole('button', { name: 'Sync full record' }).click();
  await page.waitForTimeout(250);
  result.syncToast = await page.locator('#toast').innerText();
  if (!result.syncToast.includes('synced')) throw new Error(`Backend sync failed: ${result.syncToast}`);
  return result;
}
