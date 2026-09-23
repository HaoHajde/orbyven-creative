import type { Metadata } from "next";
import InvitationServiceLanding from "@/components/InvitationServiceLanding";
import InvitationStructuredData from "@/components/InvitationStructuredData";

export const metadata: Metadata = {
  title: "Invitații de majorat digitale și personalizate",
  description: "Invitații digitale pentru majorat și aniversarea de 18 ani. Vezi un model interactiv ORBYVEN CREATIVE, personalizabil cu data, locația, programul și dress code-ul petrecerii.",
  alternates: { canonical: "/invitatii-majorat" },
  openGraph: {
    url: "/invitatii-majorat",
    title: "Invitații digitale de majorat | ORBYVEN CREATIVE",
    description: "O invitație online pentru petrecerea de 18 ani, personalizată pentru atmosfera și programul evenimentului.",
  },
};

export default function BirthdayInvitationsPage() {
  return (
    <>
      <InvitationStructuredData
        path="/invitatii-majorat"
        name="Invitații digitale de majorat personalizate"
        description="Invitații de majorat online cu un model interactiv și opțiuni pentru program, locație, dress code și confirmare de participare."
      />
      <InvitationServiceLanding
        label="Invitații de majorat"
        title="Invitații digitale de majorat pentru o petrecere cu personalitate."
        introduction="Pentru 18 ani, invitația poate fi mai mult decât un mesaj cu data și adresa. Alege un concept vizual pentru petrecere și adaugă programul, locația, dress code-ul și informațiile utile invitaților."
        highlights={[
          { title: "Design cu atmosferă", description: "Un model dark luxury sau o direcție creată pentru tema petrecerii, fără elemente vizuale inutile." },
          { title: "Program într-un singur loc", description: "Data, ora, locația și detaliile de acces rămân ușor de găsit direct din linkul invitației." },
          { title: "Personalizare și RSVP", description: "Textul, culorile, fotografiile și opțiunea de confirmare se stabilesc pentru evenimentul tău." },
        ]}
        previews={[
          { href: "/templates/majorat", title: "MIDNIGHT 18 · majorat", description: "Vezi conceptul interactiv pentru petrecerea de 18 ani, cu countdown, program și RSVP demonstrativ." },
          { href: "/templates", title: "Toate modelele ORBYVEN", description: "Răsfoiește și alte direcții vizuale și experiențe digitale pentru evenimente." },
        ]}
        relatedHref="/invitatii-nunta"
        relatedLabel="Vezi invitațiile digitale de nuntă"
        faq={[
          { question: "Pot schimba stilul modelului de majorat?", answer: "Da. Pornim de la conceptul interactiv și personalizăm textele, fotografiile, culorile și structura în funcție de petrecere." },
          { question: "Pot include dress code și locația?", answer: "Da. Invitația poate afișa data, ora, locația, programul, dress code-ul și detaliile de contact importante." },
          { question: "Se poate trimite pe WhatsApp?", answer: "Da. Invitația digitală se distribuie printr-un link, iar invitații o pot deschide în browser." },
          { question: "Modelul afișează deja datele petrecerii mele?", answer: "Nu. Demo-ul conține informații de exemplu. Datele finale trebuie înlocuite cu cele ale evenimentului tău înainte de publicare." },
        ]}
      />
    </>
  );
}
