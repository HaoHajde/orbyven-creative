"use client";

import BrandLogo from "@/components/BrandLogo";
import WorkspaceContent from "@/components/WorkspaceContent";
import WorkspaceModuleStore from "@/components/WorkspaceModuleStore";
import WorkspaceStateScreen from "@/components/WorkspaceStateScreen";
import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { WorkspaceNavigationIntent, WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import {
  getCurrentWorkspace,
  setOrganizationModuleEnabled,
  type OrbyvenWorkspace,
} from "@/lib/orbyven-workspace";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type Theme = "light" | "dark";
type Panel = "workspace" | "modules";

const roleLabels: Record<OrbyvenWorkspace["membership"]["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Membru",
  viewer: "Viewer",
};

export default function ClientWorkspace() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("dark");
  const [panel, setPanel] = useState<Panel>("workspace");
  const [activeModule, setActiveModule] = useState<OrbyvenModuleId>("overview");
  const [navigation, setNavigation] = useState<WorkspaceNavigationIntent>({ module: "overview", token: 0 });
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [workspace, setWorkspace] = useState<OrbyvenWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingModule, setSavingModule] = useState<OrbyvenModuleId | null>(null);
  const [mobileModuleMenuOpen, setMobileModuleMenuOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollFrame = useRef<number | null>(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data: authData } = await orbyvenSupabase.auth.getUser();
      if (!authData.user) {
        router.replace("/workspace/login");
        return;
      }

      const nextWorkspace = await getCurrentWorkspace();
      if (!nextWorkspace) {
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
  }, [router]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("studio-theme");
    const nextTheme: Theme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : "dark";

    document.documentElement.style.colorScheme = nextTheme;
    const themeTimer = window.setTimeout(() => setTheme(nextTheme), 0);
    const workspaceTimer = window.setTimeout(() => void loadWorkspace(), 0);

    return () => {
      window.clearTimeout(themeTimer);
      window.clearTimeout(workspaceTimer);
    };
  }, [loadWorkspace]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const updateVisibility = () => {
      const current = window.scrollY;
      const delta = current - lastScrollY.current;

      if (current < 40) {
        setHeaderVisible(true);
      } else if (delta > 6) {
        setHeaderVisible(false);
      } else if (delta < -6) {
        setHeaderVisible(true);
      }

      lastScrollY.current = current;
      scrollFrame.current = null;
    };

    const onScroll = () => {
      if (scrollFrame.current !== null) return;
      scrollFrame.current = window.requestAnimationFrame(updateVisibility);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollFrame.current !== null) window.cancelAnimationFrame(scrollFrame.current);
    };
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
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      return next;
    });
  };

  const openModule = useCallback((id: OrbyvenModuleId, options: WorkspaceOpenOptions = {}) => {
    if (!enabledModules.includes(id)) return;
    setPanel("workspace");
    setActiveModule(id);
    setNavigation((current) => ({ module: id, token: current.token + 1, ...options }));
    setMobileModuleMenuOpen(false);
    setCreateMenuOpen(false);
  }, [enabledModules]);

  const toggleModule = async (id: OrbyvenModuleId) => {
    if (id === "overview" || !workspace || !canManageModules || savingModule) return;

    const currentlyEnabled = workspace.enabledModules.includes(id);
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
    ["leads", "tasks", "calendar", "estimates", "expenses"].includes(definition.id)
      && enabledModules.includes(definition.id)
  );
  const canCreate = workspace?.membership.role !== "viewer" && createOptions.length > 0;

  const logout = async () => {
    await orbyvenSupabase.auth.signOut();
    router.replace("/workspace/login");
  };

  const vars = {
    "--bg": theme === "dark" ? "#080f1e" : "#f1f5fd",
    "--surface": theme === "dark" ? "#101d32" : "#ffffff",
    "--surface-2": theme === "dark" ? "#15243b" : "#eaf1fd",
    "--text": theme === "dark" ? "#eef4ff" : "#142746",
    "--muted": theme === "dark" ? "#a2b1cb" : "#596d8c",
    "--muted-2": theme === "dark" ? "#8296b4" : "#7183a1",
    "--border": theme === "dark" ? "rgba(157,190,249,0.13)" : "rgba(46,82,146,0.12)",
    "--border-strong": theme === "dark" ? "rgba(157,190,249,0.25)" : "rgba(46,82,146,0.24)",
    "--button": theme === "dark" ? "#477af3" : "#244caa",
    "--button-text": "#ffffff",
    "--accent": theme === "dark" ? "#82adff" : "#3561d8",
    "--accent-soft": theme === "dark" ? "rgba(86,134,244,0.17)" : "rgba(65,105,208,0.11)",
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
      style={{
        ...vars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-300"
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: theme === "dark"
              ? "radial-gradient(ellipse 58% 46% at 36% 1%,rgba(31,95,189,0.26),transparent 76%),radial-gradient(ellipse 44% 38% at 100% 54%,rgba(17,70,145,0.14),transparent 82%)"
              : "radial-gradient(ellipse 55% 42% at 34% 0%,rgba(115,166,255,0.17),transparent 78%)",
          }}
        />
      </div>

      <header
        className={`sticky top-0 z-50 transform-gpu border-b border-[var(--border)] bg-[color:var(--bg)]/95 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-md transition-transform duration-300 ease-out ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-[68px] max-w-[1520px] items-center justify-between px-5 md:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLogo compact theme={theme} />
            <div className="hidden h-6 w-px bg-[var(--border)] md:block" />
            <button type="button" onClick={() => openModule("overview")} className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/75 px-3 py-2 text-[11px] font-semibold text-[var(--muted)] transition hover:text-[var(--text)] md:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Dashboard</button>
          </div>

          <div className="flex items-center gap-2">
            {canCreate && (
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={createMenuOpen}
                onClick={() => setCreateMenuOpen(true)}
                className="flex h-9 items-center justify-center rounded-full bg-[var(--button)] px-3 text-[11px] font-semibold text-[var(--button-text)] shadow-sm transition hover:opacity-90 sm:px-4"
              >
                <span className="sm:hidden" aria-hidden="true">+</span>
                <span className="hidden sm:inline">+ Creează</span>
                <span className="sr-only sm:hidden">Creează o înregistrare</span>
              </button>
            )}
            <button type="button" onClick={() => setPanel(panel === "modules" ? "workspace" : "modules")} className="hidden h-9 rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/75 px-4 text-[11px] font-semibold text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)] sm:block">{panel === "modules" ? "Înapoi la dashboard" : "Personalizează"}</button>
            <button type="button" onClick={toggleTheme} aria-label="Schimbă tema" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/75 text-sm transition hover:border-[var(--border-strong)]">{theme === "dark" ? "☀" : "☾"}</button>
            <button type="button" onClick={logout} className="hidden h-9 rounded-full px-3 text-[11px] font-medium text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)] sm:block">Ieșire</button>
            <button type="button" onClick={logout} aria-label="Delogare" className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--button)] text-[11px] font-semibold text-[var(--button-text)] shadow-sm">{initials || "OR"}</button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1520px] gap-4 px-3 pb-4 pt-4 md:grid-cols-[216px_minmax(0,1fr)] md:px-5 md:pb-6">
        <aside className="sticky top-[84px] hidden h-[calc(100vh-100px)] rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-3 py-4 shadow-[0_15px_50px_rgba(0,0,0,0.08)] md:flex md:flex-col">
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3.5">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">{organizationName}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Dashboard</p>
              <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[9px] font-semibold text-[var(--accent)]">{roleLabels[workspace.membership.role]}</span>
            </div>
          </div>

          <p className="mt-6 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">Navigare</p>
          <nav className="mt-2 space-y-1">
            {enabledDefinitions.map((definition) => {
              const active = panel === "workspace" && activeModule === definition.id;
              return (
                <button
                  key={definition.id}
                  type="button"
                  onClick={() => openModule(definition.id)}
                  className={`flex w-full items-center gap-3 rounded-[13px] border px-3 py-2.5 text-left text-[13px] transition ${active ? "border-[var(--border)] bg-[var(--accent-soft)] font-semibold text-[var(--text)]" : "border-transparent text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[10px] font-bold" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>{definition.shortName.slice(0, 1)}</span>
                  <span className="truncate">{definition.shortName}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <button type="button" onClick={() => setPanel("modules")} className="w-full rounded-[15px] border border-[var(--border)] bg-[color:var(--bg)]/58 px-3.5 py-3 text-left text-[11px] font-semibold text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]">
              <span className="block text-[var(--text)]">{canManageModules ? "Personalizează workspace-ul" : "Modulele tale"}</span>
              <span className="mt-1 block text-[10px] font-normal text-[var(--muted-2)]">{canManageModules ? "Adaugă sau ascunde instrumente" : "Vezi instrumentele disponibile"}</span>
            </button>
          </div>
        </aside>

        <section className="min-w-0 rounded-[22px] border border-[var(--border)] bg-[color:var(--surface)]/88 px-4 py-5 pb-28 shadow-[0_18px_60px_rgba(0,0,0,0.06)] sm:px-6 md:min-h-[calc(100vh-100px)] md:px-7 md:py-6 md:pb-7 lg:px-8 xl:px-9">
          {panel === "modules" ? (
            <WorkspaceModuleStore
              enabledModules={enabledModules}
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
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 sm:items-center sm:pt-0">
          <button
            type="button"
            aria-label="Închide meniul de creare"
            onClick={() => setCreateMenuOpen(false)}
            className="absolute inset-0 bg-[#020814]/70"
          />
          <section role="dialog" aria-modal="true" aria-labelledby="workspace-create-title" className="relative z-10 w-full max-w-md rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">Acțiune nouă</p>
                <h2 id="workspace-create-title" className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Ce vrei să creezi?</h2>
              </div>
              <button type="button" onClick={() => setCreateMenuOpen(false)} aria-label="Închide" className="h-9 w-9 shrink-0 rounded-full border border-[var(--border)] text-lg">×</button>
            </div>
            <div className="mt-5 grid gap-2">
              {createOptions.map((definition) => (
                <button
                  key={definition.id}
                  type="button"
                  onClick={() => openModule(definition.id, { create: true })}
                  className="flex w-full items-center justify-between gap-4 rounded-[15px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left text-sm font-semibold transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                >
                  <span>{definition.id === "leads" ? "Cerere nouă" : definition.id === "tasks" ? "Lucrare nouă" : definition.id === "calendar" ? "Programare nouă" : definition.id === "estimates" ? "Ofertă nouă" : "Cheltuială nouă"}</span>
                  <span aria-hidden="true" className="text-[var(--muted)]">→</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 md:hidden">
        {mobileModuleMenuOpen && (
          <div className="absolute bottom-[58px] left-1/2 w-[calc(100vw-24px)] max-w-[520px] -translate-x-1/2 rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface)] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="grid grid-cols-4 gap-2">
              {enabledDefinitions.map((definition) => {
                const active = panel === "workspace" && activeModule === definition.id;
                return (
                  <button
                    key={definition.id}
                    type="button"
                    onClick={() => openModule(definition.id)}
                    className={`flex aspect-square min-w-0 flex-col items-center justify-center gap-2 rounded-[20px] border px-1 text-center transition active:scale-[0.97] ${
                      active
                        ? "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]"
                        : "border-transparent bg-[color:var(--surface)]/72 text-[var(--muted)]"
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: definition.color }}
                    />
                    <span className="w-full truncate text-[10px] font-semibold leading-tight">
                      {definition.shortName}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setPanel("modules");
                setMobileModuleMenuOpen(false);
              }}
              className="mt-3 flex h-10 w-full items-center justify-center rounded-[16px] border border-[var(--border)] bg-[color:var(--surface-2)]/75 text-[11px] font-semibold text-[var(--muted)]"
            >
              {canManageModules ? "Gestionează modulele" : "Vezi configurația modulelor"}
            </button>
          </div>
        )}

        <button
          type="button"
          aria-expanded={mobileModuleMenuOpen}
          aria-label={mobileModuleMenuOpen ? "Închide meniul modulelor" : "Deschide meniul modulelor"}
          onClick={() => setMobileModuleMenuOpen((current) => !current)}
          className="flex h-12 min-w-[124px] items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-5 text-xs font-semibold shadow-[0_12px_40px_rgba(0,0,0,0.18)] active:scale-[0.97]"
        >
          <span className="grid grid-cols-2 gap-[2px]" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
            <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
            <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
            <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
          </span>
          <span>{mobileModuleMenuOpen ? "Închide" : activeDefinition.shortName}</span>
        </button>
      </div>
    </main>
  );
}
