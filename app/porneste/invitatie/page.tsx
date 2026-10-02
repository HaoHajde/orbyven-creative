"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { publicThemeVars, themeBodyBackground } from "@/lib/orbyven-theme";

type Theme = "light" | "dark";

export default function InvitationStartPage() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = localStorage.getItem("studio-theme");
      const next: Theme = saved === "dark" || saved === "light" ? saved : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = themeBodyBackground(next);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => setTheme((current) => {
    const next = current === "light" ? "dark" : "light";
    localStorage.setItem("studio-theme", next);
    document.documentElement.style.colorScheme = next;
    document.body.style.backgroundColor = themeBodyBackground(next);
    return next;
  });

  return (
    <main
      data-orbyven-theme={theme}
      style={{
        ...publicThemeVars(theme),
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
        background: theme === "dark"
          ? "radial-gradient(circle at 75% 12%,rgba(119,83,255,.16),transparent 25%),linear-gradient(180deg,#0b0912,#09090d 72%)"
          : "radial-gradient(circle at 75% 12%,rgba(119,83,255,.16),transparent 28%),radial-gradient(circle at 15% 82%,rgba(91,77,222,.08),transparent 32%),linear-gradient(180deg,#f3f0f9,#ece8f5 72%)",
      }}
      className="orbyven-theme-shell relative min-h-screen overflow-x-hidden text-[var(--text)] antialiased"
    >
      <SiteHeader theme={theme} compact={false} activePage="contact" onToggleTheme={toggleTheme} />

      <section className="relative z-10 px-5 pb-20 pt-28 sm:px-6 md:px-10 md:pb-28 md:pt-36">
        <div className="mx-auto max-w-[1500px]">
          <Link href="/contact" className="inline-flex items-center gap-2 text-[10px] font-semibold text-[var(--muted)] transition hover:text-[var(--text)]">← Înapoi la alegere</Link>

          <div className="mt-7 grid gap-6 lg:grid-cols-[.92fr_1.08fr] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--home-violet)]">INVITAȚIE ONLINE PERSONALIZATĂ</p>
              <h1 className="mt-5 max-w-[800px] text-[clamp(54px,6.2vw,96px)] font-semibold leading-[.88] tracking-[-.07em]">
                Un eveniment.
                <br />
                <span className="text-[var(--home-violet)]">O experiență a lui.</span>
              </h1>
            </div>
            <p className="max-w-xl text-[14px] leading-7 text-[var(--muted)] lg:justify-self-end">
              Nu pornim de la un formular generic. Alegem tipul evenimentului, stilul și informațiile importante, apoi construim invitația în jurul lor.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-[34px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[0_30px_110px_rgba(0,0,0,.16)]">
            <div className="grid lg:grid-cols-[1.15fr_.85fr]">
              <div className="relative min-h-[560px] overflow-hidden bg-[#140f18]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(240,205,255,.22),transparent_24%),radial-gradient(circle_at_80%_14%,rgba(126,93,255,.20),transparent_28%),linear-gradient(150deg,#241428,#120d18_52%,#09090d)]" />
                <div className="absolute inset-0 opacity-65 [background-image:linear-gradient(rgba(255,255,255,.024)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.024)_1px,transparent_1px)] [background-size:42px_42px]" />
                <div className="absolute left-1/2 top-[10%] h-[68%] w-[58%] -translate-x-1/2 rotate-[-3deg] rounded-[34px] border border-white/14 bg-[#f5efe7] shadow-[0_42px_100px_rgba(0,0,0,.38)]">
                  <div className="absolute inset-4 rounded-[26px] border border-[#412f49]/10" />
                  <div className="absolute left-1/2 top-[18%] -translate-x-1/2 text-center text-[#302337]">
                    <p className="text-[8px] font-bold uppercase tracking-[.28em]">SAVE THE DATE</p>
                    <p className="mt-5 font-serif text-[34px] italic leading-none">A & M</p>
                    <p className="mt-5 text-[7px] uppercase tracking-[.2em] text-[#6b5a70]">SATURDAY · 18:00</p>
                  </div>
                  <div className="absolute bottom-[19%] left-1/2 -translate-x-1/2 rounded-full border border-[#4b3653]/15 px-5 py-2 text-[7px] font-semibold uppercase tracking-[.18em] text-[#4b3653]">RSVP ONLINE</div>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0c0910] via-[#0c0910]/82 to-transparent p-7 pt-28 text-white sm:p-9">
                  <p className="text-[9px] font-bold uppercase tracking-[.18em] text-white/55">PREVIEW DE EXPERIENȚĂ</p>
                  <h2 className="mt-4 max-w-lg text-[42px] font-semibold leading-[.94] tracking-[-.06em]">Designul trebuie să pară al vostru, nu al unui template.</h2>
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">ALEGE EVENIMENTUL</p>
                <div className="mt-6 grid gap-3">
                  {[
                    ["/invitatii-nunta", "Nuntă", "RSVP, locații, countdown, poveste și detalii personalizate."],
                    ["/invitatii-botez", "Botez", "O experiență delicată, construită în jurul familiei și evenimentului."],
                    ["/invitatii-majorat", "Majorat", "Mai liberă, mai dinamică și adaptată stilului sărbătoritului."],
                  ].map(([href, title, note]) => (
                    <Link key={href} href={href} className="group rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[16px] font-semibold">{title}</p>
                          <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">{note}</p>
                        </div>
                        <span className="text-[18px] transition group-hover:translate-x-1">→</span>
                      </div>
                    </Link>
                  ))}
                </div>

                <Link href="/cerere?service=invitation&source=porneste-invitatie" className="mt-6 flex h-14 w-full items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)]">
                  <span>Începe personalizarea</span><span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="contact" />
    </main>
  );
}
