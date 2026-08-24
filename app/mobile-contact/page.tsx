import type { CSSProperties } from "react";
import MobilePageChrome from "@/components/MobilePageChrome";
import MobileContactForm from "@/components/MobileContactForm";

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

      <section className="relative overflow-hidden px-5 pb-18 pt-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-120px] top-[40px] h-[320px] w-[320px] rounded-full bg-[#4b46ee]/16 blur-[100px]"
        />

        <div className="relative mx-auto max-w-[760px]">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
              ORBYVEN CREATIVE
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
              03 / Contact
            </p>
          </div>

          <h1 className="mt-10 text-[50px] font-semibold leading-[0.9] tracking-[-0.065em]">
            Spune-ne
            <br />
            ce vrei să
            <br />
            <span className="text-[#4b46ee]">construim.</span>
          </h1>

          <p className="mt-8 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Trimite-ne brief-ul. Noi îl transformăm într-un plan clar, apoi într-un produs digital care arată și funcționează cum trebuie.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3">
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-[8px] uppercase tracking-[0.16em] text-[var(--muted-2)]">
                Response
              </p>
              <p className="mt-3 text-[22px] font-semibold tracking-[-0.04em]">
                24–48h
              </p>
            </div>

            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-[8px] uppercase tracking-[0.16em] text-[var(--muted-2)]">
                Start
              </p>
              <p className="mt-3 text-[22px] font-semibold tracking-[-0.04em]">
                Simplu.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)] px-5 py-10">
        <div className="mx-auto max-w-[760px]">
          <MobileContactForm />
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-[760px]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
            What happens next
          </p>

          <h2 className="mt-6 text-[40px] font-semibold leading-[0.98] tracking-[-0.055em]">
            Fără ping-pong
            <br />
            inutil.
          </h2>

          <div className="mt-10 space-y-3">
            {[
              ["01", "Citim brief-ul și înțelegem obiectivul."],
              ["02", "Îți trimitem direcția și pașii concreți."],
              ["03", "Stabilim proiectul și începem construcția."],
            ].map(([number, text]) => (
              <div
                key={number}
                className="flex gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <span className="text-[9px] font-semibold text-[#4b46ee]">
                  {number}
                </span>

                <p className="text-sm leading-6 text-[var(--text)]">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-current/10"
          />

          <div className="relative">
            <p className="text-[9px] uppercase tracking-[0.18em] opacity-40">
              ORBYVEN CREATIVE
            </p>

            <h2 className="mt-7 text-[42px] font-semibold leading-[0.94] tracking-[-0.06em]">
              O idee bună
              <br />
              merită construită bine.
            </h2>

            <a
              href="/"
              className="mt-9 flex h-13 items-center justify-center rounded-full bg-[var(--bg)] text-sm font-semibold text-[var(--text)]"
            >
              Înapoi acasă
            </a>

            <p className="mt-16 border-t border-current/15 pt-6 text-[9px] uppercase tracking-[0.15em] opacity-40">
              © 2026 ORBYVEN CREATIVE
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
