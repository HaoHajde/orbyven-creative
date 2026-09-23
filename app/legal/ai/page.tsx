import type { Metadata } from "next";
import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = { title: "Transparență AI" };

export default function AiTransparency() {
  return <LegalDocument eyebrow="AI · editor de website" title="Cum funcționează asistența AI" intro="Informare preliminară pentru editorul ORBYVEN de website-uri asistat AI; configurația furnizorului și politica de retenție vor fi confirmate înainte de utilizarea comercială.">
    <LegalSection title="Interacționezi cu inteligență artificială"><p>Mesajele adresate editorului sunt procesate de un sistem AI pentru a propune modificări ale paginii și pentru a genera text, structură sau cod. Sugestiile AI pot fi incomplete, inexacte ori nepotrivite și trebuie revizuite de utilizator înainte de publicare.</p></LegalSection>
    <LegalSection title="Ce informații introduci"><p>Nu introduce parole, chei API, date bancare complete, date sensibile sau date ale altor persoane pentru care nu ai un temei legal. Prompturile pot include informații despre companie, brand și conținutul website-ului. Nu garantăm că materialele generate sunt exclusive sau lipsite de similitudini cu materiale terțe.</p></LegalSection>
    <LegalSection title="Date și furnizori"><p>Modelul AI, regiunile de procesare, eventualii subprocesori, retenția prompturilor și folosirea datelor pentru antrenare trebuie verificate și comunicate în Politica de confidențialitate și în DPA înaintea lansării. Absența acestor informații nu reprezintă o garanție că datele nu sunt transferate către terți.</p></LegalSection>
    <LegalSection title="Controlul publicării"><p>Clientul este responsabil pentru verificarea afirmațiilor publicate despre serviciile sale, pentru licențele imaginilor și pentru legalitatea datelor introduse. Funcționalitatea AI nu substituie consultanța juridică, fiscală sau contabilă. Problemele pot fi raportate la {legalConfig.supportEmail}.</p></LegalSection>
  </LegalDocument>;
}
