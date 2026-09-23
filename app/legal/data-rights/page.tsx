import type { Metadata } from "next";
import Link from "next/link";
import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Exercitarea drepturilor GDPR",
  description: "Cum poți solicita accesul, rectificarea, ștergerea sau alte drepturi privind datele personale la ORBYVEN.",
};

export default function DataRightsPage() {
  return (
    <LegalDocument
      eyebrow="GDPR · Solicitări"
      title="Drepturile tale asupra datelor"
      intro="Un punct de contact pentru solicitări referitoare la datele gestionate direct de ORBYVEN. Dacă datele aparțin workspace-ului unei alte firme, vom analiza rolul nostru și vom coopera cu operatorul relevant."
    >
      <LegalSection title="Ce poți solicita">
        <p>În condițiile GDPR, poți solicita acces, rectificare, ștergere, restricționare, portabilitate, opoziție sau retragerea consimțământului pentru prelucrările întemeiate pe acesta. Drepturile nu sunt absolute și se aplică în funcție de contextul și temeiul prelucrării.</p>
      </LegalSection>
      <LegalSection title="Cum ne contactezi">
        <p>Trimite solicitarea la <a className="underline" href={`mailto:${legalConfig.contactEmail}?subject=Solicitare%20drepturi%20GDPR%20ORBYVEN`}>{legalConfig.contactEmail}</a>. Indică tipul solicitării și contextul (de exemplu, cerere de ofertă, cont sau invitație RSVP). Nu trimite parole, copii ale actelor de identitate, date medicale sau alte informații sensibile în mesajul inițial.</p>
        <p>Dacă există îndoieli rezonabile privind identitatea, putem solicita informații suplimentare proporționale, printr-un canal adecvat. Nu vom divulga date personale unei persoane neverificate.</p>
      </LegalSection>
      <LegalSection title="Termene și răspuns">
        <p>Răspundem fără întârzieri nejustificate și, în principiu, în cel mult o lună de la primirea solicitării. Dacă este necesară o prelungire permisă de GDPR, te informăm în prima lună și explicăm motivul. Poți depune o plângere la autoritatea de supraveghere competentă și te poți adresa instanțelor, conform legii.</p>
      </LegalSection>
      <LegalSection title="Date prelucrate pentru un client ORBYVEN">
        <p>Dacă ai transmis date unui client ORBYVEN (de exemplu, către o firmă sau un organizator de eveniment), acel client stabilește de regulă scopul prelucrării. Putem transmite solicitarea către operatorul corespunzător sau îi putem oferi asistență, fără a expune datele altor organizații.</p>
        <p>Consultă și <Link href="/legal/privacy" className="underline">Politica de Confidențialitate</Link>.</p>
      </LegalSection>
    </LegalDocument>
  );
}
