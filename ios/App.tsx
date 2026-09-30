import { useCallback, useEffect, useRef, useState } from "react";
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
import { WebView, type WebViewNavigation } from "react-native-webview";

const BASE_URL = "https://orbyven.ro";
const WORKSPACE_URL = BASE_URL + "/workspace";
const APP_VERSION = "0.2.0";

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

  const openNativeLink = useCallback((url: string | null) => {
    if (!url) return;
    const webUrl = nativeUrlToWebUrl(url);
    if (!webUrl || !isTrustedOrbyvenUrl(webUrl)) return;
    setCurrentUrl(webUrl);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    void Linking.getInitialURL().then(openNativeLink);
    const subscription = Linking.addEventListener("url", ({ url }) => openNativeLink(url));
    return () => subscription.remove();
  }, [openNativeLink]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        webRef.current?.injectJavaScript(
          "window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); true;",
        );
      }
    });
    return () => subscription.remove();
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
    });
  }, [currentUrl]);

  const background = dark ? "#07101d" : "#f4f6fb";
  const surface = dark ? "#0c1727" : "#ffffff";
  const text = dark ? "#f4f7ff" : "#101827";
  const muted = dark ? "#91a0b8" : "#617089";
  const border = dark ? "#1a2940" : "#dfe5ef";

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
          connection === "online" ? styles.statusOnline :
          connection === "offline" ? styles.statusOffline : styles.statusLoading,
        ]}>
          <Text style={styles.statusText}>
            {connection === "online" ? "LIVE" : connection === "offline" ? "OFFLINE" : "SYNC"}
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
              <Pressable style={styles.retryButton} onPress={() => setReloadKey((value) => value + 1)}>
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
        />
      </View>

      <View style={[styles.toolbar, { backgroundColor: surface, borderTopColor: border }]}>
        <ToolbarButton label="‹" hint="Înapoi" disabled={!canGoBack} onPress={() => webRef.current?.goBack()} text={text} muted={muted} />
        <ToolbarButton label="⌂" hint="Workspace" onPress={() => {
          setCurrentUrl(WORKSPACE_URL);
          setReloadKey((value) => value + 1);
        }} text={text} muted={muted} />
        <ToolbarButton label="↻" hint="Refresh" onPress={() => webRef.current?.reload()} text={text} muted={muted} />
        <ToolbarButton label="□↑" hint="Share" onPress={shareCurrentUrl} text={text} muted={muted} />
        <ToolbarButton label="›" hint="Înainte" disabled={!canGoForward} onPress={() => webRef.current?.goForward()} text={text} muted={muted} />
      </View>
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint}
      disabled={disabled}
      onPress={onPress}
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
  loader: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, zIndex: 10 },
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
});
