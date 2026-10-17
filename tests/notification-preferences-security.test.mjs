import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20261017153000_notification_preferences_control_plane.sql",
    import.meta.url
  ),
  "utf8"
);
const preferenceSource = readFileSync(
  new URL("../lib/modules/notification-preferences.ts", import.meta.url),
  "utf8"
);
const deviceMigration = readFileSync(
  new URL("../supabase/migrations/20260930081030_ios_push_devices.sql", import.meta.url),
  "utf8"
);

test("notification preferences are owned by the current user inside an active organization", () => {
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
  assert.ok((migration.match(/private\.is_org_member\(organization_id\)/g) ?? []).length >= 3);
  assert.match(migration, /for select[\s\S]*to authenticated[\s\S]*user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /for insert[\s\S]*with check \([\s\S]*user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /for update[\s\S]*using \([\s\S]*user_id = \(select auth\.uid\(\)\)[\s\S]*with check/);
});

test("channel and Data API grants are fail closed", () => {
  assert.match(migration, /channel text not null check \(channel in \('push'\)\)/);
  assert.match(
    migration,
    /grant select, insert, update on table public\.user_notification_preferences to authenticated/
  );
  assert.match(
    migration,
    /revoke delete on table public\.user_notification_preferences from authenticated/
  );
  assert.doesNotMatch(migration, /channel in \([^\)]*(?:email|web)/i);
});

test("audit writes reuse platform_audit_log and contain no provider secrets", () => {
  const auditStart = migration.indexOf(
    "create or replace function private.audit_notification_preference_change()"
  );
  const auditEnd = migration.indexOf(
    "drop trigger if exists user_notification_preferences_audit"
  );
  assert.ok(auditStart >= 0 && auditEnd > auditStart);
  const auditFunction = migration.slice(auditStart, auditEnd);
  assert.match(auditFunction, /insert into public\.platform_audit_log/);
  assert.match(auditFunction, /jsonb_build_object\([\s\S]*'channel',[\s\S]*'enabled'/);
  assert.doesNotMatch(
    auditFunction,
    /expo_push_token|provider_payload|credential|authorization|secret/i
  );
  assert.match(
    migration,
    /revoke all on function private\.audit_notification_preference_change\(\)[\s\S]*from public, anon, authenticated/
  );
});

test("preference API source never reads device tokens", () => {
  assert.doesNotMatch(preferenceSource, /expo_push_token|user_push_devices/);
  assert.match(preferenceSource, /\.select\("channel,enabled,updated_at"\)/);
});

test("canonical device registry remains mobile-only", () => {
  assert.match(deviceMigration, /platform in \('ios','android'\)/);
  assert.doesNotMatch(deviceMigration, /platform in \([^\)]*web/i);
});
