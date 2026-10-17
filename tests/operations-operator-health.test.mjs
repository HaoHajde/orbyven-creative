import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildOperatorHealthSnapshot } from "../lib/operations/operator-health.ts";

const now = new Date("2026-10-17T12:00:00.000Z");

function check(overrides = {}) {
  return {
    key: "api",
    label: "API workspace",
    category: "service",
    state: "healthy",
    checkedAt: "2026-10-17T11:58:00.000Z",
    scope: { kind: "platform" },
    latencyMs: 82,
    consecutiveFailures: 0,
    ...overrides,
  };
}

test("degraded checks dominate aggregate operator health", () => {
  const snapshot = buildOperatorHealthSnapshot({
    checks: [
      check(),
      check({ key: "queue", label: "Queue", category: "job", state: "degraded" }),
    ],
    now,
  });

  assert.equal(snapshot.state, "degraded");
  assert.equal(snapshot.counts.degraded, 1);
  assert.equal(snapshot.items[0].key, "queue");
});

test("stale checks become unknown and prevent a false healthy status", () => {
  const snapshot = buildOperatorHealthSnapshot({
    checks: [check({ checkedAt: "2026-10-17T11:00:00.000Z" })],
    now,
    staleAfterMs: 15 * 60 * 1000,
  });

  assert.equal(snapshot.items[0].stale, true);
  assert.equal(snapshot.items[0].state, "unknown");
  assert.equal(snapshot.state, "attention");
});

test("organization scope never includes another tenant's checks", () => {
  const snapshot = buildOperatorHealthSnapshot({
    checks: [
      check({ key: "platform", scope: { kind: "platform" } }),
      check({ key: "tenant-a", scope: { kind: "organization", organizationId: "org-a" } }),
      check({ key: "tenant-b", scope: { kind: "organization", organizationId: "org-b" } }),
    ],
    now,
    organizationId: "org-a",
  });

  assert.deepEqual(snapshot.items.map((item) => item.key).sort(), ["platform", "tenant-a"]);
});

test("platform-only snapshots omit all organization-scoped checks", () => {
  const snapshot = buildOperatorHealthSnapshot({
    checks: [
      check({ key: "platform", scope: { kind: "platform" } }),
      check({ key: "tenant-a", scope: { kind: "organization", organizationId: "org-a" } }),
    ],
    now,
  });

  assert.deepEqual(snapshot.items.map((item) => item.key), ["platform"]);
  assert.equal(snapshot.organizationId, null);
});

test("read model does not propagate raw provider payloads, secrets or credentials", () => {
  const snapshot = buildOperatorHealthSnapshot({
    checks: [
      check({
        providerPayload: { response: "raw-sensitive-response" },
        secret: "sk_live_DO_NOT_EXPOSE",
        credentials: "password",
      }),
    ],
    now,
  });
  const serialized = JSON.stringify(snapshot);

  assert.doesNotMatch(serialized, /raw-sensitive-response/);
  assert.doesNotMatch(serialized, /sk_live_DO_NOT_EXPOSE/);
  assert.doesNotMatch(serialized, /password/);
  assert.deepEqual(
    Object.keys(snapshot.items[0]).sort(),
    [
      "category",
      "checkedAt",
      "consecutiveFailures",
      "key",
      "label",
      "latencyMs",
      "stale",
      "state",
    ].sort()
  );
});

test("invalid numeric telemetry is normalized instead of leaking arbitrary values", () => {
  const snapshot = buildOperatorHealthSnapshot({
    checks: [check({ latencyMs: -4, consecutiveFailures: Number.NaN })],
    now,
  });

  assert.equal(snapshot.items[0].latencyMs, null);
  assert.equal(snapshot.items[0].consecutiveFailures, 0);
});

test("standalone panel consumes only the sanitized snapshot contract", () => {
  const source = readFileSync(
    join(process.cwd(), "components/operations/OperatorHealthPanel.tsx"),
    "utf8"
  );

  assert.match(source, /OperatorHealthSnapshot/);
  assert.match(source, /snapshot\.items/);
  assert.doesNotMatch(source, /providerPayload|credentials?|secret|rawLog|error\.message/i);
});
