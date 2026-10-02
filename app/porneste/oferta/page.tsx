"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import SiteHeader from "@/components/SiteHeader";
import { publicThemeVars, themeBodyBackground } from "@/lib/orbyven-theme";
import {
  PUBLIC_CHECKOUT_IS_DEMO,
  PUBLIC_OFFERS,
  isPublicOfferId,
  type PublicOfferId,
} from "@/lib/commerce/public-offers";

type Theme = "light" | "dark";

const OFFER_META: Record<
  PublicOfferId,
  {
    eyebrow: string;
    headline: string;
    accent: string;
    highlights: Array<{ label: string; value: string }>;
  }
> = {
  invitation: {
    eyebrow: "INVITAȚIE ONLINE",
    headline: "Un singur link. Tot evenimentul.",
    accent: "#d8c3ff",
    highlights: [
      { label: "RSVP", value: "Live" },
      { label: "Locații", value: "Maps" },
      { label: "Countdown", value: "Auto" },
      { label: "Design", value: "Custom" },
    ],
  },
  web: {
    eyebrow: "WEB DESIGN",
    headline: "Website-ul intră live. Dashboard-ul îl testezi 30 zile.",
    accent: "#9bb8ff",
    highlights: [
      { label: "Website", value: "Custom" },
      { label: "Responsive", value: "100%" },
      { label: "SEO", value: "Core" },
      { label: "Dashboard", value: "30 zile" },
    ],
  },
  advanced: {
    eyebrow: "ADVANCED",
    headline: "Website + Dashboard + module adaptate business-ului.",
    accent: "#b59cff",
    highlights: [
      { label: "Dashboard", value: "Pro" },
      { label: "Module", value: "Custom" },
      { label: "Automatizări", value: "Smart" },
      { label: "AI", value: "Assist" },
    ],
  },
};

function InvitationPreview() {
  return (
    <div className="relative h-full min-h-[460px] overflow-hidden rounded-[30px] border border-white/10 bg-[#17101d]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(242,216,255,.22),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(133,93,255,.18),transparent_30%),linear-gradient(150deg,#26162b,#100c16_56%,#09090d)]" />
      <div className="absolute left-1/2 top-[9%] h-[73%] w-[56%] -translate-x-1/2 rotate-[-3deg] rounded-[30px] border border-white/14 bg-[#f6f0e9] shadow-[0_42px_100px_rgba(0,0,0,.36)]">
        <div className="absolute inset-4 rounded-[23px] border border-[#4d3655]/10" />
        <div className="absolute left-1/2 top-[17%] -translate-x-1/2 text-center text-[#332539]">
          <p className="text-[8px] font-bold uppercase tracking-[.28em]">SAVE THE DATE</p>
          <p className="mt-5 font-serif text-[34px] italic leading-none">A & M</p>
          <p className="mt-5 text-[7px] uppercase tracking-[.2em] text-[#6e5a74]">SATURDAY · 18:00</p>
        </div>
        <div className="absolute bottom-[18%] left-1/2 flex -translate-x-1/2 gap-2">
          {["RSVP","MAPS","STORY"].map((item) => (
            <span key={item} className="rounded-full border border-[#513b59]/14 px-3 py-1.5 text-[6px] font-semibold tracking-[.12em] text-[#513b59]">{item}</span>
          ))}
        </div>
      </div>
      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-[18px] border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-xl">
        <span className="text-[9px] font-semibold text-white/70">Preview invitație</span>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-[7px] font-bold text-white/55">MOBILE + WEB</span>
      </div>
    </div>
  );
}

function WebPreview() {
  return (
    <div className="relative h-full min-h-[460px] overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0d14]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(71,106,255,.24),transparent_30%),linear-gradient(145deg,#0e1320,#090b11_60%,#08090d)]" />
      <div className="absolute left-[7%] right-[7%] top-[9%] h-[62%] overflow-hidden rounded-[26px] border border-white/12 bg-[#0d1018] shadow-[0_36px_90px_rgba(0,0,0,.38)]">
        <div className="flex h-9 items-center justify-between border-b border-white/8 px-4">
          <div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-white/14"/><span className="h-2 w-2 rounded-full bg-white/14"/><span className="h-2 w-2 rounded-full bg-white/14"/></div>
          <span className="text-[7px] font-semibold tracking-[.17em] text-white/28">ORBYVEN SITE PREVIEW</span>
        </div>
        <div className="relative p-6">
          <div className="absolute right-[8%] top-[5%] h-44 w-44 rounded-full bg-[#5f68ff]/18 blur-[50px]" />
          <div className="relative max-w-[72%]">
            <div className="h-2.5 w-20 rounded-full bg-[#a58bff]/75"/>
            <div className="mt-6 h-9 w-[94%] rounded-[8px] bg-white/88"/>
            <div className="mt-2 h-9 w-[70%] rounded-[8px] bg-white/88"/>
            <div className="mt-5 h-2.5 w-[88%] rounded-full bg-white/14"/>
            <div className="mt-2 h-2.5 w-[65%] rounded-full bg-white/10"/>
            <div className="mt-7 h-11 w-36 rounded-full bg-white/90"/>
          </div>
        </div>
      </div>
      <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] border border-white/10 bg-white/[.045] p-4 backdrop-blur-xl">
          <p className="text-[8px] font-bold uppercase tracking-[.14em] text-white/35">Website</p>
          <p className="mt-2 text-[19px] font-semibold">Responsive</p>
        </div>
        <div className="rounded-[18px] border border-[#a58bff]/20 bg-[#a58bff]/10 p-4 backdrop-blur-xl">
          <p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#cfc2ff]/60">Dashboard</p>
          <p className="mt-2 text-[19px] font-semibold text-[#d8ceff]">30 zile</p>
        </div>
      </div>
    </div>
  );
}

function AdvancedPreview() {
  return (
    <div className="relative h-full min-h-[460px] overflow-hidden rounded-[30px] border border-[#a58bff]/16 bg-[#0d0a17]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(145,102,255,.28),transparent_30%),radial-gradient(circle_at_18%_70%,rgba(75,70,238,.16),transparent_38%),linear-gradient(150deg,#18102c,#0d0b17_58%,#09090d)]" />
      <div className="absolute left-[6%] right-[6%] top-[8%] h-[70%] overflow-hidden rounded-[26px] border border-white/10 bg-[#0c0b13]/92 p-5 shadow-[0_38px_100px_rgba(0,0,0,.42)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[#b9a6ff]">ORBYVEN WORKSPACE</p>
            <p className="mt-1 text-[13px] font-semibold text-white/82">Business OS</p>
          </div>
          <span className="rounded-full border border-[#a58bff]/20 bg-[#a58bff]/10 px-3 py-2 text-[7px] font-bold text-[#cfc2ff]">ADVANCED</span>
        </div>

        <div className="mt-5 grid grid-cols-[.30fr_.70fr] gap-3">
          <div className="grid gap-2">
            {["Overview","Clienți","Lucrări","Oferte","Automatizări"].map((item,index)=>(
              <div key={item} className={`rounded-[9px] border px-2.5 py-2.5 text-[7px] font-semibold ${index===0?"border-[#a58bff]/25 bg-[#a58bff]/12 text-white":"border-white/7 bg-white/[.025] text-white/42"}`}>{item}</div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["CRM","24"],["Calendar","08"],["Devize","12"],["Stoc","31"],["AI","ON"],["Custom","+"]]
              .map(([item,value])=>(
                <div key={item} className="rounded-[12px] border border-white/8 bg-white/[.035] p-3">
                  <p className="text-[7px] uppercase tracking-[.12em] text-white/30">{item}</p>
                  <p className="mt-3 text-[19px] font-semibold tracking-[-.05em]">{value}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 rounded-[18px] border border-[#a58bff]/18 bg-[#a58bff]/10 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[9px] font-semibold text-[#d9ceff]">Module personalizabile</span>
          <span className="text-[8px] text-white/42">CRM · Stoc · Oferte · Automatizări · Custom</span>
        </div>
      </div>
    </div>
  );
}

function PlanVisual({ offerId }: { offerId: PublicOfferId }) {
  if (offerId === "invitation") return <InvitationPreview />;
  if (offerId === "web") return <WebPreview />;
  return <AdvancedPreview />;
}

function OfferPageContent() {
  const searchParams = useSearchParams();
  const rawOffer = searchParams.get("offer");
  const offerId: PublicOfferId | null = isPublicOfferId(rawOffer) ? rawOffer : null;
  const [theme, setTheme] = useState<Theme>("light");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = localStorage.getItem("studio-theme");
      const next: Theme =
        saved === "dark" || saved === "light"
          ? saved
          : matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      setTheme(next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = themeBodyBackground(next);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = themeBodyBackground(next);
      return next;
    });
  };

  if (!offerId) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#09090d] px-5 text-white">
        <div className="max-w-lg text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a58bff]">ORBYVEN</p>
          <h1 className="mt-4 text-[40px] font-semibold tracking-[-.055em]">Oferta nu a fost găsită.</h1>
          <Link href="/contact" className="mt-7 inline-flex h-12 items-center rounded-full bg-white px-5 text-[12px] font-semibold text-[#09090d]">Înapoi la planuri</Link>
        </div>
      </main>
    );
  }

  const offer = PUBLIC_OFFERS[offerId];
  const meta = OFFER_META[offerId];

  return (
    <main
      data-orbyven-theme={theme}
      style={{
        ...publicThemeVars(theme),
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
        background:
          theme === "dark"
            ? "radial-gradient(circle at 72% 8%,rgba(126,93,255,.16),transparent 24%),linear-gradient(180deg,#0b0912 0%,#09090d 78%)"
            : "radial-gradient(circle at 72% 8%,rgba(126,93,255,.10),transparent 24%),linear-gradient(180deg,#fbfaff 0%,#f7f7fa 78%)",
      }}
      className="orbyven-theme-shell relative min-h-screen overflow-x-hidden text-[var(--text)] antialiased"
    >
      <SiteHeader theme={theme} compact={false} activePage="contact" onToggleTheme={toggleTheme} />

      <section className="relative z-10 px-5 pb-16 pt-28 sm:px-6 md:px-10 md:pb-24 md:pt-36">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 text-[10px] font-semibold text-[var(--muted)] transition hover:text-[var(--text)]">← Înapoi la planuri</Link>
            {PUBLIC_CHECKOUT_IS_DEMO ? (
              <span className="rounded-full border border-amber-300/20 bg-amber-300/[.07] px-3 py-2 text-[8px] font-bold text-amber-500">MOD TEST / DEMO</span>
            ) : null}
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
            <div>
              <PlanVisual offerId={offerId} />
            </div>

            <div className="flex flex-col rounded-[32px] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] p-6 shadow-[0_30px_100px_rgba(0,0,0,.13)] backdrop-blur-2xl sm:p-8 lg:p-10">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.18em]" style={{ color: meta.accent }}>{meta.eyebrow}</p>
                <h1 className="mt-4 max-w-[700px] text-[clamp(40px,4.8vw,66px)] font-semibold leading-[.91] tracking-[-.065em]">{meta.headline}</h1>

                <div className="mt-7 flex items-end gap-3">
                  <span className="text-[64px] font-semibold leading-none tracking-[-.08em]">{offer.priceLei}</span>
                  <span className="pb-1.5 text-[11px] font-semibold text-[var(--muted)]">
                    {offerId === "invitation" ? "lei · o singură dată" : offerId === "web" ? "lei acum" : "lei / lună"}
                  </span>
                </div>

                {offerId === "web" ? (
                  <div className="mt-3 inline-flex rounded-full border border-[#a58bff]/20 bg-[var(--accent-soft)] px-3 py-2 text-[9px] font-semibold text-[var(--home-violet)]">
                    30 zile Dashboard incluse · apoi {PUBLIC_OFFERS.web.recurringLei} lei/lună
                  </div>
                ) : null}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {meta.highlights.map((item) => (
                  <div key={item.label} className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <p className="text-[8px] font-bold uppercase tracking-[.14em] text-[var(--muted-2)]">{item.label}</p>
                    <p className="mt-3 text-[20px] font-semibold tracking-[-.04em]">{item.value}</p>
                  </div>
                ))}
              </div>

              {offerId === "advanced" ? (
                <div className="mt-4 rounded-[20px] border border-dashed border-[#a58bff]/28 bg-[#a58bff]/[.055] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-semibold text-[var(--home-violet)]">Module personalizabile</span>
                    <span className="text-[9px] text-[var(--muted)]">adaptate fluxurilor firmei</span>
                  </div>
                </div>
              ) : null}

              <div className="mt-auto pt-8">
                <button
                  type="button"
                  onClick={() => setConfirmed((current) => !current)}
                  className={`flex w-full items-center justify-between rounded-[20px] border p-4 text-left transition ${confirmed ? "border-[#a58bff]/45 bg-[var(--accent-soft)]" : "border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid h-7 w-7 place-items-center rounded-full border text-[10px] font-bold ${confirmed ? "border-[#a58bff] bg-[#a58bff] text-[#09090d]" : "border-[var(--border-strong)] text-transparent"}`}>✓</span>
                    <div>
                      <p className="text-[11px] font-semibold">Confirm selecția</p>
                      <p className="mt-1 text-[9px] text-[var(--muted)]">{offer.name}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold">{offer.shortPrice}</span>
                </button>

                <Link
                  href={confirmed ? `/porneste/plata?offer=${offerId}` : "#"}
                  aria-disabled={!confirmed}
                  onClick={(event) => {
                    if (!confirmed) event.preventDefault();
                  }}
                  className={`mt-3 flex h-14 w-full items-center justify-between rounded-[18px] px-5 text-[14px] font-semibold transition ${confirmed ? "bg-[var(--button)] text-[var(--button-text)] hover:-translate-y-0.5" : "cursor-not-allowed bg-[var(--surface-2)] text-[var(--muted-2)]"}`}
                >
                  <span>{PUBLIC_CHECKOUT_IS_DEMO ? "Confirmă și testează în Stripe" : "Confirmă și continuă la plată"}</span>
                  <span>→</span>
                </Link>

                <p className="mt-3 text-center text-[9px] leading-5 text-[var(--muted-2)]">
                  {PUBLIC_CHECKOUT_IS_DEMO
                    ? "Vei fi redirecționat către Stripe Sandbox. Nu se încasează bani reali."
                    : "Vei fi redirecționat către Stripe Checkout pentru finalizarea plății."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(["invitation", "web", "advanced"] as PublicOfferId[]).map((id) => (
              <Link
                key={id}
                href={`/porneste/oferta?offer=${id}`}
                className={`rounded-[20px] border px-4 py-4 transition ${id === offerId ? "border-[#a58bff]/35 bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_60%,transparent)] hover:bg-[var(--surface)]"}`}
              >
                <p className="text-[9px] font-bold uppercase tracking-[.13em] text-[var(--muted-2)]">{OFFER_META[id].eyebrow}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="truncate text-[11px] font-semibold">{PUBLIC_OFFERS[id].name}</span>
                  <span className="shrink-0 text-[12px] font-semibold">{PUBLIC_OFFERS[id].shortPrice}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function OfferPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#09090d]" />}>
      <OfferPageContent />
    </Suspense>
  );
}
