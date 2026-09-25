import { NextResponse } from "next/server";
import {
  authorizeControlCenter,
  ControlCenterHttpError,
  requireStaffRole,
} from "@/lib/orbyven-control-center-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_AFTER_MS = 15 * 60_000;
const HEADERS = { "Cache-Control": "private, no-store" };

function respondError(error: unknown) {
  if (error instanceof ControlCenterHttpError) {
    return NextResponse.json(
      { error: error.code },
      { status: error.status, headers: HEADERS },
    );
  }
  console.error("ORBYVEN webhook recovery operation failed", error);
  return NextResponse.json(
    { error: "webhook_recovery_unavailable" },
    { status: 500, headers: HEADERS },
  );
}

/** Safe read-only signal. Do not return full Stripe payloads (customer PII). */
export async function GET(request: Request) {
  try {
    const { admin, staffRole } = await authorizeControlCenter(request);
    requireStaffRole(staffRole, ["platform_owner", "platform_admin"]);

    const { data, error } = await admin
      .from("billing_webhook_events")
      .select("provider_event_id,event_type,created_at,processing_error")
      .is("processed_at", null)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw error;
    const now = Date.now();
    const events = (data ?? []).map((event) => ({
      eventId: event.provider_event_id,
      eventType: event.event_type,
      createdAt: event.created_at,
      state: event.processing_error
        ? "retryable"
        : now - new Date(event.created_at).getTime() >= STALE_AFTER_MS
          ? "stalled"
          : "pending",
    }));
    return NextResponse.json({ events }, { headers: HEADERS });
  } catch (error) {
    return respondError(error);
  }
}

/** Explicit operator recovery. Does NOT issue invoices or replay Stripe itself. */
export async function POST(request: Request) {
  try {
    const { admin, user, staffRole } = await authorizeControlCenter(request);
    requireStaffRole(staffRole, ["platform_owner"]);

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: HEADERS });
    }
    const { eventId, reviewedProviderState } = body as {
      eventId?: unknown;
      reviewedProviderState?: unknown;
    };

    if (
      typeof eventId !== "string" ||
      !/^evt_[A-Za-z0-9]{3,100}$/.test(eventId) ||
      reviewedProviderState !== true
    ) {
      return NextResponse.json(
        { error: "provider_reconciliation_required" },
        { status: 400, headers: HEADERS },
      );
    }

    const { data: existing, error: lookupError } = await admin
      .from("billing_webhook_events")
      .select("event_type,created_at,processed_at,processing_error")
      .eq("provider_event_id", eventId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing || existing.processed_at || existing.processing_error ||
        Date.now() - new Date(existing.created_at).getTime() < STALE_AFTER_MS) {
      return NextResponse.json(
        { error: "event_not_stalled" },
        { status: 409, headers: HEADERS },
      );
    }

    // Audit first: never change financial processing state without an audit trail.
    const { error: auditError } = await admin.from("platform_audit_log").insert({
      actor_user_id: user.id,
      actor_role: staffRole,
      action: "billing.webhook_manual_recovery_requested",
      target_type: "stripe_webhook_event",
      target_id: eventId,
      metadata: {
        event_type: existing.event_type,
        reviewed_provider_state: true,
        previous_state: "stalled",
      },
    });
    if (auditError) throw auditError;

    const { data: claimed, error: claimError } = await admin
      .from("billing_webhook_events")
      .update({ processing_error: "Operator-approved recovery; await Stripe redelivery." })
      .eq("provider_event_id", eventId)
      .is("processed_at", null)
      .is("processing_error", null)
      .lt("created_at", new Date(Date.now() - STALE_AFTER_MS).toISOString())
      .select("provider_event_id")
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) {
      return NextResponse.json(
        { error: "recovery_race_detected" },
        { status: 409, headers: HEADERS },
      );
    }
    return NextResponse.json(
      { ok: true, next: "Reconcile and resend the event in Stripe test/live dashboard." },
      { headers: HEADERS },
    );
  } catch (error) {
    return respondError(error);
  }
}
