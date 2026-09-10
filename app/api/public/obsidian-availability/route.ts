import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const ORGANIZATION_SLUG = "obsidian-moments-360";
const TIME_ZONE = "Europe/Bucharest";
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

type CalendarRow = {
  start_at: string;
  end_at: string;
};

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function localDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${read("year")}-${read("month")}-${read("day")}`;
}

function nextDateKey(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month") ?? "";

  if (!MONTH_PATTERN.test(month)) {
    return NextResponse.json({ error: "invalid_month" }, { status: 400 });
  }

  const client = createServiceClient();
  if (!client) {
    return NextResponse.json(
      { configured: false, month, busyDates: [], timezone: TIME_ZONE },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const [yearString, monthString] = month.split("-");
    const year = Number(yearString);
    const monthIndex = Number(monthString) - 1;

    if (year < 2020 || year > 2100) {
      return NextResponse.json({ error: "invalid_year" }, { status: 400 });
    }

    const { data: organization, error: organizationError } = await client
      .from("organizations")
      .select("id")
      .eq("slug", ORGANIZATION_SLUG)
      .maybeSingle();

    if (organizationError) throw organizationError;
    if (!organization?.id) {
      return NextResponse.json(
        { configured: false, month, busyDates: [], timezone: TIME_ZONE },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Widen the UTC query slightly so events near Romanian midnight are not missed.
    const rangeStart = new Date(Date.UTC(year, monthIndex, -1, 0, 0, 0));
    const rangeEnd = new Date(Date.UTC(year, monthIndex + 1, 3, 0, 0, 0));

    const { data, error } = await client
      .from("calendar_events")
      .select("start_at,end_at")
      .eq("organization_id", organization.id)
      .eq("status", "scheduled")
      .in("event_type", ["appointment", "work"])
      .lt("start_at", rangeEnd.toISOString())
      .gt("end_at", rangeStart.toISOString());

    if (error) throw error;

    const busyDates = new Set<string>();

    for (const event of (data ?? []) as CalendarRow[]) {
      const start = new Date(event.start_at);
      const endExclusive = new Date(new Date(event.end_at).getTime() - 1);
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(endExclusive.getTime())) continue;

      let cursor = localDateKey(start);
      const lastDate = localDateKey(endExclusive);
      let guard = 0;

      while (cursor <= lastDate && guard < 370) {
        if (cursor.startsWith(`${month}-`)) busyDates.add(cursor);
        cursor = nextDateKey(cursor);
        guard += 1;
      }
    }

    return NextResponse.json(
      {
        configured: true,
        month,
        busyDates: [...busyDates].sort(),
        timezone: TIME_ZONE,
        checkedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[obsidian-availability]", error);
    return NextResponse.json(
      { configured: false, month, busyDates: [], timezone: TIME_ZONE },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
