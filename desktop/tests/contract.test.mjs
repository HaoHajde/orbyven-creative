import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const config = JSON.parse(
  readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"),
);
const entry = "https://orbyven.ro/workspace";

test("desktop uses the actual ORBYVEN workspace, not the marketing site or admin", () => {
  assert.equal(config.build.frontendDist, entry);
  assert.equal(config.build.devUrl, entry);
  assert.equal(config.app.windows[0].url, entry);
});

test("remote content receives no native Tauri IPC permissions", () => {
  assert.deepEqual(config.app.security.capabilities, []);
  const main = readFileSync(new URL("../src-tauri/src/main.rs", import.meta.url), "utf8");
  assert.doesNotMatch(main, /\.invoke_handler\s*\(/);
  assert.doesNotMatch(main, /\.plugin\s*\(/);
});

test("Windows installer has a brand icon and includes WebView2 bootstrapper", () => {
  assert.deepEqual(config.bundle.targets, ["nsis"]);
  assert.ok(config.bundle.icon.includes("icons/icon.ico"));
  assert.equal(config.bundle.windows.webviewInstallMode.type, "downloadBootstrapper");
  assert.equal(config.app.windows[0].resizable, true);
});
