/* Browser QA for the active Microflux Rack Run page.
 * Run with the browser-automation skill's browser.mjs --script option.
 */

async function waitForTarget(page) {
  const handle = await page.waitForFunction(() => {
    const targets = JSON.parse(document.querySelector("#worldCanvas")?.dataset.targets || "[]");
    return targets.find((target) => target.atGate && target.type !== "debris") || null;
  }, null, { timeout: 12000 });
  return handle.jsonValue();
}

async function clickCanvasPoint(page, target) {
  await page.evaluate(({ x, y }) => {
    const canvas = document.querySelector("#worldCanvas");
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      clientX: rect.left + x / 960 * rect.width,
      clientY: rect.top + y / 560 * rect.height,
    }));
  }, target);
}

async function readGame(page) {
  return page.evaluate(() => ({
    credits: document.querySelector("#creditReadout")?.textContent,
    cells: document.querySelector("#sampleReadout")?.textContent,
    combo: document.querySelector("#comboReadout")?.textContent,
    accuracy: document.querySelector("#accuracyReadout")?.textContent,
    batch: document.querySelector("#batchReadout")?.textContent,
  }));
}

export default async function run(page) {
  await page.evaluate(() => {
    localStorage.removeItem("orr-microflux-rack-v1");
    localStorage.removeItem("orr-microflux-rack-v2");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#worldCanvas").waitFor();

  const initial = await page.evaluate(() => ({
    title: document.title,
    map: document.querySelector("#zoneName")?.textContent,
    credits: document.querySelector("#creditReadout")?.textContent,
    hasRackCanvas: Boolean(document.querySelector("#worldCanvas")),
    hasComboHud: Boolean(document.querySelector("#comboReadout")),
    hasSubmarineCopy: /submersible|submarine/i.test(document.body.innerText),
    hasModuleShop: Boolean(document.querySelector(".module-grid")),
  }));

  const beforeEmptyClick = await readGame(page);
  const canvasBox = await page.locator("#worldCanvas").boundingBox();
  await page.mouse.click(canvasBox.x + 20, canvasBox.y + 20);
  await page.waitForTimeout(60);
  const afterEmptyClick = await readGame(page);

  let target;
  let afterCatch;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    target = await waitForTarget(page);
    await clickCanvasPoint(page, target);
    await page.waitForTimeout(70);
    afterCatch = await readGame(page);
    if (afterCatch.cells !== afterEmptyClick.cells) break;
  }
  if (afterCatch.cells === afterEmptyClick.cells) throw new Error("Canvas target click did not register a catch");

  const seeded = await page.evaluate(() => {
    const key = "orr-microflux-rack-v2";
    const saved = JSON.parse(localStorage.getItem(key));
    saved.credits = 1000;
    saved.deviceLevel = 2;
    saved.upgrades.pipette = 1;
    saved.lastSavedAt = Date.now();
    localStorage.setItem(key, JSON.stringify(saved));
    return { credits: saved.credits, deviceLevel: saved.deviceLevel, pipette: saved.upgrades.pipette };
  });
  await page.reload({ waitUntil: "networkidle" });
  const reloaded = await page.evaluate(() => ({
    credits: document.querySelector("#creditReadout")?.textContent,
    map: document.querySelector("#zoneName")?.textContent,
  }));
  await page.locator('[data-action="travel"][data-map-id="sand"]').click();
  await page.waitForTimeout(100);
  const afterMapUnlock = await page.evaluate(() => ({
    credits: document.querySelector("#creditReadout")?.textContent,
    map: document.querySelector("#zoneName")?.textContent,
    hasGoldDust: document.body.innerText.includes("Gold Dust"),
  }));

  await page.evaluate(() => {
    const key = "orr-microflux-rack-v2";
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

  return { initial, beforeEmptyClick, afterEmptyClick, target, afterCatch, seeded, reloaded, afterMapUnlock, awaytime, mobile };
}
