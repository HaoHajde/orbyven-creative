import { NextResponse } from "next/server";

import { isInvitationSlug } from "@/lib/invitations/contracts";
import {
  loadPublishedInvitation,
  storeInvitationRsvp,
} from "@/lib/invitations/server";
import { claimInvitationRsvpIpQuota } from "@/lib/security/request-rate-limit";

export const runtime = "nodejs";

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 8_000) {
      return NextResponse.json({ error: "Răspunsul este prea mare." }, { status: 413 });
    }
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Format invalid." }, { status: 415 });
    }

    const raw = (await request.json()) as Record<string, unknown>;

    // Honeypot. Keep a neutral success response so automated fillers do not
    // learn which field triggered the rejection.
    if (typeof raw.website === "string" && raw.website.trim()) {
      return NextResponse.json({ ok: true });
    }

    const startedAt = typeof raw.startedAt === "number" ? raw.startedAt : 0;
    if (!startedAt || Date.now() - startedAt < 1000) {
      return NextResponse.json(
        { error: "Răspunsul a fost trimis prea repede. Încearcă din nou." },
        { status: 429 }
      );
    }

    const slug = cleanText(raw.slug, 80);
    const guestName = cleanText(raw.guestName, 120);
    const message = cleanText(raw.message, 700);
    const attending = raw.attending;
    const guestCount = Number(raw.guestCount);

    if (!isInvitationSlug(slug) || guestName.length < 2 || typeof attending !== "boolean") {
      return NextResponse.json({ error: "Completează datele RSVP." }, { status: 400 });
    }
    if (
      attending &&
      (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 12)
    ) {
      return NextResponse.json({ error: "Numărul de persoane este invalid." }, { status: 400 });
    }

    if (!(await claimInvitationRsvpIpQuota(request))) {
      return NextResponse.json(
        { error: "Prea multe răspunsuri trimise. Încearcă din nou mai târziu." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const project = await loadPublishedInvitation(slug);
    if (!project) {
      return NextResponse.json({ error: "Invitația nu este disponibilă." }, { status: 404 });
    }

    const id = await storeInvitationRsvp({
      projectId: project.id,
      guestName,
      attending,
      guestCount: attending ? guestCount : 0,
      message: message || null,
    });

    return NextResponse.json(
      { ok: true, id },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("ORBYVEN invitation RSVP error", error);
    return NextResponse.json(
      { error: "Răspunsul nu a putut fi salvat momentan. Încearcă din nou." },
      { status: 500 }
    );
  }
}
