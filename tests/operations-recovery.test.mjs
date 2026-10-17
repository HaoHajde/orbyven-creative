import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildRecoveryPresentation } from "../lib/operations/recovery.ts";

test("transient reads expose a direct retry action", () => {
  const recovery = buildRecoveryPresentation({
    reason: "service_unavailable",
    operation: "read",
    locale: "ro-RO",
  });

  assert.equal(recovery.action?.kind, "retry");
  assert.equal(recovery.action?.label, "Încearcă din nou");
  assert.equal(recovery.tone, "warning");
});

test("non-idempotent writes never offer blind retry after an uncertain result", () => {
  const recovery = buildRecoveryPresentation({
    reason: "timeout",
    operation: "non_idempotent_write",
    locale: "ro-RO",
  });

  assert.equal(recovery.action?.kind, "refresh");
  assert.equal(recovery.action?.label, "Verifică starea");
  assert.match(recovery.hint ?? "", /nu retrimite automat/i);
});

test("conflicts always reload the authoritative state before continuing", () => {
  for (const operation of ["read", "idempotent_write", "non_idempotent_write"]) {
    const recovery = buildRecoveryPresentation({
      reason: "conflict",
      operation,
      locale: "ro-RO",
    });
    assert.equal(recovery.action?.kind, "refresh");
    assert.equal(recovery.action?.label, "Reîncarcă datele");
  }
});

test("authorization and validation states do not create retry loops", () => {
  for (const reason of ["authentication", "permission", "validation", "not_found"]) {
    const recovery = buildRecoveryPresentation({
      reason,
      operation: "read",
      locale: "ro-RO",
    });
    assert.equal(recovery.action, null);
  }
});

test("presentation ignores unexpected raw provider or secret fields", () => {
  const recovery = buildRecoveryPresentation({
    reason: "unknown",
    operation: "read",
    locale: "ro-RO",
    rawError: "sk_live_DO_NOT_EXPOSE",
    providerPayload: { credential: "super-secret" },
  });
  const serialized = JSON.stringify(recovery);

  assert.doesNotMatch(serialized, /sk_live_DO_NOT_EXPOSE/);
  assert.doesNotMatch(serialized, /super-secret/);
  assert.deepEqual(
    Object.keys(recovery).sort(),
    ["action", "description", "hint", "reason", "title", "tone"].sort()
  );
});

test("English surfaces use the same recovery semantics", () => {
  const recovery = buildRecoveryPresentation({
    reason: "offline",
    operation: "read",
    locale: "en-US",
  });

  assert.equal(recovery.action?.kind, "retry");
  assert.equal(recovery.action?.label, "Try again");
  assert.match(recovery.title, /Connection/i);
});

test("reusable UI consumes only the sanitized presentation contract", () => {
  const source = readFileSync(
    join(process.cwd(), "components/operations/RecoveryState.tsx"),
    "utf8"
  );

  assert.match(source, /RecoveryPresentation/);
  assert.match(source, /recovery\.action\?\.kind === "retry"/);
  assert.match(source, /recovery\.action\?\.kind === "refresh"/);
  assert.doesNotMatch(source, /error\.message|JSON\.stringify\(error\)|providerPayload|credentials?/i);
});
