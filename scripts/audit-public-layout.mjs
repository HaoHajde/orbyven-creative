import { chromium } from "playwright";

const chromePath = process.env.CHROME_PATH;
const baseUrl = process.env.ORBYVEN_AUDIT_BASE_URL || "http://127.0.0.1:3000";
if (!chromePath) {
  console.error("CHROME_PATH is required.");
  process.exit(1);
}

const themeRoutes = new Set([
  "/",
  "/servicii",
  "/contact",
  "/templates",
  "/porneste/invitatie",
  "/porneste/web-design",
]);

const routes = [
  "/",
  "/servicii",
  "/contact",
  "/templates",
  "/porneste/invitatie",
  "/porneste/web-design",
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
      hasTouch: device.isMobile,
      deviceScaleFactor: device.isMobile ? 2 : 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    for (const route of routes) {
      const pageErrors = [];
      const onPageError = (error) => { pageErrors.push(error instanceof Error ? error.message : String(error)); };
      page.on("pageerror", onPageError);
      try {
        await page.goto(baseUrl + route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(250);
        const frameStates = [];
        for (const frame of page.frames()) {
          try {
            frameStates.push(await frame.evaluate(() => {
              const width = document.documentElement.scrollWidth;
              const viewport = window.innerWidth;
              const bodyText = document.body?.innerText?.trim() || "";
              const interactiveFixed = [...document.querySelectorAll("button, a, nav, header, aside, [role='dialog'], [role='menu']")]
                .filter((element) => {
                  const style = getComputedStyle(element);
                  if (style.position !== "fixed" || style.visibility === "hidden" || style.display === "none" || style.pointerEvents === "none" || Number(style.opacity || "1") === 0) return false;
                  const rect = element.getBoundingClientRect();
                  return rect.width > 1 && rect.height > 1 && rect.right > 0 && rect.bottom > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight;
                })
                .map((element) => {
                  const rect = element.getBoundingClientRect();
                  return { left: rect.left, right: rect.right, width: rect.width };
                });
              const minTouchFont = [...document.querySelectorAll("input, textarea, select")]
                .filter((element) => {
                  if (element instanceof HTMLInputElement && ["checkbox", "radio", "range", "hidden"].includes(element.type)) return false;
                  const style = getComputedStyle(element);
                  let node = element;
                  while (node) {
                    if (getComputedStyle(node).pointerEvents === "none") return false;
                    node = node.parentElement;
                  }
                  return style.display !== "none" && style.visibility !== "hidden";
                })
                .reduce((min, element) => Math.min(min, Number.parseFloat(getComputedStyle(element).fontSize) || 999), 999);
              return { width, viewport, bodyTextLength: bodyText.length, interactiveFixed, minTouchFont };
            }));
          } catch {
            // A third-party frame that cannot be inspected must not invalidate the ORBYVEN shell.
          }
        }

        if (frameStates.some((state) => state.width > state.viewport + 2)) throw new Error("horizontal overflow");
        if (!frameStates.some((state) => state.bodyTextLength > 0)) throw new Error("blank page");
        if (pageErrors.length > 0) throw new Error("browser runtime exception: " + pageErrors[0]);
        if (device.isMobile && frameStates.some((state) => state.minTouchFont < 16)) throw new Error("touch form control below 16px");
        if (frameStates.some((state) => state.interactiveFixed.some((rect) => rect.left < -3 || rect.right > state.viewport + 3 || rect.width > state.viewport + 6))) {
          throw new Error("interactive fixed element escapes viewport");
        }

        if (themeRoutes.has(route)) {
          for (const theme of ["light", "dark"]) {
            await page.evaluate((value) => window.localStorage.setItem("studio-theme", value), theme);
            await page.reload({ waitUntil: "domcontentloaded" });
            await page.waitForTimeout(180);
            const themeState = await page.evaluate((expectedTheme) => {
              const root = document.querySelector(`[data-orbyven-theme="${expectedTheme}"]`);
              if (!root) return { rootFound: false, overflow: true, bg: "", accent: "" };
              const style = getComputedStyle(root);
              return {
                rootFound: true,
                overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
                bg: style.getPropertyValue("--bg").trim().toLowerCase(),
                accent: style.getPropertyValue("--accent").trim().toLowerCase(),
              };
            }, theme);
            if (!themeState.rootFound) throw new Error(`${theme} theme marker missing`);
            if (themeState.overflow) throw new Error(`${theme} theme horizontal overflow`);
            if (theme === "light" && ["#fff", "#ffffff", "white"].includes(themeState.bg)) {
              throw new Error("light theme reverted to pure white");
            }
            if (theme === "light" && !themeState.accent) throw new Error("light theme accent missing");
          }
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
