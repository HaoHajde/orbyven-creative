export const APP_VERSION = "0.12.0";

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

export const NATIVE_RUNTIME = {
  platform: "ios",
  version: APP_VERSION,
  capabilities: [
    "biometric-lock",
    "deep-links",
    "documents",
    "haptics",
    "local-notifications",
    "native-launch-handoff",
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
