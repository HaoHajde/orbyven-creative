"use client";

import type { VideoLocale } from "@/lib/video-ai-director";

export type VideoHistoryJob = {
  id: string;
  status: "provider_required" | "queued" | "rendering" | "complete" | "failed";
  provider: "webhook" | "wan" | "ltx" | null;
  outputUrl: string | null;
  providerJobId: string | null;
  createdAt: string;
  updatedAt?: string;
};

const statusLabel: Record<VideoLocale, Record<VideoHistoryJob["status"], string>> = {
  ro: {
    provider_required: "Provider necesar",
    queued: "În așteptare",
    rendering: "Se randează",
    complete: "Finalizat",
    failed: "Eșuat",
  },
  en: {
    provider_required: "Provider required",
    queued: "Queued",
    rendering: "Rendering",
    complete: "Complete",
    failed: "Failed",
  },
};

export default function VideoRenderHistory({
  jobs,
  loading,
  locale,
}: {
  jobs: VideoHistoryJob[];
  loading: boolean;
  locale: VideoLocale;
}) {
  if (loading) {
    return (
      <div className="mt-4 rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <p className="text-xs text-[var(--muted)]">{locale === "ro" ? "Se încarcă randările recente…" : "Loading recent renders…"}</p>
      </div>
    );
  }

  if (!jobs.length) return null;

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
          {locale === "ro" ? "Randări recente" : "Recent renders"}
        </p>
        <span className="text-[10px] text-[var(--muted-2)]">{jobs.length} {locale === "ro" ? "salvate" : "saved"}</span>
      </div>
      <div className="grid gap-2">
        {jobs.slice(0, 6).map((job) => (
          <article
            key={job.id}
            className="flex min-w-0 items-center justify-between gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--bg)] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold">{job.id}</p>
              <p className="mt-1 text-[10px] text-[var(--muted-2)]">
                {job.provider?.toUpperCase() ?? (locale === "ro" ? "FĂRĂ PROVIDER" : "NO PROVIDER")} ·{" "}
                {new Date(job.createdAt).toLocaleString(undefined, {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                {statusLabel[locale][job.status]}
              </span>
              {job.outputUrl ? (
                <a
                  href={job.outputUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border-strong)] text-xs"
                  aria-label={locale === "ro" ? "Deschide video-ul generat" : "Open generated video"}
                >
                  ↗
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
