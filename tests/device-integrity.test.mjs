import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("touch devices use focus-safe form control sizing", () => {
  const css = read("app/globals.css");
  assert.match(css, /@media \(hover: none\) and \(pointer: coarse\)/);
  assert.match(css, /input:not\(\[type="checkbox"\]\).*font-size: 16px !important;/s);
});

test("workspace fixed mobile controls respect dynamic viewport and safe area", () => {
  const source = read("components/WorkspaceShell.tsx");
  assert.match(source, /min-h-\[100dvh\]/);
  assert.match(source, /bottom-\[max\(0\.45rem,env\(safe-area-inset-bottom\)\)\]/);
  assert.match(source, /max-h-\[min\(62dvh,520px\)\]/);
  assert.match(source, /max-h-\[calc\(100dvh-2rem\)\]/);
});

test("mobile overlays remain scrollable on short and landscape screens", () => {
  const header = read("components/SiteHeader.tsx");
  const activity = read("components/WorkspaceActivityCenter.tsx");
  assert.match(header, /max-h-\[calc\(100dvh-96px\)\]/);
  assert.match(header, /overscroll-contain/);
  assert.match(activity, /max-h-\[calc\(100dvh-84px\)\]/);
  assert.match(activity, /max-h-\[calc\(100dvh-176px\)\]/);
});

test("iOS native chrome can shrink instead of clipping narrow widths", () => {
  const source = read("ios/App.tsx");
  assert.match(source, /brandRow: \{ flex: 1, minWidth: 0/);
  assert.match(source, /brandCopy: \{ flex: 1, minWidth: 0 \}/);
  assert.match(source, /numberOfLines=\{1\} style=\{\[styles\.subtitle/);
  assert.match(source, /status: \{ flexShrink: 0/);
});


test("dashboard text scaling has an explicit visual-integrity contract", () => {
  const shell = read("components/WorkspaceShell.tsx");
  const css = read("app/globals.css");
  const qa = read("scripts/audit-authenticated-workspace.mjs");

  assert.match(shell, /TEXT_SCALE_STEPS: TextScale\[\] = \[0\.9, 1, 1\.1, 1\.2, 1\.3\]/);
  assert.match(shell, /TEXT_SCALE_SIDEBAR_WIDTH/);
  assert.match(shell, /--workspace-sidebar-width/);
  assert.match(shell, /md:grid-cols-\[var\(--workspace-sidebar-width\)_minmax\(0,1fr\)\]/);
  assert.match(shell, /data-workspace-text-scale-control="desktop"/);
  assert.match(shell, /data-workspace-text-scale-control="mobile"/);
  assert.match(shell, /overflow-y-auto overscroll-contain/);

  assert.match(css, /Visual integrity guard/);
  assert.match(css, /:where\(\.flex, \.grid\) > \* \{\s*min-inline-size: 0;/);
  assert.match(css, /max-inline-size: 100%/);
  assert.match(css, /\[data-workspace-text-scale-control\] \{\s*overflow: hidden;/);

  assert.match(qa, /const textScales = \["0\.9", "1", "1\.1", "1\.2", "1\.3"\]/);
  assert.match(qa, /for \(const scale of textScales\)/);
  assert.match(qa, /Text escaped its visual frame/);
  assert.match(qa, /Text-scale control escaped its frame/);
});


test("light theme stays violet-tinted instead of pure white across canonical ORBYVEN surfaces", () => {
  const palette = read("lib/orbyven-theme.ts");
  const workspaceTheme = read("lib/workspace-visual-system.ts");
  const globals = read("app/globals.css");
  const layout = read("app/layout.tsx");

  assert.match(palette, /light:\s*\{[\s\S]*?bg: "#f1eef8"/);
  assert.match(palette, /surface: "#fbfaff"/);
  assert.match(palette, /accent: "#5b4dde"/);
  assert.match(palette, /border: "rgba\(88,69,146,.14\)"/);
  assert.doesNotMatch(palette, /light:\s*\{[\s\S]*?bg: "#ffffff"/);

  assert.match(workspaceTheme, /light:\s*\{[\s\S]*?bg: "#eeebf6"/);
  assert.match(workspaceTheme, /accent: "#6757df"/);
  assert.match(workspaceTheme, /surface: "#f9f7fd"/);

  assert.match(globals, /ORBYVEN LIGHT THEME ATMOSPHERE/);
  assert.match(globals, /orbyven-theme-shell\[data-orbyven-theme="light"\]/);
  assert.match(globals, /radial-gradient\(circle at 8% 4%/);
  assert.match(layout, /color: "#f1eef8"/);
});

test("theme-switchable pages expose the shared theme shell and persistent palette", () => {
  for (const path of [
    "components/HomePageClient.tsx",
    "app/templates/page.tsx",
    "app/servicii/page.tsx",
    "app/contact/page.tsx",
    "components/ProjectRequestFlow.tsx",
    "components/WorkspaceShell.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /data-orbyven-theme=\{theme\}/);
    assert.match(source, /orbyven-theme-shell/);
  }

  const home = read("components/HomePageClient.tsx");
  const templates = read("app/templates/page.tsx");
  const services = read("app/servicii/page.tsx");
  const contact = read("app/contact/page.tsx");
  const request = read("components/ProjectRequestFlow.tsx");

  for (const source of [home, templates, services, contact, request]) {
    assert.match(source, /themeBodyBackground/);
    assert.match(source, /publicThemeVars/);
  }
});

test("visual QA explicitly audits both public themes and workspace light mode", () => {
  const publicAudit = read("scripts/audit-public-layout.mjs");
  const authenticatedAudit = read("scripts/audit-authenticated-workspace.mjs");

  assert.match(publicAudit, /themeRoutes = new Set\(\["\/", "\/servicii", "\/contact", "\/templates"\]\)/);
  assert.match(publicAudit, /for \(const theme of \["light", "dark"\]\)/);
  assert.match(publicAudit, /light theme reverted to pure white/);
  assert.match(publicAudit, /theme horizontal overflow/);

  assert.match(authenticatedAudit, /orbyven-dashboard-theme", "light"/);
  assert.match(authenticatedAudit, /Workspace light theme reverted to pure white/);
  assert.match(authenticatedAudit, /Workspace light theme horizontal overflow/);
});
