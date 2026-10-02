"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { PUBLIC_CHECKOUT_IS_DEMO, PUBLIC_OFFERS, isPublicOfferId, type PublicOfferId } from "@/lib/commerce/public-offers";

const SANDBOX_PAYMENT_LINKS: Record<PublicOfferId, string> = {
  invitation: "https://buy.stripe.com/test_28E3cwaT1h1tfgNab68EM00",
  web: "https://buy.stripe.com/test_eVqbJ2aT126zfgNcje8EM01",
  advanced: "https://buy.stripe.com/test_8x29AU8KT4eH1pX9728EM02",
};

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
      const payload = await response.json() as {
        url?: string;
        error?: string;
        code?: "SANDBOX_FALLBACK" | "CHECKOUT_UNAVAILABLE";
      };

      if (response.ok && payload.url) {
        window.location.assign(payload.url);
        return;
      }

      if (payload.code === "SANDBOX_FALLBACK") {
        window.location.assign(SANDBOX_PAYMENT_LINKS[offerId]);
        return;
      }

      throw new Error("Payment is currently unavailable.");
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Payment is currently unavailable.");
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
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a58bff]">ORBYVEN · CHECKOUT</p>
          {PUBLIC_CHECKOUT_IS_DEMO ? <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-[8px] font-bold text-amber-200">TEST MODE</span> : null}
        </div>
        <h1 className="mt-4 text-[38px] font-semibold leading-[.94] tracking-[-.06em]">
          {status === "loading"
            ? PUBLIC_CHECKOUT_IS_DEMO
              ? "Opening the test checkout."
              : "Opening secure checkout."
            : "Checkout is currently unavailable."}
        </h1>

        {PUBLIC_CHECKOUT_IS_DEMO ? (
          <div className="mt-6 rounded-[18px] border border-amber-300/18 bg-amber-300/[.055] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-amber-200">No real charge</p>
            <p className="mt-2 text-[10px] leading-5 text-white/52">This is Stripe Sandbox. Do not use your real card details. Use the test card 4242 4242 4242 4242.</p>
          </div>
        ) : null}

        {offer ? (
          <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[.045] p-5">
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
            <p className="mt-5 text-[12px] leading-6 text-white/52">{error || "The selected offer is not valid."}</p>
            {offerId ? (
              <button onClick={() => { setStatus("loading"); setError(""); void openCheckout(); }} className="mt-6 flex h-13 w-full items-center justify-center rounded-[17px] bg-white px-5 text-[13px] font-semibold text-[#09090d]">
                Try again
              </button>
            ) : null}
            <Link href="/contact" className="mt-3 flex h-12 items-center justify-center rounded-[17px] border border-white/12 text-[12px] font-semibold text-white/70">
              Back to offers
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
