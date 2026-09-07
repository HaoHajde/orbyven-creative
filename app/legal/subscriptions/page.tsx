import type { Metadata } from "next";

import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = { title: "Termeni de abonament B2B" };

export default function SubscriptionTermsPage() {
  return (
    <LegalDocument
      eyebrow="B2B Subscription Terms"
      title="Termeni de abonament"
      intro="Regulile comerciale pentru abonamentele ORBYVEN contractate de profesioniști. Acest document nu este destinat vânzărilor către consumatori persoane fizice."
    >
      <LegalSection title="1. Durata inițială">
        <p>
          Dacă oferta sau Order Form-ul nu prevede altfel, abonamentul are o perioadă contractuală inițială minimă de 12 luni. Facturarea lunară nu transformă angajamentul inițial într-un contract lunar fără termen minim.
        </p>
      </LegalSection>

      <LegalSection title="2. Facturare și plată">
        <p>
          Taxele recurente sunt datorate în avans pentru perioada de facturare. Prețul și tratamentul TVA sunt afișate înainte de confirmarea plății. Configurația fiscală curentă este: {legalConfig.vatLabel || "de completat înainte de lansarea comercială"}.
        </p>
        <p>
          Clientul autorizează procesatorul de plăți să debiteze metoda de plată salvată pentru sumele recurente datorate conform abonamentului.
        </p>
      </LegalSection>

      <LegalSection title="3. Plăți eșuate și perioadă de grație">
        <p>
          Dacă o plată eșuează, ORBYVEN poate reîncerca încasarea și poate acorda o perioadă de grație de până la 7 zile. În această perioadă serviciul poate rămâne disponibil. După expirare, accesul la funcțiile comerciale poate fi suspendat până la achitarea sumelor restante.
        </p>
      </LegalSection>

      <LegalSection title="4. Upgrade și downgrade">
        <p>
          Upgrade-urile pot produce efect imediat și pot genera o diferență de plată proporțională. Downgrade-urile și eliminarea modulelor plătite produc efect, de regulă, la următoarea perioadă eligibilă, fără a reduce obligațiile deja asumate pentru perioada contractuală minimă.
        </p>
      </LegalSection>

      <LegalSection title="5. Anulare">
        <p>
          O solicitare de anulare făcută în perioada inițială nu înlătură obligațiile contractuale deja asumate, cu excepția cazului în care ORBYVEN acceptă altfel în scris. După expirarea angajamentului inițial, abonamentul poate continua conform condițiilor de reînnoire comunicate în ofertă sau Order Form.
        </p>
      </LegalSection>

      <LegalSection title="6. Suspendare">
        <p>
          ORBYVEN poate suspenda accesul pentru neplată, încălcarea regulilor de utilizare, risc de securitate sau utilizare ilegală. Suspendarea nu înseamnă ștergerea imediată a datelor și nu anulează automat obligațiile de plată deja scadente.
        </p>
      </LegalSection>

      <LegalSection title="7. Module și licență">
        <p>
          Plata conferă organizației entitlement-uri comerciale pentru planul și modulele contractate. Activarea unui modul în workspace este distinctă de dreptul comercial de a-l utiliza. Codul și modulele portabile nu sunt vândute individual clientului.
        </p>
      </LegalSection>

      <LegalSection title="8. Ordinea documentelor">
        <p>
          Dacă există contradicții, un Order Form semnat sau o ofertă acceptată prevalează pentru elementele comerciale specifice, urmată de Termenii de abonament și apoi de Termenii și Condițiile generale.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
