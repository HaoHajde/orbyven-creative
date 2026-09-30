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
  const source = read("components/ClientWorkspace.tsx");
  assert.match(source, /min-h-\[100dvh\]/);
  assert.match(source, /bottom-\[max\(1rem,env\(safe-area-inset-bottom\)\)\]/);
  assert.match(source, /max-h-\[min\(68dvh,560px\)\]/);
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

test("reduced-motion preference cannot cause SSR hydration mismatch", () => {
  for (const path of ["app/servicii/page.tsx", "app/templates/page.tsx"]) {
    const source = read(path);
    assert.match(source, /function useHydrationSafeReducedMotion\(\)/);
    assert.match(source, /return hydrated \? Boolean\(prefersReducedMotion\) : false/);
    assert.doesNotMatch(source, /const reduceMotion = useReducedMotion\(\);/);
  }
});

test("homepage template preview cannot steal touch or input focus", () => {
  const source = read("components/HomeTemplatePreviewFrame.tsx");
  assert.match(source, /pointer-events-none/);
  assert.match(source, /select-none/);
});

test("iOS Alpha shell can shrink instead of clipping narrow widths", () => {
  const source = read("ios/App.tsx");
  assert.match(source, /brandRow: \{ flex: 1, minWidth: 0/);
  assert.match(source, /brandCopy: \{ flex: 1, minWidth: 0 \}/);
  assert.match(source, /numberOfLines=\{1\} style=\{\[styles\.subtitle/);
  assert.match(source, /status: \{ flexShrink: 0/);
});
