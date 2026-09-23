import type { Metadata } from "next";
import InvitationServiceLanding from "@/components/InvitationServiceLanding";

export const metadata: Metadata = {
  title: "Invitații de nuntă digitale și personalizate",
  description: "Invitații de nuntă digitale ORBYVEN CREATIVE: design elegant, detalii despre eveniment, confirmare RSVP și personalizare. Descoperă un model interactiv.",
  alternates: { canonical: "/invitatii-nunta" },
  openGraph: {
    url: "/invitatii-nunta",
    title: "Invitații de nuntă digitale | ORBYVEN CREATIVE",
    description: "Invitații digitale de nuntă personalizate, cu RSVP și o prezentare elegantă a evenimentului.",
  },
};

export default function WeddingInvitationsPage() {
  return (
    <InvitationServiceLanding
      label="Invitații de nuntă"
      title="Invitații de nuntă digitale, cu povestea voastră."
      introduction="O invitație de nuntă online care reunește povestea, programul, locația și confirmarea participării într-o experiență plăcută pentru invitați, inclusiv pe telefon."
      highlights={[
        { title: "Design personalizat", description: "Pornim de la un model și îl adaptăm stilului evenimentului: culori, text, fotografii și detalii importante." },
        { title: "RSVP pentru invitați", description: "Confirmarea participării poate fi integrată direct în invitație, pentru un răspuns ușor de oferit." },
        { title: "Totul într-un link", description: "Program, locație și informații utile accesibile invitaților fără mesaje și fișiere separate." },
      ]}
      previews={[
        { href: "/demo/nunta/elegant", title: "Elegant · Nuntă", description: "Explorează o invitație digitală cu prezentare, detalii de eveniment și confirmare." },
        { href: "/templates", title: "Colecția ORBYVEN", description: "Vezi și alte direcții vizuale pentru evenimente și experiențe digitale." },
      ]}
      relatedHref="/invitatii-botez"
      relatedLabel="Vezi invitațiile de botez"
    />
  );
}
