import type { Metadata } from "next";

import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";

export const metadata: Metadata = { title: "Politica Cookies" };

export default function CookiesPage() {
  return (
    <LegalDocument
      eyebrow="Cookies & local storage"
      title="Politica Cookies"
      intro="ORBYVEN păstrează tehnologiile opționale dezactivate implicit. Bannerul de consimțământ este activat numai atunci când sunt introduse cookie-uri sau tehnologii opționale."
    >
      <LegalSection title="1. Strict necesare">
        <p>
          Autentificarea, securitatea sesiunii, preferințele esențiale și funcțiile solicitate de utilizator pot folosi cookie-uri sau stocare locală strict necesară. Acestea nu sunt folosite pentru publicitate comportamentală.
        </p>
      </LegalSection>

      <LegalSection title="2. Preferințe locale">
        <p>
          ORBYVEN poate salva local preferințe precum tema interfeței sau alegerea privind cookie-urile. Aceste valori ajută aplicația să păstreze experiența aleasă de utilizator.
        </p>
      </LegalSection>

      <LegalSection title="3. Analytics și marketing">
        <p>
          În configurația de bază nu sunt activate tehnologii opționale de analytics sau marketing. Dacă vor fi introduse, ele trebuie blocate până la acord acolo unde legea cere consimțământ, iar interfața va oferi opțiuni comparabile de acceptare și refuz.
        </p>
      </LegalSection>

      <LegalSection title="4. Schimbarea alegerii">
        <p>
          Atunci când modulul de cookie-uri opționale este activ, alegerea este stocată local și poate fi resetată prin ștergerea preferințelor site-ului din browser. ORBYVEN va adăuga un control permanent de preferințe înainte de activarea unor categorii suplimentare de tracking.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
