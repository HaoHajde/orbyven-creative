import ControlCenterIntegrityDemo from "@/components/ControlCenterIntegrityDemo";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const ORBYVEN_DEMO_PROJECT_ID = "prj_rFLn1Xp3MbmTsIkvLYP7U5qTh74b";
const categories = new Set(["all", "code", "security", "seo", "legal"]);
const queues = new Set(["all", "manual", "guardian"]);

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ControlCenterIntegrityDemoPage({ searchParams }: { searchParams: SearchParams }) {
  const allowed =
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_PROJECT_ID === ORBYVEN_DEMO_PROJECT_ID;

  if (!allowed) notFound();

  const params = await searchParams;
  const rawCategory = typeof params.category === "string" ? params.category : "all";
  const rawQueue = typeof params.queue === "string" ? params.queue : "all";
  const category = categories.has(rawCategory) ? rawCategory : "all";
  const queue = queues.has(rawQueue) ? rawQueue : "all";

  return (
    <ControlCenterIntegrityDemo
      category={category as "all" | "code" | "security" | "seo" | "legal"}
      queue={queue as "all" | "manual" | "guardian"}
      guardianQueued={params.guardian === "queued"}
    />
  );
}
