"use client";

import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

type CreateOption = {
  id: OrbyvenModuleId;
  shortName: string;
};

function labelFor(option: CreateOption) {
  if (option.id === "leads") return "Cerere nouă";
  if (option.id === "tasks") return "Lucrare nouă";
  if (option.id === "calendar") return "Programare nouă";
  if (option.id === "estimates") return "Ofertă nouă";
  if (option.id === "expenses") return "Înregistrare financiară";
  return option.shortName;
}

export default function WorkspaceCreateDialog({
  open,
  options,
  onClose,
  onCreate,
}: {
  open: boolean;
  options: CreateOption[];
  onClose: () => void;
  onCreate: (id: OrbyvenModuleId) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:items-center">
      <button
        type="button"
        aria-label="Închide meniul de creare"
        onClick={onClose}
        className="absolute inset-0 bg-[#020814]/70"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-create-title"
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">Acțiune nouă</p>
            <h2 id="workspace-create-title" className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Ce vrei să creezi?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Închide"
            className="h-11 w-11 shrink-0 rounded-full border border-[var(--border)] text-lg sm:h-9 sm:w-9"
          >
            ×
          </button>
        </div>
        <div className="mt-5 grid gap-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onCreate(option.id)}
              className="flex w-full items-center justify-between gap-4 rounded-[15px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left text-sm font-semibold transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
            >
              <span>{labelFor(option)}</span>
              <span aria-hidden="true" className="text-[var(--muted)]">→</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
