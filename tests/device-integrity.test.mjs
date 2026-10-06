import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("touch devices use focus-safe form control sizing", () => {
  const css = read("app/globals.css");
  assert.match(css, /@media \(hover: none\) and \(pointer: coarse\)/);
  assert.match(css, /input:not\(\[type="checkbox"\]\).*font-size: 16px !important;/s);
  assert.match(css, /data-workspace-mobile-dock="true"/);
  assert.match(css, /data-workspace-mobile-float="true"/);
  assert.match(css, /:has\(input:focus, textarea:focus, select:focus\)/);
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
  assert.match(activity, /bottom-\[max\(0\.75rem,env\(safe-area-inset-bottom\)\)\]/);
  assert.match(activity, /top-\[calc\(3\.75rem\+env\(safe-area-inset-top\)\)\]/);
  assert.match(activity, /min-h-0 flex-1 overflow-y-auto overscroll-contain/);
});

test("iOS native shell defers visible chrome to the trusted ORBYVEN web app", () => {
  const source = read("ios/App.tsx");
  assert.match(source, /const webAppOwnsChrome = isTrustedOrbyvenUrl\(currentUrl\)/);
  assert.match(source, /!webAppOwnsChrome \? \(/);
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


test("workspace light theme uses a low-glare violet visual system", () => {
  const visual = read("lib/workspace-visual-system.ts");
  const shell = read("components/WorkspaceShell.tsx");
  const css = read("app/globals.css");

  assert.match(visual, /WORKSPACE_UI_REVISION = "2026\.10\.02\.3"/);
  assert.match(visual, /bg: "#e7e8f3"/);
  assert.match(visual, /surface: "#f5f4fb"/);
  assert.match(visual, /violet: "#7458d7"/);
  assert.match(visual, /"--violet-line": t\.violetLine/);

  assert.match(shell, /data-orbyven-theme=\{theme\}/);
  assert.match(shell, /orbyven-workspace-light-bg/);
  assert.match(shell, /data-workspace-surface="sidebar"/);
  assert.match(shell, /data-workspace-surface="module"/);

  assert.match(css, /ORBYVEN WORKSPACE LIGHT THEME/);
  assert.match(css, /radial-gradient\(ellipse 58% 46% at 8% 7%/);
  assert.match(
    css,
    /background-image:\s*linear-gradient\(145deg, var\(--panel-highlight\), transparent 34%\),/,
  );
  assert.match(
    css,
    /linear-gradient\(180deg, rgba\(116, 88, 215, 0\.018\), transparent 52%\)/,
  );
  assert.match(css, /border-color: var\(--violet-line\)/);
  assert.match(css, /rgba\(116, 88, 215, 0\.19\)/);
  assert.match(css, /scrollbar-color: rgba\(104, 89, 214, 0\.42\)/);
  assert.match(css, /caret-color: var\(--violet\)/);
  assert.match(css, /background: rgba\(116, 88, 215, 0\.20\)/);
});


test("Intelligence and public pages follow the active light theme", () => {
  const shell = read("components/WorkspaceShell.tsx");
  const intelligence = read("components/WorkspaceIntelligence.tsx");
  const home = read("components/HomePageClient.tsx");
  const services = read("app/servicii/page.tsx");
  const contact = read("app/contact/page.tsx");
  const templates = read("app/templates/page.tsx");
  const aiWeb = read("components/AiWebDesignEntry.tsx");
  const header = read("components/SiteHeader.tsx");
  const css = read("app/globals.css");

  assert.match(shell, /theme=\{theme\}/);
  assert.match(intelligence, /theme: "light" \| "dark"/);
  assert.match(intelligence, /data-orbyven-theme=\{theme\}/);
  assert.match(intelligence, /orbyven-intelligence-panel/);
  assert.match(intelligence, /orbyven-intelligence-composer-field/);

  for (const source of [home, services, contact, templates, aiWeb]) {
    assert.match(source, /data-orbyven-public-theme=\{theme\}/);
    assert.match(source, /orbyven-public-shell/);
    assert.match(source, /#e7e8f3/);
  }

  assert.match(header, /orbyven-public-header-surface/);
  assert.match(header, /orbyven-public-mobile-menu/);
  assert.match(css, /ORBYVEN INTELLIGENCE LIGHT THEME/);
  assert.match(css, /orbyven-intelligence-shell\[data-orbyven-theme="light"\]/);
  assert.match(css, /ORBYVEN PUBLIC LIGHT THEME/);
  assert.match(css, /orbyven-public-shell\[data-orbyven-public-theme="light"\]/);
});
