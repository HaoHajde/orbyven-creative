import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white text-[#1d1d1f] antialiased dark:bg-black dark:text-[#f5f5f7]">
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 py-16 md:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-20%] h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-[rgba(75,70,238,0.10)] blur-[170px] dark:bg-[rgba(75,70,238,0.16)]"
        />

        <div className="relative mx-auto w-full max-w-[1500px]">
          <BrandLogo theme="light" className="dark:hidden" />
          <BrandLogo theme="dark" className="hidden dark:inline-block" />

          <div className="mt-24 md:mt-32">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#86868b]">
              ORBYVEN CREATIVE · 404
            </p>

            <h1 className="mt-7 max-w-[1200px] text-[clamp(64px,10vw,156px)] font-semibold leading-[0.86] tracking-[-0.075em]">
              Pagina asta
              <br />
              a ieșit din orbită.
            </h1>

            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#1d1d1f] px-6 text-sm font-medium text-white transition hover:scale-[1.02] dark:bg-[#f5f5f7] dark:text-black"
              >
                Înapoi acasă
              </Link>

              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-full border border-black/15 px-6 text-sm font-medium transition hover:bg-black/[0.04] dark:border-white/20 dark:hover:bg-white/[0.08]"
              >
                Contact
              </Link>
            </div>
          </div>

          <div className="mt-24 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#86868b] md:mt-32">
            <span className="h-px w-10 bg-black/20 dark:bg-white/20" />
            Error 404 · Not found
          </div>
        </div>
      </section>
    </main>
  );
}
