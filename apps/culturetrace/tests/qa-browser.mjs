export default async function run(page) {
  await page.waitForFunction(() => document.body.innerText.includes("EVIDENCE-LINKED FINDINGS"), { timeout: 15000 });
  const initial = await page.title();
  const analysisText = await page.locator("body").innerText();
  const findingCount = await page.locator(".finding-row").count();
  await page.getByRole("button", { name: "Reports" }).click();
  await page.waitForFunction(() => document.body.innerText.includes("REPRODUCIBLE OUTPUT"));
  const reportText = await page.locator("body").innerText();
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  return { initial, hasAnalysis: analysisText.includes("DETERMINISTIC ANALYSIS"), findingCount, hasReport: reportText.includes("DETERMINISTIC REPORT READY"), mobileOverflow };
}
