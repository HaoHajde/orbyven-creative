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


test("workspace light theme uses a low-glare violet visual system", () => {
  const visual = read("lib/workspace-visual-system.ts");
  const shell = read("components/WorkspaceShell.tsx");
  const css = read("app/globals.css");

  assert.match(visual, /WORKSPACE_UI_REVISION = "2026\.10\.02\.2"/);
  assert.match(visual, /bg: "#e9ecf5"/);
  assert.match(visual, /surface: "#f7f7fb"/);
  assert.match(visual, /violet: "#7458d7"/);
  assert.match(visual, /"--violet-line": t\.violetLine/);

  assert.match(shell, /data-orbyven-theme=\{theme\}/);
  assert.match(shell, /orbyven-workspace-light-bg/);
  assert.match(shell, /data-workspace-surface="sidebar"/);
  assert.match(shell, /data-workspace-surface="module"/);

  assert.match(css, /ORBYVEN WORKSPACE LIGHT THEME/);
  assert.match(css, /radial-gradient\(ellipse 58% 46% at 8% 7%/);
  assert.match(css, /background-image: linear-gradient\(145deg, var\(--panel-highlight\), transparent 34%\)/);
  assert.match(css, /border-color: var\(--violet-line\)/);
});
