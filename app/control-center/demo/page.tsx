import ControlCenterCompactDemo from "@/components/ControlCenterCompactDemo";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const ORBYVEN_DEMO_PROJECT_ID = "prj_rFLn1Xp3MbmTsIkvLYP7U5qTh74b";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ControlCenterDemoPage({ searchParams }: { searchParams: SearchParams }) {
  const allowed =
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_PROJECT_ID === ORBYVEN_DEMO_PROJECT_ID;

  if (!allowed) notFound();

  const params = await searchParams;
  const rawTab = one(params.tab);
  const rawCategory = one(params.category);
  const rawQueue = one(params.queue);
  const rawPanel = one(params.panel);

  const tab = (["overview", "integrity", "legal", "platform"] as const).includes(rawTab as never)
    ? (rawTab as "overview" | "integrity" | "legal" | "platform")
    : "overview";
  const category = (["all", "code", "security", "seo", "legal"] as const).includes(rawCategory as never)
    ? (rawCategory as "all" | "code" | "security" | "seo" | "legal")
    : "all";
  const queue = (["all", "manual", "guardian"] as const).includes(rawQueue as never)
    ? (rawQueue as "all" | "manual" | "guardian")
    : "all";
  const panel = (["none", "legal-new", "tenant-new"] as const).includes(rawPanel as never)
    ? (rawPanel as "none" | "legal-new" | "tenant-new")
    : "none";

  return (
    <ControlCenterCompactDemo
      tab={tab}
      category={category}
      queue={queue}
      guardianQueued={one(params.guardian) === "queued"}
      panel={panel}
    />
  );
}
