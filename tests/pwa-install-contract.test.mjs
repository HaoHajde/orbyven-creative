import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("PWA manifest opens ORBYVEN directly in workspace standalone mode", () => {
  const manifest = JSON.parse(read("public/manifest.webmanifest"));

  assert.equal(manifest.name, "ORBYVEN");
  assert.equal(manifest.start_url, "/workspace");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.scope, "/");
  assert.ok(
    manifest.icons.some(
      (icon) =>
        icon.src === "/branding/orbyven-app-icon.png" &&
        icon.type === "image/png"
    )
  );
});

test("service worker keeps private workspace data out of precache", () => {
  const sw = read("public/sw.js");
  const precacheBlock = sw.match(/const PRECACHE = \[([\s\S]*?)\];/)?.[1] ?? "";

  assert.ok(!precacheBlock.includes("/workspace"));
  assert.ok(!precacheBlock.includes("/api/"));
  assert.match(sw, /request\.mode === "navigate"/);
  assert.match(sw, /offline\.html/);
});

test("root metadata registers PWA and Apple Home Screen behavior", () => {
  const layout = read("app/layout.tsx");
  const nextConfig = read("next.config.ts");

  assert.match(layout, /ServiceWorkerRegistration/);
  assert.match(layout, /appleWebApp/);
  assert.match(layout, /statusBarStyle:\s*"black-translucent"/);
  assert.match(layout, /orbyven-app-icon\.png/);
  assert.match(nextConfig, /source: "\/sw\.js"/);
  assert.match(nextConfig, /no-cache, no-store, must-revalidate/);
});


test("installed web app publishes standalone runtime mode without caching private data", () => {
  const runtime = read("components/pwa/AppModeRuntime.tsx");
  const layout = read("app/layout.tsx");
  const css = read("app/globals.css");

  assert.match(runtime, /display-mode: standalone/);
  assert.match(runtime, /dataset\.appMode/);
  assert.match(runtime, /__ORBYVEN_NATIVE__/);
  assert.match(runtime, /"native"/);
  assert.match(runtime, /dataset\.nativePlatform/);
  assert.match(runtime, /dataset\.nativeVersion/);
  assert.match(runtime, /orbyven:native-ready/);
  assert.match(runtime, /orbyven:web-ready/);
  assert.match(runtime, /ReactNativeWebView/);
  assert.match(runtime, /orbyven:native-network-change/);
  assert.match(runtime, /dataset\.nativeNetwork/);
  assert.match(runtime, /orbyven:app-resume/);
  assert.match(runtime, /detail: \{ backgroundMs \}/);
  assert.match(runtime, /if \(!getNativeRuntime\(\)\)/);
  assert.match(layout, /AppModeRuntime/);
  assert.match(css, /data-app-mode="standalone"/);
  assert.match(css, /orbyven-workspace-header/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /--orbyven-workspace-chrome/);
});

test("Next generated manifest matches the canonical installed workspace experience", () => {
  const generatedManifest = read("app/manifest.ts");
  assert.match(generatedManifest, /id:\s*"\/workspace"/);
  assert.match(generatedManifest, /start_url:\s*"\/workspace"/);
  assert.match(generatedManifest, /orientation:\s*"portrait-primary"/);
  assert.match(generatedManifest, /background_color:\s*"#08111f"/);
  assert.match(generatedManifest, /theme_color:\s*"#08111f"/);
  assert.match(generatedManifest, /orbyven-app-icon\.png/);
  assert.match(generatedManifest, /purpose:\s*"maskable"/);
});
