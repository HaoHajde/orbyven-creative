import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Alpha 0.16 preserves SDK-compatible native privacy dependencies", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.version, "0.16.0");
  assert.equal(pkg.dependencies["expo-local-authentication"], "~57.0.3");
  assert.equal(pkg.dependencies["expo-network"], "~57.0.2");
  assert.equal(pkg.dependencies["expo-haptics"], "~57.0.3");
});

test("Face ID permission is configured for signed ORBYVEN builds", () => {
  const config = JSON.parse(read("app.json"));
  const plugin = config.expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === "expo-local-authentication"
  );

  assert.ok(plugin);
  assert.match(plugin[1].faceIDPermission, /ORBYVEN/);
});

test("native shell protects app-switcher privacy and keeps biometric lock non-fatal", () => {
  const app = read("App.tsx");

  assert.match(app, /privacyShielded/);
  assert.match(app, /LocalAuthentication\.authenticateAsync/);
  assert.match(app, /setPrivacyShielded\(true\)/);
  assert.match(app, /setPrivacyShielded\(false\)/);
  assert.match(app, /Network\.addNetworkStateListener/);
  assert.match(app, /Haptics\.selectionAsync/);
  assert.match(app, /RELOCK_AFTER_MS = 30_000/);
  assert.doesNotMatch(app, /service[_-]?role/i);
});


test("Alpha 0.16 exposes a bounded native runtime bridge and follows the workspace theme", () => {
  const app = read("App.tsx");

  assert.match(app, /const APP_VERSION = "0\.16\.0"/);
  assert.match(app, /NATIVE_RUNTIME/);
  assert.match(app, /injectedJavaScriptBeforeContentLoaded=\{NATIVE_BOOTSTRAP_SCRIPT\}/);
  assert.match(app, /window\.__ORBYVEN_NATIVE__/);
  assert.match(app, /dataset\.appMode = "native"/);
  assert.match(app, /orbyven:native-ready/);
  assert.match(app, /message\.type === "orbyven:theme"/);
  assert.match(app, /setWebTheme\(message\.theme\)/);
  assert.match(app, /orbyven:app-resume/);
});


test("native workspace navigation can request bounded selection haptics", () => {
  const app = read("App.tsx");
  const workspace = read("../components/WorkspaceShell.tsx");

  assert.match(app, /"navigation-haptics"/);
  assert.match(app, /message\.type === "orbyven:haptic"/);
  assert.match(app, /Haptics\.selectionAsync\(\)/);
  assert.match(workspace, /const requestNativeHaptic = useCallback/);
  assert.match(workspace, /type: "orbyven:haptic"/);
});


test("Alpha 0.16 preserves in-flight workspace state across short network interruptions", () => {
  const app = read("App.tsx");

  assert.match(app, /"state-preserving-reconnect"/);
  assert.match(app, /"network-state-bridge"/);
  assert.match(app, /orbyven:native-network-change/);
  assert.match(app, /webFailedRef\.current/);
  assert.match(app, /if \(webFailedRef\.current\)/);
  assert.match(app, /Fără internet · păstrăm ecranul curent/);
  assert.match(app, /Conexiune restabilită/);
  assert.doesNotMatch(
    app,
    /if \(definitelyOnline && previousReachability\.current === false\)[\s\S]{0,180}webRef\.current\?\.reload\(\)/,
  );
});


test("Alpha 0.16 keeps trusted deep links stateful and limits full remounts to hard recovery", () => {
  const app = read("App.tsx");

  assert.match(app, /"stateful-deep-links"/);
  assert.match(app, /"workspace-continuity"/);
  assert.match(app, /const navigateTrustedUrl = useCallback/);
  assert.match(app, /currentUrlRef\.current === url/);
  assert.match(app, /setCurrentUrl\(url\)/);
  assert.match(app, /startInLoadingState=\{!webHasLoaded\}/);
  assert.match(app, /setWebHasLoaded\(true\)/);
  assert.match(app, /setWebHasLoaded\(false\)/);

  const nativeLinkBlock = app.match(
    /const openNativeLink = useCallback\([\s\S]*?\}, \[navigateTrustedUrl\]\);/
  )?.[0] ?? "";
  assert.match(nativeLinkBlock, /navigateTrustedUrl\(webUrl\)/);
  assert.doesNotMatch(nativeLinkBlock, /setReloadKey/);
});


test("Alpha 0.16 waits for explicit web and workspace readiness before replaying pending intents", () => {
  const app = read("App.tsx");
  const runtime = read("../components/pwa/AppModeRuntime.tsx");
  const workspace = read("../components/WorkspaceShell.tsx");

  assert.match(app, /"web-readiness-handshake"/);
  assert.match(app, /"workspace-readiness-handshake"/);
  assert.match(app, /"pending-intent-replay"/);
  assert.match(app, /message\.type === "orbyven:web-ready"/);
  assert.match(app, /message\.type === "orbyven:workspace-ready"/);
  assert.match(app, /workspaceReadyRef\.current = true/);
  assert.match(app, /flushPendingCalendarIntent\(\)/);
  assert.match(app, /flushPendingDocumentsIntent\(\)/);
  assert.match(app, /if \(!eventId \|\| !workspaceReadyRef\.current\) return/);
  assert.match(app, /pendingDocumentsIntent\.current = true/);

  assert.match(runtime, /type: "orbyven:web-ready"/);
  assert.match(runtime, /ReactNativeWebView/);
  assert.match(workspace, /type: "orbyven:workspace-ready"/);
});


test("Alpha 0.16 routes work deadline notifications through the ready workspace", () => {
  const app = read("App.tsx");
  const workspace = read("../components/WorkspaceShell.tsx");
  const tasks = read("../components/modules/TasksModule.tsx");

  assert.match(app, /"work-deadline-reminders"/);
  assert.match(app, /scheduleWorkReminder/);
  assert.match(app, /cancelWorkReminder/);
  assert.match(app, /data\?\.kind === "work-task"/);
  assert.match(app, /openWorkTask\(data\.taskId\)/);
  assert.match(app, /flushPendingWorkTaskIntent/);
  assert.match(app, /orbyven:native-task-record/);
  assert.match(app, /orbyven:native-task-opened/);

  assert.match(workspace, /orbyven:native-task-record/);
  assert.match(workspace, /openModule\("tasks", \{ recordId: taskId \}\)/);
  assert.match(workspace, /orbyven:native-task-opened/);

  assert.match(tasks, /postWorkReminderBridge/);
  assert.match(tasks, /syncNativeWorkReminder/);
  assert.match(tasks, /orbyven:schedule-work-reminder/);
  assert.match(tasks, /orbyven:cancel-work-reminder/);
});


test("Alpha 0.16 hands launch ownership from native shell to the ready workspace without a visual flash", () => {
  const app = read("App.tsx");

  assert.match(app, /"native-launch-handoff"/);
  assert.match(app, /const \[startupWebSettled, setStartupWebSettled\] = useState\(false\)/);
  assert.match(app, /const \[initialUnlockResolved, setInitialUnlockResolved\] = useState\(false\)/);
  assert.match(app, /const \[launchVisible, setLaunchVisible\] = useState\(true\)/);
  assert.match(app, /new Animated\.Value\(1\)/);
  assert.match(app, /Animated\.timing\(launchOpacity/);
  assert.match(app, /duration: 180/);
  assert.match(app, /setStartupWebSettled\(true\)/);
  assert.match(app, /setInitialUnlockResolved\(true\)/);
  assert.match(app, /privacyShielded && !launchVisible/);
  assert.match(app, /styles\.launchHandoff/);
});


test("Alpha 0.16 mirrors Activity Center attention count into the native iOS app badge", () => {
  const app = read("App.tsx");
  const activity = read("../components/WorkspaceActivityCenter.tsx");

  assert.match(app, /"native-attention-badge"/);
  assert.match(app, /async function syncNativeAttentionBadge\(count: number\)/);
  assert.match(app, /Notifications\.setBadgeCountAsync\(normalized\)/);
  assert.match(app, /permissions\.ios\?\.allowsBadge === false/);
  assert.match(app, /message\.type === "orbyven:attention-badge"/);
  assert.match(app, /Number\.isFinite\(message\.badgeCount\)/);

  assert.match(activity, /type: "orbyven:attention-badge"/);
  assert.match(activity, /badgeCount: Math\.min\(items\.length, 99\)/);
  assert.match(activity, /badgeCount: 0/);
});


test("Alpha 0.16 defers stale production runtime refreshes until the native user approves", () => {
  const app = read("App.tsx");
  const registration = read("../components/pwa/ServiceWorkerRegistration.tsx");

  assert.match(app, /"safe-runtime-update"/);
  assert.match(app, /orbyven:runtime-update-available/);
  assert.match(app, /deferredRuntimeVersionRef/);
  assert.match(app, /nativeCopy\.updateAvailable/);
  assert.match(app, /nativeCopy\.updateLater/);
  assert.match(app, /nativeCopy\.updateNow/);
  assert.match(app, /orbyven:apply-runtime-update/);

  assert.match(registration, /getNativeBridge\(\)/);
  assert.match(registration, /type: "orbyven:runtime-update-available"/);
  assert.match(registration, /runtimeVersion: serverVersion/);
  assert.match(registration, /orbyven:apply-runtime-update/);
  assert.match(registration, /sessionStorage\.setItem\(RUNTIME_VERSION_KEY, version\)/);
  assert.match(registration, /window\.location\.reload\(\)/);
});


test("Alpha 0.16 disables native pull-to-refresh while a workspace editor is focused", () => {
  const app = read("App.tsx");
  const runtime = read("../components/pwa/AppModeRuntime.tsx");

  assert.match(app, /"editing-safe-refresh"/);
  assert.match(app, /const \[editingActive, setEditingActive\] = useState\(false\)/);
  assert.match(app, /message\.type === "orbyven:editing-state"/);
  assert.match(app, /setEditingActive\(message\.active\)/);
  assert.match(app, /pullToRefreshEnabled=\{Platform\.OS === "ios" && !editingActive\}/);
  assert.match(app, /setEditingActive\(false\)/);

  assert.match(runtime, /function isEditableElement/);
  assert.match(runtime, /type: "orbyven:editing-state"/);
  assert.match(runtime, /document\.addEventListener\("focusin", handleFocusIn\)/);
  assert.match(runtime, /document\.addEventListener\("focusout", handleFocusOut\)/);
  assert.match(runtime, /postEditingState\(isEditableElement\(document\.activeElement\)\)/);
});


test("Alpha 0.16 disables native navigation gestures while editing", () => {
  const app = read("App.tsx");

  assert.match(app, /"editing-safe-navigation"/);
  assert.match(app, /allowsBackForwardNavigationGestures=\{!editingActive\}/);
  assert.match(app, /pullToRefreshEnabled=\{Platform\.OS === "ios" && !editingActive\}/);
});
