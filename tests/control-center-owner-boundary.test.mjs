import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Control Center APIs require one exact configured owner", () => {
  const owner = read("lib/orbyven-control-center-owner.ts");
  const platform = read("app/api/control-center/route.ts");
  const compliance = read("app/api/control-center/compliance/route.ts");

  assert.match(owner, /ORBYVEN_CONTROL_CENTER_OWNER_ID/);
  assert.match(owner, /UUID_PATTERN\.test\(configuredOwnerId\)/);
  assert.match(owner, /control_center_owner_not_configured/);
  assert.match(owner, /userId !== configuredOwnerId/);
  assert.match(owner, /control_center_owner_required/);

  assert.match(platform, /requireControlCenterOwner\(user\.id\)/);
  assert.match(compliance, /requireControlCenterOwner\(user\.id\)/);
});
