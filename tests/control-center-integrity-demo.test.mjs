import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("integrity demo is preview-only and fails closed in production", () => {
  const page = read("app/control-center/integrity/demo/page.tsx");
  const component = read("components/ControlCenterIntegrityDemo.tsx");

  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(page, /process\.env\.VERCEL_ENV === "preview"/);
  assert.match(page, /process\.env\.NODE_ENV === "development"/);
  assert.match(page, /notFound\(\)/);
  assert.doesNotMatch(page, /ORBYVEN_INTEGRITY_OWNER_ID/);
  assert.doesNotMatch(component, /orbyvenSupabase|fetch\(|Authorization|service_role/i);
  assert.match(component, /Preview demo · date fictive/);
  assert.match(component, /nu poate executa acțiuni/i);
});
