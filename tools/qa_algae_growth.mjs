export default async function run(page) {
  const result = {};
  await page.waitForSelector('#growthCanvas');
  await page.waitForFunction(() => Boolean(window.__algaeGrowth));
  result.title = await page.title();
  result.initialScene = await page.locator('#sceneTitle').innerText();
  result.renderer = await page.locator('#growthCanvas').getAttribute('data-renderer');
  if (result.renderer !== 'canvas') throw new Error(`Unexpected renderer: ${result.renderer}`);
  result.voiceControl = await page.locator('#voiceToggle').count();
  if (result.voiceControl !== 1) throw new Error('Voiceover control is missing');

  const tabs = page.locator('.scene-tab');
  result.sceneCount = await tabs.count();
  if (result.sceneCount !== 7) throw new Error(`Expected 7 scene tabs, got ${result.sceneCount}`);
  for (let index = 0; index < 7; index += 1) {
    await tabs.nth(index).click();
    await page.waitForFunction((expected) => document.documentElement.dataset.scene === String(expected), index + 1);
  }
  result.lastScene = await page.locator('#sceneTitle').innerText();

  await page.locator('#advancedButton').click();
  result.advancedCopy = await page.locator('#storyBody').innerText();
  if (!/light reactions|carbon fixation|species/i.test(result.advancedCopy)) throw new Error('Advanced explanation did not update');

  await page.locator('#lightInput').fill('96');
  await page.locator('#tempInput').fill('37');
  await page.locator('#nutrientInput').fill('12');
  await page.locator('#co2Input').fill('8');
  result.stressed = await page.locator('#conditionState').evaluate((node) => node.classList.contains('is-stressed'));
  result.conditionText = await page.locator('#conditionState').innerText();
  if (!result.stressed) throw new Error('Environmental controls did not produce a stress state');

  await page.locator('#cultureButton').click();
  result.cultureMode = await page.locator('#stageMode').innerText();
  if (!/culture/i.test(result.cultureMode)) throw new Error('Culture view did not update');
  await page.locator('#playToggle').click();
  result.paused = await page.locator('#runStatus').innerText();
  if (!/paused/i.test(result.paused)) throw new Error('Pause control did not update status');
  await page.locator('#restartButton').click();
  result.restartClock = await page.locator('#stageClock').innerText();
  if (result.restartClock !== '00:00') throw new Error('Restart did not reset timeline');

  await page.setViewportSize({ width: 390, height: 844 });
  result.mobileNoOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  result.mobileCanvas = await page.locator('#growthCanvas').evaluate((node) => ({ width: node.clientWidth, height: node.clientHeight }));
  if (!result.mobileNoOverflow) throw new Error('Mobile layout overflows horizontally');
  if (!result.mobileCanvas.width || !result.mobileCanvas.height) throw new Error('Canvas is not visible on mobile');
  await page.setViewportSize({ width: 1280, height: 900 });

  return result;
}
