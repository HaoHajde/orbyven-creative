import type { Metadata } from "next";
import Link from "next/link";

import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Legal Center",
  alternates: { canonical: "https://www.orbyven.com/legal" },
};

export default function LegalCenterPageEn() {
  return (
    <LegalDocument
      locale="en"
      eyebrow="ORBYVEN legal"
      title="Legal Center"
      intro="English-language access to the main public legal documents currently available for ORBYVEN."
    >
      <LegalSection title="Available documents">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/legal/terms" className="rounded-[20px] border border-current/10 p-5 font-semibold transition hover:opacity-65">
            Terms and Conditions →
          </Link>
          <Link href="/legal/privacy" className="rounded-[20px] border border-current/10 p-5 font-semibold transition hover:opacity-65">
            Privacy Policy →
          </Link>
        </div>
      </LegalSection>
      <LegalSection title="Translation notice">
        <p>
          English documents are provided for convenience. Where a translated wording differs from the Romanian legal document, the Romanian version remains the controlling reference.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
