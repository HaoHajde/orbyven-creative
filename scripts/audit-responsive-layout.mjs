import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const chromePath = process.env.CHROME_PATH;
const baseUrl = (process.env.ORBYVEN_AUDIT_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const outputDir = process.env.ORBYVEN_AUDIT_OUTPUT_DIR || "lighthouse";

if (!chromePath) {
  console.error("Chrome path unavailable on the runner.");
  process.exit(1);
}

const routes = [
  "/",
  "/servicii",
  "/templates",
  "/contact",
  "/invitatii-nunta",
  "/templates/florarie-bragadiru",
  "/templates/haos-customs",
  "/templates/obsidian-moments",
  "/demo/nunta/elegant",
  "/workspace/login",
  "/workspace/register",
  "/workspace/forgot-password",
  "/workspace/reset-password",
  "/admin/login",
  "/control-center/login",
];

const devices = [
  { name: "compact-phone", width: 320, height: 568, mobile: true, scale: 2 },
  { name: "phone", width: 390, height: 844, mobile: true, scale: 2 },
  { name: "large-phone", width: 430, height: 932, mobile: true, scale: 3 },
  { name: "tablet-portrait", width: 768, height: 1024, mobile: true, scale: 2 },
  { name: "tablet-landscape", width: 1024, height: 768, mobile: true, scale: 2 },
  { name: "laptop", width: 1280, height: 720, mobile: false, scale: 1 },
  { name: "desktop", width: 1440, height: 900, mobile: false, scale: 1 },
];

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const results = [];
let failed = false;

try {
  for (const device of devices) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.mobile,
      hasTouch: device.mobile,
      deviceScaleFactor: device.scale,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);

    for (const route of routes) {
      let pageErrors = 0;
      const onPageError = () => { pageErrors += 1; };
      page.on("pageerror", onPageError);

      const record = {
        device: device.name,
        viewport: `${device.width}x${device.height}`,
        route,
        ok: false,
        status: null,
        horizontalOverflow: null,
        pageErrors: 0,
      };

      try {
        const response = await page.goto(baseUrl + route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(120);

        const state = await page.evaluate(() => {
          const root = document.documentElement;
          const body = document.body;
          return {
            scrollWidth: Math.max(root.scrollWidth, body?.scrollWidth || 0),
            innerWidth: window.innerWidth,
            bodyTextLength: body?.innerText.trim().length || 0,
            viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute("content") || "",
          };
        });

        record.status = response?.status() ?? null;
        record.horizontalOverflow = state.scrollWidth > state.innerWidth + 2;
        record.pageErrors = pageErrors;

        if (record.status && record.status >= 400) {
          throw new Error(`HTTP ${record.status}`);
        }
        if (state.bodyTextLength < 10) {
          throw new Error("Page rendered without meaningful content");
        }
        if (!/width=device-width/i.test(state.viewportMeta)) {
          throw new Error("Responsive viewport metadata missing");
        }
        if (record.horizontalOverflow) {
          throw new Error(`Horizontal overflow: ${state.scrollWidth}px > ${state.innerWidth}px`);
        }
        if (pageErrors > 0) {
          throw new Error(`Browser runtime exceptions: ${pageErrors}`);
        }

        if (device.width < 768) {
          const menu = page.getByRole("button", { name: "Deschide meniul" });
          if (await menu.count()) {
            await menu.click();
            await page.waitForTimeout(80);
            const menuState = await page.evaluate(() => ({
              scrollWidth: document.documentElement.scrollWidth,
              innerWidth: window.innerWidth,
            }));
            if (menuState.scrollWidth > menuState.innerWidth + 2) {
              throw new Error("Public mobile menu introduces horizontal overflow");
            }
            const closeMenu = page.getByRole("button", { name: "Închide meniul" });
            if (await closeMenu.count()) await closeMenu.click();
          }
        }

        record.ok = true;
        console.log(`${device.name} ${route}: OK`);
      } catch (error) {
        failed = true;
        record.error = error instanceof Error ? error.message : "unknown responsive audit error";
        console.error(`${device.name} ${route}: FAIL - ${record.error}`);
      } finally {
        page.off("pageerror", onPageError);
        results.push(record);
      }
    }

    await context.close();
  }
} finally {
  await browser.close();
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  `${outputDir}/responsive-audit.json`,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseUrl,
      devices,
      routes,
      failures: results.filter((item) => !item.ok).length,
      results,
    },
    null,
    2,
  ),
);

if (failed) process.exitCode = 1;
