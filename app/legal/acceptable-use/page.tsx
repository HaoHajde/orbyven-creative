import type { Metadata } from "next";

import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";

export const metadata: Metadata = { title: "Acceptable Use Policy" };

export default function AcceptableUsePage() {
  return (
    <LegalDocument
      eyebrow="Platform rules"
      title="Acceptable Use Policy"
      intro="Reguli minime pentru protejarea clienților, infrastructurii și utilizatorilor ORBYVEN."
    >
      <LegalSection title="Este interzis">
        <p>
          Folosirea serviciului pentru activități ilegale, fraudă, malware, phishing, acces neautorizat, încălcarea drepturilor altor persoane, spam sau transmiterea intenționată a unor volume care afectează stabilitatea platformei.
        </p>
        <p>
          Este interzisă încercarea de a ocoli izolarea dintre organizații, controalele de acces, rate limit-urile, autentificarea sau alte măsuri de securitate.
        </p>
      </LegalSection>

      <LegalSection title="Date și conținut">
        <p>
          Clientul trebuie să aibă un temei legal pentru datele și conținutul încărcat și să configureze accesul utilizatorilor proprii în mod responsabil. ORBYVEN poate solicita eliminarea conținutului care creează un risc legal sau de securitate.
        </p>
      </LegalSection>

      <LegalSection title="Măsuri de protecție">
        <p>
          În caz de risc urgent, abuz sau încălcare gravă, ORBYVEN poate limita sau suspenda temporar funcția afectată. Atunci când este rezonabil, clientul va fi informat și i se va oferi posibilitatea de remediere.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
