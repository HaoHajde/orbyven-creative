"use client";

import { useEffect, useState } from "react";

type HistoryJob = {
  id: string;
  provider: "webhook" | "wan" | "ltx" | null;
  status: "provider_required" | "queued" | "rendering" | "complete" | "failed";
  providerJobId: string | null;
  outputUrl: string | null;
  failureCode: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusLabel: Record<HistoryJob["status"], string> = {
  provider_required: "Package ready",
  queued: "Queued",
  rendering: "Rendering",
  complete: "Complete",
  failed: "Failed",
};

export default function VideoJobHistory({
  accessToken,
  refreshKey,
}: {
  accessToken: string | null;
  refreshKey?: string | null;
}) {
  const [jobs, setJobs] = useState<HistoryJob[]>([]);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;

    void fetch("/api/video-ai/jobs", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("HISTORY_UNAVAILABLE");
        return (await response.json()) as { jobs?: HistoryJob[] };
      })
      .then((payload) => {
        if (!active) return;
        setJobs(Array.isArray(payload.jobs) ? payload.jobs : []);
        setUnavailable(false);
      })
      .catch(() => {
        if (active) setUnavailable(true);
      });

    return () => {
      active = false;
    };
  }, [accessToken, refreshKey]);

  if (!accessToken) {
    return (
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
          Render history
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Sign in when you want ORBYVEN to keep render jobs and generated video links across sessions.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
            Render history
          </p>
          <p className="mt-1 text-sm font-semibold">Recent Video AI jobs</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)]">
          {jobs.length} saved
        </span>
      </div>

      {unavailable ? (
        <p className="px-5 py-6 text-xs leading-5 text-[var(--muted)] sm:px-6">
          History is temporarily unavailable. Rendering can still use the current Director package.
        </p>
      ) : jobs.length ? (
        <div className="divide-y divide-[var(--border)]">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold">{statusLabel[job.status]}</span>
                  <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">
                    {job.provider?.toUpperCase() ?? "DIRECTOR"}
                  </span>
                </div>
                <p className="mt-2 truncate text-[11px] text-[var(--muted-2)]">{job.id}</p>
                <p className="mt-1 text-[10px] text-[var(--muted-2)]">
                  {new Date(job.createdAt).toLocaleString()}
                </p>
              </div>

              {job.outputUrl ? (
                <a
                  href={job.outputUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold transition hover:border-[#786aff]/60"
                >
                  Open video ↗
                </a>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">
                  {job.failureCode ? "Needs attention" : "Saved"}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-6 text-xs leading-5 text-[var(--muted)] sm:px-6">
          No render jobs yet. Your first saved job will appear here.
        </p>
      )}
    </div>
  );
}
