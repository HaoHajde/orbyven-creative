"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type Theme = "light" | "dark";

function vars(theme: Theme) {
  return {
    "--bg": theme === "dark" ? "#09090d" : "#f8f8fb",
    "--surface": theme === "dark" ? "#101014" : "#ffffff",
    "--surface-2": theme === "dark" ? "#17171c" : "#f1f1f5",
    "--text": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--muted": theme === "dark" ? "#aaaab2" : "#66666f",
    "--muted-2": theme === "dark" ? "#777781" : "#878790",
    "--border": theme === "dark" ? "rgba(255,255,255,.085)" : "rgba(18,18,24,.075)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,.15)" : "rgba(18,18,24,.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--button-text": theme === "dark" ? "#09090d" : "#ffffff",
    "--accent": "#4b46ee",
    "--home-violet": "#a58bff",
    "--accent-soft": theme === "dark" ? "rgba(126,93,255,.14)" : "rgba(112,78,255,.09)",
  } as CSSProperties;
}

export default function InvitationStartPage() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = localStorage.getItem("studio-theme");
      const next: Theme = saved === "dark" || saved === "light" ? saved : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#09090d" : "#f8f8fb";
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => setTheme((current) => {
    const next = current === "light" ? "dark" : "light";
    localStorage.setItem("studio-theme", next);
    document.documentElement.style.colorScheme = next;
    document.body.style.backgroundColor = next === "dark" ? "#09090d" : "#f8f8fb";
    return next;
  });

  return (
    <main
      style={{
        ...vars(theme),
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
        background: theme === "dark"
          ? "radial-gradient(circle at 75% 12%,rgba(119,83,255,.16),transparent 25%),linear-gradient(180deg,#0b0912,#09090d 72%)"
          : "radial-gradient(circle at 75% 12%,rgba(119,83,255,.10),transparent 25%),linear-gradient(180deg,#fbfaff,#f7f7fa 72%)",
      }}
      className="relative min-h-screen overflow-x-hidden text-[var(--text)] antialiased"
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
              <div
                className="relative min-h-[480px] bg-cover bg-center"
                style={{
                  backgroundImage: "linear-gradient(180deg,rgba(7,6,10,.08),rgba(7,6,10,.78)),url('/demo/nunta/diana-florin/couple1.jpeg')",
                }}
              >
                <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
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
