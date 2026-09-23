"use client";

import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import { missingRecommendedModules } from "@/lib/orbyven-ecosystem";

type Props = {
  enabledModules: OrbyvenModuleId[];
  onToggle: (id: OrbyvenModuleId) => void;
  onClose: () => void;
  canManage: boolean;
  savingModule: OrbyvenModuleId | null;
  error: string;
};

export default function WorkspaceModuleStore({
  enabledModules,
  onToggle,
  onClose,
  canManage,
  savingModule,
  error,
}: Props) {
  return (
    <div className="pb-24 md:pb-0">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">Personalizare</p>
          <h1 className="mt-2.5 text-[34px] font-semibold leading-[0.99] tracking-[-0.05em] sm:text-[44px]">Modulele tale.</h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {canManage
              ? "Alege instrumentele de care ai nevoie. Restul rămân ascunse, ca workspace-ul să fie simplu."
              : "Aici vezi instrumentele active ale firmei. Doar un owner sau admin le poate schimba."}
          </p>
        </div>
        <button type="button" onClick={onClose} className="h-9 self-start rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)] shadow-sm">Gata</button>
      </section>

      {error && <div className="mt-6 rounded-[18px] border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-500">{error}</div>}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ORBYVEN_MODULES.map((definition) => {
          const enabled = enabledModules.includes(definition.id);
          const locked = definition.id === "overview";
          const saving = savingModule === definition.id;
          const recommended = missingRecommendedModules(definition.id, enabledModules);

          return (
            <article key={definition.id} className="flex min-h-[190px] flex-col rounded-[22px] border border-[var(--border)] bg-[color:var(--surface)]/68 p-5 shadow-[0_12px_38px_rgba(0,0,0,0.025)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] text-xs font-semibold" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
                  {definition.shortName.slice(0, 2).toUpperCase()}
                </div>
                {definition.badge && <span className="rounded-full border border-[var(--border)] bg-[color:var(--bg)]/68 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">{definition.badge}</span>}
              </div>

              <h2 className="mt-4 text-lg font-semibold tracking-[-0.04em]">{definition.name}</h2>
              <p className="mt-2 text-[12px] leading-5 text-[var(--muted)]">{definition.description}</p>
              {recommended.length ? (
                <p className="mt-2 text-[11px] leading-5 text-[var(--muted-2)]">
                  Se conectează cu: {recommended.map((id) => ORBYVEN_MODULES.find((item) => item.id === id)?.shortName ?? id).join(", ")}.
                  <span className="block">Module opționale, nu se activează automat.</span>
                </p>
              ) : null}

              <div className="mt-auto flex items-center justify-between gap-4 pt-5">
                <span className="text-xs text-[var(--muted)]">{saving ? "Se salvează..." : enabled ? "Activ" : "Neactivat"}</span>
                <button
                  type="button"
                  disabled={locked || !canManage || Boolean(savingModule)}
                  onClick={() => onToggle(definition.id)}
                  className={`h-9 rounded-full px-3.5 text-[11px] font-semibold transition ${enabled ? "bg-[var(--button)] text-[var(--button-text)] shadow-sm" : "border border-[var(--border-strong)] bg-[color:var(--bg)]/50"} disabled:cursor-default disabled:opacity-60`}
                >
                  {locked ? "Inclus" : !canManage ? "Blocat" : saving ? "Salvare" : enabled ? "Elimină" : "Adaugă"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
