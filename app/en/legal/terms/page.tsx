import type { Metadata } from "next";

import LegalDocumentEn, { LegalSection } from "@/components/legal/LegalDocumentEn";
import { legalConfig, operatorLabel } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  alternates: { canonical: "https://orbyven.com/legal/terms" },
};

export default function TermsPage() {
  return (
    <LegalDocumentEn
      eyebrow="General terms"
      title="Terms and Conditions"
      intro="The general framework for accessing the ORBYVEN website, platform and services. Commercial terms for a subscription are supplemented by the Subscription Terms and any signed Order Form."
    >
      <LegalSection title="1. Operator and acceptance of terms">
        <p>
          {legalConfig.isComplete
            ? `ORBYVEN services are provided by ${operatorLabel()}.`
            : "ORBYVEN is a project in preparation; the merchant identity has not yet been finalized and this notice does not constitute an active commercial offer."}{" "}
          When a commercially available service is contracted, the documents valid and communicated at the time the contract is concluded apply.
        </p>
        <p>
          The merchant identity, legal form and tax details must be communicated before contracting; a later change of the commercial entity does not automatically transfer existing contracts. Contact: {legalConfig.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection title="2. ORBYVEN services">
        <p>
          ORBYVEN may provide websites, digital experiences, SaaS workspaces and portable software modules. The exact scope of the service, plan, modules, deadlines and any custom development may be set out in a proposal or Order Form.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and security">
        <p>
          The client is responsible for authorized users within its organization, for keeping credentials confidential and for informing ORBYVEN if unauthorized access is suspected. Roles and permissions are applied per organization.
        </p>
      </LegalSection>

      <LegalSection title="4. Intellectual property">
        <p>
          The ORBYVEN platform, reusable code, design system, engine and portable modules remain the property of ORBYVEN or its licensors. A subscription grants a limited, non-exclusive and non-transferable right to use the service for the duration of the service.
        </p>
        <p>
          The client retains rights over its own brand, materials, domain and data. Custom deliveries may be subject to specific licensing or assignment rules agreed in writing.
        </p>
      </LegalSection>

      <LegalSection title="5. Availability and changes">
        <p>
          ORBYVEN aims to maintain service continuity but may perform maintenance, updates and changes required for security or product evolution. A guaranteed SLA applies only when expressly included in the client's contract.
        </p>
      </LegalSection>

      <LegalSection title="6. Liability">
        <p>
          To the extent permitted by law and for B2B clients, ORBYVEN's total liability for direct damages related to the service is limited to the fees paid for the affected service during the 12 months preceding the event. This limitation does not apply where the law prohibits exclusion or limitation of liability.
        </p>
      </LegalSection>

      <LegalSection title="7. Termination and data">
        <p>
          When a service ends, access may be restricted under the applicable commercial terms. ORBYVEN will provide a reasonable period for data export where the functionality supports it and may delete operational data after 30 days, except for information that must be retained by law or for the defense of legal rights.
        </p>
      </LegalSection>

      <LegalSection title="8. Governing law">
        <p>
          The contractual relationship is governed by Romanian law. The parties will first seek an amicable resolution of disputes; if no resolution is reached, the competent courts are determined by law and the applicable contract.
        </p>
      </LegalSection>
    </LegalDocumentEn>
  );
}
