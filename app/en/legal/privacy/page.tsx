import type { Metadata } from "next";

import LegalDocumentEn, { LegalSection } from "@/components/legal/LegalDocumentEn";
import { legalConfig, operatorLabel } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "https://orbyven.com/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDocumentEn
      eyebrow="GDPR"
      title="Privacy Policy"
      intro="How we use personal data when you visit ORBYVEN, contact us, create an account or use platform services."
    >
      <LegalSection title="1. Who processes the data">
        <p>
          For data required to manage accounts, the commercial relationship, security and billing, the controller is {operatorLabel()}. Privacy questions can be sent to {legalConfig.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection title="2. Data we collect">
        <p>
          We may process identification and contact data, company and role information, requests submitted through forms, authentication and security data, technical information about service usage and data required for billing. ORBYVEN does not store complete card details; payment processing is delegated to the payment provider.
        </p>
      </LegalSection>

      <LegalSection title="3. Purposes and legal bases">
        <p>
          We use data for pre-contractual steps and contract performance, account and subscription administration, platform security, legal obligations and legitimate interests. For marketing or optional tracking technologies, we rely on consent where consent is legally required.
        </p>
      </LegalSection>

      <LegalSection title="4. Data processed for ORBYVEN clients">
        <p>
          When a client uses ORBYVEN modules to process personal data about its own customers, employees or contacts, the client is generally the controller and ORBYVEN acts as processor. These situations are governed by the DPA.
        </p>
      </LegalSection>

      <LegalSection title="5. Providers and subprocessors">
        <p>
          We may use providers for hosting, databases, authentication, payments, email, monitoring and billing. Providers receive only the access required to deliver their service and are subject to applicable contractual obligations. The main provider categories and services are maintained in the DPA.
        </p>
      </LegalSection>

      <LegalSection title="6. International transfers">
        <p>
          If a provider processes data outside the European Economic Area, ORBYVEN seeks to use an appropriate legal transfer mechanism, such as an adequacy decision or Standard Contractual Clauses, as applicable.
        </p>
      </LegalSection>

      <LegalSection title="7. Data retention">
        <p>
          We retain data for as long as necessary for the contractual relationship, security and legal obligations. Operational data from a closed workspace may be deleted after the export/closure period, generally 30 days, while financial and accounting records are retained for the periods required by law.
        </p>
      </LegalSection>

      <LegalSection title="8. AI tools and user-provided content">
        <p>
          Some optional tools may process messages and instructions to generate or modify a website. Before commercial activation, providers, data categories, locations and retention periods must be documented in the relevant notice and agreements. Do not enter sensitive data or confidential information without an appropriate legal basis and authorization.
        </p>
      </LegalSection>

      <LegalSection title="9. Data subject rights">
        <p>
          Subject to the GDPR, you may request access, rectification, erasure, restriction, portability or objection, and you may withdraw consent where processing is based on consent. You also have the right to lodge a complaint with the competent supervisory authority.
        </p>
      </LegalSection>
    </LegalDocumentEn>
  );
}
