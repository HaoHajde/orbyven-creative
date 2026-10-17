import ControlCenterIntegrityDemo from "@/components/ControlCenterIntegrityDemo";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ControlCenterIntegrityDemoPage() {
  const allowed =
    process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development";

  if (!allowed) {
    notFound();
  }

  return <ControlCenterIntegrityDemo />;
}
