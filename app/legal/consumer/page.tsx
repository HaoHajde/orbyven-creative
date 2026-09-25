import type { Metadata } from "next";
import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Informare consumatori — pre-lansare",
  description: "Informații preliminare despre serviciile digitale ORBYVEN destinate consumatorilor.",
};

export default function ConsumerInformationPage() {
  return (
    <LegalDocument
      eyebrow="B2C · Document preliminar"
      title="Informații pentru consumatori"
      intro="Această pagină este o informare de pre-lansare, nu o ofertă contractuală B2C completă. Invitațiile digitale pentru persoane fizice nu pot fi comercializate automat până la definitivarea identității juridice, tarifelor, termenelor și fluxurilor de plată."
    >
      <LegalSection title="Identitatea comerciantului">
        <p>Datele societății, CUI, numărul Registrului Comerțului, sediul și regimul TVA trebuie afișate și verificate înainte de încheierea contractelor cu consumatorii. Identitatea de brand nu înlocuiește denumirea legală a comerciantului.</p>
      </LegalSection>
      <LegalSection title="Ce este inclus în serviciu">
        <p>Oferta individuală trebuie să precizeze formatul livrării (website accesibil prin link), eventualul formular RSVP, domeniul, perioada de găzduire, numărul de revizii, termenele, cerințele tehnice, suportul și ce se întâmplă la încetarea serviciului.</p>
      </LegalSection>
      <LegalSection title="Prețuri, plată și confirmare">
        <p>Prețul total, taxele aplicabile, orice cost recurent, momentul și metoda plății vor fi afișate înainte de orice comandă cu obligație de plată. Clientul va primi confirmarea contractului pe un suport durabil, în condițiile legii.</p>
      </LegalSection>
      <LegalSection title="Retragere și executare anticipată">
        <p>Dreptul legal de retragere și excepțiile se stabilesc potrivit OUG nr. 34/2014 în funcție de natura prestației. Nu presupunem că orice invitație personalizată sau orice serviciu digital exclude automat retragerea. În situațiile în care legea o cere, începerea prestării în perioada de retragere și pierderea ulterioară a dreptului necesită acordul expres și confirmarea distinctă a consumatorului, precum și confirmarea contractului pe suport durabil.</p>
        <p>Până la implementarea acestui flux, orice începere anticipată se stabilește individual, prin documente validate juridic; pagina de față nu solicită renunțarea la drepturi.</p>
      </LegalSection>
      <LegalSection title="Reclamații și soluționare alternativă">
        <p>Reclamațiile pot fi transmise la adresa de contact afișată în centrul juridic. Consumatorii pot consulta și <a href="https://reclamatiisal.anpc.ro" target="_blank" rel="noopener noreferrer" className="underline">platforma SAL a ANPC</a>. Această informare nu limitează drepturile legale și accesul la autorități sau instanțe.</p>
      </LegalSection>
      <LegalSection title="Confidențialitatea invitaților">
        <p>Un formular RSVP poate prelucra nume, opțiuni de participare și alte informații. Pentru fiecare invitație trebuie identificate rolurile GDPR, informarea invitaților, accesul organizatorilor și termenul de ștergere. Vezi <Link href="/legal/privacy" className="underline">confidențialitatea ORBYVEN</Link>.</p>
      </LegalSection>
    </LegalDocument>
  );
}
