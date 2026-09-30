import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("Alpha 0.6 preserves Expo local notifications and config plugin", () => {
  const pkg = JSON.parse(read("../package.json"));
  const config = JSON.parse(read("../app.json"));

  assert.equal(pkg.version, "0.6.0");
  assert.equal(pkg.dependencies["expo-notifications"], "~57.0.21");
  assert.ok(
    config.expo.plugins.some((entry) =>
      Array.isArray(entry)
        ? entry[0] === "expo-notifications"
        : entry === "expo-notifications"
    )
  );
});

test("native shell schedules, cancels and routes local calendar reminders", () => {
  const app = read("../App.tsx");

  assert.match(app, /scheduleNotificationAsync/);
  assert.match(app, /cancelScheduledNotificationAsync/);
  assert.match(app, /getAllScheduledNotificationsAsync/);
  assert.match(app, /requestPermissionsAsync/);
  assert.match(app, /orbyven:schedule-calendar-reminder/);
  assert.match(app, /orbyven:cancel-calendar-reminder/);
  assert.match(app, /orbyven:native-calendar-record/);
  assert.match(app, /addNotificationResponseReceivedListener/);
  assert.match(app, /clearLastNotificationResponseAsync/);
});

test("calendar module mirrors its existing reminder_minutes into native reminders", () => {
  const calendar = read("../../components/modules/CalendarModule.tsx");

  assert.match(calendar, /postCalendarReminderBridge/);
  assert.match(calendar, /orbyven:schedule-calendar-reminder/);
  assert.match(calendar, /orbyven:cancel-calendar-reminder/);
  assert.match(calendar, /created\.reminder_minutes !== null/);
});

test("workspace opens the exact calendar record and acknowledges native routing", () => {
  const workspace = read("../../components/ClientWorkspace.tsx");

  assert.match(workspace, /orbyven:native-calendar-record/);
  assert.match(workspace, /openModule\("calendar", \{ recordId: eventId \}\)/);
  assert.match(workspace, /orbyven:native-calendar-opened/);
});
