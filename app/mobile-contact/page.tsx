import type { CSSProperties } from "react";
import MobilePageChrome from "@/components/MobilePageChrome";
import MobileContactForm from "@/components/MobileContactForm";

const vars = {
  "--bg": "#000000",
  "--surface": "#0c0c0e",
  "--surface-2": "#151518",
  "--text": "#f5f5f7",
  "--muted": "#a1a1a6",
  "--muted-2": "#77777d",
  "--border": "rgba(255,255,255,0.09)",
  "--border-strong": "rgba(255,255,255,0.16)",
  "--button": "#f5f5f7",
  "--button-text": "#000000",
} as CSSProperties;

export default function MobileContactPage() {
  return (
    <main
      id="mobile-page-root"
      style={vars}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <MobilePageChrome activePage="contact" />

      <section className="px-5 pb-12 pt-32">
        <div className="mx-auto max-w-[760px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
            ORBYVEN CREATIVE · CONTACT
          </p>

          <h1 className="mt-6 text-[48px] font-semibold leading-[0.92] tracking-[-0.06em]">
            Spune-ne ce
            <br />
            vrei să construim.
          </h1>

          <p className="mt-7 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Povestește-ne despre proiect, obiectiv și direcția pe care o ai în minte. Revenim cu următorii pași.
          </p>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)] px-5 py-10">
        <div className="mx-auto max-w-[760px]">
          <MobileContactForm />
        </div>
      </section>

      <footer className="px-4 pt-6">
        <div className="rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]">
          <p className="text-[10px] uppercase tracking-[0.16em] opacity-40">
            ORBYVEN CREATIVE
          </p>

          <h2 className="mt-7 text-[40px] font-semibold leading-[0.95] tracking-[-0.055em]">
            O idee bună
            <br />
            merită construită bine.
          </h2>

          <a
            href="/"
            className="mt-8 flex h-13 items-center justify-center rounded-full bg-[var(--bg)] text-sm font-semibold text-[var(--text)]"
          >
            Înapoi acasă
          </a>

          <p className="mt-14 border-t border-current/15 pt-6 text-[10px] uppercase tracking-[0.15em] opacity-40">
            © 2026 ORBYVEN CREATIVE
          </p>
        </div>
      </footer>
    </main>
  );
}
