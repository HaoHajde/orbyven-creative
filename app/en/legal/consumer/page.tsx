import type { Metadata } from "next";
import Link from "next/link";

import LegalDocumentEn, { LegalSection } from "@/components/legal/LegalDocumentEn";

export const metadata: Metadata = {
  title: "Consumer Information — Pre-launch",
  description: "Preliminary information about ORBYVEN digital services intended for consumers.",
  alternates: { canonical: "https://orbyven.com/legal/consumer" },
};

export default function ConsumerInformationPage() {
  return (
    <LegalDocumentEn
      eyebrow="B2C · Preliminary document"
      title="Consumer information"
      intro="This page is a pre-launch notice, not a complete B2C contractual offer. Digital invitations for individuals cannot be sold automatically until the legal identity, pricing, delivery terms and payment flows are finalized."
    >
      <LegalSection title="Merchant identity">
        <p>
          The company name, tax ID, Trade Register number, registered office and VAT status must be displayed and verified before contracts are concluded with consumers. The brand identity does not replace the merchant’s legal name.
        </p>
      </LegalSection>

      <LegalSection title="What is included in the service">
        <p>
          The individual offer must specify the delivery format (a website accessible by link), any RSVP form, domain, hosting period, number of revisions, deadlines, technical requirements, support and what happens when the service ends.
        </p>
      </LegalSection>

      <LegalSection title="Prices, payment and confirmation">
        <p>
          The total price, applicable taxes, any recurring costs, and the timing and method of payment will be displayed before any order carrying an obligation to pay. The client will receive contract confirmation on a durable medium as required by law.
        </p>
      </LegalSection>

      <LegalSection title="Withdrawal and early performance">
        <p>
          The statutory withdrawal right and its exceptions are determined under Romanian Emergency Ordinance no. 34/2014 according to the nature of the service. We do not assume that every customized invitation or digital service automatically excludes withdrawal. Where the law requires it, starting performance during the withdrawal period and any subsequent loss of the right require the consumer’s express request and separate confirmation, together with confirmation of the contract on a durable medium.
        </p>
        <p>
          Until this flow is implemented, any early start is agreed individually through legally validated documents; this page does not ask consumers to waive statutory rights.
        </p>
      </LegalSection>

      <LegalSection title="Complaints and alternative dispute resolution">
        <p>
          Complaints may be sent to the contact address displayed in the legal center. Consumers may also consult the Romanian consumer authority’s{" "}
          <a href="https://reclamatiisal.anpc.ro" target="_blank" rel="noopener noreferrer" className="underline">
            SAL platform
          </a>
          . This notice does not limit statutory rights or access to authorities or courts.
        </p>
      </LegalSection>

      <LegalSection title="Guest privacy">
        <p>
          An RSVP form may process names, attendance choices and other information. For each invitation, GDPR roles, the guest privacy notice, organizer access and the deletion period must be identified. See the{" "}
          <Link href="/legal/privacy" className="underline">
            ORBYVEN Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalDocumentEn>
  );
}
