"use client";

import BrandLogo from "@/components/BrandLogo";
import WorkspaceContent from "@/components/WorkspaceContent";
import WorkspaceModuleStore from "@/components/WorkspaceModuleStore";
import WorkspaceStateScreen from "@/components/WorkspaceStateScreen";
import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import {
  getCurrentWorkspace,
  setOrganizationModuleEnabled,
  type OrbyvenWorkspace,
} from "@/lib/orbyven-workspace";
import Link from "next/link";
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
  const [theme, setTheme] = useState<Theme>("light");
  const [panel, setPanel] = useState<Panel>("workspace");
  const [activeModule, setActiveModule] = useState<OrbyvenModuleId>("overview");
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
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: Theme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : prefersDark
          ? "dark"
          : "light";

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

  const openModule = useCallback((id: OrbyvenModuleId) => {
    setPanel("workspace");
    setActiveModule(id);
    setMobileModuleMenuOpen(false);
  }, []);

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

    if (currentlyEnabled && activeModule === id) setActiveModule("overview");

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

  const logout = async () => {
    await orbyvenSupabase.auth.signOut();
    router.replace("/workspace/login");
  };

  const vars = {
    "--bg": theme === "dark" ? "#09090a" : "#ffffff",
    "--surface": theme === "dark" ? "#111113" : "#f5f5f7",
    "--surface-2": theme === "dark" ? "#19191b" : "#fbfbfd",
    "--text": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--muted": theme === "dark" ? "#a1a1a6" : "#6e6e73",
    "--muted-2": theme === "dark" ? "#85858a" : "#86868b",
    "--border": theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-soft": theme === "dark" ? "rgba(75,70,238,0.20)" : "rgba(75,70,238,0.08)",
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
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 top-24 h-[420px] w-[420px] rounded-full bg-[#6d68ff]/[0.10] blur-[110px] dark:bg-[#6d68ff]/[0.14]" />
        <div className="absolute -right-40 top-[18%] h-[480px] w-[480px] rounded-full bg-[#3b82f6]/[0.07] blur-[130px] dark:bg-[#3b82f6]/[0.10]" />
        <div className="absolute bottom-[-180px] left-[36%] h-[420px] w-[520px] rounded-full bg-[#8b5cf6]/[0.06] blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.82),transparent_45%)] opacity-50 dark:opacity-[0.04]" />
      </div>

      <header
        className={`sticky top-0 z-50 transform-gpu border-b border-[var(--border)] bg-[color:var(--bg)]/72 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl transition-transform duration-300 ease-out ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-[68px] max-w-[1520px] items-center justify-between px-5 md:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLogo compact theme={theme} />
            <div className="hidden h-6 w-px bg-[var(--border)] md:block" />
            <button type="button" onClick={() => setPanel("workspace")} className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/70 px-3 py-2 text-[11px] font-semibold text-[var(--muted)] transition hover:text-[var(--text)] md:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />Workspace</button>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/workspace/site-studio" className="inline-flex h-9 items-center rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/75 px-3 text-[11px] font-semibold text-[var(--text)] transition hover:border-[var(--border-strong)]">Website Studio ↗</Link>
            <button type="button" onClick={() => setPanel(panel === "modules" ? "workspace" : "modules")} className="hidden h-9 rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/75 px-4 text-[11px] font-semibold text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)] sm:block">{panel === "modules" ? "Înapoi la dashboard" : "Personalizează"}</button>
            <button type="button" onClick={toggleTheme} aria-label="Schimbă tema" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/75 text-sm transition hover:border-[var(--border-strong)]">{theme === "dark" ? "☀" : "☾"}</button>
            <button type="button" onClick={logout} className="hidden h-9 rounded-full px-3 text-[11px] font-medium text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)] sm:block">Ieșire</button>
            <button type="button" onClick={logout} aria-label="Delogare" className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--button)] text-[11px] font-semibold text-[var(--button-text)] shadow-sm">{initials || "OR"}</button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1520px] gap-4 px-3 pb-4 pt-4 md:grid-cols-[224px_minmax(0,1fr)] md:px-5 md:pb-6">
        <aside className="sticky top-[84px] hidden h-[calc(100vh-100px)] rounded-[24px] border border-[var(--border)] bg-[color:var(--surface-2)]/70 px-3 py-4 shadow-[0_18px_55px_rgba(0,0,0,0.06)] backdrop-blur-2xl md:flex md:flex-col">
          <div className="rounded-[18px] border border-[var(--border)] bg-[color:var(--bg)]/54 px-3.5 py-3.5">
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
                  className={`flex w-full items-center gap-3 rounded-[13px] border px-3 py-2.5 text-left text-[13px] transition ${active ? "border-[var(--border)] bg-[color:var(--bg)]/74 font-semibold shadow-sm" : "border-transparent text-[var(--muted)] hover:bg-[color:var(--bg)]/52 hover:text-[var(--text)]"}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[10px] font-bold" style={{ backgroundColor: definition.accent, color: definition.color }}>{definition.shortName.slice(0, 1)}</span>
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

        <section className="min-w-0 rounded-[28px] border border-[var(--border)] bg-[color:var(--bg)]/66 px-5 py-6 pb-28 shadow-[0_22px_70px_rgba(0,0,0,0.05)] backdrop-blur-xl sm:px-7 md:min-h-[calc(100vh-100px)] md:px-8 md:py-7 md:pb-7 lg:px-9 xl:px-10">
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

      <div className="fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 md:hidden">
        {mobileModuleMenuOpen && (
          <div className="absolute bottom-[58px] left-1/2 w-[calc(100vw-24px)] max-w-[520px] -translate-x-1/2 rounded-[30px] border border-[var(--border-strong)] bg-[color:var(--bg)]/78 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
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
          className="flex h-12 min-w-[124px] items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[color:var(--bg)]/84 px-5 text-xs font-semibold shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl active:scale-[0.97]"
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
