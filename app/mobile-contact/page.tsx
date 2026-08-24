import Link from "next/link";
import type { CSSProperties } from "react";

import MobileContactForm from "@/components/MobileContactForm";
import MobilePageChrome from "@/components/MobilePageChrome";

const vars = {
  "--bg": "#000000",
  "--surface": "#0b0b0d",
  "--surface-2": "#121216",
  "--text": "#f5f5f7",
  "--muted": "#a1a1a6",
  "--muted-2": "#74747a",
  "--border": "rgba(255,255,255,0.08)",
  "--border-strong": "rgba(255,255,255,0.15)",
  "--button": "#f5f5f7",
  "--button-text": "#000000",
} as CSSProperties;

export default function MobileContactPage() {
  return (
    <main
      id="mobile-page-root"
      style={vars}
      className="min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--text)]"
    >
      <MobilePageChrome activePage="contact" />

      <section
        className="min-h-[72svh] px-5 pb-16 pt-32"
        style={{
          backgroundImage:
            "radial-gradient(circle at 78% 18%, rgba(75,70,238,0.08), transparent 28%)",
        }}
      >
        <div className="mx-auto max-w-[760px]">
          <p className="mobile-hero-kicker text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
            ORBYVEN CREATIVE · CONTACT
          </p>

          <h1 className="mobile-hero-title mt-9 text-[49px] font-semibold leading-[0.91] tracking-[-0.065em] orbyven-sparkle-text orbyven-sparkle-a">
            Spune-ne ce
            <br />
            vrei să construim<span className="text-[#4b46ee]">.</span>
          </h1>

          <p className="mobile-hero-copy mt-7 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Un brief scurt e suficient. Revenim cu direcția și următorii pași.
          </p>
        </div>
      </section>

      <section className="mobile-defer border-t border-[var(--border)] bg-[var(--surface)] px-5 py-10">
        <div className="mx-auto max-w-[760px]">
          <MobileContactForm />
        </div>
      </section>

      <section className="mobile-defer px-5 py-20">
        <div
          className="mx-auto max-w-[760px]"
          data-mobile-reveal
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
            What happens next
          </p>

          <h2 className="mt-6 text-[39px] font-semibold leading-[0.98] tracking-[-0.055em] orbyven-sparkle-text orbyven-sparkle-b">
            Fără complicații inutile.
          </h2>

          <div className="mt-9 space-y-3">
            {[
              ["01", "Înțelegem proiectul."],
              ["02", "Stabilim direcția."],
              ["03", "Începem construcția."],
            ].map(([number, text]) => (
              <div
                key={number}
                className="flex items-center gap-4 border-b border-[var(--border)] py-4"
              >
                <span className="text-[9px] font-semibold text-[#4b46ee]">
                  {number}
                </span>

                <span className="text-sm text-[var(--text)]">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mobile-defer px-4 pt-5">
        <div
          className="rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]"
          data-mobile-reveal
        >
          <p className="text-[9px] uppercase tracking-[0.18em] opacity-40">
            ORBYVEN CREATIVE
          </p>

          <h2 className="mt-7 text-[43px] font-semibold leading-[0.93] tracking-[-0.06em] orbyven-sparkle-text orbyven-sparkle-c">
            O idee bună
            <br />
            merită construită bine.
          </h2>

          <Link
            href="/"
            className="mt-9 flex h-14 items-center justify-between rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]"
          >
            <span>Înapoi acasă</span>
            <span className="text-[#4b46ee]">↗</span>
          </Link>
        </div>
      </footer>
    </main>
  );
}
