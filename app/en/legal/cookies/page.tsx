import type { Metadata } from "next";

import LegalDocumentEn, { LegalSection } from "@/components/legal/LegalDocumentEn";

export const metadata: Metadata = {
  title: "Cookie Policy",
  alternates: { canonical: "https://orbyven.com/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalDocumentEn
      eyebrow="Cookies & local storage"
      title="Cookie Policy"
      intro="ORBYVEN keeps optional technologies disabled by default. The consent panel is enabled only when optional cookies or technologies are introduced."
    >
      <LegalSection title="1. Strictly necessary">
        <p>
          Authentication, session security, essential preferences and user-requested functions may use strictly necessary cookies or local storage. They are not used for behavioral advertising.
        </p>
      </LegalSection>

      <LegalSection title="2. Local preferences">
        <p>
          ORBYVEN may store preferences locally, such as interface theme or cookie choices. These values help the application preserve the experience selected by the user.
        </p>
      </LegalSection>

      <LegalSection title="3. Analytics and marketing">
        <p>
          Optional analytics or marketing technologies are not enabled in the base configuration. If introduced, they must remain blocked until consent where the law requires it, and the interface will provide comparable options to accept and reject them.
        </p>
      </LegalSection>

      <LegalSection title="4. Changing your choice">
        <p>
          When the optional-cookie module is enabled, your choice is stored locally. The “Cookie preferences” option in the footer reopens the panel, and optional categories can be rejected or changed at any time. When optional technologies are disabled, the panel is not shown.
        </p>
      </LegalSection>
    </LegalDocumentEn>
  );
}
