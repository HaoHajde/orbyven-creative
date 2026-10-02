import type { Metadata } from "next";

import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import { legalConfig, operatorLabel } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "https://www.orbyven.com/legal/privacy" },
};

export default function PrivacyPageEn() {
  return (
    <LegalDocument
      locale="en"
      eyebrow="GDPR"
      title="Privacy Policy"
      intro="How we use personal data when you visit ORBYVEN, contact us, create an account or use the platform services."
    >
      <LegalSection title="Important note">
        <p>
          This English version is provided for convenience. If a wording difference appears between this translation and the Romanian legal document, the Romanian version is the controlling reference.
        </p>
      </LegalSection>

      <LegalSection title="1. Who processes the data">
        <p>
          For data required to manage accounts, commercial relationships, security and billing, the controller is {operatorLabel()}. Privacy questions can be sent to {legalConfig.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection title="2. Data we may collect">
        <p>
          We may process identification and contact data, company and role information, requests submitted through forms, authentication and security data, technical information about service usage and data required for billing. Complete payment card data is not stored by ORBYVEN; payment processing is delegated to the payment provider.
        </p>
      </LegalSection>

      <LegalSection title="3. Purposes and legal bases">
        <p>
          We use data for pre-contractual steps and contract performance, account and subscription management, platform security, legal obligations and legitimate interests. Marketing or optional tracking technologies rely on consent where consent is required.
        </p>
      </LegalSection>

      <LegalSection title="4. Data processed for ORBYVEN customers">
        <p>
          When a customer uses ORBYVEN modules to process data relating to its own customers, employees or contacts, the customer is generally the controller and ORBYVEN acts as processor. These situations are governed by the applicable DPA.
        </p>
      </LegalSection>

      <LegalSection title="5. Providers and subprocessors">
        <p>
          We may use providers for hosting, databases, authentication, payments, email, monitoring and billing. Providers receive only the access required for their service and are subject to applicable contractual obligations. Main categories and services are documented in the DPA.
        </p>
      </LegalSection>

      <LegalSection title="6. International transfers">
        <p>
          If a provider processes data outside the European Economic Area, ORBYVEN seeks to use an appropriate legal mechanism, such as an adequacy decision or standard contractual clauses, where applicable.
        </p>
      </LegalSection>

      <LegalSection title="7. Data retention">
        <p>
          Data is retained for as long as required for the contractual relationship, security and legal obligations. Operational data from a closed workspace may be deleted after the export/closure period, generally 30 days, while accounting records are retained for the periods required by law.
        </p>
      </LegalSection>

      <LegalSection title="8. AI tools and user-provided content">
        <p>
          Some optional tools may process messages and instructions to generate or modify a website. Before commercial activation, providers, data categories, locations and retention periods must be documented in the relevant notice and agreements. Do not enter sensitive or confidential data without an appropriate legal basis and authorization.
        </p>
      </LegalSection>

      <LegalSection title="9. Your rights">
        <p>
          Subject to the GDPR, you may request access, rectification, deletion, restriction, portability or objection and may withdraw consent where processing relies on consent. You may also lodge a complaint with the competent supervisory authority.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
