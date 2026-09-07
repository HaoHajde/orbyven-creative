import type { Metadata } from "next";

import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import { operatorLabel } from "@/lib/legal-config";

export const metadata: Metadata = { title: "Data Processing Agreement" };

export default function DpaPage() {
  return (
    <LegalDocument
      eyebrow="Art. 28 GDPR"
      title="Data Processing Agreement"
      intro="Termenii de prelucrare a datelor atunci când clientul controlează scopul și mijloacele prelucrării, iar ORBYVEN procesează datele în numele său."
    >
      <LegalSection title="1. Rolurile părților">
        <p>
          Clientul este operator pentru datele introduse în modulele sale atunci când stabilește scopurile prelucrării. {operatorLabel()} acționează ca persoană împuternicită și procesează aceste date numai pentru furnizarea și securizarea serviciului, conform instrucțiunilor documentate ale clientului.
        </p>
      </LegalSection>

      <LegalSection title="2. Obiect și durată">
        <p>
          Prelucrarea acoperă găzduirea, organizarea, transmiterea, afișarea, backup-ul și operațiunile necesare funcțiilor contractate și durează cât timp serviciul este activ, plus perioada limitată necesară exportului, ștergerii sau obligațiilor legale.
        </p>
      </LegalSection>

      <LegalSection title="3. Categorii de date și persoane">
        <p>
          În funcție de module, datele pot privi clienți, lead-uri, angajați, colaboratori sau furnizori ai clientului și pot include date de contact, activitate comercială, programări, documente sau alte informații introduse de client. Clientul nu trebuie să folosească ORBYVEN pentru categorii speciale de date fără o evaluare și un acord adecvat.
        </p>
      </LegalSection>

      <LegalSection title="4. Confidențialitate și securitate">
        <p>
          ORBYVEN limitează accesul la persoanele autorizate, folosește mecanisme de autentificare și izolare multi-tenant, aplică RLS unde este relevant și menține măsuri tehnice și organizatorice proporționale cu riscul.
        </p>
      </LegalSection>

      <LegalSection title="5. Subprocesori">
        <p>
          Pentru furnizarea serviciului pot fi folosiți subprocesori din categoriile hosting/deployment, bază de date și autentificare, procesare plăți, email/mesagerie și facturare. În arhitectura curentă aceste servicii pot include Vercel, Supabase, Stripe și, după activare, furnizorul românesc de facturare. Schimbările materiale vor fi documentate.
        </p>
      </LegalSection>

      <LegalSection title="6. Asistență GDPR">
        <p>
          ORBYVEN va oferi asistență rezonabilă pentru cereri ale persoanelor vizate, evaluări de securitate și obligațiile clientului privind incidentele, ținând cont de natura prelucrării și informațiile disponibile.
        </p>
      </LegalSection>

      <LegalSection title="7. Incidente">
        <p>
          ORBYVEN va informa clientul fără întârzieri nejustificate după confirmarea unei încălcări a securității datelor personale care afectează date procesate în numele clientului și va furniza informațiile rezonabil disponibile pentru gestionarea incidentului.
        </p>
      </LegalSection>

      <LegalSection title="8. Returnare și ștergere">
        <p>
          La încetarea serviciului, datele vor fi returnate sau puse la dispoziție pentru export acolo unde este fezabil și apoi șterse conform politicii de retenție, cu excepția cazului în care păstrarea este impusă de lege.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
