"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type CSSProperties } from "react";

import SiteHeader from "@/components/SiteHeader";
import { HeroVisual } from "@/components/public-offer/PublicOfferVisuals";
import { CheckoutPanel, ModulesStrip, QuickModules } from "@/components/public-offer/PublicOfferControls";
import {  PUBLIC_OFFERS,
  isPublicOfferId,
  type PublicOfferId,
} from "@/lib/commerce/public-offers";

type Theme = "light" | "dark";

type VisualMeta = {
  eyebrow: string;
  titleTop: string;
  titleAccent: string;
  priceSuffix: string;
  priceDetail?: string;
  modules: string[];
};

const VISUAL_META: Record<PublicOfferId, VisualMeta> = {
  invitation: {
    eyebrow: "INVITAȚIE ONLINE",
    titleTop: "Invitație online",
    titleAccent: "personalizată",
    priceSuffix: "lei / plată unică",
    modules: ["RSVP", "Locații", "Countdown", "Poveste", "Galerie", "Maps"],
  },
  web: {
    eyebrow: "WEB DESIGN",
    titleTop: "Website-ul tău +",
    titleAccent: "30 zile Dashboard",
    priceSuffix: "lei acum",
    priceDetail: "apoi 499 lei / lună după 30 zile",
    modules: ["Website", "Responsive", "SEO", "Dashboard", "Clienți", "Task-uri"],
  },
  advanced: {
    eyebrow: "ADVANCED",
    titleTop: "Web Design + Dashboard +",
    titleAccent: "Module Personalizabile",
    priceSuffix: "lei / lună",
    modules: ["CRM", "Task-uri", "Calendar", "Devize", "Stoc", "Automatizări", "Custom"],
  },
};

function themeVars(theme: Theme) {
  return {
    "--bg": theme === "dark" ? "#08080c" : "#f8f8fb",
    "--surface": theme === "dark" ? "#101014" : "#ffffff",
    "--surface-2": theme === "dark" ? "#17171c" : "#f1f1f5",
    "--text": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--muted": theme === "dark" ? "#aaaab2" : "#66666f",
    "--muted-2": theme === "dark" ? "#777781" : "#878790",
    "--border": theme === "dark" ? "rgba(255,255,255,.085)" : "rgba(18,18,24,.075)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,.15)" : "rgba(18,18,24,.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--button-text": theme === "dark" ? "#09090d" : "#ffffff",
    "--accent": "#7c5cff",
    "--home-violet": "#a58bff",
    "--accent-soft": theme === "dark" ? "rgba(126,93,255,.14)" : "rgba(112,78,255,.09)",
  } as CSSProperties;
}

function OfferPageContent() {
  const searchParams = useSearchParams();
  const rawOffer = searchParams.get("offer");
  const offerId: PublicOfferId | null = isPublicOfferId(rawOffer) ? rawOffer : null;
  const [theme, setTheme] = useState<Theme>("dark");
  const [confirmed, setConfirmed] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

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
      document.body.style.backgroundColor = next === "dark" ? "#08080c" : "#f8f8fb";
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const selectFeature = (feature: string) => {
    setActiveFeature((current) => (current === feature ? null : feature));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveFeature(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#08080c" : "#f8f8fb";
      return next;
    });
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setConfirmed(false);
      setActiveFeature(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [offerId]);

  if (!offerId) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08080c] px-5 text-white">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a58bff]">ORBYVEN</p>
          <h1 className="mt-4 text-[40px] font-semibold tracking-[-.055em]">Oferta nu a fost găsită.</h1>
          <Link href="/contact" className="mt-7 inline-flex h-12 items-center rounded-full bg-white px-5 text-[12px] font-semibold text-[#09090d]">Înapoi la planuri</Link>
        </div>
      </main>
    );
  }

  const offer = PUBLIC_OFFERS[offerId];
  const meta = VISUAL_META[offerId];

  return (
    <main
      style={{
        ...themeVars(theme),
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
        background:
          theme === "dark"
            ? "radial-gradient(circle at 72% 7%,rgba(113,68,255,.24),transparent 28%),radial-gradient(circle at 14% 30%,rgba(72,49,178,.13),transparent 26%),linear-gradient(180deg,#030408 0%,#05060a 46%,#030408 100%)"
            : "radial-gradient(circle at 78% 12%,rgba(112,78,255,.10),transparent 28%),linear-gradient(180deg,#fbfaff 0%,#f5f5f8 100%)",
      }}
      className="relative min-h-screen overflow-x-hidden text-[var(--text)] antialiased"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[940px] overflow-hidden">
        <div className="absolute left-[-14rem] top-[-13rem] h-[46rem] w-[46rem] rounded-full border-[76px] border-[#7c5cff]/[.095] shadow-[0_0_90px_rgba(126,93,255,.10)]" />
        <div className="absolute right-[-5%] top-[1rem] h-[42rem] w-[42rem] rounded-full bg-[#704cff]/[.15] blur-[130px]" />
        <div className="absolute left-[39%] top-[5rem] h-[38rem] w-[38rem] rounded-full border border-[#8f6cff]/[.10] shadow-[0_0_110px_rgba(126,93,255,.10)]" />
        <div className="absolute left-[41%] top-[9rem] h-[2px] w-[52%] bg-[linear-gradient(90deg,transparent,rgba(183,146,255,.72),transparent)] shadow-[0_0_36px_rgba(126,93,255,.44)]" />
      </div>

      <SiteHeader theme={theme} compact={false} activePage="contact" onToggleTheme={toggleTheme} />

      <style>{`
        @keyframes orbyven-feature-in {
          0% { opacity: 0; transform: scale(.965) translateY(8px); filter: blur(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes orbyven-float-a {
          0%,100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-7px,0); }
        }
        @keyframes orbyven-float-b {
          0%,100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,6px,0); }
        }
        @keyframes orbyven-sweep {
          0% { transform: translateX(-140%); opacity: 0; }
          20% { opacity: .8; }
          70% { opacity: .25; }
          100% { transform: translateX(220%); opacity: 0; }
        }
        .orbyven-feature-scene { animation: orbyven-feature-in .34s cubic-bezier(.16,1,.3,1) both; }
        .orbyven-float-a { animation: orbyven-float-a 6s ease-in-out infinite; }
        .orbyven-float-b { animation: orbyven-float-b 7s ease-in-out infinite; }
        .orbyven-stage-sweep { animation: orbyven-sweep 8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .orbyven-feature-scene, .orbyven-float-a, .orbyven-float-b, .orbyven-stage-sweep { animation: none !important; }
        }
        @media (min-width: 1024px) and (max-height: 900px) {
          .orbyven-offer-fit { transform: scale(.94); transform-origin: top center; width: 106.383%; margin-left: -3.1915%; }
        }
        @media (min-width: 1024px) and (max-height: 820px) {
          .orbyven-offer-fit { transform: scale(.86); width: 116.279%; margin-left: -8.1395%; }
        }
        @media (min-width: 1024px) and (max-height: 740px) {
          .orbyven-offer-fit { transform: scale(.78); width: 128.205%; margin-left: -14.1025%; }
        }
      `}</style>

      <section className="relative z-10 px-5 pb-8 pt-24 sm:px-6 md:px-10 lg:h-[calc(100svh-18px)] lg:overflow-hidden lg:pb-4 lg:pt-20">
        <div className="mx-auto max-w-[1500px]">
          <Link href="/contact" className="inline-flex items-center gap-2 text-[9px] font-semibold text-[var(--muted)] transition hover:text-[var(--text)]">← Planuri</Link>

          <div className="orbyven-offer-fit">
          <div className="orbyven-offer-stage relative mt-3 overflow-visible rounded-[32px] border border-[#9f7cff]/18 bg-[#06070b]/92 p-3 shadow-[0_42px_140px_rgba(0,0,0,.40),0_0_80px_rgba(100,62,220,.065)] ring-1 ring-white/[.018] sm:p-4 lg:p-5">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
              <div className="orbyven-stage-sweep absolute -top-[20%] h-[140%] w-[14%] rotate-[16deg] bg-[linear-gradient(90deg,transparent,rgba(183,151,255,.10),transparent)] blur-[6px]" />
            </div>
            <div className="grid items-center gap-3 lg:min-h-[430px] lg:grid-cols-[.56fr_1.44fr] xl:min-h-[455px] xl:gap-5">
              <div className="relative z-20 min-w-0 self-center py-3 lg:-mr-8 xl:py-4">
                <span className="inline-flex rounded-full border border-[#9f7cff]/65 bg-[#8f6cff]/14 px-5 py-2.5 text-[9px] font-bold tracking-[.20em] text-[#d1c5ff] shadow-[0_0_34px_rgba(137,94,255,.16)]">{meta.eyebrow}</span>

                <h1 className="mt-4 max-w-[760px] text-[clamp(46px,5.2vw,82px)] font-semibold leading-[.86] tracking-[-.08em] text-white drop-shadow-[0_12px_34px_rgba(0,0,0,.36)]">
                  {meta.titleTop}
                  <br />
                  <span className="bg-[linear-gradient(90deg,#a876ff_0%,#c783ff_48%,#8d7dff_100%)] bg-clip-text text-transparent drop-shadow-[0_0_26px_rgba(157,105,255,.12)]">{meta.titleAccent}</span>
                </h1>

                <div className="mt-5">
                  <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                    <span className="text-[clamp(50px,5vw,80px)] font-semibold leading-none tracking-[-.08em] text-white">{offer.priceLei}</span>
                    <span className="pb-1.5 text-[clamp(18px,1.8vw,30px)] font-medium text-[#b7a2ff]">{meta.priceSuffix}</span>
                  </div>
                  {meta.priceDetail ? <p className="mt-3 text-[15px] font-medium text-white/42">{meta.priceDetail}</p> : null}
                </div>

                <QuickModules offerId={offerId} activeFeature={activeFeature} onSelect={selectFeature} />
              </div>

              <div className="relative min-w-0 lg:-mr-8 xl:-mr-12">
                <div className="pointer-events-none absolute left-[10%] right-[2%] top-[8%] h-[70%] rounded-full bg-[#6d4cff]/12 blur-[70px]" />
                <div className="relative origin-center lg:scale-[1.02] xl:scale-[1.05]">
                  <HeroVisual
                    offerId={offerId}
                    activeFeature={activeFeature}
                    onCloseFeature={() => setActiveFeature(null)}
                    onSelectFeature={selectFeature}
                  />
                </div>
              </div>
            </div>

            <div className="relative z-20 mt-1">
              <ModulesStrip offerId={offerId} activeFeature={activeFeature} onSelect={selectFeature} />
            </div>
          </div>

          <div className="relative z-30 -mt-1 pt-4">
            <CheckoutPanel offerId={offerId} confirmed={confirmed} onToggle={() => setConfirmed((current) => !current)} />
          </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function OfferPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#08080c]" />}>
      <OfferPageContent />
    </Suspense>
  );
}
