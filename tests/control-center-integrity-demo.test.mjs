import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("integrity demo stays isolated and uses simulated console actions", () => {
  const page = read("app/control-center/integrity/demo/page.tsx");
  const console = read("components/ControlCenterIntegrityConsole.tsx");

  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(page, /process\.env\.VERCEL_ENV === "preview"/);
  assert.match(page, /process\.env\.NODE_ENV === "development"/);
  assert.match(page, /ORBYVEN_DEMO_PROJECT_ID/);
  assert.match(page, /process\.env\.VERCEL_PROJECT_ID === ORBYVEN_DEMO_PROJECT_ID/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /<ControlCenterIntegrityConsole demo \/>/);
  assert.doesNotMatch(page, /ORBYVEN_INTEGRITY_OWNER_ID|service_role|Authorization/i);

  assert.match(console, /function demoPayload\(\): IntegrityPayload/);
  assert.match(console, /if \(demo\) \{\s*setPayload\(demoPayload\(\)\)/s);
  assert.match(console, /if \(demo\) \{\s*setBusy\(`/s);
  assert.match(console, /if \(demo\) \{\s*setNotice\("Raport demo"\)/s);
  assert.match(console, /Fictive data · isolated demo · no real actions/);
});
