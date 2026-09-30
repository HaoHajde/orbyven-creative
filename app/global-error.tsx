"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ORBYVEN] Unhandled application error", error);
  }, [error]);

  return (
    <html lang="ro">
      <body className="min-h-[100dvh] bg-white text-[#1d1d1f] antialiased dark:bg-black dark:text-[#f5f5f7]">
        <main className="flex min-h-[100dvh] items-center justify-center px-5 py-[max(2rem,env(safe-area-inset-top))]">
          <section
            role="alert"
            aria-live="assertive"
            className="w-full max-w-xl rounded-[30px] border border-black/10 bg-white/90 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/15 dark:bg-[#0b0b0c]/90 sm:p-8"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#86868b]">
              ORBYVEN · Recovery
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Ceva nu s-a încărcat corect.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">
              Datele tale nu sunt șterse. Poți reîncerca ecranul curent sau reveni în Workspace.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="min-h-12 rounded-full bg-[#1d1d1f] px-6 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-[#f5f5f7] dark:text-black"
              >
                Reîncearcă
              </button>
              <a
                href="/workspace"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-black/15 px-6 text-sm font-semibold transition hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/20 dark:hover:bg-white/[0.08]"
              >
                Înapoi în Workspace
              </a>
            </div>
            {error.digest ? (
              <p className="mt-6 break-all text-[10px] text-[#86868b]">
                Referință: {error.digest}
              </p>
            ) : null}
          </section>
        </main>
      </body>
    </html>
  );
}
