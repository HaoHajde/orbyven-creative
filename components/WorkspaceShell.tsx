"use client";

import BrandLogo from "@/components/BrandLogo";
import WorkspaceOrbitBackground from "@/components/WorkspaceOrbitBackground";
import WorkspaceContent from "@/components/WorkspaceContent";
import WorkspaceSearch from "@/components/WorkspaceSearch";
import WorkspaceActivityCenter from "@/components/WorkspaceActivityCenter";
import WorkspaceIntelligence from "@/components/WorkspaceIntelligence";
import WorkspaceModuleStore from "@/components/WorkspaceModuleStore";
import WorkspaceStateScreen from "@/components/WorkspaceStateScreen";
import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import { WORKSPACE_CREATE_MODULES, WORKSPACE_NAV_GROUPS, themeToCssVars } from "@/lib/workspace-visual-system";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import {
  registerPushDevice,
  type PushDeviceRegistrationInput,
} from "@/lib/modules/push-devices";
import type { WorkspaceNavigationIntent, WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import { scheduleWorkspaceWarp } from "@/lib/workspace-warp";
import {
  getCurrentWorkspace,
  setOrganizationModuleEnabled,
  type OrbyvenWorkspace,
} from "@/lib/orbyven-workspace";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

type Theme = "light" | "dark";
type Panel = "workspace" | "modules";
type TextScale = 0.9 | 1 | 1.1 | 1.2 | 1.3;

const TEXT_SCALE_STEPS: TextScale[] = [0.9, 1, 1.1, 1.2, 1.3];
const DEFAULT_TEXT_SCALE: TextScale = 1.1;
const TEXT_SCALE_SIDEBAR_WIDTH: Record<TextScale, string> = {
  0.9: "206px",
  1: "206px",
  1.1: "216px",
  1.2: "228px",
  1.3: "240px",
};

type IntelligenceRequest = (path: string, init?: RequestInit) => Promise<Response>;

export type WorkspaceShellProps = {
  onUnauthenticated: () => void | Promise<void>;
  onSignedOut: () => void | Promise<void>;
  onOpenPath: (href: string) => void;
  intelligenceRequest?: IntelligenceRequest;
  initialWorkspace?: OrbyvenWorkspace | null;
};

const roleLabels: Record<OrbyvenWorkspace["membership"]["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Membru",
  viewer: "Viewer",
};

export default function WorkspaceShell({
  onUnauthenticated,
  onSignedOut,
  onOpenPath,
  intelligenceRequest,
  initialWorkspace = null,
}: WorkspaceShellProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [panel, setPanel] = useState<Panel>("workspace");
  const [activeModule, setActiveModule] = useState<OrbyvenModuleId>("overview");
  const [navigation, setNavigation] = useState<WorkspaceNavigationIntent>({ module: "overview", token: 0 });
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [workspace, setWorkspace] = useState<OrbyvenWorkspace | null>(initialWorkspace);
  const [loading, setLoading] = useState(!initialWorkspace);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingModule, setSavingModule] = useState<OrbyvenModuleId | null>(null);
  const [mobileModuleMenuOpen, setMobileModuleMenuOpen] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>(DEFAULT_TEXT_SCALE);


  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      // getCurrentWorkspace already validates the user via auth.getUser().
      // Do not make the same authentication request twice on every dashboard load.
      const nextWorkspace = await getCurrentWorkspace();
      if (!nextWorkspace) {
        // Only disambiguate "logged out" from "no membership" on the rare
        // null result; do not change the authorization checks in the loader.
        const { data: authData, error: authError } = await orbyvenSupabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) {
          await onUnauthenticated();
          return;
        }
        setLoadError("Contul este autentificat, dar nu are încă un workspace ORBYVEN atribuit.");
        setLoading(false);
        return;
      }

      setWorkspace(nextWorkspace);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoadError("Workspace-ul nu a putut fi încărcat. Încearcă din nou.");
      setLoading(false);
    }
  }, [onUnauthenticated]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("orbyven-dashboard-theme");
    const nextTheme: Theme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : "dark";
    const savedTextScale = Number(window.localStorage.getItem("orbyven-dashboard-text-scale"));
    const nextTextScale = TEXT_SCALE_STEPS.includes(savedTextScale as TextScale)
      ? savedTextScale as TextScale
      : DEFAULT_TEXT_SCALE;

    document.documentElement.style.colorScheme = nextTheme;
    document.documentElement.style.setProperty(
      "--orbyven-workspace-chrome",
      nextTheme === "dark" ? "#08111f" : "#f7f9fc"
    );
    const themeTimer = window.setTimeout(() => setTheme(nextTheme), 0);
    const textScaleTimer = window.setTimeout(() => setTextScale(nextTextScale), 0);
    const workspaceTimer = window.setTimeout(() => {
      if (!initialWorkspace) void loadWorkspace();
    }, 0);

    return () => {
      window.clearTimeout(themeTimer);
      window.clearTimeout(textScaleTimer);
      window.clearTimeout(workspaceTimer);
      document.documentElement.style.removeProperty("--orbyven-workspace-chrome");
    };
  }, [initialWorkspace, loadWorkspace]);


  useEffect(() => {
    const bridge = (window as Window & {
      ReactNativeWebView?: { postMessage: (message: string) => void };
    }).ReactNativeWebView;
    bridge?.postMessage(JSON.stringify({ type: "orbyven:theme", theme }));
  }, [theme]);

  const requestNativeHaptic = useCallback(() => {
    const bridge = (window as Window & {
      ReactNativeWebView?: { postMessage: (message: string) => void };
    }).ReactNativeWebView;
    bridge?.postMessage(JSON.stringify({ type: "orbyven:haptic" }));
  }, []);

  const enabledModules = useMemo<OrbyvenModuleId[]>(
    () => workspace?.enabledModules ?? ["overview"],
    [workspace]
  );

  const enabledDefinitions = useMemo(
    () => ORBYVEN_MODULES.filter((definition) => enabledModules.includes(definition.id)),
    [enabledModules]
  );

  const activeDefinition =
    ORBYVEN_MODULES.find((definition) => definition.id === activeModule) ?? ORBYVEN_MODULES[0];

  const canManageModules =
    workspace?.membership.role === "owner" || workspace?.membership.role === "admin";

  const organizationName =
    workspace?.profile?.display_name ?? workspace?.organization.name ?? "ORBYVEN";
  const greetingName =
    workspace?.profile?.greeting_name ?? workspace?.organization.name.split(" ")[0] ?? "";
  const locale = workspace?.profile?.locale ?? "ro-RO";
  const timeZone = workspace?.profile?.timezone ?? "Europe/Bucharest";
  const initials = organizationName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const dateLabel = useMemo(() => {
    const formatted = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone,
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [locale, timeZone]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("orbyven-dashboard-theme", next);
      document.documentElement.style.colorScheme = next;
      document.documentElement.style.setProperty(
        "--orbyven-workspace-chrome",
        next === "dark" ? "#08111f" : "#f7f9fc"
      );
      return next;
    });
  };

  const changeTextScale = (direction: -1 | 1) => {
    setTextScale((current) => {
      const currentIndex = TEXT_SCALE_STEPS.indexOf(current);
      const nextIndex = Math.min(
        TEXT_SCALE_STEPS.length - 1,
        Math.max(0, currentIndex + direction)
      );
      const next = TEXT_SCALE_STEPS[nextIndex];
      window.localStorage.setItem("orbyven-dashboard-text-scale", String(next));
      return next;
    });
  };

  const resetTextScale = () => {
    window.localStorage.setItem("orbyven-dashboard-text-scale", "1");
    setTextScale(1);
  };

  const openModule = useCallback((id: OrbyvenModuleId, options: WorkspaceOpenOptions = {}) => {
    if (!enabledModules.includes(id)) return;
    setPanel("workspace");
    setActiveModule(id);
    setNavigation((current) => ({ module: id, token: current.token + 1, ...options }));
    setMobileModuleMenuOpen(false);
    setCreateMenuOpen(false);
  }, [enabledModules]);

  useEffect(() => {
    const handleNativeDocuments = () => {
      openModule("documents", { create: true });
    };
    const handleNativeCalendarRecord = (event: Event) => {
      const eventId = (event as CustomEvent<{ eventId?: string }>).detail?.eventId;
      if (!eventId) return;

      openModule("calendar", { recordId: eventId });
      const bridge = (window as Window & {
        ReactNativeWebView?: { postMessage: (message: string) => void };
      }).ReactNativeWebView;
      bridge?.postMessage(JSON.stringify({
        type: "orbyven:native-calendar-opened",
        eventId,
      }));
    };

    window.addEventListener("orbyven:native-documents", handleNativeDocuments);
    window.addEventListener("orbyven:native-calendar-record", handleNativeCalendarRecord);
    return () => {
      window.removeEventListener("orbyven:native-documents", handleNativeDocuments);
      window.removeEventListener("orbyven:native-calendar-record", handleNativeCalendarRecord);
    };
  }, [openModule]);

  useEffect(() => {
    const organizationId = workspace?.organization.id;
    if (!organizationId) return;

    const handleNativePushToken = (event: Event) => {
      const detail = (event as CustomEvent<PushDeviceRegistrationInput>).detail;
      if (
        !detail?.expoPushToken ||
        (detail.platform !== "ios" && detail.platform !== "android")
      ) {
        return;
      }

      const bridge = (window as Window & {
        ReactNativeWebView?: { postMessage: (message: string) => void };
      }).ReactNativeWebView;

      void registerPushDevice(organizationId, detail)
        .then(() => {
          bridge?.postMessage(JSON.stringify({ type: "orbyven:push-registered" }));
        })
        .catch((reason) => {
          console.error("Push device registration failed", reason);
          bridge?.postMessage(
            JSON.stringify({ type: "orbyven:push-registration-error" })
          );
        });
    };

    window.addEventListener("orbyven:native-push-token", handleNativePushToken);
    return () =>
      window.removeEventListener(
        "orbyven:native-push-token",
        handleNativePushToken
      );
  }, [workspace?.organization.id]);

  useEffect(() => {
    if (navigation.token === 0 || panel !== "workspace") return;

    const selector = navigation.create
      ? '[data-workspace-create-focus="true"]'
      : navigation.recordId
        ? '[data-workspace-record-focus="true"]'
        : '[data-workspace-module-focus="true"]';

    return scheduleWorkspaceWarp(selector, {
      attempts: navigation.create || navigation.recordId ? 32 : 12,
      delayMs: 45,
      fallbackSelector: '[data-workspace-module-focus="true"]',
    });
  }, [navigation, panel]);

  const toggleModule = async (id: OrbyvenModuleId) => {
    if (id === "overview" || !workspace || !canManageModules || savingModule) return;

    const currentlyEnabled = workspace.enabledModules.includes(id);
    if (!currentlyEnabled && !workspace.entitledModules.includes(id)) {
      setActionError("Acest modul necesită un abonament sau acces pilot aprobat.");
      return;
    }
    const previousModules = workspace.enabledModules;
    const nextModules = currentlyEnabled
      ? previousModules.filter((moduleId) => moduleId !== id)
      : [...previousModules, id];

    setActionError("");
    setSavingModule(id);
    setWorkspace((current) =>
      current ? { ...current, enabledModules: nextModules } : current
    );

    if (currentlyEnabled && activeModule === id) {
      setActiveModule("overview");
      setNavigation((current) => ({ module: "overview", token: current.token + 1 }));
    }

    try {
      await setOrganizationModuleEnabled(workspace.organization.id, id, !currentlyEnabled);
    } catch (error) {
      console.error(error);
      setWorkspace((current) =>
        current ? { ...current, enabledModules: previousModules } : current
      );
      setActionError("Modulul nu a putut fi actualizat. Modificarea a fost anulată.");
    } finally {
      setSavingModule(null);
    }
  };

  const createOptions = ORBYVEN_MODULES.filter((definition) =>
    WORKSPACE_CREATE_MODULES.includes(definition.id)
      && enabledModules.includes(definition.id)
      && (definition.id !== "expenses" || ["owner", "admin", "manager"].includes(workspace?.membership.role ?? "viewer"))
  );
  const canCreate = workspace?.membership.role !== "viewer" && createOptions.length > 0;

  const logout = async () => {
    await orbyvenSupabase.auth.signOut();
    setWorkspace(null);
    await onSignedOut();
  };

  const vars = {
    ...themeToCssVars(theme),
    "--orbyven-text-scale": textScale,
    "--workspace-sidebar-width": TEXT_SCALE_SIDEBAR_WIDTH[textScale],
  } as CSSProperties;

  if (loading) {
    return <WorkspaceStateScreen vars={vars} theme={theme} title="Se pregătește workspace-ul..." />;
  }

  if (loadError || !workspace) {
    return (
      <WorkspaceStateScreen
        vars={vars}
        theme={theme}
        title="Workspace indisponibil"
        description={loadError}
        actionLabel="Încearcă din nou"
        onAction={loadWorkspace}
        secondaryLabel="Delogare"
        onSecondary={logout}
      />
    );
  }

  return (
    <main
      data-orbyven-theme={theme}
      data-orbyven-text-scale={textScale}
      style={{
        ...vars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="orbyven-workspace-text-scale orbyven-workspace-shell relative isolate min-h-[100dvh] overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-300"
    >
      {theme === "dark" ? (
        <WorkspaceOrbitBackground fixed />
      ) : (
        <div aria-hidden="true" className="orbyven-workspace-light-bg pointer-events-none fixed inset-0 z-0" />
      )}

      <header
        className="orbyven-workspace-header sticky top-0 z-50 border-b border-[var(--border)] bg-[color:var(--bg)]/94 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-md"
      >
        <div className="mx-auto flex min-h-[56px] max-w-[1520px] flex-wrap items-center justify-between gap-x-2.5 gap-y-2 px-3.5 md:min-h-[65px] md:gap-4 md:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLogo compact theme={theme} />
            <div className="hidden h-6 w-px bg-[var(--border)] lg:block" />
            <div className="hidden min-w-0 lg:block">
              <span className="block max-w-[180px] truncate text-[11px] font-semibold">{organizationName}</span>
              <span className="block text-[10px] text-[var(--muted-2)]">Business workspace</span>
            </div>
          </div>

          <div className="order-3 flex w-full min-w-0 justify-center pb-2.5 sm:order-none sm:w-auto sm:flex-1 sm:pb-0">
            <WorkspaceSearch organizationId={workspace.organization.id} enabledModules={enabledModules} onOpenModule={openModule} />
          </div>

          <div className="order-2 flex shrink-0 items-center gap-1.5 sm:order-none sm:gap-2">
            {canCreate && (
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={createMenuOpen}
                onClick={() => setCreateMenuOpen(true)}
                className="hidden h-9 items-center justify-center rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)] shadow-sm transition hover:opacity-90 sm:flex"
              >
                <span className="sm:hidden" aria-hidden="true">+</span>
                <span className="hidden sm:inline">+ Creează</span>
                <span className="sr-only sm:hidden">Creează o înregistrare</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenPath("/ai-web-design")}
              className="hidden h-9 rounded-[10px] border border-[#7897ff]/25 bg-[#7897ff]/10 px-3 text-[11px] font-semibold text-[#aebcff] transition hover:border-[#7897ff]/45 hover:bg-[#7897ff]/15 xl:block"
            >
              AI Web Design
            </button>
            <button
              type="button"
              onClick={() => onOpenPath("/video-ai")}
              className="hidden h-9 rounded-[10px] border border-[#9a7dff]/25 bg-[#9a7dff]/10 px-3 text-[11px] font-semibold text-[#c6b8ff] transition hover:border-[#9a7dff]/45 hover:bg-[#9a7dff]/15 2xl:block"
            >
              Video AI
            </button>
            <button type="button" onClick={() => setPanel(panel === "modules" ? "workspace" : "modules")} className="hidden h-9 rounded-[10px] border border-[var(--border)] bg-[color:var(--surface-2)]/75 px-3 text-[11px] font-semibold text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)] lg:block">{panel === "modules" ? "Înapoi" : "Module"}</button>
            <WorkspaceIntelligence
              organizationId={workspace.organization.id}
              theme={theme}
              themeVars={vars}
              textScale={textScale}
              onOpenModule={openModule}
              onOpenPath={onOpenPath}
              request={intelligenceRequest}
            />
            <WorkspaceActivityCenter
              organizationId={workspace.organization.id}
              locale={locale}
              timeZone={timeZone}
              role={workspace.membership.role}
              enabledModules={enabledModules}
              onOpenModule={openModule}
            />
            <button type="button" onClick={toggleTheme} aria-label="Schimbă tema" className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/75 text-sm transition hover:border-[var(--border-strong)] sm:h-9 sm:w-9">{theme === "dark" ? "☀" : "☾"}</button>
            <button type="button" onClick={logout} aria-label="Delogare" title="Delogare" className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[11px] font-semibold text-[var(--accent)] shadow-sm sm:h-9 sm:w-9">{initials || "OR"}</button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1520px] gap-3 px-2.5 pb-4 pt-3 md:grid-cols-[var(--workspace-sidebar-width)_minmax(0,1fr)] md:px-4 md:pb-6">
        <aside data-workspace-surface="sidebar" className="sticky top-[77px] hidden h-[calc(100dvh-90px)] min-w-0 overflow-y-auto overscroll-contain rounded-[15px] border border-[var(--border)] bg-[color:var(--surface)]/88 px-2.5 py-3 shadow-[0_18px_55px_rgba(0,0,0,0.10)] md:flex md:flex-col">
          <div className="rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
            <p className="truncate text-[11px] font-semibold">{organizationName}</p>
            <p className="mt-1 text-[10px] text-[var(--muted-2)]">{roleLabels[workspace.membership.role]} · Workspace activ</p>
          </div>

          {WORKSPACE_NAV_GROUPS.map((group) => {
            const items = enabledDefinitions.filter((definition) => group.ids.includes(definition.id));
            if (!items.length) return null;
            return (
              <div key={group.label} className="mt-5 border-b border-[var(--border)] pb-4 last:border-b-0">
                <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.15em] text-[var(--muted-2)]">{group.label}</p>
                <nav className="space-y-0.5" aria-label={group.label}>
                  {items.map((definition) => {
                    const active = panel === "workspace" && activeModule === definition.id;
                    return (
                      <button
                        key={definition.id}
                        type="button"
                        onClick={() => openModule(definition.id)}
                        aria-current={active ? "page" : undefined}
                        className={active
                          ? "flex w-full items-center gap-3 rounded-[9px] border border-[#7797ff]/20 bg-[linear-gradient(95deg,rgba(76,104,237,0.33),rgba(75,99,204,0.16))] px-3 py-2.5 text-left text-[12px] font-semibold text-[var(--text)]"
                          : "flex w-full items-center gap-3 rounded-[9px] border border-transparent px-3 py-2.5 text-left text-[12px] text-[var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--text)]"}
                      >
                        <ModuleGlyph id={definition.id} />
                        <span className="truncate">{definition.shortName}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            );
          })}

          <div className="mt-auto space-y-2 pt-6">
            <button
              type="button"
              onClick={() => onOpenPath("/ai-web-design")}
              className="w-full rounded-[11px] border border-[#7897ff]/22 bg-[#7897ff]/[0.08] px-3.5 py-3 text-left transition hover:border-[#7897ff]/42 hover:bg-[#7897ff]/[0.12]"
            >
              <span className="block text-[11px] font-semibold text-[var(--text)]">✦ AI Web Design</span>
              <span className="mt-1 block text-[10px] font-normal leading-4 text-[var(--muted)]">Generează și rafinează website-ul →</span>
            </button>
            <div data-workspace-text-scale-control="desktop" className="min-w-0 rounded-[11px] border border-[var(--border)] bg-[color:var(--surface-2)]/60 px-3 py-2.5">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 text-[10px] font-semibold leading-4 text-[var(--muted)]">Dimensiune text</span>
                <button
                  type="button"
                  onClick={resetTextScale}
                  title="Revino la 100%"
                  aria-label="Revino la dimensiunea textului 100%"
                  className="shrink-0 rounded-full border border-[var(--border)] px-2 py-1 text-center text-[9px] font-semibold text-[var(--muted-2)]"
                >
                  {Math.round(textScale * 100)}%
                </button>
              </div>
              <div className="mt-2 grid min-w-0 grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => changeTextScale(-1)}
                  disabled={textScale === TEXT_SCALE_STEPS[0]}
                  aria-label="Micșorează textul"
                  className="flex h-8 min-w-0 items-center justify-center rounded-[9px] border border-[var(--border)] px-2 text-[12px] font-semibold disabled:opacity-30"
                >
                  A−
                </button>
                <button
                  type="button"
                  onClick={() => changeTextScale(1)}
                  disabled={textScale === TEXT_SCALE_STEPS[TEXT_SCALE_STEPS.length - 1]}
                  aria-label="Mărește textul"
                  className="flex h-8 min-w-0 items-center justify-center rounded-[9px] border border-[var(--border)] px-2 text-[12px] font-semibold disabled:opacity-30"
                >
                  A+
                </button>
              </div>
            </div>
            <button type="button" onClick={() => setPanel("modules")} className="w-full rounded-[11px] border border-[var(--border)] bg-[color:var(--surface-2)]/60 px-3.5 py-3 text-left text-[11px] font-semibold text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]">
              <span className="block text-[var(--text)]">{canManageModules ? "Personalizează workspace-ul" : "Modulele tale"}</span>
              <span className="mt-1 block text-[10px] font-normal text-[var(--muted-2)]">{canManageModules ? "Adaugă sau ascunde instrumente" : "Vezi instrumentele disponibile"}</span>
            </button>
          </div>
        </aside>

        <section
          data-workspace-surface="module"
          data-workspace-module-focus="true"
          className="min-w-0 scroll-mt-24 rounded-[16px] border border-[var(--border)] bg-[color:var(--surface)]/82 px-3.5 py-4 pb-32 shadow-[0_18px_55px_rgba(0,0,0,0.09)] sm:px-5 md:min-h-[calc(100dvh-90px)] md:px-6 md:py-5 md:pb-7 lg:px-7 xl:px-8"
        >
          {panel === "modules" ? (
            <WorkspaceModuleStore
              enabledModules={enabledModules}
              entitledModules={workspace.entitledModules}
              onToggle={toggleModule}
              onClose={() => setPanel("workspace")}
              canManage={canManageModules}
              savingModule={savingModule}
              error={actionError}
            />
          ) : (
            <WorkspaceContent
              activeModule={activeDefinition.id}
              navigation={navigation}
              organizationId={workspace.organization.id}
              locale={locale}
              timeZone={timeZone}
              greetingName={greetingName}
              dateLabel={dateLabel}
              enabledModules={enabledModules}
              role={workspace.membership.role}
              onOpenModule={openModule}
            />
          )}
        </section>
      </div>

      {createMenuOpen && canCreate && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:items-center">
          <button
            type="button"
            aria-label="Închide meniul de creare"
            onClick={() => setCreateMenuOpen(false)}
            className="absolute inset-0 bg-[#020814]/70"
          />
          <section role="dialog" aria-modal="true" aria-labelledby="workspace-create-title" className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">Acțiune nouă</p>
                <h2 id="workspace-create-title" className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Ce vrei să creezi?</h2>
              </div>
              <button type="button" onClick={() => setCreateMenuOpen(false)} aria-label="Închide" className="h-11 w-11 shrink-0 rounded-full border border-[var(--border)] text-lg sm:h-9 sm:w-9">×</button>
            </div>
            <div className="mt-5 grid gap-2">
              {createOptions.map((definition) => (
                <button
                  key={definition.id}
                  type="button"
                  onClick={() => openModule(definition.id, { create: true })}
                  className="flex w-full items-center justify-between gap-4 rounded-[15px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left text-sm font-semibold transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                >
                  <span>{definition.id === "leads" ? "Cerere nouă" : definition.id === "tasks" ? "Lucrare nouă" : definition.id === "calendar" ? "Programare nouă" : definition.id === "estimates" ? "Ofertă nouă" : definition.id === "expenses" ? "Înregistrare financiară" : definition.shortName}</span>
                  <span aria-hidden="true" className="text-[var(--muted)]">→</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      <div data-workspace-mobile-dock="true" className="fixed bottom-[max(0.45rem,env(safe-area-inset-bottom))] left-1/2 z-[80] w-[calc(100%-16px)] max-w-[430px] -translate-x-1/2 transition-opacity duration-150 md:hidden">
        {mobileModuleMenuOpen && (
          <div className="absolute bottom-[72px] left-1/2 max-h-[min(62dvh,520px)] w-full -translate-x-1/2 overflow-y-auto overscroll-contain rounded-[26px] border border-[var(--border-strong)] bg-[color:var(--surface)]/96 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
            <div className="grid grid-cols-4 gap-2">
              {enabledDefinitions.map((definition) => {
                const active = panel === "workspace" && activeModule === definition.id;
                return (
                  <button
                    key={definition.id}
                    type="button"
                    onClick={() => {
                      requestNativeHaptic();
                      openModule(definition.id);
                    }}
                    className={`flex aspect-square min-w-0 flex-col items-center justify-center gap-2 rounded-[20px] border px-1 text-center transition active:scale-[0.97] ${
                      active
                        ? "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]"
                        : "border-transparent bg-[color:var(--surface)]/72 text-[var(--muted)]"
                    }`}
                  >
                    <ModuleGlyph id={definition.id} />
                    <span className="w-full truncate text-[10px] font-semibold leading-tight">
                      {definition.shortName}
                    </span>
                  </button>
                );
              })}
            </div>

            <div data-workspace-text-scale-control="mobile" className="mt-3 min-w-0 rounded-[16px] border border-[var(--border)] bg-[color:var(--surface-2)]/75 px-3 py-2.5">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 text-[11px] font-semibold leading-4 text-[var(--muted)]">Dimensiune text</span>
                <button
                  type="button"
                  onClick={() => {
                    requestNativeHaptic();
                    resetTextScale();
                  }}
                  aria-label="Revino la dimensiunea textului 100%"
                  title="Revino la 100%"
                  className="shrink-0 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold text-[var(--muted-2)]"
                >
                  {Math.round(textScale * 100)}%
                </button>
              </div>
              <div className="mt-2 grid min-w-0 grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    requestNativeHaptic();
                    changeTextScale(-1);
                  }}
                  disabled={textScale === TEXT_SCALE_STEPS[0]}
                  aria-label="Micșorează textul"
                  className="flex h-11 min-w-0 items-center justify-center rounded-[11px] border border-[var(--border)] px-2 text-[12px] font-semibold disabled:opacity-30"
                >
                  A−
                </button>
                <button
                  type="button"
                  onClick={() => {
                    requestNativeHaptic();
                    changeTextScale(1);
                  }}
                  disabled={textScale === TEXT_SCALE_STEPS[TEXT_SCALE_STEPS.length - 1]}
                  aria-label="Mărește textul"
                  className="flex h-11 min-w-0 items-center justify-center rounded-[11px] border border-[var(--border)] px-2 text-[12px] font-semibold disabled:opacity-30"
                >
                  A+
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                requestNativeHaptic();
                setMobileModuleMenuOpen(false);
                onOpenPath("/ai-web-design");
              }}
              className="mt-3 flex min-h-11 w-full items-center justify-between rounded-[16px] border border-[#7897ff]/24 bg-[#7897ff]/[0.09] px-4 text-[11px] font-semibold text-[var(--text)]"
            >
              <span>✦ AI Web Design</span>
              <span className="text-[#aebcff]">→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                requestNativeHaptic();
                setPanel("modules");
                setMobileModuleMenuOpen(false);
              }}
              className="mt-2 flex min-h-11 w-full items-center justify-center rounded-[16px] border border-[var(--border)] bg-[color:var(--surface-2)]/75 px-3 text-[11px] font-semibold text-[var(--muted)]"
            >
              {canManageModules ? "Gestionează modulele" : "Vezi configurația modulelor"}
            </button>
          </div>
        )}

        <nav
          aria-label="Navigare mobilă ORBYVEN"
          className="grid grid-cols-5 items-center rounded-[24px] border border-[var(--border-strong)] bg-[color:var(--surface)]/96 p-1.5 shadow-[0_18px_55px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
        >
          <button
            type="button"
            onClick={() => {
              requestNativeHaptic();
              openModule("overview");
            }}
            aria-current={panel === "workspace" && activeModule === "overview" ? "page" : undefined}
            className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[17px] text-[9px] font-semibold transition active:scale-[0.97] ${
              panel === "workspace" && activeModule === "overview"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)]"
            }`}
          >
            <ModuleGlyph id="overview" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            disabled={!enabledModules.includes("tasks")}
            onClick={() => {
              requestNativeHaptic();
              openModule("tasks");
            }}
            aria-current={panel === "workspace" && activeModule === "tasks" ? "page" : undefined}
            className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[17px] text-[9px] font-semibold transition active:scale-[0.97] disabled:opacity-35 ${
              panel === "workspace" && activeModule === "tasks"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)]"
            }`}
          >
            <ModuleGlyph id="tasks" />
            <span>Lucrări</span>
          </button>

          <button
            type="button"
            aria-label={canCreate ? "Creează o înregistrare" : "Deschide modulele"}
            onClick={() => {
              requestNativeHaptic();
              if (canCreate) {
                setCreateMenuOpen(true);
                setMobileModuleMenuOpen(false);
              } else {
                setMobileModuleMenuOpen((current) => !current);
              }
            }}
            className="flex min-h-[54px] flex-col items-center justify-center gap-0.5 text-[9px] font-semibold text-[var(--text)] active:scale-[0.97]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--button)] text-[23px] font-light leading-none text-[var(--button-text)] shadow-[0_8px_24px_rgba(57,86,210,0.35)]" aria-hidden="true">+</span>
            <span>Nou</span>
          </button>

          <button
            type="button"
            disabled={!enabledModules.includes("leads")}
            onClick={() => {
              requestNativeHaptic();
              openModule("leads");
            }}
            aria-current={panel === "workspace" && activeModule === "leads" ? "page" : undefined}
            className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[17px] text-[9px] font-semibold transition active:scale-[0.97] disabled:opacity-35 ${
              panel === "workspace" && activeModule === "leads"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)]"
            }`}
          >
            <ModuleGlyph id="leads" />
            <span>Clienți</span>
          </button>

          <button
            type="button"
            aria-expanded={mobileModuleMenuOpen}
            aria-label={mobileModuleMenuOpen ? "Închide meniul modulelor" : "Deschide meniul modulelor"}
            onClick={() => {
              requestNativeHaptic();
              setMobileModuleMenuOpen((current) => !current);
            }}
            className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[17px] text-[9px] font-semibold transition active:scale-[0.97] ${
              mobileModuleMenuOpen ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)]"
            }`}
          >
            <span className="flex h-[16px] items-center gap-1" aria-hidden="true">
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
            </span>
            <span>Mai multe</span>
          </button>
        </nav>
      </div>
    </main>
  );
}

const modulePaths: Record<OrbyvenModuleId, string> = {
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  leads: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2z M9 10a4 4 0 1 0 0-8a4 4 0 0 0 0 8z M18 8a3 3 0 0 1 0 6 M18 16a4 4 0 0 1 4 4",
  tasks: "M8 3h8v3H8z M8 5H5v16h14V5h-3 M9 12l2 2 4-4 M9 18h6",
  calendar: "M3 5h18v16H3z M3 10h18 M7 2v6 M17 2v6 M8 15h3 M8 18h3",
  estimates: "M5 2h10l4 4v16H5z M15 2v5h4 M8 12h8 M8 16h8 M8 19h5",
  documents: "M5 3h10l4 4v14H5z M15 3v5h4 M8 12h8 M8 16h8",
  inventory: "M4 6h16v14H4z M7 6V3h10v3 M8 10h8 M8 14h3 M14 14h2 M8 18h8",
  expenses: "M3 6h18v14H3z M3 10h18 M16 16h3 M6 3h12",
  thermal: "M3 20h18 M5 20V9l7-6 7 6v11 M8 20v-5h8v5 M7 11h10 M12 8v5",
  team: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 10a4 4 0 1 0 0-8a4 4 0 0 0 0 8 M18 8a3 3 0 0 1 0 6 M18 16a4 4 0 0 1 4 4",
};

function ModuleGlyph({ id }: { id: OrbyvenModuleId }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px] shrink-0"><path d={modulePaths[id]} /></svg>;
}
