import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Alpha 0.3 declares SDK-compatible native privacy dependencies", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.version, "0.3.0");
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
  assert.match(app, /Network\.useNetworkState/);
  assert.match(app, /Haptics\.selectionAsync/);
  assert.match(app, /RELOCK_AFTER_MS = 30_000/);
  assert.doesNotMatch(app, /service[_-]?role/i);
});
