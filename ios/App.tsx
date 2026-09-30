import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import * as Network from "expo-network";
import {
  ActivityIndicator,
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
const APP_VERSION = "0.4.0";
const RELOCK_AFTER_MS = 30_000;

type ConnectionState = "loading" | "online" | "offline";

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
  const dark = colorScheme !== "light";

  const [connection, setConnection] = useState<ConnectionState>("loading");
  const [currentUrl, setCurrentUrl] = useState(WORKSPACE_URL);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [privacyShielded, setPrivacyShielded] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [deviceOffline, setDeviceOffline] = useState(false);

  const lastBackgroundAt = useRef<number | null>(null);
  const authenticationInProgress = useRef(false);
  const previousReachability = useRef<boolean | null>(null);

  const openNativeLink = useCallback((url: string | null) => {
    if (!url) return;
    const webUrl = nativeUrlToWebUrl(url);
    if (!webUrl || !isTrustedOrbyvenUrl(webUrl)) return;
    setCurrentUrl(webUrl);
    setReloadKey((value) => value + 1);
  }, []);

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
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        if (lastBackgroundAt.current === null) {
          lastBackgroundAt.current = Date.now();
        }
        setPrivacyShielded(true);
        return;
      }

      webRef.current?.injectJavaScript(
        "window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); true;",
      );

      const backgroundAt = lastBackgroundAt.current;
      lastBackgroundAt.current = null;

      if (backgroundAt === null || Date.now() - backgroundAt >= RELOCK_AFTER_MS) {
        void authenticateToUnlock();
      } else {
        setPrivacyShielded(false);
      }
    });

    return () => subscription.remove();
  }, [authenticateToUnlock]);

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
        previousReachability.current = false;
        return;
      }

      if (definitelyOnline && previousReachability.current === false) {
        previousReachability.current = true;
        setConnection("loading");
        webRef.current?.reload();
        return;
      }

      if (definitelyOnline) {
        previousReachability.current = true;
      }
    };

    void Network.getNetworkStateAsync()
      .then(applyNetworkState)
      .catch(() => undefined);

    const subscription = Network.addNetworkStateListener(applyNetworkState);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

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

  const openDocuments = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    webRef.current?.injectJavaScript(
      "window.dispatchEvent(new CustomEvent('orbyven:native-documents',{detail:{create:true}})); true;",
    );
  }, []);

  const handleWebMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string };
      if (message.type === "orbyven:document-uploaded") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      } else if (message.type === "orbyven:document-upload-error") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      } else if (message.type === "orbyven:document-selected") {
        void Haptics.selectionAsync().catch(() => undefined);
      }
    } catch {
      // Ignore web messages that do not belong to the ORBYVEN native bridge.
    }
  }, []);

  const background = dark ? "#07101d" : "#f4f6fb";
  const surface = dark ? "#0c1727" : "#ffffff";
  const text = dark ? "#f4f7ff" : "#101827";
  const muted = dark ? "#91a0b8" : "#617089";
  const border = dark ? "#1a2940" : "#dfe5ef";
  const effectiveConnection = deviceOffline ? "offline" : connection;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
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

      <View style={styles.content}>
        <WebView
          key={reloadKey}
          ref={webRef}
          source={{ uri: currentUrl }}
          style={{ backgroundColor: background }}
          originWhitelist={["https://*", "orbyven://*"]}
          onNavigationStateChange={onNavigationStateChange}
          onShouldStartLoadWithRequest={shouldStart}
          onMessage={handleWebMessage}
          onLoadStart={() => setConnection("loading")}
          onLoadEnd={() => setConnection("online")}
          onError={() => setConnection("offline")}
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.statusCode >= 500) setConnection("offline");
          }}
          onContentProcessDidTerminate={() => {
            setConnection("loading");
            webRef.current?.reload();
          }}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.loader, { backgroundColor: background }]}>
              <ActivityIndicator size="large" />
              <Text style={[styles.loaderTitle, { color: text }]}>ORBYVEN</Text>
              <Text style={[styles.loaderText, { color: muted }]}>Sincronizare workspace…</Text>
            </View>
          )}
          renderError={() => (
            <View style={[styles.loader, { backgroundColor: background }]}>
              <Text style={[styles.loaderTitle, { color: text }]}>Conexiune indisponibilă</Text>
              <Text style={[styles.loaderText, { color: muted }]}>
                Verifică internetul și reîncearcă. Datele ORBYVEN nu sunt stocate local în această versiune.
              </Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => undefined);
                  setReloadKey((value) => value + 1);
                }}
              >
                <Text style={styles.retryText}>Reîncearcă</Text>
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

      <View style={[styles.toolbar, { backgroundColor: surface, borderTopColor: border }]}>
        <ToolbarButton label="‹" hint="Înapoi" disabled={!canGoBack} onPress={() => webRef.current?.goBack()} text={text} muted={muted} />
        <ToolbarButton label="⌂" hint="Workspace" onPress={() => {
          setCurrentUrl(WORKSPACE_URL);
          setReloadKey((value) => value + 1);
        }} text={text} muted={muted} />
        <ToolbarButton label="▣+" hint="Documente" onPress={openDocuments} text={text} muted={muted} />
        <ToolbarButton label="↻" hint="Refresh" onPress={() => webRef.current?.reload()} text={text} muted={muted} />
        <ToolbarButton label="□↑" hint="Share" onPress={shareCurrentUrl} text={text} muted={muted} />
        <ToolbarButton label="›" hint="Înainte" disabled={!canGoForward} onPress={() => webRef.current?.goForward()} text={text} muted={muted} />
      </View>

      {privacyShielded ? (
        <View style={[styles.privacyShield, { backgroundColor: background }]}>
          <View style={styles.shieldMark}>
            <Text style={styles.shieldMarkText}>OC</Text>
          </View>
          <Text style={[styles.shieldTitle, { color: text }]}>ORBYVEN protejat</Text>
          <Text style={[styles.shieldText, { color: muted }]}>
            Workspace-ul este ascuns cât timp aplicația nu este activă.
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
              <Text style={styles.unlockText}>{unlocking ? "Verificare…" : "Deblochează"}</Text>
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
