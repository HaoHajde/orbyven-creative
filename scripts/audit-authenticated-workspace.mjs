import { chromium } from "playwright";

/**
 * Opt-in, read-only smoke for a DEDICATED ORBYVEN QA organization.
 * Never log user emails, passwords, tokens, response bodies, or page contents.
 * Browser contexts are ephemeral and no screenshots/traces are retained.
 */
const email = process.env.ORBYVEN_QA_EMAIL;
const password = process.env.ORBYVEN_QA_PASSWORD;
const chromePath = process.env.CHROME_PATH;

if (!email || !password) {
  console.error("Set repository secrets ORBYVEN_QA_EMAIL and ORBYVEN_QA_PASSWORD for a dedicated non-production-data QA account.");
  process.exit(1);
}
if (!chromePath) {
  console.error("Chrome path unavailable on the runner.");
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let failed = false;
try {
  for (const device of [
    { name: "small-mobile", viewport: { width: 320, height: 568 }, isMobile: true },
    { name: "iphone", viewport: { width: 390, height: 844 }, isMobile: true },
    { name: "landscape-phone", viewport: { width: 844, height: 390 }, isMobile: true },
    { name: "tablet", viewport: { width: 768, height: 1024 }, isMobile: true },
    { name: "desktop", viewport: { width: 1366, height: 900 }, isMobile: false },
    { name: "wide-desktop", viewport: { width: 1920, height: 1080 }, isMobile: false },
  ]) {
    const context = await browser.newContext({
      viewport: device.viewport,
      isMobile: device.isMobile,
      deviceScaleFactor: device.isMobile ? 2 : 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    let scriptErrors = 0;
    page.on("pageerror", () => { scriptErrors++; });

    try {
      await page.goto("https://orbyven.ro/workspace/login", { waitUntil: "domcontentloaded" });
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Parolă", { exact: true }).fill(password);
      const started = Date.now();
      await page.getByRole("button", { name: "Intră în workspace" }).click();
      await page.locator('button[aria-label="Schimbă tema"]').waitFor();
      const loginToWorkspaceMs = Date.now() - started;
      const state = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
        searchCount: document.querySelectorAll('input[placeholder="Caută client, lucrare, ofertă..."]').length,
      }));
      if (state.width > state.viewport + 2) throw new Error("Horizontal overflow on workspace");
      if (state.searchCount !== 1) throw new Error("Workspace search instance count differs from one");

      const aiLauncher = page.getByRole("button", { name: "Deschide ORBYVEN Intelligence" });
      await aiLauncher.click();
      const aiDialog = page.getByRole("dialog", { name: "ORBYVEN Intelligence" });
      await aiDialog.waitFor();
      const dialogBounds = await aiDialog.boundingBox();
      if (!dialogBounds || dialogBounds.x < -1 || dialogBounds.y < -1 || dialogBounds.x + dialogBounds.width > device.viewport.width + 1 || dialogBounds.y + dialogBounds.height > device.viewport.height + 1) {
        throw new Error("ORBYVEN Intelligence escaped the viewport");
      }
      await page.getByRole("button", { name: "Închide chatul" }).click();
      if (device.isMobile) {
        const menu = page.getByRole("button", { name: "Deschide meniul modulelor" });
        await menu.click();
        if ((await menu.getAttribute("aria-expanded")) !== "true") {
          throw new Error("Mobile module navigation did not open");
        }
      } else {
        await page.getByRole("button", { name: "Schimbă tema" }).waitFor();
      }
      if (scriptErrors > 0) throw new Error("Browser runtime exception");
      console.log(`${device.name}: authenticated workspace loaded; click-to-dashboard=${loginToWorkspaceMs}ms; search instances=1; horizontal overflow=no; browser exceptions=0`);
    } catch {
      failed = true;
      // Do not expose the browser's DOM or network error; it may contain QA data.
      console.error(`${device.name}: authenticated QA failed. Verify QA account/role, workspace access, route and layout via a secure browser session.`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
