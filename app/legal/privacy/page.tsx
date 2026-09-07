import type { Metadata } from "next";

import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import { legalConfig, operatorLabel } from "@/lib/legal-config";

export const metadata: Metadata = { title: "Politica de Confidențialitate" };

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="GDPR"
      title="Politica de Confidențialitate"
      intro="Cum folosim datele personale când vizitezi ORBYVEN, ne contactezi, creezi un cont sau folosești serviciile platformei."
    >
      <LegalSection title="1. Cine prelucrează datele">
        <p>
          Pentru datele necesare administrării contului, relației comerciale, securității și facturării, operatorul este {operatorLabel()}. Întrebările privind confidențialitatea pot fi trimise la {legalConfig.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection title="2. Date colectate">
        <p>
          Putem prelucra date de identificare și contact, date despre companie și rol, cereri transmise prin formulare, date de autentificare și securitate, informații tehnice despre folosirea serviciului și date necesare facturării. Datele complete de card nu sunt stocate de ORBYVEN; procesarea plăților este delegată furnizorului de plăți.
        </p>
      </LegalSection>

      <LegalSection title="3. Scopuri și temeiuri">
        <p>
          Folosim datele pentru demersuri precontractuale și executarea contractului, administrarea conturilor și abonamentelor, securitatea platformei, îndeplinirea obligațiilor legale și apărarea intereselor legitime. Pentru marketing sau tehnologii opționale de tracking folosim consimțământul atunci când acesta este necesar.
        </p>
      </LegalSection>

      <LegalSection title="4. Datele procesate pentru clienții ORBYVEN">
        <p>
          Atunci când un client folosește modulele ORBYVEN pentru a prelucra datele propriilor clienți, angajați sau contacte, clientul este de regulă operatorul, iar ORBYVEN acționează ca persoană împuternicită. Aceste situații sunt reglementate de DPA.
        </p>
      </LegalSection>

      <LegalSection title="5. Furnizori și subprocessori">
        <p>
          Putem folosi furnizori pentru hosting, baze de date, autentificare, plăți, email, monitorizare și facturare. Furnizorii primesc numai accesul necesar serviciului lor și sunt supuși obligațiilor contractuale aplicabile. Lista de categorii și principalele servicii este menținută în DPA.
        </p>
      </LegalSection>

      <LegalSection title="6. Transferuri internaționale">
        <p>
          Dacă un furnizor prelucrează date în afara Spațiului Economic European, ORBYVEN urmărește folosirea unui mecanism legal adecvat, precum o decizie de adecvare sau clauze contractuale standard, după caz.
        </p>
      </LegalSection>

      <LegalSection title="7. Păstrarea datelor">
        <p>
          Păstrăm datele cât timp sunt necesare pentru relația contractuală, securitate și obligațiile legale. Datele operaționale ale unui workspace închis pot fi șterse după perioada de export/închidere, de regulă 30 de zile, în timp ce documentele financiar-contabile se păstrează conform termenelor legale aplicabile.
        </p>
      </LegalSection>

      <LegalSection title="8. Drepturile persoanei vizate">
        <p>
          În condițiile GDPR poți solicita acces, rectificare, ștergere, restricționare, portabilitate sau opoziție și îți poți retrage consimțământul atunci când prelucrarea se bazează pe consimțământ. Ai și dreptul de a depune o plângere la autoritatea de supraveghere competentă.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
