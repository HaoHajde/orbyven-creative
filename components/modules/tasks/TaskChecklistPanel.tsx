"use client";

import type { FormEvent } from "react";
import type { WorkTaskChecklistItem } from "@/lib/modules/tasks";

type Props = {
  checklist: WorkTaskChecklistItem[];
  canWrite: boolean;
  canDelete: boolean;
  saving: boolean;
  newChecklistTitle: string;
  onChecklistTitle: (value: string) => void;
  onAddChecklist: (event: FormEvent<HTMLFormElement>) => void;
  onToggleChecklist: (item: WorkTaskChecklistItem) => void;
  onRemoveChecklist: (item: WorkTaskChecklistItem) => void;
};

export default function TaskChecklistPanel({
  checklist,
  canWrite,
  canDelete,
  saving,
  newChecklistTitle,
  onChecklistTitle,
  onAddChecklist,
  onToggleChecklist,
  onRemoveChecklist,
}: Props) {
  const completedItems = checklist.filter((item) => item.done).length;

  return (
    <article
      data-task-checklist="true"
      className="scroll-mt-28 rounded-[30px] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--muted)]">Checklist</p>
          <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.04em]">
            Pașii operațiunii
          </h2>
        </div>
        <span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold">
          {completedItems}/{checklist.length}
        </span>
      </div>

      <div className="mt-6 space-y-2">
        {checklist.length ? (
          checklist.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-[18px] bg-[var(--bg)] p-3"
            >
              <button
                type="button"
                disabled={!canWrite || saving}
                onClick={() => onToggleChecklist(item)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  item.done
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--border-strong)]"
                }`}
              >
                {item.done ? "✓" : ""}
              </button>
              <span
                className={`min-w-0 flex-1 text-sm ${
                  item.done ? "text-[var(--muted)] line-through" : ""
                }`}
              >
                {item.title}
              </span>
              {canDelete ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onRemoveChecklist(item)}
                  className="text-xs text-[var(--muted)]"
                >
                  ×
                </button>
              ) : null}
            </div>
          ))
        ) : (
          <p className="rounded-[18px] border border-dashed border-[var(--border)] p-5 text-center text-xs text-[var(--muted)]">
            Adaugă pașii esențiali ai lucrării.
          </p>
        )}
      </div>

      {canWrite ? (
        <form onSubmit={onAddChecklist} className="mt-4 flex gap-2">
          <input
            value={newChecklistTitle}
            onChange={(event) => onChecklistTitle(event.target.value)}
            placeholder="Ex. Verifică presiunea instalației"
            className="h-11 min-w-0 flex-1 rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-3 text-sm outline-none"
          />
          <button
            disabled={saving || !newChecklistTitle.trim()}
            className="h-11 rounded-[14px] bg-[var(--button)] px-4 text-sm font-semibold text-[var(--button-text)] disabled:opacity-50"
          >
            Adaugă
          </button>
        </form>
      ) : null}
    </article>
  );
}
