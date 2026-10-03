import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("Alpha 0.15 declares the Expo push project dependency without hardcoding an EAS id", () => {
  const pkg = JSON.parse(read("../package.json"));
  const config = JSON.parse(read("../app.json"));
  const app = read("../App.tsx");

  assert.equal(pkg.version, "0.15.0");
  assert.equal(pkg.dependencies["expo-constants"], "~57.0.20");
  assert.equal(config.expo.version, "0.15.0");
  assert.match(app, /Constants\.expoConfig/);
  assert.match(app, /Constants\.easConfig/);
  assert.match(app, /getExpoPushTokenAsync\(\{ projectId \}\)/);
  assert.match(app, /push-project-not-linked/);
  assert.doesNotMatch(JSON.stringify(config), /projectId\s*":\s*"[0-9a-f-]{20,}/i);
});

test("remote notification navigation is restricted to ORBYVEN URLs", () => {
  const app = read("../App.tsx");

  assert.match(app, /typeof data\?\.url === "string"/);
  assert.match(app, /const navigateTrustedUrl = useCallback/);
  assert.match(app, /if \(!isTrustedOrbyvenUrl\(url\)\) return/);
  assert.match(app, /navigateTrustedUrl\(resolved\)/);
  assert.match(app, /url\.startsWith\("orbyven:\/\/"\)/);
});

test("push registration is explicit, bridged through the authenticated workspace and acknowledged", () => {
  const activity = read("../../components/WorkspaceActivityCenter.tsx");
  const workspace = read("../../components/WorkspaceShell.tsx");
  const helper = read("../../lib/modules/push-devices.ts");

  assert.match(activity, /orbyven:register-push/);
  assert.match(activity, /Activează/);
  assert.match(workspace, /orbyven:native-push-token/);
  assert.match(workspace, /registerPushDevice/);
  assert.match(workspace, /orbyven:push-registered/);
  assert.match(workspace, /orbyven:push-registration-error/);

  assert.match(helper, /auth\.getUser\(\)/);
  assert.match(helper, /from\("user_push_devices"\)/);
  assert.match(helper, /organization_id,user_id,expo_push_token/);
  assert.doesNotMatch(helper, /service[_-]?role/i);
});

test("push device migration is tenant scoped and denies anonymous access", () => {
  const migration = read("../../supabase/migrations/20260930081030_ios_push_devices.sql");

  assert.match(migration, /alter table public\.user_push_devices enable row level security/i);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /organization_members/i);
  assert.match(migration, /unique \(organization_id, user_id, expo_push_token\)/i);
  assert.match(migration, /revoke all on public\.user_push_devices from anon/i);
});
