import { notFound } from "next/navigation";
import EcosystemPreview from "@/components/EcosystemPreview";

/** Local-only, fixture-based demo. Never exposed in a Vercel build. */
export default function EcosystemPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <EcosystemPreview />;
}
