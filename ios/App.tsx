import { useCallback, useEffect, useRef, useState } from "react";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import * as Network from "expo-network";
import * as Notifications from "expo-notifications";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from "react-native-webview";

const BASE_URL = "https://orbyven.ro";
const WORKSPACE_URL = BASE_URL + "/workspace";
const APP_VERSION = "0.14.0";
const RELOCK_AFTER_MS = 30_000;

type ConnectionState = "loading" | "online" | "offline";
type NativeTheme = "light" | "dark";
type NativeLocale = "ro" | "en";
type NetworkNotice = "offline" | "online" | null;

const IOS_COPY = {
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
    "foreground-refresh",
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

const NATIVE_BOOTSTRAP_SCRIPT = `
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

async function registerForRemotePush() {
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

async function syncNativeAttentionBadge(count: number) {
  const normalized = Math.max(0, Math.min(99, Math.floor(count)));
  const permissions = await Notifications.getPermissionsAsync();
  const allowed =
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!allowed || permissions.ios?.allowsBadge === false) return false;
  return Notifications.setBadgeCountAsync(normalized);
}

async function cancelCalendarReminder(eventId: string) {
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

async function cancelWorkReminder(taskId: string) {
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

async function scheduleWorkReminder(message: WorkReminderMessage) {
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

async function scheduleCalendarReminder(message: CalendarReminderMessage) {
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

function isTrustedOrbyvenUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      (parsed.hostname === "orbyven.ro" || parsed.hostname.endsWith(".orbyven.ro"));
  } catch {
    return false;
  }
}

function nativeUrlToWebUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "orbyven:") return null;
    const path = [parsed.hostname, parsed.pathname].filter(Boolean).join("/");
    return BASE_URL + "/" + path.replace(/^\/+/, "") + parsed.search + parsed.hash;
  } catch {
    return null;
  }
}

export default function App() {
  const webRef = useRef<WebView>(null);
  const colorScheme = useColorScheme();
  const [webTheme, setWebTheme] = useState<NativeTheme | null>(null);
  const [nativeLocale, setNativeLocale] = useState<NativeLocale>("ro");
  const nativeCopy = IOS_COPY[nativeLocale];
  const dark = (webTheme ?? colorScheme) !== "light";

  const [connection, setConnection] = useState<ConnectionState>("loading");
  const [currentUrl, setCurrentUrl] = useState(WORKSPACE_URL);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [webHasLoaded, setWebHasLoaded] = useState(false);
  const [startupWebSettled, setStartupWebSettled] = useState(false);
  const [initialUnlockResolved, setInitialUnlockResolved] = useState(false);
  const [launchVisible, setLaunchVisible] = useState(true);
  const [privacyShielded, setPrivacyShielded] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [deviceOffline, setDeviceOffline] = useState(false);
  const [networkNotice, setNetworkNotice] = useState<NetworkNotice>(null);

  const lastBackgroundAt = useRef<number | null>(null);
  const authenticationInProgress = useRef(false);
  const previousReachability = useRef<boolean | null>(null);
  const pendingCalendarEventId = useRef<string | null>(null);
  const pendingWorkTaskId = useRef<string | null>(null);
  const pendingDocumentsIntent = useRef(false);
  const webRuntimeReadyRef = useRef(false);
  const workspaceReadyRef = useRef(false);
  const webFailedRef = useRef(false);
  const networkNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUrlRef = useRef(WORKSPACE_URL);
  const [launchOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    currentUrlRef.current = currentUrl;
  }, [currentUrl]);

  const navigateTrustedUrl = useCallback((url: string) => {
    if (!isTrustedOrbyvenUrl(url)) return;

    if (currentUrlRef.current === url) {
      webRef.current?.injectJavaScript(
        "window.dispatchEvent(new Event('focus')); window.dispatchEvent(new CustomEvent('orbyven:app-resume',{detail:{backgroundMs:0}})); true;",
      );
      return;
    }

    webRuntimeReadyRef.current = false;
    workspaceReadyRef.current = false;
    setCurrentUrl(url);
  }, []);

  const openNativeLink = useCallback((url: string | null) => {
    if (!url) return;
    const webUrl = nativeUrlToWebUrl(url);
    if (!webUrl) return;
    navigateTrustedUrl(webUrl);
  }, [navigateTrustedUrl]);

  const authenticateToUnlock = useCallback(async () => {
    if (authenticationInProgress.current) return;

    authenticationInProgress.current = true;
    setUnlocking(true);

    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      const available = hasHardware && isEnrolled;
      setBiometricAvailable(available);

      if (!available) {
        setPrivacyShielded(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Deblochează ORBYVEN",
        cancelLabel: "Anulează",
        fallbackLabel: "Folosește codul iPhone",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setPrivacyShielded(false);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        return;
      }

      if (result.error === "not_available" || result.error === "passcode_not_set") {
        // Expo Go cannot test Face ID on iOS. Keep the development shell usable
        // while the signed ORBYVEN binary will enforce Face ID once available.
        setBiometricAvailable(false);
        setPrivacyShielded(false);
      }
    } catch {
      // Biometric app lock is an additional local privacy layer, not the
      // workspace authentication boundary. Never lock the user out if the
      // platform biometric API is unavailable.
      setBiometricAvailable(false);
      setPrivacyShielded(false);
    } finally {
      authenticationInProgress.current = false;
      setUnlocking(false);
      setInitialUnlockResolved(true);
    }
  }, []);

  useEffect(() => {
    void Linking.getInitialURL().then(openNativeLink);
    const subscription = Linking.addEventListener("url", ({ url }) => openNativeLink(url));
    return () => subscription.remove();
  }, [openNativeLink]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void authenticateToUnlock();
    }, 0);

    return () => clearTimeout(timer);
  }, [authenticateToUnlock]);

  useEffect(() => {
    if (!launchVisible || !initialUnlockResolved || !startupWebSettled) return;

    const animation = Animated.timing(launchOpacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) setLaunchVisible(false);
    });

    return () => animation.stop();
  }, [
    initialUnlockResolved,
    launchOpacity,
    launchVisible,
    startupWebSettled,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        if (lastBackgroundAt.current === null) {
          lastBackgroundAt.current = Date.now();
        }
        setPrivacyShielded(true);
        return;
      }

      const backgroundAt = lastBackgroundAt.current;
      lastBackgroundAt.current = null;
      const backgroundMs =
        backgroundAt === null ? 0 : Math.max(0, Date.now() - backgroundAt);

      webRef.current?.injectJavaScript(
        "window.dispatchEvent(new Event('focus')); window.dispatchEvent(new CustomEvent('orbyven:app-resume',{detail:{backgroundMs:" +
          backgroundMs +
          "}})); document.dispatchEvent(new Event('visibilitychange')); true;",
      );

      if (backgroundAt === null || backgroundMs >= RELOCK_AFTER_MS) {
        void authenticateToUnlock();
      } else {
        setPrivacyShielded(false);
      }
    });

    return () => subscription.remove();
  }, [authenticateToUnlock]);

  const emitNativeNetworkState = useCallback((online: boolean) => {
    webRef.current?.injectJavaScript(
      "window.dispatchEvent(new CustomEvent('orbyven:native-network-change',{detail:{online:" +
        (online ? "true" : "false") +
        "}})); true;",
    );
  }, []);

  const showNetworkNotice = useCallback((notice: Exclude<NetworkNotice, null>) => {
    if (networkNoticeTimerRef.current) {
      clearTimeout(networkNoticeTimerRef.current);
      networkNoticeTimerRef.current = null;
    }

    setNetworkNotice(notice);

    if (notice === "online") {
      networkNoticeTimerRef.current = setTimeout(() => {
        setNetworkNotice(null);
        networkNoticeTimerRef.current = null;
      }, 1800);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const applyNetworkState = (state: Network.NetworkState) => {
      if (!mounted) return;

      const definitelyOffline =
        state.isConnected === false || state.isInternetReachable === false;
      const definitelyOnline =
        state.isConnected === true && state.isInternetReachable !== false;

      setDeviceOffline(definitelyOffline);

      if (definitelyOffline) {
        const wasOnline = previousReachability.current !== false;
        previousReachability.current = false;
        setConnection("offline");
        emitNativeNetworkState(false);
        if (wasOnline) showNetworkNotice("offline");
        return;
      }

      if (definitelyOnline && previousReachability.current === false) {
        previousReachability.current = true;
        setDeviceOffline(false);
        emitNativeNetworkState(true);
        showNetworkNotice("online");
        void Haptics.selectionAsync().catch(() => undefined);

        if (webFailedRef.current) {
          webFailedRef.current = false;
          setConnection("loading");
          webRef.current?.reload();
        } else {
          setConnection("online");
        }
        return;
      }

      if (definitelyOnline) {
        previousReachability.current = true;
        emitNativeNetworkState(true);
      }
    };

    void Network.getNetworkStateAsync()
      .then(applyNetworkState)
      .catch(() => undefined);

    const subscription = Network.addNetworkStateListener(applyNetworkState);

    return () => {
      mounted = false;
      subscription.remove();
      if (networkNoticeTimerRef.current) {
        clearTimeout(networkNoticeTimerRef.current);
        networkNoticeTimerRef.current = null;
      }
    };
  }, [emitNativeNetworkState, showNetworkNotice]);

  const onNavigationStateChange = useCallback((state: WebViewNavigation) => {
    setCurrentUrl(state.url);
    setCanGoBack(state.canGoBack);
    setCanGoForward(state.canGoForward);
    if (!state.loading) setConnection("online");
  }, []);

  const shouldStart = useCallback((request: { url: string }) => {
    if (request.url === "about:blank") return true;
    if (request.url.startsWith("orbyven://")) {
      openNativeLink(request.url);
      return false;
    }
    if (isTrustedOrbyvenUrl(request.url)) return true;
    if (/^(mailto:|tel:|sms:)/.test(request.url) || request.url.startsWith("https://")) {
      void Linking.openURL(request.url);
    }
    return false;
  }, [openNativeLink]);

  const shareCurrentUrl = useCallback(() => {
    void Share.share({
      title: "ORBYVEN",
      message: currentUrl,
      url: currentUrl,
    }).then(() =>
      Haptics.selectionAsync().catch(() => undefined),
    );
  }, [currentUrl]);

  const flushPendingCalendarIntent = useCallback(() => {
    const eventId = pendingCalendarEventId.current;
    if (!eventId || !workspaceReadyRef.current) return;

    webRef.current?.injectJavaScript(
      "window.dispatchEvent(new CustomEvent('orbyven:native-calendar-record',{detail:{eventId:" +
        JSON.stringify(eventId) +
        "}})); true;",
    );
  }, []);

  const flushPendingWorkTaskIntent = useCallback(() => {
    const taskId = pendingWorkTaskId.current;
    if (!taskId || !workspaceReadyRef.current) return;

    webRef.current?.injectJavaScript(
      "window.dispatchEvent(new CustomEvent('orbyven:native-task-record',{detail:{taskId:" +
        JSON.stringify(taskId) +
        "}})); true;",
    );
  }, []);

  const flushPendingDocumentsIntent = useCallback(() => {
    if (!pendingDocumentsIntent.current || !workspaceReadyRef.current) return;
    pendingDocumentsIntent.current = false;
    webRef.current?.injectJavaScript(
      "window.dispatchEvent(new CustomEvent('orbyven:native-documents',{detail:{create:true}})); true;",
    );
  }, []);

  const openCalendarRecord = useCallback((eventId: string) => {
    pendingCalendarEventId.current = eventId;

    if (!currentUrl.startsWith(WORKSPACE_URL)) {
      navigateTrustedUrl(WORKSPACE_URL);
      return;
    }

    if (workspaceReadyRef.current) {
      setTimeout(flushPendingCalendarIntent, 0);
    }
  }, [currentUrl, flushPendingCalendarIntent, navigateTrustedUrl]);

  const openWorkTask = useCallback((taskId: string) => {
    pendingWorkTaskId.current = taskId;

    if (!currentUrl.startsWith(WORKSPACE_URL)) {
      navigateTrustedUrl(WORKSPACE_URL);
      return;
    }

    if (workspaceReadyRef.current) {
      setTimeout(flushPendingWorkTaskIntent, 0);
    }
  }, [currentUrl, flushPendingWorkTaskIntent, navigateTrustedUrl]);

  const openDocuments = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    pendingDocumentsIntent.current = true;

    if (!currentUrl.startsWith(WORKSPACE_URL)) {
      navigateTrustedUrl(WORKSPACE_URL);
      return;
    }

    if (workspaceReadyRef.current) {
      setTimeout(flushPendingDocumentsIntent, 0);
    }
  }, [currentUrl, flushPendingDocumentsIntent, navigateTrustedUrl]);

  const openNotificationUrl = useCallback((url: string) => {
    const resolved = url.startsWith("orbyven://")
      ? nativeUrlToWebUrl(url)
      : url;

    if (!resolved) return;
    navigateTrustedUrl(resolved);
  }, [navigateTrustedUrl]);

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      if (
        data?.kind === "calendar-event" &&
        typeof data.eventId === "string"
      ) {
        openCalendarRecord(data.eventId);
      } else if (
        data?.kind === "work-task" &&
        typeof data.taskId === "string"
      ) {
        openWorkTask(data.taskId);
      } else if (typeof data?.url === "string") {
        openNotificationUrl(data.url);
      } else {
        return;
      }

      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    };

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleResponse(response);
      })
      .catch(() => undefined);

    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => subscription.remove();
  }, [openCalendarRecord, openNotificationUrl, openWorkTask]);

  const handleWebMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        eventId?: string;
        taskId?: string;
        title?: string;
        startAt?: string;
        dueAt?: string;
        reminderMinutes?: number | null;
        location?: string | null;
        theme?: NativeTheme;
        locale?: NativeLocale;
        href?: string;
        badgeCount?: number;
      };

      if (message.type === "orbyven:web-ready") {
        webRuntimeReadyRef.current = true;
        setWebHasLoaded(true);
        setStartupWebSettled(true);
      } else if (message.type === "orbyven:workspace-ready") {
        workspaceReadyRef.current = true;
        setTimeout(() => {
          flushPendingCalendarIntent();
          flushPendingWorkTaskIntent();
          flushPendingDocumentsIntent();
        }, 0);
      } else if (message.type === "orbyven:haptic") {
        void Haptics.selectionAsync().catch(() => undefined);
      } else if (
        message.type === "orbyven:theme" &&
        (message.theme === "light" || message.theme === "dark")
      ) {
        setWebTheme(message.theme);
      } else if (
        message.type === "orbyven:locale" &&
        (message.locale === "ro" || message.locale === "en")
      ) {
        setNativeLocale(message.locale);
      } else if (
        message.type === "orbyven:attention-badge" &&
        typeof message.badgeCount === "number" &&
        Number.isFinite(message.badgeCount)
      ) {
        void syncNativeAttentionBadge(message.badgeCount).catch(() => undefined);
      } else if (message.type === "orbyven:register-push") {
        void registerForRemotePush()
          .then((expoPushToken) => {
            const detail = JSON.stringify({
              expoPushToken,
              platform: "ios",
              appVersion: APP_VERSION,
            });
            webRef.current?.injectJavaScript(
              "window.dispatchEvent(new CustomEvent('orbyven:native-push-token',{detail:" +
                detail +
                "})); true;",
            );
          })
          .catch((error: unknown) => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            ).catch(() => undefined);

            if (
              error instanceof Error &&
              error.message === "notification-permission-denied"
            ) {
              Alert.alert(
                nativeCopy.notificationsOff,
                nativeCopy.notificationsOffCopy,
              );
            } else if (
              error instanceof Error &&
              error.message === "push-project-not-linked"
            ) {
              Alert.alert(
                nativeCopy.pushReady,
                nativeCopy.pushReadyCopy,
              );
            } else {
              Alert.alert(
                nativeCopy.pushUnavailable,
                nativeCopy.pushUnavailableCopy,
              );
            }
          });
      } else if (message.type === "orbyven:push-registered") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
        Alert.alert(
          nativeCopy.alertsEnabled,
          nativeCopy.alertsEnabledCopy,
        );
      } else if (message.type === "orbyven:push-registration-error") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        ).catch(() => undefined);
        Alert.alert(
          nativeCopy.registrationFailed,
          nativeCopy.registrationFailedCopy,
        );
      } else if (message.type === "orbyven:document-uploaded") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      } else if (message.type === "orbyven:document-upload-error") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      } else if (message.type === "orbyven:document-selected") {
        void Haptics.selectionAsync().catch(() => undefined);
      } else if (
        message.type === "orbyven:schedule-work-reminder" &&
        typeof message.taskId === "string" &&
        typeof message.title === "string" &&
        typeof message.dueAt === "string"
      ) {
        void scheduleWorkReminder({
          taskId: message.taskId,
          title: message.title,
          dueAt: message.dueAt,
          location: message.location,
        })
          .then(() =>
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => undefined),
          )
          .catch((error: unknown) => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            ).catch(() => undefined);
            if (
              error instanceof Error &&
              error.message === "notification-permission-denied"
            ) {
              Alert.alert(
                "Notificări dezactivate",
                "Activează notificările pentru ORBYVEN din Settings ca să primești termenele lucrărilor.",
              );
            }
          });
      } else if (
        message.type === "orbyven:cancel-work-reminder" &&
        typeof message.taskId === "string"
      ) {
        void cancelWorkReminder(message.taskId).catch(() => undefined);
      } else if (
        message.type === "orbyven:native-task-opened" &&
        typeof message.taskId === "string" &&
        pendingWorkTaskId.current === message.taskId
      ) {
        pendingWorkTaskId.current = null;
      } else if (
        message.type === "orbyven:schedule-calendar-reminder" &&
        typeof message.eventId === "string" &&
        typeof message.title === "string" &&
        typeof message.startAt === "string"
      ) {
        void scheduleCalendarReminder({
          eventId: message.eventId,
          title: message.title,
          startAt: message.startAt,
          reminderMinutes:
            typeof message.reminderMinutes === "number"
              ? message.reminderMinutes
              : null,
          location: message.location,
        })
          .then(() =>
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => undefined),
          )
          .catch((error: unknown) => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            ).catch(() => undefined);
            if (
              error instanceof Error &&
              error.message === "notification-permission-denied"
            ) {
              Alert.alert(
                nativeCopy.notificationsOff,
                nativeCopy.remindersOffCopy,
              );
            }
          });
      } else if (
        message.type === "orbyven:cancel-calendar-reminder" &&
        typeof message.eventId === "string"
      ) {
        void cancelCalendarReminder(message.eventId).catch(() => undefined);
      } else if (
        message.type === "orbyven:native-calendar-opened" &&
        typeof message.eventId === "string" &&
        pendingCalendarEventId.current === message.eventId
      ) {
        pendingCalendarEventId.current = null;
      }
    } catch {
      // Ignore web messages that do not belong to the ORBYVEN native bridge.
    }
  }, [flushPendingCalendarIntent, flushPendingDocumentsIntent, flushPendingWorkTaskIntent, nativeCopy]);

  const background = dark ? "#07101d" : "#f4f6fb";
  const surface = dark ? "#0c1727" : "#ffffff";
  const text = dark ? "#f4f7ff" : "#101827";
  const muted = dark ? "#91a0b8" : "#617089";
  const border = dark ? "#1a2940" : "#dfe5ef";
  const effectiveConnection = deviceOffline ? "offline" : connection;
  // The authenticated ORBYVEN web app already owns its header and mobile dock.
  // Keep the native shell visually invisible on trusted ORBYVEN pages so a
  // future .ipa matches the approved PWA UI instead of duplicating chrome.
  const webAppOwnsChrome = isTrustedOrbyvenUrl(currentUrl);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      {networkNotice ? (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[
            styles.networkNotice,
            networkNotice === "offline"
              ? styles.networkNoticeOffline
              : styles.networkNoticeOnline,
          ]}
        >
          <View
            style={[
              styles.networkNoticeDot,
              {
                backgroundColor:
                  networkNotice === "offline" ? "#ff7b7b" : "#6fe0ae",
              },
            ]}
          />
          <Text style={styles.networkNoticeText}>
            {networkNotice === "offline" ? nativeCopy.offline : nativeCopy.online}
          </Text>
        </View>
      ) : null}

      {!webAppOwnsChrome ? (
      <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={styles.brandRow}>
          <View style={styles.mark}>
            <Text style={styles.markText}>OC</Text>
          </View>
          <View style={styles.brandCopy}>
            <Text numberOfLines={1} style={[styles.brand, { color: text }]}>ORBYVEN</Text>
            <Text numberOfLines={1} style={[styles.subtitle, { color: muted }]}>Business Workspace · iOS</Text>
          </View>
        </View>
        <View style={[
          styles.status,
          effectiveConnection === "online" ? styles.statusOnline :
          effectiveConnection === "offline" ? styles.statusOffline : styles.statusLoading,
        ]}>
          <Text style={styles.statusText}>
            {effectiveConnection === "online" ? "LIVE" : effectiveConnection === "offline" ? "OFFLINE" : "SYNC"}
          </Text>
        </View>
      </View>
      ) : null}

      <View style={styles.content}>
        <WebView
          key={reloadKey}
          ref={webRef}
          source={{ uri: currentUrl }}
          style={{ backgroundColor: background }}
          injectedJavaScriptBeforeContentLoaded={NATIVE_BOOTSTRAP_SCRIPT}
          originWhitelist={["https://*", "orbyven://*"]}
          onNavigationStateChange={onNavigationStateChange}
          onShouldStartLoadWithRequest={shouldStart}
          onMessage={handleWebMessage}
          onLoadStart={() => {
            webRuntimeReadyRef.current = false;
            workspaceReadyRef.current = false;
            setConnection("loading");
          }}
          onLoadEnd={() => {
            webFailedRef.current = false;
            setWebHasLoaded(true);
            setStartupWebSettled(true);
            setConnection("online");
            emitNativeNetworkState(true);
          }}
          onError={() => {
            webFailedRef.current = true;
            setStartupWebSettled(true);
            setConnection("offline");
          }}
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.statusCode >= 500) {
              webFailedRef.current = true;
              setStartupWebSettled(true);
              setConnection("offline");
            }
          }}
          onContentProcessDidTerminate={() => {
            webRuntimeReadyRef.current = false;
            workspaceReadyRef.current = false;
            setWebHasLoaded(false);
            setConnection("loading");
            webRef.current?.reload();
          }}
          startInLoadingState={!webHasLoaded}
          renderLoading={() => (
            <View style={[styles.loader, { backgroundColor: background }]}>
              <ActivityIndicator size="large" />
              <Text style={[styles.loaderTitle, { color: text }]}>ORBYVEN</Text>
              <Text style={[styles.loaderText, { color: muted }]}>{nativeCopy.syncing}</Text>
            </View>
          )}
          renderError={() => (
            <View style={[styles.loader, { backgroundColor: background }]}>
              <Text style={[styles.loaderTitle, { color: text }]}>{nativeCopy.connectionUnavailable}</Text>
              <Text style={[styles.loaderText, { color: muted }]}>
                {nativeCopy.connectionHelp}
              </Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => undefined);
                  webRuntimeReadyRef.current = false;
                  workspaceReadyRef.current = false;
                  setWebHasLoaded(false);
                  setReloadKey((value) => value + 1);
                }}
              >
                <Text style={styles.retryText}>{nativeCopy.retry}</Text>
              </Pressable>
            </View>
          )}
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled={Platform.OS === "ios"}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          domStorageEnabled
          javaScriptEnabled
          applicationNameForUserAgent={"ORBYVEN-iOS/" + APP_VERSION}
          setSupportMultipleWindows={false}
          allowsLinkPreview={false}
          allowsInlineMediaPlayback
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
        />
      </View>

      {!webAppOwnsChrome ? (
      <View style={[styles.toolbar, { backgroundColor: surface, borderTopColor: border }]}>
        <ToolbarButton label="‹" hint={nativeCopy.back} disabled={!canGoBack} onPress={() => webRef.current?.goBack()} text={text} muted={muted} />
        <ToolbarButton label="⌂" hint="Workspace" onPress={() => {
          navigateTrustedUrl(WORKSPACE_URL);
        }} text={text} muted={muted} />
        <ToolbarButton label="▣+" hint={nativeCopy.documents} onPress={openDocuments} text={text} muted={muted} />
        <ToolbarButton label="↻" hint="Refresh" onPress={() => webRef.current?.reload()} text={text} muted={muted} />
        <ToolbarButton label="□↑" hint="Share" onPress={shareCurrentUrl} text={text} muted={muted} />
        <ToolbarButton label="›" hint={nativeCopy.forward} disabled={!canGoForward} onPress={() => webRef.current?.goForward()} text={text} muted={muted} />
      </View>
      ) : null}

      {launchVisible ? (
        <Animated.View
          pointerEvents="auto"
          accessibilityRole="progressbar"
          accessibilityLabel="ORBYVEN"
          style={[
            styles.launchHandoff,
            { backgroundColor: background, opacity: launchOpacity },
          ]}
        >
          <View style={styles.launchMark}>
            <Text style={styles.launchMarkText}>OC</Text>
          </View>
          <Text style={[styles.launchTitle, { color: text }]}>ORBYVEN</Text>
          <Text style={[styles.launchSubtitle, { color: muted }]}>
            {nativeCopy.syncing}
          </Text>
          <ActivityIndicator size="small" style={styles.launchSpinner} />
        </Animated.View>
      ) : null}

      {privacyShielded && !launchVisible ? (
        <View style={[styles.privacyShield, { backgroundColor: background }]}>
          <View style={styles.shieldMark}>
            <Text style={styles.shieldMarkText}>OC</Text>
          </View>
          <Text style={[styles.shieldTitle, { color: text }]}>{nativeCopy.protected}</Text>
          <Text style={[styles.shieldText, { color: muted }]}>
            {nativeCopy.protectedCopy}
          </Text>
          {biometricAvailable ? (
            <Pressable
              disabled={unlocking}
              onPress={() => void authenticateToUnlock()}
              style={({ pressed }) => [
                styles.unlockButton,
                pressed && !unlocking ? styles.toolButtonPressed : null,
                unlocking ? styles.disabled : null,
              ]}
            >
              <Text style={styles.unlockText}>{unlocking ? nativeCopy.checking : nativeCopy.unlock}</Text>
            </Pressable>
          ) : (
            <ActivityIndicator size="small" style={styles.shieldSpinner} />
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function ToolbarButton({
  label,
  hint,
  onPress,
  disabled = false,
  text,
  muted,
}: {
  label: string;
  hint: string;
  onPress: () => void;
  disabled?: boolean;
  text: string;
  muted: string;
}) {
  const handlePress = () => {
    void Haptics.selectionAsync().catch(() => undefined);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [styles.toolButton, pressed && !disabled ? styles.toolButtonPressed : null]}
    >
      <Text style={[styles.toolIcon, { color: disabled ? muted : text }, disabled && styles.disabled]}>{label}</Text>
      <Text style={[styles.toolHint, { color: muted }, disabled && styles.disabled]}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  launchHandoff: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 140,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  launchMark: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: "#17132b",
    borderWidth: 1,
    borderColor: "#7458ee",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7458ee",
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  launchMarkText: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: -1.6,
    fontSize: 23,
  },
  launchTitle: {
    marginTop: 20,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  launchSubtitle: {
    marginTop: 7,
    fontSize: 12,
    textAlign: "center",
  },
  launchSpinner: {
    marginTop: 18,
  },
  networkNotice: {
    position: "absolute",
    top: 8,
    left: 18,
    right: 18,
    zIndex: 120,
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  networkNoticeOffline: {
    backgroundColor: "rgba(57,24,31,0.96)",
    borderColor: "rgba(255,123,123,0.34)",
  },
  networkNoticeOnline: {
    backgroundColor: "rgba(18,60,49,0.96)",
    borderColor: "rgba(111,224,174,0.34)",
  },
  networkNoticeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  networkNoticeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  header: {
    minHeight: 66,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 },
  brandCopy: { flex: 1, minWidth: 0 },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#17132b",
    borderWidth: 1,
    borderColor: "#6e56cf",
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { color: "#ffffff", fontWeight: "800", letterSpacing: -1, fontSize: 14 },
  brand: { fontSize: 14, fontWeight: "800", letterSpacing: 1.6 },
  subtitle: { fontSize: 10, marginTop: 2 },
  status: { flexShrink: 0, marginLeft: 10, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusOnline: { backgroundColor: "#123c31" },
  statusOffline: { backgroundColor: "#4a2327" },
  statusLoading: { backgroundColor: "#332b55" },
  statusText: { color: "#ffffff", fontWeight: "800", fontSize: 9, letterSpacing: 0.8 },
  content: { flex: 1 },
  loader: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    zIndex: 10,
  },
  loaderTitle: { fontSize: 20, fontWeight: "800", marginTop: 16, textAlign: "center" },
  loaderText: { fontSize: 13, lineHeight: 19, marginTop: 7, textAlign: "center", maxWidth: 330 },
  retryButton: { marginTop: 18, backgroundColor: "#7458ee", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  retryText: { color: "#ffffff", fontWeight: "700" },
  toolbar: {
    minHeight: 62,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-around",
    paddingHorizontal: 4,
  },
  toolButton: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 58 },
  toolButtonPressed: { opacity: 0.55 },
  toolIcon: { fontSize: 23, lineHeight: 25, fontWeight: "600" },
  toolHint: { fontSize: 9, marginTop: 2, fontWeight: "600" },
  disabled: { opacity: 0.35 },
  privacyShield: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  shieldMark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#17132b",
    borderWidth: 1,
    borderColor: "#6e56cf",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  shieldMarkText: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: -1.5,
    fontSize: 22,
  },
  shieldTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  shieldText: {
    maxWidth: 320,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  unlockButton: {
    marginTop: 22,
    minWidth: 150,
    borderRadius: 14,
    backgroundColor: "#7458ee",
    paddingHorizontal: 22,
    paddingVertical: 13,
    alignItems: "center",
  },
  unlockText: { color: "#ffffff", fontWeight: "800" },
  shieldSpinner: { marginTop: 22 },
});
