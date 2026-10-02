import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("workspace high-fanout reads require a fresh session before issuing PostgREST queries", () => {
  const overview = read("lib/modules/overview.ts");
  const activity = read("lib/modules/activity.ts");

  for (const source of [overview, activity]) {
    const gate = source.indexOf("await requireOrbyvenSession()");
    const firstQuery = source.indexOf("orbyvenSupabase.from(");
    assert.ok(gate >= 0, "session gate missing");
    assert.ok(firstQuery > gate, "PostgREST query appears before session gate");
  }
});

test("workspace session gate refreshes once and shares concurrent refresh work", () => {
  const session = read("lib/orbyven-session.ts");

  assert.match(session, /let sessionGatePromise: Promise<boolean> \| null = null/);
  assert.match(session, /if \(sessionGatePromise\) return sessionGatePromise/);
  assert.match(session, /auth\.getSession\(\)/);
  assert.match(session, /REFRESH_MARGIN_MS = 90_000/);
  assert.match(session, /auth\.refreshSession\(\)/);
  assert.match(session, /finally \{\s*sessionGatePromise = null/);
  assert.match(session, /ORBYVEN_SESSION_REQUIRED/);
});

test("workspace shell reacts to real Supabase sign-out without making auth callbacks async", () => {
  const shell = read("components/WorkspaceShell.tsx");

  assert.match(shell, /auth\.onAuthStateChange\(\(event\) => \{/);
  assert.match(shell, /event !== "SIGNED_OUT"/);
  assert.match(shell, /setWorkspace\(null\)/);
  assert.match(shell, /Promise\.resolve\(onSignedOut\(\)\)/);
  assert.match(shell, /data\.subscription\.unsubscribe\(\)/);
  assert.doesNotMatch(shell, /onAuthStateChange\(async/);
});
