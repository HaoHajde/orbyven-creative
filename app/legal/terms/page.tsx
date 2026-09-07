import type { Metadata } from "next";

import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import { legalConfig, operatorLabel } from "@/lib/legal-config";

export const metadata: Metadata = { title: "Termeni și Condiții" };

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Termeni generali"
      title="Termeni și Condiții"
      intro="Cadrul general pentru accesarea site-ului, platformei și serviciilor ORBYVEN. Termenii comerciali specifici unui abonament sunt completați de Termenii de abonament și de orice Order Form semnat."
    >
      <LegalSection title="1. Operator și acceptarea termenilor">
        <p>
          Serviciile ORBYVEN sunt furnizate de {operatorLabel()}. Prin folosirea serviciilor sau prin contractarea unui serviciu confirmi că ai citit și accepți documentele aplicabile versiunii contractate.
        </p>
        <p>
          Datele juridice complete ale operatorului sunt afișate în această pagină imediat ce activitatea comercială este activată. Contact: {legalConfig.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection title="2. Serviciile ORBYVEN">
        <p>
          ORBYVEN poate furniza website-uri, experiențe digitale, workspace-uri SaaS și module software portabile. Conținutul exact al serviciului, planul, modulele, termenele și eventualele dezvoltări custom pot fi stabilite într-o ofertă sau într-un Order Form.
        </p>
      </LegalSection>

      <LegalSection title="3. Conturi și securitate">
        <p>
          Clientul este responsabil pentru utilizatorii autorizați ai organizației sale, pentru păstrarea confidențialității credențialelor și pentru informarea ORBYVEN dacă suspectează acces neautorizat. Rolurile și permisiunile sunt aplicate per organizație.
        </p>
      </LegalSection>

      <LegalSection title="4. Proprietate intelectuală">
        <p>
          Platforma ORBYVEN, codul reutilizabil, design system-ul, engine-ul și modulele portabile rămân proprietatea ORBYVEN sau a licențiatorilor săi. Abonamentul acordă un drept limitat, neexclusiv și netransmisibil de utilizare pe durata serviciului.
        </p>
        <p>
          Clientul păstrează drepturile asupra brandului, materialelor, domeniului și datelor proprii. Pentru livrări custom pot exista reguli speciale de licențiere sau cesiune stabilite în scris.
        </p>
      </LegalSection>

      <LegalSection title="5. Disponibilitate și modificări">
        <p>
          ORBYVEN urmărește continuitatea serviciului, dar poate efectua mentenanță, actualizări și schimbări necesare pentru securitate sau evoluția produsului. Un SLA garantat se aplică numai dacă este inclus expres în contractul clientului.
        </p>
      </LegalSection>

      <LegalSection title="6. Răspundere">
        <p>
          În limitele permise de lege și pentru clienții B2B, răspunderea totală a ORBYVEN pentru prejudicii directe legate de serviciu este limitată la taxele plătite pentru serviciul afectat în cele 12 luni anterioare evenimentului. Limitarea nu se aplică acolo unde legea interzice excluderea sau limitarea răspunderii.
        </p>
      </LegalSection>

      <LegalSection title="7. Încetare și date">
        <p>
          La încetarea serviciului, accesul poate fi restricționat conform termenilor comerciali. ORBYVEN va oferi o perioadă rezonabilă pentru exportul datelor unde funcționalitatea permite acest lucru și poate șterge datele operaționale după 30 de zile, cu excepția informațiilor care trebuie păstrate legal sau pentru apărarea unor drepturi.
        </p>
      </LegalSection>

      <LegalSection title="8. Lege aplicabilă">
        <p>
          Relația contractuală este guvernată de legea română. Părțile vor încerca soluționarea amiabilă a disputelor, iar în lipsa unei soluții se aplică instanțele competente potrivit legii și contractului aplicabil.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
