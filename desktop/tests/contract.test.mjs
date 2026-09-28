import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const content = (url) => readFileSync(new URL(url, import.meta.url), "utf8");
const config = JSON.parse(content("../src-tauri/tauri.conf.json"));
const manifest = JSON.parse(content("../package.json"));
const client = content("../src/client.ts");
const app = content("../src/App.tsx");
const vite = content("../vite.config.ts");
const bootstrap = content("../../app/api/desktop/config/route.ts");
const shell = content("../../components/WorkspaceShell.tsx");
const workspaceContent = content("../../components/WorkspaceContent.tsx");
const webWorkspace = content("../../components/ClientWorkspace.tsx");
const workspaceUi = content("../../lib/workspace-ui.ts");

test("desktop is locally bundled and never loads /workspace as remote HTML", () => {
  assert.equal(config.build.frontendDist, "../dist");
  assert.equal(config.build.beforeBuildCommand, "npm run build:web");
  assert.equal(config.build.devUrl, "http://localhost:1420");
  assert.equal(config.app.windows[0].url, undefined);
  assert.equal(manifest.scripts["build:web"], "vite build");
  assert.match(app, /WorkspaceShell/);
  assert.doesNotMatch(app, /https:\/\/orbyven\.ro\/workspace/);
});

test("desktop and web use the exact same WorkspaceShell and WorkspaceContent", () => {
  assert.match(app, /import WorkspaceShell from "@\/components\/WorkspaceShell"/);
  assert.match(webWorkspace, /import WorkspaceShell from "@\/components\/WorkspaceShell"/);
  assert.match(shell, /import WorkspaceContent from "@\/components\/WorkspaceContent"/);
  assert.match(shell, /WorkspaceModuleStore/);
  assert.match(shell, /WorkspaceSearch/);
  for (const module of [
    "OverviewModule", "LeadsModule", "TasksModule", "CalendarModule",
    "EstimatesModule", "DocumentsModule", "ExpensesModule", "TeamModule",
  ]) {
    assert.ok(workspaceContent.includes(module), "Shared workspace module: " + module);
  }
});

test("desktop compiles the real web Tailwind module UI with a safe next/dynamic shim", () => {
  assert.match(vite, /@tailwindcss\/vite/);
  assert.match(vite, /next\\\/dynamic/);
  assert.match(content("../src/main.tsx"), /tailwind\.css/);
  const tailwind = content("../src/tailwind.css");
  assert.match(tailwind, /@source "\.\.\/\.\.\/components"/);
  assert.match(tailwind, /@source "\.\.\/\.\.\/lib"/);
  const shim = content("../src/next-dynamic-shim.tsx");
  assert.match(shim, /lazy\(loader\)/);
  assert.match(shim, /Suspense/);
});

test("same authentication, tenant state, entitlements and RLS-backed services are reused", () => {
  assert.match(app, /await getWorkspaceAccessState\(\)/);
  assert.match(app, /await getCurrentWorkspace\(\)/);
  assert.match(shell, /workspace\.entitledModules\.includes/);
  assert.match(shell, /setOrganizationModuleEnabled/);
  assert.match(client, /storageKey: "orbyven-desktop-auth-v1"/);
});

test("only public bootstrap values and safe presentation metadata are exposed", () => {
  assert.match(client, /https:\/\/orbyven\.ro\/api\/desktop\/config/);
  assert.match(bootstrap, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(bootstrap, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(bootstrap, /getWorkspacePresentationConfig/);
  assert.doesNotMatch(bootstrap, /process\.env\.(?:SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY)/);
  assert.doesNotMatch(client, /service_role|SERVICE_ROLE|STRIPE_SECRET/i);
});

test("web presentation config is shared live with Windows", () => {
  assert.match(workspaceUi, /WORKSPACE_UI_REVISION/);
  assert.match(workspaceUi, /WORKSPACE_THEME_TOKENS/);
  assert.match(workspaceUi, /WORKSPACE_NAV_GROUPS/);
  assert.match(workspaceUi, /WORKSPACE_LAYOUT/);
  assert.match(client, /refreshDesktopConfig/);
  assert.match(app, /window\.addEventListener\("focus", onFocus\)/);
  assert.match(app, /5 \* 60 \* 1000/);
  assert.match(shell, /presentation\?\.themeTokens/);
  assert.match(shell, /presentation\?\.navGroups/);
  assert.match(shell, /presentation\?\.layout/);
});

test("remote content still has zero native Tauri IPC permissions", () => {
  assert.deepEqual(config.app.security.capabilities, []);
  const main = content("../src-tauri/src/main.rs");
  assert.doesNotMatch(main, /\.invoke_handler\s*\(/);
  assert.doesNotMatch(main, /\.plugin\s*\(/);
  assert.doesNotMatch(config.app.security.csp, /unsafe-eval/);
});

test("v0.4 branded NSIS installer remains configured", () => {
  assert.equal(config.version, "0.4.0");
  assert.equal(manifest.version, "0.4.0");
  assert.deepEqual(config.bundle.targets, ["nsis"]);
  const nsis = config.bundle.windows.nsis;
  assert.equal(nsis.installerIcon, "icons/icon.ico");
  assert.equal(nsis.uninstallerIcon, "icons/icon.ico");
  assert.equal(nsis.headerImage, "installer/orbyven-header.bmp");
  assert.equal(nsis.sidebarImage, "installer/orbyven-sidebar.bmp");
  assert.equal(nsis.startMenuFolder, "ORBYVEN");
  assert.equal(nsis.installMode, "currentUser");
  assert.match(manifest.scripts.build, /npm run icons && npm run installer:brand && tauri build/);
});
