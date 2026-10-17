import ControlCenterIntegrityDemo from "@/components/ControlCenterIntegrityDemo";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const ORBYVEN_DEMO_PROJECT_ID = "prj_rFLn1Xp3MbmTsIkvLYP7U5qTh74b";

export default function ControlCenterIntegrityDemoPage() {
  const allowed =
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_PROJECT_ID === ORBYVEN_DEMO_PROJECT_ID;

  if (!allowed) {
    notFound();
  }

  return <ControlCenterIntegrityDemo />;
}
