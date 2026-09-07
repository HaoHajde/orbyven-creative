"use client";

import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";

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
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">Module ORBYVEN</p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[0.97] tracking-[-0.06em] sm:text-[60px]">Doar ce îți trebuie.</h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
            {canManage
              ? "Aici gestionezi doar modulele active în workspace. Disponibilitatea vine din registry, iar dreptul comercial va fi furnizat separat de sistemul de entitlements."
              : "Poți vedea instrumentele active ale firmei. Doar un owner sau admin poate schimba configurația workspace-ului."}
          </p>
        </div>
        <button type="button" onClick={onClose} className="h-11 self-start rounded-full bg-[var(--button)] px-5 text-sm font-medium text-[var(--button-text)]">Gata</button>
      </section>

      {error && <div className="mt-6 rounded-[18px] border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-500">{error}</div>}

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ORBYVEN_MODULES.map((definition) => {
          const enabled = enabledModules.includes(definition.id);
          const locked = definition.id === "overview";
          const saving = savingModule === definition.id;

          return (
            <article key={definition.id} className="flex min-h-[270px] flex-col rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] text-sm font-semibold" style={{ backgroundColor: definition.accent, color: definition.color }}>
                  {definition.shortName.slice(0, 2).toUpperCase()}
                </div>
                {definition.badge && <span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">{definition.badge}</span>}
              </div>

              <h2 className="mt-7 text-2xl font-semibold tracking-[-0.045em]">{definition.name}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{definition.description}</p>

              <div className="mt-auto flex items-center justify-between gap-4 pt-7">
                <span className="text-xs text-[var(--muted)]">{saving ? "Se salvează..." : enabled ? "Activ" : "Neactivat"}</span>
                <button
                  type="button"
                  disabled={locked || !canManage || Boolean(savingModule)}
                  onClick={() => onToggle(definition.id)}
                  className={`h-10 rounded-full px-4 text-xs font-semibold transition ${enabled ? "bg-[var(--button)] text-[var(--button-text)]" : "border border-[var(--border-strong)]"} disabled:cursor-default disabled:opacity-60`}
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
