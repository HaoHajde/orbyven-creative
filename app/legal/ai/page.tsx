import type { Metadata } from "next";
import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import Link from "next/link";

export const metadata: Metadata = { title: "Informare privind funcțiile AI" };

export default function AiTransparencyPage() {
  return (
    <LegalDocument
      eyebrow="AI · Pre-lansare"
      title="Funcții asistate de inteligență artificială"
      intro="ORBYVEN Intelligence combină logică deterministă, acțiuni cu confirmare și funcții AI opționale. Această pagină explică ce este automatizat și ce date pot părăsi platforma numai când o funcție externă este activată."
    >
      <LegalSection title="Interacțiune cu AI">
        <p>ORBYVEN poate răspunde direct din datele autorizate ale workspace-ului și poate pregăti propuneri de acțiuni. O propunere nu este executată până când utilizatorul nu o confirmă explicit. Web Design Specialist poate modifica un preview validat, iar funcțiile de limbaj extern sunt separate și opționale. Mesajele sau răspunsurile automate nu constituie consultanță juridică, fiscală ori profesională.</p>
      </LegalSection>
      <LegalSection title="Revizuirea rezultatelor">
        <p>Utilizatorul trebuie să verifice conținutul înainte de publicare sau confirmare: oferte, prețuri, afirmații comerciale, documente, imagini, licențe și date personale. Agent Actions afișează o propunere înainte de execuție; acțiunile vechi sau expirate nu sunt restaurate ca butoane executabile din istoricul conversației.</p>
      </LegalSection>
      <LegalSection title="Date și furnizori">
        <p>Nu introduce parole, chei API, date speciale sau documente confidențiale în chat. Motorul determinist ORBYVEN procesează local datele aplicației. Dacă Selective Language Layer este activat, cererea utilizatorului împreună cu răspunsul canonic și faptele strict necesare pot fi transmise furnizorului extern configurat pentru reformulare. Funcția este dezactivată implicit și nu se activează doar prin existența unei chei API. Conținutul introdus în numele unei firme trebuie să fie autorizat.</p>
      </LegalSection>
      <LegalSection title="Proprietate intelectuală">
        <p>Utilizarea sistemului nu garantează exclusivitatea rezultatelor generate. Încărcarea unei imagini, a unui logo sau a unui text nu demonstrează dreptul de a-l reproduce ori publica. Conținutul protejat și drepturile clienților se tratează potrivit contractului și legii.</p>
      </LegalSection>
      <LegalSection title="Regulile generale">
        <p>Se aplică și <Link href="/legal/acceptable-use" className="underline">politica de utilizare acceptabilă</Link> și <Link href="/legal/privacy" className="underline">politica de confidențialitate</Link>. Publicarea funcției comerciale rămâne condiționată de auditul fluxului final.</p>
      </LegalSection>
    </LegalDocument>
  );
}
