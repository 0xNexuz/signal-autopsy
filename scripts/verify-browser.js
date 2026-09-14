import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://localhost:3001";
const browser = await chromium.launch({ headless: true });
const errors = [];

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  desktop.on("pageerror", (error) => errors.push(error.message));
  await desktop.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await desktop.waitForTimeout(500);
  const capabilityStatus = desktop.locator(".status-line").first();
  assert.match(await capabilityStatus.innerText(), /UTA V3: CHECK ON LOAD/);
  assert.match(await capabilityStatus.innerText(), /SIMULATED EXECUTION ONLY/);
  assert.equal(await desktop.locator("#probeOverlay").getAttribute("aria-hidden"), "false");

  const originalThesis = await desktop.locator("#thesis").inputValue();
  await desktop.locator("#strategy").selectOption("Earnings event defense");
  await desktop.waitForTimeout(50);
  assert.notEqual(await desktop.locator("#thesis").inputValue(), originalThesis);

  await desktop.waitForFunction(() => !document.querySelector("#replayCard").classList.contains("probing"), null, { timeout: 30000 });
  const overflow = await desktop.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert.equal(overflow, false);
  await desktop.screenshot({ path: "outputs/audit-desktop.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await mobile.waitForFunction(() => !document.querySelector("#replayCard").classList.contains("probing"), null, { timeout: 30000 });
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert.equal(mobileOverflow, false);
  await mobile.screenshot({ path: "outputs/audit-mobile.png", fullPage: true });

  assert.deepEqual(errors, []);
  console.log("Browser verification passed: loading state, thesis reactivity, status labels, console, and responsive overflow.");
} finally {
  await browser.close();
}
