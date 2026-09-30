import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("global responsive baseline uses dynamic viewport units and prevents iOS form focus zoom", () => {
  const css = read("app/globals.css");
  assert.match(css, /@supports \(height: 100dvh\)/);
  assert.match(css, /\.min-h-screen\s*\{\s*min-height: 100dvh;/);
  assert.match(css, /pointer: coarse/);
  assert.match(css, /font-size: 16px !important/);
});

test("workspace shell and overlays are bounded by dynamic viewport and safe-area insets", () => {
  const workspace = read("components/ClientWorkspace.tsx");
  const activity = read("components/WorkspaceActivityCenter.tsx");
  const intelligence = read("components/WorkspaceIntelligence.tsx");

  assert.match(workspace, /min-h-\[100dvh\]/);
  assert.match(workspace, /100dvh-90px-env\(safe-area-inset-top\)/);
  assert.match(workspace, /safe-area-inset-bottom/);
  assert.match(workspace, /data-workspace-module=\{definition\.id\}/);
  assert.doesNotMatch(workspace, /calc\(100vh-90px\)/);

  assert.match(activity, /100dvh/);
  assert.match(activity, /safe-area-inset-top/);
  assert.match(activity, /safe-area-inset-bottom/);

  assert.match(intelligence, /safe-area-inset-top/);
  assert.match(intelligence, /safe-area-inset-right/);
  assert.match(intelligence, /safe-area-inset-bottom/);
});

test("public navigation and authentication surfaces respect small touch devices", () => {
  const header = read("components/SiteHeader.tsx");
  const auth = read("components/WorkspaceAuthShell.tsx");

  assert.match(header, /safe-area-inset-top/);
  assert.match(header, /100dvh/);
  assert.match(header, /overscroll-contain/);

  assert.match(auth, /min-h-\[100dvh\]/);
  assert.match(auth, /safe-area-inset-top/);
  assert.match(auth, /safe-area-inset-bottom/);
  assert.match(auth, /text-\[16px\].*sm:text-\[13px\]/);
});

test("desktop shell follows the actual resized window height", () => {
  const css = read("desktop/src/styles.css");
  assert.match(css, /100dvh/);
  assert.doesNotMatch(css, /100vh/);
});

test("browser QA covers phones, tablets, laptop, desktop and representative ORBYVEN routes", () => {
  const audit = read("scripts/audit-responsive-layout.mjs");
  for (const marker of [
    "compact-phone",
    "large-phone",
    "tablet-portrait",
    "tablet-landscape",
    "laptop",
    "desktop",
    "/servicii",
    "/templates/florarie-bragadiru",
    "/workspace/login",
  ]) {
    assert.ok(audit.includes(marker), "Missing browser QA marker: " + marker);
  }
  assert.match(audit, /Horizontal overflow/);
  assert.match(audit, /pageerror/);
});
