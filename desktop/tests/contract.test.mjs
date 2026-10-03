import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const content = (url) => readFileSync(new URL(url, import.meta.url), "utf8");
const config = JSON.parse(content("../src-tauri/tauri.conf.json"));
const manifest = JSON.parse(content("../package.json"));
const app = content("../src/App.tsx");
const desktopClient = content("../src/client.ts");
const shell = content("../../components/WorkspaceShell.tsx");
const webWrapper = content("../../components/ClientWorkspace.tsx");
const workspaceContent = content("../../components/WorkspaceContent.tsx");
const search = content("../../components/WorkspaceSearch.tsx");
const activity = content("../../components/WorkspaceActivityCenter.tsx");
const intelligence = content("../../components/WorkspaceIntelligence.tsx");
const visual = content("../../lib/workspace-visual-system.ts");

test("desktop ships a locally bundled UI rather than loading the website", () => {
  assert.equal(config.build.frontendDist, "../dist");
  assert.equal(config.build.beforeBuildCommand, "npm run build:web");
  assert.equal(config.build.devUrl, "http://localhost:1420");
  assert.equal(config.app.windows[0].url, undefined);
  assert.equal(manifest.scripts["build:web"], "vite build");
  assert.match(app, /WorkspaceShell/);
  assert.doesNotMatch(config.build.frontendDist, /^https?:/);
});

test("desktop bootstrap exposes only public Supabase configuration", () => {
  const bootstrap = content("../../app/api/desktop/config/route.ts");
  assert.match(desktopClient, /const ORBYVEN_ORIGIN = "https:\/\/orbyven\.ro"/);
  assert.match(desktopClient, /\/api\/desktop\/config/);
  assert.match(bootstrap, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(bootstrap, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(bootstrap, /process\.env\.(?:SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY)/);
  assert.doesNotMatch(desktopClient, /service_role|SERVICE_ROLE|STRIPE_SECRET/i);
});

test("web and Windows render the same canonical WorkspaceShell", () => {
  assert.match(webWrapper, /WorkspaceShell/);
  assert.match(app, /WorkspaceShell/);
  assert.ok(webWrapper.length < 1200, "ClientWorkspace must remain a thin Next.js adapter");
  for (const component of [
    "WorkspaceContent",
    "WorkspaceSearch",
    "WorkspaceActivityCenter",
    "WorkspaceIntelligence",
    "WorkspaceModuleStore",
    "WorkspaceOrbitBackground",
  ]) {
    assert.ok(shell.includes(component), "Canonical shell surface: " + component);
  }
  assert.doesNotMatch(shell, /next\/navigation/);
  assert.match(webWrapper, /next\/navigation/);
});

test("canonical shell keeps tenant, role and entitlement guards", () => {
  assert.match(shell, /getCurrentWorkspace/);
  assert.match(shell, /setOrganizationModuleEnabled/);
  assert.match(shell, /workspace\.entitledModules\.includes/);
  assert.match(shell, /workspace\.membership\.role/);
  assert.match(app, /getWorkspaceAccessState/);
  assert.match(app, /getCurrentWorkspace/);
});

test("canonical WorkspaceContent remains the only module renderer", () => {
  for (const component of [
    "OverviewModule",
    "LeadsModule",
    "TasksModule",
    "CalendarModule",
    "EstimatesModule",
    "DocumentsModule",
    "InventoryModule",
    "ExpensesModule",
    "TeamModule",
    "ThermalPlannerModule",
  ]) {
    assert.ok(workspaceContent.includes(component), "Canonical module: " + component);
  }
  assert.match(shell, /WorkspaceContent/);
  assert.doesNotMatch(app, /DesktopWorkspaceModules/);
  assert.doesNotMatch(app, /ThermalModule/);
});

test("Vite adapts only Next-specific rendering primitives", () => {
  const vite = content("../vite.config.ts");
  const dynamicAdapter = content("../src/next-dynamic.tsx");
  const brandAdapter = content("../src/BrandLogo.tsx");
  assert.ok(vite.includes("BrandLogo"), "BrandLogo alias must target the canonical import");
  assert.ok(vite.includes("next") && vite.includes("dynamic"), "next/dynamic must be adapted for Vite");
  assert.match(vite, /desktopBrandLogo/);
  assert.match(vite, /desktopDynamic/);
  assert.match(dynamicAdapter, /Suspense/);
  assert.match(dynamicAdapter, /lazy/);
  assert.match(brandAdapter, /public\/branding\/orbyven-logo-dark\.png/);
  assert.match(brandAdapter, /public\/branding\/orbyven-icon-light\.png/);
  assert.match(workspaceContent, /next\/dynamic/);
});

test("canonical Search is shared without a Windows fork", () => {
  for (const moduleId of ["leads", "tasks", "estimates", "inventory"]) {
    assert.ok(search.includes(moduleId), "Search module: " + moduleId);
  }
  assert.match(search, /crm_leads/);
  assert.match(search, /ops_tasks/);
  assert.match(search, /sales_estimates/);
  assert.match(search, /ops_material_catalog/);
  assert.match(shell, /WorkspaceSearch/);
  assert.doesNotMatch(app, /\.\/Search/);
});

test("canonical Activity Center is shared without a Windows fork", () => {
  assert.match(activity, /loadWorkspaceActivity/);
  for (const key of ["recordId", "clientId", "taskId", "estimateId"]) {
    assert.ok(activity.includes(key), "Activity navigation context: " + key);
  }
  assert.match(shell, /WorkspaceActivityCenter/);
  assert.doesNotMatch(app, /\.\/ActivityCenter/);
});

test("canonical Intelligence uses platform request and navigation adapters", () => {
  assert.doesNotMatch(intelligence, /next\/navigation/);
  assert.match(intelligence, /request\?: IntelligenceRequest/);
  assert.match(intelligence, /onOpenPath: \(href: string\) => void/);
  assert.match(intelligence, /requestApi/);
  assert.match(app, /desktopIntelligenceRequest/);
  assert.match(app, /\/api\/desktop\/ai\//);
  assert.match(shell, /request=\{intelligenceRequest\}/);
  assert.match(shell, /onOpenPath=\{onOpenPath\}/);
  assert.doesNotMatch(app, /\.\/Intelligence/);
});

test("all canonical AI actions have desktop CORS bridges", () => {
  const cors = content("../../lib/desktop-api-cors.ts");
  const routes = [
    "../../app/api/desktop/ai/intelligence/route.ts",
    "../../app/api/desktop/ai/conversations/route.ts",
    "../../app/api/desktop/ai/plans/route.ts",
    "../../app/api/desktop/ai/plans/recover/route.ts",
    "../../app/api/desktop/ai/decisions/handoff/route.ts",
    "../../app/api/desktop/ai/outcomes/recheck/route.ts",
    "../../app/api/desktop/ai/actions/confirm/route.ts",
  ];
  assert.match(cors, /Authorization, Content-Type/);
  for (const route of routes) {
    const source = content(route);
    assert.match(source, /withDesktopCors/);
    assert.match(source, /desktopOptionsResponse/);
  }
  assert.match(desktopClient, /orbyvenSupabase\.auth\.getSession/);
  assert.match(desktopClient, /Bearer /);
});

test("live UI manifest publishes the canonical module registry", () => {
  const route = content("../../app/api/desktop/ui/route.ts");
  assert.match(route, /WORKSPACE_UI_REVISION/);
  assert.match(route, /WORKSPACE_NAV_GROUPS/);
  assert.match(route, /modules: ORBYVEN_MODULES/);
  assert.match(route, /Cache-Control/);
  assert.match(desktopClient, /modules: OrbyvenModuleDefinition\[\]/);
  assert.match(app, /fetchDesktopUiManifest/);
});

test("web and desktop release metadata are aligned", () => {
  assert.equal(config.version, "0.8.0");
  assert.equal(manifest.version, "0.8.0");
  assert.match(visual, /CURRENT_DESKTOP_VERSION = "0\.8\.0"/);
  assert.match(visual, /WORKSPACE_UI_REVISION = "2026\.10\.02\.3"/);
});

test("canonical shell carries the exact responsive web layout", () => {
  assert.match(shell, /max-w-\[1520px\]/);
  assert.match(shell, /md:grid-cols-\[var\(--workspace-sidebar-width\)_minmax\(0,1fr\)\]/);
  assert.match(shell, /md:hidden/);
  assert.match(shell, /mobileModuleMenuOpen/);
  assert.equal(config.app.windows[0].resizable, true);
  assert.ok(config.app.windows[0].minWidth <= 650);
  assert.ok(config.app.windows[0].minHeight <= 540);
});

test("desktop CSS contains only bootstrap/auth chrome", () => {
  const css = content("../src/styles.css");
  assert.ok(css.length < 10000, "desktop CSS should not duplicate the web dashboard");
  for (const selector of ["auth-background", "auth-card", "orbyven-brand", "spinner"]) {
    assert.ok(css.includes(selector), "Expected auth selector: " + selector);
  }
  assert.doesNotMatch(css, /\.module-store-card|\.workflow-panel|\.stage-ring|\.desktop-intelligence/);
});

test("remote content has no native Tauri command surface", () => {
  assert.deepEqual(config.app.security.capabilities, []);
  const main = content("../src-tauri/src/main.rs");
  assert.doesNotMatch(main, /\.invoke_handler\s*\(/);
  assert.doesNotMatch(main, /\.plugin\s*\(/);
  assert.doesNotMatch(config.app.security.csp, /unsafe-eval/);
});

test("NSIS installer preserves ORBYVEN visual identity", () => {
  const nsis = config.bundle.windows.nsis;
  const generator = content("../scripts/generate-installer-brand.ps1");
  assert.deepEqual(config.bundle.targets, ["nsis"]);
  assert.ok(config.bundle.icon.includes("icons/icon.ico"));
  assert.equal(nsis.installerIcon, "icons/icon.ico");
  assert.equal(nsis.uninstallerIcon, "icons/icon.ico");
  assert.equal(nsis.headerImage, "installer/orbyven-header.bmp");
  assert.equal(nsis.sidebarImage, "installer/orbyven-sidebar.bmp");
  assert.equal(nsis.startMenuFolder, "ORBYVEN");
  assert.equal(nsis.installMode, "currentUser");
  assert.equal(nsis.compression, "lzma");
  assert.match(generator, /ORBYVEN/);
  assert.match(generator, /#070B16/);
});
