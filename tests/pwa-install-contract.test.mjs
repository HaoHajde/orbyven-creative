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
  assert.match(layout, /orbyven-app-icon\.png/);
  assert.match(nextConfig, /source: "\/sw\.js"/);
  assert.match(nextConfig, /no-cache, no-store, must-revalidate/);
});
