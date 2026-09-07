"use client";

import BrandLogo from "@/components/BrandLogo";
import {
  DEFAULT_ENABLED_MODULES,
  ORBYVEN_MODULES,
  type OrbyvenModuleId,
} from "@/lib/orbyven-modules";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Theme = "light" | "dark";
type Panel = "workspace" | "modules";

const STORAGE_KEY = "orbyven-demo-enabled-modules";

const demoActivity = [
  { title: "Ofertă trimisă", meta: "Client nou · acum 18 min" },
  { title: "Lucrare actualizată", meta: "Instalație termică · acum 1h" },
  { title: "Programare adăugată", meta: "Mâine, 09:30 · acum 2h" },
];

export default function ClientWorkspace() {
  const [theme, setTheme] = useState<Theme>("light");
  const [panel, setPanel] = useState<Panel>("workspace");
  const [activeModule, setActiveModule] = useState<OrbyvenModuleId>("overview");
  const [enabledModules, setEnabledModules] = useState<OrbyvenModuleId[]>(
    DEFAULT_ENABLED_MODULES
  );

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("studio-theme");
    const nextTheme: Theme = savedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.style.colorScheme = nextTheme;

    try {
      const savedModules = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) ?? "[]"
      ) as OrbyvenModuleId[];
      if (savedModules.length) setEnabledModules(savedModules);
    } catch {
      // Keep the safe defaults when local preview state is invalid.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledModules));
  }, [enabledModules]);

  const enabledDefinitions = useMemo(
    () => ORBYVEN_MODULES.filter((module) => enabledModules.includes(module.id)),
    [enabledModules]
  );

  const activeDefinition =
    ORBYVEN_MODULES.find((module) => module.id === activeModule) ??
    ORBYVEN_MODULES[0];

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      return next;
    });
  };

  const toggleModule = (id: OrbyvenModuleId) => {
    if (id === "overview") return;

    setEnabledModules((current) => {
      const next = current.includes(id)
        ? current.filter((moduleId) => moduleId !== id)
        : [...current, id];

      if (id === activeModule && current.includes(id)) {
        setActiveModule("overview");
      }

      return next;
    });
  };

  const vars = {
    "--bg": theme === "dark" ? "#09090a" : "#ffffff",
    "--surface": theme === "dark" ? "#111113" : "#f5f5f7",
    "--surface-2": theme === "dark" ? "#19191b" : "#fbfbfd",
    "--text": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--muted": theme === "dark" ? "#a1a1a6" : "#6e6e73",
    "--muted-2": theme === "dark" ? "#85858a" : "#86868b",
    "--border":
      theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    "--border-strong":
      theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-soft":
      theme === "dark" ? "rgba(75,70,238,0.20)" : "rgba(75,70,238,0.08)",
  } as CSSProperties;

  return (
    <main
      style={{
        ...vars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-300"
    >
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:var(--bg)]/88 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLogo compact theme={theme} />
            <div className="hidden h-6 w-px bg-[var(--border)] md:block" />
            <button
              type="button"
              onClick={() => setPanel("workspace")}
              className="hidden text-sm font-medium text-[var(--muted)] md:block"
            >
              Workspace
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPanel(panel === "modules" ? "workspace" : "modules")}
              className="hidden h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold sm:block"
            >
              {panel === "modules" ? "Înapoi" : "Module"}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Schimbă tema"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-sm"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--button)] text-xs font-semibold text-[var(--button-text)]"
            >
              NC
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] md:grid-cols-[238px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-72px)] border-r border-[var(--border)] px-4 py-6 md:flex md:flex-col">
          <div className="px-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
              Neagu Costică SRL
            </p>
            <p className="mt-2 text-sm font-semibold">Spațiul tău de lucru</p>
          </div>

          <nav className="mt-7 space-y-1.5">
            {enabledDefinitions.map((module) => {
              const active = panel === "workspace" && activeModule === module.id;
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => {
                    setPanel("workspace");
                    setActiveModule(module.id);
                  }}
                  className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm transition ${
                    active
                      ? "bg-[var(--surface)] font-semibold"
                      : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: module.color }}
                  />
                  <span>{module.shortName}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={() => setPanel("modules")}
              className="w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left text-xs font-medium text-[var(--muted)]"
            >
              + Adaugă sau elimină module
            </button>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-8 sm:px-7 md:px-9 md:py-10 lg:px-12 xl:px-14">
          {panel === "modules" ? (
            <ModuleStore
              enabledModules={enabledModules}
              onToggle={toggleModule}
              onClose={() => setPanel("workspace")}
            />
          ) : (
            <WorkspaceContent activeModule={activeDefinition.id} />
          )}
        </section>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-between rounded-[22px] border border-[var(--border)] bg-[color:var(--bg)]/90 p-2 shadow-2xl backdrop-blur-2xl md:hidden">
        {enabledDefinitions.slice(0, 4).map((module) => (
          <button
            key={module.id}
            type="button"
            onClick={() => {
              setPanel("workspace");
              setActiveModule(module.id);
            }}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[16px] px-2 py-2 text-[10px] ${
              panel === "workspace" && activeModule === module.id
                ? "bg-[var(--surface)] font-semibold"
                : "text-[var(--muted)]"
            }`}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: module.color }}
            />
            <span className="truncate">{module.shortName}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPanel("modules")}
          className="flex flex-1 flex-col items-center gap-1 rounded-[16px] px-2 py-2 text-[10px] text-[var(--muted)]"
        >
          <span className="text-base leading-none">＋</span>
          <span>Module</span>
        </button>
      </nav>
    </main>
  );
}

function WorkspaceContent({ activeModule }: { activeModule: OrbyvenModuleId }) {
  if (activeModule !== "overview") {
    const module = ORBYVEN_MODULES.find((item) => item.id === activeModule)!;
    return (
      <div className="pb-24 md:pb-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            Modul activ
          </p>
          <h1 className="mt-4 text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[58px]">
            {module.name}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
            {module.description}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {module.features.map((feature, index) => (
            <article
              key={feature}
              className="min-h-[190px] rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold"
                style={{ backgroundColor: module.accent, color: module.color }}
              >
                0{index + 1}
              </div>
              <h2 className="mt-8 text-xl font-semibold tracking-[-0.035em]">
                {feature}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Interfață modulară gata să primească datele reale ale clientului.
              </p>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-[28px] border border-dashed border-[var(--border-strong)] p-7 text-sm text-[var(--muted)]">
          Acesta este shell-ul portabil al modulului. Logica și datele specifice se conectează separat, fără să reconstruim dashboard-ul pentru fiecare client.
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            Luni, 7 septembrie
          </p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[0.97] tracking-[-0.06em] sm:text-[60px] lg:text-[70px]">
            Bună, Costică.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
            Ai tot ce contează azi într-un singur loc. Restul rămâne în spate.
          </p>
        </div>
        <button
          type="button"
          className="h-11 self-start rounded-full bg-[var(--button)] px-5 text-sm font-medium text-[var(--button-text)]"
        >
          + Lucrare nouă
        </button>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Lucrări active" value="6" note="2 pentru azi" />
        <Metric label="Cereri noi" value="3" note="din ultimele 24h" />
        <Metric label="Programări" value="4" note="următoarele 7 zile" />
        <Metric label="Oferte deschise" value="5" note="2 așteaptă răspuns" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Astăzi</p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">
                Ce merită atenția ta
              </h2>
            </div>
            <span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold">
              3 priorități
            </span>
          </div>

          <div className="mt-7 space-y-3">
            <Priority title="Confirmă materialele" meta="Lucrare Pipera · până la 13:00" />
            <Priority title="Sună clientul" meta="Cerere nouă · baie completă" />
            <Priority title="Verifică echipa" meta="Montaj centrală · Bragadiru" />
          </div>
        </article>

        <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-2)] p-6 sm:p-8">
          <p className="text-xs font-medium text-[var(--muted)]">Activitate</p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">
            Ultimele mișcări
          </h2>
          <div className="mt-7 space-y-5">
            {demoActivity.map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function ModuleStore({
  enabledModules,
  onToggle,
  onClose,
}: {
  enabledModules: OrbyvenModuleId[];
  onToggle: (id: OrbyvenModuleId) => void;
  onClose: () => void;
}) {
  return (
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            Module ORBYVEN
          </p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[0.97] tracking-[-0.06em] sm:text-[60px]">
            Doar ce îți trebuie.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
            Activezi instrumentele utile firmei tale. ORBYVEN le integrează în același workspace, cu aceeași experiență.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-11 self-start rounded-full bg-[var(--button)] px-5 text-sm font-medium text-[var(--button-text)]"
        >
          Gata
        </button>
      </section>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ORBYVEN_MODULES.map((module) => {
          const enabled = enabledModules.includes(module.id);
          const locked = module.id === "overview";
          return (
            <article
              key={module.id}
              className="flex min-h-[270px] flex-col rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[16px] text-sm font-semibold"
                  style={{ backgroundColor: module.accent, color: module.color }}
                >
                  {module.shortName.slice(0, 2).toUpperCase()}
                </div>
                {module.badge && (
                  <span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                    {module.badge}
                  </span>
                )}
              </div>

              <h2 className="mt-7 text-2xl font-semibold tracking-[-0.045em]">
                {module.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {module.description}
              </p>

              <div className="mt-auto flex items-center justify-between gap-4 pt-7">
                <span className="text-xs text-[var(--muted)]">
                  {enabled ? "Activ" : "Neactivat"}
                </span>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onToggle(module.id)}
                  className={`h-10 rounded-full px-4 text-xs font-semibold transition ${
                    enabled
                      ? "bg-[var(--button)] text-[var(--button-text)]"
                      : "border border-[var(--border-strong)]"
                  } disabled:cursor-default disabled:opacity-60`}
                >
                  {locked ? "Inclus" : enabled ? "Elimină" : "Adaugă"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-6 text-[42px] font-semibold leading-none tracking-[-0.055em]">
        {value}
      </p>
      <p className="mt-3 text-xs text-[var(--muted-2)]">{note}</p>
    </article>
  );
}

function Priority({ title, meta }: { title: string; meta: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-4 rounded-[20px] bg-[var(--bg)] p-4 text-left transition hover:scale-[1.005]"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-1 truncate text-xs text-[var(--muted)]">{meta}</p>
      </div>
      <span className="text-lg text-[var(--muted)]">›</span>
    </button>
  );
}
