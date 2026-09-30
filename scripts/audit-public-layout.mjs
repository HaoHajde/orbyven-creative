import { chromium } from "playwright";

const chromePath = process.env.CHROME_PATH;
const baseUrl = process.env.ORBYVEN_AUDIT_BASE_URL || "http://127.0.0.1:3000";
if (!chromePath) {
  console.error("CHROME_PATH is required.");
  process.exit(1);
}

const routes = [
  "/",
  "/servicii",
  "/contact",
  "/templates",
  "/workspace/login",
  "/workspace/register",
  "/workspace/forgot-password",
  "/admin/login",
  "/control-center/login",
  "/templates/haos-customs",
  "/templates/florarie-bragadiru",
];

const devices = [
  { name: "small-phone", width: 320, height: 568, isMobile: true },
  { name: "phone", width: 390, height: 844, isMobile: true },
  { name: "phone-landscape", width: 844, height: 390, isMobile: true },
  { name: "tablet", width: 768, height: 1024, isMobile: true },
  { name: "laptop", width: 1366, height: 900, isMobile: false },
  { name: "wide", width: 1920, height: 1080, isMobile: false },
];

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let failures = 0;
try {
  for (const device of devices) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.isMobile,
      deviceScaleFactor: device.isMobile ? 2 : 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    for (const route of routes) {
      let pageErrors = 0;
      const onPageError = () => { pageErrors += 1; };
      page.on("pageerror", onPageError);
      try {
        await page.goto(baseUrl + route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(80);
        const state = await page.evaluate(() => {
          const width = document.documentElement.scrollWidth;
          const viewport = window.innerWidth;
          const bodyText = document.body?.innerText?.trim() || "";
          const visibleFixed = [...document.querySelectorAll("*")]
            .filter((element) => {
              const style = getComputedStyle(element);
              if (style.position !== "fixed") return false;
              const rect = element.getBoundingClientRect();
              return rect.width > 1 && rect.height > 1 && style.visibility !== "hidden" && style.display !== "none";
            })
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return { left: rect.left, right: rect.right, width: rect.width };
            });
          const minTouchFont = [...document.querySelectorAll("input, textarea, select")]
            .filter((element) => {
              const input = element;
              if (input instanceof HTMLInputElement && ["checkbox", "radio", "range", "hidden"].includes(input.type)) return false;
              const style = getComputedStyle(element);
              return style.display !== "none" && style.visibility !== "hidden";
            })
            .reduce((min, element) => Math.min(min, Number.parseFloat(getComputedStyle(element).fontSize) || 999), 999);
          return { width, viewport, bodyTextLength: bodyText.length, visibleFixed, minTouchFont };
        });

        if (state.width > state.viewport + 2) throw new Error("horizontal overflow");
        if (state.bodyTextLength === 0) throw new Error("blank page");
        if (pageErrors > 0) throw new Error("browser runtime exception");
        if (device.isMobile && state.minTouchFont < 16) throw new Error("touch form control below 16px");
        if (state.visibleFixed.some((rect) => rect.left < -3 || rect.right > device.width + 3 || rect.width > device.width + 6)) {
          throw new Error("fixed element escapes viewport");
        }
        console.log(`${device.name} ${route}: ok`);
      } catch (error) {
        failures += 1;
        console.error(`${device.name} ${route}: ${error instanceof Error ? error.message : "failed"}`);
      } finally {
        page.off("pageerror", onPageError);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures > 0) {
  console.error(`Cross-device layout smoke failed with ${failures} issue(s).`);
  process.exit(1);
}
console.log("Cross-device layout smoke passed.");
