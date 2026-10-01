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
  assert.match(client, /const ORBYVEN_ORIGIN = "https:\/\/orbyven\.ro"/);
  assert.match(client, /\/api\/desktop\/config/);
  assert.match(bootstrap, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(bootstrap, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(bootstrap, /process\.env\.(?:SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY)/);
  assert.doesNotMatch(client, /service_role|SERVICE_ROLE|STRIPE_SECRET/i);
});

test("existing tenant access checks and canonical web modules are reused", () => {
  const app = content("../src/App.tsx");
  const modules = content("../src/WorkspaceModules.tsx");
  assert.match(app, /await getWorkspaceAccessState\(\)/);
  assert.match(app, /await getCurrentWorkspace\(\)/);
  for (const component of ["LeadsModule", "TasksModule", "CalendarModule", "EstimatesModule", "DocumentsModule", "InventoryModule", "ExpensesModule", "TeamModule", "OverviewModule"]) {
    assert.ok(modules.includes(component), "Expected canonical web component: " + component);
  }
  assert.match(modules, /DesktopThermalModule/);
  assert.match(modules, /\["owner", "admin", "manager"\]\.includes\(role\)/);
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
  assert.equal(config.version, "0.7.0");
});

test("desktop matches the real web workspace without loading remote HTML", () => {
  const app = content("../src/App.tsx");
  const brand = content("../src/Brand.tsx");
  const website = content("../../components/ClientWorkspace.tsx");
  const css = content("../src/styles.css");
  assert.match(brand, /\.\.\/\.\.\/app\/icon\.svg\?url/);
  assert.match(content("../src/WorkspaceModules.tsx"), /OverviewModule/);
  assert.match(app, /ModuleGlyph/);
  assert.match(app, /setOrganizationModuleEnabled/);
  assert.match(app, /setCommandOpen/);
  assert.match(app, /Ctrl K/);
  assert.match(css, /grid-template-columns:206px minmax\(0,1fr\)/);
  const visual = content("../../lib/workspace-visual-system.ts");
  for (const label of ["OVERVIEW", "BUSINESS", "OPERATIONS", "SPECIALIZATE"]) {
    assert.ok(visual.includes(label), "Shared nav group: " + label);
  }
  assert.match(app, /uiManifest\.navGroups/);
  assert.match(website, /WORKSPACE_NAV_GROUPS/);
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

test("live visual manifest keeps desktop aligned with the web workspace", () => {
  const app = content("../src/App.tsx");
  const client = content("../src/client.ts");
  const web = content("../../components/ClientWorkspace.tsx");
  const visual = content("../../lib/workspace-visual-system.ts");
  const route = content("../../app/api/desktop/ui/route.ts");
  assert.match(client, /\/api\/desktop\/ui/);
  assert.match(app, /fetchDesktopUiManifest/);
  assert.match(app, /uiManifest\.navGroups/);
  assert.match(app, /uiManifest\.createModules/);
  assert.match(app, /structuralUpdateAvailable/);
  assert.match(web, /WORKSPACE_NAV_GROUPS/);
  assert.match(web, /themeToCssVars/);
  assert.match(visual, /SPECIALIZATE/);
  assert.match(visual, /thermal/);
  assert.match(route, /WORKSPACE_UI_REVISION/);
  assert.match(route, /Cache-Control/);
});

test("Windows shell allows the responsive layout to reach tablet-size widths", () => {
  const window = config.app.windows[0];
  assert.equal(window.resizable, true);
  assert.ok(window.minWidth <= 650, "Desktop minimum width must allow the compact breakpoint");
  assert.ok(window.minHeight <= 540, "Desktop minimum height must remain usable on small displays");
  const css = content("../src/styles.css");
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /\.desktop-workspace \.shell\{display:block\}/);
  assert.match(css, /\.desktop-workspace \.sidebar nav\{display:flex;gap:6px;overflow:auto\}/);
});

test("Desktop 0.7 renders the actual web workspace modules and shell surfaces", () => {
  const app = content("../src/App.tsx");
  const modules = content("../src/WorkspaceModules.tsx");
  const thermal = content("../src/ThermalModule.tsx");
  const vite = content("../vite.config.ts");
  const tailwind = content("../src/tailwind.css");
  const activity = content("../../components/WorkspaceActivityCenter.tsx");
  const intelligence = content("../../components/WorkspaceIntelligence.tsx");
  assert.match(app, /DesktopWorkspaceModules/);
  for (const component of [
    "OverviewModule", "LeadsModule", "TasksModule", "CalendarModule",
    "EstimatesModule", "DocumentsModule", "InventoryModule", "ExpensesModule", "TeamModule",
  ]) assert.ok(modules.includes(component), "Shared web module: " + component);
  assert.doesNotMatch(thermal, /next\/dynamic/);
  assert.match(thermal, /ThermalSketchPanel/);
  assert.match(vite, /@tailwindcss\/vite/);
  assert.match(tailwind, /@source "\.\.\/\.\.\/components"/);
  assert.match(activity, /loadWorkspaceActivity/);
  assert.match(intelligence, /requestApi/);
  assert.match(app, /desktopIntelligenceRequest/);
});

test("Desktop AI bridge keeps canonical server authorization and adds only CORS", () => {
  const cors = content("../../lib/desktop-api-cors.ts");
  const proxy = content("../../app/api/desktop/ai/intelligence/route.ts");
  const canonical = content("../../app/api/ai/intelligence/route.ts");
  const desktopClient = content("../src/client.ts");
  assert.match(cors, /Access-Control-Allow-Headers/);
  assert.match(cors, /Authorization, Content-Type/);
  assert.match(proxy, /intelligencePost/);
  assert.match(canonical, /authenticateBillingActor/);
  assert.match(desktopClient, /orbyvenSupabase\.auth\.getSession/);
  assert.match(desktopClient, /Bearer /);
  assert.doesNotMatch(desktopClient, /service_role|SERVICE_ROLE|STRIPE_SECRET/i);
});

test("live manifest advertises the exact bundled desktop release", () => {
  const visual = content("../../lib/workspace-visual-system.ts");
  assert.match(visual, /CURRENT_DESKTOP_VERSION = "0\.6\.0"/);
  assert.match(visual, /WORKSPACE_UI_REVISION = "2026\.09\.30\.5"/);
});

test("record search matches the live workspace searchable surfaces", () => {
  const search = content("../../components/WorkspaceSearch.tsx");
  const app = content("../src/App.tsx");
  for (const moduleId of ["leads", "tasks", "estimates", "inventory"]) {
    assert.ok(search.includes(moduleId), "Search module: " + moduleId);
  }
  assert.match(search, /crm_leads/);
  assert.match(search, /ops_tasks/);
  assert.match(search, /sales_estimates/);
  assert.match(search, /ops_material_catalog/);
  assert.match(app, /WorkspaceNavigationIntent/);
  assert.match(app, /setNavigation/);
  assert.match(app, /WorkspaceSearch/);
  assert.match(app, /WorkspaceActivityCenter/);
  assert.match(search, /onOpenCommands/);
});

test("full navigation context survives search, activity and Intelligence", () => {
  const app = content("../src/App.tsx");
  const activity = content("../../components/WorkspaceActivityCenter.tsx");
  const intelligence = content("../../components/WorkspaceIntelligence.tsx");
  const search = content("../../components/WorkspaceSearch.tsx");
  const modules = content("../src/WorkspaceModules.tsx");
  assert.match(app, /WorkspaceOpenOptions/);
  assert.match(app, /token: current\.token \+ 1/);
  for (const key of ["recordId", "clientId", "taskId", "estimateId"]) {
    assert.ok(activity.includes(key), "Activity context: " + key);
    assert.ok(intelligence.includes(key), "Intelligence context: " + key);
  }
  assert.match(search, /recordId: hit\.id/);
  assert.match(modules, /initialClientId/);
  assert.match(modules, /initialTaskId/);
  assert.match(modules, /initialEstimateId/);
});

test("live manifest publishes module metadata used by Desktop", () => {
  const app = content("../src/App.tsx");
  const client = content("../src/client.ts");
  const route = content("../../app/api/desktop/ui/route.ts");
  assert.match(route, /modules: ORBYVEN_MODULES/);
  assert.match(client, /modules: OrbyvenModuleDefinition\[\]/);
  assert.match(app, /uiManifest\.modules\.find/);
  assert.match(app, /runtimeModules/);
});

test("desktop no longer duplicates canonical search activity and Intelligence UI", () => {
  const app = content("../src/App.tsx");
  assert.match(app, /@\/components\/WorkspaceSearch/);
  assert.match(app, /@\/components\/WorkspaceActivityCenter/);
  assert.match(app, /@\/components\/WorkspaceIntelligence/);
  assert.doesNotMatch(app, /\.\/Search/);
  assert.doesNotMatch(app, /\.\/ActivityCenter/);
  assert.doesNotMatch(app, /\.\/Intelligence/);
});

test("canonical Intelligence shell accepts platform request and navigation adapters", () => {
  const intelligence = content("../../components/WorkspaceIntelligence.tsx");
  const app = content("../src/App.tsx");
  const web = content("../../components/ClientWorkspace.tsx");
  assert.doesNotMatch(intelligence, /next\/navigation/);
  assert.match(intelligence, /request\?: IntelligenceRequest/);
  assert.match(intelligence, /onOpenPath: \(href: string\) => void/);
  assert.match(intelligence, /requestApi/);
  assert.match(app, /desktopIntelligenceRequest/);
  assert.match(app, /\/api\/desktop\/ai\//);
  assert.match(web, /onOpenPath=\{\(href\) => router\.push\(href\)\}/);
});

test("plan recovery bridge follows the canonical AI route", () => {
  const bridge = content("../../app/api/desktop/ai/plans/recover/route.ts");
  assert.match(bridge, /recoverPost/);
  assert.match(bridge, /@\/app\/api\/ai\/plans\/recover\/route/);
  assert.match(bridge, /withDesktopCors/);
});
