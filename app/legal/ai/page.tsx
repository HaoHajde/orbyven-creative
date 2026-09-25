import type { Metadata } from "next";
import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";
import Link from "next/link";

export const metadata: Metadata = { title: "Informare privind funcțiile AI" };

export default function AiTransparencyPage() {
  return (
    <LegalDocument
      eyebrow="AI · Pre-lansare"
      title="Funcții asistate de inteligență artificială"
      intro="Editorul AI pentru website-uri este în dezvoltare. Această pagină explică limitele și cerințele care trebuie finalizate înaintea utilizării comerciale."
    >
      <LegalSection title="Interacțiune cu AI">
        <p>Când funcția este activă, utilizatorul discută cu un sistem automatizat care poate propune texte, stiluri, layout-uri și modificări de pagină. Mesajele sau răspunsurile generate automat nu constituie consultanță juridică, fiscală ori profesională.</p>
      </LegalSection>
      <LegalSection title="Revizuirea rezultatelor">
        <p>Utilizatorul trebuie să verifice conținutul generat înainte de publicare: corectitudinea ofertelor, prețurilor, afirmațiilor comerciale, imaginilor, licențelor și datelor personale. Acțiunile cu efect comercial ori publicarea nu ar trebui să fie presupuse dintr-o simplă propunere de text.</p>
      </LegalSection>
      <LegalSection title="Date și furnizori">
        <p>Nu introduce parole, chei API, date speciale sau documente confidențiale în chat. Înainte de activarea comercială vor fi descrise furnizorul/modelul folosit, tipurile de date transmise, politica de retenție, transferurile externe și contractele aplicabile. Conținutul introdus în numele unei firme trebuie să fie autorizat.</p>
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
