"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { PUBLIC_OFFERS, isPublicOfferId, type PublicOfferId } from "@/lib/commerce/public-offers";

function PaymentRedirectContent() {
  const searchParams = useSearchParams();
  const rawOffer = searchParams.get("offer");
  const offerId: PublicOfferId | null = isPublicOfferId(rawOffer) ? rawOffer : null;
  const offer = offerId ? PUBLIC_OFFERS[offerId] : null;
  const [status, setStatus] = useState<"loading" | "error">(() => offerId ? "loading" : "error");
  const [error, setError] = useState("");

  const openCheckout = async () => {
    if (!offerId) return;
    try {
      const response = await fetch("/api/public-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer: offerId }),
      });
      const payload = await response.json() as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Plata nu este disponibilă momentan.");
      }
      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Plata nu este disponibilă momentan.");
      setStatus("error");
    }
  };

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      await Promise.resolve();
      if (cancelled || !offerId) return;
      void openCheckout();
    };
    void start();
    return () => {
      cancelled = true;
    };
    // openCheckout intentionally uses the current validated offer id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerId]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#09090d] px-5 text-[#f5f5f7]">
      <div className="w-full max-w-[560px] rounded-[30px] border border-white/10 bg-white/[.035] p-7 shadow-[0_36px_120px_rgba(0,0,0,.35)] sm:p-9">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a58bff]">ORBYVEN · CHECKOUT</p>
        <h1 className="mt-4 text-[38px] font-semibold leading-[.94] tracking-[-.06em]">
          {status === "loading" ? "Deschidem plata securizată." : "Checkout indisponibil momentan."}
        </h1>

        {offer ? (
          <div className="mt-7 rounded-[22px] border border-white/10 bg-white/[.045] p-5">
            <p className="text-[12px] font-semibold">{offer.name}</p>
            <p className="mt-2 text-[28px] font-semibold tracking-[-.055em]">{offer.shortPrice}</p>
            <p className="mt-1 text-[10px] text-white/45">{offer.priceNote}</p>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#a58bff]" />
          </div>
        ) : (
          <>
            <p className="mt-5 text-[12px] leading-6 text-white/52">{error || "Oferta selectată nu este validă."}</p>
            {offerId ? (
              <button onClick={() => { setStatus("loading"); setError(""); void openCheckout(); }} className="mt-6 flex h-13 w-full items-center justify-center rounded-[17px] bg-white px-5 text-[13px] font-semibold text-[#09090d]">
                Încearcă din nou
              </button>
            ) : null}
            <Link href="/contact" className="mt-3 flex h-12 items-center justify-center rounded-[17px] border border-white/12 text-[12px] font-semibold text-white/70">
              Înapoi la oferte
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function PaymentRedirectPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#09090d]" />}>
      <PaymentRedirectContent />
    </Suspense>
  );
}
