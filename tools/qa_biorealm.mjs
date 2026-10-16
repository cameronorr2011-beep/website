/* Browser smoke test for the active BioRealm route. */
export default async function run(page) {
  await page.evaluate(() => localStorage.removeItem("orr-biorealm-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#gameView .view-heading").waitFor();

  const fresh = await page.evaluate(() => ({
    title: document.title,
    heading: (document.querySelector("#gameView h1") || document.querySelector("#gameView .view-title"))?.textContent,
    credits: document.querySelector("#creditsReadout")?.textContent,
    grant: Boolean(document.querySelector('[data-action="claim-grant"]')),
    rackSlots: document.querySelectorAll(".empty-slot").length,
    hasReactor: document.body.innerText.includes("Seed Flask"),
  }));
  if (!fresh.grant || fresh.credits !== "95" || fresh.rackSlots !== 2) throw new Error("fresh lab did not boot with the starter grant, rack, and reactor");

  await page.locator('[data-action="claim-grant"]').click();
  await page.locator('.side-nav-button[data-view="expedition"]').click();
  await page.locator('[data-action="buy-device"][data-device-type="screening"]').click();
  await page.locator('[data-action="start-expedition"][data-biome-id="freshwater"]').click();
  const running = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("orr-biorealm-v1"));
    return { credits: document.querySelector("#creditsReadout")?.textContent, status: save.devices[0]?.status, biome: save.devices[0]?.expedition?.biomeId };
  });
  if (running.status !== "running" || running.biome !== "freshwater") throw new Error("freshwater expedition did not persist as running");

  await page.locator('.side-nav-button[data-view="expedition"]').click();
  await page.locator('[data-action="qa-fast-forward"]').evaluate((button) => button.click());
  if (!await page.locator('[data-action="collect-expedition"]').count()) { const probe = await page.evaluate(() => ({ save: JSON.parse(localStorage.getItem("orr-biorealm-v1")), text: document.querySelector("#gameView")?.innerText?.slice(-500) })); throw new Error(`completed expedition did not expose a reveal control: ${JSON.stringify(probe)}`); }
  await page.locator('[data-action="collect-expedition"]').click();
  await page.locator("#revealModal:not([hidden])").waitFor();
  const discovery = await page.evaluate(() => ({
    modal: document.querySelector("#revealContent")?.innerText,
    save: JSON.parse(localStorage.getItem("orr-biorealm-v1")),
  }));
  if (!/Common|Uncommon|Rare|Epic|Legendary/.test(discovery.modal) || discovery.save.stats.completedExpeditions !== 1) throw new Error("discovery reveal did not update the archive");

  await page.locator('.modal-close[data-action="close-reveal"]').click();
  await page.locator('.side-nav-button[data-view="reactors"]').click();
  await page.waitForTimeout(1200);
  const reactorBefore = await page.evaluate(() => document.querySelector(".reactor-card")?.innerText || "");
  if (!/biomass|harvest/i.test(reactorBefore)) throw new Error("cultivation hall did not render reactor production");
  const environmentSelect = page.locator('select[data-action="set-reactor-environment"]').first();
  await environmentSelect.selectOption("warm");
  const environmentSaved = await page.evaluate(() => JSON.parse(localStorage.getItem("orr-biorealm-v1"))?.reactors?.[0]?.environment);
  if (environmentSaved !== "warm") throw new Error("reactor environment assignment did not persist");
  const settingsButton = page.locator('.game-utility-links [data-view="settings"]');
  await settingsButton.scrollIntoViewIfNeeded();
  await settingsButton.evaluate((button) => button.click());
  if (await page.locator('.volume-row input[type="range"]').count() !== 2) throw new Error("separate music and sound effect volume controls did not render");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const mobile = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth }));
  if (mobile.overflow) throw new Error(`mobile layout overflowed: ${mobile.width} > ${mobile.viewport}`);
  return { fresh, running, ready: { status: "resolved by collect action" }, discovery: { modal: discovery.modal.slice(0, 120), archive: discovery.save.discovered.length }, reactorRendered: /biomass|harvest/i.test(reactorBefore), environmentSaved, audioControls: 2, mobile };
}
