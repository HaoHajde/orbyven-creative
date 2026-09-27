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
  assert.equal(config.version, "0.3.0");
});

test("desktop v0.3 shares live site identity, not a remote browser window", () => {
  const app = content("../src/App.tsx");
  const styles = content("../src/styles.css");
  const search = content("../src/DesktopSearch.tsx");
  assert.match(app, /orbyven-logo-dark\.png/);
  assert.match(app, /orbyven-logo-light\.png/);
  assert.match(app, /<DesktopSearch organizationId=\{workspace\.organization\.id\}/);
  assert.match(app, /\+ Creează/);
  assert.match(styles, /--bg:#070b16/);
  assert.match(styles, /--surface:#0d1728/);
  assert.match(styles, /desktop-global-search/);
  assert.match(search, /\.eq\("organization_id", organizationId\)/g);
  assert.match(search, /needle\.replace/);
  assert.match(search, /request !== generation\.current/);
  assert.doesNotMatch(app, /<iframe|https:\/\/orbyven\.ro\/workspace/);
});

test("desktop navigation respects active modules, finance roles and stale-result invalidation", () => {
  const app = content("../src/App.tsx");
  assert.match(app, /workspace\?\.enabledModules\.includes\(item\.id\) && \(item\.id !== "expenses" \|\| canFinance\)/);
  assert.match(app, /if \(!workspace\?\.enabledModules\.includes\(id\) \|\| \(id === "expenses" && !canFinance\)\) return/);
  assert.match(app, /\+\+moduleLoadId\.current/);
  assert.match(app, /requestId !== moduleLoadId\.current/);
  assert.match(app, /pendingRecordId\.current/);
  assert.match(app, /modules\.some\(\(module\) => module\.id === target\)/);
  assert.match(app, /canFinance && modules\.some\(\(module\) => module\.id === "expenses"\)/);
});
