import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("integrity demo is server-rendered and isolated from real auth/data", () => {
  const page = read("app/control-center/integrity/demo/page.tsx");
  const demo = read("components/ControlCenterIntegrityDemo.tsx");

  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(page, /process\.env\.VERCEL_ENV === "preview"/);
  assert.match(page, /process\.env\.NODE_ENV === "development"/);
  assert.match(page, /ORBYVEN_DEMO_PROJECT_ID/);
  assert.match(page, /process\.env\.VERCEL_PROJECT_ID === ORBYVEN_DEMO_PROJECT_ID/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /ControlCenterIntegrityDemo/);
  assert.doesNotMatch(page, /ControlCenterIntegrityConsole|ORBYVEN_INTEGRITY_OWNER_ID|service_role|Authorization/i);

  assert.doesNotMatch(demo, /"use client"|orbyvenSupabase|Supabase|Authorization|service_role|fetch\(/i);
  assert.match(demo, /ISOLATED DEMO/);
  assert.match(demo, /NO DATA · NO PROD/);
  assert.match(demo, /PREPARE PR/);
  assert.match(demo, /guardianQueued/);
});
