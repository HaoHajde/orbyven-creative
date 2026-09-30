import { chromium } from "playwright";

/**
 * Opt-in, read-only smoke for a DEDICATED ORBYVEN QA organization.
 * Never log user emails, passwords, tokens, response bodies, DOM text,
 * screenshots or traces. Browser contexts are ephemeral.
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

const devices = [
  { name: "compact-phone", viewport: { width: 320, height: 568 }, isMobile: true, scale: 2 },
  { name: "phone", viewport: { width: 390, height: 844 }, isMobile: true, scale: 2 },
  { name: "large-phone", viewport: { width: 430, height: 932 }, isMobile: true, scale: 3 },
  { name: "tablet-portrait", viewport: { width: 768, height: 1024 }, isMobile: true, scale: 2 },
  { name: "tablet-landscape", viewport: { width: 1024, height: 768 }, isMobile: true, scale: 2 },
  { name: "laptop", viewport: { width: 1280, height: 720 }, isMobile: false, scale: 1 },
  { name: "desktop", viewport: { width: 1440, height: 900 }, isMobile: false, scale: 1 },
];

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function readLayoutState(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'))
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      });

    return {
      width: Math.max(root.scrollWidth, document.body?.scrollWidth || 0),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      searchCount: document.querySelectorAll('input[placeholder="Caută client, lucrare, ofertă..."]').length,
      dialogs,
    };
  });
}

async function assertLayout(page, label) {
  const state = await readLayoutState(page);
  if (state.width > state.viewportWidth + 2) {
    throw new Error(label + ": horizontal overflow");
  }
  for (const dialog of state.dialogs) {
    if (
      dialog.left < -2 ||
      dialog.right > state.viewportWidth + 2 ||
      dialog.top < -2 ||
      dialog.bottom > state.viewportHeight + 2
    ) {
      throw new Error(label + ": dialog escaped viewport");
    }
  }
  return state;
}

async function visibleModuleIds(page) {
  return page.locator("[data-workspace-module]").evaluateAll((elements) =>
    Array.from(new Set(
      elements
        .filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        })
        .map((element) => element.getAttribute("data-workspace-module"))
        .filter(Boolean),
    )),
  );
}

let failed = false;
try {
  for (const device of devices) {
    const context = await browser.newContext({
      viewport: device.viewport,
      isMobile: device.isMobile,
      hasTouch: device.isMobile,
      deviceScaleFactor: device.scale,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    let scriptErrors = 0;
    page.on("pageerror", () => { scriptErrors += 1; });

    try {
      await page.goto("https://orbyven.ro/workspace/login", { waitUntil: "domcontentloaded" });
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Parolă", { exact: true }).fill(password);
      const started = Date.now();
      await page.getByRole("button", { name: "Intră în workspace" }).click();
      await page.locator('button[aria-label="Schimbă tema"]').waitFor();
      const loginToWorkspaceMs = Date.now() - started;

      let state = await assertLayout(page, device.name + " workspace");
      if (state.searchCount !== 1) {
        throw new Error("Workspace search instance count differs from one");
      }

      const compactNav = device.viewport.width < 768;
      if (compactNav) {
        const menu = page.getByRole("button", { name: "Deschide meniul modulelor" });
        await menu.click();
        if ((await menu.getAttribute("aria-expanded")) !== "true") {
          throw new Error("Mobile module navigation did not open");
        }
        await assertLayout(page, device.name + " module menu");
      }

      const moduleIds = await visibleModuleIds(page);
      if (!moduleIds.length) throw new Error("No visible workspace modules found");

      for (const moduleId of moduleIds) {
        if (compactNav) {
          const toggle = page.getByRole("button", { name: /meniul modulelor/ });
          if ((await toggle.getAttribute("aria-expanded")) !== "true") {
            await page.getByRole("button", { name: "Deschide meniul modulelor" }).click();
          }
        }

        await page.locator(`[data-workspace-module="${moduleId}"]:visible`).first().click();
        await page.waitForTimeout(90);
        await assertLayout(page, device.name + " module " + moduleId);
      }

      const ai = page.getByRole("button", { name: "Deschide ORBYVEN Intelligence" });
      if (await ai.count()) {
        await ai.click();
        await page.locator('#orbyven-intelligence-dialog[role="dialog"]').waitFor();
        await assertLayout(page, device.name + " AI overlay");
        await page.getByRole("button", { name: "Închide chatul" }).click();
      }

      const activity = page.getByRole("button", { name: "Deschide atenționările" });
      if (await activity.count()) {
        await activity.click();
        await page.getByRole("dialog", { name: "Atenționări ORBYVEN" }).waitFor();
        await assertLayout(page, device.name + " activity overlay");
        await page.getByRole("button", { name: "Închide atenționările" }).click();
      }

      state = await assertLayout(page, device.name + " final");
      if (state.searchCount !== 1) throw new Error("Workspace search duplicated after module navigation");
      if (scriptErrors > 0) throw new Error("Browser runtime exception");

      console.log(
        `${device.name}: authenticated workspace + ${moduleIds.length} modules + overlays OK; login=${loginToWorkspaceMs}ms; overflow=no; browser exceptions=0`,
      );
    } catch {
      failed = true;
      console.error(
        `${device.name}: authenticated QA failed. Verify the dedicated QA account and inspect the secure workflow logs without exposing organization data.`,
      );
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failed) process.exitCode = 1;
