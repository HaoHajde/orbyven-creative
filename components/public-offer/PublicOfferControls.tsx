"use client";

import Link from "next/link";
import { PUBLIC_CHECKOUT_IS_DEMO, type PublicOfferId } from "@/lib/commerce/public-offers";
import { Glyph } from "@/components/public-offer/PublicOfferVisuals";

export function QuickModules({
  offerId,
  activeFeature,
  onSelect,
}: {
  offerId: PublicOfferId;
  activeFeature: string | null;
  onSelect: (feature: string) => void;
}) {
  const items =
    offerId === "invitation"
      ? ["RSVP", "Locații", "Countdown", "Galerie"]
      : offerId === "web"
        ? ["Website", "Responsive", "SEO", "Dashboard"]
        : ["CRM", "Task-uri", "Calendar", "AI", "Custom"];

  return (
    <div className="mt-9 flex max-w-[620px] flex-wrap gap-3">
      {items.map((item) => (
        <button
          type="button"
          key={item}
          onClick={() => onSelect(item)}
          className={`group flex h-[52px] items-center gap-3 rounded-[16px] border px-3.5 text-white shadow-[0_12px_30px_rgba(0,0,0,.28)] transition hover:-translate-y-0.5 ${activeFeature === item ? "border-[#b49aff]/78 bg-[#8f6cff]/18 shadow-[0_0_28px_rgba(126,93,255,.18)]" : "border-[#9c78ff]/30 bg-[#0b0c12]/96 hover:border-[#b39cff]/68 hover:bg-[#161126]"}`}
        >
          <span className={`transition ${activeFeature === item ? "text-white" : "text-[#b9a6ff] group-hover:text-white"}`}><Glyph kind={item} /></span>
          <span className="text-[9px] font-semibold text-white/78">{item}</span>
        </button>
      ))}
    </div>
  );
}

export function ModulesStrip({
  offerId,
  activeFeature,
  onSelect,
}: {
  offerId: PublicOfferId;
  activeFeature: string | null;
  onSelect: (feature: string) => void;
}) {
  const modules = ({
    invitation: ["RSVP", "Locații", "Countdown", "Poveste", "Galerie", "Maps"],
    web: ["Website", "Responsive", "SEO", "Dashboard", "Clienți", "Task-uri"],
    advanced: ["CRM", "Task-uri", "Calendar", "Devize", "Stoc", "Automatizări", "Custom"],
  } satisfies Record<PublicOfferId, string[]>)[offerId];
  return (
    <div className="relative overflow-x-auto rounded-[28px] border border-[#a183ff]/30 bg-[#07080d]/98 p-3.5 text-white shadow-[0_30px_90px_rgba(0,0,0,.42),0_0_42px_rgba(126,93,255,.08)] ring-1 ring-white/[.02] [scrollbar-width:none]">
      <div className="relative flex min-w-max items-center gap-2">
        <div className="flex h-[64px] w-[190px] shrink-0 items-center gap-3 px-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#8d68ff]/12 text-[#b9a6ff]"><Glyph kind={offerId === "invitation" ? "RSVP" : offerId === "web" ? "Website" : "Dashboard"} /></span>
          <span className="text-[13px] font-semibold">Module incluse</span>
        </div>
        {modules.map((module, index) => (
          <div key={module} className="flex items-center">
            <span className="mx-1 h-[2px] w-6 bg-[linear-gradient(90deg,transparent,#9e7aff,#6c5cff,#9e7aff,transparent)] shadow-[0_0_10px_rgba(143,108,255,.65)]" />
            <button
              type="button"
              onClick={() => onSelect(module)}
              className={`flex h-[64px] min-w-[132px] items-center justify-center gap-3 rounded-[18px] border px-4 transition ${activeFeature === module || (offerId === "web" && module === "Dashboard" && !activeFeature) ? "border-[#a789ff]/90 bg-[#8f6cff]/20 shadow-[0_0_38px_rgba(128,89,255,.22)]" : "border-white/11 bg-[#0e0f16] hover:border-[#aa8dff]/55 hover:bg-[#171224]"}`}
            >
              <span className="text-[#a78dff]"><Glyph kind={module} /></span>
              <span className="text-[10px] font-medium">{module}</span>
            </button>
            {index === modules.length - 1 ? <span className="w-2" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CheckoutPanel({
  offerId,
  confirmed,
  onToggle,
}: {
  offerId: PublicOfferId;
  confirmed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-[28px] border border-[#a183ff]/30 bg-[#07080d]/98 p-3 text-white shadow-[0_28px_90px_rgba(0,0,0,.42),0_0_42px_rgba(126,93,255,.07)] ring-1 ring-white/[.02] lg:grid-cols-[1.08fr_.92fr]">
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none]">
        {[
          ["1", "Alegi", "Devize"],
          ["2", "Confirmi", "Task-uri"],
          ["3", "Stripe Checkout", "Website"],
        ].map(([step, label, icon], index) => (
          <div key={step} className="flex shrink-0 items-center">
            <div className="relative flex h-[82px] w-[168px] items-center gap-3 rounded-[18px] border border-white/11 bg-[#0f1017] px-4 shadow-[0_14px_34px_rgba(0,0,0,.24)]">
              <span className={`absolute -top-3 left-1/2 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border text-[11px] font-bold ${index === 0 ? "border-[#8f6cff] bg-[#8f6cff] text-white shadow-[0_0_24px_rgba(143,108,255,.5)]" : "border-[#8f6cff]/50 bg-[#16101f] text-[#bdaaff]"}`}>{step}</span>
              <span className="mt-2 text-[#b39aff]"><Glyph kind={icon} /></span>
              <span className="mt-2 text-[11px] font-medium">{label}</span>
            </div>
            {index < 2 ? <span className="mx-3 text-[#8f6cff]">→</span> : null}
          </div>
        ))}
      </div>

      <div className="border-t border-white/8 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <button
          type="button"
          onClick={onToggle}
          className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-4 text-left transition ${confirmed ? "border-[#a98dff]/70 bg-[#8f6cff]/16 shadow-[0_0_28px_rgba(126,93,255,.12)]" : "border-white/9 bg-[#0f1017] hover:border-[#a98dff]/30 hover:bg-[#15111f]"}`}
        >
          <div className="flex items-center gap-3">
            <span className={`grid h-9 w-9 place-items-center rounded-full border text-[13px] font-bold ${confirmed ? "border-[#9d7aff] bg-[#8f6cff] text-white shadow-[0_0_24px_rgba(143,108,255,.45)]" : "border-white/12 text-transparent"}`}>✓</span>
            <span className="text-[13px] font-semibold">Confirmă selecția</span>
          </div>
          {PUBLIC_CHECKOUT_IS_DEMO ? <span className="rounded-full border border-white/8 bg-white/[.025] px-3 py-2 text-[7px] font-bold text-white/45">MOD TEST / DEMO</span> : null}
        </button>

        <Link
          href={confirmed ? `/porneste/plata?offer=${offerId}` : "#"}
          aria-disabled={!confirmed}
          onClick={(event) => {
            if (!confirmed) event.preventDefault();
          }}
          className={`mt-2 flex h-[48px] w-full items-center justify-center gap-4 rounded-[15px] text-[13px] font-semibold transition ${confirmed ? "bg-[linear-gradient(90deg,#b66fff_0%,#7b54ff_52%,#5b8dff_100%)] text-white shadow-[0_0_46px_rgba(122,76,255,.46)] ring-1 ring-white/15 hover:brightness-110" : "cursor-not-allowed bg-white/[.045] text-white/25"}`}
        >
          <span>Confirmă și continuă</span><span>→</span>
        </Link>
        <div className="mt-3 flex items-center justify-center gap-2 text-[8px] text-white/30">
          <span>▣</span><span>Stripe Checkout</span>
        </div>
      </div>
    </div>
  );
}

