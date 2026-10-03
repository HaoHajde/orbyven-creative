import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

const BASE_URL = "https://orbyven.ro";
export const WORKSPACE_URL = BASE_URL + "/workspace";
export const APP_VERSION = "0.13.0";
export const RELOCK_AFTER_MS = 30_000;

export type ConnectionState = "loading" | "online" | "offline";
export type NativeTheme = "light" | "dark";
export type NativeLocale = "ro" | "en";
export type NetworkNotice = "offline" | "online" | null;

export const IOS_COPY = {
  ro: {
    offline: "Fără internet · păstrăm ecranul curent",
    online: "Conexiune restabilită",
    syncing: "Sincronizare workspace…",
    connectionUnavailable: "Conexiune indisponibilă",
    connectionHelp: "Verifică internetul și reîncearcă. Datele ORBYVEN nu sunt stocate local în această versiune.",
    retry: "Reîncearcă",
    back: "Înapoi",
    documents: "Documente",
    forward: "Înainte",
    protected: "ORBYVEN protejat",
    protectedCopy: "Workspace-ul este ascuns cât timp aplicația nu este activă.",
    checking: "Verificare…",
    unlock: "Deblochează",
    notificationsOff: "Notificări dezactivate",
    notificationsOffCopy: "Activează notificările pentru ORBYVEN din Settings ca să primești alertele iPhone.",
    pushReady: "Push pregătit",
    pushReadyCopy: "ORBYVEN trebuie legat la proiectul EAS și la credențialele Apple Push înainte de activarea notificărilor remote.",
    pushUnavailable: "Push indisponibil",
    pushUnavailableCopy: "Tokenul push nu poate fi creat încă pe acest build.",
    alertsEnabled: "Alerte iPhone activate",
    alertsEnabledCopy: "Acest dispozitiv este înregistrat pentru notificările ORBYVEN.",
    registrationFailed: "Înregistrare nereușită",
    registrationFailedCopy: "ORBYVEN nu a putut salva acest dispozitiv pentru push. Încearcă din nou.",
    remindersOffCopy: "Activează notificările pentru ORBYVEN din Settings ca să primești reminderele programărilor.",
  },
  en: {
    offline: "No internet · keeping the current screen",
    online: "Connection restored",
    syncing: "Syncing workspace…",
    connectionUnavailable: "Connection unavailable",
    connectionHelp: "Check your internet connection and try again. ORBYVEN data is not stored locally in this version.",
    retry: "Try again",
    back: "Back",
    documents: "Documents",
    forward: "Forward",
    protected: "ORBYVEN protected",
    protectedCopy: "Your workspace is hidden while the app is not active.",
    checking: "Checking…",
    unlock: "Unlock",
    notificationsOff: "Notifications disabled",
    notificationsOffCopy: "Enable ORBYVEN notifications in Settings to receive iPhone alerts.",
    pushReady: "Push ready",
    pushReadyCopy: "ORBYVEN must be linked to the EAS project and Apple Push credentials before remote notifications can be enabled.",
    pushUnavailable: "Push unavailable",
    pushUnavailableCopy: "A push token cannot be created on this build yet.",
    alertsEnabled: "iPhone alerts enabled",
    alertsEnabledCopy: "This device is registered for ORBYVEN notifications.",
    registrationFailed: "Registration failed",
    registrationFailedCopy: "ORBYVEN could not save this device for push notifications. Try again.",
    remindersOffCopy: "Enable ORBYVEN notifications in Settings to receive appointment reminders.",
  },
} as const;

const NATIVE_RUNTIME = {
  platform: "ios",
  version: APP_VERSION,
  capabilities: [
    "biometric-lock",
    "deep-links",
    "documents",
    "haptics",
    "local-notifications",
    "native-launch-handoff",
    "native-attention-badge",
    "work-deadline-reminders",
    "navigation-haptics",
    "network-recovery",
    "network-state-bridge",
    "state-preserving-reconnect",
    "stateful-deep-links",
    "workspace-continuity",
    "web-readiness-handshake",
    "workspace-readiness-handshake",
    "pending-intent-replay",
    "locale-sync",
    "push-registration",
  ],
} as const;

export const NATIVE_BOOTSTRAP_SCRIPT = `
(function () {
  var runtime = ${JSON.stringify(NATIVE_RUNTIME)};
  window.__ORBYVEN_NATIVE__ = runtime;
  var root = document.documentElement;
  if (root) {
    root.dataset.appMode = "native";
    root.dataset.nativePlatform = runtime.platform;
    root.dataset.nativeVersion = runtime.version;
  }
  window.dispatchEvent(new CustomEvent("orbyven:native-ready", { detail: runtime }));
})();
true;
`;

type CalendarReminderMessage = {
  eventId: string;
  title: string;
  startAt: string;
  reminderMinutes: number | null;
  location?: string | null;
};

type WorkReminderMessage = {
  taskId: string;
  title: string;
  dueAt: string;
  location?: string | null;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function notificationsAllowed() {
  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function registerForRemotePush() {
  const allowed = await notificationsAllowed();
  if (!allowed) throw new Error("notification-permission-denied");

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId || typeof projectId !== "string") {
    throw new Error("push-project-not-linked");
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  if (!token.data) throw new Error("push-token-unavailable");
  return token.data;
}

export async function syncNativeAttentionBadge(count: number) {
  const normalized = Math.max(0, Math.min(99, Math.floor(count)));
  const permissions = await Notifications.getPermissionsAsync();
  const allowed =
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!allowed || permissions.ios?.allowsBadge === false) return false;
  return Notifications.setBadgeCountAsync(normalized);
}

export async function cancelCalendarReminder(eventId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matches = scheduled.filter(
    (request) =>
      request.content.data?.kind === "calendar-event" &&
      request.content.data?.eventId === eventId
  );
  await Promise.all(
    matches.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier)
    )
  );
}

export async function cancelWorkReminder(taskId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matches = scheduled.filter(
    (request) =>
      request.content.data?.kind === "work-task" &&
      request.content.data?.taskId === taskId
  );
  await Promise.all(
    matches.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier)
    )
  );
}

export async function scheduleWorkReminder(message: WorkReminderMessage) {
  await cancelWorkReminder(message.taskId);

  const dueAt = new Date(message.dueAt).getTime();
  if (!Number.isFinite(dueAt) || dueAt <= Date.now()) return null;

  const allowed = await notificationsAllowed();
  if (!allowed) throw new Error("notification-permission-denied");

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "ORBYVEN · Termen lucrare",
      body: message.location
        ? message.title + " · " + message.location
        : message.title,
      sound: true,
      data: {
        kind: "work-task",
        taskId: message.taskId,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(dueAt),
    },
  });
}

export async function scheduleCalendarReminder(message: CalendarReminderMessage) {
  await cancelCalendarReminder(message.eventId);

  if (message.reminderMinutes === null) return null;

  const startAt = new Date(message.startAt).getTime();
  if (!Number.isFinite(startAt) || startAt <= Date.now()) return null;

  const allowed = await notificationsAllowed();
  if (!allowed) throw new Error("notification-permission-denied");

  const requestedAt =
    startAt - Math.max(0, message.reminderMinutes) * 60 * 1000;
  const triggerAt = Math.max(Date.now() + 1500, requestedAt);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "ORBYVEN · Programare",
      body: message.location
        ? message.title + " · " + message.location
        : message.title,
      sound: true,
      data: {
        kind: "calendar-event",
        eventId: message.eventId,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(triggerAt),
    },
  });
}

export function isTrustedOrbyvenUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      (parsed.hostname === "orbyven.ro" || parsed.hostname.endsWith(".orbyven.ro"));
  } catch {
    return false;
  }
}

export function nativeUrlToWebUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "orbyven:") return null;
    const path = [parsed.hostname, parsed.pathname].filter(Boolean).join("/");
    return BASE_URL + "/" + path.replace(/^\/+/, "") + parsed.search + parsed.hash;
  } catch {
    return null;
  }
}
