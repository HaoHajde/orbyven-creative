import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const preferenceSource = readFileSync(
  new URL("../lib/modules/notification-preferences.ts", import.meta.url),
  "utf8"
);
const pushDeviceSource = readFileSync(
  new URL("../lib/modules/push-devices.ts", import.meta.url),
  "utf8"
);
const activityCenterSource = readFileSync(
  new URL("../components/WorkspaceActivityCenter.tsx", import.meta.url),
  "utf8"
);

test("notification control plane exposes only the demonstrated push channel", () => {
  assert.match(preferenceSource, /NOTIFICATION_CHANNELS = \["push"\] as const/);
  assert.match(preferenceSource, /throw new Error\("Unsupported notification channel\."\)/);
  assert.doesNotMatch(preferenceSource, /\bemail\b|\bweb[_ -]?push\b/i);
});

test("missing preference fails closed and preference reads never request push tokens", () => {
  assert.match(
    preferenceSource,
    /return \{ channel: channelInput, enabled: false, updatedAt: null \}/
  );
  assert.match(preferenceSource, /\.select\("channel,enabled,updated_at"\)/);
  assert.doesNotMatch(preferenceSource, /expo_push_token/);
});

test("device registration activates delivery consent only after the device is persisted", () => {
  const deviceWrite = pushDeviceSource.indexOf('.from("user_push_devices")');
  const preferenceWrite = pushDeviceSource.indexOf(
    'await setNotificationPreference(organizationId, "push", true)'
  );
  assert.ok(deviceWrite >= 0);
  assert.ok(preferenceWrite > deviceWrite);
  assert.match(pushDeviceSource, /\.select\("id"\)/);
});

test("Activity Center keeps internal attention independent from push delivery", () => {
  assert.match(activityCenterSource, /loadWorkspaceActivity/);
  assert.match(activityCenterSource, /loadNotificationPreference\(organizationId, "push"\)/);
  assert.match(
    activityCenterSource,
    /setNotificationPreference\([\s\S]*organizationId,[\s\S]*"push",[\s\S]*false/
  );
  assert.match(
    activityCenterSource,
    /Controlează doar livrarea externă\. Atenționările rămân mereu vizibile aici\./
  );
  assert.doesNotMatch(activityCenterSource, /expoPushToken|expo_push_token/);
});

test("preference change browser events contain only sanitized channel state", () => {
  const eventStart = preferenceSource.indexOf(
    'new CustomEvent("orbyven:notification-preference-changed"'
  );
  assert.ok(eventStart >= 0);
  const eventSlice = preferenceSource.slice(eventStart, eventStart + 260);
  assert.match(eventSlice, /channel: preference\.channel/);
  assert.match(eventSlice, /enabled: preference\.enabled/);
  assert.doesNotMatch(eventSlice, /token|payload|credential|secret/i);
});
