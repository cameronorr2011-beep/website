export default async function run(page) {
  const result = {};
  await page.waitForSelector('[data-sim-boot="ready"]');
  // The public entry is the simplified dashboard; enter the instrument only
  // for the workflow checks below.
  await page.goto(new URL('/Simulation/#laboratory', page.url()).toString(), { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-sim-boot="ready"]');
  result.boot = await page.locator('#simApp').getAttribute('data-sim-boot');
  result.renderer = await page.locator('#labCanvas').getAttribute('data-renderer');
  result.drawCalls = Number(await page.locator('#labCanvas').getAttribute('data-draw-calls') || 0);
  if (!['webgl', 'canvas'].includes(result.renderer)) throw new Error(`Unknown simulation renderer: ${result.renderer}`);
  if (result.renderer === 'webgl' && result.drawCalls < 1) throw new Error('WebGL simulation rendered no draw calls');

  await page.getByRole('combobox', { name: 'Reference profile' }).selectOption('chlorella-vulgaris');
  await page.getByRole('combobox', { name: 'Reactor geometry' }).selectOption('flask');
  await page.getByRole('textbox', { name: 'Scenario label' }).fill('Chlorella light study');
  await page.getByRole('spinbutton', { name: /Duration/ }).fill('24');
  await page.getByRole('button', { name: '▶ Run model' }).click();
  await page.waitForFunction(() => {
    const state = document.querySelector('.result-list dd')?.textContent?.trim() || '';
    return state === 'STORED OUTPUT' || state === 'RECOMPUTED';
  });
  result.completedStatus = await page.locator('.result-list dd').first().innerText();
  result.endpoint = await page.locator('.result-hero strong').innerText();
  result.geometry = await page.locator('#labCanvas').getAttribute('data-geometry');
  result.profile = await page.locator('.scene-kicker strong').innerText();
  if (!['STORED OUTPUT', 'RECOMPUTED'].includes(result.completedStatus)) throw new Error(`Simulation did not complete: ${result.completedStatus}`);
  if (result.geometry !== 'flask' || result.profile !== 'Chlorella vulgaris') throw new Error('Simulation controls did not reach the renderer');

  await page.goto(new URL('/Simulation/#simulations', page.url()).toString(), { waitUntil: 'networkidle' });
  await page.waitForSelector('.data-table');
  result.savedRuns = await page.locator('.data-table tbody tr').count();
  if (result.savedRuns < 1) throw new Error('Completed run was not persisted');

  await page.goto(new URL('/Simulation/#notebook', page.url()).toString(), { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: 'Title' }).fill('QA interpretation');
  await page.getByRole('textbox', { name: 'Markdown note' }).fill('The endpoint is a synthetic model output; compare one factor at a time.');
  await page.getByRole('button', { name: 'Save note locally' }).click();
  result.savedNotes = await page.locator('.note-card').count();
  if (result.savedNotes < 1) throw new Error('Notebook note was not persisted');

  await page.setViewportSize({ width: 390, height: 844 });
  result.mobileNoOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  if (!result.mobileNoOverflow) throw new Error('Simulation route overflows horizontally on mobile');
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto(new URL('/Simulation/#assistant', page.url()).toString(), { waitUntil: 'networkidle' });
  result.assistantBoundary = await page.locator('.assistant-disclaimer').innerText();
  if (!/local rule-based|synthetic computational/i.test(result.assistantBoundary)) throw new Error('Assistant provenance boundary missing');
  return result;
}
