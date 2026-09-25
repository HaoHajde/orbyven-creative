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
        <p>Dacă ai încheiat un contract căruia i se aplică dreptul legal de retragere, poți comunica în mod neechivoc decizia de retragere către adresa de mai sus. Poți folosi și modelul orientativ de mai jos; o declarație neechivocă transmisă prin email este de asemenea posibilă, atunci când dreptul de retragere este aplicabil. Înainte de activarea comenzilor B2C trebuie completate informarea contractuală privind termenul, excepțiile și condițiile de începere a prestării.</p>
        <p>Nu afirmăm că orice serviciu personalizat sau digital exclude automat dreptul de retragere. Aplicabilitatea se verifică în funcție de contract și de OUG nr. 34/2014. Vezi <Link className="underline" href="/legal/consumer">informarea preliminară pentru consumatori</Link>.</p>
      </LegalSection>
      <LegalSection title="Model de declarație de retragere (unde dreptul este aplicabil)">
        <div className="rounded-xl border border-black/10 bg-black/[0.02] p-5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
          <p>Către: [denumirea și adresa legală a comerciantului, de completat înainte de lansare]</p>
          <p>Vă informez prin prezenta că mă retrag din contractul privind furnizarea următorului serviciu/conținut digital: [descriere].</p>
          <p>Comandat la data de: [data] · Numărul comenzii: [dacă există]</p>
          <p>Numele consumatorului: [nume] · Adresa consumatorului: [adresă] · Data: [data]</p>
        </div>
        <p>Trimite declarația la adresa de contact de mai sus. Modelul nu restrânge dreptul de a utiliza o altă declarație neechivocă și nu stabilește că toate contractele intră sub incidența dreptului de retragere.</p>
      </LegalSection>
      <LegalSection title="Soluționare alternativă a litigiilor">
        <p>Poți consulta <a href="https://reclamatiisal.anpc.ro" target="_blank" rel="noopener noreferrer" className="underline">platforma SAL a ANPC</a>. Această opțiune nu înlătură posibilitatea de a te adresa autorităților ori instanțelor competente și nu constituie o declarație că ORBYVEN este deja înregistrat drept comerciant.</p>
      </LegalSection>
    </LegalDocument>
  );
}
