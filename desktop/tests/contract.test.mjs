import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const content = (url) => readFileSync(new URL(url, import.meta.url), "utf8");
const config = JSON.parse(content("../src-tauri/tauri.conf.json"));
const manifest = JSON.parse(content("../package.json"));
const client = content("../src/client.ts");
const bootstrap = content("../../app/api/desktop/config/route.ts");

test("desktop ships its own compiled local UI rather than loading the website", () => {
  assert.equal(config.build.frontendDist, "../dist");
  assert.equal(config.build.beforeBuildCommand, "npm run build:web");
  assert.equal(config.build.devUrl, "http://localhost:1420");
  assert.equal(config.build.beforeDevCommand, "npm run dev:web");
  assert.equal(config.app.windows[0].url, undefined);
  assert.equal(manifest.scripts["build:web"], "vite build");
  assert.match(content("../src/App.tsx"), /ORBYVEN · Desktop Workspace/);
});

test("only PUBLIC Supabase values are obtained at startup", () => {
  assert.match(client, /https:\/\/orbyven\.ro\/api\/desktop\/config/);
  assert.match(bootstrap, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(bootstrap, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(bootstrap, /process\.env\.(?:SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY)/);
  assert.doesNotMatch(client, /service_role|SERVICE_ROLE|STRIPE_SECRET/i);
});

test("existing tenant access checks and module functions are reused", () => {
  const app = content("../src/App.tsx");
  assert.match(app, /await getWorkspaceAccessState\(\)/);
  assert.match(app, /await getCurrentWorkspace\(\)/);
  for (const fn of ["listCrmLeads", "listWorkTasks", "listCalendarEvents", "listEstimates", "listDocuments", "listExpenses", "listTeamMembers"]) {
    assert.ok(app.includes(fn), "Expected original module function: " + fn);
  }
  assert.match(app, /if \(activeModule === "expenses" && !canFinance\)/);
});

test("remote website cannot use native Tauri commands", () => {
  assert.deepEqual(config.app.security.capabilities, []);
  const main = content("../src-tauri/src/main.rs");
  assert.doesNotMatch(main, /\.invoke_handler\s*\(/);
  assert.doesNotMatch(main, /\.plugin\s*\(/);
  assert.doesNotMatch(config.app.security.csp, /unsafe-eval/);
});

test("signed Windows installer has not been claimed; NSIS with OC icon is configured", () => {
  assert.deepEqual(config.bundle.targets, ["nsis"]);
  assert.ok(config.bundle.icon.includes("icons/icon.ico"));
  assert.equal(config.bundle.windows.webviewInstallMode.type, "downloadBootstrapper");
  assert.equal(config.app.windows[0].resizable, true);
  assert.equal(config.version, "0.3.1");
});

test("desktop matches the real web workspace without loading remote HTML", () => {
  const app = content("../src/App.tsx");
  const brand = content("../src/Brand.tsx");
  const website = content("../../components/ClientWorkspace.tsx");
  const css = content("../src/styles.css");
  assert.match(brand, /\.\.\/\.\.\/app\/icon\.svg\?url/);
  assert.match(app, /ORBYVEN \/ OVERVIEW/);
  assert.match(app, /ModuleGlyph/);
  assert.match(app, /setOrganizationModuleEnabled/);
  assert.match(app, /setCommandOpen/);
  assert.match(app, /Ctrl K/);
  assert.match(css, /grid-template-columns:206px minmax\(0,1fr\)/);
  for (const label of ["OVERVIEW", "BUSINESS", "OPERATIONS"]) {
    assert.ok(app.includes(label) && website.includes(label), "Shared nav group: " + label);
  }
});

test("NSIS installer carries ORBYVEN visual identity", () => {
  const nsis = config.bundle.windows.nsis;
  const generator = content("../scripts/generate-installer-brand.ps1");
  assert.equal(nsis.installerIcon, "icons/icon.ico");
  assert.equal(nsis.uninstallerIcon, "icons/icon.ico");
  assert.equal(nsis.headerImage, "installer/orbyven-header.bmp");
  assert.equal(nsis.uninstallerHeaderImage, "installer/orbyven-header.bmp");
  assert.equal(nsis.sidebarImage, "installer/orbyven-sidebar.bmp");
  assert.equal(nsis.startMenuFolder, "ORBYVEN");
  assert.equal(nsis.installMode, "currentUser");
  assert.equal(nsis.compression, "lzma");
  assert.match(manifest.scripts["installer:brand"], /generate-installer-brand\.ps1/);
  assert.match(manifest.scripts.build, /npm run icons && npm run installer:brand && tauri build/);
  assert.match(generator, /150 57/);
  assert.match(generator, /164 314/);
  assert.match(generator, /#070B16/);
  assert.match(generator, /#627BFF/);
  assert.match(generator, /ORBYVEN/);
  assert.match(generator, /Business workspace/);
});
