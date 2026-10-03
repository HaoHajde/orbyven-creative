import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("workspace high-fanout reads bind PostgREST to the validated JWT", () => {
  const overview = read("lib/modules/overview.ts");
  const activity = read("lib/modules/activity.ts");

  for (const source of [overview, activity]) {
    const gate = source.indexOf("await requireOrbyvenSession()");
    const boundClient = source.indexOf("createOrbyvenAuthenticatedClient(accessToken)");
    const firstQuery = source.indexOf("supabase.from(");
    assert.ok(gate >= 0, "session gate missing");
    assert.ok(boundClient > gate, "JWT-bound client must be created after session validation");
    assert.ok(firstQuery > boundClient, "PostgREST query appears before JWT-bound client");
    assert.ok(!source.includes("orbyvenSupabase.from("), "fanout reads must not use shared auth client");
  }
});

test("workspace session gate refreshes once and returns the exact access token", () => {
  const session = read("lib/orbyven-session.ts");

  assert.match(session, /let sessionGatePromise: Promise<string \| null> \| null = null/);
  assert.match(session, /if \(sessionGatePromise\) return sessionGatePromise/);
  assert.match(session, /auth\.getSession\(\)/);
  assert.match(session, /REFRESH_MARGIN_MS = 90_000/);
  assert.match(session, /auth\.refreshSession\(\)/);
  assert.match(session, /finally \{\s*sessionGatePromise = null/);
  assert.match(session, /session\.access_token/);
  assert.match(session, /refreshed\.data\.session\?\.access_token/);
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

test("JWT-bound workspace client uses Supabase accessToken instead of a custom Authorization header", () => {
  const client = read("lib/orbyven-supabase.ts");

  assert.match(client, /createOrbyvenAuthenticatedClient\(accessToken: string\)/);
  assert.match(client, /accessToken:\s*async \(\) => token/);
  assert.doesNotMatch(client, /Authorization:/);
  assert.match(client, /persistSession:\s*false/);
  assert.match(client, /autoRefreshToken:\s*false/);
});
