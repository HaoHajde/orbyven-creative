"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { PUBLIC_OFFERS, isPublicOfferId } from "@/lib/commerce/public-offers";

function SuccessContent() {
  const searchParams = useSearchParams();
  const rawOffer = searchParams.get("offer");
  const offerId = isPublicOfferId(rawOffer) ? rawOffer : null;
  const offer = offerId ? PUBLIC_OFFERS[offerId] : null;

  return (
    <main className="grid min-h-screen place-items-center bg-[#09090d] px-5 text-[#f5f5f7]">
      <div className="w-full max-w-[640px] rounded-[32px] border border-white/10 bg-white/[.035] p-7 shadow-[0_36px_120px_rgba(0,0,0,.35)] sm:p-10">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/12 text-[18px] font-bold text-emerald-400">✓</span>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[.18em] text-[#a58bff]">PLATĂ FINALIZATĂ</p>
        <h1 className="mt-4 text-[44px] font-semibold leading-[.92] tracking-[-.065em]">Perfect. De aici construim.</h1>
        {offer ? (
          <div className="mt-7 rounded-[22px] border border-white/10 bg-white/[.045] p-5">
            <p className="text-[13px] font-semibold">{offer.name}</p>
            <p className="mt-2 text-[10px] leading-5 text-white/50">{offer.checkoutNote}</p>
          </div>
        ) : null}
        <p className="mt-6 text-[12px] leading-6 text-white/55">
          Plata este confirmată de Stripe. Următorul pas este configurarea proiectului; detaliile le completăm după plată, nu înainte.
        </p>
        <Link
          href={offerId ? `/cerere?source=checkout-success&offer=${offerId}` : "/cerere?source=checkout-success"}
          className="mt-7 flex h-14 items-center justify-between rounded-[18px] bg-white px-5 text-[14px] font-semibold text-[#09090d]"
        >
          <span>Continuă configurarea</span><span>→</span>
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#09090d]" />}><SuccessContent /></Suspense>;
}
