import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Alpha 0.8 preserves SDK-compatible native privacy dependencies", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.version, "0.8.0");
  assert.equal(pkg.dependencies["expo-local-authentication"], "~57.0.3");
  assert.equal(pkg.dependencies["expo-network"], "~57.0.2");
  assert.equal(pkg.dependencies["expo-haptics"], "~57.0.3");
});

test("Face ID permission is configured for signed ORBYVEN builds", () => {
  const config = JSON.parse(read("app.json"));
  const plugin = config.expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === "expo-local-authentication"
  );

  assert.ok(plugin);
  assert.match(plugin[1].faceIDPermission, /ORBYVEN/);
});

test("native shell protects app-switcher privacy and keeps biometric lock non-fatal", () => {
  const app = read("App.tsx");

  assert.match(app, /privacyShielded/);
  assert.match(app, /LocalAuthentication\.authenticateAsync/);
  assert.match(app, /setPrivacyShielded\(true\)/);
  assert.match(app, /setPrivacyShielded\(false\)/);
  assert.match(app, /Network\.addNetworkStateListener/);
  assert.match(app, /Haptics\.selectionAsync/);
  assert.match(app, /RELOCK_AFTER_MS = 30_000/);
  assert.doesNotMatch(app, /service[_-]?role/i);
});


test("Alpha 0.8 exposes a bounded native runtime bridge and follows the workspace theme", () => {
  const app = read("App.tsx");

  assert.match(app, /const APP_VERSION = "0\.8\.0"/);
  assert.match(app, /NATIVE_RUNTIME/);
  assert.match(app, /injectedJavaScriptBeforeContentLoaded=\{NATIVE_BOOTSTRAP_SCRIPT\}/);
  assert.match(app, /window\.__ORBYVEN_NATIVE__/);
  assert.match(app, /dataset\.appMode = "native"/);
  assert.match(app, /orbyven:native-ready/);
  assert.match(app, /message\.type === "orbyven:theme"/);
  assert.match(app, /setWebTheme\(message\.theme\)/);
  assert.match(app, /orbyven:app-resume/);
});


test("native workspace navigation can request bounded selection haptics", () => {
  const app = read("App.tsx");
  const workspace = read("../components/WorkspaceShell.tsx");

  assert.match(app, /"navigation-haptics"/);
  assert.match(app, /message\.type === "orbyven:haptic"/);
  assert.match(app, /Haptics\.selectionAsync\(\)/);
  assert.match(workspace, /const requestNativeHaptic = useCallback/);
  assert.match(workspace, /type: "orbyven:haptic"/);
});


test("Alpha 0.8 preserves the live WebView across transient network loss", () => {
  const app = read("App.tsx");

  assert.match(app, /"connection-continuity"/);
  assert.match(app, /"resume-refresh"/);
  assert.match(app, /const webHadLoadError = useRef\(false\)/);
  assert.match(app, /orbyven:native-network-restored/);
  assert.match(app, /window\.dispatchEvent\(new Event\('online'\)\)/);
  assert.match(app, /if \(webHadLoadError\.current\)/);
  assert.match(app, /onLoadProgress/);
  assert.match(app, /Offline · reconectare automată/);
});

test("Alpha 0.8 refreshes workspace data silently after native resume or reconnect", () => {
  const workspace = read("../components/WorkspaceShell.tsx");
  const activity = read("../components/WorkspaceActivityCenter.tsx");

  assert.match(workspace, /refreshWorkspaceSilently/);
  assert.match(workspace, /lastNativeRefreshAt/);
  assert.match(workspace, /orbyven:app-resume/);
  assert.match(workspace, /orbyven:native-network-restored/);
  assert.match(workspace, /1200/);
  assert.match(activity, /orbyven:native-network-restored/);
});
