import { NextResponse } from "next/server";

import { isPublicOfferId } from "@/lib/commerce/public-offers";
import { createPublicOfferCheckoutSession } from "@/lib/billing/stripe-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { offer?: unknown };
    if (!isPublicOfferId(body.offer)) {
      return NextResponse.json({ error: "Oferta selectată nu este validă." }, { status: 400 });
    }

    const session = await createPublicOfferCheckoutSession(body.offer);
    if (!session.url) {
      throw new Error("Stripe Checkout did not return a redirect URL.");
    }

    return NextResponse.json(
      { url: session.url },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    console.error("Public checkout unavailable.", message);

    const sandboxFallback =
      message.includes("not configured for commercial use") ||
      message.includes("commercial checkout is paused");

    return NextResponse.json(
      {
        error: sandboxFallback
          ? "Checkout-ul comercial nu este activ încă."
          : "Plata nu este disponibilă momentan. Încearcă din nou în câteva momente.",
        code: sandboxFallback ? "SANDBOX_FALLBACK" : "CHECKOUT_UNAVAILABLE",
      },
      { status: 503 }
    );
  }
}
