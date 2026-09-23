import type { Metadata } from "next";
import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = { title: "Informare pentru consumatori · pre-lansare" };

export default function ConsumerInformation() {
  return <LegalDocument eyebrow="B2C · informare preliminară" title="Servicii digitale pentru consumatori" intro="Informații pentru persoanele fizice interesate de invitații digitale personalizate și alte servicii ORBYVEN. Această pagină nu confirmă existența unei oferte comerciale active; condițiile contractuale complete vor fi publicate după stabilirea operatorului economic.">
    <LegalSection title="Stadiul serviciului"><p>ORBYVEN prezintă în prezent modele demonstrative și poate primi cereri de informații. Oferta finală, prețul total, tratamentul fiscal, termenul de execuție și modalitatea de plată se comunică înaintea unei comenzi obligatorii de plată. Nu există achiziție directă a invitației prin această pagină.</p></LegalSection>
    <LegalSection title="Ce va cuprinde oferta individuală"><p>Tipul invitației, personalizările incluse, numărul de revizii, durata găzduirii, caracteristicile RSVP, modul de livrare, eventualele costuri ulterioare și datele furnizorului vor fi precizate înainte de acceptarea comenzii.</p></LegalSection>
    <LegalSection title="Retragere și servicii digitale"><p>Pentru contractele la distanță se aplică, în condițiile OUG nr. 34/2014, dreptul de retragere și excepțiile legale. Simplul caracter personalizat al unui serviciu sau conținut digital nu exclude automat retragerea. Dacă se solicită începerea executării în perioada de retragere, acordul expres și informarea despre consecințele sale trebuie obținute separat în situațiile prevăzute de lege. Nu se consideră pierdut niciun drept prin simpla vizitare a site-ului.</p></LegalSection>
    <LegalSection title="Sesizări și soluționarea litigiilor"><p>Pentru întrebări și reclamații, adresa de contact este {legalConfig.contactEmail}. Informații privind soluționarea alternativă a litigiilor sunt disponibile pe <a href="https://reclamatiisal.anpc.ro" target="_blank" rel="noopener noreferrer" className="underline">platforma SAL a ANPC</a>. Această procedură nu înlătură dreptul de a sesiza instituțiile sau instanțele competente.</p></LegalSection>
    <LegalSection title="Nu există condiții B2C aprobate pentru checkout"><p>Activarea vânzării către consumatori presupune identificarea completă a profesionistului, aprobarea termenilor finali, afișarea obligației de plată și confirmarea contractului pe suport durabil. Această pagină nu trebuie folosită ca înlocuitor al acestor măsuri.</p></LegalSection>
  </LegalDocument>;
}
