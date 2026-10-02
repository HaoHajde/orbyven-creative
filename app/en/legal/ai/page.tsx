import type { Metadata } from "next";

import LegalDocumentEn, { LegalSection } from "@/components/legal/LegalDocumentEn";

export const metadata: Metadata = {
  title: "AI Feature Information",
  alternates: { canonical: "https://orbyven.com/legal/ai" },
};

export default function AiTransparencyPage() {
  return (
    <LegalDocumentEn
      eyebrow="AI · Pre-launch"
      title="AI-assisted features"
      intro="ORBYVEN Intelligence combines deterministic logic, confirmation-based actions and optional AI functions. This page explains what is automated and what data may leave the platform only when an external feature is enabled."
    >
      <LegalSection title="AI interaction">
        <p>
          ORBYVEN may answer directly from authorized workspace data and prepare proposed actions. A proposal is not executed until the user explicitly confirms it. Web Design Specialist may modify a validated preview, while external language functions remain separate and optional. Automated messages or outputs do not constitute legal, tax or professional advice.
        </p>
      </LegalSection>

      <LegalSection title="Reviewing results">
        <p>
          Users must review content before publishing or confirming it, including proposals, prices, commercial claims, documents, images, licenses and personal data. Agent Actions display a proposal before execution; old or expired actions are not restored as executable buttons from conversation history.
        </p>
      </LegalSection>

      <LegalSection title="Data and providers">
        <p>
          Do not enter passwords, API keys, special-category personal data or confidential documents into chat. The deterministic ORBYVEN engine processes application data locally. If the Selective Language Layer is enabled, the user’s request together with the canonical response and strictly necessary facts may be sent to the configured external provider for rewriting. The feature is disabled by default and is not enabled merely because an API key exists. Content entered on behalf of a company must be authorized.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          Use of the system does not guarantee exclusivity of generated results. Uploading an image, logo or text does not prove the right to reproduce or publish it. Protected content and client rights are handled under the applicable contract and law.
        </p>
      </LegalSection>

      <LegalSection title="General rules">
        <p>
          General platform terms, privacy obligations and any applicable acceptable-use rules continue to apply. Commercial release of AI functionality remains subject to audit of the final production flow.
        </p>
      </LegalSection>
    </LegalDocumentEn>
  );
}
