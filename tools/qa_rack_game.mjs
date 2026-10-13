/* Browser QA for the active Microflux rack page.
 * Run with the browser-automation skill's browser.mjs --script option.
 */

export default async function run(page) {
  await page.evaluate(() => localStorage.removeItem("orr-microflux-rack-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#worldCanvas").waitFor();

  const initial = await page.evaluate(() => ({
    title: document.title,
    map: document.querySelector("#zoneName")?.textContent,
    credits: document.querySelector("#creditReadout")?.textContent,
    hasRackCanvas: Boolean(document.querySelector("#worldCanvas")),
    hasSubmarineCopy: /submersible|submarine/i.test(document.body.innerText),
  }));

  await page.locator("#harvestButton").click();
  await page.waitForTimeout(80);
  const afterTap = await page.evaluate(() => ({
    cells: document.querySelector("#sampleReadout")?.textContent,
    credits: document.querySelector("#creditReadout")?.textContent,
    toast: document.querySelector("#pixelToast")?.textContent,
  }));

  for (let index = 0; index < 12; index += 1) {
    await page.locator("#harvestButton").click();
  }
  await page.getByRole("button", { name: /tune device/i }).click();
  await page.waitForTimeout(80);
  await page.locator('[data-action="travel"][data-map-id="sand"]').click();
  await page.waitForTimeout(80);
  const afterMapUnlock = await page.evaluate(() => ({
    map: document.querySelector("#zoneName")?.textContent,
    meta: document.querySelector("#zoneMeta")?.textContent,
    hasGoldDust: document.body.innerText.includes("Gold Dust"),
    deviceText: document.body.innerText.match(/Device tuning · level \d+/)?.[0],
  }));

  await page.evaluate(() => {
    const key = "orr-microflux-rack-v1";
    const saved = JSON.parse(localStorage.getItem(key));
    saved.lastSavedAt = Date.now() - 60 * 1000;
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload({ waitUntil: "networkidle" });
  const awaytime = await page.evaluate(() => ({
    credits: document.querySelector("#creditReadout")?.textContent,
    hasAwayNote: document.body.innerText.includes("While you were away"),
  }));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const mobile = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    canvasWidth: document.querySelector("#worldCanvas")?.getBoundingClientRect().width,
  }));

  return { initial, afterTap, afterMapUnlock, awaytime, mobile };
}
