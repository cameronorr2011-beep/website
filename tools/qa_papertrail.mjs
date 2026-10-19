import assert from "node:assert/strict";

export default async function run(page) {
  const errors = [];
  const failed = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && ["script", "stylesheet", "image", "xhr", "fetch"].includes(response.request().resourceType())) {
      failed.push({ url: response.url(), status: response.status() });
    }
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://127.0.0.1:8080/papertrail/", { waitUntil: "networkidle" });
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await page.locator(".pt-status-label").first().innerText(), "NEW / EMPTY SESSION");
  assert.equal(await page.locator(".pt-panel").innerText().then((value) => value.includes("No run has been started")), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  assert.equal(await page.evaluate(() => performance.getEntriesByType("resource").some((entry) => entry.name.includes("/api/papertrail/"))), false);

  await page.getByRole("button", { name: /start demo investigation/i }).first().click();
  await page.waitForSelector('.pt-status-label[data-state="completed"]', { timeout: 7000 });
  await page.getByRole("tab", { name: /agent roles/i }).click();
  assert.equal(await page.locator(".pt-agent-card").count(), 4);
  await page.getByRole("tab", { name: /agent laboratory/i }).click();
  assert.equal(await page.locator(".pt-lab-record").count(), 4);
  await page.getByRole("tab", { name: /evidence/i }).click();
  await page.locator("[data-evidence-search]").fill("PT-SRC-003");
  assert.equal(await page.locator(".pt-source-card").count(), 1);
  await page.locator("[data-evidence-search]").fill("");

  await page.getByRole("tab", { name: /final report/i }).click();
  assert.equal(await page.locator(".pt-report").count(), 1);
  assert.equal(await page.locator(".pt-report").innerText().then((value) => value.includes("SYNTHETIC DEMONSTRATION DATA")), true);

  await page.getByRole("tab", { name: /claims/i }).click();
  await page.locator(".pt-claim-select").first().click();
  assert.equal(await page.locator(".pt-claim-detail").count(), 1);
  assert.equal(await page.locator(".pt-source-trace-list").count() > 0, true);

  await page.getByRole("tab", { name: /debate/i }).click();
  assert.equal(await page.locator('.pt-debate-card[data-kind="disagreement"]').count(), 1);
  assert.equal(await page.locator('.pt-debate-card[data-kind="rebuttal"]').count(), 1);
  assert.equal(await page.locator('.pt-debate-card[data-kind="adjudication"]').count(), 1);

  await page.getByRole("tab", { name: /trace table/i }).click();
  assert.equal(await page.locator(".pt-trace-table tbody tr").count() >= 5, true);

  await page.getByRole("tab", { name: /final report/i }).click();
  await page.getByRole("button", { name: /export session json/i }).click();
  await page.waitForTimeout(100);
  assert.equal(await page.locator(".pt-toast").innerText(), "Session JSON export prepared. It contains synthetic data only.");

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('.pt-status-label[data-state="completed"]');
  assert.equal(await page.locator(".pt-storage-card").innerText().then((value) => value.includes("recovered")), true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  assert.equal(await page.locator("#pt-investigation-form").count(), 1);
  assert.equal(await page.getByRole("button", { name: /configure api/i }).count(), 1);

  await page.evaluate(() => {
    localStorage.removeItem("papertrail.api-base.v1");
    localStorage.setItem("papertrail.live-session.v1", JSON.stringify({
      kind: "papertrail-live-session",
      schemaVersion: 1,
      session: {
        id: "stale-live-session",
        question: "A persisted live run after an API restart",
        options: {},
        model: null,
        status: "RUNNING",
        cancelRequested: false,
        createdAt: "2026-10-15T00:00:00.000Z",
        updatedAt: "2026-10-15T00:00:00.000Z",
      },
      events: [],
      sources: [],
      agentRuns: [],
      claims: [],
      evidence: [],
      evidenceLinks: [],
      debate: null,
      report: null,
      audit: null,
      lastEventId: 0,
    }));
  });
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator(".pt-status-label").first().innerText(), "RUNNING / STALE SNAPSHOT");
  assert.equal(await page.locator(".pt-live-mode-label").innerText(), "LIVE SNAPSHOT / STALE OR UNKNOWN");
  assert.equal(await page.locator("#pt-live-card").innerText().then((value) => value.includes("LIVE MODE UNAVAILABLE")), true);
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  return { passed: true, errors, failed };
}
