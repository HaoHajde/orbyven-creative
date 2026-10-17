import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Control Center human access is restricted to one exact server-side owner", () => {
  const owner = read("lib/orbyven-control-center-owner.ts");
  const core = read("app/api/control-center/route.ts");
  const legal = read("app/api/control-center/compliance/route.ts");

  assert.match(owner, /ORBYVEN_CONTROL_CENTER_OWNER_ID/);
  assert.match(owner, /ORBYVEN_INTEGRITY_OWNER_ID/);
  assert.match(owner, /UUID_PATTERN/);
  assert.match(owner, /userId !== configuredOwnerId\(\)/);
  assert.match(owner, /control_center_owner_required/);
  assert.match(owner, /staffRole: "platform_owner"/);

  assert.match(core, /authorizeOwnerControlCenter\(request\)/);
  assert.doesNotMatch(core, /await authorizeControlCenter\(request\)/);

  assert.match(legal, /authorizeOwnerControlCenter\(request\)/);
  assert.doesNotMatch(legal, /await authorizeControlCenter\(request\)/);
});
