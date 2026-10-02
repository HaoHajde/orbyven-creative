import type { Metadata } from "next";

import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import { legalConfig, operatorLabel } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  alternates: { canonical: "https://www.orbyven.com/legal/terms" },
};

export default function TermsPageEn() {
  return (
    <LegalDocument
      locale="en"
      eyebrow="General terms"
      title="Terms and Conditions"
      intro="General framework for access to the ORBYVEN website, platform and services. Specific subscription terms are supplemented by the Subscription Terms and any signed Order Form."
    >
      <LegalSection title="Important note">
        <p>
          This English version is provided for convenience. If a wording difference appears between this translation and the Romanian legal document, the Romanian version is the controlling reference.
        </p>
      </LegalSection>

      <LegalSection title="1. Operator and acceptance">
        <p>
          {legalConfig.isComplete
            ? `ORBYVEN services are provided by ${operatorLabel()}.`
            : "ORBYVEN is a project in preparation; the merchant identity is not yet finalized and this notice does not represent an active commercial offer."} When a commercially available service is contracted, the documents valid and communicated at the time of contracting apply.
        </p>
        <p>
          Merchant identity, legal form and tax information must be communicated before contracting; a later change of commercial entity does not automatically transfer existing contracts. Contact: {legalConfig.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection title="2. ORBYVEN services">
        <p>
          ORBYVEN may provide websites, digital experiences, SaaS workspaces and portable software modules. The exact service scope, plan, modules, deadlines and any custom development may be defined in an offer or Order Form.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and security">
        <p>
          The customer is responsible for authorized users within its organization, for keeping credentials confidential and for informing ORBYVEN if unauthorized access is suspected. Roles and permissions are applied per organization.
        </p>
      </LegalSection>

      <LegalSection title="4. Intellectual property">
        <p>
          The ORBYVEN platform, reusable code, design system, engine and portable modules remain the property of ORBYVEN or its licensors. A subscription grants a limited, non-exclusive and non-transferable right of use for the duration of the service.
        </p>
        <p>
          The customer retains rights in its own brand, materials, domain and data. Custom deliveries may be subject to specific licensing or assignment rules agreed in writing.
        </p>
      </LegalSection>

      <LegalSection title="5. Availability and changes">
        <p>
          ORBYVEN aims to maintain service continuity but may perform maintenance, updates and changes required for security or product development. A guaranteed SLA applies only when expressly included in the customer&apos;s contract.
        </p>
      </LegalSection>

      <LegalSection title="6. Liability">
        <p>
          To the extent permitted by law and for B2B customers, ORBYVEN&apos;s total liability for direct damages related to the service is limited to the fees paid for the affected service during the 12 months preceding the event. This limitation does not apply where applicable law prohibits exclusion or limitation of liability.
        </p>
      </LegalSection>

      <LegalSection title="7. Termination and data">
        <p>
          When a service ends, access may be restricted in accordance with the commercial terms. ORBYVEN will provide a reasonable data export period where the functionality supports it and may delete operational data after 30 days, except information that must be retained by law or to defend legal rights.
        </p>
      </LegalSection>

      <LegalSection title="8. Governing law">
        <p>
          The contractual relationship is governed by Romanian law. The parties will first attempt an amicable resolution, and if no solution is reached, competent courts apply according to law and the applicable contract.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
