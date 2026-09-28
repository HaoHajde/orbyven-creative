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
  assert.match(manifest.scripts["build:web"], /sync:web-assets.*vite build/);
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
  assert.equal(config.version, "0.4.0");
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
  assert.match(css, /--workspace-sidebar-width/);
  const contract = content("../../lib/workspace-ui-contract.ts");
  for (const label of ["OVERVIEW", "BUSINESS", "OPERATIONS", "SPECIALIZATE"]) {
    assert.ok(contract.includes(label), "Shared nav group: " + label);
  }
  assert.match(website, /WORKSPACE_UI_CONTRACT\.navigationGroups/);
  assert.match(app, /uiContract\.navigationGroups/);
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

test("desktop follows the shared live workspace UI contract", () => {
  const uiClient = content("../src/ui-contract.ts");
  const route = content("../../app/api/desktop/ui/route.ts");
  const contract = content("../../lib/workspace-ui-contract.ts");
  const website = content("../../components/ClientWorkspace.tsx");
  const app = content("../src/App.tsx");
  assert.match(uiClient, /https:\/\/orbyven\.ro\/api\/desktop\/ui/);
  assert.match(uiClient, /localStorage/);
  assert.match(uiClient, /WORKSPACE_UI_CONTRACT/);
  assert.match(route, /WORKSPACE_UI_CONTRACT/);
  assert.match(route, /Access-Control-Allow-Origin/);
  assert.match(contract, /SPECIALIZATE/);
  assert.match(contract, /thermal/);
  assert.match(website, /WORKSPACE_UI_CONTRACT\.navigationGroups/);
  assert.match(app, /uiContract\.navigationGroups/);
  assert.match(app, /loadLiveUiContract/);
  assert.match(app, /entitledModules/);
});

test("thermal planner is bundled from the exact web asset and uses the same tenant data", () => {
  const sync = content("../scripts/sync-web-assets.mjs");
  const panel = content("../src/ThermalSketchPanel.tsx");
  const module = content("../src/ThermalModule.tsx");
  const webPlanner = content("../../public/thermal-planner/index.html");
  assert.match(sync, /public.*thermal-planner.*index\.html/s);
  assert.match(manifest.scripts["sync:web-assets"], /sync-web-assets\.mjs/);
  assert.match(panel, /src="\/thermal-planner\/index\.html"/);
  assert.doesNotMatch(panel, /src="https:\/\/orbyven\.ro\/thermal-planner/);
  assert.match(panel, /thermal_sketches/);
  assert.match(module, /listWorkTasks/);
  assert.match(module, /listWorkTaskClients/);
  assert.match(webPlanner, /ORBYVEN/);
  assert.match(config.app.security.csp, /frame-src 'self'/);
});
