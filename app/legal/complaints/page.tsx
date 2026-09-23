import type { Metadata } from "next";
import Link from "next/link";
import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Reclamații și solicitări consumatori",
  description: "Punct de contact pentru reclamații, solicitări de retragere și informații despre SAL.",
};

export default function ComplaintsPage() {
  return (
    <LegalDocument
      eyebrow="Consumatori · Pre-lansare"
      title="Reclamații și retragere"
      intro="Informații pentru contactarea ORBYVEN cu privire la servicii, comenzi și drepturile consumatorilor. Această pagină nu activează automat comercializarea B2C."
    >
      <LegalSection title="Cum ne scrii">
        <p>Poți transmite o sesizare către <a className="underline" href={`mailto:${legalConfig.contactEmail}?subject=Sesizare%20ORBYVEN`}>{legalConfig.contactEmail}</a>. Menționează, când există, numărul comenzii ori oferta, serviciul vizat și ce soluție soliciți. Nu trimite date de card sau parole.</p>
      </LegalSection>
      <LegalSection title="Retragerea dintr-un contract B2C">
        <p>Dacă ai încheiat un contract căruia i se aplică dreptul legal de retragere, poți comunica în mod neechivoc decizia de retragere către adresa de mai sus. Înainte de activarea comenzilor B2C vom pune la dispoziție și modelul de formular aplicabil, precum și informațiile complete despre termen, excepții și eventualele condiții privind începerea prestării în perioada de retragere.</p>
        <p>Nu afirmăm că orice serviciu personalizat sau digital exclude automat dreptul de retragere. Aplicabilitatea se verifică în funcție de contract și de OUG nr. 34/2014. Vezi <Link className="underline" href="/legal/consumer">informarea preliminară pentru consumatori</Link>.</p>
      </LegalSection>
      <LegalSection title="Soluționare alternativă a litigiilor">
        <p>Poți consulta <a href="https://reclamatiisal.anpc.ro" target="_blank" rel="noopener noreferrer" className="underline">platforma SAL a ANPC</a>. Această opțiune nu înlătură posibilitatea de a te adresa autorităților ori instanțelor competente și nu constituie o declarație că ORBYVEN este deja înregistrat drept comerciant.</p>
      </LegalSection>
    </LegalDocument>
  );
}
